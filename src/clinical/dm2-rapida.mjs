/**
 * CaHReMe: orientación DM2 rápida original, no prescriptiva.
 * Fuentes: redGDPS 2026 (algoritmo de DM2); ADA Standards 2026 §9, §6.
 * La cifra 8,5% orienta intensidad, NO constituye objetivo universal
 * ni por sí sola indicación automática de insulina.
 */
import {fieldState} from '../model.mjs';
import {readMulti} from '../consultas.mjs';
import {auditCrossDomain} from './auditoria.mjs';

export const DM2_QUICK_SOURCES=Object.freeze({
  redgdps2026:{
    id:'REDGDPS-DM2-2026',name:'Fundación redGDPS · algoritmo DM2 2026',
    detail:'Condicionantes clínicos, dos niveles de intensidad, objetivos individualizados y reevaluación',
    url:'https://redgdps.org/algoritmo-de-tratamiento-de-la-dm2-de-la-redgdps-2026/'
  },
  ada9:{
    id:'ADA-2026-9',name:'ADA 2026 · Pharmacologic Approaches',
    detail:'Recomendaciones 9.6–9.12, 9.16–9.21; seguridad e intensidad por perfil',
    url:'https://diabetesjournals.org/care/article/49/Supplement_1/S183/163934'
  },
  ada6:{
    id:'ADA-2026-6',name:'ADA 2026 · Glycemic Goals',
    detail:'Recomendación 6.2: periodicidad de evaluación según control y cambios',
    url:'https://diabetesjournals.org/care/article/49/Supplement_1/S132/163927'
  }
});
const v=(draft,id)=>fieldState(draft,id)==='registrado'?String(draft.values[id]):null;
const n=(draft,id)=>{const value=v(draft,id);return value===null?null:Number(value)};
const multi=(draft,id)=>{const value=v(draft,id);return value===null?null:readMulti(value)};
const unique=items=>[...new Set(items)];
function option(id,title,reason,checks,sourceIds){
  return {id,title,reason,checks,sourceIds,actionPerformed:false,patientDose:null};
}
export function evaluateDm2Quick(draft){
  const control=v(draft,'dm_control');
  const priorities=multi(draft,'dm_prioridad');
  const meds=multi(draft,'farmacos_clases');
  const classes=new Set(meds||[]);
  const hba1c=n(draft,'hba1c'),egfr=n(draft,'tfge');
  const bmi=n(draft,'imc');
  const objective=v(draft,'dm_objetivo'),symptoms=v(draft,'dm_sintomas');
  const reason=v(draft,'dm2');
  const dm1=v(draft,'dm1');
  const acute=v(draft,'situacion_aguda');
  const keto=v(draft,'cetoacidosis_sospecha')==='Sí';
  const audit=auditCrossDomain(draft);
  const notes=[],checks=[],safety=[],missing=[],options=[];
  const add=(id,title,reason,requirements,sourceIds)=>
    options.push(option(id,title,reason,requirements,sourceIds));
  if(!control) missing.push('Seleccionar situación del control glucémico.');
  if(priorities===null) missing.push('Seleccionar condicionantes clínicos presentes (o ninguno).');
  if(reason===null)checks.push('Confirmar diagnóstico previo de DM2; el módulo no establece diagnóstico.');
  if(dm1===null)checks.push('Comprobar que no se trata de diabetes tipo 1 u otra forma de diabetes.');
  if(meds===null)checks.push('Conciliar tratamiento actual antes de valorar un cambio de clase o duplicidades.');
  if(v(draft,'medicacion_revisada')!=='Sí')checks.push('Revisar medicamento concreto, dosis, tolerancia y adherencia.');
  if(v(draft,'alergias_revisadas')!=='Sí')checks.push('Comprobar alergias y contraindicaciones por producto en CIMA.');
  if(egfr===null)checks.push('Disponer de TFGe contrastada para evaluar seguridad y límites de cada producto.');
  if(v(draft,'fecha_tfge')===null && egfr!==null)
    checks.push('Comprobar fecha y estabilidad clínica de la TFGe.');
  if(priorities?.includes('Enfermedad renal crónica') && v(draft,'persistencia')!=='Sí')
    checks.push('Confirmar cronicidad renal y diagnóstico de ERC antes de atribuir indicación.');
  if(priorities?.includes('Fragilidad') && !objective)
    checks.push('Individualizar objetivo en fragilidad y revisar episodios de hipoglucemia.');
  if(meds?.includes('Sin tratamiento farmacológico') && meds.length>1)
    safety.push('Datos de tratamiento incompatibles: conciliar si recibe medicamentos.');

  // Una rama rápida declarada no sustituye a valores medidos si estos existen.
  if(control && hba1c!==null){
    const high=control.startsWith('HbA1c ≥8,5');
    const low=control.startsWith('Fuera del objetivo · HbA1c inferior');
    if((high && hba1c<8.5)||(low && hba1c>=8.5))
      safety.push('El tramo seleccionado no coincide con la HbA1c registrada: revisar ambos datos.');
  }
  if(control && symptoms){
    if(control.endsWith('sin síntomas') && symptoms==='Poliuria, polidipsia o pérdida de peso')
      safety.push('La rama indica ausencia de síntomas, pero se documentan síntomas de hiperglucemia.');
    if(control.endsWith('con síntomas') && symptoms==='Ausentes')
      safety.push('La rama indica síntomas, pero se documenta su ausencia.');
  }
  const urgentSymptoms=control==='HbA1c ≥8,5 % · con síntomas' ||
    symptoms==='Poliuria, polidipsia o pérdida de peso';
  const severeGlycemia=hba1c!==null && hba1c>10;
  const severeRisk=keto || v(draft,'acidosis_metabolica')==='Sí';
  const unstable=acute==='Enfermedad aguda grave'||acute==='Cirugía mayor o ayuno prolongado';
  if(severeRisk){
    safety.push('Sospecha de cetoacidosis o acidosis metabólica: valoración clínica urgente; comprobar glucemia, cetonas y equilibrio ácido-base.');
  } else if(urgentSymptoms){
    safety.push('Síntomas de hiperglucemia: comprobar glucemia actual, hidratación y desencadenantes. Valorar cetonas y gravedad; derivación urgente si sospecha de crisis.');
  }
  if(severeGlycemia)
    safety.push('HbA1c >10%: valorar necesidad de insulinización tras comprobar clínica, glucemia y seguridad, sin asumir una pauta automática.');
  if(unstable)
    safety.push('Situación aguda: priorizar estabilización y reconciliación; no iniciar/escalar tratamiento crónico desde esta consulta.');
  if(reason==='No'||dm1==='Sí'){
    safety.push('La ruta rápida de DM2 no es aplicable con DM2 negada o DM1 afirmada; revisar diagnóstico.');
  }
  const mismatch=safety.some(text=>text.includes('no coincide')||text.includes('La rama indica'));
  const blocked=!!audit.requiresResolution || mismatch || reason==='No' || dm1==='Sí';
  const acutePriority=severeRisk||urgentSymptoms||severeGlycemia||unstable;
  const status=blocked?'revisar_coherencia'
    :acutePriority?'seguridad_prioritaria'
    :missing.length?'datos_insuficientes':'revision_pendiente';
  let situation='Faltan datos para situar la rama DM2 rápida.';
  const nextSteps=[];
  if(blocked){
    situation='Incoherencias clínicas: no presentar opciones de inicio.';
    nextSteps.push('Conciliar diagnóstico, síntomas, mediciones y campos contradictorios antes de aplicar el algoritmo.');
    safety.push(...audit.critical.map(x=>x.title));
  } else if(acutePriority){
    situation='Prioridad de seguridad y gravedad clínica antes de cualquier intensificación.';
    nextSteps.push('Valorar signos vitales y glucemia actual; investigar síntomas y desencadenantes, y cetonemia/ácido-base cuando proceda.');
    if(!severeRisk)nextSteps.push('Considerar insulinización según evaluación clínica si hay síntomas importantes o hiperglucemia marcada; no iniciar mediante esta pantalla.');
  } else if(!control||priorities===null){
    nextSteps.push('Completar los dos criterios de la consulta rápida.');
  } else if(control==='Objetivo no establecido'){
    situation='Objetivo de HbA1c no individualizado.';
    nextSteps.push('Acordar un objetivo individual por edad, fragilidad, hipoglucemia, comorbilidades y preferencias; no intensificar a partir del corte de 8,5% aislado.');
  } else if(control==='En el objetivo individual'){
    situation='Control glucémico declarado dentro del objetivo individual.';
    nextSteps.push('No intensificar solo por HbA1c. Revisar tolerancia, episodios de hipoglucemia y carga de tratamiento.');
    if(!objective)checks.push('Confirmar valor y fecha del objetivo de HbA1c acordado.');
  } else if(control==='Fuera del objetivo · HbA1c inferior a 8,5 %'){
    situation='Fuera del objetivo personalizado, en tramo de menor intensidad de inicio de redGDPS 2026.';
    if(meds===null)nextSteps.push('Identificar qué toma antes de decidir monoterapia, asociación o modificación.');
    else{
      const count=unique(meds.filter(x=>[
        'Metformina','iSGLT2','arGLP-1','Agonista dual GIP/GLP-1','iDPP-4','Sulfonilurea',
        'Insulina','Pioglitazona','Saxagliptina','Repaglinida'].includes(x))
        .map(x=>x==='Saxagliptina'?'iDPP-4':x)).length;
      if(classes.has('Insulina'))nextSteps.push('Ya usa insulina: revisar glucemias, hipoglucemia, técnica y esquema antes de plantear intensificación.');
      else if(count===0)nextSteps.push('Sin tratamiento antidiabético registrado: valorar primera clase según comorbilidades, TFGe y tolerancia.');
      else if(count===1)nextSteps.push('Con monoterapia: revisar adherencia y valorar segunda clase apropiada si sigue fuera de objetivo.');
      else if(count===2)nextSteps.push('Con dos clases: revisar control y considerar una tercera clase no duplicada según perfil.');
      else nextSteps.push('Con múltiples clases: comprobar adherencia/efectos adversos y valorar una estrategia de intensificación individualizada.');
    }
  } else if(control==='HbA1c ≥8,5 % · sin síntomas'){
    situation='Hiperglucemia de mayor intensidad inicial según redGDPS 2026, sin síntomas declarados.';
    nextSteps.push('Verificar glucemia y ausencia de síntomas, revisar tratamiento previo y considerar combinación de clases si la evaluación completa lo justifica.');
    if(meds===null)nextSteps.push('No se puede escoger combinación sin conciliación de medicamentos actuales.');
  }
  const sources=['REDGDPS-DM2-2026','ADA-2026-9','ADA-2026-6'];
  const risk=priorities||[];
  const cardiorenal=risk.includes('Insuficiencia cardíaca')||
    risk.includes('Enfermedad renal crónica')||
    v(draft,'ic')==='Sí'||v(draft,'erc')==='Sí';
  const cv=risk.includes('Enfermedad cardiovascular / riesgo elevado')||
    v(draft,'ecv')==='Sí';
  const obesity=risk.includes('Obesidad')||(bmi!==null&&bmi>=30);
  const hepatic=risk.includes('Enfermedad hepática metabólica')||
    v(draft,'esteatosis')==='Sí';
  const frailty=risk.includes('Fragilidad');
  if(!blocked&&!acutePriority&&control&&priorities!==null){
    if(cardiorenal) {
      const label=classes.has('iSGLT2')?'Clase iSGLT2 ya registrada: revisar adecuación':
        'Revisar una clase iSGLT2 con beneficio cardiorrenal';
      add('DM2-CARDIORENAL',label,
        'El beneficio cardiovascular y renal de moléculas con evidencia puede ser relevante incluso con HbA1c en objetivo.',
        ['Confirmar indicación IC/ERC, TFGe y su tendencia, situación aguda y producto concreto en CIMA.',
        'La elegibilidad no equivale a un umbral universal para todos los iSGLT2.'],['ADA-2026-9','REDGDPS-DM2-2026']);
    }
    if(cv && !(classes.has('arGLP-1')||classes.has('Agonista dual GIP/GLP-1'))) {
      add('DM2-CV', 'Valorar clase con beneficio cardiovascular demostrado',
        'Si existe ECV establecida o riesgo alto, revisar arGLP-1/otras opciones con evidencia según molécula y comorbilidades.',
        ['Reconciliar tratamiento actual, contraindicaciones, tolerancia y financiación por presentación.'],
        ['ADA-2026-9','REDGDPS-DM2-2026']);
    }
    if((obesity||hepatic) && !(classes.has('arGLP-1')||classes.has('Agonista dual GIP/GLP-1'))) {
      add('DM2-WEIGHT','Revisar tratamiento glucémico con objetivos de peso',
        'En DM2 con obesidad o MASLD y exceso ponderal, valorar opciones que también aporten beneficios metabólicos; no implica indicación hepática aislada.',
        ['Confirmar IMC y comorbilidades; diferenciar indicación diabética de control del peso, molécula, ficha CIMA y financiación.'],
        ['ADA-2026-9']);
    }
    if(frailty){
      checks.push('Revisar funcionalidad, expectativa de vida, hipoglucemias y simplificación; evitar objetivos desproporcionados.');
      if(classes.has('Sulfonilurea')||classes.has('Insulina'))
        safety.push('Fragilidad y fármacos con riesgo de hipoglucemia: revisar necesidad de desintensificación.');
    }
    if(classes.has('Metformina') && egfr!==null && egfr<30)
      safety.push('Metformina registrada con TFGe <30: revisar contraindicación CIMA; no suspender automáticamente desde la app.');
    if(classes.has('iDPP-4') &&
      (classes.has('arGLP-1')||classes.has('Agonista dual GIP/GLP-1')))
      safety.push('iDPP-4 junto a terapia basada en GLP-1: asociación no recomendada; confirmar tratamientos simultáneos.');
    if(classes.has('Sulfonilurea')&&classes.has('Repaglinida'))
      safety.push('Sulfonilurea y repaglinida: revisar posible duplicidad secretagoga.');
    if(control!=='En el objetivo individual' && control!=='Objetivo no establecido' &&
       !cardiorenal && !cv && !obesity && !hepatic){
       add('DM2-GLYCEMIC','Individualizar intensificación glucémica',
         'Seleccionar una clase no duplicada según tratamiento previo, objetivo y riesgo de hipoglucemia.',
         ['Confirmar TFGe, medicación actual, adherencia y preferencias antes de cualquier decisión.'],
         ['REDGDPS-DM2-2026','ADA-2026-9']);
    }
  }
  const followUp=control==='En el objetivo individual'
    ?'Considerar HbA1c aproximadamente cada 6 meses si estabilidad mantenida.'
    :'Si no está en objetivo o cambia el tratamiento, reevaluar HbA1c aproximadamente a los 3 meses; adaptar a la situación clínica.';
  return {
    module:'dm2',state:status,title:'DM2 · orientación rápida',
    situation,nextSteps:unique(nextSteps),options:options.map(x=>({...x,
      status:'candidato_para_revision',prescription:null})),
    safety:unique(safety),checks:unique(checks),missing:unique(missing),
    followUp:acutePriority?'La reevaluación aguda se decide por gravedad; no demorarla por el control de HbA1c.':followUp,
    sources:DM2_QUICK_SOURCES,sourceIds:sources,
    auditStatus:audit.status,noPrescription:true,patientDose:null,actionPerformed:false,
    scope:'Información orientativa para profesionales, no tratamiento recomendado ni diagnóstico individual.'
  };
}
