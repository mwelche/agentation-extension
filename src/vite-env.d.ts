/// <reference types="vite/client" />

// Vite ?inline CSS imports return a string
declare module "*.css?inline" {
  const css: string;
  export default css;
}

// SCSS module imports return class name mappings
declare module "*.module.scss" {
  const classes: Record<string, string>;
  export default classes;
}

// Chrome extension API types
/// <reference types="chrome" />

// Optional dependency — Phase 2 screenshot capture will replace this
// with chrome.tabs.captureVisibleTab
declare module "modern-screenshot" {
  export function domToCanvas(
    node: Node,
    options?: Record<string, unknown>,
  ): Promise<HTMLCanvasElement>;
}
