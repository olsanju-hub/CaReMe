/** Síntesis de motores existentes; no añade umbrales o pautas clínicas.
 * Conserva origen, actuaciones confirmadas y plazos de cada circuito.
 */
import {fieldState} from '../model.mjs';
import {readMulti} from '../consultas.mjs';
import {auditCrossDomain} from './auditoria.mjs';
import {buildVerificationPlan} from './plan.mjs';
import {confirmedAction,followUpFromHistory} from './continuidad.mjs';
import {evaluateDm2Detail} from './dm2-detallada.mjs';
import {evaluateHeartFailure} from './insuficiencia-cardiaca.mjs';
import {evaluateKidney} from './renal.mjs';
import {evaluateInsulinization} from './insulinizacion.mjs';
import {evaluateHypertension} from './hta.mjs';
import {evaluateDyslipidemia} from './dislipemia.mjs';
import {evaluateMasld} from './masld.mjs';
import {evaluateObesity} from './obesidad.mjs';
import {evaluateCvRisk} from './riesgo-cv.mjs';
import {evaluateCkm} from './ckm.mjs';
const get=(d,id)=>fieldState(d,id)==='registrado'?d.values[id].trim():null;
const has=(d,id)=>!['sin_registrar','no_disponible'].includes(fieldState(d,id));
const number=(d,id)=>{const x=get(d,id);return x!==null&&/^(?:\d+\.?\d*|\.\d+)$/.test(x)?Number(x):null};
const normalize=text=>String(text).trim().replace(/\s+/g,' ');
function sourcesOf(result){
 const x=result.sources??result.source;
 const list=Array.isArray(x)?x:x?.url?[x]:x&&typeof x==='object'?Object.values(x):[];
 return list.filter(x=>x&&typeof x.url==='string'&&/^https:\/\//.test(x.url)).map(x=>({url:x.url,title:x.title??x.name??x.short??'Fuente del módulo',locator:x.locator??x.detail??x.section??''}));
}
export const INTEGRATED_DOMAINS=[
 {id:'dm2',title:'DM2',module:'dm2',evaluate:d=>evaluateDm2Detail(d)},
 {id:'ic',title:'Insuficiencia cardíaca',module:'ic',evaluate:d=>evaluateHeartFailure(d,'detail')},
 {id:'erc',title:'Evaluación renal',module:'erc',evaluate:d=>evaluateKidney(d,'detail')},
 {id:'insulina',title:'Insulinización',module:'insulina',evaluate:d=>evaluateInsulinization(d,'detail')},
 {id:'hta',title:'Presión arterial e HTA',action:'hta',evaluate:evaluateHypertension},
 {id:'dislipemia',title:'Dislipemia',action:'lipids',evaluate:evaluateDyslipidemia},
 {id:'masld',title:'Evaluación hepática',module:'hepatico',evaluate:evaluateMasld},
 {id:'obesidad',title:'Obesidad y función',module:'obesidad',evaluate:d=>evaluateObesity(d,'detail')},
 {id:'riesgo_cv',title:'Riesgo cardiovascular',action:'cv-risk',evaluate:evaluateCvRisk},
 {id:'ckm',title:'Clasificación CKM',action:'ckm',evaluate:evaluateCkm}
];
function activeDomains(draft){
 const meds=get(draft,'farmacos_clases')?readMulti(get(draft,'farmacos_clases')):[];
 const any=ids=>ids.some(id=>has(draft,id));
 return {
  dm2:get(draft,'dm2')==='Sí'||any(['dm_objetivo_valor','dm_prioridad','dm_control']),
  ic:get(draft,'ic')==='Sí'||get(draft,'ic_descompensada')==='Sí'||any(['fevi','ic_fevigrupo','ic_alarma']),
  erc:get(draft,'erc')==='Sí'||get(draft,'lra_sospecha')==='Sí'||number(draft,'tfge')!==null&&number(draft,'tfge')<60||any(['cac','erc_contexto','ras_evento']),
  insulina:any(['insulina_fase','insulina_perfil'])||meds.includes('Insulina')||get(draft,'insulina_esquema')!==null&&get(draft,'insulina_esquema')!=='Sin insulina',
  hta:any(['hta_conocida','hta_fuera_metodo','hta_consulta_calidad','hta_alarma'])||number(draft,'pas')>=140||number(draft,'pad')>=90,
  dislipemia:any(['ldl','colesterol_total','lip_riesgo','lip_estatina']),
  masld:get(draft,'esteatosis')==='Sí'||get(draft,'fib4_agudo')==='Sí'||any(['fib4_informado','fib4_contexto','masld_fib4_origen','masld_alarma','elastografia']),
  obesidad:['pancreatitis_sospecha','deshidratacion_gi','vision_subita'].some(id=>get(draft,id)==='Sí')||number(draft,'imc')>=25||any(['ob_acuerdo','ob_objetivo','ob_farmaco_actual','obesidad_perfil'])||number(draft,'peso')>0&&number(draft,'talla')>0&&number(draft,'peso')/(number(draft,'talla')/100)**2>=25,
  riesgo_cv:any(['cv_region','cv_op_porcentaje','cv_sexo_modelo','cv_sintomas']),
  ckm:Object.keys(draft.values).some(id=>id.startsWith('ckm_')&&has(draft,id))
 };
}
const urgent=r=>r.state==='seguridad_prioritaria'||r.route==='valoracion_prioritaria';
const unsuitable=r=>['seguridad_prioritaria','revisar_coherencia','fuera_de_ambito'].includes(r.state)||['revisar_coherencia','valoracion_prioritaria','circuito_especifico'].includes(r.route);
export function buildIntegratedPlan(draft,history=[]){
 const asOf=get(draft,'fecha_evaluacion'),active=activeDomains(draft),audit=auditCrossDomain(draft);
 const issues=[],accepted=[];
 for(const [i,event] of (Array.isArray(history)?history:[]).entries()){
  if(event?.confirmed!==true)continue;
  try{
   const [checked]=confirmedAction([],{...event,confirmedByClinician:true});
   if(asOf&&checked.performedOn>asOf)throw new Error('fecha posterior a la evaluación');
   accepted.push({...checked,originalIndex:i});
  }catch(e){issues.push({index:i,reason:String(e.message)});}
 }
 if(!Array.isArray(history))issues.push({index:null,reason:'Historial de sesión no válido'});
 accepted.sort((a,b)=>a.performedOn.localeCompare(b.performedOn)||a.originalIndex-b.originalIndex);
 const verification=buildVerificationPlan(draft,accepted);
 const evaluated=INTEGRATED_DOMAINS.map(def=>({def,result:active[def.id]?def.evaluate(draft):null}));
 const globalHold=audit.requiresResolution||evaluated.some(x=>x.result&&urgent(x.result));
 const priorities=[],goals=[],referrals=[],controls=[],orientations=[],contexts=[],cautions=[];
 const addPriority=(priority,title,detail,domain,sources=[])=>{
  const key=priority+'|'+normalize(detail||title);
  const existing=priorities.find(x=>x.key===key);
  if(existing){
   if(!existing.domains.includes(domain))existing.domains.push(domain);
   for(const source of sources)if(!existing.sources.some(x=>x.url===source.url))existing.sources.push(source);
   return;
  }
  priorities.push({id:'PRIORITY-'+priorities.length,key,priority,title,detail:detail||title,domains:[domain],sources,performed:false});
 };
 for(const task of verification.checks)addPriority(task.priority,task.title,task.detail,'transversal');
 for(const x of issues)addPriority('completar','Revisar actuación histórica','Registro '+(x.index===null?'sin índice':x.index+1)+': '+x.reason+'. No genera control automático.','historial');
 const addGoal=(domain,title,detail,r)=>goals.push({id:'GOAL-'+domain,domain,title,detail,sources:sourcesOf(r),status:globalHold?'reevaluar_seguridad':'para_revision',performed:false});
 const addControl=(x)=>{
  const entry={...x,appointmentCreated:false,performed:false,completed:null};
  if(!entry.source||!/^https:\/\//.test(entry.source))throw new Error('Control sin fuente verificable');
  const duplicate=controls.find(y=>y.id===entry.id);if(duplicate)return;
  const end=entry.to??entry.dueOn,start=entry.from??entry.dueOn;
  entry.temporalStatus=!asOf?'sin_fecha_evaluacion':end&&asOf>end?'plazo_superado':start&&asOf>=start?'en_fecha_o_ventana':'previsto';
  entry.holdReasons=[...(entry.holdReasons??[])];
  if(globalHold)entry.holdReasons.push('Resolver primero la seguridad actual; el plazo previo no determina la urgencia.');
  if(!asOf)entry.holdReasons.push('Falta una fecha válida de evaluación.');
  entry.status=entry.holdReasons.length?'requiere_reevaluacion':entry.dueOn||entry.from?'referencia_activa':'sin_fecha_fija';
  controls.push(entry);
 };
 for(const {def,result:r} of evaluated){
  if(!r)continue;
  const src=sourcesOf(r),state=r.state??r.route;
  for(const text of [...new Set(r.checks??[])])cautions.push({domain:def.id,text,sources:src,performed:false});
  for(const alert of r.alerts??[])addPriority(urgent(r)?'seguridad':'completar','Revisar '+def.title,alert,def.id,src);
  for(const missing of r.missing??[])addPriority('completar','Completar '+def.title,missing,def.id,src);
  if(['fuera_de_ambito','circuito_especifico'].includes(state))addPriority('completar','Utilizar circuito específico',def.title+': el motor general no permite extrapolación.',def.id,src);
  for(const text of (r.steps??r.nextSteps??[]))addPriority('revisar','Próximo paso · '+def.title,text,def.id,src);
  for(const x of r.referral??[])referrals.push({id:'REFERRAL-'+def.id+'-'+x.id,domain:def.id,text:x.text,sources:src,performed:false,status:globalHold?'revisar_seguridad_y_urgencia':'propuesta_para_revision'});
  const approvedContext=!unsuitable(r);
  if(def.id==='dm2'&&r.state==='revision_pendiente'&&r.objective?.reliable&&r.objective.limit!==null)
   addGoal(def.id,'HbA1c individual','Objetivo aportado: HbA1c <'+r.objective.limit+' %. '+r.objective.message,r);
  if(def.id==='hta'&&r.target&&approvedContext)
   addGoal(def.id,'PA de consulta durante tratamiento','PAS '+r.target.sbp.join('–')+' y PAD '+r.target.dbp.join('–')+' mmHg. '+r.target.context,r);
  if(def.id==='dislipemia'&&r.goal&&r.state==='orientacion_para_revision')
   addGoal(def.id,'LDL según categoría lipídica','LDL <'+r.goal.ldlLessThan+' mg/dL'+(r.goal.requiresFiftyPercent?' y reducción ≥50 % respecto a basal sin tratamiento documentado.':'.')+' Marco: '+r.goal.framework+'. La categoría lipídica no sustituye la de prevención general.',r);
  if(def.id==='obesidad'&&r.goal&&r.state==='orientacion_para_revision')
   addGoal(def.id,'Peso, función y salud',r.goal.type+(r.goal.percent!==null?': reducción acordada '+r.goal.percent+' % desde basal documentado.':'.')+(get(draft,'ob_objetivo_salud')?' '+get(draft,'ob_objetivo_salud'):''),r);
  if(def.id==='riesgo_cv')contexts.push({domain:def.id,text:r.percent!==null?'SCORE2 local: '+r.percent.toFixed(1)+' % a diez años; no es objetivo terapéutico.':r.externalEstimate?'SCORE2-OP externo documentado: '+r.externalEstimate.percent+' %; no es cálculo local.':'Sin porcentaje aplicable: '+r.route+'.',sources:src});
  if(def.id==='ckm')contexts.push({domain:def.id,text:r.stage!==null?'Estadio CKM para revisión: '+r.stage+(r.substage?' · '+r.substage:'')+'. No equivale a SCORE2 ni a objetivo terapéutico.':r.minimumStage!==null?'Mínimo CKM documentado: '+r.minimumStage+'; evaluación incompleta.':'CKM no evaluable con los datos actuales.',sources:src});
  const nativeFollowUp=typeof r.followUp==='string'?r.followUp:r.followUp?.text;
  if(nativeFollowUp)orientations.push({domain:def.id,text:nativeFollowUp,sources:src,status:globalHold||!approvedContext||r.missing?.length?'condicionado_a_evaluacion':'orientacion_sin_cita',appointmentCreated:false});
  if(def.id==='masld'&&r.followUp&&!globalHold)orientations.push({domain:def.id,text:'Intervalo orientativo del módulo: '+r.followUp.intervalMonths.join('–')+' meses, sin fecha individual asignada.',sources:src,status:'orientacion_sin_cita',appointmentCreated:false});
  if(def.id==='erc'&&r.treatment?.window){const w=r.treatment.window;addControl({id:'CONTROL-ERC-RAAS',domain:def.id,kind:'analitica',from:w.from,to:w.to,measurements:['pa','creatinina','potasio'],description:'Controles tras cambio de IECA/ARA-II confirmado: PA, creatinina y potasio.',trigger:'cambio_confirmado',source:src[0]?.url});}
  if(def.id==='dislipemia'&&r.followUp){const w=r.followUp;addControl({id:'CONTROL-LIPIDS',domain:def.id,kind:'analitica',from:w.from,to:w.to,measurements:['perfil_lipidico'],description:w.text,trigger:'cambio_confirmado',source:src[0]?.url});}
  if(def.id==='obesidad'&&r.followUp){addControl({id:'CONTROL-OBESITY',domain:def.id,kind:'revision_clinica',dueOn:r.followUp.dueOn,measurements:['peso','funcion'],description:r.followUp.text,trigger:'plan_confirmado',source:src.find(x=>x.url.includes('redgdps.org'))?.url});}
 }
 const legacyEvents=followUpFromHistory(accepted);
 const archivedControls=[];
 const finRoutes=new Set(legacyEvents.filter(x=>x.drugId==='finerenona'&&x.status!=='sustituido').map(x=>x.routeId));
 for(const [i,event] of legacyEvents.entries()){
  if(event.status==='sustituido'){archivedControls.push({...event,id:'HISTORY-'+i,appointmentCreated:false,performed:false});continue;}
  const statusField=event.drugId==='finerenona'?'fin_estado':'emp_estado';
  const needsCurrent=event.trigger==='interrupcion'?'Interrumpido':'En tratamiento';
  const holds=[];
  if(event.drugId==='finerenona'&&finRoutes.size>1)holds.push('Finerenona figura en distintas indicaciones: conciliar la pauta e indicación vigentes, sin sumarlas.');
  if(number(draft,'edad')===null||number(draft,'edad')<18||!['No','No procede'].includes(get(draft,'embarazo')))holds.push('Confirmar ámbito adulto y contexto reproductivo antes de aplicar este plazo general.');
  if(get(draft,'situacion_aguda')!=='Estable sin proceso agudo grave'||get(draft,'lra_sospecha')!=='No')holds.push('Confirmar estabilidad actual y ausencia de LRA antes de aplicar un plazo rutinario.');
  if(get(draft,'medicacion_revisada')!=='Sí'||get(draft,statusField)!==needsCurrent)holds.push('Conciliar estado actual y medicación antes de aplicar la referencia histórica.');
  addControl({id:'CONTROL-HISTORY-'+i,domain:'farmacologia',kind:event.dueOn?'analitica':'reevaluacion_clinica',dueOn:event.dueOn,measurements:event.drugId==='finerenona'?['potasio','tfge']:['tfge'],description:event.description,drugId:event.drugId,routeId:event.routeId,trigger:event.trigger,source:event.source,holdReasons:holds});
 }
 const order={seguridad:0,completar:1,revisar:2};priorities.sort((a,b)=>order[a.priority]-order[b.priority]);
 controls.sort((a,b)=>String(a.from??a.dueOn??'9999').localeCompare(String(b.from??b.dueOn??'9999'))||a.id.localeCompare(b.id));
 const coordination=[];
 for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){
  const a=controls[i],b=controls[j];
  if(a.status!=='referencia_activa'||b.status!=='referencia_activa'||a.kind!=='analitica'||b.kind!=='analitica'||a.temporalStatus==='plazo_superado'||b.temporalStatus==='plazo_superado')continue;
  const common=a.measurements.filter(x=>b.measurements.includes(x));
  const from=[a.from??a.dueOn,b.from??b.dueOn].sort()[1],to=[a.to??a.dueOn,b.to??b.dueOn].sort()[0];
  if(common.length&&from<=to)coordination.push({controls:[a.id,b.id],from,to,sharedMeasurements:common,appointmentCreated:false,text:'Valorar coordinación si clínicamente procede; se conservan las dos indicaciones y sus plazos originales.'});
 }
 return {status:globalHold?'seguridad_por_resolver':'sintesis_para_revision',asOf,globalHold,
  domains:evaluated.map(({def,result:r})=>({id:def.id,title:def.title,module:def.module??null,action:def.action??null,active:!!r,state:r?(r.state??r.route):'no_evaluado',missingCount:r?.missing?.length??null,sources:r?sourcesOf(r):[]})),
  priorities:priorities.map(({key,...x})=>x),goals,contexts,cautions,referrals,controls,orientations,coordination,archivedControls,
  history:{acceptedRecords:accepted.length,heldRecords:issues.length},
  metadata:{noPrescription:true,noPerformedActionsInferred:true,noPersistentData:true,clinicalValidation:'pendiente',coverageIsNotClinicalClearance:true,appointmentCreated:false},
  prescription:null,patientDose:null,actionPerformed:false};
}
