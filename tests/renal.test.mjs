import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue,setUnavailable} from '../src/model.mjs';
import {evaluateKidney} from '../src/clinical/renal.mjs';
import {integratePatient} from '../src/clinical/integracion.mjs';
import {auditCrossDomain} from '../src/clinical/auditoria.mjs';
const base={tfge:'55',cac:'100',unidad_cac:'mg/g',persistencia:'Sí',
 lra_sospecha:'No',situacion_aguda:'Estable sin proceso agudo grave',potasio:'4.4',
 edad:'60',erc_contexto:'Adulto sin diálisis ni trasplante',embarazo:'No procede',erc_hematuria:'No',
 fecha_evaluacion:'2026-11-12',fecha_tfge:'2026-11-10',fecha_cac:'2026-11-10',fecha_potasio:'2026-11-10'};
const draft=(v={})=>Object.entries({...base,...v}).reduce((d,[k,x])=>setValue(d,k,String(x)),createDraft());
const run=(v={},mode='detail')=>evaluateKidney(draft(v),mode);
test('ERC estable documentada: control anual mínimo sin cita ni dosis automática',()=>{
 const r=run();assert.equal(r.stableFollowUp,true);assert.match(r.followUp,/al menos anualmente/);
 assert.equal(r.prescription,null);assert.equal(r.patientDose,null);assert.equal(r.actionPerformed,false);
 assert.equal(r.classification.categories.gfr,'G3a');
});
for(const k of ['6','6.49','6.5','7'])test('potasio '+k+' prevalece sobre el seguimiento crónico, incluso sin IC',()=>{
 const r=run({potasio:k,ic:'No'});assert.equal(r.stableFollowUp,false);assert.equal(r.state,'seguridad_prioritaria');
 assert.ok(auditCrossDomain(draft({potasio:k,ic:'No'})).critical.some(x=>x.id==='RENAL_CRITICAL_POTASSIUM'));
 if(Number(k)>=6.5)assert.ok(r.alerts.some(x=>x.includes('inmediatos')));
});
test('hiperpotasemia moderada con LRA pide hospital, no control anual',()=>{
 const r=run({potasio:'6.1',lra_sospecha:'Sí'});assert.ok(r.alerts.some(x=>x.includes('hospitalaria')));
});
for(const v of [{persistencia:'No'},{persistencia:'No consta'},{fecha_tfge:''},{fecha_potasio:''},{lra_sospecha:'No valorado'},{situacion_aguda:'No valorada'},{edad:''},{erc_contexto:''}])
 test('no asigna seguimiento estable con datos incompletos '+JSON.stringify(v),()=>assert.equal(run(v).stableFollowUp,false));
test('G1 A1 no se convierte en ERC por persistencia declarada',()=>{
 const r=run({tfge:'95',cac:'10'});assert.equal(r.stableFollowUp,false);assert.ok(r.checks.some(x=>x.includes('no confirma ERC')));
});
for(const v of [{edad:'17'},{embarazo:'Sí'},{erc_contexto:'Diálisis'},{erc_contexto:'Trasplante renal'}])
 test('ámbito específico '+JSON.stringify(v),()=>{const r=run(v);assert.equal(r.state,'fuera_de_ambito');assert.equal(r.stableFollowUp,false);assert.deepEqual(r.referral,[])});
test('TFGe 30 no cruza criterio <30 y 29.9 sí; no exige cronicidad para valorar derivación',()=>{
 assert.ok(!run({tfge:'30'}).referral.some(x=>x.id==='EGFR_LT30'));
 assert.ok(run({tfge:'29.9',persistencia:'No'}).referral.some(x=>x.id==='EGFR_LT30'));
});
test('CAC 700 no cruza >700; 701 requiere repetición del valor actual',()=>{
 assert.ok(!run({cac:'700',erc_cac_persistente:'Sí'}).referral.some(x=>x.id==='ACR_GT700'));
 assert.ok(run({cac:'701',erc_cac_persistente:'Sí'}).referral.some(x=>x.id==='ACR_GT700'));
 assert.ok(!run({cac:'701'}).referral.some(x=>x.id==='ACR_GT700'));
});
test('CAC y hematuria: criterio específico desde 300, sin confundirlo con categoría A3',()=>{
 assert.ok(!run({cac:'299',erc_hematuria:'Sí'}).referral.some(x=>x.id==='ACR_HEMATURIA'));
 const r=run({cac:'300',erc_hematuria:'Sí'});assert.equal(r.classification.categories.albuminuria,'A2');
 assert.ok(r.referral.some(x=>x.id==='ACR_HEMATURIA'));
});
for(const v of [{unidad_cac:''},{unidad_cac:'mg/mmol'},{fecha_cac:'2026-12-01'},{fecha_potasio:'2026-02-30'}])
 test('unidad/fecha no verificada retiene interpretación operativa '+JSON.stringify(v),()=>{
  const r=run(v);assert.equal(r.stableFollowUp,false);assert.deepEqual(r.referral,[]);
 });
test('TFGe no disponible no se usa como dato normal ni como criterio de derivación',()=>{
 const r=evaluateKidney(setUnavailable(draft(), 'tfge',true),'detail');assert.equal(r.stableFollowUp,false);
 assert.equal(r.classification.categories.gfr,null);
});
test('K elevado bloquea candidatos también en integración multiorgánica',()=>{
 const r=integratePatient(draft({erc:'Sí',dm2:'Sí',ic:'No',potasio:'6.5'}));
 assert.ok(auditCrossDomain(draft({potasio:'6.5'})).requiresResolution);
 assert.ok(!JSON.stringify(r).includes('"state":"candidato_para_revision"'));
});
test('consulta rápida no elude barreras de ámbito y no usa modo desconocido',()=>{
 assert.equal(run({edad:'17'},'quick').state,'fuera_de_ambito');
 assert.throws(()=>run({},'other'));
});
