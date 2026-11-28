import test from 'node:test';
import assert from 'node:assert/strict';
import {GROUPS,createClinicalContext,updateFinding,evaluateSuspicion,setGroupReviewed,isGroupReviewed,toggleFinding,setEvaluationReviewed,isEvaluationReviewed,diagnosticNext,diagnosticAction,setStudyResult,investigationPlan,interpretSuspicion,CLINICAL_DIMENSIONS,labPlan,setPeptide,interpretPeptide,peptideFactors,ECHO_FINDINGS,ECHO_NUMERIC,setEcho,interpretEcho,setStageAssessment,interpretStage,setPhenotypeAssessment,interpretPhenotype,NYHA_OPTIONS,setNyha,interpretNyha,SITUATION_QUESTIONS,setSituation,interpretSituation,classificationSummary,TREATMENT_VITALS,setTreatmentValue,confirmTreatmentLabs,treatmentSafetyData,MEDICATION_GROUPS,setMedicationField,addMedication,removeMedication,medicationSummary,confirmMedicationReview,MEDICATION_QUICK_DOSES,medicationEntryComplete,setMedicationQuickDose,MEDICATION_FAMILIES,medicationFamilyLabel,addNamedMedication,deleteRecordedMedication,medicationFrequencyOptions,medicationSafety,HF_MEDICATION_REFERENCE,treatmentProposal,HF_TITRATION_REFERENCE,betaBlockerReferenceStep,armPotassiumReference,echoSupportCriteria} from '../src/ic/suspicion.mjs';
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
test('Registrar un resultado no modifica los hallazgos ni presupone resultados de otras pruebas',()=>{let c=toggleFinding(createClinicalContext(),'dyspnea',true);c=setStudyResult(c,'ecg','af');assert.equal(c.findings.dyspnea,'yes');assert.equal(c.results.ecg.value,'af');assert.equal(c.results.rx,undefined);assert.equal(diagnosticNext(c).kind,'safety');c=setStudyResult(c,'ecg','unknown');assert.equal(c.results.ecg,undefined);});

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

test('NP: límites, contexto explícito y edad exacta de 75 años',()=>{
 const run=(age,v,context='outpatient',kind='nt')=>interpretPeptide({findings:{},peptides:{age,context,kind,[kind]:v}});
 assert.equal(run(68,124).id,'NP-01');assert.equal(run(68,125).id,'NP-02');assert.equal(run(68,250).id,'NP-03');
 assert.equal(run(49,125).id,'NP-03');assert.equal(run(75,250).id,'NP-02');assert.equal(run(75,500).id,'NP-03');
 assert.equal(run(68,2001).id,'NP-04');assert.equal(run(68,299,'acute').id,'NP-01');assert.equal(run(68,900,'acute').id,'NP-02');assert.equal(run(68,901,'acute').id,'NP-03');
 assert.equal(run(75,1801,'acute').id,'NP-03');assert.equal(run(68,5001,'acute').id,'NP-05');
 assert.equal(run(68,34,'outpatient','bnp').id,'NP-01');assert.equal(run(68,35,'outpatient','bnp').id,'NP-03');assert.equal(run(68,99,'acute','bnp').id,'NP-01');assert.equal(run(68,100,'acute','bnp').id,'NP-02');
 assert.equal(run(68,850,'unknown').id,'NP-00');assert.equal(run(undefined,850).id,'NP-02');
 assert.equal(run(68,20,'acute').next.section,'descompensada');
});
test('NP: recupera modificadores, no los inventa; alarma y IC conocida prevalecen',()=>{
 let c=createClinicalContext();c=updateFinding(c,'obesity','yes');c=setStudyResult(c,'egfr','45');c=setStudyResult(c,'ecg','af');
 c=setPeptide(c,'context','outpatient');c=setPeptide(c,'nt','100');
 assert.equal(peptideFactors(c).obesity,'yes');assert.equal(peptideFactors(c).renal,'yes');assert.equal(peptideFactors(c).af,'yes');
 assert.match(interpretPeptide(c).notes.join(' '),/no excluye/);
 c=updateFinding(c,'knownHF','yes');assert.equal(interpretPeptide(c).title,'Valor bajo en IC conocida');
 c=updateFinding(c,'perfusion','yes');assert.equal(interpretPeptide(c).next.section,'descompensada');
 assert.equal(setPeptide(c,'age','17'),c);assert.equal(setPeptide(c,'nt','-1'),c);
 c=setPeptide(c,'nt','');assert.equal(interpretPeptide(c).id,'NP-00');
});

test('FEVI libre: cobertura de todas las décimas de 0,1 a 100',()=>{
 for(let x=1;x<=1000;x++){const c=setEcho(createClinicalContext(),'ef',String(x/10)),r=interpretEcho(c);assert.equal(r.ef,x/10);assert.equal(r.title,x<500?'FEVI reducida':'FEVI preservada');}
 const c=createClinicalContext();for(const invalid of ['-5','0','110','NaN','Infinity'])assert.equal(setEcho(c,'ef',invalid),c);
 assert.equal(interpretEcho(setEcho(c,'ef','49,9')).ef,49.9);
 assert.equal(interpretEcho(c).ef,null);
});
test('Eco: FEVI previa y hallazgos opcionales no confirman IC',()=>{
 let c=setEcho(createClinicalContext(),'ef','55');c=setEcho(c,'priorEf','30');
 let r=interpretEcho(c);assert.match(r.title,/antecedente de reducción/);assert.match(r.phenotype,/no etiquetar/);assert.equal(r.integratedTitle,'Alteración cardiaca registrada'.replace('Alteración cardiaca registrada','Información insuficiente para concluir IC'));
 c=setEcho(c,'filling','yes');assert.equal(interpretEcho(c).integratedTitle,'Alteración cardiaca registrada');
 c=updateFinding(c,'dyspnea','yes');r=interpretEcho(c);assert.equal(r.integratedTitle,'Sospecha de IC con hallazgos objetivos');
 c=setPeptide(c,'context','acute');assert.equal(interpretEcho(c).next,'descompensada');
});
test('Eco: combinaciones de hallazgos y estados, sin valores implícitos',()=>{
 for(let mask=0;mask<256;mask++){let c=setEcho(createClinicalContext(),'ef','70');for(let i=0;i<8;i++)if(mask&(1<<i))c=setEcho(c,ECHO_FINDINGS[i][0],'yes');const r=interpretEcho(c);assert.equal(r.positive.length+ r.unknown.length,8);assert.ok(r.integrated);assert.notEqual(r.integratedTitle,'IC confirmada');}
});

