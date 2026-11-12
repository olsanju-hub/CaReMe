/** Recorrido de obesidad adulto; GIRO2025, EASO2024 y CIMA por producto.
 * No equivale a diagnóstico, selección individual ni autorización quirúrgica.
 */
import {FIELDS,fieldState} from '../model.mjs';
import {readMulti} from '../consultas.mjs';
import {auditCrossDomain} from './auditoria.mjs';
import {reviewDrug} from './farmacologia.mjs';
export const OBESITY_SOURCES=[
 {title:'SEEDO: GIRO 2.0, abril2025',url:'https://portal.guiasalud.es/wp-content/uploads/2025/10/gpc_650_obesidad_seedo_compl.pdf',locator:'Evaluación, hábitos, derivación, recomendaciones60–75 y población mayor'},
 {title:'EASO: marco clínico de obesidad2024',url:'https://easo.org/wp-content/uploads/2025/03/EASO-Framework-final-edited-version-.pdf',locator:'Diagnóstico y complicaciones; distinto de indicación CIMA'},
 {title:'ASMBS/IFSO2022: criterios ampliados',url:'https://asmbs.org/wp-content/uploads/2023/09/ASMBS-IFSO-Guidelines-2022-PIIS1550728922006414.pdf',locator:'IMC≥35 y valoración30–34,9; acceso local no inferido'},
 {title:'CIMA Wegovy subcutáneo',url:'https://cima.aemps.es/cima/dochtml/ft/1211608006/FT_1211608006.html',locator:'4.1–4.6; distinta presentación de Ozempic o vía oral'},
 {title:'CIMA Mounjaro',url:'https://cima.aemps.es/cima/dochtml/ft/1221685002/FT_1221685002.html',locator:'4.1–4.6'},
 {title:'redGDPS: algoritmo de obesidad2025',url:'https://www.redgdps.org/algoritmoobesidad/algoritmo_OBESIDAD_v4.pdf',locator:'Reevaluación trimestral; dosis/financiación no trasladadas a este motor'}
];
const get=(d,id)=>fieldState(d,id)==='registrado'?d.values[id].trim():null;
const num=(d,id)=>{const x=get(d,id);return x!==null&&/^(?:\d+\.?\d*|\.\d+)$/.test(x)?Number(x):null};
export function classifyAdultBmi(bmi){
 if(typeof bmi!=='number'||!Number.isFinite(bmi)||bmi<=0)return null;
 return bmi<18.5?'bajo_peso':bmi<25?'rango_18_5_24_9':bmi<30?'sobrepeso':bmi<35?'obesidad_I':bmi<40?'obesidad_II':'obesidad_III';
}
function threeMonths(date){
 const [y,m,d]=date.split('-').map(Number),last=new Date(Date.UTC(y,m+3,0)).getUTCDate();
 return new Date(Date.UTC(y,m+2,Math.min(d,last))).toISOString().slice(0,10);
}
export function evaluateObesity(draft,mode='detail'){
 if(!['quick','detail'].includes(mode))throw new Error('Modo obesidad desconocido');
 const missing=[],alerts=[],checks=[],steps=[],lifestyle=[],referral=[],options=[],productReviews=[];
 let state='datos_insuficientes',anthropometry=null,response=null,goal=null,followUp=null;
 const finish=()=>({state,mode,anthropometry,response,goal,missing:[...new Set(missing)],alerts:[...new Set(alerts)],checks,steps,lifestyle,referral,options,productReviews,followUp,sources:OBESITY_SOURCES,
  prescription:null,patientDose:null,diagnosisEstablished:false,surgeryEligibility:null,actionPerformed:false});
 const refer=(id,text)=>{if(!referral.some(x=>x.id===id))referral.push({id,text,performed:false})};
 const age=num(draft,'edad'),asOf=get(draft,'fecha_evaluacion');
 const dated=id=>!!(asOf&&get(draft,id)&&get(draft,id)<=asOf);
 if(get(draft,'pancreatitis_sospecha')==='Sí'||get(draft,'deshidratacion_gi')==='Sí'||get(draft,'vision_subita')==='Sí'){
  state='seguridad_prioritaria';alerts.push('Sospecha de pancreatitis, deshidratación significativa o pérdida súbita de visión: valoración urgente antes del tratamiento crónico del peso.');return finish();
 }
 if(get(draft,'embarazo')==='Sí'||get(draft,'ob_lactancia')==='Sí'||(/^\d+$/.test(String(draft.values.edad||''))&&Number(draft.values.edad)<18)){
  state='fuera_de_ambito';checks.push('Embarazo/lactancia o edad pediátrica: valoración específica; no extrapolar este plan adulto de reducción de peso.');return finish();
 }
 const audit=auditCrossDomain(draft);
 if(audit.critical.length){state='seguridad_prioritaria';alerts.push(...audit.critical.map(x=>x.title));return finish();}
 if(['Enfermedad aguda grave','Cirugía mayor o ayuno prolongado'].includes(get(draft,'situacion_aguda'))){state='seguridad_prioritaria';alerts.push('Resolver proceso agudo antes de intensificar el plan crónico de peso.');return finish();}
 for(const [id,f] of Object.entries(FIELDS))if(id.startsWith('ob_')||['peso','talla','imc','cintura'].includes(id)){
  if(fieldState(draft,id)==='revisar'||f.type==='number'&&get(draft,id)!==null&&num(draft,id)===null)alerts.push('Revisar '+f.label+'.');
 }
 for(const id of ['ob_fecha_medidas','ob_fecha_basal','ob_fecha_plan'])if(get(draft,id)&&asOf&&get(draft,id)>asOf)alerts.push(FIELDS[id].label+': posterior a evaluación.');
 const weight=num(draft,'peso'),height=num(draft,'talla'),entered=num(draft,'imc'),waist=num(draft,'cintura');
 const calculated=weight!==null&&weight>0&&height!==null&&height>0?weight/(height/100)**2:null;
 if(calculated!==null&&(!Number.isFinite(calculated)||calculated<=0))alerts.push('Cálculo de IMC fuera de rango numérico: revisar medidas.');
 if(calculated!==null&&entered!==null&&Math.abs(entered-calculated)>1)alerts.push('IMC informado y peso/talla discordantes (>1 kg/m²): conciliar antes de decidir. Es una tolerancia operativa, no un criterio diagnóstico.');
 if(weight===0||height===0||entered===0||waist===0)alerts.push('Medidas antropométricas deben ser positivas, no cero.');
 if(alerts.length){state='revisar_coherencia';return finish();}
 const bmi=calculated??entered;
 if(bmi!==null)anthropometry={bmi,origin:calculated!==null?'Calculado desde peso/talla':'Informado',category:classifyAdultBmi(bmi),waistHeightRatio:waist!==null&&height!==null?waist/height:null};
 if(age===null)missing.push('Edad adulta.');
 if(!asOf)missing.push('Fecha de evaluación.');
 if(bmi===null||!dated('ob_fecha_medidas'))missing.push('IMC o peso/talla válidos y fecha de medidas.');
 if(!['No','No procede'].includes(get(draft,'embarazo'))||!['No','No procede'].includes(get(draft,'ob_lactancia')))missing.push('Ámbito sin embarazo/lactancia confirmado.');
 if(get(draft,'ob_acuerdo')!=='Sí'){
  if(get(draft,'ob_acuerdo')==='No'){state='decision_compartida';steps.push('Respetar la decisión; explorar objetivos de salud y mantener seguimiento disponible sin imponer un plan de pérdida de peso.');return finish();}
  missing.push('Explorar y acordar el abordaje del peso.');
 }
 const profile=get(draft,'obesidad_perfil')?readMulti(get(draft,'obesidad_perfil')):[];
 if(get(draft,'ob_complicaciones_revisadas')!=='Sí')missing.push('Revisión de complicaciones, función y repercusión psicosocial.');
 const comorb=get(draft,'comorbilidad_peso_confirmada'),knownComorb=get(draft,'dm2')==='Sí'||profile.some(x=>!['Ninguna seleccionada','Obesidad sarcopénica'].includes(x));
 if(comorb==='No'&&knownComorb){state='revisar_coherencia';alerts.push('Se niega comorbilidad asociada al peso pero constan DM2 u otras complicaciones: conciliar.');return finish();}
 if(!['Sí','No'].includes(comorb))missing.push('Confirmar comorbilidad asociada al peso.');
 for(const [id,text] of [['ob_perdida_involuntaria','Valorar pérdida involuntaria/desnutrición.'],['ob_edema','Valorar edema/ascitis.'],['ob_tca','Valorar conducta alimentaria.']])if(!['Sí','No'].includes(get(draft,id)))missing.push(text);
 if(get(draft,'ob_perdida_involuntaria')==='Sí'||bmi!==null&&bmi<18.5){state='valoracion_nutricional';refer('OB-NUTRITION','Evaluar pérdida involuntaria, bajo peso o desnutrición antes de plantear reducción ponderal.');return finish();}
 if(get(draft,'ob_tca')==='Sí'){state='valoracion_especializada';refer('OB-TCA','Valorar Salud Mental/unidad de TCA y plan nutricional coordinado. No generar pauta restrictiva automática.');return finish();}
 if(get(draft,'ob_edema')==='Sí'){state='composicion_no_evaluable';checks.push('Con edema/ascitis, la variación de peso no se interpreta como pérdida de grasa ni como eficacia del plan; revisar causa y peso clínicamente interpretable.');return finish();}
 const muscle=get(draft,'ob_musculo')==='Sí'||profile.includes('Obesidad sarcopénica');
 if(!['Sí','No tras valoración'].includes(get(draft,'ob_musculo')))missing.push('Valorar fuerza/función y riesgo de sarcopenia.');
 if(muscle){
  checks.push('Sospecha o riesgo muscular: evaluar fuerza y función, y composición corporal si procede; no diagnosticar sarcopenia por IMC.');
  refer('OB-MUSCLE','Valorar apoyo nutricional y ejercicio de fuerza adaptado, con rehabilitación según función.');
  if(get(draft,'ob_adaptacion_muscular')!=='Acordado y adaptado')missing.push('Adaptar y acordar el plan para preservar músculo antes de intensificar.');
 }
 if(anthropometry?.waistHeightRatio!==null&&anthropometry?.waistHeightRatio>0.5)checks.push('Cintura/talla >0,5: revisar adiposidad central y complicaciones. El marco clínico EASO no sustituye la indicación CIMA ni confirma diagnóstico por sí solo.');
 if(get(draft,'ob_secundaria')==='Sí')refer('OB-SECONDARY','Sospecha de causa secundaria/sindrómica: valorar Endocrinología y evaluación etiológica.');
 if(missing.length){steps.push('Completar la evaluación dirigida; los datos ausentes no se interpretan como ausencia de complicaciones.');return finish();}
 // El resultado rápido orienta prioridades; detalle necesario para intervenir/monitorizar.
 if(mode==='quick'){state='evaluacion_inicial';steps.push('Completar revisión detallada para acordar objetivos, adaptar hábitos y valorar tratamiento o derivación.');return finish();}
 for(const [id,text] of [['ob_alimentacion','Patrón alimentario y barreras.'],['ob_actividad','Actividad y capacidad física.'],['ob_sueno_psicosocial','Sueño y barreras psicosociales.']])if(get(draft,id)!=='Sí')missing.push(text);
 if(!['Sí','No'].includes(get(draft,'ob_limitacion_ejercicio')))missing.push('Valorar limitaciones al ejercicio.');
 if(!['Sí','No'].includes(get(draft,'ob_secundaria')))missing.push('Valorar causas secundarias.');
 const current=get(draft,'ob_farmaco_actual');
 if(!current||current==='No conciliado')missing.push('Conciliar tratamiento actual para peso.');
 const classes=get(draft,'farmacos_clases')?readMulti(get(draft,'farmacos_clases')):null;
 const hasIncretin=classes?.some(x=>['arGLP-1','Agonista dual GIP/GLP-1'].includes(x));
 if(current&&current!=='Ninguno'&&current!=='No conciliado'&&(!get(draft,'farmacos')||get(draft,'ob_adherencia')!=='Sí'))missing.push('Documentar producto, dosis y adherencia del tratamiento realmente usado.');
 if(['Wegovy subcutáneo','Tirzepatida'].includes(current)&&classes?.includes('Sin tratamiento farmacológico')){state='revisar_coherencia';alerts.push('Producto actual para peso y ausencia de tratamiento farmacológico discordantes.');return finish();}
 if(current&&current!=='Ninguno'&&get(draft,'ob_tolerancia')!=='Adecuada'){
  missing.push('Revisar tolerancia del tratamiento actual antes de fijar un control rutinario.');
  checks.push('Revisar tolerancia antes de intensificar; no aumentar ni sustituir automáticamente.');
 }
 const basal=num(draft,'ob_peso_basal');
 const baselineValid=basal!==null&&basal>0&&get(draft,'ob_basal_confirmado')==='Sí'&&dated('ob_fecha_basal')&&dated('ob_fecha_medidas')&&get(draft,'ob_fecha_basal')<=get(draft,'ob_fecha_medidas');
 if(get(draft,'ob_fecha_basal')&&get(draft,'ob_fecha_medidas')&&get(draft,'ob_fecha_basal')>get(draft,'ob_fecha_medidas')){state='revisar_coherencia';alerts.push('Peso basal posterior al actual: no calcular respuesta desde esa referencia.');return finish();}
 const target=num(draft,'ob_objetivo_porcentaje'),targetType=get(draft,'ob_objetivo');
 if(targetType==='Reducción ponderal'){
  if(target===null||target<=0||!baselineValid)missing.push('Objetivo de reducción positivo y basal documentado válido.');
  else {
   const targetWeight=basal*(1-target/100);
   if(height!==null&&targetWeight/(height/100)**2<18.5){state='revisar_coherencia';alerts.push('El objetivo registrado conduciría a IMC <18,5: revisar antes de generar el plan.');return finish();}
   goal={type:targetType,percent:target,weightKg:targetWeight};
  }
 }else if(targetType==='Mantenimiento y función')goal={type:targetType,percent:null,weightKg:null};
 else missing.push('Acordar objetivo de salud y peso/función.');
 if(!get(draft,'ob_objetivo_salud'))missing.push('Objetivo individual de salud/función documentado.');
 const confirmedPlan=get(draft,'ob_plan_estado')==='Acordado e iniciado'&&get(draft,'ob_plan_confirmado')==='Sí';
 const priorToPlan=confirmedPlan&&dated('ob_fecha_plan')&&get(draft,'ob_fecha_medidas')<get(draft,'ob_fecha_plan');
 if(baselineValid&&weight!==null&&weight>0&&!priorToPlan)response={baselineKg:basal,currentKg:weight,lossKg:basal-weight,lossPercent:(basal-weight)/basal*100,goalMet:goal?.percent?((basal-weight)/basal*100>=goal.percent-1e-9):null};
 if(priorToPlan)checks.push('Medidas anteriores al plan confirmado: no atribuir esa variación a respuesta del plan actual.');
 if(confirmedPlan&&!dated('ob_fecha_plan'))missing.push('Fecha efectiva de inicio del plan confirmado.');
 const planSafe=!missing.length&&get(draft,'ob_secundaria')==='No';
 if(planSafe){
  lifestyle.push({id:'OB-FOOD',text:muscle?'Plan nutricional individual que preserve masa muscular; evitar restricción intensa.':'Acordar un patrón alimentario sostenible, con intervención nutricional individual y revisión de barreras; sin dieta calórica automática.'});
  lifestyle.push({id:'OB-ACTIVITY',text:get(draft,'ob_limitacion_ejercicio')==='Sí'||muscle?'Adaptar actividad y fuerza a función y comorbilidades; valorar supervisión.':'Progresar hacia actividad aeróbica regular, referencia de al menos 150 min/semana si tolerada, y trabajo de fuerza adaptado.'});
  lifestyle.push({id:'OB-SLEEP',text:'Acordar cambios de sueño y apoyo conductual según barreras detectadas; seguimiento con Enfermería/Nutrición según recursos.'});
 }
 if(get(draft,'erc')==='Sí'||get(draft,'ic')==='Sí')checks.push('En ERC/IC, individualizar proteína, sodio y líquidos; no aplicar objetivos genéricos de ingesta por kg.');
 const inadequate=get(draft,'ob_respuesta_previa')==='Objetivos no alcanzados o reganancia';
 const severe=get(draft,'ob_complicacion_grave')==='Sí';
 const pharmacologicThreshold=bmi>=30||bmi>=27&&comorb==='Sí';
 if(current&&current!=='Ninguno'&&current!=='No conciliado'||hasIncretin){
  checks.push('Revisar tratamiento ya administrado, formulación e indicación basal. El descenso del IMC no ordena suspender; no se propone añadir otra incretina.');
  if(response)checks.push('Comparar respuesta con objetivo, tolerancia y tiempo real en dosis efectiva. No se aplica una regla universal de retirada por no perder un 5 %.');
 }else if(planSafe&&current==='Ninguno'&&pharmacologicThreshold&&(inadequate||severe)){
  const safety=['embarazo_planificado','pancreatitis_sospecha','pancreatitis_previa','deshidratacion_gi','gastroparesia_grave','vision_subita','hepatica_grave'];
  const checked=safety.every(id=>['No','No procede'].includes(get(draft,id)))&&get(draft,'medicacion_revisada')==='Sí'&&get(draft,'alergias_revisadas')==='Sí'&&classes!==null&&num(draft,'tfge')!==null&&num(draft,'tfge')>0&&dated('fecha_tfge');
  if(checked){
   for(const drugId of ['semaglutida_wegovy_sc','tirzepatida']){
    const r=reviewDrug(draft,drugId,'peso');productReviews.push(r);
    if(r.state==='revision_pendiente')options.push({id:drugId,routeId:'peso',title:'Valorar '+(drugId==='tirzepatida'?'tirzepatida':'semaglutida subcutánea para peso'),performed:false,patientDose:null,prescription:null});
   }
  }else checks.push('Antes de valorar un producto, completar seguridad reproductiva/digestiva, medicación y función renal fechada.');
 }else if(current==='Ninguno'&&pharmacologicThreshold)checks.push('Confirmar respuesta a hábitos y gravedad de complicaciones antes de valorar fármacos; no iniciar solo por el IMC.');
 if(planSafe){
  if(bmi>=40||bmi>=35&&comorb==='Sí')refer('OB-SURGERY','Valorar unidad multidisciplinar y cirugía según criterios GIRO; no es autorización ni derivación enviada.');
  else if(bmi>=35)refer('OB-SURGERY-EXPANDED','Revisar criterios ampliados ASMBS/IFSO (IMC≥35 sin comorbilidad), con decisión multidisciplinar y circuito local; GIRO señala diferencias de evidencia.');
  else if(bmi>=30&&inadequate)refer('OB-METABOLIC','Valorar unidad especializada por respuesta insuficiente; si DM2, revisar cirugía metabólica. En otras situaciones, discutir criterios ampliados individualmente.');
  if(confirmedPlan){const dueOn=threeMonths(get(draft,'ob_fecha_plan'));followUp={dueOn,status:asOf>dueOn?'plazo_superado':'pendiente_de_revision',appointmentCreated:false,text:'Revisión trimestral orientativa del plan confirmado; revisar contactos ya realizados y adelantar si tolerancia/seguridad lo exige. No es calendario de titulación ni crea cita.'};}
 }
 if(response?.goalMet)steps.push('Objetivo ponderal acordado alcanzado: revisar mantenimiento, función y control de complicaciones, sin retirada automática del tratamiento.');
 else if(response)steps.push('Revisar evolución, adherencia y objetivos clínicos; una variación aislada no demuestra fracaso terapéutico ni indica cambio de fármaco.');
 checks.push('La categoría por IMC es descriptiva: no estadifica EOSS ni confirma obesidad clínica. Indicación, acceso y financiación deben revisarse por producto.');
 state=missing.length?'datos_insuficientes':'orientacion_para_revision';return finish();
}
