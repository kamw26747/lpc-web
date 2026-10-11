/**
 * 运行时资源虚拟文件系统（Asset VFS）
 *
 * ── 为什么需要 ────────────────────────────────────────────────
 * APK 本质是 zip，**格式硬上限 65,535 个条目**；而上游 spritesheets 有 88,114 张 PNG，
 * 直接铺开会构建失败：
 *     Execution failed for task ':app:packageDebug'.
 *     > Too many zip entries 88572 (MAX=65535)
 * 因此构建期把资源合并为单个归档 `assets/public/spritesheets.zip`（1 个条目）。
 *
 * 本模块在运行时读取该归档，把 `spritesheets/<path>` 解析为 Blob URL，
 * 使上游渲染代码无需改动路径写法即可正常取图。
 *
 * ── 设计选择 ──────────────────────────────────────────────────
 * · **零依赖**：自行解析 ZIP 中央目录，不引入 fflate 等（避免改动 package-lock）。
 * · **store 优先**：CI 用 `zip -0` 打包，条目为 STORE(0)，取值仅需切片，几乎零开销；
 *   同时兼容 DEFLATE(8)（借助 Chromium 内置 `DecompressionStream("deflate-raw")`）。
 * · **Zip64 支持**：条目数 > 65535，中央目录条目数会溢出 16 位字段，
 *   故需读 Zip64 EOCD。
 * · **缺归档即降级**：开发/桌面环境没有该归档时，`resolveAssetUrl` 原样返回，
 *   行为与上游完全一致。
 */

const ARCHIVE_PATH = "spritesheets.zip";
const PREFIX = "spritesheets/";

type ZipEntry = {
  offset: number; // 本地文件头之后的数据起始偏移
  compressedSize: number;
  method: number;
};

let archiveBytes: Uint8Array | null = null;
let entries: Map<string, ZipEntry> | null = null;
let initPromise: Promise<boolean> | null = null;
let enabled = false;

/** entry key -> objectURL（复用，避免同一张图反复建 Blob） */
const urlCache = new Map<string, string>();

function findSignature(bytes: Uint8Array, sig: number, fromEnd: boolean): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (fromEnd) {
    const min = Math.max(0, bytes.length - 22 - 65536);
    for (let i = bytes.length - 22; i >= min; i--) {
      if (view.getUint32(i, true) === sig) return i;
    }
    return -1;
  }
  for (let i = 0; i < bytes.length - 4; i++) {
    if (view.getUint32(i, true) === sig) return i;
  }
  return -1;
}

/** 解析 ZIP 中央目录（含 Zip64） */
function parseEntries(bytes: Uint8Array): Map<string, ZipEntry> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const map = new Map<string, ZipEntry>();

  const eocd = findSignature(bytes, 0x06054b50, true);
  if (eocd < 0) throw new Error("EOCD not found");

  let count = view.getUint16(eocd + 10, true);
  let cdOffset = view.getUint32(eocd + 16, true);

  // Zip64：条目数或偏移溢出时，走 Zip64 EOCD
  if (count === 0xffff || cdOffset === 0xffffffff) {
    const locator = eocd - 20;
    if (locator >= 0 && view.getUint32(locator, true) === 0x07064b50) {
      const z64 = Number(view.getBigUint64(locator + 8, true));
      if (view.getUint32(z64, true) === 0x06064b50) {
        count = Number(view.getBigUint64(z64 + 32, true));
        cdOffset = Number(view.getBigUint64(z64 + 48, true));
      }
    }
  }

  let p = cdOffset;
  for (let i = 0; i < count; i++) {
    if (p + 46 > bytes.length) break;
    if (view.getUint32(p, true) !== 0x02014b50) break;
    const method = view.getUint16(p + 10, true);
    let compressedSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    let localOffset = view.getUint32(p + 42, true);

    // Zip64 扩展字段：偏移溢出时按顺序读取 8 字节值
    if (compressedSize === 0xffffffff || localOffset === 0xffffffff) {
      let ep = p + 46 + nameLen;
      const epEnd = ep + extraLen;
      while (ep + 4 <= epEnd) {
        const hid = view.getUint16(ep, true);
        const hsz = view.getUint16(ep + 2, true);
        if (hid === 0x0001) {
          let q = ep + 4;
          if (view.getUint32(p + 24, true) === 0xffffffff) q += 8; // uncompressed size
          if (compressedSize === 0xffffffff) { compressedSize = Number(view.getBigUint64(q, true)); q += 8; }
          if (localOffset === 0xffffffff) { localOffset = Number(view.getBigUint64(q, true)); }
          break;
        }
        ep += 4 + hsz;
      }
    }

    const name = decoder.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    // 本地头长度（其 extra 长度可能与中央目录不同，必须按本地头实际值算）
    const lhNameLen = view.getUint16(localOffset + 26, true);
    const lhExtraLen = view.getUint16(localOffset + 28, true);
    map.set(name, { offset: localOffset + 30 + lhNameLen + lhExtraLen, compressedSize, method });

    p += 46 + nameLen + extraLen + commentLen;
  }
  return map;
}

async function initArchive(): Promise<boolean> {
  try {
    const res = await fetch(ARCHIVE_PATH, { cache: "force-cache" });
    if (!res.ok) return false;
    archiveBytes = new Uint8Array(await res.arrayBuffer());
    entries = parseEntries(archiveBytes);
    enabled = entries.size > 0;
    return enabled;
  } catch {
    // 归档缺失（开发/桌面）→ 静默降级
    return false;
  }
}

/** 预热归档（可在启动时调用以提前解包索引）。 */
export function ensureArchive(): Promise<boolean> {
  if (!initPromise) initPromise = initArchive();
  return initPromise;
}

export function isVfsEnabled(): boolean {
  return enabled;
}

/** 从任意 URL/路径中取出归档内的条目名（**含** `spritesheets/` 前缀，与 ZIP 条目名一致）。 */
function toArchiveKey(src: string): string | null {
  if (!src) return null;
  const cleaned = src.split("?")[0].split("#")[0];
  const idx = cleaned.indexOf(PREFIX);
  if (idx === -1) return null;
  return cleaned.slice(idx);
}

function guessMime(key: string): string {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".gif")) return "image/gif";
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  if (key.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

/**
 * 把 `spritesheets/<path>` 解析为可直接用于 `<img src>` 的 URL。
 * 归档不可用 / 条目不存在时，原样返回 `src`（保持上游行为）。
 */
export async function resolveAssetUrl(src: string): Promise<string> {
  const key = toArchiveKey(src);
  if (!key) return src;

  const cached = urlCache.get(key);
  if (cached) return cached;

  if (!enabled) {
    if (!(await ensureArchive())) return src;
  }
  if (!entries || !archiveBytes) return src;

  const entry = entries.get(key);
  if (!entry) return src;

  const raw = archiveBytes.subarray(entry.offset, entry.offset + entry.compressedSize);
  let data: BlobPart;
  if (entry.method === 0) {
    data = raw;
  } else if (entry.method === 8 && typeof DecompressionStream !== "undefined") {
    const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    data = await new Response(stream).arrayBuffer();
  } else {
    return src;
  }

  const url = URL.createObjectURL(new Blob([data], { type: guessMime(key) }));
  urlCache.set(key, url);
  return url;
}

/** 图片加载完成后释放 Blob URL（解码结果已由浏览器持有，安全）。 */
export function releaseAssetUrl(src: string): void {
  const key = toArchiveKey(src);
  if (!key) return;
  const url = urlCache.get(key);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(key);
  }
}
