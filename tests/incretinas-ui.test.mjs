import test from 'node:test';
import assert from 'node:assert/strict';

test('biblioteca ofrece cinco productos y mantiene diferenciadas las vías de incretinas',async()=>{
 const handlers={};
 const app={innerHTML:'',addEventListener:(event,fn)=>handlers[event]=fn};
 globalThis.document={
   getElementById:(id)=>id==='app'?app:{textContent:''},
   querySelectorAll:()=>[]
 };
 globalThis.scrollTo=()=>{};
 globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,dataset={})=>handlers.click({
   target:{closest:()=>({dataset:{action,...dataset}})}
 });
 click('tools');
 const count=(app.innerHTML.match(/class="pharma-preview"/g)||[]).length;
 assert.equal(count,5);
 click('open-drug',{drugId:'semaglutida_ozempic',routeId:'dm2'});
 assert.match(app.innerHTML,/Ozempic/);
 assert.match(app.innerHTML,/Máximo: 2 mg\/semana/);
 assert.doesNotMatch(app.innerHTML,/Reevaluación del tratamiento en curso/);
 click('open-drug',{drugId:'semaglutida_wegovy_sc',routeId:'peso'});
 assert.match(app.innerHTML,/Wegovy/);
 assert.match(app.innerHTML,/7,2 mg/);
 assert.match(app.innerHTML,/NO incluye Wegovy en comprimidos/);
 click('open-drug',{drugId:'tirzepatida',routeId:'dm2'});
 assert.match(app.innerHTML,/Mounjaro/);
 click('drug-route',{routeId:'peso'});
 assert.match(app.innerHTML,/Control del peso en adultos/);
 assert.match(app.innerHTML,/15 mg\/semana/);
 click('followup');
 assert.match(app.innerHTML,/no tiene un calendario/);
 assert.doesNotMatch(app.innerHTML,/Registrar actuación confirmada/);
 click('start-module',{module:'obesidad'});
 click('module-mode',{mode:'detail'});
 handlers.input({target:{closest:()=>({dataset:{field:'imc'},value:'31',type:'number'})}});
 handlers.input({target:{closest:()=>({dataset:{field:'dm2'},value:'No',type:'select-one'})}});
 click('summary');
 assert.match(app.innerHTML,/Revisar tratamiento farmacológico del peso/);
 assert.match(app.innerHTML,/data-drug-id="tirzepatida" data-route-id="peso"/);
 assert.match(app.innerHTML,/data-drug-id="semaglutida_wegovy_sc" data-route-id="peso"/);
 assert.doesNotMatch(app.innerHTML,/data-drug-id="semaglutida_ozempic"/);
});
