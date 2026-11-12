/**
 * CaHReMe — motor de cálculos descriptivos v0.1.
 *
 * Sin prescripción ni decisiones terapéuticas. Resultados reproducibles
 * sobre datos sintéticos / entradas no identificativas.
 *
 * G/A: KDIGO CKD 2024, tablas 1-3, p. S137:
 * https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf
 * FIB-4: EASL-EASD-EASO MASLD 2024:
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC11299976/
 * Fórmula: edad × AST / (plaquetas × sqrt(ALT)).
 *
 * Estas funciones son implementaciones independientes, no adaptaciones
 * del código de GlucoGuía. Necesitan revisión clínica antes de uso asistencial.
 */
export const SOURCES = Object.freeze({
  kdigo2024: {
    id: 'KDIGO-2024-CKD', year: 2024,
    title: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of CKD',
    url: 'https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf',
    locator: 'Tablas 1–3, p. S137'
  },
  easl2024: {
    id: 'EASL-EASD-EASO-2024-MASLD', year: 2024,
    title: 'EASL–EASD–EASO Clinical Practice Guidelines on MASLD',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11299976/',
    locator: 'Sección Non-invasive tests; figura 2'
  }
});

function input(values, unavailable, id, opts = {}) {
  if (unavailable.includes(id)) return { state: 'unavailable', value: null };
  const raw = values[id];
  if (raw === undefined || raw === null || String(raw).trim() === '')
    return { state: 'missing', value: null };
  const text = String(raw).trim();
  if (!/^[+]?(?:\d+\.?\d*|\.\d+)$/.test(text))
    return { state: 'invalid', value: null };
  const number = Number(text);
  if (!Number.isFinite(number) ||
      (opts.positive && number <= 0) ||
      (opts.nonNegative && number < 0) ||
      (opts.min !== undefined && number < opts.min) ||
      (opts.max !== undefined && number > opts.max) ||
      (opts.integer && !Number.isInteger(number)))
    return { state: 'invalid', value: null };
  return { state: 'ok', value: number };
}
function pickSelect(values, unavailable, id, allowed) {
  if (unavailable.includes(id)) return { state: 'unavailable', value: null };
  const raw = values[id];
  if (raw === undefined || raw === null || String(raw).trim() === '')
    return { state: 'missing', value: null };
  return allowed.includes(raw) ? { state: 'ok', value: raw } : { state: 'invalid', value: null };
}

