// Popup script for Redditist

document.addEventListener('DOMContentLoaded', async () => {
  // Sections
  const mainPage = document.getElementById('main-page');
  const settingsPage = document.getElementById('settings-page');

  // Navigation buttons
  const openSettingsBtn = document.getElementById('openSettings');
  const backToMainBtn = document.getElementById('backToMain');

  // Settings elements
  const openaiKeyInput = document.getElementById('openaiKeyInput');
  const saveKeyBtn = document.getElementById('saveKeyBtn');
  const clearKeyBtn = document.getElementById('clearKeyBtn');
  const keyStatus = document.getElementById('keyStatus');

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

  function hideAllSections() {
    mainPage.classList.add('hidden');
    settingsPage.classList.add('hidden');
  }

  function showSection(section) {
    hideAllSections();
    section.classList.remove('hidden');
  }

  // Go straight to main page
  showSection(mainPage);
  initMainPage();

  // Load saved language
  const stored = await chrome.storage.local.get(['summaryLanguage']);
  if (stored.summaryLanguage) {
    languageSelect.value = stored.summaryLanguage;
  }

  // Save language when changed
  languageSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({ summaryLanguage: languageSelect.value });
  });

  // --- Settings ---

  // Save OpenAI key
  saveKeyBtn.addEventListener('click', async () => {
    const key = openaiKeyInput.value.trim();
    if (!key) {
      showKeyStatus('Please enter an API key', 'error');
      return;
    }
    await chrome.storage.local.set({ openaiKey: key });
    openaiKeyInput.value = '';
    showKeyStatus('Key saved!', 'success');
  });

  // Clear OpenAI key
  clearKeyBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove('openaiKey');
    openaiKeyInput.value = '';
    showKeyStatus('Key removed', 'success');
  });

  function showKeyStatus(message, type) {
    keyStatus.textContent = message;
    keyStatus.className = `status ${type}`;
    keyStatus.classList.remove('hidden');
    setTimeout(() => keyStatus.classList.add('hidden'), 3000);
  }

  // Settings navigation
  openSettingsBtn.addEventListener('click', async () => {
    // Load existing key indicator
    const data = await chrome.storage.local.get(['openaiKey']);
    if (data.openaiKey) {
      openaiKeyInput.placeholder = 'Key saved (enter new to replace)';
    } else {
      openaiKeyInput.placeholder = 'sk-...';
    }
    openaiKeyInput.value = '';
    showSection(settingsPage);
  });

  backToMainBtn.addEventListener('click', () => {
    showSection(mainPage);
  });

  // --- Main Page ---

  async function initMainPage() {
    // Check current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const isRedditPost = tab.url && (tab.url.includes('reddit.com') && tab.url.includes('/comments/'));

    if (!isRedditPost) {
      notRedditMessage.classList.remove('hidden');
      summarizeBtn.disabled = true;
      return;
    }

    // Inject content script if needed
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
      setLoading(true);
      hideError();

      const limit = includeComments.checked ? parseInt(commentLimit.value) || 20 : 0;

      try {
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

        const selectedLanguage = languageSelect.value;
        const result = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { action: 'summarize', data: response, language: selectedLanguage },
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
          if (result.needsSetup) {
            throw new Error('No API key found. Go to Settings to add your OpenAI API key.');
          }
          throw new Error(result.error);
        }

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
  }

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
