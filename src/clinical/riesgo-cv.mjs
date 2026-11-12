/** SCORE2 original: parámetros publicados por los autores, EHJ 2022, tabla 1.
 * Implementación matemática propia; región baja. No es SCORE2-OP ni Diabetes.
 * El resultado no se convierte en objetivo lipídico, pauta o estadio CKM.
 */
import {FIELDS,fieldState,externalOpAssociationValid} from '../model.mjs';
import {auditCrossDomain} from './auditoria.mjs';
export const CV_FIELDS=['edad','cv_sexo_modelo','cv_region','tabaco','ecv','ic','dm1','dm2','erc',
 'embarazo','cv_hfamiliar','cv_sintomas','pas','pad','fecha_pas','colesterol_total','hdl','ldl','fecha_lipidos','fecha_evaluacion'];
export const OP_FIELDS=['cv_op_porcentaje','cv_op_fecha','cv_op_fuente','cv_op_contexto','cv_op_confirmado'];
export const CV_SOURCES=[
 {title:'SCORE2-OP: publicación original',url:'https://doi.org/10.1093/eurheartj/ehab312',locator:'Modelo para personas mayores; material suplementario pendiente de verificación completa para cálculo local'},
 {title:'SCORE2: coeficientes y recalibración publicados por los autores',url:'https://academic.oup.com/eurheartj/article/43/3/241/6433491',locator:'Tabla 1; DOI 10.1093/eurheartj/ehab761'},
 {title:'ESC: SCORE2 y SCORE2-OP',url:'https://www.escardio.org/guidelines/practice-tools/cvd-prevention-toolbox/score2-and-score2-op-calculators/',locator:'Poblaciones por edad'},
 {title:'HeartScore: regiones de riesgo',url:'https://www.heartscore.org/en_GB/heartscore-europe-risk-regions',locator:'España: región baja'},
 {title:'ESC 2023: riesgo en diabetes',url:'https://academic.oup.com/eurheartj/article/44/39/4043/7238227',locator:'SCORE2-Diabetes, 40–69 años y exclusiones'},
 {title:'ESC/ERA 2026: enfermedad cardiovascular y ERC',url:'https://doi.org/10.1093/eurheartj/ehag098',locator:'Riesgo: CKD Add-On, SCORE2-Diabetes y prevención secundaria'}
];
const get=(d,id)=>fieldState(d,id)==='registrado'?d.values[id]:null;
const number=(d,id)=>{const v=get(d,id);return v!==null&&/^(?:\d+\.?\d*|\.\d+)$/.test(v)?Number(v):null};
/** Operación numérica únicamente; la elegibilidad se comprueba en evaluateCvRisk. */
export function computeScore2Low({age,sex,smoker,sbp,totalMmol,hdlMmol}){
 if(!Number.isInteger(age)||age<40||age>69||!['Hombre','Mujer'].includes(sex)||typeof smoker!=='boolean'||
  ![sbp,totalMmol,hdlMmol].every(x=>typeof x==='number'&&Number.isFinite(x)&&x>0)||hdlMmol>=totalMmol)return null;
 const male=sex==='Hombre';
 const b=male?[.3742,.6012,.2777,.1458,-.2698,-.0755,-.0255,-.0281,.0426]:[.4648,.7744,.3131,.1002,-.2606,-.1088,-.0277,-.0226,.0613];
 const a=(age-60)/5,p=(sbp-120)/20,t=totalMmol-6,h=(hdlMmol-1.3)/.5,s=Number(smoker);
 const lp=b[0]*a+b[1]*s+b[2]*p+b[3]*t+b[4]*h+b[5]*a*s+b[6]*a*p+b[7]*a*t+b[8]*a*h;
 // log(-log(1 - riesgo no calibrado)) = log(-log(S0)) + lp.
 const logHazard=Math.log(-Math.log(male?.9605:.9776))+lp;
 const calibrated=(male?-.5699:-.7380)+(male?.7476:.7019)*logHazard;
 return -Math.expm1(-Math.exp(calibrated))*100;
}
export function evaluateCvRisk(draft){
 const missing=[],alerts=[],steps=[];let route='datos_insuficientes',percent=null,externalEstimate=null;
 const result=()=>({route,percent,externalEstimate,missing:[...new Set(missing)],alerts:[...new Set(alerts)],steps,sources:CV_SOURCES,
  model:percent===null?null:'SCORE2',region:percent===null?null:'Europa: riesgo bajo (España)',
  horizonYears:percent===null?null:10,ckmStage:null,patientDose:null,prescription:null,actionPerformed:false});
 const age=number(draft,'edad'),sbp=number(draft,'pas'),dbp=number(draft,'pad');
 const tc=number(draft,'colesterol_total'),hdl=number(draft,'hdl'),ldl=number(draft,'ldl');
 if(get(draft,'cv_sintomas')==='Sí'||(sbp!==null&&sbp>=180)||(dbp!==null&&dbp>=110)){
  route='valoracion_prioritaria';alerts.push('Valorar síntomas y presión arterial antes del riesgo preventivo. La cifra aislada no diagnostica una emergencia hipertensiva.');return result();
 }
 const audit=auditCrossDomain(draft);
 if(audit.requiresResolution){route='revisar_coherencia';alerts.push(...audit.critical.map(x=>x.title));return result();}
 if(get(draft,'embarazo')==='Sí'||get(draft,'dm1')==='Sí'){
  route='circuito_especifico';steps.push('Gestación o DM1 requieren evaluación específica; no aplicar SCORE2 general.');return result();
 }
 if(get(draft,'ecv')==='Sí'){
  route='enfermedad_establecida';steps.push('Revisar el tipo de enfermedad cardiovascular documentada y prevención secundaria cuando proceda. SCORE2 no estima recurrencias.');return result();
 }
 if(get(draft,'ic')==='Sí'){
  route='insuficiencia_cardiaca';steps.push('Utilizar evaluación dirigida de IC; SCORE2 general no sustituye el manejo de enfermedad establecida.');return result();
 }
 const egfr=number(draft,'tfge'),acr=number(draft,'cac');
 const renalMarkers=(egfr!==null&&egfr<60)||(acr!==null&&get(draft,'unidad_cac')==='mg/g'&&acr>=30);
 if(get(draft,'erc')==='Sí'||renalMarkers){
  route='evaluacion_renal';steps.push(get(draft,'dm2')==='Sí'
   ?'ERC y DM2: revisar SCORE2-Diabetes y daño de órgano según ESC/ERA 2026; el cálculo específico aún no está integrado.'
   :'Valorar cronicidad y vía renal. Para riesgo absoluto en ERC sin DM2, ESC/ERA 2026 recomienda SCORE2/SCORE2-OP con CKD Add-On; ese complemento aún no está integrado.');return result();
 }
 if(get(draft,'cv_hfamiliar')==='Sí'||(ldl!==null&&ldl>=190)||(tc!==null&&tc>310)){
  route='factor_individual';steps.push('Perfil lipídico marcado o sospecha familiar: revisar causas y circuito específico de dislipemia; no usar un SCORE2 bajo para reducir esa prioridad.');return result();
 }
 if(get(draft,'dm2')==='Sí'){
  route='score2_diabetes_pendiente';steps.push('Valorar SCORE2-Diabetes en su población elegible y daño de órgano. No se calcula sustituyéndolo por SCORE2 general.');return result();
 }
 if(age!==null&&(age<40||age>=90)){
  route='fuera_de_edad';steps.push('No se extrapolan SCORE2 de 40–69 años ni el circuito SCORE2-OP de 70–89 años fuera de esas edades.');return result();
 }
 for(const id of CV_FIELDS)if(get(draft,id)===null)missing.push('Completar '+FIELDS[id].label+'.');
 for(const id of ['ecv','ic','dm1','dm2','erc'])if(get(draft,id)!=='No')missing.push('Confirmar ausencia de '+FIELDS[id].label+'.');
 if(get(draft,'cv_sintomas')!=='No')missing.push('Confirmar ausencia de síntomas de alarma.');
 if(get(draft,'cv_hfamiliar')!=='No')missing.push('Valorar hipercolesterolemia familiar.');
 if(!['No','No procede'].includes(get(draft,'embarazo')))missing.push('Confirmar contexto de embarazo.');
 if(get(draft,'cv_region')!=='España · región ESC de riesgo bajo')missing.push('Esta versión requiere calibración de España confirmada.');
 const asOf=get(draft,'fecha_evaluacion');
 for(const id of ['fecha_pas','fecha_lipidos'])if(asOf&&get(draft,id)&&get(draft,id)>asOf){route='revisar_coherencia';alerts.push(FIELDS[id].label+': posterior a la evaluación.');}
 if(alerts.length)return result();
 if(missing.length)return result();
 if(age===null||sbp===null||dbp===null||tc===null||hdl===null||ldl===null||hdl>=tc||ldl>tc||
  sbp<90||sbp>=180||dbp<=0||dbp>=sbp||tc<100||tc>310||hdl<20||hdl>100){
  route='revisar_coherencia';alerts.push('Valores incompatibles o fuera de los límites operativos de este primer cálculo: revisar medición y contexto.');return result();
 }
 if(age>=70){
  route='score2_op_pendiente';
  steps.push('Corresponde revisar SCORE2-OP. CaHReMe no genera aquí un porcentaje interno: permite documentar una estimación de HeartScore con procedencia y asociación explícita a los datos de esta sesión.');
  for(const id of OP_FIELDS)if(get(draft,id)===null)missing.push('Completar '+FIELDS[id].label+'.');
  if(get(draft,'cv_op_fuente')!=='HeartScore ESC · SCORE2-OP a 10 años')missing.push('Confirmar fuente HeartScore, modelo SCORE2-OP y horizonte de 10 años.');
  if(get(draft,'cv_op_contexto')!=='Revisados por el profesional')missing.push('Revisar aplicabilidad, fragilidad, preferencias y contexto clínico de la persona mayor.');
  if(!externalOpAssociationValid(draft))missing.push('Confirmar de nuevo la correspondencia del cálculo externo tras cualquier edición de la ficha.');
  const calculatedOn=get(draft,'cv_op_fecha'),entered=number(draft,'cv_op_porcentaje');
  if(calculatedOn&&(calculatedOn>asOf||calculatedOn<get(draft,'fecha_pas')||calculatedOn<get(draft,'fecha_lipidos'))){
   route='revisar_coherencia';alerts.push('La fecha del cálculo externo es incompatible con la evaluación o con las mediciones registradas.');return result();
  }
  if(entered===null||entered<0||entered>100)missing.push('Porcentaje externo válido entre 0 y 100.');
  if(missing.length)return result();
  externalEstimate={model:'SCORE2-OP',percent:entered,horizonYears:10,source:'HeartScore ESC',
   region:'Europa: riesgo bajo (España)',calculatedOn,origin:'externo_confirmado_por_profesional',internallyCalculated:false};
  route='estimacion_externa_documentada';
  steps.push('Resultado externo transcrito, no recalculado ni validado numéricamente por CaHReMe. No implica una pauta, estadio CKM ni autorización terapéutica.');
  return result();
 }
 percent=computeScore2Low({age,sex:get(draft,'cv_sexo_modelo'),smoker:get(draft,'tabaco')==='Actual',sbp,totalMmol:tc/38.67,hdlMmol:hdl/38.67});
 route=percent===null?'revisar_coherencia':'calculado_en_revision';
 steps.push('Estimación a 10 años de eventos cardiovasculares mortales y no mortales. No es una probabilidad de enfermedad presente ni un estadio CKM.');
 steps.push('No convertir esta cifra en objetivo de LDL o tratamiento automático: las decisiones requieren su guía y contexto clínico.');
 steps.push('Las fechas documentan procedencia, no garantizan que las mediciones representen el estado actual. Verificar su vigencia clínica.');
 return result();
}
