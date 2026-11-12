import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue,setUnavailable} from '../src/model.mjs';
import {evaluateObesity,classifyAdultBmi} from '../src/clinical/obesidad.mjs';
import {integratePatient} from '../src/clinical/integracion.mjs';
const base={edad:'55',embarazo:'No procede',ob_lactancia:'No procede',fecha_evaluacion:'2026-11-12',imc:'32',ob_fecha_medidas:'2026-11-10',
 dm2:'No',comorbilidad_peso_confirmada:'No',obesidad_perfil:'["Ninguna seleccionada"]',ob_acuerdo:'Sí',ob_complicaciones_revisadas:'Sí',
 ob_perdida_involuntaria:'No',ob_edema:'No',ob_tca:'No',ob_musculo:'No tras valoración',ob_complicacion_grave:'No',ob_secundaria:'No',
 ob_alimentacion:'Sí',ob_actividad:'Sí',ob_limitacion_ejercicio:'No',ob_sueno_psicosocial:'Sí',ob_respuesta_previa:'Objetivos no alcanzados o reganancia',
 ob_farmaco_actual:'Ninguno',ob_objetivo:'Mantenimiento y función',ob_objetivo_salud:'Mejorar capacidad funcional y salud',
 ob_plan_estado:'Propuesto, no iniciado',embarazo_planificado:'No procede',pancreatitis_sospecha:'No',pancreatitis_previa:'No',
 deshidratacion_gi:'No',gastroparesia_grave:'No',vision_subita:'No',hepatica_grave:'No',tfge:'70',fecha_tfge:'2026-11-10',
 situacion_aguda:'Estable sin proceso agudo grave',farmacos_clases:'["Sin tratamiento farmacológico"]',medicacion_revisada:'Sí',alergias_revisadas:'Sí'};
const draft=(v={})=>Object.entries({...base,...v}).reduce((d,[id,x])=>setValue(d,id,String(x)),createDraft());
const run=(v={},mode='detail')=>evaluateObesity(draft(v),mode);
for(const [v,c] of [[18.49,'bajo_peso'],[18.5,'rango_18_5_24_9'],[24.99,'rango_18_5_24_9'],[25,'sobrepeso'],[29.99,'sobrepeso'],[30,'obesidad_I'],[34.99,'obesidad_I'],[35,'obesidad_II'],[39.99,'obesidad_II'],[40,'obesidad_III']])
 test('IMC frontera '+v,()=>assert.equal(classifyAdultBmi(v),c));
for(const v of [0,-1,NaN,Infinity,'30',null])test('IMC no válido '+v,()=>assert.equal(classifyAdultBmi(v),null));
test('cálculo utiliza peso/talla y no redondea para decidir',()=>{
 const r=run({peso:'89.999',talla:'173.20508',imc:''});assert.ok(r.anthropometry.bmi<30);assert.equal(r.anthropometry.category,'sobrepeso');assert.equal(r.anthropometry.origin,'Calculado desde peso/talla');
});
test('IMC informado discordante retiene decisiones',()=>{const r=run({peso:'100',talla:'200'});assert.equal(r.state,'revisar_coherencia');assert.equal(r.options.length,0)});
test('relación cintura/talla no sustituye umbral de producto',()=>{const r=run({imc:'26',talla:'180',cintura:'100'});assert.ok(r.anthropometry.waistHeightRatio>0.5);assert.equal(r.options.length,0);assert.equal(r.diagnosisEstablished,false)});
for(const [bmi,comorb,n] of [['26.99','Sí',0],['27','No',0],['27','Sí',2],['29.99','Sí',2],['30','No',2]])
 test('frontera CIMA '+bmi+'/'+comorb,()=>assert.equal(run({imc:bmi,comorbilidad_peso_confirmada:comorb}).options.length,n));
test('fármacos son opciones de revisión sin dosis individual',()=>{
 const r=run();assert.equal(r.options.length,2);assert.ok(r.options.every(x=>x.patientDose===null&&x.prescription===null&&x.performed===false));assert.ok(!r.options.some(x=>x.id.includes('ozempic')));
 assert.equal(r.surgeryEligibility,null);assert.equal(r.prescription,null);
});
test('no iniciar por IMC solo sin respuesta previa o complicación grave',()=>{assert.equal(run({ob_respuesta_previa:'No realizada'}).options.length,0);assert.equal(run({ob_respuesta_previa:'No realizada',ob_complicacion_grave:'Sí'}).options.length,2)});
for(const v of [{embarazo_planificado:'Sí'},{fecha_tfge:''},{tfge:''},{medicacion_revisada:'No'},{alergias_revisadas:'No'},{gastroparesia_grave:'Sí'}])
 test('barreras producto '+JSON.stringify(v),()=>assert.equal(run(v).options.length,0));
