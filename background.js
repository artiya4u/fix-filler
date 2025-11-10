// Background service worker for Fix Filler
// This handles background tasks and extension lifecycle events

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Fix Filler] Extension installed');

    // Set up default rules (optional)
    chrome.storage.sync.get(['fillRules'], (result) => {
      if (!result.fillRules) {
        const defaultRules = [];
        chrome.storage.sync.set({ fillRules: defaultRules });
      }
    });
  } else if (details.reason === 'update') {
    console.log('[Fix Filler] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Fix Filler] Message received:', request);

  // Handle different message types
  if (request.action === 'getRules') {
    chrome.storage.sync.get(['fillRules'], (result) => {
      sendResponse({ rules: result.fillRules || [] });
    });
    return true; // Keep the message channel open for async response
  }

  return false;
});

// Context menu integration (optional - can be enabled later)
// Uncomment to add a right-click context menu option
/*
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'fillFormNow',
    title: 'Fill form with Fix Filler',
    contexts: ['page', 'frame']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'fillFormNow') {
    // Get enabled rules and send to content script
    const result = await chrome.storage.sync.get(['fillRules']);
    const enabledRules = (result.fillRules || []).filter(rule => rule.enabled);

    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'fillForm',
        rules: enabledRules
      });
    }
  }
});
*/

// Keyboard shortcut handler (optional - can be configured in manifest)
chrome.commands?.onCommand.addListener(async (command) => {
  if (command === 'fill-form') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab?.id) {
      const result = await chrome.storage.sync.get(['fillRules']);
      const enabledRules = (result.fillRules || []).filter(rule => rule.enabled);

      chrome.tabs.sendMessage(tab.id, {
        action: 'fillForm',
        rules: enabledRules
      });
    }
  }
});

console.log('[Fix Filler] Background service worker initialized');
