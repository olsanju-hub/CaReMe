// Prototipo de apoyo a evaluación clínica; no es una escala ni establece diagnóstico.
export const SOURCE={doi:'10.1093/eurheartj/ehag100',url:'https://doi.org/10.1093/eurheartj/ehag100',reviewed:'2026-11-26',version:'0.2',sections:'Diagnóstico de IC crónica; tabla 7; IC descompensada'};
export const GROUPS=[
 {id:'alarms',label:'Prioridad asistencial',hint:'Valora primero la estabilidad del paciente.',fields:[
 ['respiratory','Dificultad respiratoria intensa, hipoxemia o disnea de reposo de inicio reciente'],['perfusion','Signos de hipoperfusión, hipotensión sintomática o alteración de consciencia'],['chestPain','Dolor torácico sugestivo de isquemia o síncope reciente'],['arrhythmia','Arritmia con compromiso clínico'],['worsening','Empeoramiento reciente relevante de disnea o congestión']]},
 {id:'symptoms',label:'Síntomas',hint:'Considera su evolución respecto a la situación basal.',fields:[
 ['dyspnea','Disnea de esfuerzo'],['orthopnea','Ortopnea'],['pnd','Disnea paroxística nocturna'],['fatigue','Fatiga o pérdida de capacidad de esfuerzo'],['swelling','Hinchazón de tobillos'],['weight','Aumento de peso compatible con retención de líquido']]},
 {id:'signs',label:'Exploración',hint:'La ausencia de hallazgos no excluye IC.',fields:[
 ['jvp','Ingurgitación yugular o reflujo hepatoyugular'],['s3','Tercer ruido o desplazamiento del impulso apical'],['crackles','Crepitantes pulmonares'],['edema','Edema periférico bilateral'],['ascites','Ascitis o hepatomegalia congestiva']]},
 {id:'risk',label:'Antecedentes y riesgo',hint:'Identifica riesgo de IC y cardiopatía previa.',fields:[
 ['knownHF','Diagnóstico previo de IC'],['cardiac','Cardiopatía isquémica, valvulopatía o miocardiopatía'],['htn','Hipertensión arterial'],['dm','Diabetes'],['ckd','Enfermedad renal crónica'],['obesity','Obesidad'],['af','Fibrilación auricular u otra arritmia relevante'],['toxins','Exposición a cardiotóxicos o consumo perjudicial de alcohol'],['family','Antecedentes familiares de miocardiopatía']]}
];
const fields=[...GROUPS.flatMap(g=>g.fields.map(([id])=>id)),'vitalsReviewed'];
export function createClinicalContext(){return {findings:{},results:{},peptides:{},echo:{},stageAssessment:{},phenotypeAssessment:{},nyhaAssessment:{},situationAssessment:{},treatmentAssessment:{},medicationAssessment:{groups:{},additional:[],reviewed:false,nextId:1},updatedAt:null};}
export function updateFinding(ctx,id,value){
 if(!fields.includes(id)||!['yes','no','unknown'].includes(value))return ctx;
 const a={...ctx.situationAssessment};
 if(ctx.findings[id]!==value){
  if([...GROUPS[0].fields.map(x=>x[0]),'vitalsReviewed'].includes(id)&&a.stable==='yes')delete a.stable;
  if(['orthopnea','pnd','swelling','weight','jvp','crackles','edema','ascites'].includes(id)&&a.congestion==='no')delete a.congestion;
 }
 return {...ctx,findings:{...ctx.findings,[id]:value},situationAssessment:a,updatedAt:new Date().toISOString()};
}
export function evaluateSuspicion(ctx){
 const f=ctx?.findings??{},val=id=>['yes','no'].includes(f[id])?f[id]:'unknown';
 const group=id=>GROUPS.find(g=>g.id===id).fields;
 const positives=id=>group(id).filter(([k])=>val(k)==='yes').map(([,label])=>label);
 const complete=id=>group(id).every(([k])=>val(k)!=='unknown');
 const alarm=positives('alarms'),sym=positives('symptoms'),sign=positives('signs'),risk=positives('risk');
 const result=(id,level,title,action,details=[])=>({id,level,title,action,details,source:{...SOURCE,sections:['IC-SUS-01','IC-SUS-02','IC-SUS-03'].includes(id)?'ESC 2026, apartado 7.2':'ESC 2026, apartado 5.1 y tabla 7'},ruleType:'Adaptación de flujo experimental; no es una recomendación ESC textual'});
 if(ctx?.situationAssessment?.stable==='no')return result('IC-SUS-01','critical','Inestabilidad clínica registrada','Prioriza valoración urgente inmediata y activa emergencias según gravedad. No demores por clasificación.');
 if(['respiratory','perfusion','chestPain','arrhythmia'].some(k=>val(k)==='yes'))return result('IC-SUS-01','critical','Alarma clínica','Prioriza valoración urgente inmediata y activa el circuito de emergencias según la situación. No demores por pruebas ambulatorias.',alarm);
 if(val('worsening')==='yes')return result('IC-SUS-02','urgent','Posible descompensación','Valora hoy la estabilidad, constantes, congestión y perfusión; decide destino asistencial según los hallazgos. No presupongas IC como única causa.',alarm);
 if((!complete('alarms')||val('vitalsReviewed')!=='yes')&&!(ctx?.situationAssessment?.stable==='yes'&&val('perfusion')==='no'&&val('worsening')==='no'))return result('IC-SUS-03','pending','Completar seguridad','Comprueba las alarmas, presión arterial, frecuencia cardiaca, frecuencia respiratoria y SpO₂; añade temperatura y ECG cuando proceda. No orientar un circuito ambulatorio sin valorar la estabilidad. Un dato no valorado no equivale a normal.');
 if(val('knownHF')==='yes')return result('IC-SUS-04','review','IC previamente diagnosticada','Revisa la evolución clínica, el tratamiento y la posible descompensación. No reclasifiques el diagnóstico por ausencia de síntomas actuales.',[...sym,...sign]);
 if(sym.length||sign.length)return result('IC-SUS-05','review','Hallazgos compatibles con IC','Integra antecedentes, exploración y diagnóstico diferencial. Si persiste sospecha, completa el estudio objetivo y consulta el algoritmo de la guía original. Un hallazgo inespecífico aislado no confirma IC.',[...sym,...sign]);
 if(!complete('symptoms')||!complete('signs'))return result('IC-SUS-06','pending','Evaluación clínica incompleta','Completa síntomas y exploración. No es posible descartar IC con datos ausentes.');
 if(val('knownHF')==='unknown')return result('IC-SUS-07','pending','Antecedentes pendientes','Aclara si existe diagnóstico previo de IC antes de interpretar una evaluación sin hallazgos.');
 if(risk.length)return result('IC-SUS-08','review','Factores de riesgo identificados','Revisa prevención cardiovascular y posibles datos de cardiopatía preclínica. Los factores de riesgo no establecen por sí solos el diagnóstico ni el estadio.',risk);
 if(!complete('risk'))return result('IC-SUS-09','pending','Completar antecedentes','Revisa los factores de riesgo restantes. No se puede asumir que están ausentes.');
 return result('IC-SUS-10','review','Sin hallazgos registrados compatibles','La evaluación no identifica los hallazgos seleccionados. Esto no excluye IC; si la sospecha persiste, completa el estudio clínico.');
}

// Una casilla vacía no equivale a un negativo hasta revisar el bloque explícitamente.
export function setGroupReviewed(ctx,groupId,reviewed){
 const group=GROUPS.find(g=>g.id===groupId);
 if(!group||typeof reviewed!=='boolean')return ctx;
 let next=ctx;
 for(const [id] of group.fields)if(ctx.findings[id]!=='yes')next=updateFinding(next,id,reviewed?'no':'unknown');
 return next;
}
export function isGroupReviewed(ctx,groupId){
 const group=GROUPS.find(g=>g.id===groupId);
 return !!group&&group.fields.every(([id])=>['yes','no'].includes(ctx.findings[id]));
}
export function toggleFinding(ctx,id,checked){
 if(typeof checked!=='boolean')return ctx;
 return updateFinding(ctx,id,checked?'yes':'unknown');
}

// Confirmación única de todos los bloques; nunca confirma las constantes por inferencia.
export function setEvaluationReviewed(ctx,reviewed){
 if(typeof reviewed!=='boolean')return ctx;
 return GROUPS.reduce((next,g)=>setGroupReviewed(next,g.id,reviewed),ctx);
}
export function isEvaluationReviewed(ctx){return GROUPS.every(g=>isGroupReviewed(ctx,g.id));}

// Solo controla la transición sugerida, nunca el acceso directo a módulos.
export function diagnosticNext(ctx){
 const r=evaluateSuspicion(ctx);
 if(r.level==='critical'||r.level==='urgent')return {kind:'urgent',route:'ic/descompensada'};
 if(r.id==='IC-SUS-03')return {kind:'safety',route:'ic/diagnostico/sospecha'};
 if(!isEvaluationReviewed(ctx))return {kind:'incomplete',route:'ic/diagnostico/sospecha'};
 if(r.id==='IC-SUS-05')return {kind:'study',route:'ic/diagnostico/pruebas'};
 if(r.id==='IC-SUS-04')return {kind:'known',route:'ic'};
 return {kind:'review',route:'ic/diagnostico/pruebas'};
}

/** Presentación del próximo paso; no modifica ni sustituye las reglas clínicas. */
export function diagnosticAction(ctx){
 const step=diagnosticNext(ctx);
 // Navigation is not clinical authorization. Unknown stability remains unknown.
 if(step.kind==='urgent')return {...step,label:'Abrir IC descompensada (en desarrollo)',action:'open-urgent'};
 return {...step,route:'ic/diagnostico/pruebas',label:'Continuar a pruebas diagnósticas',action:'continue-study'};
}

/* Educational work-up planning. No lab cutoffs, diagnostic confirmation or prescribing. */
export const LAB_FIELDS=[
 ['hemoglobin','Hemoglobina','g/dL','Anemia y causas alternativas de disnea'],
 ['creatinine','Creatinina','mg/dL','Función renal y seguridad de medicación'],
 ['egfr','FG estimado','mL/min/1,73 m²','Clasificación renal y elegibilidad terapéutica'],
 ['uacr','Cociente albúmina/creatinina','mg/g','Daño renal y riesgo cardiorrenal'],
 ['potassium','Potasio','mmol/L','Seguridad de tratamientos que modifican el potasio'],
 ['sodium','Sodio','mmol/L','Balance hidroelectrolítico'],
 ['urea','Urea','mg/dL','Evaluación renal y estado de volumen'],
 ['hba1c','HbA1c','%','Contexto glucémico'],
 ['ferritin','Ferritina','µg/L','Reservas de hierro'],
 ['tsat','Saturación de transferrina','%','Disponibilidad de hierro'],
 ['tsh','TSH','mUI/L','Posible contribución tiroidea'],
 ['alt','ALT','U/L','Valoración hepática'],
 ['ast','AST','U/L','Valoración hepática'],
 ['bilirubin','Bilirrubina total','mg/dL','Valoración hepática'],
 ['ldl','LDL','mg/dL','Riesgo aterosclerótico'],
 ['hdl','HDL','mg/dL','Perfil lipídico'],
 ['totalChol','Colesterol total','mg/dL','Perfil lipídico'],
 ['triglycerides','Triglicéridos','mg/dL','Perfil lipídico']
];
export const REPORT_FIELDS={
 ecg:{label:'Hallazgo principal del ECG',options:[['unknown','Sin resultado interpretado'],['normal','Sin alteraciones relevantes descritas'],['af','Fibrilación auricular'],['conduction','Alteración de conducción'],['ischemia','Alteraciones sugestivas de isquemia'],['other','Otras alteraciones']]},
 rx:{label:'Hallazgo principal de radiografía',options:[['unknown','Sin resultado interpretado'],['normal','Sin alteraciones relevantes descritas'],['congestion','Signos de congestión'],['effusion','Derrame pleural'],['pulmonary','Alteración pulmonar alternativa'],['other','Otros hallazgos']]}
};
export function setStudyResult(ctx,id,raw){
 const lab=LAB_FIELDS.find(x=>x[0]===id),report=REPORT_FIELDS[id];
 if(!lab&&!report)return ctx;
 let value;
 if(lab){
  if(typeof raw!=='string'&&typeof raw!=='number')return ctx;
  const s=String(raw).trim().replace(',','.');
  if(!s)value=null;
  else if(!/^\d+(?:\.\d+)?$/.test(s)||!Number.isFinite(Number(s))||Number(s)<0||(id==='tsat'&&Number(s)>100)||(id==='hba1c'&&Number(s)>100))return ctx;
  else value=Number(s);
 }else{
  if(!report.options.some(x=>x[0]===raw))return ctx;
  value=raw==='unknown'?null:raw;
 }
 const results={...ctx.results};
 if(value===null)delete results[id];else results[id]={value,unit:lab?.[2]??null,recordedAt:new Date().toISOString(),source:'Introducción manual; fecha de muestra no registrada'};
 return {...ctx,results,updatedAt:new Date().toISOString()};
}
export function investigationPlan(ctx){
 const f=ctx?.findings??{},step=diagnosticNext(ctx);
 const symptomatic=GROUPS.filter(g=>['symptoms','signs'].includes(g.id)).some(g=>g.fields.some(([id])=>f[id]==='yes'));
 const known=f.knownHF==='yes';
 const mode=step.kind==='urgent'?'urgent':step.kind==='safety'||step.kind==='incomplete'?'incomplete':known?'known':symptomatic?'suspected':'review';
 const basal=mode==='suspected'?'Estudio inicial de sospecha':mode==='known'?'Revisar estudios previos y necesidad de actualización':mode==='urgent'?'No demorar la valoración urgente por este registro':'Consultar estudio de referencia; valoración clínica pendiente o sin indicación individual establecida';
 const targeted=[];
 if(f.cardiac==='yes')targeted.push({id:'cardiac',text:'Precisar la cardiopatía previa y revisar informes: valorar estudios de isquemia o valvulopatía según etiología concreta.'});
 if(f.af==='yes'||ctx?.results?.ecg?.value==='af')targeted.push({id:'rhythm',text:'Documentar ritmo y frecuencia; valorar monitorización adicional si existe sospecha de arritmia intermitente.'});
 if(f.toxins==='yes')targeted.push({id:'toxins',text:'Identificar exposición, dosis acumulada y cronología; valorar estudio dirigido y coordinación especializada.'});
 if(f.family==='yes')targeted.push({id:'family',text:'Revisar historia familiar y fenotipo; valorar estudio especializado de miocardiopatía.'});
 if(f.ckd==='yes'||f.dm==='yes'||f.htn==='yes')targeted.push({id:'renal',text:'Revisar FG y albuminuria por antecedentes cardiorrenales.'});
 if(f.obesity==='yes')targeted.push({id:'obesity',text:'Tener presente la obesidad al interpretar péptidos natriuréticos y causas de disnea.'});
 if(ctx?.results?.ecg?.value==='ischemia')targeted.push({id:'ischemia',text:'Aclarar si los cambios son nuevos y si hay síntomas agudos; valorar urgencia antes de estudio etiológico electivo.'});
 if(ctx?.results?.rx?.value==='pulmonary')targeted.push({id:'pulmonary',text:'Revisar el hallazgo pulmonar y dirigir las pruebas a la causa alternativa sospechada.'});
 return {mode,basal,targeted,source:{doi:SOURCE.doi,sections:'5.1.2 y 5.3; tabla de recomendaciones 3',version:'0.1',type:'Adaptación educativa, pendiente de validación'}};
}

