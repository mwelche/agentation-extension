// =============================================================================
// Message Protocol
// =============================================================================
//
// Typed messages passed between content script, background worker, and popup
// via chrome.runtime.sendMessage / chrome.tabs.sendMessage.

// ── Content script → Background ─────────────────────────────────────────────

export type UpdateBadgeMessage = {
  type: "UPDATE_BADGE";
  count: number;
};

// ── Popup / Background → Content script ─────────────────────────────────────

export type ToggleToolbarMessage = {
  type: "TOGGLE_TOOLBAR";
};

export type GetStateMessage = {
  type: "GET_STATE";
};

export type CopyMarkdownMessage = {
  type: "COPY_MARKDOWN";
};

export type ClearAnnotationsMessage = {
  type: "CLEAR_ANNOTATIONS";
};

// ── Content script → Popup (responses) ──────────────────────────────────────

export type StateResponse = {
  type: "STATE_RESPONSE";
  active: boolean;
  annotationCount: number;
  url: string;
};

// ── Union ───────────────────────────────────────────────────────────────────

export type Message =
  | UpdateBadgeMessage
  | ToggleToolbarMessage
  | GetStateMessage
  | CopyMarkdownMessage
  | ClearAnnotationsMessage
  | StateResponse;
