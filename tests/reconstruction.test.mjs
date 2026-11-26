import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
const app=await readFile(new URL('../src/app.mjs',import.meta.url),'utf8');
test('No existe motor clínico anterior',async()=>{assert.deepEqual((await readdir(new URL('../src/',import.meta.url))).sort(),['app.mjs','ic','styles.css']);assert.doesNotMatch(app,/from ['"]\.\/clinical/);});
test('Portada y navegación IC',()=>{for(const title of ['CaHReMe','Valoración integral','Insuficiencia cardiaca','Diagnóstico','Clasificación','Tratamiento','Optimización','Seguimiento','Comorbilidades','Derivación','IC avanzada','IC descompensada'])assert.ok(app.includes(title),title);assert.ok(app.includes('Pendiente de desarrollo'));});
test('Todos los recursos PWA existen',async()=>{const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');const list=JSON.parse(sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1]);for(const p of list)await access(new URL('../'+p.slice(2),import.meta.url));assert.ok(!list.some(p=>p.includes('/clinical/')));});

test('Diagnóstico condensado y sin recomendaciones activas',()=>{for(const title of ['Asistente diagnóstico','Sospecha clínica','Pruebas diagnósticas','BNP / NT-proBNP','Ecocardiografía','Referencias científicas'])assert.ok(app.includes(title),title);assert.ok(app.includes('Sin recomendaciones clínicas activas'));assert.ok(app.includes("if(hash==='ic/diagnostico')return diagnosis()"));});