/* Composición cualitativa de dimensiones independientes.
 * No estima probabilidad, no confirma IC, no clasifica FEVI ni prescribe.
 * La prioridad asistencial preexistente se evalúa por separado.
 */
export const CLINICAL_DIMENSIONS={
 nocturnal:['orthopnea','pnd'],
 nonspecific:['dyspnea','fatigue'],
 fluidSymptoms:['swelling','weight'],
 pulmonary:['crackles'],
 systemic:['jvp','edema','ascites'],
 cardiacSigns:['s3'],
 predisposition:['htn','dm','ckd','obesity'],
 substrate:['cardiac','af','toxins','family'],
 history:['knownHF'],
 deterioration:['worsening'],
 urgent:['respiratory','perfusion','chestPain','arrhythmia'],
 assessment:['vitalsReviewed']
};
export function interpretSuspicion(ctx){
 const f=ctx?.findings??{},val=id=>['yes','no'].includes(f[id])?f[id]:'unknown';
 const labels=Object.fromEntries(GROUPS.flatMap(g=>g.fields));
 labels.vitalsReviewed='Constantes y estabilidad valoradas';
 const profile=Object.fromEntries(Object.entries(CLINICAL_DIMENSIONS).map(([key,ids])=>[key,ids.filter(id=>val(id)==='yes')]));
 const has=key=>profile[key].length>0;
 const named=ids=>ids.map(id=>labels[id]);
 const complete=(...ids)=>ids.every(id=>isGroupReviewed(ctx, id));
 const known=has('history'), symptoms=has('nocturnal')||has('nonspecific')||has('fluidSymptoms');
 const signs=has('pulmonary')||has('systemic')||has('cardiacSigns');
 const suggestive=has('nocturnal')||has('fluidSymptoms')||signs;
 const risks=has('predisposition')||has('substrate');
 const pending=GROUPS.filter(g=>!isGroupReviewed(ctx,g.id)).map(g=>g.label);
 if(val('vitalsReviewed')!=='yes')pending.push('Constantes y estabilidad');
 const safetyRule=evaluateSuspicion(ctx);
 const safety=safetyRule.id==='IC-SUS-01'?{level:'critical',title:'Alarma clínica',text:safetyRule.action}:safetyRule.id==='IC-SUS-02'?{level:'urgent',title:'Empeoramiento reciente',text:safetyRule.action}:safetyRule.id==='IC-SUS-03'?{level:'pending',title:'Estabilidad pendiente de valorar',text:'Completar alarmas y constantes antes de decidir el ámbito asistencial.'}:{level:'review',title:'Seguridad revisada',text:'Sin alarmas marcadas; estabilidad valorada según el registro. Reevaluar si cambia la situación.'};
 let id,title,interpretation;
 if(known){
  id='IC-PROF-01';title=has('deterioration')?'IC conocida con posible descompensación':symptoms||signs?'IC conocida con manifestaciones clínicas':complete('symptoms','signs')?'IC conocida sin manifestaciones registradas':'IC conocida; situación clínica no determinada';
  interpretation=has('deterioration')?'El empeoramiento requiere valoración de la causa y la situación clínica.':symptoms||signs?'Valorar congestión, evolución respecto al estado basal y otras causas.':'El antecedente registrado se mantiene; la ausencia de hallazgos actuales no invalida el diagnóstico previo.';
 }else if(suggestive){
  id='IC-PROF-02';title='Sospecha clínica de insuficiencia cardiaca';interpretation='Los hallazgos son compatibles con IC, pero no específicos. Precisa confirmación objetiva y diagnóstico diferencial.';
 }else if(symptoms){
  id='IC-PROF-03';title='Síntomas inespecíficos: considerar IC';interpretation='La clínica puede corresponder a IC u otras causas. Integrar antecedentes y exploración para decidir el estudio.';
 }else if(has('deterioration')||has('urgent')){
  id='IC-PROF-04';title='Etiología clínica indeterminada';interpretation='Los datos de alarma o empeoramiento requieren valoración; no determinan por sí mismos que la causa sea IC.';
 }else if(!complete('symptoms','signs')){
  id='IC-PROF-05';title='Evaluación clínica incompleta';interpretation=risks?'Hay antecedentes predisponentes; faltan síntomas o exploración para valorar manifestaciones de IC.':'No se dispone de información suficiente para orientar la sospecha.';
 }else if(val('knownHF')==='unknown'){
  id='IC-PROF-06';title='Antecedente de IC no aclarado';interpretation='Sin síntomas o signos positivos registrados; aclarar diagnóstico previo antes de interpretar el perfil.';
 }else if(risks){
  id='IC-PROF-07';title='Factores predisponentes sin manifestaciones registradas';interpretation='Los factores de riesgo o la cardiopatía previa no establecen por sí solos IC ni su estadio.';
 }else if(!complete('risk')){
  id='IC-PROF-08';title='Sin manifestaciones registradas; antecedentes incompletos';interpretation='Completar antecedentes para contextualizar el riesgo. La IC no queda excluida.';
 }else{
  id='IC-PROF-09';title='Sin hallazgos registrados compatibles';interpretation='No se identifican manifestaciones en los ítems revisados. Esto no excluye IC si persiste sospecha clínica.';
 }
 const reasoning=[];
 const line=(keys,label)=>{const ids=keys.flatMap(k=>profile[k]);if(ids.length)reasoning.push({label,findings:named(ids)});};
 line(['nocturnal'],'Síntomas orientadores de IC');
 line(['nonspecific'],'Síntomas de baja especificidad');
 line(['fluidSymptoms'],'Síntomas compatibles con retención de líquido');
 line(['pulmonary'],'Posible congestión pulmonar');
 line(['systemic'],'Posible congestión sistémica');
 line(['cardiacSigns'],'Hallazgo de exploración cardiaca');
 line(['predisposition'],'Factores predisponentes');
 line(['substrate'],'Antecedentes cardiacos o etiológicos');
 line(['history'],'Diagnóstico previo referido');
 line(['deterioration','urgent'],'Empeoramiento o alarmas registradas');
 const differential=[];
 if(has('nocturnal')||has('nonspecific')||has('pulmonary'))differential.push('Causas respiratorias de disnea; anemia si hay disnea o fatiga.');
 if(has('fluidSymptoms')||has('systemic'))differential.push('Causas venosas, renales, hepáticas o farmacológicas de retención de líquido.');
 if(has('cardiacSigns')||has('substrate'))differential.push('Precisar cardiopatía estructural, valvulopatía o arritmia según antecedentes y exploración.');
 if(has('urgent'))differential.push('Descartar causas tiempo-dependientes según el signo de alarma.');
 const navigation=diagnosticAction(ctx);
 const urgent=safety.level==='critical'||safety.level==='urgent';
 const nextText=urgent?'Priorizar valoración urgente; no demorarla por el estudio programado.':known?'Revisar estudios disponibles y evolución de la IC.':symptoms||signs?'Completar estudio objetivo y considerar causas alternativas.':risks?'Revisar riesgo y cardiopatía previa; individualizar necesidad de pruebas.':'Completar datos si faltan y valorar pruebas si persiste sospecha.';
 return {id,title,interpretation,profile,reasoning,differential,pending,safety,next:{...navigation,text:nextText},source:{...SOURCE,version:'0.3',sections:'5.1; tabla 7; 7.2; definición universal 2026 (ehag500)'},ruleType:'Composición cualitativa local, no es escala validada ni diagnóstico confirmado'};
}

/* Solicitud orientativa y prioridades de entrada: no constituyen una orden ni umbrales terapéuticos. */
export function labPlan(ctx){
 const f=ctx?.findings??{},r=interpretSuspicion(ctx),p=investigationPlan(ctx);
 const symptomatic=['nocturnal','nonspecific','fluidSymptoms','pulmonary','systemic','cardiacSigns'].some(k=>r.profile[k].length);
 const known=f.knownHF==='yes',renal=['ckd','dm','htn'].some(k=>f[k]==='yes');
 const congestion=['nocturnal','fluidSymptoms','pulmonary','systemic'].some(k=>r.profile[k].length);
 const urgent=p.mode==='urgent',relevant=known||symptomatic;
 const basal=[
  'Hemograma completo','Creatinina, FG estimado y urea','Sodio y potasio',
  'Cociente albúmina/creatinina urinario','Perfil hepático','Función tiroidea (TSH; ampliar según resultado)',
  'Ferritina y saturación de transferrina','HbA1c y perfil lipídico'
 ];
 const emphasis=[];
 if(renal)emphasis.push('Función renal y albuminuria: antecedentes cardiorrenales registrados.');
 if(congestion)emphasis.push('Función renal y electrolitos: contextualizar la posible congestión.');
 if(r.profile.nonspecific.length)emphasis.push('Hemograma y estudio férrico: valorar anemia y ferropenia en el contexto de disnea o fatiga.');
 if(f.af==='yes')emphasis.push('Función tiroidea y electrolitos: revisar en el contexto de arritmia.');
 if(f.dm==='yes')emphasis.push('HbA1c: revisar control glucémico y fecha del último resultado.');
 const title=urgent?'Analítica: valoración urgente':known?'Revisar analítica previa de IC':symptomatic?'Analítica de estudio inicial de IC':'Analítica de referencia';
 const note=urgent?'No retrasar la valoración urgente. Este listado de IC crónica no constituye un protocolo de urgencias.':!relevant?'No hay indicación individual de estudio completo de IC establecida. Usar el listado solo como referencia; valorar pruebas según riesgo y presentación.':p.mode==='incomplete'?'Estudio de referencia según hallazgos; completar la valoración pendiente antes de decidir el ámbito asistencial.':known?'Reutilizar resultados vigentes y actualizar solo los necesarios según evolución y tratamiento.':'Revisar resultados recientes antes de solicitar el estudio basal.';
 // Priority is an interface choice, not a medical cutoff or a required test.
 const priority=urgent?['egfr','potassium','sodium']:congestion||known?['egfr','potassium','sodium']:symptomatic?['egfr','potassium','hemoglobin']:renal?['egfr','potassium','uacr']:['egfr','potassium','sodium'];
 return {title,note,basal,emphasis,priority,canCopy:!urgent&&relevant,source:{doi:SOURCE.doi,sections:'5.1.2 y tabla de recomendaciones 3',version:'0.1'}};
}

