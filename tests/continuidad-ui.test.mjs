import test from 'node:test';
import assert from 'node:assert/strict';

test('actuación requiere confirmación; solo entonces aparece control, borrado retira historial',async()=>{
  const handlers={};
  const app={innerHTML:'',addEventListener:(name,callback)=>handlers[name]=callback};
  const state={
    'action-type':{value:'inicio'},
    'action-date':{value:'2020-01-15'},
    'action-dose':{value:'10'},
    'action-confirm':{checked:false}
  };
  globalThis.document={
    getElementById:(id)=>id==='app'?app:state[id] || {textContent:''},
    querySelectorAll:()=>[]
  };
  globalThis.scrollTo=()=>{};
  globalThis.confirm=()=>true;
  await import('../src/app.mjs');
  const click=(action,details={})=>handlers.click({target:{closest:()=>({dataset:{action,...details}})}});
  click('tools');
  click('open-drug',{drugId:'finerenona',routeId:'erc_dm2'});
  click('followup');
  assert.match(app.innerHTML,/No hay actuaciones confirmadas/);
  click('confirm-med-action');
  assert.match(app.innerHTML,/Debes confirmar la actuación/);
  state['action-confirm'].checked=true;
  click('confirm-med-action');
  assert.match(app.innerHTML,/2020-01-15/);
  assert.match(app.innerHTML,/2020-02-12/);
  assert.match(app.innerHTML,/10 mg\/día/);
  click('home');
  click('new');
  click('tools');
  click('open-drug',{drugId:'finerenona',routeId:'erc_dm2'});
  click('followup');
  assert.match(app.innerHTML,/No hay actuaciones confirmadas/);
  assert.doesNotMatch(app.innerHTML,/2020-02-12/);
});
