/**
 * CaHReMe — seguimiento y continuidad (REFERENCIAS de ficha técnica).
 * Regla clínica orientativa, no prescripción. Las acciones realizadas se
 * registran solo si el profesional las confirma explícitamente.
 * CIMA Kerendia 1211616002 §§4.2, tablas 2 y 4 (consulta 2026-11-12).
 * CIMA Jardiance 114930014 §§4.2 y 4.4 (consulta 2026-11-12).
 */
import { fieldState } from '../model.mjs';
import { getDrugRoute } from './farmacologia.mjs';

export const CONTINUITY_SOURCES = Object.freeze({
  finerenona: {
    url:'https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html',
    reference:'CIMA Kerendia 4.2, tablas 2 y 4; 4.4',
    reviewed:'2026-11-12'
  },
  empagliflozina: {
    url:'https://cima.aemps.es/cima/dochtml/ft/114930014',
    reference:'CIMA Jardiance 4.2 y 4.4',
    reviewed:'2026-11-12'
  }
});

const get = (draft, key) =>
  fieldState(draft, key) === 'registrado' ? String(draft.values[key]) : null;
const num = (draft, key) => {
  const v=get(draft,key);
  return v === null ? null : Number(v);
};
const answer = (drugId, routeId, ruleId, state, title, guidance, missing=[], cautions=[]) => ({
  drugId, routeId, ruleId, state, title, guidance, missing, cautions,
  source:CONTINUITY_SOURCES[drugId],
  patientDose:null, prescription:null, actionPerformed:false
});
const percentFall = (oldValue,newValue) =>
  typeof oldValue === 'number' && oldValue > 0 && typeof newValue === 'number'
    ? ((oldValue-newValue)/oldValue)*100 : null;

