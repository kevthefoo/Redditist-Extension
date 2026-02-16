// Background service worker for Redditist
// Handles backend API calls, auth token from website, and direct OpenAI calls

const API_BASE = 'https://redditist.com';
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

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Auth token from content script on redditist.com
  if (request.type === 'AUTH_TOKEN' && request.token) {
    chrome.storage.local.set({
      authToken: request.token,
      authTokenTime: Date.now()
    }, () => {
      chrome.storage.local.remove('subscriptionCache');
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'summarize') {
    handleSummarize(request.data, request.language || 'English')
      .then(summary => sendResponse({ success: true, summary }))
      .catch(error => {
        if (error.needsSetup) {
          sendResponse({ success: false, needsSetup: true, error: error.message });
        } else {
          sendResponse({ success: false, error: error.message });
        }
      });
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

function buildPrompt(redditData, language) {
  let prompt = `Summarize the following Reddit post in ${language}.\n\n`;
  prompt += `Title: ${redditData.title}\n`;
  prompt += `Author: ${redditData.author}\n`;
  prompt += `Subreddit: ${redditData.subreddit}\n`;
  prompt += `Score: ${redditData.score}\n\n`;

  if (redditData.body) {
    prompt += `Post body:\n${redditData.body}\n\n`;
  }

  if (redditData.comments && redditData.comments.length > 0) {
    prompt += `Top comments:\n`;
    for (const comment of redditData.comments) {
      prompt += `- ${comment.author} (${comment.score} points): ${comment.body}\n`;
    }
  }

  prompt += `\nProvide a concise summary that captures the main points of the post and the general sentiment of the comments (if included).`;
  return prompt;
}

async function handleSummarize(redditData, language) {
  const stored = await chrome.storage.local.get(['openaiKey', 'authToken']);

  // Priority 1: User's own OpenAI key
  if (stored.openaiKey) {
    return summarizeWithOpenAI(stored.openaiKey, redditData, language);
  }

  // Priority 2: Redditist subscription
  if (stored.authToken) {
    return summarizeWithBackend(stored.authToken, redditData, language);
  }

  // No key and no subscription
  const err = new Error('No API key or subscription found. Go to Settings to add your OpenAI API key or sign in to your Redditist account.');
  err.needsSetup = true;
  throw err;
}

async function summarizeWithOpenAI(apiKey, redditData, language) {
  const prompt = buildPrompt(redditData, language);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that summarizes Reddit posts concisely.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1024,
      temperature: 0.5
    })
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your key in Settings.');
    }
    if (res.status === 429) {
      throw new Error('OpenAI rate limit reached. Please try again in a moment.');
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || `OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function summarizeWithBackend(token, redditData, language) {
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
      throw new Error('Session expired. Please sign in again in Settings.');
    }
    if (res.status === 403) {
      throw new Error('No active subscription. Subscribe or add your own OpenAI API key in Settings.');
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
