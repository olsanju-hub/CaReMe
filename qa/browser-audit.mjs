import {chromium,webkit} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4173'},stdio:'ignore'});
const url='http://localhost:4173/';
try{
 for(let i=0;i<60;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 await mkdir('qa-results',{recursive:true});
 for(const [name,engine,viewport] of [['chromium',chromium,{width:1280,height:800}],['webkit-mobile',webkit,{width:390,height:844}]]){
  const browser=await engine.launch();try{
   const ctx=await browser.newContext({viewport,serviceWorkers:'allow'});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(url);await page.getByRole('heading',{name:'CaHReMe',exact:true}).waitFor();assert.match(await page.locator('footer').innerText(),/v0\.75/);await page.screenshot({path:'qa-results/'+name+'-home.png',fullPage:true});
   await page.getByRole('button',{name:'Insuficiencia cardíaca',exact:true}).click();await page.getByRole('heading',{name:'Insuficiencia cardiaca',exact:true}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
   await page.screenshot({path:'qa-results/'+name+'-ic.png',fullPage:true});
   for(const id of ['clasificacion','tratamiento','optimizacion','seguimiento','comorbilidades','derivacion','avanzada','calculadoras','farmacoteca','evidencia','descompensada']){
    await page.locator('[data-section="'+id+'"]').first().click();await page.getByRole('heading',{name:'Pendiente de desarrollo'}).waitFor();await page.getByRole('button',{name:'Insuficiencia cardiaca',exact:false}).first().click();await page.getByRole('heading',{name:'Insuficiencia cardiaca',exact:true}).waitFor();
   }
   await page.locator('[data-action="ic-section"][data-section="valoracion"]').click();await page.getByRole('heading',{name:'Recorrido guiado'}).waitFor();await page.locator('[data-action="ic"]').first().click();
   await page.locator('[data-action="ic-section"][data-section="diagnostico"]').click();await page.getByRole('heading',{name:'Diagnóstico',exact:true}).waitFor();
   assert.equal(await page.locator('[data-action="diagnostic-section"]').count(),5);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Diagnosis has no horizontal overflow');
   await page.screenshot({path:'qa-results/'+name+'-diagnosis.png',fullPage:true});
   for(const id of ['asistente','sospecha','pruebas','peptidos','ecocardiografia']){
    await page.locator('[data-action="diagnostic-section"][data-section="'+id+'"]').click();if(id==='sospecha'){
     await page.getByRole('heading',{name:'Sospecha clínica',exact:true}).waitFor();await page.getByRole('heading',{name:'Completar seguridad'}).waitFor();
     await page.locator('[data-finding="respiratory"]').check();await page.getByRole('heading',{name:'Alarma clínica'}).waitFor();assert.match(await page.locator('.sus-bar').innerText(),/Alarma clínica/);assert.equal(await page.locator('[data-action="open-urgent"]').count(),1);assert.equal(await page.locator('[data-action="continue-study"]').count(),0);
     await page.locator('[data-finding="respiratory"]').uncheck();
     await page.getByRole('heading',{name:'Completar seguridad'}).waitFor();
     await page.locator('[data-action="complete-safety"]').click();assert.equal(await page.evaluate(()=>document.activeElement.dataset.finding),'vitalsReviewed');
     assert.equal(await page.locator('[data-review-all]').count(),1);
     assert.equal(await page.locator('[data-review-group]').count(),0);
     await page.locator('[data-finding="vitalsReviewed"]').check();
     await page.getByRole('heading',{name:'Completar seguridad'}).waitFor();
     await page.locator('.sus-group').filter({has:page.getByText('Síntomas',{exact:true})}).locator('summary').click();
     await page.locator('[data-finding="dyspnea"]').check();
     await page.getByRole('heading',{name:'Completar seguridad'}).waitFor();
     await page.locator('[data-action="show-suspicion-result"]').click();
     await page.locator('[data-review-all]').check();
     await page.getByRole('heading',{name:'Hallazgos compatibles con IC'}).waitFor();
     assert.match(await page.locator('.sus-bar').innerText(),/Hallazgos compatibles con IC/);
     assert.match(await page.locator('#suspicion-result').innerText(),/Disnea de esfuerzo/);
     assert.equal(await page.locator('[data-finding="dyspnea"]').isChecked(),true);
     await page.locator('[data-action="continue-study"]').click();await page.getByRole('heading',{name:'Pruebas diagnósticas',exact:true}).waitFor();
     assert.match(await page.locator('.study-page').innerText(),/Sospecha clínica de IC/);
     await page.locator('[data-investigation="ecg"]').selectOption('requested');
     await page.locator('[data-action="diagnostic-section"][data-section="sospecha"]').click();
     await page.getByRole('heading',{name:'Sospecha clínica',exact:true}).waitFor();
     await page.locator('.sus-group').filter({has:page.getByText('Síntomas',{exact:true})}).locator('summary').click();
     assert.equal(await page.locator('[data-finding="dyspnea"]').isChecked(),true);
     await page.locator('[data-finding="dyspnea"]').uncheck();
     assert.equal(await page.locator('[data-review-all]').isChecked(),false);
     await page.getByRole('heading',{name:'Evaluación clínica incompleta'}).waitFor();
     await page.locator('[data-action="complete-review"]').click();assert.equal(await page.evaluate(()=>document.activeElement.closest('details').dataset.suspicionGroup),'symptoms');
     await page.locator('[data-review-all]').check();
     await page.getByRole('heading',{name:'Sin hallazgos registrados compatibles'}).waitFor();
     await page.locator('[data-review-all]').uncheck();
     await page.getByRole('heading',{name:'Completar seguridad'}).waitFor();
     assert.equal(await page.locator('select[data-finding]').count(),0);
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Sospecha sin desbordamiento horizontal');
     await page.screenshot({path:'qa-results/'+name+'-suspicion.png',fullPage:true});
    }else if(id==='asistente'){await page.getByRole('heading',{name:'Recorrido guiado'}).waitFor();await page.locator('[data-action="ic"]').first().click();await page.locator('[data-action="ic-section"][data-section="diagnostico"]').click();continue;}
    else if(id==='pruebas'){await page.getByRole('heading',{name:'Pruebas diagnósticas',exact:true}).waitFor();assert.equal(await page.locator('[data-investigation="ecg"]').inputValue(),'requested');}
    else await page.getByRole('heading',{name:'Pendiente de desarrollo'}).waitFor();
    await page.locator('[data-action="diagnosis"]').click();await page.getByRole('heading',{name:'Diagnóstico',exact:true}).waitFor();
   }
   await page.locator('[data-action="diagnostic-evidence"]').click();await page.getByRole('heading',{name:'Referencias científicas',exact:true}).waitFor();
   await page.locator('[data-action="diagnosis"]').click();
   await page.locator('[data-action="ic-section"][data-section="descompensada"]').click();await page.getByRole('heading',{name:'IC descompensada',exact:true}).waitFor();
   await page.locator('[data-action="ic"]').click();await page.getByRole('heading',{name:'Insuficiencia cardiaca',exact:true}).waitFor();
   await page.getByRole('button',{name:'CaHReMe',exact:false}).first().click();await page.getByRole('heading',{name:'CaHReMe',exact:true}).waitFor();
   await page.getByRole('button',{name:'Diabetes tipo 2',exact:true}).click();await page.getByRole('heading',{name:'Pendiente de desarrollo'}).waitFor();assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 }
}finally{server.kill();}
