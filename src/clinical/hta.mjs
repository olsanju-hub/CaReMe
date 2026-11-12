/** HTA: evaluación original para revisión, ESC 2024. Sin prescripción. */
import {FIELDS,fieldState} from '../model.mjs';
import {readMulti} from '../consultas.mjs';
import {auditCrossDomain} from './auditoria.mjs';
import {evaluateCvRisk} from './riesgo-cv.mjs';
export const HTA_SOURCE={title:'ESC 2024 · PA elevada e hipertensión',url:'https://academic.oup.com/eurheartj/article/45/38/3912/7741010',locator:'Tabla 5; secciones 5, 6, 8 y 10'};
export const HTA_FIELDS=['edad','embarazo','fecha_evaluacion','hta_conocida','pas','pad','fecha_pas','hta_consulta_calidad',
 'hta_fuera_metodo','hta_fuera_pas','hta_fuera_pad','hta_fuera_fecha','hta_fuera_calidad','hta_alarma','hta_dano_agudo',
 'hta_tratamiento','hta_ortostatismo','hta_fragilidad','hta_expectativa','hta_tolerancia','hta_habitos',
 'situacion_aguda','lra_sospecha','tfge','fecha_tfge','potasio','fecha_potasio','ecv',
 'farmacos_clases','farmacos','medicacion_revisada','alergias','alergias_revisadas'];
