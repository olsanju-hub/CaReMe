/**
 * CaHReMe — circuito original de insulinización en adultos con DM2.
 * Tres rutas independientes: inicio, intensificación y desintensificación.
 * Orientación no prescriptiva; referencias ADA/EASD 2026, ADA 2026 y
 * redGDPS insulinización 2022. No adapta dosis de insulina automáticamente.
 */
import {fieldState} from '../model.mjs';
import {readMulti} from '../consultas.mjs';
import {auditCrossDomain} from './auditoria.mjs';

export const INSULIN_SOURCES=Object.freeze({
 consensus:{
   id:'ADA-EASD-DM2-2026',
   name:'ADA/EASD · Consenso DM2 2026',
   url:'https://diabetesjournals.org/care/article/doi/10.2337/dci26-0141/172591',
   detail:'Lugar de la insulina, basal, intensificación y protección cardiorrenal'
 },
 ada9:{
   id:'ADA-2026-9',name:'ADA · Standards of Care 2026, sección 9',
   url:'https://diabetesjournals.org/care/article/49/Supplement_1/S183/163934',
   detail:'Inicio, intensificación, sobrebasalización y tratamientos asociados'
 },
 ada6:{
   id:'ADA-2026-6',name:'ADA · Standards of Care 2026, sección 6',
   url:'https://diabetesjournals.org/care/article/49/Supplement_1/S132/163927',
   detail:'Prevención de hipoglucemia, educación y glucagón'
 },
 ada13:{
   id:'ADA-2026-13',name:'ADA · Standards of Care 2026, sección 13',
   url:'https://diabetesjournals.org/care/article/49/Supplement_1/S277/163921/13-Older-Adults-Standards-of-Care-in-Diabetes-2026',
   detail:'Fragilidad, simplificación, desintensificación y prevención de hipoglucemia'
 },
 redgdps:{
   id:'REDGDPS-INSULINA-2022',name:'Fundación redGDPS · Insulinización DM2 2022',
   url:'https://www.redgdps.org/algoritmo-insulinizacion-2022/',
   detail:'Referencia española para tres circuitos; contrastada con consenso 2026'
 },
 cima:{
   id:'CIMA-LANTUS-U100',name:'CIMA-AEMPS · insulina glargina 100 unidades/mL, Lantus SoloStar',
   url:'https://cima.aemps.es/cima/dochtml/ft/00134033/',
   detail:'Ficha por formulación; pauta individualizada y precauciones de insulina basal'
 }
});
export const INSULIN_PHASES=Object.freeze({
 inicio:'Valorar inicio',
 intensificacion:'En tratamiento basal · valorar intensificación',
 desintensificacion:'Valorar desintensificación'
});
const value=(d,id)=>fieldState(d,id)==='registrado'?String(d.values[id]):null;
const number=(d,id)=>{const v=value(d,id);return v===null?null:Number(v)};
const multiple=(d,id)=>{const v=value(d,id);return v===null?null:readMulti(v)};
const unique=arr=>[...new Set(arr)];
const suggestion=(id,title,rationale,checks,sources)=>({
  id,title,rationale,checks,sources,
  status:'opcion_para_revision',performed:false,patientDose:null,prescription:null
});
function contextAlerts(d){
 const alerts=[],critical=[];
 const keto=value(d,'cetoacidosis_sospecha')==='Sí'||value(d,'acidosis_metabolica')==='Sí';
 const glucose=number(d,'glucemia_actual');
 const a1c=number(d,'hba1c');
 const hypo=value(d,'dm_hipoglucemias')==='Graves o recurrentes';
 const pregnant=value(d,'embarazo')==='Sí';
 const ill=value(d,'situacion_aguda');
 const acute=ill==='Enfermedad aguda grave'||ill==='Cirugía mayor o ayuno prolongado'||
   value(d,'lra_sospecha')==='Sí';
 if(keto) {
  critical.push('Sospecha de cetoacidosis o acidosis metabólica: valoración urgente con glucemia, cetonemia y equilibrio ácido-base; no utilizar la vía ambulatoria de titulación.');
 }
 if(glucose!==null&&glucose>=300){
  critical.push('Glucemia ≥300 mg/dL: valorar gravedad, cetonas, hidratación y necesidad de insulinización supervisada; no iniciar automáticamente.');
 }
 if(a1c!==null&&a1c>10){
  alerts.push('HbA1c >10 %: considerar necesidad de insulina según cuadro clínico; no equivale a una pauta por sí sola.');
 }
 if(value(d,'dm_sintomas')==='Poliuria, polidipsia o pérdida de peso')
  alerts.push('Síntomas catabólicos o de hiperglucemia: comprobar glucemia y descartar descompensación antes de un ajuste habitual.');
 if(hypo)critical.push('Hipoglucemias graves o recurrentes: priorizar la seguridad, valorar atención inmediata si hay síntomas actuales y revisar desintensificación.');
 if(pregnant)critical.push('Embarazo: aplicar algoritmo específico de diabetes y gestación, no la insulinización general de DM2.');
 if(acute)alerts.push('Enfermedad aguda, ayuno/cirugía o lesión renal aguda: se requiere evaluación del tratamiento y plan específico del proceso agudo.');
 return {alerts,critical,keto,hypo,pregnant,acute};
}
export function evaluateInsulinization(draft,mode='quick'){
 if(!['quick','detail'].includes(mode))throw new Error('Modo de insulinización no permitido');
 const phase=value(draft,'insulina_fase');
 const profiles=multiple(draft,'insulina_perfil');
 const classes=multiple(draft,'farmacos_clases');
 const medicines=new Set(classes||[]);
 const scheme=value(draft,'insulina_esquema');
 const age=number(draft,'edad');
 const dm2=value(draft,'dm2');
 const dm1=value(draft,'dm1');
 const hypo=value(draft,'dm_hipoglucemias');
 const fasting=number(draft,'insulina_ayunas');
 const fastingStatus=value(draft,'insulina_ayunas_objetivo');
 const postmeal=value(draft,'insulina_posprandial');
 const nightHypo=value(draft,'insulina_hipo_nocturna');
 const basalUnits=number(draft,'insulina_dosis_basal');
 const weight=number(draft,'peso');
 const a1c=number(draft,'hba1c');
 const goal=number(draft,'dm_objetivo_valor');
 const insulinDoseRecorded=basalUnits!==null&&basalUnits>0;
 const audit=auditCrossDomain(draft);
 const acute=contextAlerts(draft);
 const missing=[],alerts=[...acute.alerts,...acute.critical],checks=[],nextSteps=[],options=[];
 const sourceIds=['ADA-EASD-DM2-2026','ADA-2026-9','ADA-2026-6','ADA-2026-13','REDGDPS-INSULINA-2022','CIMA-LANTUS-U100'];
 const select=(id,title,rationale,requirements,refs=['ADA-EASD-DM2-2026','ADA-2026-9'])=>
   options.push(suggestion(id,title,rationale,requirements,refs));
 if(!phase)missing.push('Seleccionar inicio, intensificación o desintensificación.');
 if(profiles===null)missing.push('Registrar perfil clínico o seleccionar ausencia de situación especial.');
 if(dm2!=='Sí')missing.push('Confirmar diagnóstico previo de DM2 antes de aplicar un circuito específico.');
 if(dm1===null||dm1==='No valorado')
   checks.push('Descartar diabetes tipo 1 u otra diabetes antes de decidir insulina por la vía DM2.');
 if(value(draft,'embarazo')===null||value(draft,'embarazo')==='No valorado')
   checks.push('Confirmar ausencia de gestación o derivar a circuito específico.');
 if(classes===null)
   checks.push('Conciliar medicación antidiabética y su administración real.');
 if(value(draft,'medicacion_revisada')!=='Sí')
   checks.push('Confirmar fármacos, dosis y pauta realmente administrada.');
 if(value(draft,'alergias_revisadas')!=='Sí')
   checks.push('Comprobar alergias y antecedentes antes de elegir formulación.');
 const limited=(id)=>value(draft,id)===null;
 if(mode==='detail'){
  for(const [id,label] of [
   ['insulina_esquema','Esquema de insulina actual'],
   ['dm_hipoglucemias','Antecedentes de hipoglucemia'],
   ['insulina_autocuidado','Capacidad de autocuidado y apoyo'],
   ['dm_adherencia','Adherencia real al tratamiento'],
   ['dm_dosis_confirmadas','Confirmación de dosis de tratamiento actual'],
   ['tfge','TFGe y seguridad renal']])if(limited(id))missing.push(label);
  if(phase===INSULIN_PHASES.intensificacion){
   for(const [id,label] of [
    ['insulina_ayunas_objetivo','Ayunas respecto a objetivo individual'],
    ['insulina_posprandial','Patrón posprandial']])if(limited(id))missing.push(label);
  }
  if(phase===INSULIN_PHASES.desintensificacion&&limited('insulina_fragilidad'))
   missing.push('Fragilidad y complejidad de autocuidado evaluadas.');
 }
 if(scheme==='No confirmado')checks.push('Reconciliar esquema: el tipo de insulina aún no está confirmado.');
 if(value(draft,'insulina_autocuidado')==='Requiere educación o apoyo')
   checks.push('Planificar entrenamiento para administración, conservación, autocontrol, hipoglucemia y apoyo al cuidador.');
 if(value(draft,'insulina_autocuidado')!=='Capacidad y apoyo adecuados confirmados')
   checks.push('Antes de iniciar o aumentar insulina, comprobar capacidad de autocuidado y acceso a apoyo.');
 if(hypo==='No valoradas'||nightHypo==='No valoradas'||hypo===null)
   checks.push('Valorar hipoglucemia diurna/nocturna; ausencia de datos no significa ausencia de episodios.');
 if(value(draft,'dm_adherencia')==='Dificultades o dosis omitidas')
   checks.push('Investigar errores de técnica o dosis omitidas antes de intensificar.');
 if(medicines.has('Sulfonilurea')||medicines.has('Repaglinida'))
   checks.push('Revisar necesidad de reducir/suspender secretagogos al iniciar o intensificar insulina; no ejecutar cambio automático.');
 if(medicines.has('iSGLT2')||medicines.has('arGLP-1')||medicines.has('Agonista dual GIP/GLP-1'))
   checks.push('Revisar beneficio cardiorrenal y seguridad del tratamiento coexistente; no retirarlo por iniciar insulina de forma automática.');
 if(phase===INSULIN_PHASES.inicio){
  if(scheme && !['Sin insulina','No confirmado'].includes(scheme))
   alerts.push('Se solicita iniciar insulina, pero consta un esquema de insulina ya administrado; reconciliar la fase.');
  if(medicines.has('Insulina')&&scheme==='Sin insulina')
   alerts.push('Tratamiento declarado con insulina y esquema «sin insulina»: registros incompatibles.');
 }
 if(phase===INSULIN_PHASES.intensificacion||phase===INSULIN_PHASES.desintensificacion){
  if(scheme==='Sin insulina') alerts.push('La fase requiere insulina actual, pero se declara «sin insulina».');
  if(classes!==null&&!medicines.has('Insulina')&&
     !classes.includes('Sin tratamiento farmacológico'))
    alerts.push('Fase de tratamiento insulínico sin clase «Insulina» en la medicación reconciliada.');
 }
 if(fastingStatus==='En objetivo individual'&&nightHypo==='Sí')
   alerts.push('Ayunas en objetivo con hipoglucemia nocturna: no aumentar insulina basal; investigar sobrebasalización.');
 if(fastingStatus==='Por debajo del objetivo')
   alerts.push('Glucemia en ayunas por debajo del objetivo: revisar posible exceso de basal, no intensificar.');
 if(value(draft,'insulina_fragilidad')==='Sí'||
    profiles?.includes('Fragilidad o paliativos'))
   checks.push('Individualizar objetivo en fragilidad/paliativos y priorizar evitar hipoglucemia y carga de inyecciones.');
 if(value(draft,'insulina_especiales')!==null&&
    multiple(draft,'insulina_especiales')?.includes('Tratamiento con corticoides'))
   checks.push('Evaluar patrón horario de hiperglucemia asociado a corticoides y horario del fármaco.');
 if(phase===INSULIN_PHASES.intensificacion&&
    fastingStatus==='En objetivo individual'&&postmeal==='Elevaciones posprandiales repetidas')
   checks.push('Ayunas en objetivo y elevación posprandial: no aumentar basal sin abordar el patrón posprandial.');
 const contradictions=[
  ...(phase===INSULIN_PHASES.inicio&&scheme&&!['Sin insulina','No confirmado'].includes(scheme)
    ?['INICIO_CON_INSULINA_ACTUAL']:[]),
  ...(phase!==INSULIN_PHASES.inicio&&phase&&scheme==='Sin insulina'
    ?['FASE_SIN_INSULINA']:[]),
  ...(medicines.has('Insulina')&&scheme==='Sin insulina'
    ?['MEDICACION_ESQUEMA_INCOMPATIBLE']:[]),
  ...(phase!==INSULIN_PHASES.inicio&&phase&&classes!==null&&
    !medicines.has('Insulina') ?['INSULINA_NO_CONCILIADA']:[])
 ];
 if(dm1==='Sí'||dm2==='No')contradictions.push('TIPO_DIABETES_INCOMPATIBLE');
 const urgent=acute.keto||acute.hypo||acute.pregnant||
   number(draft,'glucemia_actual')>=300 && number(draft,'glucemia_actual')!==null;
 const clinicalPriority=urgent||acute.acute||
   (a1c!==null&&a1c>10)||
   value(draft,'dm_sintomas')==='Poliuria, polidipsia o pérdida de peso';
 const blocked=audit.requiresResolution||contradictions.length>0;
 const requireDetailed=mode==='detail'&&(
   missing.length>0||classes===null||
   value(draft,'medicacion_revisada')!=='Sí'||
   value(draft,'dm_adherencia')!=='Adecuada confirmada'||
   value(draft,'dm_dosis_confirmadas')!=='Sí'&&
     !(scheme==='Sin insulina'&&value(draft,'dm_dosis_confirmadas')==='No procede: sin tratamiento')||
   value(draft,'insulina_autocuidado')!=='Capacidad y apoyo adecuados confirmados'
 );
 let state=urgent||clinicalPriority?'seguridad_prioritaria':
   blocked?'revisar_coherencia':
   !phase||dm2!=='Sí'||mode==='detail'&&requireDetailed?'datos_insuficientes':
   'revision_pendiente';
 if(!phase){
  nextSteps.push('Identificar si se trata de inicio, intensificación o simplificación, y completar antecedentes.');
 } else if(urgent){
  nextSteps.push('Evaluar inmediatamente la situación de seguridad y la necesidad de atención urgente; no utilizar la titulación rutinaria de esta pantalla.');
 } else if(blocked){
  nextSteps.push('Reconciliar diagnóstico, fase, tratamiento y discrepancias antes de valorar cambios.');
 } else if(clinicalPriority){
  nextSteps.push('Valorar gravedad, síntomas y glucemias; decidir necesidad de intervención supervisada antes de una pauta ambulatoria.');
 } else if(phase===INSULIN_PHASES.inicio){
  nextSteps.push('Comprobar objetivo individual, síntomas, HbA1c, fármacos actuales y preferencias antes de elegir primer inyectable.');
  if(medicines.has('arGLP-1')||medicines.has('Agonista dual GIP/GLP-1'))
   nextSteps.push('Ya hay terapia basada en GLP-1; revisar respuesta y tolerancia, sin duplicar.');
  else
   nextSteps.push('Sin hiperglucemia grave, valorar terapia basada en GLP-1 antes de insulina cuando sea apropiada.');
  if(mode==='detail'&&!requireDetailed&&scheme==='Sin insulina'){
   select('INS-START-BASAL','Revisar inicio de insulina basal',
    'Cuando está indicada, la insulina basal una vez al día suele ser el esquema inicial más sencillo en DM2.',
    ['Confirmar indicación real, peso, producto concreto, pauta y seguimiento de glucosa; individualizar en especial ante fragilidad o ERC.',
     'ADA 2026 describe una referencia de inicio basal de 0,1–0,2 U/kg/día: NO es una dosis prescrita ni ajustada aquí.'],
    ['ADA-2026-9','ADA-EASD-DM2-2026','CIMA-LANTUS-U100']);
  }
 } else if(phase===INSULIN_PHASES.intensificacion){
  nextSteps.push('Comprobar HbA1c/objetivo, glucemias de ayunas y posprandiales, técnica y dosis de basal realmente administradas.');
  if(fastingStatus==='En objetivo individual'&&postmeal==='Elevaciones posprandiales repetidas'){
   nextSteps.push('La elevación residual parece posprandial: evitar subir basal solo por HbA1c.');
   if(mode==='detail'&&!requireDetailed&&scheme==='Solo basal'&&nightHypo!=='Sí'){
    if(!(medicines.has('arGLP-1')||medicines.has('Agonista dual GIP/GLP-1')))
     select('INS-INT-GLP1','Revisar terapia basada en GLP-1 antes de prandial',
       'ADA 2026 prioriza revisar GLP-1/agonista dual según elegibilidad y tolerancia.',
       ['Comprobar ficha individual, hipoglucemias y necesidad de ajustar insulina existente.']);
    select('INS-INT-PRANDIAL','Valorar cobertura prandial tras evaluación',
     'Ayunas controladas con hiperglucemia posprandial persistente pueden requerir estrategia dirigida a comidas.',
     ['Identificar comida de mayor excursión, autocontrol/MCG, educación, riesgo de hipoglucemia y esquema basal; sin pauta calculada.']);
   }
  } else if(fastingStatus==='Por encima del objetivo'){
   nextSteps.push('Antes de cambiar esquema, valorar glucosa en ayunas, adherencia, horarios, basal actual y causas de falta de control.');
   if(mode==='detail'&&!requireDetailed&&scheme==='Solo basal'){
    select('INS-INT-REVIEW-BASAL','Revisar adecuación de insulina basal actual',
     'El ayuno fuera de objetivo puede requerir optimización, tras descartar dosis omitidas y episodios de hipoglucemia.',
     ['Verificar producto, pauta real, variabilidad glucémica y autocuidado. Ningún incremento automático de unidades.']);
   }
  } else {
   nextSteps.push('Si el ayuno está en objetivo, es bajo o faltan patrones, no aumentar basal a ciegas.');
  }
  if(nightHypo==='Sí'||fastingStatus==='Por debajo del objetivo')
   checks.push('Alertas de posible sobrebasalización: revisar hipoglucemias/nocturnidad y diferencias glucémicas antes de intensificar.');
 } else if(phase===INSULIN_PHASES.desintensificacion){
  nextSteps.push('Revisar motivo de simplificación, objetivo individual, hipoglucemias, funcionalidad y capacidad de autocuidado.');
  if(acute.hypo||nightHypo==='Sí')
   checks.push('Identificar episodios de hipoglucemia y priorizar su prevención antes de una nueva pauta.');
  if(mode==='detail'&&!requireDetailed&&scheme!=='Sin insulina'){
   select('INS-DEINTENSIFY-REVIEW','Valorar simplificación del esquema insulínico',
    'En fragilidad, hipoglucemias, alta carga terapéutica o cambio de situación clínica puede ser apropiado reducir complejidad.',
    ['Revisar glucemia/MCG, perfil previo, alimentación, apoyos y objetivos funcionales.',
     'Ninguna reducción o suspensión se ejecuta automáticamente; se requiere plan de seguimiento.'],
    ['ADA-2026-13','ADA-2026-9','REDGDPS-INSULINA-2022']);
  }
 }
 if(basalUnits!==null&&scheme==='Solo basal'&&weight!==null&&weight>0&&basalUnits>0)
   checks.push('Dosis basal aportada: '+(basalUnits/weight).toFixed(2).replace('.',',')+
     ' U/kg/día (cálculo descriptivo). No aplicar un umbral numérico aislado para diagnosticar sobrebasalización.');
 if(phase&&mode==='detail'){
   checks.push('Para toda pauta insulínica, verificar técnica de inyección, dispositivo, almacenamiento, glucómetro/MCG, material y educación en hipoglucemia.');
   checks.push('Valorar disponibilidad y educación para uso de glucagón ante riesgo de hipoglucemia según ADA 2026.');
 }
 const criticalMessage=acute.critical.length>0
  ?'Seguridad clínica prioritaria: no aplicar una pauta ambulatoria automática.'
  :audit.requiresResolution||contradictions.length
     ?'Datos clínicos incompatibles: conciliar antes de proponer cambios.'
     :missing.length||requireDetailed
       ?'Evaluación incompleta: se muestra orientación condicionada, no una prescripción.'
       :'Orientación para revisión profesional y planificación de controles.';
 return {
  module:'insulina',mode,phase,state,summary:criticalMessage,
  nextSteps:unique(nextSteps),options,alerts:unique([...alerts,
    ...audit.critical.map(x=>x.title)]),checks:unique(checks),
  missing:unique(missing),contradictions,
  glycemicPattern:{fasting,fastingStatus,postmeal,nightHypo,basalUnits,
    basalPerKg:basalUnits!==null&&weight>0?Math.round(basalUnits/weight*100)/100:null},
  sourceIds,sources:INSULIN_SOURCES,
  followUp:urgent?'La valoración aguda tiene prioridad; no demorarla por controles rutinarios.':
    phase===INSULIN_PHASES.inicio||phase===INSULIN_PHASES.intensificacion
      ?'Planificar control de glucemias y revisión temprana individualizada tras cualquier cambio real; HbA1c habitualmente hacia 3 meses si no se alcanza el objetivo.'
      :'Programar revisión clínica y glucémica acorde al riesgo de hipoglucemia tras una simplificación realmente confirmada.',
  patientDose:null,prescription:null,actionPerformed:false,
  noPrescription:true,clinicalValidation:'pendiente',
  referenceDose:'ADA 2026: inicio de basal habitualmente 0,1–0,2 U/kg/día; referencia bibliográfica, nunca dosis individual aprobada.'
 };
}
