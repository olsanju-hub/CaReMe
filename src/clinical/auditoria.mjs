/**
 * Auditoría transversal de seguridad clínica — CaHReMe.
 * Detecta incoherencias del formulario antes de interpretar candidatos
 * farmacológicos. No diagnostica ni presume que «No valorado» sea negativo.
 *
 * Identificadores estables; reglas de conciliación, no umbrales diagnósticos.
 */
import { FIELDS, fieldState } from '../model.mjs';
import { readMulti } from '../consultas.mjs';
import { auditProvenance } from './proveniencia.mjs';

const VALUE = (draft,id) => fieldState(draft,id)==='registrado'
  ? String(draft.values[id]) : null;
const NUMBER=(draft,id)=>{
  const v=VALUE(draft,id);return v===null?null:Number(v);
};
export const AUDIT_RULES=Object.freeze({
  DM_TYPE_CONFLICT:'DM1 y DM2 simultáneamente declaradas',
  HF_DECLARATION_CONFLICT:'IC ausente pero IC crónica sintomática declarada',
  RENAL_DECLARATION_REVIEW:'ERC declarada ausente con marcadores persistentes',
  ACUTE_STATE_CONFLICT:'Situación estable con signos agudos registrados',
  HEPATIC_SEVERITY_CONFLICT:'Insuficiencia hepática grave declarada con insuficiencia hepática ausente',
  MEDICATION_RECONCILIATION:'Declaración de no tratamiento incongruente con otros fármacos',
  MEDICATION_DETAILS:'Conciliación documentada sin clases o principios activos identificables',
  POTASSIUM_CONFLICT:'Potasio numérico no coherente con potasio declarado normal',
  CLINICAL_FIELD_INVALID:'Campo clínico no válido para el cálculo',
  SEVERE_GLYCEMIA_REVIEW:'Glucemia muy elevada: revisar seguridad y descartar crisis',
  SEVERE_HYPOGLYCEMIA_REVIEW:'Hipoglucemias graves o recurrentes: revisar pauta antes de intensificar',
  PREGNANCY_DIABETES_PATHWAY:'Gestación: utilizar circuito específico de diabetes y embarazo'
});
function item(id,severity,title,detail,fields) {
  return {id,severity,title,detail,fields,requiresReview:true};
}
export function auditCrossDomain(draft) {
  const provenance=auditProvenance(draft);
  const out=[...provenance.findings];
  const yes=id=>VALUE(draft,id)==='Sí';
  const no=id=>VALUE(draft,id)==='No';
  if(yes('dm1')&&yes('dm2'))
    out.push(item('DM_TYPE_CONFLICT','critical','Confirmar clasificación de diabetes',
      'Constan DM1 y DM2 a la vez; confirmar el diagnóstico antes de atribuir una indicación farmacológica.', ['dm1','dm2']));
  if(no('ic')&&yes('ic_sintomatica'))
    out.push(item('HF_DECLARATION_CONFLICT','critical','Revisar antecedentes de insuficiencia cardíaca',
      'La ficha niega IC pero afirma IC crónica sintomática; no inferir un fenotipo ni indicación.', ['ic','ic_sintomatica']));
  const egfr=NUMBER(draft,'tfge'), acr=NUMBER(draft,'cac');
  if(no('erc')&&yes('persistencia')&&
     ((egfr!==null&&egfr<60)||(acr!==null&&acr>=30)))
    out.push(item('RENAL_DECLARATION_REVIEW','warning','Revisar discordancia renal',
      'ERC figura como no conocida, pero se declara persistencia de marcadores analíticos compatibles; revisar diagnóstico y causa, sin deducirlos automáticamente.',
      ['erc','persistencia','tfge','cac']));
  const currentGlucose=NUMBER(draft,'glucemia_actual');
  if(currentGlucose!==null&&currentGlucose>=300)
    out.push(item('SEVERE_GLYCEMIA_REVIEW','critical',
      'Glucemia actual elevada: valoración prioritaria',
      'Glucemia ≥300 mg/dL: valorar síntomas, cetonas y estado metabólico antes de considerar modificaciones crónicas. El valor aislado no diagnostica una crisis.',
      ['glucemia_actual','cetoacidosis_sospecha','dm_sintomas']));
  if(VALUE(draft,'dm_hipoglucemias')==='Graves o recurrentes')
    out.push(item('SEVERE_HYPOGLYCEMIA_REVIEW','critical',
      'Hipoglucemias graves o recurrentes',
      'Revisar seguridad, régimen de insulina/secretagogos, autocuidado y objetivo individual antes de intensificar.',
      ['dm_hipoglucemias','farmacos_clases','hba1c']));
  if(yes('embarazo')&&yes('dm2'))
    out.push(item('PREGNANCY_DIABETES_PATHWAY','critical',
      'DM2 y embarazo: circuito clínico específico',
      'El algoritmo general de tratamiento de adultos no gestantes no debe seleccionar fármacos para gestación.',
      ['dm2','embarazo']));
  const acuteFlags=['cetoacidosis_sospecha','ic_descompensada','lra_sospecha',
    'acidosis_metabolica','deshidratacion_gi','pancreatitis_sospecha'];
  if(VALUE(draft,'situacion_aguda')==='Estable sin proceso agudo grave'&&
     acuteFlags.some(id=>yes(id)))
    out.push(item('ACUTE_STATE_CONFLICT','critical','Estado agudo incompatible con estabilidad declarada',
      'El formulario indica estabilidad y a la vez una situación aguda que requiere valoración. Confirmar ambos campos.',
      ['situacion_aguda',...acuteFlags.filter(id=>yes(id))]));
  if(yes('hepatica_grave')&&no('insuficiencia_hepatica'))
    out.push(item('HEPATIC_SEVERITY_CONFLICT','critical','Revisar gravedad de insuficiencia hepática',
      'Se registra insuficiencia hepática grave y simultáneamente ausencia de insuficiencia hepática.',
      ['hepatica_grave','insuficiencia_hepatica']));
  const classes=VALUE(draft,'farmacos_clases');
  const list=classes===null?null:readMulti(classes);
  const text=VALUE(draft,'farmacos');
  if(list?.includes('Sin tratamiento farmacológico') && (list.length>1||!!text))
    out.push(item('MEDICATION_RECONCILIATION','critical','Reconciliar declaración de tratamientos',
      'Se indica ausencia de tratamiento y simultáneamente otros medicamentos o principios activos.',
      ['farmacos_clases','farmacos']));
  if(yes('medicacion_revisada') && list===null && text===null)
    out.push(item('MEDICATION_DETAILS','warning','Faltan detalles de conciliación farmacológica',
      'Se declara el tratamiento revisado, pero no se identifican clases, fármacos ni ausencia confirmada.',
      ['medicacion_revisada','farmacos_clases','farmacos']));
  const pot=NUMBER(draft,'potasio');
  if(pot!==null && yes('potasio_normal') && (pot<3.5||pot>5.0))
    out.push(item('POTASSIUM_CONFLICT','warning','Revisar coherencia del potasio',
      'La ficha indica potasio normal y estable, pero el valor obliga a comprobar el rango de referencia y contexto. El rango utilizado aquí (3,5–5,0 mmol/L) es solo un control de coherencia, no diagnóstico.',
      ['potasio','potasio_normal']));
  for(const id of ['edad','hba1c','dm_objetivo_valor','glucemia_actual','tfge','cac','potasio','ast','alt','plaquetas','imc','fevi',
    'fecha_evaluacion','fecha_fevi','fecha_hba1c','fecha_tfge','fecha_cac','fecha_potasio',
    'fecha_ast','fecha_alt','fecha_plaquetas']){
    if(FIELDS[id]&&fieldState(draft,id)==='revisar') {
      const isDate=id.startsWith('fecha_');
      out.push(item('CLINICAL_FIELD_INVALID_'+id,isDate?'critical':'warning',
        'Dato no válido: '+FIELDS[id].label,
        'La entrada no cumple el formato o rango previsto; no utilizarla como cero ni como medición verificada.',
        [id]));
    }
  }
  const critical=out.filter(f=>f.severity==='critical');
  return {provenance,
    status:critical.length?'critical':out.length?'review':'clear',
    critical,findings:out,requiresResolution:critical.length>0,
    summary:critical.length
      ? 'Existen incoherencias críticas: no presentar candidatos farmacológicos como opciones de inicio.'
      : out.length
        ? 'Existen comprobaciones de coherencia pendientes; no asumir que los datos sean definitivos.'
        : 'Sin incoherencias detectadas por estas reglas limitadas; no equivale a validar la historia clínica.'};
}
