# Create PWA Icons

The app needs icon files for PWA installation. Create these files in the `public/` folder:

## Required Icons

1. **icon-192x192.png** (192x192 pixels)
2. **icon-512x512.png** (512x512 pixels)

## How to Create Icons

### Option 1: Use an Online Tool
1. Go to https://realfavicongenerator.net/ or https://www.favicon-generator.org/
2. Upload your logo/image
3. Generate all sizes
4. Download and save to `public/` folder

### Option 2: Use Image Editing Software
1. Create a square image (192x192 or 512x512)
2. Export as PNG
3. Save to `public/icon-192x192.png` and `public/icon-512x512.png`

### Option 3: Use a Simple Placeholder (Temporary)
For now, you can create simple colored squares with text:
- Blue background (#2563eb)
- White text "AP" (AI ProjectHub)
- Save as PNG

## Icon Requirements

- **Format:** PNG
- **192x192:** For Android home screen and iOS
- **512x512:** For Android splash screen and install prompt
- **Transparent background:** Optional but recommended
- **Safe zone:** Keep important content in the center (safe for circular masks)

Once icons are created, the app will be fully installable on iOS and Android!

