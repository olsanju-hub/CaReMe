import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue,setUnavailable} from '../src/model.mjs';
import {evaluateMasld,classifyMasldFib4} from '../src/clinical/masld.mjs';
import {integratePatient} from '../src/clinical/integracion.mjs';
import {auditCrossDomain} from '../src/clinical/auditoria.mjs';
const base={edad:'55',embarazo:'No procede',fecha_evaluacion:'2026-11-12',fib4_agudo:'No',
 masld_alarma:'No',masld_cirrosis:'No tras valoración',fib4_contexto:'Perfil de riesgo compatible con evaluación MASLD',
 hepatico_valoracion:'Esteatosis documentada y otras causas evaluadas',masld_alcohol:'Revisados',masld_etiologia:'Compatible con evaluación MASLD',
 masld_fib4_origen:'Informado por fuente externa',fib4_informado:'1.1',masld_fecha_fib4:'2026-11-10',masld_fuente_fib4:'Informe de laboratorio revisado'};
const draft=(v={})=>{
 const entries={...base,...v};
 let d=Object.entries(entries).filter(([id])=>id!=='masld_fib4_confirmado').reduce((d,[id,x])=>setValue(d,id,String(x)),createDraft());
 return setValue(d,'masld_fib4_confirmado',v.masld_fib4_confirmado??'Sí');
};
const run=v=>evaluateMasld(draft(v));
const calc={masld_fib4_origen:'Calculado desde analítica',ast:'20',alt:'25',plaquetas:'200',fecha_ast:'2026-11-10',fecha_alt:'2026-11-10',fecha_plaquetas:'2026-11-10'};
const vcte={elastografia:'7.9',masld_elasto_metodo:'VCTE / FibroScan',masld_fecha_elasto:'2026-11-10',masld_elasto_calidad:'Válidas para interpretación',masld_elasto_confusores:'Sin confusores relevantes tras revisión'};
for(const [age,value,band] of [[35,1.299,'bajo'],[65,1.3,'intermedio'],[66,1.999,'bajo'],[66,2,'intermedio'],[65,2,'intermedio'],[55,2.67,'intermedio'],[55,2.67001,'alto'],[90,2.67001,'alto']])
 test('frontera FIB4 '+age+'/'+value,()=>assert.equal(classifyMasldFib4(value,age),band));
for(const [v,a] of [[0,55],[-1,55],[NaN,55],[Infinity,55],['1.1',55],[1.1,34],[1.1,121],[1.1,35.5]])test('helper no extrapola '+v+'/'+a,()=>assert.equal(classifyMasldFib4(v,a),null));
test('informado con procedencia alimenta ruta rápida sin fabricar AST o plaquetas',()=>{
 const r=run();assert.equal(r.route,'menor_probabilidad_por_fib4');assert.equal(r.fib4.value,1.1);assert.equal(r.fib4.calculated,null);assert.equal(r.fib4.origin,'Informado por fuente externa');
 assert.deepEqual(r.followUp.intervalMonths,[12,36]);assert.equal(r.followUp.appointmentCreated,false);assert.equal(r.diagnosisEstablished,false);assert.equal(r.prescription,null);
});
for(const v of [{fib4_informado:'0'},{masld_fecha_fib4:''},{masld_fecha_fib4:'2026-11-13'},{masld_fuente_fib4:''},{masld_fib4_confirmado:'No'},{masld_fib4_origen:'No seleccionado'}])
 test('no usa informe sin procedencia '+JSON.stringify(v),()=>{const r=run(v);assert.equal(r.fib4,null);assert.equal(r.followUp,null)});
test('cálculo reproducible usa fórmula compartida y fechas completas',()=>{const r=run({...calc,fib4_informado:''});assert.equal(r.fib4.value,1.1);assert.equal(r.fib4.origin,'Calculado desde analítica')});
for(const v of [{fecha_ast:''},{fecha_alt:'2026-11-09'},{plaquetas:'0'},{ast:''},{fecha_plaquetas:'2026-11-13'}])
 test('no compone FIB4 con extracción incompleta '+JSON.stringify(v),()=>assert.equal(run({...calc,...v}).followUp,null));
