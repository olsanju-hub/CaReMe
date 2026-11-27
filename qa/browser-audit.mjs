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
   await page.goto(url);await page.getByRole('heading',{name:'CaHReMe',exact:true}).waitFor();assert.match(await page.locator('footer').innerText(),/v0\.87/);await page.screenshot({path:'qa-results/'+name+'-home.png',fullPage:true});
   await page.getByRole('button',{name:'Insuficiencia cardíaca',exact:true}).click();await page.getByRole('heading',{name:'Insuficiencia cardiaca',exact:true}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
   await page.screenshot({path:'qa-results/'+name+'-ic.png',fullPage:true});
   for(const id of ['tratamiento','optimizacion','seguimiento','comorbilidades','derivacion','avanzada','calculadoras','farmacoteca','evidencia','descompensada']){
    await page.locator('[data-section="'+id+'"]').first().click();await page.getByRole('heading',{name:'Pendiente de desarrollo'}).waitFor();await page.getByRole('button',{name:'Insuficiencia cardiaca',exact:false}).first().click();await page.getByRole('heading',{name:'Insuficiencia cardiaca',exact:true}).waitFor();
   }
   await page.locator('[data-action="ic-section"][data-section="clasificacion"]').click();
   await page.getByRole('heading',{name:'Clasificación',exact:true}).waitFor();
   assert.equal(await page.locator('.class-tile').count(),4);assert.match(await page.locator('.class-grid').innerText(),/FEVI pendiente/);
   if(name==='webkit-mobile')assert.ok(await page.locator('.class-page .sus-result-button').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight),'Portada clasificación compacta');
   await page.screenshot({path:'qa-results/'+name+'-classification.png',fullPage:true});
   await page.locator('[data-action="classification-section"][data-section="estadio"]').click();
   await page.getByRole('heading',{name:'Estadio evolutivo',exact:true}).waitFor();
   assert.equal(await page.locator('.stage-question:visible').count(),1);
   await page.locator('[data-action="stage-result"]').click();await page.getByRole('heading',{name:'Estadio indeterminado'}).waitFor();
   await page.locator('[data-action="stage-edit"]').click();
   await page.locator('[data-stage-key="manifestations"][data-stage-value="no"]').click();
   await page.locator('[data-stage-key="objective"][data-stage-value="no"]').click();
   await page.locator('[data-stage-key="risk"][data-stage-value="yes"]').click();
   if(name==='webkit-mobile')assert.ok(await page.locator('[data-action="stage-result"]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight),'Estadio: acción visible');
   await page.locator('[data-action="stage-result"]').click();await page.getByRole('heading',{name:'Estadio A · Riesgo de IC'}).waitFor();
   await page.screenshot({path:'qa-results/'+name+'-stage.png',fullPage:true});
   await page.locator('.stage-page .sus-result-button').click();await page.getByRole('heading',{name:'Clasificación',exact:true}).waitFor();
   assert.match(await page.locator('[data-section="estadio"]').innerText(),/Riesgo de IC/);
   for(const id of ['fenotipo','nyha','situacion','evolucion']){
    await page.locator('[data-action="classification-section"][data-section="'+id+'"]').click();await page.getByRole('heading',{name:'Pendiente de desarrollo'}).waitFor();
    await page.locator('[data-action="classification"]').click();await page.getByRole('heading',{name:'Clasificación',exact:true}).waitFor();
   }
   await page.locator('[data-action="ic"]').click();await page.getByRole('heading',{name:'Insuficiencia cardiaca',exact:true}).waitFor();
   await page.locator('[data-action="ic-section"][data-section="valoracion"]').click();await page.getByRole('heading',{name:'Recorrido guiado'}).waitFor();await page.locator('[data-action="ic"]').first().click();
   await page.locator('[data-action="ic-section"][data-section="diagnostico"]').click();await page.getByRole('heading',{name:'Diagnóstico',exact:true}).waitFor();
   assert.equal(await page.locator('[data-action="diagnostic-section"]').count(),5);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Diagnosis has no horizontal overflow');
   await page.screenshot({path:'qa-results/'+name+'-diagnosis.png',fullPage:true});
   for(const id of ['asistente','sospecha','pruebas','peptidos','ecocardiografia']){
    await page.locator('[data-action="diagnostic-section"][data-section="'+id+'"]').click();if(id==='sospecha'){
     await page.getByRole('heading',{name:'Sospecha clínica',exact:true}).waitFor();await page.locator('.sus-safety-axis').getByText('Estabilidad pendiente de valorar',{exact:true}).waitFor();
     await page.locator('[data-finding="respiratory"]').check();await page.locator('.sus-safety-axis').getByText('Alarma clínica',{exact:true}).waitFor();assert.match(await page.locator('.sus-bar').innerText(),/Alarma clínica/);assert.equal(await page.locator('[data-action="open-urgent"]').count(),1);assert.equal(await page.locator('[data-action="continue-study"]').count(),0);
     await page.locator('[data-finding="respiratory"]').uncheck();
     await page.locator('.sus-safety-axis').getByText('Estabilidad pendiente de valorar',{exact:true}).waitFor();
     await page.locator('[data-action="complete-safety"]').click();assert.equal(await page.evaluate(()=>document.activeElement.dataset.finding),'vitalsReviewed');
     assert.equal(await page.locator('[data-review-all]').count(),1);
     assert.equal(await page.locator('[data-review-group]').count(),0);
     await page.locator('[data-action="continue-study"]').click();await page.getByRole('heading',{name:'Pruebas diagnósticas',exact:true}).waitFor();await page.getByRole('heading',{name:'Seguridad pendiente'}).waitFor();
     await page.locator('[data-finding="vitalsReviewed"]').check();
     await page.locator('.study-context>summary').click();await page.locator('.study-context [data-action="diagnostic-section"][data-section="sospecha"]').click();await page.getByRole('heading',{name:'Sospecha clínica',exact:true}).waitFor();
     await page.locator('.sus-safety-axis').getByText('Estabilidad pendiente de valorar',{exact:true}).waitFor();
     await page.locator('.sus-group').filter({has:page.getByText('Síntomas',{exact:true})}).locator('summary').click();
     await page.locator('[data-finding="dyspnea"]').check();
     await page.getByRole('heading',{name:'Síntomas inespecíficos: considerar IC'}).waitFor();
     await page.locator('.sus-safety-axis').getByText('Estabilidad pendiente de valorar',{exact:true}).waitFor();
     await page.locator('[data-action="show-suspicion-result"]').click();
     await page.locator('[data-review-all]').check();
     await page.getByRole('heading',{name:'Síntomas inespecíficos: considerar IC'}).waitFor();
     assert.match(await page.locator('.sus-bar').innerText(),/Síntomas inespecíficos: considerar IC/);
     assert.match(await page.locator('#suspicion-result').innerText(),/Disnea de esfuerzo/);await page.screenshot({path:'qa-results/'+name+'-profile.png',fullPage:true});
     assert.equal(await page.locator('[data-finding="dyspnea"]').isChecked(),true);
     await page.locator('[data-action="continue-study"]').click();await page.getByRole('heading',{name:'Pruebas diagnósticas',exact:true}).waitFor();
     assert.match(await page.locator('.study-context>summary').innerText(),/Síntomas inespecíficos: considerar IC/);
     assert.equal(await page.locator('.study-block').count(),4);
     assert.equal(await page.locator('.study-block[open]').count(),0);
     assert.equal(await page.locator('.study-links .ic-card').count(),2);
     assert.equal(await page.locator('[data-investigation]').count(),0);
     assert.equal(await page.locator('.study-page input:visible,.study-page select:visible').count(),0);
     if(name==='webkit-mobile')assert.ok(await page.locator('.study-next').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight),'Botón principal visible en pantalla inicial móvil');
     await page.screenshot({path:'qa-results/'+name+'-study-compact.png',fullPage:true});
     await page.locator('.study-block').filter({has:page.getByText('Electrocardiograma',{exact:true})}).locator('summary').first().click();
     await page.locator('[data-study-result="ecg"]').selectOption('af');
     await page.locator('.study-block').filter({has:page.getByText('Radiografía de tórax',{exact:true})}).locator('summary').first().click();
     assert.equal(await page.locator('[data-study-result="rx"]').isVisible(),true);
     assert.equal(await page.locator('[data-investigation]').count(),0);
     await page.locator('[data-study-result="rx"]').selectOption('congestion');
     await page.locator('.study-block').filter({has:page.getByText('Radiografía de tórax',{exact:true})}).locator('summary').first().click();
     await page.locator('.study-block').filter({has:page.getByText('Analítica',{exact:true})}).locator('summary').first().click();
     assert.equal(await page.locator('.lab-priority input:visible').count(),3);
     assert.equal(await page.locator('.lab-extra-fields input:visible').count(),0);
     await page.locator('.lab-request>summary').click();assert.match(await page.locator('.lab-request').innerText(),/Cociente albúmina\/creatinina urinario/);
     assert.equal(await page.locator('[data-action="copy-lab-request"]').isVisible(),true);await page.locator('.lab-request>summary').click();
     await page.locator('.lab-more>summary').click();await page.locator('[data-lab-id="ferritin"]').click();
     assert.equal(await page.locator('[data-study-result="ferritin"]').isVisible(),true);await page.locator('[data-study-result="ferritin"]').fill('80');await page.locator('[data-study-result="ferritin"]').press('Tab');
     await page.locator('.lab-more>summary').click();
     await page.locator('[data-study-result="egfr"]').fill('45');await page.locator('[data-study-result="egfr"]').press('Tab');
     assert.equal(await page.locator('[data-study-result="egfr"]').getAttribute('aria-invalid'),'false');
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Pruebas sin desbordamiento');
     await page.locator('.study-context>summary').click();await page.locator('.study-context [data-action="diagnostic-section"][data-section="sospecha"]').click();
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
     await page.locator('.sus-safety-axis').getByText('Estabilidad pendiente de valorar',{exact:true}).waitFor();
     assert.equal(await page.locator('select[data-finding]').count(),0);
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Sospecha sin desbordamiento horizontal');
     await page.screenshot({path:'qa-results/'+name+'-suspicion.png',fullPage:true});
    }else if(id==='asistente'){await page.getByRole('heading',{name:'Recorrido guiado'}).waitFor();await page.locator('[data-action="ic"]').first().click();await page.locator('[data-action="ic-section"][data-section="diagnostico"]').click();continue;}
    else if(id==='pruebas'){await page.getByRole('heading',{name:'Pruebas diagnósticas',exact:true}).waitFor();assert.equal(await page.locator('[data-investigation]').count(),0);assert.equal(await page.locator('[data-study-result="ecg"]').inputValue(),'af');assert.equal(await page.locator('[data-study-result="rx"]').inputValue(),'congestion');assert.equal(await page.locator('[data-study-result="egfr"]').inputValue(),'45');assert.equal(await page.locator('[data-study-result="ferritin"]').inputValue(),'80');}
    else if(id==='peptidos'){
     await page.getByRole('heading',{name:'Péptidos natriuréticos',exact:true}).waitFor();
     await page.locator('[data-np-key="context"][data-np-value="outpatient"]').click();
     await page.locator('[data-np-input="age"]').fill('68');
     await page.locator('[data-np-input="nt"]').fill('850');
     await page.locator('[data-action="interpret-np"]').click();
     await page.getByRole('heading',{name:'Resultado que apoya la sospecha de IC'}).waitFor();
     assert.match(await page.locator('#np-result').innerText(),/250/);
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Péptidos sin desbordamiento');
     await page.screenshot({path:'qa-results/'+name+'-peptides.png',fullPage:true});
     await page.locator('[data-np-key="context"][data-np-value="acute"]').click();
     assert.match(await page.locator('#np-result').innerText(),/Priorizar valoración urgente/);
     assert.equal(await page.locator('#np-result [data-section="descompensada"]').count(),1);
    }
    else if(id==='ecocardiografia'){
     await page.getByRole('heading',{name:'Ecocardiografía',exact:true}).waitFor();
     // Existing acute context must remain visible; test normal compact state separately.
     assert.equal(await page.locator('.echo-form .echo-safety.urgent').count(),1);
     assert.equal(await page.locator('[data-echo-input]:visible').count(),1);
     assert.equal(await page.locator('#echo-result').count(),0);
     await page.locator('[data-action="interpret-echo"]').first().click();
     await page.getByRole('heading',{name:'FEVI pendiente',exact:true}).waitFor();
     assert.equal(await page.locator('#echo-result [data-echo-input]').count(),0);
     assert.equal(await page.locator('.echo-conclusion [data-section="descompensada"]').count(),1);
     await page.locator('[data-action="edit-echo"]').click();
     await page.locator('[data-echo-input="ef"]').fill('70');await page.locator('[data-action="interpret-echo"]').first().click();
     await page.getByRole('heading',{name:'FEVI preservada',exact:true}).waitFor();
     await page.locator('[data-action="edit-echo"]').click();assert.equal(await page.locator('[data-echo-input="ef"]').inputValue(),'70');
     await page.locator('[data-echo-input="ef"]').fill('49.9');await page.locator('[data-action="interpret-echo"]').first().click();
     await page.getByRole('heading',{name:'FEVI reducida',exact:true}).waitFor();
     await page.locator('[data-action="edit-echo"]').click();
     await page.locator('[data-echo-input="ef"]').fill('110');await page.locator('[data-action="interpret-echo"]').first().click();
     assert.equal(await page.locator('[data-echo-input="ef"]').getAttribute('aria-invalid'),'true');
     await page.locator('[data-echo-input="ef"]').fill('55');await page.getByText('FEVI previa y evolución',{exact:true}).click();
     await page.locator('[data-echo-input="priorEf"]').fill('30');await page.locator('[data-action="interpret-echo"]').first().click();
     await page.getByRole('heading',{name:'FEVI actualmente preservada con antecedente de reducción'}).waitFor();
     assert.equal(await page.locator('.echo-conclusion [data-section="descompensada"]').count(),1);
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Ecocardiografía sin desbordamiento');
     await page.screenshot({path:'qa-results/'+name+'-echo.png',fullPage:true});
     await page.locator('[data-action="edit-echo"]').click();
     // Go to the diagnosis menu to clear the acute context while preserving echo.
     await page.locator('[data-action="diagnosis"]').click();
     await page.locator('[data-action="diagnostic-section"][data-section="peptidos"]').click();
     await page.locator('[data-np-key="context"][data-np-value="outpatient"]').click();
     await page.locator('[data-action="diagnosis"]').click();
     await page.locator('[data-action="diagnostic-section"][data-section="ecocardiografia"]').click();
     assert.equal(await page.locator('[data-echo-input="ef"]').inputValue(),'55');
     assert.equal(await page.locator('#echo-result').count(),0);
     if(name==='webkit-mobile')assert.ok(await page.locator('.echo-form .echo-skip').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight),'Formulario inicial completo visible');
     await page.screenshot({path:'qa-results/'+name+'-echo-form.png',fullPage:true});
     await page.locator('[data-action="interpret-echo"]').first().click();
     await page.getByRole('heading',{name:'Conclusión',exact:true}).waitFor();
     assert.equal(await page.locator('[data-echo-input]').count(),0);
     if(name==='webkit-mobile')assert.ok(await page.locator('.echo-conclusion .sus-result-button').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight),'Conclusión y acción visibles sin desplazamiento');
     await page.screenshot({path:'qa-results/'+name+'-echo-conclusion.png',fullPage:true});
     await page.locator('.echo-conclusion [data-section="clasificacion"]').click();
     await page.getByRole('heading',{name:'Clasificación',exact:true}).waitFor();
     assert.match(await page.locator('.class-grid').innerText(),/55 %/);
     assert.match(await page.locator('.class-evolution').innerText(),/30 % → 55 %/);
     await page.screenshot({path:'qa-results/'+name+'-classification-context.png',fullPage:true});
     await page.locator('[data-action="ic"]').click();await page.getByRole('heading',{name:'Insuficiencia cardiaca',exact:true}).waitFor();
     await page.locator('[data-action="ic-section"][data-section="diagnostico"]').click();await page.getByRole('heading',{name:'Diagnóstico',exact:true}).waitFor();
     continue;
    }
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
