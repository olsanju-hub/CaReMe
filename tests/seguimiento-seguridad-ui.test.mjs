import test from 'node:test';
import assert from 'node:assert/strict';
test('calendario conserva fecha pero retiene referencia cuando falta contexto o aparece alarma aguda',async()=>{
 const handlers={},app={innerHTML:'',addEventListener:(name,fn)=>handlers[name]=fn};
 const form={'action-type':{value:'inicio'},'action-date':{value:'2026-11-01'},'action-dose':{value:'20'},'action-confirm':{checked:true}};
 globalThis.document={getElementById:id=>id==='app'?app:form[id]||{textContent:''},querySelectorAll:()=>[]};globalThis.scrollTo=()=>{};globalThis.confirm=()=>true;
 await import('../src/app.mjs');
 const click=(action,data={})=>handlers.click({target:{closest:()=>({dataset:{action,...data}})}});
 const set=(id,value)=>handlers.input({target:{closest:()=>({dataset:{field:id},value,type:'text'})}});
 const followup=()=>{click('tools');click('open-drug',{drugId:'finerenona',routeId:'erc_dm2'});click('followup');};
 followup();click('confirm-med-action');assert.match(app.innerHTML,/2026-11-29/);assert.match(app.innerHTML,/Referencia retenida/);
 click('evaluation');
 for(const [k,v] of Object.entries({edad:'60',embarazo:'No procede',fecha_evaluacion:'2026-11-13',situacion_aguda:'Estable sin proceso agudo grave',lra_sospecha:'No',medicacion_revisada:'Sí',fin_estado:'En tratamiento'}))set(k,v);
 followup();assert.match(app.innerHTML,/Control de referencia para revisión/);
 click('evaluation');set('cetoacidosis_sospecha','Sí');set('situacion_aguda','');followup();assert.match(app.innerHTML,/Referencia retenida/);assert.match(app.innerHTML,/2026-11-29/);assert.doesNotMatch(app.innerHTML,/Control de referencia para revisión/);
});
