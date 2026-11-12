import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft, setValue } from '../src/model.mjs';
import {
  reviewFinerenoneContinuation, reviewEmpagliflozinContinuation,
  confirmedAction, followUpFromHistory
} from '../src/clinical/continuidad.mjs';

const patient=(values={})=>Object.entries(values).reduce((acc,[k,v])=>setValue(acc,k,v),createDraft());
const fin={
  fin_estado:'En tratamiento',fin_dosis_actual:'10',fin_tfge_inicio:'65',
  fin_tfge_previa:'60',tfge:'60',potasio:'4.7'
};
const hf=(v={})=>patient({...fin,...v});
const ck=(v={})=>patient({...fin,...v});
const emp={
  emp_estado:'En tratamiento',emp_dosis_actual:'10',tfge:'65',
  situacion_aguda:'Estable sin proceso agudo grave',cetoacidosis_sospecha:'No'
};
const er=(v={})=>patient({...emp,...v});

test('ERC-DM2 tabla 2: K≤4,8, K>4,8 a 5,5, K>5,5; 10 y 20 mg',()=>{
  assert.equal(reviewFinerenoneContinuation(ck(),'erc_dm2').ruleId,'FIN-CKD-UPTITRATE');
  assert.equal(reviewFinerenoneContinuation(ck({fin_dosis_actual:'20'}),'erc_dm2').ruleId,'FIN-CKD-MAINTAIN');
  assert.equal(reviewFinerenoneContinuation(ck({potasio:'4.8'}),'erc_dm2').ruleId,'FIN-CKD-UPTITRATE');
  assert.equal(reviewFinerenoneContinuation(ck({potasio:'4.81'}),'erc_dm2').ruleId,'FIN-CKD-MAINTAIN');
  assert.equal(reviewFinerenoneContinuation(ck({potasio:'5.5'}),'erc_dm2').ruleId,'FIN-CKD-MAINTAIN');
  assert.equal(reviewFinerenoneContinuation(ck({potasio:'5.51'}),'erc_dm2').ruleId,'FIN-POTASSIUM-PRIORITY');
});
test('ERC-DM2 descenso TFGe >30 % impide subida, 30 % exactos no',()=>{
  assert.equal(reviewFinerenoneContinuation(ck({fin_tfge_previa:'100',tfge:'70'}),'erc_dm2').ruleId,'FIN-CKD-UPTITRATE');
  assert.equal(reviewFinerenoneContinuation(ck({fin_tfge_previa:'100',tfge:'69.9'}),'erc_dm2').ruleId,'FIN-CKD-EGFR-FALL');
  assert.equal(reviewFinerenoneContinuation(ck({fin_tfge_previa:''}),'erc_dm2').state,'datos_insuficientes');
});
test('IC tabla 4: fronteras K 5,0, 5,5 y 6,0 según dosis actual',()=>{
  const expectations=[
    ['4.99','10','FIN-HF-UP20'], ['5.0','10','FIN-HF-K50-MAINTAIN'],
    ['5.49','20','FIN-HF-K50-MAINTAIN'],
    ['5.5','10','FIN-HF-K55-HOLD'],
    ['5.5','20','FIN-HF-K55-REDUCE10'],
    ['5.5','40','FIN-HF-K55-REDUCE20'],
    ['5.99','20','FIN-HF-K55-REDUCE10'],
    ['6.0','20','FIN-POTASSIUM-PRIORITY']
  ];
  for(const [k,dose,id] of expectations) {
    const x=reviewFinerenoneContinuation(hf({potasio:k,fin_dosis_actual:dose}),'ic_fevi40');
    assert.equal(x.ruleId,id,`K=${k}, dose=${dose}`);
  }
});
test('IC controla 30 % y 40 % de descenso renal y TFGe inicial',()=>{
  assert.equal(reviewFinerenoneContinuation(hf({fin_dosis_actual:'20',fin_tfge_inicio:'55'}),'ic_fevi40').ruleId,'FIN-HF-20-TARGET');
  assert.equal(reviewFinerenoneContinuation(hf({fin_dosis_actual:'20',fin_tfge_previa:'100',tfge:'69.9'}),'ic_fevi40').ruleId,'FIN-HF-GFR30');
  assert.equal(reviewFinerenoneContinuation(hf({fin_dosis_actual:'40',fin_tfge_previa:'100',tfge:'69.9'}),'ic_fevi40').ruleId,'FIN-HF-40-EGFR30');
  assert.equal(reviewFinerenoneContinuation(hf({fin_dosis_actual:'20',fin_tfge_previa:'100',tfge:'59.9'}),'ic_fevi40').ruleId,'FIN-HF-GFR40');
  assert.equal(reviewFinerenoneContinuation(hf({fin_dosis_actual:'40',fin_tfge_inicio:'55'}),'ic_fevi40').ruleId,'FIN-HF-40-INITIAL-GFR');
});
test('alerta de hiperpotasemia no queda oculta por TFGe inicial ausente',()=>{
  const x=reviewFinerenoneContinuation(hf({fin_tfge_inicio:'',potasio:'6.1'}),'ic_fevi40');
  assert.equal(x.state,'alerta');
  assert.equal(x.ruleId,'FIN-POTASSIUM-PRIORITY');
  const y=reviewFinerenoneContinuation(hf({fin_dosis_actual:'',potasio:'5.8'}),'ic_fevi40');
  assert.equal(y.ruleId,'FIN-HF-K55-UNKNOWN-DOSE');
});
test('ERC: 40mg actual no se confunde con dosis renal; TFGe <15 alerta',()=>{
  assert.equal(reviewFinerenoneContinuation(ck({fin_dosis_actual:'40'}),'erc_dm2').ruleId,'FIN-CKD-DOSE-INVALID');
  assert.equal(reviewFinerenoneContinuation(ck({tfge:'14.99'}),'erc_dm2').ruleId,'FIN-ESKD');
});
test('tratamiento interrumpido no genera titulación ni reinicio automático',()=>{
  const x=reviewFinerenoneContinuation(ck({fin_estado:'Interrumpido'}),'erc_dm2');
  assert.equal(x.ruleId,'FIN-RESTART-CONTEXT');
  assert.equal(x.patientDose,null);
  assert.equal(x.actionPerformed,false);
});
test('empagliflozina: alto riesgo agudo y cetoacidosis tienen prioridad',()=>{
  assert.equal(reviewEmpagliflozinContinuation(er({cetoacidosis_sospecha:'Sí'}),'ic').ruleId,'EMP-DKA');
  assert.equal(reviewEmpagliflozinContinuation(er({situacion_aguda:'Enfermedad aguda grave'}),'ic').ruleId,'EMP-ACUTE-HOLD');
  assert.equal(reviewEmpagliflozinContinuation(er({situacion_aguda:'Cirugía mayor o ayuno prolongado'}),'erc').ruleId,'EMP-ACUTE-HOLD');
});
test('empagliflozina: no reinicio sin cetonas y estabilidad, ni tras CAD no resuelta',()=>{
  const base={emp_estado:'Interrumpido',emp_cetonas:'Normales',emp_estable:'Sí',
    situacion_aguda:'Estable sin proceso agudo grave',cetoacidosis_sospecha:'No'};
  assert.equal(reviewEmpagliflozinContinuation(er({...base,emp_cetonas:'Elevadas'}),'erc').ruleId,'EMP-RESTART-UNCONFIRMED');
  assert.equal(reviewEmpagliflozinContinuation(er({...base,emp_estable:'No'}),'erc').ruleId,'EMP-RESTART-UNCONFIRMED');
  assert.equal(reviewEmpagliflozinContinuation(er({...base,emp_dka_previa:'Sí',emp_factor_resuelto:'No'}),'erc').ruleId,'EMP-PRIOR-DKA');
  assert.equal(reviewEmpagliflozinContinuation(er({...base}),'erc').ruleId,'EMP-RESTART-REVIEW');
});
test('empagliflozina 25 mg solo como referencia DM2, no IC/ ERC',()=>{
  const med=er({emp_control_insuficiente:'Sí',emp_tolerancia:'Sí'});
  assert.equal(reviewEmpagliflozinContinuation(med,'dm2').ruleId,'EMP-DM2-25-CONSIDER');
  assert.equal(reviewEmpagliflozinContinuation(med,'ic').ruleId,'EMP-CONTINUE-REVIEW');
  assert.equal(reviewEmpagliflozinContinuation(er({emp_dosis_actual:'25'}),'erc').ruleId,'EMP-25-VERIFY');
});
test('la app no registra acciones sin confirmación explícita ni fecha válida',()=>{
  const raw={drugId:'finerenona',routeId:'erc_dm2',type:'inicio',performedOn:'2026-11-12',doseMg:10};
  assert.throws(()=>confirmedAction([],raw),/confirmación explícita/);
  assert.throws(()=>confirmedAction([],{...raw,confirmedByClinician:true,performedOn:'2026-02-30'}),/Fecha/);
  assert.throws(()=>confirmedAction([],{...raw,confirmedByClinician:true,routeId:'dm2'}),/Indicación/);
  const history=confirmedAction([],{...raw,confirmedByClinician:true});
  assert.equal(history.length,1); assert.equal(history[0].confirmed,true);
  assert.equal(history[0].doseMg,10);
  assert.throws(()=>confirmedAction([],{...raw,doseMg:null,confirmedByClinician:true}),/dosis/);
  assert.deepEqual(followUpFromHistory([]),[]);
});
test('4 semanas de finerenona solo tras inicio/reinicio/ajuste efectivamente confirmados',()=>{
  const event=(type,date)=>({drugId:'finerenona',routeId:'erc_dm2',type,performedOn:date,doseMg:type==='interrupcion'?null:10,confirmedByClinician:true});
  let history=[];
  history=confirmedAction(history,event('inicio','2026-11-12'));
  history=confirmedAction(history,event('ajuste','2027-01-15'));
  history=confirmedAction(history,event('interrupcion','2027-03-01'));
  const checks=followUpFromHistory(history);
  assert.equal(checks[0].dueOn,'2026-12-10');
  assert.equal(checks[1].dueOn,'2027-02-12');
  assert.equal(checks[2].dueOn,null);
  assert.equal(checks[0].description,'Control de potasio sérico y TFGe a las 4 semanas');
});
test('un ajuste o interrupción confirmado sustituye controles futuros previos',()=>{
  let h=[];
  const done=(type,date,dose=10)=>({drugId:'finerenona',routeId:'erc_dm2',
    type,performedOn:date,doseMg:dose,confirmedByClinician:true});
  h=confirmedAction(h,done('inicio','2026-11-12'));
  h=confirmedAction(h,done('ajuste','2026-11-20',20));
  h=confirmedAction(h,done('interrupcion','2026-11-25',null));
  const follow=followUpFromHistory(h);
  assert.equal(follow[0].dueOn,'2026-12-10');
  assert.equal(follow[0].status,'sustituido');
  assert.equal(follow[1].dueOn,'2026-12-18');
  assert.equal(follow[1].status,'sustituido');
  assert.equal(follow[2].dueOn,null);
  assert.equal(follow[2].status,'requiere_reevaluacion');
});
test('anual de empagliflozina solo tras acción confirmada, manejando 29 de febrero',()=>{
  let h=confirmedAction([],{drugId:'empagliflozina',routeId:'erc',type:'inicio',performedOn:'2028-02-29',doseMg:10,confirmedByClinician:true});
  const x=followUpFromHistory(h);
  assert.equal(x[0].dueOn,'2029-02-28');
  h=confirmedAction(h,{drugId:'empagliflozina',routeId:'erc',type:'interrupcion',performedOn:'2028-03-05',confirmedByClinician:true});
  assert.equal(followUpFromHistory(h)[1].dueOn,null);
});
test('todas las salidas conservan el estado no prescriptivo',()=>{
  for(const result of [
    reviewFinerenoneContinuation(ck(),'erc_dm2'),
    reviewFinerenoneContinuation(hf(),'ic_fevi40'),
    reviewEmpagliflozinContinuation(er(),'dm2')
  ]) {
    assert.equal(result.patientDose,null);
    assert.equal(result.prescription,null);
    assert.equal(result.actionPerformed,false);
    assert.ok(result.source?.url?.startsWith('https://cima.aemps.es'));
  }
});
