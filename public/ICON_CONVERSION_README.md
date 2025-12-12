# Icon Conversion for Safari PWA Support

Safari on iOS requires **PNG format** icons for the "Add to Home Screen" feature. The app currently uses SVG icons, which need to be converted to PNG.

## Quick Solution

### Option 1: Use the Conversion Script (Recommended)

1. Install the required package:
   ```bash
   npm install sharp --save-dev
   ```

2. Run the conversion script:
   ```bash
   npm run convert-icons
   ```

This will create the following PNG files in the `public` folder:
- `apple-touch-icon.png` (180x180) - Required for Safari iOS
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

### Option 2: Manual Conversion

If you prefer to convert manually, use an online converter:

1. Go to https://cloudconvert.com/svg-to-png or https://convertio.co/svg-png/
2. Upload each SVG file and convert to PNG with these sizes:
   - `icon-192.svg` → `icon-192.png` (192x192)
   - `icon-512.svg` → `icon-512.png` (512x512)
   - `icon-192.svg` → `apple-touch-icon.png` (180x180) - Use 192 as base, resize to 180

3. Place all PNG files in the `public` folder

## Verification

After conversion, verify the files exist:
- ✅ `public/apple-touch-icon.png`
- ✅ `public/icon-192.png`
- ✅ `public/icon-512.png`

Then test on Safari iOS:
1. Open the app in Safari on iPhone/iPad
2. Tap the Share button
3. Select "Add to Home Screen"
4. The custom icon should now appear instead of the default "I"

## Notes

- The SVG files are kept for other browsers that support them
- PNG files are specifically for Safari iOS compatibility
- The manifest.json and index.html have been updated to use PNG icons