export function gfrCategory(number) {
  if (typeof number !== 'number' || !Number.isFinite(number) || number <= 0) return null;
  return number >= 90 ? 'G1'
    : number >= 60 ? 'G2'
    : number >= 45 ? 'G3a'
    : number >= 30 ? 'G3b'
    : number >= 15 ? 'G4' : 'G5';
}
export function albuminuriaCategory(number) {
  if (typeof number !== 'number' || !Number.isFinite(number) || number < 0) return null;
  return number < 30 ? 'A1' : number <= 300 ? 'A2' : 'A3';
}
export function evaluateRenal(draft) {
  const { values = {}, unavailable = [] } = draft || {};
  const assessedOn = values.fecha_evaluacion;
  const dateAfter = id => typeof assessedOn==='string' && /^\\d{4}-/.test(assessedOn) &&
    typeof values[id]==='string' && /^\\d{4}-/.test(values[id]) && values[id]>assessedOn;
  const egfrValue = input(values, unavailable, 'tfge', { positive: true });
  const acrValue = input(values, unavailable, 'cac', { nonNegative: true });
  const egfr = dateAfter('fecha_tfge') ? {state:'invalid',value:null} : egfrValue;
  const acr = (values.unidad_cac && values.unidad_cac!=='mg/g') || dateAfter('fecha_cac')
    ? {state:'invalid',value:null} : acrValue;
  const chronicity = pickSelect(values, unavailable, 'persistencia', ['Sí','No','No consta']);
  const categories = {
    gfr: egfr.state === 'ok' ? gfrCategory(egfr.value) : null,
    albuminuria: acr.state === 'ok' ? albuminuriaCategory(acr.value) : null
  };
  const issues = [];
  if (egfr.state !== 'ok') issues.push('tfge');
  if (acr.state !== 'ok') issues.push('cac');
  if (chronicity.state !== 'ok' || chronicity.value === 'No consta') issues.push('persistencia');
  const invalid = [egfr,acr,chronicity].some(x => x.state === 'invalid');
  let status = invalid ? 'invalid'
    : !categories.gfr && !categories.albuminuria ? 'missing'
    : !categories.gfr || !categories.albuminuria ? 'partial' : 'calculated';
  const chronicConfirmed = chronicity.state === 'ok' && chronicity.value === 'Sí';
  const markerPresent = (egfr.state === 'ok' && egfr.value < 60) ||
    (acr.state === 'ok' && acr.value >= 30);
  const message = invalid ? 'Hay entradas que revisar antes de interpretar los valores.'
    : status === 'missing' ? 'Faltan TFGe y cociente albúmina/creatinina.'
    : status === 'partial' ? 'Clasificación incompleta: falta un componente G/A.'
    : !chronicConfirmed ? 'Categorías G/A descriptivas. No se ha documentado cronicidad ≥3 meses.'
    : !markerPresent ? 'No se identifican criterios de ERC por TFGe y albuminuria aportadas; podrían existir otros marcadores de daño renal.'
    : 'Categorías G/A con cronicidad declarada; comprobar causa y documentación antes de diagnosticar o estadificar ERC.';
  return {
    source: SOURCES.kdigo2024.id,
    status,
    categories,
    inputs: { egfr, acr, chronicity },
    chronicConfirmed, markerPresent, missing: issues,
    message
  };
}
export function computeFib4(age, ast, alt, platelets) {
  if (![age,ast,alt,platelets].every(x => typeof x === 'number' && Number.isFinite(x)) ||
    age < 18 || !Number.isInteger(age) || ast <= 0 || alt <= 0 || platelets <= 0) return null;
  const result = (age * ast) / (platelets * Math.sqrt(alt));
  return Number.isFinite(result) ? result : null;
}
export function evaluateFib4(draft) {
  const { values = {}, unavailable = [] } = draft || {};
  const parts = {
    edad: input(values,unavailable,'edad',{integer:true,min:18,max:120}),
    ast: input(values,unavailable,'ast',{positive:true}),
    alt: input(values,unavailable,'alt',{positive:true}),
    plaquetas: input(values,unavailable,'plaquetas',{positive:true})
  };
  const reported = input(values,unavailable,'fib4_informado',{nonNegative:true});
  const context = pickSelect(values,unavailable,'fib4_contexto',
    ['Perfil de riesgo compatible con evaluación MASLD','Sin indicación documentada','No consta']);
  const acute = pickSelect(values,unavailable,'fib4_agudo',['No','Sí','No valorado']);
  const missing = Object.entries(parts).filter(([,v])=>v.state !== 'ok').map(([k])=>k);
  const invalid = Object.values(parts).some(v=>v.state==='invalid');
  const dates=['fecha_ast','fecha_alt','fecha_plaquetas'].map(id=>values[id]).filter(Boolean);
  const dateMismatch=dates.length===3 && new Set(dates).size>1;
  const assessedOn=values.fecha_evaluacion;
  const futureDate=assessedOn && dates.some(date=>date>assessedOn);
  const unmergeableDates=dateMismatch || futureDate;
  const computed = !missing.length && !unmergeableDates
    ? computeFib4(parts.edad.value,parts.ast.value,parts.alt.value,parts.plaquetas.value)
    : null;
  let status = unmergeableDates ? 'not_comparable'
    : invalid || (computed === null && !missing.length) ? 'invalid'
    : computed === null ? 'missing' : 'calculated';
  let interpretation = 'not_evaluable';
  let note = 'Se requiere edad, AST, ALT y plaquetas; no se asigna riesgo con datos incompletos.';
  let lowCutoff = null;
  if (status === 'calculated') {
    const age = parts.edad.value;
    if (acute.value === 'Sí') {
      note = 'El FIB-4 no debe utilizarse para estratificar fibrosis durante enfermedad aguda.';
      interpretation = 'acute';
    } else if (acute.value !== 'No') {
      note = 'Falta confirmar ausencia de enfermedad aguda; no se interpreta el resultado.';
      interpretation = 'context_missing';
    } else if (context.value !== 'Perfil de riesgo compatible con evaluación MASLD') {
      note = 'No consta indicación de cribado en un perfil de riesgo apropiado; valor numérico sin interpretación.';
      interpretation = 'context_missing';
    } else if (age < 35) {
      note = 'FIB-4 tiene rendimiento limitado por debajo de 35 años; no usar esta cifra para descartar fibrosis.';
      interpretation = 'age_limited';
    } else {
      lowCutoff = age > 65 ? 2.0 : 1.3;
      if (computed < lowCutoff) {
        interpretation = 'lower_probability';
        note = 'Por debajo del umbral de la guía para cribado de fibrosis avanzada; no excluye toda fibrosis ni establece diagnóstico.';
      } else if (computed > 2.67) {
        interpretation = 'higher_probability';
        note = 'Por encima de 2,67: se requiere valoración secundaria de fibrosis y del contexto clínico, sin diagnóstico automático.';
      } else {
        interpretation = 'additional_assessment';
        note = 'Resultado en zona de evaluación adicional: valorar elastografía u otra prueba no invasiva según riesgo y recursos.';
      }
    }
  } else if (status === 'invalid') {
    note = 'Hay datos no válidos. La fórmula requiere valores positivos de AST, ALT y plaquetas, y edad adulta.';
  } else if (status === 'not_comparable') {
    note = 'No se genera FIB-4: las analíticas tienen fechas incompatibles entre sí o con la fecha de evaluación.';
  }
  return {
    source: SOURCES.easl2024.id, status,
    inputs: parts, reported, context, acute, missing,
    value: computed, lowCutoff, interpretation, note
  };
}
