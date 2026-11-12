import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOURCES, gfrCategory, albuminuriaCategory,
  computeFib4, evaluateRenal, evaluateFib4
} from '../src/clinical/engine.mjs';

const draft = (values={},unavailable=[])=>({values,unavailable});
const goodContext = { fib4_contexto: 'Perfil de riesgo compatible con evaluación MASLD',
  fib4_agudo: 'No' };
const withFib4 = (age,ast,alt=25,plaquetas=200,extra={}) =>
  draft({edad:String(age),ast:String(ast),alt:String(alt),plaquetas:String(plaquetas),
    ...goodContext,...extra});
const fib4At = (age, target) => withFib4(age, (target*200*5)/age);

test('se conservan referencias y versiones por cálculo',()=>{
  assert.equal(SOURCES.kdigo2024.year,2024);
  assert.equal(SOURCES.easl2024.year,2024);
  assert.match(SOURCES.kdigo2024.url,/kdigo\.org/);
});
test('KDIGO G: límites exactos y valores contiguos',()=>{
  const pairs=[[140,'G1'],[90,'G1'],[89.9,'G2'],[60,'G2'],
    [59.99,'G3a'],[45,'G3a'],[44.99,'G3b'],[30,'G3b'],
    [29.99,'G4'],[15,'G4'],[14.99,'G5']];
  for(const [value,expected] of pairs) assert.equal(gfrCategory(value),expected, String(value));
  for(const value of [0,-1,Infinity,NaN,null,'45']) assert.equal(gfrCategory(value),null);
});
test('KDIGO A: límites exactos 30 y 300 mg/g',()=>{
  const cases=[[0,'A1'],[29.99,'A1'],[30,'A2'],[299.99,'A2'],[300,'A3'],[300.01,'A3']];
  for(const [value,expected] of cases) assert.equal(albuminuriaCategory(value),expected,String(value));
  for(const value of [-1,Infinity,NaN,null,'30']) assert.equal(albuminuriaCategory(value),null);
});
test('un único valor renal nunca confirma cronicidad',()=>{
  const x=evaluateRenal(draft({tfge:'52',cac:'78',unidad_cac:'mg/g'}));
  assert.equal(x.status,'calculated');
  assert.deepEqual(x.categories,{gfr:'G3a',albuminuria:'A2'});
  assert.equal(x.chronicConfirmed,false);
  assert.match(x.message,/No se ha documentado cronicidad/);
});
test('marcar cronicidad no inventa causa ni otros criterios de ERC',()=>{
  const x=evaluateRenal(draft({tfge:'94',cac:'14',unidad_cac:'mg/g',persistencia:'Sí'}));
  assert.equal(x.status,'calculated');
  assert.equal(x.markerPresent,false);
  assert.match(x.message,/No se identifican criterios/);
});
test('clasificación renal con cronicidad confirmada por declaración',()=>{
  const x=evaluateRenal(draft({tfge:'29',cac:'301',unidad_cac:'mg/g',persistencia:'Sí'}));
  assert.equal(x.status,'calculated');
  assert.deepEqual(x.categories,{gfr:'G4',albuminuria:'A3'});
  assert.equal(x.markerPresent,true);
  assert.match(x.message,/comprobar causa/);
});
test('ausencia, indisponibilidad, cero y texto inválido no producen categorías falsas',()=>{
  const empty=evaluateRenal(draft());
  assert.equal(empty.status,'missing');
  assert.equal(empty.categories.gfr,null);
  const one=evaluateRenal(draft({cac:'30',unidad_cac:'mg/g'},['tfge']));
  assert.equal(one.status,'partial');
  assert.equal(one.categories.gfr,null);
  assert.equal(one.categories.albuminuria,'A2');
  const bad=evaluateRenal(draft({tfge:'0',cac:'NaN'}));
  assert.equal(bad.status,'invalid');
  assert.equal(bad.categories.gfr,null);
  assert.equal(bad.categories.albuminuria,null);
});
test('fórmula FIB-4 reproduce cálculo independiente de etiquetas',()=>{
  assert.equal(computeFib4(50,40,25,200),2);
  assert.equal(computeFib4(30,40,25,200),1.2);
  assert.equal(computeFib4(50,40,0,200),null);
  assert.equal(computeFib4(50,40,25,0),null);
  assert.equal(computeFib4(17,40,25,200),null);
  assert.equal(computeFib4(50.5,40,25,200),null);
});
test('FIB-4 intermedio, menos de umbral y mayor que 2,67',()=>{
  const mid=evaluateFib4(withFib4(50,40));
  assert.equal(mid.status,'calculated');
  assert.equal(mid.value,2);
  assert.equal(mid.interpretation,'additional_assessment');
  assert.equal(mid.lowCutoff,1.3);
  const low=evaluateFib4(fib4At(50,1.299));
  assert.equal(low.interpretation,'lower_probability');
  const high=evaluateFib4(fib4At(50,2.68));
  assert.equal(high.interpretation,'higher_probability');
});
test('FIB-4 cambia umbral por edad mayor de 65, sin alterar la fórmula',()=>{
  const age64=evaluateFib4(fib4At(64,1.5));
  const age65=evaluateFib4(fib4At(65,1.5));
  const age66=evaluateFib4(fib4At(66,1.5));
  assert.equal(age64.interpretation,'additional_assessment');
  assert.equal(age65.interpretation,'additional_assessment'); // guía usa >65
  assert.equal(age66.interpretation,'lower_probability');
  assert.equal(age66.lowCutoff,2);
  assert.equal(age66.value,1.5);
});
test('FIB-4 sin validez en menos de 35 aunque pueda calcularse',()=>{
  const x=evaluateFib4(withFib4(30,40));
  assert.equal(x.status,'calculated');
  assert.equal(x.interpretation,'age_limited');
});
test('FIB-4 no se interpreta durante enfermedad aguda ni con contexto desconocido',()=>{
  const acute=evaluateFib4(withFib4(50,40,25,200,{fib4_agudo:'Sí'}));
  assert.equal(acute.interpretation,'acute');
  assert.equal(acute.value,2);
  const unknown=evaluateFib4(withFib4(50,40,25,200,{fib4_contexto:'No consta'}));
  assert.equal(unknown.interpretation,'context_missing');
  const missing=evaluateFib4(withFib4(50,40,25,200,{fib4_agudo:''}));
  assert.equal(missing.interpretation,'context_missing');
});
test('datos ausentes o inválidos no generan FIB-4; valor informado separado',()=>{
  const missing=evaluateFib4(draft({edad:'50',fib4_informado:'3.2'}));
  assert.equal(missing.status,'missing');
  assert.equal(missing.value,null);
  assert.equal(missing.reported.value,3.2);
  const invalid=evaluateFib4(withFib4(50,40,0));
  assert.equal(invalid.status,'invalid');
  assert.equal(invalid.value,null);
  const missingPlatelets=evaluateFib4(draft({edad:'50',ast:'40',alt:'25'}));
  assert.equal(missingPlatelets.value,null);
});
