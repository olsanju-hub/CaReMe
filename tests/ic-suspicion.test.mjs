import test from 'node:test';
import assert from 'node:assert/strict';
import {GROUPS,createClinicalContext,updateFinding,evaluateSuspicion,setGroupReviewed,isGroupReviewed,toggleFinding,setEvaluationReviewed,isEvaluationReviewed,diagnosticNext,diagnosticAction,setStudyResult,investigationPlan,interpretSuspicion,CLINICAL_DIMENSIONS,labPlan,setPeptide,interpretPeptide,peptideFactors,ECHO_FINDINGS,ECHO_NUMERIC,setEcho,interpretEcho,setStageAssessment,interpretStage,setPhenotypeAssessment,interpretPhenotype,NYHA_OPTIONS,setNyha,interpretNyha,SITUATION_QUESTIONS,setSituation,interpretSituation} from '../src/ic/suspicion.mjs';
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
 assert.equal(run(68,34,'outpatient','bnp').id,'NP-01');assert.equal(run(68,35,'outpatient','bnp').id,'NP-02');assert.equal(run(68,99,'acute','bnp').id,'NP-01');assert.equal(run(68,100,'acute','bnp').id,'NP-02');
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
