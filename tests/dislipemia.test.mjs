import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue,setUnavailable} from '../src/model.mjs';
import {evaluateDyslipidemia,lipidCategoryFromScore} from '../src/clinical/dislipemia.mjs';
import {evaluateCvRisk} from '../src/clinical/riesgo-cv.mjs';
import {auditCrossDomain} from '../src/clinical/auditoria.mjs';
import {integratePatient} from '../src/clinical/integracion.mjs';
const base={edad:'60',embarazo:'No procede',lip_lactancia:'No procede',fecha_evaluacion:'2026-11-12',
 colesterol_total:'220',hdl:'50',ldl:'140',trigliceridos:'150',fecha_lipidos:'2026-11-10',lip_metodo_ldl:'Directo',
 lip_ascvd:'No',lip_riesgo:'Alto',lip_riesgo_confirmado:'Sí',lip_fuente_riesgo:'Valoración clínica documentada ESC/EAS',
 lip_estatina:'Ninguna',lip_ezetimiba:'No',lip_otros:'Ninguno',lip_adherencia:'Confirmadas',lip_intolerancia:'No',
 lip_mialgias:'No',lip_alarma:'No',lip_hepatica_activa:'No',alt:'25',lip_alt_lsn:'40',fecha_alt:'2026-11-10',
 lip_interacciones:'Sí',farmacos_clases:'["Sin tratamiento farmacológico"]',medicacion_revisada:'Sí',alergias_revisadas:'Sí',
 situacion_aguda:'Estable sin proceso agudo grave',lra_sospecha:'No',lip_cambio:'Sin cambio realizado'};
const draft=(v={})=>Object.entries({...base,...v}).reduce((d,[id,x])=>setValue(d,id,String(x)),createDraft());
const run=v=>evaluateDyslipidemia(draft(v));
const treated={lip_estatina:'Atorvastatina',lip_dosis_estatina:'40',lip_max_tolerada:'No',farmacos:'Atorvastatina 40 mg/día confirmada',farmacos_clases:'["Estatina"]'};
const basal={lip_ldl_basal:'140',lip_fecha_basal:'2026-01-10',lip_basal_confirmado:'Sí'};
for(const [n,r] of [[0,'Bajo'],[1.999,'Bajo'],[2,'Moderado'],[9.999,'Moderado'],[10,'Alto'],[19.999,'Alto'],[20,'Muy alto'],[100,'Muy alto']])
 test('categoría lipídica 2025 en '+n,()=>assert.equal(lipidCategoryFromScore(n),r));
for(const n of [-1,101,NaN,Infinity,'10',null])test('rechaza porcentaje '+String(n),()=>assert.equal(lipidCategoryFromScore(n),null));
test('SCORE2 publicado 5.9% usa categoría moderada lipídica, no cortes por edad de prevención2021',()=>{
 const r=run({edad:'50',cv_sexo_modelo:'Hombre',cv_region:'España · región ESC de riesgo bajo',tabaco:'Actual',ecv:'No',ic:'No',dm1:'No',dm2:'No',erc:'No',cv_hfamiliar:'No',cv_sintomas:'No',pas:'140',pad:'85',fecha_pas:'2026-11-12',colesterol_total:String(5.5*38.67),hdl:String(1.3*38.67),ldl:'130',lip_riesgo:'No confirmado'});
 assert.equal(r.risk,'Moderado');assert.equal(r.goal.ldlLessThan,100);assert.match(r.riskOrigin,/2025/);
});
for(const [category,target] of [['Bajo',116],['Moderado',100],['Alto',70],['Muy alto',55]])
 test('objetivo absoluto estricto '+category,()=>{
  assert.equal(run({lip_riesgo:category,ldl:String(target)}).comparison.absoluteMet,false);
  assert.equal(run({lip_riesgo:category,ldl:String(target-.1)}).comparison.absoluteMet,true);
 });
