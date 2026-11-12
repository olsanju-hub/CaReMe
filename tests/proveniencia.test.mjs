import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft,setValue,fieldState } from '../src/model.mjs';
import { auditProvenance } from '../src/clinical/proveniencia.mjs';
import { auditCrossDomain } from '../src/clinical/auditoria.mjs';
import { evaluateRenal,evaluateFib4 } from '../src/clinical/engine.mjs';
import { integratePatient } from '../src/clinical/integracion.mjs';
import { reviewDrug } from '../src/clinical/farmacologia.mjs';

const draft=(values={})=>Object.entries(values).reduce((s,[key,value])=>setValue(s,key,String(value)),createDraft());
const sample={fecha_evaluacion:'2026-11-12',tfge:'53',cac:'100',
  unidad_cac:'mg/g',fecha_tfge:'2026-11-10',fecha_cac:'2026-11-08',
  potasio:'4.4',fecha_potasio:'2026-11-10',
  dm2:'Sí',erc:'Sí',persistencia:'Sí',ic:'Sí',farmacos_clases:'["Sin tratamiento farmacológico"]'};
test('ISO valida día real; entradas de fechas mal formadas se bloquean antes de decidir',()=>{
 assert.equal(fieldState(draft({fecha_evaluacion:'2026-02-28'}),'fecha_evaluacion'),'registrado');
 assert.equal(fieldState(draft({fecha_evaluacion:'2028-02-29'}),'fecha_evaluacion'),'registrado');
 for(const value of ['2026-02-30','2025-02-29','2026-13-01','12/11/2026']){
  const x=draft({fecha_evaluacion:value});
  assert.equal(fieldState(x,'fecha_evaluacion'),'revisar',value);
  assert.ok(auditCrossDomain(x).critical.some(f=>f.id==='CLINICAL_FIELD_INVALID_fecha_evaluacion'));
 }
});
test('fecha de TFGe posterior a evaluación bloquea candidatos y monografías',()=>{
 const d=draft({...sample,fecha_tfge:'2026-11-13'});
 const provenance=auditProvenance(d);
 assert.equal(provenance.status,'critical');
 assert.ok(provenance.findings.some(f=>f.id==='DATE_AFTER_EVALUATION_tfge'));
 const result=integratePatient(d);
 assert.equal(result.options.length,0);
 assert.ok(result.alerts.some(x=>x.id==='AUDIT-DATE_AFTER_EVALUATION_tfge'));
 assert.equal(reviewDrug(d,'dapagliflozina','erc').state,'bloqueo');
 assert.equal(evaluateRenal(d).categories.gfr,null);
});
test('fecha posterior de potasio también bloquea elección farmacológica, sin considerarlo actual',()=>{
 const d=draft({...sample,fecha_potasio:'2026-12-02'});
 assert.ok(auditCrossDomain(d).critical.some(x=>x.id==='DATE_AFTER_EVALUATION_potasio'));
 assert.equal(reviewDrug(d,'finerenona','erc_dm2').state,'bloqueo');
});
test('CAC expresado en mg/mmol no se confunde con mg/g ni se convierte sin regla',()=>{
 const d=draft({...sample,unidad_cac:'mg/mmol',cac:'3.0'});
 const renal=evaluateRenal(d);
 assert.equal(renal.categories.albuminuria,null);
 assert.notEqual(renal.status,'calculated');
 assert.ok(auditCrossDomain(d).critical.some(x=>x.id==='CAC_UNIT_INCOMPATIBLE'));
 assert.equal(reviewDrug(d,'finerenona','erc_dm2').state,'bloqueo');
});
test('cuando la unidad explícita es mg/g se conserva A2 y no hay veto de unidad',()=>{
 const d=draft(sample);
 assert.equal(evaluateRenal(d).categories.albuminuria,'A2');
 assert.equal(auditProvenance(d).cacInMgG,true);
 assert.equal(auditCrossDomain(d).critical.length,0);
});
test('FIB-4 no debe calcularse a partir de AST ALT plaquetas de distintas fechas',()=>{
 const values={edad:'55',ast:'40',alt:'25',plaquetas:'200',
  fib4_contexto:'Perfil de riesgo compatible con evaluación MASLD',fib4_agudo:'No',
  fecha_evaluacion:'2026-11-12',fecha_ast:'2026-11-10',
  fecha_alt:'2026-11-10',fecha_plaquetas:'2026-11-08'};
 const d=draft(values);
 assert.equal(evaluateFib4(d).status,'not_comparable');
 assert.equal(evaluateFib4(d).value,null);
 assert.ok(auditProvenance(d).findings.some(x=>x.id==='FIB4_DIFFERENT_DATES'));
 const equal=draft({...values,fecha_plaquetas:'2026-11-10'});
 assert.equal(evaluateFib4(equal).status,'calculated');
 assert.equal(evaluateFib4(equal).value,2.2);
});
test('dos fechas hepáticas incompatibles bloquean FIB-4 aunque falte fecha de plaquetas',()=>{
 const d=draft({edad:'55',ast:'40',alt:'25',plaquetas:'200',
  fecha_ast:'2026-11-10',fecha_alt:'2026-11-08'});
 assert.equal(evaluateFib4(d).status,'not_comparable');
 assert.equal(evaluateFib4(d).value,null);
 assert.ok(auditProvenance(d).findings.some(x=>x.id==='FIB4_DIFFERENT_DATES'));
});
test('fecha hepática posterior a evaluación bloquea índice aun con las tres fechas iguales',()=>{
 const d=draft({edad:55,ast:40,alt:25,plaquetas:200,
  fecha_evaluacion:'2026-11-12',fecha_ast:'2026-11-13',
  fecha_alt:'2026-11-13',fecha_plaquetas:'2026-11-13'});
 assert.equal(evaluateFib4(d).status,'not_comparable');
 assert.equal(evaluateFib4(d).value,null);
});
test('si no hay fechas no se afirma actualidad ni se inventa antigüedad',()=>{
 const d=draft({tfge:55,cac:90,unidad_cac:'mg/g',ast:40,alt:25,plaquetas:200,edad:55});
 const provenance=auditProvenance(d);
 assert.ok(provenance.undated.includes('TFGe'));
 assert.ok(provenance.undated.includes('CAC'));
 assert.equal(provenance.asOf,null);
 assert.equal(provenance.status,'clear');
 assert.match(provenance.message,/ausencia de fecha no confirma actualidad/);
});
test('peso talla e IMC discordantes se señalan como control de entrada, sin diagnóstico',()=>{
 const d=draft({peso:'90',talla:'180',imc:'32'});
 const report=auditProvenance(d);
 assert.ok(report.findings.some(f=>f.id==='BMI_INCONSISTENT'));
 assert.ok(report.bmiCalculated>27 && report.bmiCalculated<28);
 assert.equal(report.status,'review');
 const consistent=auditProvenance(draft({peso:'90',talla:'180',imc:'27.8'}));
 assert.ok(!consistent.findings.some(f=>f.id==='BMI_INCONSISTENT'));
});
test('fecha de medición sin cifra no se convierte en normal ni bloquea otras secciones',()=>{
 const d=draft({fecha_potasio:'2026-11-10',fecha_evaluacion:'2026-11-12'});
 const r=auditProvenance(d);
 assert.ok(r.findings.some(f=>f.id==='DATE_WITHOUT_VALUE_potasio'));
 assert.equal(r.status,'review');
});
