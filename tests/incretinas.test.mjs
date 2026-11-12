import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft,setValue } from '../src/model.mjs';
import { DRUGS,reviewDrug,getDrugRoute } from '../src/clinical/farmacologia.mjs';
import { reviewIncretinDrug,INCRETIN_DRUGS } from '../src/clinical/incretinas.mjs';
import { confirmedAction } from '../src/clinical/continuidad.mjs';
const draft=(v={})=>Object.entries(v).reduce((d,[k,x])=>
  setValue(d,k,Array.isArray(x)?JSON.stringify(x):String(x)),createDraft());
const base={
  edad:'52',tfge:'65',imc:'31',imc_inicio:'31',dm2:'Sí',
  comorbilidad_peso_confirmada:'Sí',
  embarazo:'No procede',embarazo_planificado:'No procede',
  pancreatitis_sospecha:'No',pancreatitis_previa:'No',
  deshidratacion_gi:'No',gastroparesia_grave:'No',retinopatia_dm:'No',
  vision_subita:'No',alergias_revisadas:'Sí',medicacion_revisada:'Sí',
  farmacos_clases:['Metformina'],situacion_aguda:'Estable sin proceso agudo grave'
};
const review=(id,routeId,values={})=>reviewDrug(draft({...base,...values}),id,routeId);
const blocked=(x,term)=>x.blocked.some(s=>s.includes(term));

