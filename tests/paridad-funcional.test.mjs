import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MODULES, MODULE_BY_ID, moduleFields } from '../src/consultas.mjs';
import { FIELDS, createDraft, setValue } from '../src/model.mjs';
import { evaluateMasld } from '../src/clinical/masld.mjs';
import { evaluateRenal, evaluateFib4 } from '../src/clinical/engine.mjs';

const audit=JSON.parse(readFileSync(new URL('../docs/COBERTURA_FUNCIONAL_GLUCOGUIA.json',import.meta.url),'utf8'));
const moduleIds=['dm2','ic','erc','obesidad','hepatico','insulina'];
const ids=new Set(audit.modules.map(m=>m.id));

test('la auditoría tiene una entrada por cada uno de los seis módulos observados',()=>{
 assert.equal(audit.schema,'cahreme-functional-coverage-v1');
 assert.equal(audit.basis.reference_repo,'aarnal80/diabetes-congreso-mobile');
 assert.equal(audit.basis.reference_version,'GlucoGuía 1.6');
 assert.deepEqual(MODULES.map(m=>m.id),moduleIds);
 assert.deepEqual(audit.modules.map(m=>m.id),moduleIds);
 assert.equal(ids.size,6);
});
test('todas las rutas declaradas conservan campos válidos de captura rápida y detallada',()=>{
 for(const id of moduleIds){
  const m=MODULE_BY_ID[id];
  assert.ok(m, 'Módulo no encontrado '+id);
  for(const mode of ['quick','detail']){
   const fields=moduleFields(id,mode);
   assert.ok(fields.length>0,id+':'+mode);
   for(const field of fields)assert.ok(FIELDS[field],id+':'+mode+':'+field);
  }
  const inspected=audit.modules.find(x=>x.id===id);
  assert.equal(inspected.capture,'implemented');
  assert.ok(['partial','missing','implemented'].includes(inspected.quick_clinical_result));
  assert.ok(['partial','missing','implemented'].includes(inspected.detailed_decision));
  assert.ok(inspected.gap.length>30);
 }
});
test('no se afirma paridad clínica completa antes de probar resultados por módulo',()=>{
 assert.equal(audit.release_gate.verified_full_parity,false);
 assert.equal(audit.release_gate.clinical_validation,'pending');
 assert.equal(audit.release_gate.keep_pr_draft,true);
 assert.equal(audit.release_gate.no_prescription,true);
 assert.equal(audit.modules.filter(x=>x.quick_clinical_result==='implemented'&&x.detailed_decision==='implemented').length,0);
});
test('la matriz reconoce CAC corregido y la nueva vía de FIB-4 informado',()=>{
 const reported= audit.blockers.find(x=>x.id==='REPORTED_FIB4_NOT_USED');
 const cac= audit.blockers.find(x=>x.id==='CAC_UNIT_ABSENT_ASSUMED_MG_G');
 assert.ok(reported && cac);
 assert.equal(reported.status,'resolved_in_branch');
 assert.equal(cac.priority,'P0');
 assert.ok(moduleFields('erc','quick').includes('unidad_cac'));
 assert.ok(moduleFields('hepatico','quick').includes('fib4_informado'));
 const d=setValue(setValue(createDraft(),'edad','55'),'fib4_informado','2.8');
 const r=evaluateFib4(d);
 assert.equal(r.reported.value,2.8);
 assert.equal(r.value,null);
 assert.equal(r.status,'missing'); // El calculador descriptivo anterior no cambia de contrato.
 const directed=evaluateMasld(d);assert.equal(directed.fib4,null); // Sin procedencia no reutiliza el dato externo.
});
test('la matriz refleja CAC corregido, DM2 rápida parcial y paridad completa aún pendiente',()=>{
 const cac=audit.blockers.find(x=>x.id==='CAC_UNIT_ABSENT_ASSUMED_MG_G');
 const dm=audit.modules.find(x=>x.id==='dm2');
 assert.equal(cac.status,'resolved_in_branch');
 assert.equal(dm.quick_clinical_result,'partial');
 assert.equal(dm.detailed_decision,'partial');
 assert.equal(audit.release_gate.verified_full_parity,false);
 assert.ok(audit.blockers.some(x=>['open','partially_resolved'].includes(x.status)));
});
test('insulinización tiene tres rutas con salida parcial y no declara paridad clínica final',()=>{
 const insulin=audit.modules.find(x=>x.id==='insulina');
 assert.equal(insulin.quick_clinical_result,'partial');
 assert.equal(insulin.detailed_decision,'partial');
 assert.match(insulin.gap,/titulación/);
 assert.equal(audit.release_gate.verified_full_parity,false);
 const fields=moduleFields('insulina','detail');
 for(const f of ['insulina_esquema','insulina_ayunas_objetivo',
   'insulina_posprandial','insulina_motivo_simplificacion']){
  assert.ok(fields.includes(f),'Falta '+f);
 }
});
test('la matriz identifica expresamente las limitaciones del clasificador renal',()=>{
 const risk=audit.blockers.find(x=>x.id==='CAC_UNIT_ABSENT_ASSUMED_MG_G');
 assert.match(risk.finding,/unidad_cac/);
 let d=setValue(createDraft(),'tfge','56');
 d=setValue(d,'cac','65');
 d=setValue(d,'persistencia','Sí');
 const result=evaluateRenal(d);
 if(result.categories.albuminuria!==null){
  assert.equal(audit.release_gate.verified_full_parity,false,
    'Si el motor acepta CAC sin unidad, la auditoría no debe aprobar paridad');
 }
});

