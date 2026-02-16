# Redditist - Chrome Extension

Summarize Reddit posts and comments with AI. Works on both new Reddit and old Reddit. Open-source and free — just bring your own OpenAI API key.

## Features

- Summarize any Reddit post with one click
- Includes top comments in the summary for full context
- Supports 16 languages
- Works on `www.reddit.com` and `old.reddit.com`
- Dark theme UI that matches Reddit's design
- No account or subscription needed — uses your own OpenAI API key
- Powered by GPT-4o-mini for fast, affordable summaries

## Installation

1. Clone this repository
   ```bash
   git clone https://github.com/nicholasxwang/Redditist.git
   ```
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `chrome-extension/` folder
5. The Redditist icon will appear in your toolbar

## Setup

1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. Click the Redditist icon in your toolbar
3. Open **Settings** (gear icon)
4. Paste your API key and click **Save Key**

## Usage

1. Navigate to any Reddit post
2. Click the Redditist extension icon
3. Configure options (include comments, max comment count, language)
4. Click **Summarize This Post**
5. Copy the summary or generate a new one

## Project Structure

```
chrome-extension/
├── manifest.json      # Extension config (Manifest V3)
├── background.js      # Service worker — OpenAI API calls
├── content.js         # Reddit page data extraction
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic & state management
├── styles.css         # Popup styles (dark theme)
└── icons/             # Extension icons
```

## How It Works

1. **Content script** injects into Reddit pages and extracts post data (title, author, score, body) and comments from the DOM
2. **Popup** sends the extracted data to the background service worker
3. **Background service worker** builds a prompt and calls the OpenAI API directly with your API key
4. The AI-generated summary is displayed in the popup

All data stays between your browser and OpenAI — there is no intermediary server.

## Development

This is a vanilla JS Chrome extension with no build step.

- **Popup changes** — Close and reopen the popup to see updates
- **Content script changes** — Reload the extension in `chrome://extensions`, then refresh the Reddit tab
- **Background script changes** — Reload the extension in `chrome://extensions`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

MIT
