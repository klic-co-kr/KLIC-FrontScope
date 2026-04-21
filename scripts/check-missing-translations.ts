import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/i18n/locales');

function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      keys.push(fullKey);
    } else if (typeof value === 'object' && value !== null) {
      keys.push(...getKeys(value as Record<string, unknown>, fullKey));
    }
  }
  return keys;
}

// Read translation files
const ko = JSON.parse(fs.readFileSync(path.join(localesDir, 'ko.json'), 'utf-8'));
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf-8'));

const koKeys = new Set(getKeys(ko));
const enKeys = new Set(getKeys(en));

// Check for missing keys
const missingInKo = [...enKeys].filter(k => !koKeys.has(k));
const missingInEn = [...koKeys].filter(k => !enKeys.has(k));

// Report results
let hasErrors = false;

if (missingInKo.length > 0) {
  console.error('❌ Missing in ko.json:');
  missingInKo.forEach(k => console.error(`   - ${k}`));
  hasErrors = true;
}

if (missingInEn.length > 0) {
  console.error('❌ Missing in en.json:');
  missingInEn.forEach(k => console.error(`   - ${k}`));
  hasErrors = true;
}

if (!hasErrors) {
  console.log('✅ All translations synced between ko.json and en.json');
  console.log(`   Total keys: ${koKeys.size}`);
}

process.exit(hasErrors ? 1 : 0);
