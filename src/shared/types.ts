// =============================================================================
// Shared Types
// =============================================================================
//
// Ported from the npm package. This is the single source of truth for all
// type definitions used across content script, background worker, and popup.

export type Annotation = {
  id: string;
  x: number; // % of viewport width
  y: number; // px from top of document (absolute) OR viewport (if isFixed)
  comment: string;
  element: string;
  elementPath: string;
  timestamp: number;
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;
  nearbyElements?: string;
  computedStyles?: string;
  fullPath?: string;
  accessibility?: string;
  isMultiSelect?: boolean;
  isFixed?: boolean;
  reactComponents?: string;
  sourceFile?: string;
  drawingIndex?: number;
  elementBoundingBoxes?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;

  kind?: "feedback" | "placement" | "rearrange";

  placement?: {
    componentType: string;
    width: number;
    height: number;
    scrollY: number;
    text?: string;
  };

  rearrange?: {
    selector: string;
    label: string;
    tagName: string;
    originalRect: { x: number; y: number; width: number; height: number };
    currentRect: { x: number; y: number; width: number; height: number };
  };

  // Protocol fields (server sync — Phase 2)
  sessionId?: string;
  url?: string;
  intent?: AnnotationIntent;
  severity?: AnnotationSeverity;
  status?: AnnotationStatus;
  thread?: ThreadMessage[];
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolvedBy?: "human" | "agent";
  authorId?: string;

  _syncedTo?: string;
};

// -----------------------------------------------------------------------------
// Annotation Enums
// -----------------------------------------------------------------------------

export type AnnotationIntent = "fix" | "change" | "question" | "approve";
export type AnnotationSeverity = "blocking" | "important" | "suggestion";
export type AnnotationStatus =
  | "pending"
  | "acknowledged"
  | "resolved"
  | "dismissed";

// -----------------------------------------------------------------------------
// Session (Phase 2 — server sync)
// -----------------------------------------------------------------------------

export type Session = {
  id: string;
  url: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
};

export type SessionStatus = "active" | "approved" | "closed";

export type SessionWithAnnotations = Session & {
  annotations: Annotation[];
};

// -----------------------------------------------------------------------------
// Thread Messages
// -----------------------------------------------------------------------------

export type ThreadMessage = {
  id: string;
  role: "human" | "agent";
  content: string;
  timestamp: number;
};

// -----------------------------------------------------------------------------
// Output & Detection Settings
// -----------------------------------------------------------------------------

export type OutputDetailLevel =
  | "compact"
  | "standard"
  | "detailed"
  | "forensic";

export type ReactComponentMode = "smart" | "filtered" | "all" | "off";
