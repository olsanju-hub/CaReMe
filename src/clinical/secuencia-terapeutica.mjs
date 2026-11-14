import {planHtaReduction,planFinerenoneControl,finerenoneControlDraft,mraPriorityGuidance} from './ajustes-seguros.mjs';
/** Selección de conducta antes de concretar dosis. Sin administración ni cambios silenciosos. */
import {fieldState,setValue} from '../model.mjs';
import {readMulti} from '../consultas.mjs';
import {SEQUENCE_MEDS,SEQUENCE_GROUPS} from '../sequence-fields.mjs';
import {auditCrossDomain} from './auditoria.mjs';
import {THERAPEUTIC_OPTIONS,reviewModuleTreatment} from './tratamientos-modulo.mjs';
import {evaluateClinicalBrief} from './consulta-breve.mjs';
import {lipidGoalForCategory} from './dislipemia.mjs';
const g=(d,k)=>fieldState(d,k)==='registrado'?d.values[k]:null;
const n=(d,k)=>g(d,k)===null?null:Number(g(d,k));
const multi=(d,k)=>readMulti(g(d,k)||'[]');
export const SEQUENCE_SOURCES={
 dm2:['https://diabetesjournals.org/care/article/49/Supplement_1/S183/163934','https://redgdps.org/algoritmo-de-tratamiento-de-la-dm2-de-la-redgdps-2026/'],
 hta:['https://academic.oup.com/eurheartj/article/45/38/3912/7741010'],
 lipids:['https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/dyslipidaemias/'],
 ic:['https://academic.oup.com/eurheartj/article/47/38/5346/8766302'],
 erc:['https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf'],
 obesidad:[THERAPEUTIC_OPTIONS.wegovy.source,THERAPEUTIC_OPTIONS.tirze_peso.source],
 hepatico:['https://easlcampus.eu/sites/default/files/2024-08/EASL_CPGs_management_of_MASLD.pdf']
};
export function sequenceCurrent(d,id){
 if(!(SEQUENCE_GROUPS[id]||[]).length)return {raw:[],ids:[],none:false,classes:[]};
 const legacy=[];if(g(d,'fin_estado')==='En tratamiento')legacy.push('finerenona');if(g(d,'lip_estatina')==='Atorvastatina')legacy.push('atorvastatina');if(g(d,'lip_estatina')==='Rosuvastatina')legacy.push('rosuvastatina');if(g(d,'lip_ezetimiba')==='Sí')legacy.push('ezetimiba');if(g(d,'ob_farmaco_actual')==='Wegovy subcutáneo')legacy.push('wegovy');if(g(d,'ob_farmaco_actual')==='Tirzepatida')legacy.push('tirzepatida');if(['Solo basal','Basal y prandial','Premezclas','Otro esquema'].includes(g(d,'insulina_esquema')))legacy.push('insulina');
 const raw=multi(d,'seq_actual_'+id),ids=(SEQUENCE_GROUPS[id]||[]).filter(k=>raw.includes(SEQUENCE_MEDS[k].label)||legacy.includes(k));
 return {raw,ids,none:raw.includes('Sin tratamiento para esta patología'),classes:[...new Set(ids.map(k=>SEQUENCE_MEDS[k].className).filter(Boolean))]};
}
function classesForDose(d,id){
 const known=multi(d,'farmacos_clases').filter(x=>x!=='Sin tratamiento farmacológico');
 const all=Object.keys(SEQUENCE_GROUPS).flatMap(k=>sequenceCurrent(d,k).classes);
 return [...new Set([...known,...all,...sequenceCurrent(d,id).classes])];
}
export function sequenceSchedule(key){
 const p=THERAPEUTIC_OPTIONS[key];if(!p)return [];
 if(p.ladder)return p.ladder.map((dose,i)=>`${dose} mg subcutáneos una vez por semana${i?' solo si persiste indicación y hay buena tolerancia, después de al menos 4 semanas en el escalón anterior':'; dosis de inicio'}.`);
 return p.reference;
}
export function evaluateTherapySequence(d,id){
 if(!SEQUENCE_SOURCES[id])throw new Error('Patología no reconocida');
 const r={id,state:'missing',missing:[],blocks:[],steps:[],followup:[],sources:SEQUENCE_SOURCES[id],actionPerformed:false};
 const need=(...ids)=>{for(const k of ids)if(g(d,k)===null&&!r.missing.includes(k))r.missing.push(k);};
 const step=(action,title,reason,key=null,when='Ahora',extra={})=>r.steps.push({id:id+'-'+r.steps.length,action,title,reason,key,when,operation:'start',...extra});
 const hold=(title,why)=>step('review',title,why);
 const mergeAdjustment=sub=>{
  r.missing=[...new Set([...r.missing,...sub.missing])];r.questionContext=sub.questionContext||'';
  r.steps.push(...sub.steps.map((s,i)=>({id:id+'-adjustment-'+i,...s})));r.followup.push(...sub.followup);r.sources=[...new Set([...r.sources,...sub.sources])];
  if(r.missing.length){r.steps=[];r.state='missing';}else r.state=r.steps.some(x=>x.key)?'plan':r.steps.some(x=>x.action==='review')?'review':'maintain';
  return r;
 };
 const actual=sequenceCurrent(d,id),allCurrentIds=[...new Set(Object.keys(SEQUENCE_GROUPS).flatMap(k=>sequenceCurrent(d,k).ids))],has=k=>allCurrentIds.includes(k),cls=c=>classesForDose(d,id).includes(c),dose=k=>n(d,'seq_dosis_'+k);
 const flags=new Set(multi(d,'seq_comorbilidades').filter(x=>!x.startsWith('Ninguno')));
 for(const [field,label]of [['ic','Insuficiencia cardíaca'],['erc','Enfermedad renal crónica']])if(g(d,field)==='Sí')flags.add(label);
 if(g(d,'lip_ascvd')==='Sí')flags.add('Enfermedad cardiovascular aterosclerótica');
 if(n(d,'imc')>=30)flags.add('Obesidad');
 const hypo=g(d,'dm_hipoglucemias'),egfr=n(d,'tfge');
 r.blocks.push(...auditCrossDomain(d).critical.map(x=>x.title+': '+x.detail));
 if(g(d,'embarazo')==='Sí'||g(d,'dm1')==='Sí'||g(d,'ob_lactancia')==='Sí'||g(d,'lip_lactancia')==='Sí')r.blocks.push('Embarazo, lactancia o DM1: utilizar el circuito específico.');
 need('seq_ambito','seq_objetivo');
 if(d.values.edad&&fieldState(d,'edad')!=='registrado')r.blocks.push('Edad no válida para el circuito adulto.');
 if(g(d,'seq_ambito')&&g(d,'seq_ambito')!=='Adulto estable, sin embarazo ni lactancia, sin proceso agudo')r.blocks.push('Ámbito sin confirmar: resolver la situación especial antes de nuevas pautas.');
 if(id!=='hepatico')need('seq_actual_'+id);
 if(multi(d,'seq_comorbilidades').some(x=>x.startsWith('Ninguno'))&&multi(d,'seq_comorbilidades').length>1)r.blocks.push('Condicionantes contradictorios: no seleccionar ninguno junto con enfermedades.');
 if(actual.none&&actual.ids.length)r.blocks.push('No puede constar ausencia de tratamiento y medicamentos actuales simultáneamente.');
 const existingClasses=classesForDose(d,id);
 if(actual.none&&(SEQUENCE_GROUPS[id]||[]).some(k=>SEQUENCE_MEDS[k].className&&(multi(d,'farmacos_clases').includes(SEQUENCE_MEDS[k].className)||allCurrentIds.includes(k))))r.blocks.push('La ausencia de tratamiento contradice clases farmacológicas ya registradas. Conciliar la medicación.');
 for(const c of ['iSGLT2','Estatina','ARM'])if(allCurrentIds.filter(k=>SEQUENCE_MEDS[k].className===c).length>1)r.blocks.push('Posible duplicidad de '+c+': conciliar antes de modificar.');
 if(allCurrentIds.filter(k=>['arGLP-1','Agonista dual GIP/GLP-1'].includes(SEQUENCE_MEDS[k].className)).length>1)r.blocks.push('Varias incretinas registradas: no añadir ni escalar hasta conciliar.');
 if(allCurrentIds.filter(k=>['IECA','ARA-II','INRA/ARNI'].includes(SEQUENCE_MEDS[k].className)).length>1)r.blocks.push('Varios bloqueantes RAAS registrados: revisar combinación antes de modificar.');
 if(r.blocks.length){r.priorityGuidance=mraPriorityGuidance(d,allCurrentIds);r.state='blocked';return r;}
 if(actual.ids.length)need('seq_adherencia','seq_tolerancia');
 if(actual.ids.some(k=>['otro','otro_sglt2','otra_incretina','otro_diuretico','otro_beta','otro_ara','ieca'].includes(k)))need('farmacos');
 if(r.missing.length)return r;
 if(has('otro')){r.state='review';hold('Conciliar el tratamiento no identificado','La selección depende del principio activo y la dosis que ya toma. No añadir otra clase por defecto.');return r;}
 const reducing=g(d,'seq_objetivo')==='Reducir o simplificar tratamiento';
 const adherent=g(d,'seq_adherencia')==='Dosis y adherencia confirmadas';
 const tolerated=g(d,'seq_tolerancia')==='Buena tolerancia';
 if(id==='obesidad'&&g(d,'ob_tolerancia')==='Problemas de tolerancia'&&!reducing){r.state='review';hold('Revisar la tolerancia discordante','Constan problemas de tolerancia previos; conciliarlos antes de aumentar.');return r;}
 if(id==='dm2'&&g(d,'dm_adherencia')==='Dificultades o dosis omitidas'||id==='lipids'&&g(d,'lip_adherencia')==='Dudas o incumplimiento'){r.state='review';hold('Resolver la adherencia discordante','La dificultad de adherencia ya registrada tiene prioridad sobre una confirmación genérica posterior.');return r;}
 const add=(key,why,when='Ahora',extra={})=>{
  const blocks=reviewModuleTreatment({...d,values:{...d.values,farmacos_clases:JSON.stringify(existingClasses),tx_operacion:'Inicio sin fármaco/clase equivalentes',tx_clave:key}},key);
  if(blocks.length){hold('Revisar '+THERAPEUTIC_OPTIONS[key].name,blocks.join(' '));return;}
  step('start','Iniciar '+THERAPEUTIC_OPTIONS[key].name,why,key,when,extra);
 };
 const currentStep=(med,why,when='Ahora')=>{
  const key=SEQUENCE_MEDS[med]?.key;if(!key)return hold('Revisar '+SEQUENCE_MEDS[med].label,why+' Identificar producto y posología exactos.');
  need('seq_dosis_'+med,'seq_semanas_'+med);
  const current=dose(med),ladder=THERAPEUTIC_OPTIONS[key].ladder;
  if(current!==null&&current<=0){hold('Revisar dosis actual','La dosis actual debe ser positiva; no calcular desde cero.');return;}
  if(ladder&&current!==null&&current>ladder.at(-1)){hold('Revisar dosis y presentación actuales','Dosis fuera de los escalones verificados de esta vía; no convertir ni aumentar automáticamente.');return;}
  if(ladder&&current!==null&&current===ladder.at(-1)){if(id==='dm2')step('insulin','Valorar insulina tras alcanzar la dosis máxima tolerada','No seguir aumentando la incretina; revisar glucemias y alternativas antes de insulinizar.');else hold('Reevaluar respuesta en dosis máxima','No aumentar por encima de la dosis máxima de esta vía; revisar objetivo, alternativas y posible valoración especializada.');return;}
  if(key==='bisoprolol'&&current>=10){step('maintain','Mantener bisoprolol en la dosis objetivo tolerada','No aumentar por encima de 10 mg/día por esta vía.');return;}
  const weeks=n(d,'seq_semanas_'+med),minWeeks=ladder?4:med==='metformina'?2:med==='losartan'?6:['amlodipino','atorvastatina','rosuvastatina','eplerenona'].includes(med)?4:med==='bisoprolol'?(current<5?1:4):0;
  if(weeks!==null&&weeks<minWeeks){step('maintain','Mantener el escalón hasta completar su intervalo mínimo',`Completar al menos ${minWeeks} semanas con la dosis actual y reevaluar tolerancia/respuesta antes de aumentar.`);return;}
  step('titrate','Ajustar '+SEQUENCE_MEDS[med].label,why,key,when,{operation:'escalate',currentMed:med});
 };
 if(actual.ids.length&&!adherent){r.state='review';hold('Resolver adherencia antes de intensificar','Confirmar la pauta realmente tomada y abordar dosis omitidas. No aumentar dosis para compensar incumplimiento.');return r;}
 if(actual.ids.length&&!tolerated&&!reducing){r.state='review';hold('Revisar tolerancia antes de escalar','Identificar el efecto adverso y su relación con el producto; valorar reducción o sustitución, sin una nueva escalada automática.');return r;}
 if(id==='dm2'){
  need('dm2','tfge','dm_hipoglucemias','dm_sintomas','seq_comorbilidades');
  if(r.missing.length)return r;
  if(hypo==='No valoradas'||g(d,'dm_sintomas')==='No valorados'){r.state='review';hold('Comprobar hipoglucemias y síntomas','Los datos sin valorar no equivalen a ausencia de problemas.');return r;}
  if(hypo==='Leves'&&(cls('Insulina')||cls('Sulfonilurea'))&&!reducing){r.state='review';hold('Resolver hipoglucemia antes de intensificar','Revisar el fármaco responsable y el patrón glucémico; una HbA1c elevada no excluye hipoglucemias.');return r;}
  if(has('metformina')){need('seq_dosis_metformina');if(r.missing.length)return r;const cap=egfr>=60?3000:egfr>=45?2000:egfr>=30?1000:0;if(egfr<30||dose('metformina')>cap){step('reduce',egfr<30?'Suspender metformina por TFGe <30':'Reducir metformina al límite renal verificado',egfr<30?'Contraindicación renal: revisar evolución y alternativa.':`La dosis registrada supera el máximo de ${cap} mg/día para esta TFGe. Revisar la pauta y distribución antes de administrar.`);}}
  if(g(d,'dm2')!=='Sí'){hold('Confirmar el diagnóstico de DM2','No aplicar una secuencia de DM2 a un diagnóstico negado o no establecido.');r.state='review';return r;}
  if(n(d,'hba1c')>10||g(d,'dm_sintomas')==='Poliuria, polidipsia o pérdida de peso'){hold('Valorar insulinización y gravedad clínica','Comprobar glucemia actual, síntomas, hidratación y cetonas cuando corresponda. Tras descartar descompensación, usar el recorrido de insulina.',null);step('insulin','Calcular insulina tras valoración de estabilidad','Inicio, ajuste basal, primer bolo o reducción; cada decisión mantiene sus comprobaciones.');r.state='review';return r;}
  if(g(d,'hba1c')===null||g(d,'dm_objetivo_valor')===null||g(d,'dm_hba1c_fiable')==='Posible interferencia o discordancia'){
   const protective=flags.has('Insuficiencia cardíaca')||flags.has('Enfermedad renal crónica');
   if(protective&&!reducing&&!flags.has('Fragilidad')){
    if(flags.has('Enfermedad renal crónica')){need('persistencia');if(r.missing.length)return r;if(g(d,'persistencia')!=='Sí'){hold('Confirmar ERC antes de atribuir esa indicación','La cronicidad renal no está confirmada.');r.state='review';return r;}}
    if(!cls('iSGLT2')&&egfr>=20)add(flags.has('Insuficiencia cardíaca')?'empa_ic':'empa_erc','La protección cardiorrenal no exige disponer de HbA1c ni estar fuera del objetivo glucémico.');
    else step('maintain','Revisar y conservar la protección cardiorrenal adecuada','La ausencia de HbA1c no equivale a control glucémico confirmado; no intensificar glucosa sin datos interpretables.');
    hold('Completar la evaluación glucémica por separado','Obtener HbA1c interpretable y objetivo individual o valorar glucemias/monitorización si existe interferencia.');r.followup.push('Revisar seguridad renal y tolerancia tras el cambio; completar después el control glucémico.');r.state=r.steps.some(x=>x.key)?'plan':'review';return r;
   }
   if(g(d,'dm_hba1c_fiable')==='Posible interferencia o discordancia'){hold('Usar una medida interpretable del control glucémico','No intensificar desde una HbA1c con posible interferencia; revisar glucemias o monitorización.');r.state='review';return r;}
   need('hba1c','dm_objetivo_valor');if(r.missing.length)return r;
  }

  const above=n(d,'hba1c')>=n(d,'dm_objetivo_valor');
  if(reducing){
   if(cls('Insulina'))step('insulin','Revisar reducción de insulina','Usar patrón glucémico, hipoglucemias y dosis reales; no retirar bolos mediante un porcentaje de basal.');
   if(cls('Sulfonilurea'))hold('Priorizar revisión del secretagogo','Valorar reducción o retirada si contribuye a hipoglucemia o exceso de tratamiento; hace falta identificar producto y dosis.');
   if(!cls('Insulina')&&!cls('Sulfonilurea'))hold('Revisar carga terapéutica y objetivo','No retirar un fármaco con beneficio cardiorrenal solo porque la HbA1c esté controlada.');
  }else{
   const cardiorenal=flags.has('Insuficiencia cardíaca')||flags.has('Enfermedad renal crónica');
   const vascular=flags.has('Enfermedad cardiovascular aterosclerótica'),obesity=flags.has('Obesidad');
   if(flags.has('Fragilidad')){hold('Individualizar objetivo y carga terapéutica','La fragilidad requiere revisar función, nutrición, hipoglucemia y autocuidado antes de escalar.');r.state='review';return r;}
   if(flags.has('Enfermedad renal crónica')){need('persistencia');if(g(d,'persistencia')&&g(d,'persistencia')!=='Sí'){hold('Confirmar cronicidad renal','No atribuir protección por ERC a una alteración aislada.');r.state='review';return r;}}
   if(cardiorenal&&!cls('iSGLT2')&&egfr>=20)add(flags.has('Insuficiencia cardíaca')?'empa_ic':'empa_erc','Prioridad cardiorrenal, independiente de la HbA1c. Empagliflozina es el representante de referencia de esta vía; dapagliflozina es alternativa si su ficha y TFGe lo permiten.');
   const incretin=cls('arGLP-1')||cls('Agonista dual GIP/GLP-1');
   if((vascular||obesity||egfr<30)&&!incretin&&(above||vascular||cardiorenal)){
    if(cls('iDPP-4'))step('replace','Retirar iDPP-4 al iniciar la terapia GLP-1','No mantener ambos mecanismos en combinación.');
    add('ozempic','Semaglutida con beneficio demostrado en el perfil correspondiente; priorizar si predominan obesidad, ECVA o necesidad de control con ERC avanzada.',r.steps.some(s=>s.key?.startsWith('empa'))?'Tras comprobar tolerancia y necesidad del siguiente cambio':'Ahora');
   }
   if(above&&!r.steps.some(s=>s.key)){
    if(cls('Insulina'))step('insulin','Ajustar la insulina según el patrón glucémico','Distinguir ayunas fuera de objetivo, hiperglucemia posprandial y posible sobrebasalización.');
    else if(has('ozempic')||has('wegovy')||has('tirzepatida')){const med=has('ozempic')?'ozempic':has('wegovy')?'wegovy':'tirzepatida';currentStep(med,'Persistencia fuera del objetivo: comprobar escalón y tiempo mínimo antes de aumentar.');}
    else if(!has('metformina')&&egfr>=45)add('metformina','Opción de inicio cuando no hay una prioridad que desplace esta elección; titular de forma gradual según tolerancia y función renal.');
    else if(has('metformina')&&dose('metformina')===null){need('seq_dosis_metformina','seq_semanas_metformina','seq_metformina_forma');}
    else if(has('metformina')&&egfr>=30&&dose('metformina')<Math.min(2000,egfr<45?1000:2000)){need('seq_semanas_metformina','seq_metformina_forma');if(g(d,'seq_metformina_forma')==='Liberación inmediata, pauta confirmada')currentStep('metformina','Optimizar la metformina ya administrada antes de añadir otra clase cuando no domina una indicación cardiorrenal.');else hold('Confirmar la formulación de metformina','No aplicar la titulación de liberación inmediata a una formulación diferente.');}
    else if(!cls('iSGLT2')&&egfr>=45)add('empa_dm2','Añadir una clase no duplicada. Con TFGe <45 el efecto glucémico disminuye: no confiar en ella como única intensificación para controlar HbA1c.');
    else if(!incretin){if(cls('iDPP-4'))step('replace','Retirar iDPP-4 al iniciar GLP-1','Evitar combinación sin beneficio adicional.');add('ozempic','Siguiente clase cuando persiste fuera del objetivo tras el tratamiento actual.');}
    else hold('Revisar estrategia combinada y posible insulina','Ya constan clases principales; revisar dosis reales, glucemias y necesidad de insulinización.');
   }
   if(!above&&!r.steps.length)step('maintain','Mantener el tratamiento que logra el objetivo','Revisar hipoglucemia y carga terapéutica; no escalar por rutina.');
   if(r.steps.some(s=>s.key)&&[...actual.classes].some(c=>['Insulina','Sulfonilurea'].includes(c)))hold('Revisar dosis de insulina o secretagogos antes de añadir','La nueva terapia puede exigir reducir el tratamiento que provoca hipoglucemia. No se calcula una reducción sin patrón glucémico.');
  }
  if(!reducing&&r.steps.some(s=>s.key==='metformina'))step('future','Si persiste fuera del objetivo, añadir una clase complementaria','Tras revisar tolerancia y dosis de metformina, valorar empagliflozina si TFGe permite eficacia glucémica; si predomina obesidad, ECVA o ERC, priorizar la clase con beneficio para ese perfil.',null,'Reevaluación del control, aproximadamente a los 3 meses',{referenceKey:'empa_dm2'});
  if(!reducing&&r.steps.some(s=>s.key?.startsWith('empa')||s.key?.startsWith('dapa')))step('future','Si el control sigue insuficiente, incorporar terapia GLP-1','Semaglutida: iniciar por su escalón de entrada y titular tras cada intervalo mínimo; retirar iDPP-4 si lo recibe y revisar insulina/secretagogos.',null,'Después de reevaluar control, tolerancia y necesidad',{referenceKey:'ozempic'});
  r.followup.push('Reevaluar HbA1c aproximadamente a los 3 meses tras modificar tratamiento; revisar antes tolerancia, glucemias e hipoglucemia.','Si persiste fuera del objetivo, comprobar adherencia y dosis alcanzadas antes de avanzar a otra clase.');
 }
 if(id==='hta'){
  need('hta_conocida','pas','pad','seq_pa_objetivo','seq_pad_objetivo','seq_pa_valida','seq_hta_vulnerable');if(r.missing.length)return r;
  if(g(d,'hta_conocida')!=='Sí'||g(d,'seq_pa_valida')!=='Media validada; control fuera de consulta revisado cuando corresponde'){hold('Confirmar diagnóstico y control de PA','No intensificar por una lectura aislada; revisar AMPA/MAPA cuando corresponda.');r.state='review';return r;}
  if(reducing)return mergeAdjustment(planHtaReduction(d,actual.ids));
  if(g(d,'seq_hta_vulnerable')!=='Ninguno tras valoración'||n(d,'edad')>=85||g(d,'hta_fragilidad')==='Sí'||flags.has('Fragilidad')){hold('Individualizar pauta y objetivo por vulnerabilidad','Revisar ortostatismo, caídas, volemia y motivo de cada fármaco. Considerar inicio con monoterapia o reducción escalonada según el caso; no suspender un fármaco pronóstico por su efecto sobre la PA sin revisar la indicación.');r.state='review';return r;}
  if(n(d,'pas')<n(d,'seq_pa_objetivo')&&n(d,'pad')<n(d,'seq_pad_objetivo'))step('maintain','Mantener y vigilar tolerancia','PA dentro del límite sistólico individual y diastólico individualizados; comprobar ausencia de hipotensión sintomática.');
  else{
   const ras=cls('IECA')||cls('ARA-II')||cls('INRA/ARNI'),ccb=cls('Calcioantagonista dihidropiridínico'),thiazide=cls('Diurético tiazídico o similar');
   if(cls('INRA/ARNI')){hold('Ajustar PA dentro del plan de insuficiencia cardíaca','No añadir IECA ni ARA-II al ARNI. Revisar primero la terapia de IC.');}
   else if(!ras&&!ccb&&!thiazide){add('losartan','Inicio combinado en HTA confirmada, si función renal, K y contexto lo permiten.');add('amlodipino','Segundo componente de la combinación inicial. Preferir combinación en un comprimido cuando exista presentación apropiada y esté verificada.');}
   else if(!ras)add('losartan','Completar bloqueo RAAS sin duplicar IECA/ARA-II.');
   else if(!ccb)add('amlodipino','Completar combinación con calcioantagonista.');
   else if(!thiazide)add('indapamida','Completar triple terapia si el control sigue insuficiente; comprobar CrCl, Na y K antes.');
   else{
    for(const med of ['losartan','amlodipino'])if(has(med)){need('seq_dosis_'+med,'seq_semanas_'+med);if(dose(med)!==null&&dose(med)<(med==='losartan'?100:10))currentStep(med,'Con triple terapia, valorar el siguiente escalón si sigue fuera del objetivo y hay buena tolerancia.');}
    if(!r.steps.length)hold('Valorar hipertensión resistente y derivación','Confirmar adherencia, dosis máximas toleradas y control fuera de consulta; descartar causas secundarias antes de añadir un cuarto fármaco.');
   }
   step('future','Siguiente escalón si persiste fuera del objetivo','Doble combinación → triple combinación → optimizar dosis toleradas → estudio de resistencia. No ejecutar la secuencia de una vez.',null,'Después de reevaluar PA y tolerancia');
  }
  r.followup.push('Reevaluar PA y tolerancia alrededor de un mes tras el cambio; adelantar si aparecen síntomas.','Tras IECA/ARA-II: creatinina y K a las 2–4 semanas; con indapamida revisar K durante la primera semana y Na según contexto.');
 }
 if(id==='lipids'){
  need('ldl','lip_intolerancia');if(g(d,'lip_ascvd')!=='Sí')need('lip_riesgo');if(r.missing.length)return r;
  const category=g(d,'lip_ascvd')==='Sí'?'Muy alto':g(d,'lip_riesgo');
  const goal=lipidGoalForCategory(category);
  if(!goal){hold('Establecer el riesgo cardiovascular','Determinar la categoría antes de calcular intensidad y objetivo LDL.');r.state='review';return r;}
  if(reducing||g(d,'lip_intolerancia')!=='No'){hold('Revisar intolerancia y alternativa hipolipemiante','Confirmar relación con el tratamiento; valorar estatina tolerada, ezetimiba y otras terapias con beneficio según riesgo. No retirar prevención secundaria por un LDL bajo aislado.');r.state='review';return r;}
  const statin=has('atorvastatina')?'atorvastatina':has('rosuvastatina')?'rosuvastatina':null;
  const high=['Alto','Muy alto'].includes(category);
  if(category==='Muy alto'){need('seq_sca_reciente');if(r.missing.length)return r;if(g(d,'seq_sca_reciente')!=='No'){hold('Aplicar estrategia de intensificación precoz tras SCA','Conciliar el plan de alta y valorar tratamiento intensivo/combinado según LDL y riesgo. No aplicar por defecto una escalada ambulatoria lenta; si no se ha revisado el antecedente, aclararlo antes.');r.state='review';return r;}}
  if(n(d,'ldl')<goal.ldlLessThan&&!statin&&high){need('lip_ascvd');if(g(d,'lip_ascvd')==='Sí')add('atorvastatina','Prevención secundaria: el LDL basal bajo no sustituye la indicación de tratamiento por ECVA confirmada.','Ahora',{initialDose:40});else hold('Revisar indicación por riesgo aunque el LDL sea bajo','No interpretar el objetivo absoluto aislado como ausencia de indicación farmacológica; revisar el motivo de alto riesgo y preferencias.');}
  else if(n(d,'ldl')<goal.ldlLessThan){step('maintain','Mantener la pauta si cumple también la reducción desde el basal','LDL por debajo del objetivo absoluto; en alto/muy alto riesgo comprobar además la reducción relativa requerida.');}
  else if(!statin)add('atorvastatina','Estatina de referencia del circuito; intensidad calculada por riesgo, sin afirmar superioridad sobre otras estatinas.', 'Ahora',{initialDose:high?40:10});
  else{
   need('seq_dosis_'+statin,'seq_semanas_'+statin,'lip_max_tolerada');
   if(dose(statin)!==null){
    const max=statin==='atorvastatina'?80:20;
    if(statin==='rosuvastatina'&&dose(statin)>=20&&g(d,'lip_max_tolerada')!=='Sí'){hold('Revisar intensificación desde rosuvastatina 20 mg','La dosis de 40 mg requiere selección y supervisión específicas; no asumir que 20 mg es la máxima tolerada. Valorar asociación con ezetimiba según riesgo y respuesta.');}
    else if(g(d,'lip_max_tolerada')==='Sí'||dose(statin)>=max){if(!has('ezetimiba'))add('ezetimiba','LDL fuera del objetivo pese a estatina máxima tolerada; mantener la estatina tolerada.');else hold('Añadir terapia no estatínica de siguiente línea','LDL no controlado con estatina tolerada y ezetimiba: valorar PCSK9 o ácido bempedoico según indicación, acceso y valoración especializada.');}
    else currentStep(statin,'Aumentar un escalón tras el intervalo mínimo, con tolerancia y adherencia confirmadas.');
   }
  }
  step('future','Secuencia si no se alcanza el objetivo','Estatina a intensidad apropiada o máxima tolerada → añadir ezetimiba → valorar PCSK9/ácido bempedoico. En SCA reciente se requiere una estrategia de intensificación precoz específica.',null,'Según LDL y respuesta tras cada cambio');
  r.followup.push('Repetir perfil lipídico aproximadamente a las 4–6 semanas del cambio y revisar tolerancia; valorar antes síntomas musculares o hepáticos.');
 }
 if(id==='obesidad'){
  need('imc','seq_comorbilidades','ob_tca','ob_perdida_involuntaria','ob_edema','ob_musculo','embarazo_planificado');if(r.missing.length)return r;
  if(['ob_tca','ob_perdida_involuntaria','ob_edema','embarazo_planificado'].some(k=>!['No','No procede','No tras valoración'].includes(g(d,k)))||g(d,'ob_musculo')!=='No tras valoración'||flags.has('Fragilidad')){hold('Resolver el condicionante antes de intensificar pérdida de peso','Evaluar nutrición, masa muscular y causas del cambio de peso; adaptar el plan y la seguridad reproductiva.');r.state='review';return r;}
  if(reducing){hold('Revisar respuesta, tolerancia y mantenimiento del peso','Evitar una retirada automática al alcanzar un peso; valorar efectos adversos y plan de mantenimiento.');}
  else if(n(d,'imc')<27||n(d,'imc')<30&&!flags.size&&g(d,'dm2')!=='Sí'){step('maintain','Priorizar intervención nutricional y actividad adaptada','No se cumple el umbral de esta vía para fármaco de peso.');}
  else{
   const med=has('wegovy')?'wegovy':has('tirzepatida')?'tirzepatida':null;
   if(med){need('seq_respuesta_peso');if(g(d,'seq_respuesta_peso')==='Objetivo acordado alcanzado o respuesta suficiente')step('maintain','Mantener la dosis eficaz y tolerada','No escalar por calendario si la respuesta acordada ya es suficiente.');else if(g(d,'seq_respuesta_peso')==='Insuficiente tras evaluación')currentStep(med,'Avanzar solo si el escalón actual se tolera, ha cumplido su intervalo mínimo y persiste indicación.');else hold('Evaluar respuesta antes de escalar','Comprobar peso, función y objetivo acordado.');}
   else if(cls('arGLP-1')||cls('Agonista dual GIP/GLP-1'))hold('Revisar la incretina ya administrada','No añadir otra incretina ni convertir automáticamente entre productos e indicaciones.');
   else add('wegovy','Semaglutida para peso es el representante de referencia de esta vía. Tirzepatida es alternativa según perfil, tolerancia, acceso y decisión compartida; no se presume superioridad universal.');
  }
  r.followup.push('Acompañar de un plan nutricional y actividad adaptada, preservando masa muscular.','Revisar tolerancia durante la titulación y respuesta de peso/función; no aumentar si ya hay respuesta suficiente o aparecen efectos adversos.');
 }
 if(id==='erc'){
  need('tfge','cac','unidad_cac','persistencia','dm2','ic','potasio');if(r.missing.length)return r;
  const a=n(d,'cac');
  if(g(d,'persistencia')!=='Sí'||g(d,'unidad_cac')!=='mg/g'||egfr>=60&&a<30){hold('Confirmar ERC y unidades antes del tratamiento renal','Esta vía requiere cronicidad y un marcador renal; una analítica aislada o G1/G2-A1 sin otros marcadores no confirma ERC.');r.state='review';return r;}
  if(has('finerenona')){const sub=planFinerenoneControl(d);r.missing.push(...sub.missing);r.steps.push(...sub.steps);r.followup.push(...sub.followup);r.sources=[...new Set([...r.sources,...sub.sources])];}
  if(reducing&&!has('finerenona')){hold('Revisar motivo del ajuste y evolución renal','Hipotensión, hiperpotasemia o deterioro agudo requieren evaluar causa y cambios recientes. No retirar protección renal solo por un descenso inicial esperado de TFGe.');}
  else if(!reducing){
   if(!cls('iSGLT2')&&egfr>=20&&(g(d,'dm2')==='Sí'||g(d,'ic')==='Sí'||a>=200||egfr<45))add('empa_erc','Protección renal según perfil, independiente de la necesidad de bajar glucosa; verificar ficha y estabilidad.');
   if(a>=30&&!['IECA','ARA-II','INRA/ARNI'].some(cls)){need('hta_conocida');if(g(d,'hta_conocida')==='Sí')add('losartan','Albuminuria con HTA: iniciar bloqueo RAAS y titular según PA, K y creatinina.');else hold('Revisar indicación de IECA/ARA-II por albuminuria','La protección renal puede indicar bloqueo RAAS según contexto; esta pauta numérica de losartán está verificada para HTA y no se extrapola automáticamente.');}
   if(g(d,'dm2')==='Sí'&&a>=30&&!cls('ARM')){need('ras_optimizado');if(g(d,'ras_optimizado')==='Sí'&&egfr>=25&&n(d,'potasio')<=5)add('fine_erc','Albuminuria persistente en ERC-DM2 pese a RAAS optimizado, con TFGe y K aptos.',r.steps.length?'Tras comprobar respuesta y tolerancia de la protección previa':'Ahora');else step('future','Valorar finerenona tras optimizar RAAS','Requiere ERC-DM2, albuminuria persistente, TFGe ≥25, K ≤5 y ausencia de otro ARM.',null,'Después de comprobar elegibilidad');}
   if(!r.steps.length)step('maintain','Mantener protección renal y seguimiento individualizado','Revisar dosis toleradas y evolución de albuminuria/TFGe.');
  }
  r.followup.push('Tras inicio o aumento de IECA/ARA-II: PA, creatinina y K a las 2–4 semanas.','Finerenona: K y función renal a las 4 semanas; antes si el contexto lo exige. TFGe <30 o progresión/albuminuria importantes requieren valorar Nefrología.');
 }
 if(id==='ic'){
  need('ic','ic_sintomatica','ic_estabilidad','fevi','congestion','pas','tfge','potasio');if(r.missing.length)return r;
  if(g(d,'ic')!=='Sí'||g(d,'ic_sintomatica')!=='Sí'||g(d,'ic_estabilidad')!=='Estable evaluado'){hold('Confirmar IC sintomática estable','La FEVI aislada no establece diagnóstico ni permite iniciar la secuencia. Valorar descompensación antes de ajustar.');r.state='review';return r;}
  if(has('finerenona')){const sub=planFinerenoneControl(d);r.missing.push(...sub.missing);r.steps.push(...sub.steps);r.followup.push(...sub.followup);r.sources=[...new Set([...r.sources,...sub.sources])];}
  if(reducing){hold('Revisar congestión y motivos de cada fármaco','Sin congestión puede revisarse primero la necesidad de diurético. No retirar terapia pronóstica por mejoría de FEVI sin revisar su trayectoria.');}
  else{
   if(!cls('iSGLT2')&&egfr>=20)add('empa_ic','Tratamiento con beneficio en IC sintomática a través del espectro de FEVI.');
   if(n(d,'fevi')<50){
    if(!cls('INRA/ARNI')){if(cls('IECA')||cls('ARA-II'))step('replace','Sustituir IECA/ARA-II por ARNI si es elegible','No asociar ambos; confirmar suspensión de ARA-II o lavado ≥36 h tras IECA antes de la primera dosis.','arni','Tras confirmar suspensión y lavado');else add('arni','Completar tratamiento pronóstico con FEVI reducida si PA, K y función renal lo permiten.');}
    if(!cls('Betabloqueante'))add('bisoprolol','Añadir betabloqueante con evidencia en IC estable, comprobando FC y conducción.');
    else if(has('bisoprolol'))currentStep('bisoprolol','Titular hacia dosis tolerada/objetivo tras comprobar FC, PA y estabilidad.');
    if(!cls('ARM')){if(n(d,'fevi')>=40)add('fine_ic','ARM con indicación de IC y FEVI ≥40; comprobar K y TFGe.');else{if(g(d,'tx_nyha')==='IC grave NYHA III-IV'||['III','IV'].includes(g(d,'seq_ic_nyha')))add('espironolactona','Completar ARM en NYHA III–IV, si K, creatinina y TFGe lo permiten.');else{need('seq_ic_nyha');if(g(d,'seq_ic_nyha')==='II'&&n(d,'fevi')<=30)add('eplerenona','IC crónica NYHA II y FEVI ≤30 %: completar ARM con indicación CIMA verificada; calcular dosis por CrCl, K e interacciones.');else if(g(d,'seq_ic_nyha'))hold('Revisar ARM para el perfil concreto','No extrapolar la indicación CIMA de eplerenona NYHA II/FEVI ≤30 ni la de espironolactona NYHA III–IV a otros perfiles.');}}}
   }else if(!cls('ARM'))add('fine_ic','FEVI ≥50 con IC sintomática: valorar ARM por su indicación específica.');
   if(has('eplerenona')){
    need('seq_dosis_eplerenona','seq_semanas_eplerenona','seq_epl_frecuencia','lip_aclaramiento','seq_epl_cyp','seq_mra_control');
    if(!r.missing.length){
     const current=dose('eplerenona'),cr=n(d,'lip_aclaramiento'),daily=g(d,'seq_epl_frecuencia')==='Cada 24 h';
     if(egfr<30||cr<30||g(d,'seq_epl_cyp')==='Inhibidor potente o sin revisar'||g(d,'seq_mra_control')!=='Analítica actual revisada, sin deterioro agudo')hold('Revisar seguridad de eplerenona antes de ajustar','Función renal, CYP3A4 o control analítico no aptos para una titulación rutinaria.');
     else if(![25,50].includes(current)||g(d,'seq_epl_frecuencia')==='No confirmada'||current===50&&!daily)hold('Conciliar dosis y frecuencia de eplerenona','No calcular desde una frecuencia desconocida o un escalón no verificado.');
     else if(current===50&&(cr<50||g(d,'seq_epl_cyp')==='Inhibidor leve o moderado'))hold('Revisar 50 mg de eplerenona con límite de 25 mg/día','La función renal o interacción declarada limita esta vía a 25 mg/día.');
     else if(n(d,'potasio')>=5||current===50||current===25&&daily&&(cr<50||g(d,'seq_epl_cyp')==='Inhibidor leve o moderado'))step('maintain','Mantener el escalón de eplerenona y vigilar','El potasio, la dosis objetivo o el límite renal/interacción impiden una nueva subida por esta vía.');
     else currentStep('eplerenona','Titular según K, CrCl, frecuencia actual e inhibidores CYP3A4.');
    }
   }
   if(g(d,'congestion')==='Presentes'){if(!cls('Diurético de asa'))add('furosemida','Tratar congestión en situación estable; no sustituye la terapia pronóstica.');else hold('Ajustar el diurético según respuesta','Revisar peso, volemia, dosis actual, PA y electrolitos; no duplicar automáticamente la dosis.');}
   step('future','Completar las clases fundamentales toleradas','La secuencia no obliga a alcanzar la dosis máxima de una clase antes de añadir las demás. Priorizar según PA, FC, TFGe, K y congestión.',null,'Reevaluación temprana e individualizada');
  }
  r.followup.push('Revisar pronto PA, FC, peso, síntomas, función renal y electrolitos tras cada cambio.','No iniciar simultáneamente todas las propuestas sin organizar controles y reevaluación; ajustar el orden a la situación clínica.');
 }
 if(id==='hepatico'){
  const q=evaluateClinicalBrief(d,'hepatico');need('edad','fib4_informado','hepatico_valoracion','fib4_contexto');
  r.blocks.push(...q.safety);for(const text of q.steps)step('review','Conducta hepática',text);
  for(const text of q.treatment)step('comorbidity',text.title,text.detail);
  r.followup.push('No seleccionar tratamiento específico de MASH a partir de FIB-4 aislado. Tratar las comorbilidades por su indicación.');
 }
 if(r.blocks.length){r.state='blocked';r.steps=[];return r;}
 if(r.missing.length){r.state='missing';r.steps=[];return r;}
 // La salida de clases no autoriza ni registra una administración.
 r.state=r.steps.some(x=>x.key||x.action==='insulin')?'plan':r.steps.some(x=>x.action==='review')?'review':'maintain';
 return r;
}
export function prepareSequenceDose(d,id,step){
 if(!step?.key||!THERAPEUTIC_OPTIONS[step.key])throw new Error('Paso sin pauta calculable');
 let out=d;
 out=setValue(out,'farmacos_clases',JSON.stringify(classesForDose(d,id)));
 out=setValue(out,'tx_clave',step.key);
 out=setValue(out,'tx_operacion',step.operation==='escalate'?'Escalada del mismo producto, sin interrupciones':step.operation==='reduce'?'Reducción del mismo producto tras revisión':'Inicio sin fármaco/clase equivalentes');
 if(g(d,'seq_ambito')==='Adulto estable, sin embarazo ni lactancia, sin proceso agudo')out=setValue(out,'tx_contexto','Adulto estable, sin embarazo ni lactancia');
 if(step.key==='espironolactona'&&['III','IV'].includes(g(d,'seq_ic_nyha')))out=setValue(out,'tx_nyha','IC grave NYHA III-IV');
 if(step.key.startsWith('fine')&&step.operation==='escalate')out=finerenoneControlDraft(out);
 if(step.initialDose)out=setValue(out,'tx_estatina_dosis',step.initialDose+' mg');
 if(step.currentMed){
  const dose=n(d,'seq_dosis_'+step.currentMed),weeks=n(d,'seq_semanas_'+step.currentMed);
  if(dose!==null)out=setValue(out,'tx_dosis_actual',String(dose));
  if(weeks!==null)out=setValue(out,'tx_semanas',String(weeks));
  if(g(d,'seq_tolerancia')==='Buena tolerancia'&&g(d,'seq_adherencia')==='Dosis y adherencia confirmadas')out=setValue(out,'tx_tolerancia','Buena tolerancia y escalado indicado');
 }
 // Nunca heredar una revisión de otro producto o de datos anteriores.
 return setValue(out,'tx_revision','Pendiente');
}
