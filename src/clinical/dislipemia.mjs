/** Dislipemia original: ESC/EAS 2025 + secciones vigentes 2019; CIMA por producto.
 * No prescribe, no convierte Lp(a), no equipara TFGe normalizada y CrCl.
 */
import {FIELDS,fieldState} from '../model.mjs';
import {readMulti} from '../consultas.mjs';
import {auditCrossDomain} from './auditoria.mjs';
import {evaluateCvRisk} from './riesgo-cv.mjs';
export const LIPID_SOURCES=[
 {title:'ESC/EAS 2025: actualización de dislipemias',url:'https://academic.oup.com/eurheartj/article/46/42/4359/8234482',locator:'Tabla 3, objetivos LDL, Lp(a) y tratamiento'},
 {title:'EAS 2025: categorías SCORE2/SCORE2-OP',url:'https://eas-society.org/publications/guidelines/score2-score2-op/',locator:'Tabla de categorías para dislipemia'},
 {title:'ESC/EAS 2019: secciones no sustituidas',url:'https://eas-society.org/wp-content/uploads/2022/05/2019_EAS-ESC_Guidelines_dyslipidaemia_ATH.pdf',locator:'LDL/Friedewald, hipertrigliceridemia y tabla 13 de controles'},
 {title:'CIMA: atorvastatina cinfa 10 mg',url:'https://cima.aemps.es/cima/dochtml/ft/69534/FT_69534.html',locator:'4.2–4.6'},
 {title:'CIMA: rosuvastatina cinfa 10 mg',url:'https://cima.aemps.es/cima/dochtml/ft/80213/FT_80213.html',locator:'4.2–4.6; límites por aclaramiento de creatinina'},
 {title:'CIMA: ezetimiba Sandoz 10 mg',url:'https://cima.aemps.es/cima/dochtml/ft/77541/FT_77541.html',locator:'4.2–4.6'}
];
export const LIPID_DRUG_REFERENCES=[
 {name:'Atorvastatina',reference:'Ficha de referencia: inicio habitual 10 mg/día, máximo 80 mg/día; ajustes a intervalos ≥4 semanas. No es una dosis individual.',source:LIPID_SOURCES[3].url},
 {name:'Rosuvastatina',reference:'Comprobar posología por perfil e indicación. CrCl <30 mL/min contraindica su uso; con CrCl <60, 40 mg está contraindicado. No sustituir CrCl por TFGe normalizada.',source:LIPID_SOURCES[4].url},
 {name:'Ezetimiba',reference:'Referencia documental: 10 mg/día. Revisar función hepática y la ficha de la estatina cuando se asocian; no es prescripción individual.',source:LIPID_SOURCES[5].url}
];
export const LIPID_FIELDS=['edad','embarazo','lip_lactancia','fecha_evaluacion','colesterol_total','hdl','ldl','trigliceridos','fecha_lipidos','lip_metodo_ldl',
 'lip_ascvd','lip_fecha_ascvd','lip_riesgo','lip_riesgo_confirmado','lip_fuente_riesgo','ecv','dm2','erc','cv_hfamiliar',
 'lip_ldl_basal','lip_fecha_basal','lip_basal_confirmado','lip_lpa','lip_unidad_lpa',
 'lip_estatina','lip_dosis_estatina','lip_max_tolerada','lip_ezetimiba','lip_otros','lip_adherencia','lip_intolerancia','lip_mialgias','lip_alarma',
 'lip_hepatica_activa','alt','fecha_alt','lip_alt_lsn','tfge','fecha_tfge','lip_aclaramiento','lip_fecha_aclaramiento','lip_interacciones',
 'farmacos_clases','farmacos','medicacion_revisada','alergias','alergias_revisadas','situacion_aguda','lra_sospecha',
 'lip_cambio','lip_cambio_confirmado','lip_fecha_cambio'];
