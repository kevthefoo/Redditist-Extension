// Background service worker for Redditist
// Handles backend API calls and auth token from website

const API_BASE = 'http://localhost:3000'; // Change to https://redditist.com in production
const SUB_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Listen for auth token from website (externally_connectable)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_TOKEN' && message.token) {
    chrome.storage.local.set({
      authToken: message.token,
      authTokenTime: Date.now()
    }, () => {
      // Clear cached subscription status on new login
      chrome.storage.local.remove('subscriptionCache');
      sendResponse({ success: true });
    });
    return true;
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    handleSummarize(request.data, request.language || 'English')
      .then(summary => sendResponse({ success: true, summary }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'checkSubscription') {
    handleCheckSubscription()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ active: false, error: error.message }));
    return true;
  }

  if (request.action === 'getAuthState') {
    chrome.storage.local.get(['authToken'], (stored) => {
      sendResponse({ signedIn: !!stored.authToken });
    });
    return true;
  }

  if (request.action === 'signOut') {
    chrome.storage.local.remove(['authToken', 'authTokenTime', 'subscriptionCache'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

async function handleSummarize(redditData, language) {
  const stored = await chrome.storage.local.get(['authToken']);
  const token = stored.authToken;

  if (!token) {
    throw new Error('Please sign in first.');
  }

  const res = await fetch(`${API_BASE}/api/summarize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ redditData, language })
  });

  if (!res.ok) {
    if (res.status === 401) {
      chrome.storage.local.remove(['authToken', 'authTokenTime', 'subscriptionCache']);
      throw new Error('Session expired. Please sign in again.');
    }
    if (res.status === 403) {
      throw new Error('No active subscription. Please subscribe to use Redditist.');
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API error: ${res.status}`);
  }

  const data = await res.json();
  return data.summary;
}

async function handleCheckSubscription() {
  // Check cache first
  const stored = await chrome.storage.local.get(['authToken', 'subscriptionCache']);
  const token = stored.authToken;

  if (!token) {
    return { active: false, signedIn: false };
  }

  // Return cached result if still valid
  if (stored.subscriptionCache) {
    const cache = stored.subscriptionCache;
    if (Date.now() - cache.timestamp < SUB_CACHE_TTL) {
      return { ...cache.data, signedIn: true };
    }
  }

  const res = await fetch(`${API_BASE}/api/subscription/status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      chrome.storage.local.remove(['authToken', 'authTokenTime', 'subscriptionCache']);
      return { active: false, signedIn: false };
    }
    throw new Error('Failed to check subscription');
  }

  const data = await res.json();

  // Cache the result
  await chrome.storage.local.set({
    subscriptionCache: {
      data,
      timestamp: Date.now()
    }
  });

  return { ...data, signedIn: true };
}