test('Estadio: riesgo, pre-IC, IC clínica, IC avanzada documentada y estadio 0',()=>{
 const make=(a={},findings={},echo={})=>({findings,echo,stageAssessment:a});
 const no={manifestations:'no',objective:'no'};
 assert.equal(interpretStage(make()).stage,null);
 assert.equal(interpretStage(make({...no,risk:'yes'})).stage,'A');
 assert.equal(interpretStage(make({...no,risk:'no'})).stage,'0');
 assert.equal(interpretStage(make({manifestations:'no'},{},{ef:38})).stage,'B');
 assert.equal(interpretStage(make({manifestations:'yes'},{},{ef:38})).stage,'C');
 assert.equal(interpretStage(make({advancedConfirmed:'yes'},{knownHF:'yes'})).stage,'D');
 assert.equal(interpretStage(make({advancedConfirmed:'no'},{knownHF:'yes'})).stage,'C');
 assert.equal(interpretStage(make({manifestations:'no'},{knownHF:'yes'})).stage,null);
 assert.equal(interpretStage(make({...no,risk:'yes'},{},{ef:38})).stage,null);
 assert.equal(interpretStage(make({manifestations:'no'},{},{ef:70,ph:'yes'})).stage,null);
 assert.equal(interpretStage(make({manifestations:'yes'})).stage,null);
 assert.equal(interpretStage(make({advancedConfirmed:'yes'})).stage,null);
});
test('Estadio: señales de avanzada y alarmas no equivalen a D',()=>{
 let c=updateFinding(createClinicalContext(),'knownHF','yes');
 c=setStageAssessment(c,'admissions','yes');assert.equal(interpretStage(c).stage,'C');assert.match(interpretStage(c).text,/posible IC avanzada/);
 c=setStageAssessment(c,'severe','yes');c=setStageAssessment(c,'refractory','yes');assert.equal(interpretStage(c).stage,'C');
 c=updateFinding(c,'perfusion','yes');assert.equal(interpretStage(c).urgent,true);
 assert.equal(interpretStage(c).stage,'C');
 assert.equal(setStageAssessment(c,'bogus','yes'),c);
});
test('Estadio: combinaciones de estados ternarios no fuerzan A/B/C/D',()=>{
 const vals=['yes','no','unknown'];
 for(const manifestations of vals)for(const objective of vals)for(const risk of vals)for(const advancedConfirmed of vals){
  const c={findings:{},stageAssessment:{manifestations,objective,risk,advancedConfirmed}};
  const r=interpretStage(c);
  if(r.stage==='D')assert.ok(manifestations==='yes'&&objective==='yes'&&advancedConfirmed==='yes');
  if(['A','B','0'].includes(r.stage))assert.equal(manifestations,'no');
  if(r.stage==='0')assert.ok(objective==='no'&&risk==='no');
 }
});

test('Estadio: contradicciones pueden revisarse y una FEVI previamente reducida impide A/0 sin aclarar',()=>{
 let c={findings:{knownHF:'yes',htn:'yes'},echo:{ef:35},stageAssessment:{manifestations:'no',objective:'no',risk:'no'}};
 let r=interpretStage(c);assert.equal(r.stage,null);for(const k of ['manifestations','objective','risk'])assert.ok(r.questions.includes(k));
 for(const k of ['manifestations','objective','risk'])c=setStageAssessment(c,k,'unknown');
 assert.equal(interpretStage(c).stage,'C');
 c={findings:{},echo:{ef:60,priorEf:30},stageAssessment:{manifestations:'no',objective:'no',risk:'yes'}};
 r=interpretStage(c);assert.equal(r.stage,null);assert.ok(r.questions.includes('objective'));assert.match(r.contradictions.join(' '),/previamente reducida/);
});

test('Fenotipo: FEVI aislada no establece IC; cortes ESC y antecedentes',()=>{
 const make=(ef,extra={})=>({findings:{knownHF:'yes'},echo:{ef,...extra},phenotypeAssessment:{diastolicEvidence:'yes'}});
 assert.equal(interpretPhenotype({findings:{},echo:{ef:35}}).code,'ef-only');
 for(const ef of [0.1,35,40,49.9])assert.equal(interpretPhenotype(make(ef)).code,'href');
 for(const ef of [50,55,70,100])assert.equal(interpretPhenotype(make(ef,{priorReduced:'no'})).code,'hfpef');
 assert.equal(interpretPhenotype(make(70)).code,'preserved-pending');
 assert.equal(interpretPhenotype(make(55,{priorEf:30})).code,'prior-reduced');
 assert.equal(interpretPhenotype(make(55,{priorEf:30,priorReduced:'no'})).conflict,true);
 assert.equal(interpretPhenotype({findings:{knownHF:'yes'},echo:{ef:70,priorReduced:'no'}}).code,'preserved-pending');
});
test('Trayectoria: patrón de mejoría requiere IC clínica previa atribuida, conserva fenotipo actual',()=>{
 let c={findings:{knownHF:'yes'},echo:{ef:45,priorEf:30}};
 let r=interpretPhenotype(c);assert.equal(r.trajectoryPattern,true);assert.equal(r.improved,false);
 c=setPhenotypeAssessment(c,'priorClinical','yes');r=interpretPhenotype(c);assert.equal(r.improved,true);assert.equal(r.code,'href');
 c=setEcho(c,'ef','55');r=interpretPhenotype(c);assert.equal(r.improved,true);assert.equal(r.code,'prior-reduced');
 c=setEcho(c,'ef','40');assert.equal(interpretPhenotype(c).improved,false);
 c=setEcho(c,'ef','39');assert.equal(interpretPhenotype(c).trajectoryPattern,false);
 c=updateFinding(c,'perfusion','yes');assert.equal(interpretPhenotype(c).urgent,true);
});