test('Wegovy excluido renalmente no se extrapola a tirzepatida',()=>{const r=run({tfge:'29'});assert.deepEqual(r.options.map(x=>x.id),['tirzepatida']);assert.ok(r.productReviews.find(x=>x.drugId==='semaglutida_wegovy_sc').blocked.length)});
test('no añade otra incretina si ya existe, aunque no se use específicamente para peso',()=>assert.equal(run({farmacos_clases:'["arGLP-1"]'}).options.length,0));
const current={ob_farmaco_actual:'Tirzepatida',farmacos_clases:'["Agonista dual GIP/GLP-1"]',farmacos:'Tirzepatida5mg semanal confirmada',ob_adherencia:'Sí',ob_tolerancia:'Adecuada'};
test('IMC actual bajo umbral no ordena retirar tratamiento previo',()=>{
 const r=run({...current,imc:'26'});assert.equal(r.options.length,0);assert.ok(r.checks.some(x=>x.includes('no ordena suspender')));assert.ok(r.lifestyle.length);
});
for(const v of [{farmacos:''},{ob_adherencia:'No'}])test('tratamiento actual no conciliado '+JSON.stringify(v),()=>assert.equal(run({...current,...v}).followUp,null));
test('producto actual incompatible con declarar ausencia de fármacos',()=>assert.equal(run({...current,farmacos_clases:'["Sin tratamiento farmacológico"]'}).state,'seguridad_prioritaria'));
for(const v of [{pancreatitis_sospecha:'Sí'},{deshidratacion_gi:'Sí'},{vision_subita:'Sí'},{situacion_aguda:'Enfermedad aguda grave'},{potasio:'6.5'}])
 test('prioridad aguda '+JSON.stringify(v),()=>{const r=run(v);assert.equal(r.state,'seguridad_prioritaria');assert.equal(r.options.length,0);assert.equal(r.followUp,null)});
for(const v of [{edad:'17'},{embarazo:'Sí'},{ob_lactancia:'Sí'}])test('ámbito especial '+JSON.stringify(v),()=>assert.equal(run(v).state,'fuera_de_ambito'));
for(const [v,state] of [[{ob_perdida_involuntaria:'Sí'},'valoracion_nutricional'],[{imc:'18'},'valoracion_nutricional'],[{ob_tca:'Sí'},'valoracion_especializada'],[{ob_edema:'Sí'},'composicion_no_evaluable']])
 test('no impone pérdida de peso '+JSON.stringify(v),()=>{const r=run(v);assert.equal(r.state,state);assert.equal(r.options.length,0);assert.equal(r.response,null);assert.equal(r.followUp,null)});
test('respeta decisión de no abordar peso',()=>{const r=run({ob_acuerdo:'No'});assert.equal(r.state,'decision_compartida');assert.equal(r.options.length,0);assert.equal(r.lifestyle.length,0)});
test('sarcopenia sospechada necesita adaptación sin fórmula universal de proteína',()=>{
 const r=run({ob_musculo:'Sí'});assert.ok(r.missing.some(x=>x.includes('preservar músculo')));assert.equal(r.options.length,0);assert.equal(r.followUp,null);
 const adapted=run({ob_musculo:'Sí',ob_adaptacion_muscular:'Acordado y adaptado'});assert.ok(adapted.lifestyle.some(x=>x.text.includes('masa muscular')));assert.ok(adapted.referral.some(x=>x.id==='OB-MUSCLE'));
});
test('perfil sarcopénico no queda neutralizado por marcar sin riesgo',()=>assert.equal(run({obesidad_perfil:'["Obesidad sarcopénica"]'}).options.length,0));
test('ERC/IC exige individualizar ingestas',()=>assert.ok(run({erc:'Sí'}).checks.some(x=>x.includes('proteína, sodio y líquidos'))));
test('limitación funcional evita objetivo aeróbico genérico',()=>{const r=run({ob_limitacion_ejercicio:'Sí'});assert.ok(r.lifestyle.find(x=>x.id==='OB-ACTIVITY').text.includes('Adaptar'));assert.ok(!r.lifestyle.find(x=>x.id==='OB-ACTIVITY').text.includes('150'))});
test('sospecha secundaria orienta etiología y retiene intensificación',()=>{const r=run({ob_secundaria:'Sí'});assert.ok(r.referral.some(x=>x.id==='OB-SECONDARY'));assert.equal(r.options.length,0);assert.equal(r.followUp,null)});
for(const [v,id] of [[{imc:'40'},'OB-SURGERY'],[{imc:'35',comorbilidad_peso_confirmada:'Sí'},'OB-SURGERY'],[{imc:'35'},'OB-SURGERY-EXPANDED'],[{imc:'30'},'OB-METABOLIC']])
 test('vía cirugía/derivación contextual '+JSON.stringify(v),()=>{const r=run(v);assert.ok(r.referral.some(x=>x.id===id));assert.equal(r.surgeryEligibility,null);assert.ok(r.referral.every(x=>x.performed===false))});
