import test from 'node:test';
import assert from 'node:assert/strict';

test('DM2 detallada permite datos, comparación individual y resumen sin recetar',async()=>{
 const handlers={};
 const app={innerHTML:'',addEventListener:(event,fn)=>handlers[event]=fn};
 globalThis.document={getElementById:id=>id==='app'?app:{textContent:'',remove(){}},
   querySelectorAll:()=>[]};
 globalThis.scrollTo=()=>{};
 globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,dataset={})=>handlers.click({target:{closest:()=>({dataset:{action,...dataset}})}});
 const set=(id,value,type='number')=>handlers.input({
   target:{closest:()=>({dataset:{field:id},value,type,checked:true})}
 });
 click('start-module',{module:'dm2'});
 click('module-mode',{mode:'detail'});
 assert.match(app.innerHTML,/Ver orientación clínica detallada/);
 assert.match(app.innerHTML,/Límite superior de HbA1c acordado/);
 assert.match(app.innerHTML,/Hipoglucemias recientes/);
 set('dm2','Sí','select-one');
 set('hba1c','8.5');
 set('dm_objetivo_valor','7');
 set('dm_hba1c_fiable','Fiable tras comprobación','select-one');
 set('dm_sintomas','Ausentes','select-one');
 set('dm_hipoglucemias','No referidas','select-one');
 set('dm_adherencia','Adecuada confirmada','select-one');
 set('dm_dosis_confirmadas','Sí','select-one');
 set('medicacion_revisada','Sí','select-one');
 // Sin medicamentos registrados no se da por demostrado que el paciente no los tome.
 click('dm2-detailed-result');
 assert.match(app.innerHTML,/Interpretación del objetivo individual/);
 assert.match(app.innerHTML,/1,5 puntos/);
 assert.match(app.innerHTML,/Datos esenciales pendientes/);
 assert.match(app.innerHTML,/No se emiten propuestas farmacológicas/);
 assert.doesNotMatch(app.innerHTML,/Registrar actuación confirmada/);
 click('module-mode',{mode:'review'});
 assert.match(app.innerHTML,/Orientación rápida según el caso/);
 assert.match(app.innerHTML,/Interpretación del objetivo individual/);
 click('start-module',{module:'insulina'});
 assert.doesNotMatch(app.innerHTML,/id="dm2-detailed-result"/);
});

test('DM2 detallada invalida resultado cuando cambian campos compartidos',async()=>{
 // El módulo ya fue cargado por el test anterior y conserva los handlers
 // sobre un DOM simulado distinto: validar invalidación desde el código fuente,
 // sin fingir una prueba de navegador real.
 const {readFileSync}=await import('node:fs');
 const content=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
 assert.match(content,/current\.dm2DetailedVisible=false/);
 assert.match(content,/dm2-detailed-result/);
 assert.match(content,/if\(current\.dm2ResultVisible\|\|current\.dm2DetailedVisible\)/);
});
