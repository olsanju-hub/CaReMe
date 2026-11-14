import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue,setUnavailable} from '../src/model.mjs';
import {evaluateRenalTreatment,evaluateKidney} from '../src/clinical/renal.mjs';
const base={edad:'60',embarazo:'No procede',erc_contexto:'Adulto sin diálisis ni trasplante',
 erc:'Sí',tfge:'55',cac:'100',unidad_cac:'mg/g',persistencia:'Sí',erc_hematuria:'No',
 lra_sospecha:'No',situacion_aguda:'Estable sin proceso agudo grave',ras_hipotension:'No',
 medicacion_revisada:'Sí',farmacos_clases:JSON.stringify(['IECA']),farmacos:'Enalapril 10 mg/día, confirmado',
 ras_evento:'Inicio administrado',ras_evento_confirmado:'Sí',fecha_ras_evento:'2026-10-20',
 fecha_evaluacion:'2026-11-12',creatinina_basal_ras:'1',fecha_creatinina_basal_ras:'2026-10-19',
 creatinina:'1.2',fecha_creatinina:'2026-11-05',potasio:'4.5',fecha_potasio:'2026-11-05',
 pas:'120',fecha_pas:'2026-11-05',fecha_tfge:'2026-11-05',fecha_cac:'2026-11-05'};
const draft=(v={})=>Object.entries({...base,...v}).reduce((d,[id,x])=>setValue(d,id,String(x)),createDraft());
const run=(v={})=>evaluateRenalTreatment(draft(v));
test('tres controles fechados tras cambio confirmado se documentan sin nueva cita',()=>{
 const r=run();assert.equal(r.state,'controles_documentados');assert.equal(r.window,null);
 assert.ok(Math.abs(r.creatinineChange.percent-20)<1e-8);assert.equal(r.prescription,null);
 assert.equal(r.patientDose,null);assert.equal(r.actionPerformed,false);
});
for(const v of [{ras_evento_confirmado:'No'},{ras_evento_confirmado:''},{ras_evento:'No confirmado'},{fecha_ras_evento:''},{fecha_ras_evento:'2026-02-30'},{medicacion_revisada:'No'},{farmacos:''},{embarazo:'No valorado'},{lra_sospecha:'No valorado'}])
 test('no genera ventana desde datos no confirmados '+JSON.stringify(v),()=>assert.equal(run(v).window,null));
test('controles ausentes: ventana basada en fecha efectiva, no fecha de consulta',()=>{
 const r=run({creatinina:'',potasio:'',pas:''});assert.deepEqual([r.window.from,r.window.to],['2026-11-03','2026-11-17']);
 assert.equal(r.window.status,'en_ventana');assert.equal(r.window.appointmentCreated,false);
});
for(const [date,status] of [['2026-10-21','pendiente'],['2026-11-03','en_ventana'],['2026-11-17','en_ventana'],['2026-11-18','plazo_superado']])
 test('frontera temporal '+date,()=>{
  const r=run({fecha_evaluacion:date,fecha_tfge:'',fecha_cac:'',fecha_creatinina:'',fecha_potasio:'',fecha_pas:''});
  assert.equal(r.window.status,status);assert.equal(r.window.to,'2026-11-17');
 });
test('controles tempranos no cierran el seguimiento de 2–4 semanas',()=>{
 const r=run({fecha_creatinina:'2026-10-21',fecha_potasio:'2026-10-21',fecha_pas:'2026-10-21'});
 assert.equal(r.state,'monitorizacion_pendiente');assert.ok(r.window);
});
for(const v of [{fecha_ras_evento:'2026-11-13'},{fecha_creatinina_basal_ras:'2026-10-21'},{fecha_creatinina:'2026-11-13'},{fecha_pas:'2026-11-13'}])
 test('cronología incompatible '+JSON.stringify(v),()=>{const r=run(v);assert.equal(r.window,null);assert.ok(r.alerts.length)});
for(const [current,alert] of [['1.3',false],['1.3001',true],['1.29',false]])
 test('frontera creatinina basal 1 → '+current,()=>{
  const r=run({creatinina:current});assert.equal(r.creatinineChange.exceedsThirtyPercent,alert);
  assert.equal(r.state==='seguridad_prioritaria',alert);
 });
test('frontera decimal 1.1 →1.43 no supera matemáticamente 30 %',()=>{
 assert.equal(run({creatinina_basal_ras:'1.1',creatinina:'1.43'}).creatinineChange.exceedsThirtyPercent,false);
});
test('aumento >30 % fuera de cuatro semanas no se atribuye automáticamente al cambio',()=>{
 const r=run({fecha_evaluacion:'2026-12-01',creatinina:'1.5',fecha_creatinina:'2026-11-25'});
 assert.equal(r.creatinineChange.withinFourWeeks,false);assert.equal(r.window,null);
 assert.ok(r.alerts.some(x=>x.includes('fuera de las primeras')));
});
for(const v of [{creatinina_basal_ras:'0'},{creatinina_basal_ras:''},{fecha_creatinina_basal_ras:''},{creatinina:'0'}])
 test('no calcula variación desde referencia no válida '+JSON.stringify(v),()=>assert.equal(run(v).creatinineChange,null));
for(const v of [{potasio:'6.5'},{ras_hipotension:'Sí'},{lra_sospecha:'Sí'},{situacion_aguda:'Enfermedad aguda grave'}])
 test('seguridad activa suprime calendario '+JSON.stringify(v),()=>{const r=run(v);assert.equal(r.state,'seguridad_prioritaria');assert.equal(r.window,null)});
test('ARA-II usa misma monitorización; ARNI y doble bloqueo no se extrapolan',()=>{
 assert.equal(run({farmacos_clases:'["ARA-II"]'}).state,'controles_documentados');
 assert.equal(run({farmacos_clases:'["INRA/ARNI"]',ras_evento:''}).state,'no_aplicable');
 for(const classes of ['["IECA","ARA-II"]','["IECA","INRA/ARNI"]'])assert.equal(run({farmacos_clases:classes}).state,'revisar_coherencia');
});
for(const v of [{embarazo:'Sí'},{erc_contexto:'Diálisis'},{erc_contexto:'Trasplante renal'},{edad:'17'}])
 test('no extrapola ámbito '+JSON.stringify(v),()=>{const r=run(v);assert.equal(r.state,'fuera_de_ambito');assert.equal(r.window,null)});
test('sin cambio reciente no se inventa nuevo control a cuatro semanas',()=>{
 const r=run({ras_evento:'Sin cambio reciente',fecha_ras_evento:'',ras_evento_confirmado:''});
 assert.equal(r.state,'sin_cambio_reciente');assert.equal(r.window,null);
});
test('potasio no disponible no se interpreta como control completado',()=>{
 const r=evaluateRenalTreatment(setUnavailable(draft(),'potasio',true));assert.equal(r.state,'monitorizacion_pendiente');
});
test('IECA/ARA-II con cambio o conciliación pendientes no recibe solo seguimiento anual',()=>{
 const r=evaluateKidney(draft({ras_evento:'No confirmado'}),'detail');
 assert.equal(r.stableFollowUp,false);assert.doesNotMatch(r.followUp,/al menos anualmente/);
});
test('evento de IECA sin clase actual exige conciliación y no seguimiento anual',()=>{
 const d=draft({farmacos_clases:'["Sin tratamiento farmacológico"]'});
 assert.equal(evaluateRenalTreatment(d).state,'revisar_coherencia');assert.equal(evaluateKidney(d).stableFollowUp,false);
});
