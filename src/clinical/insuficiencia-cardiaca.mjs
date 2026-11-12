/**
 * CaHReMe — valoración dirigida de IC con clasificación ESC 2026.
 * No establece diagnósticos mediante FEVI aislada, ni genera prescripciones,
 * ajustes de diuréticos ni titulación de terapias fundacionales.
 * ESC 2026 (28-08-2026), KDIGO 2024 y CIMA-AEMPS por producto.
 */
import {fieldState} from '../model.mjs';
import {readMulti} from '../consultas.mjs';
import {auditCrossDomain} from './auditoria.mjs';

export const HF_SOURCES=Object.freeze({
 esc26:{id:'ESC-HF-2026',name:'ESC · Guía de insuficiencia cardíaca 2026',
  url:'https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/heart-failure',
  detail:'Definición de IC-FEr <50%, IC-FEp ≥50% con pruebas objetivas; terapia fundacional y congestión'},
 esc26Original:{id:'ESC-HF-2026-ORIGINAL',name:'ESC 2026 · Guía original en European Heart Journal',
  url:'https://academic.oup.com/eurheartj/article/47/38/5346/8766302',
  detail:'Secciones 3, 6 y 7; tablas de clasificación y tratamiento'},
 esc23:{id:'ESC-HF-2023-HISTORICA',name:'ESC · actualización de IC 2023 (referencia histórica)',
  url:'https://academic.oup.com/eurheartj/article/44/37/3627/7246292',
  detail:'Clasificación 2021/2023 reemplazada en 2026; no usar sus tres categorías como vigente'},
 cimaEmp:{id:'CIMA-EMPAGLIFLOZINA',name:'CIMA · Jardiance 10 mg',
  url:'https://cima.aemps.es/cima/dochtml/ft/114930014',
  detail:'Indicaciones de IC crónica sintomática, situación clínica y limitaciones por molécula'},
 cimaDapa:{id:'CIMA-DAPAGLIFLOZINA',name:'CIMA · Forxiga 10 mg',
  url:'https://cima.aemps.es/cima/dochtml/ft/112795007/',
  detail:'IC crónica sintomática; inicio no recomendado con TFGe <25 ml/min/1,73 m²'},
 cimaFin:{id:'CIMA-FINERENONA',name:'CIMA · Kerendia 10/20/40 mg',
  url:'https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html',
  detail:'Indicación de IC sintomática FEVI ≥40%, potasio y TFGe por presentación e indicación'},
 cimaArni:{id:'CIMA-SACUBITRIL-VALSARTAN',name:'CIMA · Entresto 24/26 mg',
  url:'https://cima.aemps.es/cima/dochtml/ft/1151058001/FT_1151058001.html',
  detail:'IC sintomática con FEVI reducida, PAS ≥100, K ≤5,4 y transición de IECA ≥36 h'}
});
const v=(d,id)=>fieldState(d,id)==='registrado'?String(d.values[id]):null;
const n=(d,id)=>{const x=v(d,id);return x===null?null:Number(x)};
const many=(d,id)=>{const x=v(d,id);return x===null?null:readMulti(x)};
const unique=a=>[...new Set(a)];
const option=(id,title,reason,checks,refs)=>({
 id,title,reason,checks,refs,state:'candidato_para_revision',
 performed:false,actionPerformed:false,prescription:null,patientDose:null
});
export function classifyHf2026(fevi,evidence=null){
 if(typeof fevi!=='number'||!Number.isFinite(fevi)||fevi<0||fevi>100)
   return {code:'no_evaluable',label:'FEVI no evaluable',established:false};
 if(fevi<50)return {code:'reducida',label:'FEVI <50 %: compatible con fenotipo IC-FEr (ESC 2026) si hay IC clínica',
   established:false,requiresClinicalDiagnosis:true};
 if(evidence==='Confirmada por evaluación especializada')
   return {code:'preservada',label:'FEVI ≥50 % con evidencia objetiva aportada: compatible con fenotipo IC-FEp (ESC 2026)',
     established:false,requiresClinicalDiagnosis:true};
 return {code:'preservada_no_confirmada',
   label:'FEVI ≥50 % sin evidencia objetiva confirmada: IC-FEp no establecida',
   established:false};
}
export function evaluateHeartFailure(draft,mode='quick'){
 if(!['quick','detail'].includes(mode))throw new Error('Modo de consulta IC desconocido');
 const audit=auditCrossDomain(draft);
 const hf=v(draft,'ic'),symptomatic=v(draft,'ic_sintomatica');
 const group=v(draft,'ic_fevigrupo'),fevi=n(draft,'fevi');
 const evidence=v(draft,'ic_evidencia_objetiva');
 const ef=classifyHf2026(fevi,evidence);
 const congestion=v(draft,'congestion');
 const stability=v(draft,'ic_estabilidad');
 const flagsInvalid=fieldState(draft,'ic_alarma')==='revisar';
 const flags=many(draft,'ic_alarma')??(flagsInvalid
   ?readMulti(String(draft.values.ic_alarma||'[]')):null);
 const acute=v(draft,'situacion_aguda'),decomp=v(draft,'ic_descompensada');
 const egfr=n(draft,'tfge'),potassium=n(draft,'potasio');
 const sbp=n(draft,'pas'),heartRate=n(draft,'ic_fc');
 const lra=v(draft,'lra_sospecha'),pregnancy=v(draft,'embarazo');
 const meds=many(draft,'farmacos_clases');
 const medication=new Set(meds||[]);
 const reconciled=v(draft,'medicacion_revisada')==='Sí';
 const allergies=v(draft,'alergias_revisadas')==='Sí';
 const evalDate=v(draft,'fecha_evaluacion'),efDate=v(draft,'fecha_fevi');
 const egfrDate=v(draft,'fecha_tfge'),potDate=v(draft,'fecha_potasio');
 const missing=[],alerts=[],checks=[],steps=[],options=[];
 const src=['ESC-HF-2026','ESC-HF-2026-ORIGINAL','CIMA-EMPAGLIFLOZINA','CIMA-DAPAGLIFLOZINA','CIMA-FINERENONA','CIMA-SACUBITRIL-VALSARTAN'];
 const put=(id,title,reason,requirements,refs=['ESC-HF-2026'])=>
   options.push(option(id,title,reason,requirements,refs));
 if(hf===null)missing.push('Confirmar antecedente de insuficiencia cardíaca.');
 if(!group && mode==='quick')missing.push('Identificar grupo de FEVI según ESC 2026.');
 if(congestion===null||congestion==='No valorados')
   missing.push('Valorar congestión mediante anamnesis y exploración.');
 if(flags===null)missing.push('Valorar signos de alarma; no asumir que están ausentes.');
 if(mode==='detail'){
  if(fevi===null)missing.push('FEVI numérica documentada.');
  if(fevi!==null&&(!efDate||!evalDate))
    missing.push('Confirmar fecha de FEVI y fecha de evaluación para interpretar su contexto.');
  if(symptomatic===null||symptomatic==='No valorado')
    missing.push('Confirmar síntomas presentes o previos y estadio clínico.');
  if(stability===null||stability==='No valorada')
    missing.push('Valorar estabilidad hemodinámica y respiratoria.');
  if(egfr===null)missing.push('TFGe para valorar seguridad y elegibilidad de productos.');
  if(egfr!==null&&(!egfrDate||!evalDate))
    missing.push('Confirmar fecha de TFGe y fecha de evaluación antes de revisar tratamiento.');
  if(potassium===null)missing.push('Potasio sérico para valorar ARM.');
  if(potassium!==null&&(!potDate||!evalDate))
    missing.push('Confirmar fecha de potasio y fecha de evaluación antes de revisar ARM.');
  if(sbp===null)missing.push('Presión arterial sistólica.');
  if(meds===null||!reconciled)
    missing.push('Conciliar clases y dosis realmente administradas.');
  if(symptomatic==='No valorado')
    checks.push('No inferir ausencia de IC sintomática de un dato no valorado.');
  if(!allergies)missing.push('Verificar alergias e intolerancias.');
  if(pregnancy===null||pregnancy==='No valorado')
    checks.push('Confirmar gestación antes de cualquier selección farmacológica.');
 }
 if(fevi!==null&&!efDate)checks.push('Confirmar fecha de ecocardiografía: FEVI sin fecha no acredita actualidad.');
 if(egfr!==null&&!egfrDate)checks.push('Confirmar fecha y evolución de TFGe antes de valorar medicamentos.');
 if(potassium!==null&&!potDate)checks.push('Confirmar fecha y evolución de potasio.');
 if(fevi!==null&&efDate&&evalDate&&efDate>evalDate)
   alerts.push('FEVI fechada después de la evaluación actual: comprobar fecha de ambos documentos.');
 if(group&&fevi!==null){
   const saysReduced=group==='Reducida · FEVI <50 %';
   const saysPreserved=group==='Preservada · FEVI ≥50 %';
   if((saysReduced&&fevi>=50)||(saysPreserved&&fevi<50))
     alerts.push('Grupo FEVI declarado discordante con FEVI cuantitativa; reconciliar informe.');
 }
 if(group?.includes('clasificación pendiente de revisión'))
   checks.push('Grupo FEVI heredado de una clasificación anterior: contrastar FEVI numérica con ESC 2026.');
 if(fevi!==null&&fevi>=50&&evidence!=='Confirmada por evaluación especializada')
   checks.push('Con FEVI ≥50%, no diagnosticar IC-FEp solo por la fracción de eyección: confirmar evidencia estructural/funcional y péptidos natriuréticos.');
 if(symptomatic==='No'&&hf==='Sí'){
   checks.push('Consta IC conocida sin síntomas actuales: confirmar síntomas previos, evolución de FEVI y estadio; no retirar automáticamente tratamientos por mejoría.');
   if(mode==='detail')missing.push('Documentar síntomas previos y estadio de IC; ausencia de síntomas actuales no demuestra resolución.');
 }
 const noRedFlags=flags?.includes('Sin señales de alarma tras valoración');
 const activeFlags=flags?.filter(x=>x!=='Sin señales de alarma tras valoración')||[];
 if(noRedFlags&&activeFlags.length)
   alerts.push('Se declararon simultáneamente ausencia y presencia de señales de alarma.');
 if(flagsInvalid)alerts.push('El campo de señales de alarma contiene una combinación o formato no válido: revisar captura.');
 if(hf==='No'&&(symptomatic==='Sí'||fevi!==null))
   checks.push('IC negada y datos sugestivos aportados: verificar diagnóstico, no inferirlo por FEVI.');
 if(meds?.includes('Sin tratamiento farmacológico')&&meds.length>1)
   alerts.push('Tratamientos simultáneamente declarados como presentes y ausentes.');
 const combinedRAAS=(medication.has('IECA')?1:0)+(medication.has('ARA-II')?1:0)+
   (medication.has('INRA/ARNI')?1:0);
 if(combinedRAAS>=2)alerts.push('Múltiples vías IECA/ARA-II/ARNI declaradas: conciliar asociaciones potencialmente incompatibles.');
 if(medication.has('ARM')&&potassium!==null&&potassium>5)
   alerts.push('ARM registrado con potasio >5 mmol/L: revisar hiperpotasemia y ficha individual antes de continuar o titular.');
 if(potassium!==null&&potassium>5.5&&potassium<6)
   alerts.push('Potasio >5,5 y <6 mmol/L: verificar cifra y evolución; revisar tratamiento hiperpotasemiante antes de cambios.');
 if(potassium!==null&&potassium>=6)
   alerts.push('Potasio ≥6 mmol/L: confirmar muestra, ECG, clínica y valorar atención urgente según contexto.');
 if(sbp!==null&&sbp<90)
   alerts.push('PAS <90 mmHg: evaluar perfusión y síntomas, no titular tratamientos hipotensores automáticamente.');
 if(sbp!==null&&sbp>=90&&sbp<100)
   checks.push('PAS 90–99 mmHg: valorar hipotensión sintomática, volemia y tolerancia antes de intensificar fármacos vasodilatadores.');
 if(heartRate!==null&&heartRate<50)
   alerts.push('Frecuencia cardíaca <50 lpm: revisar síntomas, conducción y tratamiento cronotropo.');
 if(congestion==='Presentes')
   checks.push('Valorar disnea, ortopnea, edemas, peso, signos de hipoperfusión y evolución de la volemia.');
 const urgent=activeFlags.length>0||stability==='Inestabilidad o descompensación sospechada'||
   decomp==='Sí'||acute==='Enfermedad aguda grave'||lra==='Sí'||
   (potassium!==null&&potassium>=6)||(sbp!==null&&sbp<90);
 if(urgent)steps.push('Evaluación prioritaria: constantes, saturación, ECG, función renal, electrolitos y signos de congestión/hipoperfusión; definir necesidad de derivación urgente.');
 if(activeFlags.length)alerts.push('Signos de alarma: '+activeFlags.join('; ')+'.');
 if(decomp==='Sí')alerts.push('Posible descompensación de IC: la ruta de optimización crónica no es adecuada.');
 if(lra==='Sí')alerts.push('Sospecha de lesión renal aguda: revisar volemia, causas y seguridad farmacológica.');
 if(pregnancy==='Sí')alerts.push('Embarazo: no utilizar selección farmacológica habitual de IC sin circuito especializado.');
 const contradiction=flagsInvalid||alerts.some(x=>
   x.includes('discordante')||x.includes('simultáneamente')||
   x.includes('Múltiples vías'))||
   (hf==='No'&&symptomatic==='Sí')||
   audit.requiresResolution;
 const hasDiagnosis=hf==='Sí';
 const groupValid=group==='Reducida · FEVI <50 %'||
    group==='Preservada · FEVI ≥50 %';
 const possibleGroup=groupValid?group=== 'Reducida · FEVI <50 %'?'reducida':'preservada':null;
 const chosenPhenotype=mode==='detail'?ef.code:possibleGroup;
 const hfpEvidenceOk=chosenPhenotype!=='preservada'||
   evidence==='Confirmada por evaluación especializada';
 // Quick cannot confirm HFpEF without objective evidence, hence no drug candidates.
 const effectivePhase=chosenPhenotype==='preservada_no_confirmada'?null:chosenPhenotype;
 const noHFpEF=mode==='detail'&&ef.code==='preservada_no_confirmada';
 if(noHFpEF)missing.push('Corroborar evidencia objetiva de IC-FEp o replantear el diagnóstico.');
 const vitalUnknown=mode==='detail'&&
   (stability!=='Estable evaluado'||congestion===null||congestion==='No valorados');
 const safetyUnknown=mode==='detail'&&(
   symptomatic===null||symptomatic==='No valorado'||symptomatic==='No'||
   fevi===null||egfr===null||potassium===null||sbp===null||
   flags===null||meds===null||!reconciled||!allergies||
   !efDate||!evalDate||!egfrDate||!potDate||
   pregnancy===null||pregnancy==='No valorado');
 const mismatch=group&&fevi!==null&&(
   (group==='Reducida · FEVI <50 %'&&fevi>=50)||
   (group==='Preservada · FEVI ≥50 %'&&fevi<50));
 const futureEcho=fevi!==null&&!!efDate&&!!evalDate&&efDate>evalDate;
 const redFlagsConflict=!!noRedFlags&&activeFlags.length>0;
 const criticalSafety=urgent||pregnancy==='Sí'||(potassium!==null&&potassium>5.5);
 const state=criticalSafety?'seguridad_prioritaria':
   contradiction||mismatch||redFlagsConflict||futureEcho?'revisar_coherencia':
   !hasDiagnosis||(!chosenPhenotype&&mode==='quick')||noHFpEF||vitalUnknown||safetyUnknown
    ?'datos_insuficientes':'revision_pendiente';
 let situation=hasDiagnosis?'IC conocida: caracterizar estabilidad, FEVI y volemia.':
   'Sin diagnóstico de IC confirmado en los datos; el módulo no establece diagnósticos.';
 if(state==='seguridad_prioritaria'){
  situation='Prioridad de seguridad: posible descompensación, inestabilidad o alteración relevante.';
  steps.push('No iniciar ni titular tratamiento crónico hasta evaluar la situación actual; cualquier tratamiento ya prescrito requiere revisión profesional, no suspensión automática.');
 }else if(state==='revisar_coherencia'){
  situation='Datos clínicos discordantes; no decidir fenotipo o tratamiento todavía.';
  steps.push('Reconciliar diagnóstico, FEVI, alarmas y tratamiento antes de decidir.');
 }else if(state==='datos_insuficientes'){
  steps.push('Completar diagnóstico, estabilidad, fenotipo y datos de seguridad. En FEVI ≥50 %, confirmar evidencia objetiva antes de atribuir IC-FEp.');
 }else{
  situation=mode==='detail'?ef.label:
    possibleGroup==='reducida'?'IC conocida con FEVI reducida según grupo aportado (ESC 2026).':
    'IC conocida con FEVI preservada declarada; verificar evidencia objetiva antes de establecer fenotipo.';
  steps.push('Revisar síntomas, signos de congestión y tratamiento realmente administrado, sin inferir indicaciones desde una FEVI aislada.');
 }
 if(congestion==='Presentes'&&!urgent)
   steps.push('Congestión presente: considerar revisión clínica de diuréticos de asa y balance de volumen; no modificar dosis automáticamente.');
 if(congestion==='Ausentes')
   checks.push('Sin congestión clínica declarada: no introducir diurético exclusivamente por FEVI.');
 if(hasDiagnosis&&mode==='detail'&&state==='revision_pendiente'&&
    symptomatic==='Sí'&&effectivePhase&&
    (effectivePhase!=='preservada'||hfpEvidenceOk)){
   if(congestion==='Presentes'){
    if(medication.has('Diurético de asa'))
      put('HF-DIURETIC-EXISTING','Diurético de asa ya registrado: revisar respuesta',
        'Consta tratamiento descongestivo: no asumir que está ausente ni duplicar automáticamente.',
        ['Confirmar molécula, dosis realmente administrada, cambio de peso, PA, función renal y electrolitos.',
         'Ajustar solo tras valorar volemia y seguridad individual.']);
    else put('HF-DIURETIC-REVIEW','Revisar descongestión según volemia',
      'Los diuréticos de asa se individualizan según congestión y evolución clínica; no se asume necesidad si no hay signos.',
      ['Documentar peso, presión arterial, función renal, sodio/potasio y tratamiento diurético actual.',
       'Valorar evolución y revisión precoz de síntomas y balance de volumen.']);
   }
   if(medication.has('iSGLT2'))
     put('HF-SGLT2-EXISTING','iSGLT2 ya registrado: revisar adecuación',
       'No sugerir inicio de un segundo iSGLT2; verificar molécula, indicación y tolerancia.',
       ['Revisar enfermedad aguda, cetosis, volemia y ficha técnica específica.'],
       ['ESC-HF-2026','CIMA-EMPAGLIFLOZINA','CIMA-DAPAGLIFLOZINA']);
   else if(egfr!==null&&egfr>=20)
     put('HF-SGLT2-REVIEW','Valorar iSGLT2 en IC sintomática',
       'ESC 2026 recomienda dapagliflozina o empagliflozina en IC sintomática con independencia de FEVI.',
       ['Empagliflozina: no iniciar con TFGe <20; dapagliflozina: no iniciar con TFGe <25 (CIMA).',
        'Con TFGe 20–24 no extrapolar indicación de empagliflozina a dapagliflozina.',
        'Revisar diabetes tipo 1, cetoacidosis, depleción de volumen y ficha individual.'],
       ['ESC-HF-2026','CIMA-EMPAGLIFLOZINA','CIMA-DAPAGLIFLOZINA']);
   else checks.push('Con TFGe <20, no ofrecer nuevo iSGLT2 sin valoración especializada y revisión de ficha del producto.');
   if(medication.has('ARM'))
     put('HF-MRA-EXISTING','ARM ya registrado: comprobar cuál y seguridad',
       'No duplicar antagonistas mineralocorticoides; revisar principio activo, potasio, TFGe y tolerancia.',
       ['Diferenciar esteroideos de finerenona: los límites de uso y dosis son distintos.'],
       ['ESC-HF-2026','CIMA-FINERENONA']);
   else {
     // ESC 2026 aconseja cautela desde K >=5,0 y eGFR <25.
     // La FT CIMA de finerenona para IC sintomática FEVI >=40 permite
     // inicio con K <=5,0 y eGFR >=25, con condiciones propias.
     // Estas rutas son mutuamente excluyentes; ninguna genera una receta.
     const steroidReview=potassium!==null&&potassium<5&&
       egfr!==null&&egfr>=30;
     const finerenoneRange=fevi!==null&&fevi>=40&&
       potassium!==null&&potassium<=5&&egfr!==null&&egfr>=25;
     const finerenoneSafety=v(draft,'cyp3a4_fuerte')==='No'&&
       v(draft,'addison')==='No'&&v(draft,'hepatica_grave')==='No';
     if(steroidReview)
       put('HF-MRA-REVIEW','Revisar opción de ARM según fenotipo y función renal',
         'ESC 2026 incluye ARM en terapia fundacional según fenotipo; la elección entre esteroideo/no esteroideo depende de indicación y ficha técnica.',
         ['Verificar producto concreto, potasio, TFGe, interacciones e inicio autorizado.',
          'No inferir que finerenona pueda sustituir automáticamente a espironolactona/eplerenona.'],
         ['ESC-HF-2026','CIMA-FINERENONA']);
     else if(finerenoneRange&&finerenoneSafety)
       put('HF-FINERENONE-CIMA-REVIEW',
         'Finerenona en IC con FEVI ≥40 %: revisión específica de ficha CIMA',
         'Con TFGe 25–29 o potasio exactamente 5,0 mmol/L, no se extrapolan los límites de inicio de un ARM esteroideo: se muestra únicamente la indicación específica de finerenona para revisión.',
         ['Confirmar IC crónica sintomática, FEVI ≥40 %, TFGe ≥25 y K ≤5,0 mmol/L; repetir potasio si es limítrofe.',
          'Verificar alergias, embarazo, enfermedad de Addison, inhibidores potentes CYP3A4, hepatopatía y cualquier ARM concomitante.',
          'CIMA exige controlar potasio y TFGe a las 4 semanas de iniciar o modificar finerenona. No indicar dosis ni inicio desde CaHReMe.'],
         ['ESC-HF-2026','CIMA-FINERENONA']);
     else {
       checks.push('No ofrecer inicio rutinario de ARM sin comprobar límites renales y potasio de la molécula.');
       if(finerenoneRange&&!finerenoneSafety)
         checks.push('La ruta de finerenona exige confirmar ausencia de Addison, inhibidores potentes CYP3A4 y hepatopatía grave antes de considerar una alternativa.');
     }
   }
   if(effectivePhase==='reducida'){
     if(['IECA','ARA-II','INRA/ARNI'].some(cls=>medication.has(cls)))
       put('HF-RAAS-EXISTING','Revisar RAAS/ARNI existente y dosis tolerada',
         'Confirmar principio activo, indicación y tolerancia; evitar combinaciones dobles de RAAS.',
         ['Comprobar PAS, creatinina/TFGe, potasio e historia de angioedema.']);
     else if(sbp!==null&&sbp>=100&&potassium!==null&&potassium<=5.4)
       put('HF-RAAS-REVIEW','Revisar componente ARNI/IECA (ARA-II si intolerancia)',
         'La terapia fundacional de IC-FEr ESC 2026 incluye modulación del sistema renina–angiotensina.',
         ['ARNI: no iniciar con PAS <100 ni potasio >5,4 (CIMA).',
          'Revisar TFGe y antecedentes de angioedema; separar ≥36 h desde última dosis de IECA.',
          'La selección final por medicamento y dosis requiere ficha CIMA y valoración clínica.'],
         ['ESC-HF-2026','CIMA-SACUBITRIL-VALSARTAN']);
     else checks.push('PA o potasio no permiten sugerir nueva terapia RAAS/ARNI de forma rutinaria; revisar seguridad y producto.');
     if(medication.has('Betabloqueante'))
       put('HF-BB-EXISTING','Betabloqueante ya registrado: comprobar indicación y tolerancia',
         'Revisar molécula con evidencia en IC, frecuencia cardíaca y estabilidad antes de valorar cambios.',
         ['Registrar FC, PAS, congestión y dosis actual; no titular durante descompensación.']);
     else if(congestion==='Ausentes'&&heartRate!==null&&heartRate>=50&&
             sbp!==null&&sbp>=100)
       put('HF-BB-REVIEW','Revisar betabloqueante de IC con evidencia',
         'Parte de la terapia fundacional de la IC-FEr; debe adecuarse a estabilidad y frecuencia cardíaca.',
         ['Confirmar ausencia de congestión inestable, bradicardia sintomática, bloqueo AV y contraindicaciones.']);
     else checks.push('No sugerir inicio de betabloqueante sin valorar FC y congestión/estabilidad.');
   }
   if(fevi!==null&&fevi>=40&&symptomatic==='Sí')
      checks.push('Finerenona tiene indicación CIMA en IC crónica sintomática FEVI ≥40%; no equiparar esta indicación con la clasificación IC-FEr <50% ESC 2026 ni duplicar ARM.');
 }
 if(mode==='detail'&&meds!==null&&!reconciled)
   checks.push('Las clases declaradas no prueban que el paciente las tome: conciliar principios activos, dosis y adherencia.');
 if(mode==='quick'&&state==='revision_pendiente'){
   steps.push('Utilizar la revisión detallada para confirmar FEVI numérica, evidencia de IC-FEp, potasio, TFGe, PA y tratamientos antes de plantear clases.');
 }
 const followUp=state==='seguridad_prioritaria'
   ?'Valoración clínica prioritaria; no demorar por revisión programada.'
   :'Si se confirma cambio terapéutico, programar seguimiento de síntomas, tensión, FC, TFGe y electrolitos; ESC 2026 contempla titulación individual con controles frecuentes según tolerancia.';
 return {
  module:'ic',mode,state,phenotype:mode==='detail'?ef:
    {code:possibleGroup||'no_evaluable',
     label:possibleGroup==='reducida'?'FEVI declarada <50 %':
        possibleGroup==='preservada'?'FEVI declarada ≥50 %, confirmar evidencia objetiva':
          'FEVI pendiente de confirmar',established:false},
  situation,steps:unique(steps),options,alerts:unique([...alerts,...audit.critical.map(x=>x.title)]),
  checks:unique(checks),missing:unique(missing),followUp,
  sources:HF_SOURCES,sourceIds:src,
  patientDose:null,prescription:null,actionPerformed:false,noPrescription:true,
  clinicalValidation:'pendiente'
 };
}
