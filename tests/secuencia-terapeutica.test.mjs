import test from 'node:test';import assert from 'node:assert/strict';
import {createDraft,setValue,FIELDS} from '../src/model.mjs';
import {evaluateTherapySequence,prepareSequenceDose,sequenceSchedule} from '../src/clinical/secuencia-terapeutica.mjs';
import {evaluateTreatmentDose} from '../src/clinical/tratamientos-modulo.mjs';
import {SEQUENCE_MEDS,SEQUENCE_GROUPS} from '../src/sequence-fields.mjs';
const common={seq_ambito:'Adulto estable, sin embarazo ni lactancia, sin proceso agudo',seq_objetivo:'Iniciar o ajustar tratamiento',seq_adherencia:'Dosis y adherencia confirmadas',seq_tolerancia:'Buena tolerancia'};
const cases={
 dm2:{dm2:'Sí',hba1c:8,dm_objetivo_valor:7,tfge:70,dm_hipoglucemias:'No referidas',dm_sintomas:'Ausentes',seq_comorbilidades:['Ninguno de los siguientes']},
 hta:{hta_conocida:'Sí',pas:150,pad:90,seq_pa_objetivo:130,seq_pad_objetivo:80,seq_pa_valida:'Media validada; control fuera de consulta revisado cuando corresponde',seq_hta_vulnerable:'Ninguno tras valoración'},
 lipids:{ldl:130,lip_riesgo:'Alto',lip_intolerancia:'No'},
 obesidad:{imc:35,seq_comorbilidades:['Ninguno de los siguientes'],ob_tca:'No',ob_perdida_involuntaria:'No',ob_edema:'No',ob_musculo:'No tras valoración',embarazo_planificado:'No procede'},
 erc:{tfge:50,cac:250,unidad_cac:'mg/g',persistencia:'Sí',dm2:'Sí',ic:'No',potasio:4.5,hta_conocida:'Sí',ras_optimizado:'Sí'},
 ic:{ic:'Sí',ic_sintomatica:'Sí',ic_estabilidad:'Estable evaluado',fevi:45,congestion:'Ausentes',pas:120,tfge:70,potasio:4.5},
 hepatico:{edad:60,fib4_informado:1.8,hepatico_valoracion:'Otras causas evaluadas; esteatosis no confirmada',fib4_contexto:'Perfil de riesgo compatible con evaluación MASLD'}
};
const build=(id,vs={})=>{let d=createDraft();for(const[k,v]of Object.entries({...common,...(id==='hepatico'?{}:{['seq_actual_'+id]:['Sin tratamiento para esta patología']}),...cases[id],...vs}))d=setValue(d,k,Array.isArray(v)?JSON.stringify(v):String(v));return d;};
const run=(id,vs={})=>evaluateTherapySequence(build(id,vs),id);
const meds=(...ids)=>ids.map(k=>SEQUENCE_MEDS[k].label);
const keys=r=>r.steps.filter(x=>x.key).map(x=>x.key);
for(const id of Object.keys(cases)){
 test(id+': datos vacíos no producen tratamiento',()=>{const r=evaluateTherapySequence(createDraft(),id);assert.equal(r.steps.length,0);assert.ok(r.missing.length);});
 test(id+': requisitos hacen referencia a campos reales',()=>{const r=run(id);for(const k of r.missing)assert.ok(FIELDS[k],k);});
 for(const flag of ['cetoacidosis_sospecha','lra_sospecha','embarazo'])test(id+': alarma '+flag+' retiene secuencia',()=>{const r=run(id,{[flag]:'Sí'});assert.equal(r.state,'blocked');assert.equal(r.steps.length,0);});
 test(id+': glucemia 55 prevalece aunque ámbito esté confirmado',()=>assert.equal(run(id,{glucemia_actual:55}).state,'blocked'));
 test(id+': no modifica captura ni registra actuación',()=>{const d=build(id),before=JSON.stringify(d),r=evaluateTherapySequence(d,id);assert.equal(JSON.stringify(d),before);assert.equal(r.actionPerformed,false);});
}
test('DM2: sin prioridad clínica comienza metformina y expone siguiente clase condicional',()=>{const r=run('dm2');assert.deepEqual(keys(r),['metformina']);assert.ok(r.steps.some(x=>x.referenceKey==='empa_dm2'));});
test('DM2: IC desplaza prioridad hacia protección cardiorrenal',()=>assert.ok(keys(run('dm2',{seq_comorbilidades:['Insuficiencia cardíaca']})).includes('empa_ic')));
test('DM2: beneficio cardiorrenal aunque HbA1c esté en objetivo',()=>assert.ok(keys(run('dm2',{hba1c:6.5,seq_comorbilidades:['Insuficiencia cardíaca']})).includes('empa_ic')));
test('DM2: con objetivo cumplido y sin prioridad no intensifica',()=>assert.deepEqual(keys(run('dm2',{hba1c:6.5})),[]));
test('DM2: TFGe 29 no inicia metformina',()=>assert.ok(!keys(run('dm2',{tfge:29})).includes('metformina')));
test('DM2: no intensifica si hipoglucemias no valoradas',()=>assert.deepEqual(keys(run('dm2',{dm_hipoglucemias:'No valoradas'})),[]));
test('DM2: síntomas impiden secuencia crónica directa',()=>assert.deepEqual(keys(run('dm2',{dm_sintomas:'Poliuria, polidipsia o pérdida de peso'})),[]));
test('DM2: no duplica iSGLT2 ya registrado',()=>assert.ok(!keys(run('dm2',{seq_actual_dm2:meds('empagliflozina'),seq_comorbilidades:['Insuficiencia cardíaca']})).some(k=>k.startsWith('empa'))));
test('DM2: iDPP4 exige retirada cuando se propone GLP1',()=>assert.ok(run('dm2',{seq_actual_dm2:meds('iddp4'),seq_comorbilidades:['Obesidad']}).steps.some(s=>s.action==='replace')));
test('DM2: insuficiencia de adherencia detiene escalada',()=>assert.deepEqual(keys(run('dm2',{seq_actual_dm2:meds('metformina'),seq_adherencia:'Dosis omitidas o dudas de adherencia'})),[]));
test('DM2: adherencia adversa anterior prevalece',()=>assert.deepEqual(keys(run('dm2',{dm_adherencia:'Dificultades o dosis omitidas'})),[]));
test('DM2: dosis máxima de incretina conduce a revisar insulina',()=>{const r=run('dm2',{seq_actual_dm2:meds('ozempic'),seq_dosis_ozempic:2,seq_semanas_ozempic:8});assert.ok(r.steps.some(s=>s.action==='insulin'));assert.ok(!keys(r).includes('ozempic'));});
test('metformina: distingue dosis total diaria y calcula escalón tolerado',()=>{const d=build('dm2',{seq_actual_dm2:meds('metformina'),seq_dosis_metformina:1000,seq_semanas_metformina:3,seq_metformina_forma:'Liberación inmediata, pauta confirmada'}),plan=evaluateTherapySequence(d,'dm2'),step=plan.steps.find(x=>x.key==='metformina');assert.ok(step);let dose=prepareSequenceDose(d,'dm2',step);dose=setValue(dose,'tx_revision','Indicación, contraindicaciones e interacciones revisadas');const r=evaluateTreatmentDose(dose,'metformina');assert.equal(r.proposal?.amount,1500);assert.match(r.proposal.detail,/cada 8 h/);});
test('HTA: inicio combinado con dos clases compatibles',()=>assert.deepEqual(keys(run('hta')),['losartan','amlodipino']));
test('HTA: IECA actual no recibe otro ARA-II',()=>{const r=run('hta',{seq_actual_hta:meds('ieca'),farmacos:'Enalapril 10 mg cada 12 h'});assert.deepEqual(keys(r),['amlodipino']);});
test('HTA: triple tratamiento después de doble combinación',()=>assert.deepEqual(keys(run('hta',{seq_actual_hta:meds('losartan','amlodipino')})),['indapamida']));
test('HTA: vulnerabilidad evita inicio combinado automático',()=>assert.deepEqual(keys(run('hta',{seq_hta_vulnerable:'Alguno presente o sin revisar'})),[]));
test('HTA: lectura aislada no lleva a escalada',()=>assert.deepEqual(keys(run('hta',{seq_pa_valida:'Lectura aislada o control sin confirmar'})),[]));
test('HTA: nunca añade ARA-II a ARNI',()=>assert.ok(!keys(run('hta',{seq_actual_hta:meds('arni')})).includes('losartan')));
test('lípidos: intensidad inicial procede del riesgo, no de un selector de dosis',()=>assert.equal(run('lipids').steps.find(s=>s.key==='atorvastatina').initialDose,40));
test('lípidos: máxima estatina tolerada conduce a ezetimiba',()=>assert.deepEqual(keys(run('lipids',{seq_actual_lipids:meds('atorvastatina'),seq_dosis_atorvastatina:80,seq_semanas_atorvastatina:8,lip_max_tolerada:'Sí'})),['ezetimiba']));
test('lípidos: con estatina y ezetimiba remite a siguiente línea, sin inventar dosis',()=>{const r=run('lipids',{seq_actual_lipids:meds('atorvastatina','ezetimiba'),seq_dosis_atorvastatina:80,seq_semanas_atorvastatina:8,lip_max_tolerada:'Sí'});assert.deepEqual(keys(r),[]);assert.match(r.steps.map(x=>x.reason).join(' '),/PCSK9/);});
test('obesidad: IMC 28 sin comorbilidad no inicia fármaco',()=>assert.deepEqual(keys(run('obesidad',{imc:28})),[]));
test('obesidad: sarcopenia no descartada retiene escalada',()=>assert.deepEqual(keys(run('obesidad',{ob_musculo:'No valorado'})),[]));
test('obesidad: respuesta suficiente evita aumento por calendario',()=>assert.deepEqual(keys(run('obesidad',{seq_actual_obesidad:meds('wegovy'),seq_respuesta_peso:'Objetivo acordado alcanzado o respuesta suficiente'})),[]));
test('obesidad: no convierte Ozempic en Wegovy',()=>assert.deepEqual(keys(run('obesidad',{seq_actual_obesidad:meds('ozempic')})),[]));
test('ERC: cronicidad no confirmada impide algoritmo de protección',()=>assert.deepEqual(keys(run('erc',{persistencia:'No'})),[]));
test('ERC: normotensión no recibe dosis de losartán extrapolada de HTA',()=>assert.ok(!keys(run('erc',{hta_conocida:'No'})).includes('losartan')));
test('ERC: finerenona exige RAAS optimizado',()=>assert.ok(!keys(run('erc',{ras_optimizado:'No'})).includes('fine_erc')));
test('IC: diurético no aparece sin congestión',()=>assert.ok(!keys(run('ic')).includes('furosemida')));
test('IC: congestión añade furosemida si no existe asa',()=>assert.ok(keys(run('ic',{congestion:'Presentes'})).includes('furosemida')));
test('IC: IECA necesita sustitución/lavado, no asociación',()=>{const r=run('ic',{seq_actual_ic:meds('ieca'),farmacos:'Enalapril'});const arni=r.steps.find(s=>s.key==='arni');assert.equal(arni.action,'replace');assert.match(arni.reason,/36 h/);});
test('IC: FEVI preservada no inicia ARNI o beta desde vía reducida',()=>{const r=run('ic',{fevi:55});assert.ok(!keys(r).some(k=>['arni','bisoprolol'].includes(k)));});
test('hepatopatía: FIB4 dirige pruebas, nunca receta tratamiento MASH',()=>assert.deepEqual(keys(run('hepatico')),[]));
for(const id of Object.keys(SEQUENCE_GROUPS).filter(k=>k!=='hepatico')){
 test(id+': ninguna opción futura se pregunta al profesional',()=>{const d=build(id);for(const key of evaluateTherapySequence(d,id).missing)assert.notEqual(key,'tx_clave');});
}
test('misma clase no se duplica por estar registrada en otra patología',()=>{const r=run('dm2',{seq_actual_dm2:meds('metformina'),seq_actual_ic:meds('empagliflozina'),seq_comorbilidades:['Insuficiencia cardíaca']});assert.ok(!keys(r).includes('empa_ic'));});
test('confirmación de pauta no se hereda al cambiar de producto',()=>{const d=build('hta'),plan=evaluateTherapySequence(d,'hta');let next=prepareSequenceDose(d,'hta',plan.steps.find(s=>s.key==='losartan'));next=setValue(next,'tx_revision','Indicación, contraindicaciones e interacciones revisadas');next=prepareSequenceDose(next,'hta',plan.steps.find(s=>s.key==='amlodipino'));assert.equal(next.values.tx_revision,'Pendiente');});
test('la escalada GLP1 muestra dosis e intervalos, sin registrarlos como administrados',()=>{const s=sequenceSchedule('ozempic');assert.equal(s.length,4);assert.match(s[1],/4 semanas/);});
