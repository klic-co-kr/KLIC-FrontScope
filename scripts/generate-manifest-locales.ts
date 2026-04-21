import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/i18n/locales');
const outputDir = path.resolve(__dirname, '../dist/_locales');

interface ChromeMessage {
  message: string;
  placeholders?: Record<string, { content: string }>;
}

// 변환 함수: i18n → Chrome messages.json 형식
function convertToMessagesFormat(translations: Record<string, unknown>): Record<string, ChromeMessage> {
  const result: Record<string, ChromeMessage> = {};

  function flatten(obj: Record<string, unknown>, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}_${key}` : key;
      if (typeof value === 'string') {
        // {{variable}} 패턴을 찾아서 placeholders 생성
        const variables: string[] = [];
        const message = value.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
          variables.push(name);
          return `$${name}$`;
        });

        const entry: ChromeMessage = { message };

        if (variables.length > 0) {
          entry.placeholders = {};
          variables.forEach((name, index) => {
            entry.placeholders![name] = { content: `$${index + 1}` };
          });
        }

        result[fullKey] = entry;
      } else if (typeof value === 'object' && value !== null) {
        flatten(value as Record<string, unknown>, fullKey);
      }
    }
  }

  flatten(translations);
  return result;
}

// 번역 파일 변환
['ko', 'en'].forEach((lang) => {
  const inputFile = path.join(localesDir, `${lang}.json`);
  const outputDirLang = path.join(outputDir, lang);
  const outputFile = path.join(outputDirLang, 'messages.json');

  const translations = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const messages = convertToMessagesFormat(translations);

  fs.mkdirSync(outputDirLang, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(messages, null, 2));
});

console.log('✓ Manifest locales generated');
