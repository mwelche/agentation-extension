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
import type { Message } from "../shared/messages";

// ── Bootstrap ───────────────────────────────────────────────────────────────

async function bootstrap() {
  // 1. Initialise the storage cache before any component renders
  await initStorage();

  // 2. Create shadow host and inject styles
  //    Vite extracts all CSS from SCSS module imports into content.css
  const { shadow, container } = createShadowHost();
  const cssUrl = chrome.runtime.getURL("content.css");
  await injectStyles(shadow, cssUrl);

  // Inject colour tokens (CSS custom properties) into the shadow root.
  // These were previously injected into document.head which doesn't
  // cascade into a closed shadow root.
  injectCSSText(shadow, COLOR_TOKEN_CSS);

  // 3. Render toolbar
  let toolbarVisible = true;

  function renderApp() {
    render(toolbarVisible ? <Toolbar /> : null, container);
  }

  renderApp();

  // 4. Message listener (from popup / background)
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
            annotationCount: 0, // TODO: wire up from toolbar state
            url: window.location.href,
          });
          break;

        case "COPY_MARKDOWN":
          // TODO: trigger copy from toolbar state
          sendResponse({ ok: true });
          break;

        case "CLEAR_ANNOTATIONS":
          // TODO: trigger clear from toolbar state
          sendResponse({ ok: true });
          break;
      }
      return true;
    },
  );

  // 5. Notify background of initial state
  //    Wrapped in try-catch: the service worker may not be awake yet.
  try {
    chrome.runtime.sendMessage({ type: "UPDATE_BADGE", count: 0 });
  } catch {
    // Service worker not ready — badge will update on next annotation change
  }
}

bootstrap();
