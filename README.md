# Agentation Extension

**Agentation Extension** is a Chrome extension that lets you annotate any web page and copy structured feedback for AI coding agents. Click elements, add notes, and get markdown with selectors, positions, and context — so agents can `grep` for the exact code you're referring to.

This project is a fork of the original [agentation](https://github.com/benjitaylor/agentation) npm package by [Benji Taylor](https://github.com/benjitaylor), refactored from a React component into a standalone Chrome extension by [Mathieu Welche](https://github.com/mwelche).

## Install

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/mwelche/agentation-extension.git
cd agentation-extension
pnpm install
pnpm build
```

2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `dist/` folder

## Features

- **Click to annotate** — Click any element with automatic selector identification
- **Text selection** — Select text to annotate specific content
- **Multi-select** — Cmd+Shift+click to select multiple elements
- **Structured output** — Copy markdown with selectors, positions, and context
- **Dark/light mode** — Matches your preference or set manually
- **Shadow DOM isolation** — Toolbar styles never leak into or from host pages
- **Works on any page** — No code changes required, runs as a Chrome extension
- **Keyboard shortcut** — `Cmd+Shift+.` to toggle the toolbar

## How it works

The extension injects a floating toolbar into every page via a closed Shadow DOM root. When you click an element, it captures class names, selectors, bounding boxes, and nearby context. The output is structured markdown that AI coding agents can use to locate the exact code you're referring to.

## Development

```bash
pnpm install      # Install dependencies
pnpm build        # Build extension to dist/
pnpm typecheck    # Run TypeScript checks
```

After building, reload the extension in `chrome://extensions` to pick up changes.

### Architecture

| Entry point | Description | Output |
|---|---|---|
| Content script | Injects toolbar via closed Shadow DOM | `dist/content.js` + `dist/content.css` |
| Background worker | Badge updates, keyboard shortcuts | `dist/background.js` |
| Popup | Extension icon click UI | `dist/popup/` |

Built with [Preact](https://preactjs.com/) and [Vite](https://vitejs.dev/).

## Requirements

- Chrome or Chromium-based browser
- Desktop only (mobile not supported)

## Credits

Created by [Mathieu Welche](https://github.com/mwelche), forked from [agentation](https://github.com/benjitaylor/agentation) by [Benji Taylor](https://github.com/benjitaylor).

## License

© 2026 Benji Taylor

Licensed under PolyForm Shield 1.0.0
