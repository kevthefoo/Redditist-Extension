# Redditist - Chrome Extension

Summarize Reddit posts and comments with AI. Works on both new Reddit and old Reddit.

## Features

- Summarize any Reddit post with one click
- Includes top comments in the summary for full context
- Supports 16 languages
- Works on `www.reddit.com` and `old.reddit.com`
- Dark theme UI that matches Reddit's design

## Installation

### From Chrome Web Store

*(Coming soon)*

### From Source

1. Clone this repository
   ```bash
   git clone https://github.com/your-username/redditist-extension.git
   ```
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `chrome-extension/` folder
5. The Redditist icon will appear in your toolbar

## Usage

1. Navigate to any Reddit post
2. Click the Redditist extension icon
3. Configure options (include comments, max comment count)
4. Click **Summarize This Post**
5. Copy the summary or generate a new one

You need a [Redditist](https://redditist.com) account with an active subscription to use the extension.

## Project Structure

```
chrome-extension/
├── manifest.json      # Extension config (Manifest V3)
├── background.js      # Service worker — API calls & auth
├── content.js         # Reddit page data extraction
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic & state management
├── styles.css         # Popup styles (dark theme)
├── lib/
│   └── api.js         # API client module
└── icons/             # Extension icons
```

## Development

This is a vanilla JS Chrome extension with no build step.

### Setup

1. Load the extension from source (see [Installation](#from-source))
2. Make sure the Redditist backend is running (defaults to `http://localhost:3000`)

### Making Changes

- **Popup changes** — Close and reopen the popup to see updates
- **Content script changes** — Reload the extension in `chrome://extensions`, then refresh the Reddit tab
- **Background script changes** — Reload the extension in `chrome://extensions`

### Configuration

The API base URL is set in three files:

- `background.js` — `API_BASE`
- `popup.js` — `APP_URL`
- `lib/api.js` — `API_BASE`

Set these to `http://localhost:3000` for local development or `https://redditist.com` for production.

## How It Works

1. **Content script** injects into Reddit pages and extracts post data (title, author, score, body) and comments from the DOM
2. **Popup** sends the extracted data to the background service worker
3. **Background service worker** forwards it to the Redditist API with the user's auth token
4. The API returns an AI-generated summary displayed in the popup

Authentication tokens are received from the Redditist website via Chrome's `externally_connectable` API and stored locally using `chrome.storage`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

MIT
