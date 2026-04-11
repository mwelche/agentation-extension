// =============================================================================
// Popup Entry
// =============================================================================

import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import type { StateResponse } from "../shared/messages";

function sendToTab(
  message: { type: string },
  callback?: (response: unknown) => void,
) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (tabId == null) return;
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) return;
      callback?.(response);
    });
  });
}

function Popup() {
  const [state, setState] = useState<StateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const refreshState = () => {
    sendToTab({ type: "GET_STATE" }, (response) => {
      if (response) setState(response as StateResponse);
    });
  };

  useEffect(() => {
    refreshState();
  }, []);

  const toggleToolbar = () => {
    sendToTab({ type: "TOGGLE_TOOLBAR" }, () => refreshState());
  };

  const copyMarkdown = () => {
    sendToTab({ type: "COPY_MARKDOWN" }, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const clearAnnotations = () => {
    sendToTab({ type: "CLEAR_ANNOTATIONS" }, () => refreshState());
  };

  const active = state?.active ?? false;
  const count = state?.annotationCount ?? 0;

  return (
    <div class="popup">
      <div class="popup-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <h1>Agentation</h1>
      </div>

      {state === null ? (
        <div class="popup-status">
          <div class="popup-status-dot inactive" />
          <span>Not available on this page</span>
        </div>
      ) : (
        <>
          <div class="popup-status">
            <div class={`popup-status-dot ${active ? "" : "inactive"}`} />
            <span>{active ? "Toolbar active" : "Toolbar hidden"}</span>
          </div>

          <div class="popup-actions">
            <button class="popup-btn" onClick={toggleToolbar}>
              {active ? "Hide toolbar" : "Show toolbar"}
            </button>

            {count > 0 && (
              <>
                <button class="popup-btn" onClick={copyMarkdown}>
                  {copied ? "Copied!" : "Copy as markdown"}
                </button>
                <button class="popup-btn popup-btn-danger" onClick={clearAnnotations}>
                  Clear all annotations
                </button>
              </>
            )}
          </div>

          <div class="popup-count">
            {count === 0
              ? "No annotations on this page"
              : `${count} annotation${count !== 1 ? "s" : ""}`}
          </div>
        </>
      )}
    </div>
  );
}

render(<Popup />, document.getElementById("app")!);