test('reducción50% independiente del objetivo absoluto',()=>{
 const r=run({...treated,...basal,ldl:'70'});assert.equal(r.reduction,50);assert.equal(r.comparison.reductionMet,true);assert.equal(r.comparison.absoluteMet,false);
 assert.equal(run({...treated,...basal,ldl:'69.9'}).comparison.bothMet,true);
 assert.equal(run({...treated,lip_ldl_basal:'100',lip_fecha_basal:'2026-01-10',lip_basal_confirmado:'Sí',ldl:'60'}).comparison.reductionMet,false);
});
test('LDL absoluto alcanzado y basal desconocido no genera escalada falsa',()=>{
 const r=run({...treated,ldl:'60'});assert.equal(r.comparison.absoluteMet,true);assert.equal(r.comparison.reductionMet,null);assert.equal(r.options.length,0);
 assert.ok(r.checks.some(x=>x.includes('Sin basal')));
});
for(const v of [{lip_basal_confirmado:'No'},{lip_fecha_basal:''},{lip_fecha_basal:'2026-11-13'}])
 test('no fabrica reducción sin basal validado '+JSON.stringify(v),()=>assert.equal(run({...treated,...basal,...v}).reduction,null));
test('basal posterior al actual retiene interpretación',()=>assert.equal(run({...basal,lip_fecha_basal:'2026-11-11'}).state,'revisar_coherencia'));
test('no HDL por diferencia, sin asignar riesgo desde esa cifra aislada',()=>assert.equal(run().nonHdl,170));
test('ASCVD fechada impone muy alto sin SCORE2',()=>{const r=run({lip_ascvd:'Sí',lip_fecha_ascvd:'2026-01-01',lip_riesgo:'No confirmado'});assert.equal(r.risk,'Muy alto');assert.equal(r.goal.ldlLessThan,55)});
test('ASCVD sin documento no habilita escalada',()=>{const r=run({lip_ascvd:'Sí'});assert.ok(r.missing.some(x=>x.includes('aterosclerótica')));assert.equal(r.options.length,0)});
test('ASCVD con categoría inferior es incoherente',()=>assert.equal(run({lip_ascvd:'Sí',lip_fecha_ascvd:'2026-01-01'}).state,'revisar_coherencia'));
test('IC sola no equivale a ASCVD',()=>{const r=run({ic:'Sí',lip_riesgo:'No confirmado'});assert.equal(r.risk,null);assert.equal(r.goal,null)});
for(const [gfr,risk] of [[59,'Alto'],[30,'Alto'],[29.9,'Muy alto']])test('ERC conocida fija mínimo '+gfr,()=>assert.equal(run({erc:'Sí',tfge:String(gfr),fecha_tfge:'2026-11-10',lip_riesgo:'No confirmado'}).risk,risk));
test('ERC grave no acepta categoría clínica moderada',()=>assert.equal(run({erc:'Sí',tfge:'29',fecha_tfge:'2026-11-10',lip_riesgo:'Moderado'}).state,'revisar_coherencia'));
test('TFGe baja aislada sin ERC conocida no diagnostica cronicidad',()=>assert.equal(run({tfge:'29',fecha_tfge:'2026-11-10',lip_riesgo:'No confirmado'}).risk,null));
test('LDL sin tratamiento >190 identifica mínimo alto y sospechaHF, sin diagnosticarla',()=>{
 const r=run({ldl:'191',lip_riesgo:'No confirmado'});assert.equal(r.risk,'Alto');assert.ok(r.checks.some(x=>x.includes('No se diagnostica HF')));
});
for(const [value,unit,elevated] of [['50','mg/dL',false],['50.1','mg/dL',true],['105','nmol/L',false],['105.1','nmol/L',true]])
 test('Lp(a) respeta unidad y umbral '+value+unit,()=>{
  const r=run({lip_lpa:value,lip_unidad_lpa:unit});assert.equal(r.checks.some(x=>x.includes('Lp(a) elevada')),elevated);assert.equal(r.risk,'Alto');assert.ok(!('convertedLpa' in r));
 });
