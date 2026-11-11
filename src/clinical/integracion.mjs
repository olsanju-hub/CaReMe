/**
 * Motor de integración clínica, fase de CANDIDATOS PARA REVISIÓN.
 * No genera recetas, dosis, inicio/suspensión automática ni órdenes.
 * Las entradas proceden exclusivamente de la ficha de sesión (sin identidad).
 *
 * Fuentes:
 * KDIGO CKD 2024, recomendaciones 3.7.1, 3.7.2, 3.8.1 y 3.9.1;
 * ADA Standards of Care 2026, secciones 9 y 11;
 * ESC HF 2026, sección 6.1.2;
 * EASL-EASD-EASO MASLD 2024, tratamiento de comorbilidades;
 * CIMA-AEMPS: advertencias sobre cetoacidosis y enfermedad aguda (empagliflozina).
 */
import { fieldState } from '../model.mjs';
import { readMulti } from '../consultas.mjs';
import { evaluateRenal, evaluateFib4 } from './engine.mjs';

export const INTEGRATION_SOURCES = Object.freeze({
  kdigo: {
    id:'KDIGO-2024-CKD', short:'KDIGO ERC 2024', section:'Rec. 3.7.1, 3.7.2, 3.8.1 y 3.9.1',
    url:'https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf'
  },
  ada9: {
    id:'ADA-2026-9',short:'ADA 2026 · Tratamiento glucémico',section:'Recs. 9.7–9.13',
    url:'https://diabetesjournals.org/care/article/49/Supplement_1/S183/163934'
  },
  ada11: {
    id:'ADA-2026-11',short:'ADA 2026 · ERC',section:'Recs. 11.7a–b',
    url:'https://diabetesjournals.org/care/article/49/Supplement_1/S246/163914'
  },
  esc: {
    id:'ESC-HF-2026',short:'ESC insuficiencia cardíaca 2026',section:'Sección 6.1.2',
    url:'https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/heart-failure'
  },
  easl: {
    id:'EASL-EASD-EASO-MASLD-2024',short:'EASL–EASD–EASO MASLD 2024',
    section:'Tratamiento de comorbilidades; figura 4',
    url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11299976/'
  },
  cima: {
    id:'CIMA-AEMPS-EMPAGLIFLOZINA',short:'CIMA-AEMPS · Empagliflozina',
    section:'Ficha técnica, apartado 4.4',
    url:'https://cima.aemps.es/cima/pdfs/es/ft/90784/FT_90784.html.pdf'
  },
  cimaFin: {
    id:'CIMA-AEMPS-FINERENONA',short:'CIMA-AEMPS · Finerenona',
    section:'Ficha técnica Kerendia, apartados 4.2–4.5',
    url:'https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html'
  }
});