test('NYHA: selección única en IC clínica; sin inferencia por FEVI ni estadio',()=>{
 let c=createClinicalContext();assert.equal(interpretNyha(c).eligible,false);assert.equal(setNyha(c,'II'),c);
 c=setEcho(c,'ef','35');assert.equal(interpretNyha(c).functionalClass,null);
 c=updateFinding(c,'knownHF','yes');assert.equal(interpretNyha(c).eligible,true);assert.equal(interpretNyha(c).functionalClass,null);
 for(const k of ['I','II','III','IV']){c=setNyha(c,k);assert.equal(interpretNyha(c).functionalClass,k);assert.equal(interpretStage(c).stage,'C');}
 assert.match(interpretNyha(c).warning,/no establece el estadio D/);assert.equal(interpretNyha(c).urgent,false);
 c=setNyha(c,'unknown');assert.equal(interpretNyha(c).functionalClass,null);assert.equal(interpretNyha(c).title,'NYHA no valorable');
 assert.equal(setNyha(c,'V'),c);
});
test('NYHA: alarma independiente y no mostrar clase si IC clínica deja de estar establecida',()=>{
 let c=updateFinding(createClinicalContext(),'knownHF','yes');c=setNyha(c,'II');
 c=updateFinding(c,'respiratory','yes');assert.equal(interpretNyha(c).urgent,true);assert.equal(interpretNyha(c).functionalClass,'II');
 c=updateFinding(c,'knownHF','no');assert.equal(interpretNyha(c).eligible,false);assert.equal(interpretNyha(c).functionalClass,null);assert.equal(interpretNyha(c).urgent,true);
});

test('Situación: evaluación explícita y prioridad de alarmas; combinaciones ternarias',()=>{
 const vals=['yes','no','unknown'];
 for(const worsening of vals)for(const congestion of vals)for(const perfusion of vals)for(const stable of vals){
  const c={findings:{knownHF:'yes',worsening,perfusion},situationAssessment:{congestion,stable}};
  const r=interpretSituation(c);
  if(perfusion==='yes'||stable==='no'){assert.equal(r.code,'unstable');assert.equal(r.urgent,true);}
  else if(worsening==='yes'){assert.equal(r.code,'worsening');assert.equal(r.urgent,true);}
  else if(worsening==='no'&&perfusion==='no'&&stable==='yes'&&congestion!=='unknown')assert.equal(r.code,congestion==='no'?'compensated':'congested');
  else assert.equal(r.code,'pending');
 }
});
test('Situación: IC clínica requerida para compensación; señales inespecíficas no bastan',()=>{
 let c=createClinicalContext();for(const k of ['worsening','congestion','perfusion'])c=setSituation(c,k,'no');c=setSituation(c,'stable','yes');
 assert.equal(interpretSituation(c).code,'not-established');
 c=updateFinding(c,'knownHF','yes');assert.equal(interpretSituation(c).code,'compensated');
 c=updateFinding(c,'edema','yes');assert.equal(interpretSituation(c).code,'pending');
 c=setSituation(c,'congestion','yes');assert.equal(interpretSituation(c).code,'congested');
 c=setSituation(c,'perfusion','yes');assert.equal(interpretSituation(c).code,'unstable');assert.equal(interpretEcho(c).urgent,true);
 assert.equal(interpretSituation(c).values.stable,'unknown');
});
test('Situación: constantes revisadas no prueban estabilidad; contexto agudo prevalece',()=>{
 let c={...allNo(),findings:{...allNo().findings,knownHF:'yes'}};
 c=setSituation(c,'congestion','no');assert.equal(interpretSituation(c).code,'pending');
 c=setSituation(c,'stable','yes');assert.equal(interpretSituation(c).code,'compensated');
 c=setPeptide(c,'context','acute');assert.equal(interpretSituation(c).urgent,true);
 assert.equal(setSituation(c,'bogus','yes'),c);
});

test('Situación: declarar estabilidad no sustituye perfusión ni evolución pendientes',()=>{let c=updateFinding(createClinicalContext(),'knownHF','yes');c=setSituation(c,'stable','yes');assert.equal(interpretSituation(c).code,'pending');assert.equal(interpretEcho(c).safety.level,'pending');c=setSituation(c,'perfusion','no');c=setSituation(c,'worsening','no');c=setSituation(c,'stable','yes');assert.equal(interpretEcho(c).safety.level,'review');assert.equal(interpretSituation(c).code,'pending');});

test('Resumen integrado: sin datos no asigna IC, ni habilita tratamiento',()=>{
 const r=classificationSummary(createClinicalContext());
 assert.equal(r.clinicalHF,false);assert.equal(r.stage,null);assert.equal(r.next.kind,'review');assert.equal(r.ef,null);assert.ok(r.pending.some(x=>x.section==='estadio'));
});
test('Resumen integrado: C, FEVI, NYHA, compensación y trayectoria sin duplicar datos',()=>{
 let c=createClinicalContext();c=updateFinding(c,'knownHF','yes');c=setStageAssessment(c,'advancedConfirmed','no');c=setEcho(c,'ef','37');c=setEcho(c,'priorEf','30');c=setNyha(c,'II');
 for(const k of ['worsening','perfusion','congestion'])c=setSituation(c,k,'no');c=setSituation(c,'stable','yes');
 const r=classificationSummary(c);assert.equal(r.stage,'C');assert.equal(r.phenotype,'href');assert.equal(r.nyha,'II');assert.equal(r.situation,'compensated');assert.equal(r.delta,7);assert.equal(r.next.kind,'treatment');assert.match(r.narrative,/NYHA II/);assert.match(r.narrative,/FEVI en ascenso/);
 c=setEcho(c,'priorEf','');assert.equal(classificationSummary(c).next.kind,'treatment');assert.ok(classificationSummary(c).optional.some(x=>x.section==='evolucion'));
 c=setSituation(c,'perfusion','yes');assert.equal(classificationSummary(c).next.kind,'urgent');
});
test('Resumen integrado: prioridad de seguridad, discordancia, pre-IC y avanzada',()=>{
 let c={findings:{},stageAssessment:{manifestations:'no',objective:'no',risk:'yes'}};
 for(const k of ['worsening','perfusion'])c=setSituation(c,k,'no');c=setSituation(c,'stable','yes');
 assert.equal(classificationSummary(c).next.kind,'preclinical');
 c=updateFinding(c,'knownHF','yes');assert.equal(classificationSummary(c).next.kind,'review');assert.ok(classificationSummary(c).contradictions.length);
 c=setSituation(c,'stable','no');assert.equal(classificationSummary(c).next.kind,'urgent');
 let d=updateFinding(createClinicalContext(),'knownHF','yes');d=setStageAssessment(d,'advancedConfirmed','yes');d=setEcho(d,'ef','35');
 for(const k of ['worsening','perfusion','congestion'])d=setSituation(d,k,'no');d=setSituation(d,'stable','yes');assert.equal(classificationSummary(d).next.kind,'advanced');
 d=setSituation(d,'stable','unknown');assert.equal(classificationSummary(d).next.kind,'review');
});
test('Resumen integrado: no confunde trayectoria mejorada con IC-FEp de novo',()=>{
 let c=updateFinding(createClinicalContext(),'knownHF','yes');c=setEcho(c,'ef','55');c=setEcho(c,'priorEf','30');c=setPhenotypeAssessment(c,'priorClinical','yes');const r=classificationSummary(c);
 assert.equal(r.improved,true);assert.equal(r.phenotype,'prior-reduced');assert.match(r.narrative,/no equivale a curación/);
});

