import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue,setUnavailable,externalOpAssociationValid} from '../src/model.mjs';
import {evaluateCvRisk} from '../src/clinical/riesgo-cv.mjs';
const base={edad:'75',cv_sexo_modelo:'Hombre',cv_region:'España · región ESC de riesgo bajo',
 tabaco:'Nunca',ecv:'No',ic:'No',dm1:'No',dm2:'No',erc:'No',embarazo:'No procede',
 cv_hfamiliar:'No',cv_sintomas:'No',pas:'135',pad:'80',fecha_pas:'2026-11-12',
 colesterol_total:'210',hdl:'50',ldl:'130',fecha_lipidos:'2026-11-10',fecha_evaluacion:'2026-11-12',
 cv_op_porcentaje:'12.3',cv_op_fecha:'2026-11-12',cv_op_fuente:'HeartScore ESC · SCORE2-OP a 10 años',cv_op_contexto:'Revisados por el profesional'};
// El 12.3 es una entrada sintética de transcripción, NO un resultado de referencia SCORE2-OP.
const draft=(v={},confirmed=true)=>{
 const d=Object.entries({...base,...v}).reduce((d,[id,x])=>setValue(d,id,String(x)),createDraft());
 return confirmed?setValue(d,'cv_op_confirmado','Sí'):d;
};
test('resultado externo mantiene su origen, sin porcentaje calculado interno ni prescripción',()=>{
 const r=evaluateCvRisk(draft());assert.equal(r.route,'estimacion_externa_documentada');
 assert.equal(r.percent,null);assert.equal(r.model,null);assert.equal(r.externalEstimate.percent,12.3);
 assert.equal(r.externalEstimate.internallyCalculated,false);assert.equal(r.externalEstimate.source,'HeartScore ESC');
 assert.equal(r.externalEstimate.horizonYears,10);assert.equal(r.ckmStage,null);assert.equal(r.prescription,null);
});
for(const age of ['70','89'])test('registro externo en frontera '+age,()=>assert.ok(evaluateCvRisk(draft({edad:age})).externalEstimate));
test('70 sin estimación no extrapola fórmula de 40–69',()=>{
 const r=evaluateCvRisk(draft({},false));assert.equal(r.percent,null);assert.equal(r.externalEstimate,null);
});
test('69 mantiene SCORE2 propio; 90 queda fuera de este circuito OP',()=>{
 const a=evaluateCvRisk(draft({edad:'69'}));assert.equal(a.model,'SCORE2');assert.equal(a.externalEstimate,null);
 const b=evaluateCvRisk(draft({edad:'90'}));assert.equal(b.route,'fuera_de_edad');assert.equal(b.externalEstimate,null);
});
for(const v of [{cv_op_fuente:'Otro modelo o fuente no confirmada'},{cv_op_contexto:'Pendiente de revisar'},
 {cv_op_porcentaje:'-1'},{cv_op_porcentaje:'101'},{cv_op_porcentaje:''},{cv_op_fecha:'2026-02-30'},
 {cv_op_fecha:'2026-11-13'},{cv_op_fecha:'2026-11-11'},{cv_region:'Otra región / no confirmada'},
 {ecv:'Sí'},{ic:'Sí'},{dm2:'Sí'},{erc:'Sí'},{tfge:'45'},{cv_sintomas:'Sí'},{potasio:'6.5'}])
 test('procedencia/exclusión impide presentar resultado externo '+JSON.stringify(v),()=>assert.equal(evaluateCvRisk(draft(v)).externalEstimate,null));
for(const [id,value] of [['edad','76'],['tabaco','Actual'],['cv_op_porcentaje','14.5'],['hba1c','6.1']])
 test('editar '+id+' invalida confirmación y asociación',()=>{
  const d=setValue(draft(),id,value);assert.equal(d.values.cv_op_confirmado,'No');
  assert.equal(externalOpAssociationValid(d),false);assert.equal(evaluateCvRisk(d).externalEstimate,null);
 });
test('una escritura idéntica conserva confirmación; cambiar disponibilidad la invalida',()=>{
 assert.ok(externalOpAssociationValid(setValue(draft(),'pas','135')));
 const d=setUnavailable(draft(),'pas',true);assert.equal(externalOpAssociationValid(d),false);
 assert.equal(evaluateCvRisk(d).externalEstimate,null);
});
test('mutación de datos fuera del modelo no conserva una asociación antigua',()=>{
 const d=draft();d.values.tabaco='Actual';assert.equal(evaluateCvRisk(d).externalEstimate,null);
});
test('la confirmación anterior a introducir resultado no se reutiliza',()=>{
 let d=draft({cv_op_porcentaje:''});d=setValue(d,'cv_op_porcentaje','15');
 assert.equal(evaluateCvRisk(d).externalEstimate,null);
});
