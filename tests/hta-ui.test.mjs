import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('HTA conserva seis consultas, comparte PA y retira resultado tras editar',async()=>{
 const handlers={};let removed=false;
 const root={innerHTML:'',addEventListener:(type,fn)=>handlers[type]=fn};
 globalThis.document={getElementById:id=>id==='app'?root:{textContent:'',remove(){removed=true}},querySelectorAll:()=>[]};
 globalThis.scrollTo=()=>{};globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,data={})=>handlers.click({target:{closest:()=>({dataset:{action,...data}})}});
 const set=(id,value)=>handlers.input({target:{closest:()=>({dataset:{field:id},value,type:'text'})}});
 assert.equal((root.innerHTML.match(/class="module-card"/g)||[]).length,8);
 click('hta');assert.equal((root.innerHTML.match(/class="field module-field"/g)||[]).length,4);click('brief-advanced');assert.match(root.innerHTML,/Datos iniciales/);assert.match(root.innerHTML,/AMPA\/MAPA/);
 set('pas','180');click('hta-result');assert.match(root.innerHTML,/valorar daño agudo/);
 set('pas','150');assert.equal(removed,true);click('hta-result');assert.doesNotMatch(root.innerHTML,/PA aportada ≥180/);
 click('start-module',{module:'ic'});click('module-mode',{mode:'detail'});assert.match(root.innerHTML,/value="150"/);
 click('summary');assert.match(root.innerHTML,/Ver confirmación y objetivos/);
});
test('servidor y caché incluyen HTA',()=>{
 for(const path of ['../server.mjs','../service-worker.js'])assert.match(readFileSync(new URL(path,import.meta.url),'utf8'),/src\/clinical\/hta.mjs/);
});
