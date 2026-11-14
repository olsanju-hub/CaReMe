import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const root = resolve('.');
const allow = new Set([
  'index.html', 'actualizar.html', 'src/styles.css', 'src/sequence-fields.mjs', 'src/clinical/ajustes-seguros.mjs', 'src/clinical/identidad-farmaco.mjs', 'src/clinical/secuencia-terapeutica.mjs', 'src/clinical/secuencia-insulina.mjs', 'src/app.mjs', 'src/model.mjs', 'src/consultas.mjs', 'src/clinical/obesidad.mjs', 'src/clinical/masld.mjs', 'src/clinical/dislipemia.mjs', 'src/clinical/hta.mjs', 'src/clinical/ckm.mjs', 'src/clinical/calculadoras.mjs', 'src/clinical/tratamientos-modulo.mjs', 'src/clinical/insulina-dosis.mjs', 'src/clinical/consulta-breve.mjs', 'src/clinical/riesgo-cv.mjs', 'src/clinical/renal.mjs', 'src/clinical/engine.mjs', 'src/clinical/integracion.mjs', 'src/clinical/farmacologia.mjs', 'src/clinical/continuidad.mjs', 'src/clinical/incretinas.mjs', 'src/clinical/basales.mjs', 'src/clinical/auditoria.mjs', 'src/clinical/proveniencia.mjs', 'src/clinical/plan-integral.mjs', 'src/clinical/plan.mjs', 'src/clinical/dm2-rapida.mjs', 'src/clinical/dm2-detallada.mjs', 'src/clinical/insulinizacion.mjs', 'src/clinical/insuficiencia-cardiaca.mjs',
  'manifest.webmanifest', 'service-worker.js',
  'public/icon-180.png', 'public/icon-192.png', 'public/icon-512.png', 'public/icon-maskable-512.png', 'public/icon-concept.svg', 'public/domain-cardiovascular.svg',
  'public/domain-renal.svg', 'public/domain-hepatico.svg',
  'public/domain-metabolico.svg'
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

