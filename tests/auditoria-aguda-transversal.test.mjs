import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue,setUnavailable} from '../src/model.mjs';
import {auditCrossDomain} from '../src/clinical/auditoria.mjs';
import {integratePatient} from '../src/clinical/integracion.mjs';
import {buildIntegratedPlan} from '../src/clinical/plan-integral.mjs';
import {reviewDrug} from '../src/clinical/farmacologia.mjs';
import {confirmedAction} from '../src/clinical/continuidad.mjs';
const make=v=>Object.entries(v).reduce((d,[k,x])=>setValue(d,k,Array.isArray(x)?JSON.stringify(x):String(x)),createDraft());
const flags=['cetoacidosis_sospecha','acidosis_metabolica','hipoxia_tisular','lra_sospecha','pancreatitis_sospecha','deshidratacion_gi','vision_subita'];
const base={edad:'60',embarazo:'No procede',fecha_evaluacion:'2026-11-13',situacion_aguda:'Estable sin proceso agudo grave',lra_sospecha:'No',medicacion_revisada:'Sí',fin_estado:'En tratamiento',tfge:'70',fecha_tfge:'2026-11-10',potasio:'4.3',fecha_potasio:'2026-11-10'};
const history=confirmedAction([],{drugId:'finerenona',routeId:'erc_dm2',type:'inicio',doseMg:20,performedOn:'2026-11-01',confirmedByClinician:true});
for(const flag of flags){
 for(const context of ['', 'No valorada','Estable sin proceso agudo grave'])test(flag+' afirmativo se conserva con estabilidad '+JSON.stringify(context),()=>{
  const d=make({...base,situacion_aguda:context,[flag]:'Sí'}),a=auditCrossDomain(d),p=buildIntegratedPlan(d,history);
  assert.equal(a.requiresResolution,true);assert.ok(a.critical.some(x=>x.fields.includes(flag)));
  assert.equal(p.globalHold,true);assert.equal(p.controls[0].status,'requiere_reevaluacion');
  assert.equal(p.controls[0].dueOn,'2026-11-29');assert.equal(p.coordination.length,0);
  assert.equal(p.priorities[0].priority,'seguridad');assert.equal(p.prescription,null);
  // Otra indicación habría generado candidato de iSGLT2 antes de la barrera.
  const i=integratePatient(make({...base,situacion_aguda:context,ic:'Sí',[flag]:'Sí'}));assert.equal(i.options.length,0);
  for(const [drug,route] of [['empagliflozina','ic'],['finerenona','erc_dm2'],['metformina','dm2'],['tirzepatida','peso']]){
   const r=reviewDrug(d,drug,route);assert.equal(r.state,'bloqueo',drug);assert.equal(r.prescription,null);
  }
 });
 test(flag+' negativo, desconocido o no disponible no afirma alarma',()=>{
  for(const value of ['No',flag==='cetoacidosis_sospecha'?'No valorada':'No valorado','']){
   const d=make({[flag]:value});assert.equal(auditCrossDomain(d).requiresResolution,false);
  }
  assert.equal(auditCrossDomain(setUnavailable(make({[flag]:'Sí'}),flag,true)).requiresResolution,false);
 });
}
for(const context of ['Enfermedad aguda grave','Cirugía mayor o ayuno prolongado'])test('contexto especial retiene todo el plan: '+context,()=>{
 const d=make({...base,situacion_aguda:context,ic:'Sí'});
 assert.equal(integratePatient(d).options.length,0);assert.equal(buildIntegratedPlan(d,history).controls[0].status,'requiere_reevaluacion');
 if(context.startsWith('Cirugía'))assert.match(auditCrossDomain(d).critical[0].detail,/no implica por sí sola una emergencia/);
});
test('sin alarma afirmativa el plazo histórico conserva su referencia activa',()=>{
 const p=buildIntegratedPlan(make(base),history);assert.equal(p.globalHold,false);assert.equal(p.controls[0].status,'referencia_activa');
 assert.ok(integratePatient(make({...base,ic:'Sí'})).options.some(x=>x.id==='SGLT2-REVIEW'));
});
