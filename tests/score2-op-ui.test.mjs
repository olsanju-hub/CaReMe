import test from 'node:test';
import assert from 'node:assert/strict';
test('interfaz distingue resultado externo y lo retiene tras modificar datos',async()=>{
 const handlers={};let removed=false;
 const root={innerHTML:'',addEventListener:(type,fn)=>handlers[type]=fn};
 globalThis.document={getElementById:id=>id==='app'?root:{textContent:'',remove(){removed=true}},querySelectorAll:()=>[]};
 globalThis.scrollTo=()=>{};globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,data={})=>handlers.click({target:{closest:()=>({dataset:{action,...data}})}});
 const set=(id,value)=>handlers.input({target:{closest:()=>({dataset:{field:id},value,type:'text'})}});
 click('cv-risk');click('cv-expand');
 for(const [id,value] of Object.entries({edad:'75',cv_sexo_modelo:'Hombre',cv_region:'España · región ESC de riesgo bajo',
 tabaco:'Nunca',ecv:'No',ic:'No',dm1:'No',dm2:'No',erc:'No',embarazo:'No procede',cv_hfamiliar:'No',cv_sintomas:'No',
 pas:'135',pad:'80',fecha_pas:'2026-11-12',colesterol_total:'210',hdl:'50',ldl:'130',fecha_lipidos:'2026-11-10',fecha_evaluacion:'2026-11-12'}))set(id,value);
 click('cv-risk-result');assert.match(root.innerHTML,/SCORE2-OP calculado externamente/);
 for(const [id,value] of Object.entries({cv_op_porcentaje:'12.3',cv_op_fecha:'2026-11-12',cv_op_fuente:'HeartScore ESC · SCORE2-OP a 10 años',cv_op_contexto:'Revisados por el profesional',cv_op_confirmado:'Sí'}))set(id,value);
 click('cv-risk-result');assert.match(root.innerHTML,/12.3 % a 10 años/);assert.match(root.innerHTML,/no calculado por CaHReMe/);
 set('pas','140');assert.equal(removed,true);click('cv-risk-result');assert.doesNotMatch(root.innerHTML,/12.3 % a 10 años/);
 assert.match(root.innerHTML,/Confirmar de nuevo/);
});
