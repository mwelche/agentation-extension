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
  (message: Message, sender, _sendResponse) => {
    switch (message.type) {
      case "UPDATE_BADGE":
        if (sender.tab?.id != null) {
          updateBadge(sender.tab.id, message.count);
        }
        break;
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
