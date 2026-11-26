import test from 'node:test';
import assert from 'node:assert/strict';
import {GROUPS,createClinicalContext,updateFinding,evaluateSuspicion} from '../src/ic/suspicion.mjs';
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
