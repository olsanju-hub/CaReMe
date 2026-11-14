import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue} from '../src/model.mjs';
import {evaluateDm2Quick,DM2_QUICK_SOURCES} from '../src/clinical/dm2-rapida.mjs';

const d=(data={})=>Object.entries(data).reduce((draft,[id,value])=>
  setValue(draft,id,Array.isArray(value)?JSON.stringify(value):String(value)),createDraft());
const basic={
 dm2:'Sí',dm1:'No',
 dm_prioridad:['Sin condicionante seleccionado'],
 dm_control:'En el objetivo individual',
 farmacos_clases:['Metformina'],medicacion_revisada:'Sí',alergias_revisadas:'Sí',
 tfge:'65',fecha_tfge:'2026-11-10',situacion_aguda:'Estable sin proceso agudo grave',
 cetoacidosis_sospecha:'No',dm_sintomas:'Ausentes'
};
const run=extra=>evaluateDm2Quick(d({...basic,...extra}));
test('dos campos rápidos ausentes impiden fingir orientación completa',()=>{
 const x=evaluateDm2Quick(d({}));
 assert.equal(x.state,'datos_insuficientes');
 assert.equal(x.options.length,0);
 assert.ok(x.missing.length>=2);
 assert.equal(x.noPrescription,true);
 assert.equal(x.patientDose,null);
});
test('HbA1c en objetivo no produce intensificación automática, con seguimiento orientativo',()=>{
 const x=run({dm_objetivo:'Hasta 7 %',hba1c:'6.7'});
 assert.equal(x.state,'revision_pendiente');
 assert.match(x.situation,/dentro del objetivo/);
 assert.ok(x.nextSteps.some(t=>t.includes('No intensificar')));
 assert.match(x.followUp,/6 meses/);
 assert.equal(x.actionPerformed,false);
});
test('IC y ERC: considerar clase cardiorrenal independientemente de HbA1c',()=>{
 const x=run({dm_prioridad:['Insuficiencia cardíaca','Enfermedad renal crónica'],
   persistencia:'Sí',ic:'Sí',erc:'Sí',dm_control:'En el objetivo individual'});
 assert.equal(x.state,'revision_pendiente');
 assert.ok(x.options.some(t=>t.id==='DM2-CARDIORENAL'));
 assert.ok(!x.options.some(t=>t.status==='apto'));
 assert.ok(x.options.every(t=>t.prescription===null&&t.patientDose===null));
});
test('un iSGLT2 registrado no se presenta como un nuevo inicio duplicado',()=>{
 const x=run({dm_prioridad:['Insuficiencia cardíaca'],
   farmacos_clases:['Metformina','iSGLT2']});
 const card=x.options.find(o=>o.id==='DM2-CARDIORENAL');
 assert.ok(card);
 assert.match(card.title,/ya registrada/);
});
test('ausencia de conciliación farmacológica no se interpreta como ausencia de fármacos',()=>{
 const {farmacos_clases,...without}=basic;
 const x=evaluateDm2Quick(d({...without,dm_control:'Fuera del objetivo · HbA1c inferior a 8,5 %'}));
 assert.ok(x.checks.some(t=>t.includes('Conciliar tratamiento')));
 assert.ok(x.nextSteps.some(t=>t.includes('Identificar qué toma')));
 assert.equal(x.noPrescription,true);
});
test('fuera de objetivo con menos de 8.5 cambia el siguiente paso por número de clases',()=>{
 const case1=run({dm_control:'Fuera del objetivo · HbA1c inferior a 8,5 %',
   hba1c:'8.4',farmacos_clases:['Metformina']});
 assert.ok(case1.nextSteps.some(t=>t.includes('monoterapia')));
 assert.match(case1.followUp,/3 meses/);
 const case2=run({dm_control:'Fuera del objetivo · HbA1c inferior a 8,5 %',
   hba1c:'8.4',farmacos_clases:['Metformina','iSGLT2']});
 assert.ok(case2.nextSteps.some(t=>t.includes('dos clases')));
 const case3=run({dm_control:'Fuera del objetivo · HbA1c inferior a 8,5 %',
   hba1c:'8.4',farmacos_clases:['Sin tratamiento farmacológico']});
 assert.ok(case3.nextSteps.some(t=>t.includes('Sin tratamiento')));
});
test('HbA1c 8.5 sin síntomas plantea asociación, nunca diagnóstico ni insulinización automática',()=>{
 const x=run({dm_control:'HbA1c ≥8,5 % · sin síntomas',hba1c:'8.5'});
 assert.equal(x.state,'revision_pendiente');
 assert.match(x.situation,/mayor intensidad/);
 assert.ok(x.nextSteps.some(t=>t.includes('combinación')));
 assert.equal(x.patientDose,null);
});
test('HbA1c >10% con o sin síntomas exige revisión de gravedad antes de intensificar',()=>{
 const x=run({dm_control:'HbA1c ≥8,5 % · sin síntomas',hba1c:'10.5'});
 assert.equal(x.state,'seguridad_prioritaria');
 assert.ok(x.safety.some(t=>t.includes('HbA1c >10%')));
 assert.equal(x.options.length,0);
 assert.match(x.followUp,/aguda/);
});
test('síntomas de hiperglucemia priorizan valorar crisis y no emiten pauta de insulina',()=>{
 const x=run({dm_control:'HbA1c ≥8,5 % · con síntomas',hba1c:'9.2',
   dm_sintomas:'Poliuria, polidipsia o pérdida de peso'});
 assert.equal(x.state,'seguridad_prioritaria');
 assert.ok(x.safety.some(t=>t.includes('cetonas')));
 assert.equal(x.options.length,0);
 assert.equal(x.patientDose,null);
});
test('cetoacidosis sospechada bloquea evaluación crónica incluso con HbA1c en objetivo',()=>{
 const x=run({cetoacidosis_sospecha:'Sí'});
 assert.equal(x.state,'seguridad_prioritaria');
 assert.ok(x.safety.some(t=>t.includes('urgente')));
 assert.equal(x.options.length,0);
});
test('el corte 8.5 es coherente en frontera y discrepancias no generan opciones',()=>{
 const low=run({dm_control:'Fuera del objetivo · HbA1c inferior a 8,5 %',hba1c:'8.5'});
 assert.equal(low.state,'revisar_coherencia');
 assert.equal(low.options.length,0);
 const high=run({dm_control:'HbA1c ≥8,5 % · sin síntomas',hba1c:'8.49'});
 assert.equal(high.state,'revisar_coherencia');
 assert.equal(high.options.length,0);
 const correct=run({dm_control:'HbA1c ≥8,5 % · sin síntomas',hba1c:'8.5'});
 assert.equal(correct.state,'revision_pendiente');
});
test('síntomas marcados y ausencia de síntomas contradictoria retienen candidatos',()=>{
 const x=run({dm_control:'HbA1c ≥8,5 % · sin síntomas',hba1c:'9',
   dm_sintomas:'Poliuria, polidipsia o pérdida de peso'});
 assert.equal(x.state,'revisar_coherencia');
 assert.equal(x.options.length,0);
});
test('no se propone orientación DM2 si el diagnóstico está negado o hay DM1',()=>{
 assert.equal(run({dm2:'No'}).state,'revisar_coherencia');
 const x=run({dm1:'Sí'});
 assert.equal(x.state,'revisar_coherencia');
 assert.equal(x.options.length,0);
});
test('fragilidad y sulfonilurea generan aviso de hipoglucemias',()=>{
 const x=run({dm_prioridad:['Fragilidad'],
  farmacos_clases:['Sulfonilurea'],dm_objetivo:'Flexible: entre 7,5 y 8,5 %'});
 assert.ok(x.safety.some(t=>t.includes('hipoglucemia')));
 assert.ok(x.checks.some(t=>t.includes('funcionalidad')));
});
test('duplicidades incretínicas o contraindicaciones renales no se transforman en dosis',()=>{
 const x=run({dm_control:'Fuera del objetivo · HbA1c inferior a 8,5 %',
   farmacos_clases:['Metformina','iDPP-4','arGLP-1'],
   tfge:'29'});
 assert.ok(x.safety.some(t=>t.includes('TFGe <30')));
 assert.ok(x.safety.some(t=>t.includes('iDPP-4')));
 assert.ok(x.options.every(o=>o.patientDose===null));
});
test('fuentes vinculadas a organismo y edición reales',()=>{
 const sources=Object.values(DM2_QUICK_SOURCES);
 assert.equal(sources.length,3);
 assert.ok(sources.every(x=>/^https:\/\//.test(x.url)));
 assert.ok(sources.some(x=>x.id==='REDGDPS-DM2-2026'));
 const r=run();
 assert.ok(r.sourceIds.every(x=>sources.some(y=>y.id===x)));
 assert.equal(r.noPrescription,true);
});
test('el resultado no cambia por otro paciente ni mantiene medicación previa en memoria',()=>{
 const a=run({farmacos_clases:['iSGLT2'],
  dm_prioridad:['Insuficiencia cardíaca']});
 const b=run({farmacos_clases:['Metformina'],
  dm_prioridad:['Insuficiencia cardíaca']});
 assert.match(a.options.find(x=>x.id==='DM2-CARDIORENAL').title,/ya registrada/);
 assert.match(b.options.find(x=>x.id==='DM2-CARDIORENAL').title,/Revisar una clase/);
});
