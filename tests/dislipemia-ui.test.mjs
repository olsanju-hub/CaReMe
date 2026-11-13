import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LIPID_FIELDS} from '../src/clinical/dislipemia.mjs';
test('dislipemia accesible, campos únicos, estado compartido y resultado invalidado',async()=>{
 const handlers={};let removed=false;
 const root={innerHTML:'',addEventListener:(type,fn)=>handlers[type]=fn};
 globalThis.document={getElementById:id=>id==='app'?root:{textContent:'',remove(){removed=true}},querySelectorAll:()=>[]};
 globalThis.scrollTo=()=>{};globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,data={})=>handlers.click({target:{closest:()=>({dataset:{action,...data}})}});
 const set=(id,value)=>handlers.input({target:{closest:()=>({dataset:{field:id},value,type:'text'})}});
 assert.equal((root.innerHTML.match(/class="module-card"/g)||[]).length,6);
 click('lipids');assert.equal((root.innerHTML.match(/class="field module-field"/g)||[]).length,4);click('brief-advanced');assert.match(root.innerHTML,/Perfil lipídico disponible/);
 for(const id of LIPID_FIELDS)assert.equal((root.innerHTML.match(new RegExp('data-field-id="'+id+'"','g'))||[]).length,1,id+' una vez');
 set('trigliceridos','881');click('lipid-result');assert.match(root.innerHTML,/TG &gt;880/);
 assert.match(root.innerHTML,/sin pauta individual/);assert.match(root.innerHTML,/cima.aemps.es/);
 set('trigliceridos','150');assert.equal(removed,true);click('lipid-result');assert.doesNotMatch(root.innerHTML,/TG &gt;880/);
 set('ldl','123');click('cv-risk');click('cv-expand');assert.match(root.innerHTML,/value="123"/);
 click('summary');assert.match(root.innerHTML,/Ver riesgo, objetivo y tratamiento/);
});
test('servidor y caché incluyen módulo dislipemia',()=>{
 for(const path of ['../server.mjs','../service-worker.js'])assert.match(readFileSync(new URL(path,import.meta.url),'utf8'),/src\/clinical\/dislipemia.mjs/);
});
