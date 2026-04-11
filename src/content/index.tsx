// =============================================================================
// Content Script Entry
// =============================================================================
//
// Injected into every page by Chrome. Creates the shadow DOM host and renders
// the Agentation toolbar inside it.

import { render } from "preact";
import { createShadowHost, injectStyles, injectCSSText } from "./shadow-host";
import { Toolbar } from "../components/toolbar";
import { COLOR_TOKEN_CSS } from "../components/toolbar/page-toolbar";
import { initStorage } from "../utils/storage";
import { loadAnnotations, getStorageKey } from "../utils/storage";
import { generateOutput } from "../utils/generate-output";
import type { Annotation } from "../shared/types";
import type { Message } from "../shared/messages";

// ── Shared state (read by message handler, updated by toolbar callbacks) ────

let annotationCount = 0;
let toolbarVisible = true;

function updateBadge() {
  try {
    chrome.runtime.sendMessage({
      type: "UPDATE_BADGE",
      count: annotationCount,
    });
  } catch {
    // Service worker not ready
  }
}

// ── Bootstrap ───────────────────────────────────────────────────────────────

async function bootstrap() {
  // 1. Initialise the storage cache before any component renders
  await initStorage();

  // 2. Load initial annotation count from storage
  const pathname = window.location.pathname;
  const stored = loadAnnotations(pathname);
  annotationCount = stored.length;

  // 3. Create shadow host and inject styles
  const { shadow, container } = createShadowHost();
  const cssUrl = chrome.runtime.getURL("content.css");
  await injectStyles(shadow, cssUrl);
  injectCSSText(shadow, COLOR_TOKEN_CSS);

  // 4. Render toolbar with callbacks to track state
  function renderApp() {
    render(
      toolbarVisible ? (
        <Toolbar
          onAnnotationAdd={(a: Annotation) => {
            annotationCount++;
            updateBadge();
          }}
          onAnnotationDelete={(a: Annotation) => {
            annotationCount = Math.max(0, annotationCount - 1);
            updateBadge();
          }}
          onAnnotationsClear={() => {
            annotationCount = 0;
            updateBadge();
          }}
        />
      ) : null,
      container,
    );
  }

  renderApp();
  updateBadge();

  // 5. Message listener (from popup / background)
  chrome.runtime.onMessage.addListener(
    (message: Message, _sender, sendResponse) => {
      switch (message.type) {
        case "TOGGLE_TOOLBAR":
          toolbarVisible = !toolbarVisible;
          renderApp();
          sendResponse({ active: toolbarVisible });
          break;

        case "GET_STATE":
          sendResponse({
            type: "STATE_RESPONSE",
            active: toolbarVisible,
            annotationCount,
            url: window.location.href,
          });
          break;

        case "COPY_MARKDOWN": {
          const annotations = loadAnnotations(pathname);
          const output = generateOutput(annotations, pathname);
          if (output) {
            navigator.clipboard.writeText(output).catch(() => {});
          }
          sendResponse({ ok: true, copied: !!output });
          break;
        }

        case "CLEAR_ANNOTATIONS": {
          // Clear storage for this page, then re-render
          const key = getStorageKey(pathname);
          chrome.storage.local.remove(key);
          annotationCount = 0;
          updateBadge();
          // Force a re-render to clear the toolbar's state
          renderApp();
          sendResponse({ ok: true });
          break;
        }
      }
      return true;
    },
  );
}

bootstrap();
