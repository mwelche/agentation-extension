# Agentation

Chrome extension for annotating web pages and collecting structured feedback for AI coding agents.

## Architecture

- **Content script** (`src/content/`) — Injects a floating toolbar into every page via a closed Shadow DOM root
- **Background worker** (`src/background/`) — Service worker for badge, commands, message routing
- **Popup** (`src/popup/`) — Extension popup UI (click the toolbar icon)
- **Components** (`src/components/`) — Preact UI components (rendered inside shadow root)
- **Utils** (`src/utils/`) — DOM utilities, storage adapter, output generation
- **Shared** (`src/shared/`) — Types, message protocol, constants

## Development

```bash
pnpm install    # Install dependencies
pnpm build      # Build extension to dist/
pnpm typecheck  # Run TypeScript checks
```

Load `dist/` as an unpacked extension in `chrome://extensions` (Developer mode).

## Build System

- **Vite** with `@preact/preset-vite` — three separate builds via `scripts/build.mjs`
- Content script and background: built as IIFE (single self-contained files)
- Popup: standard HTML app with ESM
- CSS is inlined into the content script JS and injected into the shadow root via `adoptedStyleSheets`

## Key Decisions

- **Preact** instead of React — same API via compat, ~4KB vs ~40KB in content script
- **Closed Shadow DOM** — complete style isolation from host pages, no CSS leakage
- **`chrome.storage.local`** — extension-scoped storage, not host page's localStorage
- **No CRXJS/Plasmo** — plain Vite builds, minimal framework overhead

## Legacy Code

`package/` contains the original npm package source. It is kept as reference during the migration but is NOT part of the build. Do not modify files in `package/`.

## Annotations

Whenever the user brings up annotations, fetch all the pending annotations before doing anything else. And infer whether I am referencing any annotations.
