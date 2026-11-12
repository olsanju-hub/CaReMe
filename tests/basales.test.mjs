import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft, setValue } from '../src/model.mjs';
import { DRUGS, getDrugRoute, reviewDrug } from '../src/clinical/farmacologia.mjs';
import { metforminRenalCeiling } from '../src/clinical/basales.mjs';
import { confirmedAction } from '../src/clinical/continuidad.mjs';

const draft=(v={})=>Object.entries(v).reduce((d,[k,x])=>
  setValue(d,k,Array.isArray(x)?JSON.stringify(x):String(x)),createDraft());
const base={edad:'65',dm2:'Sí',ic:'Sí',ic_sintomatica:'Sí',erc:'Sí',persistencia:'Sí',
  tfge:'75',embarazo:'No procede',alergias_revisadas:'Sí',medicacion_revisada:'Sí',
  farmacos_clases:['Sin tratamiento farmacológico'],situacion_aguda:'Estable sin proceso agudo grave',
  cetoacidosis_sospecha:'No',dm1:'No',deshidratacion_gi:'No',
  acidosis_metabolica:'No',hipoxia_tisular:'No',ic_descompensada:'No',
  insuficiencia_hepatica:'No',lra_sospecha:'No',contraste_yodado:'No',cirugia_anestesia:'No'};
