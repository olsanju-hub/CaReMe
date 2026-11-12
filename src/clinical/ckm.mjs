/** Estadificación CKM descriptiva, AHA/ACC/ADA/ASN 2026, tabla 4.
 * No diagnostica HTA/DM2 ni importa umbrales terapéuticos a España.
 * No usa SCORE2 como sustituto de PREVENT-CVD. No altera categorías G/A.
 */
import {fieldState,FIELDS} from '../model.mjs';
import {evaluateRenal} from './engine.mjs';
import {auditCrossDomain} from './auditoria.mjs';
export const CKM_SOURCE={title:'AHA/ACC/ADA/ASN 2026 · CKM',url:'https://www.jacc.org/doi/10.1016/j.jacc.2026.03.056',locator:'Tabla 4 y sección 4.1'};
export const CKM_FIELDS=['edad','embarazo','fecha_evaluacion','ckm_evaluacion_confirmada','ckm_cvd','ckm_fecha_cvd',
 'ecv','ic','ckm_subclinica','ckm_fecha_subclinica','ckm_prevent','ckm_fecha_prevent','ckm_version_prevent',
 'imc','cintura','cv_sexo_modelo','ckm_ascendencia','pas','pad','fecha_pas','ckm_pa_contexto','ckm_hta_tratada',
 'dm1','dm2','hba1c','fecha_hba1c','dm_hba1c_fiable','glucemia_ayunas','fecha_glucemia_ayunas',
 'trigliceridos','fecha_lipidos','ckm_lipidos','ckm_mets','erc','tfge','fecha_tfge','cac','unidad_cac','fecha_cac','persistencia',
 'ckm_reemplazo_renal','lra_sospecha','situacion_aguda'];
