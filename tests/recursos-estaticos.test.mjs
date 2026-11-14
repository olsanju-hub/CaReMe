import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';import {posix} from 'node:path';
test('todo módulo importado por la app se sirve y está disponible offline',()=>{
 const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
 const server=read('server.mjs').split('const contentTypes')[0],sw=read('service-worker.js').split('const STATIC_PATHS')[0];
 const allowed=new Set([...server.matchAll(/'([^']+\.(?:mjs|js|html|css))'/g)].map(x=>x[1]));
 const cached=new Set([...sw.matchAll(/'\.\/([^']+)'/g)].map(x=>x[1]));
 const queue=['src/app.mjs'],seen=new Set();
 while(queue.length){const p=queue.pop();if(seen.has(p))continue;seen.add(p);assert.ok(allowed.has(p),p+' no está permitido por el servidor');assert.ok(cached.has(p),p+' no está en la caché offline');assert.ok(existsSync(new URL(p,root)));for(const m of read(p).matchAll(/(?:from\s*|import\s*)['"]([.][^'"]+\.mjs)['"]/g))queue.push(posix.normalize(posix.join(posix.dirname(p),m[1])));}
 assert.ok(seen.has('src/clinical/rutas-patologia.mjs'));assert.ok(seen.size>25);
});
