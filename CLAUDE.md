# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Redditist is a Chrome Extension (Manifest V3) that summarizes Reddit posts and comments using AI. It works on both new Reddit (`www.reddit.com`) and old Reddit (`old.reddit.com`). Users authenticate via the Redditist website and need an active subscription to use the summarization feature.

## Architecture

The extension lives in `chrome-extension/` and has no build step — it's plain vanilla JS loaded directly by Chrome.

- **manifest.json** — MV3 config. Declares `activeTab`, `storage`, `scripting` permissions. Content scripts auto-inject on Reddit domains. Uses `externally_connectable` to receive auth tokens from the Redditist website.
- **background.js** — Service worker. Handles all backend API calls (`/api/summarize`, `/api/subscription/status`), auth token management via `chrome.storage.local`, and subscription status caching (10-min TTL). Acts as the bridge between popup/content scripts and the backend.
- **content.js** — Injected on Reddit pages. Extracts post data (title, author, score, body text) and comments from the DOM. Has separate extraction logic for new Reddit (`shreddit-comment` web components) and old Reddit (`.comment` class-based DOM).
- **popup.js** — Popup UI controller. Manages auth/subscription state flow (auth → subscription check → main UI), settings page, and summarization requests.
- **popup.html / styles.css** — Popup UI. Dark theme matching Reddit's aesthetic. Uses `#ff4500` (Reddit orange) as accent color.
- **lib/api.js** — Standalone API client module (currently unused; `background.js` has its own inline API calls).

## Key Patterns

- **Auth flow**: The website sends auth tokens to the extension via `chrome.runtime.sendMessage` using `externally_connectable`. Tokens are stored in `chrome.storage.local`.
- **Message passing**: Popup → Background (via `chrome.runtime.sendMessage`) for API calls. Popup → Content Script (via `chrome.tabs.sendMessage`) for Reddit data extraction.
- **API base URL**: Hardcoded as `http://localhost:3000` in three files (`background.js`, `popup.js`, `lib/api.js`). Must be changed to `https://redditist.com` for production.

## Development

No build/lint/test commands — this is a static Chrome extension. To develop:

1. Load as unpacked extension in `chrome://extensions` pointing to the `chrome-extension/` directory
2. After code changes, click the reload button on the extension card in `chrome://extensions`
3. For popup changes, close and reopen the popup
4. For content script changes, also refresh the Reddit tab

## Testing

Test manually by navigating to a Reddit post page and clicking the extension popup. The backend must be running at the configured `API_BASE` URL.