test('Asistente terapéutico: laboratorio compartido y confirmación de vigencia',()=>{
 let c=createClinicalContext();c=setStudyResult(c,'egfr','48');c=setStudyResult(c,'potassium','4,5');
 let d=treatmentSafetyData(c);assert.equal(d.values.egfr,48);assert.equal(d.values.potassium,4.5);assert.equal(d.labsConfirmed,false);
 c=confirmTreatmentLabs(c,true);assert.equal(treatmentSafetyData(c).labsConfirmed,true);
 c=setTreatmentValue(c,'egfr','48');assert.equal(treatmentSafetyData(c).labsConfirmed,true);
 c=setTreatmentValue(c,'potassium','5,2');assert.equal(c.results.potassium.value,5.2);assert.equal(treatmentSafetyData(c).labsConfirmed,false);
 c=confirmTreatmentLabs(c,true);c=setStudyResult(c,'egfr','51');assert.equal(treatmentSafetyData(c).labsConfirmed,false);
 c=setTreatmentValue(c,'potassium','');assert.equal(treatmentSafetyData(c).labsAvailable,false);c=confirmTreatmentLabs(c,true);assert.equal(treatmentSafetyData(c).labsConfirmed,false);
});
test('Asistente terapéutico: constantes, datos ausentes e incoherencia de presión',()=>{
 let c=createClinicalContext();assert.equal(treatmentSafetyData(c).missing.length,5);assert.equal(treatmentSafetyData(c).readyForFurtherAssessment,false);
 for(const [k,v] of [['sbp','120'],['dbp','75'],['hr','68']])c=setTreatmentValue(c,k,v);
 assert.equal(treatmentSafetyData(c).values.hr,68);assert.equal(treatmentSafetyData(c).pressureDiscordant,false);
 assert.equal(setTreatmentValue(c,'hr','-3'),c);assert.equal(setTreatmentValue(c,'potassium','abc'),c);
 c=setTreatmentValue(c,'dbp','130');assert.equal(treatmentSafetyData(c).pressureDiscordant,true);
 c=setTreatmentValue(c,'hr','');assert.equal(treatmentSafetyData(c).values.hr,null);
 c=updateFinding(c,'perfusion','yes');assert.equal(treatmentSafetyData(c).urgent,true);
});

test('Medicación: ausencia explícita, desconocido y confirmación sin convertir desconocido en no toma',()=>{
 let c=createClinicalContext();assert.equal(medicationSummary(c).unknown.length,5);
 c=setMedicationField(c,'raas','drug','none');c=setMedicationField(c,'raas','reason','intolerance');
 c=confirmMedicationReview(c,true);let r=medicationSummary(c);assert.equal(r.unknown.length,0);assert.equal(r.reviewed,true);assert.equal(r.reconciled,true);
 c=setMedicationField(c,'raas','drug','Enalapril');r=medicationSummary(c);assert.equal(r.reviewed,false);assert.equal(r.groups[0].reason,'unknown');assert.equal(r.groups[0].dose,'');
});
test('Medicación: dosis combinada y pauta sin inventar dosis por defecto',()=>{
 let c=createClinicalContext();for(const [k] of MEDICATION_GROUPS)c=setMedicationField(c,k,'drug','none');
 c=setMedicationField(c,'raas','drug','Sacubitrilo/valsartán');c=setMedicationField(c,'raas','dose','24');c=setMedicationField(c,'raas','frequency','12');
 assert.equal(medicationSummary(c).complete,false);c=setMedicationField(c,'raas','dose2','26');
 c=confirmMedicationReview(c,true);assert.equal(medicationSummary(c).reconciled,true);
 c=setMedicationField(c,'raas','dose','0');assert.equal(medicationSummary(c).complete,false);assert.equal(medicationSummary(c).reviewed,false);
 c=setMedicationField(c,'raas','dose','24');c=setMedicationField(c,'raas','frequency','other');assert.equal(medicationSummary(c).complete,false);
 c=setMedicationField(c,'raas','customFrequency','Pauta registrada');assert.equal(medicationSummary(c).complete,true);
});
test('Medicación: adicionales, duplicidad de principio activo y posibles duplicidades de familia',()=>{
 let c=createClinicalContext();c=setMedicationField(c,'bb','drug','Bisoprolol');c=addMedication(c);c=setMedicationField(c,'extra-1','drug','other');c=setMedicationField(c,'extra-1','name',' bisoprolol ');
 assert.match(medicationSummary(c).duplicates.join(' '),/Principio activo repetido/);
 c=setMedicationField(c,'extra-1','drug','Carvedilol');assert.match(medicationSummary(c).duplicates.join(' '),/Posible duplicidad en Betabloqueantes/);
 c=removeMedication(c,'extra-1');assert.equal(medicationSummary(c).duplicates.length,0);assert.equal(medicationSummary(c).additional.length,0);
});

test('Registro rápido: dosis combinada, sin dosis o frecuencia implícita, y completitud por fila',()=>{
 let c=createClinicalContext();c=setMedicationField(c,'raas','drug','Sacubitrilo/valsartán');c=setMedicationQuickDose(c,'raas','24/26');let r=medicationSummary(c);
 assert.equal(r.groups[0].dose,'24');assert.equal(r.groups[0].dose2,'26');assert.equal(r.groups[0].frequency,'');assert.equal(medicationEntryComplete(r,'raas'),false);
 c=setMedicationField(c,'raas','frequency','12');assert.equal(medicationEntryComplete(medicationSummary(c),'raas'),true);
 c=setMedicationField(c,'bb','drug','none');assert.equal(medicationEntryComplete(medicationSummary(c),'bb'),true);assert.equal(medicationEntryComplete(medicationSummary(c),'mra'),false);
 assert.equal(setMedicationQuickDose(c,'raas','24/103'),c);
});