test('cálculo e informe misma fecha con banda diferente retienen elección',()=>{const r=run({...calc,fib4_informado:'3'});assert.equal(r.route,'conciliar_fib4');assert.equal(r.referral.length,0);assert.equal(r.followUp,null)});
test('fechas diferentes permiten elegir origen sin inferir una tendencia',()=>{
 const r=run({...calc,masld_fecha_fib4:'2026-10-10',fib4_informado:'3'});assert.equal(r.fib4.value,1.1);assert.ok(r.checks.some(x=>x.includes('sin mezclar')));
});
for(const [v,route] of [['1.299','menor_probabilidad_por_fib4'],['1.3','evaluacion_secundaria'],['2.67','evaluacion_secundaria'],['2.671','derivacion_por_fib4']])
 test('ruta con valor completo '+v,()=>assert.equal(run({fib4_informado:v}).route,route));
test('1.299 se muestra redondeable1.30 pero decisión no se redondea',()=>assert.equal(run({fib4_informado:'1.299'}).fib4.band,'bajo'));
test('zona intermedia no asigna por defecto espera anual',()=>{const r=run({fib4_informado:'2.5'});assert.equal(r.followUp,null);assert.ok(r.steps.some(x=>x.includes('VCTE')));assert.ok(r.checks.some(x=>x.includes('≤1 año')))});
for(const [value,band,route] of [['7.999','bajo','menor_probabilidad_tras_vcte'],['8','elevado','derivacion_por_vcte'],['11.999','elevado','derivacion_por_vcte'],['12','muy_elevado','derivacion_por_vcte']])
 test('VCTE válida en '+value,()=>{const r=run({...vcte,elastografia:value,fib4_informado:'2'});assert.equal(r.route,route);assert.equal(r.elastography.band,band);assert.equal(r.diagnosisEstablished,false)});
for(const v of [{masld_elasto_metodo:'2D-SWE u otra ecográfica'},{masld_elasto_metodo:'Elastografía por resonancia'},{masld_elasto_metodo:'No consta'},{masld_elasto_calidad:'No revisadas'},{masld_elasto_calidad:'No válidas'},{masld_elasto_confusores:'Presentes o sospechados'},{masld_elasto_confusores:'No valorados'},{masld_fecha_elasto:''},{elastografia:'0'}])
 test('no aplica umbral VCTE sin método/calidad '+JSON.stringify(v),()=>{const r=run({...vcte,...v});assert.equal(r.elastography.valid,false);assert.equal(r.elastography.band,null);assert.equal(r.followUp,null)});
test('VCTE alta con FIB4 bajo no tranquiliza ni diagnostica cirrosis',()=>{const r=run({...vcte,elastografia:'12'});assert.equal(r.route,'derivacion_por_vcte');assert.equal(r.referral[0].performed,false);assert.equal(r.followUp,null);assert.ok(r.checks.some(x=>x.includes('discordancia')))});
test('FIB4 alto con VCTE baja conserva valoración especializada',()=>{const r=run({...vcte,fib4_informado:'3'});assert.equal(r.route,'derivacion_por_fib4');assert.equal(r.followUp,null);assert.ok(r.checks.some(x=>x.includes('discrepancia')))});
test('VCTE elevada válida orienta valoración incluso sin primer test completo',()=>{const r=run({...vcte,elastografia:'8',fib4_informado:''});assert.equal(r.route,'derivacion_por_vcte');assert.equal(r.followUp,null);assert.ok(r.missing.length)});
for(const v of [{masld_alarma:'Sí'},{fib4_agudo:'Sí'},{situacion_aguda:'Enfermedad aguda grave'},{potasio:'6.5'}])
 test('prioridad aguda '+JSON.stringify(v),()=>{const r=run(v);assert.equal(r.state,'seguridad_prioritaria');assert.equal(r.followUp,null);assert.equal(r.referral.length,0)});
