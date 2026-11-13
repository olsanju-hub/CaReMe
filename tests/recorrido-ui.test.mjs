import test from 'node:test';import assert from 'node:assert/strict';
import {createDraft,setValue,setCalculatedMeasurement} from '../src/model.mjs';
test('FIB4 calculado conserva procedencia local y se invalida al editar analítica',()=>{let d=createDraft();for(const[k,v]of Object.entries({edad:60,ast:30,alt:25,plaquetas:200}))d=setValue(d,k,String(v));d=setCalculatedMeasurement(d,'fib4_informado',1.8,['edad','ast','alt','plaquetas']);assert.equal(d.values.masld_fib4_origen,'Calculado desde analítica');assert.notEqual(d.values.masld_fib4_confirmado,'Sí');assert.equal(d.values.fib4_informado,'1.8');d=setValue(d,'ast','40');assert.equal(d.values.fib4_informado,undefined);});
test('recorrido por patología permite tratamiento directo y cálculo integrado sin duplicar edad',async()=>{
 const handlers={},root={innerHTML:'',addEventListener:(type,fn)=>handlers[type]=fn};globalThis.document={getElementById:id=>id==='app'?root:{remove(){}},querySelectorAll:()=>[]};globalThis.scrollTo=()=>{};
 await import('../src/app.mjs');const click=(action,data={})=>handlers.click({target:{closest:()=>({dataset:{action,...data}})}});
 assert.equal((root.innerHTML.match(/data-action="open-pathology"/g)||[]).length,8);assert.doesNotMatch(root.innerHTML,/bottom-nav|integral-access/);
 click('open-pathology',{pathology:'dm2'});assert.match(root.innerHTML,/Diagnóstico confirmado: ir a tratamiento/);assert.doesNotMatch(root.innerHTML,/data-field=/);
 click('flow-stage',{stage:'3'});assert.match(root.innerHTML,/flow-treatment/);assert.doesNotMatch(root.innerHTML,/medication-list|module-tabs/);
 handlers.change({target:{id:'flow-treatment',value:'metformina'}});assert.match(root.innerHTML,/Calcular pauta/);assert.match(root.innerHTML,/data-field="tfge"/);
 click('flow-insulin');assert.match(root.innerHTML,/data-field="ins_calc_accion"/);assert.doesNotMatch(root.innerHTML,/data-action="module-dose-result"/);
 click('open-pathology',{pathology:'hepatico'});click('flow-stage',{stage:'2'});assert.equal((root.innerHTML.match(/data-field="edad"/g)||[]).length,1);assert.match(root.innerHTML,/data-field="ast"/);
});
