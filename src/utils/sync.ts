// =============================================================================
// Server Sync Utilities — Chrome Extension
// =============================================================================
//
// Optional server synchronization for the Agentation protocol.
// All HTTP requests are proxied through the background worker via
// PROXY_FETCH messages to bypass CORS restrictions that content scripts
// face when calling external servers.
//
// Falls back gracefully to local-only mode on network errors.

import type { Annotation, Session, SessionWithAnnotations } from "../shared/types";
import type { ProxyFetchResponse } from "../shared/messages";

// ---------------------------------------------------------------------------
// Proxied fetch — routes through background worker
// ---------------------------------------------------------------------------

async function proxyFetch(
  url: string,
  options?: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<ProxyFetchResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "PROXY_FETCH", url, options },
      (response: ProxyFetchResponse | undefined) => {
        if (chrome.runtime.lastError || !response) {
          resolve({ ok: false, status: 0, body: null });
          return;
        }
        resolve(response);
      },
    );
  });
}

async function proxyJson<T>(
  url: string,
  options?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await proxyFetch(url, {
    method: options?.method,
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.body as T;
}

// ---------------------------------------------------------------------------
// Public API (same signatures as the npm package version)
// ---------------------------------------------------------------------------

export async function listSessions(endpoint: string): Promise<Session[]> {
  return proxyJson<Session[]>(`${endpoint}/sessions`);
}

export async function createSession(
  endpoint: string,
  url: string,
): Promise<Session> {
  return proxyJson<Session>(`${endpoint}/sessions`, {
    method: "POST",
    body: { url },
  });
}

export async function getSession(
  endpoint: string,
  sessionId: string,
): Promise<SessionWithAnnotations> {
  return proxyJson<SessionWithAnnotations>(
    `${endpoint}/sessions/${sessionId}`,
  );
}

export async function syncAnnotation(
  endpoint: string,
  sessionId: string,
  annotation: Annotation,
): Promise<Annotation> {
  return proxyJson<Annotation>(
    `${endpoint}/sessions/${sessionId}/annotations`,
    { method: "POST", body: annotation },
  );
}

export async function updateAnnotation(
  endpoint: string,
  annotationId: string,
  data: Partial<Annotation>,
): Promise<Annotation> {
  return proxyJson<Annotation>(`${endpoint}/annotations/${annotationId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteAnnotation(
  endpoint: string,
  annotationId: string,
): Promise<void> {
  const res = await proxyFetch(`${endpoint}/annotations/${annotationId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete annotation: ${res.status}`);
  }
}

export type ActionResponse = {
  success: boolean;
  annotationCount: number;
  delivered: {
    sseListeners: number;
    webhooks: number;
    total: number;
  };
};

export async function requestAction(
  endpoint: string,
  sessionId: string,
  output: string,
): Promise<ActionResponse> {
  return proxyJson<ActionResponse>(
    `${endpoint}/sessions/${sessionId}/action`,
    { method: "POST", body: { output } },
  );
}