const review=(drug,route,extra={})=>reviewDrug(draft({...base,...extra}),drug,route);
test('fichas y vías CIMA diferenciadas; sin indicación cardiaca o renal para metformina',()=>{
 assert.equal(DRUGS.metformina.routes.length,1);
 assert.equal(DRUGS.dapagliflozina.routes.length,3);
 assert.equal(getDrugRoute('metformina','ic'),null);
 for(const d of [DRUGS.metformina,DRUGS.dapagliflozina]){
  assert.equal(d.source.authority,'CIMA-AEMPS');
  assert.equal(d.source.reviewed,'2026-11-12');
  assert.ok(d.source.url.startsWith('https://cima.aemps.es/cima/dochtml/ft/'));
 }
});
test('límites renales exactos metformina 30,45,60,90',()=>{
 const cases=[[29.99,null],[30,1000],[44.99,1000],[45,2000],[59.99,2000],
  [60,3000],[89.99,3000],[90,3000]];
 for(const [egfr,expected] of cases){
  const ceiling=metforminRenalCeiling(egfr);
  assert.equal(ceiling?.maxMgPerDay,expected,String(egfr));
  const x=review('metformina','dm2',{tfge:String(egfr)});
  assert.equal(x.renalReference?.maxMgPerDay,expected);
  assert.equal(x.state,egfr<30?'bloqueo':'revision_pendiente');
  assert.equal(x.patientDose,null);
  assert.equal(x.prescription,null);
 }
 assert.equal(metforminRenalCeiling(null),null);
 assert.equal(metforminRenalCeiling(Infinity),null);
 assert.equal(review('metformina','dm2',{tfge:''}).state,'datos_insuficientes');
});
test('metformina: evitar declarar ajuste de dosis individual desde máxima de ficha',()=>{
 const x=review('metformina','dm2',{tfge:'39'});
 assert.equal(x.renalReference.maxMgPerDay,1000);
 assert.equal(x.patientDose,null);
 assert.ok(x.checks.some(t=>t.includes('acidosis láctica')));
 assert.match(x.notice,/no es una prescripción/);
});
test('metformina: acidosis, hipoxia, insuficiencia hepática, IC descompensada y LRA bloquean inicio',()=>{
 for(const field of ['acidosis_metabolica','hipoxia_tisular','insuficiencia_hepatica',
   'ic_descompensada','lra_sospecha','deshidratacion_gi']){
   const x=review('metformina','dm2',{[field]:'Sí'});
   assert.equal(x.state,'bloqueo',field);
   assert.ok(x.blocked.length>0);
 }
 assert.equal(review('metformina','dm2',{situacion_aguda:'Enfermedad aguda grave'}).state,'bloqueo');
});
test('metformina: contraste yodado y anestesia requieren pausa y revisión, sin registrarla como realizada',()=>{
 const contrast=review('metformina','dm2',{contraste_yodado:'Sí'});
 assert.equal(contrast.state,'bloqueo');
 assert.ok(contrast.blocked.some(x=>x.includes('≥48 h')));
 const surgery=review('metformina','dm2',{cirugia_anestesia:'Sí'});
 assert.equal(surgery.state,'bloqueo');
 assert.ok(surgery.blocked.some(x=>x.includes('anestesia')));
 assert.equal(surgery.prescription,null);
});
test('dapagliflozina: exactamente 10 mg/día en DM2, IC y ERC, sin titulación renal automática',()=>{
 const drug=DRUGS.dapagliflozina;
 for(const r of drug.routes){
  const t=r.labelDoses.join(' ');
  assert.match(t,/10 mg/);
  assert.doesNotMatch(t,/25 mg/);
  const x=review('dapagliflozina',r.id);
  assert.equal(x.state,'revision_pendiente');
  assert.equal(x.patientDose,null);
 }
});
test('dapagliflozina: TFG 24.99 bloquea inicio; 25 no, y 45 cambia solo advertencia glucémica',()=>{
 for(const r of ['dm2','ic','erc']){
  assert.equal(review('dapagliflozina',r,{tfge:'24.99'}).state,'bloqueo');
  assert.equal(review('dapagliflozina',r,{tfge:'25'}).state,'revision_pendiente');
 }
 const x=review('dapagliflozina','dm2',{tfge:'44.99'});
 assert.ok(x.checks.some(t=>t.includes('eficacia hipoglucemiante')));
 const y=review('dapagliflozina','dm2',{tfge:'45'});
 assert.ok(!y.checks.some(t=>t.includes('eficacia hipoglucemiante')));
});
test('dapagliflozina: no iniciar ante DM1, CAD, enfermedad aguda o depleción de volumen',()=>{
 for(const data of [
  {dm1:'Sí'},{cetoacidosis_sospecha:'Sí'},{situacion_aguda:'Enfermedad aguda grave'},
  {situacion_aguda:'Cirugía mayor o ayuno prolongado'},{deshidratacion_gi:'Sí'}]){
  const x=review('dapagliflozina','dm2',data);
  assert.equal(x.state,'bloqueo',JSON.stringify(data));
 }
});
test('dapagliflozina: insuficiencia hepática grave impide aplicar pauta de inicio de 10 mg sin revisión',()=>{
 const x=review('dapagliflozina','ic',{hepatica_grave:'Sí'});
 assert.equal(x.state,'bloqueo');
 assert.ok(x.blocked.some(t=>t.includes('5 mg')));
});
test('dapagliflozina: evitar duplicar iSGLT2 y revisar insulina/sulfonilurea',()=>{
 const x=review('dapagliflozina','ic',{farmacos_clases:['iSGLT2']});
 assert.equal(x.state,'bloqueo');
 const y=review('dapagliflozina','dm2',{farmacos_clases:['Insulina','Sulfonilurea']});
 assert.ok(y.checks.some(t=>t.includes('hipoglucemia')));
});
test('metformina requiere DM2; dapagliflozina sí admite ERC/IC sin DM2',()=>{
 assert.equal(review('metformina','dm2',{dm2:'No'}).state,'bloqueo');
 assert.equal(review('dapagliflozina','ic',{dm2:'No'}).state,'revision_pendiente');
 assert.equal(review('dapagliflozina','erc',{dm2:'No'}).state,'revision_pendiente');
 assert.equal(review('dapagliflozina','ic',{ic_sintomatica:'No'}).state,'bloqueo');
 assert.equal(review('dapagliflozina','erc',{persistencia:'No'}).state,'bloqueo');
});
test('no crear calendario con los nuevos fármacos sin reglas específicas',()=>{
 for(const drugId of ['dapagliflozina','metformina']){
  assert.throws(()=>confirmedAction([],{drugId,routeId:drugId==='metformina'?'dm2':'erc',
   type:'inicio',performedOn:'2026-11-12',doseMg:10,confirmedByClinician:true}),
  /Seguimiento automatizado aún no definido/);
 }
});
