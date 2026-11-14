/**
 * CaHReMe — plan de verificación, NO plan terapéutico.
 *
 * Consolida coherencia, información por confirmar y monitorización
 * derivada únicamente de actuaciones registradas como efectivamente realizadas.
 * No emite prescripciones, diagnósticos, autorizaciones ni acciones automáticas.
 */
import { FIELDS, fieldState } from '../model.mjs';
import { auditCrossDomain } from './auditoria.mjs';
import { integratePatient } from './integracion.mjs';
import { followUpFromHistory } from './continuidad.mjs';

const known=(draft,id)=>fieldState(draft,id)==='registrado';
const value=(draft,id)=>known(draft,id)?String(draft.values[id]):null;
const step=(id,priority,title,detail,fields=[],sources=[])=>({
  id,priority,title,detail,fields,sources,performed:false,
  label:'Pendiente de revisión profesional'
});
export function buildVerificationPlan(draft,history=[]) {
  const audit=auditCrossDomain(draft);
  const integrated=integratePatient(draft);
  const followUps=followUpFromHistory(history);
  const tasks=[];
  const seen=new Set();
  const add=x=>{if(!seen.has(x.id)){tasks.push(x);seen.add(x.id)}};
  for(const finding of audit.findings) {
    add(step('RECONCILE-'+finding.id,
      finding.severity==='critical'?'seguridad':'completar',
      finding.title,finding.detail,finding.fields,['CAHREME-AUDIT-V1']));
  }
  if(audit.provenance.undated.length) {
    add(step('VERIFY-LAB-DATES','completar','Confirmar fecha y vigencia de las analíticas',
      'No se han consignado fechas para: '+audit.provenance.undated.join(', ')+
      '. No considerar los resultados automáticamente recientes ni imponer un plazo universal de caducidad.',
      ['fecha_evaluacion','fecha_tfge','fecha_cac','fecha_potasio',
        'fecha_ast','fecha_alt','fecha_plaquetas'],['CAHREME-AUDIT-V1']));
  }
  if((known(draft,'dm2')&&value(draft,'dm2')==='Sí') &&
     (!known(draft,'alergias_revisadas') || value(draft,'alergias_revisadas')!=='Sí')) {
    add(step('VERIFY-ALLERGIES','completar','Comprobar alergias e intolerancias',
      'Las fichas CIMA requieren verificar hipersensibilidad y excipientes antes de elegir una molécula.',
      ['alergias','alergias_revisadas']));
  }
  if((known(draft,'dm2')||known(draft,'ic')||known(draft,'erc')) &&
    (!known(draft,'farmacos_clases') || value(draft,'medicacion_revisada')!=='Sí')) {
    add(step('RECONCILE-MEDICATIONS','completar','Reconciliar tratamiento actual',
      'Confirmar medicamentos realmente utilizados, moléculas, dosis y posibles transiciones.',
      ['farmacos_clases','farmacos','medicacion_revisada']));
  }
  const chronicRenal=value(draft,'erc')==='Sí' &&
    value(draft,'persistencia')!=='Sí';
  if(chronicRenal) {
    add(step('VERIFY-CKD-CHRONICITY','completar','Verificar cronicidad de ERC',
      'Una sola TFGe o CAC alteradas no demuestran ERC. Comprobar documentación longitudinal y etiología.',
      ['erc','persistencia','tfge','cac'],['KDIGO-2024-CKD']));
  }
  const ckd=value(draft,'erc')==='Sí',heartFailure=value(draft,'ic')==='Sí';
  if((ckd||heartFailure) && !known(draft,'tfge'))
    add(step('COMPLETE-EGFR','completar','Disponer de TFGe para revisar condiciones farmacológicas',
      'Sin TFGe válida no se pueden comprobar límites de inicio ni seguridad de varios medicamentos.',
      ['tfge','fecha_tfge'],['KDIGO-2024-CKD']));
  if(ckd && !known(draft,'cac'))
    add(step('COMPLETE-ACR','completar','Confirmar CAC en mg/g',
      'La albuminuria forma parte de la clasificación G/A y de determinadas condiciones farmacológicas.',
      ['cac','unidad_cac','fecha_cac'],['KDIGO-2024-CKD']));
  const potassiumRelevant=value(draft,'fin_estado')==='En tratamiento' ||
    value(draft,'farmacos_clases')?.includes('ARM');
  if(potassiumRelevant && !known(draft,'potasio'))
    add(step('COMPLETE-POTASSIUM','seguridad','Revisar potasio antes de valorar finerenona/ARM',
      'Es necesario un potasio actual para interpretar las reglas de continuación; no presumir normalidad.',
      ['potasio','fecha_potasio'],['CIMA-AEMPS-FINERENONA']));
  for(const alert of integrated.alerts) {
    if(alert.id.startsWith('AUDIT-'))continue;
    add(step('ALERT-'+alert.id,
      alert.id.includes('KETO')||alert.id.includes('ACUTE')?'seguridad':'seguridad',
      alert.title,alert.summary,[],alert.sources));
  }
  const outstanding=integrated.options.map(x=>({
    id:x.id,title:x.title,sources:x.sources,status:'candidato_para_revision',
    performed:false
  }));
  const followup=followUps.map((entry,i)=>({
    ...entry, id:'FOLLOWUP-'+i,
    performed:false,
    status:entry.status==='sustituido'?'sustituido':
      entry.status==='previsto'?'previsto':'reevaluacion_pendiente'
  }));
  const order={seguridad:0,completar:1};
  tasks.sort((a,b)=>order[a.priority]-order[b.priority]);
  return {
    status:audit.requiresResolution?'incoherencias_criticas':'revision_pendiente',
    summary:audit.requiresResolution?'Corregir las incoherencias antes de valorar candidatos.':
      'Síntesis documental para revisión del profesional, sin aprobación clínica automática.',
    checks:tasks,
    heldCandidates:integrated.context.filter(x=>x.id.startsWith('ON-HOLD-')).length,
    candidates:outstanding,
    followup,
    confirmedActions:Array.isArray(history)?history.filter(x=>x.confirmed===true).length:0,
    metadata:{noPrescription:true,noPerformedActionsInferred:true,
      noPersistentData:true,clinicalValidation:'pendiente'}
  };
}
