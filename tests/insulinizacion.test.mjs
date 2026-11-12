import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue} from '../src/model.mjs';
import {INSULIN_PHASES,INSULIN_SOURCES,evaluateInsulinization} from '../src/clinical/insulinizacion.mjs';
const make=(v={})=>Object.entries(v).reduce((draft,[k,value])=>
  setValue(draft,k,Array.isArray(value)?JSON.stringify(value):String(value)),createDraft());
const baseline={
 insulina_fase:INSULIN_PHASES.inicio,insulina_perfil:['Sin situación especial seleccionada'],
 dm2:'Sí',dm1:'No',edad:'62',embarazo:'No procede',
 insulina_esquema:'Sin insulina',
 hba1c:'8.4',fecha_hba1c:'2026-11-08',dm_objetivo_valor:'7',
 dm_hba1c_fiable:'Fiable tras comprobación',fecha_evaluacion:'2026-11-12',
 dm_hipoglucemias:'No referidas',insulina_hipo_nocturna:'No',
 insulina_autocuidado:'Capacidad y apoyo adecuados confirmados',
 dm_adherencia:'Adecuada confirmada',dm_dosis_confirmadas:'Sí',
 farmacos_clases:['Metformina'],medicacion_revisada:'Sí',alergias_revisadas:'Sí',
 situacion_aguda:'Estable sin proceso agudo grave',cetoacidosis_sospecha:'No',
 tfge:'72',peso:'84',dm_sintomas:'Ausentes'
};
const run=(changes={},mode='detail')=>evaluateInsulinization(make({...baseline,...changes}),mode);
test('no elegir fase o perfil sin datos es insuficiente, nunca tratamiento',()=>{
 const x=evaluateInsulinization(make(), 'quick');
 assert.equal(x.state,'datos_insuficientes');
 assert.equal(x.options.length,0);
 assert.ok(x.missing.length>0);
 assert.equal(x.noPrescription,true);
});
test('las tres rutas tienen nombres y los outputs comparten contrato',()=>{
 assert.deepEqual(Object.keys(INSULIN_PHASES),['inicio','intensificacion','desintensificacion']);
 for(const phase of Object.values(INSULIN_PHASES)){
  const x=run({insulina_fase:phase});
  assert.equal(x.phase,phase);
  assert.equal(x.patientDose,null);
  assert.equal(x.prescription,null);
  assert.equal(x.actionPerformed,false);
  assert.ok(x.sourceIds.length>=4);
 }
});
test('orientación rápida de inicio propone revisar GLP1 antes de basal, sin dosis',()=>{
 const x=run({},'quick');
 assert.equal(x.state,'revision_pendiente');
 assert.ok(x.nextSteps.some(s=>s.includes('GLP-1')));
 assert.equal(x.options.length,0);
});
test('inicio detallado con información validada ofrece opción basal solo para revisión',()=>{
 const x=run();
 assert.equal(x.state,'revision_pendiente');
 assert.ok(x.options.some(o=>o.id==='INS-START-BASAL'));
 assert.ok(x.options.every(o=>o.prescription===null&&o.patientDose===null&&!o.performed));
 assert.match(x.options.find(o=>o.id==='INS-START-BASAL').checks.join(' '),/0,1–0,2 U\/kg\/día/);
});
test('HbA1c por debajo del objetivo individual no habilita inicio de basal',()=>{
 const x=run({hba1c:'6.5'});
 assert.ok(!x.options.some(o=>o.id==='INS-START-BASAL'));
 assert.ok(x.checks.some(s=>s.includes('HbA1c en objetivo')));
});
test('iniciar cuando ya se administra basal exige conciliación, no segundo inicio',()=>{
 const x=run({insulina_esquema:'Solo basal',farmacos_clases:['Insulina','Metformina']});
 assert.equal(x.state,'revisar_coherencia');
 assert.equal(x.options.length,0);
});
test('diabetes tipo 1 conocida excluye la vía específica DM2',()=>{
 const x=run({dm1:'Sí'});
 assert.equal(x.state,'revisar_coherencia');
 assert.equal(x.options.length,0);
 assert.ok(x.contradictions.includes('TIPO_DIABETES_INCOMPATIBLE'));
});
test('la ausencia de confirmación DM2 impide mostrar recomendaciones de inicio',()=>{
 const x=run({dm2:''},'quick');
 assert.equal(x.state,'datos_insuficientes');
 assert.equal(x.options.length,0);
 assert.ok(x.nextSteps.some(s=>s.includes('Confirmar tipo')));
});
test('intensificación: ayunas en objetivo y elevación posprandial no sube basal',()=>{
 const x=run({
  insulina_fase:INSULIN_PHASES.intensificacion,insulina_esquema:'Solo basal',
  farmacos_clases:['Insulina','Metformina'],insulina_dosis_basal:'25',
  insulina_ayunas:'115',insulina_ayunas_objetivo:'En objetivo individual',
  insulina_posprandial:'Elevaciones posprandiales repetidas'
 });
 assert.equal(x.state,'revision_pendiente');
 assert.ok(x.nextSteps.some(s=>s.includes('evitar subir basal')));
 assert.ok(x.options.some(o=>o.id==='INS-INT-GLP1'));
 assert.ok(x.options.some(o=>o.id==='INS-INT-PRANDIAL'));
 assert.ok(x.options.every(o=>o.patientDose===null));
});
test('GLP1 ya recibido evita ofrecer inicio duplicado durante intensificación',()=>{
 const x=run({
  insulina_fase:INSULIN_PHASES.intensificacion,insulina_esquema:'Solo basal',
  farmacos_clases:['Insulina','arGLP-1'],insulina_dosis_basal:'25',
  insulina_ayunas_objetivo:'En objetivo individual',
  insulina_posprandial:'Elevaciones posprandiales repetidas'
 });
 assert.ok(!x.options.some(o=>o.id==='INS-INT-GLP1'));
 assert.ok(x.options.some(o=>o.id==='INS-INT-PRANDIAL'));
});
test('intensificación: ayunas altas solo propone revisar basal, no ajuste calculado',()=>{
 const x=run({
  insulina_fase:INSULIN_PHASES.intensificacion,insulina_esquema:'Solo basal',
  farmacos_clases:['Insulina'],insulina_dosis_basal:'20',
  insulina_ayunas_objetivo:'Por encima del objetivo',
  insulina_posprandial:'Sin elevaciones significativas documentadas'
 });
 assert.ok(x.options.some(o=>o.id==='INS-INT-REVIEW-BASAL'));
 assert.equal(x.patientDose,null);
});
test('sin dosis basal confirmada no ofrecer intensificación de basal',()=>{
 const x=run({
  insulina_fase:INSULIN_PHASES.intensificacion,insulina_esquema:'Solo basal',
  farmacos_clases:['Insulina'],insulina_dosis_basal:'',
  insulina_ayunas_objetivo:'Por encima del objetivo',
  insulina_posprandial:'Sin elevaciones significativas documentadas'
 });
 assert.equal(x.state,'datos_insuficientes');
 assert.equal(x.options.length,0);
 assert.ok(x.missing.some(s=>s.includes('Dosis basal actual')));
});
test('ayunas sin clasificar o posprandial no valorada impiden elegir escalada',()=>{
 for(const change of [
  {insulina_ayunas_objetivo:'No valorado'},
  {insulina_posprandial:'No valorado'}
 ]){
  const x=run({...change,
   insulina_fase:INSULIN_PHASES.intensificacion,
   insulina_esquema:'Solo basal',insulina_dosis_basal:'24',
   farmacos_clases:['Insulina']});
  assert.equal(x.state,'datos_insuficientes');
  assert.equal(x.options.length,0);
 }
});
test('hipoglucemia nocturna o ayunas bajas bloquean incrementos incluso con HbA1c elevada',()=>{
 for(const change of [
  {insulina_hipo_nocturna:'Sí'},
  {insulina_ayunas_objetivo:'Por debajo del objetivo'}
 ]){
  const x=run({...change,
   insulina_fase:INSULIN_PHASES.intensificacion,
   insulina_esquema:'Solo basal',insulina_dosis_basal:'40',
   insulina_posprandial:'Elevaciones posprandiales repetidas',
   farmacos_clases:['Insulina']});
  assert.equal(x.state,'seguridad_prioritaria');
  assert.equal(x.options.length,0);
  assert.ok(x.nextSteps.some(s=>s.includes('no aumentar insulina basal')));
 }
});
test('muestra ratio basal por peso como medición descriptiva, sin diagnosticar sobrebasalización',()=>{
 const x=run({
  insulina_fase:INSULIN_PHASES.intensificacion,
  insulina_esquema:'Solo basal',insulina_dosis_basal:'42',
  farmacos_clases:['Insulina'],insulina_ayunas_objetivo:'En objetivo individual',
  insulina_posprandial:'Elevaciones posprandiales repetidas'
 });
 assert.equal(x.glycemicPattern.basalPerKg,0.5);
 assert.ok(x.checks.some(s=>s.includes('cálculo descriptivo')));
 assert.ok(x.checks.some(s=>/no aplicar un umbral numérico aislado/i.test(s)));
});
test('desintensificación: simplificar esquema complejo con motivo y datos confirmados',()=>{
 const x=run({
  insulina_fase:INSULIN_PHASES.desintensificacion,
  insulina_esquema:'Basal y prandial',
  farmacos_clases:['Insulina','Metformina'],
  insulina_fragilidad:'Sí',
  insulina_motivo_simplificacion:'Fragilidad o dificultad de autocuidado'
 });
 assert.equal(x.state,'revision_pendiente');
 assert.ok(x.options.some(o=>o.id==='INS-DEINTENSIFY-REVIEW'));
 assert.equal(x.actionPerformed,false);
});
test('desintensificación sin motivo documentado no inventa suspensión',()=>{
 const x=run({
  insulina_fase:INSULIN_PHASES.desintensificacion,
  insulina_esquema:'Solo basal',farmacos_clases:['Insulina'],
  insulina_fragilidad:'No',
  insulina_motivo_simplificacion:'No valorado'
 });
 assert.equal(x.state,'datos_insuficientes');
 assert.equal(x.options.length,0);
});
test('desintensificación con esquemas declarados sin insulina se bloquea',()=>{
 const x=run({
  insulina_fase:INSULIN_PHASES.desintensificacion,
  insulina_esquema:'Sin insulina',farmacos_clases:['Metformina'],
  insulina_fragilidad:'No',
  insulina_motivo_simplificacion:'Carga terapéutica excesiva'
 });
 assert.equal(x.state,'revisar_coherencia');
 assert.equal(x.options.length,0);
});
test('hipoglucemia grave no se gestiona por titulación rutinaria',()=>{
 const x=run({dm_hipoglucemias:'Graves o recurrentes'});
 assert.equal(x.state,'seguridad_prioritaria');
 assert.equal(x.options.length,0);
 assert.ok(x.alerts.some(s=>s.includes('Hipoglucemias graves')));
});
test('glucemia ≥300 requiere valorar urgencia, frontera 299 no bloquea por sí sola',()=>{
 const hi=run({glucemia_actual:'300'});
 assert.equal(hi.state,'seguridad_prioritaria');
 assert.equal(hi.options.length,0);
 const lo=run({glucemia_actual:'299'});
 assert.ok(!lo.alerts.some(s=>s.includes('Glucemia ≥300')));
});
test('cetoacidosis, embarazo y proceso agudo bloquean circuito ambulatorio',()=>{
 for(const data of [
  {cetoacidosis_sospecha:'Sí'},
  {embarazo:'Sí'},
  {situacion_aguda:'Enfermedad aguda grave'}
 ]){
  const x=run(data);
  assert.equal(x.state,'seguridad_prioritaria');
  assert.equal(x.options.length,0);
 }
});
test('esquema desconocido, adherencia o autocuidado pendientes impiden candidatos',()=>{
 for(const data of [
  {insulina_esquema:'No confirmado'},
  {dm_adherencia:'Dificultades o dosis omitidas'},
  {insulina_autocuidado:'Requiere educación o apoyo'}
 ]){
  const x=run(data);
  assert.equal(x.state,'datos_insuficientes');
  assert.equal(x.options.length,0);
 }
});
test('dosis basal positiva con esquema sin insulina se considera contradicción',()=>{
 const x=run({insulina_dosis_basal:'20'});
 assert.equal(x.state,'revisar_coherencia');
 assert.equal(x.options.length,0);
 assert.ok(x.contradictions.includes('DOSIS_BASAL_SIN_INSULINA'));
});
test('no se ofrecen ajustes sin valorar hipoglucemia nocturna',()=>{
 const x=run({
   insulina_fase:INSULIN_PHASES.intensificacion,
   insulina_esquema:'Solo basal',insulina_dosis_basal:'18',
   farmacos_clases:['Insulina'],
   insulina_hipo_nocturna:'No valoradas',
   insulina_ayunas_objetivo:'Por encima del objetivo',
   insulina_posprandial:'Sin elevaciones significativas documentadas'
 });
 assert.equal(x.state,'datos_insuficientes');
 assert.equal(x.options.length,0);
 assert.ok(x.missing.some(s=>s.includes('hipoglucemia nocturna')));
});
test('una consulta rápida con DM2 no confirmada explica el circuito sin emitir candidato',()=>{
 for(const [phase,phrase,scheme] of [
   [INSULIN_PHASES.inicio,'GLP-1','Sin insulina'],
   [INSULIN_PHASES.intensificacion,'posprandiales','Solo basal'],
   [INSULIN_PHASES.desintensificacion,'simplificación','Basal y prandial']
 ]){
   const isInsulin=scheme!=='Sin insulina';
   const x=run({dm2:'',insulina_fase:phase,insulina_esquema:scheme,
      farmacos_clases:isInsulin?['Insulina']:['Metformina']},'quick');
   assert.equal(x.state,'datos_insuficientes');
   assert.equal(x.options.length,0);
   assert.ok(x.nextSteps.some(s=>s.includes(phrase)),phase);
 }
});
test('validar fuente 2026 preferente sobre la referencia redGDPS 2022',()=>{
 const x=run();
 assert.ok(x.sourceIds.includes('ADA-EASD-DM2-2026'));
 assert.ok(x.sourceIds.includes('REDGDPS-INSULINA-2022'));
 assert.ok(Object.values(INSULIN_SOURCES).every(v=>v.url.startsWith('https://')));
 assert.equal(x.clinicalValidation,'pendiente');
 assert.equal(x.noPrescription,true);
});
test('insulinización no reusa datos de otro paciente',()=>{
 const a=run({insulina_fase:INSULIN_PHASES.inicio});
 const b=run({insulina_fase:INSULIN_PHASES.desintensificacion,
    insulina_esquema:'Basal y prandial',farmacos_clases:['Insulina'],
    insulina_motivo_simplificacion:'Carga terapéutica excesiva',
    insulina_fragilidad:'No'});
 assert.ok(a.options.some(o=>o.id==='INS-START-BASAL'));
 assert.ok(!b.options.some(o=>o.id==='INS-START-BASAL'));
 assert.ok(b.options.some(o=>o.id==='INS-DEINTENSIFY-REVIEW'));
});
