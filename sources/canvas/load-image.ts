import { debugWarn } from "../utils/debug.ts";
import { releaseAssetUrl, resolveAssetUrl } from "../utils/asset-vfs.ts";

let loadedImages: Record<string, HTMLImageElement> = {};
/** In-flight loads: same `src` shares one `Image` and one profiler span. */
const inFlight = new Map<string, Promise<HTMLImageElement>>();

export type ImageLoadStats = {
  cacheHits: number;
  loads: number;
};

let imageLoadStats: ImageLoadStats = { cacheHits: 0, loads: 0 };

/** Snapshot of always-on `loadImage` cache / network counters. */
export function getImageLoadStats(): ImageLoadStats {
  return { ...imageLoadStats };
}

/** Reset cache / network counters. Also called from {@link resetImageLoadCache}. */
export function resetImageLoadStats(): void {
  imageLoadStats = { cacheHits: 0, loads: 0 };
}

type LoadImageFn = (src: string) => Promise<HTMLImageElement>;

/** When set, {@link loadImage} (and {@link loadImagesInParallel}) use this instead of `new Image()`. */
let loadImageForTests: LoadImageFn | null = null;

/** Browser specs inject synthetic sprites. `null` restores the real loader. */
export function setLoadImageForTests(fn: LoadImageFn | null): void {
  loadImageForTests = fn;
}

/** Profiler is attached to `window.profiler` by `main.ts`; absent in tests / Node. */
type WindowWithProfiler = Window & {
  profiler?: {
    mark: (name: string) => void;
    measure: (name: string, start: string, end: string) => void;
  };
};

/**
 * Clears the in-memory image cache. Browser tests call this so a stubbed
 * `Image` constructor cannot poison later specs that share the same module.
 */
export function resetImageLoadCache(): void {
  loadedImages = {};
  inFlight.clear();
  resetImageLoadStats();
  loadImageForTests = null;
}

/** Load an image. Rejects with `Error("Failed to load <src>")` on error. */
export async function loadImage(src: string): Promise<HTMLImageElement> {
  if (loadImageForTests) {
    return loadImageForTests(src);
  }
  if (loadedImages[src]) {
    imageLoadStats.cacheHits++;
    return loadedImages[src];
  }
  const existing = inFlight.get(src);
  if (existing) {
    return existing;
  }
  imageLoadStats.loads++;

  // Register in-flight *before* creating the Image. The Promise constructor runs
  // the executor synchronously; if we only `set` after `new Promise(...)`, a
  // second concurrent `loadImage(src)` can miss `inFlight` and create a second
  // `Image` for the same `src` (fails "share one in-flight request" in tests).
  let resolve!: (img: HTMLImageElement) => void;
  let reject!: (err: Error) => void;
  const p = new Promise<HTMLImageElement>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  inFlight.set(src, p);

  // Mark start of image load (span is actual fetch/decode)
  const profiler = (window as WindowWithProfiler).profiler;
  if (profiler) {
    profiler.mark(`image-load:${src}:start`);
  }

  // 资源可能被打包进单个归档（APK 的 zip 条目上限约束）→ 先解析为可加载的 URL。
  // 归档不可用时原样返回，行为与上游一致。
  let resolvedSrc = src;
  try {
    resolvedSrc = await resolveAssetUrl(src);
  } catch {
    resolvedSrc = src;
  }
  const usesArchive = resolvedSrc !== src;

  const img = new Image();
  img.onload = () => {
    loadedImages[src] = img;
    inFlight.delete(src);
    if (usesArchive) releaseAssetUrl(src);

    if (profiler) {
      profiler.mark(`image-load:${src}:end`);
      profiler.measure(
        `image-load:${src}`,
        `image-load:${src}:start`,
        `image-load:${src}:end`,
      );
    }

    resolve(img);
  };
  img.onerror = () => {
    inFlight.delete(src);
    if (usesArchive) releaseAssetUrl(src);
    console.error(`Failed to load image: ${src}`);
    reject(new Error(`Failed to load ${src}`));
  };
  img.src = resolvedSrc;

  return p;
}

export type LoadedImage<T> = {
  item: T;
  img: HTMLImageElement | null;
  success: boolean;
};

/** Load multiple images in parallel, swallowing per-image errors. */
export async function loadImagesInParallel<T>(
  items: T[],
  getPath: (item: T) => string = (item) =>
    (item as { spritePath: string }).spritePath,
): Promise<LoadedImage<T>[]> {
  const promises = items.map((item): Promise<LoadedImage<T>> =>
    loadImage(getPath(item))
      .then((img): LoadedImage<T> => ({ item, img, success: true }))
      .catch(() => {
        debugWarn(`Failed to load sprite: ${getPath(item)}`);
        return { item, img: null, success: false };
      }),
  );

  return Promise.all(promises);
}
