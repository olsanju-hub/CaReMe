import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('acceso CV adicional conserva seis consultas, comparte datos e invalida resultado editado',async()=>{
 const handlers={};let removed=false;
 const root={innerHTML:'',addEventListener:(type,fn)=>handlers[type]=fn};
 globalThis.document={getElementById:id=>id==='app'?root:{textContent:'',remove(){removed=true}},querySelectorAll:()=>[]};
 globalThis.scrollTo=()=>{};globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,data={})=>handlers.click({target:{closest:()=>({dataset:{action,...data}})}});
 const set=(id,value)=>handlers.input({target:{closest:()=>({dataset:{field:id},value,type:'text'})}});
 assert.equal((root.innerHTML.match(/class="module-card"/g)||[]).length,6);
 click('cv-risk');assert.match(root.innerHTML,/Elegibilidad y datos disponibles/);
 for(const [id,value] of Object.entries({edad:'50',cv_sexo_modelo:'Hombre',cv_region:'España · región ESC de riesgo bajo',
 tabaco:'Actual',ecv:'No',ic:'No',dm1:'No',dm2:'No',erc:'No',embarazo:'No procede',cv_hfamiliar:'No',cv_sintomas:'No',
 pas:'140',pad:'85',fecha_pas:'2026-11-12',colesterol_total:String(5.5*38.67),hdl:String(1.3*38.67),ldl:'130',
 fecha_lipidos:'2026-11-10',fecha_evaluacion:'2026-11-12'}))set(id,value);
 click('cv-risk-result');assert.match(root.innerHTML,/5.9 % a 10 años/);
 set('dm2','Sí');assert.equal(removed,true);click('cv-risk-result');
 assert.doesNotMatch(root.innerHTML,/5.9 % a 10 años/);assert.match(root.innerHTML,/SCORE2-Diabetes/);
 click('start-module',{module:'dm2'});click('module-mode',{mode:'detail'});
 assert.match(root.innerHTML,/value="50"/);
});
test('servidor y caché incluyen el nuevo motor',()=>{
 for(const path of ['../server.mjs','../service-worker.js'])assert.match(readFileSync(new URL(path,import.meta.url),'utf8'),/src\/clinical\/riesgo-cv.mjs/);
});