test('Lista: ausencia únicamente tras revisión explícita; un medicamento no clasificado conserva incertidumbre',()=>{
 let c=createClinicalContext();let r=medicationSummary(c);assert.equal(r.unknown.length,5);assert.equal(r.reconciled,false);
 c=confirmMedicationReview(c,true);r=medicationSummary(c);assert.equal(r.active.length,0);assert.equal(r.unknown.length,0);assert.equal(r.reconciled,true);
 c=addNamedMedication(c,'Bisoprolol');r=medicationSummary(c);assert.equal(r.reviewed,false);assert.equal(r.familyStatus.find(x=>x.id==='bb').status,'present');assert.equal(medicationFamilyLabel(r.active[0]),'Betabloqueantes');
 c=setMedicationQuickDose(c,'extra-1','2,5');c=setMedicationField(c,'extra-1','frequency','24');c=confirmMedicationReview(c,true);r=medicationSummary(c);assert.equal(r.reconciled,true);assert.equal(r.familyStatus.find(x=>x.id==='mra').status,'absent');
 c=addNamedMedication(c,'other');c=setMedicationField(c,'extra-2','name','Fármaco no clasificado');c=setMedicationField(c,'extra-2','dose','1 mg');c=setMedicationField(c,'extra-2','frequency','24');c=confirmMedicationReview(c,true);r=medicationSummary(c);assert.equal(r.unidentified,true);assert.equal(r.familyStatus.find(x=>x.id==='mra').status,'unknown');assert.equal(r.reconciled,false);
 c=deleteRecordedMedication(c,'extra-2');assert.equal(medicationSummary(c).reviewed,false);
});
test('Etiquetas educativas distinguen ARNI, IECA y ARA-II',()=>{
 for(const [drug,label] of [['Sacubitrilo/valsartán','ARNI'],['Enalapril','IECA'],['Valsartán','ARA-II']])assert.equal(medicationFamilyLabel({drug}),label);
});

test('Frecuencias específicas, no se presupone pauta real',()=>{
 for(const [drug,f] of [['Bisoprolol','24'],['Dapagliflozina','24'],['Sacubitrilo/valsartán','12']]){
  let c=addNamedMedication(createClinicalContext(),drug);const m=medicationSummary(c).active[0];
  assert.equal(m.frequency,'');assert.deepEqual(medicationFrequencyOptions(m).map(x=>x[0]),[f,'other']);
 }
 assert.ok(medicationFrequencyOptions({drug:'Eplerenona',frequency:''}).some(x=>x[0]==='48'));
 assert.ok(medicationFrequencyOptions({drug:'Bisoprolol',frequency:'12'}).some(x=>x[0]==='12'));
 assert.equal(Object.keys(HF_MEDICATION_REFERENCE).length,16);
});
test('Alertas específicas: ARNI IECA, ARNI ARA, dosis y vigencia',()=>{
 let c=addNamedMedication(createClinicalContext(),'Sacubitrilo/valsartán');c=addNamedMedication(c,'Enalapril');
 assert.ok(medicationSafety(c).some(x=>x.id==='ARNI-IECA'&&x.level==='red'));
 c=deleteRecordedMedication(c,'extra-2');c=addNamedMedication(c,'Valsartán');assert.ok(medicationSafety(c).some(x=>x.id==='ARNI-ARA'));
 c=addNamedMedication(c,'Bisoprolol');c=setMedicationQuickDose(c,'extra-4','10');c=setMedicationField(c,'extra-4','frequency','12');
 assert.ok(medicationSafety(c).some(x=>x.id==='MAX-extra-4'));assert.ok(medicationSafety(c).some(x=>x.id==='FREQ-extra-4'));
 c=addNamedMedication(c,'Eplerenona');c=setStudyResult(c,'egfr','25');c=setStudyResult(c,'potassium','6');
 assert.ok(!medicationSafety(c).some(x=>x.id==='EPL-K6'));c=confirmTreatmentLabs(c,true);
 assert.ok(medicationSafety(c).some(x=>x.id==='EPL-K6'));assert.ok(medicationSafety(c).some(x=>x.id==='EPL-FG'));
});
test('No equiparar combinación indicada de ARM e inhibidor SRAA a incompatibilidad',()=>{
 let c=addNamedMedication(createClinicalContext(),'Enalapril');c=addNamedMedication(c,'Eplerenona');assert.ok(!medicationSafety(c).some(x=>x.level==='red'));
 assert.ok(medicationSafety(c).some(x=>x.id==='MRA-SRAA'));
 c=addNamedMedication(c,'Espironolactona');assert.ok(medicationSafety(c).some(x=>x.id==='MRA-DUAL'&&x.level==='red'));
});

