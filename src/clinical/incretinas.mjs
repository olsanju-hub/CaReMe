/**
 * CaHReMe — productos incretínicos inyectables, noviembre 2026.
 * CIMA-AEMPS: Ozempic, Wegovy SOLUCIÓN INYECTABLE y Mounjaro.
 * Ámbito exclusivo adulto. No confundir Ozempic, Wegovy subcutáneo
 * y Wegovy oral (presentación que queda FUERA de este módulo).
 * No se prescriben dosis ni se emite elegibilidad automática.
 */
import { fieldState } from '../model.mjs';
import { readMulti } from '../consultas.mjs';

const SOURCE_DATE='2026-11-12';
export const INCRETIN_DRUGS={
  semaglutida_ozempic: {
    id:'semaglutida_ozempic',generic:'Semaglutida',exampleBrand:'Ozempic · inyectable',
    className:'arGLP-1',status:'ficha_tecnica_revisada_no_validada_clinicamente',
    source:{authority:'CIMA-AEMPS',url:'https://cima.aemps.es/cima/dochtml/ft/117251002/',
      sections:['4.1','4.2','4.3','4.4','4.6'],reviewed:SOURCE_DATE},
    routes:[{id:'dm2',name:'DM2 en adultos · Ozempic subcutáneo',labelDoses:[
      'Inicio según ficha: 0,25 mg subcutáneos una vez a la semana durante 4 semanas (no mantenimiento).',
      'Después 0,5 mg una vez a la semana; si se precisa más control y se tolera, tras ≥4 semanas valorar 1 mg.',
      'Tras ≥4 semanas con 1 mg, la ficha contempla 2 mg semanales si hace falta más control glucémico. Máximo: 2 mg/semana.'
    ]}],
    warningText:[
      'Indicación específica de DM2; Ozempic no es la ficha de control del peso de Wegovy.',
      'Sospecha de pancreatitis: interrumpir y evaluar; si se confirma, no reanudar.',
      'Precaución en retinopatía diabética, especialmente con insulina y cambios rápidos del control glucémico.',
      'Pérdida súbita de visión: evaluación oftalmológica urgente; revisar NOIANA.',
      'No utilizar en embarazo. Suspender al menos 2 meses antes de gestación planificada.',
      'No se requiere ajuste de dosis por insuficiencia renal; experiencia limitada en enfermedad renal terminal.',
      'Insulina o sulfonilureas: riesgo de hipoglucemia; vigilar glucosa.'
    ],
    monitoring:[
      'Revisar tolerancia gastrointestinal, hidratación y peso/efecto glucémico.',
      'Vigilar glucemia si se administra con insulina o sulfonilureas.',
      'Si existe retinopatía diabética, valorar controles oftalmológicos.',
      'Revisar función renal cuando haya vómitos o diarrea con riesgo de deshidratación.'
    ]
  },
  semaglutida_wegovy_sc: {
    id:'semaglutida_wegovy_sc',generic:'Semaglutida',exampleBrand:'Wegovy · subcutáneo',
    className:'arGLP-1',status:'ficha_tecnica_revisada_no_validada_clinicamente',
    source:{authority:'CIMA-AEMPS',url:'https://cima.aemps.es/cima/dochtml/ft/1211608006/FT_1211608006.html',
      sections:['4.1','4.2','4.3','4.4','4.6'],reviewed:SOURCE_DATE},
    routes:[{id:'peso',name:'Control del peso en adultos · Wegovy subcutáneo',labelDoses:[
      'Escalado de referencia: 0,25 mg una vez por semana (semanas 1–4); 0,5 mg (5–8); 1 mg (9–12); 1,7 mg (13–16).',
      'Mantenimiento habitual: 2,4 mg subcutáneos una vez a la semana.',
      'La ficha vigente permite valorar 7,2 mg/semana tras ≥4 semanas con 2,4 mg en adultos con IMC ≥30 al inicio; si no añade mejoría, volver a 2,4 mg.',
      'Este módulo NO incluye Wegovy en comprimidos: sus dosis y administración son distintas.'
    ]}],
    warningText:[
      'Indicación adulta con IMC ≥30 o IMC ≥27 y <30 con comorbilidad asociada al peso.',
      'No recomendado con TFGe <30 ni en insuficiencia hepática grave, según esta ficha inyectable.',
      'No utilizar conjuntamente con otro producto agonista GLP-1.',
      'No confundir con pauta subcutánea de Ozempic ni con Wegovy oral.',
      'Pancreatitis sospechada: evaluar; confirmada: no reanudar.',
      'Pérdida súbita de visión: valoración oftalmológica; revisar NOIANA.',
      'Evitar durante embarazo; retirar al menos 2 meses antes de concepción planificada.'
    ],
    monitoring:[
      'Peso y respuesta clínica con tolerancia gastrointestinal durante escalado.',
      'Hidratación/función renal si diarrea o vómitos; precaución con deshidratación.',
      'Revisar hipoglucemia con insulina o sulfonilureas.',
      'Revisar eficacia y tolerancia antes de considerar cualquier aumento por encima de 2,4 mg.'
    ]
  },
  tirzepatida: {
    id:'tirzepatida',generic:'Tirzepatida',exampleBrand:'Mounjaro · subcutáneo',
    className:'Agonista dual GIP/GLP-1',status:'ficha_tecnica_revisada_no_validada_clinicamente',
    source:{authority:'CIMA-AEMPS',url:'https://cima.aemps.es/cima/dochtml/ft/1221685002/FT_1221685002.html',
      sections:['4.1','4.2','4.3','4.4','4.6'],reviewed:SOURCE_DATE},
    routes:[
      {id:'dm2',name:'DM2 en adultos · Mounjaro',labelDoses:[
        'Inicio: 2,5 mg subcutáneos una vez a la semana; tras 4 semanas, 5 mg/semana.',
        'Si precisa escalado, incrementar 2,5 mg con al menos 4 semanas en cada dosis actual.',
        'Mantenimiento recomendado: 5, 10 o 15 mg/semana. Máximo adulto: 15 mg/semana.'
      ]},
      {id:'peso',name:'Control del peso en adultos · Mounjaro',labelDoses:[
        'Inicio: 2,5 mg subcutáneos una vez a la semana; tras 4 semanas, 5 mg/semana.',
        'Escalado opcional de 2,5 mg tras ≥4 semanas con la dosis vigente.',
        'Mantenimiento recomendado: 5, 10 o 15 mg/semana. Máximo adulto: 15 mg/semana.'
      ]}
    ],
    warningText:[
      'Para peso: IMC ≥30 o IMC ≥27 y <30 con comorbilidad relacionada con el peso.',
      'No requiere ajuste renal por ficha, incluso en enfermedad renal terminal, pero experiencia limitada en insuficiencia renal grave/terminal.',
      'Precaución en gastroparesia grave y enfermedad gastrointestinal grave.',
      'Pancreatitis sospechada: evaluar; no reanudar si se confirma.',
      'Vómitos y diarrea pueden provocar deshidratación y deterioro renal.',
      'Embarazo: no recomendado; retirar ≥1 mes antes de gestación planificada.',
      'La combinación con insulina o sulfonilureas exige revisar hipoglucemia y autocontroles.'
    ],
    monitoring:[
      'Efectos adversos digestivos y deshidratación durante escalado.',
      'Peso o control glucémico según indicación documentada.',
      'Glucemia cuando se asocia a insulina o secretagogos; cambios solo tras revisión profesional.',
      'Función renal en episodios de deshidratación, especialmente en ERC.'
    ]
  }
};
function val(draft,id){
  try { return fieldState(draft,id)==='registrado'?String(draft.values[id]):null; }
  catch { return null; }
}
function num(draft,id){
  const v=val(draft,id);return v===null?null:Number(v);
}
function multi(draft,id){
  const v=val(draft,id);return v===null?null:readMulti(v);
}
function dedupe(items){return [...new Set(items)];}
const severe=['Enfermedad aguda grave','Cirugía mayor o ayuno prolongado'];
export function reviewIncretinDrug(draft,drugId,routeId) {
  const drug=INCRETIN_DRUGS[drugId];
  const route=drug?.routes.find(x=>x.id===routeId);
  if(!route)throw new Error('Producto o indicación incretínica desconocidos');
  const blocked=[],missing=[],checks=[];
  const age=num(draft,'edad'),egfr=num(draft,'tfge'),bmi=num(draft,'imc');
  const classes=multi(draft,'farmacos_clases');
  const pregnancy=val(draft,'embarazo');
  const intent=val(draft,'embarazo_planificado');
  const pancreatitis=val(draft,'pancreatitis_sospecha');
  const priorPancreatitis=val(draft,'pancreatitis_previa');
  const dehydration=val(draft,'deshidratacion_gi');
  const gastric=val(draft,'gastroparesia_grave');
  if(age===null)missing.push('Edad adulta no confirmada.');
  else if(age<18)blocked.push('Esta revisión contempla únicamente pacientes adultos.');
  if(val(draft,'alergias_revisadas')!=='Sí')
    checks.push('Verificar hipersensibilidad y excipientes de la presentación exacta.');
  if(val(draft,'medicacion_revisada')!=='Sí')
    checks.push('Reconciliar nombres, dosis y último día de las medicaciones actuales.');
  if(classes===null)checks.push('No se conocen las clases farmacológicas actuales.');
  else {
    if(classes.includes('arGLP-1')||classes.includes('Agonista dual GIP/GLP-1'))
      blocked.push('Ya consta terapia incretínica: no proponer inicio adicional hasta identificar molécula y posible transición.');
    if(classes.includes('iDPP-4'))checks.push('Revisar uso simultáneo de iDPP-4 y terapia incretínica.');
    if(classes.includes('Insulina')||classes.includes('Sulfonilurea'))
      checks.push('Comprobar riesgo de hipoglucemia y necesidad de ajustar el tratamiento concomitante con monitorización.');
  }
  if(pregnancy==='Sí')blocked.push('Embarazo: no iniciar el producto.');
  else if(pregnancy===null||pregnancy==='No valorado')checks.push('Descartar embarazo cuando corresponda.');
  if(intent==='Sí')blocked.push('Gestación planificada: revisar retirada del principio activo antes de concepción (2 meses semaglutida; 1 mes tirzepatida).');
  else if(intent===null||intent==='No valorado')checks.push('Consultar planificación gestacional cuando corresponda.');
  if(pancreatitis==='Sí')blocked.push('Sospecha de pancreatitis: evaluación clínica urgente y no iniciar; tratamiento existente requiere revisión inmediata.');
  else if(pancreatitis!=='No')checks.push('Preguntar por síntomas compatibles con pancreatitis actual.');
  if(priorPancreatitis==='Sí')checks.push('Antecedente de pancreatitis: precaución y valoración individual de la ficha.');
  else if(priorPancreatitis===null||priorPancreatitis==='No valorado')checks.push('Valorar antecedentes de pancreatitis.');
  if(dehydration==='Sí'||severe.includes(val(draft,'situacion_aguda')))
    blocked.push('Problema agudo o deshidratación significativa: no proponer inicio/escalado sin evaluación y estabilización.');
  else if(dehydration===null||dehydration==='No valorado')
    checks.push('Comprobar tolerancia gastrointestinal e hidratación.');
  if(gastric==='Sí')checks.push('Gastroparesia grave: revisar precauciones de la presentación antes de elegirla.');
  else if(gastric===null||gastric==='No valorado')checks.push('Valorar gastroparesia/enfermedad gastrointestinal grave.');
  if(drugId.startsWith('semaglutida')) {
    if(val(draft,'vision_subita')==='Sí')
      blocked.push('Pérdida súbita de visión: requiere evaluación oftalmológica urgente; no proponer inicio/escalado.');
    if(val(draft,'retinopatia_dm')==='Sí')
      checks.push('Retinopatía diabética: vigilar especialmente en combinación con insulina.');
    if(egfr===null)checks.push('Función renal no disponible; revisar la precaución específica del producto.');
    if(drugId==='semaglutida_ozempic' && egfr!==null && egfr<15)
      checks.push('Enfermedad renal terminal: experiencia con Ozempic limitada; no imponer ajuste renal inventado.');
    if(drugId==='semaglutida_wegovy_sc') {
      if(egfr!==null&&egfr<30)
        blocked.push('Wegovy inyectable: no recomendado con TFGe <30 según la ficha de esta presentación.');
      if(val(draft,'hepatica_grave')==='Sí')
        blocked.push('Wegovy inyectable: no recomendado en insuficiencia hepática grave.');
      if(val(draft,'dm1')==='Sí')
        blocked.push('Wegovy inyectable no recomendado en diabetes tipo 1.');
      if(num(draft,'imc_inicio')===null)
        checks.push('Para la opción de 7,2 mg, documentar IMC al inicio y al menos 4 semanas con 2,4 mg.');
      else if(num(draft,'imc_inicio')<30)
        checks.push('Con IMC al inicio <30, NO aplicar la opción de mantenimiento 7,2 mg.');
      checks.push('La pauta y comprimidos Wegovy NO son intercambiables con la pauta subcutánea.');
    }
  } else {
    if(egfr!==null&&egfr<30)
      checks.push('Insuficiencia renal grave: la ficha no exige ajuste por filtrado, pero la experiencia es limitada.');
    if(val(draft,'hepatica_grave')==='Sí')
      checks.push('Insuficiencia hepática grave: experiencia con tirzepatida limitada.');
  }
  if(routeId==='dm2') {
    if(val(draft,'dm2')==='No')
      blocked.push('No consta DM2: esta indicación no corresponde al caso declarado.');
    else if(val(draft,'dm2')!=='Sí')
      missing.push('Confirmar DM2 y necesidad de intensificación.');
    checks.push('Determinar objetivo glucémico y revisar hipoglucemia si usa insulina o sulfonilurea.');
  } else {
    if(bmi===null)missing.push('IMC para indicación de control del peso.');
    else if(bmi<27)blocked.push('IMC <27: fuera de los criterios adultos de esta indicación.');
    else if(bmi<30) {
      const comorb=val(draft,'comorbilidad_peso_confirmada');
      if(comorb==='No')blocked.push('IMC 27–<30 sin comorbilidad relacionada con el peso declarada.');
      else if(comorb!=='Sí')missing.push('Confirmar al menos una comorbilidad relacionada con el peso.');
    }
    checks.push('Confirmar peso, talla y necesidad de intervención no farmacológica concomitante.');
  }
  if(drugId==='semaglutida_ozempic')
    checks.push('La ficha de Ozempic no es una indicación para obesidad sin DM2.');
  if(drugId==='semaglutida_wegovy_sc')
    checks.push('Confirmar formulación inyectable; Wegovy oral tiene dosis y criterios de administración distintos.');
  checks.push('Comprobar financiación actual por código nacional e indicación en BIFIMED; autorización no implica financiación.');
  const state=blocked.length?'bloqueo':missing.length?'datos_insuficientes':'revision_pendiente';
  return {
    drugId,routeId,state,blocked:dedupe(blocked),missing:dedupe(missing),checks:dedupe(checks),
    labelDoses:route.labelDoses.slice(),source:drug.source,labelRoute:route.name,
    patientDose:null,prescription:null,monitoring:drug.monitoring.slice(),
    notice:'Posología documental de ficha CIMA; sin prescripción ni validación automática de elegibilidad.'
  };
}