test('Lp(a) sin unidad se retiene sin convertir',()=>assert.ok(run({lip_lpa:'70'}).checks.some(x=>x.includes('sin unidad'))));
for(const tg of ['400','500',''])test('Friedewald no interpreta TG '+tg,()=>{const r=run({lip_metodo_ldl:'Calculado con Friedewald',trigliceridos:tg});assert.equal(r.options.length,0);assert.equal(r.comparison,null)});
test('Friedewald399 interpretable; directo440 advierte pancreatitis sin prescribir',()=>{
 assert.ok(run({lip_metodo_ldl:'Calculado con Friedewald',trigliceridos:'399'}).comparison);
 assert.ok(run({trigliceridos:'440'}).checks.some(x=>x.includes('pancreatitis')));
});
for(const v of [{trigliceridos:'881'},{lip_alarma:'Sí'}])test('prioridad aguda transversal '+JSON.stringify(v),()=>{
 const d=draft(v),r=evaluateDyslipidemia(d);assert.equal(r.state,'seguridad_prioritaria');assert.equal(r.goal,null);assert.equal(r.options.length,0);
 assert.ok(auditCrossDomain(d).critical.some(x=>x.id.startsWith('LIPID')));
 const integrated=integratePatient(d);assert.equal(integrated.options.length,0);
});
for(const v of [treated,{lip_ezetimiba:'Sí'},{farmacos_clases:'["Anticuerpo PCSK9"]'}])test('perfil tratado no rebaja riesgo basal '+JSON.stringify(v),()=>{
 assert.equal(evaluateCvRisk(draft(v)).route,'riesgo_basal_en_tratamiento');
 assert.equal(run({...v,lip_riesgo:'No confirmado'}).risk,null);
});
for(const [v,id] of [[{},'LIP-START-REVIEW'],[treated,'LIP-OPTIMIZE'],[{...treated,lip_max_tolerada:'Sí'},'LIP-EZETIMIBE'],[{...treated,lip_max_tolerada:'Sí',lip_ezetimiba:'Sí'},'LIP-ADDITIONAL'],[{lip_intolerancia:'Documentada tras evaluación'},'LIP-NONSTATIN']])
 test('opción para revisión '+id,()=>{const r=run(v);assert.equal(r.options[0]?.id,id);assert.equal(r.prescription,null);assert.equal(r.patientDose,null);assert.equal(r.options[0].performed,false)});
for(const v of [{lip_adherencia:'Dudas o incumplimiento'},{lip_interacciones:'No valoradas'},{medicacion_revisada:'No'},{alergias_revisadas:'No'},{lip_mialgias:'Sí'},{lip_intolerancia:'Sospechada / no confirmada'},{fecha_alt:''},{lip_alt_lsn:''}])
 test('seguridad incompleta retiene escalada '+JSON.stringify(v),()=>assert.equal(run(v).options.length,0));
const rosu={...treated,lip_estatina:'Rosuvastatina',lip_dosis_estatina:'40',farmacos:'Rosuvastatina 40 mg/día',lip_aclaramiento:'60',lip_fecha_aclaramiento:'2026-11-10'};
test('rosuvastatina precisa CrCl; TFGe normalizada no lo sustituye',()=>{const r=run({...rosu,lip_aclaramiento:'',tfge:'90',fecha_tfge:'2026-11-10'});assert.equal(r.options.length,0);assert.ok(r.missing.some(x=>x.includes('CrCl')))});
for(const v of [{lip_aclaramiento:'29.9',lip_dosis_estatina:'5'},{lip_aclaramiento:'59.9'},{lip_dosis_estatina:'41'}])
 test('restricción rosuvastatina '+JSON.stringify(v),()=>assert.equal(run({...rosu,...v}).state,'seguridad_prioritaria'));
