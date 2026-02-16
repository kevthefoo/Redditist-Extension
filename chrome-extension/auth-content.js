// Content script injected on Redditist website pages
// Listens for auth token from the extension-auth page and forwards to background script

window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  if (event.data && event.data.type === 'REDDITIST_AUTH_TOKEN' && event.data.token) {
    chrome.runtime.sendMessage(
      { type: 'AUTH_TOKEN', token: event.data.token },
      (response) => {
        // Send result back to the page
        window.postMessage({
          type: 'REDDITIST_AUTH_RESULT',
          success: response && response.success
        }, '*');
      }
    );
  }
});
