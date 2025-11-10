# Fix Filler

A Chrome extension that helps you fill out online forms with predefined information using CSS selectors to target specific fields. Perfect for fields that Chrome's built-in autofill can't handle well, such as custom email-password fields or non-standard form inputs.

## Features

- **Custom CSS Selector Rules**: Define rules using CSS selectors to target any form field
- **Auto-fill on Page Load**: Automatically fill forms when matching CSS selectors are detected
- **Configurable Delay**: Set a delay before auto-filling to ensure the page is fully loaded
- **Manual Fill Option**: Fill forms on-demand with a single click
- **Enable/Disable Rules**: Toggle individual rules without deleting them
- **Import/Export**: Backup and share your rules using JSON files
- **Smart Field Detection**: Supports text inputs, textareas, selects, checkboxes, radio buttons, and contenteditable elements
- **Framework Compatible**: Triggers proper events for React, Vue, and other JavaScript frameworks

## Installation

### From Source

1. Clone or download this repository
2. Generate icon PNG files from the SVG (see `icons/README.md` for instructions)
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked"
6. Select the `fix_filler` directory

## Usage

### Creating a Rule

1. Click the Fix Filler extension icon in your browser toolbar
2. Click "+ Add New Rule"
3. Fill in the form:
   - **Rule Name**: A descriptive name (e.g., "Email Field")
   - **CSS Selector**: The CSS selector to target the field (e.g., `input[name="email"]`)
   - **Fill Value**: The value to fill (e.g., "user@example.com")
   - **Enabled**: Check to enable the rule
4. Click "Save"

### Auto-fill Settings

- **Auto-fill forms on page load**: Enable this to automatically fill forms when the page loads
- **Auto-fill delay**: Set the delay (in milliseconds) before auto-filling. Default is 500ms. This ensures the page is fully loaded before filling.

### Manual Filling

Click the "Fill Current Page" button in the popup to manually fill the current page with all enabled rules.

### Import/Export

- **Export Rules**: Click "Export Rules" to download your rules as a JSON file
- **Import Rules**: Click "Import Rules" and select a JSON file to import rules (this will replace existing rules)

**Quick Start**: You can import the included `sample-rules.json` file to get started with common form fields. Just customize the values to match your needs.

## Examples

### Example Rules

**Email field:**
- Selector: `input[name="email"]` or `input[type="email"]`
- Value: `user@example.com`

**Password field:**
- Selector: `input[name="password"]` or `input[type="password"]`
- Value: `SecurePassword123!`

**Username field:**
- Selector: `input[id="username"]`
- Value: `myusername`

**Custom dropdown:**
- Selector: `select[name="country"]`
- Value: `United States` (or the option value)

**Checkbox:**
- Selector: `input[type="checkbox"][name="terms"]`
- Value: `true` (or any truthy value to check it)

## Development

### Project Structure

```
fix_filler/
├── manifest.json         # Chrome extension manifest
├── popup.html           # Extension popup UI
├── popup.css            # Popup styles
├── popup.js             # Popup logic and settings management
├── content.js           # Content script for filling forms
├── background.js        # Background service worker
├── icons/               # Extension icons
│   ├── icon.svg         # Source SVG icon
│   └── README.md        # Icon generation instructions
└── readme.md            # This file
```

### Technologies Used

- Manifest V3 (latest Chrome extension format)
- Vanilla JavaScript (no frameworks)
- Chrome Storage API for syncing settings across devices
- CSS Grid and Flexbox for responsive UI

## Privacy

All data (rules and settings) is stored locally using Chrome's storage API and synced across your Chrome browsers if you're signed in. No data is sent to external servers.

## Contributing

Feel free to submit issues or pull requests to improve the extension.

## License

MIT License