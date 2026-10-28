// Build com esbuild (o registro npm está bloqueado aqui, então não há Vite;
// esbuild é o mesmo transpilador que o Vite usa por baixo).
// Saídas:
//   dist/index.html  — página publicada: React 18.3.1 via cdnjs + app inline
//   dist/test.html   — mesmo app com React embutido, para testes offline
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const css = readFileSync('src/styles.css', 'utf8');

const globals = {
  name: 'cdn-globals',
  setup(b) {
    b.onResolve({ filter: /^react(-dom\/client)?$/ }, (a) => ({ path: a.path, namespace: 'g' }));
    b.onLoad({ filter: /.*/, namespace: 'g' }, (a) => ({
      contents: a.path === 'react' ? 'module.exports = window.React' : 'module.exports = window.ReactDOM',
      loader: 'js',
    }));
  },
};

async function bundle(cdn) {
  const r = await build({
    entryPoints: ['src/main.tsx'],
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['safari15'],
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: cdn ? [globals] : [],
    write: false,
    logLevel: 'warning',
  });
  return r.outputFiles[0].text;
}

const head = `<title>Câmbio Manual</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0a0c0e">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Saira+Semi+Condensed:wght@500;600;700&display=swap">
<style>${css}</style>`;

const safe = (js) => js.replace(/<\/script/gi, '<\\/script');

mkdirSync('dist', { recursive: true });
const cdnJs = await bundle(true);
writeFileSync('dist/index.html', `${head}
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${safe(cdnJs)}</script>
`);
const fullJs = await bundle(false);
writeFileSync('dist/test.html', `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}</head><body>
<div id="root"></div>
<script>${safe(fullJs)}</script>
</body></html>`);
// página independente (sem o envelope do Claude): documento completo, React embutido,
// margens de segurança do iPhone. É a que vai para public/cambio/index.html no site.
writeFileSync('dist/standalone.html', `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
${head}
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
</head><body>
<div id="root"></div>
<script>${safe(fullJs)}</script>
</body></html>`);
console.log('dist/index.html', (cdnJs.length / 1024).toFixed(0), 'KB js; dist/test.html', (fullJs.length / 1024).toFixed(0), 'KB js');
