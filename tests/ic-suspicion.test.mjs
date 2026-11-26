import test from 'node:test';
import assert from 'node:assert/strict';
import {GROUPS,createClinicalContext,updateFinding,evaluateSuspicion,setGroupReviewed,isGroupReviewed,toggleFinding,setEvaluationReviewed,isEvaluationReviewed,diagnosticNext,setInvestigation,diagnosticAction,setStudyResult,investigationPlan,interpretSuspicion,CLINICAL_DIMENSIONS,labPlan} from '../src/ic/suspicion.mjs';
const allNo=()=>({findings:{...Object.fromEntries(GROUPS.flatMap(g=>g.fields.map(([id])=>[id,'no']))),vitalsReviewed:'yes'}});
const result=(c)=>evaluateSuspicion(c).id;
test('Datos ausentes no son negativos',()=>assert.equal(result(createClinicalContext()),'IC-SUS-03'));
test('Alarma positiva prevalece aunque falten datos',()=>assert.equal(result({findings:{perfusion:'yes'}}),'IC-SUS-01'));
test('Empeoramiento exige revisión hoy',()=>assert.equal(result({...allNo(),findings:{...allNo().findings,worsening:'yes'}}),'IC-SUS-02'));
test('Síntomas sin seguridad no activan circuito ambulatorio',()=>assert.equal(result({findings:{dyspnea:'yes'}}),'IC-SUS-03'));
test('Hallazgos compatibles no confirman IC',()=>{let c=updateFinding(allNo(),'orthopnea','yes');assert.equal(result(c),'IC-SUS-05');assert.match(evaluateSuspicion(c).action,/Si persiste sospecha/);});
test('Riesgo sin síntomas ni signos',()=>assert.equal(result(updateFinding(allNo(),'htn','yes')),'IC-SUS-08'));
test('IC conocida no se descarta por ausencia de hallazgos',()=>assert.equal(result(updateFinding(allNo(),'knownHF','yes')),'IC-SUS-04'));
test('Todos negativos no descartan IC',()=>{assert.equal(result(allNo()),'IC-SUS-10');assert.match(evaluateSuspicion(allNo()).action,/no excluye/);});
test('Dato desconocido y dato inválido',()=>{assert.equal(result(updateFinding(allNo(),'jvp','unknown')),'IC-SUS-06');assert.equal(updateFinding(allNo(),'unknownField','yes').findings.unknownField,undefined);});

test('Constantes no valoradas bloquean orientación ordinaria',()=>{for(const v of ['unknown','no'])assert.equal(result(updateFinding(allNo(),'vitalsReviewed',v)),'IC-SUS-03');});
test('Alarma crítica prevalece sobre constantes pendientes y empeoramiento',()=>assert.equal(result({findings:{respiratory:'yes',worsening:'yes',vitalsReviewed:'no'}}),'IC-SUS-01'));
test('Trazabilidad de las salidas',()=>{for(const c of [allNo(),createClinicalContext(),{findings:{perfusion:'yes'}}]){const r=evaluateSuspicion(c);assert.ok(r.id&&r.source.doi&&r.source.sections&&r.source.version&&r.ruleType);}});

test('Casilla vacía no implica ausencia',()=>{let c=toggleFinding(createClinicalContext(),'dyspnea',true);assert.equal(c.findings.dyspnea,'yes');c=toggleFinding(c,'dyspnea',false);assert.equal(c.findings.dyspnea,'unknown');assert.equal(isGroupReviewed(c,'symptoms'),false);});
test('Confirmar revisión solo convierte no marcados en negativos',()=>{let c=toggleFinding(createClinicalContext(),'respiratory',true);c=setGroupReviewed(c,'alarms',true);assert.equal(c.findings.respiratory,'yes');assert.equal(c.findings.perfusion,'no');assert.equal(c.findings.vitalsReviewed,undefined);assert.equal(result(c),'IC-SUS-01');assert.equal(isGroupReviewed(c,'alarms'),true);c=setGroupReviewed(c,'alarms',false);assert.equal(c.findings.respiratory,'yes');assert.equal(c.findings.perfusion,'unknown');});
test('Revisión de alarmas sin constantes mantiene bloqueo',()=>{let c=setGroupReviewed(createClinicalContext(),'alarms',true);assert.equal(result(c),'IC-SUS-03');c=toggleFinding(c,'vitalsReviewed',true);assert.equal(result(c),'IC-SUS-06');c=toggleFinding(c,'perfusion',true);assert.equal(result(c),'IC-SUS-01');c=toggleFinding(c,'perfusion',false);assert.equal(result(c),'IC-SUS-03');});

