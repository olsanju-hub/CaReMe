import test from 'node:test';
import assert from 'node:assert/strict';

test('plan de verificación visible en herramientas y síntesis sin generar acciones',async()=>{
 const callbacks={};
 const root={innerHTML:'',addEventListener:(event,cb)=>callbacks[event]=cb};
 globalThis.document={
   getElementById:id=>id==='app'?root:{textContent:'',value:'',checked:false},
   querySelectorAll:()=>[]
 };
 globalThis.scrollTo=()=>{};
 globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,data={})=>callbacks.click({
   target:{closest:()=>({dataset:{action,...data}})}
 });
 click('tools');
 assert.match(root.innerHTML,/Plan de verificación clínica/);
 assert.match(root.innerHTML,/No se han generado controles nuevos/);
 assert.match(root.innerHTML,/no tratamientos iniciados|no tratamientos iniciados/i);
 click('start-module',{module:'erc'});
 click('module-mode',{mode:'detail'});
 assert.match(root.innerHTML,/type="date"/);
 assert.match(root.innerHTML,/Fecha de TFGe/);
 click('summary');
 assert.match(root.innerHTML,/Plan de verificación clínica/);
 assert.match(root.innerHTML,/no equivale a alta clínica|no tratamientos iniciados|Actuaciones registradas: 0/);
 click('home');
 click('new');
 click('summary');
 assert.match(root.innerHTML,/Actuaciones registradas: 0/);
});
