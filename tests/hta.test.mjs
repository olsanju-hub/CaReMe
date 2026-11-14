import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue,setUnavailable} from '../src/model.mjs';
import {classifyOfficeBp,classifyOutOfOffice,evaluateHypertension} from '../src/clinical/hta.mjs';
const base={edad:'60',embarazo:'No procede',fecha_evaluacion:'2026-11-12',hta_conocida:'Sí',
 pas:'150',pad:'95',fecha_pas:'2026-11-10',hta_consulta_calidad:'Media de mediciones estandarizadas',
 hta_fuera_metodo:'AMPA',hta_fuera_pas:'140',hta_fuera_pad:'90',hta_fuera_fecha:'2026-11-10',hta_fuera_calidad:'Media válida según protocolo revisado',
 hta_alarma:'["Sin señales de alarma tras valoración"]',hta_dano_agudo:'No identificado tras valoración',
 hta_tratamiento:'Sin tratamiento',hta_ortostatismo:'No',hta_fragilidad:'No',hta_expectativa:'No',hta_tolerancia:'Sí',
 situacion_aguda:'Estable sin proceso agudo grave',lra_sospecha:'No',tfge:'70',fecha_tfge:'2026-11-10',
 potasio:'4.3',fecha_potasio:'2026-11-10',farmacos_clases:'["Sin tratamiento farmacológico"]',medicacion_revisada:'Sí',alergias_revisadas:'Sí'};
const draft=(v={})=>Object.entries({...base,...v}).reduce((d,[id,x])=>setValue(d,id,String(x)),createDraft());
const run=v=>evaluateHypertension(draft(v));
test('consulta: cada componente puede superar el umbral; CKM130/80 no diagnostica HTA',()=>{
 assert.equal(classifyOfficeBp(119,69),'pa_no_elevada');
 for(const v of [[120,69],[119,70],[130,80],[139,89]])assert.equal(classifyOfficeBp(...v),'pa_elevada');
 for(const v of [[140,89],[139,90]])assert.equal(classifyOfficeBp(...v),'rango_hta');
 assert.equal(classifyOfficeBp(90,100),null);
});
for(const [method,s,d] of [['AMPA',135,85],['MAPA diurna',135,85],['MAPA 24 horas',130,80],['MAPA nocturna',120,70]])
 test('umbrales propios de '+method,()=>{
  assert.equal(classifyOutOfOffice(s-.1,d-.1,method),'bajo_umbral_hta');
  assert.equal(classifyOutOfOffice(s,d-.1,method),'rango_hta');assert.equal(classifyOutOfOffice(s-.1,d,method),'rango_hta');
 });
for(const [v,pattern] of [
 [{},'elevacion_sostenida'],[{hta_fuera_pas:'130',hta_fuera_pad:'80'},'compatible_bata_blanca'],
 [{hta_fuera_pas:'130',hta_fuera_pad:'80',hta_tratamiento:'Con tratamiento confirmado',farmacos_clases:'["IECA"]'},'efecto_bata_blanca'],
 [{pas:'130',pad:'80'},'compatible_hta_enmascarada'],
 [{pas:'130',pad:'80',hta_tratamiento:'Con tratamiento confirmado',farmacos_clases:'["IECA"]'},'posible_mal_control_enmascarado']])
 test('patrón contextual '+pattern,()=>assert.equal(run(v).pattern,pattern));
test('elevación sostenida documentada permite revisión farmacológica, nunca pauta',()=>{
 const r=run();assert.equal(r.options.length,1);assert.equal(r.prescription,null);assert.equal(r.diagnosisEstablished,false);
 assert.equal(r.options[0].patientDose,null);assert.equal(r.options[0].performed,false);
});
for(const v of [{pas:'180'},{pad:'110'},{hta_fuera_pas:'180'},{hta_fuera_pad:'110'},{hta_dano_agudo:'Sospecha clínica'},
 {hta_alarma:'["Déficit neurológico o confusión aguda"]'},
 {hta_alarma:'["Sin señales de alarma tras valoración","Disnea intensa o edema pulmonar"]'}])
 test('seguridad por delante de seguimiento '+JSON.stringify(v),()=>{
  const r=run(v);assert.equal(r.state,'seguridad_prioritaria');assert.equal(r.options.length,0);assert.equal(r.target,null);
 });
