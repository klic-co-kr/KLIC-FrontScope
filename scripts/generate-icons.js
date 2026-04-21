/**
 * Generate PNG icons from SVG source
 * Creates icons at multiple sizes for Chrome extension
 */

const fs = require('fs');
const path = require('path');

// SVG templates for the icons
const createIconSVG = (size, text = 'K') => {
  const colors = {
    primary: '#14B8A6',
    secondary: '#0F4C8C',
    bgLight: '#14B8A6',
    bgDark: '#0F4C8C'
  };

  // For 128px and larger, use full KLIC branding
  if (size >= 128) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#14B8A6"/>
      <stop offset="100%" style="stop-color:#0F4C8C"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.25}" fill="url(#bgGrad${size})"/>
  <text x="${size/2}" y="${size * 0.65}" font-family="system-ui, -apple-system, sans-serif" font-size="${size * 0.4}" font-weight="700" text-anchor="middle" fill="white">K</text>
  <text x="${size/2}" y="${size * 0.82}" font-family="system-ui, -apple-system, sans-serif" font-size="${size * 0.12}" font-weight="500" text-anchor="middle" fill="white" fill-opacity="0.8">KLIC</text>
</svg>`;
  }

  // For smaller sizes, just use K
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#14B8A6"/>
      <stop offset="100%" style="stop-color:#0F4C8C"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad${size})"/>
  <text x="${size/2}" y="${size * 0.72}" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" text-anchor="middle" fill="white">K</text>
</svg>`;
};

const sizes = [16, 48, 128, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate SVG files
sizes.forEach(size => {
  const svg = createIconSVG(size);
  const svgPath = path.join(outputDir, `icon${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Created: ${svgPath}`);
});

console.log('\nSVG icons generated successfully!');
console.log('To convert to PNG, use: npm run generate:png');