/* Educational NP interpretation; numerical facts from ESC 2026 text and Fig.11 legend.
 * No diagnosis, adjusted cutoffs by comorbidity, or treatment authorization. */
export function setPeptide(ctx,key,raw){
 const old=ctx.peptides||{},next={...old};
 if(['kind','context','obesity','af','renal','arni'].includes(key)){
  const allowed=key==='kind'?['nt','bnp']:key==='context'?['unknown','outpatient','acute']:['unknown','yes','no'];
  if(!allowed.includes(raw))return ctx;
  next[key]=raw;
 }else if(['age','nt','bnp'].includes(key)){
  const s=String(raw).trim().replace(',','.');
  if(!s)delete next[key];
  else if(!/^\d+(?:\.\d+)?$/.test(s)||!Number.isFinite(Number(s))||(key==='age'&&(!Number.isInteger(Number(s))||Number(s)<18||Number(s)>120)))return ctx;
  else next[key]=Number(s);
 }else return ctx;
 return {...ctx,peptides:next,updatedAt:new Date().toISOString()};
}
export function peptideFactors(ctx){
 const p=ctx?.peptides||{},f=ctx?.findings||{},egfr=ctx?.results?.egfr?.value;
 const value=(key,derived)=>p[key]??derived??'unknown';
 return {
  obesity:value('obesity',f.obesity),
  af:value('af',ctx?.results?.ecg?.value==='af'?'yes':f.af==='yes'?'unknown':f.af),
  renal:value('renal',f.ckd==='yes'||(Number.isFinite(egfr)&&egfr<60)?'yes':undefined),
  arni:value('arni','unknown')
 };
}
export function interpretPeptide(ctx){
 const p=ctx?.peptides||{},kind=p.kind||'nt',context=p.context||'unknown',v=p[kind],age=p.age;
 const factors=peptideFactors(ctx),s=interpretSuspicion(ctx),known=ctx?.findings?.knownHF==='yes';
 const urgent=['critical','urgent'].includes(s.safety.level)||context==='acute';
 const low=context==='acute'?(kind==='nt'?300:100):context==='outpatient'?(kind==='nt'?125:35):null;
 // In 2026 prose outpatient 50–75 and >75; the cited cohort uses 50–74 and >=75.
 // At exactly 75 years, preserve the interval 250–499 as indeterminate, no false exclusion.
 const high=kind==='nt'&&Number.isFinite(age)?context==='acute'?(age<50?450:age<75?900:1800):context==='outpatient'?(age<50?125:age<75?250:500):null:null;
 const notes=[];
 if(factors.obesity==='yes')notes.push('Obesidad: puede reducir la concentración; un resultado bajo no excluye IC si persiste sospecha.');
 if(factors.af==='yes')notes.push('Fibrilación auricular: puede elevar el resultado sin que exista IC.');
 if(ctx?.findings?.af==='yes'&&factors.af==='unknown')notes.push('Arritmia previa registrada: precisar si existe fibrilación auricular.');
 if(factors.renal==='yes')notes.push('Disfunción renal: puede elevar los péptidos; no invalida el resultado.');
 if(factors.arni==='yes'&&kind==='bnp')notes.push('Sacubitrilo/valsartán: puede modificar BNP; NT-proBNP resulta más apropiado para seguimiento.');
 if(Object.values(factors).includes('unknown'))notes.push('Hay factores modificadores sin evaluar.');
 if(known)notes.push('IC previamente conocida: el péptido no confirma ni revoca el diagnóstico previo.');
 const source={doi:SOURCE.doi,sections:'Diagnóstico de IC crónica, péptidos natriuréticos; figura 11 (IC descompensada)',version:'0.1'};
 let id='NP-00',title='Datos pendientes',text='Introduce el contexto asistencial y el resultado.';
 if(low!==null&&Number.isFinite(v)){
  if(v<low){id='NP-01';title='Por debajo del umbral de exclusión';text='Disminuye la sospecha, pero no descarta IC de forma aislada. Si la clínica persiste o hay factores que reducen el péptido, valorar ecocardiografía.';}
  else if(kind==='nt'&&context==='outpatient'&&v>2000){id='NP-04';title='NT-proBNP muy elevado';text='Apoya la sospecha y justifica valoración especializada preferente si corresponde al cuadro clínico.';}
  else if(kind==='nt'&&context==='acute'&&v>5000){id='NP-05';title='NT-proBNP muy elevado en contexto agudo';text='Marcador de riesgo elevado. Priorizar valoración hospitalaria urgente; no demorar por pruebas programadas.';}
  else if(high!==null&&(context==='acute'?v>high:v>=high)){id='NP-03';title='Resultado que apoya la sospecha de IC';text='Supera el umbral orientativo por edad. Requiere correlación clínica y confirmación objetiva.';}
  else {id='NP-02';title='Resultado no excluyente';text='No permite descartar IC ni confirmarla. Integrar clínica, factores modificadores y ecocardiografía cuando proceda.';}
  if(kind==='nt'&&context==='outpatient'&&age===75&&v>=250&&v<500){notes.push('A los 75 años existe discrepancia entre la redacción de la ESC 2026 y el intervalo del estudio citado. Se mantiene una zona no concluyente.');}
  if(kind==='nt'&&!Number.isFinite(age)&&v>=low)notes.push('Falta edad para aplicar el umbral orientativo ajustado.');
 }
 if(known&&id==='NP-01'){title='Valor bajo en IC conocida';text='No excluye ni revoca la IC previa. Interpretar según situación basal, tratamiento y evolución.';}
 const next=urgent?{label:'IC descompensada (en desarrollo)',section:'descompensada',text:'Priorizar valoración urgente; el resultado no modifica esa prioridad.'}:{label:'Continuar a ecocardiografía',section:'ecocardiografia',text:id==='NP-01'?'Valorar ecocardiografía si persiste sospecha o existe indicación clínica.':'Integrar el resultado con la evaluación objetiva. Continuar al módulo de ecocardiografía.'};
 return {id,title,text,kind,context,age,value:v,low,high,notes,factors,urgent,next,source};
}

/* Echo values are entered from a report, never inferred from missing data. */
export const ECHO_FINDINGS=[
 ['diastolic','Disfunción diastólica'],['lvh','Hipertrofia ventricular izquierda'],
 ['la','Dilatación auricular izquierda'],['filling','Presiones de llenado elevadas'],
 ['valve','Valvulopatía significativa'],['rv','Disfunción ventricular derecha'],
 ['regional','Alteraciones segmentarias de la contractilidad'],['ph','Hipertensión pulmonar']
];
export const ECHO_NUMERIC=[
 ['ef','FEVI actual','%'],['priorEf','FEVI previa','%'],
 ['ee','E/e′ medio',''],['lavi','Volumen auricular izquierdo indexado','mL/m²'],
 ['lvmi','Masa ventricular izquierda indexada','g/m²'],['tapse','TAPSE','mm'],
 ['trv','Velocidad máxima de regurgitación tricuspídea','m/s']
];
export function setEcho(ctx,key,raw){
 const next={...(ctx.echo||{})};
 if(ECHO_FINDINGS.some(x=>x[0]===key)||key==='priorReduced'){
  if(!['yes','no','unknown'].includes(raw))return ctx;
  next[key]=raw;
 }else if(ECHO_NUMERIC.some(x=>x[0]===key)){
  const s=String(raw).trim().replace(',','.');
  if(!s)delete next[key];
  else if(!/^\d+(?:\.\d+)?$/.test(s)||!Number.isFinite(Number(s))||Number(s)<=0||(['ef','priorEf'].includes(key)&&Number(s)>100))return ctx;
  else next[key]=Number(s);
 }else return ctx;
 return {...ctx,echo:next,updatedAt:new Date().toISOString()};
}
export function interpretEcho(ctx){
 const e=ctx.echo||{},s=interpretSuspicion(ctx),np=interpretPeptide(ctx),f=ctx.findings||{};
 const ef=Number.isFinite(e.ef)&&e.ef>0&&e.ef<=100?e.ef:null;
 const prior=Number.isFinite(e.priorEf)&&e.priorEf>0&&e.priorEf<=100?e.priorEf:null;
 const known=f.knownHF==='yes';
 const clinical=['nocturnal','nonspecific','fluidSymptoms','pulmonary','systemic','cardiacSigns'].some(k=>s.profile[k].length>0);
 const positive=ECHO_FINDINGS.filter(([id])=>e[id]==='yes');
 const unknown=ECHO_FINDINGS.filter(([id])=>!['yes','no'].includes(e[id]));
 const priorReduced=prior!==null&&prior<50||e.priorReduced==='yes';
 const discordant=e.priorReduced==='no'&&prior!==null&&prior<50;
 const filling=e.filling==='yes';
 const objective=ef!==null&&ef<50||positive.length>0;
 const npRecorded=np.id!=='NP-00';
 let title=ef===null?'FEVI pendiente':ef<50?'FEVI reducida':'FEVI preservada';
 let phenotype=ef===null?'Pendiente de FEVI':ef<50?'FEVI <50%':'FEVI ≥50%';
 const trajectory=prior!==null?'FEVI previa '+prior+'%; actual '+(ef===null?'pendiente':ef+'%; variación '+(ef-prior>0?'+':'')+Math.round((ef-prior)*100)/100+' puntos porcentuales.'):'FEVI previa no registrada.';
 const notes=[];
 if(discordant)notes.push('Datos discordantes sobre FEVI previa: revisar el informe y la historia.');
 if(ef!==null&&ef>=50&&priorReduced){title='FEVI actualmente preservada con antecedente de reducción';phenotype='Valorar IC con FEVI mejorada si existía IC previa; no etiquetar como IC-FEp de novo.';}
 else if(ef!==null&&ef>=50&&e.priorReduced!=='no'&&prior===null)notes.push('No consta si hubo FEVI previamente reducida. Aclarar antes de asignar fenotipo de IC-FEp.');
 else if(ef!==null&&ef>=50&&prior!==null&&prior>=50&&e.priorReduced!=='no')notes.push('Una medición previa preservada no descarta otras FEVI reducidas en la historia.');
 if(known&&ef!==null&&prior!==null&&ef>prior&&prior<50&&ef<50)notes.push('FEVI en ascenso, todavía inferior al 50%. Valorar trayectoria, sin asignar automáticamente IC con FEVI mejorada.');
 if(positive.length)notes.push('Los hallazgos ecocardiográficos deben relacionarse con los síntomas y la etiología; no todos demuestran presiones de llenado elevadas.');
 if(unknown.length)notes.push('Hay '+unknown.length+' hallazgos no evaluados o no descritos; no equivalen a normales.');
 if(ECHO_NUMERIC.slice(2).some(([id])=>Number.isFinite(e[id])))notes.push('Parámetros cuantitativos registrados: interpretar con el informe completo; sin umbrales automáticos en esta versión.');
 if(npRecorded&&np.id==='NP-01')notes.push('Péptido por debajo del umbral orientativo: no excluye IC aisladamente.');
 const npLabel=npRecorded?(np.kind==='nt'?'NT-proBNP':'BNP')+' '+np.value+' pg/mL · '+np.title:'Péptidos pendientes de interpretación.';
 let integratedTitle,integrated;
 if(known){integratedTitle='IC previamente diagnosticada';integrated='Conservar el diagnóstico referido y revisar fenotipo, evolución y hallazgos actuales.';}
 else if(clinical&&objective){integratedTitle='Sospecha de IC con hallazgos objetivos';integrated=ef!==null&&ef>=50&&!filling?'Con FEVI preservada, precisar evidencia de disfunción o presiones de llenado elevadas y atribución de los síntomas.':'Valorar si las alteraciones cardiacas explican el cuadro clínico; los datos no confirman automáticamente IC.';}
 else if(objective){integratedTitle='Alteración cardiaca registrada';integrated='Aclarar clínica actual y previa y atribución de los hallazgos; no asignar estadio ni diagnosticar IC por ecocardiografía aislada.';}
 else if(clinical){integratedTitle='Sospecha clínica pendiente de confirmación';integrated='La FEVI preservada o los datos ecocardiográficos ausentes no excluyen IC. Completar estudio si persiste sospecha.';}
 else {integratedTitle='Información insuficiente para concluir IC';integrated='Revisar antecedentes, síntomas y pruebas disponibles; no asumir normalidad ni excluir IC.';}
 const urgent=np.urgent;
 return {ef,prior,title,phenotype,trajectory,positive,unknown,notes,integratedTitle,integrated,npLabel,clinicalTitle:s.title,safety:s.safety,urgent,next:urgent?'descompensada':'clasificacion',source:{doi:SOURCE.doi,sections:'Clasificación por FEVI y diagnóstico de IC; adaptación educativa',version:'0.1'}};
}

