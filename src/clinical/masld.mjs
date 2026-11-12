/** Circuito propio de fibrosis/derivación. EASL-EASD-EASO 2024, figura2/tabla6.
 * No diagnostica MASLD/MASH/cirrosis ni prescribe fármacos o pruebas.
 */
import {FIELDS,fieldState,externalFib4AssociationValid} from '../model.mjs';
import {computeFib4} from './engine.mjs';
import {auditCrossDomain} from './auditoria.mjs';
export const MASLD_SOURCES=[
 {title:'EASL-EASD-EASO MASLD 2024',url:'https://easlcampus.eu/sites/default/files/2024-08/EASL_CPGs_management_of_MASLD.pdf',locator:'Figura 2 (p.501), tabla6; evaluación secuencial y límites de pruebas no invasivas'},
 {title:'Texto íntegro de las sociedades (publicación conjunta)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11299976/',locator:'Recommended Strategy in Adults with Suspected MASLD; tabla6'}
];
const get=(d,id)=>fieldState(d,id)==='registrado'?d.values[id].trim():null;
const num=(d,id)=>{const v=get(d,id);return v!==null&&/^(?:\d+\.?\d*|\.\d+)$/.test(v)?Number(v):null};
export function classifyMasldFib4(value,age){
 if(typeof value!=='number'||!Number.isFinite(value)||value<=0||!Number.isInteger(age)||age<35||age>120)return null;
 return value<(age>65?2:1.3)?'bajo':value>2.67?'alto':'intermedio';
}
export function evaluateMasld(draft){
 const missing=[],alerts=[],checks=[],steps=[],referral=[];
 let state='datos_insuficientes',route='completar_datos',fib4=null,elastography=null,followUp=null;
 const finish=()=>({state,route,fib4,elastography,missing:[...new Set(missing)],alerts:[...new Set(alerts)],checks,steps,referral,followUp,
  sources:MASLD_SOURCES,diagnosisEstablished:false,prescription:null,patientDose:null,actionPerformed:false});
 const refer=(id,text)=>referral.push({id,text,performed:false});
 const age=num(draft,'edad'),asOf=get(draft,'fecha_evaluacion');
 const dated=id=>!!(asOf&&get(draft,id)&&get(draft,id)<=asOf);
 if(get(draft,'masld_alarma')==='Sí'){
  state='seguridad_prioritaria';route='valoracion_urgente';alerts.push('Sangrado digestivo, confusión nueva o ictericia con deterioro agudo: valoración urgente. No esperar al FIB-4 ni a elastografía.');return finish();
 }
 const rawAge=String(draft.values.edad||'');
 if((/^\d+$/.test(rawAge)&&Number(rawAge)<18)||get(draft,'embarazo')==='Sí'){
  state='fuera_de_ambito';route='valoracion_especifica';checks.push('Utilizar evaluación específica en pediatría o gestación; no extrapolar este circuito.');return finish();
 }
 const audit=auditCrossDomain(draft);
 if(audit.critical.length){state='seguridad_prioritaria';route='resolver_seguridad';alerts.push(...audit.critical.map(x=>x.title));return finish();}
 const cirrhosis=get(draft,'masld_cirrosis');
 if(['Conocida','Sospechada'].includes(cirrhosis)||get(draft,'hepatica_grave')==='Sí'){
  state='valoracion_especializada';route='hepatopatia_avanzada';refer('MASLD-ADVANCED','Enfermedad hepática avanzada conocida o sospechada: revisión especializada; un FIB-4 bajo no cierra este circuito.');
  checks.push('Revisar vigilancia y tratamiento en circuito especializado; no confirmar cirrosis o MASH por estas pruebas.');return finish();
 }
 if(get(draft,'fib4_agudo')==='Sí'||get(draft,'situacion_aguda')==='Enfermedad aguda grave'){
  state='seguridad_prioritaria';route='no_interpretar_en_agudo';alerts.push('Enfermedad aguda: no estratificar fibrosis desde FIB-4 ni programar seguimiento rutinario desde este resultado.');return finish();
 }
 const fields=['edad','embarazo','fecha_evaluacion','fib4_informado','ast','alt','plaquetas','elastografia','masld_fecha_fib4','masld_fecha_elasto','fecha_ast','fecha_alt','fecha_plaquetas',
  'masld_fib4_origen','masld_fib4_confirmado','masld_fuente_fib4','masld_elasto_metodo','masld_elasto_calidad','masld_elasto_confusores','masld_cirrosis','masld_alcohol','masld_etiologia','masld_alarma','fib4_contexto','fib4_agudo','hepatico_valoracion'];
 for(const id of ['edad','fib4_informado','ast','alt','plaquetas','elastografia'])if(get(draft,id)!==null&&num(draft,id)===null)alerts.push('Formato decimal no válido: '+FIELDS[id].label+'.');
 for(const id of fields)if(fieldState(draft,id)==='revisar')alerts.push('Revisar '+FIELDS[id].label+'.');
 for(const id of ['masld_fecha_fib4','masld_fecha_elasto','fecha_ast','fecha_alt','fecha_plaquetas'])if(asOf&&get(draft,id)&&get(draft,id)>asOf)alerts.push('Fecha posterior a evaluación: '+FIELDS[id].label+'.');
 if(alerts.length){state='revisar_coherencia';route='corregir_datos';return finish();}
 if(age===null)missing.push('Edad adulta documentada.');
 if(!asOf)missing.push('Fecha de evaluación.');
 if(!['No','No procede'].includes(get(draft,'embarazo')))missing.push('Confirmar ámbito sin gestación.');
 if(get(draft,'masld_alarma')!=='No')missing.push('Valorar señales de alarma.');
 if(cirrhosis!=='No tras valoración')missing.push('Valorar cirrosis o sospecha de enfermedad avanzada.');
 if(get(draft,'fib4_agudo')!=='No')missing.push('Confirmar ausencia de enfermedad aguda.');
 if(get(draft,'fib4_contexto')!=='Perfil de riesgo compatible con evaluación MASLD')missing.push('Indicación de evaluación en perfil de riesgo o esteatosis incidental.');
 if(get(draft,'masld_alcohol')!=='Revisados')missing.push('Revisar cantidad/patrón de alcohol e historia previa.');
 const reviewedCauses=['Esteatosis documentada y otras causas evaluadas','Otras causas evaluadas; esteatosis no confirmada'].includes(get(draft,'hepatico_valoracion'));
 if(!reviewedCauses)missing.push('Evaluar otras causas de hepatopatía.');
 if(get(draft,'masld_etiologia')==='MetALD, alcohol u otra etiología predominante'){
  state='fuera_de_ambito';route='otra_etiologia';steps.push('Valorar circuito etiológico específico. No atribuir automáticamente a MASLD ni aplicar su calendario por una cifra aislada.');return finish();
 }
 if(get(draft,'masld_etiologia')!=='Compatible con evaluación MASLD')missing.push('Confirmar contexto etiológico compatible; no se establece diagnóstico de MASLD.');
 const parts=['ast','alt','plaquetas'].map(id=>num(draft,id));
 const calcDates=['fecha_ast','fecha_alt','fecha_plaquetas'].map(id=>get(draft,id));
 const calcValid=age!==null&&parts.every(x=>x!==null&&x>0)&&calcDates.every(Boolean)&&new Set(calcDates).size===1&&['fecha_ast','fecha_alt','fecha_plaquetas'].every(dated);
 const calculated=calcValid?computeFib4(age,...parts):null;
 const report=num(draft,'fib4_informado');
 const reportValid=report!==null&&report>0&&dated('masld_fecha_fib4')&&get(draft,'masld_fib4_confirmado')==='Sí'&&externalFib4AssociationValid(draft)&&!!get(draft,'masld_fuente_fib4');
 const origin=get(draft,'masld_fib4_origen');
 let value=null,date=null;
 if(origin==='Informado por fuente externa'){
  if(reportValid){value=report;date=get(draft,'masld_fecha_fib4');}
  else missing.push('FIB-4 informado positivo, fechado, con procedencia y correspondencia confirmadas.');
 }else if(origin==='Calculado desde analítica'){
  if(calculated!==null){value=calculated;date=calcDates[0];}
  else missing.push('Cálculo FIB-4: AST, ALT y plaquetas positivas, fechadas en una misma extracción y edad adulta.');
 }else missing.push('Seleccionar origen del FIB-4 utilizado.');
 if(calculated!==null&&reportValid){
  if(calcDates[0]===get(draft,'masld_fecha_fib4')&&classifyMasldFib4(calculated,age)!==classifyMasldFib4(report,age)){
   state='revisar_coherencia';route='conciliar_fib4';alerts.push('FIB-4 calculado e informado de la misma fecha conducen a bandas diferentes: conciliar informe, edad y analíticas antes de elegir ruta.');return finish();
  }
  if(calcDates[0]!==get(draft,'masld_fecha_fib4'))checks.push('FIB-4 calculado e informado son de fechas diferentes: se utiliza solo el origen seleccionado, sin mezclar valores ni inferir tendencia.');
 }
 if(value!==null)fib4={value,origin,date,band:get(draft,'fib4_agudo')==='No'&&get(draft,'fib4_contexto')==='Perfil de riesgo compatible con evaluación MASLD'?classifyMasldFib4(value,age):null,lowCutoff:age>65?2:1.3,calculated,reported:reportValid?report:null};
 const lsm=num(draft,'elastografia');
 if(lsm!==null){
  const method=get(draft,'masld_elasto_metodo');
  const valid=lsm>0&&method==='VCTE / FibroScan'&&dated('masld_fecha_elasto')&&get(draft,'masld_elasto_calidad')==='Válidas para interpretación'&&get(draft,'masld_elasto_confusores')==='Sin confusores relevantes tras revisión';
  elastography={value:lsm,method,date:get(draft,'masld_fecha_elasto'),valid,band:valid?(lsm<8?'bajo':lsm<12?'elevado':'muy_elevado'):null};
  if(!valid)missing.push('Rigidez hepática: confirmar VCTE positiva, fecha, calidad técnica y ausencia de confusores; otros métodos requieren umbrales propios.');
 }
 if(elastography?.valid&&lsm>=8){
  state='valoracion_especializada';route='derivacion_por_vcte';refer('MASLD-VCTE','VCTE ≥8 kPa válida: valorar derivación a Hepatología/Digestivo según circuito local; no confirma fibrosis ni cirrosis.');
  if(lsm>=12)checks.push('VCTE ≥12 kPa aumenta la sospecha de fibrosis avanzada; precisa corroboración clínica, no estadificación automática.');
  if(fib4?.band==='bajo')checks.push('VCTE elevada con FIB-4 bajo: discordancia de pruebas; no cerrar seguimiento por FIB-4 aislado.');return finish();
 }
 if(fib4?.band==='alto'){
  state='valoracion_especializada';route='derivacion_por_fib4';refer('MASLD-FIB4','FIB-4 >2,67 en edad interpretable: valorar derivación a Hepatología/Digestivo, sin esperar a disponer de VCTE.');
  if(elastography?.valid&&lsm<8)checks.push('FIB-4 alto y VCTE baja: conciliar discrepancia; no cancelar automáticamente revisión especializada.');return finish();
 }
 if(age!==null&&age<35){
  state='validez_limitada';route='evaluacion_por_edad';checks.push('FIB-4 tiene precisión limitada por debajo de 35 años: una cifra baja no permite descartar fibrosis.');steps.push('Si el perfil justifica evaluación, valorar prueba secundaria o revisión especializada según contexto.');return finish();
 }
 if(missing.length||!fib4||!fib4.band){checks.push('No se clasifica como bajo riesgo por la ausencia de resultados o contexto.');return finish();}
 state='orientacion_para_revision';
 if(fib4.band==='bajo'||elastography?.valid&&lsm<8){
  route=elastography?.valid?'menor_probabilidad_tras_vcte':'menor_probabilidad_por_fib4';
  steps.push('Seguimiento en Atención Primaria si no existe sospecha clínica adicional; el resultado no excluye toda fibrosis ni demuestra ausencia de MASH.');
  followUp={intervalMonths:[12,36],appointmentCreated:false,text:'Reevaluar riesgo y FIB-4 de forma orientativa en 1–3 años, antes si cambia la situación clínica; no se crea cita.'};
 }else{
  route='evaluacion_secundaria';steps.push('Zona intermedia: valorar VCTE o una prueba alternativa validada con sus umbrales propios. Preferir evaluación secundaria si riesgo elevado o resultado próximo a 2,67.');
  checks.push('Alternativa según historia y recursos: intervención sobre hábitos/comorbilidades y repetir FIB-4 en ≤1 año por decisión profesional. Si sigue elevado, realizar evaluación secundaria. No se asigna automáticamente esta espera.');
 }
 if(get(draft,'masld_enzimas_persistentes')==='Sí')checks.push('Enzimas persistentemente elevadas requieren revisar otras causas y contexto incluso con FIB-4 bajo.');
 checks.push('Revisar hábitos y comorbilidades cardiometabólicas. Ninguna cifra indica por sí sola un fármaco específico para MASH.');
 checks.push('Las pruebas no invasivas no diagnostican MASH histológica. El circuito y plazo real de derivación dependen de recursos locales.');
 return finish();
}
