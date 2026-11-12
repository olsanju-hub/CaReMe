/** Consulta renal original. KDIGO 2024; sin diagnóstico ni prescripción. */
import {evaluateRenal,SOURCES} from './engine.mjs';
import {fieldState,FIELDS} from '../model.mjs';
import {readMulti} from '../consultas.mjs';
import {auditCrossDomain} from './auditoria.mjs';
const get=(d,id)=>fieldState(d,id)==='registrado'?d.values[id]:null;
const num=(d,id)=>{const x=get(d,id);return x===null||!/^(?:\d+\.?\d*|\.\d+)$/.test(x)?null:Number(x)};
export function evaluateKidney(draft,mode='quick'){
 if(!['quick','detail'].includes(mode))throw new Error('Modo renal desconocido');
 const classification=evaluateRenal(draft),audit=auditCrossDomain(draft);
 const e=classification.inputs.egfr.value,a=classification.inputs.acr.value;
 const k=num(draft,'potasio'),acute=get(draft,'situacion_aguda'),lra=get(draft,'lra_sospecha');
 const missing=[],alerts=[],steps=[],referral=[],checks=[];
 const add=(id,text)=>referral.push({id,text,performed:false});
 for(const id of ['tfge','cac','unidad_cac','persistencia','lra_sospecha','situacion_aguda'])
  if(get(draft,id)===null)missing.push('Completar '+FIELDS[id].label+'.');
 if(lra===null||lra==='No valorado')missing.push('Descartar lesión renal aguda antes de interpretar ERC estable.');
 if(acute===null||acute==='No valorada')missing.push('Confirmar estabilidad clínica.');
 if(k===null)missing.push('Potasio actual para revisar seguridad.');
 if(lra==='Sí')alerts.push('Sospecha de lesión renal aguda: valoración prioritaria; no aplicar seguimiento de ERC estable.');
 if(acute && acute!=='Estable sin proceso agudo grave' && acute!=='No valorada')
  alerts.push('Situación aguda: valorar función renal y estado de volumen antes del circuito crónico.');
 if(k!==null&&k>=6.5)alerts.push('Potasio ≥6,5 mmol/L: evaluación y tratamiento inmediatos.');
 else if(k!==null&&k>=6)alerts.push(lra==='Sí'||acute==='Enfermedad aguda grave'
  ?'Potasio 6,0–6,4 mmol/L con enfermedad aguda o LRA: evaluación hospitalaria.'
  :'Potasio 6,0–6,4 mmol/L: evaluación clínica prioritaria; si es inesperado y el paciente está bien, repetir en un máximo de 24 h. No demorar si hay síntomas o cambios ECG.');
 else if(k!==null&&k>5.5)alerts.push('Potasio >5,5 mmol/L: revisar muestra, evolución y fármacos antes de cambios crónicos.');
 const pending=get(draft,'persistencia')!=='Sí';
 if(pending)steps.push('Confirmar persistencia ≥3 meses con documentación previa o reevaluación; no esperar tres meses ante sospecha de lesión aguda.');
 if(!classification.markerPresent)checks.push('G1/G2 con A1 no confirma ERC; buscar otros marcadores y causa si procede.');
 steps.push('Revisar causa renal, presión arterial, estado de volumen y medicación realmente administrada, incluidos AINE y productos sin receta.');
 checks.push('No suspender IECA/ARA-II ni otros tratamientos automáticamente por una cifra aislada de TFGe o potasio.');
 for(const id of ['fecha_evaluacion','fecha_tfge','fecha_cac','fecha_potasio'])
  if(get(draft,id)===null)missing.push('Confirmar '+FIELDS[id].label+'; no se presupone actualidad.');
 {
  if(num(draft,'edad')===null)missing.push('Edad para confirmar ámbito adulto.');
  if(get(draft,'erc_contexto')===null||get(draft,'erc_contexto')==='No valorado')missing.push('Confirmar ausencia de diálisis o trasplante.');
  if(get(draft,'embarazo')===null||get(draft,'embarazo')==='No valorado')missing.push('Confirmar contexto de embarazo.');
  if(get(draft,'erc_hematuria')===null||get(draft,'erc_hematuria')==='No valorada')missing.push('Valorar hematuria y sedimento.');
 }
 const rawAge=draft.unavailable.includes('edad')?'':String(draft.values.edad||'');
 const outside=(/^\d+$/.test(rawAge)&&Number(rawAge)<18)||get(draft,'embarazo')==='Sí'||['Diálisis','Trasplante renal'].includes(get(draft,'erc_contexto'));
 if(outside)alerts.push('Fuera del circuito de ERC general adulta: utilizar evaluación específica de pediatría, embarazo, diálisis o trasplante según corresponda.');
 const invalid=classification.status==='invalid'||audit.requiresResolution;
 for(const x of audit.critical)alerts.push(x.title+': '+x.detail);
 // La derivación por cifra baja no depende de que se haya confirmado cronicidad.
 if(e!==null&&e<30)add('EGFR_LT30','TFGe <30: valorar derivación a Nefrología; si el descenso es reciente o sintomático, valorar urgencia antes de la derivación programada.');
 if(a!==null&&a>700){
  if(get(draft,'erc_cac_persistente')==='Sí')add('ACR_GT700','CAC >700 mg/g confirmado en muestras repetidas: criterio de valoración por Nefrología.');
  else steps.push('CAC >700 mg/g: confirmar repetición y contexto; no asumir persistencia del valor actual por la cronicidad global.');
 }
 if(a!==null&&a>=300&&get(draft,'erc_hematuria')==='Sí')
  add('ACR_HEMATURIA','Albuminuria ≥300 mg/g con hematuria persistente: valorar Nefrología.');
 if(e!==null&&e<60&&!pending)steps.push('Valorar riesgo renal con una ecuación externamente validada para G3–G5 (p. ej., KFRE). No se calcula aquí; un riesgo a 5 años de 3–5 % puede apoyar derivación junto al resto de criterios.');
 checks.push('Los criterios de derivación mostrados son parciales: causa incierta, hematuria/cilindros, descenso sostenido, HTA refractaria y complicaciones persistentes también requieren valoración.');
 const treatment=evaluateRenalTreatment(draft);
 alerts.push(...treatment.alerts);
 missing.push(...treatment.missing);
 const stable=!treatment.requiresEarlierReview&&!pending&&classification.markerPresent&&classification.status==='calculated'&&lra==='No'&&acute==='Estable sin proceso agudo grave'&&!alerts.length&&!missing.length&&!invalid&&!outside;
 const followUp=stable
  ?'Controlar TFGe y albuminuria al menos anualmente; aumentar frecuencia según riesgo G/A, evolución y cambios terapéuticos. No se asigna una cita automática.'
  :treatment.requiresEarlierReview&&treatment.state==='controles_documentados'
  ?'Controles tras el cambio documentados. Individualizar próximos controles según evolución, TFGe y potasio; esta comprobación no autoriza cambios de dosis.'
  :'No asignar un intervalo de ERC estable: revisar seguridad, datos pendientes y seguimiento tras cambios terapéuticos; individualizar la reevaluación.';
 if(stable)checks.push('Cambios posteriores: variación de TFGe >20 %, caída >30 % tras terapia hemodinámica o duplicación de CAC justifican evaluación; no demuestran progresión por sí solos.');
 const state=outside?'fuera_de_ambito':alerts.length?'seguridad_prioritaria':invalid?'revisar_coherencia':missing.length||pending?'datos_insuficientes':'revision_pendiente';
 return {state,mode,classification,treatment,missing:[...new Set(missing)],alerts:[...new Set(alerts)],steps,checks,
  referral:invalid||outside?[]:referral,followUp,stableFollowUp:stable,
  sources:[{...SOURCES.kdigo2024,locator:'PP 1.1.3; PP 2.1.1–5; PP 2.2.1; figura 48; tabla 28; PP 3.6.2–7'}],
  noPrescription:true,patientDose:null,prescription:null,actionPerformed:false};
}