/* Staging: Second Universal Definition 2026, Table 1; ESC 2026 §3.3.
 * Clinician attribution is required; the module does not diagnose HF or advanced HF independently.
 */
export const STAGE_QUESTIONS={
 manifestations:'¿Síntomas o signos actuales o previos atribuibles a IC?',
 objective:'¿Existe alteración cardiaca estructural, funcional o de biomarcadores interpretada como evidencia de enfermedad cardiaca?',
 risk:'¿Existen factores predisponentes de IC tras revisar los antecedentes?',
 advancedConfirmed:'¿IC avanzada establecida tras evaluación clínica especializada?',
 severe:'¿Síntomas graves persistentes en reposo o con mínimo esfuerzo?',
 admissions:'¿Ingresos recurrentes por IC pese al tratamiento?',
 refractory:'¿IC refractaria o intolerancia relevante al tratamiento optimizado?'
};
export function setStageAssessment(ctx,key,value){
 if(!Object.hasOwn(STAGE_QUESTIONS,key)||!['yes','no','unknown'].includes(value))return ctx;
 return {...ctx,stageAssessment:{...ctx.stageAssessment,[key]:value},updatedAt:new Date().toISOString()};
}
export function interpretStage(ctx){
 const a=ctx.stageAssessment||{},f=ctx.findings||{},e=ctx.echo||{},r=interpretEcho(ctx);
 const val=k=>['yes','no'].includes(a[k])?a[k]:'unknown';
 const known=f.knownHF==='yes';
 const risks=GROUPS.find(g=>g.id==='risk').fields.filter(([id])=>id!=='knownHF'&&f[id]==='yes');
 const findings=ECHO_FINDINGS.filter(([id])=>id!=='ph'&&e[id]==='yes');
 const objectiveEvidence=(r.ef!==null&&r.ef<50)||findings.length>0;
 const manifests=known?'yes':val('manifestations');
 const objective=objectiveEvidence?'yes':val('objective');
 const risk=risks.length?'yes':val('risk');
 const advanced=val('advancedConfirmed'),flags=['severe','admissions','refractory'].filter(k=>val(k)==='yes');
 const contradictions=[],reviewKeys=[];
 if(known&&val('manifestations')==='no'){reviewKeys.push('manifestations');contradictions.push('El diagnóstico previo de IC contradice la ausencia de manifestaciones actuales y previas atribuibles.');}
 if(objectiveEvidence&&val('objective')==='no'){reviewKeys.push('objective');contradictions.push('El informe ecocardiográfico registra alteraciones; revisar la respuesta de ausencia de alteración.');}
 if(risks.length&&val('risk')==='no'){reviewKeys.push('risk');contradictions.push('Hay factores predisponentes ya registrados; revisar la respuesta.');}
 if(advanced==='yes'&&manifests!=='yes'){reviewKeys.push('advancedConfirmed');contradictions.push('IC avanzada referida sin manifestaciones actuales o previas confirmadas.');}
 const previousReduced=r.prior!==null&&r.prior<50||e.priorReduced==='yes';
 if(!known&&previousReduced&&objective==='no'){reviewKeys.push('objective','manifestations');contradictions.push('FEVI previamente reducida: revisar historia de IC y persistencia de alteración cardiaca antes de clasificar como A o 0.');}
 const questions=[];
 if(!known)questions.push('manifestations');
 if(!known&&manifests!=='unknown'&&!objectiveEvidence)questions.push('objective');
 if(!known&&manifests==='no'&&objective==='no'&&!risks.length)questions.push('risk');
 const established=known||(manifests==='yes'&&objective==='yes');
 if(established)questions.push('advancedConfirmed');
 for(const key of reviewKeys)if(!questions.includes(key))questions.push(key);
 const advancedQuestions=established&&advanced!=='yes'?['severe','admissions','refractory']:[];
 let stage=null,title='Estadio indeterminado',text='Completar los datos necesarios; ausencia de registro no equivale a ausencia de enfermedad.';
 if(contradictions.length){text='Existen datos discordantes. Revisar la historia y las respuestas antes de asignar el estadio.';}
 else if(established){
  if(advanced==='yes'){stage='D';title='Estadio D · IC avanzada';text='IC avanzada según valoración especializada registrada. Mantener evaluación y planificación especializada.';}
  else{stage='C';title=advanced==='no'&&!flags.length?'Estadio C · IC clínica':'Estadio C · IC clínica (al menos)';text=flags.length?'Hay señales de posible IC avanzada. Valorar con el equipo especializado; los datos no bastan para asignar D.':advanced==='unknown'?'IC clínica actual o previa; falta valorar criterios de IC avanzada.':'IC clínica actual o previa, sin IC avanzada establecida según el registro.';}
 }else if(manifests==='no'&&objective==='yes'){stage='B';title='Estadio B · Pre-IC';text='Alteración cardiaca objetiva sin manifestaciones actuales ni previas atribuibles a IC.';}
 else if(manifests==='no'&&objective==='no'&&risk==='yes'){stage='A';title='Estadio A · Riesgo de IC';text='Factores predisponentes sin manifestaciones actuales o previas de IC ni alteración cardiaca registrada tras evaluación.';}
 else if(manifests==='no'&&objective==='no'&&risk==='no'){stage='0';title='Estadio 0 · Sin riesgo identificado';text='Sin factores predisponentes ni alteraciones cardiacas o manifestaciones según evaluación registrada. Categoría del consenso universal, fuera de A–D de la ESC.';}
 else if(manifests==='yes'){text='Manifestaciones atribuidas a IC, pero falta corroborar la alteración cardiaca o documentar el diagnóstico previo.';}
 const reason=[];
 if(known)reason.push('Diagnóstico previo de IC registrado.');
 if(risks.length)reason.push('Factores registrados: '+risks.map(x=>x[1]).join(' · ')+'.');
 if(r.ef!==null)reason.push('FEVI actual: '+r.ef+' %.');
 if(r.prior!==null)reason.push('FEVI previa: '+r.prior+' %.');
 if(findings.length)reason.push('Hallazgos ecocardiográficos: '+findings.map(x=>x[1]).join(' · ')+'.');
 if(e.ph==='yes')reason.push('Hipertensión pulmonar registrada: no demuestra por sí sola enfermedad cardiaca causal.');
 reason.push('Péptidos: '+r.npLabel+' No asignan el estadio por sí solos.');
 for(const [k,v] of [['manifestations',manifests],['objective',objective],['risk',risk],['advancedConfirmed',advanced]])if(v!=='unknown')reason.push(STAGE_QUESTIONS[k]+' '+(v==='yes'?'Sí.':'No.'));
 if(flags.length)reason.push('Señales de posible IC avanzada: '+flags.map(k=>STAGE_QUESTIONS[k]).join(' · '));
 return {stage,title,text,questions,advancedQuestions,reason,contradictions,flags,urgent:r.urgent,safety:r.safety,source:{doi:'10.1093/eurheartj/ehag500',sections:'Tabla 1; ESC 2026 sección 3.3',version:'0.1'}};
}

/* Educational phenotyping: distinguish current EF, clinical HF and longitudinal trajectory. */
export function setPhenotypeAssessment(ctx,key,value){
 if(!['priorClinical','diastolicEvidence'].includes(key)||!['yes','no','unknown'].includes(value))return ctx;
 return {...ctx,phenotypeAssessment:{...ctx.phenotypeAssessment,[key]:value},updatedAt:new Date().toISOString()};
}
export function interpretPhenotype(ctx){
 const r=interpretEcho(ctx),st=interpretStage(ctx),e=ctx.echo||{},a=ctx.phenotypeAssessment||{};
 const ef=r.ef,prior=r.prior,delta=ef!==null&&prior!==null?Math.round((ef-prior)*1000000)/1000000:null;
 const priorReduced=prior!==null&&prior<50||e.priorReduced==='yes';
 const historicalNo=e.priorReduced==='no'&&!priorReduced;
 const conflict=e.priorReduced==='no'&&priorReduced||st.contradictions.length>0;
 const clinicalHF=['C','D'].includes(st.stage)&&!conflict;
 const current=ef===null?'pending':ef<50?'reduced':'preserved';
 const titleCurrent=ef===null?'FEVI pendiente':ef<50?'FEVI reducida':'FEVI preservada';
 const priorClinical=a.priorClinical||'unknown',diastolic=a.diastolicEvidence||'unknown';
 // Universal 2026 trajectory section describes a >=10-point gain to >40%;
 // the general phenotype definition is not a rigid numeric threshold.
 const trajectoryPattern=delta!==null&&prior<50&&delta>=10&&ef>40;
 const improved=clinicalHF&&priorClinical==='yes'&&trajectoryPattern&&!conflict;
 const notes=[];
 if(delta!==null)notes.push('FEVI previa '+prior+'%; actual '+ef+'%; variación '+(delta>0?'+':'')+delta+' puntos porcentuales.');
 if(priorReduced)notes.push('Antecedente de FEVI inferior al 50%; no corresponde etiquetar IC-FEp de novo.');
 if(trajectoryPattern)notes.push('La variación cumple el patrón cuantitativo descrito en la sección de trayectorias del consenso universal 2026. Requiere contexto de IC clínica previa con FEVI reducida.');
 if(priorClinical==='yes'&&!priorReduced)notes.push('Antecedente de IC con FEVI reducida referido; completar las mediciones previas.');
 if(improved)notes.push('La mejoría de FEVI no equivale a resolución de la IC ni justifica retirar tratamiento por sí sola.');
 if(ef!==null&&ef>=50&&!priorReduced&&!historicalNo)notes.push('No consta una revisión suficiente de FEVI histórica; no asignar IC-FEp de novo.');
 if(ef!==null&&ef>=50&&diastolic!=='yes')notes.push('Precisar evidencia objetiva de disfunción diastólica o presiones de llenado elevadas y revisar los péptidos. No se diagnostica IC-FEp por FEVI aislada.');
 if(st.contradictions.length)notes.push(...st.contradictions);
 if(e.priorReduced==='no'&&priorReduced)notes.push('Discordancia entre FEVI histórica y respuesta sobre reducción previa.');
 let title=titleCurrent,short=titleCurrent,text='Clasificación pendiente de FEVI actual.',code='pending';
 if(conflict){title='Datos discordantes';short='Revisar datos';text='Revisar antecedentes y mediciones antes de asignar el fenotipo.';}
 else if(ef!==null&&!clinicalHF){
  code='ef-only';text=['0','A','B'].includes(st.stage)?'No consta IC clínica en el estadio registrado. Describir la función ventricular sin etiquetar un fenotipo de IC.':'La FEVI orienta la función ventricular. Completar la evaluación clínica antes de asignar fenotipo de IC.';
 }else if(clinicalHF&&ef!==null){
  if(current==='reduced'){code='href';title='IC con FEVI reducida';short='IC-FEr';text='IC clínica registrada y FEVI inferior al 50%. Conservar también la trayectoria de FEVI.';}
  else if(priorReduced||priorClinical==='yes'){code='prior-reduced';title='IC con FEVI actualmente preservada';short='FEVI previa reducida';text='Antecedente de reducción: no clasificar como IC-FEp de novo. Revisar la trayectoria.';}
  else if(historicalNo&&diastolic==='yes'){code='hfpef';title='IC con FEVI preservada';short='IC-FEp';text='IC clínica registrada, FEVI igual o superior al 50%, sin reducción previa referida y evidencia diastólica confirmada por el médico.';}
  else{code='preserved-pending';title='FEVI preservada; fenotipo pendiente';short='Fenotipo pendiente';text='Aclarar FEVI histórica y evidencia objetiva compatible con IC-FEp antes de asignar el fenotipo.';}
 }
 const trajectory=improved?'IC con FEVI mejorada':trajectoryPattern?'Mejoría cuantitativa; atribución pendiente':delta===null?'Evolución pendiente':delta>0?'FEVI en ascenso':delta<0?'FEVI en descenso':'FEVI sin cambio registrado';
 return {ef,prior,delta,current,clinicalHF,priorReduced,historicalNo,conflict,code,title,short,text,trajectory,trajectoryPattern,improved,notes,urgent:r.urgent,safety:r.safety,stage:st.stage,source:{doi:SOURCE.doi,sections:'5.2.1–5.2.2; consenso universal 2026, trayectorias',version:'0.1'}};
}

