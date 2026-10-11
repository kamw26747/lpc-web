/**
 * 下载桥接（Android WebView 适配）
 *
 * ── 问题 ────────────────────────────────────────────────────────
 * 上游用 `URL.createObjectURL(blob)` + `<a download>` 触发下载。
 * 这在桌面浏览器可行，但 **Android WebView 不支持 `<a download>`**：
 * 点击后没有任何反应，表现为"界面提示导出完成，但文件从未落地"。
 *
 * ── 方案 ────────────────────────────────────────────────────────
 * 在原生外壳（Capacitor）中改为：
 *   1) 用 Filesystem 插件把 Blob 写入应用缓存目录；
 *   2) 用 Share 插件拉起系统分享面板 —— 用户可"保存到相册 / 文件管理器"。
 * 非原生环境（开发 / 桌面浏览器）仍走原来的 `<a download>`。
 *
 * ── 为何不用 `import { Filesystem } from "@capacitor/filesystem"` ──
 * 那需要给 lpc-web 增加 npm 依赖，会破坏 `package-lock.json`，
 * 导致 CI 的 `npm ci` 失败。因此这里通过运行时注入的
 * `window.Capacitor.Plugins` 访问插件（插件本体安装在包装层 app/ 中）。
 */

import { t } from "./i18n.ts";

type AnyRecord = Record<string, any>;

function capacitor(): AnyRecord | undefined {
  return (globalThis as AnyRecord).Capacitor;
}

function plugin(name: string): AnyRecord | undefined {
  const p = capacitor()?.Plugins?.[name];
  return p && typeof p === "object" ? p : undefined;
}

/** 是否运行在原生外壳中。 */
export function isNativeShell(): boolean {
  const c = capacitor();
  if (!c) return false;
  return typeof c.isNativePlatform === "function" ? Boolean(c.isNativePlatform()) : true;
}

/** 供诊断：当前可用的插件名列表。 */
export function availablePlugins(): string[] {
  const plugins = capacitor()?.Plugins;
  return plugins && typeof plugins === "object" ? Object.keys(plugins) : [];
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const s = String(fr.result ?? "");
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    fr.onerror = () => reject(fr.error ?? new Error("FileReader failed"));
    fr.readAsDataURL(blob);
  });
}

function browserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 立即 revoke 可能让部分浏览器拿不到数据，延后释放
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export type SaveResult = {
  ok: boolean;
  mode: "native" | "browser";
  uri?: string;
  error?: string;
};

/**
 * 保存一个 Blob 到设备。
 * 原生环境：写缓存目录 + 拉起分享面板；否则回退浏览器下载。
 */
export async function saveBlob(blob: Blob, filename: string): Promise<SaveResult> {
  const Filesystem = plugin("Filesystem");

  if (Filesystem) {
    try {
      const data = await blobToBase64(blob);
      const res = await Filesystem.writeFile({
        path: filename,
        data,
        directory: "CACHE",
        recursive: true,
      });
      const uri: string = res?.uri ?? "";

      const Share = plugin("Share");
      if (Share && uri) {
        try {
          await Share.share({ title: filename, text: filename, url: uri, files: [uri] });
        } catch {
          /* 用户取消分享不算失败 */
        }
      }
      return { ok: true, mode: "native", uri };
    } catch (e) {
      const error = (e as Error)?.message ?? String(e);
      console.error("原生保存失败:", error, "可用插件:", availablePlugins().join(", "));
      // 失败时给出可见反馈，避免"静默无反应"
      if (typeof alert === "function") {
        alert(t("download.failed", { error }));
      }
      return { ok: false, mode: "native", error };
    }
  }

  browserDownload(blob, filename);
  return { ok: true, mode: "browser" };
}

/** 保存文本内容（JSON / credits.txt 等）。 */
export function saveText(content: string, filename: string, type = "text/plain"): void {
  void saveBlob(new Blob([content], { type }), filename);
}
