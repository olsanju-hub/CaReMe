/**
 * Calidad y procedencia de datos en CaHReMe.
 * No establece un plazo universal de "caducidad" para una analítica.
 * La relevancia temporal depende de la decisión clínica y del estado agudo.
 * Sin fechas no se infiere que un resultado sea reciente.
 */
import { fieldState } from '../model.mjs';

const get=(draft,id)=>fieldState(draft,id)==='registrado'?String(draft.values[id]):null;
const number=(draft,id)=>{
  const value=get(draft,id);return value===null?null:Number(value);
};
const signal=(id,severity,title,detail,fields)=>({
  id,severity,title,detail,fields,requiresReview:true
});
export function auditProvenance(draft) {
  const findings=[];
  const asOf=get(draft,'fecha_evaluacion');
  const fields=[
    ['tfge','fecha_tfge','TFGe'],
    ['cac','fecha_cac','CAC'],
    ['potasio','fecha_potasio','potasio'],
    ['ast','fecha_ast','AST'],
    ['alt','fecha_alt','ALT'],
    ['plaquetas','fecha_plaquetas','plaquetas']
  ];
  const undated=[];
  for(const [measurement,dateField,label] of fields) {
    if(get(draft,measurement)!==null && get(draft,dateField)===null)
      undated.push(label);
    const d=get(draft,dateField);
    if(d && asOf && d>asOf)
      findings.push(signal('DATE_AFTER_EVALUATION_'+measurement,'critical',
        'Fecha incompatible: '+label,
        'La fecha de la medición es posterior a la fecha declarada de evaluación. Corregir antes de integrar la cifra.',
        ['fecha_evaluacion',dateField,measurement]));
    if(d && get(draft,measurement)===null)
      findings.push(signal('DATE_WITHOUT_VALUE_'+measurement,'warning',
        'Fecha registrada sin resultado: '+label,
        'Se ha aportado la fecha pero no la medición correspondiente; no inferir su valor.',
        [dateField,measurement]));
  }
  const cacUnit=get(draft,'unidad_cac');
  if(get(draft,'cac')!==null && cacUnit && cacUnit!=='mg/g')
    findings.push(signal('CAC_UNIT_INCOMPATIBLE','critical',
      'Unidad de albuminuria distinta de mg/g',
      'La clasificación A implementada utiliza mg/g. No convertir ni interpretar automáticamente un valor introducido en mg/mmol o sin unidad contrastada.',
      ['cac','unidad_cac']));
  const hepatic=['fecha_ast','fecha_alt','fecha_plaquetas']
    .map(field=>get(draft,field)).filter(Boolean);
  const hepaticAllMeasured=['ast','alt','plaquetas'].every(id=>get(draft,id)!==null);
  const hepaticDiscordant=hepaticAllMeasured && hepatic.length>=2 && new Set(hepatic).size>1;
  if(hepaticDiscordant)
    findings.push(signal('FIB4_DIFFERENT_DATES','warning',
      'FIB-4 con analíticas de fechas distintas',
      'AST, ALT y plaquetas proceden de fechas diferentes. No formar automáticamente un único resultado interpretable.',
      ['fecha_ast','fecha_alt','fecha_plaquetas']));
  const weight=number(draft,'peso'),height=number(draft,'talla'),bmi=number(draft,'imc');
  const calculatedBmi=weight!==null && height!==null && height>0
    ? weight/(height/100)**2:null;
  if(calculatedBmi!==null && bmi!==null && Math.abs(bmi-calculatedBmi)>1)
    findings.push(signal('BMI_INCONSISTENT','warning','Revisar IMC frente a peso y talla',
      'El IMC registrado difiere más de 1 kg/m² del cálculo peso/talla². La tolerancia es un control operativo de entrada, no un umbral diagnóstico.',
      ['peso','talla','imc']));
  return {
    status:findings.some(f=>f.severity==='critical')?'critical':findings.length?'review':'clear',
    findings, undated,
    measurementsDated:fields.filter(([id,date])=>get(draft,id)!==null && get(draft,date)!==null).length,
    asOf,
    fib4DatesCompatible:!hepaticDiscordant,
    cacInMgG:!cacUnit||cacUnit==='mg/g',
    bmiCalculated:calculatedBmi,
    message:'La ausencia de fecha no confirma actualidad; la vigencia de cada resultado requiere juicio clínico. Sin conversión automática de unidades.'
  };
}
