import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('consulta renal rápida y detallada accesible, conserva datos e invalida resultado al editar',async()=>{
 const handlers={};let removed=false;
 const root={innerHTML:'',addEventListener:(type,fn)=>handlers[type]=fn};
 globalThis.document={getElementById:id=>id==='app'?root:{textContent:'',remove(){removed=true}},querySelectorAll:()=>[]};
 globalThis.scrollTo=()=>{};globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,data={})=>handlers.click({target:{closest:()=>({dataset:{action,...data}})}});
 const set=(id,value)=>handlers.input({target:{closest:()=>({dataset:{field:id},value,type:'text'})}});
 click('start-module',{module:'erc'});
 assert.match(root.innerHTML,/Ver orientación renal/);
 set('tfge','29');click('renal-result');assert.match(root.innerHTML,/Seguridad, seguimiento y derivación renal/);
 set('cac','80');set('unidad_cac','mg/g');assert.equal(removed,true);
 click('module-mode',{mode:'detail'});assert.match(root.innerHTML,/Contexto renal/);assert.match(root.innerHTML,/Hematuria persistente/);
 assert.match(root.innerHTML,/value="29"/);
 click('renal-result');assert.match(root.innerHTML,/TFGe &lt;30/);
 assert.match(root.innerHTML,/IECA\/ARA-II actual/);
 for(const [id,value] of Object.entries({
  edad:'60',embarazo:'No procede',erc_contexto:'Adulto sin diálisis ni trasplante',
  farmacos_clases:'["IECA"]',farmacos:'Enalapril 10 mg al día',medicacion_revisada:'Sí',
  ras_evento:'Inicio administrado',ras_evento_confirmado:'Sí',fecha_ras_evento:'2026-10-20',
  fecha_evaluacion:'2026-11-12',situacion_aguda:'Estable sin proceso agudo grave',
  lra_sospecha:'No',ras_hipotension:'No',potasio:'4.5',fecha_potasio:'2026-11-05',
  creatinina_basal_ras:'1',fecha_creatinina_basal_ras:'2026-10-19'
 }))set(id,value);
 click('renal-result');assert.match(root.innerHTML,/2026-11-03 a 2026-11-17/);
 set('ras_evento_confirmado','No');click('renal-result');
 assert.doesNotMatch(root.innerHTML,/2026-11-03 a 2026-11-17/);
 click('module-mode',{mode:'review'});assert.match(root.innerHTML,/Seguridad, seguimiento y derivación renal/);
 click('start-module',{module:'dm2'});assert.doesNotMatch(root.innerHTML,/id="renal-result"/);
});
test('módulo renal disponible en servidor y recursos offline',()=>{
 for(const path of ['../server.mjs','../service-worker.js'])assert.match(readFileSync(new URL(path,import.meta.url),'utf8'),/src\/clinical\/renal.mjs/);
});
