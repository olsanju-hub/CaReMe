import {isFinerenoneContinuation} from './identidad-farmaco.mjs';
import {planFinerenoneControl} from './ajustes-seguros.mjs';
/** Pautas por indicación, visibles en cada consulta. La propuesta numérica exige revisión asociada. */
import {FIELDS,fieldState,therapeuticAssociationValid} from '../model.mjs';
import {getDrug,getDrugRoute,reviewDrug} from './farmacologia.mjs';
import {auditCrossDomain} from './auditoria.mjs';
import {readMulti} from '../consultas.mjs';
const cima=(id)=>`https://cima.aemps.es/cima/dochtml/ft/${id}/FT_${id}.html`;
const existing=(drug,route,extra={})=>{const p=getDrug(drug),r=getDrugRoute(drug,route);return {drug,route,name:p.generic+' · '+p.exampleBrand,indication:r.name,reference:r.labelDoses,source:p.source.url,checks:p.warningText,monitoring:p.monitoring,className:p.className,...extra};};
export const THERAPEUTIC_OPTIONS={
 metformina:existing('metformina','dm2',{name:'Metformina de liberación inmediata · comprimido de 500 mg',source:cima('89780'),needs:['tfge'],reference:['Inicio habitual: 500 mg por vía oral cada 12 h con comidas. Con TFGe 30–44, inicio máximo de 500 mg/día.','Máximo diario según TFGe: ≥60, 3.000 mg; 45–59, 2.000 mg; 30–44, 1.000 mg. No usar con TFGe <30.']}),
 empa_dm2:existing('empagliflozina','dm2',{needs:['tfge']}),empa_ic:existing('empagliflozina','ic',{needs:['tfge']}),empa_erc:existing('empagliflozina','erc',{needs:['tfge']}),
 dapa_dm2:existing('dapagliflozina','dm2',{needs:['tfge']}),dapa_ic:existing('dapagliflozina','ic',{needs:['tfge']}),dapa_erc:existing('dapagliflozina','erc',{needs:['tfge']}),
 fine_erc:existing('finerenona','erc_dm2',{needs:['tfge','potasio','dm2','cac','unidad_cac','persistencia','ras_optimizado']}),fine_ic:existing('finerenona','ic_fevi40',{needs:['tfge','potasio','fevi']}),
 ozempic:existing('semaglutida_ozempic','dm2',{needs:['tfge'],ladder:[.25,.5,1,2]}),
 wegovy:existing('semaglutida_wegovy_sc','peso',{needs:['imc','tfge'],ladder:[.25,.5,1,1.7,2.4],noHighDose:true}),
 tirze_dm2:existing('tirzepatida','dm2',{needs:['tfge'],ladder:[2.5,5,7.5,10,12.5,15]}),tirze_peso:existing('tirzepatida','peso',{needs:['imc','tfge'],ladder:[2.5,5,7.5,10,12.5,15]}),
 losartan:{name:'Losartán · comprimidos de 50/100 mg',indication:'HTA confirmada; revisar tratamiento combinado',source:cima('89364'),className:'ARA-II',needs:['tfge','potasio','pas'],reference:['Inicio habitual en HTA: 50 mg por vía oral cada 24 h. Máximo de esta indicación: 100 mg/día.','Con depleción de volumen o hepatopatía puede requerir menor inicio: esta vía rutinaria no lo calcula.'],checks:['No combinar con IECA/ARA-II/ARNI. Revisar embarazo, volemia, función renal, potasio e interacciones.'],monitoring:['Control de PA, creatinina y K a las 2–4 semanas tras un inicio real o aumento, antes si el contexto lo exige.']},
 indapamida:{name:'Indapamida retard · comprimido de 1,5 mg',indication:'HTA confirmada',source:'https://cima.aemps.es/cima/dochtml/ft/69391/FichaTecnica_69391.html',className:'Diurético tiazídico o similar',needs:['lip_aclaramiento','potasio','tx_sodio','pas'],reference:['1,5 mg por vía oral cada 24 h, preferentemente por la mañana; tragar entero. No aumentar la dosis para intensificar el efecto antihipertensivo.'],checks:['Contraindicada con CrCl <30, hipopotasemia, insuficiencia hepática grave o alergia a sulfamidas. Revisar litio, fármacos que prolongan QT y riesgo de gota.'],monitoring:['Na antes del inicio y periódicamente; primer control de K durante la primera semana. Revisar función renal y PA.']},
 amlodipino:{name:'Amlodipino · comprimidos de 5/10 mg',indication:'HTA confirmada',source:'https://cima.aemps.es/cima/dochtml/ft/65460/FichaTecnica_65460.html',className:'Calcioantagonista',needs:['pas'],reference:['Inicio: 5 mg por vía oral cada 24 h. Máximo 10 mg/día según respuesta.','No fraccionar el comprimido de referencia para obtener 2,5 mg: su ranura no garantiza mitades iguales.'],checks:['Revisar hipotensión, shock, estenosis aórtica grave, inestabilidad tras IAM e insuficiencia hepática.'],monitoring:['Revisar PA, tolerancia, edema periférico y necesidad de ajuste.']},
 bisoprolol:{name:'Bisoprolol · presentación adecuada al escalón',indication:'IC crónica estable con función sistólica reducida',source:cima('87952'),className:'Betabloqueante',needs:['pas','ic_fc','fevi'],reference:['Inicio: 1,25 mg por vía oral cada 24 h durante una semana.','Si se tolera: 2,5 mg una semana; 3,75 mg una semana; 5 mg cuatro semanas; 7,5 mg cuatro semanas; 10 mg/día mantenimiento. No es un calendario automático.'],checks:['Solo IC estable: revisar bradicardia, bloqueo AV sin marcapasos, hipotensión, asma grave y tratamiento que frena la frecuencia.'],monitoring:['Vigilar PA, frecuencia y síntomas desde el inicio y durante cada ajuste; no retirar bruscamente.']},
 arni:{name:'Sacubitrilo/valsartán · Entresto',indication:'IC crónica sintomática con FEVI reducida',source:cima('1151058001'),className:'ARNI',needs:['tfge','potasio','pas','fevi','tx_raas','tx_raas_dosis'],reference:['Inicio habitual: 49/51 mg por vía oral cada 12 h. Inicio reducido: 24/26 mg cada 12 h cuando corresponda por PA, función renal o tratamiento previo.','Si se tolera, duplicar a intervalos de 2–4 semanas hasta 97/103 mg cada 12 h; comienzo sin IECA/ARA-II previo: escalada lenta de 3–4 semanas.'],checks:['No combinar con IECA o ARA-II. Esperar ≥36 h tras IECA. Revisar angioedema, aliskireno, embarazo e insuficiencia hepática. No iniciar con PAS <100 o K >5,4.'],monitoring:['Controlar PA, K y función renal tras inicio y cada ajuste.']},
 eplerenona:{name:'Eplerenona · comprimidos de 25/50 mg',indication:'IC crónica NYHA II y FEVI ≤30 % con terapia estándar',source:cima('75983'),className:'ARM',needs:['ic','ic_sintomatica','tfge','lip_aclaramiento','potasio','fevi','seq_ic_nyha','seq_epl_cyp'],reference:['Inicio en IC crónica NYHA II y FEVI ≤30 %: 25 mg cada 24 h; con CrCl 30–60, 25 mg cada 48 h.','Titular preferiblemente tras 4 semanas según K; objetivo habitual 50 mg/día. No superar 25 mg/día con CrCl <50 o inhibidor CYP3A4 leve/moderado.'],checks:['No iniciar con K >5 ni TFGe/CrCl <30. No asociar otro ARM, ahorradores de K ni doble bloqueo IECA+ARA-II. Revisar hepatopatía grave y CYP3A4.'],monitoring:['K y función renal antes, durante la primera semana, al mes y tras ajustes.']},
 espironolactona:{name:'Espironolactona · comprimido de 25 mg',indication:'IC grave NYHA III–IV',source:'https://cima.aemps.es/cima/dochtml/ft/81034/FichaTecnica_81034.html',className:'ARM',needs:['tfge','potasio','creatinina','tx_nyha'],reference:['Inicio en esta indicación: 25 mg por vía oral cada 24 h con comida, si K ≤5 y creatinina ≤2,5 mg/dL.','Si se tolera y está indicado, hasta 50 mg/día. No duplicar otro ARM ni aplicar automáticamente la pauta de edema/cirrosis.'],checks:['No iniciar con TFGe <30, K >5, Addison, otros ahorradores de K/suplementos de K o doble bloqueo IECA+ARA-II.'],monitoring:['K y creatinina una semana tras inicio/aumento, mensualmente los tres primeros meses; después individualizar según ficha.']},
 furosemida:{name:'Furosemida · comprimido de 40 mg divisible',indication:'Congestión por IC en paciente estable',source:cima('64140'),className:'Diurético de asa',needs:['tfge','potasio','pas','tx_sodio','congestion'],reference:['La ficha contempla inicio oral de 20–80 mg/día. Esta vía calcula el extremo bajo: 20 mg por la mañana, con reevaluación de respuesta.','Ajustar a la menor dosis eficaz según congestión, función renal, PA y electrolitos; no sirve para tratamiento intravenoso o edema agudo de pulmón.'],checks:['Revisar depleción, anuria, hiponatremia/hipopotasemia, alergia a sulfonamidas, lactancia y obstrucción urinaria.'],monitoring:['Vigilar peso, congestión, PA, función renal y electrolitos en los primeros días tras el cambio.']},
 atorvastatina:{name:'Atorvastatina · comprimidos de dosis específica',indication:'Dislipemia con indicación de estatina confirmada',source:'https://cima.aemps.es/cima/dochtml/ft/69537/FichaTecnica_69537.html',className:'Estatina',needs:['tx_estatina_dosis'],reference:['Inicio CIMA habitual: 10 mg por vía oral cada 24 h; individualizar intensidad por LDL, riesgo y objetivo.','10–20 mg corresponde a intensidad moderada; 40–80 mg, alta. Ajustar con intervalos de al menos 4 semanas. Máximo 80 mg/día.'],checks:['Revisar enfermedad hepática activa, ALT persistente >3 LSN, embarazo/lactancia, síntomas musculares e interacciones por CYP3A4 y antivirales. La dosis seleccionada exige presentación adecuada.'],monitoring:['Reevaluar LDL y tolerancia tras el cambio; transaminasas según contexto/ficha y CK si síntomas.']},
 rosuvastatina:{name:'Rosuvastatina · presentación adecuada a la dosis',indication:'Hipercolesterolemia con indicación de estatina confirmada',source:cima('80212'),className:'Estatina',needs:['lip_aclaramiento'],reference:['Inicio conservador de esta vía: 5 mg por vía oral cada 24 h. La ficha permite 5 o 10 mg según perfil; 5 mg si CrCl <60, edad >70 o ascendencia asiática.','Tras ≥4 semanas, valorar siguiente dosis si está indicada. Esta vía termina en 20 mg/día; 40 mg requiere selección y supervisión específica.'],checks:['Contraindicada con CrCl <30, hepatopatía activa, embarazo/lactancia, ciclosporina y determinadas interacciones. No sustituir CrCl por TFGe normalizada.'],monitoring:['Reevaluar LDL, síntomas musculares y función hepática según ficha/contexto.']},
 ezetimiba:{name:'Ezetimiba · comprimido de 10 mg',indication:'LDL no controlado con estatina o estatina no adecuada/intolerada',source:cima('80305'),className:'Ezetimiba',needs:[],reference:['10 mg por vía oral cada 24 h, con o sin alimentos. No requiere ajuste renal.','Separar de secuestrantes de ácidos biliares: al menos 2 h antes o 4 h después.'],checks:['Revisar hepatopatía moderada/grave, ciclosporina e interacciones. Con estatina, aplicar sus contraindicaciones.'],monitoring:['Reevaluar LDL, tolerancia y función hepática cuando se asocia a estatina.']},
};
export const MODULE_TREATMENTS={dm2:['metformina','empa_dm2','dapa_dm2','ozempic','tirze_dm2'],ic:['empa_ic','dapa_ic','bisoprolol','arni','espironolactona','eplerenona','fine_ic','furosemida'],erc:['empa_erc','dapa_erc','fine_erc','losartan'],obesidad:['wegovy','tirze_peso'],hta:['losartan','amlodipino','indapamida'],lipids:['atorvastatina','rosuvastatina','ezetimiba'],hepatico:[],insulina:[],ckm:[],'cv-risk':[]};
const get=(d,k)=>fieldState(d,k)==='registrado'?d.values[k]:null;
const n=(d,k)=>get(d,k)===null?null:Number(get(d,k));
const multi=(d,k)=>readMulti(get(d,k)||'[]');
export function treatmentFields(d,key){
 const p=THERAPEUTIC_OPTIONS[key];if(!p)return [];
 const ids=['tx_operacion','tx_contexto',...p.needs.filter(id=>!(isFinerenoneContinuation(d)&&['cac','unidad_cac','ras_optimizado'].includes(id))&&!(key==='atorvastatina'&&get(d,'tx_operacion')==='Escalada del mismo producto, sin interrupciones'&&id==='tx_estatina_dosis'))];
 if(get(d,'tx_operacion')==='Escalada del mismo producto, sin interrupciones')ids.push(key==='arni'?'tx_dosis_arni':'tx_dosis_actual','tx_semanas','tx_tolerancia');
 if(get(d,'tx_operacion')==='Reducción del mismo producto tras revisión')ids.push('tx_dosis_actual',...(['amlodipino','losartan'].includes(key)?['seq_dosis_'+key]:[]),'seq_hta_una_toma','seq_indicacion_solo_hta','seq_control_retirada');
 if(key==='eplerenona'&&get(d,'tx_operacion')==='Escalada del mismo producto, sin interrupciones')ids.push('seq_epl_frecuencia','seq_mra_control');
 if(key.startsWith('fine')&&get(d,'tx_operacion')==='Escalada del mismo producto, sin interrupciones')ids.push('seq_fin_indicacion','seq_dosis_finerenona','seq_semanas_finerenona','seq_mra_control','fin_tfge_previa',...(key==='fine_ic'?['fin_tfge_inicio']:[]));
 if(key==='metformina'&&get(d,'tx_operacion')==='Escalada del mismo producto, sin interrupciones'){ids.splice(ids.indexOf('tx_dosis_actual'),1);ids.push('seq_dosis_metformina','seq_metformina_forma');}
 ids.push('tx_revision');return [...new Set(ids)];
}
export function reviewModuleTreatment(d,key){
 const p=THERAPEUTIC_OPTIONS[key];if(!p)throw new Error('Pauta no reconocida');
 const blocks=auditCrossDomain(d).critical.map(x=>x.title);
 if(p.drug)blocks.push(...reviewDrug(d,p.drug,p.route).blocked);
 const continuing=isFinerenoneContinuation(d),reducing=get(d,'tx_operacion')==='Reducción del mismo producto tras revisión';
 const g=(id)=>get(d,id),e=n(d,'tfge'),k=n(d,'potasio'),bp=n(d,'pas');
 if(e!==null&&e<15&&['arni','furosemida','bisoprolol'].includes(key))blocks.push('Función renal muy avanzada: individualizar fuera del inicio rutinario.');
 if(p.needs.includes('potasio')&&k!==null&&k<3.5)blocks.push('Potasio bajo: revisar causa y corregir antes de una pauta rutinaria.');
 if(g('insulina_fragilidad')==='Sí'||multi(d,'comorbilidades').includes('Fragilidad'))blocks.push('Fragilidad: individualizar pauta y objetivos en un recorrido específico.');
 if((d.values.alergias||'').toLowerCase().includes((p.drug?getDrug(p.drug).generic:key).toLowerCase()))blocks.push('Consta referencia de alergia al principio activo: conciliar antes de calcular.');
 if(d.values.edad!==undefined&&fieldState(d,'edad')!=='registrado')blocks.push('Edad fuera del ámbito adulto o inválida.');
 if(g('embarazo')==='Sí'||g('dm1')==='Sí'||g('ob_lactancia')==='Sí'||g('lip_lactancia')==='Sí')blocks.push('Gestación, lactancia o DM1 requieren un circuito específico.');
 if(g('hepatica_grave')==='Sí'||g('insuficiencia_hepatica')==='Sí')blocks.push('Hepatopatía grave: no aplicar una pauta rutinaria.');
 if((key.includes('dm2')||['metformina','ozempic','fine_erc'].includes(key))&&g('dm2')==='No')blocks.push('DM2 negada: no aplicar esta indicación.');
 if(p.route==='ic'||['arni','bisoprolol','espironolactona','furosemida','fine_ic'].includes(key)){if(g('ic')==='No')blocks.push('IC negada: confirmar indicación antes de pautar.');if(g('ic_sintomatica')==='No'&&['arni','espironolactona','furosemida'].includes(key))blocks.push('IC sintomática negada: conciliar con la indicación seleccionada.');}
 if(p.route==='erc'||key==='fine_erc')if(g('persistencia')==='No'||g('erc')==='No')blocks.push('ERC no confirmada: revisar indicación.');
 if(['losartan','amlodipino','indapamida'].includes(key)&&g('hta_conocida')==='No')blocks.push('HTA no confirmada: no iniciar desde una cifra aislada.');
 if(e!==null&&e<20&&key.startsWith('empa'))blocks.push('No iniciar empagliflozina con TFGe <20.');
 if(e!==null&&e<25&&key.startsWith('dapa'))blocks.push('No iniciar dapagliflozina con TFGe <25.');
 if(key==='metformina'&&e!==null&&e<30)blocks.push('Metformina contraindicada con TFGe <30.');
 if(key.startsWith('fine')&&!continuing&&(e!==null&&e<25||k!==null&&k>5))blocks.push('Finerenona: no iniciar con TFGe <25 o K >5.');
 if(key==='fine_erc'&&!continuing&&(g('dm2')&&g('dm2')!=='Sí'||g('persistencia')&&g('persistencia')!=='Sí'||g('unidad_cac')&&g('unidad_cac')!=='mg/g'||n(d,'cac')!==null&&n(d,'cac')<30||g('ras_optimizado')&&g('ras_optimizado')!=='Sí'))blocks.push('Confirmar ERC-DM2 con albuminuria y RAAS optimizado antes de finerenona.');
 if(key==='fine_ic'&&n(d,'fevi')!==null&&n(d,'fevi')<40)blocks.push('Finerenona IC requiere FEVI ≥40 %.');
 if(key==='wegovy'&&e!==null&&e<30)blocks.push('Wegovy SC no recomendado con TFGe <30.');
 if(['wegovy','tirze_peso'].includes(key)){
  const bmi=n(d,'imc'),comorb=g('dm2')==='Sí'||g('comorbilidad_peso_confirmada')==='Sí'||multi(d,'obesidad_perfil').some(x=>!['Ninguna seleccionada','Obesidad sarcopénica'].includes(x));
  if(bmi!==null&&(bmi<27||bmi<30&&!comorb))blocks.push('Indicación por peso: IMC ≥30 o ≥27 con comorbilidad confirmada.');
  if(['ob_tca','ob_perdida_involuntaria','ob_edema','ob_secundaria'].some(x=>g(x)==='Sí'))blocks.push('Resolver condicionante nutricional/etiológico antes de intensificar pérdida de peso.');
 }
 if(['furosemida','indapamida'].includes(key)&&/sulf(?:on|amid|amet)|sulfa/i.test(d.values.alergias||''))blocks.push('Alergia a sulfamidas registrada: revisar seguridad del diurético antes de pautar.');
 if(['atorvastatina','rosuvastatina'].includes(key)&&(g('lip_mialgias')==='Sí'||g('lip_alarma')==='Sí'))blocks.push('Síntomas musculares o alarma registrados: revisar antes de iniciar o escalar estatina.');
 if(key==='atorvastatina'&&g('cyp3a4_fuerte')==='Sí')blocks.push('Inhibidor potente de CYP3A4 registrado: verificar compatibilidad y límite de dosis antes de atorvastatina.');
 if(['atorvastatina','rosuvastatina','ezetimiba'].includes(key)&&g('lip_interacciones')==='No')blocks.push('Interacciones constan como no revisadas.');
 if(key==='losartan'&&(k!==null&&(k>5||k<3.5)||!reducing&&bp!==null&&bp<100))blocks.push('Revisar PA y potasio antes de iniciar un ARA-II.');
 if(key==='amlodipino'&&!reducing&&bp!==null&&bp<100)blocks.push('PA baja: no iniciar por este circuito.');
 if(['arni','bisoprolol'].includes(key)&&n(d,'fevi')!==null&&n(d,'fevi')>=50)blocks.push('Esta indicación requiere FEVI reducida confirmada.');
 if(key==='bisoprolol'&&(bp!==null&&bp<100||n(d,'ic_fc')!==null&&n(d,'ic_fc')<60))blocks.push('PA o frecuencia bajas: individualizar antes de betabloqueo.');
 if(key==='arni'){
  if(bp!==null&&bp<100||k!==null&&k>5.4)blocks.push('No iniciar ARNI con PAS <100 o K >5,4.');
  const cls=multi(d,'farmacos_clases');
  if(cls.includes('IECA')&&g('tx_raas')!=='IECA suspendido hace al menos 36 horas'||cls.includes('ARA-II')&&g('tx_raas')!=='ARA-II suspendido')blocks.push('La medicación RAAS registrada exige confirmar suspensión y lavado apropiados.');
  if(g('tx_raas')==='No conciliado')blocks.push('Conciliar IECA/ARA-II y período de lavado antes de ARNI.');
 }
 if(key==='espironolactona'){
  if(e!==null&&e<30||k!==null&&k>5||n(d,'creatinina')!==null&&n(d,'creatinina')>2.5)blocks.push('Espironolactona: revisar límites de TFGe, K y creatinina.');
  if(g('tx_nyha')&&g('tx_nyha')!=='IC grave NYHA III-IV')blocks.push('Este cálculo no extrapola la indicación de IC NYHA III-IV a edema u otras situaciones.');
  if(g('addison')==='Sí')blocks.push('Addison: espironolactona contraindicada.');
 }
 if(key==='eplerenona'){
  if(e!==null&&e<30||n(d,'lip_aclaramiento')!==null&&n(d,'lip_aclaramiento')<30||k!==null&&k>5.4)blocks.push('Eplerenona: función renal o potasio fuera del ajuste rutinario.');
  if(g('tx_operacion')==='Inicio sin fármaco/clase equivalentes'&&k!==null&&k>5)blocks.push('No iniciar eplerenona con K >5.');
  if(n(d,'fevi')!==null&&n(d,'fevi')>30||g('seq_ic_nyha')&&g('seq_ic_nyha')!=='II')blocks.push('Esta pauta de eplerenona requiere IC crónica NYHA II y FEVI ≤30 %.');
  if(g('seq_epl_cyp')==='Inhibidor potente o sin revisar'||g('cyp3a4_fuerte')==='Sí')blocks.push('CYP3A4 potente o sin revisar: no calcular eplerenona.');
  if(g('ic')==='No'||g('ic_sintomatica')==='No')blocks.push('IC negada: conciliar indicación antes de eplerenona.');
 }
 if(key==='furosemida'){
  if(g('congestion')==='Ausentes')blocks.push('No añadir diurético de asa sin congestión.');
  if(bp!==null&&bp<100||k!==null&&k<3.5||n(d,'tx_sodio')!==null&&n(d,'tx_sodio')<130)blocks.push('Revisar PA, volemia y electrolitos; no aplicar inicio rutinario de diurético.');
 }
 if(['atorvastatina','rosuvastatina','ezetimiba'].includes(key)&&(g('lip_hepatica_activa')==='Sí'||n(d,'alt')!==null&&n(d,'lip_alt_lsn')>0&&n(d,'alt')>3*n(d,'lip_alt_lsn')))blocks.push('Resolver seguridad hepática o interacción registrada antes de pauta lipídica.');
 if(['atorvastatina','rosuvastatina'].includes(key)&&g('lip_intolerancia')==='Documentada tras evaluación')blocks.push('Intolerancia a estatinas documentada: no aplicar inicio/escalado rutinario.');
 if(key==='rosuvastatina'&&g('lip_estatina')==='Atorvastatina')blocks.push('Ya consta otra estatina: no iniciar una segunda.');
 if(key==='indapamida'&&(n(d,'lip_aclaramiento')!==null&&n(d,'lip_aclaramiento')<30||n(d,'tx_sodio')!==null&&n(d,'tx_sodio')<130||bp!==null&&bp<100))blocks.push('Revisar aclaramiento, sodio y PA antes de indapamida.');
 if(key==='rosuvastatina'&&n(d,'lip_aclaramiento')!==null&&n(d,'lip_aclaramiento')<30)blocks.push('Rosuvastatina contraindicada con CrCl <30.');
 if(key==='atorvastatina'&&g('lip_estatina')==='Rosuvastatina')blocks.push('Ya consta otra estatina: no iniciar una segunda.');
 if(key==='ezetimiba'&&g('lip_ezetimiba')==='Sí'&&g('tx_operacion')==='Inicio sin fármaco/clase equivalentes')blocks.push('Ezetimiba ya registrada: no duplicar.');
 return [...new Set(blocks)];
}
export function evaluateTreatmentDose(d,key){
 const p=THERAPEUTIC_OPTIONS[key];if(!p)throw new Error('Pauta no reconocida');
 const r={proposal:null,missing:[],blocks:reviewModuleTreatment(d,key),source:p.source,actionPerformed:false,prescription:null};
 const req=treatmentFields(d,key);
 if(p.ladder&&get(d,'tx_operacion')==='Escalada del mismo producto, sin interrupciones'){const cls=multi(d,'farmacos_clases');if(cls.some(x=>['arGLP-1','Agonista dual GIP/GLP-1'].includes(x)&&x!==p.className))r.blocks.push('La clase incretínica actual no corresponde al producto que se pretende escalar.');}
 for(const id of req)if(get(d,id)===null)r.missing.push(FIELDS[id].label);
 if(get(d,'tx_clave')!==key||!therapeuticAssociationValid(d))r.missing.push('Confirmar revisión para este producto y datos actuales.');
 if(get(d,'tx_contexto')&&get(d,'tx_contexto')!=='Adulto estable, sin embarazo ni lactancia')r.blocks.push('Usar circuito específico o confirmar ámbito adulto estable.');
 const escalating=get(d,'tx_operacion')==='Escalada del mismo producto, sin interrupciones',reducing=get(d,'tx_operacion')==='Reducción del mismo producto tras revisión',classes=multi(d,'farmacos_clases');
 if(!escalating&&!reducing){
  if(p.ladder&&['Wegovy subcutáneo','Tirzepatida','Ozempic subcutáneo'].includes(get(d,'ob_farmaco_actual')))r.blocks.push('Ya consta una incretina actual: conciliar antes de un nuevo inicio.');
  const aliases={Biguanida:['Metformina'],ARNI:['INRA/ARNI'],Calcioantagonista:['Calcioantagonista dihidropiridínico']};
  const duplicate=p.className==='arGLP-1'||p.className==='Agonista dual GIP/GLP-1'?classes.some(x=>['arGLP-1','Agonista dual GIP/GLP-1'].includes(x)):classes.includes(p.className)||(aliases[p.className]||[]).some(x=>classes.includes(x));
  if(duplicate)r.blocks.push('Ya consta esta clase o una equivalente: conciliar para evitar duplicidad.');
  if(['losartan'].includes(key)&&classes.some(x=>['IECA','ARA-II','INRA/ARNI'].includes(x)))r.blocks.push('No añadir ARA-II sobre bloqueo RAAS ya registrado.');
  if(['espironolactona'].includes(key)&&classes.some(x=>/ARM|ahorrador/i.test(x)))r.blocks.push('No duplicar ARM ni diurético ahorrador de potasio.');
  if(['atorvastatina','rosuvastatina'].includes(key)&&get(d,'lip_estatina')&&get(d,'lip_estatina')!=='Ninguna')r.blocks.push('Estatina actual registrada: usar revisión de intensificación, no nuevo inicio.');
 }
 if(escalating&&(get(d,'tx_tolerancia')!=='Buena tolerancia y escalado indicado'))r.blocks.push('No escalar sin tolerancia, adherencia, continuidad y necesidad comprobadas.');
 if(escalating&&(['atorvastatina','rosuvastatina','ezetimiba'].includes(key)&&get(d,'lip_adherencia')==='Dudas o incumplimiento'||['metformina','empa_dm2','dapa_dm2','ozempic','tirze_dm2'].includes(key)&&get(d,'dm_adherencia')==='Dificultades o dosis omitidas'))r.blocks.push('Resolver las dificultades de adherencia registradas antes de escalar.');
 if(reducing){
  if(['amlodipino','losartan'].includes(key)&&n(d,'seq_dosis_'+key)!==n(d,'tx_dosis_actual'))r.blocks.push('La dosis a reducir no coincide con la dosis actual declarada.');
  if(!['amlodipino','losartan'].includes(key))r.blocks.push('Esta reducción numérica solo contempla amlodipino y losartán; no reducir porcentualmente otros fármacos.');
  if(get(d,'seq_hta_una_toma')!=='Una toma diaria confirmada'||get(d,'seq_indicacion_solo_hta')!=='Solo HTA, sin otra indicación del candidato'||get(d,'seq_control_retirada')!=='Cambio acordado y seguimiento disponible')r.blocks.push('Confirmar pauta actual, indicación exclusiva y seguimiento antes de reducir.');
  if(n(d,'pas')!==null&&n(d,'pas')<90)r.blocks.push('PAS <90: valorar hipotensión antes de un ajuste rutinario.');
  if(key==='losartan'&&(get(d,'ic')==='Sí'||get(d,'erc')==='Sí'||n(d,'cac')>=30))r.blocks.push('Revisar indicación cardiorrenal antes de reducir losartán.');
 }
 if(r.blocks.length||r.missing.length)return r;
 const e=Number(d.values.tfge),dose=Number(d.values.tx_dosis_actual),weeks=Number(d.values.tx_semanas);
 let amount,frequency='cada 24 h',via='oral',detail='';
 if(reducing){const expected=key==='amlodipino'?10:100;if(dose!==expected)r.blocks.push('Dosis actual no contemplada para esta reducción.');else{amount=expected/2;detail='Reducir un solo fármaco. Usar la presentación de '+amount+' mg; no fraccionar un comprimido no divisible. Vigilar PA y síntomas y reevaluar como máximo a las 4 semanas.';}}
 else if(p.ladder){
  via='subcutánea';frequency='una vez a la semana';
  if(!escalating)amount=p.ladder[0];else{
   const i=p.ladder.indexOf(dose);
   if(i<0||i===p.ladder.length-1)r.blocks.push('Dosis actual fuera de los escalones calculados o en el máximo de esta vía.');
   else if(weeks<4)r.blocks.push('Completar al menos 4 semanas con la dosis actual antes de escalar.');else amount=p.ladder[i+1];
  }
  detail='Mantener el escalón al menos cuatro semanas y revisar tolerancia antes de otro aumento. No convertir dosis a clics ni a volumen.';
 }else if(key==='metformina'){
  const max=e>=60?3000:e>=45?2000:1000;
  if(escalating){const daily=n(d,'seq_dosis_metformina');if(get(d,'seq_metformina_forma')!=='Liberación inmediata, pauta confirmada'||daily===null||daily<=0||daily>=Math.min(max,2000)||weeks<2)r.blocks.push('Confirmar metformina de liberación inmediata, dosis TOTAL diaria positiva, al menos 2 semanas y margen dentro del máximo renal.');else{amount=Math.min((Math.floor(daily/500)+1)*500,max,2000);frequency='al día, repartidos con comidas';if(![1000,1500,2000].includes(amount))r.blocks.push('La pauta diaria no corresponde a los escalones de comprimidos de 500 mg verificados. Revisar presentación y distribución.');detail=amount===1000?'500 mg cada 12 h.':amount===1500?'500 mg cada 8 h.':amount===2000?'1.000 mg cada 12 h (dos comprimidos de 500 mg por toma).':'Distribuir la dosis diaria con una presentación adecuada; revisar pauta antes de administrar.';}}
  else {amount=500;frequency=e<45?'cada 24 h':'cada 12 h';detail=`Máximo diario por TFGe: ${max} mg, repartido en 2–3 tomas. Ajustar progresivamente según tolerancia y glucemia; con TFGe 30–59 el inicio no supera la mitad del máximo.`;}
 }else if(key.startsWith('empa')){
  amount=10;if(escalating){if(key!=='empa_dm2'||dose!==10||e<60)r.blocks.push('25 mg solo desde 10 mg en DM2, TFGe ≥60, tolerancia y necesidad de mayor control.');else amount=25;}
 }else if(key.startsWith('dapa')){amount=10;if(escalating)r.blocks.push('La pauta de esta indicación es 10 mg/día; no se calcula un aumento.');}
 else if(key.startsWith('fine')){if(escalating){const plan=planFinerenoneControl(d),up=plan.steps.find(s=>s.key===key&&s.operation==='escalate');if(plan.missing.length||!up||!isFinerenoneContinuation(d))r.blocks.push('La tabla de la indicación actual no permite aumentar con estos datos.');else{amount=key==='fine_erc'||n(d,'seq_dosis_finerenona')===10?20:40;detail=up.reason;}}else {amount=e>=60?20:10;detail=`Revisar K/TFGe a las 4 semanas. Objetivo de esta indicación: ${key==='fine_ic'?(e>=60?40:20):20} mg/día.${Number(d.values.potasio)>4.8?' K >4,8: monitorización adicional durante las primeras 4 semanas.':''}`;}}
 else if(key==='amlodipino'){amount=5;if(escalating){if(dose!==5||weeks<4)r.blocks.push('Para esta vía, confirmar 5 mg y al menos 4 semanas antes de proponer 10 mg.');else amount=10;}}
 else if(key==='losartan'){amount=50;if(escalating){if(dose!==50||weeks<6)r.blocks.push('Para esta vía, confirmar 50 mg y al menos 6 semanas de respuesta antes de proponer 100 mg.');else amount=100;}}
 else if(key==='bisoprolol'){
  amount=1.25;if(escalating){const ds=[1.25,2.5,3.75,5,7.5,10],i=ds.indexOf(dose),min=i<3?1:4;if(i<0||i===5||weeks<min)r.blocks.push('Dosis o intervalo no compatibles con el siguiente escalón de bisoprolol.');else amount=ds[i+1];}
 }
 else if(key==='arni'){
  frequency='cada 12 h';const lower=e<60||Number(d.values.pas)<=110||get(d,'tx_raas_dosis')==='No tratado o dosis bajas'||get(d,'tx_raas')==='Sin IECA/ARA-II previo';amount=lower?'24/26':'49/51';
  if(escalating){const pair=get(d,'tx_dosis_arni'),minWeeks=get(d,'tx_raas')==='Sin IECA/ARA-II previo'?3:2;if(pair==='97/103 mg')r.blocks.push('ARNI en la dosis objetivo máxima: no escalar.');else if(weeks<minWeeks)r.blocks.push(`Completar al menos ${minWeeks} semanas con la pareja de dosis actual y tolerancia confirmada.`);else amount=pair==='24/26 mg'?'49/51':'97/103';}
  detail='Sustituye el IECA/ARA-II, no se añade a él. Respetar ≥36 h tras última dosis de IECA.';
 }
 else if(key==='eplerenona'){
  amount=25;const cr=n(d,'lip_aclaramiento');frequency=cr<=60?'cada 48 h':'cada 24 h';
  if(escalating){
   if(weeks<4||dose!==25||get(d,'seq_mra_control')!=='Analítica actual revisada, sin deterioro agudo'||Number(d.values.potasio)>=5)r.blocks.push('Eplerenona: confirmar 25 mg, 4 semanas, control actual y K <5 antes de subir.');
   else if(get(d,'seq_epl_frecuencia')==='Cada 48 h'){amount=25;frequency='cada 24 h';}
   else if(get(d,'seq_epl_frecuencia')==='Cada 24 h'&&cr>=50&&get(d,'seq_epl_cyp')==='Sin inhibidor relevante tras revisión'){amount=50;frequency='cada 24 h';}
   else r.blocks.push('No superar 25 mg/día con CrCl <50, inhibidor CYP3A4 leve/moderado o frecuencia sin confirmar.');
  }
 }
 else if(key==='espironolactona'){amount=25;if(escalating)r.blocks.push('Antes de escalar ARM, revisar respuesta, K y creatinina con el seguimiento específico.');}
 else if(key==='eplerenona'){
  if(e!==null&&e<30||n(d,'lip_aclaramiento')!==null&&n(d,'lip_aclaramiento')<30||k!==null&&k>5.4)blocks.push('Eplerenona: función renal o potasio fuera del ajuste rutinario.');
  if(g('tx_operacion')==='Inicio sin fármaco/clase equivalentes'&&k!==null&&k>5)blocks.push('No iniciar eplerenona con K >5.');
  if(n(d,'fevi')!==null&&n(d,'fevi')>30||g('seq_ic_nyha')&&g('seq_ic_nyha')!=='II')blocks.push('Esta pauta de eplerenona requiere IC crónica NYHA II y FEVI ≤30 %.');
  if(g('seq_epl_cyp')==='Inhibidor potente o sin revisar'||g('cyp3a4_fuerte')==='Sí')blocks.push('CYP3A4 potente o sin revisar: no calcular eplerenona.');
  if(g('ic')==='No'||g('ic_sintomatica')==='No')blocks.push('IC negada: conciliar indicación antes de eplerenona.');
 }
 if(key==='furosemida'){amount=20;if(escalating)r.blocks.push('Ajustar diurético según respuesta y volemia; no duplicar automáticamente una dosis actual.');detail='Medio comprimido de 40 mg de la presentación divisible verificada; reevaluar congestión y electrolitos en los primeros días.';}
 else if(key==='atorvastatina'){
  amount=escalating?undefined:Number(get(d,'tx_estatina_dosis').split(' ')[0]);if(escalating){if(![10,20,40].includes(dose)||weeks<4)r.blocks.push('Escalada de atorvastatina: dosis previa 10/20/40 mg, ≥4 semanas y necesidad confirmada.');else amount=dose*2;}
  detail=amount>=40?'Intensidad alta.':'Intensidad moderada: comprobar si basta para la reducción necesaria y la categoría de riesgo.';
 }
 else if(key==='indapamida'){amount=1.5;if(escalating)r.blocks.push('Indapamida retard: no se calcula aumento de 1,5 mg/día.');}
 else if(key==='rosuvastatina'){amount=5;if(escalating){if(![5,10].includes(dose)||weeks<4)r.blocks.push('Escalada de esta vía: 5 a 10 o 10 a 20 mg, tras ≥4 semanas y necesidad confirmada.');else amount=dose*2;}}
 else if(key==='ezetimiba'){amount=10;if(escalating)r.blocks.push('Ezetimiba: dosis de 10 mg/día; no se calcula aumento.');}
 if(r.blocks.length||amount===undefined)return r;
 r.proposal={name:p.name,amount,unit:'mg',frequency,via,detail,monitoring:p.monitoring};return r;
}
