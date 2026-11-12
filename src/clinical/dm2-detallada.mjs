/**
 * CaHReMe — DM2 detallada, contrato no prescriptivo.
 * Referencias: ADA 2026 §§6, 9 y 11; redGDPS 2026; CIMA-AEMPS por producto.
 * Las sugerencias son comprobaciones para un profesional, no recetas.
 */
import {fieldState} from '../model.mjs';
import {readMulti} from '../consultas.mjs';
import {auditCrossDomain} from './auditoria.mjs';
import {evaluateDm2Quick,DM2_QUICK_SOURCES} from './dm2-rapida.mjs';

export const DM2_DETAIL_SOURCES=Object.freeze({
 ...DM2_QUICK_SOURCES,
 ada11:{id:'ADA-2026-11',name:'ADA 2026 · ERC y riesgo renal',
  detail:'Recomendaciones de protección renal en DM2 con enfermedad renal crónica',
  url:'https://diabetesjournals.org/care/article/49/Supplement_1/S246/163914'},
 cimaMet:{id:'CIMA-METFORMINA',name:'CIMA-AEMPS · Metformina de liberación inmediata',
  detail:'Ficha técnica: límites renales y contraindicaciones',
  url:'https://cima.aemps.es/cima/dochtml/ft/76579/FT_76579.html'},
 cimaEmp:{id:'CIMA-EMPAGLIFLOZINA',name:'CIMA-AEMPS · Empagliflozina',
  detail:'Ficha técnica por indicación; verificar formulación, TFGe y situaciones de interrupción',
  url:'https://cima.aemps.es/cima/pdfs/es/ft/90784/FT_90784.html.pdf'},
 cimaDap:{id:'CIMA-DAPAGLIFLOZINA',name:'CIMA-AEMPS · Dapagliflozina',
  detail:'Ficha técnica por indicación, inicio no recomendado con TFGe <25',
  url:'https://cima.aemps.es/cima/dochtml/ft/112795007/'}
});
const val=(draft,id)=>fieldState(draft,id)==='registrado'?String(draft.values[id]):null;
const num=(draft,id)=>{const a=val(draft,id);return a===null?null:Number(a)};
const multi=(draft,id)=>{const a=val(draft,id);return a===null?null:readMulti(a)};
const uniq=arr=>[...new Set(arr)];
const classesGlycemic=[
  'Metformina','iSGLT2','arGLP-1','Agonista dual GIP/GLP-1','iDPP-4',
  'Sulfonilurea','Insulina','Pioglitazona','Saxagliptina','Repaglinida'
];
function normalizedClasses(list){
 const raw=(list||[]).filter(x=>classesGlycemic.includes(x)).map(x=>x==='Saxagliptina'?'iDPP-4':x);
 return uniq(raw);
}
const card=(id,title,reason,conditions,sourceIds)=>({
 id,title,reason,conditions,sourceIds,state:'candidato_para_revision',
 patientDose:null,prescription:null,actionPerformed:false
});
/** Regla aritmética de comparación, no establece por sí sola la idoneidad del objetivo. */
export function compareIndividualGoal(hba1c,upperLimit){
 if(typeof hba1c!=='number'||!Number.isFinite(hba1c)||
    typeof upperLimit!=='number'||!Number.isFinite(upperLimit)||
    hba1c<0||upperLimit<=0)return null;
 const difference=Math.round((hba1c-upperLimit)*100)/100;
 return {hba1c,upperLimit,difference,
   state:hba1c<upperLimit?'en_objetivo':'fuera_objetivo',
   atLeastOnePointFiveAbove:difference>=1.5};
}
/**
 * Evalúa datos declarados y procedencia. No modifica la ficha ni ejecuta
 * actuaciones. Salidas «no evaluables» son deliberadas ante incertidumbre.
 */
