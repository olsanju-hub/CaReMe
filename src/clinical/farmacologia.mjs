import {isFinerenoneContinuation} from './identidad-farmaco.mjs';
/**
 * CaHReMe — catálogo farmacológico CIMA-AEMPS, revisión 2026-11-11.
 * NO PRESCRIPTOR: las pautas son transcripciones estructuradas de fichas técnicas
 * y nunca se convierten automáticamente en una orden personalizada.
 *
 * Revisión por principio activo y por INDICACIÓN, no por clase farmacológica.
 * Fuente: CIMA-AEMPS Jardiance (114930014) y Kerendia (1211616002).
 */
import { fieldState } from '../model.mjs';
import { readMulti } from '../consultas.mjs';
import { INCRETIN_DRUGS, reviewIncretinDrug } from './incretinas.mjs';
import { BASE_DRUGS, reviewBaseDrug } from './basales.mjs';
import { auditCrossDomain } from './auditoria.mjs';

const EMPA_URL = 'https://cima.aemps.es/cima/dochtml/ft/114930014';
const FINE_URL = 'https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html';

export const DRUGS = Object.freeze({
  empagliflozina: {
    id: 'empagliflozina',
    generic: 'Empagliflozina',
    exampleBrand: 'Jardiance',
    className: 'iSGLT2',
    status: 'ficha_tecnica_revisada_no_validada_clinicamente',
    source: { authority: 'CIMA-AEMPS', url: EMPA_URL, sections: ['4.1', '4.2', '4.3', '4.4', '4.5'], reviewed: '2026-11-11' },
    routes: [
      { id: 'dm2', name: 'DM2 insuficientemente controlada', labelDoses: [
        'Inicio: 10 mg por vía oral una vez al día.',
        'Si tolera 10 mg, necesita más control glucémico y TFGe ≥60: puede aumentarse a 25 mg una vez al día.',
        'Dosis máxima: 25 mg/día. Con TFGe <60, dosis diaria de 10 mg.'
      ]},
      { id: 'ic', name: 'Insuficiencia cardíaca crónica sintomática (adultos)', labelDoses: [
        'Dosis indicada: 10 mg por vía oral una vez al día.'
      ]},
      { id: 'erc', name: 'Enfermedad renal crónica (adultos)', labelDoses: [
        'Dosis indicada: 10 mg por vía oral una vez al día.'
      ]}
    ],
    warningText: [
      'No iniciar con TFGe <20 mL/min/1,73 m² (experiencia limitada).',
      'No utilizar en diabetes mellitus tipo 1.',
      'Ante sospecha de cetoacidosis, evaluación inmediata aunque glucemia no muy elevada.',
      'Revisar suspensión temporal durante enfermedad aguda grave, cirugía mayor o ayuno prolongado.',
      'Considerar hipovolemia, hipotensión y riesgo de infecciones; precaución en hepatopatía grave.',
      'Si se combina con insulina o sulfonilurea, comprobar riesgo de hipoglucemia.'
    ],
    monitoring: [
      'TFGe antes de iniciar y al menos anualmente durante el tratamiento, además de controles según situación clínica.',
      'Valorar volemia, presión arterial y electrolitos si existe riesgo de pérdida de líquidos.',
      'En procedimientos mayores o cuadros agudos graves: evaluar cetonemia y estabilidad antes de reanudar.'
    ]
  },
  finerenona: {
    id: 'finerenona',
    generic: 'Finerenona',
    exampleBrand: 'Kerendia',
    className: 'ARM no esteroideo',
    status: 'ficha_tecnica_revisada_no_validada_clinicamente',
    source: { authority: 'CIMA-AEMPS', url: FINE_URL, sections: ['4.1', '4.2', '4.3', '4.4', '4.5'], reviewed: '2026-11-11' },
    routes: [
      { id: 'erc_dm2', name: 'ERC con albuminuria asociada a DM2 (adultos)', labelDoses: [
        'Inicio si TFGe ≥60: 20 mg por vía oral una vez al día.',
        'Inicio si TFGe ≥25 y <60: 10 mg por vía oral una vez al día.',
        'Objetivo y dosis máxima en esta indicación: 20 mg/día.',
        'En ERC con DM2, con K >4,8 y ≤5,0 mmol/L, considerar inicio solo con monitorización adicional.'
      ]},
      { id: 'ic_fevi40', name: 'IC crónica sintomática con FEVI ≥40 % (adultos)', labelDoses: [
        'Inicio si TFGe ≥60: 20 mg por vía oral una vez al día.',
        'Inicio si TFGe ≥25 y <60: 10 mg por vía oral una vez al día.',
        'Objetivo si TFGe inicial ≥60: 40 mg/día; si TFGe inicial ≥25 y <60: 20 mg/día.',
        'Máximo en esta indicación: 40 mg/día; la titulación depende de potasio y evolución renal.'
      ]}
    ],
    warningText: [
      'No iniciar si TFGe <25 mL/min/1,73 m² o K >5,0 mmol/L.',
      'Contraindicada con inhibidores potentes del CYP3A4 y enfermedad de Addison.',
      'No administrar simultáneamente con otros ARM o diuréticos ahorradores de potasio.',
      'No iniciar en insuficiencia hepática grave; revisar exposición e interacciones.',
      'Revisar embarazo, riesgo de hiperpotasemia y medicamentos con efecto sobre el potasio.',
      'Las tablas de continuidad/ajuste por potasio DIFIEREN entre ERC-DM2 e IC con FEVI ≥40 %.'
    ],
    monitoring: [
      'K y TFGe antes de iniciar y a las 4 semanas de inicio, reinicio o cambio de dosis.',
      'Monitorización periódica según resultados, TFGe y factores de riesgo de hiperpotasemia.',
      'Revisar CYP3A4, trimetoprim/cotrimoxazol, suplementos de K, pomelo y antecedentes de hiperpotasemia.'
    ]
  },
  ...INCRETIN_DRUGS,
  ...BASE_DRUGS
});
export const DRUG_IDS = Object.keys(DRUGS);
export function getDrug(id) { return Object.hasOwn(DRUGS,id) ? DRUGS[id] : null; }
export function getDrugRoute(drugId,routeId) {
  return getDrug(drugId)?.routes.find(r => r.id === routeId) || null;
}
function present(draft,id) {
  return fieldState(draft,id) === 'registrado' ? String(draft.values[id]) : null;
}
function numerical(draft,id) {
  const raw=present(draft,id);
  return raw===null ? null : Number(raw);
}
function medicationClasses(draft) {
  const raw=present(draft,'farmacos_clases');
  return raw===null ? [] : readMulti(raw);
}
function unique(items) { return [...new Set(items)]; }