/**
 * Observación de IECA/ARA-II ya administrado. No selecciona molécula/dosis.
 * KDIGO 2024 PP 3.6.2–7. Las fechas son ventana orientativa de revisión,
 * no cita, orden de laboratorio ni registro nuevo de administración.
 */
export function evaluateRenalTreatment(draft){
 const missing=[],alerts=[],checks=[];
 const rawMeds=get(draft,'farmacos_clases');
 const meds=rawMeds===null?[]:readMulti(rawMeds);
 const ras=meds.filter(x=>['IECA','ARA-II'].includes(x));
 const event=get(draft,'ras_evento');
 const changed=['Inicio administrado','Aumento de dosis administrado'].includes(event);
 let window=null,creatinineChange=null;
 const out=state=>({state,missing:[...new Set(missing)],alerts:[...new Set(alerts)],checks,
  window,creatinineChange,requiresEarlierReview:(ras.length>0||changed)&&(state!=='sin_cambio_reciente'),
  noPrescription:true,patientDose:null,prescription:null,actionPerformed:false,
  source:'KDIGO-2024-CKD',locator:'PP 3.6.2–7'});
 if(!ras.length){
  if(changed){alerts.push('Se ha declarado un cambio de IECA/ARA-II pero no consta esa clase en el tratamiento actual. Conciliar antes del seguimiento.');return out('revisar_coherencia');}
  checks.push(meds.includes('INRA/ARNI')?'ARNI no se evalúa mediante esta regla de IECA/ARA-II: revisar su ficha específica.':'No consta IECA/ARA-II actual; no se propone iniciar uno desde este panel.');
  return out('no_aplicable');
 }
 checks.push('Revisar principio activo, dosis realmente administrada, tolerancia e interacciones antes de cualquier decisión.');
 checks.push('No retirar IECA/ARA-II automáticamente por TFGe <30 ni por una cifra aislada de potasio.');
 if(ras.length>1||meds.includes('INRA/ARNI')){
  alerts.push('Posible doble bloqueo IECA/ARA-II/ARNI: conciliar tratamiento antes de interpretar continuidad.');return out('revisar_coherencia');
 }
 const age=num(draft,'edad');
 const rawAge=draft.unavailable.includes('edad')?'':String(draft.values.edad||'');
 if((/^\d+$/.test(rawAge)&&Number(rawAge)<18)||get(draft,'embarazo')==='Sí'||['Diálisis','Trasplante renal'].includes(get(draft,'erc_contexto'))){
  alerts.push('Este contexto requiere seguimiento específico; no se genera ventana general de ERC adulta.');return out('fuera_de_ambito');
 }
 const audit=auditCrossDomain(draft);
 if(audit.requiresResolution)alerts.push('Resolver las alertas críticas de la ficha antes de planificar seguimiento de tratamiento crónico.');
 if(get(draft,'ras_hipotension')==='Sí')alerts.push('Hipotensión sintomática: valoración clínica antes de la revisión programada; no se modifica la pauta automáticamente.');
 if(get(draft,'lra_sospecha')==='Sí')alerts.push('Sospecha de lesión renal aguda: resolver situación actual antes del seguimiento crónico.');
 const k=num(draft,'potasio');
 if(k!==null&&k>5.5)alerts.push('Potasio elevado: priorizar evaluación de seguridad; no esperar a la ventana de control rutinario.');
 if(get(draft,'situacion_aguda') && !['Estable sin proceso agudo grave','No valorada'].includes(get(draft,'situacion_aguda')))
  alerts.push('Situación aguda: individualizar monitorización antes del circuito estable.');
 if(alerts.length)return out('seguridad_prioritaria');
 for(const id of ['edad','embarazo','erc_contexto','medicacion_revisada','situacion_aguda','lra_sospecha','ras_hipotension','fecha_evaluacion'])
  if(get(draft,id)===null)missing.push('Completar '+FIELDS[id].label+'.');
 if(age===null||age<18)missing.push('Confirmar ámbito adulto.');
 if(!['No','No procede'].includes(get(draft,'embarazo')))missing.push('Confirmar contexto de embarazo.');
 if(get(draft,'erc_contexto')!=='Adulto sin diálisis ni trasplante')missing.push('Confirmar ausencia de diálisis o trasplante.');
 if(get(draft,'medicacion_revisada')!=='Sí'||!get(draft,'farmacos'))missing.push('Confirmar conciliación e identificar principio activo y dosis actual.');
 if(get(draft,'situacion_aguda')!=='Estable sin proceso agudo grave'||get(draft,'lra_sospecha')!=='No'||get(draft,'ras_hipotension')!=='No')missing.push('Confirmar estabilidad, ausencia de LRA e hipotensión sintomática.');
 if(event==='Sin cambio reciente'){
  checks.push('Sin cambio reciente confirmado: revisar función renal, potasio y presión según situación clínica; no se aplica una nueva ventana de 2–4 semanas.');
  return out(missing.length?'datos_insuficientes':'sin_cambio_reciente');
 }
 if(!changed)missing.push('Confirmar si hubo inicio o aumento reciente realmente administrado.');
 if(get(draft,'ras_evento_confirmado')!=='Sí')missing.push('Confirmar explícitamente que el inicio o aumento fue administrado.');
 const day=id=>{const x=get(draft,id);return x===null?null:Date.parse(x+'T00:00:00Z')/86400000};
 const asOf=day('fecha_evaluacion'),start=day('fecha_ras_evento');
 if(start===null)missing.push('Fecha efectiva del cambio confirmado.');
 if(start!==null&&asOf!==null&&start>asOf){alerts.push('Fecha de cambio posterior a la evaluación: corregir la cronología.');return out('revisar_coherencia');}
 // No inferir una administración a partir de una fecha aislada o una propuesta.
 if(missing.length)return out('datos_insuficientes');
 const iso=d=>new Date(d*86400000).toISOString().slice(0,10);
 const measurements=[['creatinina','fecha_creatinina'],['potasio','fecha_potasio'],['pas','fecha_pas']];
 let allReviewed=true;
 for(const [id,dateId] of measurements){
  const value=num(draft,id),date=day(dateId);
  if(value===null||value<=0||date===null||date<start){allReviewed=false;missing.push('Documentar '+FIELDS[id].label+' y su fecha tras el cambio.');}
  if(date!==null&&date>asOf)alerts.push('La fecha de '+FIELDS[id].label+' es posterior a la evaluación.');
 }
 const base=num(draft,'creatinina_basal_ras'),current=num(draft,'creatinina');
 const baseDate=day('fecha_creatinina_basal_ras'),currentDate=day('fecha_creatinina');
 if(base===null||base<=0||baseDate===null){missing.push('Creatinina basal positiva y fechada antes del cambio para valorar variación.');allReviewed=false;}
 if(baseDate!==null&&baseDate>start)alerts.push('La creatinina basal está fechada después del cambio: no es referencia previa válida.');
 if(alerts.length)return out('revisar_coherencia');
 if(base!==null&&base>0&&baseDate!==null&&baseDate<=start&&current!==null&&current>0&&currentDate!==null&&currentDate>=start&&currentDate<=asOf){
  const percent=(current-base)/base*100;
  creatinineChange={percent,withinFourWeeks:currentDate-start<=28,exceedsThirtyPercent:percent>30+1e-9};
  if(creatinineChange.exceedsThirtyPercent){
   alerts.push(creatinineChange.withinFourWeeks
    ?'Creatinina aumentó >30 % en las primeras 4 semanas: valorar causas y tratamiento con prioridad; no suspender automáticamente.'
    :'Creatinina aumentó >30 %, pero la medición está fuera de las primeras 4 semanas: revisar deterioro y contexto sin atribuirlo automáticamente al cambio.');
   return out('seguridad_prioritaria');
  }
 }
 checks.push('KDIGO recomienda comprobar presión arterial, creatinina y potasio en 2–4 semanas tras inicio o aumento; la TFGe y el potasio pueden requerir controles antes.');
 checks.push('Un aumento ≤30 % de creatinina no acredita seguridad global ni autoriza mantener o aumentar dosis.');
 if(allReviewed && measurements.every(([,d])=>day(d)>=start+14))return out('controles_documentados');
 window={from:iso(start+14),to:iso(start+28),status:asOf>start+28?'plazo_superado':asOf>=start+14?'en_ventana':'pendiente',
  checks:['Presión arterial','Creatinina sérica','Potasio sérico'],appointmentCreated:false};
 if(window.status==='plazo_superado')checks.push('La ventana orientativa ha pasado y faltan controles documentados: revisar ahora; no reiniciar el plazo desde hoy.');
 if(allReviewed)checks.push('Hay controles tempranos, pero no se da por cerrada la revisión de 2–4 semanas.');
 return out('monitorizacion_pendiente');
}
