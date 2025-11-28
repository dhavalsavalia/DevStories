const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * Copy webview assets to dist/webview/
 */
function copyWebviewAssets() {
  const srcDir = path.join(__dirname, 'webview');
  const destDir = path.join(__dirname, 'dist', 'webview');

  if (!fs.existsSync(srcDir)) {
    console.log('[webview] No webview directory found, skipping...');
    return;
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const files = fs.readdirSync(srcDir);
  files.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  });
  console.log('[webview] Assets copied to dist/webview/');
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',
  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('[watch] build finished');
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: [
      'src/extension.ts'
    ],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'silent',
    plugins: [
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin,
    ],
  });

  if (watch) {
    await ctx.watch();
    copyWebviewAssets();
    // Watch webview directory for changes
    const webviewDir = path.join(__dirname, 'webview');
    if (fs.existsSync(webviewDir)) {
      fs.watch(webviewDir, () => {
        copyWebviewAssets();
      });
    }
  } else {
    await ctx.rebuild();
    copyWebviewAssets();
    await ctx.dispose();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
