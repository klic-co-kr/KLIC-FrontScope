import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve, dirname } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// manifest locale 생성 플러그인
function generateManifestLocales() {
  return {
    name: 'generate-manifest-locales',
    writeBundle() {
      try {
        execSync('tsx scripts/generate-manifest-locales.ts', {
          cwd: process.cwd(),
          stdio: 'inherit',
        });
      } catch (error) {
        console.warn('Failed to generate manifest locales:', error);
      }
    },
  };
}

// Content script은 Chrome MV3에서 classic script로 로드됨 (ES module 아님)
// Rollup이 shared chunk으로 분리한 import를 IIFE로 인라인하여 단일 파일로 만듦
// 해시가 적용된 파일명을 안전하게 찾기
function inlineContentScriptImports(): Plugin {
  return {
    name: 'inline-content-script-imports',
    enforce: 'post',
    closeBundle() {
      try {
        const assetsDir = resolve(__dirname, 'dist/assets');

        // assets 폴더가 있는지 확인
        if (!existsSync(assetsDir)) {
          console.log('No dist/assets directory found');
          return;
        }

        const files = readdirSync(assetsDir);

        // content.js로 시작하고 .js로 끝나는 모든 파일 찾기
        const contentFiles = files.filter(f => f.startsWith('content') && f.endsWith('.js'));

        if (contentFiles.length === 0) {
          console.log('No content.js files found in dist/assets');
          return;
        }

        // 가장 최신 content.js 파일 사용 (수정시간 기준)
        const contentFile = contentFiles.sort().reverse()[0];

        // 파일명이 undefined가 아닌지 확인
        if (!contentFile) {
          console.log('Content file is undefined, skipping inline');
          return;
        }

        const contentPath = resolve(assetsDir, contentFile);
        let content = readFileSync(contentPath, 'utf-8');

        const namedImportRegex = /import\s*\{([^}]+)\}\s*from\s*"([^"]+)"\s*;?/g;
        const sideEffectImportRegex = /import\s*"([^"]+)"\s*;?/g;
        const exportRegex = /export\s*\{[^}]+\}\s*;?/g;

        const parseSpecifierList = (specifiers: string) => {
          return specifiers
            .split(',')
            .map((token) => token.trim())
            .filter(Boolean)
            .map((token) => {
              const parts = token.split(/\s+as\s+/);
              const local = parts[0]?.trim() ?? '';
              const alias = parts[1]?.trim() ?? local;
              return { local, alias };
            })
            .filter((entry) => entry.local.length > 0);
        };

        const buildNamedInline = (bindings: string, moduleCode: string): string | null => {
          const exportMatches = Array.from(moduleCode.matchAll(/export\s*\{([^}]+)\}\s*;?/g));
          if (exportMatches.length === 0) {
            return null;
          }

          const exportMap = exportMatches
            .flatMap((matchItem) => parseSpecifierList(matchItem[1] ?? ''))
            .map((entry) => `${entry.alias}:${entry.local}`)
            .join(',');

          const destructure = parseSpecifierList(bindings)
            .map((entry) => (entry.local === entry.alias ? entry.local : `${entry.local}:${entry.alias}`))
            .join(',');

          if (destructure.length === 0 || exportMap.length === 0) {
            return null;
          }

          const body = moduleCode.replace(exportRegex, '').trim();
          return `const{${destructure}}=(()=>{${body};return{${exportMap}}})();`;
        };

        const buildSideEffectInline = (moduleCode: string): string => {
          const body = moduleCode.replace(exportRegex, '').trim();
          return body.length > 0 ? `(()=>{${body}})();` : '';
        };

        const inlineImportsRecursively = (code: string, baseDir: string): { code: string; count: number } => {
          let output = code;
          let totalInlined = 0;

          while (true) {
            let changed = false;

            output = output.replace(namedImportRegex, (fullMatch, rawBindings, modulePath) => {
              const resolvedPath = resolve(baseDir, modulePath);
              if (!existsSync(resolvedPath)) {
                return fullMatch;
              }

              const rawModule = readFileSync(resolvedPath, 'utf-8');
              const nested = inlineImportsRecursively(rawModule, dirname(resolvedPath));
              const inlined = buildNamedInline(rawBindings, nested.code);
              if (!inlined) {
                return fullMatch;
              }

              changed = true;
              totalInlined += nested.count + 1;
              return inlined;
            });

            output = output.replace(sideEffectImportRegex, (fullMatch, modulePath) => {
              const resolvedPath = resolve(baseDir, modulePath);
              if (!existsSync(resolvedPath)) {
                return fullMatch;
              }

              const rawModule = readFileSync(resolvedPath, 'utf-8');
              const nested = inlineImportsRecursively(rawModule, dirname(resolvedPath));
              const inlined = buildSideEffectInline(nested.code);

              changed = true;
              totalInlined += nested.count + 1;
              return inlined;
            });

            if (!changed) {
              break;
            }
          }

          return { code: output, count: totalInlined };
        };

        const inlinedContent = inlineImportsRecursively(content, assetsDir);
        content = inlinedContent.code;

        if (inlinedContent.count === 0) {
          console.log('No imports to inline in content script');
          return;
        }

        writeFileSync(contentPath, content);
        console.log(`Inlined ${inlinedContent.count} imports into ${contentFile}`);
        console.log('Content script imports inlined successfully');
      } catch (e) {
        console.error('Error inlining content script imports:', e);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    generateManifestLocales(), // 빌드 시 manifest locale 생성
    inlineContentScriptImports(),
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        offscreen: resolve(__dirname, 'offscreen.html'),   // HTML entry — Vite processes <script type="module">
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: undefined,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'gifenc'],
    exclude: [],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
