# Icon Assets

This directory contains the icon assets for the Fix Filler Chrome extension.

## Files

- `icon.svg` - Source SVG icon file

## Required PNG Sizes

The extension needs the following PNG files:
- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Generating PNG Files

You can generate the required PNG files from the SVG using one of these methods:

### Method 1: Using ImageMagick (Command Line)
```bash
# Install ImageMagick if not already installed
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Generate PNG files
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

### Method 2: Using Inkscape (Command Line)
```bash
# Install Inkscape if not already installed
# macOS: brew install inkscape

# Generate PNG files
inkscape icon.svg -o icon16.png -w 16 -h 16
inkscape icon.svg -o icon48.png -w 48 -h 48
inkscape icon.svg -o icon128.png -w 128 -h 128
```

### Method 3: Using rsvg-convert
```bash
# Install librsvg if not already installed
# macOS: brew install librsvg

# Generate PNG files
rsvg-convert -w 16 -h 16 icon.svg > icon16.png
rsvg-convert -w 48 -h 48 icon.svg > icon48.png
rsvg-convert -w 128 -h 128 icon.svg > icon128.png
```

### Method 4: Online Tool
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Convert to PNG at required sizes (16x16, 48x48, 128x128)
4. Download and save as `icon16.png`, `icon48.png`, and `icon128.png`

### Method 5: Using GIMP or Photoshop
1. Open `icon.svg` in GIMP or Photoshop
2. Export/Save as PNG at each required size
3. Name the files accordingly

## Note

The extension will not work properly in Chrome until these PNG files are generated and placed in this directory.