/* NYHA: clinician-selected limitation attributable to established clinical HF.
 * No inference from EF, signs alone, stage D or acute clinical status. */
export const NYHA_OPTIONS=[
 ['I','Sin limitación','La actividad física habitual no provoca síntomas de IC.'],
 ['II','Limitación leve','Sin síntomas en reposo; la actividad habitual provoca síntomas de IC.'],
 ['III','Limitación marcada','Sin síntomas en reposo; esfuerzos menores de lo habitual provocan síntomas de IC.'],
 ['IV','Síntomas en reposo','Los síntomas están presentes en reposo y cualquier esfuerzo aumenta el malestar.'],
 ['unknown','No valorable','Información insuficiente o no es posible atribuir la limitación a IC.']
];
export function setNyha(ctx,value){
 if(!NYHA_OPTIONS.some(x=>x[0]===value))return ctx;
 const stage=interpretStage(ctx);
 if(!['C','D'].includes(stage.stage))return ctx;
 return {...ctx,nyhaAssessment:{value,recordedAt:new Date().toISOString()},updatedAt:new Date().toISOString()};
}
export function interpretNyha(ctx){
 const st=interpretStage(ctx),eligible=['C','D'].includes(st.stage);
 const saved=ctx.nyhaAssessment?.value;
 const choice=eligible?NYHA_OPTIONS.find(x=>x[0]===saved):undefined;
 const functionalClass=choice&&choice[0]!=='unknown'?choice[0]:null;
 const title=functionalClass?'NYHA '+functionalClass:!eligible?'NYHA no asignable':choice?'NYHA no valorable':'NYHA pendiente';
 const text=functionalClass?choice[2]:!eligible?(['0','A','B'].includes(st.stage)?'La clase funcional de IC no corresponde a este estadio sin IC clínica.':'Establecer primero IC clínica; no atribuir síntomas a IC sin evaluación.') :choice?choice[2]:'Selecciona la limitación funcional atribuible a IC.';
 const warning=functionalClass==='IV'?'Si la disnea de reposo es nueva o intensa, o hay deterioro clínico, priorizar valoración urgente. La clase IV por sí sola no establece el estadio D.':'';
 return {eligible,functionalClass,selected:choice?.[0]??null,title,text,short:functionalClass?choice[1]:!eligible?'IC clínica no establecida':choice?'No valorable':'Pendiente de evaluar',warning,stage:st.stage,urgent:st.urgent,safety:st.safety,source:{doi:SOURCE.doi,sections:'Tabla 8; AHA Classes and Stages of Heart Failure',version:'0.1'}};
}

/* Situation assessment: educational workflow, not an ESC validated rule or a disposition protocol.
 * Shared worsening/perfusion data remain editable in clinical suspicion; no repeated mandatory entry.
 * Explicit clinical stability assessment is required to classify compensation. */
export const SITUATION_QUESTIONS={
 worsening:'¿Empeoramiento reciente relevante respecto a su situación basal?',
 congestion:'¿Congestión clínica actual atribuible a IC, tras revisar la exploración?',
 perfusion:'¿Signos de hipoperfusión actuales?',
 stable:'¿Constantes y restantes alarmas revisadas, con estabilidad clínica comprobada?'
};
export function setSituation(ctx,key,value){
 if(!Object.hasOwn(SITUATION_QUESTIONS,key)||!['yes','no','unknown'].includes(value))return ctx;
 if(key==='worsening'||key==='perfusion')return updateFinding(ctx,key,value);
 return {...ctx,situationAssessment:{...ctx.situationAssessment,[key]:value},updatedAt:new Date().toISOString()};
}
export function interpretSituation(ctx){
 const st=interpretStage(ctx),echo=interpretEcho(ctx),f=ctx.findings||{},a=ctx.situationAssessment||{};
 const tri=v=>v==='yes'||v==='no'?v:'unknown';
 const values={worsening:tri(f.worsening),congestion:tri(a.congestion),perfusion:tri(f.perfusion),stable:tri(a.stable)};
 const eligible=['C','D'].includes(st.stage);
 const congestionClues=GROUPS.flatMap(g=>g.fields).filter(([id])=>['orthopnea','pnd','swelling','weight','jvp','crackles','edema','ascites'].includes(id)&&f[id]==='yes');
 const findings=congestionClues.map(x=>x[1]);
 const ny=interpretNyha(ctx);
 const contradictions=[];
 if(values.stable==='yes'&&(values.perfusion==='yes'||['respiratory','chestPain','arrhythmia'].some(k=>f[k]==='yes')))contradictions.push('Estabilidad declarada con signos de alarma positivos; prevalece la alarma.');
 const critical=echo.safety.level==='critical'||values.perfusion==='yes'||values.stable==='no';
 const urgent=critical||echo.urgent||values.worsening==='yes';
 const safety=critical?{level:'critical',title:'Inestabilidad o alarma clínica',text:echo.safety.level==='critical'?echo.safety.text:'Priorizar valoración urgente inmediata; activar emergencias según gravedad.'}:urgent?{level:'urgent',title:'Valoración urgente',text:values.worsening==='yes'?'Valorar hoy gravedad, constantes y causa del deterioro.':'Contexto agudo: no retrasar la valoración por clasificación.'}:values.stable!=='yes'||values.perfusion==='unknown'||values.worsening==='unknown'?{level:'pending',title:'Estabilidad pendiente de valorar',text:'Completar evaluación clínica, constantes y alarmas antes de decidir el ámbito asistencial.'}:{level:'review',title:'Estabilidad comprobada',text:'Según la valoración clínica registrada; reevaluar si cambia la situación.'};
 let code='pending',title='Situación indeterminada',short='Pendiente de evaluar',text='Completar los datos necesarios; ausencia de registro no equivale a ausencia de congestión o inestabilidad.';
 if(critical){code='unstable';title='Inestabilidad clínica';short='Inestabilidad';text='Hay alarma, hipoperfusión o inestabilidad registrada. Priorizar valoración urgente inmediata, sin asumir la causa.';}
 else if(urgent){code='worsening';title=eligible?'Posible descompensación':'Deterioro o contexto agudo';short='Valoración urgente';text='Valorar hoy gravedad y posibles desencadenantes. Determinar destino según hallazgos; no presuponer la etiología.';}
 else if(!eligible){code='not-established';title='IC clínica no establecida';short='IC clínica pendiente';text='No asignar compensación ni descompensación de IC sin IC clínica establecida. Revisar el estadio.';}
 else if(values.congestion==='yes'&&values.worsening==='no'&&values.perfusion==='no'&&values.stable==='yes'){code='congested';title='Congestión sin deterioro referido';short='Congestión';text='Congestión actual con estabilidad comprobada y sin empeoramiento relevante referido. Reevaluar volumen y tratamiento. No presupone duración ni excluye otras causas.';}
 else if(values.congestion==='no'&&values.worsening==='no'&&values.perfusion==='no'&&values.stable==='yes'){code='compensated';title='IC clínicamente compensada';short='Compensada';text='Sin congestión, hipoperfusión ni deterioro reciente relevante tras valoración explícita de la estabilidad. Reevaluar ante cambios clínicos.';}
 else if(values.congestion==='yes'){text='Congestión registrada. Completar evolución, perfusión y estabilidad antes de establecer situación y ámbito asistencial.';}
 const reason=[];
 if(ny.functionalClass)reason.push('Clase funcional: NYHA '+ny.functionalClass+'; no determina por sí sola la compensación.');
 if(findings.length)reason.push('Hallazgos compatibles, no específicos: '+findings.join(' · ')+'.');
 for(const [k,v] of Object.entries(values))if(v!=='unknown')reason.push(SITUATION_QUESTIONS[k]+' '+(v==='yes'?'Sí.':'No.'));
 if(echo.urgent)reason.push('Se mantiene la prioridad urgente de la evaluación previa.');
 const recovered=['worsening','perfusion'].filter(k=>values[k]!=='unknown');
 const questions=Object.keys(SITUATION_QUESTIONS).filter(k=>!recovered.includes(k));
 return {code,title,short,text,values,eligible,urgent,safety,contradictions,reason,findings,recovered,questions,source:{doi:SOURCE.doi,sections:'IC descompensada; evaluación de congestión e hipoperfusión',version:'0.1'}};
}

/* Integrated classification: read-only projection of existing assistants, not a new diagnostic rule.
 * Navigation prioritizes safety and unresolved inputs; treatment remains a placeholder. */
export function classificationSummary(ctx){
 const st=interpretStage(ctx),ph=interpretPhenotype(ctx),ny=interpretNyha(ctx),sit=interpretSituation(ctx);
 const contradictions=[...new Set([...st.contradictions,...sit.contradictions,...(ph.conflict&&!st.contradictions.length?['Discordancia en la información histórica de FEVI.']:[])])];
 const clinicalHF=['C','D'].includes(st.stage)&&!ph.conflict;
 const preclinical=['0','A','B'].includes(st.stage)&&!ph.conflict;
 const fmt=v=>v===null?'No registrada':String(v).replace('.',',')+' %';
 const delta=ph.delta===null?'No calculable':(ph.delta>0?'+':'')+String(ph.delta).replace('.',',')+' puntos porcentuales';
 const pending=[],optional=[];
 if(st.stage===null)pending.push({section:'estadio',label:'Estadio evolutivo'});
 if(ph.conflict)pending.push({section:'fenotipo',label:'Revisar discordancias de fenotipo'});
 else if(clinicalHF&&(ph.code==='pending'||ph.code==='preserved-pending'))pending.push({section:'fenotipo',label:'Fenotipo de IC'});
 if(sit.safety.level==='pending'||(clinicalHF&&sit.code==='pending'))pending.push({section:'situacion',label:'Situación clínica y seguridad'});
 if(clinicalHF&&!ny.functionalClass)optional.push({section:'nyha',label:ny.title});
 if(ph.delta===null)optional.push({section:'evolucion',label:'Comparación histórica de FEVI no disponible'});
 else if(ph.trajectoryPattern&&!ph.improved&&!ph.conflict)optional.push({section:'fenotipo',label:'Aclarar contexto clínico de la mejoría de FEVI'});
 if(clinicalHF&&st.stage==='C'&&st.title.includes('(al menos)'))optional.push({section:'estadio',label:'Completar valoración de posible IC avanzada'});
 const stageLabel=st.stage===null?'Indeterminado':st.stage+(st.title.includes('(al menos)')?' (al menos)':'');
 const title=contradictions.length?'Clasificación discordante':clinicalHF?ph.code==='pending'?'IC clínica; FEVI pendiente':ph.title:preclinical?st.title:'IC clínica no establecida';
 const lines=[];
 if(contradictions.length)lines.push('Hay datos discordantes; no consolidar el perfil clínico hasta revisarlos.');
 else if(clinicalHF){
  lines.push('IC clínica registrada, estadio '+stageLabel+'. '+ph.text);
  if(ny.functionalClass)lines.push('Clase funcional '+ny.title+' ('+ny.short.toLowerCase()+').');
  if(sit.code==='compensated'||sit.code==='congested')lines.push(sit.title+'.');
  else if(!sit.urgent)lines.push('Situación clínica pendiente de completar.');
  if(ph.delta!==null)lines.push(ph.trajectory+'. Variación de '+delta+'.');
  if(ph.improved)lines.push('La mejoría de FEVI no equivale a curación ni justifica retirar tratamiento por sí sola.');
  if(st.stage==='D'||st.flags.length)lines.push(st.text);
 }else if(preclinical){lines.push(st.text);lines.push('No asignar un fenotipo ni una clase funcional de IC clínica.');}
 else{lines.push('La información disponible no permite establecer una clasificación completa de IC.');}
 if(sit.urgent)lines.push(sit.text);
 const rows=[
  {section:'estadio',label:'Estadio evolutivo',value:stageLabel},
  {section:'nyha',label:'Clase funcional',value:ny.eligible?ny.title:preclinical?'No aplicable':'No asignable'},
  {section:'situacion',label:'Situación clínica',value:sit.short},
  {section:'evolucion',label:'FEVI previa',value:fmt(ph.prior)},
  {section:'evolucion',label:'Variación',value:delta}
 ];
 let next={kind:'review',label:'Revisar clasificación',section:null};
 if(sit.urgent)next={kind:'urgent',label:'IC descompensada (en desarrollo)',section:'descompensada'};
 else if(contradictions.length||pending.length)next={kind:'review',label:'Completar clasificación',section:pending[0]?.section??'estadio'};
 else if(st.stage==='D'||st.flags.length)next={kind:'advanced',label:'Valorar IC avanzada (en desarrollo)',section:'avanzada'};
 else if(preclinical)next={kind:'preclinical',label:'Volver a insuficiencia cardiaca',section:null};
 else if(clinicalHF&&['href','hfpef','prior-reduced'].includes(ph.code))next={kind:'treatment',label:'Continuar a tratamiento',section:'tratamiento'};
 return {title,ef:ph.ef,prior:ph.prior,delta:ph.delta,stage:st.stage,stageLabel,phenotype:ph.code,phenotypeLabel:ph.title,clinicalHF,preclinical,nyha:ny.functionalClass,situation:sit.code,trajectory:ph.trajectory,improved:ph.improved,rows,narrative:lines.join(' '),contradictions,pending,optional,urgent:sit.urgent,safety:sit.safety,next,advancedFlags:st.flags,nyhaWarning:ny.warning};
}

