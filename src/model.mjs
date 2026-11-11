import { EXTRA_BY_ID, readMulti } from './consultas.mjs';
// Modelo de captura no identificativa. Sin cálculos ni recomendaciones clínicas.
// No utiliza localStorage, sessionStorage, cookies ni llamadas de red.
export const SECTIONS = [
  { id: 'contexto', title: 'Contexto clínico', short: 'Contexto', intro: 'Antecedentes que ayudan a contextualizar la evaluación.', fields: [
    { id: 'edad', label: 'Edad', unit: 'años', type: 'number', integer: true, min: 18, max: 120 },
    { id: 'tabaco', label: 'Tabaquismo', type: 'select', options: ['Nunca', 'Actual', 'Exfumador'] },
    { id: 'ecv', label: 'Enfermedad cardiovascular establecida', type: 'select', options: ['Sí', 'No'] },
    { id: 'ic', label: 'Insuficiencia cardíaca conocida', type: 'select', options: ['Sí', 'No'] },
    { id: 'erc', label: 'Enfermedad renal crónica conocida', type: 'select', options: ['Sí', 'No'] },
    EXTRA_BY_ID.dm1,
    EXTRA_BY_ID.ic_sintomatica,
    { id: 'hepatopatia', label: 'Enfermedad hepática conocida', type: 'select', options: ['Sí', 'No'] },
    EXTRA_BY_ID.situacion_aguda,
    EXTRA_BY_ID.cetoacidosis_sospecha
  ]},
  { id: 'cardio', title: 'Cardiovascular', short: 'Cardio', intro: 'Constantes y perfil lipídico disponibles.', fields: [
    { id: 'pas', label: 'Presión arterial sistólica', unit: 'mmHg', type: 'number' },
    { id: 'pad', label: 'Presión arterial diastólica', unit: 'mmHg', type: 'number' },
    { id: 'colesterol_total', label: 'Colesterol total', unit: 'mg/dL', type: 'number' },
    { id: 'hdl', label: 'HDL-colesterol', unit: 'mg/dL', type: 'number' },
    { id: 'ldl', label: 'LDL-colesterol', unit: 'mg/dL', type: 'number' }
  ]},
  { id: 'renal', title: 'Renal', short: 'Renal', intro: 'Datos de función renal, albuminuria y persistencia conocida.', fields: [
    { id: 'creatinina', label: 'Creatinina sérica', unit: 'mg/dL', type: 'number' },
    { id: 'tfge', label: 'TFGe informada por laboratorio', unit: 'mL/min/1,73 m²', type: 'number' },
    { id: 'cac', label: 'Cociente albúmina/creatinina en orina', unit: 'mg/g', type: 'number' },
    { id: 'persistencia', label: 'Alteración persistente documentada', type: 'select', options: ['Sí', 'No', 'No consta'] },
    EXTRA_BY_ID.potasio_normal,
    EXTRA_BY_ID.ras_optimizado,
    EXTRA_BY_ID.potasio,
    EXTRA_BY_ID.cyp3a4_fuerte,
    EXTRA_BY_ID.addison
  ]},
  { id: 'hepatico', title: 'Hepático', short: 'Hepático', intro: 'Pruebas disponibles para una futura estratificación validada.', fields: [
    { id: 'ast', label: 'AST', unit: 'U/L', type: 'number' },
    { id: 'alt', label: 'ALT', unit: 'U/L', type: 'number' },
    { id: 'plaquetas', label: 'Plaquetas', unit: '10⁹/L', type: 'number' },
    EXTRA_BY_ID.fib4_contexto,
    EXTRA_BY_ID.fib4_agudo,
    EXTRA_BY_ID.hepatica_grave,
    { id: 'esteatosis', label: 'Esteatosis documentada', type: 'select', options: ['Sí', 'No'] }
  ]},
  { id: 'metabolico', title: 'Metabólico', short: 'Metabólico', intro: 'Diagnósticos y datos antropométricos/metabólicos.', fields: [
    { id: 'dm2', label: 'DM2 conocida', type: 'select', options: ['Sí', 'No'] },
    EXTRA_BY_ID.imc,
    { id: 'hba1c', label: 'Hemoglobina glucosilada (HbA1c)', unit: '%', type: 'number' },
    { id: 'peso', label: 'Peso', unit: 'kg', type: 'number' },
    { id: 'talla', label: 'Talla', unit: 'cm', type: 'number' },
    { id: 'cintura', label: 'Perímetro abdominal', unit: 'cm', type: 'number' }
  ]},
  { id: 'tratamiento', title: 'Tratamientos y seguridad', short: 'Tratamientos', intro: 'Datos declarados. No introduzcas nombres ni información identificativa.', fields: [
    EXTRA_BY_ID.farmacos_clases,
    { id: 'farmacos', label: 'Tratamientos actuales (principios activos)', type: 'textarea' },
    EXTRA_BY_ID.medicacion_revisada,
    { id: 'alergias', label: 'Alergias o intolerancias relevantes', type: 'textarea' },
    EXTRA_BY_ID.alergias_revisadas,
    EXTRA_BY_ID.embarazo
  ]}
];
export const FIELDS = { ...Object.fromEntries(SECTIONS.flatMap(s => s.fields.map(f => [f.id, f]))), ...EXTRA_BY_ID };
export function createDraft() { return { values: {}, unavailable: [] }; }
export function setValue(draft, id, value) {
  if (!FIELDS[id]) throw new Error('Campo inexistente');
  return { values: { ...draft.values, [id]: String(value) }, unavailable: draft.unavailable.filter(x => x !== id) };
}
export function setUnavailable(draft, id, yes) {
  if (!FIELDS[id]) throw new Error('Campo inexistente');
  const unavailable = new Set(draft.unavailable);
  if (yes) unavailable.add(id); else unavailable.delete(id);
  const values = { ...draft.values };
  if (yes) delete values[id];
  return { values, unavailable: [...unavailable] };
}
export function fieldState(draft, id) {
  const f = FIELDS[id];
  if (!f) throw new Error('Campo inexistente');
  if (draft.unavailable.includes(id)) return 'no_disponible';
  const v = (draft.values[id] ?? '').trim();
  if (!v) return 'sin_registrar';
  if (f.type === 'number') {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || (f.integer && !Number.isInteger(n)) ||
      (f.min !== undefined && n < f.min) || (f.max !== undefined && n > f.max)) return 'revisar';
  }
  if (f.type === 'select' && !f.options.includes(v)) return 'revisar';
  if (f.type === 'multi') {
    const selected = readMulti(v);
    if (!selected.length) return v === '[]' ? 'sin_registrar' : 'revisar';
    if (new Set(selected).size !== selected.length ||
      !selected.every(item => f.options.includes(item))) return 'revisar';
    if (selected.some(item => /^(Sin |Ninguna )/.test(item)) && selected.length > 1) return 'revisar';
  }
  return 'registrado';
}
export function sectionStats(draft, section) {
  const counts = { registrado: 0, no_disponible: 0, sin_registrar: 0, revisar: 0 };
  for (const f of section.fields) counts[fieldState(draft, f.id)]++;
  return counts;
}
export function totalStats(draft) {
  return SECTIONS.reduce((acc, s) => {
    const stats = sectionStats(draft, s);
    for (const key of Object.keys(acc)) acc[key] += stats[key];
    return acc;
  }, { registrado: 0, no_disponible: 0, sin_registrar: 0, revisar: 0 });
}
export function sectionForFocus(focus) {
  const index = SECTIONS.findIndex(s => s.id === focus);
  return index < 0 ? 0 : index;
}