test('Confirmación única conserva positivos y no presupone constantes',()=>{let c=toggleFinding(createClinicalContext(),'dyspnea',true);c=setEvaluationReviewed(c,true);assert.equal(c.findings.dyspnea,'yes');assert.equal(c.findings.perfusion,'no');assert.equal(c.findings.knownHF,'no');assert.equal(c.findings.vitalsReviewed,undefined);assert.equal(result(c),'IC-SUS-03');assert.equal(isEvaluationReviewed(c),true);c=toggleFinding(c,'vitalsReviewed',true);assert.equal(result(c),'IC-SUS-05');c=toggleFinding(c,'dyspnea',false);assert.equal(isEvaluationReviewed(c),false);assert.equal(result(c),'IC-SUS-06');});
test('Retirar confirmación única vuelve a desconocidos sin borrar positivos',()=>{let c=setEvaluationReviewed(toggleFinding(createClinicalContext(),'perfusion',true),true);c=setEvaluationReviewed(c,false);assert.equal(c.findings.perfusion,'yes');assert.equal(c.findings.dyspnea,'unknown');assert.equal(result(c),'IC-SUS-01');assert.equal(isEvaluationReviewed(c),false);});

test('Siguiente paso no fuerza secuencia y prioriza seguridad',()=>{let c=createClinicalContext();assert.equal(diagnosticNext(c).kind,'safety');c=toggleFinding(c,'dyspnea',true);c=setEvaluationReviewed(c,true);c=toggleFinding(c,'vitalsReviewed',true);assert.equal(diagnosticNext(c).route,'ic/diagnostico/pruebas');c=toggleFinding(c,'respiratory',true);assert.equal(diagnosticNext(c).kind,'urgent');});
test('Registro de pruebas independiente conserva hallazgos y no presupone resultados',()=>{let c=toggleFinding(createClinicalContext(),'dyspnea',true);c=setInvestigation(c,'ecg','requested');assert.equal(c.findings.dyspnea,'yes');assert.equal(c.investigations.ecg.status,'requested');assert.equal(c.investigations.np,undefined);assert.equal(diagnosticNext(c).kind,'safety');assert.equal(setInvestigation(c,'invalid','requested'),c);assert.equal(setInvestigation(c,'ecg','normal'),c);});

test('Navegación a pruebas con seguridad pendiente; alarma positiva prioriza urgencia',()=>{let c=createClinicalContext();assert.equal(diagnosticAction(c).action,'continue-study');c=toggleFinding(c,'respiratory',true);assert.equal(diagnosticAction(c).action,'open-urgent');c=toggleFinding(c,'respiratory',false);c=setGroupReviewed(c,'alarms',true);c=toggleFinding(c,'vitalsReviewed',true);assert.equal(diagnosticAction(c).action,'continue-study');c=setEvaluationReviewed(toggleFinding(c,'dyspnea',true),true);assert.equal(diagnosticAction(c).action,'continue-study');c=toggleFinding(c,'knownHF',true);assert.equal(diagnosticAction(c).action,'continue-study');});

test('Caso captura: IC conocida, disnea y congestión con constantes pendientes conserva acceso sin asumir estabilidad',()=>{let c=createClinicalContext();for(const id of ['dyspnea','swelling','crackles','edema','knownHF','htn','dm','obesity'])c=toggleFinding(c,id,true);c=setEvaluationReviewed(c,true);assert.equal(diagnosticNext(c).kind,'safety');assert.equal(diagnosticAction(c).route,'ic/diagnostico/pruebas');assert.equal(c.findings.vitalsReviewed,undefined);c=toggleFinding(c,'vitalsReviewed',true);assert.equal(diagnosticNext(c).kind,'known');assert.equal(diagnosticAction(c).route,'ic/diagnostico/pruebas');c=toggleFinding(c,'perfusion',true);assert.equal(diagnosticAction(c).action,'open-urgent');});

test('Plan distingue sospecha, IC conocida, datos pendientes y urgencia',()=>{let c=createClinicalContext();assert.equal(investigationPlan(c).mode,'incomplete');c=setEvaluationReviewed(toggleFinding(c,'dyspnea',true),true);c=toggleFinding(c,'vitalsReviewed',true);assert.equal(investigationPlan(c).mode,'suspected');c=toggleFinding(c,'knownHF',true);assert.equal(investigationPlan(c).mode,'known');c=toggleFinding(c,'perfusion',true);assert.equal(investigationPlan(c).mode,'urgent');});
test('Resultados numéricos conservan unidad y desconocidos',()=>{let c=createClinicalContext();c=setStudyResult(c,'egfr','45,5');assert.equal(c.results.egfr.value,45.5);assert.equal(c.results.egfr.unit,'mL/min/1,73 m²');assert.equal(setStudyResult(c,'egfr','-1'),c);assert.equal(setStudyResult(c,'tsat','101'),c);assert.equal(setStudyResult(c,'egfr','abc'),c);c=setStudyResult(c,'egfr','');assert.equal(c.results.egfr,undefined);});
test('Hallazgos registrados orientan estudio etiológico sin diagnosticar',()=>{let c=toggleFinding(createClinicalContext(),'family',true);c=setStudyResult(c,'ecg','af');assert.ok(investigationPlan(c).targeted.some(x=>x.id==='family'));assert.ok(investigationPlan(c).targeted.some(x=>x.id==='rhythm'));assert.equal(investigationPlan(c).mode,'incomplete');assert.equal(c.results.np,undefined);});

