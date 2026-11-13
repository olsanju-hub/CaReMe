import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
function worker(scope='https://example.test/CaReMe/'){
 const listeners={},stored=new Map(),opened=[],removed=[];let network=0;
 const cache={addAll:async assets=>assets.forEach(x=>stored.set(new URL(x.url??x,scope).pathname,'cached:'+(x.url??x))),match:async request=>stored.get(new URL(request.url).pathname)};
 const caches={open:async name=>{opened.push(name);return cache;},keys:async()=>[opened[0]??'', 'cahreme-shell-%2FCaReMe%2F-v0-old','cahreme-shell-%2Fother%2F-v0-old'],delete:async name=>removed.push(name),match:()=>{throw new Error('No buscar en cachés ajenas')}};
 vm.runInNewContext(source,{URL,Request,Set,self:{registration:{scope},location:{origin:new URL(scope).origin},addEventListener:(event,fn)=>listeners[event]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches,fetch:async()=>{network++;return 'network';}});
 const lifecycle=async type=>{let promise;listeners[type]({waitUntil:p=>promise=p});await promise;};
 const request=async(url,method='GET')=>{let response;listeners.fetch({request:{url,method},respondWith:p=>response=p});return response?await response:null;};
 return {lifecycle,request,stored,opened,removed,network:()=>network};
}
for(const path of ['src/clinical/obesidad.mjs','src/clinical/masld.mjs','src/clinical/plan-integral.mjs'])test('módulo nuevo servido desde caché: '+path,async()=>{const w=worker();await w.lifecycle('install');assert.match(await w.request('https://example.test/CaReMe/'+path),/^cached:/);assert.equal(w.network(),0)});
test('cada recurso precargado tiene una ruta offline, incluidas raíz e index',async()=>{const w=worker();await w.lifecycle('install');for(const path of w.stored.keys())assert.match(await w.request('https://example.test'+path),/^cached:/);assert.equal(w.network(),0)});
for(const [url,method] of [['https://example.test/CaReMe/paciente.json','GET'],['https://example.test/other/src/app.mjs','GET'],['https://external.test/CaReMe/src/app.mjs','GET'],['https://example.test/CaReMe/src/app.mjs','POST']])test('no intercepta datos o rutas ajenas '+method+url,async()=>{const w=worker();await w.lifecycle('install');assert.equal(await w.request(url,method),null);assert.equal(w.network(),0)});
test('activación no elimina cachés de otra aplicación del mismo origen',async()=>{const w=worker();await w.lifecycle('install');await w.lifecycle('activate');assert.deepEqual(w.removed,['cahreme-shell-%2FCaReMe%2F-v0-old']);assert.ok(!w.removed.includes(w.opened[0]))});
test('versiones con otra scope no comparten nombre de caché',async()=>{const a=worker(),b=worker('https://example.test/other/');await a.lifecycle('install');await b.lifecycle('install');assert.notEqual(a.opened[0],b.opened[0])});