const get=(d,id)=>fieldState(d,id)==='registrado'?d.values[id]:null;
const num=(d,id)=>{const x=get(d,id);return x!==null&&/^(?:\d+\.?\d*|\.\d+)$/.test(x)?Number(x):null};
const RANK={Bajo:0,Moderado:1,Alto:2,'Muy alto':3};
export function lipidGoalForCategory(risk){const limits={Bajo:116,Moderado:100,Alto:70,'Muy alto':55};return Object.hasOwn(limits,risk??'')?{ldlLessThan:limits[risk],requiresFiftyPercent:['Alto','Muy alto'].includes(risk),framework:'ESC/EAS 2025 + objetivos conservados de 2019'}:null;}
export function lipidCategoryFromScore(percent){
 if(typeof percent!=='number'||!Number.isFinite(percent)||percent<0||percent>100)return null;
 return percent<2?'Bajo':percent<10?'Moderado':percent<20?'Alto':'Muy alto';
}
export function evaluateDyslipidemia(draft){
 const missing=[],alerts=[],checks=[],steps=[],options=[];
 let state='datos_insuficientes',risk=null,riskOrigin=null,goal=null,comparison=null,reduction=null,nonHdl=null,followUp=null;
 const result=()=>({state,risk,riskOrigin,goal,comparison,reduction,nonHdl,missing:[...new Set(missing)],alerts:[...new Set(alerts)],checks,steps,options,followUp,
 sources:LIPID_SOURCES,drugReferences:LIPID_DRUG_REFERENCES,prescription:null,patientDose:null,actionPerformed:false});
 const age=num(draft,'edad'),ldl=num(draft,'ldl'),tc=num(draft,'colesterol_total'),hdl=num(draft,'hdl'),tg=num(draft,'trigliceridos');
 const asOf=get(draft,'fecha_evaluacion'),statin=get(draft,'lip_estatina'),dose=num(draft,'lip_dosis_estatina');
 const dated=id=>!!(asOf&&get(draft,id)&&get(draft,id)<=asOf);
 if(tc!==null&&hdl!==null&&tc>hdl&&hdl>0)nonHdl=tc-hdl;
 if(get(draft,'lip_alarma')==='Sí'){
  state='seguridad_prioritaria';alerts.push('Dolor abdominal intenso con vómitos o debilidad intensa/orina oscura: valoración clínica urgente antes del tratamiento crónico.');return result();
 }
 if(tg!==null&&tg>880){state='seguridad_prioritaria';alerts.push('TG >880 mg/dL: priorizar valoración y prevención de pancreatitis; con síntomas, atención urgente. No se genera una pauta desde este circuito.');return result();}
 const rawAge=draft.unavailable.includes('edad')?'':String(draft.values.edad||'');
 if((/^\d+$/.test(rawAge)&&Number(rawAge)<18)||get(draft,'embarazo')==='Sí'||get(draft,'lip_lactancia')==='Sí'){
  state='fuera_de_ambito';alerts.push('Utilizar valoración específica de pediatría, embarazo o lactancia; no extrapolar esta ruta de tratamiento.');return result();
 }
 const audit=auditCrossDomain(draft);alerts.push(...audit.critical.map(x=>x.title));
 for(const id of LIPID_FIELDS)if(fieldState(draft,id)==='revisar')alerts.push('Revisar '+FIELDS[id].label+'.');
 for(const id of ['fecha_lipidos','lip_fecha_basal','lip_fecha_ascvd','lip_fecha_cambio','fecha_alt','lip_fecha_aclaramiento'])
  if(asOf&&get(draft,id)&&get(draft,id)>asOf)alerts.push(FIELDS[id].label+': posterior a la evaluación.');
 if(alerts.length){state='revisar_coherencia';return result();}

 if(tg!==null&&tg>=440)checks.push('TG 440–880 mg/dL: puede existir riesgo de pancreatitis; revisar ayuno, causas secundarias y síntomas. No se descarta pancreatitis por estar por debajo de 880.');
 if(age===null)missing.push('Edad adulta documentada.');
 if(!['No','No procede'].includes(get(draft,'embarazo'))||!['No','No procede'].includes(get(draft,'lip_lactancia')))missing.push('Confirmar ausencia de embarazo/lactancia para esta vía.');
 if(!asOf)missing.push('Fecha de evaluación.');
 if(!dated('fecha_lipidos'))missing.push('Perfil lipídico fechado.');
 if(ldl===null||ldl<=0)missing.push('LDL actual válido.');
 if(tc!==null&&hdl!==null&&(hdl>=tc||hdl<=0)||tc!==null&&ldl!==null&&ldl>tc){state='revisar_coherencia';alerts.push('Perfil lipídico incompatible: revisar LDL, colesterol total y HDL.');return result();}
 const method=get(draft,'lip_metodo_ldl');
 if(!method||method==='No consta')missing.push('Confirmar método de LDL.');
 if(method==='Calculado con Friedewald'&&(tg===null||tg>=400)){
  state='revisar_coherencia';alerts.push('LDL calculado con Friedewald: con TG ≥400 mg/dL o TG desconocidos se retiene interpretación; utilizar una medición/método validado por laboratorio.');return result();
 }
 const noTherapy=statin==='Ninguna'&&get(draft,'lip_ezetimiba')==='No'&&get(draft,'lip_otros')==='Ninguno';
 const baseline=num(draft,'lip_ldl_basal');
 const baselineValid=baseline!==null&&baseline>0&&get(draft,'lip_basal_confirmado')==='Sí'&&dated('lip_fecha_basal')&&dated('fecha_lipidos')&&get(draft,'lip_fecha_basal')<=get(draft,'fecha_lipidos');
 if(get(draft,'lip_fecha_basal')&&get(draft,'fecha_lipidos')&&get(draft,'lip_fecha_basal')>get(draft,'fecha_lipidos')){
  state='revisar_coherencia';alerts.push('El LDL basal es posterior al actual: no calcular reducción desde esa referencia.');return result();
 }
 let minimum=null;
 const renalGfr=num(draft,'tfge');
 if(get(draft,'erc')==='Sí'&&dated('fecha_tfge')&&renalGfr!==null&&renalGfr<60){
  minimum=renalGfr<30?'Muy alto':'Alto';riskOrigin='ERC conocida con TFGe documentada; confirmar contexto y categoría clínica';
 }
 if(get(draft,'lip_ascvd')==='Sí'){
  if(dated('lip_fecha_ascvd')){minimum='Muy alto';riskOrigin='ASCVD documentada';}
  else missing.push('Documento fechado de enfermedad aterosclerótica.');
 }else if(get(draft,'lip_ascvd')!=='No')missing.push('Valorar enfermedad aterosclerótica; IC/FA no se equiparan automáticamente a ASCVD.');
 const untreatedLdl=baselineValid?baseline:noTherapy&&dated('fecha_lipidos')?ldl:null;
 if(noTherapy&&dated('fecha_lipidos')&&tc!==null&&tc>310){if(!minimum)minimum='Alto';checks.push('Colesterol total sin tratamiento >310 mg/dL: factor marcado; revisar causas secundarias y clasificación clínica.');}
 if(untreatedLdl!==null&&untreatedLdl>190){if(!minimum)minimum='Alto';checks.push('LDL sin tratamiento >190 mg/dL: revisar causas secundarias y posible hipercolesterolemia familiar. No se diagnostica HF por LDL aislado.');}
 const manual=get(draft,'lip_riesgo');
 const manualValid=Object.hasOwn(RANK,manual||'')&&get(draft,'lip_riesgo_confirmado')==='Sí'&&!!get(draft,'lip_fuente_riesgo');
 if(manualValid){risk=manual;riskOrigin='Categoría clínica documentada: '+get(draft,'lip_fuente_riesgo');}
 else if(noTherapy&&get(draft,'lip_ascvd')==='No'){
  const cv=evaluateCvRisk(draft);
  if(cv.percent!==null){risk=lipidCategoryFromScore(cv.percent);riskOrigin='SCORE2 de esta sesión; categorías lipídicas ESC/EAS 2025';}
  else if(cv.externalEstimate){risk=lipidCategoryFromScore(cv.externalEstimate.percent);riskOrigin='SCORE2-OP externo documentado; categorías lipídicas ESC/EAS 2025';}
 }
 if(minimum){
  if(risk&&RANK[risk]<RANK[minimum]){state='revisar_coherencia';alerts.push('La categoría declarada/calculada es inferior al mínimo por ASCVD, ERC documentada o LDL basal marcado. Conciliar antes de fijar objetivo.');return result();}
  risk=risk||minimum;riskOrigin=riskOrigin||'Factor clínico documentado';
 }
 if(!risk)missing.push('Completar estratificación clínica de riesgo; no se usa LDL bajo tratamiento para reducir el riesgo basal.');
 if(get(draft,'dm2')==='Sí'&&risk==='Bajo'){state='revisar_coherencia';alerts.push('DM2 y categoría de riesgo bajo: revisar clasificación específica antes del objetivo.');return result();}
 if(get(draft,'cv_hfamiliar')==='Sí')checks.push('Sospecha de HF: evaluación y derivación según contexto; la categoría necesita revisar ASCVD y otros factores.');
 const lpa=num(draft,'lip_lpa'),unit=get(draft,'lip_unidad_lpa');
 if(lpa!==null){
  if(!['mg/dL','nmol/L'].includes(unit))checks.push('Lp(a) sin unidad interpretable: confirmar informe original; no convertir automáticamente.');
  else if(unit==='mg/dL'&&lpa>50||unit==='nmol/L'&&lpa>105)checks.push('Lp(a) elevada en su unidad original: modificador de riesgo para valoración clínica, sin ascenso automático de categoría ni conversión fija mg/dL–nmol/L.');
 }
 if(risk){
  goal=lipidGoalForCategory(risk);
  if(ldl!==null&&ldl>0&&dated('fecha_lipidos')&&method&&method!=='No consta'){
   if(baselineValid)reduction=(baseline-ldl)/baseline*100;
   const absolute=ldl<goal.ldlLessThan;
   comparison={absoluteMet:absolute,reductionMet:goal.requiresFiftyPercent?(reduction===null?null:reduction>=50-1e-9):null,
    fullyAssessable:!goal.requiresFiftyPercent||reduction!==null,
    bothMet:absolute&&(!goal.requiresFiftyPercent||reduction!==null&&reduction>=50-1e-9)};
  }
 }
 const alt=num(draft,'alt'),uln=num(draft,'lip_alt_lsn'),crcl=num(draft,'lip_aclaramiento');
 if(get(draft,'lip_hepatica_activa')==='Sí'||alt!==null&&uln!==null&&uln>0&&alt>=3*uln)alerts.push('Revisar enfermedad hepática/ALT ≥3 veces el límite normal antes de iniciar o intensificar. No se ordena una retirada automática.');
 if(statin==='Rosuvastatina'){
  if(crcl===null||!dated('lip_fecha_aclaramiento'))missing.push('Rosuvastatina: confirmar CrCl documentado para sus límites; no sustituir por TFGe normalizada.');
  else if(crcl<30||dose===40&&crcl<60)alerts.push('La rosuvastatina actual entra en una restricción de ficha técnica por CrCl/dosis: revisión prioritaria de la pauta.');
 }
 if(get(draft,'lip_mialgias')==='Sí')checks.push('Valorar síntomas musculares e indicación de CK; no diagnosticar intolerancia completa ni retirar automáticamente por mialgia aislada.');
 if(get(draft,'lip_intolerancia')==='Sospechada / no confirmada')checks.push('Confirmar intolerancia y causas alternativas antes de abandonar estatinas o elegir sustitución.');
 if(get(draft,'lip_estatina')===null||statin==='No confirmada'||get(draft,'lip_ezetimiba')===null||get(draft,'lip_ezetimiba')==='No consta'||get(draft,'lip_otros')===null||get(draft,'lip_otros')==='No confirmado')missing.push('Conciliar hipolipemiantes realmente utilizados.');
 if(['Atorvastatina','Rosuvastatina','Otra'].includes(statin)&&(!dose||!get(draft,'farmacos')))missing.push('Documentar dosis de estatina y tratamiento actual.');
 if(statin==='Atorvastatina'&&dose>80||statin==='Rosuvastatina'&&dose>40)alerts.push('Dosis de estatina por encima del máximo de ficha: conciliar antes de interpretar continuidad.');
 const classes=get(draft,'farmacos_clases')?readMulti(get(draft,'farmacos_clases')):[];
 if(noTherapy&&classes.some(x=>['Estatina','Ezetimiba','Ácido bempedoico','Anticuerpo PCSK9'].includes(x)))alerts.push('Ausencia de hipolipemiantes y clases actuales discordantes: conciliar tratamiento.');
 if(get(draft,'situacion_aguda')==='Enfermedad aguda grave'||get(draft,'lra_sospecha')==='Sí')alerts.push('Resolver proceso agudo antes de una escalada hipolipemiante rutinaria.');
 if(get(draft,'lip_cambio')==='Inicio o ajuste realmente administrado'&&get(draft,'lip_cambio_confirmado')==='Sí'&&noTherapy)alerts.push('Cambio hipolipemiante administrado pero sin tratamiento actual: conciliar antes de generar seguimiento.');
 if(alerts.length){state='seguridad_prioritaria';return result();}
 if(get(draft,'lip_cambio')==='Inicio o ajuste realmente administrado'&&get(draft,'lip_cambio_confirmado')==='Sí'&&!dated('lip_fecha_cambio'))missing.push('Fecha efectiva válida del cambio confirmado.');
 const safe=missing.length===0&&comparison&&get(draft,'lip_alarma')==='No'&&get(draft,'lip_hepatica_activa')==='No'&&
  get(draft,'lip_mialgias')==='No'&&get(draft,'lip_interacciones')==='Sí'&&get(draft,'lip_adherencia')==='Confirmadas'&&
  get(draft,'medicacion_revisada')==='Sí'&&get(draft,'alergias_revisadas')==='Sí'&&alt!==null&&uln!==null&&uln>0&&dated('fecha_alt')&&
  get(draft,'situacion_aguda')==='Estable sin proceso agudo grave'&&get(draft,'lra_sospecha')==='No';
 const recentChange=get(draft,'lip_cambio')==='Inicio o ajuste realmente administrado'&&get(draft,'lip_cambio_confirmado')==='Sí'&&dated('lip_fecha_cambio')&&get(draft,'fecha_lipidos')<get(draft,'lip_fecha_cambio');
 if(recentChange)checks.push('El perfil lipídico precede al cambio administrado: no atribuirle respuesta al tratamiento actual ni proponer una nueva escalada sin revisar el control posterior.');
 const option=(id,title,detail)=>options.push({id,title,detail,prescription:null,patientDose:null,performed:false});
 if(comparison&&(!comparison.absoluteMet||comparison.reductionMet===false)){
  steps.push('Revisar hábitos, adherencia y causas secundarias antes de cambiar tratamiento. Los objetivos no equivalen por sí solos a indicación de iniciar o intensificar.');
  if(safe&&!recentChange){
   if(get(draft,'lip_intolerancia')==='Documentada tras evaluación')option('LIP-NONSTATIN','Revisar alternativas con beneficio cardiovascular','Valorar ezetimiba u otra alternativa según reducción adicional requerida y ficha individual. Bempedoico/PCSK9 necesitan revisión de producto y acceso; no se seleccionan aquí.');
   else if(get(draft,'lip_intolerancia')==='No'){
    const primaryStrong=risk==='Muy alto'&&ldl>=70||risk==='Alto'&&ldl>=100;
    const primaryConsider=risk==='Muy alto'&&ldl>=55||risk==='Alto'&&ldl>=70||risk==='Moderado'&&ldl>=100||risk==='Bajo'&&ldl>=116;
    if(noTherapy&&(minimum==='Muy alto'||primaryStrong||primaryConsider))option('LIP-START-REVIEW','Valorar tratamiento hipolipemiante','Distinguir prevención secundaria de los umbrales de inicio en primaria; individualizar estatina/intensidad y revisar CIMA. No se devuelve una dosis individual.');
    else if(statin!=='Ninguna'&&statin!=='No confirmada'&&get(draft,'lip_max_tolerada')==='No')option('LIP-OPTIMIZE','Revisar intensidad y máxima dosis tolerada','Comprobar respuesta y dosis realmente tomada antes de valorar optimización; no se calcula incremento automático.');
    else if(statin!=='Ninguna'&&get(draft,'lip_max_tolerada')==='Sí'&&get(draft,'lip_ezetimiba')==='No')option('LIP-EZETIMIBE','Valorar añadir ezetimiba','Revisar indicación y contraindicaciones de la asociación. Referencia documental 10 mg/día, sin prescripción individual.');
    else if(['Alto','Muy alto'].includes(risk)&&get(draft,'lip_max_tolerada')==='Sí'&&get(draft,'lip_ezetimiba')==='Sí')option('LIP-ADDITIONAL','Valorar terapia adicional o derivación','Revisar magnitud de reducción requerida y posible PCSK9/bempedoico con fichas y criterios de acceso. No se presume financiación ni elegibilidad.');
   }
  }else checks.push('Antes de valorar escalada: completar seguridad, interacciones y dosis/adherencia realmente verificadas.');
 }
 if(safe&&!recentChange&&noTherapy&&get(draft,'lip_ascvd')==='Sí'&&dated('lip_fecha_ascvd')&&!options.length&&get(draft,'lip_intolerancia')==='No')option('LIP-SECONDARY-REVIEW','Revisar tratamiento de prevención secundaria','La ASCVD documentada requiere valoración de tratamiento aunque el LDL actual esté por debajo del objetivo absoluto. Revisar indicación y tolerancia; no se prescribe desde aquí.');
 if(comparison?.bothMet)steps.push('Objetivos documentados alcanzados: revisar mantenimiento, adherencia y tolerancia, sin suspender por el LDL actual.');
 if(goal?.requiresFiftyPercent&&reduction===null)checks.push('Sin basal sin tratamiento válido no se confirma reducción ≥50 %, aunque el objetivo absoluto esté alcanzado.');
 const event=get(draft,'lip_cambio'),eventDate=get(draft,'lip_fecha_cambio');
 if(event==='Inicio o ajuste realmente administrado'&&get(draft,'lip_cambio_confirmado')==='Sí'){
  if(!dated('lip_fecha_cambio'))missing.push('Fecha efectiva válida del cambio confirmado.');
  else if(missing.length===0&&safe){
   const day=Date.parse(eventDate+'T00:00:00Z'),iso=n=>new Date(day+n*86400000).toISOString().slice(0,10);
   followUp={from:iso(28),to:iso(84),status:asOf>iso(84)?'plazo_superado':'pendiente_de_revision',appointmentCreated:false,
    text:'Referencia de perfil lipídico a las 8 ±4 semanas tras cambio, ajustada a contexto/producto. Un control ya realizado debe revisarse; no se crea cita ni se supone pendiente por falta de registro histórico.'};
  }
 }
 checks.push('ASCVD documentada no equivale a cualquier IC/FA. Las categorías lipídicas 2025 no se intercambian con los cortes por edad de prevención 2021.');
 checks.push('Las referencias CIMA no constituyen una pauta seleccionada. La lista de interacciones y fármacos aún no es exhaustiva.');
 state=missing.length?'datos_insuficientes':'orientacion_para_revision';return result();
}