function proposalFixture(ef=32){
 let c=updateFinding(createClinicalContext(),'knownHF','yes');
 c=setEcho(c,'ef',String(ef));
 if(ef>=50){c=setEcho(c,'priorReduced','no');c=setPhenotypeAssessment(c,'diastolicEvidence','yes');}
 for(const k of ['worsening','perfusion','congestion'])c=setSituation(c,k,'no');c=setSituation(c,'stable','yes');c=setNyha(c,'II');
 for(const [k,v] of [['sbp','118'],['dbp','72'],['hr','76'],['egfr','65'],['potassium','4,3']])c=setTreatmentValue(c,k,v);
 c=confirmTreatmentLabs(c,true);return confirmMedicationReview(c,true);
}
test('Propuesta bloqueada por falta de datos, incertidumbre o alarma clínica',()=>{
 assert.equal(treatmentProposal(createClinicalContext()).actions.length,0);
 let c=proposalFixture();c=confirmMedicationReview(c,false);assert.equal(treatmentProposal(c).status,'review');assert.equal(treatmentProposal(c).actions.length,0);
 c=confirmMedicationReview(c,true);c=setSituation(c,'perfusion','yes');assert.equal(treatmentProposal(c).status,'urgent');
 c=proposalFixture();c=setTreatmentValue(c,'potassium','6');c=confirmTreatmentLabs(c,true);assert.equal(treatmentProposal(c).status,'urgent');assert.equal(treatmentProposal(c).actions.length,0);
});
test('Propuesta condicional FEVI 32%: ausencia confirmada, opciones por familia',()=>{
 const c=proposalFixture();const p=treatmentProposal(c);assert.equal(p.status,'conditional',JSON.stringify(p.blockers));
 assert.ok(p.actions.some(a=>a.title.includes('sacubitrilo/valsartán')));assert.ok(p.actions.some(a=>a.title.includes('bisoprolol')));assert.ok(p.actions.some(a=>a.title.includes('Dapagliflozina')));
 assert.ok(p.actions.every(a=>a.check&&a.source));
});
test('Propuesta: bisoprolol titulación y no duplicar iSGLT2',()=>{
 let c=proposalFixture();c=addNamedMedication(c,'Bisoprolol');c=setMedicationQuickDose(c,'extra-1','2,5');c=setMedicationField(c,'extra-1','frequency','24');
 c=addNamedMedication(c,'Dapagliflozina');c=setMedicationQuickDose(c,'extra-2','10');c=setMedicationField(c,'extra-2','frequency','24');c=confirmMedicationReview(c,true);
 const p=treatmentProposal(c);assert.equal(p.status,'conditional');assert.ok(p.actions.some(a=>a.kind==='review'&&a.detail.includes('3,75')));assert.ok(!p.actions.some(a=>a.kind==='start'&&a.title.includes('Dapagliflozina')));
});
test('Finerenona: no asociar otro ARM y no extrapolar dosis de ERC-DM2',()=>{
 let c=proposalFixture();c=addNamedMedication(c,'Finerenona');c=addNamedMedication(c,'Espironolactona');assert.ok(medicationSafety(c).some(a=>a.id==='FIN-MRA'&&a.level==='red'));assert.equal(treatmentProposal(c).actions.length,0);
 assert.equal(medicationFamilyLabel({drug:'Finerenona'}),'ARM');
});
test('ESC 2026: FEVI 45% mantiene recomendación FMT aunque pauta concreta pendiente de auditoría',()=>{
 const p=treatmentProposal(proposalFixture(45));assert.equal(p.status,'conditional',JSON.stringify(p.blockers));
 assert.ok(p.actions.some(a=>a.title.includes('revisar tratamiento SRAA')&&a.detail.includes('clase I A')));
 assert.ok(p.actions.some(a=>a.title.includes('revisar betabloqueante')&&a.detail.includes('clase I A')));
 assert.ok(p.actions.some(a=>a.title.includes('ARM esteroideo')&&a.detail.includes('clase I A')));
 assert.ok(p.actions.some(a=>a.title.includes('Dapagliflozina')));
 assert.ok(!p.actions.some(a=>a.kind==='start'&&/bisoprolol|sacubitrilo/i.test(a.title)));
});


test('Auditoría: trimetoprim/cotrimoxazol con cada ARM registrado',()=>{
 for(const [drug,code] of [['Espironolactona','SPI-TMP'],['Eplerenona','EPL-TMP'],['Finerenona','FIN-TMP']]){
  let c=addNamedMedication(createClinicalContext(),drug);
  assert.ok(!medicationSafety(c).some(a=>a.id===code));
  c=addNamedMedication(c,'other');c=setMedicationField(c,'extra-2','name','Cotrimoxazol');
  assert.ok(medicationSafety(c).some(a=>a.id===code&&a.level==='amber'),drug);
  c=deleteRecordedMedication(c,'extra-2');assert.ok(!medicationSafety(c).some(a=>a.id===code));
 }
});
test('Auditoría: inhibidores fuertes CYP3A4 con eplerenona y finerenona',()=>{
 for(const [drug,code] of [['Eplerenona','EPL-CYP3A4'],['Finerenona','FIN-CYP3A4']]){
  let c=addNamedMedication(createClinicalContext(),drug);c=addNamedMedication(c,'other');
  c=setMedicationField(c,'extra-2','name','Claritromicina');
  assert.ok(medicationSafety(c).some(a=>a.id===code&&a.level==='red'));
  c=setMedicationField(c,'extra-2','name','Fármaco desconocido');
  assert.ok(!medicationSafety(c).some(a=>a.id===code));
  assert.equal(medicationSummary(c).reconciled,false);
 }
});
test('Auditoría: espironolactona, potasio confirmado y límites',()=>{
 let c=addNamedMedication(createClinicalContext(),'Espironolactona');
 c=setStudyResult(c,'egfr','65');c=setStudyResult(c,'potassium','5');
 c=confirmTreatmentLabs(c,true);
 assert.ok(!medicationSafety(c).some(a=>a.id==='SPI-K5'||a.id==='SPI-K6'));
 c=setStudyResult(c,'potassium','5,1');
 assert.ok(!medicationSafety(c).some(a=>a.id==='SPI-K5'));
 c=confirmTreatmentLabs(c,true);assert.ok(medicationSafety(c).some(a=>a.id==='SPI-K5'&&a.level==='amber'));
 c=setStudyResult(c,'potassium','6');c=confirmTreatmentLabs(c,true);
 assert.ok(medicationSafety(c).some(a=>a.id==='SPI-K6'&&a.level==='red'));
});
test('Auditoría: ARNI y aliskireno, FG confirmado inferior a 60',()=>{
 let c=addNamedMedication(createClinicalContext(),'Sacubitrilo/valsartán');
 c=addNamedMedication(c,'other');c=setMedicationField(c,'extra-2','name','Aliskireno');
 assert.ok(medicationSafety(c).some(a=>a.id==='ARNI-ALISK'&&a.level==='amber'));
 c=setStudyResult(c,'egfr','59');c=setStudyResult(c,'potassium','4,5');c=confirmTreatmentLabs(c,true);
 assert.ok(medicationSafety(c).some(a=>a.id==='ARNI-ALISK'&&a.level==='red'));
 c=setStudyResult(c,'egfr','60');c=confirmTreatmentLabs(c,true);
 assert.ok(medicationSafety(c).some(a=>a.id==='ARNI-ALISK'&&a.level==='amber'));
});
test('Auditoría: no extrapolar automáticamente indicaciones de ARM esteroideos a NYHA II',()=>{
 const p=treatmentProposal(proposalFixture(32));
 assert.equal(p.status,'conditional');
 assert.ok(p.actions.some(a=>a.kind==='review'&&a.title.includes('ARM esteroideo')));
 assert.ok(!p.actions.some(a=>a.kind==='start'&&/espironolactona|ARM esteroideo/i.test(a.title+' '+a.detail)));
});