test('una señal de alarma conserva prioridad incluso sin cifra PA',()=>{
 const r=run({pas:'',pad:'',hta_alarma:'["Dolor torácico sugestivo de isquemia"]'});assert.equal(r.state,'seguridad_prioritaria');
});
test('PA≥180 sin evaluación de daño no se etiqueta automáticamente como emergencia ni programa control rutinario',()=>{
 const r=run({pas:'180',hta_dano_agudo:'No valorado'});assert.ok(r.missing.length);assert.equal(r.options.length,0);
});
test('confirmación en un mes para rango160–179/100–109 sin fuera de consulta',()=>{
 const r=run({pas:'165',hta_fuera_calidad:'Registro incompleto o no revisado'});assert.match(r.followUp,/dentro de un mes/);
});
test('AMPA/MAPA preferidas pero no obligatorias si no están disponibles',()=>{
 const r=run({hta_fuera_pas:'',hta_fuera_pad:''});assert.ok(r.steps.some(x=>x.includes('otra visita')));assert.equal(r.options.length,0);
});
test('lectura aislada o registro incompleto no confirma patrón sostenido',()=>{
 assert.equal(run({hta_consulta_calidad:'Lectura aislada o técnica no confirmada'}).pattern,'no_evaluable');
 assert.notEqual(run({hta_fuera_calidad:'Registro incompleto o no revisado'}).pattern,'elevacion_sostenida');
});
const treated={hta_tratamiento:'Con tratamiento confirmado',farmacos_clases:'["IECA"]',farmacos:'Enalapril 10 mg/día confirmado'};
test('objetivo solo para paciente tratado con contexto documentado y tolerancia',()=>{
 const r=run(treated);assert.deepEqual(r.target.sbp,[120,129]);assert.deepEqual(r.target.dbp,[70,79]);
 assert.equal(run().target,null);assert.equal(run({...treated,hta_tolerancia:'No valorado'}).target,null);
});
for(const v of [{edad:'85'},{hta_fragilidad:'Sí'},{hta_ortostatismo:'Sí'},{hta_expectativa:'Sí'},{hta_tolerancia:'No'},{tfge:'29'}])
 test('objetivo individualizado ante excepción '+JSON.stringify(v),()=>assert.equal(run({...treated,...v}).target,null));
test('PA baja en tratado no sugiere intensificar por otra cifra',()=>{
 const r=run({...treated,pas:'125',pad:'65'});assert.ok(r.checks.some(x=>x.includes('no intensificar')));assert.ok(!r.steps.some(x=>x.includes('sin HTA confirmada')));
});
for(const v of [{potasio:'5.8'},{potasio:'3.1'},{fecha_tfge:''},{alergias_revisadas:'No'},{medicacion_revisada:'No'},
 {hta_fragilidad:'No valorada'},{hta_conocida:'No'}])
 test('no propone inicio sin condiciones de revisión '+JSON.stringify(v),()=>assert.equal(run(v).options.length,0));
test('declarar ausencia de tratamiento con clases antihipertensivas exige conciliación',()=>{
 const r=run({farmacos_clases:'["IECA"]'});assert.equal(r.state,'revisar_coherencia');assert.equal(r.options.length,0);
});
for(const v of [{hta_fuera_fecha:'2026-11-13'},{fecha_pas:'2026-02-30'},{pas:'0'},{hta_alarma:''},
 {embarazo:'No valorado'},{lra_sospecha:'Sí'}])
 test('datos incoherentes o no valorados no producen pauta '+JSON.stringify(v),()=>assert.equal(run(v).options.length,0));
for(const v of [{edad:'17'},{embarazo:'Sí'}])test('ámbito específico '+JSON.stringify(v),()=>assert.equal(run(v).state,'fuera_de_ambito'));
test('no disponible no se usa como dato normal',()=>assert.equal(evaluateHypertension(setUnavailable(draft(),'pas',true)).office,null));
test('PA grave retiene candidatos en la evaluación multiorgánica, también sin IC',async()=>{
 const {integratePatient}=await import('../src/clinical/integracion.mjs');
 const {auditCrossDomain}=await import('../src/clinical/auditoria.mjs');
 const d=draft({pas:'180',ic:'No',dm2:'Sí',erc:'Sí',persistencia:'Sí',cac:'100',unidad_cac:'mg/g'});
 assert.ok(auditCrossDomain(d).critical.some(x=>x.id==='BP_SEVERE_REVIEW'));
 assert.equal(integratePatient(d).options.length,0);
});
test('alarma de PA retiene candidatos globales aun sin lectura disponible',async()=>{
 const {auditCrossDomain}=await import('../src/clinical/auditoria.mjs');
 const d=draft({pas:'',pad:'',hta_alarma:'["Disnea intensa o edema pulmonar"]'});
 assert.ok(auditCrossDomain(d).critical.some(x=>x.id==='BP_ALARM_REVIEW'));
});
