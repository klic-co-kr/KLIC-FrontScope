const fs = require('fs');
const path = require('path');

// 프로젝트 루트 찾기 (package.json이 있는 위치)
function findProjectRoot() {
  let currentDir = __dirname;
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    if (fs.existsSync(path.join(currentDir, 'node_modules', 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return __dirname; // fallback to scripts dir
}

const PROJECT_ROOT = findProjectRoot();

// dist/assets 폴더에서 실제 content.js 파일명 찾기
function findContentFileName() {
  const assetsDir = path.join(PROJECT_ROOT, 'dist/assets');

  if (!fs.existsSync(assetsDir)) {
    console.log('No dist/assets directory found');
    return 'content.js';
  }

  const files = fs.readdirSync(assetsDir);
  const contentFiles = files.filter(f => f.startsWith('content') && f.endsWith('.js'));

  if (contentFiles.length === 0) {
    console.log('No content.js files found in dist/assets');
    return 'content.js';
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
  const manifestSource = path.join(PROJECT_ROOT, 'public/manifest.json');
  const manifestDest = path.join(PROJECT_ROOT, 'dist/manifest.json');

  if (!fs.existsSync(manifestSource)) {
    console.error('Source manifest.json not found!');
    process.exit(1);
  }

  let manifest = JSON.parse(fs.readFileSync(manifestSource, 'utf-8'));

  // content_scripts의 js 경로를 실제 파일명으로 업데이트
  const contentFileName = findContentFileName();
  manifest.content_scripts[0].js = [`assets/${contentFileName}`];

  // dist 폴더에 manifest.json 쓰기
  fs.writeFileSync(manifestDest, JSON.stringify(manifest, null, 2));
  console.log(`Manifest copied to dist/ (content.js: ${contentFileName})`);
}

copyManifest();
