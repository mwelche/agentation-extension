// =============================================================================
// Screenshot Capture — Chrome Extension
// =============================================================================
//
// Uses chrome.tabs.captureVisibleTab (via background worker message) to capture
// the visible tab as a JPEG, then crops to the requested region and composites
// drawing strokes on top.
//
// This replaces the npm package's modern-screenshot (DOM-to-canvas) approach.
// captureVisibleTab is simpler, more reliable, and works on any page.

import type { CaptureScreenResponse } from "../shared/messages";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * DOM capture is always available in the Chrome extension
 * (via chrome.tabs.captureVisibleTab in the background worker).
 */
export async function isDomCaptureAvailable(): Promise<boolean> {
  return true;
}

/**
 * Capture a viewport region as a JPEG data URL.
 * Composites drawing strokes on top of the captured screenshot.
 *
 * Flow:
 *   1. Content script sends CAPTURE_SCREEN to background worker
 *   2. Background calls chrome.tabs.captureVisibleTab → full-tab JPEG
 *   3. Content script crops to the requested region + composites strokes
 */
export async function captureDomRegion(
  regionX: number,
  regionY: number,
  regionW: number,
  regionH: number,
  strokes: Array<{
    points: Array<{ x: number; y: number }>;
    color: string;
    fixed: boolean;
  }>,
  padding = 32,
  quality = 0.85,
): Promise<string | null> {
  // Hide agentation UI before capture
  const host = document.getElementById("agentation-host");
  if (host) host.style.display = "none";

  let dataUrl: string | null = null;
  try {
    // Request screenshot from background worker
    const response = await new Promise<CaptureScreenResponse>((resolve) => {
      chrome.runtime.sendMessage({ type: "CAPTURE_SCREEN" }, resolve);
    });
    dataUrl = response?.dataUrl ?? null;
  } catch {
    // Background worker unavailable
  } finally {
    if (host) host.style.display = "";
  }

  if (!dataUrl) return null;

  try {
    // Load the full-tab screenshot into an image
    const img = await loadImage(dataUrl);

    // The screenshot is at device pixel ratio, so scale coordinates
    const dpr = window.devicePixelRatio || 1;

    // Capture region with padding
    const captureX = Math.max(0, regionX - padding);
    const captureY = Math.max(0, regionY - padding);
    const captureW = regionW + padding * 2;
    const captureH = regionH + padding * 2;

    // Output size (capped)
    const maxDim = 600;
    const outScale = Math.min(1, maxDim / Math.max(captureW, captureH));
    const outW = Math.round(captureW * outScale);
    const outH = Math.round(captureH * outScale);
    if (outW < 1 || outH < 1) return null;

    // Create output canvas and crop from screenshot
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // White background in case crop extends beyond screenshot
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);

    // Crop from the full-tab image (scale by DPR)
    ctx.drawImage(
      img,
      captureX * dpr,
      captureY * dpr,
      captureW * dpr,
      captureH * dpr,
      0,
      0,
      outW,
      outH,
    );

    // Composite drawing strokes on top
    drawStrokesOnCanvas(ctx, strokes, captureX, captureY, outScale);

    return canvas.toDataURL("image/jpeg", quality);
  } catch (err) {
    console.warn("[Agentation] Screenshot crop failed:", err);
    return null;
  }
}

/**
 * Capture drawing strokes as a PNG data URL (fallback).
 * Renders strokes on a light background without a page screenshot.
 */
export function captureDrawingStrokes(
  regionX: number,
  regionY: number,
  regionW: number,
  regionH: number,
  strokes: Array<{
    points: Array<{ x: number; y: number }>;
    color: string;
    fixed: boolean;
  }>,
  padding = 32,
): string | null {
  try {
    const captureX = Math.max(0, regionX - padding);
    const captureY = Math.max(0, regionY - padding);
    const captureW = regionW + padding * 2;
    const captureH = regionH + padding * 2;

    const maxDim = 400;
    const scale = Math.min(1, maxDim / Math.max(captureW, captureH));
    const outW = Math.round(captureW * scale);
    const outH = Math.round(captureH * scale);

    if (outW < 1 || outH < 1) return null;

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillRect(0, 0, outW, outH);

    drawStrokesOnCanvas(ctx, strokes, captureX, captureY, scale);

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("[Agentation] Stroke capture failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawStrokesOnCanvas(
  ctx: CanvasRenderingContext2D,
  strokes: Array<{
    points: Array<{ x: number; y: number }>;
    color: string;
    fixed: boolean;
  }>,
  originX: number,
  originY: number,
  scale: number,
) {
  const scrollY = window.scrollY;
  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;

    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = Math.max(2, 2.5 * scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    for (let i = 0; i < stroke.points.length; i++) {
      const p = stroke.points[i];
      const vx = p.x;
      const vy = stroke.fixed ? p.y : p.y - scrollY;
      const cx = (vx - originX) * scale;
      const cy = (vy - originY) * scale;

      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.restore();
  }
}