test('ESC 2026 figura 4: BNP y prioridad por NT-proBNP superior a 2000',()=>{
 let c=setPeptide(createClinicalContext(),'context','outpatient');
 c=setPeptide(c,'nt','2001');assert.equal(interpretPeptide(c).id,'NP-04');assert.match(interpretPeptide(c).text,/2 semanas/);
 c=setPeptide(c,'nt','2000');assert.notEqual(interpretPeptide(c).id,'NP-04');
 c=setPeptide(c,'kind','bnp');c=setPeptide(c,'bnp','35');assert.equal(interpretPeptide(c).id,'NP-03');
});
test('ESC 2026 tabla 8: NYHA IV no exige síntomas en reposo',()=>{
 const choice=NYHA_OPTIONS.find(x=>x[0]==='IV');
 assert.match(choice[2],/Puede presentar síntomas en reposo/);
});
test('ESC 2026 tabla de recomendaciones 5: IC-FEp y SRAA como opción IIb C',()=>{
 const p=treatmentProposal(proposalFixture(55));assert.equal(p.status,'conditional',JSON.stringify(p.blockers));
 assert.ok(p.actions.some(a=>a.title.includes('valorar IECA, ARA-II o ARNI')&&a.detail.includes('IIb C')));
 assert.ok(p.actions.some(a=>a.title.includes('revisar elección de ARM')&&a.detail.includes('clase I A')));
});

test('ESC S4–S8: alertas de AINE, potasio y trimetoprim con tratamiento SRAA/ARM',()=>{
 const pair=(a,b)=>{let c=addNamedMedication(createClinicalContext(),a);c=addNamedMedication(c,'other');return setMedicationField(c,'extra-2','name',b);};
 for(const [a,b,id] of [['Enalapril','Ibuprofeno','ESC-NSAID'],['Candesartán','Cotrimoxazol','ESC-SRAA-TMP'],['Sacubitrilo/valsartán','Amilorida','ESC-SRAA-K'],['Espironolactona','Cloruro de potasio','ESC-MRA-K'],['Furosemida','Hidroclorotiazida','ESC-DIUR-COMB'],['Bisoprolol','Diltiazem','ESC-BB-NDHP']]){
  assert.ok(medicationSafety(pair(a,b)).some(x=>x.id===id&&x.level==='amber'),id);
  assert.ok(!medicationSafety(pair(a,'Fármaco desconocido')).some(x=>x.id===id),id);
 }
 assert.ok(!medicationSafety(pair('Enalapril','Ácido acetilsalicílico')).some(x=>x.id==='ESC-NSAID'));
});
test('ESC S6/S9: combinaciones de monitorización no equivalen a contraindicación',()=>{
 let c=addNamedMedication(createClinicalContext(),'Dapagliflozina');c=addNamedMedication(c,'Furosemida');
 assert.ok(medicationSafety(c).some(x=>x.id==='ESC-SGLT2-DIUR'&&x.level==='blue'));
 c=addNamedMedication(c,'other');c=setMedicationField(c,'extra-3','name','Insulina glargina');
 assert.ok(medicationSafety(c).some(x=>x.id==='ESC-SGLT2-HYPO'&&x.level==='blue'));
 c=addNamedMedication(createClinicalContext(),'Bisoprolol');c=addNamedMedication(c,'other');c=setMedicationField(c,'extra-2','name','Digoxina');
 assert.ok(medicationSafety(c).some(x=>x.id==='ESC-BB-RATE'&&x.level==='blue'));
 c=setTreatmentValue(c,'hr','49');assert.ok(medicationSafety(c).some(x=>x.id==='ESC-BB-RATE'&&x.level==='amber'));assert.ok(medicationSafety(c).some(x=>x.id==='ESC-BB-HR'));
 c=setTreatmentValue(c,'hr','50');assert.ok(!medicationSafety(c).some(x=>x.id==='ESC-BB-HR'));
});
test('ESC S8: triple bloqueo con espironolactona no pasa inadvertido',()=>{
 let c=createClinicalContext();for(const d of ['Enalapril','Candesartán','Espironolactona'])c=addNamedMedication(c,d);
 assert.ok(medicationSafety(c).some(x=>x.id==='ESC-TRIPLE-SRAA'&&x.level==='amber'));
});
test('Potasio crítico registrado no desaparece por falta de confirmación analítica',()=>{
 let c=proposalFixture();c=setTreatmentValue(c,'potassium','6');
 assert.equal(treatmentSafetyData(c).labsConfirmed,false);assert.equal(treatmentProposal(c).status,'urgent');
 assert.equal(treatmentProposal(c).actions.length,0);
});

test('Matriz de betabloqueantes: referencias de producto y escalones sin extrapolar dosis',()=>{
 for(const [drug,dose,frequency,to,days] of [['Bisoprolol','3,75','24',5,7],['Bisoprolol','5','24',7.5,28],['Carvedilol','12,5','12',25,14],['Metoprolol succinato','11,875','24',23.75,7],['Nebivolol','2,5','24',5,7]]){
  const step=betaBlockerReferenceStep({drug,dose,frequency});assert.equal(step.to,to);assert.equal(step.minDays,days);assert.ok(step.source&&step.product);
 }
 assert.equal(betaBlockerReferenceStep({drug:'Carvedilol',dose:'25',frequency:'12'}),null);
 assert.equal(betaBlockerReferenceStep({drug:'Bisoprolol',dose:'2,5',frequency:'12'}),null);
 assert.match(HF_TITRATION_REFERENCE['Metoprolol succinato'].source,/81030/);
});
test('FC 55 no bloquea todas las familias; FC 49 exige revisión global',()=>{
 let c=proposalFixture();c=setTreatmentValue(c,'hr','55');let p=treatmentProposal(c);
 assert.equal(p.status,'conditional');assert.ok(p.actions.some(a=>a.title.includes('revisar frecuencia cardiaca')));
 assert.ok(!p.actions.some(a=>a.kind==='start'&&a.title.includes('bisoprolol')));assert.ok(p.actions.some(a=>a.kind==='start'&&a.title.includes('Dapagliflozina')));
 c=setTreatmentValue(c,'hr','49');assert.equal(treatmentProposal(c).status,'review');
});
test('No reiniciar automáticamente una familia con contraindicación o intolerancia registrada',()=>{
 for(const group of ['bb','raas','mra','sglt2']){
  let c=proposalFixture();c=setMedicationField(c,group,'drug','none');c=setMedicationField(c,group,'reason','contraindication');c=confirmMedicationReview(c,true);
  const p=treatmentProposal(c);assert.ok(p.actions.some(a=>a.title.startsWith('Revisar motivo de ausencia')));
  const needles={bb:/bisoprolol/i,raas:/sacubitrilo/i,mra:/ARM/i,sglt2:/gliflozina/i};
  assert.ok(!p.actions.some(a=>a.kind==='start'&&needles[group].test(a.title)));
 }
});
test('iSGLT2: frontera de inicio distinta para cada molécula y alternativas no simultáneas',()=>{
 for(const [fg,dapa,empa] of [[19,false,false],[20,false,true],[24,false,true],[25,true,true]]){
  let c=proposalFixture();c=setTreatmentValue(c,'egfr',String(fg));c=confirmTreatmentLabs(c,true);
  const starts=treatmentProposal(c).actions.filter(a=>a.kind==='start');
  assert.equal(starts.some(a=>a.title.includes('Dapagliflozina')),dapa);assert.equal(starts.some(a=>a.title.includes('Empagliflozina')),empa);
  for(const a of starts.filter(a=>/gliflozina/.test(a.title)))assert.match(a.detail,/no asociar/);
 }
});
test('ARNI + aliskireno: diabetes registrada activa alerta roja incluso sin FG confirmado',()=>{
 let c=addNamedMedication(createClinicalContext(),'Sacubitrilo/valsartán');c=addNamedMedication(c,'other');c=setMedicationField(c,'extra-2','name','Aliskireno');
 c=updateFinding(c,'dm','yes');assert.ok(medicationSafety(c).some(a=>a.id==='ARNI-ALISK'&&a.level==='red'));
});