/* Treatment assistant, step 1: data collection only. No drug eligibility, clinical cutoffs or prescribing.
 * Renal function and potassium are read from the shared laboratory record. */
export const TREATMENT_VITALS=[
 ['sbp','Sistólica','mmHg'],['dbp','Diastólica','mmHg'],['hr','Frecuencia cardiaca','lpm']
];
const treatmentLabs=['egfr','potassium'];
function labSnapshot(ctx){
 return JSON.stringify(treatmentLabs.map(k=>[k,ctx.results?.[k]?.value??null,ctx.results?.[k]?.recordedAt??null]));
}
export function setTreatmentValue(ctx,key,raw){
 if(!TREATMENT_VITALS.some(x=>x[0]===key)&&!treatmentLabs.includes(key))return ctx;
 if(!['string','number'].includes(typeof raw))return ctx;
 const s=String(raw).trim().replace(',','.');
 if(s&&(!/^\d+(?:\.\d+)?$/.test(s)||!Number.isFinite(Number(s))||(key!=='egfr'&&Number(s)<=0)))return ctx;
 const v=s?Number(s):null;
 if(treatmentLabs.includes(key)){
  if((ctx.results?.[key]?.value??null)===v)return {...ctx};
  return setStudyResult(ctx,key,s);
 }
 const a={...ctx.treatmentAssessment};
 if(v===null)delete a[key];else a[key]=v;
 return {...ctx,treatmentAssessment:a,updatedAt:new Date().toISOString()};
}
export function confirmTreatmentLabs(ctx,checked){
 if(typeof checked!=='boolean')return ctx;
 const a={...ctx.treatmentAssessment};
 if(checked&&treatmentLabs.every(k=>Number.isFinite(ctx.results?.[k]?.value)))a.labConfirmation={snapshot:labSnapshot(ctx),confirmedAt:new Date().toISOString()};
 else delete a.labConfirmation;
 return {...ctx,treatmentAssessment:a,updatedAt:new Date().toISOString()};
}
export function treatmentSafetyData(ctx){
 const a=ctx.treatmentAssessment||{},r=classificationSummary(ctx);
 const values=Object.fromEntries(TREATMENT_VITALS.map(([key])=>[key,a[key]??null]));
 for(const k of treatmentLabs)values[k]=ctx.results?.[k]?.value??null;
 const missing=Object.entries(values).filter(([,v])=>v===null).map(([k])=>k);
 const labsAvailable=treatmentLabs.every(k=>Number.isFinite(values[k]));
 const labsConfirmed=labsAvailable&&a.labConfirmation?.snapshot===labSnapshot(ctx);
 const pressureDiscordant=values.sbp!==null&&values.dbp!==null&&values.sbp<values.dbp;
 return {profile:r,values,missing,labsAvailable,labsConfirmed,pressureDiscordant,urgent:r.urgent,classificationNeedsReview:r.next.kind==='review'||r.next.kind==='preclinical',readyForFurtherAssessment:!r.urgent&&r.next.kind==='treatment'&&!missing.length&&labsConfirmed&&!pressureDiscordant};
}

/* Step 2: medication reconciliation, not prescribing. Actual regimens may differ from
 * licensed doses; no default dose or frequency and no therapeutic eligibility implied. */
export const MEDICATION_GROUPS=[
 ['raas','ARNI / IECA / ARA-II',['Sacubitrilo/valsartán','Enalapril','Ramipril','Candesartán','Valsartán']],
 ['bb','Betabloqueantes',['Bisoprolol','Carvedilol','Metoprolol succinato','Nebivolol']],
 ['mra','ARM',['Espironolactona','Eplerenona','Finerenona']],
 ['sglt2','iSGLT2',['Dapagliflozina','Empagliflozina']],
 ['diuretic','Diuréticos',['Furosemida','Torasemida']]
];
export const MEDICATION_FREQUENCIES=[['24','Cada 24 h'],['12','Cada 12 h'],['8','Cada 8 h'],['48','Días alternos'],['other','Otra pauta']];
export const MEDICATION_ABSENCE_REASONS=[['unknown','Sin precisar'],['notStarted','No iniciado'],['intolerance','Intolerancia previa'],['contraindication','Contraindicación referida'],['notIndicated','No indicado según valoración previa'],['other','Otro motivo']];
export const MEDICATION_TOLERANCE=[['unknown','Sin valorar'],['well','Sin problemas referidos'],['problem','Problemas de tolerancia']];
const medicationState=ctx=>({groups:{},additional:[],reviewed:false,nextId:1,...ctx.medicationAssessment});
const medicationCatalog=MEDICATION_GROUPS.flatMap(g=>g[2]);
const newMedication=(drug='unknown')=>({drug,name:'',dose:'',dose2:'',frequency:'',customFrequency:'',reason:'unknown',tolerance:'unknown',note:''});
const normalizeMedication=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s*\/\s*/g,'/').replace(/\s+/g,' ').trim();
const namedMedication=m=>m.drug==='other'?m.name:m.drug;
const medicationGroupFor=m=>MEDICATION_GROUPS.find(g=>g[2].some(x=>normalizeMedication(x)===normalizeMedication(namedMedication(m))))?.[0]??null;
export function setMedicationField(ctx,id,key,raw){
 const a=medicationState(ctx),group=MEDICATION_GROUPS.find(g=>g[0]===id),index=a.additional.findIndex(m=>m.id===id);
 if(!group&&index<0||typeof raw!=='string')return ctx;
 const old=group?a.groups[id]||newMedication():a.additional[index];
 let m={...old};
 if(key==='drug'){
  const allowed=group?['unknown','none','other',...group[2]]:['unknown','other',...medicationCatalog];
  if(!allowed.includes(raw)||old.drug===raw)return ctx;
  m={...newMedication(raw),...(group?{}:{id})};
 }else{
  if(key==='reason'){
   if(old.drug!=='none'||!MEDICATION_ABSENCE_REASONS.some(x=>x[0]===raw))return ctx;
  }else if(key==='tolerance'){
   if(['none','unknown'].includes(old.drug)||!MEDICATION_TOLERANCE.some(x=>x[0]===raw))return ctx;
  }else if(key==='frequency'){
   if(['none','unknown'].includes(old.drug)||!['',...MEDICATION_FREQUENCIES.map(x=>x[0])].includes(raw))return ctx;
  }else if(['name','dose','dose2','customFrequency','note'].includes(key)){
   if(key==='name'&&old.drug!=='other'||['dose','dose2','customFrequency'].includes(key)&&['none','unknown'].includes(old.drug))return ctx;
   if(key==='dose2'&&old.drug!=='Sacubitrilo/valsartán'||key==='customFrequency'&&old.frequency!=='other')return ctx;
   if(raw.length>(key==='note'?240:80))return ctx;
  }else return ctx;
  if(old[key]===raw)return ctx;
  m[key]=raw;
  if(key==='frequency'&&raw!=='other')m.customFrequency='';
  if(key==='reason'&&raw==='unknown'||key==='tolerance'&&raw!=='problem')m.note='';
 }
 const groups=group?{...a.groups,[id]:m}:a.groups;
 const additional=group?a.additional:a.additional.map((x,i)=>i===index?m:x);
 return {...ctx,medicationAssessment:{...a,groups,additional,reviewed:false},updatedAt:new Date().toISOString()};
}
export function addMedication(ctx){
 const a=medicationState(ctx);
 if(a.additional.length>=30)return ctx;
 const id='extra-'+a.nextId;
 return {...ctx,medicationAssessment:{...a,additional:[...a.additional,{...newMedication(),id}],nextId:a.nextId+1,reviewed:false},updatedAt:new Date().toISOString()};
}
export function removeMedication(ctx,id){
 const a=medicationState(ctx);
 if(!a.additional.some(m=>m.id===id))return ctx;
 return {...ctx,medicationAssessment:{...a,additional:a.additional.filter(m=>m.id!==id),reviewed:false},updatedAt:new Date().toISOString()};
}
export function medicationSummary(ctx){
 const a=medicationState(ctx);
 const groups=MEDICATION_GROUPS.map(([id,label,options])=>({id,label,options,...(a.groups[id]||newMedication())}));

 const rows=[...groups,...a.additional];
 const active=rows.filter(m=>!['unknown','none'].includes(m.drug));
 const missing=[];
 const doseValid=s=>/^\d+(?:[.,]\d+)?$/.test(String(s).trim())&&Number(String(s).replace(',','.'))>0;
 for(const m of active){
  const name=namedMedication(m)?.trim();
  if(!name)missing.push({id:m.id,label:'Principio activo por identificar'});
  const validDose=m.drug==='other'?!!m.dose.trim():doseValid(m.dose);
  if(!validDose||m.drug==='Sacubitrilo/valsartán'&&!doseValid(m.dose2)||!m.frequency||m.frequency==='other'&&!m.customFrequency.trim())missing.push({id:m.id,label:(name||m.label||'Medicación adicional')+': pauta incompleta'});
 }
 for(const m of a.additional.filter(m=>m.drug==='unknown'))missing.push({id:m.id,label:'Medicación adicional sin identificar'});
 const duplicates=[];
 const names=new Map(),classes=new Map();
 for(const m of active){
  const name=normalizeMedication(namedMedication(m));if(!name)continue;
  const previous=names.get(name);
  if(previous)duplicates.push('Principio activo repetido: '+namedMedication(m)+'. Revisar si es una misma pauta o un registro duplicado.');
  else names.set(name,m);
  const family=medicationGroupFor(m);
  if(family&&family!=='diuretic'){const list=classes.get(family)||[];list.push(name);classes.set(family,list);}
 }
 for(const [family,list] of classes)if(new Set(list).size>1)duplicates.push('Posible duplicidad en '+MEDICATION_GROUPS.find(g=>g[0]===family)[1]+'. Revisar la combinación registrada.');
 const unidentified=a.additional.some(m=>m.drug==='unknown')||active.some(m=>!medicationGroupFor(m));
 const familyStatus=groups.map(g=>{
  const members=active.filter(m=>medicationGroupFor(m)===g.id||(m.id===g.id&&m.drug!=='other'));
  return {id:g.id,label:g.label,status:members.length?'present':g.drug==='none'?'absent':a.reviewed===true&&!unidentified?'absent':'unknown',members};
 });
 const unknown=familyStatus.filter(g=>g.status==='unknown').map(g=>g.label);
 const complete=unknown.length===0&&missing.length===0;
 return {groups,additional:a.additional,active,unknown,missing,familyStatus,unidentified,duplicates:[...new Set(duplicates)],reviewed:a.reviewed===true,complete,reconciled:complete&&a.reviewed===true&&duplicates.length===0};
}
export function confirmMedicationReview(ctx,checked){
 if(typeof checked!=='boolean')return ctx;
 const a=medicationState(ctx);
 return {...ctx,medicationAssessment:{...a,reviewed:checked},updatedAt:new Date().toISOString()};
}

// Quick entry choices, NOT dose recommendations, exhaustive licensed strengths or titration rules.
// ESC 2021 Table 8; CIMA references recorded in project documentation.
// Metoprolol uses actual succinate salt mg, not tartrate-equivalent label.
export const MEDICATION_QUICK_DOSES={
 'Sacubitrilo/valsartán':['24/26','49/51','97/103'],
 'Enalapril':['2,5','5','10','20'],
 'Ramipril':['1,25','2,5','5','10'],
 'Candesartán':['4','8','16','32'],
 'Valsartán':['40','80','160'],
 'Bisoprolol':['1,25','2,5','3,75','5','7,5','10'],
 'Carvedilol':['3,125','6,25','12,5','25','50'],
 'Metoprolol succinato':['11,875','23,75','47,5','95','190'],
 'Nebivolol':['1,25','2,5','5','10'],
 'Espironolactona':['12,5','25','50'],
 'Eplerenona':['25','50'],
 'Finerenona':['10','20','40'],
 'Dapagliflozina':['10'],
 'Empagliflozina':['10'],
 'Furosemida':['20','40','80'],
 'Torasemida':['2,5','5','10','20']
};
export function medicationEntryComplete(summary,id){
 const m=[...summary.groups,...summary.additional].find(x=>x.id===id);
 return !!m&&m.drug!=='unknown'&&!summary.missing.some(x=>x.id===id);
}
export function setMedicationQuickDose(ctx,id,value){
 const m=[...medicationSummary(ctx).groups,...medicationSummary(ctx).additional].find(x=>x.id===id);
 if(!m||!MEDICATION_QUICK_DOSES[m.drug]?.includes(value))return ctx;
 const [dose,dose2]=value.split('/');
 const next=setMedicationField(ctx,id,'dose',dose);
 return dose2?setMedicationField(next,id,'dose2',dose2):next;
}