export function reviewFinerenoneContinuation(draft, routeId) {
  if(!['erc_dm2','ic_fevi40'].includes(routeId)) throw new Error('Indicación finerenona no válida');
  const doseRaw=get(draft,'fin_dosis_actual');
  const dose=doseRaw===null ? null:Number(doseRaw);
  const status=get(draft,'fin_estado');
  const potassium=num(draft,'potasio');
  const egfr=num(draft,'tfge');
  const prior=num(draft,'fin_tfge_previa');
  const initial=num(draft,'fin_tfge_inicio');
  const fall=percentFall(prior,egfr);
  const missing=[];
  if(status === null || status === 'No confirmado') missing.push('Confirmar estado del tratamiento.');
  if(egfr === null) missing.push('TFGe actual.');
  if(potassium === null) missing.push('Potasio sérico actual.');
  if(status === 'En tratamiento' && dose === null) missing.push('Dosis de finerenona realmente administrada.');
  if(routeId==='ic_fevi40' && initial===null)
    missing.push('TFGe al inicio de la indicación cardíaca (determina objetivo de dosis).');

  if(status === 'Interrumpido') {
    return answer('finerenona',routeId,'FIN-RESTART-CONTEXT','revision_contextual',
      'Reinicio pendiente de reevaluación','La ficha diferencia condiciones de reinicio según indicación, potasio y motivo previo de suspensión. No reiniciar automáticamente.',
      [...missing.filter(x=>x!=='Dosis de finerenona realmente administrada.'),'Documentar motivo y fecha de interrupción.'],
      ['Comprobar interacciones, función renal, potasio y estabilidad antes de reconsiderar reinicio.']);
  }
  if(status==='En tratamiento' && potassium!==null &&
     ((routeId==='erc_dm2' && potassium>5.5) || (routeId==='ic_fevi40' && potassium>=6)))
    return answer('finerenona',routeId,'FIN-POTASSIUM-PRIORITY','alerta',
      'Potasio alto durante finerenona: revisión prioritaria',
      'La ficha indica interrupción con este potasio según la indicación. Requiere evaluación profesional inmediata, incluso si faltan otros datos.',
      missing,['Confirmar la medicación y valorar la hiperpotasemia; no se registra suspensión automática.']);
  if(status==='En tratamiento' && egfr!==null && egfr<15)
    return answer('finerenona',routeId,'FIN-ESKD','alerta',
      'TFGe <15: revisar interrupción conforme a ficha técnica',
      'La ficha indica interrumpir finerenona en enfermedad renal terminal (TFGe <15).',
      missing,['Confirmar evolución renal, potasio y situación clínica.']);
  if(status==='En tratamiento' && routeId==='ic_fevi40' &&
     potassium!==null && potassium>=5.5 && potassium<6 && dose===null)
    return answer('finerenona',routeId,'FIN-HF-K55-UNKNOWN-DOSE','precaucion',
      'Potasio ≥5,5: falta dosis para aplicar tabla cardíaca',
      'Según la dosis actual, la tabla 4 indica reducción o interrupción; no se puede seleccionar la rama sin confirmar la dosis.',
      missing, ['Revisar potasio y situación clínica sin demorar la valoración.']);
  if(missing.length) return answer('finerenona',routeId,'FIN-INCOMPLETE','datos_insuficientes',
    'No evaluable', 'Faltan datos esenciales para revisar la continuación del tratamiento.',
    missing);
  if(dose === 40 && routeId === 'erc_dm2')
    return answer('finerenona',routeId,'FIN-CKD-DOSE-INVALID','alerta',
      'Dosis no contemplada en ERC asociada a DM2',
      'La ficha para ERC-DM2 establece un máximo de 20 mg/día; confirmar indicación y pauta antes de aplicar tablas.',
      [], ['No utilizar automáticamente la tabla de IC.']);
  if(egfr < 15) return answer('finerenona',routeId,'FIN-ESKD','alerta',
    'TFGe <15: revisar interrupción conforme a ficha técnica',
    'CIMA indica interrumpir finerenona si se progresa a enfermedad renal terminal (TFGe <15).',
    [], ['Confirmar función renal, evolución y situación clínica.']);
  if(routeId==='erc_dm2') {
    if(potassium > 5.5) return answer('finerenona',routeId,'FIN-CKD-HOLD','alerta',
      'Ficha CIMA: interrupción por potasio >5,5',
      'La tabla 2 indica interrumpir finerenona. El reinicio depende del potasio ≤5,0 y dosis previa.',
      [], ['Evaluar hiperpotasemia y medidas urgentes si corresponden; no registrar la suspensión como realizada.']);
    if(potassium > 4.8) return answer('finerenona',routeId,'FIN-CKD-MAINTAIN','referencia',
      'Ficha CIMA: mantener dosis documentada',
      'Con K >4,8 a 5,5 mmol/L, la tabla 2 mantiene 10 o 20 mg/día según dosis actual.');
    if(dose === 20) return answer('finerenona',routeId,'FIN-CKD-MAINTAIN','referencia',
      'Ficha CIMA: mantener 20 mg',
      'Con potasio ≤4,8 y 20 mg actuales, la tabla 2 mantiene 20 mg/día.');
    if(fall===null) return answer('finerenona',routeId,'FIN-CKD-PREV-EGFR','datos_insuficientes',
      'Falta TFGe previa para valorar ajuste',
      'Con K ≤4,8 y 10 mg, la tabla 2 contempla subir a 20 mg salvo descenso de TFGe >30 %.',
      ['TFGe de medición anterior.']);
    if(fall>30) return answer('finerenona',routeId,'FIN-CKD-EGFR-FALL','precaucion',
      'Ficha CIMA: mantener 10 mg si descenso TFGe >30 %',
      'La tabla 2 indica mantener 10 mg/día si TFGe ha descendido >30 % respecto a la medición anterior.');
    return answer('finerenona',routeId,'FIN-CKD-UPTITRATE','referencia',
      'Ficha CIMA: considerar aumento de 10 a 20 mg',
      'Con K ≤4,8 y descenso de TFGe no superior al 30 %, la tabla 2 contempla aumento. Verificar contexto e indicación antes de prescribir.');
  }

  // IC FEVI >=40: tabla 4. Diferencia de fronteras 5,0 / 5,5 / 6,0.
  if(potassium >= 6) return answer('finerenona',routeId,'FIN-HF-HOLD','alerta',
    'Ficha CIMA: interrupción con K ≥6,0',
    'La tabla 4 indica interrumpir a cualquier dosis. La reanudación exige reevaluar el potasio y sus causas.',
    [], ['No registrar la interrupción como ya efectuada; evaluar gravedad de la hiperpotasemia.']);
  if(potassium >= 5.5) {
    if(dose === 10) return answer('finerenona',routeId,'FIN-HF-K55-HOLD','alerta',
      'Ficha CIMA: interrumpir 10 mg con K 5,5 a <6,0',
      'La tabla 4 indica interrupción a dosis actual de 10 mg; el reinicio requiere nueva valoración.');
    if(dose === 20) return answer('finerenona',routeId,'FIN-HF-K55-REDUCE10','precaucion',
      'Ficha CIMA: reducir 20 a 10 mg con K 5,5 a <6,0',
      'Tabla 4: reducción de la dosis actual de 20 a 10 mg.');
    return answer('finerenona',routeId,'FIN-HF-K55-REDUCE20','precaucion',
      'Ficha CIMA: reducir 40 a 20 mg con K 5,5 a <6,0',
      'Tabla 4: reducción de la dosis actual de 40 a 20 mg.');
  }
  if(fall!==null && fall>=40) return answer('finerenona',routeId,'FIN-HF-GFR40','precaucion',
    'Descenso TFGe ≥40 %: revisión prioritaria',
    'La ficha indica considerar reducir o interrumpir si TFGe desciende ≥40 %; no aplicar subida automática.',
    [], ['Comprobar contexto clínico y potasio, con valoración médica prioritaria.']);
  if(dose===40 && initial<60) return answer('finerenona',routeId,'FIN-HF-40-INITIAL-GFR','precaucion',
    'Dosis actual 40 mg con objetivo de ficha de 20 mg',
    'Con TFGe inicial entre 25 y <60, la dosis objetivo en IC es 20 mg/día. Revisar indicación y pauta actual.',
    [], ['No modificar la pauta automáticamente.']);
  if(dose===40 && fall!==null && fall>30)
    return answer('finerenona',routeId,'FIN-HF-40-EGFR30','precaucion',
      'Ficha CIMA: reducir 40 a 20 mg por descenso TFGe >30 %',
      'Tabla 4: con 40 mg y descenso de TFGe >30 % respecto a medición anterior, reducir a 20 mg.');
  if(potassium >= 5) return answer('finerenona',routeId,'FIN-HF-K50-MAINTAIN','referencia',
    'Ficha CIMA: mantener dosis si K 5,0 a <5,5',
    'Tabla 4: mantener 10, 20 o 40 mg según dosis documentada, salvo condiciones renales que exijan reducción.');
  if(dose===40) return answer('finerenona',routeId,'FIN-HF-40-MAINTAIN','referencia',
    'Ficha CIMA: mantener 40 mg',
    'Con K <5,0, la tabla 4 mantiene 40 mg si no concurre descenso de TFGe relevante.');
  if(fall===null) return answer('finerenona',routeId,'FIN-HF-PREV-EGFR','datos_insuficientes',
    'Falta TFGe previa para valorar subida',
    'La tabla 4 exige conocer el descenso porcentual de TFGe antes de subir desde 10 o 20 mg.',
    ['TFGe de medición anterior.']);
  if(fall>30) return answer('finerenona',routeId,'FIN-HF-GFR30','precaucion',
    'No aplicar subida si TFGe ha caído >30 %',
    'La tabla 4 condiciona el aumento a que la caída de TFGe no supere el 30 %.');
  if(dose===20 && initial<60) return answer('finerenona',routeId,'FIN-HF-20-TARGET','referencia',
    'Ficha CIMA: mantener 20 mg por TFGe inicial <60',
    'La dosis objetivo de IC con TFGe inicial entre 25 y <60 es 20 mg/día.');
  return dose===10
    ? answer('finerenona',routeId,'FIN-HF-UP20','referencia',
        'Ficha CIMA: considerar subir de 10 a 20 mg',
        'Tabla 4: con K <5,0 y sin descenso de TFGe >30 %, puede revisarse titulación a 20 mg.')
    : answer('finerenona',routeId,'FIN-HF-UP40','referencia',
        'Ficha CIMA: considerar subir de 20 a 40 mg',
        'Solo si TFGe inicial ≥60, K <5,0 y sin caída de TFGe >30 %, tras revisión profesional.');
}

