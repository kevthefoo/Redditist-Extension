// Popup script for Reddit Summarizer

document.addEventListener('DOMContentLoaded', async () => {
  // Pages
  const mainPage = document.getElementById('main-page');
  const settingsPage = document.getElementById('settings-page');

  // Navigation buttons
  const openSettingsBtn = document.getElementById('openSettings');
  const backToMainBtn = document.getElementById('backToMain');

  // Settings elements
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const deleteApiKeyBtn = document.getElementById('deleteApiKey');
  const apiKeyStatus = document.getElementById('apiKeyStatus');

  // Main page elements
  const postTitle = document.getElementById('postTitle');
  const postMeta = document.getElementById('postMeta');
  const postInfo = document.getElementById('postInfo');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const btnText = document.querySelector('.btn-text');
  const btnLoading = document.querySelector('.btn-loading');
  const includeComments = document.getElementById('includeComments');
  const commentLimit = document.getElementById('commentLimit');
  const languageSelect = document.getElementById('language');
  const errorMessage = document.getElementById('errorMessage');
  const notRedditMessage = document.getElementById('notRedditMessage');
  const resultSection = document.getElementById('result-section');
  const contentSection = document.getElementById('content-section');
  const summaryContent = document.getElementById('summaryContent');
  const copyBtn = document.getElementById('copyBtn');
  const newSummaryBtn = document.getElementById('newSummaryBtn');

  // Page navigation
  openSettingsBtn.addEventListener('click', () => {
    mainPage.classList.add('hidden');
    settingsPage.classList.remove('hidden');
  });

  backToMainBtn.addEventListener('click', () => {
    settingsPage.classList.add('hidden');
    mainPage.classList.remove('hidden');
  });

  // Load saved API key
  const stored = await chrome.storage.local.get(['openaiApiKey']);
  if (stored.openaiApiKey) {
    apiKeyInput.value = stored.openaiApiKey;
    apiKeyStatus.textContent = 'API key saved';
    apiKeyStatus.className = 'status success';
  }

  // Save API key
  saveApiKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      apiKeyStatus.textContent = 'Please enter an API key';
      apiKeyStatus.className = 'status error';
      return;
    }

    await chrome.storage.local.set({ openaiApiKey: apiKey });
    apiKeyStatus.textContent = 'API key saved!';
    apiKeyStatus.className = 'status success';
  });

  // Delete API key
  deleteApiKeyBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove('openaiApiKey');
    apiKeyInput.value = '';
    apiKeyStatus.textContent = 'API key deleted';
    apiKeyStatus.className = 'status';
  });

  // Check current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isRedditPost = tab.url && (tab.url.includes('reddit.com') && tab.url.includes('/comments/'));

  if (!isRedditPost) {
    notRedditMessage.classList.remove('hidden');
    summarizeBtn.disabled = true;
    return;
  }

  // Inject content script if needed and extract data
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } catch (e) {
    // Content script might already be injected
  }

  // Get initial post info
  chrome.tabs.sendMessage(tab.id, { action: 'extractData', commentLimit: 1 }, (response) => {
    if (chrome.runtime.lastError || !response || response.error) {
      return;
    }

    postTitle.textContent = response.title || 'Unable to load title';
    postMeta.textContent = `r/${response.subreddit} · u/${response.author} · ${response.score} points`;
    postInfo.classList.remove('hidden');
  });

  // Summarize button click
  summarizeBtn.addEventListener('click', async () => {
    // Get API key from storage
    const stored = await chrome.storage.local.get(['openaiApiKey']);
    const apiKey = stored.openaiApiKey;

    if (!apiKey) {
      showError('Please set your OpenAI API key in Settings first.');
      return;
    }

    setLoading(true);
    hideError();

    const limit = includeComments.checked ? parseInt(commentLimit.value) || 20 : 0;

    try {
      // Extract data from page
      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: 'extractData', commentLimit: limit }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if (!response || response.error === 'not_reddit_post') {
        throw new Error('Could not extract Reddit data. Make sure you are on a Reddit post page.');
      }

      // Send to background for API call
      const selectedLanguage = languageSelect.value;
      const result = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'summarize', data: response, apiKey, language: selectedLanguage },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Show summary
      summaryContent.textContent = result.summary;
      contentSection.classList.add('hidden');
      resultSection.classList.remove('hidden');

    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  });

  // Copy button
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(summaryContent.textContent);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy to Clipboard';
      }, 2000);
    } catch (e) {
      showError('Failed to copy to clipboard');
    }
  });

  // New summary button
  newSummaryBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    contentSection.classList.remove('hidden');
  });

  // Helper functions
  function setLoading(loading) {
    summarizeBtn.disabled = loading;
    btnText.classList.toggle('hidden', loading);
    btnLoading.classList.toggle('hidden', !loading);
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
  }

  function hideError() {
    errorMessage.classList.add('hidden');
  }
});