test('alarma hepática retiene candidatos de otros dominios',()=>{
 const d=draft({masld_alarma:'Sí',dm2:'Sí',ic:'Sí',erc:'Sí',tfge:'54',cac:'100',unidad_cac:'mg/g',persistencia:'Sí'});
 assert.ok(auditCrossDomain(d).critical.some(x=>x.id==='MASLD_ACUTE_REVIEW'));assert.equal(integratePatient(d).options.length,0);
});
for(const v of [{masld_cirrosis:'Conocida'},{masld_cirrosis:'Sospechada'},{hepatica_grave:'Sí'}])
 test('hepatopatía avanzada no se cierra por FIB4 bajo '+JSON.stringify(v),()=>{const r=run(v);assert.equal(r.route,'hepatopatia_avanzada');assert.equal(r.followUp,null);assert.equal(r.referral.length,1)});
for(const v of [{edad:'17'},{embarazo:'Sí'},{masld_etiologia:'MetALD, alcohol u otra etiología predominante'}])
 test('ámbito especial '+JSON.stringify(v),()=>{const r=run(v);assert.equal(r.state,'fuera_de_ambito');assert.equal(r.followUp,null)});
test('edad34 no descarta por FIB4 bajo; 35 permite estratificación',()=>{assert.equal(run({edad:'34'}).route,'evaluacion_por_edad');assert.equal(run({edad:'34'}).followUp,null);assert.equal(run({edad:'35'}).fib4.band,'bajo')});
test('edad66 ajusta umbral, 65 conserva1.3',()=>{assert.equal(run({edad:'66',fib4_informado:'1.8'}).fib4.band,'bajo');assert.equal(run({edad:'65',fib4_informado:'1.8'}).fib4.band,'intermedio')});
for(const v of [{fib4_agudo:'No valorado'},{fib4_contexto:'No consta'},{masld_alcohol:'Pendientes'},{masld_etiologia:'No aclarado'},{hepatico_valoracion:'Valoración incompleta o pendiente'},{masld_alarma:'No valorado'},{masld_cirrosis:'No valorada'}])
 test('información pendiente no se convierte en normal '+JSON.stringify(v),()=>assert.equal(run(v).followUp,null));
test('FIB4 alto con agudo sin valorar no usa banda de derivación',()=>{const r=run({fib4_informado:'3',fib4_agudo:'No valorado'});assert.equal(r.fib4.band,null);assert.equal(r.referral.length,0)});
test('esteatosis no confirmada permite case finding pero no diagnostica MASLD',()=>{const r=run({esteatosis:'No',hepatico_valoracion:'Otras causas evaluadas; esteatosis no confirmada',dm2:'Sí'});assert.ok(r.followUp);assert.equal(r.diagnosisEstablished,false)});
test('enzimas persistentes requieren estudio incluso con FIB4 bajo',()=>assert.ok(run({masld_enzimas_persistentes:'Sí'}).checks.some(x=>x.includes('persistentemente'))));
for(const v of [{fib4_informado:'0x2'},{elastografia:'1e1'},{masld_fecha_fib4:'2026-02-30'},{masld_fecha_elasto:'2026-11-13'}])
 test('entrada incoherente no genera seguimiento '+JSON.stringify(v),()=>assert.equal(run(v).followUp,null));
for(const [id,value] of [['edad','66'],['fib4_informado','2.8'],['masld_fecha_fib4','2026-10-10'],['masld_fuente_fib4','Otro informe']])
 test('editar dato fuente invalida confirmación externa '+id,()=>{const d=setValue(draft(),id,value);assert.equal(d.values.masld_fib4_confirmado,'No');assert.equal(evaluateMasld(d).fib4,null)});
test('mutación fuera del modelo no reutiliza asociación antigua',()=>{const d=draft();d.values.fib4_informado='3';assert.equal(evaluateMasld(d).fib4,null)});
test('disponibilidad invalida asociación; otro dato no invalida la fuente seleccionada',()=>{
 assert.equal(evaluateMasld(setUnavailable(draft(),'edad',true)).fib4,null);
 assert.equal(evaluateMasld(setValue(draft(),'dm2','Sí')).fib4.value,1.1);
});
