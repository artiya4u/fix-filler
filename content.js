// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fillForm') {
    fillForm(request.rules);
    sendResponse({ success: true });
  }
  return true;
});

// Fill form with provided rules
function fillForm(rules) {
  let filledCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log('[Fix Filler] Starting to fill form with', rules.length, 'rules');

  rules.forEach(rule => {
    try {
      const elements = document.querySelectorAll(rule.selector);

      if (elements.length === 0) {
        console.warn(`[Fix Filler] No elements found for selector: ${rule.selector}`);
        errors.push(`No elements found for: ${rule.name}`);
        errorCount++;
        return;
      }

      elements.forEach((element, index) => {
        try {
          fillElement(element, rule.value);
          console.log(`[Fix Filler] Filled element ${index + 1}/${elements.length} for rule: ${rule.name}`);
          filledCount++;
        } catch (error) {
          console.error(`[Fix Filler] Error filling element for rule ${rule.name}:`, error);
          errorCount++;
        }
      });
    } catch (error) {
      console.error(`[Fix Filler] Error processing rule ${rule.name}:`, error);
      errors.push(`Error in rule "${rule.name}": ${error.message}`);
      errorCount++;
    }
  });

  // Show notification
  showNotification(filledCount, errorCount, errors);
}

// Fill individual element
function fillElement(element, value) {
  const tagName = element.tagName.toLowerCase();
  const type = element.type ? element.type.toLowerCase() : '';

  // Handle different input types
  if (tagName === 'input') {
    if (type === 'checkbox' || type === 'radio') {
      // For checkboxes and radio buttons, check if value is truthy
      element.checked = Boolean(value);
    } else if (type === 'file') {
      console.warn('[Fix Filler] File inputs cannot be filled programmatically');
      return;
    } else {
      // For text, email, password, number, etc.
      element.value = value;
    }
  } else if (tagName === 'textarea') {
    element.value = value;
  } else if (tagName === 'select') {
    // Try to find matching option by value or text
    let optionSet = false;

    // Try by value
    for (let option of element.options) {
      if (option.value === value) {
        element.value = value;
        optionSet = true;
        break;
      }
    }

    // Try by text if value didn't match
    if (!optionSet) {
      for (let option of element.options) {
        if (option.text === value) {
          option.selected = true;
          optionSet = true;
          break;
        }
      }
    }

    // If still not set, try setting directly
    if (!optionSet) {
      element.value = value;
    }
  } else if (element.contentEditable === 'true') {
    // For contenteditable elements
    element.textContent = value;
  } else {
    // For other elements, set textContent
    element.textContent = value;
  }

  // Trigger events to ensure the page recognizes the change
  triggerEvents(element);
}

// Trigger various events to ensure compatibility with form validation and frameworks
function triggerEvents(element) {
  const events = [
    new Event('input', { bubbles: true, cancelable: true }),
    new Event('change', { bubbles: true, cancelable: true }),
    new Event('blur', { bubbles: true, cancelable: true }),
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true }),
    new KeyboardEvent('keyup', { bubbles: true, cancelable: true })
  ];

  events.forEach(event => {
    element.dispatchEvent(event);
  });

  // Also set the value using native setter if available (for React compatibility)
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;

  const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value'
  )?.set;

  if (element.tagName === 'INPUT' && nativeInputValueSetter) {
    nativeInputValueSetter.call(element, element.value);
  } else if (element.tagName === 'TEXTAREA' && nativeTextareaValueSetter) {
    nativeTextareaValueSetter.call(element, element.value);
  }
}

// Show notification overlay
function showNotification(filledCount, errorCount, errors) {
  // Remove existing notification if any
  const existing = document.getElementById('fix-filler-notification');
  if (existing) {
    existing.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'fix-filler-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${errorCount > 0 ? '#fff3cd' : '#d4edda'};
    border: 1px solid ${errorCount > 0 ? '#ffc107' : '#28a745'};
    color: ${errorCount > 0 ? '#856404' : '#155724'};
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;

  let message = `Fix Filler: Filled ${filledCount} field${filledCount !== 1 ? 's' : ''}`;

  if (errorCount > 0) {
    message += `\n${errorCount} error${errorCount !== 1 ? 's' : ''} occurred`;
    if (errors.length > 0) {
      message += '\n\nErrors:\n' + errors.slice(0, 3).join('\n');
      if (errors.length > 3) {
        message += `\n... and ${errors.length - 3} more`;
      }
    }
  }

  notification.textContent = message;
  notification.style.whiteSpace = 'pre-line';

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.style.transition = 'opacity 0.3s ease-out';
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 300);
  }, 4000);
}

// Auto-fill on page load if enabled
async function autoFillOnLoad() {
  try {
    // Load settings from storage
    const result = await chrome.storage.sync.get(['autoFillEnabled', 'autoFillDelay', 'fillRules']);

    const autoFillEnabled = result.autoFillEnabled || false;
    const autoFillDelay = result.autoFillDelay || 500;
    const rules = result.fillRules || [];

    console.log('[Fix Filler] Auto-fill settings:', { autoFillEnabled, autoFillDelay, rulesCount: rules.length });

    if (!autoFillEnabled) {
      console.log('[Fix Filler] Auto-fill is disabled');
      return;
    }

    if (rules.length === 0) {
      console.log('[Fix Filler] No rules configured');
      return;
    }

    // Get enabled rules
    const enabledRules = rules.filter(rule => rule.enabled);

    if (enabledRules.length === 0) {
      console.log('[Fix Filler] No enabled rules');
      return;
    }

    // Check if any of the CSS selectors match elements on this page
    const matchingRules = enabledRules.filter(rule => {
      try {
        const elements = document.querySelectorAll(rule.selector);
        return elements.length > 0;
      } catch (error) {
        console.warn(`[Fix Filler] Invalid selector: ${rule.selector}`, error);
        return false;
      }
    });

    if (matchingRules.length === 0) {
      console.log('[Fix Filler] No matching CSS selectors found on this page');
      return;
    }

    console.log(`[Fix Filler] Found ${matchingRules.length} matching rules. Auto-filling in ${autoFillDelay}ms...`);

    // Wait for the specified delay before auto-filling
    setTimeout(() => {
      fillForm(enabledRules);
      console.log('[Fix Filler] Auto-fill completed');
    }, autoFillDelay);

  } catch (error) {
    console.error('[Fix Filler] Error in auto-fill on load:', error);
  }
}

// Run auto-fill when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoFillOnLoad);
} else {
  // DOM already loaded, run immediately
  autoFillOnLoad();
}

// Log when content script is loaded
console.log('[Fix Filler] Content script loaded and ready');
