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
export function createClinicalContext(){return {findings:{},investigations:{},results:{},updatedAt:null};}
export function updateFinding(ctx,id,value){if(!fields.includes(id)||!['yes','no','unknown'].includes(value))return ctx;return {...ctx,findings:{...ctx.findings,[id]:value},updatedAt:new Date().toISOString()};}
export function evaluateSuspicion(ctx){
 const f=ctx?.findings??{},val=id=>['yes','no'].includes(f[id])?f[id]:'unknown';
 const group=id=>GROUPS.find(g=>g.id===id).fields;
 const positives=id=>group(id).filter(([k])=>val(k)==='yes').map(([,label])=>label);
 const complete=id=>group(id).every(([k])=>val(k)!=='unknown');
 const alarm=positives('alarms'),sym=positives('symptoms'),sign=positives('signs'),risk=positives('risk');
 const result=(id,level,title,action,details=[])=>({id,level,title,action,details,source:{...SOURCE,sections:['IC-SUS-01','IC-SUS-02','IC-SUS-03'].includes(id)?'ESC 2026, apartado 7.2':'ESC 2026, apartado 5.1 y tabla 7'},ruleType:'Adaptación de flujo experimental; no es una recomendación ESC textual'});
 if(['respiratory','perfusion','chestPain','arrhythmia'].some(k=>val(k)==='yes'))return result('IC-SUS-01','critical','Alarma clínica','Prioriza valoración urgente inmediata y activa el circuito de emergencias según la situación. No demores por pruebas ambulatorias.',alarm);
 if(val('worsening')==='yes')return result('IC-SUS-02','urgent','Posible descompensación','Valora hoy la estabilidad, constantes, congestión y perfusión; decide destino asistencial según los hallazgos. No presupongas IC como única causa.',alarm);
 if(!complete('alarms')||val('vitalsReviewed')!=='yes')return result('IC-SUS-03','pending','Completar seguridad','Comprueba las alarmas, presión arterial, frecuencia cardiaca, frecuencia respiratoria y SpO₂; añade temperatura y ECG cuando proceda. No orientar un circuito ambulatorio sin valorar la estabilidad. Un dato no valorado no equivale a normal.');
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

export const INVESTIGATIONS=[
 ['ecg','ECG de 12 derivaciones'],['np','BNP / NT-proBNP'],['lab','Analítica basal'],['rx','Radiografía de tórax'],['echo','Ecocardiografía']
];
export function setInvestigation(ctx,id,status){
 if(!INVESTIGATIONS.some(x=>x[0]===id)||!['unknown','requested','available','notIndicated'].includes(status))return ctx;
 return {...ctx,investigations:{...ctx.investigations,[id]:{status,updatedAt:new Date().toISOString()}},updatedAt:new Date().toISOString()};
}
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
 ecg:{label:'Hallazgo principal del ECG',options:[['unknown','Sin interpretar'],['normal','Sin alteraciones relevantes descritas'],['af','Fibrilación auricular'],['conduction','Alteración de conducción'],['ischemia','Alteraciones sugestivas de isquemia'],['other','Otras alteraciones']]},
 rx:{label:'Hallazgo principal de radiografía',options:[['unknown','Sin interpretar'],['normal','Sin alteraciones relevantes descritas'],['congestion','Signos de congestión'],['effusion','Derrame pleural'],['pulmonary','Alteración pulmonar alternativa'],['other','Otros hallazgos']]}
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