export function evaluateDm2Detail(draft){
 const audit=auditCrossDomain(draft);
 const dm2=val(draft,'dm2'),dm1=val(draft,'dm1');
 const hba1c=num(draft,'hba1c'),goal=num(draft,'dm_objetivo_valor');
 const measured=val(draft,'fecha_hba1c'),assessed=val(draft,'fecha_evaluacion');
 const reliable=val(draft,'dm_hba1c_fiable');
 const hypogly=val(draft,'dm_hipoglucemias');
 const adherence=val(draft,'dm_adherencia');
 const doses=val(draft,'dm_dosis_confirmadas');
 const verifiedMeds=val(draft,'medicacion_revisada');
 const medList=multi(draft,'farmacos_clases');
 const medications=normalizedClasses(medList);
 const meds=new Set(medications);
 const egfr=num(draft,'tfge');
 const glucose=num(draft,'glucemia_actual');
 const symptoms=val(draft,'dm_sintomas');
 const acute=val(draft,'situacion_aguda');
 const keto=val(draft,'cetoacidosis_sospecha')==='Sí' ||
            val(draft,'acidosis_metabolica')==='Sí';
 const suspectedHypoglycemia=hypogly==='Graves o recurrentes';
 const severeHyperglycemia=(hba1c!==null&&hba1c>10)||
                          (glucose!==null&&glucose>=300)||
                          symptoms==='Poliuria, polidipsia o pérdida de peso';
 const unstable=acute==='Enfermedad aguda grave'||acute==='Cirugía mayor o ayuno prolongado';
 const missing=[],checks=[],alerts=[],nextSteps=[],alternatives=[];
 const add=(id,title,reason,conditions,sources)=>alternatives.push(card(id,title,reason,conditions,sources));
 const needed=(id,label)=>{if(val(draft,id)===null)missing.push(label)};
 needed('dm2','Confirmar diagnóstico previo de DM2.');
 needed('hba1c','Aportar HbA1c cuantitativa.');
 needed('dm_objetivo_valor','Indicar límite numérico del objetivo individual de HbA1c.');
 needed('dm_hba1c_fiable','Evaluar si la HbA1c puede interpretarse.');
 needed('dm_sintomas','Valorar síntomas de hiperglucemia.');
 needed('dm_hipoglucemias','Registrar hipoglucemias recientes.');
 needed('dm_adherencia','Valorar adherencia real.');
 needed('dm_dosis_confirmadas','Confirmar dosis y pautas actuales.');
 needed('medicacion_revisada','Conciliar tratamiento actual.');
 if(medList===null)missing.push('Registrar clases actuales o ausencia de tratamiento.');
 if(dm1===null)checks.push('Verificar que no se trata de DM1 u otra diabetes.');
 if(egfr===null)checks.push('Se necesita TFGe contrastada para evaluar restricciones por producto.');
 if(egfr!==null&&!val(draft,'fecha_tfge'))checks.push('Confirmar fecha y estabilidad de la TFGe.');
 if(hba1c!==null&&!measured)checks.push('Confirmar fecha de HbA1c; un valor sin fecha no acredita vigencia.');
 if(val(draft,'alergias_revisadas')!=='Sí')
   checks.push('Verificar alergias e intolerancias antes de valorar medicamentos.');
 if(doses!=='Sí')checks.push('Reconciliar dosis y pauta real de los medicamentos; no considerar optimizado el tratamiento.');
 if(verifiedMeds!=='Sí')checks.push('Confirmar principios activos, adherencia, dosis y tratamiento verdaderamente administrado.');
 if(adherence==='Dificultades o dosis omitidas')
   checks.push('Investigar barreras de adherencia antes de añadir una clase farmacológica.');
 if(reliable==='Posible interferencia o discordancia')
   checks.push('HbA1c posiblemente no interpretable: contrastar glucemia/MCG y causas como anemia o alteración eritrocitaria.');
 if(reliable==='No valorada')checks.push('Confirmar fiabilidad de HbA1c antes de utilizar el valor para una decisión.');
 if(hypogly==='No valoradas')checks.push('Valorar hipoglucemias; el silencio del formulario no equivale a ausencia.');
 if(dm2==='No'||dm1==='Sí')
   alerts.push('Esta ruta no corresponde a DM2 confirmada; revisar clasificación diagnóstica.');
 if(keto)
   alerts.push('Sospecha de cetoacidosis/acidosis metabólica: evaluación clínica urgente, glucemia, cetonemia y equilibrio ácido-base.');
 if(severeHyperglycemia&&!keto)
   alerts.push('Hiperglucemia importante o síntomas: valorar gravedad, glucemia actual, hidratación y cetonas; considerar evaluación de insulinización según el caso.');
 if(unstable)alerts.push('Enfermedad aguda/ayuno: priorizar situación clínica, suspensiones temporales necesarias y seguridad.');
 if(suspectedHypoglycemia)
   alerts.push('Hipoglucemias graves o recurrentes: revisar de forma prioritaria insulina, sulfonilureas y glinidas, objetivo y capacidad de autocuidado.');
 const measurementInvalid=['hba1c','dm_objetivo_valor','glucemia_actual','fecha_hba1c']
   .some(id=>fieldState(draft,id)==='revisar');
 if(measurementInvalid)alerts.push('Entrada de HbA1c, objetivo, glucemia o fecha inválida; no utilizar el valor para decisiones.');
 if(measured&&assessed&&measured>assessed)
   alerts.push('Fecha de HbA1c posterior a la evaluación: confirmar cuál es la fecha correcta.');
 const comparable=reliable==='Fiable tras comprobación'&&
   !measurementInvalid&&!(measured&&assessed&&measured>assessed);
 const comparison=comparable?compareIndividualGoal(hba1c,goal):null;
 const quickControl=val(draft,'dm_control');
 const discrepancies=[];
 if(quickControl&&comparison){
   if(quickControl==='En el objetivo individual'&&comparison.state!=='en_objetivo')
     discrepancies.push('La consulta rápida declara HbA1c en objetivo, pero la HbA1c iguala/supera el límite numérico acordado.');
   if(quickControl.startsWith('Fuera del objetivo')&&comparison.state==='en_objetivo')
     discrepancies.push('La consulta rápida declara fuera de objetivo, pero la HbA1c es inferior al límite individual acordado.');
   if(quickControl.startsWith('HbA1c ≥8,5')&&comparison.state==='en_objetivo')
     discrepancies.push('La consulta rápida señala intensificación por HbA1c, pero según el objetivo individual numérico está dentro de objetivo.');
 }
 if(quickControl==='Objetivo no establecido'&&goal!==null)
   discrepancies.push('La consulta rápida marca objetivo no establecido y en detalle consta un límite numérico; reconciliar la declaración.');
 if(medList?.includes('Sin tratamiento farmacológico')&&medications.length)
   discrepancies.push('Se declara sin tratamiento y simultáneamente clases activas.');
 if(meds.has('iDPP-4')&&(meds.has('arGLP-1')||meds.has('Agonista dual GIP/GLP-1')))
   alerts.push('iDPP-4 más tratamiento basado en GLP-1: combinación sin beneficio glucémico adicional; revisar duplicidad.');
 if(meds.has('Sulfonilurea')&&meds.has('Repaglinida'))
   alerts.push('Sulfonilurea y repaglinida: revisar duplicidad de secretagogos.');
 if(meds.has('arGLP-1')&&meds.has('Agonista dual GIP/GLP-1'))
   alerts.push('Dos terapias basadas en GLP-1: identificar si existe una transición y evitar solapamientos.');
 if(meds.has('Metformina')&&egfr!==null&&egfr<30)
   alerts.push('Metformina registrada con TFGe <30: revisar contraindicación en CIMA; no efectuar suspensión automática.');
 if(meds.has('Pioglitazona')&&val(draft,'ic')==='Sí')
   alerts.push('Pioglitazona en insuficiencia cardíaca conocida: revisar contraindicación/seguridad específica.');
 if(meds.has('Saxagliptina')&&val(draft,'ic')==='Sí')
   alerts.push('Saxagliptina con insuficiencia cardíaca: revisar perfil de seguridad y alternativas.');
 if((meds.has('Insulina')||meds.has('Sulfonilurea')||meds.has('Repaglinida'))&&
    (hypogly==='Leves'||suspectedHypoglycemia))
   alerts.push('El tratamiento actual incluye clases con riesgo de hipoglucemia: revisar pauta y medidas de prevención.');
 const acutePriority=keto||unstable||severeHyperglycemia||suspectedHypoglycemia;
 const incoherent=dm2==='No'||dm1==='Sí'||measurementInvalid||
   audit.requiresResolution||discrepancies.length>0;
 const missingCritical=dm2!=='Sí'||hba1c===null||goal===null||
   reliable!=='Fiable tras comprobación'||
   symptoms===null||symptoms==='No valorados'||
   hypogly===null||hypogly==='No valoradas'||
   adherence===null||adherence==='No valorada'||
   verifiedMeds!=='Sí'||doses!=='Sí'||medList===null||
   (egfr===null && (meds.has('Metformina')||meds.has('iSGLT2')));
 const state=(keto||suspectedHypoglycemia||severeHyperglycemia||unstable)
   ?'seguridad_prioritaria'
   :incoherent?'revisar_coherencia'
   :missingCritical?'datos_insuficientes'
   :'revision_pendiente';
 const count=medications.length;
 let situation='Evaluación detallada no concluida.';
 if(state==='seguridad_prioritaria'){
   situation='Prioridad de seguridad: resolver hiperglucemia importante, enfermedad aguda o hipoglucemias antes de intensificar.';
   nextSteps.push('Valorar clínicamente gravedad y glucemia actual; revisar tratamiento administrado y medidas de seguridad según el problema.');
 }else if(state==='revisar_coherencia'){
   situation='Los datos presentan discordancias que impiden una recomendación farmacológica.';
   nextSteps.push('Conciliar diagnóstico, objetivo individual, mediciones, procedencia y tratamiento antes de una nueva decisión.');
 }else if(state==='datos_insuficientes'){
   situation='No hay información validada suficiente para interpretar el objetivo y proponer modificaciones.';
   nextSteps.push('Completar HbA1c/objetivo y confirmar adherencia, hipoglucemias, dosis, síntomas y seguridad.');
 }else if(comparison){
   if(comparison.state==='en_objetivo'){
     situation='HbA1c por debajo del límite individual acordado.';
     nextSteps.push('No intensificar solo por HbA1c; revisar hipoglucemias, carga terapéutica y comorbilidades con beneficio independiente del control glucémico.');
   }else{
     situation='HbA1c fuera del límite individual acordado.';
     nextSteps.push('Revisar duración de tratamiento, pauta real, adherencia y causas de pérdida de control antes de decidir intensificación.');
     if(comparison.atLeastOnePointFiveAbove)
       nextSteps.push('HbA1c ≥1,5 puntos porcentuales por encima del objetivo: valorar combinación o tratamiento de mayor potencia conforme a ADA 2026, no iniciar automáticamente.');
     if(count===0)
       nextSteps.push('No constan clases antidiabéticas actuales: valorar tratamiento inicial individualizado.');
     else if(count===1)
       nextSteps.push('Consta una clase antidiabética: revisar optimización y posible asociación no duplicada.');
     else
       nextSteps.push('Constan varias clases: revisar eficacia, tolerancia, interacciones y estrategia de intensificación de forma individualizada.');
   }
   if(adherence==='Dificultades o dosis omitidas')
     nextSteps.push('Priorizar resolución de problemas de adherencia antes de atribuir fracaso terapéutico.');
 }
 // Las opciones por clase son exclusivamente contextuales y nunca superan las barreras.
 if(state==='revision_pendiente'){
   const inGoal=comparison?.state==='en_objetivo';
   const hf=val(draft,'ic')==='Sí',ckd=val(draft,'erc')==='Sí'&&val(draft,'persistencia')==='Sí';
   const cvd=val(draft,'ecv')==='Sí',bmi=num(draft,'imc');
   const obesity=bmi!==null&&bmi>=30;
   if(hf||ckd){
     if(meds.has('iSGLT2'))
       add('DM2-DETAIL-SGLT2-EXISTING','iSGLT2 ya registrado: revisar continuidad',
         'Con IC/ERC puede existir beneficio pronóstico independiente de HbA1c.',
         ['Verificar principio activo y ficha CIMA, TFGe, estado agudo y adherencia.'],
         ['ADA-2026-9','ADA-2026-11']);
     else add('DM2-DETAIL-SGLT2-REVIEW','Revisar opción iSGLT2 con beneficio cardiorrenal',
       'En IC/ ERC documentada, considerar moléculas con evidencia aunque HbA1c esté dentro del objetivo.',
       ['Verificar indicación concreta, TFGe, cetosis/enfermedad aguda y ficha técnica; no aplicar un mismo límite renal a todas las moléculas.'],
       ['ADA-2026-9','ADA-2026-11','CIMA-EMPAGLIFLOZINA','CIMA-DAPAGLIFLOZINA']);
   }
   if(cvd||obesity){
     if(meds.has('arGLP-1')||meds.has('Agonista dual GIP/GLP-1'))
       add('DM2-DETAIL-INCRETIN-EXISTING','Incretina registrada: comprobar objetivo y continuidad',
         'Revisar la molécula ya administrada y respuesta cardiometabólica antes de añadir otra.',
         ['Verificar formulación, contraindicaciones y tolerancia; no asociar otra incretina.'],
         ['ADA-2026-9']);
     else add('DM2-DETAIL-INCRETIN-REVIEW','Valorar terapia basada en GLP-1 adecuada al perfil',
       'Considerar moléculas con evidencia cardiovascular y/o beneficio en peso según condición concreta.',
       ['Revisar formulación, pancreatitis, gestación, síntomas gastrointestinales, retinopatía y financiación del producto.'],
       ['ADA-2026-9']);
   }
   if(!inGoal){
     if(meds.has('Metformina'))
       add('DM2-DETAIL-METFORMIN-EXISTING','Metformina actual: comprobar dosis y tolerancia',
         'Revisar dosis realmente administrada, función renal y tolerancia antes de atribuir fracaso a esta clase.',
         ['Comprobar contraindicación con TFGe <30, situaciones de interrupción y presentación exacta en CIMA.'],
         ['CIMA-METFORMINA','ADA-2026-9']);
     else if(egfr!==null&&egfr>=30)
       add('DM2-DETAIL-METFORMIN-REVIEW','Valorar metformina como opción glucémica',
         'La metformina puede contribuir al control cuando se considera apropiada para el perfil individual.',
         ['Verificar TFGe, acidosis/hipoxia, insuficiencia hepática, contraste, cirugía y ficha de presentación.'],
         ['CIMA-METFORMINA','ADA-2026-9']);
     else checks.push('No proponer metformina sin TFGe valorada o con TFGe <30.');
   }
   if(inGoal&&(meds.has('Insulina')||meds.has('Sulfonilurea')||meds.has('Repaglinida')))
     add('DM2-DETAIL-HYPO-REVIEW','Comprobar necesidad de simplificación si riesgo de hipoglucemia',
       'Un objetivo alcanzado no justifica mantener automáticamente fármacos de riesgo si la carga o el daño supera beneficios.',
       ['Revisar hipoglucemias, objetivos funcionales, patrones de glucosa y dosis reales.'],
       ['ADA-2026-6','ADA-2026-9']);
   if(adherence==='Dificultades o dosis omitidas')
     checks.push('No calificar tratamiento de ineficaz hasta abordar adherencia y modo de administración.');
 }
 checks.push('La elegibilidad y financiación requieren comprobación actual por producto en CIMA/BIFIMED.');
 const followUp=state==='seguridad_prioritaria'
   ?'La revisión de seguridad debe efectuarse según gravedad clínica, sin esperar al próximo control rutinario.'
   :comparison?.state==='en_objetivo'
     ?'Si el control permanece estable, reevaluación de HbA1c al menos dos veces al año; antes si cambian riesgos o tratamiento.'
     :'Cuando no se cumple el objetivo o tras ajustes reales, valorar HbA1c aproximadamente cada tres meses, individualizando el seguimiento.';
 return {
  module:'dm2',mode:'detail',state,situation,objective:{
    hba1c,limit:goal,comparison,reliable:reliable==='Fiable tras comprobación',
    message:comparison?
      (comparison.state==='en_objetivo'
        ?'HbA1c inferior al objetivo individual aportado.'
        :'HbA1c en o por encima del objetivo individual aportado.')
      :'Objetivo o HbA1c no evaluables; no aplicar un objetivo universal.'
  },
  medicationSummary:{classes:medications,count,verified:verifiedMeds==='Sí',
    dosesConfirmed:doses==='Sí',adherence},
  nextSteps:uniq(nextSteps),alerts:uniq([...alerts,...discrepancies,
    ...audit.critical.map(x=>x.title)]),
  missing:uniq(missing),checks:uniq(checks),alternatives,
  sources:DM2_DETAIL_SOURCES,sourceIds:uniq([
   'REDGDPS-DM2-2026','ADA-2026-6','ADA-2026-9',
   ...(alternatives.some(x=>x.id.includes('SGLT2'))?['ADA-2026-11']:[])
  ]),followUp,
  patientDose:null,prescription:null,actionPerformed:false,noPrescription:true,
  clinicalValidation:'pendiente'
 };
}
