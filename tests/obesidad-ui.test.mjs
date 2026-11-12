import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleFields} from '../src/consultas.mjs';
test('obesidad rápida/detallada y resumen comparten captura e invalidan resultado',async()=>{
 const handlers={};let removed=false;
 const root={innerHTML:'',addEventListener:(type,fn)=>handlers[type]=fn};
 globalThis.document={getElementById:id=>id==='app'?root:{textContent:'',remove(){removed=true}},querySelectorAll:()=>[]};
 globalThis.scrollTo=()=>{};globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,data={})=>handlers.click({target:{closest:()=>({dataset:{action,...data}})}});
 const set=(id,value)=>handlers.input({target:{closest:()=>({dataset:{field:id},value,type:'text'})}});
 assert.equal((root.innerHTML.match(/class="module-card"/g)||[]).length,6);
 click('start-module',{module:'obesidad'});set('imc','32');click('obesity-result');assert.match(root.innerHTML,/IMC 32.00/);assert.match(root.innerHTML,/Información necesaria/);
 set('imc','36');assert.equal(removed,true);click('obesity-result');assert.match(root.innerHTML,/IMC 36.00/);assert.doesNotMatch(root.innerHTML,/IMC 32.00/);
 click('module-mode',{mode:'detail'});
 for(const id of moduleFields('obesidad','detail'))assert.equal((root.innerHTML.match(new RegExp('data-field-id="'+id+'"','g'))||[]).length,1,id+' una vez');
 assert.match(root.innerHTML,/Hábitos y preservación muscular/);assert.match(root.innerHTML,/Objetivos, evolución y plan confirmado/);
 click('obesity-result');assert.match(root.innerHTML,/data-drug-id="semaglutida_wegovy_sc" data-route-id="peso"/);
 click('open-drug',{drugId:'semaglutida_wegovy_sc',routeId:'peso'});assert.match(root.innerHTML,/Wegovy/);
 click('start-module',{module:'obesidad'});click('module-mode',{mode:'review'});assert.match(root.innerHTML,/Plan de peso, función y seguimiento/);assert.doesNotMatch(root.innerHTML,/Aquí aparecerán situación/);
 click('summary');assert.match(root.innerHTML,/Ver recorrido de obesidad/);click('tools');assert.doesNotMatch(root.innerHTML,/Algoritmo pendiente/);
});
test('servidor y caché incluyen obesidad',()=>{
 for(const path of ['../server.mjs','../service-worker.js'])assert.match(readFileSync(new URL(path,import.meta.url),'utf8'),/src\/clinical\/obesidad.mjs/);
});
