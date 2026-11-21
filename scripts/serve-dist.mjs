// Minimal static server that mimics GitHub Pages for the production build:
// serves dist/doclib-gui/browser under /DocLib_GUI/ and falls back to index.html
// for deep links (on Pages this is done by copying index.html to 404.html).
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const BASE = '/DocLib_GUI/';
const ROOT = join(import.meta.dirname, '..', 'dist', 'doclib-gui', 'browser');
const PORT = Number(process.env.PORT ?? 4300);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith(BASE)) {
    res.writeHead(302, { Location: BASE }).end();
    return;
  }
  const relative = normalize(decodeURIComponent(url.pathname.slice(BASE.length))).replace(
    /^(\.\.[/\\])+/,
    '',
  );
  let file = join(ROOT, relative);
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    file = join(ROOT, 'index.html');
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`DocLib demo: http://localhost:${PORT}${BASE}`));