function known(draft,id) {
  try { return fieldState(draft,id) === 'registrado'; }
  catch { return false; }
}
function value(draft,id) { return known(draft,id) ? String(draft.values[id]) : null; }
function number(draft,id) {
  const n=value(draft,id);
  return n === null ? null : Number(n);
}
function medicationClasses(draft) {
  const raw=value(draft,'farmacos_clases');
  return raw === null ? null : readMulti(raw);
}
function card(id,type,title,summary,checks,sources,domains=[]) {
  return { id,type,title,summary,checks:[...new Set(checks)],sources,domains };
}
const genericSafety = (draft,medications) => {
  const checks=[];
  if (medications === null) checks.push('Registrar o reconciliar clases farmacológicas actuales.');
  if (value(draft,'alergias_revisadas') !== 'Sí')
    checks.push('Comprobar alergias e intolerancias relevantes antes de elegir un medicamento.');
  if (value(draft,'medicacion_revisada') !== 'Sí')
    checks.push('Confirmar fármacos, principios activos y dosis actuales.');
  return checks;
};
export function integratePatient(draft) {
  const dm2=value(draft,'dm2')==='Sí';
  const hf=value(draft,'ic')==='Sí';
  const ckddiagnosed=value(draft,'erc')==='Sí';
  const chronic=value(draft,'persistencia')==='Sí';
  const cvd=value(draft,'ecv')==='Sí';
  const steatosis=value(draft,'esteatosis')==='Sí';
  const liverKnown=value(draft,'hepatopatia')==='Sí';
  const obesity=(number(draft,'imc') ?? -1) >= 30;
  const renal=evaluateRenal(draft);
  const hepatic=evaluateFib4(draft);
  const egfr=number(draft,'tfge');
  const acr=number(draft,'cac');
  const potassium=number(draft,'potasio');
  const medication=medicationClasses(draft);
  const classes=new Set(medication || []);
  const security=genericSafety(draft,medication);
  const acute=value(draft,'situacion_aguda');
  const ketones=value(draft,'cetoacidosis_sospecha');
  const unsafeAcute=acute === 'Enfermedad aguda grave' || acute === 'Cirugía mayor o ayuno prolongado';
  const ketoWarning=ketones === 'Sí';
  const alerts=[], options=[], context=[];
  const add=x=>{
    if(x.type==='alert') alerts.push(x);
    else if(x.type==='option') options.push(x);
    else context.push(x);
  };

  // Los datos ausentes se tratan como desconocidos, nunca como "No".
  const riskDomains = [];
  if(dm2) riskDomains.push('DM2');
  if(hf) riskDomains.push('IC');
  if(ckddiagnosed) riskDomains.push('ERC declarada');
  if(cvd) riskDomains.push('ECV');
  if(steatosis || liverKnown) riskDomains.push('Afectación hepática declarada');
  if(obesity) riskDomains.push('Obesidad por IMC aportado');

  if (hf && (classes.has('Pioglitazona') || classes.has('Saxagliptina'))) {
    add(card('HF-MED-REVIEW','alert','Revisar tratamientos en insuficiencia cardíaca',
      'Constan medicamentos que requieren revisión de idoneidad en insuficiencia cardíaca. No modificar automáticamente la pauta.',
      ['Revisar indicación y ficha técnica de pioglitazona/saxagliptina según el medicamento presente.',
       'Comprobar situación clínica, tratamiento alternativo y supervisión profesional.'],
      ['ADA-2026-9','ESC-HF-2026'],['IC','DM2']));
  }
  if (classes.has('arGLP-1') && classes.has('Agonista dual GIP/GLP-1')) {
    add(card('INCRETIN-DOUBLE','alert','Posible duplicidad de terapias incretínicas',
      'Figuran un agonista del receptor GLP-1 y un agonista dual GIP/GLP-1 a la vez. Confirmar si se trata de una transición de tratamiento.',
      ['Reconciliar molécula, fecha de última administración y prescripción vigente.'],
      ['ADA-2026-9'],['Metabólico']));
  }
  if (classes.has('iDPP-4') && (classes.has('arGLP-1') || classes.has('Agonista dual GIP/GLP-1'))) {
    add(card('INCRETIN-DPP4','alert','Revisar posible combinación incretínica innecesaria',
      'La ficha registra iDPP-4 con una terapia incretínica. Revisar duplicidades y necesidad de mantener ambas clases.',
      ['Comprobar nombres de fármacos reales y fecha del cambio de tratamiento.'],
      ['ADA-2026-9'],['Metabólico']));
  }

  // Una sospecha de cetoacidosis exige atención incluso sin IC/ERC registradas.
  if(ketoWarning) {
    add(card('KETO-URGENT-REVIEW','alert','Sospecha de cetoacidosis: valoración inmediata',
      'Una sospecha clínica de cetoacidosis requiere evaluación inmediata independientemente de la glucemia o del diagnóstico de ERC/IC.',
      ['Valorar signos y síntomas, glucemia, cetonemia, equilibrio ácido-base y gravedad.',
       'Revisar inmediatamente todos los tratamientos en curso, incluidos los iSGLT2.'],
      ['CIMA-AEMPS-EMPAGLIFLOZINA'],['DM2','Renal','Cardiovascular']));
  }
  if(unsafeAcute && classes.has('iSGLT2')) {
    add(card('SGLT2-CURRENT-ACUTE','alert','iSGLT2 registrado durante situación aguda',
      'En enfermedad aguda grave o cirugía mayor/ayuno prolongado debe revisarse interrupción temporal conforme a la ficha del principio activo.',
      ['Revisar medicamento exacto, cetonemia, estado hemodinámico y requisitos de reanudación.'],
      ['KDIGO-2024-CKD','CIMA-AEMPS-EMPAGLIFLOZINA'],['Renal','Cardiovascular','DM2']));
  }
  // iSGLT2: separar indicación de beneficio pronóstico de seguridad para el inicio.
  if(dm2 && ckddiagnosed && !chronic) {
    add(card('CKD-CHRONICITY','context','Confirmar situación renal antes de usar la rama de ERC',
      'ERC figura como antecedente, pero no consta persistencia documentada en la ficha. La app no confirma el diagnóstico.',
      ['Revisar analíticas separadas ≥3 meses y otros marcadores de enfermedad renal.',
       'Comprobar la causa de ERC, si está establecida.'],['KDIGO-2024-CKD'],['Renal']));
  }
  const ckdEvidence=ckddiagnosed && chronic;
  const sglt2Indication=hf || (dm2 && ckdEvidence);
  if(sglt2Indication) {
    const checks=[...security];
    if(egfr===null) checks.push('TFGe reciente obligatoria para comprobar condiciones de uso e inicio.');
    if(acute===null || acute==='No valorada') checks.push('Valorar enfermedad aguda grave, cirugía o ayuno prolongado.');
    if(ketones===null || ketones==='No valorada') checks.push('Valorar riesgo o sospecha clínica de cetoacidosis.');
    const supports=['KDIGO-2024-CKD', ...(dm2?['ADA-2026-9','ADA-2026-11']:[]), ...(hf?['ESC-HF-2026']:[]),'CIMA-AEMPS-EMPAGLIFLOZINA'];
    if(ketoWarning || unsafeAcute) {
      add(card('SGLT2-ACUTE-SAFETY','alert','Seguridad de iSGLT2 en situación aguda',
        ketoWarning
          ? 'Consta sospecha de cetoacidosis: precisa valoración clínica urgente. No proponer inicio de iSGLT2.'
          : 'En enfermedad aguda grave, cirugía mayor o ayuno prolongado, revisar la interrupción temporal de iSGLT2 y la cetonemia conforme a ficha técnica.',
        ['Confirmar si la persona ya recibe un iSGLT2; no presuponer suspensión realizada.',
         'Evaluar estabilidad, cetonas y criterios de reanudación según ficha técnica y contexto clínico.'],
        supports,['Renal','Cardiovascular','DM2']));
    } else if(classes.has('iSGLT2')) {
      add(card('SGLT2-EXISTING','context','iSGLT2 ya registrado',
        'No se propone añadir un segundo fármaco de la misma clase. Revisar el principio activo, indicación vigente, tolerancia y controles.',
        checks.concat(['Confirmar formulación e indicación aprobada en CIMA-AEMPS antes de ajustar.']),
        supports,['Renal','Cardiovascular','DM2']));
    } else if (egfr === null) {
      add(card('SGLT2-EGFR-UNKNOWN','context','iSGLT2: falta función renal para valorar inicio',
        'Existe un condicionante con beneficio demostrado de la clase, pero faltan datos para una valoración farmacológica.',
        checks,supports,['Renal','Cardiovascular','DM2']));
    } else if(egfr < 20) {
      add(card('SGLT2-LOW-GFR','context','iSGLT2: no proponer inicio automático con TFGe <20',
        'La recomendación de inicio KDIGO/ADA para DM2 con ERC utiliza TFGe ≥20. La continuidad de un tratamiento existente y las indicaciones de IC requieren revisión específica por molécula.',
        checks.concat(['Consultar condiciones de uso por principio activo en CIMA-AEMPS.']),
        supports,['Renal','Cardiovascular','DM2']));
    } else {
      add(card('SGLT2-REVIEW','option','Valorar beneficio de iSGLT2',
        hf && dm2 && ckdEvidence
          ? 'Confluyen insuficiencia cardíaca, DM2 y ERC declarada como crónica. La clase puede aportar beneficio cardiovascular y renal independientemente de la HbA1c.'
          : hf ? 'La insuficiencia cardíaca sintomática puede beneficiarse de esta clase, con independencia de la fracción de eyección; confirmar fenotipo y situación clínica.'
          : 'La DM2 con ERC documentada y TFGe ≥20 es una situación contemplada en KDIGO/ADA para protección renal y cardiovascular.',
        checks.concat(['Verificar el diagnóstico y situación de IC/ERC, tolerancia y estado de volumen.',
          'Seleccionar molécula, indicación autorizada y dosis únicamente tras revisar CIMA-AEMPS.']),
        supports, ['Renal','Cardiovascular','DM2']));
    }
  }

  // Incretinas: la presencia aislada de MASLD no constituye indicación hepática.
  const glpContexts=dm2 && (cvd || ckdEvidence || obesity || steatosis || liverKnown);
  if(glpContexts) {
    const checks=[...security];
    if(classes.has('arGLP-1') || classes.has('Agonista dual GIP/GLP-1')) {
      add(card('GLP-EXISTING','context','Terapia incretínica registrada',
        'Revisar molécula, beneficio esperado según comorbilidades, dosis y tolerancia antes de decidir cambios.',
        checks,['ADA-2026-9','ADA-2026-11','EASL-EASD-EASO-MASLD-2024'],
        ['DM2','Cardiovascular','Renal','Hepático']));
    } else if(unsafeAcute || ketoWarning) {
      add(card('GLP-ACUTE-DEFER','context','Posponer elección de terapia incretínica durante valoración aguda',
        'La decisión de intensificación o cambio metabólico requiere primero resolver o valorar el proceso agudo.',
        checks.concat(['Confirmar estabilidad clínica antes de revisar opciones de tratamiento crónico.']),
        ['ADA-2026-9'],['Metabólico','DM2']));
    } else {
      if(egfr===null) checks.push('Comprobar función renal para elegir el principio activo concreto.');
      add(card('GLP-REVIEW','option','Valorar un arGLP-1 con evidencia según perfil',
        ckdEvidence || cvd
          ? 'En DM2 con ERC o enfermedad cardiovascular, determinadas moléculas tienen beneficios documentados; deben elegirse por indicación y evidencia específica.'
          : 'En DM2 con obesidad o enfermedad hepática metabólica, revisar el tratamiento glucémico y del peso. No interpretar esto como tratamiento hepático específico.',
        checks.concat(['Determinar objetivos de glucemia/peso, antecedentes y efectos adversos relevantes.',
          'No combinar automáticamente arGLP-1 con agonista dual GIP/GLP-1; comprobar ficha CIMA-AEMPS.']),
        ['ADA-2026-9','ADA-2026-11','EASL-EASD-EASO-MASLD-2024'],
        ['DM2','Cardiovascular','Renal','Hepático']));
    }
  }
  if((steatosis || liverKnown) && !glpContexts) {
    add(card('LIVER-NOT-INDICATION','context','La afectación hepática aislada no indica fármacos incretínicos',
      'Evaluar factores cardiometabólicos y fibrosis cuando corresponda. No iniciar fármacos para MASH por la mera sospecha de MASLD.',
      ['Verificar diagnóstico, estadio y criterios de derivación si hay riesgo de fibrosis.'],
      ['EASL-EASD-EASO-MASLD-2024'],['Hepático']));
  }

  // ARM no esteroideo: controles de seguridad específicos de finerenona
  // (CIMA-AEMPS, ficha de Kerendia), sin extrapolar automáticamente a otros ARM.
  if(dm2 && ckdEvidence && acr!==null && acr>30 && egfr!==null && egfr>25) {
    const sources=['KDIGO-2024-CKD','ADA-2026-11','CIMA-AEMPS-FINERENONA'];
    if (unsafeAcute || ketoWarning) {
      add(card('NSMRA-ACUTE-DEFER','context','No valorar inicio de ARM no esteroideo durante situación aguda',
        'La decisión debe revisarse con potasio y función renal actualizados y paciente clínicamente estable.',
        ['Priorizar evaluación del cuadro agudo; no realizar cambios automáticos de medicación.'],
        sources,['Renal','Cardiovascular','DM2']));
    } else if (classes.has('ARM')) {
      add(card('NSMRA-MRA-EXISTING','alert','ARM ya registrado: revisar duplicidades antes de finerenona',
        'Consta tratamiento de la clase ARM sin especificar molécula; no se propone añadir otro antagonista mineralocorticoide.',
        ['Identificar si ya utiliza espironolactona, eplerenona, finerenona u otro ARM.',
         'Confirmar indicación, potasio, TFGe e interacciones.'],
        sources,['Renal','Cardiovascular','DM2']));
    } else if (potassium!==null && potassium>5.0) {
      add(card('NSMRA-K-BLOCK','alert','Potasio >5,0: no proponer inicio de finerenona',
        'La ficha técnica española de finerenona para ERC con DM2 no permite iniciar el tratamiento con potasio sérico >5,0 mmol/L.',
        ['Revisar resultado analítico, contexto clínico y tratamiento hiperpotasemiante.',
         'Considerar la urgencia de la hiperpotasemia según valor, síntomas y ECG.'],
        sources,['Renal','Cardiovascular','DM2']));
    } else {
      const checks=[...security];
      if(potassium===null) checks.push('Obtener potasio actual y confirmar que está en rango normal del laboratorio.');
      if(value(draft,'potasio_normal')!=='Sí') checks.push('Confirmar potasio normal sostenido antes de considerar un ARM no esteroideo.');
      if (potassium!==null && potassium>4.8)
        checks.push('Potasio >4,8 a 5,0: ficha CIMA contempla inicio solo con evaluación y monitorización adicionales.');
      if(value(draft,'ras_optimizado')!=='Sí') checks.push('Comprobar IECA/ARA-II a dosis máxima tolerada o motivo de intolerancia.');
      if(!classes.has('IECA') && !classes.has('ARA-II'))
        checks.push('No consta IECA/ARA-II en clases farmacológicas; reconciliar tratamiento y posibles intolerancias.');
      add(card('NSMRA-REVIEW','option','Revisar elegibilidad de ARM no esteroideo',
        'KDIGO contempla esta opción en DM2 y ERC con albuminuria persistente, TFGe >25, potasio normal y bloqueo del sistema renina-angiotensina optimizado.',
        checks.concat(['Revisar contraindicaciones e interacciones de finerenona (incluido CYP3A4 fuerte), sin prescribir desde esta pantalla.']),
        sources,['Renal','Cardiovascular','DM2']));
    }
  } else if(dm2 && ckdEvidence && (acr===null || egfr===null)) {
    add(card('NSMRA-MISSING','context','ARM no esteroideo: falta información renal',
      'Para valorar esta rama se necesitan TFGe, albuminuria persistente y potasio.',
      ['Completar TFGe y CAC y verificar tratamiento previo con IECA/ARA-II.'],
      ['KDIGO-2024-CKD','CIMA-AEMPS-FINERENONA'],['Renal']));
  }
  // Indicación distinta de la ERC con DM2: finerenona en IC crónica con FEVI >=40%.
  // Se presenta solo como consulta de ficha, sin equiparar posología ni idoneidad.
  const feviForFin=number(draft,'fevi');
  if(hf && feviForFin!==null && feviForFin>=40) {
    const notes=['Revisar la indicación específica de IC con FEVI ≥40 % y síntomas confirmados.',
      'Comprobar potasio y TFGe actuales, ARM concomitantes e inhibidores CYP3A4 potentes.',
      'No reutilizar el objetivo de 20 mg de ERC-DM2 en IC; la FT contempla hasta 40 mg/día según función renal inicial.'];
    if(potassium===null) notes.unshift('Potasio no disponible: no valorar inicio.');
    if(potassium!==null && potassium>5) notes.unshift('Potasio >5,0 mmol/L: la ficha no permite iniciar finerenona.');
    if(egfr===null || egfr<25) notes.unshift('Revisar función renal: inicio no recomendado con TFGe <25.');
    add(card('FIN-HF-LABEL','context','Finerenona en IC: vía CIMA distinta de ERC-DM2',
      'Kerendia tiene indicación en IC crónica sintomática con FEVI ≥40 %. Su pauta objetivo depende de la TFGe inicial y es distinta de la pauta en ERC asociada a DM2.',
      notes,['CIMA-AEMPS-FINERENONA'],['IC','Cardiovascular']));
  }
  if(hepatic.status==='calculated' &&
      hepatic.interpretation==='higher_probability') {
    add(card('FIB4-CROSS','context','Priorizar valoración adicional de fibrosis hepática',
      'FIB-4 elevado en un contexto evaluable; la cifra no confirma fibrosis y no constituye indicación terapéutica por sí sola.',
      ['Completar la evaluación no invasiva y valorar ruta de derivación según guía y disponibilidad.'],
      ['EASL-EASD-EASO-MASLD-2024'],['Hepático','Metabólico']));
  }

  if(!riskDomains.length) {
    add(card('NO-PROFILE','context','Faltan antecedentes para integración terapéutica',
      'Los hallazgos analíticos aislados no autorizan atribuir DM2, IC, ERC o MASLD.',
      ['Registrar diagnósticos conocidos de forma explícita y verificar persistencia cuando proceda.'],
      ['KDIGO-2024-CKD','ADA-2026-9'],['General']));
  }

  return {
    status:'review_only',
    message:'Opciones para revisión profesional. Ninguna tarjeta autoriza prescripción, suspensión o diagnóstico.',
    evaluated: {dm2,hf,ckd:ckddiagnosed,ckdChronic:chronic,cvd,obesity,hepatic:steatosis||liverKnown},
    renal:{gfr:renal.categories.gfr, albuminuria:renal.categories.albuminuria},
    fib4:{value:hepatic.value, interpretation:hepatic.interpretation},
    alerts, options, context,
    sources: INTEGRATION_SOURCES
  };
}