const get=(d,id)=>fieldState(d,id)==='registrado'?d.values[id]:null;
const number=(d,id)=>{const x=get(d,id);return x!==null&&/^(?:\d+\.?\d*|\.\d+)$/.test(x)?Number(x):null};
const OUT_THRESHOLDS={'AMPA':[135,85],'MAPA 24 horas':[130,80],'MAPA diurna':[135,85],'MAPA nocturna':[120,70]};
export function classifyOfficeBp(sbp,dbp){
 if(![sbp,dbp].every(x=>typeof x==='number'&&Number.isFinite(x)&&x>0)||dbp>=sbp)return null;
 return sbp>=140||dbp>=90?'rango_hta':sbp>=120||dbp>=70?'pa_elevada':'pa_no_elevada';
}
export function classifyOutOfOffice(sbp,dbp,method){
 if(!OUT_THRESHOLDS[method]||![sbp,dbp].every(x=>typeof x==='number'&&Number.isFinite(x)&&x>0)||dbp>=sbp)return null;
 const [s,d]=OUT_THRESHOLDS[method];return sbp>=s||dbp>=d?'rango_hta':'bajo_umbral_hta';
}
export function evaluateHypertension(draft){
 const missing=[],alerts=[],steps=[],checks=[],options=[];
 let state='datos_insuficientes',pattern='no_evaluable',target=null,followUp='Individualizar la revisión tras completar seguridad, calidad y procedencia de las mediciones.';
 const result=()=>({state,pattern,target,missing:[...new Set(missing)],alerts:[...new Set(alerts)],steps,checks,options,followUp,source:HTA_SOURCE,
  office:officeUsable?officeCategory:null,outside:outsideUsable?outsideCategory:null,
  prescription:null,patientDose:null,diagnosisEstablished:false,actionPerformed:false});
 const sbp=number(draft,'pas'),dbp=number(draft,'pad'),outSbp=number(draft,'hta_fuera_pas'),outDbp=number(draft,'hta_fuera_pad');
 const asOf=get(draft,'fecha_evaluacion');
 const dated=id=>!!(asOf&&get(draft,id)&&get(draft,id)<=asOf);
 const officeCategory=classifyOfficeBp(sbp,dbp),outsideCategory=classifyOutOfOffice(outSbp,outDbp,get(draft,'hta_fuera_metodo'));
 const officeUsable=!!officeCategory&&dated('fecha_pas')&&get(draft,'hta_consulta_calidad')==='Media de mediciones estandarizadas';
 const outsideUsable=!!outsideCategory&&dated('hta_fuera_fecha')&&get(draft,'hta_fuera_calidad')==='Media válida según protocolo revisado';
 const rawFlags=readMulti(String(draft.values.hta_alarma||'[]'));
 const activeFlags=rawFlags.filter(x=>x!=='Sin señales de alarma tras valoración');
 const severe=(sbp!==null&&sbp>=180)||(dbp!==null&&dbp>=110)||(outSbp!==null&&outSbp>=180)||(outDbp!==null&&outDbp>=110);
 // Las alarmas no desaparecen por un formato contradictorio o por faltar PA.
 if(activeFlags.length||get(draft,'hta_dano_agudo')==='Sospecha clínica'){
  state='seguridad_prioritaria';alerts.push('Valorar de forma urgente los síntomas o el posible daño agudo de órgano; la PA aislada no confirma ni excluye una emergencia.');
  alerts.push(...activeFlags);followUp='Priorizar valoración clínica urgente; no esperar al seguimiento programado.';return result();
 }
 if(severe){
  state='seguridad_prioritaria';alerts.push('PA aportada ≥180 sistólica o ≥110 diastólica: repetir con técnica correcta y valorar daño agudo de órgano ahora.');
  if(get(draft,'hta_dano_agudo')==='No identificado tras valoración'&&get(draft,'hta_alarma')!==null){
   steps.push('Sin daño agudo identificado tras valoración: confirmar pronto la persistencia, preferiblemente dentro de una semana, y revisar tratamiento profesionalmente.');
   followUp='Confirmación preferente en una semana solo después de descartar emergencia; individualizar antes si hay cambios clínicos.';
  }else missing.push('Evaluación de síntomas y daño agudo de órgano.');
  return result();
 }
 const age=number(draft,'edad'),rawAge=draft.unavailable.includes('edad')?'':String(draft.values.edad||'');
 if((/^\d+$/.test(rawAge)&&Number(rawAge)<18)||get(draft,'embarazo')==='Sí'){
  state='fuera_de_ambito';alerts.push('Utilizar circuito específico de pediatría o gestación.');return result();
 }
 const audit=auditCrossDomain(draft);alerts.push(...audit.critical.map(x=>x.title));
 for(const id of HTA_FIELDS)if(fieldState(draft,id)==='revisar')alerts.push('Revisar '+FIELDS[id].label+'.');
 for(const id of ['fecha_pas','hta_fuera_fecha'])if(asOf&&get(draft,id)&&get(draft,id)>asOf)alerts.push(FIELDS[id].label+': posterior a la evaluación.');
 if(alerts.length){state='revisar_coherencia';return result();}
 if(age===null)missing.push('Edad adulta documentada.');
 if(!['No','No procede'].includes(get(draft,'embarazo')))missing.push('Confirmar contexto de embarazo.');
 if(!asOf)missing.push('Fecha de evaluación.');
 if(!get(draft,'hta_alarma'))missing.push('Valorar señales de alarma; no presumir su ausencia.');
 if(get(draft,'hta_dano_agudo')!=='No identificado tras valoración')missing.push('Valorar daño agudo de órgano.');
 if(get(draft,'situacion_aguda')!=='Estable sin proceso agudo grave'||get(draft,'lra_sospecha')!=='No')missing.push('Confirmar estabilidad y ausencia de lesión renal aguda antes del circuito crónico.');
 if(get(draft,'situacion_aguda')==='Enfermedad aguda grave'||get(draft,'lra_sospecha')==='Sí'){
  state='seguridad_prioritaria';alerts.push('Resolver situación aguda antes del algoritmo de HTA crónica.');return result();
 }
 if(!officeUsable)missing.push('PA media de consulta válida, estandarizada y fechada.');
 if(officeUsable&&outsideUsable){
  const oh=officeCategory==='rango_hta',eh=outsideCategory==='rango_hta',treated=get(draft,'hta_tratamiento')==='Con tratamiento confirmado';
  pattern=oh&&eh?'elevacion_sostenida':oh?(treated?'efecto_bata_blanca':'compatible_bata_blanca'):eh?(treated?'posible_mal_control_enmascarado':'compatible_hta_enmascarada'):'sin_elevacion_diagnostica_sostenida';
 }else if(officeUsable)pattern='consulta_'+officeCategory;
 if(officeUsable&&!outsideUsable){
  if(officeCategory==='rango_hta'){
   steps.push('Confirmar con AMPA o MAPA si es factible; si no está disponible, repetir mediciones estandarizadas en otra visita y documentar el contexto. MAPA no es imprescindible en todos los casos.');
   followUp=sbp>=160||dbp>=100?'Confirmar con prontitud, dentro de un mes, salvo motivos para valoración antes.':'Confirmar el rango de HTA con mediciones adicionales antes de establecer diagnóstico nuevo.';
  }else steps.push('Valorar riesgo cardiovascular y necesidad de AMPA/MAPA según contexto, especialmente ante sospecha de HTA enmascarada.');
 }
 if(pattern==='compatible_bata_blanca'||pattern==='efecto_bata_blanca')steps.push('Revisar discordancia consulta/domicilio; no intensificar automáticamente por la cifra de consulta.');
 if(pattern==='compatible_hta_enmascarada'||pattern==='posible_mal_control_enmascarado')steps.push('La media fuera de consulta está en rango de HTA: confirmar el registro y valorar riesgo/daño de órgano, aunque la consulta esté por debajo del umbral.');
 const classes=get(draft,'farmacos_clases')===null?[]:readMulti(get(draft,'farmacos_clases'));
 const treated=get(draft,'hta_tratamiento')==='Con tratamiento confirmado',untreated=get(draft,'hta_tratamiento')==='Sin tratamiento';
 if(untreated&&classes.some(x=>['IECA','ARA-II','INRA/ARNI','ARM','Betabloqueante','Diurético de asa','Calcioantagonista dihidropiridínico','Diurético tiazídico o similar'].includes(x))){
  state='revisar_coherencia';alerts.push('Se declara ausencia de tratamiento antihipertensivo pero constan clases con efecto sobre la PA: conciliar indicación y administración.');return result();
 }
 if(!treated&&!untreated)missing.push('Confirmar tratamiento antihipertensivo actual.');
 if(!get(draft,'hta_conocida')||get(draft,'hta_conocida')==='No consta')missing.push('Verificar antecedente de HTA confirmada.');
 const unsafeGoal=age!==null&&age>=85||get(draft,'hta_ortostatismo')==='Sí'||get(draft,'hta_fragilidad')==='Sí'||get(draft,'hta_expectativa')==='Sí'||get(draft,'hta_tolerancia')==='No'||(number(draft,'tfge')!==null&&number(draft,'tfge')<30);
 const goalReviewed=['hta_ortostatismo','hta_fragilidad','hta_expectativa'].every(id=>get(draft,id)==='No')&&get(draft,'hta_tolerancia')==='Sí';
 if(unsafeGoal)checks.push('Individualizar objetivo: edad ≥85, ortostatismo, fragilidad, expectativa limitada, intolerancia o ERC avanzada impiden aplicar automáticamente el objetivo intensivo.');
 const coreReady=missing.length===0&&officeUsable&&age!==null;
 if(coreReady&&treated&&get(draft,'hta_conocida')==='Sí'&&goalReviewed&&!unsafeGoal){
  target={sbp:[120,129],dbp:[70,79],context:'Objetivo de PA de consulta durante tratamiento, solo si se tolera; no es umbral diagnóstico ni objetivo automático de MAPA.'};
  if(sbp<120||dbp<70)checks.push('PA por debajo del intervalo objetivo: revisar síntomas y tolerancia; no intensificar automáticamente.');
  else if(sbp<=129&&dbp<=79)checks.push('PA de consulta dentro del objetivo de referencia; mantener revisión clínica de tolerancia y contexto.');
 }
 if(treated&&!goalReviewed&&!unsafeGoal)checks.push('Completar ortostatismo, fragilidad, tolerancia y objetivos individuales antes de valorar intensificación.');
 const drugSafety=get(draft,'medicacion_revisada')==='Sí'&&get(draft,'alergias_revisadas')==='Sí'&&
  number(draft,'tfge')!==null&&number(draft,'tfge')>0&&dated('fecha_tfge')&&number(draft,'potasio')!==null&&number(draft,'potasio')>=3.5&&number(draft,'potasio')<5&&dated('fecha_potasio');
 if(coreReady&&pattern==='elevacion_sostenida'){
  steps.push('Revisar hábitos y tratamiento de la PA persistentemente elevada; el patrón es una orientación para valoración, no un diagnóstico automático.');
  if(drugSafety&&untreated&&get(draft,'hta_conocida')==='Sí'&&!unsafeGoal&&['hta_ortostatismo','hta_fragilidad','hta_expectativa'].every(id=>get(draft,id)==='No')){
   options.push({id:'HTA-INIT-REVIEW',title:'Valorar inicio de tratamiento farmacológico junto a hábitos',
    detail:'Revisar IECA o ARA-II, calcioantagonista dihidropiridínico y/o diurético tiazídico o similar según contexto. No combinar dos bloqueantes del SRAA.',
    checks:['Comprobar molécula, dosis, contraindicaciones e interacciones en CIMA antes de prescribir.','Individualizar monoterapia o combinación; no se selecciona una pauta desde este panel.'],prescription:null,patientDose:null,performed:false});
  }else if(treated){
   steps.push('Antes de intensificar: verificar adherencia y dosis reales, técnica de medición, efecto de bata blanca, interacciones y causas secundarias si procede. No declarar resistencia desde el número de clases.');
  }else checks.push('Completar conciliación, alergias, función renal y potasio antes de valorar fármacos.');
  followUp='Revisiones frecuentes durante ajuste, por ejemplo cada 1–3 meses, buscando control en unos 3 meses; antes si lo requiere la situación clínica.';
 }
 if(coreReady&&untreated&&get(draft,'hta_conocida')==='No'&&officeCategory==='pa_elevada'&&outsideCategory!=='rango_hta'){
  const risk=evaluateCvRisk(draft);const highRisk=get(draft,'ecv')==='Sí'||risk.percent!==null&&risk.percent>=10;
  steps.push('PA elevada sin HTA confirmada: hábitos y evaluación del riesgo cardiovascular global; no usar el umbral CKM 130/80 como diagnóstico de HTA.');
  if((sbp>=130||dbp>=80)&&highRisk){
   checks.push(get(draft,'hta_habitos')==='≥3 meses documentados y PA persistentemente elevada'
    ?'Con alto riesgo documentado y PA ≥130/80 persistente tras ≥3 meses de hábitos, valorar tratamiento farmacológico tras confirmación extraconsulta y revisión de seguridad.'
    :'Con alto riesgo documentado, reevaluar tras unos 3 meses de intervención sobre hábitos y confirmar PA fuera de consulta antes de valorar fármacos.');
  }else checks.push('Si no hay alto riesgo confirmado, no inferirlo ni iniciar medicación automáticamente; completar estratificación y decisión compartida.');
 }
 checks.push('Los resultados de consulta, AMPA y cada periodo de MAPA tienen umbrales distintos. No se intercambian cifras ni objetivos.');
 if(!options.length)checks.push('Este panel no emite una pauta individual ni modifica la medicación existente.');
 state=missing.length?'datos_insuficientes':'orientacion_para_revision';return result();
}