/* Teaching labels: narrower classes than the reconciliation/duplicate-detection groups. */
export const MEDICATION_FAMILIES=[
 ['arni','ARNI',['Sacubitrilo/valsartán']],
 ['ieca','IECA',['Enalapril','Ramipril']],
 ['ara','ARA-II',['Candesartán','Valsartán']],
 ['bb','Betabloqueantes',['Bisoprolol','Carvedilol','Metoprolol succinato','Nebivolol']],
 ['mra','ARM',['Espironolactona','Eplerenona','Finerenona']],
 ['sglt2','iSGLT2',['Dapagliflozina','Empagliflozina']],
 ['diuretic','Diuréticos de asa',['Furosemida','Torasemida']]
];
export function medicationFamilyLabel(m){
 return MEDICATION_FAMILIES.find(g=>g[2].some(x=>normalizeMedication(x)===normalizeMedication(namedMedication(m))))?.[1]??'Familia sin clasificar';
}
export function addNamedMedication(ctx,drug){
 if(!['other',...medicationCatalog].includes(drug))return ctx;
 const a=medicationState(ctx);
 if(a.additional.length>=30)return ctx;
 const next=addMedication(ctx);
 return setMedicationField(next,'extra-'+a.nextId,'drug',drug);
}
export function deleteRecordedMedication(ctx,id){
 if(MEDICATION_GROUPS.some(g=>g[0]===id)){
  return setMedicationField(ctx,id,'drug','unknown');
 }
 return removeMedication(ctx,id);
}

/* First bounded medication-safety layer. References: CIMA sections 4.2–4.5.
 * Reference schedules for adult oral chronic HF, not a prescription or a complete interaction checker.
 * Never infer an actual patient's frequency from a reference schedule. */
const cima=(id,file='FT_'+id+'.html')=>'https://cima.aemps.es/cima/dochtml/ft/'+id+'/'+file;
export const HF_MEDICATION_REFERENCE={
 'Sacubitrilo/valsartán':{f:['12'],max:194,max2:206,source:cima('91062')},
 'Enalapril':{f:['12','24'],max:40,source:cima('83712')},
 'Ramipril':{f:['12','24'],max:10,source:cima('76966'),note:'En IC sintomática se recomiendan dos tomas; el inicio puede ser en una toma.'},
 'Candesartán':{f:['24'],max:32,source:cima('74643')},
 'Valsartán':{f:['12'],max:320,source:cima('72856','ft_72856.html')},
 'Bisoprolol':{f:['24'],max:10,source:cima('81432')},
 'Carvedilol':{f:['12'],max:100,source:cima('66923','FichaTecnica_66923.html'),note:'Más de 50 mg/día exige comprobar peso >85 kg y ausencia de IC grave.'},
 'Metoprolol succinato':{f:['24'],max:190,source:cima('61506','FichaTecnica_61506.html'),note:'Liberación prolongada; expresar en mg de succinato.'},
 'Nebivolol':{f:['24'],max:10,source:cima('83604')},
 'Espironolactona':{f:['24','48'],reference:50,source:cima('39059')},
 'Eplerenona':{f:['24','48'],max:50,source:cima('76182')},
 'Finerenona':{f:['24'],max:40,source:cima('1211616002'),note:'Dosis objetivo en IC según FG al inicio; no extrapolar la dosis de ERC-DM2.'},
 'Dapagliflozina':{f:['24'],reference:10,source:cima('91132')},
 'Empagliflozina':{f:['24'],reference:10,source:cima('114930014',''),note:'25 mg/día puede corresponder a DM2, no a la dosis de IC.'},
 'Furosemida':{f:['24','12','8'],variable:true,source:cima('39969','fichatecnica_39969.html')},
 'Torasemida':{f:['24'],variable:true,source:cima('60802','FichaTecnica_60802.html')}
};
HF_MEDICATION_REFERENCE.Empagliflozina.source='https://cima.aemps.es/cima/dochtml/ft/90783/FT_90783.html';
function knownDrug(m){return medicationCatalog.find(x=>normalizeMedication(x)===normalizeMedication(namedMedication(m)));}
export function medicationFrequencyOptions(m){
 const ref=HF_MEDICATION_REFERENCE[knownDrug(m)];
 const options=ref?MEDICATION_FREQUENCIES.filter(([k])=>ref.f.includes(k)||k==='other'||k===m.frequency):MEDICATION_FREQUENCIES;
 return options;
}
export function medicationSafety(ctx){
 const m=medicationSummary(ctx),d=treatmentSafetyData(ctx),alerts=[];
 const add=(id,level,title,text,source,rows=[])=>alerts.push({id,level,title,text,source,rows});
 const entries=m.active.map(row=>({row,drug:knownDrug(row)})),has=drug=>entries.some(x=>x.drug===drug);
 const family=id=>entries.filter(x=>MEDICATION_FAMILIES.find(g=>g[0]===id)?.[2].includes(x.drug));
 const ids=xs=>xs.map(x=>x.row.id);
 const arni=family('arni'),ieca=family('ieca'),ara=family('ara'),mra=family('mra');
 const arniSource=HF_MEDICATION_REFERENCE['Sacubitrilo/valsartán'].source,eplSource=HF_MEDICATION_REFERENCE.Eplerenona.source;
 if(arni.length&&ieca.length)add('ARNI-IECA','red','Combinación contraindicada','ARNI + IECA: riesgo de angioedema. Intervalo mínimo de 36 h entre la última dosis de uno y el inicio del otro. Revisar de inmediato la medicación registrada.',arniSource,ids([...arni,...ieca]));
 if(arni.length&&ara.length)add('ARNI-ARA','red','Combinación no permitida','Sacubitrilo/valsartán ya contiene valsartán. No asociar otro ARA-II. Revisar el registro.',arniSource,ids([...arni,...ara]));
 if(ieca.length&&ara.length)add('IECA-ARA','amber','Bloqueo dual del SRAA','IECA + ARA-II: generalmente no recomendado; verificar indicación especializada, función renal y potasio.',HF_MEDICATION_REFERENCE.Candesartán.source,ids([...ieca,...ara]));
 if(has('Eplerenona')&&has('Espironolactona'))add('MRA-DUAL','red','Combinación contraindicada','Eplerenona con otro diurético ahorrador de potasio: riesgo de hiperpotasemia.',eplSource,ids(mra));
 if(has('Finerenona')&&(has('Eplerenona')||has('Espironolactona')))add('FIN-MRA','red','Combinación no permitida','Finerenona no debe asociarse a otro ARM.',HF_MEDICATION_REFERENCE.Finerenona.source,ids(mra));
 if(ieca.length&&ara.length&&has('Eplerenona'))add('EPL-TRIPLE','red','Combinación contraindicada','Eplerenona + IECA + ARA-II.',eplSource,ids([...ieca,...ara,...mra]));
 for(const {row,drug} of entries){
  if(!drug)continue;
  const r=HF_MEDICATION_REFERENCE[drug],f=row.frequency;
  if(f&&!r.f.includes(f)&&!r.variable)add('FREQ-'+row.id,'amber','Revisar frecuencia: '+drug,f==='other'?'Pauta libre: comprobar intervalo y dosis total antes de interpretar.':'Frecuencia distinta de la pauta de referencia en IC. Confirmar indicación y formulación.',r.source,[row.id]);
  if(f==='other'&&r.variable)add('CUSTOM-'+row.id,'blue','Pauta individualizada: '+drug,'Comprobar pauta real y respuesta diurética; no se calcula dosis diaria desde texto libre.',r.source,[row.id]);
  // Numeric interpretation only for catalog selections; free-text units remain unparsed.
  if(row.drug==='other'||!f||f==='other'||!row.dose)continue;
  const number=s=>/^\d+(?:[.,]\d+)?$/.test(String(s).trim())?Number(String(s).replace(',','.')):NaN;
  const dose=number(row.dose),dose2=number(row.dose2),n=24/Number(f),daily=dose*n,daily2=dose2*n;
  if(!Number.isFinite(daily)||daily<=0)continue;
  const fmt=v=>String(Math.round(v*1000)/1000).replace('.',',');
  if(r.max&&(daily>r.max||r.max2&&daily2>r.max2))add('MAX-'+row.id,'amber','Dosis superior a la referencia de IC: '+drug,'Dosis registrada: '+fmt(daily)+(r.max2&&Number.isFinite(daily2)?'/'+fmt(daily2):'')+' mg/día equivalentes. Revisar pauta e indicación; no modificar automáticamente.',r.source,[row.id]);
  else if(r.reference&&daily>r.reference)add('REF-'+row.id,'amber','Dosis distinta de la referencia de IC: '+drug,fmt(daily)+' mg/día equivalentes. '+(r.note||'Puede depender de otra indicación; revisar la pauta.'),r.source,[row.id]);
  else if(drug==='Carvedilol'&&daily>50)add('CARV-'+row.id,'amber','Carvedilol: comprobar peso y gravedad',r.note,r.source,[row.id]);
  if(drug==='Enalapril'&&f==='24'&&daily>20&&daily<=40)add('ENA-'+row.id,'amber','Enalapril: revisar reparto de dosis','La dosis máxima diaria de referencia de 40 mg se administra dividida en dos tomas.',r.source,[row.id]);
  if(drug==='Eplerenona'&&f==='48'&&dose>25)add('EPL-48-'+row.id,'amber','Eplerenona: revisar días alternos','La pauta de días alternos de la ficha técnica utiliza 25 mg por toma.',r.source,[row.id]);
 }
 if(has('Eplerenona')&&d.labsConfirmed){
  if(d.values.egfr<30)add('EPL-FG','red','Eplerenona: revisar función renal','FG estimado inferior a 30 mL/min/1,73 m². Verificar aclaramiento de creatinina, criterio de la ficha técnica, y revisar tratamiento.',eplSource,ids(mra));
  if(d.values.potassium>=6)add('EPL-K6','red','Eplerenona: hiperpotasemia importante','Potasio confirmado ≥6 mmol/L. Priorizar valoración clínica urgente y revisión de medicación.',eplSource,ids(mra));
  else if(d.values.potassium>=5.5)add('EPL-K55','amber','Eplerenona: potasio elevado','Potasio confirmado 5,5–5,9 mmol/L: revisar tratamiento y monitorización.',eplSource,ids(mra));
 }
 if(has('Finerenona')&&d.labsConfirmed){
  const source=HF_MEDICATION_REFERENCE.Finerenona.source;
  if(d.values.potassium>=6)add('FIN-K6','red','Finerenona: hiperpotasemia importante','Potasio ≥6 mmol/L: valoración urgente y revisión de tratamiento.',source,ids(mra));
  else if(d.values.potassium>=5.5)add('FIN-K55','amber','Finerenona: potasio elevado','Revisar indicación, dosis y tabla de ajuste de la ficha técnica.',source,ids(mra));
  if(d.values.egfr<15)add('FIN-FG15','red','Finerenona: función renal muy reducida','FG <15; revisar tratamiento conforme a ficha técnica.',source,ids(mra));
 }
 if(mra.length&&!d.labsConfirmed)add('MRA-LABS','blue','Confirmar función renal y potasio','Datos vigentes necesarios para valorar seguridad de ARM.',eplSource,ids(mra));
 if(mra.length&&(arni.length||ieca.length||ara.length))add('MRA-SRAA','blue','Monitorización renal y de potasio','La combinación de ARM con un inhibidor del SRAA puede ser indicada en IC; requiere seguimiento. No equivale a incompatibilidad.',eplSource,ids([...mra,...arni,...ieca,...ara]));
 return alerts.sort((a,b)=>({red:0,amber:1,blue:2}[a.level]-{red:0,amber:1,blue:2}[b.level]));
}

/* Step 3: bounded educational decision support for fictional adult chronic HF cases.
 * Original summaries of publicly accessible clinical references; not a validated prescribing system.
 * Do not interpret absence until reconciliation, nor treat missing safety findings as negatives. */