const get=(d,id)=>fieldState(d,id)==='registrado'?d.values[id]:null;
const n=(d,id)=>{const x=get(d,id);return x!==null&&/^(?:\d+\.?\d*|\.\d+)$/.test(x)?Number(x):null};
export function evaluateCkm(draft){
 const missing=[],alerts=[],evidence=[],notes=[
  'Clasificación descriptiva CKM de una guía estadounidense. No sustituye las guías españolas/europeas de diagnóstico o tratamiento.',
  'No se necesitan pruebas de imagen o biomarcadores solo para completar esta pantalla; revisar la evidencia clínicamente disponible.',
  'El CAC urinario (mg/g) no es calcio coronario (Agatston). Este módulo no deduce aterosclerosis del CAC urinario.',
  'SCORE2 no equivale a PREVENT-CVD. No se suman sus porcentajes ni se convierten en un estadio CKM.'
 ];
 let stage=null,minimumStage=null,substage=null,state='datos_insuficientes';
 const result=()=>({stage,minimumStage,substage,state,evidence,missing:[...new Set(missing)],alerts:[...new Set(alerts)],notes,
  source:CKM_SOURCE,patientDose:null,prescription:null,actionPerformed:false});
 const age=n(draft,'edad'),asOf=get(draft,'fecha_evaluacion');
 const rawAge=draft.unavailable.includes('edad')?'':String(draft.values.edad||'');
 if((/^\d+$/.test(rawAge)&&Number(rawAge)<18)||get(draft,'embarazo')==='Sí'||get(draft,'dm1')==='Sí'){
  state='fuera_de_ambito';alerts.push('Utilizar valoración específica: población pediátrica, gestación o DM1 no se extrapolan en este primer módulo.');return result();
 }
 const dated=(dateId)=>{const date=get(draft,dateId);return !!(date&&asOf&&date<=asOf)};
 for(const id of CKM_FIELDS)if(fieldState(draft,id)==='revisar')alerts.push('Revisar '+FIELDS[id].label+'.');
 for(const id of CKM_FIELDS.filter(x=>x.startsWith('fecha_')||x.startsWith('ckm_fecha_')))
  if(asOf&&get(draft,id)&&get(draft,id)>asOf)alerts.push(FIELDS[id].label+': fecha posterior a la evaluación.');
 const audit=auditCrossDomain(draft);
 alerts.push(...audit.critical.map(x=>x.title));
 if(get(draft,'lra_sospecha')==='Sí'||get(draft,'situacion_aguda')==='Enfermedad aguda grave')alerts.push('Resolver el proceso agudo antes de estadificar el estado crónico.');
 if(get(draft,'ckm_cvd')==='No identificada tras revisión'&&(get(draft,'ic')==='Sí'||get(draft,'ecv')==='Sí'))alerts.push('Enfermedad cardiovascular conocida y ausencia declarada en CKM: conciliar antecedentes.');
 if(alerts.length){state='revisar_coherencia';return result();}
 if(age===null)missing.push('Edad adulta documentada.');
 if(!['No','No procede'].includes(get(draft,'embarazo')))missing.push('Confirmar contexto de embarazo.');
 if(get(draft,'dm1')!=='No')missing.push('Confirmar ausencia de DM1 para este circuito.');
 if(get(draft,'ckm_evaluacion_confirmada')!=='Sí')missing.push('Confirmar revisión clínica de las entradas de CKM.');
 if(!asOf)missing.push('Fecha de evaluación.');
 if(get(draft,'lra_sospecha')!=='No'||get(draft,'situacion_aguda')!=='Estable sin proceso agudo grave')missing.push('Confirmar estabilidad y ausencia de lesión renal aguda.');
 if(age===null||!asOf||!['No','No procede'].includes(get(draft,'embarazo'))||get(draft,'dm1')!=='No'||get(draft,'lra_sospecha')!=='No'||get(draft,'situacion_aguda')!=='Estable sin proceso agudo grave')return result();
 const bmi=n(draft,'imc'),waist=n(draft,'cintura'),sex=get(draft,'cv_sexo_modelo'),ancestry=get(draft,'ckm_ascendencia');
 const ancestryKnown=['Umbral general','Ascendencia asiática'].includes(ancestry),asian=ancestry==='Ascendencia asiática';
 const bmiHigh=bmi!==null&&(bmi>=25||(ancestryKnown&&asian&&bmi>=23));
 const waistHigh=waist!==null&&['Hombre','Mujer'].includes(sex)&&ancestryKnown&&waist>=(sex==='Mujer'?(asian?80:88):(asian?90:102));
 const validBmi=bmi!==null&&bmi>0,validWaist=waist!==null&&waist>0;
 let one=bmiHigh||waistHigh,two=false,three=false;
 if(one)evidence.push('Adiposidad por IMC o cintura según el umbral declarado.');
 const hba=n(draft,'hba1c'),fpg=n(draft,'glucemia_ayunas');
 const hbaUsable=hba!==null&&hba>0&&dated('fecha_hba1c')&&get(draft,'dm_hba1c_fiable')==='Fiable tras comprobación';
 const fpgUsable=fpg!==null&&fpg>0&&dated('fecha_glucemia_ayunas');
 if((hbaUsable&&hba>=5.7&&hba<6.5)||(fpgUsable&&fpg>=100&&fpg<126)){one=true;evidence.push('Disglucemia en el tramo de prediabetes, pendiente de interpretación clínica.');}
 if(get(draft,'dm2')==='Sí'){two=true;evidence.push('DM2 documentada.');}
 else if((hbaUsable&&hba>=6.5)||(fpgUsable&&fpg>=126))missing.push('Glucemia/HbA1c en rango de diabetes sin DM2 confirmada: confirmar diagnóstico; no adjudicarlo desde un resultado aislado.');
 const sbp=n(draft,'pas'),dbp=n(draft,'pad'),tg=n(draft,'trigliceridos');
 const bpUsable=sbp!==null&&sbp>0&&dbp!==null&&dbp>0&&dbp<sbp&&dated('fecha_pas')&&get(draft,'ckm_pa_contexto')==='Valor habitual validado';
 if(get(draft,'ckm_hta_tratada')==='Sí'||(bpUsable&&(sbp>=130||dbp>=80))){two=true;evidence.push('Criterio de presión arterial/HTA tratada de CKM. No equivale a diagnóstico español de HTA.');}
 if(tg!==null&&tg>=150&&dated('fecha_lipidos')){two=true;evidence.push('Triglicéridos ≥150 mg/dL documentados.');}
 if(get(draft,'ckm_mets')==='Sí'){two=true;evidence.push('Síndrome metabólico previamente documentado.');}
 const renal=evaluateRenal(draft),e=renal.inputs.egfr.value,a=renal.inputs.acr.value;
 const chronic=get(draft,'persistencia')==='Sí',replacement=get(draft,'ckm_reemplazo_renal')==='Sí';
 const renalDated=dated('fecha_tfge')&&(a===null||dated('fecha_cac'));
 let renalVeryHigh=false;
 const renalBoundary=chronic&&a===300&&e!==null&&e>=30&&e<60;
 if(renalBoundary)missing.push('CAC de 300 mg/g: la tabla CKM 2026 y la tabla G/A KDIGO 2024 difieren en la frontera A2/A3. Resolver antes del estadio final; no se modifica el clasificador renal.');
 if(replacement||(chronic&&renalDated&&e!==null&&e<30))renalVeryHigh=true;
 if(chronic&&renalDated&&e!==null&&a!==null&&!renalBoundary)
  renalVeryHigh ||= (e<45&&a>=30)||(e<60&&a>300);
 if(renalVeryHigh){three=true;two=true;evidence.push('ERC de riesgo muy alto con cronicidad y evidencia documentadas, o tratamiento renal sustitutivo crónico.');}
 else if(chronic&&renalDated&&renal.markerPresent){two=true;evidence.push('Marcadores renales persistentes compatibles con el dominio renal CKM.');}
 else if(get(draft,'erc')==='Sí'||renal.markerPresent)missing.push('Acreditar cronicidad, fechas y categorías renales antes de usarlas en estadificación CKM.');
 const riskContext=one||two;
 if(get(draft,'ckm_subclinica')==='Confirmada por evaluación clínica/especializada'){
  if(!dated('ckm_fecha_subclinica'))missing.push('Fecha de evidencia subclínica/pre-IC.');
  else if(riskContext){three=true;evidence.push('Aterosclerosis subclínica o pre-IC confirmada en contexto CKM.');}
  else missing.push('Confirmar adiposidad, factor metabólico o ERC que acompaña a la enfermedad subclínica.');
 }
 if(get(draft,'ckm_prevent')==='PREVENT-CVD ≥20 % a 10 años documentado'){
  if(age===null||age<30||age>79||!dated('ckm_fecha_prevent')||get(draft,'ckm_fecha_prevent')<'2026-10-14'||get(draft,'ckm_version_prevent')!=='Calculadora AHA revisada desde 14/10/2026')missing.push('Verificar población, fecha y versión del cálculo PREVENT-CVD externo; no se calcula ni se importa SCORE2 como sustituto.');
  else {three=true;evidence.push('Equivalente de riesgo PREVENT-CVD ≥20 % documentado externamente; no calculado por CaHReMe.');}
 }
 const cvd=get(draft,'ckm_cvd')==='Confirmada'||get(draft,'ic')==='Sí';
 const four=cvd&&riskContext&&dated('ckm_fecha_cvd');
 if(cvd&&!dated('ckm_fecha_cvd'))missing.push('Fecha de documentación de enfermedad cardiovascular clínica.');
 if(cvd&&!riskContext)missing.push('Confirmar el contexto metabólico/renal o de adiposidad que acompaña a la enfermedad cardiovascular clínica.');
 if(four){evidence.push('Enfermedad cardiovascular clínica con contexto CKM.');minimumStage=4;}
 else if(three)minimumStage=3;
 else if(two)minimumStage=2;
 else if(one)minimumStage=1;
 // No se rebaja un estadio por no haber investigado niveles superiores.
 if(!four&&get(draft,'ckm_cvd')!=='No identificada tras revisión')missing.push('Revisar enfermedad cardiovascular clínica antes de fijar un estadio inferior a 4.');
 if(!four&&get(draft,'ic')!=='No')missing.push('Confirmar ausencia de IC clínica.');
 if(!four&&get(draft,'ecv')!=='No')missing.push('Conciliar el antecedente cardiovascular compartido.');
 if(!four&&!three){
  if(get(draft,'ckm_subclinica')!=='No identificada en evaluación disponible')missing.push('Revisar evidencia subclínica/pre-IC disponible, sin exigir pruebas sin indicación.');
  if(get(draft,'ckm_prevent')!=='No identificado tras revisión')missing.push('Revisar equivalentes de riesgo de estadio 3.');
 }
 if(!four&&!three&&!two){
  if(get(draft,'dm2')!=='No')missing.push('Valorar DM2.');
  if(!bpUsable||get(draft,'ckm_hta_tratada')!=='No')missing.push('Valorar presión habitual y tratamiento por HTA.');
  if(tg===null||tg<=0||!dated('fecha_lipidos'))missing.push('Triglicéridos válidos y fechados.');
  if(get(draft,'ckm_mets')!=='No')missing.push('Valorar síndrome metabólico.');
  if(get(draft,'erc')!=='No'||e===null||a===null||!renalDated||renal.markerPresent||replacement||get(draft,'ckm_reemplazo_renal')!=='No')missing.push('Evaluación renal suficiente para descartar criterio de estadio superior.');
 }
 if(minimumStage===null){
  if(!validBmi||!validWaist||!ancestryKnown||!['Hombre','Mujer'].includes(sex))missing.push('Revisar IMC y cintura con umbrales aplicables; no asumir adiposidad normal.');
  if(!hbaUsable&&!fpgUsable)missing.push('Glicemia válida para valorar normoglucemia.');
  if(get(draft,'ckm_lipidos')!=='Sin alteración relevante')missing.push('Confirmar perfil lipídico sin alteraciones relevantes.');
  if(validBmi&&bmi<18.5)missing.push('IMC bajo: no clasificar automáticamente como IMC normal.');
 }
 if(missing.length){state=minimumStage===null?'datos_insuficientes':'estadio_minimo_documentado';return result();}
 stage=minimumStage??0;state='clasificacion_para_revision';
 if(stage===4){
  if(replacement||(chronic&&e!==null&&e<15&&dated('fecha_tfge')))substage='4b';
  else if(get(draft,'ckm_reemplazo_renal')==='No'&&e!==null&&e>=15&&dated('fecha_tfge'))substage='4a';
  else notes.push('Estadio 4: subclasificación 4a/4b pendiente de documentar función renal y tratamiento sustitutivo.');
 }
 return result();
}
