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
  arni:value('arni',medicationSummary(ctx).active.some(m=>knownDrug(m)==='Sacubitrilo/valsartán')?'yes':'unknown')
 };
}
export function interpretPeptide(ctx){
 const p=ctx?.peptides||{},kind=p.kind||'nt',context=p.context||'unknown',v=p[kind],age=p.age;
 const factors=peptideFactors(ctx),s=interpretSuspicion(ctx),known=ctx?.findings?.knownHF==='yes';
 const urgent=['critical','urgent'].includes(s.safety.level)||context==='acute';
 const low=context==='acute'?(kind==='nt'?300:100):context==='outpatient'?(kind==='nt'?125:35):null;
 // ESC 2026, Fig. 4 (p. 23): explicit outpatient age bands <50, 50–74, >=75.
 // In the lower/indeterminate bands, persistent clinical suspicion still warrants echo.
 const high=kind==='nt'&&Number.isFinite(age)?context==='acute'?(age<50?450:age<75?900:1800):context==='outpatient'?(age<50?125:age<75?250:500):null:null;
 const notes=[];
 if(factors.obesity==='yes')notes.push('Obesidad: puede reducir la concentración; un resultado bajo no excluye IC si persiste sospecha.');
 if(factors.af==='yes')notes.push('Fibrilación auricular: puede elevar el resultado sin que exista IC.');
 if(ctx?.findings?.af==='yes'&&factors.af==='unknown')notes.push('Arritmia previa registrada: precisar si existe fibrilación auricular.');
 if(factors.renal==='yes')notes.push('Disfunción renal: puede elevar los péptidos; no invalida el resultado.');
 if(factors.arni==='yes'&&kind==='bnp')notes.push('Sacubitrilo/valsartán puede elevar BNP; NT-proBNP resulta más apropiado para seguimiento.');
 const recorded=medicationSummary(ctx).active.map(knownDrug);
 if(recorded.some(drug=>drug&&MEDICATION_FAMILIES.some(([id,,drugs])=>['arni','ieca','ara','bb','mra','sglt2'].includes(id)&&drugs.includes(drug))))notes.push('Tratamiento de IC registrado: los fármacos modificadores del pronóstico pueden disminuir los péptidos. Revisar si ya estaban prescritos en el momento de la muestra (tabla 9).');
 if(p.arni==='no'&&recorded.includes('Sacubitrilo/valsartán'))notes.push('Discordancia con medicación registrada: confirmar si tomaba sacubitrilo/valsartán al obtener la muestra.');
 if(Object.values(factors).includes('unknown'))notes.push('Hay factores modificadores sin evaluar.');
 if(known)notes.push('IC previamente conocida: el péptido no confirma ni revoca el diagnóstico previo.');
 const source={doi:SOURCE.doi,sections:'Diagnóstico de IC crónica, péptidos natriuréticos; figura 11 (IC descompensada)',version:'0.1'};
 let id='NP-00',title='Datos pendientes',text='Introduce el contexto asistencial y el resultado.';
 if(low!==null&&Number.isFinite(v)){
  if(v<low){id='NP-01';title='Por debajo del umbral de exclusión';text='Disminuye la sospecha, pero no descarta IC de forma aislada. Si la clínica persiste o hay factores que reducen el péptido, valorar ecocardiografía.';}
  else if(kind==='nt'&&context==='outpatient'&&v>2000){id='NP-04';title='NT-proBNP muy elevado';text='Si existe sospecha de IC, priorizar ecocardiografía y valoración especializada, preferiblemente en 2 semanas según la figura 4 de ESC 2026. La inestabilidad clínica requiere valoración urgente sin esperar ese plazo.';}
  else if(kind==='nt'&&context==='acute'&&v>5000){id='NP-05';title='NT-proBNP muy elevado en contexto agudo';text='Marcador de riesgo elevado. Priorizar valoración hospitalaria urgente; no demorar por pruebas programadas.';}
  else if(kind==='bnp'&&context==='outpatient'&&v>=35){id='NP-03';title='BNP que apoya la sospecha de IC';text='Alcanza el umbral orientativo de la figura 4; si existe sospecha clínica, realizar ecocardiografía y valoración especializada. No confirma IC de forma aislada.';}
  else if(high!==null&&(context==='acute'?v>high:v>=high)){id='NP-03';title='Resultado que apoya la sospecha de IC';text='Supera el umbral orientativo por edad. Requiere correlación clínica y confirmación objetiva.';}
  else {id='NP-02';title='Resultado no excluyente';text='No permite descartar IC ni confirmarla. Integrar clínica, factores modificadores y ecocardiografía cuando proceda.';}
  if(kind==='nt'&&context==='outpatient'&&age===75&&v>=250&&v<500){notes.push('A los 75 años la figura 4 utiliza el umbral orientativo de 500 pg/mL. Un resultado inferior no excluye IC si persiste sospecha.');}
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
 ['trv','Velocidad máxima de regurgitación tricuspídea','m/s'],['rwt','Grosor relativo de pared',''],['pasp','Presión arterial pulmonar sistólica estimada','mmHg']
];
export function setEcho(ctx,key,raw){
 const next={...(ctx.echo||{})};
 if(['sex','rhythm'].includes(key)){
  const allowed=key==='sex'?['female','male','unknown']:['sinus','af','unknown'];
  if(!allowed.includes(raw))return ctx;
  next[key]=raw;
 }else if(ECHO_FINDINGS.some(x=>x[0]===key)||key==='priorReduced'){
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
// ESC 2026 Table 10, final edition p. 5370. Quantitative supportive criteria,
// not a diagnostic score. Sex/rhythm refer to the measurement context and are never inferred.
export function echoSupportCriteria(ctx){
 const e=ctx.echo||{};
 const valid=v=>Number.isFinite(v)&&v>0;
 const metrics=[];
 const add=(id,label,state,detail)=>metrics.push({id,label,state,detail});
 if(valid(e.lvmi)){
  const threshold=e.sex==='female'?95:e.sex==='male'?115:null;
  add('lvmi','Masa VI indexada',threshold===null?'unknown':e.lvmi>=threshold?'support':'not-reached',threshold===null?'Falta sexo de referencia para interpretar la masa indexada.':'Umbral de tabla 10: ≥'+threshold+' g/m².');
 }
 if(valid(e.rwt))add('rwt','Grosor relativo de pared',e.rwt>0.42?'support':'not-reached','Umbral orientativo >0,42.');
 if(valid(e.lavi)){
  const threshold=e.rhythm==='sinus'?34:e.rhythm==='af'?40:null;
  add('lavi','Volumen auricular izquierdo indexado',threshold===null?'unknown':e.lavi>threshold?'support':'not-reached',threshold===null?'Falta ritmo durante la medición.':'Umbral de tabla 10: >'+threshold+' mL/m².');
 }
 if(valid(e.ee))add('ee','E/e′ medio en reposo',e.ee>9?'support':'not-reached',e.ee>=15?'≥15: mayor especificidad, menor sensibilidad.':'Umbral orientativo >9; requiere contexto.');
 if(valid(e.trv))add('trv','Velocidad de regurgitación tricuspídea',e.trv>2.8?'support':'not-reached','Umbral en reposo >2,8 m/s.');
 if(valid(e.pasp))add('pasp','Presión pulmonar sistólica estimada',e.pasp>35?'support':'not-reached','Umbral >35 mmHg; no determina etiología por sí solo.');
 return {metrics,source:{doi:SOURCE.doi,sections:'5.2.2, tabla 10, p.5370'},diagnosisEstablished:false};
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
 const support=echoSupportCriteria(ctx);
 for(const m of support.metrics)notes.push(m.label+': '+(m.state==='support'?'alcanza criterio de apoyo. ':m.state==='not-reached'?'no alcanza este umbral; no excluye IC. ':'interpretación pendiente. ')+m.detail);
 if(support.metrics.length)notes.push('Tabla 10 ESC 2026: estos hallazgos son datos de apoyo a valorar conjuntamente, no una puntuación diagnóstica. No sustituyen la atribución clínica ni establecen IC-FEp automáticamente.');
 if(Number.isFinite(e.tapse))notes.push('TAPSE registrado: interpretar función ventricular derecha con el informe completo; no es criterio de la tabla 10.');
 if(npRecorded&&np.id==='NP-01')notes.push('Péptido por debajo del umbral orientativo: no excluye IC aisladamente.');
 const npLabel=npRecorded?(np.kind==='nt'?'NT-proBNP':'BNP')+' '+np.value+' pg/mL · '+np.title:'Péptidos pendientes de interpretación.';
 let integratedTitle,integrated;
 if(known){integratedTitle='IC previamente diagnosticada';integrated='Conservar el diagnóstico referido y revisar fenotipo, evolución y hallazgos actuales.';}
 else if(clinical&&objective){integratedTitle='Sospecha de IC con hallazgos objetivos';integrated=ef!==null&&ef>=50&&!filling?'Con FEVI preservada, precisar evidencia de disfunción o presiones de llenado elevadas y atribución de los síntomas.':'Valorar si las alteraciones cardiacas explican el cuadro clínico; los datos no confirman automáticamente IC.';}
 else if(objective){integratedTitle='Alteración cardiaca registrada';integrated='Aclarar clínica actual y previa y atribución de los hallazgos; no asignar estadio ni diagnosticar IC por ecocardiografía aislada.';}
 else if(clinical){integratedTitle='Sospecha clínica pendiente de confirmación';integrated='La FEVI preservada o los datos ecocardiográficos ausentes no excluyen IC. Completar estudio si persiste sospecha.';}
 else {integratedTitle='Información insuficiente para concluir IC';integrated='Revisar antecedentes, síntomas y pruebas disponibles; no asumir normalidad ni excluir IC.';}
 const urgent=np.urgent;
 return {ef,prior,title,phenotype,trajectory,positive,unknown,notes,support,integratedTitle,integrated,npLabel,clinicalTitle:s.title,safety:s.safety,urgent,next:urgent?'descompensada':'clasificacion',source:{doi:SOURCE.doi,sections:'Clasificación por FEVI y diagnóstico de IC; adaptación educativa',version:'0.1'}};
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
 const conflict=e.priorReduced==='no'&&(priorReduced||a.priorClinical==='yes')||st.contradictions.length>0;
 const clinicalHF=['C','D'].includes(st.stage)&&!conflict;
 const current=ef===null?'pending':ef<50?'reduced':'preserved';
 const titleCurrent=ef===null?'FEVI pendiente':ef<50?'FEVI reducida':'FEVI preservada';
 const priorClinical=a.priorClinical||'unknown',diastolic=a.diastolicEvidence||'unknown';
 // ESC 2026 §3.3.1 p.16: absolute gain >=10 percentage points, current LVEF >40%; clinical HF history required.
 const trajectoryPattern=delta!==null&&prior<50&&delta>=10&&ef>40;
 const improved=clinicalHF&&priorClinical==='yes'&&trajectoryPattern&&!conflict;
 const notes=[];
 if(delta!==null)notes.push('FEVI previa '+prior+'%; actual '+ef+'%; variación '+(delta>0?'+':'')+delta+' puntos porcentuales.');
 if(priorReduced)notes.push('Antecedente de FEVI inferior al 50%; no corresponde etiquetar IC-FEp de novo.');
 if(trajectoryPattern)notes.push('La variación cumple el patrón cuantitativo de FEVI mejorada de ESC 2026, apartado 3.3.1. Requiere contexto de IC clínica previa con FEVI reducida.');
 if(priorClinical==='yes'&&!priorReduced)notes.push('Antecedente de IC con FEVI reducida referido; completar las mediciones previas.');
 if(improved)notes.push('La mejoría de FEVI no equivale a resolución de la IC ni justifica retirar tratamiento por sí sola.');
 if(ef!==null&&ef>=50&&!priorReduced&&!historicalNo)notes.push('No consta una revisión suficiente de FEVI histórica; no asignar IC-FEp de novo.');
 if(ef!==null&&ef>=50&&diastolic!=='yes')notes.push('Precisar evidencia objetiva de disfunción diastólica o presiones de llenado elevadas y revisar los péptidos. No se diagnostica IC-FEp por FEVI aislada.');
 if(st.contradictions.length)notes.push(...st.contradictions);
 if(e.priorReduced==='no'&&(priorReduced||priorClinical==='yes'))notes.push('Discordancia entre FEVI histórica, IC previa con FEVI reducida y respuesta sobre reducción previa.');
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
 return {ef,prior,delta,current,clinicalHF,priorReduced,historicalNo,conflict,code,title,short,text,trajectory,trajectoryPattern,improved,notes,urgent:r.urgent,safety:r.safety,stage:st.stage,source:{doi:SOURCE.doi,sections:'3.3.1; 5.2.1–5.2.2; tabla 10',version:'0.1'}};
}

/* NYHA: clinician-selected limitation attributable to established clinical HF.
 * No inference from EF, signs alone, stage D or acute clinical status. */
export const NYHA_OPTIONS=[
 ['I','Sin limitación','La actividad física habitual no provoca síntomas de IC.'],
 ['II','Limitación leve','Sin síntomas en reposo; la actividad habitual provoca síntomas de IC.'],
 ['III','Limitación marcada','Sin síntomas en reposo; esfuerzos menores de lo habitual provocan síntomas de IC.'],
 ['IV','Limitación con cualquier actividad','No puede realizar actividad física sin malestar atribuible a IC. Puede presentar síntomas en reposo; cualquier actividad aumenta el malestar.'],
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
 'Metoprolol succinato':['11,88','23,75','47,5','95','190'],
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
// Limited interaction classification for exact active ingredients, not prescribing catalog.
// ATC C09AA/C09CA and ESC 2026 S4. Do not infer identity from a suffix or a brand fragment.
// Recognise slash/plus-separated active ingredients, but no dosing for combination products.
const EXTRA_INTERACTION_NAMES={
 arni:['entresto','neparvis'],
 ieca:['captopril','lisinopril','perindopril','trandolapril','fosinopril','quinapril','benazepril','cilazapril','delapril','imidapril','moexipril','spirapril','zofenopril'],
 ara:['losartan','irbesartan','telmisartan','olmesartan','olmesartan medoxomilo','eprosartan','azilsartan','azilsartan medoxomilo']
};
function interactionFamilies(m){
 const name=normalizeMedication(namedMedication(m));
 if(!name)return [];
 const names=new Set([name]);
 if(name==='sacubitrilo/valsartan'||EXTRA_INTERACTION_NAMES.arni.includes(name))return ['arni'];
 for(const n of name.split(/\s*[+/]\s*/))if(n)names.add(n);
 return MEDICATION_FAMILIES.filter(([id,,drugs])=>[...drugs.map(normalizeMedication),...(EXTRA_INTERACTION_NAMES[id]||[])].some(n=>names.has(n))).map(([id])=>id);
}
export function medicationFamilyLabel(m){
 const families=interactionFamilies(m);
 return families.length?MEDICATION_FAMILIES.filter(([id])=>families.includes(id)).map(g=>g[1]).join(' + ')+(m.drug==='other'?' · revisar presentación':''):'Familia sin clasificar';
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
 'Sacubitrilo/valsartán':{f:['12'],max:194,max2:206,source:cima('90716')},
 'Enalapril':{f:['12','24'],max:40,source:cima('83712')},
 'Ramipril':{f:['12','24'],max:10,source:cima('76966'),note:'En IC sintomática se recomiendan dos tomas; el inicio puede ser en una toma.'},
 'Candesartán':{f:['24'],max:32,source:cima('74643')},
 'Valsartán':{f:['12'],max:320,source:cima('72856','ft_72856.html')},
 'Bisoprolol':{f:['24'],max:10,source:cima('81432')},
 'Carvedilol':{f:['12'],max:100,source:cima('66923','FichaTecnica_66923.html'),note:'Más de 50 mg/día exige comprobar peso >85 kg y ausencia de IC grave.'},
 'Metoprolol succinato':{f:['24'],max:190,source:cima('81030'),note:'Referencia Metoprolol Krka Retard; no extrapolar a otras presentaciones. Expresar mg de succinato.'},
 'Nebivolol':{f:['24'],max:10,source:cima('83604')},
 'Espironolactona':{f:['24','48'],reference:50,source:cima('39059')},
 'Eplerenona':{f:['24','48'],max:50,source:cima('76182')},
 'Finerenona':{f:['24'],max:40,source:cima('1211616012'),note:'Dosis objetivo en IC según FG al inicio; no extrapolar la dosis de ERC-DM2.'},
 'Dapagliflozina':{f:['24'],reference:10,source:cima('90837')},
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
 const add=(id,level,title,text,source,rows=[])=>alerts.push({id,level,title,text,source,rows:[...new Set(rows)]});
 const entries=m.active.map(row=>({row,drug:knownDrug(row)})),has=drug=>entries.some(x=>x.drug===drug);
 const family=id=>entries.filter(x=>interactionFamilies(x.row).includes(id));
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
 // Audit P0/P4: limited exact-name matching, not a medication dictionary.
 const namedAs=(aliases)=>entries.filter(x=>{const name=normalizeMedication(namedMedication(x.row));return aliases.includes(name)||name.split(/\s*[+/]\s*/).some(part=>aliases.includes(part));});
 const tmp=namedAs(['trimetoprim','trimetoprima','cotrimoxazol','co-trimoxazol','trimetoprim/sulfametoxazol','trimetoprima/sulfametoxazol','sulfametoxazol/trimetoprim','sulfametoxazol/trimetoprima','septrin','septrin forte','soltrim']);
 const escSupplement='https://doi.org/10.1093/eurheartj/ehag100';
 const bb=family('bb'),sglt2=family('sglt2'),loop=family('diuretic'),raas=[...arni,...ieca,...ara];
 const nsaid=namedAs(['ibuprofeno','naproxeno','diclofenaco','dexketoprofeno','ketoprofeno','indometacina','celecoxib','etoricoxib','meloxicam','piroxicam','aceclofenaco','ketorolaco']);
 const kSparing=namedAs(['amilorida','triamtereno','hidroclorotiazida/amilorida','amilorida/hidroclorotiazida','furosemida/amilorida','amilorida/furosemida']);
 const kSupp=namedAs(['cloruro de potasio','citrato de potasio','bicarbonato de potasio','suplemento de potasio','sal rica en potasio']);
 const rateBlock=namedAs(['verapamilo','diltiazem']);
 const otherRate=namedAs(['digoxina','amiodarona','ivabradina']);
 const thiazide=namedAs(['hidroclorotiazida','clortalidona','indapamida','metolazona','bendroflumetiazida']);
 const hypoglycemic=namedAs(['insulina','insulina glargina','insulina degludec','insulina detemir','insulina lispro','insulina aspart','insulina humana','gliclazida','glimepirida','glibenclamida','glipizida']);
 const kidneyRisk=[...raas,...mra,...loop];
 if(kidneyRisk.length&&nsaid.length)add('ESC-NSAID','amber','AINE y tratamiento de IC','ESC 2026, tablas S4, S5, S7 y S8: revisar necesidad del AINE; riesgo de deterioro renal, hiperpotasemia o menor respuesta diurética según el tratamiento. No se incluye AAS a dosis antiagregante en esta regla.',escSupplement,ids([...kidneyRisk,...nsaid]));
 if(raas.length&&tmp.length)add('ESC-SRAA-TMP','amber','Inhibición SRAA + trimetoprim/cotrimoxazol','ESC 2026, S4–S5: riesgo de hiperpotasemia; revisar asociación, función renal y K.',escSupplement,ids([...raas,...tmp]));
 if(raas.length&&(kSparing.length||kSupp.length))add('ESC-SRAA-K','amber','Inhibición SRAA + agente que eleva potasio','ESC 2026, S4–S5: comprobar necesidad, potasio y función renal; no suspender automáticamente.',escSupplement,ids([...raas,...kSparing,...kSupp]));
 if(mra.length&&(kSparing.length||kSupp.length))add('ESC-MRA-K','amber','ARM + otro agente que eleva potasio','ESC 2026, S8: evitar otros ahorradores de potasio y revisar suplementos; comprobar contraindicaciones de la ficha específica y K/FG.',escSupplement,ids([...mra,...kSparing,...kSupp]));
 if(ieca.length&&ara.length&&mra.length)add('ESC-TRIPLE-SRAA','amber','Triple bloqueo del SRAA','ESC 2026, S8: no se recomienda asociar IECA, ARA-II y ARM; revisar la combinación. La alerta específica de eplerenona prevalece si procede.',escSupplement,ids([...ieca,...ara,...mra]));
 if(bb.length&&rateBlock.length)add('ESC-BB-NDHP','amber','Betabloqueante + verapamilo/diltiazem','ESC 2026, S6: riesgo de bradicardia o bloqueo AV; los calcioantagonistas no dihidropiridínicos pueden ser perjudiciales en IC-FEr. Revisar ECG, indicación y tratamiento.',escSupplement,ids([...bb,...rateBlock]));
 if(bb.length&&otherRate.length)add('ESC-BB-RATE',d.values.hr!==null&&d.values.hr<50?'amber':'blue','Betabloqueante + otro cronotropo negativo','ESC 2026, S6: comprobar indicación, síntomas, frecuencia y conducción AV. La combinación puede ser pertinente en casos seleccionados; no implica incompatibilidad automática.',escSupplement,ids([...bb,...otherRate]));
 if(sglt2.length&&(loop.length||thiazide.length))add('ESC-SGLT2-DIUR','blue','iSGLT2 + diurético: vigilar volemia','ESC 2026, S9: monitorizar congestión, depleción de volumen, PA y función renal; valorar dosis diurética según volemia. Combinación habitual, no contraindicación automática.',escSupplement,ids([...sglt2,...loop,...thiazide]));
 if(sglt2.length&&hypoglycemic.length)add('ESC-SGLT2-HYPO','blue','iSGLT2 + tratamiento con riesgo de hipoglucemia','ESC 2026, S9: vigilar glucemia y revisar tratamiento antidiabético si procede; no reducir automáticamente insulina por riesgo de cetoacidosis.',escSupplement,ids([...sglt2,...hypoglycemic]));
 if(loop.length&&thiazide.length)add('ESC-DIUR-COMB','amber','Diurético de asa + tiazida o afín','ESC 2026, S7: comprobar indicación, duración y monitorización de volemia, sodio, potasio y función renal. Puede ser apropiado ante resistencia diurética.',escSupplement,ids([...loop,...thiazide]));
 if(bb.length&&d.values.hr!==null&&d.values.hr<50)add('ESC-BB-HR','amber','Betabloqueante: FC inferior a 50 lpm','ESC 2026, S6: valorar síntomas, ECG, conducción y otros cronotropos; no retirar bruscamente salvo necesidad clínica.',escSupplement,ids(bb));
 const spiro=entries.filter(x=>x.drug==='Espironolactona'),fin=entries.filter(x=>x.drug==='Finerenona'),epl=entries.filter(x=>x.drug==='Eplerenona');
 if(epl.length&&kSparing.length)add('EPL-KSP','red','Eplerenona + ahorrador de potasio','Combinación contraindicada en ficha técnica; verificar principios activos y revisar de inmediato.',eplSource,ids([...epl,...kSparing]));
 if(epl.length&&kSupp.length)add('EPL-KSUP','red','Eplerenona + suplemento de potasio','La ficha técnica indica no asociarlos; comprobar medicación y potasio.',eplSource,ids([...epl,...kSupp]));
 if(fin.length&&kSparing.length)add('FIN-KSP','red','Finerenona + ahorrador de potasio','Asociación no permitida según ficha; revisar tratamiento.',refDrug('Finerenona'),ids([...fin,...kSparing]));
 const inducer=namedAs(['rifampicina','carbamazepina','fenitoina','fenobarbital','hierba de san juan','hiperico']);
 if(fin.length&&inducer.length)add('FIN-IND','red','Finerenona + inductor CYP3A4','La ficha indica no asociar inductores fuertes o moderados de CYP3A4; confirmar fármaco.',refDrug('Finerenona'),ids([...fin,...inducer]));
 if(epl.length&&inducer.length)add('EPL-IND','amber','Eplerenona + inductor CYP3A4','Asociación con inductores potentes no recomendada; revisar ficha e indicación.',eplSource,ids([...epl,...inducer]));
 const cypModerate=namedAs(['amiodarona','verapamilo','diltiazem','fluconazol','eritromicina']);
 if(epl.length&&cypModerate.length)add('EPL-MOD','amber','Eplerenona + inhibidor CYP3A4 leve/moderado','Comprobar interacción y dosis: máximo 25 mg/día con inhibidores leves/moderados según ficha.',eplSource,ids([...epl,...cypModerate]));
 const lithium=namedAs(['litio','carbonato de litio']),calcineurin=namedAs(['ciclosporina','tacrolimus']);
 if(epl.length&&(lithium.length||calcineurin.length))add('EPL-LI-CNI','amber','Eplerenona: litio o inhibidor de calcineurina','Evitar según ficha; si asociación imprescindible, monitorización específica de litio o K/función renal.',eplSource,ids([...epl,...lithium,...calcineurin]));
 if(tmp.length&&spiro.length)add('SPI-TMP','amber','Espironolactona + trimetoprim/cotrimoxazol','Riesgo de hiperpotasemia clínicamente relevante. Revisar la asociación y comprobar potasio y función renal. No implica suspensión automática.','https://cima.aemps.es/cima/dochtml/ft/81033/FichaTecnica_81033.html',ids([...spiro,...tmp]));
 if(tmp.length&&fin.length)add('FIN-TMP','amber','Finerenona + trimetoprim/cotrimoxazol','Revisar potasio y necesidad de interrupción temporal según ficha técnica; no modificar automáticamente.',HF_MEDICATION_REFERENCE.Finerenona.source,ids([...fin,...tmp]));
 if(tmp.length&&epl.length)add('EPL-TMP','amber','Eplerenona + trimetoprim/cotrimoxazol','Riesgo de hiperpotasemia. Revisar asociación y monitorizar potasio y función renal.','https://cima.aemps.es/cima/dochtml/ft/76353/FT_76353.html',ids([...epl,...tmp]));
 const cyp=namedAs(['itraconazol','ketoconazol','ritonavir','nelfinavir','cobicistat','claritromicina','telitromicina','nefazodona']);
 if(fin.length&&cyp.length)add('FIN-CYP3A4','red','Finerenona: inhibidor fuerte de CYP3A4','Asociación contraindicada en ficha técnica. Confirmar principio activo y revisar tratamiento.',HF_MEDICATION_REFERENCE.Finerenona.source,ids([...fin,...cyp]));
 if(epl.length&&cyp.length)add('EPL-CYP3A4','red','Eplerenona: posible inhibidor fuerte de CYP3A4','Revisar el principio activo y la contraindicación de asociación con inhibidores potentes del CYP3A4.','https://cima.aemps.es/cima/dochtml/ft/76353/FT_76353.html',ids([...epl,...cyp]));
 const aliskiren=namedAs(['aliskireno','aliskiren','rasilez']);
 if((ieca.length||ara.length)&&aliskiren.length){
  const contraindicated=ctx.findings?.dm==='yes'||(d.labsConfirmed&&d.values.egfr<60);
  add('SRAA-ALISK',contraindicated?'red':'amber','IECA/ARA-II + aliskireno','Contraindicado con diabetes o FG <60 según fichas; en otros casos bloqueo dual no recomendado. Comprobar ambos criterios.',refDrug('Ramipril'),ids([...ieca,...ara,...aliskiren]));
 }
 if(arni.length&&aliskiren.length){
  const contraindicated=ctx.findings?.dm==='yes'||(d.labsConfirmed&&d.values.egfr<60);
  add('ARNI-ALISK',contraindicated?'red':'amber',contraindicated?'ARNI + aliskireno: combinación contraindicada':'ARNI + aliskireno: combinación no recomendada','Contraindicada si existe diabetes o FG estimado inferior a 60. Comprobar ambos criterios y la medicación registrada.',arniSource,ids([...arni,...aliskiren]));
 }
 if(spiro.length&&d.labsConfirmed){
  const source=HF_MEDICATION_REFERENCE.Espironolactona.source;
  if(d.values.potassium>=6)add('SPI-K6','red','Espironolactona: hiperpotasemia importante','Potasio confirmado de 6 mmol/L o superior: priorizar valoración clínica urgente y revisión de medicación.',source,ids(spiro));
  else if(d.values.potassium>5)add('SPI-K5','amber','Espironolactona: revisar potasio','La ficha técnica de referencia exige revisar la continuidad con potasio superior a 5 mmol/L. Confirmar presentación, contexto clínico y medidas de manejo; no suspender automáticamente.',source,ids(spiro));
 }
 if(has('Eplerenona')&&d.labsConfirmed){
  if(d.values.egfr<30)add('EPL-FG','red','Eplerenona: revisar función renal','FG estimado inferior a 30 mL/min/1,73 m². Verificar aclaramiento de creatinina, criterio de la ficha técnica, y revisar tratamiento.',eplSource,ids(mra));
  if(d.values.potassium>=6)add('EPL-K6','red','Eplerenona: hiperpotasemia importante','Potasio confirmado ≥6 mmol/L. Priorizar valoración clínica urgente y revisión de medicación.',eplSource,ids(mra));
  else if(d.values.potassium>=5.5)add('EPL-K55','amber','Eplerenona: potasio elevado','Potasio confirmado entre 5,5 y <6 mmol/L: tabla 1 de ficha indica bajar un escalón (50/día a 25/día; 25/día a 25 en días alternos; 25 en días alternos a interrupción). Confirmar pauta, función renal y presentación antes de decidir.',eplSource,ids(mra));
 }
 if(has('Finerenona')&&d.labsConfirmed){
  const source=HF_MEDICATION_REFERENCE.Finerenona.source;
  if(d.values.potassium>=6)add('FIN-K6','red','Finerenona: hiperpotasemia importante','Potasio ≥6 mmol/L: valoración urgente y revisión de tratamiento.',source,ids(mra));
  else if(d.values.potassium>=5.5)add('FIN-K55','amber','Finerenona: potasio elevado','Confirmar indicación: para IC FEVI ≥40, tabla 4 de ficha indica interrumpir si 10 mg/día, reducir a 10 si 20 mg/día o a 20 si 40 mg/día. ERC-DM2 tiene otra tabla. Confirmar pauta y evolución renal; no aplicar automáticamente.',source,ids(mra));
  if(d.values.egfr<15)add('FIN-FG15','red','Finerenona: función renal muy reducida','TFGe <15: la ficha indica interrumpir el tratamiento al progresar a enfermedad renal terminal; confirmar resultado y revisar con el equipo clínico.',source,ids(mra));
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
// Product-specific reference schedules; not eligibility or a prescription.
// ESC 2026 supplement S6/S9; CIMA 4.1–4.4, reviewed 2026-11-28.
export const HF_TITRATION_REFERENCE={
 'Sacubitrilo/valsartán':{product:'Sacubitrilo/valsartán Kern Pharma',source:refDrug('Sacubitrilo/valsartán'),frequency:'12',steps:['24/26','49/51','97/103'],target:'97/103',checks:'Inicio habitual 49/51 mg/12 h; 24/26 si sin IECA/ARA-II previo o dosis baja, considerar también PAS 100–110 y disfunción renal/hepática según ficha. Titular cada 2–4 semanas (3–4 con inicio bajo por ausencia/dosis baja de IECA/ARA-II). No iniciar con PAS <100 o K >5,4. Evitar solapamiento con ARA-II; separación mínima de 36 h respecto a IECA en ambos sentidos. Revisar angioedema, embarazo, estenosis renal, Child-Pugh y aliskireno. No extrapolar la ficha a otros productos.'},
 'Enalapril':{product:'Enalapril Aurovitas',source:refDrug('Enalapril'),frequency:'12/24',steps:[2.5,5,10,20],target:20,maxDaily:40,checks:'Dosis de referencia en ficha para IC sintomática: 2,5 mg/día inicialmente bajo estrecha supervisión; escalado a 5, 10 y 20 mg/día durante 2–4 semanas según tolerancia; 40 mg/día máximo en dos tomas. La tabla S4 ESC usa inicio 2,5 mg/12 h; no confundir ambas pautas. Revisar aclaramiento, PA, K, embarazo, angioedema e interacciones; no escalar sin control analítico.'},
 'Ramipril':{product:'Ramipril Alter',source:refDrug('Ramipril'),frequency:'12/24',steps:[1.25,2.5,5,10],target:10,maxDaily:10,checks:'IC sintomática estabilizada con diurético: 1,25 mg/día de inicio; duplicación cada 1–2 semanas según tolerancia, preferentemente dos tomas. Máximo diario 5 mg con CrCl 10–<60; máximo 2,5 mg/día en hepatopatía bajo supervisión. No confundir con pauta posinfarto ni con TFGe. Revisar PA, K, embarazo y angioedema.'},
 'Candesartán':{product:'Candesartán STADA',source:refDrug('Candesartán'),frequency:'24',steps:[4,8,16,32],days:[14,14,14],target:32,checks:'Ficha IC con FEVI ≤40 y criterios específicos de intolerancia a IECA o terapia adicional. Duplicar a intervalos ≥2 semanas según tolerancia. Revisar función renal/K, PA, embarazo, hepatopatía grave/colestasis y evitar triple bloqueo. No extrapolar indicación de HTA a IC.'},
 'Valsartán':{product:'Valsartán STADA',source:refDrug('Valsartán'),frequency:'12',steps:[40,80,160],days:[14,14],target:160,checks:'IC sintomática con criterios de indicación de ficha: inicio 40 mg/12 h, duplicación a intervalos ≥2 semanas. Máximo 320 mg/día dividido; hepatopatía leve/moderada sin colestasis máximo 80 mg/día, grave o colestasis contraindicado. Verificar CrCl, PA, K, embarazo y asociación con IECA. Pauta posinfarto distinta.'},
 'Espironolactona':{product:'Aldactone',source:refDrug('Espironolactona'),frequency:'24/48',steps:[25,50],target:50,checks:'Indicación IC NYHA III–IV y criterios de creatinina y potasio de ficha; 25 mg/día, hasta 50 si indicado o 25 en días alternos si intolerancia. La ficha desaconseja NYHA I–II y contiene discrepancia entre posología y contraindicación renal moderada: revisar presentación antes de decidir. S8 ESC no sustituye ficha. Control K/creatinina a la semana, mensual tres meses, trimestral un año y luego semestral; ficha exige interrupción con K >5 o creatinina >4 mg/dL.'},
 'Eplerenona':{product:'Eplerenona STADA',source:refDrug('Eplerenona'),frequency:'24/48',steps:[25,50],target:50,checks:'IC crónica NYHA II con FEVI ≤30 o posinfarto reciente estable con FEVI ≤40 y signos IC. Inicio 25 mg/día y objetivo 50 preferiblemente en 4 semanas; CrCl 30–60: inicio 25 mg en días alternos. Contraindicado FG <30, K inicial >5, Child-Pugh C, otros ahorradores de K, inhibidores fuertes CYP3A4 y triple bloqueo. Inhibidores leves/moderados CYP3A4: máximo 25 mg/día. Control K basal, semana 1 y mes 1 después de inicio o ajuste.'},
 'Finerenona':{product:'Kerendia',source:refDrug('Finerenona'),frequency:'24',steps:[10,20,40],target:'20 o 40 según TFGe inicial',checks:'IC FEVI ≥40: K inicial ≤5, TFGe ≥25. CIMA tabla 3: 10 mg/día con TFGe inicial 25–<60, 20 mg con ≥60; objetivo 20 o 40 respectivamente. S8 usa ≤60/>60: discrepancia explícita en 60; usar ficha para posología autorizada. Tabla 4 de IC distinta de ERC-DM2. K/FG a las 4 semanas tras inicio/reinicio/ajuste. No iniciar con hepatopatía grave; revisar Addison, CYP3A4 y otros ARM/ahorradores de K. Continuación con FG ≥15 bajo ajuste; interrumpir si <15.'},
 'Furosemida':{product:'Seguril',source:refDrug('Furosemida'),frequency:'individualizada',steps:[],target:null,checks:'Edema asociado a IC; ficha oral 20–80 mg/día de inicio, ajustar al mínimo eficaz. No hay objetivo fijo modificador del pronóstico. S7: evaluar congestión, peso seco, PA, Na/K/Mg, función renal y respuesta; control analítico 1–2 semanas tras inicio/aumento. Reducción si hipovolemia o sin congestión según revisión. No extrapolar dosis oral a intravenosa.'},
 'Torasemida':{product:'Isodiur',source:refDrug('Torasemida'),frequency:'24',steps:[],target:null,checks:'Edema por IC: ficha 10–20 mg/día de inicio y ajuste por respuesta (S7 ESC 5–10 mg de inicio). No asumir equivalencia fija con furosemida ni objetivo universal. Revisar volemia, sodio, potasio, función renal, PA y anuria; control tras ajustes. No extrapolar HTA ni cirrosis a IC.'},
 'Bisoprolol':{product:'Bisoprolol Pensa',source:refDrug('Bisoprolol'),frequency:'24',steps:[1.25,2.5,3.75,5,7.5,10],days:[7,7,7,28,28],target:10,checks:'IC estable con disfunción sistólica; comprobar ECG, síntomas, PA/FC, estabilidad, función renal y hepática. Evitar retirada brusca; reevaluar reintroducción cuando esté estable.'},
 'Carvedilol':{product:'Carvedilol Teva',source:refDrug('Carvedilol'),frequency:'12',steps:[3.125,6.25,12.5,25],days:[14,14,14],target:25,checks:'Confirmar indicación y presentación, peso, estabilidad, PA/FC, ritmo, función renal y ausencia de hepatopatía clínicamente manifiesta; con alimentos en IC. Incremento a 50 mg por toma solo tras comprobar peso >85 kg, IC no grave y supervisión médica. Si interrupción >2 semanas, esta ficha prevé reiniciar en 3,125 mg/12 h bajo supervisión; otras presentaciones difieren.'},
 'Metoprolol succinato':{product:'Metoprolol Krka Retard',source:refDrug('Metoprolol succinato'),frequency:'24',steps:[11.88,23.75,47.5,95,190],days:[7,14,14,14],target:190,checks:'Confirmar producto de liberación prolongada con indicación IC y dosis expresada en succinato. Inicio de referencia NYHA II: 23,75 mg; III–IV: 11,88 mg, IV con especialista. Estabilidad sin IC aguda 6 semanas y tratamiento basal estable 2 semanas al inicio. Verificar PA, ECG, función hepática y tolerancia; no fraccionar presentaciones sin autorización.'},
 'Nebivolol':{product:'Insucor',source:refDrug('Nebivolol'),frequency:'24',steps:[1.25,2.5,5,10],days:[7,7,7],target:10,checks:'Indicación IC estable leve/moderada a partir de 70 años. Al inicio, sin IC aguda 6 semanas y tratamiento concomitante estable 2 semanas. Escalones cada 1–2 semanas y supervisión médica al menos 2 h al inicio y cada aumento. Verificar hepatopatía y función renal.'},
 'Dapagliflozina':{product:'Dapagliflozina Mabo',source:refDrug('Dapagliflozina'),frequency:'24',steps:[10],target:10,minInitiationEgfr:25,checks:'No iniciar con TFG <25 según ficha. Dosis habitual IC 10 mg/día; hepatopatía grave: inicio de referencia 5 mg/día y valorar 10 si se tolera. Evaluar DM1, cetoacidosis, hipovolemia, embarazo y demás precauciones.'},
 'Empagliflozina':{product:'Empagliflozina Tecnigen',source:refDrug('Empagliflozina'),frequency:'24',steps:[10],target:10,minInitiationEgfr:20,checks:'No iniciar con TFGe <20 según ficha; 10 mg/día en IC. 25 mg/día no es una titulación de IC. Evaluar DM1, cetoacidosis, hipovolemia, embarazo y demás precauciones.'}
};
export function betaBlockerReferenceStep(m){
 const ref=HF_TITRATION_REFERENCE[m?.drug];
 if(!ref?.days||m.frequency!==ref.frequency)return null;
 let dose=mgNumber(m.dose);
 // Existing 11.875 mg records represent half of the 23.75 mg tablet; the referenced FT rounds to 11.88.
 if(m.drug==='Metoprolol succinato'&&dose===11.875)dose=11.88;
 const i=ref.steps.indexOf(dose);
 return i<0||i===ref.steps.length-1?null:{from:dose,to:ref.steps[i+1],minDays:ref.days[i],frequency:ref.frequency,source:ref.source,product:ref.product,checks:ref.checks};
}
// A bounded reference table, not a patient-specific order. Explicit indication is required.
// Missing longitudinal data must never generate a positive escalation decision.
export function armPotassiumReference({drug,indication,potassium,dose,frequency,confirmed}={}){
 if(!confirmed||!Number.isFinite(potassium)||potassium<0)return null;
 const n=mgNumber(dose);
 if(drug==='Eplerenona'&&indication==='hf'){
  if(potassium>=6)return {kind:'interrupt',reference:'Interrumpir según tabla 1; valorar de forma urgente. Reinicio de referencia 25 mg en días alternos si K <5,0, tras revisión clínica.',source:refDrug(drug)};
  const key=n+'/'+frequency,down={'50/24':'25 mg cada 24 h','25/24':'25 mg en días alternos','25/48':'interrupción'};
  if(potassium>=5.5)return {kind:'review',reference:down[key]?'Tabla 1: escalón inferior de referencia: '+down[key]+'. Verificar elegibilidad.':'Confirmar pauta antes de aplicar tabla 1.',source:refDrug(drug)};
  return {kind:'review',reference:potassium>=5?'Tabla 1: mantenimiento por criterio de K; revisar función renal y otras condiciones.':'Tabla 1 permite valorar aumento por K; falta comprobar función renal, dosis, intervalo y demás criterios.',source:refDrug(drug)};
 }
 if(drug==='Finerenona'&&indication==='hf40'){
  if(potassium>=6)return {kind:'interrupt',reference:'Tabla 4: interrupción; reinicio de referencia 10 mg/día tras K <5,5 o <5,0 si elevación repetida ≥5,5, y revisión clínica.',source:refDrug(drug)};
  const down={10:'interrupción; revisar reinicio con 10 mg/día cuando K <5,5',20:'10 mg/día',40:'20 mg/día'};
  if(potassium>=5.5)return {kind:'review',reference:frequency==='24'&&down[n]?'Tabla 4: '+down[n]+'. Confirmar pauta y función renal.':'Confirmar pauta antes de aplicar tabla 4.',source:refDrug(drug)};
  return {kind:'review',reference:'Tabla 4: revisar K, dosis actual, TFGe inicial y cambio respecto a la previa; sin datos longitudinales no se propone aumento.',source:refDrug(drug)};
 }
 if(drug==='Espironolactona'&&indication==='aldactone-hf'&&potassium>5)return {kind:'review',reference:'Ficha Aldactone 4.4: interrupción temporal o definitiva por K >5. Contrastar la presentación y la discrepancia con S8 ESC.',source:refDrug(drug)};
 return null;
}
const sglt2Interruption='Ante sospecha/diagnóstico de cetoacidosis, interrumpir y evaluar de inmediato; no reiniciar tras CAD salvo desencadenante identificado y resuelto. En cirugía mayor o enfermedad aguda grave hospitalizada, interrupción temporal, cetonas preferentemente en sangre y reinicio solo cuando sean normales y el paciente esté estable. La duración de la interrupción no basta.';

export function treatmentProposal(ctx){
 const d=treatmentSafetyData(ctx),r=d.profile,m=medicationSummary(ctx),alerts=medicationSafety(ctx);
 const actions=[],blockers=[],urgent=[];
 const {sbp,hr,egfr,potassium}=d.values;
 const lowPressure=sbp!==null&&sbp>=90&&sbp<100;
 const push=(kind,title,detail,check,source=HF_GUIDE)=>{
  // Low BP in a recorded stable patient is a review context, not a blanket contraindication.
  // No start/up-titration/switch is proposed before symptoms, perfusion and treatment are checked.
  if(lowPressure&&['start','titrate','switch'].includes(kind)){
   actions.push({kind:'review',title,detail:'Referencia condicionada: '+detail,check:'PAS 90–99 mmHg: confirmar síntomas y perfusión, y revisar el tratamiento antes de decidir. '+check,source});
  }else actions.push({kind,title,detail,check,source});
 };
 if(r.urgent)urgent.push('La situación clínica registrada requiere valoración urgente.');
 if(Number.isFinite(potassium)&&potassium>=6)urgent.push('Potasio registrado ≥6 mmol/L: valoración clínica urgente, ECG y confirmación según contexto, aunque falte marcar la confirmación analítica; no esperar a optimizar tratamiento.');
 if(alerts.some(a=>a.level==='red'))blockers.push('Resolver las alertas rojas y comprobar la medicación real.');
 if(alerts.some(a=>a.level==='amber'))blockers.push('Revisar las alertas de dosis, frecuencia o interacción antes de plantear cambios.');
 if(r.next.kind==='advanced')blockers.push('Valorar IC avanzada con el equipo especializado.');
 else if(r.next.kind!=='treatment'||!r.clinicalHF||!Number.isFinite(r.ef))blockers.push('Completar clasificación y confirmar IC clínica.');
 if(r.situation!=='compensated')blockers.push('Confirmar estabilidad sin congestión antes de optimizar el tratamiento crónico. Si hay congestión, valorar diuresis y gravedad.');
 if(d.missing.length||!d.labsConfirmed||d.pressureDiscordant)blockers.push('Completar constantes y confirmar función renal y potasio vigentes.');
 if(sbp!==null&&sbp<90)blockers.push('PAS inferior a 90 mmHg: confirmar medida, síntomas y perfusión antes de intensificar; si hay inestabilidad o hipoperfusión, priorizar atención urgente.');
 if(hr!==null&&hr<50)blockers.push('FC inferior a 50 lpm: revisar ritmo, síntomas y fármacos cronotropos antes de intensificar. Umbral conservador del prototipo; no implica suspender automáticamente.');
 if(d.labsConfirmed&&(potassium>=5.5||potassium<3.5))blockers.push('Potasio fuera del margen conservador del prototipo: revisar causas y tratamiento.');
 if(!m.reconciled)blockers.push('Confirmar lista completa, pautas y clasificación de los medicamentos; resolver duplicidades.');
 if(m.active.some(x=>x.drug==='other'||x.frequency==='other'||x.tolerance==='problem'))blockers.push('Revisión individual de pauta libre, medicamento fuera del catálogo o intolerancia registrada; la cobertura de interacciones no es completa.');
 if(r.nyha==='IV')blockers.push('NYHA IV: evaluación especializada antes de la intensificación ambulatoria.');
 const result=(status)=>({status,profile:r,values:d.values,actions,blockers,urgent,alerts,source:HF_GUIDE});
 if(urgent.length||blockers.length)return result(urgent.length?'urgent':'review');
 // The remaining output consists of conditional options, never orders. Each action states checks not automated.
 const member=id=>m.familyStatus.find(x=>x.id===id)?.members||[];
 const absent=id=>m.familyStatus.find(x=>x.id===id)?.status==='absent';
 const deferred=new Set();
 for(const group of m.groups){
  if(absent(group.id)&&['intolerance','contraindication','notIndicated','other'].includes(group.reason)){
   deferred.add(group.id);
   push('review','Revisar motivo de ausencia: '+group.label,'Consta una decisión o problema previo; no se propone iniciar ni reintroducir automáticamente esta familia.','Precisar fármaco, motivo, evolución y alternativas; confirmar que se ha resuelto la contraindicación o intolerancia.',HF_GUIDE);
  }
 }
 const canStart=id=>absent(id)&&!deferred.has(id);
 const betaCaution=hr<60; // conservative prototype threshold, not an ESC absolute contraindication.
 if(lowPressure)push('review','Revisar presión arterial','PAS 90–99 mmHg. No interpretar hipotensión asintomática como indicación automática de retirada.','ESC S4–S6: revisar síntomas, perfusión, vasodilatadores y diuréticos si no hay congestión. ARNI no se inicia por debajo de PAS 100 según la ficha de referencia.',HF_GUIDE);

 const existing=id=>member(id)[0];
 const reduced=r.ef<=40&&!r.improved&&r.phenotype!=='prior-reduced';
 const historical=r.improved||r.phenotype==='prior-reduced';
 const mid=r.ef>40&&r.ef<50&&!historical;
 const preserved=r.ef>=50&&!historical;
 const symptomatic=['II','III'].includes(r.nyha);
 const arni=existing('raas'),bb=existing('bb'),arm=existing('mra'),sg=existing('sglt2'),loop=existing('diuretic');
 if(historical){
  push('maintain','FEVI recuperada o antecedente de reducción','Mantener el tratamiento basal a dosis máximas toleradas es la recomendación general ESC 2026 (I C). La mejoría de FEVI no equivale a curación.','Una retirada gradual solo puede considerarse excepcionalmente (IIb C) con causa reversible tratada, ausencia de síntomas, normalización completa de función y volumen VI y péptidos, preferencia del paciente y vigilancia frecuente especializada. No automatizar retirada ni reintroducción.');
 }else if(!symptomatic){
  push('review','Confirmar perfil sintomático','Para proponer nuevos fármacos con indicación de IC sintomática, revisar clase funcional e historia de síntomas.','NYHA I o no registrada no implica ausencia de indicación previa.');
 }
 if(reduced&&symptomatic){
  if(canStart('raas')){
   if(egfr>=30&&potassium<=5.4&&sbp>=100)push('start','Valorar sacubitrilo/valsartán','24/26 mg cada 12 h como inicio conservador en quien no recibe IECA/ARA-II; objetivo de referencia 97/103 mg cada 12 h.','Comprobar angioedema previo, embarazo, hepatopatía, interacciones, PA y ausencia real de IECA/ARA-II. Doblar cada 3–4 semanas si tolera; controlar FG/K tras inicio y ajustes.',refDrug('Sacubitrilo/valsartán'));
   else push('review','SRAA: revisar elegibilidad','No se ofrece dosis de inicio por los datos de seguridad registrados.','Confirmar PA, potasio, función renal y alternativa según tolerancia.',refDrug('Sacubitrilo/valsartán'));
  }else if(arni?.drug==='Sacubitrilo/valsartán'&&arni.frequency==='12'){
   const next={'24/26':'49/51','49/51':'97/103'}[arni.dose.replaceAll('.',',')+'/'+arni.dose2.replaceAll('.',',')];
   if(next&&sbp>=100&&egfr>=30&&potassium<=5.4)push('review','Escalón de referencia: sacubitrilo/valsartán',arni.dose+'/'+arni.dose2+' → '+next+' mg cada 12 h. Elegibilidad aún no comprobada.','Confirmar presentación, tolerancia, estabilidad, PA/FG/K y duración en dosis actual. '+HF_TITRATION_REFERENCE[arni.drug].checks,refDrug(arni.drug));
   else push('review','Revisar sacubitrilo/valsartán','Confirmar dosis máxima tolerada, pauta y seguridad; no aumentar automáticamente.','Revisar presión arterial, función renal y potasio.',refDrug(arni.drug));
  }else if(arni&&['IECA','ARA-II'].includes(medicationFamilyLabel(arni))){
   push('review','Revisar tratamiento actual: '+arni.drug,'Valorar dosis máxima tolerada y alternativa según indicación. No se presupone que debe sustituirse siempre.',HF_TITRATION_REFERENCE[arni.drug]?.checks||'Revisar presentación y ficha técnica.',refDrug(arni.drug));
   push('review','Valorar sustitución por sacubitrilo/valsartán','Si la indicación y tolerancia lo permiten, considerar transición desde '+arni.drug+'. No asociarlos ni ejecutar el cambio sin comprobar elegibilidad.','Si procede desde IECA, respetar ≥36 h; desde ARA-II, evitar solapamiento. Verificar dosis anterior, PA, FG, K, angioedema y ficha técnica para seleccionar dosis de inicio.',refDrug('Sacubitrilo/valsartán'));
  }
  if(betaCaution&&(canStart('bb')||bb))push('review','Betabloqueante: revisar frecuencia cardiaca','FC 50–59 lpm: el prototipo no propone inicio ni aumento de betabloqueante sin valorar síntomas y ECG. No es una contraindicación universal ni impide por sí sola valorar otros tratamientos.','Comprobar ritmo, conducción, cronotropos y tolerancia; no retirar bruscamente.',HF_GUIDE);
  else if(canStart('bb'))push('start','Valorar bisoprolol','Inicio de referencia 1,25 mg cada 24 h; objetivo máximo 10 mg/día si tolera.',HF_TITRATION_REFERENCE.Bisoprolol.checks+' Verificar contraindicaciones de ficha técnica.',refDrug('Bisoprolol'));
  else if(bb){
   const ref=HF_TITRATION_REFERENCE[bb.drug],step=betaBlockerReferenceStep(bb);
   const nebAge=ctx.peptides?.age;
   if(bb.drug==='Nebivolol'&&(!Number.isFinite(nebAge)||nebAge<70))push('review','Nebivolol: comprobar indicación y edad','No se propone titulación de IC sin edad registrada ≥70 años, según ficha de Insucor.','Confirmar indicación real, gravedad y presentación. No suspender por esta regla.',ref.source);
   else if(step){
    push('review','Escalón de referencia: '+bb.drug,fmtDose(step.from)+' → '+fmtDose(step.to)+' mg cada '+step.frequency+' h, según '+step.product+'. No se ha comprobado elegibilidad para este incremento.','Confirmar tolerancia, duración en el escalón (mínimo '+step.minDays+' días según la ficha), ECG, ausencia de congestión y presentación exacta. '+step.checks,step.source);
   }else push('review','Revisar '+bb.drug,'Sin escalón superior automatizado para la pauta registrada; comprobar dosis máxima tolerada y formulación.','No interpretar dosis objetivo como obligación ni retirar bruscamente. '+(ref?.checks||'Revisar ficha técnica.'),refDrug(bb.drug));
  }
  if(canStart('mra')){
   if(egfr>=30&&potassium<5)push('review','Valorar ARM esteroideo: verificar indicación','La elección y la dosis inicial quedan pendientes de comprobar la indicación específica de la presentación, el fenotipo y la clase funcional.','Aldactone: indicación de IC grave NYHA III–IV y cautelas específicas; Eplerenona STADA: criterios específicos de FEVI, NYHA o infarto reciente. No extrapolar automáticamente entre fichas; revisar creatinina, aclaramiento, potasio e interacciones.','https://cima.aemps.es/cima/dochtml/ft/39059/FT_39059.html');
   else push('review','ARM: revisar seguridad','No se propone inicio con FG <30 o potasio ≥5 mmol/L en este prototipo.','Valorar alternativas y control analítico.',refDrug('Espironolactona'));
  }else if(arm)push('review','Revisar '+arm.drug,'Comprobar dosis según indicación, función renal y potasio.','No titular ARM sin datos de función renal previa y revisión de los límites específicos de su ficha técnica. '+(HF_TITRATION_REFERENCE[arm.drug]?.checks||''),refDrug(arm.drug));
 }else if(mid&&symptomatic){
  if(absent('raas')||arni)push('review','FEVI 41–49 %: revisar tratamiento SRAA','ESC 2026, tabla de recomendaciones 5: IECA o ARNI en IC-FEr sintomática, clase I A; valorar transición a ARNI si procede, clase I B1.','La guía reconoce ausencia de grandes ensayos exclusivos en FEVI 41–49 %. Verificar indicación de la presentación y elegibilidad; la selección de dosis para este tramo sigue pendiente de auditoría.',HF_GUIDE);
  if(absent('bb')||bb)push('review','FEVI 41–49 %: revisar betabloqueante','ESC 2026 recomienda betabloqueantes en IC-FEr sintomática estable, clase I A, con la cautela de evidencia específica limitada en este tramo.','Revisar ritmo, frecuencia, tolerancia y ficha técnica. No extrapolar automáticamente una pauta no auditada.',HF_GUIDE);
  if(absent('mra'))push('review','FEVI 41–49 %: valorar ARM esteroideo','ESC 2026 recomienda ARM en IC sintomática con independencia de FEVI (clase I A); en IC-FEr especifica ARM esteroideo.','Verificar indicación de la presentación, FG, K y tolerancia. La indicación autorizada de finerenona desde FEVI ≥40 % es un dato regulatorio distinto de la recomendación ESC por fenotipo.',HF_GUIDE);
  else if(arm)push('review','Revisar ARM registrado','Comprobar concordancia entre fenotipo, indicación de la presentación y función renal.','No sustituir automáticamente ni asociar ARM.',refDrug(arm.drug));
 }
 if(preserved&&symptomatic&&canStart('mra')){
  push('review','IC-FEp: revisar elección de ARM','ESC 2026 recomienda ARM esteroideo o no esteroideo en IC-FEp sintomática, clase I A.','Individualizar según evidencia por molécula, indicación regulatoria, función renal y potasio; no asociar dos ARM.',HF_GUIDE);
  if(egfr>=25&&potassium<=5)push('start','Valorar finerenona',(egfr>=60?'20':'10')+' mg cada 24 h como dosis inicial de referencia; objetivo según FG inicial: '+(egfr>=60?'40':'20')+' mg/día.','Comprobar ausencia de otro ARM, ahorradores de K, inhibidores/inductores CYP3A4, Addison, hepatopatía grave, embarazo y demás contraindicaciones. FG/K a las 4 semanas; titular solo según tabla y cambio de FG.',refDrug('Finerenona'));
  else push('review','Finerenona: revisar elegibilidad','No se propone inicio con FG <25 o K >5.','Revisar evolución renal y potasio.',refDrug('Finerenona'));
 }
 if(preserved&&symptomatic&&absent('raas'))push('review','IC-FEp: valorar IECA, ARA-II o ARNI','ESC 2026 permite considerar inhibición SRAA en IC-FEp sintomática para reducir ingresos por IC (IIb C).','No equiparar a recomendación clase I; revisar comorbilidades, indicación autorizada y tolerancia. Selección de dosis pendiente de auditoría.',HF_GUIDE);
 if(preserved&&arm)push('review','Revisar ARM registrado','No asociar finerenona a espironolactona o eplerenona.','Si se valora un cambio, revisar indicación, FG previo, potasio e interacciones; no aplicar sustitución automática.',refDrug(arm.drug));
 if(symptomatic&&!historical&&canStart('sglt2')){
  const eligible=['Dapagliflozina','Empagliflozina'].filter(drug=>egfr>=HF_TITRATION_REFERENCE[drug].minInitiationEgfr);
  for(const drug of eligible){
   const ref=HF_TITRATION_REFERENCE[drug];
   push('start','Valorar '+drug,'10 mg cada 24 h como dosis habitual de IC; opciones alternativas, no asociar dos iSGLT2.','Antes de iniciar: '+ref.checks+' '+sglt2Interruption,ref.source);
  }
  if(!eligible.length)push('review','iSGLT2: revisar FG','No se ofrece inicio con FG <20; no implica retirar tratamiento previamente establecido.','Revisar indicación y evolución renal.',refDrug('Empagliflozina'));
 }else if(sg){
  const ref=HF_TITRATION_REFERENCE[sg.drug];
  push('review','iSGLT2 registrado: '+sg.drug,'No precisa titulación habitual para IC. Diferenciar continuidad de inicio; el descenso aislado de FG no justifica por sí solo la retirada.','Confirmar indicación, dosis, función renal, volemia, tolerancia y causa de deterioro. '+sglt2Interruption,ref?.source||refDrug(sg.drug));
 }
 if(loop)push('review','Revisar necesidad de diurético de asa','Paciente sin congestión según datos registrados. Valorar la menor dosis eficaz, sin reducción automática.','Comprobar peso, síntomas, PA, función renal, electrolitos y evolución de la congestión.',refDrug(loop.drug));
 push('follow','Seguimiento tras cambios','ESC 2026 recomienda reevaluar titulación de FMT al menos cada 1–2 semanas según clínica, constantes y analítica (I C); el intervalo de incremento efectivo depende de la ficha y tolerancia.','Registrar dosis máxima tolerada, motivo de no iniciar o titular, adherencia y fecha de reevaluación; vigilar descompensación. No acelerar un escalón por encima de la pauta verificada.',HF_GUIDE);
 return result('conditional');
}
