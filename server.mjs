import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const root = resolve('.');
const allow = new Set([
  "index.html",
  "actualizar.html",
  "manifest.webmanifest",
  "service-worker.js",
  "src/app.mjs",
  "src/ic/suspicion.mjs",
  "src/styles.css",
  "public/domain-cardiovascular.svg",
  "public/domain-hepatico.svg",
  "public/domain-metabolico.svg",
  "public/domain-renal.svg",
  "public/icon-180.png",
  "public/icon-192.png",
  "public/icon-512.png",
  "public/icon-concept.svg",
  "public/icon-maskable-512.png"
]);
const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json'
};
const port = Number(process.env.PORT || 4173);

createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
    }
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!allow.has(relative)) { res.writeHead(404); res.end('No encontrado'); return; }
    const body = await readFile(resolve(root, relative));
    res.writeHead(200, {
      'Content-Type': contentTypes[extname(relative)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404); res.end('No encontrado');
  }
}).listen(port, () => console.log('CaHReMe: http://localhost:' + port));

