import test from 'node:test';import assert from 'node:assert/strict';
import {consultationRoute,PATHOLOGY_ROUTES} from '../src/clinical/rutas-patologia.mjs';
for(const id of Object.keys(PATHOLOGY_ROUTES)){
 test(id+': la situación no se presume y no se registran pruebas realizadas',()=>{assert.equal(consultationRoute(id).modeRequired,true);for(const mode of ['recent','known']){const r=consultationRoute(id,mode);assert.equal(r.testsPerformed,false);assert.ok(r.evaluation.length);assert.ok(r.followup.length>=2);assert.ok(r.sources.every(x=>x.startsWith('https://')));assert.ok(r.escalate.length>30);}});
 test(id+': enfermedad conocida reutiliza resultados en lugar de imponer el estudio inicial',()=>{const a=consultationRoute(id,'recent'),b=consultationRoute(id,'known');assert.notDeepEqual(a.evaluation,b.evaluation);assert.equal(b.evaluation.length,1);assert.deepEqual(a.followup,b.followup);});
}
test('calendarios clínicos distinguen control temprano y estabilidad',()=>{
 assert.match(JSON.stringify(consultationRoute('dm2','recent').followup),/3 meses/);
 assert.match(JSON.stringify(consultationRoute('hta','known').followup),/2–4 semanas/);
 assert.match(JSON.stringify(consultationRoute('erc','known').evaluation),/trayectoria/);
 assert.match(JSON.stringify(consultationRoute('ic','known').followup),/6 meses/);
 assert.match(JSON.stringify(consultationRoute('hepatico','recent').followup),/1–3 años/);
});
