import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue} from '../src/model.mjs';
import {classifyHf2026,evaluateHeartFailure,HF_SOURCES} from '../src/clinical/insuficiencia-cardiaca.mjs';
import {integratePatient} from '../src/clinical/integracion.mjs';
const draft=(data={})=>Object.entries(data).reduce((s,[k,x])=>
 setValue(s,k,Array.isArray(x)?JSON.stringify(x):String(x)),createDraft());
const base={
 ic:'Sí',ic_sintomatica:'Sí',ic_fevigrupo:'Reducida · FEVI <50 %',
 fevi:'38',fecha_fevi:'2026-10-15',fecha_evaluacion:'2026-11-12',
 ic_estabilidad:'Estable evaluado',ic_alarma:['Sin señales de alarma tras valoración'],
 congestion:'Ausentes',situacion_aguda:'Estable sin proceso agudo grave',
 ic_descompensada:'No',lra_sospecha:'No',tfge:'58',fecha_tfge:'2026-11-08',
 potasio:'4.3',fecha_potasio:'2026-11-08',pas:'120',ic_fc:'75',
 farmacos_clases:['Sin tratamiento farmacológico'],medicacion_revisada:'Sí',
 alergias_revisadas:'Sí',embarazo:'No procede'
};
const run=(changes={},mode='detail')=>evaluateHeartFailure(draft({...base,...changes}),mode);
const has=(r,id)=>r.options.some(x=>x.id===id);
test('ESC 2026: FEVI 40 y 49,9 reducidas; FEVI 50 requiere evidencia objetiva',()=>{
 for(const x of [0,39.9,40,49.9])
  assert.equal(classifyHf2026(x).code,'reducida',String(x));
 for(const x of [50,55,65])
  assert.equal(classifyHf2026(x).code,'preservada_no_confirmada',String(x));
 assert.equal(classifyHf2026(50,'Confirmada por evaluación especializada').code,'preservada');
 assert.equal(classifyHf2026(-1).code,'no_evaluable');
 assert.equal(classifyHf2026(101).code,'no_evaluable');
});
test('consulta rápida orienta, pero no propone inicio sin laboratorio y FEVI cuantitativa',()=>{
 const x=evaluateHeartFailure(draft({
  ic:'Sí',ic_fevigrupo:'Reducida · FEVI <50 %',
  congestion:'Ausentes',ic_alarma:['Sin señales de alarma tras valoración']
 }), 'quick');
 assert.equal(x.state,'revision_pendiente');
 assert.equal(x.options.length,0);
 assert.equal(x.noPrescription,true);
});
test('FEVI 45 se clasifica IC-FEr según ESC 2026, no grupo intermedio independiente',()=>{
 const x=run({fevi:'45'});
 assert.equal(x.phenotype.code,'reducida');
 assert.equal(x.state,'revision_pendiente');
 assert.ok(has(x,'HF-SGLT2-REVIEW'));
 assert.ok(has(x,'HF-MRA-REVIEW'));
 assert.ok(has(x,'HF-RAAS-REVIEW'));
 assert.ok(has(x,'HF-BB-REVIEW'));
 assert.ok(!x.options.some(o=>o.patientDose!==null||o.prescription!==null||o.actionPerformed));
});
test('FEVI 50 sin prueba objetiva de IC-FEp no emite candidatos',()=>{
 const x=run({fevi:'50',ic_fevigrupo:'Preservada · FEVI ≥50 %',
  ic_evidencia_objetiva:'Pendiente de comprobación'});
 assert.equal(x.phenotype.code,'preservada_no_confirmada');
 assert.equal(x.state,'datos_insuficientes');
 assert.equal(x.options.length,0);
 assert.ok(x.checks.some(t=>t.includes('no diagnosticar IC-FEp')));
});
test('FEVI 50 con evidencia objetiva mantiene MRA y SGLT2; no extrapola RAAS/betabloqueante de IC-FEr',()=>{
 const x=run({fevi:'50',ic_fevigrupo:'Preservada · FEVI ≥50 %',
  ic_evidencia_objetiva:'Confirmada por evaluación especializada'});
 assert.equal(x.state,'revision_pendiente');
 assert.equal(x.phenotype.code,'preservada');
 assert.ok(has(x,'HF-SGLT2-REVIEW'));
 assert.ok(has(x,'HF-MRA-REVIEW'));
 assert.ok(!has(x,'HF-RAAS-REVIEW'));
 assert.ok(!has(x,'HF-BB-REVIEW'));
});
test('congestión presente permite revisar diurético de asa sin pauta ni dosis',()=>{
 const x=run({congestion:'Presentes'});
 assert.equal(x.state,'revision_pendiente');
 assert.ok(has(x,'HF-DIURETIC-REVIEW'));
 assert.ok(x.steps.some(t=>t.includes('revisión clínica de diuréticos')));
 const eu=run({congestion:'Ausentes'});
 assert.ok(!has(eu,'HF-DIURETIC-REVIEW'));
});
test('IC descompensada retiene farmacoterapia crónica y prioriza valoración',()=>{
 const x=run({ic_descompensada:'Sí',situacion_aguda:'Enfermedad aguda grave'});
 assert.equal(x.state,'seguridad_prioritaria');
 assert.equal(x.options.length,0);
 assert.ok(x.alerts.some(t=>t.includes('descompensación')));
 assert.match(x.followUp,/prioritaria/);
});
test('disnea grave, hipoxemia o hipoperfusión se gestionan como alarmas de derivación',()=>{
 for(const label of [
  'Disnea intensa en reposo','Hipoxemia o dificultad respiratoria grave',
  'Hipoperfusión o confusión aguda','Dolor torácico sugestivo de isquemia'
 ]){
  const x=run({ic_alarma:[label]});
  assert.equal(x.state,'seguridad_prioritaria',label);
  assert.equal(x.options.length,0);
  assert.ok(x.steps.some(t=>t.includes('Evaluación prioritaria')));
 }
});
test('señales simultáneamente presentes y ausentes se señalan como incompatibles',()=>{
 const x=run({ic_alarma:['Sin señales de alarma tras valoración','Disnea intensa en reposo']});
 assert.equal(x.state,'seguridad_prioritaria');
 assert.ok(x.alerts.some(t=>t.includes('simultáneamente')));
 assert.equal(x.options.length,0);
});
test('sin revisar alarmas o embarazo/medicaciones no se emiten opciones',()=>{
 for(const data of [
  {ic_alarma:''},{embarazo:'No valorado'},
  {medicacion_revisada:'No'},{farmacos_clases:''},{alergias_revisadas:'No'}
 ]){
  const x=run(data);
  assert.equal(x.state,'datos_insuficientes',JSON.stringify(data));
  assert.equal(x.options.length,0);
 }
});
test('fecha FEVI posterior a evaluación genera bloque de coherencia',()=>{
 const x=run({fecha_fevi:'2026-11-15'});
 assert.equal(x.state,'revisar_coherencia');
 assert.equal(x.options.length,0);
 assert.ok(x.alerts.some(t=>t.includes('después')));
});
test('FEVI grupo y número incompatibles exige revisión y no candidato',()=>{
 const x=run({fevi:'55',ic_fevigrupo:'Reducida · FEVI <50 %'});
 assert.equal(x.state,'revisar_coherencia');
 assert.equal(x.options.length,0);
});
test('presión sistólica <90 o potasio >=6 priorizan seguridad',()=>{
 for(const data of [{pas:'89'},{potasio:'6'}]){
  const x=run(data);
  assert.equal(x.state,'seguridad_prioritaria');
  assert.equal(x.options.length,0);
 }
});
test('MRA no se propone como inicio sin K y TFGe válidos o con K>5',()=>{
 for(const data of [{potasio:''},{tfge:''},{potasio:'5.3'},{tfge:'29'}]){
  const x=run(data);
  assert.ok(!has(x,'HF-MRA-REVIEW'),JSON.stringify(data));
 }
});
test('tratamiento ARM declarado evita duplicar otra ARM',()=>{
 const x=run({farmacos_clases:['ARM','iSGLT2','INRA/ARNI','Betabloqueante']});
 assert.equal(x.state,'revision_pendiente');
 assert.ok(has(x,'HF-MRA-EXISTING'));
 assert.ok(has(x,'HF-SGLT2-EXISTING'));
 assert.ok(has(x,'HF-RAAS-EXISTING'));
 assert.ok(has(x,'HF-BB-EXISTING'));
 assert.ok(!has(x,'HF-MRA-REVIEW'));
});
test('IECA y ARNI simultáneos son motivo de conciliación y no inicio',()=>{
 const x=run({farmacos_clases:['IECA','INRA/ARNI']});
 assert.equal(x.state,'revisar_coherencia');
 assert.equal(x.options.length,0);
 assert.ok(x.alerts.some(t=>t.includes('Múltiples vías')));
});
test('IC negada pero sintomática declarada no genera diagnóstico',()=>{
 const x=run({ic:'No',ic_sintomatica:'Sí'});
 assert.equal(x.state,'revisar_coherencia');
 assert.equal(x.options.length,0);
});
test('ausencia de FEVI numérica no permite escoger tratamiento por fenotipo',()=>{
 const x=run({fevi:''});
 assert.equal(x.state,'datos_insuficientes');
 assert.equal(x.options.length,0);
});
test('ausencia de IC sintomática no equivale a suspensión de tratamiento previo',()=>{
 const x=run({ic_sintomatica:'No'});
 assert.equal(x.state,'revision_pendiente');
 assert.equal(x.options.length,0);
 assert.ok(x.checks.some(t=>t.includes('no retirar automáticamente')));
});
test('LRA o embarazo obligan a priorizar seguridad antes del tratamiento crónico',()=>{
 for(const data of [{lra_sospecha:'Sí'},{embarazo:'Sí'}]){
  const x=run(data);
  assert.equal(x.state,'seguridad_prioritaria');
  assert.equal(x.options.length,0);
 }
});
test('vincula CIMA a moléculas y conserva contrato no prescriptivo',()=>{
 const x=run();
 assert.equal(x.clinicalValidation,'pendiente');
 assert.equal(x.patientDose,null);
 assert.equal(x.actionPerformed,false);
 assert.equal(x.prescription,null);
 assert.ok(x.sourceIds.includes('ESC-HF-2026'));
 assert.ok(Object.values(HF_SOURCES).every(t=>t.url.startsWith('https://')));
});
test('un paciente nuevo no hereda cardiopatía ni medicamentos del anterior',()=>{
 const a=run();
 const b=evaluateHeartFailure(draft({ic:'No'}),'detail');
 assert.ok(a.options.length>0);
 assert.equal(b.options.length,0);
});
