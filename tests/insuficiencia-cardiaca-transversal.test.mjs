import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue} from '../src/model.mjs';
import {auditCrossDomain} from '../src/clinical/auditoria.mjs';
import {integratePatient} from '../src/clinical/integracion.mjs';
import {reviewDrug} from '../src/clinical/farmacologia.mjs';
import {evaluateHeartFailure} from '../src/clinical/insuficiencia-cardiaca.mjs';
const d=o=>Object.entries(o).reduce((x,[k,v])=>
  setValue(x,k,Array.isArray(v)?JSON.stringify(v):String(v)),createDraft());
const baseline={ic:'Sí',ic_sintomatica:'Sí',dm2:'Sí',erc:'Sí',
 persistencia:'Sí',tfge:'55',potasio:'4.2',fecha_evaluacion:'2026-11-12',
 fecha_tfge:'2026-11-10',fecha_potasio:'2026-11-10',
 farmacos_clases:['Metformina'],medicacion_revisada:'Sí',
 alergias_revisadas:'Sí',situacion_aguda:'Estable sin proceso agudo grave'};
const has=(array,id)=>array.some(v=>v.id===id);
test('alarma de IC explícita retiene opciones integrales y ficha CIMA',()=>{
 const x=d({...baseline,ic_alarma:['Disnea intensa en reposo']});
 assert.ok(has(auditCrossDomain(x).critical,'HF_RED_FLAGS'));
 assert.equal(integratePatient(x).options.length,0);
 assert.ok(has(integratePatient(x).alerts,'AUDIT-HF_RED_FLAGS'));
 assert.equal(reviewDrug(x,'empagliflozina','ic').state,'bloqueo');
});
test('sin alarmas y disnea intensa simultáneos conservan señal de urgencia en todo motor',()=>{
 const x=d({...baseline,ic_alarma:['Sin señales de alarma tras valoración','Disnea intensa en reposo']});
 assert.ok(has(auditCrossDomain(x).critical,'HF_RED_FLAGS'));
 assert.ok(has(auditCrossDomain(x).critical,'HF_ALARMS_CONFLICT'));
 assert.equal(integratePatient(x).options.length,0);
 const result=evaluateHeartFailure(x,'detail');
 assert.equal(result.state,'seguridad_prioritaria');
 assert.equal(result.options.length,0);
});
test('descompensación e inestabilidad señaladas detienen candidatos integrales',()=>{
 for(const change of [{ic_descompensada:'Sí'},
  {ic_estabilidad:'Inestabilidad o descompensación sospechada'}]){
  const x=d({...baseline,...change});
  assert.ok(has(auditCrossDomain(x).critical,'HF_DECOMPENSATION'));
  assert.equal(integratePatient(x).options.length,0);
 }
});
test('grupo FEVI contradice número, bloquea tratamiento aun sin otro dato de alarma',()=>{
 const x=d({...baseline,fevi:'55',ic_fevigrupo:'Reducida · FEVI <50 %'});
 assert.ok(has(auditCrossDomain(x).critical,'HF_EF_CONFLICT'));
 assert.equal(integratePatient(x).options.length,0);
});
test('potasio 6 y PAS 89 en IC bloquean las rutas, 5.9 y PAS 90 no activan esa regla',()=>{
 for(const [field,value,id] of [
  ['potasio','6','HF_CRITICAL_POTASSIUM'],['pas','89','HF_HYPOTENSION']
 ]){
  const x=d({...baseline,[field]:value});
  assert.ok(has(auditCrossDomain(x).critical,id));
  assert.equal(integratePatient(x).options.length,0);
 }
 for(const [field,value,id] of [
  ['potasio','5.9','HF_CRITICAL_POTASSIUM'],['pas','90','HF_HYPOTENSION']
 ]){
  const x=d({...baseline,[field]:value});
  assert.ok(!has(auditCrossDomain(x).critical,id));
 }
});
test('fecha de ecocardiografía imposible se considera dato crítico',()=>{
 const x=d({...baseline,fevi:'45',fecha_fevi:'2026-02-30'});
 assert.ok(has(auditCrossDomain(x).critical,'CLINICAL_FIELD_INVALID_fecha_fevi'));
 assert.equal(integratePatient(x).options.length,0);
});
test('un paciente sin alarmas no hereda advertencia de otro',()=>{
 const a=d({...baseline,ic_alarma:['Disnea intensa en reposo']});
 const b=d({...baseline,ic_alarma:['Sin señales de alarma tras valoración']});
 assert.ok(has(auditCrossDomain(a).critical,'HF_RED_FLAGS'));
 assert.ok(!has(auditCrossDomain(b).critical,'HF_RED_FLAGS'));
});
