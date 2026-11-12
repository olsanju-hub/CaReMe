import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('plan al inicio de síntesis, navegación por área y recálculo tras editar',async()=>{
 const handlers={};
 const root={innerHTML:'',addEventListener:(type,fn)=>handlers[type]=fn};
 globalThis.document={getElementById:id=>id==='app'?root:{textContent:'',remove(){}},querySelectorAll:()=>[]};
 globalThis.scrollTo=()=>{};globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,data={})=>handlers.click({target:{closest:()=>({dataset:{action,...data}})}});
 const set=(id,value)=>handlers.input({target:{closest:()=>({dataset:{field:id},value,type:'text'})}});
 click('summary');assert.equal((root.innerHTML.match(/id="integrated-plan"/g)||[]).length,1);assert.match(root.innerHTML,/Las áreas no evaluadas no se consideran normales/);assert.ok(root.innerHTML.indexOf('id="integrated-plan"')<root.innerHTML.indexOf('class="summary-grid"'));
 click('lipids');set('lip_alarma','Sí');click('summary');assert.match(root.innerHTML,/Resolver primero las alertas de seguridad/);assert.match(root.innerHTML,/Dolor abdominal intenso/);
 click('lipids');set('lip_alarma','No');click('summary');assert.doesNotMatch(root.innerHTML,/Resolver primero las alertas de seguridad/);
 click('start-module',{module:'obesidad'});
 const values={edad:'60',embarazo:'No procede',fecha_evaluacion:'2026-11-12',imc:'32',ob_lactancia:'No procede',ob_fecha_medidas:'2026-11-10',dm2:'No',comorbilidad_peso_confirmada:'No',ob_acuerdo:'Sí',ob_complicaciones_revisadas:'Sí',ob_perdida_involuntaria:'No',ob_edema:'No',ob_tca:'No',ob_musculo:'No tras valoración',ob_secundaria:'No',ob_alimentacion:'Sí',ob_actividad:'Sí',ob_limitacion_ejercicio:'No',ob_sueno_psicosocial:'Sí',ob_farmaco_actual:'Ninguno',ob_objetivo:'Mantenimiento y función',ob_objetivo_salud:'<script>alert(1)</script>'};
 for(const [id,value] of Object.entries(values))set(id,value);
 click('summary');assert.doesNotMatch(root.innerHTML,/<script>alert\(1\)<\/script>/);assert.match(root.innerHTML,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
 click('tools');assert.equal((root.innerHTML.match(/id="integrated-plan"/g)||[]).length,1);
 click('new');click('summary');assert.match(root.innerHTML,/Actuaciones registradas: 0/);assert.doesNotMatch(root.innerHTML,/alert\(1\)/);
});
test('servidor y caché incluyen plan integral',()=>{
 for(const path of ['../server.mjs','../service-worker.js'])assert.match(readFileSync(new URL(path,import.meta.url),'utf8'),/src\/clinical\/plan-integral.mjs/);
});
