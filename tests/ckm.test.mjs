import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue,setUnavailable} from '../src/model.mjs';
import {evaluateCkm} from '../src/clinical/ckm.mjs';
const base={edad:'50',embarazo:'No procede',dm1:'No',fecha_evaluacion:'2026-11-12',
 ckm_evaluacion_confirmada:'Sí',ckm_cvd:'No identificada tras revisión',ecv:'No',ic:'No',
 ckm_subclinica:'No identificada en evaluación disponible',ckm_prevent:'No identificado tras revisión',
 imc:'22',cintura:'80',cv_sexo_modelo:'Hombre',ckm_ascendencia:'Umbral general',
 pas:'120',pad:'75',fecha_pas:'2026-11-10',ckm_pa_contexto:'Valor habitual validado',ckm_hta_tratada:'No',
 dm2:'No',hba1c:'5.2',fecha_hba1c:'2026-11-10',dm_hba1c_fiable:'Fiable tras comprobación',
 trigliceridos:'100',fecha_lipidos:'2026-11-10',ckm_lipidos:'Sin alteración relevante',ckm_mets:'No',
 erc:'No',tfge:'95',fecha_tfge:'2026-11-10',cac:'10',unidad_cac:'mg/g',fecha_cac:'2026-11-10',
 persistencia:'No',ckm_reemplazo_renal:'No',lra_sospecha:'No',situacion_aguda:'Estable sin proceso agudo grave'};
const draft=(v={})=>Object.entries({...base,...v}).reduce((d,[k,x])=>setValue(d,k,String(x)),createDraft());
const run=v=>evaluateCkm(draft(v));
test('estadio 0 requiere revisión negativa completa, no formulario vacío',()=>{
 assert.equal(run().stage,0);assert.equal(evaluateCkm(createDraft()).stage,null);
});
for(const id of ['edad','embarazo','dm1','fecha_evaluacion','ckm_evaluacion_confirmada','ckm_cvd','ckm_subclinica',
 'ckm_prevent','imc','cintura','ckm_ascendencia','pas','ckm_pa_contexto','ckm_hta_tratada','dm2','hba1c',
 'fecha_hba1c','trigliceridos','ckm_mets','tfge','cac','unidad_cac','fecha_tfge','fecha_cac','ckm_lipidos'])
 test('dato ausente no equivale a estadio 0: '+id,()=>assert.equal(run({[id]:''}).stage,null));
for(const [changes,stage] of [
 [{imc:'24.99'},0],[{imc:'25'},1],[{imc:'23',ckm_ascendencia:'Ascendencia asiática'},1],
 [{imc:'22.99',ckm_ascendencia:'Ascendencia asiática'},0],
 [{cintura:'102'},1],[{cv_sexo_modelo:'Mujer',cintura:'88'},1],
 [{cv_sexo_modelo:'Mujer',cintura:'80',ckm_ascendencia:'Ascendencia asiática'},1],
 [{hba1c:'5.7'},1],[{hba1c:'6.49'},1],[{pas:'130'},2],[{pad:'80'},2],
 [{ckm_hta_tratada:'Sí'},2],[{trigliceridos:'150'},2],[{dm2:'Sí'},2],[{ckm_mets:'Sí'},2]
])test('frontera CKM '+JSON.stringify(changes),()=>assert.equal(run(changes).stage,stage));
test('HbA1c de diabetes no confirma diagnóstico ni estadio 2 desde una medición aislada',()=>{
 const r=run({hba1c:'6.5'});assert.equal(r.stage,null);assert.ok(r.missing.some(x=>x.includes('confirmar diagnóstico')));
});
test('glucemia actual no se presupone en ayunas',()=>{
 assert.equal(run({glucemia_actual:'110'}).stage,0);
 assert.equal(run({glucemia_ayunas:'100',fecha_glucemia_ayunas:'2026-11-10'}).stage,1);
});
test('lectura aislada de PA no establece criterio CKM de presión habitual',()=>{
 const r=run({pas:'130',ckm_pa_contexto:'Medición aislada / no confirmada'});assert.equal(r.stage,null);assert.equal(r.minimumStage,null);
});
test('DM2 documentada con evaluación superior desconocida conserva mínimo 2, no estadio final',()=>{
 const r=run({dm2:'Sí',ckm_subclinica:'No valorada'});assert.equal(r.stage,null);assert.equal(r.minimumStage,2);
});
for(const [egfr,acr,expected] of [['60','30',2],['59','29',2],['59','301',3],['44','30',3],['29','10',3],['30','10',2]])
 test('riesgo renal CKM con cronicidad '+egfr+'/'+acr,()=>assert.equal(run({erc:'Sí',persistencia:'Sí',tfge:egfr,cac:acr}).stage,expected));
