import test from 'node:test';
import assert from 'node:assert/strict';

test('biblioteca incluye metformina y dapagliflozina; no hereda calendarios ajenos',async()=>{
  const handlers={};
  const root={innerHTML:'',addEventListener:(k,fn)=>handlers[k]=fn};
  globalThis.document={
    getElementById:id=>id==='app'?root:{textContent:''},
    querySelectorAll:()=>[]
  };
  globalThis.scrollTo=()=>{};
  globalThis.confirm=()=>true;
  await import('../src/app.mjs');
  const click=(action,dataset={})=>handlers.click({target:{closest:()=>({dataset:{action,...dataset}})}});
  click('tools');
  assert.equal((root.innerHTML.match(/class="pharma-preview"/g)||[]).length,7);
  click('open-drug',{drugId:'metformina',routeId:'dm2'});
  assert.match(root.innerHTML,/Metformina/);
  assert.match(root.innerHTML,/3.000 mg/); // referencia CIMA, no dosis personalizada
  click('open-drug',{drugId:'dapagliflozina',routeId:'ic'});
  assert.match(root.innerHTML,/Dapagliflozina/);
  assert.match(root.innerHTML,/10 mg/);
  assert.doesNotMatch(root.innerHTML,/Reevaluación del tratamiento en curso/);
  click('drug-route',{routeId:'erc'});
  assert.match(root.innerHTML,/Enfermedad renal crónica/);
  click('followup');
  assert.match(root.innerHTML,/no tiene un calendario/);
  assert.doesNotMatch(root.innerHTML,/Registrar actuación confirmada/);
});
