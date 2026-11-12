/**
 * CaHReMe — fichas CIMA por producto, metformina y dapagliflozina.
 * Consulta: 12/11/2026. Ámbito: adultos. No prescribe ni ajusta dosis.
 * Referencias originales:
 * Metformina Tarbis 850/1000 mg EFG: https://cima.aemps.es/cima/dochtml/ft/76579/FT_76579.html
 * Forxiga 5/10 mg: https://cima.aemps.es/cima/dochtml/ft/112795007/
 */
import { fieldState } from '../model.mjs';
import { readMulti } from '../consultas.mjs';

const REVIEWED='2026-11-12';
export const BASE_DRUGS={
  metformina: {
    id:'metformina',generic:'Metformina',exampleBrand:'Metformina Tarbis · liberación inmediata',
    className:'Biguanida',status:'ficha_tecnica_revisada_no_validada_clinicamente',
    source:{authority:'CIMA-AEMPS',url:'https://cima.aemps.es/cima/dochtml/ft/76579/FT_76579.html',
      sections:['4.1','4.2','4.3','4.4','4.5'],reviewed:REVIEWED},
    routes:[{id:'dm2',name:'DM2 en adultos · metformina de liberación inmediata',labelDoses:[
      'Para TFG ≥90: dosis inicial habitual 500 u 850 mg dos o tres veces al día, con o después de comidas; la ficha contempla hasta 3.000 mg/día.',
      'La ficha limita la dosis diaria total a 3.000 mg con TFG ≥60, 2.000 mg con TFG 45–59 y 1.000 mg con TFG 30–44. Repartir en 2–3 tomas.',
      'Con TFG 30–59: revisar factores de acidosis láctica antes de iniciar; la dosis inicial será como máximo la mitad de la máxima diaria.',
      'TFG <30: CONTRAINDICADA. No extrapolar esta pauta a presentaciones de liberación prolongada.'
    ]}],
    warningText:[
      'Contraindicada con TFG <30, acidosis metabólica aguda, deshidratación grave, sepsis o shock con posible daño renal agudo.',
      'Contraindicada en insuficiencia cardíaca descompensada, hipoxia tisular e insuficiencia hepática.',
      'Suspender en el momento del contraste yodado intravascular; no reanudar antes de 48 h, con función renal reevaluada y estable.',
      'Suspender al realizar cirugía bajo anestesia general, espinal o epidural; reanudar según recuperación de ingesta y función renal estable.',
      'Riesgo raro de acidosis láctica; reconsiderar ante vómitos/diarrea intensos, fiebre o disminución de ingesta.',
      'Precaución con alcohol, tratamientos que deterioren función renal y enfermedades mitocondriales como MELAS/MIDD.'
    ],
    monitoring:[
      'TFG antes de iniciar y al menos anual; cada 3–6 meses si hay mayor riesgo de deterioro renal o edad avanzada.',
      'Revisar tolerancia digestiva y control glucémico tras ajustes; no modificar dosis desde este módulo.',
      'Valorar vitamina B12 cuando hay anemia o neuropatía; considerar controles periódicos según factores de riesgo.'
    ]
  },
  dapagliflozina: {
    id:'dapagliflozina',generic:'Dapagliflozina',exampleBrand:'Forxiga · comprimidos',
    className:'iSGLT2',status:'ficha_tecnica_revisada_no_validada_clinicamente',
    source:{authority:'CIMA-AEMPS',url:'https://cima.aemps.es/cima/dochtml/ft/112795007/',
      sections:['4.1','4.2','4.3','4.4','4.5'],reviewed:REVIEWED},
    routes:[
      {id:'dm2',name:'DM2 insuficientemente controlada · adultos',labelDoses:[
        'Referencia de ficha: 10 mg por vía oral una vez al día.',
        'No requiere ajuste por TFG; inicio NO recomendado con TFG <25 mL/min.',
        'Con TFG <45, el efecto hipoglucemiante disminuye y puede necesitar otro tratamiento glucémico, sin excluir beneficio cardiorrenal.'
      ]},
      {id:'ic',name:'Insuficiencia cardíaca crónica sintomática · adultos',labelDoses:[
        'Referencia de ficha: 10 mg por vía oral una vez al día.',
        'No se recomienda iniciar con TFG <25 mL/min. No es una pauta de titulación glucémica.'
      ]},
      {id:'erc',name:'Enfermedad renal crónica · adultos',labelDoses:[
        'Referencia de ficha: 10 mg por vía oral una vez al día.',
        'No se recomienda iniciar con TFG <25 mL/min; no convertir este límite de inicio en orden de suspensión de un tratamiento ya instaurado.'
      ]}
    ],
    warningText:[
      'No usar en diabetes tipo 1. Hipersensibilidad es contraindicación formal de ficha.',
      'Sospecha de cetoacidosis: evaluación urgente, incluso con glucemia moderada; revisar interrupción inmediata.',
      'Interrumpir durante hospitalización por enfermedad aguda grave o cirugía mayor y vigilar cetonas; reanudar solo estable y con cetonas normales.',
      'Depleción del volumen: valorar interrupción temporal y controles de presión arterial/electrolitos.',
      'En insuficiencia hepática grave, la ficha recomienda inicio con 5 mg y posible aumento a 10 mg si se tolera (requiere revisión específica).',
      'Vigilar riesgo de hipoglucemia con insulina o sulfonilureas.'
    ],
    monitoring:[
      'Comprobar función renal y estado de volemia antes de decidir inicio y según evolución.',
      'Valorar presión arterial, síntomas de deshidratación, infecciones genitales y efectos adversos.',
      'Ante enfermedad grave o cirugía: controlar cuerpos cetónicos y confirmar estabilidad antes de valorar reinicio.'
    ]
  }
};
function present(draft,id){
  try {return fieldState(draft,id)==='registrado'?String(draft.values[id]):null;}
  catch{return null;}
}
function numeric(draft,id){const v=present(draft,id);return v===null?null:Number(v);}
function classes(draft){
  const v=present(draft,'farmacos_clases');
  return v===null?null:readMulti(v);
}
function unique(v){return [...new Set(v)];}
export function metforminRenalCeiling(egfr) {
  if(typeof egfr!=='number'||!Number.isFinite(egfr)||egfr<=0)return null;
  if(egfr<30)return {status:'contraindicada',maxMgPerDay:null};
  if(egfr<45)return {status:'limite_de_ficha',maxMgPerDay:1000};
  if(egfr<60)return {status:'limite_de_ficha',maxMgPerDay:2000};
  return {status:'limite_de_ficha',maxMgPerDay:3000};
}
/** Devuelve comprobaciones de ficha, nunca elegibilidad ni pauta personalizada. */
export function reviewBaseDrug(draft,drugId,routeId){
  const drug=BASE_DRUGS[drugId],route=drug?.routes.find(r=>r.id===routeId);
  if(!drug||!route)throw Error('Producto o indicación no reconocidos');
  const blocked=[],missing=[],checks=[];
  const age=numeric(draft,'edad'),egfr=numeric(draft,'tfge');
  const med=classes(draft);
  const acute=present(draft,'situacion_aguda');
  const dehydration=present(draft,'deshidratacion_gi');
  const renal=drugId==='metformina'?metforminRenalCeiling(egfr):null;
  if(age===null)missing.push('Confirmar edad adulta.');
  else if(age<18)blocked.push('Este módulo solo revisa indicaciones para adultos.');
  if(egfr===null)missing.push('TFGe actual necesaria para la revisión renal.');
  if(present(draft,'alergias_revisadas')!=='Sí')checks.push('Comprobar hipersensibilidad al principio activo y excipientes.');
  if(present(draft,'medicacion_revisada')!=='Sí')checks.push('Conciliar medicamentos, formulaciones y dosis actuales.');
  if(med===null)checks.push('Clases farmacológicas actuales no registradas.');
  else if(med.includes(drugId==='metformina'?'Metformina':'iSGLT2'))
    checks.push('La clase farmacológica ya figura registrada; identificar molécula y dosis, y no iniciar duplicados.');
  if(present(draft,'dm2')==='No' && routeId==='dm2')
    blocked.push('No consta DM2: indicación seleccionada contradicha por la ficha.');
  else if(present(draft,'dm2')!=='Sí' && routeId==='dm2')
    missing.push('Confirmar DM2 e indicación de tratamiento.');
  if(present(draft,'embarazo')==='Sí')
    checks.push('Revisar ficha exacta y circunstancias de embarazo antes de prescribir.');
  if(drugId==='metformina'){
    if(egfr!==null&&egfr<30)
      blocked.push('Metformina CONTRAINDICADA con TFGe <30 mL/min/1,73 m².');
    if(egfr!==null&&egfr>=30&&egfr<60)
      checks.push('Aplicar máximo diario por TFGe; revisar factores de riesgo de acidosis láctica y dosis de inicio.');
    if(present(draft,'acidosis_metabolica')==='Sí'||present(draft,'cetoacidosis_sospecha')==='Sí')
      blocked.push('Acidosis metabólica aguda o sospecha de cetoacidosis: contraindicación y valoración inmediata.');
    if(present(draft,'hipoxia_tisular')==='Sí'||present(draft,'ic_descompensada')==='Sí')
      blocked.push('Hipoxia tisular o IC descompensada: metformina contraindicada según ficha.');
    if(present(draft,'insuficiencia_hepatica')==='Sí')
      blocked.push('Insuficiencia hepática: contraindicación de la ficha de metformina.');
    if(present(draft,'lra_sospecha')==='Sí'||dehydration==='Sí'||acute==='Enfermedad aguda grave')
      blocked.push('Posible lesión renal aguda, deshidratación o enfermedad aguda grave: no iniciar; revisar interrupción temporal si ya la recibe.');
    if(present(draft,'contraste_yodado')==='Sí')
      blocked.push('Contraste yodado intravascular: ficha exige interrupción y valoración de reinicio ≥48 h tras comprobación renal.');
    if(present(draft,'cirugia_anestesia')==='Sí')
      blocked.push('Cirugía con anestesia general, espinal o epidural: ficha exige suspensión y reevaluación de reinicio.');
    for(const [id,label] of [
      ['acidosis_metabolica','Descartar acidosis metabólica aguda y cetoacidosis.'],
      ['hipoxia_tisular','Descartar hipoxia tisular y enfermedad cardiorrespiratoria aguda.'],
      ['ic_descompensada','Confirmar ausencia de insuficiencia cardíaca descompensada.'],
      ['insuficiencia_hepatica','Confirmar ausencia de insuficiencia hepática.'],
      ['lra_sospecha','Comprobar estabilidad renal y ausencia de lesión renal aguda.'],
      ['contraste_yodado','Comprobar contraste yodado intravascular previsto o reciente.'],
      ['cirugia_anestesia','Comprobar cirugía con anestesia general, espinal o epidural.']])
      if(!['Sí','No'].includes(present(draft,id)))checks.push(label);
    checks.push('Considerar vitamina B12 si anemia, neuropatía o factores de riesgo.');
    checks.push('Antes de iniciar/ajustar, comprobar forma de liberación y ficha técnica de esa presentación.');
  } else {
    if(egfr!==null&&egfr<25)
      blocked.push('No se recomienda INICIAR dapagliflozina con TFGe <25 mL/min/1,73 m².');
    if(present(draft,'dm1')==='Sí')
      blocked.push('Dapagliflozina no debe utilizarse en diabetes tipo 1.');
    else if(present(draft,'dm1')!=='No')
      checks.push('Comprobar ausencia de diabetes tipo 1.');
    if(present(draft,'cetoacidosis_sospecha')==='Sí')
      blocked.push('Sospecha de cetoacidosis: evaluar de inmediato; no iniciar dapagliflozina.');
    else if(present(draft,'cetoacidosis_sospecha')!=='No')
      checks.push('Evaluar riesgo de cetoacidosis incluso con glucemia poco elevada.');
    if(['Enfermedad aguda grave','Cirugía mayor o ayuno prolongado'].includes(acute))
      blocked.push('Proceso agudo grave o cirugía mayor/ayuno: no iniciar y revisar tratamiento existente.');
    if(dehydration==='Sí')
      blocked.push('Depleción de volumen/deshidratación: no proponer inicio hasta corregir y revisar clínica.');
    if(present(draft,'hepatica_grave')==='Sí')
      checks.push('CIMA Forxiga: en insuficiencia hepática grave recomienda inicio de 5 mg y titulación específica; no extrapolar 10 mg.');
    if(med?.includes('iSGLT2'))
      blocked.push('iSGLT2 ya registrado: no proponer un segundo fármaco de la clase sin conciliación.');
    if(med?.includes('Insulina')||med?.includes('Sulfonilurea'))
      checks.push('Valorar riesgo de hipoglucemia con insulina o sulfonilurea.');
    if(egfr!==null&&egfr<45&&routeId==='dm2')
      checks.push('Con TFGe <45 disminuye la eficacia hipoglucemiante; no confundir con beneficio cardiorrenal.');
    if(routeId==='ic'){
      if(present(draft,'ic')==='No'||present(draft,'ic_sintomatica')==='No')
        blocked.push('La vía de IC requiere insuficiencia cardíaca crónica sintomática.');
      else if(present(draft,'ic')!=='Sí'||present(draft,'ic_sintomatica')!=='Sí')
        missing.push('Confirmar insuficiencia cardíaca crónica sintomática.');
    }
    if(routeId==='erc'){
      if(present(draft,'erc')==='No'||present(draft,'persistencia')==='No')
        blocked.push('No se documenta ERC según los datos aportados para esta vía.');
      else if(present(draft,'erc')!=='Sí'||present(draft,'persistencia')!=='Sí')
        missing.push('Confirmar enfermedad renal crónica y persistencia.');
    }
    checks.push('Revisar volumen circulante, presión arterial y situación de diuréticos.');
    checks.push('La continuidad con TFGe <25 no se decide aplicando el umbral de INICIO.');
  }
  const state=blocked.length?'bloqueo':missing.length?'datos_insuficientes':'revision_pendiente';
  return {
    drugId,routeId,state,blocked:unique(blocked),missing:unique(missing),checks:unique(checks),
    labelDoses:route.labelDoses.slice(),source:drug.source,labelRoute:route.name,
    renalReference:renal,patientDose:null,prescription:null,monitoring:drug.monitoring.slice(),
    notice:'Información CIMA por presentación; no es una prescripción ni evaluación completa de elegibilidad.'
  };
}
