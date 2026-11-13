/** Orientación por rama clínica. No adjudica elegibilidad ni sustituye revisión por producto. */
import {FIELDS,fieldState} from '../model.mjs';
import {readMulti} from '../consultas.mjs';
import {auditCrossDomain} from './auditoria.mjs';
import {reviewDrug} from './farmacologia.mjs';
import {evaluateDm2Quick,DM2_QUICK_SOURCES} from './dm2-rapida.mjs';
import {HF_SOURCES} from './insuficiencia-cardiaca.mjs';
import {INSULIN_SOURCES,evaluateInsulinization} from './insulinizacion.mjs';
import {evaluateRenal,SOURCES} from './engine.mjs';
import {OBESITY_SOURCES} from './obesidad.mjs';
import {classifyMasldFib4,MASLD_SOURCES} from './masld.mjs';
import {classifyOfficeBp,HTA_SOURCE} from './hta.mjs';
import {lipidGoalForCategory,LIPID_SOURCES,evaluateDyslipidemia} from './dislipemia.mjs';
export const BRIEF_FIELDS=Object.freeze({
 dm2:['dm_prioridad','dm_control'],ic:['ic_fevigrupo','congestion'],
 erc:['tfge','cac','unidad_cac','persistencia'],obesidad:['imc','dm2','obesidad_perfil'],
 hepatico:['edad','fib4_informado','hepatico_valoracion'],insulina:['insulina_fase','insulina_perfil'],
 hta:['pas','pad','hta_conocida','hta_tratamiento'],lipids:['ldl','lip_riesgo','lip_estatina','lip_ezetimiba']
});
const get=(d,id)=>fieldState(d,id)==='registrado'?d.values[id]:null;
const num=(d,id)=>{const x=get(d,id);return x!==null&&/^(?:\d+\.?\d*|\.\d+)$/.test(x)?Number(x):null};
const multi=(d,id)=>get(d,id)?readMulti(get(d,id)):[];
const sources=x=>(Array.isArray(x)?x:Object.values(x)).map(s=>({title:s.title??s.name,url:s.url,locator:s.locator??s.detail??''}));
export function evaluateClinicalBrief(d,id){
 if(!BRIEF_FIELDS[id])throw new Error('Consulta breve desconocida');
 const r={module:id,state:'orientacion_de_rama',title:'Orientación clínica',situation:'',steps:[],treatment:[],safety:[],missing:[],sources:[],eligibilityEstablished:false,prescription:null,patientDose:null,actionPerformed:false};
 for(const field of BRIEF_FIELDS[id])if(get(d,field)===null)r.missing.push(FIELDS[field].label);
 const sourceMap={dm2:Object.values(DM2_QUICK_SOURCES),ic:[HF_SOURCES.esc26Original],erc:[SOURCES.kdigo2024],obesidad:OBESITY_SOURCES,hepatico:MASLD_SOURCES,insulina:Object.values(INSULIN_SOURCES),hta:[HTA_SOURCE],lipids:LIPID_SOURCES};r.sources=sources(sourceMap[id]);
 const audit=auditCrossDomain(d);
 r.safety.push(...audit.critical.map(x=>x.title+': '+x.detail));
 const invalid=BRIEF_FIELDS[id].filter(field=>fieldState(d,field)==='revisar');
 if(invalid.length)r.safety.push(...invalid.map(field=>'Revisar '+FIELDS[field].label+'.'));
 const rawAge=d.unavailable.includes('edad')?'':String(d.values.edad??'');
 if(fieldState(d,'edad')==='revisar'&&rawAge)r.safety.push('Revisar edad y ámbito del circuito.');
 if(get(d,'embarazo')==='Sí'||/^\d+$/.test(rawAge)&&Number(rawAge)<18||get(d,'dm1')==='Sí')r.safety.push('Circuito específico de edad pediátrica, gestación o DM1; no aplicar esta orientación general de adultos.');
 if((id==='obesidad'&&get(d,'ob_lactancia')==='Sí')||(id==='lipids'&&get(d,'lip_lactancia')==='Sí'))r.safety.push('Lactancia: revisar tratamiento en circuito específico.');
 if(r.safety.length){r.state='seguridad_prioritaria';r.situation='Resolver primero las alertas clínicas.';return r;}
 if(id==='dm2'){
  const q=evaluateDm2Quick(d);r.title='Orientación rápida según el caso';r.situation=q.situation;r.steps=q.nextSteps;r.treatment=q.options.map(x=>({title:x.title,detail:x.reason}));r.safety=q.safety??[];r.sources=sources(q.sources);r.state=q.state;
  // Las comprobaciones completas siguen en la revisión detallada.
  return r;
 }
 if(id==='ic'){
  r.title='Valoración por fenotipo y congestión';r.sources=sources([HF_SOURCES.esc26Original]);
  if(get(d,'ic')==='No'){r.situation='No consta IC: confirmar el diagnóstico antes de aplicar su tratamiento.';return r;}
  const group=get(d,'ic_fevigrupo'),congestion=get(d,'congestion');
  r.situation='Si la IC está diagnosticada, revisar tratamiento pronóstico y congestión por separado.';
  if(group?.startsWith('Reducida'))r.treatment.push({title:'IC con FEVI reducida: revisar tratamiento fundamental',detail:'iSGLT2, betabloqueante con evidencia, ARNI o IECA/ARA-II y ARM, según indicación y tolerancia.'});
  else if(group?.startsWith('Preservada')){
   r.treatment.push({title:'FEVI ≥50 %: confirmar el fenotipo antes de cambiar la pauta',detail:'En IC sintomática confirmada, revisar iSGLT2 y ARM por indicación. La FEVI aislada no confirma IC preservada.'});
   r.steps.push(get(d,'ic_fevi_previa_reducida')==='Sí'?'Consta FEVI previamente reducida: revisar trayectoria; la mejoría no indica retirar tratamiento.':'Comprobar evidencia objetiva e historial de FEVI antes de atribuir fenotipo preservado.');
  }else r.steps.push('Revisar informe ecocardiográfico para elegir el tratamiento del fenotipo.');
  if(congestion==='Presentes')r.treatment.push({title:'Congestión: valorar diurético de asa',detail:'Revisar gravedad, diurético ya administrado, PA, función renal y respuesta; si hay descompensación, priorizar valoración aguda.'});
  if(congestion==='Ausentes')r.steps.push('Sin congestión, no añadir diurético de asa por rutina.');
  r.steps.push('Para concretar medicamentos: revisar PA, TFGe, potasio y tratamiento actual.');
 }
 if(id==='erc'){
  r.title='Seguridad, seguimiento y derivación renal';r.sources=sources([SOURCES.kdigo2024]);
  const renal=evaluateRenal(d),e=num(d,'tfge'),a=get(d,'unidad_cac')==='mg/g'?num(d,'cac'):null;
  if(renal.status==='invalid'){r.state='seguridad_prioritaria';r.safety.push('Revisar TFGe, albuminuria y unidades antes de interpretar.');r.situation='Mediciones renales no válidas.';return r;}
  r.situation=e!==null&&a!==null?'Categorías descriptivas: '+renal.categories.gfr+' · '+renal.categories.albuminuria+'.':'Completar TFGe y albuminuria con su unidad.';
  if(get(d,'persistencia')!=='Sí')r.steps.push('Confirmar cronicidad antes de aplicar el tratamiento de ERC; una alteración aislada no confirma el diagnóstico.');
  else if(renal.markerPresent&&e!==null){
   if(e>=20&&(get(d,'dm2')==='Sí'||get(d,'ic')==='Sí'||a!==null&&a>=200||e<45))r.treatment.push({title:'Revisar protección renal con iSGLT2',detail:'La indicación depende de DM2, IC, TFGe y albuminuria; comprobar la ficha del producto antes de iniciar. No son intercambiables todos los límites de inicio.'});
   else if(e<20)r.steps.push('TFGe <20: no plantear un inicio de iSGLT2 desde este circuito; revisar continuidad si ya lo recibe.');
   if(a!==null&&a>=30)r.treatment.push({title:'Albuminuria: revisar IECA/ARA-II',detail:'Comprobar PA, potasio y tratamiento actual. Finerenona requiere la indicación correspondiente y comprobaciones adicionales; no se añade solo por albuminuria.'});
  }else if(e!==null&&a!==null)r.steps.push('Estos valores no confirman ERC por sí solos; revisar otros marcadores y contexto.');
  if(e!==null&&e<30)r.steps.push('TFGe <30: valorar Nefrología y si el deterioro es reciente; la urgencia depende de la situación clínica.');
 }
 if(id==='obesidad'){
  r.title='Peso y tratamiento';r.sources=sources(OBESITY_SOURCES.filter((_,i)=>[0,3,4].includes(i)));
  const bmi=num(d,'imc'),profile=multi(d,'obesidad_perfil'),comorb=get(d,'dm2')==='Sí'||profile.some(x=>!['Ninguna seleccionada','Obesidad sarcopénica'].includes(x));
  if(['ob_perdida_involuntaria','ob_tca','ob_edema','ob_secundaria'].some(x=>get(d,x)==='Sí')){r.situation='Valorar primero el condicionante nutricional o etiológico registrado.';r.steps.push('No intensificar la pérdida de peso hasta revisar el problema específico.');return r;}
  if(get(d,'embarazo_planificado')==='Sí'){r.situation='Revisar planificación gestacional antes de valorar fármacos para peso.';return r;}
  if(bmi===null||bmi<=0){r.situation='Introducir un IMC positivo.';return r;}
  r.situation='IMC '+bmi.toFixed(2)+' · '+(bmi>=30?'IMC en rango de obesidad.':bmi>=25?'IMC en rango de sobrepeso.':'Fuera del rango de sobrepeso/obesidad.');
  r.steps.push('Acordar alimentación y actividad adaptadas a objetivos y capacidad funcional.');
  if(bmi>=30||bmi>=27&&comorb){
   const existing=multi(d,'farmacos_clases').some(x=>['arGLP-1','Agonista dual GIP/GLP-1'].includes(x))||['Wegovy subcutáneo','Tirzepatida'].includes(get(d,'ob_farmaco_actual'));
   const products=[['semaglutida_wegovy_sc','semaglutida subcutánea para peso'],['tirzepatida','tirzepatida']].map(([id,title])=>({id,title,review:reviewDrug(d,id,'peso')}));
   const available=products.filter(x=>!x.review.blocked.length);
   if(existing)r.treatment.push({title:'Revisar la incretina ya utilizada',detail:'Identificar producto, dosis y respuesta. No añadir otra terapia incretínica.'});
   else if(available.length)r.treatment.push({title:'Valorar '+available.map(x=>x.title).join(' o '),detail:'El IMC y la comorbilidad seleccionan una rama de valoración; completar seguridad, tratamiento actual e indicación por presentación.'});
   r.steps.push(...products.flatMap(x=>x.review.blocked));
  }else if(bmi>=27&&!comorb)r.steps.push('Antes de valorar fármacos con IMC <30, confirmar si existe una comorbilidad relacionada con el peso.');
  if(profile.includes('Obesidad sarcopénica')||get(d,'ob_musculo')==='Sí')r.steps.push('Priorizar función y preservación muscular; adaptar nutrición y ejercicio antes de intensificar el plan.');
 }
 if(id==='hepatico'){
  r.title='Fibrosis hepática y siguiente paso';r.sources=sources(MASLD_SOURCES);
  const age=num(d,'edad'),fib=num(d,'fib4_informado');
  if(get(d,'fib4_agudo')==='Sí'||['Conocida','Sospechada'].includes(get(d,'masld_cirrosis'))||get(d,'hepatica_grave')==='Sí'){
   r.situation='No aplicar el circuito rutinario de cribado.';r.steps.push('Revisar proceso agudo o enfermedad hepática avanzada en su circuito específico.');return r;
  }
  if(get(d,'masld_fib4_origen')==='Informado por fuente externa'&&get(d,'masld_fib4_confirmado')==='No'){
   r.situation='El FIB-4 externo requiere reconfirmación tras editar datos.';r.steps.push('Revisar su procedencia en la evaluación detallada.');return r;
  }
  if(age===null||fib===null||fib<=0){r.situation='Introducir edad y FIB-4 disponible.';return r;}
  if(age<35){r.situation='FIB-4 de rendimiento limitado por debajo de 35 años.';r.steps.push('Valorar otra evaluación según perfil clínico; un índice bajo no cierra el circuito.');return r;}
  if(!(['Esteatosis documentada y otras causas evaluadas','Otras causas evaluadas; esteatosis no confirmada'].includes(get(d,'hepatico_valoracion'))&&(get(d,'hepatico_valoracion')==='Esteatosis documentada y otras causas evaluadas'||get(d,'dm2')==='Sí'||get(d,'fib4_contexto')==='Perfil de riesgo compatible con evaluación MASLD'))){r.situation='Completar la evaluación inicial de esteatosis y otras causas.';return r;}
  const band=classifyMasldFib4(fib,age);
  r.situation='FIB-4 introducido: '+fib.toFixed(2)+' · '+(band==='bajo'?'banda baja':band==='alto'?'banda alta':'banda intermedia')+'.';
  // Los identificadores del clasificador se normalizan sin duplicar umbrales.
  if(num(d,'elastografia')!==null){r.steps.push('Ya consta una elastografía: revisar método, calidad y concordancia en la evaluación detallada antes de asignar seguimiento.');}
  else if(band==='low'||band==='bajo')r.steps.push('Reevaluar FIB-4 en 1–3 años según el riesgo; adelantar valoración si cambia el contexto.');
  else if(band==='high'||band==='alto')r.steps.push('Valorar segunda prueba de fibrosis y evaluación especializada; FIB-4 no confirma fibrosis avanzada por sí solo.');
  else r.steps.push('Valorar elastografía u otra segunda prueba. Según contexto, cabe intensificar hábitos y comorbilidades y reevaluar en un año.');
  r.treatment.push({title:'Abordar el riesgo cardiometabólico',detail:'Tratar obesidad y diabetes por sus indicaciones. FIB-4 aislado no selecciona un fármaco para MASH.'});
 }
 if(id==='insulina'){
  r.title='Insulinización: siguiente decisión';r.sources=sources(INSULIN_SOURCES);
  const full=evaluateInsulinization(d,'quick');
  if(['seguridad_prioritaria','revisar_coherencia'].includes(full.state)){r.state='seguridad_prioritaria';r.situation=full.summary;r.safety=full.alerts.length?full.alerts:full.checks;r.steps=full.nextSteps;return r;}
  const phase=get(d,'insulina_fase'),profile=multi(d,'insulina_perfil');
  r.situation=phase??'Seleccionar la fase del tratamiento.';
  if(profile.includes('Debut sintomático o proceso intercurrente')){r.situation='Valorar primero gravedad y situación aguda.';r.steps.push('Comprobar glucemia, hidratación y cetonas según contexto antes de utilizar una pauta ambulatoria.');return r;}
  if(phase==='Valorar inicio')r.treatment.push({title:'Valorar necesidad de insulina basal',detail:'Revisar síntomas, objetivo glucémico y alternativas basadas en GLP-1 cuando proceda; antes de una pauta individual, comprobar peso, función renal y autocuidado.'});
  if(phase==='En tratamiento basal · valorar intensificación')r.treatment.push({title:'Distinguir ayunas altas de elevaciones posprandiales',detail:'Si ayunas están en objetivo, revisar sobrebasalización y patrón posprandial antes de aumentar basal. Confirmar pauta y episodios de hipoglucemia.'});
  if(phase==='Valorar desintensificación')r.treatment.push({title:'Revisar simplificación del tratamiento',detail:'Valorar hipoglucemia, fragilidad y carga de tratamiento antes de reducir o retirar una pauta.'});
  if(profile.includes('Tratamiento con corticoides'))r.steps.push('Corticoides: revisar patrón y horario; este recorrido no emite una pauta específica por esteroide.');
 }
 if(id==='hta'){
  r.title='Presión arterial y conducta';r.sources=sources([HTA_SOURCE]);
  const category=classifyOfficeBp(num(d,'pas'),num(d,'pad'));
  if(!category){r.situation='Revisar las cifras de PAS y PAD.';return r;}
  r.situation=category==='rango_hta'?'Cifras de consulta en rango de HTA; confirmar técnica y diagnóstico.':category==='pa_elevada'?'Cifras de consulta en rango de PA elevada.':'Cifras de consulta no elevadas según el marco ESC.';
  if(category==='rango_hta'){
   r.steps.push('Repetir con técnica correcta y confirmar mediante AMPA/MAPA cuando corresponda.');
   r.treatment.push({title:get(d,'hta_tratamiento')==='Con tratamiento confirmado'?'Revisar la pauta actual y el control fuera de consulta':'Si se confirma HTA y procede tratar, valorar opciones de primera línea',detail:'IECA o ARA-II, calcioantagonista dihidropiridínico y diurético tiazídico/similar, según contexto. No combinar IECA y ARA-II. Revisar adherencia y seguridad antes de elegir o ajustar.'});
  }else r.steps.push('Hábitos y riesgo cardiovascular determinan el siguiente paso; no iniciar medicación solo por esta categoría.');
 }
 if(id==='lipids'){
  r.title='Objetivo LDL y tratamiento';r.sources=sources(LIPID_SOURCES);
  const full=evaluateDyslipidemia(d),rank={Bajo:0,Moderado:1,Alto:2,'Muy alto':3},risk=get(d,'lip_riesgo'),e=num(d,'tfge');
  const documentedMinimum=get(d,'lip_ascvd')==='Sí'?3:get(d,'erc')==='Sí'&&e!==null&&e<30?3:get(d,'erc')==='Sí'&&e!==null&&e<60?2:null;
  if(full.alerts.length||documentedMinimum!==null&&Object.hasOwn(rank,risk??'')&&rank[risk]<documentedMinimum){
   r.state='seguridad_prioritaria';r.situation='Reconciliar categoría lipídica y antecedentes antes de fijar el objetivo.';r.safety=full.alerts.length?full.alerts:['La categoría aportada es inferior a la que exige revisar la enfermedad cardiovascular/renal registrada.'];return r;
  }
  const goal=lipidGoalForCategory(get(d,'lip_riesgo')),ldl=num(d,'ldl');
  if(!goal||ldl===null||ldl<=0){r.situation='Introducir LDL y una categoría lipídica previamente valorada.';return r;}
  r.situation='Para la categoría aportada: LDL <'+goal.ldlLessThan+' mg/dL'+(goal.requiresFiftyPercent?' y reducción ≥50 % desde basal.':'.');
  r.steps.push('Verificar que la categoría corresponde al contexto clínico; no se confirma por seleccionarla.');
  if(ldl>=goal.ldlLessThan)r.treatment.push({title:'LDL por encima del objetivo aportado',detail:!get(d,'lip_estatina')?'Conciliar tratamiento actual antes de decidir si iniciar o intensificar.':get(d,'lip_estatina')==='Ninguna'?'Valorar estatina e intensidad según riesgo, tolerancia e interacciones.':'Revisar adherencia e intensidad de estatina; si sigue fuera de objetivo con dosis máxima tolerada, revisar ezetimiba si no la recibe y opciones adicionales según riesgo.'});
  else r.steps.push('Objetivo absoluto alcanzado según la categoría aportada; comprobar también reducción relativa cuando corresponda y tolerancia.');
 }
 if(!r.situation)r.situation='Seleccionar los criterios de la consulta.';
 if(r.missing.length)r.state='datos_parciales';
 return r;
}