const measures={peso:'95',talla:'180',imc:'',ob_peso_basal:'100',ob_fecha_basal:'2026-01-01',ob_basal_confirmado:'Sí',ob_objetivo:'Reducción ponderal',ob_objetivo_porcentaje:'5'};
test('respuesta y objetivo relativo con basal validado, sin regla de retirada universal',()=>{
 const r=run({...measures,...current});assert.equal(r.response.lossPercent,5);assert.equal(r.response.goalMet,true);assert.equal(r.goal.weightKg,95);assert.ok(r.checks.some(x=>x.includes('regla universal')));
});
test('ganancia no se presenta como pérdida favorable',()=>{const r=run({...measures,peso:'105'});assert.equal(r.response.lossPercent,-5);assert.equal(r.response.goalMet,false)});
for(const v of [{ob_fecha_basal:''},{ob_basal_confirmado:'No'},{ob_peso_basal:'0'},{ob_fecha_basal:'2026-11-11'}])test('basal insuficiente no fabrica respuesta '+JSON.stringify(v),()=>assert.equal(run({...measures,...v}).response,null));
test('objetivo que conduciría a bajo peso exige revisión',()=>{const r=run({...measures,ob_objetivo_porcentaje:'60'});assert.equal(r.state,'revisar_coherencia');assert.equal(r.options.length,0)});
const confirmed={ob_plan_estado:'Acordado e iniciado',ob_plan_confirmado:'Sí',ob_fecha_plan:'2026-11-01'};
test('seguimiento trimestral desde plan iniciado y confirmado, sin cita',()=>{const r=run(confirmed);assert.equal(r.followUp.dueOn,'2027-02-01');assert.equal(r.followUp.appointmentCreated,false)});
test('meses naturales ajustan último día, sin sumar90 días fijos',()=>assert.equal(run({...confirmed,ob_fecha_plan:'2026-01-31'}).followUp.dueOn,'2026-04-30'));
for(const v of [{ob_plan_estado:'Propuesto, no iniciado'},{ob_plan_confirmado:'No'},{ob_fecha_plan:''},{ob_actividad:'No'},{ob_objetivo_salud:''},{ob_musculo:'No valorado'}])
 test('sin calendario ficticio '+JSON.stringify(v),()=>assert.equal(run({...confirmed,...v}).followUp,null));
test('medidas previas al plan no prueban respuesta al plan actual',()=>{const r=run({...measures,...confirmed,ob_fecha_medidas:'2026-10-10'});assert.equal(r.response,null);assert.ok(r.followUp);assert.ok(r.checks.some(x=>x.includes('anteriores')))});
test('revisión vencida no supone falta de asistencia',()=>{const r=run({...confirmed,ob_fecha_plan:'2026-01-01'});assert.equal(r.followUp.status,'plazo_superado');assert.match(r.followUp.text,/ya realizados/)});
for(const v of [{ob_fecha_medidas:'2026-11-13'},{ob_fecha_basal:'2026-02-30'},{peso:'0x64'},{talla:'0'},{imc:'1e2'},{ob_objetivo_porcentaje:'-1'}])test('incoherencia no genera tratamiento '+JSON.stringify(v),()=>assert.equal(run(v).options.length,0));
for(const v of [{ob_tca:'Sí'},{ob_perdida_involuntaria:'Sí'},{ob_edema:'Sí'},{ob_secundaria:'Sí'},{ob_musculo:'Sí'}])
 test('integración no contradice restricciones de peso '+JSON.stringify(v),()=>assert.ok(!integratePatient(draft(v)).options.some(x=>x.id==='WEIGHT-REVIEW')));
test('ruta rápida evita intervención sin detalle',()=>{const r=run({},'quick');assert.equal(r.state,'evaluacion_inicial');assert.equal(r.options.length,0);assert.equal(r.followUp,null)});
test('no disponible no se usa como cero y modo desconocido se rechaza',()=>{assert.equal(evaluateObesity(setUnavailable(draft(),'imc',true)).options.length,0);assert.throws(()=>evaluateObesity(draft(),'otro'))});
test('problemas de tolerancia exigen revisión antes de fijar control trimestral',()=>{const r=run({...current,...confirmed,ob_tolerancia:'Problemas de tolerancia'});assert.equal(r.followUp,null);assert.equal(r.options.length,0)});
test('desbordamiento del IMC derivado se retiene antes de representar categoría',()=>{const r=run({imc:'',peso:'100',talla:'1'+ '0'.repeat(200)});assert.equal(r.state,'revisar_coherencia');assert.equal(r.anthropometry,null)});
