/**
 * Build script for Agentation Chrome Extension.
 *
 * Runs three Vite builds:
 *   1. Content script  → dist/content.js + dist/content.css  (IIFE)
 *   2. Background SW   → dist/background.js                  (IIFE)
 *   3. Popup           → dist/popup/                          (ESM, HTML entry)
 *
 * Then copies manifest.json and static assets into dist/.
 */

import { build } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { cpSync, existsSync, mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── 1. Content script (IIFE — must be a single self-contained file) ─────────
console.log("\n[1/3] Building content script…");
await build({
  configFile: resolve(root, "vite.config.ts"),
  build: {
    outDir: resolve(root, "dist"),
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(root, "src/content/index.tsx"),
      output: {
        format: "iife",
        entryFileNames: "content.js",
        assetFileNames: "content.[ext]",
        inlineDynamicImports: true,
      },
    },
    // No source maps in content script — they confuse Chrome DevTools
    sourcemap: false,
  },
});

// ── 2. Background service worker (ES module — MV3 supports type: "module") ──
console.log("\n[2/3] Building background service worker…");
await build({
  configFile: resolve(root, "vite.config.ts"),
  build: {
    outDir: resolve(root, "dist"),
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(root, "src/background/index.ts"),
      output: {
        format: "es",
        entryFileNames: "background.js",
        inlineDynamicImports: true,
      },
    },
    sourcemap: false,
  },
});

// ── 3. Popup (standard HTML app) ────────────────────────────────────────────
// Set `root` to src/popup so Vite resolves the HTML input relative to it,
// producing dist/popup/index.html (not dist/popup/src/popup/index.html).
console.log("\n[3/3] Building popup…");
await build({
  configFile: resolve(root, "vite.config.ts"),
  root: resolve(root, "src/popup"),
  base: "./",
  build: {
    outDir: resolve(root, "dist/popup"),
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(root, "src/popup/index.html"),
    },
    sourcemap: false,
  },
});

// ── 4. Copy static assets ───────────────────────────────────────────────────
console.log("\nCopying static assets…");
cpSync(resolve(root, "manifest.json"), resolve(root, "dist/manifest.json"));

const assetsDir = resolve(root, "assets");
if (existsSync(assetsDir)) {
  cpSync(assetsDir, resolve(root, "dist/assets"), { recursive: true });
}

console.log("\nBuild complete → dist/\n");
