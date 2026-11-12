import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue} from '../src/model.mjs';
import {compareIndividualGoal,evaluateDm2Detail,DM2_DETAIL_SOURCES} from '../src/clinical/dm2-detallada.mjs';

const draft=(values={})=>Object.entries(values).reduce((d,[key,value])=>
 setValue(d,key,Array.isArray(value)?JSON.stringify(value):String(value)),createDraft());
const base={
 dm2:'Sí',dm1:'No',hba1c:'7.8',dm_objetivo_valor:'7',
 dm_hba1c_fiable:'Fiable tras comprobación',fecha_hba1c:'2026-11-10',
 fecha_evaluacion:'2026-11-12',dm_sintomas:'Ausentes',dm_hipoglucemias:'No referidas',
 dm_adherencia:'Adecuada confirmada',dm_dosis_confirmadas:'Sí',
 medicacion_revisada:'Sí',alergias_revisadas:'Sí',
 farmacos_clases:['Metformina'],tfge:'72',fecha_tfge:'2026-11-10',
 situacion_aguda:'Estable sin proceso agudo grave',cetoacidosis_sospecha:'No'
};
const review=changes=>evaluateDm2Detail(draft({...base,...changes}));
test('aritmética objetivo individual: menor, igual y diferencia 1.5',()=>{
 assert.deepEqual(compareIndividualGoal(6.99,7),{
  hba1c:6.99,upperLimit:7,difference:-0.01,state:'en_objetivo',
  atLeastOnePointFiveAbove:false});
 assert.equal(compareIndividualGoal(7,7).state,'fuera_objetivo');
 assert.equal(compareIndividualGoal(8.49,7).atLeastOnePointFiveAbove,false);
 assert.equal(compareIndividualGoal(8.5,7).atLeastOnePointFiveAbove,true);
 assert.equal(compareIndividualGoal(NaN,7),null);
 assert.equal(compareIndividualGoal(7,0),null);
});
test('DM2 fuera de objetivo con medicación conciliada devuelve opciones no prescriptivas',()=>{
 const x=review();
 assert.equal(x.state,'revision_pendiente');
 assert.equal(x.objective.comparison.difference,0.8);
 assert.equal(x.medicationSummary.count,1);
 assert.equal(x.medicationSummary.dosesConfirmed,true);
 assert.ok(x.nextSteps.some(s=>s.includes('Una clase')||s.includes('una clase')));
 assert.ok(x.alternatives.some(o=>o.id==='DM2-DETAIL-METFORMIN-EXISTING'));
 assert.ok(x.alternatives.every(o=>o.patientDose===null&&o.prescription===null&&!o.actionPerformed));
 assert.equal(x.patientDose,null);assert.equal(x.prescription,null);
});
test('diferencia de 1.5 puntos sugiere valorar combinación, sin orden automática',()=>{
 const a=review({hba1c:'8.49'});
 assert.equal(a.state,'revision_pendiente');
 assert.ok(!a.nextSteps.some(s=>s.includes('≥1,5')));
 const b=review({hba1c:'8.5'});
 assert.ok(b.nextSteps.some(s=>s.includes('≥1,5')));
 assert.ok(b.alternatives.every(o=>o.state==='candidato_para_revision'));
});
test('HbA1c en objetivo permite revisar beneficio cardiorrenal independiente',()=>{
 const x=review({hba1c:'6.5',ic:'Sí',erc:'Sí',persistencia:'Sí',
   cac:'190',unidad_cac:'mg/g',farmacos_clases:['Metformina']});
 assert.equal(x.objective.comparison.state,'en_objetivo');
 assert.ok(x.nextSteps.some(s=>s.includes('No intensificar')));
 assert.ok(x.alternatives.some(o=>o.id==='DM2-DETAIL-SGLT2-REVIEW'));
 assert.ok(!x.alternatives.some(o=>o.id==='DM2-DETAIL-METFORMIN-REVIEW'));
});
test('iSGLT2 ya registrado no se presenta como inicio de segundo iSGLT2',()=>{
 const x=review({hba1c:'6.6',ic:'Sí',farmacos_clases:['Metformina','iSGLT2']});
 assert.ok(x.alternatives.some(o=>o.id==='DM2-DETAIL-SGLT2-EXISTING'));
 assert.ok(!x.alternatives.some(o=>o.id==='DM2-DETAIL-SGLT2-REVIEW'));
});
test('objetivo individual 8.5 en persona frágil no se contradice con corte docente rápido',()=>{
 const x=review({hba1c:'8',dm_objetivo_valor:'8.5',
  dm_control:'HbA1c ≥8,5 % · sin síntomas',dm_hipoglucemias:'No referidas'});
 assert.equal(x.objective.comparison.state,'en_objetivo');
 // El control rápido sí contradice HbA1c <8.5, pero no debe confundirse
 // la regla de intensidad de tratamiento con el objetivo individual.
 assert.ok(!x.alerts.some(s=>s.includes('objetivo individual numérico está dentro')));
});
test('contradicción verdadera entre en objetivo rápido y objetivo numérico detiene propuestas',()=>{
 const x=review({dm_control:'En el objetivo individual',hba1c:'8'});
 assert.equal(x.state,'revisar_coherencia');
 assert.equal(x.alternatives.length,0);
 assert.ok(x.alerts.some(s=>s.includes('HbA1c en objetivo')));
});
test('hipoglucemias graves o recurrentes tienen prioridad aunque HbA1c parezca favorable',()=>{
 const x=review({hba1c:'6.6',dm_hipoglucemias:'Graves o recurrentes',
   farmacos_clases:['Insulina','Sulfonilurea']});
 assert.equal(x.state,'seguridad_prioritaria');
 assert.ok(x.alerts.some(s=>/hipoglucemias graves/i.test(s)));
 assert.equal(x.alternatives.length,0);
});
test('glucemia ≥300 marca valoración prioritaria; 299 no sustituye a clínica',()=>{
 const x=review({glucemia_actual:'300'});
 assert.equal(x.state,'seguridad_prioritaria');
 assert.equal(x.alternatives.length,0);
 const y=review({glucemia_actual:'299'});
 assert.equal(y.state,'revision_pendiente');
});
test('sospecha CAD bloquea opciones sin perder alerta urgente',()=>{
 const x=review({cetoacidosis_sospecha:'Sí'});
 assert.equal(x.state,'seguridad_prioritaria');
 assert.ok(x.alerts.some(s=>s.includes('urgente')));
 assert.equal(x.alternatives.length,0);
});
test('HbA1c con fiabilidad no evaluada impide intensificación automatizada',()=>{
 const x=review({dm_hba1c_fiable:'Posible interferencia o discordancia'});
 assert.equal(x.state,'datos_insuficientes');
 assert.equal(x.objective.comparison,null);
 assert.equal(x.alternatives.length,0);
 assert.ok(x.checks.some(s=>s.includes('anemia')));
});
test('fecha HbA1c imposible o posterior a evaluación bloquea salida',()=>{
 const a=review({fecha_hba1c:'2026-02-30'});
 assert.equal(a.state,'revisar_coherencia');
 assert.equal(a.alternatives.length,0);
 const b=review({fecha_hba1c:'2026-11-13'});
 assert.equal(b.state,'revisar_coherencia');
 assert.ok(b.alerts.some(s=>s.includes('Fecha de HbA1c')));
});
test('si no hay HbA1c ni objetivo numérico no se inventa el control',()=>{
 const x=review({hba1c:'',dm_objetivo_valor:''});
 assert.equal(x.state,'datos_insuficientes');
 assert.equal(x.objective.comparison,null);
 assert.ok(x.missing.some(s=>s.includes('HbA1c')));
 assert.ok(x.missing.some(s=>s.includes('límite numérico')));
 assert.equal(x.alternatives.length,0);
});
test('dosis no verificadas impiden candidatos aunque las clases parezcan correctas',()=>{
 const x=review({dm_dosis_confirmadas:'No'});
 assert.equal(x.state,'datos_insuficientes');
 assert.equal(x.alternatives.length,0);
 assert.ok(x.checks.some(s=>s.includes('dosis')));
});
test('problema de adherencia impide atribuir fracaso a la pauta',()=>{
 const x=review({dm_adherencia:'Dificultades o dosis omitidas'});
 assert.equal(x.state,'datos_insuficientes');
 assert.equal(x.alternatives.length,0);
 assert.ok(x.nextSteps.some(s=>s.includes('Resolver problemas de adherencia')));
});
test('sin tratamiento confirmado permite declarar dosis no aplicables, sin inventar medicamento',()=>{
 const x=review({farmacos_clases:['Sin tratamiento farmacológico'],
  dm_dosis_confirmadas:'No procede: sin tratamiento'});
 assert.equal(x.state,'revision_pendiente');
 assert.equal(x.medicationSummary.count,0);
 assert.equal(x.medicationSummary.dosesConfirmed,true);
 assert.ok(x.nextSteps.some(s=>s.includes('No constan clases')));
});
test('IC/ERC sin TFGe confirmada no ofrece inicio de iSGLT2',()=>{
 const x=review({ic:'Sí',tfge:''});
 assert.equal(x.state,'datos_insuficientes');
 assert.ok(x.checks.some(s=>s.includes('TFGe contrastada')));
 assert.ok(!x.alternatives.some(o=>o.id==='DM2-DETAIL-SGLT2-REVIEW'));
});
test('metformina con TFGe 29.9 emite alerta; no recomienda iniciarla',()=>{
 const x=review({tfge:'29.9'});
 assert.ok(x.alerts.some(s=>s.includes('TFGe <30')));
 assert.ok(!x.alternatives.some(o=>o.id==='DM2-DETAIL-METFORMIN-REVIEW'));
});
test('duplicidad iDPP4 + arGLP1 queda visible aun con datos de seguridad parciales',()=>{
 const x=review({farmacos_clases:['Metformina','iDPP-4','arGLP-1']});
 assert.ok(x.alerts.some(s=>s.includes('iDPP-4')));
 assert.equal(x.noPrescription,true);
});
test('sin confirmación diagnóstica de IC/ERC no atribuye automáticamente indicación SGLT2',()=>{
 const x=review({dm_prioridad:['Insuficiencia cardíaca','Enfermedad renal crónica']});
 assert.ok(x.checks.some(s=>s.includes('confirmar el diagnóstico')));
 assert.ok(x.checks.some(s=>s.includes('cronicidad')));
 assert.ok(!x.alternatives.some(o=>o.id==='DM2-DETAIL-SGLT2-REVIEW'));
});
test('fuentes y contrato no prescriptivo se conservan',()=>{
 const x=review();
 assert.equal(x.noPrescription,true);
 assert.equal(x.clinicalValidation,'pendiente');
 assert.ok(Object.values(DM2_DETAIL_SOURCES).every(s=>s.url.startsWith('https://')));
 assert.ok(x.sourceIds.includes('ADA-2026-6'));
 assert.equal(x.actionPerformed,false);
});
