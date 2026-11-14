import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('rutas rápidas y detalladas de insulina muestran resultado sin prescripción',async()=>{
 const handlers={};
 const root={innerHTML:'',addEventListener:(event,cb)=>handlers[event]=cb};
 globalThis.document={
  getElementById:id=>id==='app'?root:{textContent:'',remove(){}},
  querySelectorAll:()=>[]
 };
 globalThis.scrollTo=()=>{};
 globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,data={})=>handlers.click({
  target:{closest:()=>({dataset:{action,...data}})}
 });
 const set=(id,value,type='select-one')=>handlers.input({
  target:{closest:()=>({dataset:{field:id},value,type,checked:true})}
 });
 click('start-module',{module:'insulina'});
 assert.match(root.innerHTML,/Situación de insulinización/);
 assert.match(root.innerHTML,/Ver orientación de insulinización/);
 set('insulina_fase','Valorar inicio');
 click('insulin-result');
 assert.match(root.innerHTML,/Insulinización: siguiente decisión/);
 assert.match(root.innerHTML,/Para precisar esta rama/);
 assert.match(root.innerHTML,/ADA\/EASD/);
 assert.doesNotMatch(root.innerHTML,/Iniciar tratamiento confirmado/);
 click('module-mode',{mode:'detail'});
 assert.match(root.innerHTML,/Esquema de insulina realmente administrado/);
 assert.match(root.innerHTML,/Glucemia en ayunas respecto al objetivo individual/);
 assert.match(root.innerHTML,/Motivo para valorar desintensificación/);
 click('insulin-result');
 assert.match(root.innerHTML,/Insulina basal actual/);
 assert.match(root.innerHTML,/No se propone iniciar, ajustar ni retirar insulina/);
 click('module-mode',{mode:'review'});
 assert.match(root.innerHTML,/INSULINIZACIÓN DM2/);
 assert.match(root.innerHTML,/Resumen de captura/);
 click('start-module',{module:'dm2'});
 assert.doesNotMatch(root.innerHTML,/id="insulin-result"/);
});
test('resultado de insulina se invalida al editar campos compartidos',()=>{
 const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
 assert.match(app,/if\(current\.insulinVisible\)/);
 assert.match(app,/current\.insulinVisible=false/);
 assert.match(app,/id="insulin-result"/);
});

