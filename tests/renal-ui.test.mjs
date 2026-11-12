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
 click('module-mode',{mode:'review'});assert.match(root.innerHTML,/Seguridad, seguimiento y derivación renal/);
 click('start-module',{module:'dm2'});assert.doesNotMatch(root.innerHTML,/id="renal-result"/);
});
test('módulo renal disponible en servidor y recursos offline',()=>{
 for(const path of ['../server.mjs','../service-worker.js'])assert.match(readFileSync(new URL(path,import.meta.url),'utf8'),/src\/clinical\/renal.mjs/);
});
