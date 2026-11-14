import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft,setValue } from '../src/model.mjs';
import { integratePatient,INTEGRATION_SOURCES } from '../src/clinical/integracion.mjs';

function draft(values={}){
  return Object.entries(values).reduce((acc,[k,v])=>setValue(acc,k,
    Array.isArray(v)?JSON.stringify(v):String(v)),createDraft());
}
const baseline={
  dm2:'Sí',ic:'Sí',erc:'Sí',persistencia:'Sí',tfge:'54',cac:'155',unidad_cac:'mg/g',
  situacion_aguda:'Estable sin proceso agudo grave',cetoacidosis_sospecha:'No',
  farmacos_clases:['Metformina'],medicacion_revisada:'Sí',
  alergias_revisadas:'Sí',potasio_normal:'Sí',ras_optimizado:'Sí',potasio:'4.2'
};
const has=(cards,id)=>cards.some(c=>c.id===id);
test('integración DM2+IC+ERC: opciones multiorgánicas, ninguna prescripción',()=>{
  const x=integratePatient(draft(baseline));
  assert.equal(x.status,'review_only');
  assert.ok(has(x.options,'SGLT2-REVIEW'));
  assert.ok(has(x.options,'GLP-REVIEW'));
  assert.ok(has(x.options,'NSMRA-REVIEW'));
  assert.ok(x.options.every(x=>x.checks.length>0));
  assert.ok(!('dose' in x.options[0]));
});
test('ERC no confirmada no genera indicación renal de iSGLT2',()=>{
  const x=integratePatient(draft({dm2:'Sí',erc:'Sí',persistencia:'No consta',tfge:'70',cac:'120',unidad_cac:'mg/g'}));
  assert.ok(has(x.context,'CKD-CHRONICITY'));
  assert.ok(!has(x.options,'SGLT2-REVIEW'));
});
test('sospecha de cetoacidosis genera alerta incluso sin diagnósticos cardiorrenales',()=>{
  const x=integratePatient(draft({cetoacidosis_sospecha:'Sí',farmacos_clases:['Metformina']}));
  assert.ok(has(x.alerts,'KETO-URGENT-REVIEW'));
  assert.ok(!has(x.options,'GLP-REVIEW'));
  const y=integratePatient(draft({farmacos_clases:['iSGLT2'],
    situacion_aguda:'Enfermedad aguda grave'}));
  assert.ok(has(y.alerts,'SGLT2-CURRENT-ACUTE'));
});
test('la situación aguda no presenta candidatas farmacológicas',()=>{
  const x=integratePatient(draft({...baseline,
    situacion_aguda:'Enfermedad aguda grave'}));
  assert.ok(has(x.alerts,'SGLT2-ACUTE-SAFETY'));
  assert.ok(has(x.context,'GLP-ACUTE-DEFER'));
  assert.ok(has(x.context,'NSMRA-ACUTE-DEFER'));
  assert.ok(!has(x.options,'GLP-REVIEW'));
  assert.ok(!has(x.options,'NSMRA-REVIEW'));
});
test('sin TFGe, iSGLT2 queda sin evaluación de inicio',()=>{
  const {tfge,...partial}=baseline;
  const x=integratePatient(draft(partial));
  assert.ok(has(x.context,'SGLT2-EGFR-UNKNOWN'));
  assert.ok(!has(x.options,'SGLT2-REVIEW'));
});
test('TFGe <20 bloquea sugerencia genérica de inicio sin confundir continuidad',()=>{
  const x=integratePatient(draft({...baseline,tfge:'19.9'}));
  assert.ok(has(x.context,'SGLT2-LOW-GFR'));
  assert.ok(!has(x.options,'SGLT2-REVIEW'));
});
test('enfermedad aguda, cirugía o cetoacidosis priorizan seguridad',()=>{
  for(const partial of [
    {situacion_aguda:'Enfermedad aguda grave'},
    {situacion_aguda:'Cirugía mayor o ayuno prolongado'},
    {cetoacidosis_sospecha:'Sí'}
  ]) {
    const x=integratePatient(draft({...baseline,...partial}));
    assert.ok(has(x.alerts,'SGLT2-ACUTE-SAFETY'));
    assert.ok(!has(x.options,'SGLT2-REVIEW'));
    assert.ok(!has(x.context,'SGLT2-EXISTING'));
  }
});
test('si consta iSGLT2 no se sugiere añadir otro',()=>{
  const x=integratePatient(draft({...baseline,farmacos_clases:['Metformina','iSGLT2']}));
  assert.ok(has(x.context,'SGLT2-EXISTING'));
  assert.ok(!has(x.options,'SGLT2-REVIEW'));
});
test('obesidad sin DM2: referencia CIMA para tratamiento del peso, no indicación hepática',()=>{
 const x=integratePatient(draft({imc:'31',dm2:'No',esteatosis:'Sí'}));
 assert.ok(has(x.options,'WEIGHT-REVIEW'));
 assert.ok(!has(x.context,'LIVER-NOT-INDICATION'));
 const card=x.options.find(c=>c.id==='WEIGHT-REVIEW');
 assert.ok(card.sources.includes('CIMA-AEMPS-WEGOVY-SC'));
 assert.ok(card.sources.includes('CIMA-AEMPS-MOUNJARO'));
 assert.ok(card.summary.includes('no determina elegibilidad'));
});
test('sobrepeso con comorbilidad explicitada, sin DM2, puede activar solo una revisión condicionada',()=>{
 const x=integratePatient(draft({imc:'27',dm2:'No',comorbilidad_peso_confirmada:'Sí'}));
 assert.ok(has(x.options,'WEIGHT-REVIEW'));
 const y=integratePatient(draft({imc:'29.99',dm2:'No',comorbilidad_peso_confirmada:'No'}));
 assert.ok(!has(y.options,'WEIGHT-REVIEW'));
 const z=integratePatient(draft({imc:'26.99',dm2:'No',comorbilidad_peso_confirmada:'Sí'}));
 assert.ok(!has(z.options,'WEIGHT-REVIEW'));
});
test('tratamiento incretínico actual y proceso agudo evitan nuevo candidato de peso',()=>{
 const ongoing=integratePatient(draft({imc:'34',dm2:'No',farmacos_clases:['arGLP-1']}));
 assert.ok(has(ongoing.context,'WEIGHT-EXISTING'));
 assert.ok(!has(ongoing.options,'WEIGHT-REVIEW'));
 const acute=integratePatient(draft({imc:'34',dm2:'No',situacion_aguda:'Enfermedad aguda grave'}));
 assert.ok(has(acute.context,'WEIGHT-ACUTE-DEFER'));
 assert.ok(!has(acute.options,'WEIGHT-REVIEW'));
});
test('liver-only no convierte MASLD en indicación farmacológica',()=>{
  const x=integratePatient(draft({hepatopatia:'Sí',esteatosis:'Sí'}));
  assert.ok(has(x.context,'LIVER-NOT-INDICATION'));
  assert.ok(!has(x.options,'GLP-REVIEW'));
  assert.ok(!has(x.options,'SGLT2-REVIEW'));
});
test('en DM2 con hígado afectado: opción metabólica, no terapia hepática específica',()=>{
  const x=integratePatient(draft({dm2:'Sí',esteatosis:'Sí',tfge:'72'}));
  const card=x.options.find(x=>x.id==='GLP-REVIEW');
  assert.ok(card);
  assert.match(card.summary,/No interpretar esto como tratamiento hepático específico/);
});
test('combinaciones potencialmente inapropiadas generan alertas',()=>{
  const x=integratePatient(draft({...baseline,
    farmacos_clases:['Pioglitazona','Saxagliptina','iDPP-4','arGLP-1','Agonista dual GIP/GLP-1']}));
  assert.ok(has(x.alerts,'HF-MED-REVIEW'));
  assert.ok(has(x.alerts,'INCRETIN-DOUBLE'));
  assert.ok(has(x.alerts,'INCRETIN-DPP4'));
});
test('selección de ARM no esteroideo requiere revisión aunque se cumplan umbrales',()=>{
  const x=integratePatient(draft({...baseline,potasio_normal:'No',ras_optimizado:'No'}));
  const card=x.options.find(x=>x.id==='NSMRA-REVIEW');
  assert.ok(card);
  assert.ok(card.checks.some(s=>s.includes('potasio normal')));
  assert.ok(card.checks.some(s=>s.includes('IECA/ARA-II')));
});
test('si no se conocen alergias y conciliación, persisten barreras',()=>{
  const x=integratePatient(draft({dm2:'Sí',erc:'Sí',persistencia:'Sí',tfge:'56',cac:'120',unidad_cac:'mg/g'}));
  const card=x.options.find(x=>x.id==='SGLT2-REVIEW');
  assert.ok(card);
  assert.ok(card.checks.some(s=>s.includes('alergias')));
  assert.ok(card.checks.some(s=>s.includes('clases farmacológicas')));
});
test('FIB-4 elevado no desencadena tratamiento hepático específico',()=>{
  const x=integratePatient(draft({edad:'50',ast:'75',alt:'25',plaquetas:'200',
    fib4_contexto:'Perfil de riesgo compatible con evaluación MASLD',fib4_agudo:'No'}));
  assert.ok(has(x.context,'FIB4-CROSS'));
  assert.ok(!has(x.options,'GLP-REVIEW'));
});
test('pauta existente o potasio alto bloquean candidata de ARM no esteroideo',()=>{
  const high=integratePatient(draft({...baseline,potasio:'5.1',potasio_normal:'Sí'}));
  assert.ok(has(high.alerts,'NSMRA-K-BLOCK'));
  assert.ok(!has(high.options,'NSMRA-REVIEW'));
  const limit=integratePatient(draft({...baseline,potasio:'5.0',potasio_normal:'No'}));
  assert.ok(has(limit.options,'NSMRA-REVIEW'));
  assert.ok(!has(limit.alerts,'NSMRA-K-BLOCK'));
  const existing=integratePatient(draft({...baseline,
    farmacos_clases:['Metformina','ARM']}));
  assert.ok(has(existing.alerts,'NSMRA-MRA-EXISTING'));
  assert.ok(!has(existing.options,'NSMRA-REVIEW'));
});
test('si falta RAS real, la lista de comprobación exige conciliación',()=>{
  const x=integratePatient(draft(baseline));
  const card=x.options.find(x=>x.id==='NSMRA-REVIEW');
  assert.ok(card.checks.some(s=>s.includes('No consta IECA/ARA-II')));
});
test('finerenona en IC FEVI ≥40 se distingue de ERC-DM2',()=>{
  const x=integratePatient(draft({...baseline,fevi:'45',ic:'Sí',dm2:'No',erc:'No'}));
  assert.ok(has(x.context,'FIN-HF-LABEL'));
  assert.ok(!has(x.options,'NSMRA-REVIEW'));
  const y=integratePatient(draft({...baseline,fevi:'39.9',dm2:'No',erc:'No'}));
  assert.ok(!has(y.context,'FIN-HF-LABEL'));
});
test('metformina en DM2 con TFGe <30 no aparece como candidato seguro',()=>{
 const x=integratePatient(draft({dm2:'Sí',tfge:'29.9',farmacos_clases:['Metformina']}));
 assert.ok(has(x.alerts,'MET-SAFETY'));
 assert.ok(!has(x.context,'MET-REVIEW'));
 const y=integratePatient(draft({dm2:'Sí',tfge:'29.9',farmacos_clases:['Sin tratamiento farmacológico']}));
 assert.ok(has(y.alerts,'MET-LOW-GFR'));
});
test('metformina: revisión contextual si DM2 y TFGe sin contraindicación renal',()=>{
 const x=integratePatient(draft({dm2:'Sí',tfge:'60',farmacos_clases:['Sin tratamiento farmacológico']}));
 assert.ok(has(x.context,'MET-REVIEW'));
 assert.ok(!has(x.alerts,'MET-LOW-GFR'));
 const y=integratePatient(draft({dm2:'Sí',situacion_aguda:'Enfermedad aguda grave'}));
 assert.ok(has(y.context,'MET-ACUTE-DEFER'));
 assert.ok(!has(y.context,'MET-REVIEW'));
});
test('para iSGLT2 con TFGe 20–<25 queda advertencia individual de dapagliflozina',()=>{
 const x=integratePatient(draft({...baseline,tfge:'22'}));
 const card=x.options.find(z=>z.id==='SGLT2-REVIEW');
 assert.ok(card);
 assert.ok(card.checks.some(t=>t.includes('dapagliflozina')));
 assert.ok(card.sources.includes('CIMA-AEMPS-DAPAGLIFLOZINA'));
});
test('todas las tarjetas conservan fuentes registradas y estructura',()=>{
  const x=integratePatient(draft(baseline));
  const ids=new Set(Object.values(INTEGRATION_SOURCES).map(s=>s.id));
  for(const card of [...x.alerts,...x.options,...x.context]) {
    assert.ok(card.id && card.title && card.summary);
    assert.ok(card.sources.length>0);
    assert.ok(card.sources.every(id=>ids.has(id)),card.id);
  }
});
