/**
 * Script to convert SVG icons to PNG format for Safari PWA support
 * 
 * Run with: node scripts/convert-icons-to-png.js
 * 
 * Requires: npm install sharp --save-dev
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Error: sharp package not found.');
  console.log('📦 Please install it with: npm install sharp --save-dev');
  console.log('   Or use an online SVG to PNG converter:');
  console.log('   - https://cloudconvert.com/svg-to-png');
  console.log('   - https://convertio.co/svg-png/');
  console.log('\n📋 Required PNG files:');
  console.log('   - apple-touch-icon.png (180x180)');
  console.log('   - icon-192.png (192x192)');
  console.log('   - icon-512.png (512x512)');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public');

const conversions = [
  {
    input: 'icon-192.svg',
    output: 'icon-192.png',
    size: 192
  },
  {
    input: 'icon-512.svg',
    output: 'icon-512.png',
    size: 512
  },
  {
    input: 'icon-192.svg', // Use 192 as base for apple-touch-icon
    output: 'apple-touch-icon.png',
    size: 180 // iOS requires 180x180
  }
];

async function convertIcons() {
  console.log('🔄 Converting SVG icons to PNG...\n');

  for (const { input, output, size } of conversions) {
    const inputPath = path.join(publicDir, input);
    const outputPath = path.join(publicDir, output);

    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Input file not found: ${input}`);
      continue;
    }

    try {
      await sharp(inputPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Created ${output} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error converting ${input} to ${output}:`, error.message);
    }
  }

  console.log('\n✨ Conversion complete!');
  console.log('📱 Safari should now display the correct icon when adding to home screen.');
}

convertIcons().catch(console.error);

