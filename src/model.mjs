import { EXTRA_BY_ID, readMulti } from './consultas.mjs';
// Modelo de captura no identificativa. Sin cálculos ni recomendaciones clínicas.
// No utiliza localStorage, sessionStorage, cookies ni llamadas de red.
export const SECTIONS = [
  { id: 'contexto', title: 'Contexto clínico', short: 'Contexto', intro: 'Antecedentes que ayudan a contextualizar la evaluación.', fields: [
    { id: 'edad', label: 'Edad', unit: 'años', type: 'number', integer: true, min: 18, max: 120 },
    EXTRA_BY_ID.fecha_evaluacion,
    { id: 'tabaco', label: 'Tabaquismo', type: 'select', options: ['Nunca', 'Actual', 'Exfumador'] },
    { id: 'ecv', label: 'Enfermedad cardiovascular establecida', type: 'select', options: ['Sí', 'No'] },
    { id: 'ic', label: 'Insuficiencia cardíaca conocida', type: 'select', options: ['Sí', 'No'] },
    { id: 'erc', label: 'Enfermedad renal crónica conocida', type: 'select', options: ['Sí', 'No'] },
    EXTRA_BY_ID.dm1,
    EXTRA_BY_ID.ic_sintomatica,
    { id: 'hepatopatia', label: 'Enfermedad hepática conocida', type: 'select', options: ['Sí', 'No'] },
    EXTRA_BY_ID.situacion_aguda,
    EXTRA_BY_ID.cetoacidosis_sospecha,
    EXTRA_BY_ID.ic_descompensada,
    EXTRA_BY_ID.hipoxia_tisular
  ]},
  { id: 'cardio', title: 'Cardiovascular', short: 'Cardio', intro: 'Constantes, FEVI y situación clínica.', fields: [
    EXTRA_BY_ID.ic_fevigrupo,
    EXTRA_BY_ID.fecha_fevi,
    EXTRA_BY_ID.ic_evidencia_objetiva,
    EXTRA_BY_ID.ic_estabilidad,
    EXTRA_BY_ID.ic_alarma,
    EXTRA_BY_ID.ic_fc,
    EXTRA_BY_ID.congestion,
    EXTRA_BY_ID.fevi,
    { id: 'pas', label: 'Presión arterial sistólica', unit: 'mmHg', type: 'number' },
    { id: 'pad', label: 'Presión arterial diastólica', unit: 'mmHg', type: 'number' },
    { id: 'colesterol_total', label: 'Colesterol total', unit: 'mg/dL', type: 'number' },
    { id: 'hdl', label: 'HDL-colesterol', unit: 'mg/dL', type: 'number' },
    { id: 'ldl', label: 'LDL-colesterol', unit: 'mg/dL', type: 'number' }
  ]},
  { id: 'renal', title: 'Renal', short: 'Renal', intro: 'Datos de función renal, albuminuria y persistencia conocida.', fields: [
    { id: 'creatinina', label: 'Creatinina sérica', unit: 'mg/dL', type: 'number' },
    { id: 'tfge', label: 'TFGe informada por laboratorio', unit: 'mL/min/1,73 m²', type: 'number' },
    EXTRA_BY_ID.fecha_tfge,
    { id: 'cac', label: 'Cociente albúmina/creatinina en orina', unit: 'mg/g', type: 'number' },
    EXTRA_BY_ID.unidad_cac,
    EXTRA_BY_ID.fecha_cac,
    { id: 'persistencia', label: 'Alteración persistente documentada', type: 'select', options: ['Sí', 'No', 'No consta'] },
    EXTRA_BY_ID.potasio_normal,
    EXTRA_BY_ID.ras_optimizado,
    EXTRA_BY_ID.potasio,
    EXTRA_BY_ID.fecha_potasio,
    EXTRA_BY_ID.cyp3a4_fuerte,
    EXTRA_BY_ID.addison,
    EXTRA_BY_ID.lra_sospecha,
    EXTRA_BY_ID.contraste_yodado
  ]},
  { id: 'hepatico', title: 'Hepático', short: 'Hepático', intro: 'Pruebas disponibles para una futura estratificación validada.', fields: [
    { id: 'ast', label: 'AST', unit: 'U/L', type: 'number' },
    EXTRA_BY_ID.fecha_ast,
    { id: 'alt', label: 'ALT', unit: 'U/L', type: 'number' },
    EXTRA_BY_ID.fecha_alt,
    { id: 'plaquetas', label: 'Plaquetas', unit: '10⁹/L', type: 'number' },
    EXTRA_BY_ID.fecha_plaquetas,
    EXTRA_BY_ID.fib4_contexto,
    EXTRA_BY_ID.fib4_agudo,
    EXTRA_BY_ID.hepatica_grave,
    EXTRA_BY_ID.insuficiencia_hepatica,
    { id: 'esteatosis', label: 'Esteatosis documentada', type: 'select', options: ['Sí', 'No'] }
  ]},
  { id: 'metabolico', title: 'Metabólico', short: 'Metabólico', intro: 'Diagnósticos y datos antropométricos/metabólicos.', fields: [
    { id: 'dm2', label: 'DM2 conocida', type: 'select', options: ['Sí', 'No'] },
    EXTRA_BY_ID.imc,
    EXTRA_BY_ID.imc_inicio,
    EXTRA_BY_ID.comorbilidad_peso_confirmada,
    { id: 'hba1c', label: 'Hemoglobina glucosilada (HbA1c)', unit: '%', type: 'number' },
    EXTRA_BY_ID.fecha_hba1c,
    EXTRA_BY_ID.dm_objetivo,
    EXTRA_BY_ID.dm_objetivo_valor,
    EXTRA_BY_ID.dm_hba1c_fiable,
    EXTRA_BY_ID.glucemia_actual,
    EXTRA_BY_ID.insulina_esquema,
    EXTRA_BY_ID.insulina_dosis_basal,
    EXTRA_BY_ID.insulina_ayunas,
    EXTRA_BY_ID.insulina_ayunas_objetivo,
    EXTRA_BY_ID.insulina_posprandial,
    { id: 'peso', label: 'Peso', unit: 'kg', type: 'number' },
    { id: 'talla', label: 'Talla', unit: 'cm', type: 'number' },
    { id: 'cintura', label: 'Perímetro abdominal', unit: 'cm', type: 'number' }
  ]},
  { id: 'tratamiento', title: 'Tratamientos y seguridad', short: 'Tratamientos', intro: 'Datos declarados. No introduzcas nombres ni información identificativa.', fields: [
    EXTRA_BY_ID.farmacos_clases,
    EXTRA_BY_ID.dm_adherencia,
    EXTRA_BY_ID.dm_dosis_confirmadas,
    EXTRA_BY_ID.dm_hipoglucemias,
    EXTRA_BY_ID.insulina_hipo_nocturna,
    EXTRA_BY_ID.insulina_autocuidado,
    { id: 'farmacos', label: 'Tratamientos actuales (principios activos)', type: 'textarea' },
    EXTRA_BY_ID.medicacion_revisada,
    { id: 'alergias', label: 'Alergias o intolerancias relevantes', type: 'textarea' },
    EXTRA_BY_ID.alergias_revisadas,
    EXTRA_BY_ID.embarazo,
    EXTRA_BY_ID.embarazo_planificado,
    EXTRA_BY_ID.pancreatitis_sospecha,
    EXTRA_BY_ID.pancreatitis_previa,
    EXTRA_BY_ID.deshidratacion_gi,
    EXTRA_BY_ID.gastroparesia_grave,
    EXTRA_BY_ID.retinopatia_dm,
    EXTRA_BY_ID.vision_subita,
    EXTRA_BY_ID.acidosis_metabolica,
    EXTRA_BY_ID.cirugia_anestesia
  ]}
];
export const FIELDS = { ...Object.fromEntries(SECTIONS.flatMap(s => s.fields.map(f => [f.id, f]))), ...EXTRA_BY_ID };
export function createDraft() { return { values: {}, unavailable: [] }; }
// Asociación en memoria de una estimación externa con la ficha de esta sesión.
// No es identificación del paciente, firma clínica ni validación del cálculo ajeno.
const opSnapshot=draft=>JSON.stringify({
 values:Object.fromEntries(Object.keys(draft.values).filter(id=>id!=='cv_op_confirmado').sort().map(id=>[id,draft.values[id]])),
 unavailable:[...draft.unavailable].sort()
});
export function externalOpAssociationValid(draft){
 return draft.values.cv_op_confirmado==='Sí'&&typeof draft.opAssociation==='string'&&draft.opAssociation===opSnapshot(draft);
}
export function setValue(draft,id,value){
 if(!FIELDS[id])throw new Error('Campo inexistente');
 const changed=draft.values[id]!==String(value)||draft.unavailable.includes(id);
 const next={...draft,values:{...draft.values,[id]:String(value)},unavailable:draft.unavailable.filter(x=>x!==id)};
 if(id==='cv_op_confirmado'){
  if(String(value)==='Sí')next.opAssociation=opSnapshot(next);
  else delete next.opAssociation;
 }else if(changed&&draft.values.cv_op_confirmado==='Sí'){
  next.values.cv_op_confirmado='No';delete next.opAssociation;
 }
 return next;
}
export function setUnavailable(draft,id,yes){
 if(!FIELDS[id])throw new Error('Campo inexistente');
 const unavailable=new Set(draft.unavailable);
 if(yes)unavailable.add(id);else unavailable.delete(id);
 const values={...draft.values};if(yes)delete values[id];
 const next={...draft,values,unavailable:[...unavailable]};
 if(draft.unavailable.includes(id)!==yes&&draft.values.cv_op_confirmado==='Sí'){
  if(id!=='cv_op_confirmado')next.values.cv_op_confirmado='No';
  delete next.opAssociation;
 }
 return next;
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
  if (f.type === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'revisar';
    const [year,month,day] = v.split('-').map(Number);
    const dt = new Date(Date.UTC(year,month-1,day));
    if (dt.getUTCFullYear()!==year || dt.getUTCMonth()+1!==month ||
        dt.getUTCDate()!==day) return 'revisar';
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

