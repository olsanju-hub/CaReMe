/** Consulta renal original. KDIGO 2024; sin diagnóstico ni prescripción. */
import {evaluateRenal,SOURCES} from './engine.mjs';
import {fieldState,FIELDS} from '../model.mjs';
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
 const stable=!pending&&classification.markerPresent&&classification.status==='calculated'&&lra==='No'&&acute==='Estable sin proceso agudo grave'&&!alerts.length&&!missing.length&&!invalid&&!outside;
 const followUp=stable
  ?'Controlar TFGe y albuminuria al menos anualmente; aumentar frecuencia según riesgo G/A, evolución y cambios terapéuticos. No se asigna una cita automática.'
  :'No asignar un intervalo de ERC estable: resolver seguridad, datos ausentes y cronicidad; individualizar la reevaluación.';
 if(stable)checks.push('Cambios posteriores: variación de TFGe >20 %, caída >30 % tras terapia hemodinámica o duplicación de CAC justifican evaluación; no demuestran progresión por sí solos.');
 const state=outside?'fuera_de_ambito':alerts.length?'seguridad_prioritaria':invalid?'revisar_coherencia':missing.length||pending?'datos_insuficientes':'revision_pendiente';
 return {state,mode,classification,missing:[...new Set(missing)],alerts:[...new Set(alerts)],steps,checks,
  referral:invalid||outside?[]:referral,followUp,stableFollowUp:stable,
  sources:[{...SOURCES.kdigo2024,locator:'PP 1.1.3; PP 2.1.1–5; PP 2.2.1; figura 48; tabla 28'}],
  noPrescription:true,patientDose:null,prescription:null,actionPerformed:false};
}
