# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Redditist is an open-source Chrome Extension (Manifest V3) that summarizes Reddit posts and comments using OpenAI. It works on both new Reddit (`www.reddit.com`) and old Reddit (`old.reddit.com`). Users provide their own OpenAI API key — no account or subscription required.

## Architecture

The extension lives in `chrome-extension/` and has no build step — it's plain vanilla JS loaded directly by Chrome.

- **manifest.json** — MV3 config. Declares `activeTab`, `storage`, `scripting` permissions. Content scripts auto-inject on Reddit domains.
- **background.js** — Service worker. Sends summarization requests to the OpenAI API using the user's API key stored in `chrome.storage.local`.
- **content.js** — Injected on Reddit pages. Extracts post data (title, author, score, body text) and comments from the DOM. Has separate extraction logic for new Reddit (`shreddit-comment` web components) and old Reddit (`.comment` class-based DOM).
- **popup.js** — Popup UI controller. Manages settings page and summarization requests.
- **popup.html / styles.css** — Popup UI. Dark theme matching Reddit's aesthetic. Uses `#ff4500` (Reddit orange) as accent color.

## Key Patterns

- **Message passing**: Popup → Background (via `chrome.runtime.sendMessage`) for OpenAI API calls. Popup → Content Script (via `chrome.tabs.sendMessage`) for Reddit data extraction.
- **API key storage**: User's OpenAI key is stored in `chrome.storage.local` under the `openaiKey` key.
- **No backend dependency**: All API calls go directly to OpenAI. There is no server component.

## Development

No build/lint/test commands — this is a static Chrome extension. To develop:

1. Load as unpacked extension in `chrome://extensions` pointing to the `chrome-extension/` directory
2. After code changes, click the reload button on the extension card in `chrome://extensions`
3. For popup changes, close and reopen the popup
4. For content script changes, also refresh the Reddit tab

## Testing

Test manually by navigating to a Reddit post page and clicking the extension popup. An OpenAI API key must be configured in Settings.