/**
 * Revisar una vía de ficha técnica frente al formulario sin prescribir.
 * No devuelve dosis individual, aptitud terapéutica ni orden clínica.
 */
function reviewDrugUnverified(draft,drugId,routeId) {
  const drug=getDrug(drugId), route=getDrugRoute(drugId,routeId);
  if(!drug || !route) throw new Error('Medicamento o indicación no reconocidos');
  if(Object.hasOwn(INCRETIN_DRUGS,drugId)) return reviewIncretinDrug(draft,drugId,routeId);
  if(Object.hasOwn(BASE_DRUGS,drugId)) return reviewBaseDrug(draft,drugId,routeId);
  const blocked=[], missing=[], checks=[];
  const age=numerical(draft,'edad');
  const egfr=numerical(draft,'tfge');
  const potassium=numerical(draft,'potasio');
  const medClasses=medicationClasses(draft);
  const acute=present(draft,'situacion_aguda');
  const keto=present(draft,'cetoacidosis_sospecha');
  const isSevereAcute=['Enfermedad aguda grave','Cirugía mayor o ayuno prolongado'].includes(acute);
  if(age===null) missing.push('Edad adulta no confirmada.');
  else if(age<18) blocked.push('El prototipo solo contempla indicaciones para adultos.');
  if(egfr===null) missing.push('TFGe actual no disponible.');
  if(present(draft,'alergias_revisadas')!=='Sí')
    checks.push('Verificar hipersensibilidad al principio activo y excipientes.');
  if(present(draft,'medicacion_revisada')!=='Sí')
    checks.push('Conciliar todos los principios activos y dosis; revisar interacciones.');
  checks.push('Comprobar fecha/estabilidad de las analíticas y situación clínica.');

  if(drugId==='empagliflozina') {
    if(egfr!==null && egfr<20)
      blocked.push('No se recomienda iniciar empagliflozina con TFGe <20 (CIMA 4.2).');
    if(present(draft,'dm1')==='Sí')
      blocked.push('No utilizar empagliflozina en diabetes tipo 1 (CIMA 4.4).');
    if([null,'No valorado'].includes(present(draft,'dm1')))
      checks.push('Confirmar ausencia de diabetes tipo 1.');
    if(keto==='Sí') blocked.push('Sospecha de cetoacidosis: evaluación inmediata; no iniciar.');
    else if(keto!== 'No') checks.push('Revisar riesgo de cetoacidosis, incluso euglucémica.');
    if(isSevereAcute) blocked.push('Proceso agudo grave o cirugía/ayuno: revisar suspensión temporal, no iniciar.');
    else if(acute!== 'Estable sin proceso agudo grave')
      checks.push('Confirmar estabilidad y ausencia de ayuno prolongado.');
    if(present(draft,'hepatica_grave')==='Sí')
      checks.push('En hepatopatía grave, la ficha técnica no recomienda empagliflozina.');
    if(medClasses.includes('iSGLT2'))
      checks.push('Ya consta un iSGLT2: comprobar principio activo y evitar duplicar la clase.');
    if(medClasses.includes('Insulina') || medClasses.includes('Sulfonilurea'))
      checks.push('Valorar hipoglucemia por combinación con insulina o sulfonilurea.');
    checks.push('Evaluar hipotensión/hipovolemia y situación de diuréticos.');
    if(routeId==='dm2') {
      if(present(draft,'dm2')==='No') blocked.push('No consta DM2: esta vía posológica no corresponde a la indicación seleccionada.');
      else if(present(draft,'dm2')!=='Sí') missing.push('Confirmar DM2 y necesidad de optimizar control glucémico.');
      checks.push('25 mg corresponde solo al control glucémico de DM2, con TFGe ≥60, tolerancia y necesidad de intensificar.');
    } else if(routeId==='ic') {
      if(present(draft,'ic')==='No' || present(draft,'ic_sintomatica')==='No')
        blocked.push('La indicación requiere insuficiencia cardíaca crónica sintomática.');
      else if(present(draft,'ic')!=='Sí' || present(draft,'ic_sintomatica')!=='Sí')
        missing.push('Confirmar IC crónica sintomática.');
    } else if(routeId==='erc') {
      if(present(draft,'erc')==='No' || present(draft,'persistencia')==='No')
        blocked.push('No consta ERC crónica: verificar la indicación seleccionada.');
      else if(present(draft,'erc')!=='Sí' || present(draft,'persistencia')!=='Sí')
        missing.push('Confirmar enfermedad renal crónica documentada.');
    }
    checks.push('Verificar indicación, cobertura y ficha CIMA del producto que se prescribiría.');
  } else {
    if(potassium===null) missing.push('Potasio sérico actual no disponible.');
    if(!isFinerenoneContinuation(draft)&&egfr!==null && egfr<25) blocked.push('No iniciar finerenona con TFGe <25 (CIMA 4.2).');
    if(!isFinerenoneContinuation(draft)&&potassium!==null && potassium>5)
      blocked.push('No iniciar finerenona con potasio >5,0 mmol/L (CIMA 4.2).');
    if(medClasses.includes('ARM')&&!isFinerenoneContinuation(draft))
      blocked.push('ARM concomitante declarado: comprobar espironolactona/eplerenona/finerenona; no asociar.');
    if(present(draft,'cyp3a4_fuerte')==='Sí')
      blocked.push('Inhibidor potente CYP3A4 concomitante: contraindicación CIMA 4.3.');
    if(present(draft,'addison')==='Sí')
      blocked.push('Enfermedad de Addison: contraindicación CIMA 4.3.');
    if(present(draft,'hepatica_grave')==='Sí')
      blocked.push('Insuficiencia hepática grave: no iniciar finerenona (CIMA 4.2).');
    if(present(draft,'embarazo')==='Sí')
      blocked.push('Embarazo declarado: no generar propuesta de inicio; valoración individual de riesgos.');
    for(const [id,label] of [
      ['cyp3a4_fuerte','Confirmar ausencia de inhibidor potente CYP3A4 (p. ej., claritromicina).'],
      ['addison','Confirmar ausencia de enfermedad de Addison.'],
      ['hepatica_grave','Revisar grado de insuficiencia hepática.'],
      ['embarazo','Revisar embarazo cuando corresponda.']])
      if(present(draft,id)===null || present(draft,id)==='No valorado')
        checks.push(label);
    if(potassium!==null && potassium>4.8 && potassium<=5 && routeId==='erc_dm2')
      checks.push('Potasio >4,8 a 5,0: considerar solo con monitorización adicional las primeras cuatro semanas.');
    if(routeId==='erc_dm2') {
      if(present(draft,'dm2')==='No' || present(draft,'erc')==='No' ||
          present(draft,'persistencia')==='No' || (!isFinerenoneContinuation(draft)&&numerical(draft,'cac')!==null && numerical(draft,'cac')<30))
        blocked.push('No consta la indicación ERC con albuminuria asociada a DM2 para esta vía.');
      else if(present(draft,'dm2')!=='Sí' || present(draft,'erc')!=='Sí' ||
          present(draft,'persistencia')!=='Sí' || numerical(draft,'cac')===null)
        missing.push('Confirmar DM2 y ERC con albuminuria documentada.');
      if(present(draft,'ras_optimizado')!=='Sí')
        checks.push('Confirmar IECA/ARA-II optimizado o motivo documentado de no uso.');
    } else {
      const fevi=numerical(draft,'fevi');
      if(present(draft,'ic')==='No' || present(draft,'ic_sintomatica')==='No' ||
          (fevi!==null && fevi<40))
        blocked.push('La vía IC de finerenona exige IC crónica sintomática con FEVI ≥40 %.');
      else if(present(draft,'ic')!=='Sí' || present(draft,'ic_sintomatica')!=='Sí' ||
          fevi===null)
        missing.push('Confirmar IC crónica sintomática con FEVI ≥40 %.');
      checks.push('Aplicar tablas específicas de continuidad de la indicación IC, nunca las de ERC-DM2.');
    }
    if(isSevereAcute) checks.push('Reevaluar estabilidad clínica y función renal durante situación aguda.');
    if(medClasses.includes('Sin tratamiento farmacológico') && medClasses.length>1)
      checks.push('Conciliación farmacológica inconsistente.');
    checks.push('Revisar fármacos que aumentan potasio, CYP3A4 y diuréticos ahorradores de potasio.');
  }
  const state=blocked.length ? 'bloqueo' : missing.length ? 'datos_insuficientes' : 'revision_pendiente';
  return {
    drugId, routeId, state, blocked:unique(blocked), missing:unique(missing), checks:unique(checks),
    labelDoses:route.labelDoses.slice(), source:drug.source,
    labelRoute:route.name, patientDose:null, prescription:null,
    monitoring:drug.monitoring.slice(),
    notice:'Solo información de ficha técnica; NO es una prescripción ni confirmación de elegibilidad.'
  };
}

/** En todos los productos se aplican alertas transversales antes de mostrar el estado. */
export function reviewDrug(draft,drugId,routeId) {
  const result=reviewDrugUnverified(draft,drugId,routeId);
  const audit=auditCrossDomain(draft);
  if(!audit.requiresResolution)
    return { ...result, audit };
  return {
    ...result,
    state:'bloqueo',
    blocked:[...new Set([...result.blocked,
      ...audit.critical.map(f=>'Incoherencia transversal: '+f.title+'.')])],
    audit,
    patientDose:null,prescription:null,
    notice:'Revisión retenida por incoherencias críticas. Corregir el formulario antes de cualquier decisión.'
  };
}

