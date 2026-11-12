import test from 'node:test';
import assert from 'node:assert/strict';
import { DRUGS, getDrug, getDrugRoute, reviewDrug } from '../src/clinical/farmacologia.mjs';
import { createDraft,setValue } from '../src/model.mjs';

const draft=(values={})=>Object.entries(values).reduce((d,[id,v])=>
  setValue(d,id,Array.isArray(v)?JSON.stringify(v):String(v)),createDraft());

const base={
  edad: '65', tfge:'55', potasio:'4.5', cac:'120',unidad_cac:'mg/g', dm2:'Sí',
  ic:'Sí',ic_sintomatica:'Sí',fevi:'50',erc:'Sí',persistencia:'Sí',
  situacion_aguda:'Estable sin proceso agudo grave',cetoacidosis_sospecha:'No',
  dm1:'No', cyp3a4_fuerte:'No',addison:'No',hepatica_grave:'No',embarazo:'No procede',
  alergias_revisadas:'Sí',medicacion_revisada:'Sí',farmacos_clases:['Metformina']
};
test('siete productos con fichas CIMA diferenciadas por indicación',()=>{
  assert.deepEqual(Object.keys(DRUGS),['empagliflozina','finerenona','semaglutida_ozempic','semaglutida_wegovy_sc','tirzepatida','metformina','dapagliflozina']);
  assert.equal(getDrug('empagliflozina').routes.length,3);
  assert.equal(getDrug('finerenona').routes.length,2);
  for(const d of Object.values(DRUGS)) {
    assert.ok(d.source.url.startsWith('https://cima.aemps.es/cima/'));
    assert.ok(['2026-11-11','2026-11-12'].includes(d.source.reviewed));
  }
  assert.equal(getDrug('invalid'),null);
  assert.equal(getDrugRoute('finerenona','invalid'),null);
  assert.throws(()=>reviewDrug(draft(base),'finerenona','invalid'));
});
test('la dosis de ficha técnica no se convierte en una receta',()=>{
  for(const drug of Object.values(DRUGS)) {
    for(const route of drug.routes) {
      const x=reviewDrug(draft(base),drug.id,route.id);
      assert.equal(x.patientDose,null);
      assert.equal(x.prescription,null);
      assert.ok(['bloqueo','datos_insuficientes','revision_pendiente'].includes(x.state));
      assert.ok(x.labelDoses.length>0);
      assert.ok(x.monitoring.length>0);
    }
  }
});
test('empagliflozina: 10 mg para IC y ERC, 25 mg restringido a DM2',()=>{
  const d=getDrug('empagliflozina');
  assert.match(d.routes.find(r=>r.id==='dm2').labelDoses.join(' '),/25 mg/);
  for(const route of d.routes.filter(r=>r.id!=='dm2')) {
    assert.match(route.labelDoses.join(' '),/10 mg/);
    assert.doesNotMatch(route.labelDoses.join(' '),/25 mg/);
  }
});
test('empagliflozina: TFGe <20 bloquea, 20 no bloquea por filtrado',()=>{
  const x=reviewDrug(draft({...base,tfge:'19.9'}),'empagliflozina','erc');
  assert.equal(x.state,'bloqueo');
  assert.ok(x.blocked.some(s=>s.includes('TFGe <20')));
  const y=reviewDrug(draft({...base,tfge:'20'}),'empagliflozina','erc');
  assert.equal(y.state,'revision_pendiente');
  assert.equal(y.patientDose,null);
});
test('empagliflozina: cetoacidosis/DM1/proceso agudo bloquean ruta',()=>{
  for(const v of [
    {dm1:'Sí'}, {cetoacidosis_sospecha:'Sí'},
    {situacion_aguda:'Cirugía mayor o ayuno prolongado'},
    {situacion_aguda:'Enfermedad aguda grave'}
  ]) {
    const x=reviewDrug(draft({...base,...v}),'empagliflozina','dm2');
    assert.equal(x.state,'bloqueo');
  }
});
test('finerenona: separa objetivo máximo de ERC-DM2 (20) de IC FEVI>=40 (40)',()=>{
  const d=getDrug('finerenona');
  const renal=d.routes.find(r=>r.id==='erc_dm2').labelDoses.join(' ');
  const hf=d.routes.find(r=>r.id==='ic_fevi40').labelDoses.join(' ');
  assert.match(renal,/máxima.*20 mg/i);
  assert.doesNotMatch(renal,/40 mg/);
  assert.match(hf,/40 mg/);
  assert.match(hf,/20 mg/);
});
test('finerenona: TFGe 25 y K 5,0 son puntos límite de FT',()=>{
  const allowed=reviewDrug(draft({...base,tfge:'25',potasio:'5.0'}),'finerenona','erc_dm2');
  assert.equal(allowed.state,'revision_pendiente');
  assert.ok(allowed.checks.some(s=>s.includes('monitorización adicional')));
  const below=reviewDrug(draft({...base,tfge:'24.99'}),'finerenona','erc_dm2');
  assert.equal(below.state,'bloqueo');
  const above=reviewDrug(draft({...base,potasio:'5.01'}),'finerenona','erc_dm2');
  assert.equal(above.state,'bloqueo');
  assert.ok(above.blocked.some(s=>s.includes('potasio >5,0')));
});
test('finerenona: contraindicación CYP3A4 potente y Addison',()=>{
  for(const v of [{cyp3a4_fuerte:'Sí'}, {addison:'Sí'},
    {hepatica_grave:'Sí'}, {farmacos_clases:['ARM']}]) {
    const x=reviewDrug(draft({...base,...v}),'finerenona','erc_dm2');
    assert.equal(x.state,'bloqueo');
  }
});
test('finerenona: FEVI de 39,9 está fuera de la vía IC, 40 no',()=>{
  const blocked=reviewDrug(draft({...base,fevi:'39.9'}),'finerenona','ic_fevi40');
  assert.equal(blocked.state,'bloqueo');
  const forty=reviewDrug(draft({...base,fevi:'40'}),'finerenona','ic_fevi40');
  assert.equal(forty.state,'revision_pendiente');
  assert.equal(forty.patientDose,null);
});
test('finerenona: indicación renal y FEVI no se mezclan',()=>{
  const noDm2=reviewDrug(draft({...base,dm2:'No'}),'finerenona','erc_dm2');
  assert.equal(noDm2.state,'bloqueo');
  const hfNoDm2=reviewDrug(draft({...base,dm2:'No'}),'finerenona','ic_fevi40');
  assert.equal(hfNoDm2.state,'revision_pendiente');
  const hfNo=reviewDrug(draft({...base,ic_sintomatica:'No'}),'finerenona','ic_fevi40');
  assert.equal(hfNo.state,'bloqueo');
});
test('no se infieren contraindicaciones negativas ni potasio/TFGe normales con datos ausentes',()=>{
  const emp=reviewDrug(draft({edad:65,dm2:'Sí'}),'empagliflozina','dm2');
  assert.equal(emp.state,'datos_insuficientes');
  assert.ok(emp.checks.some(s=>s.includes('tipo 1')));
  const fin=reviewDrug(draft({edad:65,dm2:'Sí',erc:'Sí',persistencia:'Sí',cac:'100',unidad_cac:'mg/g'}),'finerenona','erc_dm2');
  assert.equal(fin.state,'datos_insuficientes');
  assert.ok(fin.missing.some(s=>s.includes('Potasio')));
  assert.ok(fin.missing.some(s=>s.includes('TFGe')));
  assert.equal(fin.patientDose,null);
});
test('paciente sin indicación explícita no recibe estatus positivo',()=>{
  const d=draft({...base,dm2:'No',ic:'No',ic_sintomatica:'No',erc:'No',persistencia:'No'});
  assert.equal(reviewDrug(d,'empagliflozina','dm2').state,'bloqueo');
  assert.equal(reviewDrug(d,'finerenona','ic_fevi40').state,'bloqueo');
});
