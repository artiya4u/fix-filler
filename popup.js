// State
let rules = [];
let editingRuleId = null;

// DOM Elements
const rulesList = document.getElementById('rules-list');
const addRuleBtn = document.getElementById('add-rule-btn');
const ruleForm = document.getElementById('rule-form');
const formTitle = document.getElementById('form-title');
const ruleNameInput = document.getElementById('rule-name');
const cssSelectorInput = document.getElementById('css-selector');
const fillValueInput = document.getElementById('fill-value');
const ruleEnabledCheckbox = document.getElementById('rule-enabled');
const saveRuleBtn = document.getElementById('save-rule-btn');
const cancelRuleBtn = document.getElementById('cancel-rule-btn');
const fillNowBtn = document.getElementById('fill-now-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const autoFillEnabledCheckbox = document.getElementById('auto-fill-enabled');
const autoFillDelayInput = document.getElementById('auto-fill-delay');

// Load rules from storage
async function loadRules() {
  const result = await chrome.storage.sync.get(['fillRules']);
  rules = result.fillRules || [];
  renderRules();
}

// Save rules to storage
async function saveRules() {
  await chrome.storage.sync.set({ fillRules: rules });
}

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.sync.get(['autoFillEnabled', 'autoFillDelay']);
  autoFillEnabledCheckbox.checked = result.autoFillEnabled !== undefined ? result.autoFillEnabled : false;
  autoFillDelayInput.value = result.autoFillDelay !== undefined ? result.autoFillDelay : 500;
}

// Save settings to storage
async function saveSettings() {
  const autoFillEnabled = autoFillEnabledCheckbox.checked;
  const autoFillDelay = parseInt(autoFillDelayInput.value) || 500;

  await chrome.storage.sync.set({
    autoFillEnabled,
    autoFillDelay
  });

  console.log('[Fix Filler] Settings saved:', { autoFillEnabled, autoFillDelay });
}

// Render rules list
function renderRules() {
  if (rules.length === 0) {
    rulesList.innerHTML = '<div class="empty-state">No rules yet. Click "Add New Rule" to create one.</div>';
    return;
  }

  rulesList.innerHTML = rules.map((rule, index) => `
    <div class="rule-item ${rule.enabled ? '' : 'disabled'}">
      <div class="rule-info">
        <div class="rule-name">${escapeHtml(rule.name)}</div>
        <div class="rule-details">
          <div><strong>Selector:</strong> ${escapeHtml(rule.selector)}</div>
          <div><strong>Value:</strong> ${escapeHtml(rule.value)}</div>
        </div>
      </div>
      <div class="rule-actions">
        <button class="btn btn-small btn-edit" data-index="${index}">Edit</button>
        <button class="btn btn-small btn-delete" data-index="${index}">Delete</button>
      </div>
    </div>
  `).join('');

  // Add event listeners to edit and delete buttons
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      editRule(index);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      deleteRule(index);
    });
  });
}

// Show add rule form
function showAddRuleForm() {
  formTitle.textContent = 'Add New Rule';
  ruleNameInput.value = '';
  cssSelectorInput.value = '';
  fillValueInput.value = '';
  ruleEnabledCheckbox.checked = true;
  editingRuleId = null;
  ruleForm.classList.remove('hidden');
}

// Edit rule
function editRule(index) {
  const rule = rules[index];
  formTitle.textContent = 'Edit Rule';
  ruleNameInput.value = rule.name;
  cssSelectorInput.value = rule.selector;
  fillValueInput.value = rule.value;
  ruleEnabledCheckbox.checked = rule.enabled;
  editingRuleId = index;
  ruleForm.classList.remove('hidden');
}

// Delete rule
async function deleteRule(index) {
  if (confirm('Are you sure you want to delete this rule?')) {
    rules.splice(index, 1);
    await saveRules();
    renderRules();
  }
}

// Save rule
async function saveRule() {
  const name = ruleNameInput.value.trim();
  const selector = cssSelectorInput.value.trim();
  const value = fillValueInput.value.trim();
  const enabled = ruleEnabledCheckbox.checked;

  if (!name || !selector || !value) {
    alert('Please fill in all fields');
    return;
  }

  const rule = { name, selector, value, enabled };

  if (editingRuleId !== null) {
    rules[editingRuleId] = rule;
  } else {
    rules.push(rule);
  }

  await saveRules();
  renderRules();
  hideRuleForm();
}

// Hide rule form
function hideRuleForm() {
  ruleForm.classList.add('hidden');
  editingRuleId = null;
}

// Fill current page
async function fillCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    alert('No active tab found');
    return;
  }

  // Send enabled rules to content script
  const enabledRules = rules.filter(rule => rule.enabled);

  if (enabledRules.length === 0) {
    alert('No enabled rules to apply');
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'fillForm',
      rules: enabledRules
    });

    // Show success message
    const originalText = fillNowBtn.textContent;
    fillNowBtn.textContent = 'Filled!';
    fillNowBtn.style.background = '#2d8e47';
    setTimeout(() => {
      fillNowBtn.textContent = originalText;
      fillNowBtn.style.background = '';
    }, 1500);
  } catch (error) {
    console.error('Error filling form:', error);
    alert('Error filling form. Make sure the page is loaded.');
  }
}

// Export rules
function exportRules() {
  const dataStr = JSON.stringify(rules, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fix-filler-rules.json';
  link.click();
  URL.revokeObjectURL(url);
}

// Import rules
function importRules() {
  importFile.click();
}

// Handle file import
async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const importedRules = JSON.parse(e.target.result);

      if (!Array.isArray(importedRules)) {
        alert('Invalid rules file format');
        return;
      }

      // Validate rules structure
      const isValid = importedRules.every(rule =>
        rule.name && rule.selector && rule.value !== undefined && typeof rule.enabled === 'boolean'
      );

      if (!isValid) {
        alert('Invalid rules format in file');
        return;
      }

      if (confirm('This will replace all existing rules. Continue?')) {
        rules = importedRules;
        await saveRules();
        renderRules();
        alert('Rules imported successfully!');
      }
    } catch (error) {
      console.error('Error importing rules:', error);
      alert('Error parsing rules file');
    }

    // Reset file input
    event.target.value = '';
  };

  reader.readAsText(file);
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
addRuleBtn.addEventListener('click', showAddRuleForm);
saveRuleBtn.addEventListener('click', saveRule);
cancelRuleBtn.addEventListener('click', hideRuleForm);
fillNowBtn.addEventListener('click', fillCurrentPage);
exportBtn.addEventListener('click', exportRules);
importBtn.addEventListener('click', importRules);
importFile.addEventListener('change', handleFileImport);

// Settings event listeners
autoFillEnabledCheckbox.addEventListener('change', saveSettings);
autoFillDelayInput.addEventListener('input', saveSettings);

// Close modal when clicking outside
ruleForm.addEventListener('click', (e) => {
  if (e.target === ruleForm) {
    hideRuleForm();
  }
});

// Initialize
loadRules();
loadSettings();