export function reviewEmpagliflozinContinuation(draft, routeId) {
  if(!['dm2','ic','erc'].includes(routeId)) throw new Error('Indicación empagliflozina no válida');
  const status=get(draft,'emp_estado');
  const doseRaw=get(draft,'emp_dosis_actual');
  const dose=doseRaw===null ? null:Number(doseRaw);
  const egfr=num(draft,'tfge');
  const acute=get(draft,'situacion_aguda');
  const keto=get(draft,'cetoacidosis_sospecha');
  const ketones=get(draft,'emp_cetonas');
  const stable=get(draft,'emp_estable');
  const priorDka=get(draft,'emp_dka_previa');
  const triggerResolved=get(draft,'emp_factor_resuelto');
  const missing=[];
  if(status===null || status==='No confirmado') missing.push('Estado real de empagliflozina.');
  if(status==='En tratamiento' && dose===null) missing.push('Dosis realmente administrada.');
  if(egfr===null) missing.push('TFGe reciente.');
  const acuteRisk=['Enfermedad aguda grave','Cirugía mayor o ayuno prolongado'].includes(acute);
  if(status==='Interrumpido') {
    if(keto==='Sí') return answer('empagliflozina',routeId,'EMP-DKA-PRIORITY','alerta',
      'Sospecha de cetoacidosis: no reanudar',
      'La ficha requiere evaluación inmediata. No presuponer que la suspensión ya se ha realizado.',
      [], ['Confirmar actuación médica y estado metabólico.']);
    if(priorDka==='Sí' && triggerResolved!=='Sí') return answer('empagliflozina',routeId,'EMP-PRIOR-DKA','precaucion',
      'No recomendar reinicio tras cetoacidosis asociada a iSGLT2',
      'CIMA desaconseja el reinicio tras cetoacidosis durante iSGLT2 salvo causa desencadenante identificada y claramente resuelta.',
      ['Documentar causa y resolución del episodio previo.']);
    if(acuteRisk || stable!=='Sí' || ketones!=='Normales')
      return answer('empagliflozina',routeId,'EMP-RESTART-UNCONFIRMED','datos_insuficientes',
        'Reanudación no evaluable',
        'La reanudación tras enfermedad aguda grave o cirugía requiere cetonas normalizadas y estabilidad clínica.',
        [...(ketones!=='Normales'?['Cetonas normales confirmadas.']:[]),
          ...(stable!=='Sí'?['Estabilidad clínica confirmada.']:[]),
          ...(acuteRisk?['Resolución de la situación aguda.']:[])]);
    return answer('empagliflozina',routeId,'EMP-RESTART-REVIEW','revision_contextual',
      'Condiciones registradas para revisión del reinicio',
      'Se declara normalización de cetonas y estabilidad; confirmar indicación, riesgo de nueva cetoacidosis y ficha antes de reanudar.',
      [], ['No se genera pauta de reinicio ni se registra una reanudación automática.']);
  }
  if(keto==='Sí') return answer('empagliflozina',routeId,'EMP-DKA','alerta',
    'CIMA: suspensión ante cetoacidosis sospechada',
    'La ficha indica suspender inmediatamente empagliflozina y evaluar cetoacidosis, incluso con glucemia no muy elevada.',
    [], ['Valorar atención urgente; la acción no se registra como efectuada.']);
  if(acuteRisk) return answer('empagliflozina',routeId,'EMP-ACUTE-HOLD','alerta',
    'CIMA: interrupción durante enfermedad grave o cirugía mayor',
    'Durante hospitalización por enfermedad grave o cirugía mayor, la ficha indica interrumpir, valorar cetonemia y revisar futura reanudación.',
    [], ['No se registra interrupción automática.']);
  if(missing.length) return answer('empagliflozina',routeId,'EMP-INCOMPLETE','datos_insuficientes',
    'Datos de continuidad incompletos','No es posible revisar pauta actual sin confirmar tratamiento y TFGe.',
    missing);
  if(routeId!=='dm2' && dose===25) return answer('empagliflozina',routeId,'EMP-25-VERIFY','precaucion',
    'Dosis de 25 mg requiere confirmar indicación DM2',
    'La dosis de referencia en IC y ERC es 10 mg/día; 25 mg se contempla para optimización glucémica de DM2.',
    [], ['Confirmar si coexiste DM2 y existe indicación independiente para 25 mg.']);
  if(routeId==='dm2' && dose===10) {
    const need=get(draft,'emp_control_insuficiente');
    const tolerated=get(draft,'emp_tolerancia');
    if(egfr>=60 && need==='Sí' && tolerated==='Sí')
      return answer('empagliflozina',routeId,'EMP-DM2-25-CONSIDER','referencia',
        'Ficha CIMA: posible intensificación glucémica a 25 mg',
        'Solo en DM2, con 10 mg tolerados, TFGe ≥60 y necesidad de mayor control glucémico, revisar la opción de 25 mg.',
        [], ['No se modifica dosis sin confirmación médica.']);
  }
  return answer('empagliflozina',routeId,'EMP-CONTINUE-REVIEW','referencia',
    'Revisión de continuidad de empagliflozina',
    'No se identifican en estos datos desencadenantes automáticos de interrupción; revisar tolerancia, función renal, volemia y factores de riesgo.',
    [], ['Ausencia de alerta en este formulario no equivale a seguridad confirmada.']);
}

