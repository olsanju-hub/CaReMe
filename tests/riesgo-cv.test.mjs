import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue,setUnavailable} from '../src/model.mjs';
import {computeScore2Low,evaluateCvRisk,CV_FIELDS} from '../src/clinical/riesgo-cv.mjs';
const base={edad:'50',cv_sexo_modelo:'Hombre',cv_region:'España · región ESC de riesgo bajo',
 tabaco:'Actual',ecv:'No',ic:'No',dm1:'No',dm2:'No',erc:'No',embarazo:'No procede',
 cv_hfamiliar:'No',cv_sintomas:'No',pas:'140',pad:'85',fecha_pas:'2026-11-12',
 colesterol_total:String(5.5*38.67),hdl:String(1.3*38.67),ldl:'130',fecha_lipidos:'2026-11-10',fecha_evaluacion:'2026-11-12'};
const draft=(v={})=>Object.entries({...base,...v}).reduce((d,[k,x])=>setValue(d,k,String(x)),createDraft());
const run=(v={})=>evaluateCvRisk(draft(v));
test('reproduce ejemplo externo del artículo SCORE2 (EHJ 2021): hombre 5.9%, mujer 4.2%',()=>{
 // Ejemplo publicado, no generado desde esta implementación. Precisión editorial: una decimal.
 assert.equal(run().percent.toFixed(1),'5.9');
 assert.equal(run({cv_sexo_modelo:'Mujer'}).percent.toFixed(1),'4.2');
 assert.equal(run().model,'SCORE2');assert.equal(run().horizonYears,10);
 assert.equal(run().ckmStage,null);assert.equal(run().prescription,null);
});
for(const age of ['40','69'])test('frontera elegible '+age,()=>assert.ok(run({edad:age}).percent>0));
for(const [v,route] of [
 [{edad:'39'},'fuera_de_edad'],[{edad:'70'},'score2_op_pendiente'],[{edad:'89'},'score2_op_pendiente'],
 [{dm2:'Sí'},'score2_diabetes_pendiente'],[{dm1:'Sí'},'circuito_especifico'],[{embarazo:'Sí'},'circuito_especifico'],
 [{ecv:'Sí'},'enfermedad_establecida'],[{ic:'Sí'},'insuficiencia_cardiaca'],
 [{erc:'Sí'},'evaluacion_renal'],[{tfge:'59'},'evaluacion_renal'],
 [{cac:'30',unidad_cac:'mg/g'},'evaluacion_renal'],
 [{cv_hfamiliar:'Sí'},'factor_individual'],[{ldl:'190'},'factor_individual'],
 [{pas:'180'},'valoracion_prioritaria'],[{pad:'110'},'valoracion_prioritaria'],[{cv_sintomas:'Sí'},'valoracion_prioritaria']])
 test('elige circuito sin porcentaje '+JSON.stringify(v),()=>{const r=run(v);assert.equal(r.route,route);assert.equal(r.percent,null)});
for(const id of CV_FIELDS)test('dato ausente no se sustituye silenciosamente: '+id,()=>assert.equal(run({[id]:''}).percent,null));
test('un dato marcado no disponible tampoco se convierte en normal',()=>assert.equal(evaluateCvRisk(setUnavailable(draft(),'tabaco',true)).percent,null));
test('exfumador y nunca se tratan como no fumador actual',()=>assert.equal(run({tabaco:'Exfumador'}).percent,run({tabaco:'Nunca'}).percent));
test('el riesgo varía en la dirección esperada con tabaco y presión',()=>{
 assert.ok(run().percent>run({tabaco:'Nunca'}).percent);
 assert.ok(run({pas:'160'}).percent>run().percent);
});
for(const v of [{cv_region:'Otra región / no confirmada'},{cv_hfamiliar:'No valorada'},{cv_sintomas:'No valorados'},
 {fecha_pas:'2026-11-13'},{fecha_lipidos:'2026-11-13'},{fecha_lipidos:'2026-02-30'},
 {hdl:'250'},{colesterol_total:'0'},{pas:'0'},{pad:'145'},{ldl:'250',colesterol_total:'200'},
 {edad:'0x32'},{hdl:'0x32'}])
 test('no calcula con incoherencia/exclusión '+JSON.stringify(v),()=>assert.equal(run(v).percent,null));
test('no emite SCORE2 simple en ERC con diabetes',()=>{const r=run({erc:'Sí',dm2:'Sí'});assert.equal(r.percent,null);assert.ok(r.steps.some(x=>x.includes('SCORE2-Diabetes')))});
test('K crítico en la ficha retiene cálculo preventivo aunque el resto sea completo',()=>assert.equal(run({potasio:'6.5'}).percent,null));
test('helper matemático no extrapola edad, sexo o tipos desconocidos',()=>{
 const v={age:50,sex:'Hombre',smoker:false,sbp:140,totalMmol:5.5,hdlMmol:1.3};
 for(const x of [{age:70},{age:39},{sex:'Otro'},{smoker:'No'},{totalMmol:Infinity},{hdlMmol:6}])assert.equal(computeScore2Low({...v,...x}),null);
});
