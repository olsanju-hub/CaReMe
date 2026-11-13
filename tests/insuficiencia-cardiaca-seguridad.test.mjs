import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue} from '../src/model.mjs';
import {auditCrossDomain} from '../src/clinical/auditoria.mjs';
import {evaluateHeartFailure} from '../src/clinical/insuficiencia-cardiaca.mjs';
import {integratePatient} from '../src/clinical/integracion.mjs';
import {reviewDrug} from '../src/clinical/farmacologia.mjs';

const sample={
 ic:'Sí',ic_sintomatica:'Sí',ic_fevigrupo:'Reducida · FEVI <50 %',
 fevi:'44',fecha_fevi:'2026-10-12',fecha_evaluacion:'2026-11-12',
 ic_estabilidad:'Estable evaluado',ic_alarma:['Sin señales de alarma tras valoración'],
 congestion:'Ausentes',ic_descompensada:'No',situacion_aguda:'Estable sin proceso agudo grave',
 lra_sospecha:'No',embarazo:'No procede',
 tfge:'60',fecha_tfge:'2026-11-10',potasio:'4.4',fecha_potasio:'2026-11-10',
 pas:'120',ic_fc:'71',farmacos_clases:['Sin tratamiento farmacológico'],
 medicacion_revisada:'Sí',alergias_revisadas:'Sí'
};
const draft=v=>Object.entries(v).reduce((d,[k,x])=>
 setValue(d,k,Array.isArray(x)?JSON.stringify(x):String(x)),createDraft());
const run=(v={})=>evaluateHeartFailure(draft({...sample,...v}),'detail');

test('ESC 2026: FEVI <50 incluye 49,9; 50 requiere evidencia objetiva',()=>{
 const reduced=run({fevi:'49.9'});
 assert.equal(reduced.phenotype.code,'reducida');
 assert.ok(reduced.options.some(x=>x.id==='HF-RAAS-REVIEW'));
 const preserved=run({fevi:'50',ic_fevigrupo:'Preservada · FEVI ≥50 %',
   ic_evidencia_objetiva:'Confirmada por evaluación especializada',ic_fevi_previa_reducida:'No tras revisión del historial'});
 assert.equal(preserved.phenotype.code,'preservada');
 assert.ok(!preserved.options.some(x=>x.id==='HF-RAAS-REVIEW'));
 const uncertain=run({fevi:'50',ic_fevigrupo:'Preservada · FEVI ≥50 %',
   ic_evidencia_objetiva:'No consta evidencia suficiente'});
 assert.equal(uncertain.state,'datos_insuficientes');
 assert.equal(uncertain.options.length,0);
});
test('sin fecha de FEVI o fecha de evaluación no presupone vigencia de fenotipo',()=>{
 for(const change of [{fecha_fevi:''},{fecha_evaluacion:''}]){
  const x=run(change);
  assert.equal(x.state,'datos_insuficientes');
  assert.equal(x.options.length,0);
  assert.ok(x.missing.some(y=>y.includes('fecha de FEVI')));
 }
});
test('sin fechas de potasio o TFGe no sugiere nuevos medicamentos',()=>{
 for(const change of [{fecha_tfge:''},{fecha_potasio:''}]){
  const x=run(change);
  assert.equal(x.state,'datos_insuficientes');
  assert.equal(x.options.length,0);
  assert.ok(x.missing.some(y=>y.includes('fecha de')));
 }
});
test('K 5.6 en IC bloquea propuestas en consultas dirigidas y motor multiorgánico',()=>{
 const data=draft({...sample,potasio:'5.6'});
 const audit=auditCrossDomain(data);
 assert.ok(audit.critical.some(x=>x.id==='HF_POTASSIUM_REVIEW'));
 assert.equal(integratePatient(data).options.length,0);
 const result=evaluateHeartFailure(data,'detail');
 assert.equal(result.state,'seguridad_prioritaria');
 assert.equal(result.options.length,0);
 assert.ok(result.alerts.some(x=>x.includes('>5,5')));
});
test('K 6 conserva alerta crítica diferenciada de K 5.6',()=>{
 const data=draft({...sample,potasio:'6'});
 const audit=auditCrossDomain(data);
 assert.ok(audit.critical.some(x=>x.id==='HF_CRITICAL_POTASSIUM'));
 assert.ok(!audit.critical.some(x=>x.id==='HF_POTASSIUM_REVIEW'));
 const r=evaluateHeartFailure(data,'detail');
 assert.equal(r.state,'seguridad_prioritaria');
 assert.ok(r.alerts.some(x=>x.includes('ECG')));
});
test('duplicidad de IECA y ARNI bloquea también la integración y fichas',()=>{
 const data=draft({...sample,farmacos_clases:['IECA','INRA/ARNI']});
 assert.ok(auditCrossDomain(data).critical.some(x=>x.id==='HF_RAAS_DUPLICATION'));
 assert.equal(integratePatient(data).options.length,0);
 const r=evaluateHeartFailure(data,'detail');
 assert.equal(r.state,'revisar_coherencia');
 assert.equal(r.options.length,0);
 assert.equal(reviewDrug(data,'empagliflozina','ic').state,'bloqueo');
});
test('PAS 95 alerta prudencia sin convertirla en criterio único de descompensación',()=>{
 const r=run({pas:'95'});
 assert.equal(r.state,'revision_pendiente');
 assert.ok(r.checks.some(x=>x.includes('PAS 90–99')));
 assert.equal(r.patientDose,null);
 assert.equal(r.prescription,null);
});
test('la presencia de un diurético evita sugerir inicio duplicado',()=>{
 const r=run({congestion:'Presentes',farmacos_clases:['Diurético de asa']});
 assert.ok(r.options.some(x=>x.id==='HF-DIURETIC-EXISTING'));
 assert.ok(!r.options.some(x=>x.id==='HF-DIURETIC-REVIEW'));
 assert.equal(r.actionPerformed,false);
});

