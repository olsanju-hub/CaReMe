import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleFields} from '../src/consultas.mjs';
test('hígado rápido y detallado comparten datos; resultado se invalida al editar',async()=>{
 const handlers={};let removed=false;
 const root={innerHTML:'',addEventListener:(type,fn)=>handlers[type]=fn};
 globalThis.document={getElementById:id=>id==='app'?root:{textContent:'',remove(){removed=true}},querySelectorAll:()=>[]};
 globalThis.scrollTo=()=>{};globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,data={})=>handlers.click({target:{closest:()=>({dataset:{action,...data}})}});
 const set=(id,value)=>handlers.input({target:{closest:()=>({dataset:{field:id},value,type:'text'})}});
 assert.equal((root.innerHTML.match(/class="module-card"/g)||[]).length,6);
 click('start-module',{module:'hepatico'});
 for(const id of moduleFields('hepatico','quick'))assert.equal((root.innerHTML.match(new RegExp('data-field-id="'+id+'"','g'))||[]).length,1,id+' una vez');
 assert.match(root.innerHTML,/Elastografía disponible \(opcional\)/);
 const v={edad:'55',embarazo:'No procede',fecha_evaluacion:'2026-11-12',fib4_agudo:'No',masld_alarma:'No',masld_cirrosis:'No tras valoración',fib4_contexto:'Perfil de riesgo compatible con evaluación MASLD',hepatico_valoracion:'Esteatosis documentada y otras causas evaluadas',masld_alcohol:'Revisados',masld_etiologia:'Compatible con evaluación MASLD',masld_fib4_origen:'Informado por fuente externa',fib4_informado:'2.8',masld_fecha_fib4:'2026-11-10',masld_fuente_fib4:'Informe revisado',masld_fib4_confirmado:'Sí'};
 for(const [id,x] of Object.entries(v))set(id,x);
 click('masld-result');assert.match(root.innerHTML,/FIB-4 utilizado: 2.80/);assert.match(root.innerHTML,/sin esperar a disponer de VCTE/);
 set('edad','66');assert.equal(removed,true);click('masld-result');assert.doesNotMatch(root.innerHTML,/FIB-4 utilizado: 2.80/);
 set('masld_fib4_confirmado','Sí');click('masld-result');assert.match(root.innerHTML,/FIB-4 utilizado: 2.80/);
 click('module-mode',{mode:'detail'});assert.match(root.innerHTML,/value="2.8"/);assert.match(root.innerHTML,/data-field="ast"/);
 click('module-mode',{mode:'review'});assert.match(root.innerHTML,/Fibrosis hepática y derivación/);assert.doesNotMatch(root.innerHTML,/Aquí aparecerán situación/);
 click('summary');assert.match(root.innerHTML,/Fibrosis hepática y derivación/);assert.match(root.innerHTML,/La derivación propuesta no se considera enviada/);
});
test('servidor y caché incluyen MASLD',()=>{
 for(const path of ['../server.mjs','../service-worker.js'])assert.match(readFileSync(new URL(path,import.meta.url),'utf8'),/src\/clinical\/masld.mjs/);
});
