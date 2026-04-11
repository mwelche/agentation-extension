// =============================================================================
// Background Service Worker
// =============================================================================
//
// Handles badge updates, keyboard shortcut commands, and message routing
// between popup and content scripts.

import type { Message } from "../shared/messages";

// ── Badge ───────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: "#6366F1" });
});

function updateBadge(tabId: number, count: number) {
  const text = count > 0 ? String(count) : "";
  chrome.action.setBadgeText({ text, tabId });
}

// ── Message handler ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    switch (message.type) {
      case "UPDATE_BADGE":
        if (sender.tab?.id != null) {
          updateBadge(sender.tab.id, message.count);
        }
        break;

      case "PROXY_FETCH":
        // Proxy fetch through background worker to bypass CORS restrictions
        // that content scripts face when calling external sync servers
        fetch(message.url, {
          method: message.options?.method ?? "GET",
          headers: message.options?.headers,
          body: message.options?.body,
        })
          .then(async (res) => {
            let body: unknown = null;
            try {
              body = await res.json();
            } catch {
              // Response may not be JSON
            }
            sendResponse({ ok: res.ok, status: res.status, body });
          })
          .catch(() => sendResponse({ ok: false, status: 0, body: null }));
        return true; // keep channel open for async response

      case "CAPTURE_SCREEN":
        // captureVisibleTab is background-only — content scripts request it via messaging
        chrome.tabs.captureVisibleTab({ format: "jpeg", quality: 85 })
          .then((dataUrl) => sendResponse({ dataUrl }))
          .catch(() => sendResponse({ dataUrl: null }));
        return true; // keep channel open for async response
    }
  },
);

// ── Keyboard shortcut ───────────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-toolbar") {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id != null) {
      chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_TOOLBAR" });
    }
  }
});
