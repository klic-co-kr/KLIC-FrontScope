/**
 * Convert SVG icons to PNG format
 * Uses sharp for high-quality PNG generation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 48, 128, 512];
const iconsDir = path.join(__dirname, '../public/icons');
const publicDir = path.join(__dirname, '../public');

// Generate PNG from SVG buffer
async function generateIcon(size, outputPath) {
  // Create SVG as string
  let svg;
  if (size >= 128) {
    // Full KLIC branding for larger sizes
    svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#14B8A6"/>
      <stop offset="100%" style="stop-color:#0F4C8C"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.floor(size * 0.25)}" fill="url(#bgGrad)"/>
  <text x="${size/2}" y="${Math.floor(size * 0.65)}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.floor(size * 0.4)}" font-weight="700" text-anchor="middle" fill="white">K</text>
  <text x="${size/2}" y="${Math.floor(size * 0.82)}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.floor(size * 0.12)}" font-weight="500" text-anchor="middle" fill="white" fill-opacity="0.8">KLIC</text>
</svg>`;
  } else {
    // Simple K for smaller sizes
    svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#14B8A6"/>
      <stop offset="100%" style="stop-color:#0F4C8C"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.floor(size * 0.2)}" fill="url(#grad)"/>
  <text x="${size/2}" y="${Math.floor(size * 0.72)}" font-family="Arial, sans-serif" font-size="${Math.floor(size * 0.5)}" font-weight="bold" text-anchor="middle" fill="white">K</text>
</svg>`;
  }

  // Convert SVG to PNG using sharp
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${path.basename(outputPath)}`);
}

async function main() {
  console.log('Generating PNG icons...\n');

  // Generate for icons directory
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon${size}.png`);
    await generateIcon(size, outputPath);
  }

  // Also create a 128px version in public root for compatibility
  await generateIcon(128, path.join(publicDir, 'icon-128.png'));

  console.log('\nAll icons generated successfully!');
}

main().catch(console.error);
