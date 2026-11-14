import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue} from '../src/model.mjs';
import {evaluateRenal,albuminuriaCategory} from '../src/clinical/engine.mjs';
import {auditCrossDomain} from '../src/clinical/auditoria.mjs';
import {integratePatient} from '../src/clinical/integracion.mjs';
import {reviewDrug} from '../src/clinical/farmacologia.mjs';

const d=data=>Object.entries(data).reduce((x,[k,v])=>setValue(x,k,String(v)),createDraft());
test('CAC sin unidad explícita queda no interpretable incluso si el número parece mg/g',()=>{
 const v=d({dm2:'Sí',erc:'Sí',persistencia:'Sí',tfge:'55',cac:'250',potasio:'4.5'});
 const renal=evaluateRenal(v);
 assert.equal(renal.categories.gfr,'G3a');
 assert.equal(renal.categories.albuminuria,null);
 assert.equal(renal.inputs.acr.state,'invalid');
 assert.equal(auditCrossDomain(v).requiresResolution,true);
 assert.ok(auditCrossDomain(v).critical.some(x=>x.id==='CAC_UNIT_MISSING'));
 assert.equal(integratePatient(v).options.length,0);
 assert.equal(reviewDrug(v,'finerenona','erc_dm2').state,'bloqueo');
});
test('CAC 30 a 300 corresponde a A2 y >300 corresponde a A3 en KDIGO',()=>{
 const values=[[29.99,'A1'],[30,'A2'],[299.99,'A2'],[300,'A2'],[300.01,'A3']];
 for(const [n,a] of values){
  assert.equal(albuminuriaCategory(n),a);
  assert.equal(evaluateRenal(d({tfge:'65',cac:String(n),unidad_cac:'mg/g'}))
   .categories.albuminuria,a);
 }
});
test('mg/mmol y unidad No consta no se reinterpretan por conversión silenciosa',()=>{
 for(const unit of ['mg/mmol','No consta']){
  const v=d({tfge:'50',cac:'30',unidad_cac:unit,persistencia:'Sí'});
  const renal=evaluateRenal(v);
  assert.equal(renal.categories.albuminuria,null);
  assert.equal(auditCrossDomain(v).requiresResolution,true);
  assert.equal(integratePatient(v).options.length,0);
 }
});
test('CAC ausente no produce alerta falsa de unidad ausente',()=>{
 const v=d({tfge:'50',erc:'Sí'});
 assert.ok(!auditCrossDomain(v).findings.some(x=>x.id==='CAC_UNIT_MISSING'));
 assert.equal(evaluateRenal(v).categories.albuminuria,null);
});
test('la corrección de unidad restaura categoría pero no confirma diagnóstico de ERC',()=>{
 const v=d({tfge:'80',cac:'300',unidad_cac:'mg/g',persistencia:'No consta'});
 const renal=evaluateRenal(v);
 assert.equal(renal.categories.albuminuria,'A2');
 assert.equal(renal.chronicConfirmed,false);
 assert.equal(renal.markerPresent,true);
 assert.match(renal.message,/No se ha documentado cronicidad/);
});
