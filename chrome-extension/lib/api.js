// Backend API client for Redditist extension

const API_BASE = 'http://localhost:3000'; // Change to https://redditist.com in production

export async function checkSubscription(token) {
  const res = await fetch(`${API_BASE}/api/subscription/status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('AUTH_EXPIRED');
    }
    throw new Error('Failed to check subscription');
  }

  return res.json();
}

export async function summarize(token, redditData, language) {
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
      throw new Error('AUTH_EXPIRED');
    }
    if (res.status === 403) {
      throw new Error('NO_SUBSCRIPTION');
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API error: ${res.status}`);
  }

  return res.json();
}