test('Cobertura de cada ítem del formulario por las dimensiones',()=>{
 const ids=[...GROUPS.flatMap(g=>g.fields.map(([id])=>id)),'vitalsReviewed'];
 assert.deepEqual([...new Set(Object.values(CLINICAL_DIMENSIONS).flat())].sort(),ids.sort());
});
test('Caso de la captura: sospecha, congestión y riesgo sin constantes no se ocultan',()=>{
 let c=createClinicalContext();for(const id of ['pnd','swelling','crackles','htn','dm'])c=toggleFinding(c,id,true);
 c=setEvaluationReviewed(c,true);const r=interpretSuspicion(c);
 assert.equal(r.title,'Sospecha clínica de insuficiencia cardiaca');assert.equal(r.safety.level,'pending');
 assert.deepEqual(r.profile.nocturnal,['pnd']);assert.deepEqual(r.profile.pulmonary,['crackles']);
 assert.deepEqual(r.profile.predisposition,['htn','dm']);assert.equal(r.next.route,'ic/diagnostico/pruebas');
 const s=interpretSuspicion(toggleFinding(c,'vitalsReviewed',true));assert.equal(s.title,r.title);assert.equal(s.safety.level,'review');
});
test('IC conocida, síntomas, datos desconocidos y factores de riesgo no son equivalentes',()=>{
 assert.equal(interpretSuspicion(createClinicalContext()).id,'IC-PROF-05');
 assert.equal(interpretSuspicion(toggleFinding(createClinicalContext(),'dyspnea',true)).id,'IC-PROF-03');
 assert.equal(interpretSuspicion(updateFinding(allNo(),'htn','yes')).id,'IC-PROF-07');
 assert.match(interpretSuspicion(updateFinding(allNo(),'knownHF','yes')).title,/IC conocida sin manifestaciones/);
 assert.equal(interpretSuspicion(allNo()).id,'IC-PROF-09');
});
test('Cobertura combinatoria por parejas de todos los ítems y estados; alarmas prevalecen sin borrar interpretación',()=>{
 const ids=[...GROUPS.flatMap(g=>g.fields.map(([id])=>id)),'vitalsReviewed'];
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)for(const a of ['yes','no','unknown'])for(const b of ['yes','no','unknown'])for(const base of ['unknown','no']){
  const findings=Object.fromEntries(ids.map(id=>[id,base]));findings[ids[i]]=a;findings[ids[j]]=b;
  const c={findings},r=interpretSuspicion(c);
  assert.ok(r.title&&r.interpretation&&r.next.text&&r.safety.title);
  assert.deepEqual(Object.values(r.profile).flat().sort(),ids.filter(id=>findings[id]==='yes').sort());
  if(CLINICAL_DIMENSIONS.urgent.some(id=>findings[id]==='yes')){assert.equal(r.safety.level,'critical');assert.equal(r.next.action,'open-urgent');}
  else if(findings.worsening==='yes'){assert.equal(r.safety.level,'urgent');assert.equal(r.next.action,'open-urgent');}
  else{assert.equal(r.next.route,'ic/diagnostico/pruebas');if(findings.vitalsReviewed!=='yes')assert.equal(r.safety.level,'pending');}
 }
});

test('Analítica basal no omite albuminuria ni hierro; prioridad de entrada dinámica y limitada',()=>{
 let c=setEvaluationReviewed(toggleFinding(createClinicalContext(),'dyspnea',true),true);c=toggleFinding(c,'vitalsReviewed',true);
 let p=labPlan(c);assert.equal(p.priority.length,3);assert.ok(p.priority.includes('hemoglobin'));assert.ok(p.canCopy);assert.ok(p.basal.some(x=>x.includes('albúmina/creatinina')));assert.ok(p.basal.some(x=>x.includes('Ferritina')));
 c=toggleFinding(c,'edema',true);p=labPlan(c);assert.ok(p.priority.includes('sodium'));assert.equal(p.priority.length,3);assert.equal(new Set(p.basal).size,p.basal.length);
 c=toggleFinding(c,'dm',true);assert.ok(labPlan(c).emphasis.some(x=>x.includes('HbA1c')));
 c=toggleFinding(c,'perfusion',true);assert.equal(labPlan(c).canCopy,false);
 assert.equal(labPlan(createClinicalContext()).canCopy,false);
});
