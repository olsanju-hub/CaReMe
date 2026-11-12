import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft,setValue } from '../src/model.mjs';
import { auditCrossDomain } from '../src/clinical/auditoria.mjs';
import { integratePatient } from '../src/clinical/integracion.mjs';
import { reviewDrug,DRUGS } from '../src/clinical/farmacologia.mjs';

const make=v=>Object.entries(v).reduce((d,[key,value])=>setValue(d,key,
  Array.isArray(value)?JSON.stringify(value):String(value)),createDraft());
const has=(cards,id)=>cards.some(x=>x.id===id);

test('DM1 y DM2 declaradas simultáneamente detienen propuestas pero preservan avisos',()=>{
 const d=make({dm1:'Sí',dm2:'Sí',ic:'Sí',tfge:'55',
   farmacos_clases:['Sin tratamiento farmacológico']});
 const audit=auditCrossDomain(d),result=integratePatient(d);
 assert.equal(audit.status,'critical');
 assert.ok(audit.critical.some(f=>f.id==='DM_TYPE_CONFLICT'));
 assert.ok(has(result.alerts,'AUDIT-DM_TYPE_CONFLICT'));
 assert.equal(result.options.length,0);
 assert.ok(has(result.context,'ON-HOLD-SGLT2-REVIEW'));
 assert.equal(reviewDrug(d,'dapagliflozina','ic').state,'bloqueo');
});
test('IC negada y sintomática afirmada bloquea valoraciones por cualquier molécula',()=>{
 const d=make({ic:'No',ic_sintomatica:'Sí',edad:'55',tfge:'67'});
 assert.ok(auditCrossDomain(d).critical.some(f=>f.id==='HF_DECLARATION_CONFLICT'));
 for(const [id,route] of [['empagliflozina','ic'],['finerenona','ic_fevi40'],
   ['metformina','dm2'],['tirzepatida','peso']]){
   const x=reviewDrug(d,id,route);
   assert.equal(x.state,'bloqueo',id);
   assert.equal(x.patientDose,null);
   assert.equal(x.prescription,null);
 }
});
test('ERC no declarada con persistencia y marcadores anormales requiere revisión, no diagnóstico automático',()=>{
 const d=make({erc:'No',persistencia:'Sí',tfge:'50',cac:'50',unidad_cac:'mg/g'});
 const audit=auditCrossDomain(d);
 assert.equal(audit.status,'review');
 assert.ok(audit.findings.some(f=>f.id==='RENAL_DECLARATION_REVIEW'));
 assert.equal(audit.requiresResolution,false);
});
test('estado estable con problema agudo y severidad hepática incongruente son críticos',()=>{
 const x=auditCrossDomain(make({situacion_aguda:'Estable sin proceso agudo grave',lra_sospecha:'Sí',
   hepatica_grave:'Sí',insuficiencia_hepatica:'No'}));
 assert.ok(x.critical.some(f=>f.id==='ACUTE_STATE_CONFLICT'));
 assert.ok(x.critical.some(f=>f.id==='HEPATIC_SEVERITY_CONFLICT'));
});
test('no tratamiento con lista de medicamentos concretos genera alerta de conciliación',()=>{
 const x=make({farmacos_clases:['Sin tratamiento farmacológico'],
   farmacos:'metformina 850 mg'});
 assert.ok(auditCrossDomain(x).critical.some(f=>f.id==='MEDICATION_RECONCILIATION'));
});
test('datos negativos, campos no evaluados y validación normal no se convierten en falsas alertas críticas',()=>{
 const x=auditCrossDomain(make({dm1:'No',dm2:'Sí',ic:'Sí',ic_sintomatica:'Sí',
   potasio:'4.3',potasio_normal:'Sí',farmacos_clases:['Metformina']}));
 assert.equal(x.critical.length,0);
 assert.equal(x.status,'clear');
});
test('potasio anormal declarado normal y función renal inválida requieren comprobación explícita',()=>{
 const x=auditCrossDomain(make({potasio:'6.2',potasio_normal:'Sí',tfge:'-12'}));
 assert.ok(x.findings.some(f=>f.id==='POTASSIUM_CONFLICT'));
 assert.ok(x.findings.some(f=>f.id==='CLINICAL_FIELD_INVALID_tfge'));
});
test('sin incoherencias los candidatos siguen siendo no prescriptivos y con fuentes',()=>{
 const d=make({dm2:'Sí',ic:'Sí',tfge:'55',erc:'Sí',persistencia:'Sí'});
 const r=integratePatient(d);
 assert.equal(r.status,'review_only');
 assert.ok(has(r.options,'SGLT2-REVIEW'));
 for(const drug of Object.values(DRUGS)) {
  const x=reviewDrug(d,drug.id,drug.routes[0].id);
  assert.equal(x.patientDose,null);
  assert.equal(x.prescription,null);
 }
});
