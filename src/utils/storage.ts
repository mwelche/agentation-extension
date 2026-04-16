// =============================================================================
// Storage Utilities — Chrome Extension Adapter
// =============================================================================
//
// Wraps chrome.storage.local with an in-memory cache so that reads are
// synchronous (matching the API the toolbar expects) while writes persist
// asynchronously to extension storage.
//
// IMPORTANT: Call `initStorage()` and await it BEFORE rendering any component
// that uses these functions. The cache must be populated first.

import type { Annotation } from "../shared/types";

// ── In-memory cache ─────────────────────────────────────────────────────────

const cache: Record<string, unknown> = {};

/** Populate cache from chrome.storage.local. Must be called before first read. */
export async function initStorage(): Promise<void> {
  const data = await chrome.storage.local.get(null);
  Object.assign(cache, data);
}

function cacheGet<T>(key: string): T | null {
  const val = cache[key];
  return val !== undefined ? (val as T) : null;
}

function cacheSet(key: string, value: unknown): void {
  cache[key] = value;
  chrome.storage.local.set({ [key]: value });
}

function cacheRemove(key: string): void {
  delete cache[key];
  chrome.storage.local.remove(key);
}

// ── Annotations ─────────────────────────────────────────────────────────────

const STORAGE_PREFIX = "feedback-annotations-";
const DEFAULT_RETENTION_DAYS = 7;

export function getStorageKey(pathname: string): string {
  return `${STORAGE_PREFIX}${pathname}`;
}

export function loadAnnotations<T = Annotation>(pathname: string): T[] {
  try {
    const data = cacheGet<T[]>(getStorageKey(pathname));
    if (!data || !Array.isArray(data)) return [];
    const cutoff =
      Date.now() - DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    return data.filter(
      (a: unknown) =>
        !(a as { timestamp?: number }).timestamp ||
        (a as { timestamp: number }).timestamp > cutoff,
    );
  } catch {
    return [];
  }
}

export function saveAnnotations<T = Annotation>(
  pathname: string,
  annotations: T[],
): void {
  try {
    cacheSet(getStorageKey(pathname), annotations);
  } catch {
    // storage might be full
  }
}

export function clearAnnotations(pathname: string): void {
  try {
    cacheRemove(getStorageKey(pathname));
  } catch {
    // ignore
  }
}

/**
 * Load all annotations across all pages.
 */
