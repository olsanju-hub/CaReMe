import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraft,setValue} from '../src/model.mjs';
import {auditCrossDomain} from '../src/clinical/auditoria.mjs';
import {integratePatient} from '../src/clinical/integracion.mjs';
import {evaluateDm2Quick} from '../src/clinical/dm2-rapida.mjs';
import {evaluateDm2Detail} from '../src/clinical/dm2-detallada.mjs';
import {reviewDrug} from '../src/clinical/farmacologia.mjs';
const d=items=>Object.entries(items).reduce((x,[k,v])=>
 setValue(x,k,Array.isArray(v)?JSON.stringify(v):String(v)),createDraft());
const base={dm2:'Sí',dm1:'No',edad:'62',embarazo:'No procede',
 hba1c:'7.3',dm_objetivo_valor:'7',dm_hba1c_fiable:'Fiable tras comprobación',
 dm_hipoglucemias:'No referidas',dm_sintomas:'Ausentes',
 dm_adherencia:'Adecuada confirmada',dm_dosis_confirmadas:'Sí',
 medicacion_revisada:'Sí',alergias_revisadas:'Sí',
 dm_control:'Fuera del objetivo · HbA1c inferior a 8,5 %',
 dm_prioridad:['Insuficiencia cardíaca'],ic:'Sí',
 tfge:'60',farmacos_clases:['Metformina'],
 situacion_aguda:'Estable sin proceso agudo grave'};
for(const [label,field,value,expectedRule] of [
 ['glucemia ≥300','glucemia_actual','300','SEVERE_GLYCEMIA_REVIEW'],
 ['hipoglucemias graves','dm_hipoglucemias','Graves o recurrentes','SEVERE_HYPOGLYCEMIA_REVIEW'],
 ['gestación','embarazo','Sí','PREGNANCY_DIABETES_PATHWAY']
]){
 test(label+' retiene intervención transversal y mantiene alerta',()=>{
  const data=d({...base,[field]:value});
  assert.ok(auditCrossDomain(data).critical.some(a=>a.id===expectedRule));
  assert.equal(integratePatient(data).options.length,0);
  assert.equal(evaluateDm2Quick(data).options.length,0);
  assert.equal(evaluateDm2Quick(data).state,'seguridad_prioritaria');
  assert.equal(evaluateDm2Detail(data).alternatives.length,0);
  assert.equal(evaluateDm2Detail(data).state,'seguridad_prioritaria');
  assert.equal(reviewDrug(data,'metformina','dm2').state,'bloqueo');
 });
}
test('glucemia 299 mg/dL no activa por sí sola barrera de 300',()=>{
 const data=d({...base,glucemia_actual:'299'});
 assert.ok(!auditCrossDomain(data).critical.some(x=>x.id==='SEVERE_GLYCEMIA_REVIEW'));
 assert.equal(evaluateDm2Quick(data).state,'revision_pendiente');
 assert.equal(evaluateDm2Detail(data).state,'revision_pendiente');
});
test('embarazo no valorado no significa gestación confirmada',()=>{
 const data=d({...base,embarazo:'No valorado'});
 assert.ok(!auditCrossDomain(data).critical.some(x=>x.id==='PREGNANCY_DIABETES_PATHWAY'));
 assert.equal(evaluateDm2Detail(data).state,'datos_insuficientes');
 assert.equal(evaluateDm2Detail(data).alternatives.length,0);
});