test('CrCl60 permite revisión dosis40; no se devuelve dosis seleccionada',()=>assert.equal(run(rosu).options[0]?.id,'LIP-OPTIMIZE'));
for(const v of [{...treated,lip_dosis_estatina:'81'},{lip_hepatica_activa:'Sí'},{alt:'120'},{situacion_aguda:'Enfermedad aguda grave'},{lra_sospecha:'Sí'}])
 test('retiene por seguridad '+JSON.stringify(v),()=>{const r=run(v);assert.equal(r.options.length,0);assert.equal(r.followUp,null)});
for(const v of [{edad:'17'},{embarazo:'Sí'},{lip_lactancia:'Sí'}])test('no extrapola poblaciones especiales '+JSON.stringify(v),()=>assert.equal(run(v).state,'fuera_de_ambito'));
const changed={...treated,lip_cambio:'Inicio o ajuste realmente administrado',lip_cambio_confirmado:'Sí',lip_fecha_cambio:'2026-11-01'};
test('control8±4 semanas solo actuación confirmada y fechada',()=>{
 const r=run(changed);assert.equal(r.followUp.from,'2026-11-29');assert.equal(r.followUp.to,'2027-01-24');assert.equal(r.followUp.appointmentCreated,false);
});
for(const v of [{lip_cambio:'Propuesto, no administrado'},{lip_cambio_confirmado:'No'},{lip_fecha_cambio:''},{lip_interacciones:'No valoradas'},{lip_estatina:'Ninguna',farmacos_clases:'["Sin tratamiento farmacológico"]'}])
 test('no inventa control desde propuesta o falta de seguridad '+JSON.stringify(v),()=>assert.equal(run({...changed,...v}).followUp,null));
test('perfil previo al cambio no provoca segunda escalada; mantiene ventana de control',()=>{
 const r=run({...changed,fecha_lipidos:'2026-10-10'});assert.equal(r.options.length,0);assert.ok(r.followUp);assert.ok(r.checks.some(x=>x.includes('precede')));
});
test('control vencido exige revisar historia, sin cita ni actuación ficticia',()=>assert.equal(run({...changed,lip_fecha_cambio:'2026-01-01'}).followUp.status,'plazo_superado'));
for(const v of [{fecha_lipidos:'2026-02-30'},{lip_fecha_cambio:'2026-11-13'},{ldl:'0x80'},{ldl:'-1'},{ldl:'230'},{hdl:'230'}])
 test('entrada incoherente no produce escalada '+JSON.stringify(v),()=>assert.equal(run(v).options.length,0));
test('dato no disponible no se usa como cero ni opción',()=>assert.equal(evaluateDyslipidemia(setUnavailable(draft(),'ldl',true)).options.length,0));
test('colesterol total marcado impide categoría baja aunque LDL no sea >190',()=>assert.equal(run({colesterol_total:'311',lip_riesgo:'Bajo'}).state,'revisar_coherencia'));
test('otra estatina sin dosis/documento no habilita asociación',()=>assert.equal(run({...treated,lip_estatina:'Otra',lip_dosis_estatina:'',farmacos:'',lip_max_tolerada:'Sí'}).options.length,0));
test('cambio confirmado sin fecha tampoco permite nueva escalada',()=>assert.equal(run({...changed,lip_fecha_cambio:''}).options.length,0));
test('ASCVD sin tratamiento conserva revisión secundaria aunque LDL<55',()=>{
 const r=run({lip_ascvd:'Sí',lip_fecha_ascvd:'2026-01-01',lip_riesgo:'No confirmado',ldl:'50'});assert.equal(r.options[0]?.id,'LIP-SECONDARY-REVIEW');
});
test('TG881 mantiene prioridad también en embarazo',()=>assert.equal(run({trigliceridos:'881',embarazo:'Sí'}).state,'seguridad_prioritaria'));