test('Inventario P3: cada molécula del catálogo tiene referencia de presentación',()=>{
 assert.deepEqual(Object.keys(HF_TITRATION_REFERENCE).sort(),Object.keys(HF_MEDICATION_REFERENCE).sort());
 for(const [drug,r] of Object.entries(HF_TITRATION_REFERENCE))assert.ok(r.product&&r.checks&&r.source&&r.frequency,drug);
});
test('ARM: tablas de IC no extrapoladas a ERC-DM2 ni con datos no confirmados',()=>{
 const base={drug:'Finerenona',indication:'hf40',potassium:5.5,dose:'10',frequency:'24',confirmed:true};
 assert.match(armPotassiumReference(base).reference,/interrupción/);
 assert.match(armPotassiumReference({...base,dose:'40'}).reference,/20 mg/);
 assert.equal(armPotassiumReference({...base,indication:'ckd-dm2'}),null);
 assert.equal(armPotassiumReference({...base,confirmed:false}),null);
 assert.equal(armPotassiumReference({...base,potassium:6}).kind,'interrupt');
 const e={...base,drug:'Eplerenona',indication:'hf',dose:'25',frequency:'48'};
 assert.match(armPotassiumReference(e).reference,/interrupción/);
 assert.match(armPotassiumReference({...e,frequency:'24'}).reference,/días alternos/);
 assert.equal(armPotassiumReference({...e,potassium:6}).kind,'interrupt');
 assert.equal(armPotassiumReference({...e,potassium:5.4}).kind,'review');
});
test('CIMA: interacciones adicionales específicas de ARM y bloqueo SRAA',()=>{
 const pair=(a,b)=>{let c=addNamedMedication(createClinicalContext(),a);c=addNamedMedication(c,'other');return setMedicationField(c,'extra-2','name',b);};
 for(const [a,b,id] of [['Eplerenona','Amilorida','EPL-KSP'],['Eplerenona','Cloruro de potasio','EPL-KSUP'],['Finerenona','Triamtereno','FIN-KSP'],['Finerenona','Rifampicina','FIN-IND']])assert.ok(medicationSafety(pair(a,b)).some(x=>x.id===id&&x.level==='red'),id);
 assert.ok(medicationSafety(pair('Eplerenona','Diltiazem')).some(x=>x.id==='EPL-MOD'&&x.level==='amber'));
 assert.ok(medicationSafety(updateFinding(pair('Enalapril','Aliskireno'),'dm','yes')).some(x=>x.id==='SRAA-ALISK'&&x.level==='red'));
});

test('ESC tabla 10: límites de apoyo ecocardiográfico, sexo y ritmo explícitos',()=>{
 let c=createClinicalContext();for(const [k,v] of [['lvmi','95'],['lavi','34'],['ee','9'],['trv','2,8'],['rwt','0,42'],['pasp','35']])c=setEcho(c,k,v);
 let m=echoSupportCriteria(c);assert.equal(m.metrics.find(x=>x.id==='lvmi').state,'unknown');assert.equal(m.metrics.find(x=>x.id==='lavi').state,'unknown');
 c=setEcho(c,'sex','female');c=setEcho(c,'rhythm','sinus');m=echoSupportCriteria(c);
 assert.equal(m.metrics.find(x=>x.id==='lvmi').state,'support');assert.equal(m.metrics.find(x=>x.id==='lavi').state,'not-reached');
 assert.equal(m.metrics.filter(x=>x.state==='support').length,1);assert.equal(m.diagnosisEstablished,false);
 c=setEcho(c,'sex','male');c=setEcho(c,'rhythm','af');c=setEcho(c,'lavi','40');c=setEcho(c,'ee','15');c=setEcho(c,'trv','2,81');
 m=echoSupportCriteria(c);assert.equal(m.metrics.find(x=>x.id==='lvmi').state,'not-reached');assert.equal(m.metrics.find(x=>x.id==='lavi').state,'not-reached');assert.equal(m.metrics.find(x=>x.id==='ee').state,'support');assert.equal(m.metrics.find(x=>x.id==='trv').state,'support');
 assert.notEqual(interpretEcho(c).integratedTitle,'IC confirmada');
});
test('Fenotipo: antecedente de IC-FEr y negación de FEVI histórica reducida son discordantes',()=>{
 let c=updateFinding(createClinicalContext(),'knownHF','yes');c=setEcho(c,'ef','55');c=setEcho(c,'priorReduced','no');c=setPhenotypeAssessment(c,'priorClinical','yes');c=setPhenotypeAssessment(c,'diastolicEvidence','yes');
 assert.equal(interpretPhenotype(c).conflict,true);
});
test('Péptidos: ARNI registrado orienta interpretación y explicita discordancia',()=>{
 let c=addNamedMedication(createClinicalContext(),'Sacubitrilo/valsartán');c=setPeptide(c,'kind','bnp');c=setPeptide(c,'context','outpatient');c=setPeptide(c,'bnp','35');
 assert.equal(peptideFactors(c).arni,'yes');assert.ok(interpretPeptide(c).notes.some(x=>/elevar BNP/.test(x)));
 c=setPeptide(c,'arni','no');assert.ok(interpretPeptide(c).notes.some(x=>/Discordancia/.test(x)));
});
