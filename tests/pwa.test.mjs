import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');
test('manifiesto identifica correctamente CaHReMe y declara assets locales', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  assert.ok(m.name.startsWith('CaHReMe'));
  assert.equal(m.short_name, 'CaHReMe');
  assert.equal(m.start_url, './');
  assert.ok(m.icons.every(icon => !/^https?:/.test(icon.src)));
  for (const icon of m.icons) assert.ok(readFileSync(join(root, icon.src)).length > 100);
});
test('service worker solo cachea recursos estáticos', () => {
  const sw = read('service-worker.js');
  assert.ok(sw.includes('const ASSETS'));
  assert.ok(sw.includes('request.method'));
  assert.ok(!sw.includes('indexedDB'));
  assert.ok(!sw.includes('localStorage'));
  assert.ok(!sw.includes('postMessage('));
  for (const asset of ['src/app.mjs','src/model.mjs','src/consultas.mjs','src/clinical/engine.mjs','src/clinical/integracion.mjs','src/clinical/farmacologia.mjs','src/clinical/continuidad.mjs','src/clinical/incretinas.mjs','src/clinical/basales.mjs','src/styles.css','public/icon-concept.svg']) {
    assert.ok(sw.includes(asset));
  }
});
test('interfaz no contiene instrucciones clínicas reales ni almacenamiento de datos', () => {
  const app = read('src/app.mjs');
  assert.ok(app.includes('Ningún resultado autoriza diagnóstico'));
  assert.ok(!app.includes('localStorage.'));
  assert.ok(!app.includes('sessionStorage.'));
  assert.ok(!app.includes('fetch('));
});
