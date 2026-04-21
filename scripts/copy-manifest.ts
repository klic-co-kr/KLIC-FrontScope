import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dist/assets 폴더에서 실제 content.js 파일명 찾기
function findContentFileName() {
  const distDir = path.join(__dirname, 'dist');
  const assetsDir = path.join(distDir, 'assets');

  if (!fs.existsSync(distDir)) {
    console.error('dist directory not found!');
    return 'content.js';
  }

  if (!fs.existsSync(assetsDir)) {
    console.error('dist/assets directory not found!');
    return 'content.js';
  }

  const files = fs.readdirSync(assetsDir);
  const contentFiles = files.filter(f => f.startsWith('content') && f.endsWith('.js'));

  if (contentFiles.length === 0) {
    console.log('No content.js files found in dist/assets');
    return 'content.js'; // fallback
  }

  // 가장 최신 content 파일 사용 (수정시간 기준)
  const sortedFiles = contentFiles.sort((a, b) => {
    const statA = fs.statSync(path.join(assetsDir, a));
    const statB = fs.statSync(path.join(assetsDir, b));
    return statB.mtimeMs - statA.mtimeMs;
  });

  return sortedFiles[0];
}

// manifest.json 복사 및 파일명 업데이트
function copyManifest() {
  const manifestSource = path.join(__dirname, '../public/manifest.json');
  const manifestDest = path.join(__dirname, 'dist/manifest.json');

  if (!fs.existsSync(manifestSource)) {
    console.error('Source manifest.json not found!');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestSource, 'utf-8'));

  // content_scripts의 js 경로를 실제 파일명으로 업데이트
  const contentFileName = findContentFileName();
  manifest.content_scripts[0].js = [`assets/${contentFileName}`];

  // dist 폴더에 manifest.json 쓰기
  fs.writeFileSync(manifestDest, JSON.stringify(manifest, null, 2));
  console.log(`✓ Manifest copied to dist/ (content.js: ${contentFileName})`);
}

copyManifest();
