// Definiciones funcionales originales para captura en CaHReMe.
// Inspiradas en la cobertura de uso de GlucoGuía, sin copiar su implementación.
// Estas rutas NO contienen reglas, umbrales de decisión ni recomendaciones clínicas.
export const MODULES = [
  {
    id: 'dm2', title: 'Diabetes tipo 2', domain: 'metabolico',
    short: 'Control glucémico y tratamiento', 
    quick: ['dm_prioridad','dm_control'],
    detail: ['hba1c','dm_objetivo','tfge','imc','dm_sintomas','comorbilidades','farmacos','alergias']
  },
  {
    id: 'ic', title: 'Insuficiencia cardíaca', domain: 'cardiovascular',
    short: 'Función ventricular y congestión',
    quick: ['ic_fevigrupo','congestion'],
    detail: ['fevi','tfge','potasio','pas','pad','congestion','farmacos','alergias']
  },
  {
    id: 'erc', title: 'Enfermedad renal crónica', domain: 'renal',
    short: 'Función renal, albuminuria y persistencia',
    quick: ['tfge','cac','persistencia'],
    detail: ['tfge','cac','persistencia','potasio','creatinina','farmacos','alergias']
  },
  {
    id: 'obesidad', title: 'Sobrepeso y obesidad', domain: 'metabolico',
    short: 'Adiposidad y comorbilidades',
    quick: ['imc','dm2','obesidad_perfil'],
    detail: ['peso','talla','imc','cintura','dm2','comorbilidades','farmacos','alergias']
  },
  {
    id: 'hepatico', title: 'Enfermedad hepática metabólica', domain: 'hepatico',
    short: 'Esteatosis y valoración de fibrosis',
    quick: ['edad','fib4_informado','hepatico_valoracion','elastografia'],
    detail: ['edad','esteatosis','hepatico_valoracion','ast','alt','plaquetas','fib4_informado','elastografia','farmacos']
  },
  {
    id: 'insulina', title: 'Insulinización', domain: 'metabolico',
    short: 'Inicio, intensificación o simplificación',
    quick: ['insulina_fase','insulina_perfil'],
    detail: ['insulina_fase','imc','tfge','insulina_fragilidad','insulina_especiales','hba1c','farmacos','alergias']
  }
];
export const MODULE_BY_ID = Object.fromEntries(MODULES.map(m => [m.id, m]));
export const EXTRA_FIELDS = [
  { id:'dm_prioridad', label:'Condicionantes clínicos presentes', type:'multi',
    options:['Sin condicionante seleccionado','Enfermedad cardiovascular / riesgo elevado','Insuficiencia cardíaca',
      'Enfermedad renal crónica','Obesidad','Enfermedad hepática metabólica','Fragilidad'] },
  { id:'dm_control', label:'Situación del control glucémico', type:'select',
    options:['En el objetivo individual','Fuera del objetivo · HbA1c inferior a 8,5 %',
      'HbA1c ≥8,5 % · sin síntomas','HbA1c ≥8,5 % · con síntomas','Objetivo no establecido'] },
  { id:'dm_objetivo',label:'Objetivo de HbA1c individualizado',type:'select',
    options:['Pendiente de individualizar','Inferior a 6,5 %','Hasta 7 %','Inferior a 7,5 %',
      'Inferior a 8 %','Flexible: entre 7,5 y 8,5 %','Priorizar confort y evitar síntomas'] },
  { id:'dm_sintomas',label:'Síntomas de hiperglucemia',type:'select',
    options:['Ausentes','Poliuria, polidipsia o pérdida de peso','No valorados'] },
  { id:'ic_fevigrupo',label:'Grupo de FEVI (referencia inicial)',type:'select',
    options:['Reducida · clasificación pendiente de revisión','Preservada · clasificación pendiente de revisión','FEVI desconocida'] },
  { id:'congestion',label:'Signos de congestión',type:'select',
    options:['Presentes','Ausentes','No valorados'] },
  { id:'fevi',label:'FEVI registrada',type:'number',min:0,max:100,unit:'%' },
  { id:'potasio',label:'Potasio sérico',type:'number',min:0,unit:'mmol/L' },
  { id:'imc',label:'IMC informado',type:'number',min:0,unit:'kg/m²' },
  { id:'obesidad_perfil',label:'Comorbilidades relevantes',type:'multi',
    options:['Ninguna seleccionada','ECV o riesgo CV elevado','ERC o insuficiencia cardíaca',
      'Enfermedad hepática metabólica','Apnea obstructiva del sueño','Gonartrosis','Obesidad sarcopénica'] },
  { id:'fib4_informado',label:'FIB-4 informado (si está disponible)',type:'number',min:0,unit:'índice' },
  { id:'hepatico_valoracion',label:'Evaluación de otras causas',type:'select',
    options:['Esteatosis documentada y otras causas evaluadas','Valoración incompleta o pendiente','Desconocido'] },
  { id:'elastografia',label:'Elastografía hepática',type:'number',min:0,unit:'kPa' },
  { id:'insulina_fase',label:'Situación de insulinización',type:'select',
    options:['Valorar inicio','En tratamiento basal · valorar intensificación','Valorar desintensificación'] },
  { id:'insulina_perfil',label:'Situación clínica asociada',type:'multi',
    options:['Sin situación especial seleccionada','Obesidad','Fragilidad o paliativos',
      'Enfermedad cardiovascular, renal o insuficiencia cardíaca',
      'Debut sintomático o proceso intercurrente','Tratamiento con corticoides'] },
  { id:'insulina_fragilidad',label:'Fragilidad o situación paliativa',type:'select',
    options:['Sí','No','No valorada'] },
  { id:'insulina_especiales',label:'Situaciones especiales',type:'multi',
    options:['Debut muy sintomático','Proceso intercurrente','Tratamiento con corticoides',
      'Insuficiencia cardíaca','ERC','Enfermedad cardiovascular'] },
  { id:'comorbilidades',label:'Comorbilidades simultáneas',type:'multi',
    options:['Enfermedad cardiovascular','Insuficiencia cardíaca','Enfermedad renal crónica',
      'Enfermedad hepática metabólica','Fragilidad','Apnea obstructiva del sueño',
      'Gonartrosis','Obesidad sarcopénica'] }
];
export const EXTRA_BY_ID = Object.fromEntries(EXTRA_FIELDS.map(f => [f.id,f]));
export function moduleFields(moduleId, mode) {
  const module = MODULE_BY_ID[moduleId];
  if (!module) throw new Error('Consulta inexistente');
  if (!['quick','detail'].includes(mode)) throw new Error('Modo de consulta desconocido');
  return mode === 'quick' ? module.quick : module.detail;
}
export function readMulti(raw) {
  try {
    const values = JSON.parse(raw || '[]');
    return Array.isArray(values) && values.every(x => typeof x === 'string') ? values : [];
  } catch { return []; }
}
