import type { ResultAsync } from "neverthrow";
import { canvasToBlob } from "./canvas-utils.ts";
import { getCanvas, type CanvasNotInitialized } from "./renderer.ts";
import { saveBlob } from "../utils/download-bridge.ts";

type GetCanvasBlobFn = () => ResultAsync<Blob, CanvasNotInitialized>;

/**
 * Download canvas as PNG (exports the offscreen canvas directly).
 * `getCanvasBlobFunc` defaults to the real renderer canvas; tests inject a stub.
 */
export async function downloadAsPNG(
  filename: string = "character-spritesheet.png",
  getCanvasBlobFunc: GetCanvasBlobFn = () => getCanvas().asyncMap(canvasToBlob),
): Promise<void> {
  const blobResult = await getCanvasBlobFunc();
  if (blobResult.isErr()) {
    console.error("Error downloading PNG:", blobResult.error);
    return;
  }
  // Android WebView 不支持 <a download>，改由下载桥接交给原生保存
  await saveBlob(blobResult.value, filename);
}

export function downloadFile(
  content: string,
  filename: string,
  type: string = "text/plain",
): void {
  void saveBlob(new Blob([content], { type }), filename);
}
