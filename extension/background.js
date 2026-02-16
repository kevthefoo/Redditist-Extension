// Background service worker for API calls

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    summarizeWithOpenAI(request.data, request.apiKey, request.language || 'English')
      .then(summary => sendResponse({ success: true, summary }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
});

async function summarizeWithOpenAI(redditData, apiKey, language) {
  const prompt = buildPrompt(redditData);

  const languageInstruction = language !== 'English'
    ? `\n\nIMPORTANT: Write the entire summary in ${language}.`
    : '';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that summarizes Reddit posts and their comment discussions.
Provide clear, concise summaries that capture:
1. The main topic/question of the post
2. Key points from the discussion
3. The general sentiment and consensus (if any)
4. Notable differing opinions

Format the summary in a readable way with clear sections.${languageInstruction}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your OpenAI API key.');
    } else if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    } else if (response.status === 402 || response.status === 403) {
      throw new Error('API access denied. Check your OpenAI account billing status.');
    }
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function buildPrompt(redditData) {
  let prompt = `Please summarize this Reddit post and its discussion:\n\n`;

  prompt += `**Subreddit:** r/${redditData.subreddit}\n`;
  prompt += `**Title:** ${redditData.title}\n`;
  prompt += `**Author:** u/${redditData.author}\n`;
  prompt += `**Score:** ${redditData.score}\n\n`;

  if (redditData.postContent) {
    prompt += `**Post Content:**\n${redditData.postContent}\n\n`;
  }

  if (redditData.comments && redditData.comments.length > 0) {
    prompt += `**Top Comments (${redditData.comments.length}):**\n\n`;

    redditData.comments.forEach((comment, index) => {
      const indent = '  '.repeat(comment.depth);
      prompt += `${indent}${index + 1}. [${comment.score} points] u/${comment.author}:\n`;
      prompt += `${indent}   "${comment.content}"\n\n`;
    });
  }

  prompt += `\nPlease provide a comprehensive summary of this post and the discussion in the comments.`;

  return prompt;
}
