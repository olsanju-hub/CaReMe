// Datos sintéticos. Navegadores reales de escritorio; no equivale a iPhone físico.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium,webkit} from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=new URL('../qa-results/',import.meta.url);
await mkdir(output,{recursive:true});
const port=Number(process.env.QA_PORT||4317),origin='http://localhost:'+port;
let server;
async function startServer(){
 server=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Servidor sin respuesta')),10000);
  server.stdout.on('data',data=>{if(String(data).includes('CaHReMe:')){clearTimeout(timer);resolve();}});
  server.on('error',reject);server.on('exit',code=>{clearTimeout(timer);if(code)reject(new Error('Servidor terminó: '+code));});
 });
}
async function stopServer(){if(server&&server.exitCode===null){await new Promise(resolve=>{server.once('exit',resolve);server.kill();});}}
await startServer();
const report={syntheticData:true,physicalDevice:false,profiles:[],cases:[]};
const check=async(profile,name,fn)=>{try{await fn();report.cases.push({profile,name,status:'passed'});}catch(error){report.cases.push({profile,name,status:'failed',error:String(error.stack??error)});console.error(profile+' · '+name+': '+error.message);}};
const profiles=[
 {id:'chromium-desktop',engine:chromium,width:1280,height:900,touch:false},
 {id:'chromium-mobile',engine:chromium,width:390,height:844,touch:true},
 {id:'webkit-mobile',engine:webkit,width:390,height:844,touch:true},
 {id:'webkit-narrow',engine:webkit,width:320,height:740,touch:true}
];
try{
 for(const profile of profiles){
  let browser;
  await check(profile.id,'inicio de motor',async()=>{browser=await profile.engine.launch({headless:true});});
  if(!browser)continue;
  report.profiles.push({id:profile.id,version:browser.version(),width:profile.width,height:profile.height,offlineMethod:profile.id.startsWith('webkit')?'origin_stopped':'origin_stopped_and_setOffline'});
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:profile.touch,hasTouch:profile.touch});
  const page=await context.newPage();page.setDefaultTimeout(5000);const errors=[],external=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',dialog=>dialog.accept());
  page.on('request',request=>{if(!request.url().startsWith(origin+'/'))external.push(request.url());});
  const home=async()=>{await page.locator('button.brand[data-action="home"]').click();};
  const module=async(id,mode='quick')=>{await home();await page.locator('button.module-card[data-module="'+id+'"]').click();if(mode!=='quick')await page.locator('[data-action="module-mode"][data-mode="'+mode+'"]').first().click();};
  const action=async id=>{await home();await page.locator('[data-action="'+id+'"]:visible').first().click();};
  const summary=async()=>{await module('dm2','review');await page.locator('[data-action="summary"]').first().click();};
  const fill=async values=>{
   for(const [id,value] of Object.entries(values)){
    await page.locator('details').evaluateAll(xs=>xs.forEach(x=>x.open=true));
    const field=page.locator('[data-field="'+id+'"]').first();
    if(Array.isArray(value)){for(const entry of value)await page.locator('input[data-field="'+id+'"][value="'+entry+'"]').check();}
    else if(await field.evaluate(el=>el.tagName)==='SELECT')await field.selectOption(value);
    else await field.fill(value);
   }
  };
  const inspect=async(name)=>{
   const state=await page.evaluate(()=>{
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
    const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
    const missingLabels=[...document.querySelectorAll('input:not([type="hidden"]),select,textarea')].filter(el=>!el.labels?.length&&!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby')).map(el=>el.dataset.field);
    const brokenLabels=[...document.querySelectorAll('label[for]')].filter(el=>!document.getElementById(el.htmlFor)).map(el=>el.htmlFor);
    const overflow=[...document.querySelectorAll('main *,#app section *,#app article *')].filter(el=>{const b=el.getBoundingClientRect();return b.width&&b.right>innerWidth+1&&getComputedStyle(el).visibility!=='hidden';}).slice(0,5).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent.slice(0,80)}));
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,duplicateIds:dup,missingLabels,brokenLabels,overflow};
   });
   if(state.scrollWidth>state.width+1)await page.screenshot({path:fileURLToPath(new URL(profile.id+'-'+name+'-failure.png',output)),fullPage:false});
   assert.deepEqual(state.duplicateIds,[],JSON.stringify(state));assert.deepEqual(state.missingLabels,[],JSON.stringify(state));assert.deepEqual(state.brokenLabels,[],JSON.stringify(state));
   assert.ok(state.scrollWidth<=state.width+1,JSON.stringify(state));
   if(['home','summary','obesidad-detail'].includes(name))await page.screenshot({path:fileURLToPath(new URL(profile.id+'-'+name+'.png',output)),fullPage:name==='obesidad-detail'});
  };
  await check(profile.id,'carga',async()=>{await page.goto(origin);assert.equal(await page.locator('button.module-card').count(),6);});
  await check(profile.id,'home: estructura y anchura',()=>inspect('home'));
  await check(profile.id,'teclado: salto al contenido y foco de navegación',async()=>{
   await page.keyboard.press('Tab');assert.ok(await page.locator('.skip-link').evaluate(el=>document.activeElement===el));await page.keyboard.press('Enter');assert.ok(await page.locator('#main-content').evaluate(el=>document.activeElement===el));await module('dm2');assert.ok(await page.locator('#main-content').evaluate(el=>document.activeElement===el));
  });
  for(const id of ['dm2','ic','erc','obesidad','hepatico','insulina'])for(const mode of ['quick','detail','review'])
   await check(profile.id,id+'-'+mode,async()=>{await module(id,mode);await inspect(id+'-'+mode);});
  for(const id of ['hta','lipids','ckm','cv-risk','tools','sources','evaluation'])
   await check(profile.id,id+': estructura y anchura',async()=>{await action(id);await inspect(id);});
  await check(profile.id,'summary: estructura y anchura',async()=>{await summary();assert.equal(await page.locator('#integrated-plan').count(),1);await inspect('summary');});
  await check(profile.id,'datos compartidos e invalidación',async()=>{
   await action('lipids');await fill({ldl:'130'});await page.locator('[data-action="lipid-result"]').click();assert.ok(await page.locator('#lipid-result').isVisible());
   await fill({ldl:'125'});assert.equal(await page.locator('#lipid-result').count(),0);await action('cv-risk');assert.equal(await page.locator('[data-field="ldl"]').inputValue(),'125');
   await page.reload();await action('cv-risk');assert.equal(await page.locator('[data-field="ldl"]').inputValue(),'');
  });
  await check(profile.id,'FIB-4 externo e invalidación de confirmación',async()=>{
   await module('hepatico');await fill({edad:'55',embarazo:'No procede',fecha_evaluacion:'2026-11-13',fib4_agudo:'No',masld_alarma:'No',masld_cirrosis:'No tras valoración',fib4_contexto:'Perfil de riesgo compatible con evaluación MASLD',hepatico_valoracion:'Esteatosis documentada y otras causas evaluadas',masld_alcohol:'Revisados',masld_etiologia:'Compatible con evaluación MASLD',masld_fib4_origen:'Informado por fuente externa',fib4_informado:'2.8',masld_fecha_fib4:'2026-11-10',masld_fuente_fib4:'Informe sintético QA',masld_fib4_confirmado:'Sí'});
   await page.locator('[data-action="masld-result"]').click();assert.match(await page.locator('#masld-result').innerText(),/FIB-4 utilizado: 2.80/);
   await fill({edad:'66'});assert.equal(await page.locator('#masld-result').count(),0);await page.locator('[data-action="masld-result"]').click();assert.doesNotMatch(await page.locator('#masld-result').innerText(),/FIB-4 utilizado: 2.80/);
  });
  await check(profile.id,'alarma prioritaria y borrado de sesión',async()=>{
   await action('hta');await fill({pas:'180'});await summary();assert.match(await page.locator('#integrated-plan').innerText(),/Resolver primero las alertas/);
   await page.locator('[data-action="new"]').first().click();await summary();assert.doesNotMatch(await page.locator('#integrated-plan').innerText(),/Resolver primero las alertas/);
  });
  await check(profile.id,'exclusividad de ausencia de fármacos',async()=>{
   await module('erc','detail');await page.locator('details').evaluateAll(xs=>xs.forEach(x=>x.open=true));
   const none=()=>page.locator('input[data-field="farmacos_clases"][value="Sin tratamiento farmacológico"]'),ace=()=>page.locator('input[data-field="farmacos_clases"][value="IECA"]');
   await none().check();await ace().check();assert.equal(await none().isChecked(),false);assert.equal(await ace().isChecked(),true);await none().check();assert.equal(await ace().isChecked(),false);
  });
  await check(profile.id,'FEVI previa evita reclasificación automática',async()=>{
   await module('ic','detail');await fill({ic:'Sí',edad:'60',embarazo:'No procede',fecha_evaluacion:'2026-11-13',fevi:'55',fecha_fevi:'2026-11-10',ic_fevigrupo:'Preservada · FEVI ≥50 %',ic_evidencia_objetiva:'Confirmada por evaluación especializada',ic_fevi_previa_reducida:'Sí',ic_sintomatica:'Sí',ic_estabilidad:'Estable evaluado',ic_alarma:['Sin señales de alarma tras valoración'],congestion:'Ausentes',ic_fc:'70',pas:'120',pad:'75',tfge:'70',fecha_tfge:'2026-11-10',potasio:'4.3',fecha_potasio:'2026-11-10',lra_sospecha:'No',ic_descompensada:'No',situacion_aguda:'Estable sin proceso agudo grave',medicacion_revisada:'Sí',alergias_revisadas:'Sí'});
   await page.locator('[data-action="ic-result"]').click();assert.match(await page.locator('#ic-result').innerText(),/antecedente de FEVI <50/);assert.match(await page.locator('#ic-result').innerText(),/no indica retirar tratamiento previo/);
  });
  await check(profile.id,'cetoacidosis sin diagnóstico retiene el plan y calendario',async()=>{
   await home();await page.locator('[data-action="new"]').first().click();
   await module('erc','detail');await fill({cetoacidosis_sospecha:'Sí'});await summary();
   assert.match(await page.locator('#integrated-plan').innerText(),/Resolver primero las alertas/);
   await action('tools');await page.locator('[data-action="open-drug"][data-drug-id="finerenona"][data-route-id="erc_dm2"]').first().click();
   await page.locator('[data-action="followup"]').click();await page.locator('#action-date').fill('2026-11-01');await page.locator('#action-dose').selectOption('20');await page.locator('#action-confirm').check();await page.locator('[data-action="confirm-med-action"]').click();
   assert.match(await page.locator('main').innerText(),/Referencia retenida/);assert.match(await page.locator('main').innerText(),/2026-11-29/);
   await home();await page.locator('[data-action="new"]').first().click();
  });
  await check(profile.id,'consulta breve y acceso directo a tratamiento',async()=>{
   await home();
   for(const [id,count] of [['obesidad',6],['hepatico',4]]){
    await module(id);assert.equal(await page.locator('.form-card input,.form-card select').evaluateAll(xs=>xs.filter(x=>!x.closest('details:not([open])')).length),count);
   }
   await module('obesidad');await page.locator('[data-action="module-outcome"]').click();assert.ok(await page.locator('#obesity-result').isVisible());assert.equal(await page.locator('.capture-details').getAttribute('open'),null);
   await page.locator('.treatment-access [data-drug-id="tirzepatida"]').click();assert.match(await page.locator('main').innerText(),/DOSIS DE FICHA TÉCNICA/);assert.match(await page.locator('main').innerText(),/Datos esenciales incompletos/);
   await home();
  });
  await check(profile.id,'CKM dirigido: bloque breve, resultado mínimo y preguntas condicionales',async()=>{
   await action('ckm');assert.equal(await page.locator('.form-card input,.form-card select').count(),6);
   await fill({edad:'60',embarazo:'No procede',dm1:'No',fecha_evaluacion:'2026-11-13',situacion_aguda:'Estable sin proceso agudo grave',lra_sospecha:'No'});
   await page.locator('[data-action="ckm-next"]').click();assert.equal(await page.locator('[data-field="ckm_fecha_cvd"]').count(),0);
   await fill({ckm_cvd:'Confirmada'});assert.equal(await page.locator('[data-field="ckm_fecha_cvd"]').count(),1);await fill({ckm_fecha_cvd:'2026-11-10'});
   await page.locator('[data-action="ckm-next"]').click();await fill({dm2:'Sí'});assert.match(await page.locator('#ckm-result').innerText(),/al menos estadio 4/);
   assert.equal(await page.locator('[data-block="subclinica"]').count(),0);assert.ok(await page.locator('.form-card input,.form-card select').count()<=6);
   await home();await page.locator('[data-action="new"]').first().click();
  });
  await check(profile.id,'actualización recupera una portada antigua en caché y conserva cachés ajenas',async()=>{
   await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   await page.evaluate(async()=>{
    const keys=await caches.keys(),key=keys.find(x=>x.startsWith('cahreme-shell-%2F-'));
    const cache=await caches.open(key);await cache.put(location.origin+'/',new Response('<!doctype html><h1>Prototipo en revisión: versión antigua de prueba</h1>',{headers:{'Content-Type':'text/html'}}));
    await (await caches.open('otra-aplicacion-prueba')).put(location.origin+'/fixture.txt',new Response('conservar'));
   });
   await page.goto(origin+'/');assert.match(await page.locator('body').innerText(),/versión antigua de prueba/);
   await page.goto(origin+'/actualizar.html');await page.locator('#update').click();await page.waitForURL(origin+'/');
   assert.equal(await page.locator('button.module-card').count(),6);assert.doesNotMatch(await page.locator('body').innerText(),/Prototipo en revisión|Ningún resultado autoriza/);
   assert.equal(await page.evaluate(async()=>!!await (await caches.open('otra-aplicacion-prueba')).match(location.origin+'/fixture.txt')),true);
   await page.evaluate(()=>caches.delete('otra-aplicacion-prueba'));
  });
  await check(profile.id,'privacidad: captura sin almacenamiento o red clínica',async()=>{
   assert.deepEqual(await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)})),{local:[],session:[]});assert.deepEqual(await context.cookies(),[]);assert.deepEqual(external,[]);
  });
  await check(profile.id,'offline: recarga completa y módulos nuevos',async()=>{
   await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{timeout:10000});
   // WebKit setOffline rejects service-worker responses upstream (#42775).
   // Stop the real origin for every engine; verify an uncached context cannot load it.
   await stopServer();
   try {
    await assert.rejects(()=>fetch(origin));
    const uncached=await browser.newContext(),negative=await uncached.newPage();
    await assert.rejects(()=>negative.goto(origin,{timeout:5000}));await uncached.close();
    if(!profile.id.startsWith('webkit'))await context.setOffline(true);
    await page.reload({waitUntil:'load'});assert.equal(await page.locator('button.module-card').count(),6);
   for(const id of ['obesidad','hepatico']){await module(id,'detail');assert.ok(await page.locator('[data-action="'+(id==='obesidad'?'obesity-result':'masld-result')+'"]').isVisible());}
   await summary();assert.ok(await page.locator('#integrated-plan').isVisible());
   const urls=await page.evaluate(async()=>{const all=[];for(const key of await caches.keys())for(const request of await (await caches.open(key)).keys())all.push(request.url);return all;});
   assert.ok(urls.some(url=>url.endsWith('/src/clinical/plan-integral.mjs')));assert.ok(urls.every(url=>!new URL(url).search));
   } finally {await context.setOffline(false);await startServer();}
  });
  await check(profile.id,'sin errores JavaScript',async()=>assert.deepEqual(errors,[]));
  await context.close();await browser.close();
 }
}finally{
 await stopServer();report.passed=report.cases.filter(x=>x.status==='passed').length;report.failed=report.cases.length-report.passed;
 await writeFile(new URL('report.json',output),JSON.stringify(report,null,2));
 console.log(JSON.stringify({profiles:report.profiles,passed:report.passed,failed:report.failed}));
 if(report.failed)process.exitCode=1;
}
