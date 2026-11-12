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
  PREGNANCY_DIABETES_PATHWAY:'Gestación: utilizar circuito específico de diabetes y embarazo',
  HF_RED_FLAGS:'IC: signos de alarma cardiorrespiratorios en el formulario',
  HF_ALARMS_CONFLICT:'IC: selección simultánea de ausencia y presencia de alarmas',
  HF_DECOMPENSATION:'IC: descompensación o inestabilidad activa',
  HF_EF_CONFLICT:'IC: grupo ESC 2026 discordante con FEVI medida',
  HF_CRITICAL_POTASSIUM:'IC: potasio elevado con posible riesgo inmediato',
  HF_HYPOTENSION:'IC: PAS baja con necesidad de valoración',
  RAAS_DOUBLE_BLOCKADE:'Combinación IECA/ARA-II/ARNI sin reconciliar',
  HF_POTASSIUM_REVIEW:'IC: potasio >5,5 y <6,0 mmol/L requiere revisión',
  HF_RAAS_DUPLICATION:'Incompatibilidad de clases IECA/ARA-II/ARNI declaradas'
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
  // Barreras de IC aplicadas a TODAS las vistas y fichas farmacológicas.
  // Interpretar la alarma declarada incluso cuando la combinación de opciones
  // invalida el campo; no confundir dato inválido con ausencia de riesgo.
  const hfAlarmRaw=draft?.values?.ic_alarma;
  const hfAlarms=hfAlarmRaw?readMulti(String(hfAlarmRaw)):[];
  const hfPositive=hfAlarms.filter(x=>x!=='Sin señales de alarma tras valoración');
  const hfNegative=hfAlarms.includes('Sin señales de alarma tras valoración');
  if(hfPositive.length)
    out.push(item('HF_RED_FLAGS','critical','Signos de alarma de insuficiencia cardíaca',
      'Constan posibles signos cardiorrespiratorios agudos: '+hfPositive.join('; ')+
      '. Valorar de forma prioritaria estabilidad, ECG, oxigenación y destino asistencial.',
      ['ic_alarma','ic_estabilidad','congestion']));
  if(hfNegative&&hfPositive.length)
    out.push(item('HF_ALARMS_CONFLICT','critical','Alarmas de IC contradictorias',
      'Se marcaron simultáneamente ausencia y presencia de signos de alarma. Conservar la alerta hasta reconciliar el dato.',
      ['ic_alarma']));
  if(yes('ic_descompensada')||VALUE(draft,'ic_estabilidad')==='Inestabilidad o descompensación sospechada')
    out.push(item('HF_DECOMPENSATION','critical','Descompensación de IC o inestabilidad declarada',
      'No utilizar la optimización crónica hasta valorar situación aguda y necesidad de atención urgente.',
      ['ic_descompensada','ic_estabilidad']));
  const ef=NUMBER(draft,'fevi'),efGroup=VALUE(draft,'ic_fevigrupo');
  if(ef!==null&&((efGroup==='Reducida · FEVI <50 %'&&ef>=50)||
      (efGroup==='Preservada · FEVI ≥50 %'&&ef<50)))
    out.push(item('HF_EF_CONFLICT','critical','Grupo FEVI incompatible con medición',
      'El grupo ESC 2026 elegido no coincide con la FEVI aportada. Confirmar informe antes de clasificar.',
      ['fevi','ic_fevigrupo']));
  const potassiumHF=NUMBER(draft,'potasio'),pasHF=NUMBER(draft,'pas');
  if(yes('ic')&&potassiumHF!==null&&potassiumHF>=6)
    out.push(item('HF_CRITICAL_POTASSIUM','critical','Potasio elevado en IC',
      'Potasio ≥6 mmol/L: confirmar valor, ECG y clínica; valorar atención urgente según contexto. No titular tratamiento crónico.',
      ['ic','potasio','fecha_potasio']));
  if(yes('ic')&&pasHF!==null&&pasHF<90)
    out.push(item('HF_HYPOTENSION','critical','Presión sistólica baja en IC',
      'PAS <90 mmHg: valorar perfusión y síntomas, y revisar seguridad antes de titular tratamientos.',
      ['ic','pas','ic_estabilidad']));
  if(yes('ic')&&potassiumHF!==null&&potassiumHF>5.5&&potassiumHF<6)
    out.push(item('HF_POTASSIUM_REVIEW','critical','Potasio elevado en IC: revisar medicación',
      'K >5,5 mmol/L: confirmar el resultado, ECG/contexto y tratamiento concomitante. Retener nuevos candidatos mientras se evalúa, sin etiquetar automáticamente urgencia vital.',
      ['ic','potasio','fecha_potasio','farmacos_clases']));
  const currentClasses=VALUE(draft,'farmacos_clases');
  const declaredClasses=currentClasses===null?[]:readMulti(currentClasses);
  if(['IECA','ARA-II','INRA/ARNI'].filter(x=>declaredClasses.includes(x)).length>=2)
    out.push(item('HF_RAAS_DUPLICATION','critical','Posible asociación de bloqueantes RAAS incompatible',
      'Se han declarado varias clases IECA/ARA-II/ARNI. Confirmar si es transición, error de medicación o tratamiento simultáneo antes de modificar cualquier otra pauta.',
      ['farmacos_clases','farmacos','medicacion_revisada']));
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
  if(list!==null){
    const ras=['IECA','ARA-II','INRA/ARNI'].filter(x=>list.includes(x));
    if(ras.length>1)
      out.push(item('RAAS_DOUBLE_BLOCKADE','critical',
        'Posible bloqueo dual o duplicidad del sistema renina-angiotensina',
        'Constan varias clases IECA/ARA-II/ARNI a la vez: comprobar si son fármacos activos o una transición documentada. ARNI no debe coadministrarse con IECA ni ARA-II.',
        ['farmacos_clases','farmacos','medicacion_revisada']));
  }
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
      out.push(item('CLINICAL_FIELD_INVALID_'+id,
        isDate||(id==='fevi'&&yes('ic'))?'critical':'warning',
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
