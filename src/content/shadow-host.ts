// =============================================================================
// Shadow DOM Host
// =============================================================================
//
// Creates an isolated shadow root for the Agentation UI. The closed shadow
// root prevents host page CSS from leaking in and host page JS from reaching
// into the extension's DOM.

import { SHADOW_HOST_ID } from "../shared/constants";

export type ShadowHostResult = {
  host: HTMLElement;
  shadow: ShadowRoot;
  container: HTMLElement;
};

/**
 * Creates the shadow DOM host and attaches it to the page.
 *
 * The host element sits at max z-index with pointer-events: none so it never
 * blocks the underlying page. Interactive elements inside opt in individually.
 */
export function createShadowHost(): ShadowHostResult {
  // Bail if already injected (content script re-run guard)
  const existing = document.getElementById(SHADOW_HOST_ID);
  if (existing) existing.remove();

  const host = document.createElement("div");
  host.id = SHADOW_HOST_ID;
  host.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: 0",
    "width: 0",
    "height: 0",
    "z-index: 2147483647",
    "pointer-events: none",
    "overflow: visible",
  ].join(";");

  const shadow = host.attachShadow({ mode: "closed" });

  const container = document.createElement("div");
  container.id = "agentation-root";
  shadow.appendChild(container);

  document.body.appendChild(host);

  return { host, shadow, container };
}

/**
 * Loads a CSS file from the extension bundle and injects it into
 * the shadow root via adoptedStyleSheets (CSP-safe).
 */
export async function injectStyles(
  shadow: ShadowRoot,
  cssUrl: string,
): Promise<void> {
  const response = await fetch(cssUrl);
  const cssText = await response.text();
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(cssText);
  shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet];
}
