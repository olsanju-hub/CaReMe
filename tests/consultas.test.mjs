import test from 'node:test';
import assert from 'node:assert/strict';
import { MODULES, MODULE_BY_ID, EXTRA_FIELDS, moduleFields, readMulti } from '../src/consultas.mjs';
import { FIELDS, createDraft, setValue, setUnavailable, fieldState } from '../src/model.mjs';

test('existen seis consultas y todas ofrecen captura rápida y detallada', () => {
  assert.equal(MODULES.length,6);
  assert.deepEqual(MODULES.map(m=>m.id),['dm2','ic','erc','obesidad','hepatico','insulina']);
  for(const m of MODULES){
    assert.ok(moduleFields(m.id,'quick').length>=2,m.id+' sin rápida');
    assert.ok(moduleFields(m.id,'detail').length>=5,m.id+' sin detalle');
    for(const id of [...m.quick,...m.detail]) assert.ok(FIELDS[id],m.id+' sin campo '+id);
  }
});
test('datos compartidos no se duplican en la ficha', () => {
  const d=setValue(setValue(createDraft(),'tfge','54'),'hba1c','8.2');
  assert.equal(fieldState(d,'tfge'),'registrado');
  assert.ok(MODULE_BY_ID.dm2.detail.includes('tfge'));
  assert.ok(MODULE_BY_ID.erc.quick.includes('tfge'));
  assert.ok(MODULE_BY_ID.insulina.detail.includes('tfge'));
  assert.ok(MODULE_BY_ID.dm2.detail.includes('hba1c'));
  assert.ok(MODULE_BY_ID.insulina.detail.includes('hba1c'));
});
test('comorbilidades simultáneas y tratamiento múltiple', () => {
  const conditions=['Insuficiencia cardíaca','Enfermedad renal crónica','Obesidad'];
  const d=setValue(createDraft(),'dm_prioridad',JSON.stringify(conditions));
  assert.equal(fieldState(d,'dm_prioridad'),'registrado');
  assert.deepEqual(readMulti(d.values.dm_prioridad),conditions);
  const meds=setValue(d,'farmacos_clases',JSON.stringify(['Metformina','iSGLT2']));
  assert.equal(fieldState(meds,'farmacos_clases'),'registrado');
});
test('no disponible, inválido o exclusión incompatible', () => {
  let d=setUnavailable(createDraft(),'fevi',true);
  assert.equal(fieldState(d,'fevi'),'no_disponible');
  d=setValue(d,'fevi','101');
  assert.equal(fieldState(d,'fevi'),'revisar');
  d=setValue(d,'farmacos_clases',JSON.stringify(['Sin tratamiento farmacológico','Insulina']));
  assert.equal(fieldState(d,'farmacos_clases'),'revisar');
});
test('sin interpretación clínica automática', () => {
  const source=MODULES.map(m=>({id:m.id,quick:m.quick,detail:m.detail}));
  assert.equal(source.some(m=>!m.quick.length || !m.detail.length),false);
  assert.equal(EXTRA_FIELDS.some(f=>f.dose || f.recommendation),false);
});
test('rechaza módulos o modos inexistentes', () => {
  assert.throws(()=>moduleFields('missing','quick'));
  assert.throws(()=>moduleFields('dm2','unknown'));
});

test('navegación rápida / detallada / resumen conserva los datos capturados', async () => {
  const handlers={};
  const root={innerHTML:'',addEventListener:(name,fn)=>{handlers[name]=fn;}};
  globalThis.document={
    getElementById:(id)=>id==='app'?root:{textContent:''},
    querySelectorAll:()=>[]
  };
  globalThis.scrollTo=()=>{};
  globalThis.confirm=()=>true;
  await import('../src/app.mjs');
  assert.equal((root.innerHTML.match(/class="module-card"/g)||[]).length,8);
  const click=(action,details={})=>handlers.click({
    target:{closest:()=>({dataset:{action,...details}})}
  });
  click('start-module',{module:'dm2'});
  assert.ok(root.innerHTML.includes('Condicionantes clínicos presentes'));
  click('module-mode',{mode:'detail'});
  assert.ok(root.innerHTML.includes('Clases farmacológicas actuales'));
  handlers.input({target:{closest:()=>({dataset:{field:'hba1c'},value:'8.1',type:'number'})}});
  click('start-module',{module:'insulina'});
  click('module-mode',{mode:'detail'});
  assert.ok(root.innerHTML.includes('value="8.1"'), 'dato de HbA1c no compartido');
  click('module-mode',{mode:'review'});
  assert.ok(root.innerHTML.includes('INSULINIZACIÓN DM2'));
  assert.ok(root.innerHTML.includes('Información necesaria'));
  click('home');
  assert.ok(root.innerHTML.includes('Borrar datos para otro paciente'));
  click('new');
  assert.ok(root.innerHTML.includes('Elige la patología'));
  assert.ok(!root.innerHTML.includes('Borrar datos para otro paciente'));
});

