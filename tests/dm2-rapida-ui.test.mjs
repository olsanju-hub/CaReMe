import test from 'node:test';
import assert from 'node:assert/strict';

test('consulta DM2 rápida muestra orientación propia y fuentes en lugar de solo resumen',async()=>{
 const handlers={};
 const selected={dm_prioridad:[{value:'Insuficiencia cardíaca'}]};
 const root={innerHTML:'',addEventListener:(event,cb)=>handlers[event]=cb};
 const other={textContent:'',remove:()=>{}};
 globalThis.document={
   getElementById:id=>id==='app'?root:other,
   querySelectorAll:selector=>{
     const id=selector.match(/^input\[data-field="([^"]+)"\]:checked$/)?.[1];
     return id?(selected[id]||[]):[];
   }
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
 click('start-module',{module:'dm2'});
 assert.match(root.innerHTML,/Consulta rápida/);
 assert.match(root.innerHTML,/Ver orientación clínica rápida/);
 set('dm_prioridad','Insuficiencia cardíaca','checkbox');
 set('dm_control','En el objetivo individual');
 click('dm2-result');
 assert.match(root.innerHTML,/Orientación rápida según el caso/);
 assert.match(root.innerHTML,/Clases farmacológicas y opciones/);
 assert.match(root.innerHTML,/Fundación redGDPS/);
 assert.match(root.innerHTML,/revisión|Revisión/);
 click('module-mode',{mode:'review'});
 assert.match(root.innerHTML,/Orientación rápida según el caso/);
 assert.match(root.innerHTML,/Resumen de captura/);
 click('start-module',{module:'insulina'});
 assert.doesNotMatch(root.innerHTML,/id="dm2-rapid-result"/);
});