const ACTIONS = new Set(['inicio','reinicio','ajuste','interrupcion']);
function parseISO(date) {
  if(typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year,month,day]=date.split('-').map(Number);
  const d=new Date(Date.UTC(year,month-1,day));
  return d.getUTCFullYear()===year && d.getUTCMonth()+1===month && d.getUTCDate()===day?d:null;
}
function plusDays(date,n) {
  const d=parseISO(date);
  d.setUTCDate(d.getUTCDate()+n);
  return d.toISOString().slice(0,10);
}
function plusYear(date) {
  const d=parseISO(date),originalDay=d.getUTCDate();
  const year=d.getUTCFullYear()+1, month=d.getUTCMonth();
  const maximum=new Date(Date.UTC(year,month+1,0)).getUTCDate();
  return new Date(Date.UTC(year,month,Math.min(maximum,originalDay))).toISOString().slice(0,10);
}
export function confirmedAction(history, action) {
  if(!Array.isArray(history)) throw new Error('Historial de sesión inválido');
  if(action?.confirmedByClinician !== true)
    throw new Error('Es necesaria confirmación explícita de la actuación realizada');
  if(!getDrugRoute(action.drugId,action.routeId))
    throw new Error('Principio activo o indicación desconocidos');
  if(!ACTIONS.has(action.type)) throw new Error('Actuación no admitida');
  if(!parseISO(action.performedOn)) throw new Error('Fecha de realización no válida');
  const allowed=action.drugId==='finerenona'?[10,20,40]:[10,25];
  const dose=action.type==='interrupcion'?null:Number(action.doseMg);
  if(action.type!=='interrupcion' && (!allowed.includes(dose) || action.doseMg===null || action.doseMg===undefined || action.doseMg===''))
    throw new Error('Confirma la dosis realmente administrada para esta actuación');
  return [...history, Object.freeze({
    drugId:action.drugId,routeId:action.routeId,type:action.type,
    performedOn:action.performedOn,doseMg:dose,confirmed:true
  })];
}
export function followUpFromHistory(history) {
  if(!Array.isArray(history)) throw new Error('Historial no válido');
  const events=[];
  for(const [actionIndex, action] of history.entries()) {
    if(action.confirmed!==true || !parseISO(action.performedOn)) continue;
    if(action.drugId==='finerenona' && ['inicio','reinicio','ajuste'].includes(action.type)) {
      events.push({
        performedOn:action.performedOn, actionIndex,
        drugId:action.drugId,routeId:action.routeId,
        dueOn:plusDays(action.performedOn,28),
        description:'Control de potasio sérico y TFGe a las 4 semanas',
        source:CONTINUITY_SOURCES.finerenona.url,
        trigger:action.type
      });
    } else if(action.drugId==='empagliflozina' &&
      ['inicio','reinicio'].includes(action.type)) {
      events.push({
        performedOn:action.performedOn, actionIndex,
        drugId:action.drugId,routeId:action.routeId,
        dueOn:plusYear(action.performedOn),
        description:'Comprobar función renal al menos anualmente; adelantar según contexto clínico',
        source:CONTINUITY_SOURCES.empagliflozina.url,
        trigger:action.type
      });
    } else if(action.type==='interrupcion') {
      events.push({
        drugId:action.drugId,routeId:action.routeId,dueOn:null,
        description:'Reevaluación clínica para decidir continuidad/reinicio (sin fecha fija en esta regla)',
        source:CONTINUITY_SOURCES[action.drugId].url,trigger:action.type
      });
    }
  }
  for(const event of events) {
    if(!event.dueOn) {
      event.status='requiere_reevaluacion';
      continue;
    }
    const subsequent=history.some((action,index)=>
      index>event.actionIndex && action.confirmed===true &&
      action.drugId===event.drugId && action.routeId===event.routeId &&
      (event.drugId==='finerenona'
        ? ['ajuste','interrupcion','reinicio','inicio'].includes(action.type)
        : ['interrupcion','reinicio'].includes(action.type)) &&
      parseISO(action.performedOn) &&
      action.performedOn>=event.performedOn && action.performedOn<=event.dueOn);
    event.status=subsequent?'sustituido':'previsto';
    // Ninguna fecha se elimina: se conserva el historial documental de controles.
  }
  return events.map(({actionIndex,performedOn,...event})=>event);
}
