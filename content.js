// Content script for extracting Reddit post and comments

function extractRedditData(commentLimit = 20) {
  const url = window.location.href;

  // Check if we're on a Reddit post page
  if (!url.includes('/comments/')) {
    return { error: 'not_reddit_post' };
  }

  const isOldReddit = url.includes('old.reddit.com');

  if (isOldReddit) {
    return extractOldRedditData(commentLimit);
  } else {
    return extractNewRedditData(commentLimit);
  }
}

function extractNewRedditData(commentLimit) {
  const data = {
    title: '',
    subreddit: '',
    author: '',
    score: '',
    postContent: '',
    comments: [],
    url: window.location.href
  };

  // Try to get post title
  const titleElement = document.querySelector('h1[slot="title"]') ||
                       document.querySelector('[data-testid="post-title"]') ||
                       document.querySelector('shreddit-post h1') ||
                       document.querySelector('h1');
  if (titleElement) {
    data.title = titleElement.textContent.trim();
  }

  // Get subreddit
  const subredditMatch = window.location.pathname.match(/\/r\/([^/]+)/);
  if (subredditMatch) {
    data.subreddit = subredditMatch[1];
  }

  // Get post author
  const authorElement = document.querySelector('[data-testid="post_author_link"]') ||
                        document.querySelector('shreddit-post a[href*="/user/"]') ||
                        document.querySelector('a[href*="/user/"]');
  if (authorElement) {
    const authorMatch = authorElement.href.match(/\/user\/([^/]+)/);
    if (authorMatch) {
      data.author = authorMatch[1];
    }
  }

  // Get post score
  const scoreElement = document.querySelector('[data-testid="post-vote-count"]') ||
                       document.querySelector('shreddit-post [score]') ||
                       document.querySelector('faceplate-number');
  if (scoreElement) {
    data.score = scoreElement.textContent.trim() || scoreElement.getAttribute('number') || '';
  }

  // Get post content (for text posts)
  const postBody = document.querySelector('[data-testid="post-body"]') ||
                   document.querySelector('[slot="text-body"]') ||
                   document.querySelector('.md');
  if (postBody) {
    data.postContent = postBody.textContent.trim();
  }

  // Extract comments - try multiple selectors for new Reddit
  const comments = [];

  // Method 1: shreddit-comment elements (new new Reddit)
  const shredditComments = document.querySelectorAll('shreddit-comment');
  if (shredditComments.length > 0) {
    shredditComments.forEach((comment, index) => {
      if (comments.length >= commentLimit) return;

      const authorEl = comment.getAttribute('author') ||
                       comment.querySelector('a[href*="/user/"]');
      const author = typeof authorEl === 'string' ? authorEl :
                     (authorEl ? authorEl.textContent.trim() : 'Unknown');

      const contentEl = comment.querySelector('[slot="comment"]') ||
                        comment.querySelector('.md') ||
                        comment.querySelector('p');
      const content = contentEl ? contentEl.textContent.trim() : '';

      const scoreEl = comment.querySelector('[score]') ||
                      comment.querySelector('faceplate-number');
      const score = scoreEl ? (scoreEl.getAttribute('number') || scoreEl.textContent.trim()) : '0';

      if (content && content.length > 0) {
        comments.push({
          author,
          content: content.substring(0, 1000), // Limit content length
          score,
          depth: parseInt(comment.getAttribute('depth') || '0')
        });
      }
    });
  }

  // Method 2: Traditional comment elements
  if (comments.length === 0) {
    const commentElements = document.querySelectorAll('[data-testid="comment"]');
    commentElements.forEach((comment, index) => {
      if (comments.length >= commentLimit) return;

      const authorEl = comment.querySelector('a[href*="/user/"]');
      const author = authorEl ? authorEl.textContent.trim() : 'Unknown';

      const contentEl = comment.querySelector('[data-testid="comment"] .md') ||
                        comment.querySelector('.RichTextJSON-root') ||
                        comment.querySelector('p');
      const content = contentEl ? contentEl.textContent.trim() : '';

      const scoreEl = comment.querySelector('[data-testid="vote-count"]');
      const score = scoreEl ? scoreEl.textContent.trim() : '0';

      if (content && content.length > 0) {
        comments.push({
          author,
          content: content.substring(0, 1000),
          score,
          depth: 0
        });
      }
    });
  }

  data.comments = comments;
  return data;
}

function extractOldRedditData(commentLimit) {
  const data = {
    title: '',
    subreddit: '',
    author: '',
    score: '',
    postContent: '',
    comments: [],
    url: window.location.href
  };

  // Get title
  const titleElement = document.querySelector('.title a.title');
  if (titleElement) {
    data.title = titleElement.textContent.trim();
  }

  // Get subreddit
  const subredditElement = document.querySelector('.redditname a');
  if (subredditElement) {
    data.subreddit = subredditElement.textContent.trim();
  }

  // Get author
  const authorElement = document.querySelector('.top-matter .author');
  if (authorElement) {
    data.author = authorElement.textContent.trim();
  }

  // Get score
  const scoreElement = document.querySelector('.score.unvoted');
  if (scoreElement) {
    data.score = scoreElement.textContent.trim();
  }

  // Get post content
  const postBody = document.querySelector('.expando .usertext-body .md');
  if (postBody) {
    data.postContent = postBody.textContent.trim();
  }

  // Extract comments
  const commentElements = document.querySelectorAll('.comment');
  commentElements.forEach((comment, index) => {
    if (data.comments.length >= commentLimit) return;

    const authorEl = comment.querySelector('.author');
    const author = authorEl ? authorEl.textContent.trim() : 'Unknown';

    const contentEl = comment.querySelector('.usertext-body .md');
    const content = contentEl ? contentEl.textContent.trim() : '';

    const scoreEl = comment.querySelector('.score.unvoted');
    const score = scoreEl ? scoreEl.textContent.trim() : '0';

    // Calculate depth based on nesting
    let depth = 0;
    let parent = comment.parentElement;
    while (parent) {
      if (parent.classList && parent.classList.contains('comment')) {
        depth++;
      }
      parent = parent.parentElement;
    }

    if (content && content.length > 0) {
      data.comments.push({
        author,
        content: content.substring(0, 1000),
        score,
        depth
      });
    }
  });

  return data;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const data = extractRedditData(request.commentLimit || 20);
    sendResponse(data);
  }
  return true;
});
