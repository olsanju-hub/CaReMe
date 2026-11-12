import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft,setValue } from '../src/model.mjs';
import { buildVerificationPlan } from '../src/clinical/plan.mjs';
import { integratePatient } from '../src/clinical/integracion.mjs';
import { reviewFinerenoneContinuation,reviewEmpagliflozinContinuation,
  confirmedAction } from '../src/clinical/continuidad.mjs';
import { reviewDrug } from '../src/clinical/farmacologia.mjs';

const draft=(values={})=>Object.entries(values).reduce((d,[k,v])=>
  setValue(d,k,Array.isArray(v)?JSON.stringify(v):String(v)),createDraft());
const has=(array,id)=>array.some(x=>x.id===id);

test('un plan no contiene dosis prescritas ni actuaciones supuestamente realizadas',()=>{
 const p=buildVerificationPlan(draft({dm2:'Sí',erc:'Sí',tfge:'55',cac:'90',unidad_cac:'mg/g'}));
 assert.equal(p.metadata.noPrescription,true);
 assert.equal(p.metadata.noPerformedActionsInferred,true);
 assert.equal(p.confirmedActions,0);
 assert.equal(p.followup.length,0);
 assert.ok(p.checks.every(x=>x.performed===false));
 assert.ok(p.candidates.every(x=>x.performed===false));
 assert.ok(has(p.checks,'VERIFY-LAB-DATES'));
 assert.ok(has(p.checks,'VERIFY-CKD-CHRONICITY'));
});
test('una incoherencia crítica suprime candidatos y crea comprobación identificable',()=>{
 const d=draft({dm1:'Sí',dm2:'Sí',ic:'Sí',tfge:'60',
    farmacos_clases:['Sin tratamiento farmacológico']});
 const p=buildVerificationPlan(d);
 assert.equal(p.status,'incoherencias_criticas');
 assert.ok(p.heldCandidates>0);
 assert.equal(p.candidates.length,0);
 assert.ok(has(p.checks,'RECONCILE-DM_TYPE_CONFLICT'));
 assert.ok(p.checks.some(x=>x.priority==='seguridad'));
});
test('no se inventa cronicidad de ERC ni fecha de analítica ausente',()=>{
 const p=buildVerificationPlan(draft({erc:'Sí',persistencia:'No consta',tfge:'53',cac:'70',unidad_cac:'mg/g'}));
 assert.ok(has(p.checks,'VERIFY-CKD-CHRONICITY'));
 assert.ok(has(p.checks,'VERIFY-LAB-DATES'));
 assert.ok(p.checks.some(x=>x.detail.includes('No considerar los resultados automáticamente recientes')));
});
test('si el potasio no consta, el plan lo solicita cuando se declara finerenona actual',()=>{
 const p=buildVerificationPlan(draft({fin_estado:'En tratamiento',fin_dosis_actual:'10'}));
 assert.ok(has(p.checks,'COMPLETE-POTASSIUM'));
});
test('plan programado únicamente tras confirmación de actuación real',()=>{
 const d=draft({erc:'Sí',persistencia:'Sí',tfge:'55',cac:'90',unidad_cac:'mg/g',potasio:'4.3'});
 const none=buildVerificationPlan(d,[]);
 assert.equal(none.followup.length,0);
 const history=confirmedAction([],{drugId:'finerenona',routeId:'erc_dm2',
    type:'inicio',performedOn:'2026-11-01',doseMg:10,confirmedByClinician:true});
 const p=buildVerificationPlan(d,history);
 assert.equal(p.confirmedActions,1);
 assert.equal(p.followup.length,1);
 assert.equal(p.followup[0].dueOn,'2026-11-29');
 assert.equal(p.followup[0].performed,false);
 assert.equal(p.followup[0].status,'previsto');
});
test('control anterior sustituido permanece documentado pero no se interpreta como vigente',()=>{
 let h=[];
 const act=(type,date,doseMg)=>({drugId:'finerenona',routeId:'erc_dm2',
    type,performedOn:date,doseMg,confirmedByClinician:true});
 h=confirmedAction(h,act('inicio','2026-10-10',10));
 h=confirmedAction(h,act('interrupcion','2026-10-20',null));
 const p=buildVerificationPlan(draft(),h);
 assert.equal(p.confirmedActions,2);
 assert.equal(p.followup[0].status,'sustituido');
 assert.equal(p.followup[1].status,'reevaluacion_pendiente');
});
test('continuidad conserva alerta urgente aunque haya datos incoherentes',()=>{
 const d=draft({fin_estado:'En tratamiento',fin_dosis_actual:'20',
    potasio:'6.1',tfge:'53',fecha_evaluacion:'2026-11-10',
    fecha_potasio:'2026-11-11',fecha_tfge:'2026-11-10'});
 const r=reviewFinerenoneContinuation(d,'ic_fevi40');
 assert.equal(r.state,'alerta');
 assert.ok(r.cautions.some(x=>x.includes('incoherencias críticas')));
 assert.equal(r.patientDose,null);
 assert.equal(r.actionPerformed,false);
});
test('continuidad no muestra titulación si un resultado tiene fecha imposible',()=>{
 const d=draft({fin_estado:'En tratamiento',fin_dosis_actual:'10',
  potasio:'4.5',tfge:'53',fin_tfge_previa:'60',
  fecha_evaluacion:'2026-11-10',fecha_tfge:'2026-11-11'});
 const r=reviewFinerenoneContinuation(d,'erc_dm2');
 assert.equal(r.state,'datos_insuficientes');
 assert.equal(r.ruleId,'AUDIT-CONTINUITY-HOLD');
 assert.equal(r.patientDose,null);
 const emp=draft({emp_estado:'En tratamiento',emp_dosis_actual:'10',
  tfge:'60',fecha_evaluacion:'2026-11-10',fecha_tfge:'2026-11-11'});
 assert.equal(reviewEmpagliflozinContinuation(emp,'erc').ruleId,'AUDIT-CONTINUITY-HOLD');
});
test('no usar valores CAC mg/mmol para seleccionar tratamientos de ERC',()=>{
 const d=draft({dm2:'Sí',erc:'Sí',persistencia:'Sí',tfge:'54',cac:'3.2',
    unidad_cac:'mg/mmol',farmacos_clases:['Metformina']});
 assert.equal(integratePatient(d).options.length,0);
 assert.equal(reviewDrug(d,'finerenona','erc_dm2').state,'bloqueo');
 const p=buildVerificationPlan(d);
 assert.ok(has(p.checks,'RECONCILE-CAC_UNIT_INCOMPATIBLE'));
});
test('escenario multidominio sin bloqueos mantiene candidatos como REVISIÓN, no tratamiento',()=>{
 const d=draft({edad:'65',dm2:'Sí',ic:'Sí',ic_sintomatica:'Sí',
   erc:'Sí',persistencia:'Sí',tfge:'58',cac:'150',unidad_cac:'mg/g',
   potasio:'4.5',situacion_aguda:'Estable sin proceso agudo grave',
   cetoacidosis_sospecha:'No',farmacos_clases:['Metformina'],
   medicacion_revisada:'Sí',alergias_revisadas:'Sí'});
 const p=buildVerificationPlan(d);
 assert.equal(p.status,'revision_pendiente');
 assert.ok(p.candidates.length>0);
 assert.ok(p.candidates.every(x=>x.status==='candidato_para_revision'));
 assert.equal(p.confirmedActions,0);
 assert.equal(p.followup.length,0);
});
test('el plan permanece determinado por entradas, sin acumulación de datos entre pacientes',()=>{
 const one=buildVerificationPlan(draft({dm2:'Sí',erc:'Sí',persistencia:'No consta'}));
 const two=buildVerificationPlan(draft());
 assert.ok(has(one.checks,'VERIFY-CKD-CHRONICITY'));
 assert.ok(!has(two.checks,'VERIFY-CKD-CHRONICITY'));
 assert.equal(two.confirmedActions,0);
});
