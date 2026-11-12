import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue} from '../src/model.mjs';
import {evaluateHeartFailure} from '../src/clinical/insuficiencia-cardiaca.mjs';
import {auditCrossDomain} from '../src/clinical/auditoria.mjs';
import {reviewDrug,getDrugRoute} from '../src/clinical/farmacologia.mjs';
import {readFileSync} from 'node:fs';
const make=(d={})=>Object.entries(d).reduce((x,[k,v])=>setValue(x,k,
 Array.isArray(v)?JSON.stringify(v):String(v)),createDraft());
const baseline={
 ic:'Sí',ic_sintomatica:'Sí',ic_fevigrupo:'Reducida · FEVI <50 %',
 fevi:'45',fecha_fevi:'2026-11-01',fecha_evaluacion:'2026-11-12',
 ic_estabilidad:'Estable evaluado',ic_alarma:['Sin señales de alarma tras valoración'],
 congestion:'Ausentes',situacion_aguda:'Estable sin proceso agudo grave',
 ic_descompensada:'No',lra_sospecha:'No',tfge:'25',fecha_tfge:'2026-11-09',
 potasio:'4.6',fecha_potasio:'2026-11-09',pas:'119',ic_fc:'71',
 farmacos_clases:['Sin tratamiento farmacológico'],medicacion_revisada:'Sí',
 alergias_revisadas:'Sí',embarazo:'No procede',addison:'No',
 cyp3a4_fuerte:'No',hepatica_grave:'No'
};
const get=update=>evaluateHeartFailure(make({...baseline,...update}),'detail');
const has=(x,id)=>x.options.some(o=>o.id===id);
test('FEVI 45, TFGe 25: vía específica CIMA de finerenona y no ARM esteroideo genérico',()=>{
 const r=get();
 assert.equal(r.state,'revision_pendiente');
 assert.ok(has(r,'HF-FINERENONE-CIMA-REVIEW'));
 assert.ok(!has(r,'HF-MRA-REVIEW'));
 assert.ok(r.options.find(o=>o.id==='HF-FINERENONE-CIMA-REVIEW').refs.includes('CIMA-FINERENONA'));
 assert.ok(r.options.every(o=>o.patientDose===null&&o.prescription===null&&!o.actionPerformed));
});
test('FEVI 40, TFGe 25, potasio 5: indicación de ficha condicionada con advertencia de laboratorio',()=>{
 const r=get({fevi:'40',potasio:'5'});
 assert.equal(r.state,'revision_pendiente');
 assert.ok(has(r,'HF-FINERENONE-CIMA-REVIEW'));
 assert.ok(!has(r,'HF-MRA-REVIEW'));
 assert.ok(r.options.find(o=>o.id==='HF-FINERENONE-CIMA-REVIEW')
   .checks.some(t=>t.includes('limítrofe')));
});
test('FEVI 39.9 con TFGe 25 no permite extrapolar finerenona FEVI >=40',()=>{
 const r=get({fevi:'39.9'});
 assert.ok(!has(r,'HF-FINERENONE-CIMA-REVIEW'));
});
test('TFGe 24.99 o K 5.01 bloquean ambos candidatos ARM',()=>{
 for(const data of [{tfge:'24.99'},{potasio:'5.01'}]){
  const r=get(data);
  assert.ok(!has(r,'HF-FINERENONE-CIMA-REVIEW'),JSON.stringify(data));
  assert.ok(!has(r,'HF-MRA-REVIEW'),JSON.stringify(data));
 }
});
test('con TFGe 30 y K 4.99 se usa referencia general sin duplicar opciones ARM',()=>{
 const r=get({tfge:'30',potasio:'4.99'});
 assert.ok(has(r,'HF-MRA-REVIEW'));
 assert.ok(!has(r,'HF-FINERENONE-CIMA-REVIEW'));
});
test('K exactamente 5 con FEVI 38 no genera indicación específica finerenona',()=>{
 const r=get({tfge:'55',potasio:'5',fevi:'38'});
 assert.ok(!has(r,'HF-MRA-REVIEW'));
 assert.ok(!has(r,'HF-FINERENONE-CIMA-REVIEW'));
});
test('Addison, CYP3A4 fuerte o hepatopatía no evaluada retienen la vía específica',()=>{
 for(const x of [
   {addison:'Sí'},{cyp3a4_fuerte:'Sí'},{hepatica_grave:'Sí'},
   {addison:''},{cyp3a4_fuerte:'No valorado'}
 ]){
  const r=get(x);
  assert.ok(!has(r,'HF-FINERENONE-CIMA-REVIEW'),JSON.stringify(x));
  assert.ok(r.checks.some(t=>t.includes('Addison')),JSON.stringify(x));
 }
});
test('ARM ya declarado evita segunda sugerencia de inicio de finerenona',()=>{
 const r=get({farmacos_clases:['ARM']});
 assert.ok(has(r,'HF-MRA-EXISTING'));
 assert.ok(!has(r,'HF-FINERENONE-CIMA-REVIEW'));
 assert.ok(!has(r,'HF-MRA-REVIEW'));
});
test('IC descompensada y potasio >=6 bloquean ruta aun cuando cumple FEVI y TFGe',()=>{
 for(const data of [
  {ic_descompensada:'Sí',situacion_aguda:'Enfermedad aguda grave'},
  {potasio:'6'}
 ]){
  const draft=make({...baseline,...data});
  const r=evaluateHeartFailure(draft,'detail');
  assert.equal(r.options.length,0);
  assert.equal(r.state,'seguridad_prioritaria');
  assert.equal(auditCrossDomain(draft).requiresResolution,true);
 }
});
test('reviewDrug no sustituye la indicación específica y preserva bloqueo por contraindicación',()=>{
 const d=make({...baseline,cyp3a4_fuerte:'Sí'});
 assert.equal(reviewDrug(d,'finerenona','ic_fevi40').state,'bloqueo');
 const r=evaluateHeartFailure(d,'detail');
 assert.ok(!has(r,'HF-FINERENONE-CIMA-REVIEW'));
});

test('el enlace de la tarjeta IC abre la indicación CIMA correcta sin prescribir',()=>{
 const route=getDrugRoute('finerenona','ic_fevi40');
 assert.ok(route);
 const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
 assert.ok(app.includes('data-action="open-drug" data-drug-id="finerenona" data-route-id="ic_fevi40"'));
 const decision=get();
 const card=decision.options.find(x=>x.id==='HF-FINERENONE-CIMA-REVIEW');
 assert.ok(card);
 assert.equal(card.actionPerformed,false);
 assert.equal(card.prescription,null);
});