const HF_GUIDE='https://doi.org/10.1093/eurheartj/ehag100';
const HF_GUIDE_2021='https://doi.org/10.1093/eurheartj/ehab368';
const HF_GUIDE_2026_SUMMARY='https://www.escardio.org/news/press/press-releases/major-changes-made-to-the-esc-guidelines-on-heart-failure/';
const refDrug=drug=>HF_MEDICATION_REFERENCE[drug]?.source||HF_GUIDE;
const mgNumber=s=>/^\d+(?:[.,]\d+)?$/.test(String(s??'').trim())?Number(String(s).replace(',','.')):NaN;
const fmtDose=n=>String(n).replace('.',',');
export function treatmentProposal(ctx){
 const d=treatmentSafetyData(ctx),r=d.profile,m=medicationSummary(ctx),alerts=medicationSafety(ctx);
 const actions=[],blockers=[],urgent=[];
 const {sbp,hr,egfr,potassium}=d.values;
 const push=(kind,title,detail,check,source=HF_GUIDE)=>actions.push({kind,title,detail,check,source});
 if(r.urgent)urgent.push('La situación clínica registrada requiere valoración urgente.');
 if(d.labsConfirmed&&potassium>=6)urgent.push('Potasio ≥6 mmol/L: valoración clínica urgente, ECG y confirmación según contexto; no esperar a optimizar tratamiento.');
 if(alerts.some(a=>a.level==='red'))blockers.push('Resolver las alertas rojas y comprobar la medicación real.');
 if(alerts.some(a=>a.level==='amber'))blockers.push('Revisar las alertas de dosis, frecuencia o interacción antes de plantear cambios.');
 if(r.next.kind==='advanced')blockers.push('Valorar IC avanzada con el equipo especializado.');
 else if(r.next.kind!=='treatment'||!r.clinicalHF||!Number.isFinite(r.ef))blockers.push('Completar clasificación y confirmar IC clínica.');
 if(r.situation!=='compensated')blockers.push('Confirmar estabilidad sin congestión antes de optimizar el tratamiento crónico. Si hay congestión, valorar diuresis y gravedad.');
 if(d.missing.length||!d.labsConfirmed||d.pressureDiscordant)blockers.push('Completar constantes y confirmar función renal y potasio vigentes.');
 if(sbp!==null&&sbp<100)blockers.push('PAS inferior a 100 mmHg: revisar síntomas, perfusión y causas antes de intensificar.');
 if(hr!==null&&hr<60)blockers.push('FC inferior a 60 lpm: revisar ritmo, síntomas y fármacos cronotropos antes de intensificar.');
 if(d.labsConfirmed&&(potassium>=5.5||potassium<3.5))blockers.push('Potasio fuera del margen conservador del prototipo: revisar causas y tratamiento.');
 if(!m.reconciled)blockers.push('Confirmar lista completa, pautas y clasificación de los medicamentos; resolver duplicidades.');
 if(m.active.some(x=>x.drug==='other'||x.frequency==='other'||x.tolerance==='problem'))blockers.push('Revisión individual de pauta libre, medicamento no identificado o intolerancia registrada.');
 if(r.nyha==='IV')blockers.push('NYHA IV: evaluación especializada antes de la intensificación ambulatoria.');
 const result=(status)=>({status,profile:r,values:d.values,actions,blockers,urgent,alerts,source:HF_GUIDE});
 if(urgent.length||blockers.length)return result(urgent.length?'urgent':'review');
 // The remaining output consists of conditional options, never orders. Each action states checks not automated.
 const member=id=>m.familyStatus.find(x=>x.id===id)?.members||[];
 const absent=id=>m.familyStatus.find(x=>x.id===id)?.status==='absent';
 const existing=id=>member(id)[0];
 const reduced=r.ef<=40&&!r.improved&&r.phenotype!=='prior-reduced';
 const historical=r.improved||r.phenotype==='prior-reduced';
 const mid=r.ef>40&&r.ef<50&&!historical;
 const preserved=r.ef>=50&&!historical;
 const symptomatic=['II','III'].includes(r.nyha);
 const arni=existing('raas'),bb=existing('bb'),arm=existing('mra'),sg=existing('sglt2'),loop=existing('diuretic');
 if(historical){
  push('maintain','FEVI recuperada o antecedente de reducción','No retirar tratamiento modificador del pronóstico únicamente por mejoría de FEVI. Revisar fenotipo previo e indicaciones de cada fármaco.','Confirmar diagnóstico histórico y motivo de cualquier cambio; no aplicar escalada de novo en este escenario.');
 }else if(!symptomatic){
  push('review','Confirmar perfil sintomático','Para proponer nuevos fármacos con indicación de IC sintomática, revisar clase funcional e historia de síntomas.','NYHA I o no registrada no implica ausencia de indicación previa.');
 }
 if(reduced&&symptomatic){
  if(absent('raas')){
   if(egfr>=30&&potassium<=5.4&&sbp>=100)push('start','Valorar sacubitrilo/valsartán','24/26 mg cada 12 h como inicio conservador en quien no recibe IECA/ARA-II; objetivo de referencia 97/103 mg cada 12 h.','Comprobar angioedema previo, embarazo, hepatopatía, interacciones, PA y ausencia real de IECA/ARA-II. Doblar cada 3–4 semanas si tolera; controlar FG/K tras inicio y ajustes.',refDrug('Sacubitrilo/valsartán'));
   else push('review','SRAA: revisar elegibilidad','No se ofrece dosis de inicio por los datos de seguridad registrados.','Confirmar PA, potasio, función renal y alternativa según tolerancia.',refDrug('Sacubitrilo/valsartán'));
  }else if(arni?.drug==='Sacubitrilo/valsartán'&&arni.frequency==='12'){
   const next={'24/26':'49/51','49/51':'97/103'}[arni.dose.replaceAll('.',',')+'/'+arni.dose2.replaceAll('.',',')];
   if(next&&sbp>=100&&egfr>=30&&potassium<=5.4)push('titrate','Valorar titulación de sacubitrilo/valsartán',arni.dose+'/'+arni.dose2+' → '+next+' mg cada 12 h.','Solo tras tolerancia, estabilidad y revisión de PA/FG/K; comprobar duración de la dosis actual y función renal previa. Reevaluar a las 2–4 semanas.',refDrug(arni.drug));
   else push('review','Revisar sacubitrilo/valsartán','Confirmar dosis máxima tolerada, pauta y seguridad; no aumentar automáticamente.','Revisar presión arterial, función renal y potasio.',refDrug(arni.drug));
  }else if(arni&&['IECA','ARA-II'].includes(medicationFamilyLabel(arni))){
   push('switch','Valorar sustitución por sacubitrilo/valsartán','Si la indicación y tolerancia lo permiten, considerar transición desde '+arni.drug+'. No asociarlos.','Si procede desde IECA, respetar ≥36 h; desde ARA-II, evitar solapamiento. Verificar dosis anterior, PA, FG, K, angioedema y ficha técnica para seleccionar dosis de inicio.',refDrug('Sacubitrilo/valsartán'));
  }
  if(absent('bb'))push('start','Valorar bisoprolol','Inicio de referencia 1,25 mg cada 24 h; objetivo máximo 10 mg/día si tolera.','Comprobar ECG, conducción AV, bradicardia/hipotensión sintomática, asma grave, interacciones y estabilidad. Vigilar FC, PA y signos de deterioro.',refDrug('Bisoprolol'));
  else if(bb?.drug==='Bisoprolol'&&bb.frequency==='24'){
   const dose=mgNumber(bb.dose),ladder=[1.25,2.5,3.75,5,7.5,10],i=ladder.indexOf(dose);
   if(i>=0&&i<5)push('titrate','Valorar titulación de bisoprolol',fmtDose(dose)+' → '+fmtDose(ladder[i+1])+' mg cada 24 h.','Comprobar tolerancia, ECG, FC, PA y ausencia de congestión. Escalón actual durante '+(i<3?'al menos una semana':'al menos cuatro semanas')+' según ficha técnica.',refDrug('Bisoprolol'));
   else push('review','Revisar bisoprolol','Confirmar dosis máxima tolerada; no aumentar si hay intolerancia.','No retirar bruscamente; verificar FC y PA.',refDrug('Bisoprolol'));
  }else if(bb)push('review','Valorar titulación de '+bb.drug,'La pauta individual de titulación para este principio activo aún no está automatizada.','Comprobar formulación, peso cuando proceda, ritmo, dosis actual y ficha técnica.',refDrug(bb.drug));
  if(absent('mra')){
   if(egfr>=30&&potassium<5)push('start','Valorar ARM esteroideo','Espironolactona: dosis de referencia de inicio 25 mg/día en IC grave según ficha técnica; eplerenona es alternativa si cumple su indicación específica.','Verificar indicación de la presentación, creatinina, aclaramiento, K, interacciones y tolerancia; controlar FG/K en una semana tras inicio o ajuste.',refDrug('Espironolactona'));
   else push('review','ARM: revisar seguridad','No se propone inicio con FG <30 o potasio ≥5 mmol/L en este prototipo.','Valorar alternativas y control analítico.',refDrug('Espironolactona'));
  }else if(arm)push('review','Revisar '+arm.drug,'Comprobar dosis según indicación, función renal y potasio.','No titular ARM sin datos de función renal previa y revisión de los límites específicos de su ficha técnica.',refDrug(arm.drug));
 }else if(mid&&symptomatic){
  push('review','FEVI 41–49 %: individualizar SRAA y betabloqueante','Aunque pertenece al fenotipo de FEVI reducida en ESC 2026, no trasladar automáticamente todas las dosis e indicaciones de los ensayos con FEVI ≤40 %.','Revisar etiología, síntomas, FEVI histórica, comorbilidades e indicación de cada principio activo.',HF_GUIDE);
  if(absent('mra'))push('review','Valorar ARM en FEVI 41–49 %','La evidencia y la indicación regulatoria dependen del principio activo; no aplicar el esquema de FEVI ≤40 % automáticamente.','Finerenona dispone de indicación autorizada desde FEVI ≥40 %; valorar individualmente y revisar elección de ARM.',refDrug('Finerenona'));
 }
 if(preserved&&symptomatic&&absent('mra')){
  if(egfr>=25&&potassium<=5)push('start','Valorar finerenona',(egfr>=60?'20':'10')+' mg cada 24 h como dosis inicial de referencia; objetivo según FG inicial: '+(egfr>=60?'40':'20')+' mg/día.','Comprobar ausencia de otro ARM, ahorradores de K, inhibidores/inductores CYP3A4, Addison, hepatopatía grave, embarazo y demás contraindicaciones. FG/K a las 4 semanas; titular solo según tabla y cambio de FG.',refDrug('Finerenona'));
  else push('review','Finerenona: revisar elegibilidad','No se propone inicio con FG <25 o K >5.','Revisar evolución renal y potasio.',refDrug('Finerenona'));
 }
 if(preserved&&arm)push('review','Revisar ARM registrado','No asociar finerenona a espironolactona o eplerenona.','Si se valora un cambio, revisar indicación, FG previo, potasio e interacciones; no aplicar sustitución automática.',refDrug(arm.drug));
 if(symptomatic&&!historical&&absent('sglt2')){
  if(egfr>=20){const drug=egfr>=25?'Dapagliflozina':'Empagliflozina';push('start','Valorar '+drug,'10 mg cada 24 h, sin titulación para IC.','Comprobar DM1, cetoacidosis previa/riesgo, ayuno o cirugía, enfermedad aguda, volemia, embarazo y contraindicaciones. Educar sobre interrupción temporal en enfermedad grave o cirugía según ficha técnica; revisar diuréticos y FG.',refDrug(drug));}
  else push('review','iSGLT2: revisar FG','No se ofrece inicio con FG <20; no implica retirar tratamiento previamente establecido.','Revisar indicación y evolución renal.',refDrug('Empagliflozina'));
 }else if(sg)push('maintain','iSGLT2 registrado: '+sg.drug,'No precisa titulación para la indicación de IC.','Confirmar indicación, tolerancia, función renal, volemia y precauciones; no retirar por una cifra aislada de FG.',refDrug(sg.drug));
 if(loop)push('review','Revisar necesidad de diurético de asa','Paciente sin congestión según datos registrados. Valorar la menor dosis eficaz, sin reducción automática.','Comprobar peso, síntomas, PA, función renal, electrolitos y evolución de la congestión.',refDrug(loop.drug));
 push('follow','Seguimiento tras cambios','Control clínico de PA, FC, peso y síntomas; programar FG y K según el medicamento y el plazo de ajuste.','Registrar dosis máxima tolerada, motivo de no iniciar o titular, adherencia y fecha de reevaluación; vigilar descompensación.',HF_GUIDE);
 return result('conditional');
}