export function loadAllAnnotations<T = Annotation>(): Map<string, T[]> {
  const result = new Map<string, T[]>();
  try {
    const cutoff =
      Date.now() - DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    for (const key of Object.keys(cache)) {
      if (key.startsWith(STORAGE_PREFIX)) {
        const pathname = key.slice(STORAGE_PREFIX.length);
        const data = cache[key];
        if (Array.isArray(data)) {
          const filtered = data.filter(
            (a: unknown) =>
              !(a as { timestamp?: number }).timestamp ||
              (a as { timestamp: number }).timestamp > cutoff,
          );
          if (filtered.length > 0) {
            result.set(pathname, filtered as T[]);
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return result;
}

// ── Sync markers ────────────────────────────────────────────────────────────

type AnnotationWithSyncMarker = Annotation & { _syncedTo?: string };

export function saveAnnotationsWithSyncMarker(
  pathname: string,
  annotations: Annotation[],
  sessionId: string,
): void {
  const marked = annotations.map((annotation) => ({
    ...annotation,
    _syncedTo: sessionId,
  }));
  saveAnnotations(pathname, marked);
}

export function getUnsyncedAnnotations(
  pathname: string,
  sessionId?: string,
): Annotation[] {
  const annotations = loadAnnotations<AnnotationWithSyncMarker>(pathname);
  return annotations.filter((annotation) => {
    if (!annotation._syncedTo) return true;
    if (sessionId && annotation._syncedTo !== sessionId) return true;
    return false;
  });
}

export function clearSyncMarkers(pathname: string): void {
  const annotations = loadAnnotations<AnnotationWithSyncMarker>(pathname);
  const cleaned = annotations.map((annotation) => {
    const { _syncedTo: _, ...rest } = annotation;
    return rest as Annotation;
  });
  saveAnnotations(pathname, cleaned);
}

// ── Design mode storage ─────────────────────────────────────────────────────

const DESIGN_PREFIX = "agentation-design-";

export function loadDesignPlacements<T = unknown>(pathname: string): T[] {
  try {
    const data = cacheGet<T[]>(`${DESIGN_PREFIX}${pathname}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveDesignPlacements<T = unknown>(
  pathname: string,
  placements: T[],
): void {
  try {
    cacheSet(`${DESIGN_PREFIX}${pathname}`, placements);
  } catch {
    // ignore
  }
}

export function clearDesignPlacements(pathname: string): void {
  try {
    cacheRemove(`${DESIGN_PREFIX}${pathname}`);
  } catch {
    // ignore
  }
}

// ── Rearrange mode storage ──────────────────────────────────────────────────

const REARRANGE_PREFIX = "agentation-rearrange-";

export function loadRearrangeState<T = unknown>(pathname: string): T | null {
  try {
    return cacheGet<T>(`${REARRANGE_PREFIX}${pathname}`);
  } catch {
    return null;
  }
}

export function saveRearrangeState<T = unknown>(
  pathname: string,
  state: T,
): void {
  try {
    cacheSet(`${REARRANGE_PREFIX}${pathname}`, state);
  } catch {
    // ignore
  }
}

export function clearRearrangeState(pathname: string): void {
  try {
    cacheRemove(`${REARRANGE_PREFIX}${pathname}`);
  } catch {
    // ignore
  }
}

// ── Wireframe storage ───────────────────────────────────────────────────────

const WIREFRAME_PREFIX = "agentation-wireframe-";

export function loadWireframeState<T = unknown>(
  pathname: string,
): { rearrange: T | null; placements: unknown[]; purpose: string } | null {
  try {
    return cacheGet<{
      rearrange: T | null;
      placements: unknown[];
      purpose: string;
    }>(`${WIREFRAME_PREFIX}${pathname}`);
  } catch {
    return null;
  }
}

export function saveWireframeState(
  pathname: string,
  state: { rearrange: unknown; placements: unknown[]; purpose: string },
): void {
  try {
    cacheSet(`${WIREFRAME_PREFIX}${pathname}`, state);
  } catch {
    // ignore
  }
}

export function clearWireframeState(pathname: string): void {
  try {
    cacheRemove(`${WIREFRAME_PREFIX}${pathname}`);
  } catch {
    // ignore
  }
}

// ── Session storage ─────────────────────────────────────────────────────────

const SESSION_PREFIX = "agentation-session-";

export function getSessionStorageKey(pathname: string): string {
  return `${SESSION_PREFIX}${pathname}`;
}

export function loadSessionId(pathname: string): string | null {
  return cacheGet<string>(getSessionStorageKey(pathname));
}

export function saveSessionId(pathname: string, sessionId: string): void {
  cacheSet(getSessionStorageKey(pathname), sessionId);
}

export function clearSessionId(pathname: string): void {
  cacheRemove(getSessionStorageKey(pathname));
}

// ── Toolbar visibility ──────────────────────────────────────────────────────

const TOOLBAR_HIDDEN_KEY = "agentation-toolbar-hidden";

export function loadToolbarHidden(): boolean {
  return cacheGet<boolean>(TOOLBAR_HIDDEN_KEY) === true;
}

export function saveToolbarHidden(hidden: boolean): void {
  if (hidden) {
    cacheSet(TOOLBAR_HIDDEN_KEY, true);
  } else {
    cacheRemove(TOOLBAR_HIDDEN_KEY);
  }
}

// ── General-purpose key/value (replaces direct localStorage calls) ──────────

export function getSetting<T>(key: string): T | null {
  return cacheGet<T>(key);
}

export function setSetting(key: string, value: unknown): void {
  cacheSet(key, value);
}

export function removeSetting(key: string): void {
  cacheRemove(key);
}
