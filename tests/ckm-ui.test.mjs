import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('CKM: acceso, datos compartidos y resultado invalidado tras editar',async()=>{
 const handlers={};let removed=false;
 const root={innerHTML:'',addEventListener:(type,fn)=>handlers[type]=fn};
 globalThis.document={getElementById:id=>id==='app'?root:{textContent:'',remove(){removed=true}},querySelectorAll:()=>[]};
 globalThis.scrollTo=()=>{};globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,data={})=>handlers.click({target:{closest:()=>({dataset:{action,...data}})}});
 const set=(id,value)=>handlers.input({target:{closest:()=>({dataset:{field:id},value,type:'text'})}});
 assert.equal((root.innerHTML.match(/class="module-card"/g)||[]).length,6);
 click('ckm');click('ckm-result');assert.match(root.innerHTML,/Estadio CKM no evaluable/);
 for(const [id,value] of Object.entries({edad:'50',embarazo:'No procede',dm1:'No',fecha_evaluacion:'2026-11-12',
 ckm_evaluacion_confirmada:'Sí',ckm_cvd:'No identificada tras revisión',ecv:'No',ic:'No',
 ckm_subclinica:'No identificada en evaluación disponible',ckm_prevent:'No identificado tras revisión',
 dm2:'Sí',lra_sospecha:'No',situacion_aguda:'Estable sin proceso agudo grave'}))set(id,value);
 click('ckm-result');assert.match(root.innerHTML,/Estadio CKM 2 · para revisión/);
 set('ckm_subclinica','No valorada');assert.equal(removed,true);click('ckm-result');
 assert.match(root.innerHTML,/al menos estadio 2/);assert.doesNotMatch(root.innerHTML,/Estadio CKM 2 · para revisión/);
 click('summary');assert.match(root.innerHTML,/Al menos estadio 2 documentado/);
 click('start-module',{module:'dm2'});click('module-mode',{mode:'detail'});assert.match(root.innerHTML,/value="50"/);
});
test('CKM incluido en lista permitida del servidor y caché estática',()=>{
 for(const path of ['../server.mjs','../service-worker.js'])assert.match(readFileSync(new URL(path,import.meta.url),'utf8'),/src\/clinical\/ckm.mjs/);
});