test('frontera CAC 300 mantiene categoría renal y retiene estadio final',()=>{
 const r=run({erc:'Sí',persistencia:'Sí',tfge:'55',cac:'300'});assert.equal(r.stage,null);assert.equal(r.minimumStage,2);
 assert.ok(r.missing.some(x=>x.includes('300 mg/g')));
});
test('TFGe baja sin cronicidad no se convierte en ERC muy alta ni CKM 3',()=>{
 const r=run({tfge:'25'});assert.equal(r.stage,null);assert.notEqual(r.minimumStage,3);
});
test('CAC urinario alto no se convierte en calcio coronario ni aterosclerosis',()=>{
 const r=run({erc:'Sí',tfge:'95',cac:'500',persistencia:'Sí'});assert.equal(r.stage,2);
});
test('aterosclerosis/pre-IC documentada y contexto metabólico elevan a estadio 3',()=>{
 assert.equal(run({imc:'30',ckm_subclinica:'Confirmada por evaluación clínica/especializada',ckm_fecha_subclinica:'2026-10-10'}).stage,3);
 assert.equal(run({ckm_subclinica:'Confirmada por evaluación clínica/especializada',ckm_fecha_subclinica:'2026-10-10'}).stage,null);
});
test('ECV con contexto CKM: 4a o 4b según función renal, sin diagnosticar por FEVI aislada',()=>{
 const cvd={imc:'30',ecv:'Sí',ckm_cvd:'Confirmada',ckm_fecha_cvd:'2026-10-10'};
 assert.equal(run(cvd).substage,'4a');
 assert.equal(run({...cvd,tfge:'14.9',persistencia:'Sí',erc:'Sí'}).substage,'4b');
 assert.equal(run({...cvd,tfge:'15',persistencia:'Sí',erc:'Sí'}).substage,'4a');
 assert.equal(run({...cvd,ckm_reemplazo_renal:'Sí'}).substage,'4b');
 assert.equal(run({...cvd,tfge:''}).stage,4);assert.equal(run({...cvd,tfge:''}).substage,null);
 assert.equal(run({fevi:'35'}).stage,0);
});
test('ECV sin contexto metabólico/renal no basta para asignar CKM 4',()=>{
 assert.equal(run({ecv:'Sí',ckm_cvd:'Confirmada',ckm_fecha_cvd:'2026-10-10'}).stage,null);
});
test('SCORE2 y PREVENT son independientes; solo evidencia PREVENT explícita/versionada eleva a 3',()=>{
 assert.equal(run({pas:'170',colesterol_total:'300',hdl:'30',cv_region:'España · región ESC de riesgo bajo'}).stage,2);
 const v={ckm_prevent:'PREVENT-CVD ≥20 % a 10 años documentado',ckm_fecha_prevent:'2026-11-01',ckm_version_prevent:'Calculadora AHA revisada desde 14/10/2026'};
 assert.equal(run(v).stage,3);
 assert.equal(run({...v,ckm_version_prevent:'Versión no confirmada'}).stage,null);
 assert.equal(run({...v,edad:'80'}).stage,null);
 assert.equal(run({...v,ckm_fecha_prevent:'2026-10-01'}).stage,null);
});
for(const v of [{edad:'17'},{embarazo:'Sí'},{dm1:'Sí'}])test('ámbito específico '+JSON.stringify(v),()=>assert.equal(run(v).state,'fuera_de_ambito'));
for(const v of [{fecha_hba1c:'2026-11-13'},{ckm_fecha_cvd:'2026-02-30'},{potasio:'6.5'},
 {ic:'Sí'},{lra_sospecha:'Sí'},{situacion_aguda:'Enfermedad aguda grave'}])
 test('seguridad/cronología bloquea '+JSON.stringify(v),()=>{const r=run(v);assert.equal(r.stage,null);assert.ok(r.alerts.length)});
test('datos no disponibles y ausencia de confirmación no se convierten en negativos',()=>{
 assert.equal(evaluateCkm(setUnavailable(draft(),'cac',true)).stage,null);
 const r=run({dm2:'Sí',ckm_evaluacion_confirmada:'No'});assert.equal(r.stage,null);assert.equal(r.minimumStage,2);
});
test('el clasificador no contiene prescripción ni actuación supuesta',()=>{
 const r=run({dm2:'Sí'});assert.equal(r.prescription,null);assert.equal(r.patientDose,null);assert.equal(r.actionPerformed,false);
});
