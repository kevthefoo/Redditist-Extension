// Popup script for Redditist

const APP_URL = 'http://localhost:3000'; // Change to https://redditist.com in production

document.addEventListener('DOMContentLoaded', async () => {
  // Sections
  const loadingSection = document.getElementById('loading-section');
  const authSection = document.getElementById('auth-section');
  const noSubSection = document.getElementById('no-sub-section');
  const mainPage = document.getElementById('main-page');
  const settingsPage = document.getElementById('settings-page');

  // Auth elements
  const signInBtn = document.getElementById('signInBtn');
  const signOutBtn1 = document.getElementById('signOutBtn1');
  const signOutBtn2 = document.getElementById('signOutBtn2');
  const subscribeBtn = document.getElementById('subscribeBtn');

  // Navigation buttons
  const openSettingsBtn = document.getElementById('openSettings');
  const backToMainBtn = document.getElementById('backToMain');

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
  const accountStatus = document.getElementById('accountStatus');

  function hideAllSections() {
    loadingSection.classList.add('hidden');
    authSection.classList.add('hidden');
    noSubSection.classList.add('hidden');
    mainPage.classList.add('hidden');
    settingsPage.classList.add('hidden');
  }

  function showSection(section) {
    hideAllSections();
    section.classList.remove('hidden');
  }

  // Check auth + subscription state
  try {
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'checkSubscription' }, resolve);
    });

    if (!result.signedIn) {
      showSection(authSection);
    } else if (!result.active) {
      showSection(noSubSection);
    } else {
      showSection(mainPage);
      initMainPage();
    }
  } catch {
    showSection(authSection);
  }

  // Sign In
  signInBtn.addEventListener('click', () => {
    const extensionId = chrome.runtime.id;
    chrome.tabs.create({
      url: `${APP_URL}/extension-auth?extensionId=${extensionId}`
    });
  });

  // Subscribe
  subscribeBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${APP_URL}/pricing` });
  });

  // Sign Out handlers
  async function handleSignOut() {
    await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'signOut' }, resolve);
    });
    showSection(authSection);
  }
  signOutBtn1.addEventListener('click', handleSignOut);
  signOutBtn2.addEventListener('click', handleSignOut);

  // Settings navigation
  openSettingsBtn.addEventListener('click', () => {
    // Update account status in settings
    chrome.runtime.sendMessage({ action: 'checkSubscription' }, (result) => {
      if (result && result.active && result.subscription) {
        const endDate = new Date(result.subscription.currentPeriodEnd).toLocaleDateString();
        let status = `Active subscription (renews ${endDate})`;
        if (result.subscription.cancelAtPeriodEnd) {
          status = `Cancels on ${endDate}`;
        }
        accountStatus.textContent = status;
      } else {
        accountStatus.textContent = 'No active subscription';
      }
    });
    showSection(settingsPage);
  });

  backToMainBtn.addEventListener('click', () => {
    showSection(mainPage);
  });

  // Load saved language
  const stored = await chrome.storage.local.get(['summaryLanguage']);
  if (stored.summaryLanguage) {
    languageSelect.value = stored.summaryLanguage;
  }

  // Save language when changed
  languageSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({ summaryLanguage: languageSelect.value });
  });

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