test('tres productos inyectables diferentes; dos son semaglutida pero con indicaciones y fichas separadas',()=>{
 assert.equal(Object.keys(INCRETIN_DRUGS).length,3);
 assert.equal(DRUGS.semaglutida_ozempic.generic,'Semaglutida');
 assert.equal(DRUGS.semaglutida_wegovy_sc.generic,'Semaglutida');
 assert.notEqual(DRUGS.semaglutida_ozempic.source.url,DRUGS.semaglutida_wegovy_sc.source.url);
 assert.equal(getDrugRoute('semaglutida_ozempic','peso'),null);
 assert.equal(getDrugRoute('semaglutida_wegovy_sc','dm2'),null);
 assert.equal(getDrugRoute('tirzepatida','peso').id,'peso');
 for(const drug of Object.values(INCRETIN_DRUGS)) {
   assert.equal(drug.source.authority,'CIMA-AEMPS');
   assert.equal(drug.source.reviewed,'2026-11-12');
   assert.ok(drug.source.url.startsWith('https://cima.aemps.es/cima/dochtml/ft/'));
 }
});
test('dosis de Ozempic 0,25→0,5→1→2 mg; no 2,4 ni 7,2 ni Wegovy oral',()=>{
 const t=DRUGS.semaglutida_ozempic.routes[0].labelDoses.join(' ');
 for(const dose of ['0,25','0,5','1 mg','2 mg'])assert.ok(t.includes(dose));
 assert.doesNotMatch(t,/2,4 mg|7,2 mg/);
 const r=review('semaglutida_ozempic','dm2');
 assert.equal(r.state,'revision_pendiente');
 assert.equal(r.patientDose,null);assert.equal(r.prescription,null);
});
test('Wegovy subcutáneo tiene vía peso, escalada a 2,4 y condición estricta de 7,2',()=>{
 const t=DRUGS.semaglutida_wegovy_sc.routes[0].labelDoses.join(' ');
 assert.match(t,/2,4 mg/);assert.match(t,/7,2 mg/);
 assert.match(t,/IMC ≥30 al inicio/);
 assert.match(t,/≥4 semanas/);
 assert.match(t,/NO incluye Wegovy en comprimidos/);
});
test('Mounjaro distingue DM2 y peso con techo adulto de 15 mg',()=>{
 const d=DRUGS.tirzepatida;
 assert.deepEqual(d.routes.map(x=>x.id),['dm2','peso']);
 for(const route of d.routes){
   const t=route.labelDoses.join(' ');
   assert.match(t,/2,5 mg/);assert.match(t,/15 mg/);
   assert.match(t,/4 semanas/);
 }
});
test('función renal: Wegovy inyectable <30 no recomendado; Ozempic y tirzepatida no comparten ese bloqueo',()=>{
 assert.equal(review('semaglutida_wegovy_sc','peso',{tfge:'29.9'}).state,'bloqueo');
 assert.ok(blocked(review('semaglutida_wegovy_sc','peso',{tfge:'29.9'}),'TFGe <30'));
 assert.equal(review('semaglutida_wegovy_sc','peso',{tfge:'30'}).state,'revision_pendiente');
 assert.equal(review('semaglutida_ozempic','dm2',{tfge:'29.9'}).state,'revision_pendiente');
 assert.equal(review('tirzepatida','peso',{tfge:'29.9'}).state,'revision_pendiente');
 assert.ok(review('tirzepatida','peso',{tfge:'29.9'}).checks.some(x=>x.includes('experiencia es limitada')));
});
test('IMC 26.99, 27, 29.99 y 30 distingue criterios y comorbilidad',()=>{
 for(const id of ['semaglutida_wegovy_sc','tirzepatida']){
   assert.equal(review(id,'peso',{imc:'26.99'}).state,'bloqueo');
   assert.equal(review(id,'peso',{imc:'27',comorbilidad_peso_confirmada:'No'}).state,'bloqueo');
   assert.equal(review(id,'peso',{imc:'29.99',comorbilidad_peso_confirmada:'No valorado'}).state,'datos_insuficientes');
   assert.equal(review(id,'peso',{imc:'27',comorbilidad_peso_confirmada:'Sí'}).state,'revision_pendiente');
   assert.equal(review(id,'peso',{imc:'30',comorbilidad_peso_confirmada:'No'}).state,'revision_pendiente');
 }
});
test('Ozempic no es vía de obesidad y requiere DM2 confirmada',()=>{
 assert.equal(review('semaglutida_ozempic','dm2',{dm2:'No'}).state,'bloqueo');
 assert.equal(review('semaglutida_ozempic','dm2',{dm2:'No valorado'}).state,'datos_insuficientes');
});
test('gestación bloquea inicio; se distinguen periodos antes de embarazo planificado',()=>{
 for(const id of Object.keys(INCRETIN_DRUGS)){
   const route=INCRETIN_DRUGS[id].routes[0].id;
   assert.equal(review(id,route,{embarazo:'Sí'}).state,'bloqueo');
   const x=review(id,route,{embarazo_planificado:'Sí'});
   assert.equal(x.state,'bloqueo');
   assert.ok(x.blocked.some(t=>t.includes(id==='tirzepatida'?'1 mes':'2 meses')));
 }
});
test('pancreatitis sospechada, deshidratación grave y visión súbita en semaglutida',()=>{
 for(const id of Object.keys(INCRETIN_DRUGS)){
   const route=INCRETIN_DRUGS[id].routes[0].id;
   assert.equal(review(id,route,{pancreatitis_sospecha:'Sí'}).state,'bloqueo');
   assert.equal(review(id,route,{deshidratacion_gi:'Sí'}).state,'bloqueo');
 }
 for(const id of ['semaglutida_ozempic','semaglutida_wegovy_sc']){
   const route=INCRETIN_DRUGS[id].routes[0].id;
   assert.equal(review(id,route,{vision_subita:'Sí'}).state,'bloqueo');
 }
});
test('terapias incretínicas previas impiden asumir un nuevo inicio sin conciliación',()=>{
 const x=review('tirzepatida','dm2',{farmacos_clases:['arGLP-1']});
 assert.equal(x.state,'bloqueo');
 assert.ok(x.blocked.some(t=>t.includes('transición')));
 const y=review('semaglutida_ozempic','dm2',{farmacos_clases:['Agonista dual GIP/GLP-1']});
 assert.equal(y.state,'bloqueo');
 const z=review('tirzepatida','dm2',{farmacos_clases:['Insulina','Sulfonilurea']});
 assert.ok(z.checks.some(t=>t.includes('hipoglucemia')));
});
test('no diagnosticar y no generar prescripción ni calendario incretínico',()=>{
 for(const [id,drug] of Object.entries(INCRETIN_DRUGS)){
  for(const route of drug.routes){
   const x=review(id,route.id);
   assert.equal(x.patientDose,null);assert.equal(x.prescription,null);
   assert.ok(x.checks.some(t=>t.includes('BIFIMED')));
   assert.throws(()=>confirmedAction([],{drugId:id,routeId:route.id,
     type:'inicio',performedOn:'2026-11-12',doseMg:2.5,confirmedByClinician:true}),
     /Seguimiento automatizado aún no definido/);
  }
 }
 assert.throws(()=>reviewIncretinDrug(draft(base),'semaglutida_ozempic','peso'));
});
