import test from 'node:test';
import assert from 'node:assert/strict';

test('IC rápida y detallada muestran valoración y mantienen valores entre módulos',async()=>{
 const handlers={};
 const root={innerHTML:'',addEventListener:(type,fn)=>handlers[type]=fn};
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
 click('start-module',{module:'ic'});
 assert.match(root.innerHTML,/Grupo de FEVI conocido \(ESC 2026\)/);
 assert.match(root.innerHTML,/Ver orientación de insuficiencia cardíaca/);
 set('ic','Sí');
 set('ic_fevigrupo','Reducida · FEVI <50 %');
 click('ic-result');
 assert.match(root.innerHTML,/Valoración por fenotipo y congestión/);
 assert.match(root.innerHTML,/Guía original en European Heart Journal/);
 click('module-mode',{mode:'detail'});
 assert.match(root.innerHTML,/FEVI registrada/);
 assert.match(root.innerHTML,/evidencia objetiva de IC/);
 assert.match(root.innerHTML,/Señales de alarma actuales/);
 click('ic-result');
 assert.match(root.innerHTML,/Datos clínicos necesarios/);
 assert.match(root.innerHTML,/Sin candidatos de inicio/);
 click('module-mode',{mode:'review'});
 assert.match(root.innerHTML,/Resumen de captura/);
 assert.match(root.innerHTML,/Valoración por fenotipo y congestión/);
 click('start-module',{module:'erc'});
 assert.doesNotMatch(root.innerHTML,/id="ic-result"/);
});
test('el módulo conserva salida no prescriptiva e invalida resultados al editar la ficha',async()=>{
 const {readFileSync}=await import('node:fs');
 const s=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
 assert.match(s,/if\(current\.icVisible\)/);
 assert.match(s,/current\.icVisible=false/);
 assert.match(s,/data-action="ic-result"/);
 assert.match(s,/Fuentes ESC y fichas CIMA/);
});

