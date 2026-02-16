// Background service worker for Redditist
// Handles OpenAI API calls for Reddit post summarization

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
  const stored = await chrome.storage.local.get(['openaiKey']);

  if (!stored.openaiKey) {
    const err = new Error('No API key found. Go to Settings to add your OpenAI API key.');
    err.needsSetup = true;
    throw err;
  }

  return summarizeWithOpenAI(stored.openaiKey, redditData, language);
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
