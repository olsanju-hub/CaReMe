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
  const open=async id=>{await home();await page.locator('[data-action="open-pathology"][data-pathology="'+id+'"]').click();if(id!=='cv-risk'){if(await page.locator('[data-action="route-mode"]').count())await page.locator('[data-action="route-mode"][data-mode="known"]').click();await page.locator('[data-action="flow-stage"][data-stage="3"]').first().click();}};
  const stage=async n=>{if(n===2){await page.locator('.flow-progress [data-stage="1"]').click();await page.locator('[data-action="flow-stage"][data-stage="2"]').click();return;}await page.locator('.flow-progress [data-stage="'+n+'"]').click();};
  const module=async(id,mode='quick')=>{await open(id==='insulina'?'dm2':id);await page.locator('.flow-reference summary').click();await page.locator('[data-action="flow-context"]').click();if(id==='insulina'){await page.locator('[data-action="start-module"][data-module="insulina"]').first().click();}if(mode!=='detail')await page.locator('[data-action="module-mode"][data-mode="'+mode+'"]').first().click();};
  const action=async id=>{if(['cv-risk','ckm'].includes(id)){await open('cv-risk');await page.locator('[data-action="'+id+'"]').first().click();return;}await home();await page.locator('[data-action="'+id+'"]:visible').first().click();};
  const summary=async()=>{await module('dm2','review');await page.locator('[data-action="summary"]').first().click();};
  const fill=async values=>{
   for(const [id,value] of Object.entries(values)){
    await page.locator('details').evaluateAll(xs=>xs.forEach(x=>x.open=true));
    if(id==='seq_ambito'&&await page.locator('[data-direct-scope]').count()){await page.locator('[data-direct-scope]').setChecked(value==='Adulto estable, sin embarazo ni lactancia, sin proceso agudo');continue;}
    if(id==='tx_revision'&&await page.locator('[data-direct-review]').count()){await page.locator('[data-direct-review]').setChecked(value==='Indicación, contraindicaciones e interacciones revisadas');continue;}
    if(id.startsWith('seq_actual_')&&await page.locator('[data-action="direct-no-meds"][data-field-id="'+id+'"]').count()){
     if(value.includes('Sin tratamiento para esta patología')){await page.locator('[data-action="direct-no-meds"][data-field-id="'+id+'"]').click();continue;}
     if(!await page.locator('input[data-field="'+id+'"]').count())await page.locator('[data-action="direct-has-meds"][data-field-id="'+id+'"]').click();
    }
    const field=page.locator('[data-field="'+id+'"]').first();
    if(Array.isArray(value)){for(const entry of value)await page.locator('input[data-field="'+id+'"][value="'+entry+'"]').check();}
    else if(await field.evaluate(el=>el.tagName)==='SELECT')await field.selectOption(value);
    else await field.fill(value);
   }
  };
  const inspect=async(name)=>{
   const state=await page.evaluate(()=>{
    const skip=document.querySelector('.skip-link');const skipHidden=document.activeElement===skip||skip.getBoundingClientRect().bottom<=0;
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
    const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
    const missingLabels=[...document.querySelectorAll('input:not([type="hidden"]),select,textarea')].filter(el=>!el.labels?.length&&!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby')).map(el=>el.dataset.field);
    const brokenLabels=[...document.querySelectorAll('label[for]')].filter(el=>!document.getElementById(el.htmlFor)).map(el=>el.htmlFor);
    const overflow=[...document.querySelectorAll('main *,#app section *,#app article *')].filter(el=>{const b=el.getBoundingClientRect();return b.width&&b.right>innerWidth+1&&getComputedStyle(el).visibility!=='hidden';}).slice(0,5).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent.slice(0,80)}));
    return {skipHidden,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,duplicateIds:dup,missingLabels,brokenLabels,overflow};
   });
   if(state.scrollWidth>state.width+1)await page.screenshot({path:fileURLToPath(new URL(profile.id+'-'+name+'-failure.png',output)),fullPage:false});
   assert.equal(state.skipHidden,true,JSON.stringify(state));assert.deepEqual(state.duplicateIds,[],JSON.stringify(state));assert.deepEqual(state.missingLabels,[],JSON.stringify(state));assert.deepEqual(state.brokenLabels,[],JSON.stringify(state));
   assert.ok(state.scrollWidth<=state.width+1,JSON.stringify(state));
   if(['home','summary','obesidad-detail'].includes(name))await page.screenshot({path:fileURLToPath(new URL(profile.id+'-'+name+'.png',output)),fullPage:name==='obesidad-detail'});
  };

  await check(profile.id,'inicio: ocho patologías sin niveles de consulta',async()=>{await page.goto(origin);assert.equal(await page.locator('[data-action="open-pathology"]').count(),8);assert.equal(await page.locator('.bottom-nav,.integral-access,.task-card').count(),0);assert.ok(await page.locator('.home .module-content').evaluateAll(xs=>xs.every(x=>x.getBoundingClientRect().width>=180)));await inspect('home');});
  await check(profile.id,'teclado: acceso al contenido',async()=>{await page.keyboard.press('Tab');assert.ok(await page.locator('.skip-link').evaluate(el=>document.activeElement===el));await page.keyboard.press('Enter');assert.ok(await page.locator('#main-content').evaluate(el=>document.activeElement===el));});
  for(const id of ['dm2','hta','lipids','obesidad','erc','ic','hepatico']){
   await check(profile.id,id+': diagnóstico sin formulario extenso',async()=>{await open(id);assert.equal(await page.locator('.flow-progress [aria-current="step"]').innerText(),'Tratamiento inicial');assert.equal(await page.locator('[data-action="sequence-continue"]').count(),0);await stage(1);assert.equal(await page.locator('main input,main select').count(),0);assert.equal(await page.locator('.module-tabs,.medication-list').count(),0);await inspect(id+'-diagnosis');});
   await check(profile.id,id+': clasificación y cálculo contextual',async()=>{await stage(2);assert.ok(await page.locator('.form-card .module-field').count()<=4);await page.locator('[data-action="flow-classify"]').click();assert.ok(await page.locator('.brief-result').isVisible());await inspect(id+'-classification');});
   await check(profile.id,id+': tratamiento directo sin catálogo de fichas',async()=>{await stage(1);await page.locator('[data-action="flow-stage"][data-stage="3"]').last().click();assert.equal(await page.locator('.flow-progress [aria-current="step"]').innerText(),'Tratamiento inicial');assert.equal(await page.locator('.medication-list').count(),0);assert.equal(await page.locator('#flow-treatment').count(),0);assert.equal(await page.locator('[data-action="sequence-continue"]').count(),0);assert.ok(await page.locator('#sequence-questions').isVisible());await inspect(id+'-treatment');});
  }
  for(const id of ['dm2','hta','lipids','obesidad','erc','ic','hepatico'])for(const mode of ['recent','known'])await check(profile.id,id+': ruta '+mode+' termina en seguimiento sin formulario obligatorio',async()=>{
   await home();await page.locator('[data-action="open-pathology"][data-pathology="'+id+'"]').click();
   if(await page.locator('[data-action="route-change"]').count())await page.locator('[data-action="route-change"]').click();
   assert.equal(await page.locator('main input,main select').count(),0);
   await page.locator('[data-action="route-mode"][data-mode="'+mode+'"]').click();
   assert.ok(await page.locator('#route-evaluation').isVisible());assert.equal(await page.locator('main input,main select').count(),0);
   assert.equal(await page.locator('.flow-progress button').count(),4);await inspect(id+'-'+mode+'-evaluation');
   if(id==='dm2'&&mode==='recent')await page.screenshot({path:fileURLToPath(new URL(profile.id+'-dm2-initial-route.png',output)),fullPage:true});
   await stage(4);assert.ok(await page.locator('#route-followup').isVisible());assert.ok(await page.locator('#route-followup .route-item').count()>=2);assert.equal(await page.locator('main input,main select').count(),0);await inspect(id+'-'+mode+'-followup');
   await stage(5);assert.ok(await page.locator('.route-task').isVisible());assert.ok(await page.locator('#sequence-questions').isVisible());
  });
  await check(profile.id,'prevención: acceso a riesgo y CKM',async()=>{for(const id of ['cv-risk','ckm']){await action(id);await inspect(id);}});
  const reset=async()=>{await home();if(await page.locator('[data-action="new"]').count())await page.locator('[data-action="new"]').click();};
  await check(profile.id,'IMC integrado y transferencia explícita',async()=>{await reset();await open('obesidad');await stage(2);await page.locator('.flow-calculator summary').click();await fill({peso:'116',talla:'180'});await page.locator('[data-action="clinical-calculate"]').click();assert.match(await page.locator('#clinical-calc-result').innerText(),/35.80/);await page.locator('[data-action="use-calculation"]').click();assert.equal(await page.locator('.pathology-page').count(),1);assert.ok(Math.abs(Number(await page.locator('[data-field="imc"]').inputValue())-35.802469)<.00001);await page.locator('[data-action="flow-classify"]').click();assert.match(await page.locator('.brief-result').innerText(),/35.80/);await inspect('bmi-inline');});
  await check(profile.id,'TFGe integrada con creatinina y unidades',async()=>{await reset();await open('erc');await stage(2);await page.locator('.flow-calculator summary').click();await fill({edad:'60',calc_sexo:'Hombre',calc_creatinina:'1',calc_creat_unidad:'mg/dL',calc_estabilidad:'Creatinina estable, sin embarazo ni diálisis'});await page.locator('[data-action="clinical-calculate"]').click();assert.match(await page.locator('#clinical-calc-result').innerText(),/86.16/);await page.locator('[data-action="use-calculation"]').click();assert.ok(Number(await page.locator('[data-field="tfge"]').inputValue())>86);await inspect('egfr-inline');});
  await check(profile.id,'FIB4: cálculo integrado y perfil de riesgo sin ecografía',async()=>{await reset();await open('hepatico');await stage(2);await page.locator('.flow-calculator summary').click();await fill({edad:'60',ast:'30',alt:'25',plaquetas:'200'});await page.locator('[data-action="clinical-calculate"]').click();assert.match(await page.locator('#clinical-calc-result').innerText(),/1.80/);await page.locator('[data-action="use-calculation"]').click();await fill({hepatico_valoracion:'Otras causas evaluadas; esteatosis no confirmada',fib4_contexto:'Perfil de riesgo compatible con evaluación MASLD'});await page.locator('[data-action="flow-classify"]').click();assert.match(await page.locator('.brief-result').innerText(),/banda intermedia/);await inspect('fib4-inline');});

  const shared={seq_ambito:'Adulto estable, sin embarazo ni lactancia, sin proceso agudo',seq_objetivo:'Iniciar o ajustar tratamiento'};
  const facts={
   dm2:{dm2:'Sí',hba1c:'8',dm_objetivo_valor:'7',tfge:'70',dm_hipoglucemias:'No referidas',dm_sintomas:'Ausentes',seq_comorbilidades:['Ninguno de los siguientes']},
   hta:{hta_conocida:'Sí',pas:'150',pad:'90',seq_pa_objetivo:'130',seq_pad_objetivo:'80',seq_pa_valida:'Media validada; control fuera de consulta revisado cuando corresponde',seq_hta_vulnerable:'Ninguno tras valoración'},
   lipids:{ldl:'130',lip_riesgo:'Alto',lip_intolerancia:'No'},
   obesidad:{imc:'35',seq_comorbilidades:['Ninguno de los siguientes'],ob_tca:'No',ob_perdida_involuntaria:'No',ob_edema:'No',ob_musculo:'No tras valoración',embarazo_planificado:'No procede'},
   erc:{tfge:'50',cac:'250',unidad_cac:'mg/g',persistencia:'Sí',dm2:'Sí',ic:'No',potasio:'4.5',hta_conocida:'Sí',ras_optimizado:'Sí'},
   ic:{ic:'Sí',ic_sintomatica:'Sí',ic_estabilidad:'Estable evaluado',fevi:'45',congestion:'Ausentes',pas:'120',tfge:'70',potasio:'4.5'},
   hepatico:{edad:'60',fib4_informado:'1.8',hepatico_valoracion:'Otras causas evaluadas; esteatosis no confirmada',fib4_contexto:'Perfil de riesgo compatible con evaluación MASLD'}
  };
  const completeSequence=async(id,extra={})=>{
   const values={...shared,...(id==='hepatico'?{}:{['seq_actual_'+id]:['Sin tratamiento para esta patología']}),...facts[id],...extra};
   const done=new Set();
   for(let pass=0;pass<20;pass++){
    if(await page.locator('#therapy-sequence').count())return;
    if(await page.locator('[data-direct-scope]').count()&&!done.has('seq_ambito')){await fill({seq_ambito:values.seq_ambito});done.add('seq_ambito');}
    const meds=await page.locator('[data-action="direct-no-meds"]').count()?await page.locator('[data-action="direct-no-meds"]').getAttribute('data-field-id'):null;
    if(meds&&!done.has(meds)){await fill({[meds]:values[meds]});done.add(meds);}
    const ids=await page.locator('#sequence-questions [data-field]').evaluateAll(xs=>[...new Set(xs.map(x=>x.dataset.field))]);
    let changed=false;
    for(const key of ids){if(done.has(key))continue;assert.ok(Object.hasOwn(values,key),'Dato no previsto: '+key);await fill({[key]:values[key]});done.add(key);changed=true;}
    // Numeric inputs update this single screen after a short typing debounce.
    await page.waitForTimeout(220);
    if(await page.locator('#therapy-sequence').count())return;
    assert.equal(await page.locator('#sequence-questions [role="alert"]').count(),0,await page.locator('main').innerText());
    assert.ok(changed||pass===0,'No aparecen los datos necesarios: '+await page.locator('main').innerText());
   }
   throw new Error('Secuencia no terminada');
  };
  for(const id of ['dm2','hta','lipids','obesidad','erc','ic','hepatico'])await check(profile.id,id+': decisión propuesta sin selector de fármaco',async()=>{
   await reset();await open(id);assert.equal(await page.locator('.flow-progress [aria-current="step"]').innerText(),'Tratamiento inicial');await completeSequence(id);assert.equal(await page.locator('#flow-treatment').count(),0);assert.ok(await page.locator('#therapy-sequence').isVisible());await inspect(id+'-sequence');
   if(id==='dm2'){await page.locator('details').evaluateAll(xs=>xs.forEach(x=>x.open=false));await page.screenshot({path:fileURLToPath(new URL(profile.id+'-dm2-sequence.png',output)),fullPage:true});}
  });
  await check(profile.id,'DM2 reciente: evaluación → pauta numérica → próxima analítica',async()=>{
   await reset();await home();await page.locator('[data-action="open-pathology"][data-pathology="dm2"]').click();await page.locator('[data-action="route-mode"][data-mode="recent"]').click();assert.match(await page.locator('#route-evaluation').innerText(),/HbA1c/);
   await stage(3);await completeSequence('dm2');await fill({tx_revision:'Indicación, contraindicaciones e interacciones revisadas'});assert.match(await page.locator('#module-dose-result').innerText(),/500 mg · cada 12 h/);
   await stage(4);assert.match(await page.locator('#route-followup').innerText(),/3 meses/);assert.equal(await page.locator('main input,main select').count(),0);await stage(3);assert.match(await page.locator('#module-dose-result').innerText(),/500 mg · cada 12 h/);await stage(5);assert.match(await page.locator('#module-dose-result').innerText(),/500 mg · cada 12 h/);
  });
  const showDose=async key=>{if(await page.locator('#sequence-dose-panel[data-key="'+key+'"]').count())return;await page.locator('[data-action="sequence-dose"][data-key="'+key+'"]').click();};
  const confirmed='Indicación, contraindicaciones e interacciones revisadas';
  await check(profile.id,'HTA: dos clases propuestas y dosis calculada sin elegir medicamento',async()=>{await reset();await open('hta');await stage(3);await completeSequence('hta');assert.equal(await page.locator('#sequence-dose-panel[data-key="losartan"]').count(),1);assert.equal(await page.locator('[data-action="sequence-dose"][data-key="amlodipino"]').count(),1);await showDose('losartan');assert.equal(await page.locator('[data-field="tx_operacion"]').count(),0);await fill({tfge:'60',potasio:'4.5',tx_revision:confirmed});assert.match(await page.locator('#module-dose-result').innerText(),/50 mg · cada 24 h/);await fill({potasio:'5.8'});assert.equal(await page.locator('#module-dose-result').count(),0);await page.waitForTimeout(220);assert.equal(await page.locator('#sequence-dose-panel').getAttribute('data-key'),'amlodipino');assert.equal(await page.locator('#module-dose-result').count(),0);await fill({tx_revision:confirmed});assert.match(await page.locator('#module-dose-result').innerText(),/5 mg · cada 24 h/);assert.doesNotMatch(await page.locator('#module-dose-result').innerText(),/50 mg/);await inspect('hta-dose-inline');});
  await check(profile.id,'DM2: optimiza la dosis REAL de metformina, sin selector de escalada',async()=>{await reset();await open('dm2');await stage(3);await completeSequence('dm2',{seq_actual_dm2:['Metformina'],seq_adherencia:'Dosis y adherencia confirmadas',seq_tolerancia:'Buena tolerancia',seq_dosis_metformina:'1000',seq_semanas_metformina:'3',seq_metformina_forma:'Liberación inmediata, pauta confirmada'});await showDose('metformina');assert.equal(await page.locator('[data-field="tx_operacion"],[data-field="tx_dosis_actual"]').count(),0);await fill({tx_revision:confirmed});assert.match(await page.locator('#module-dose-result').innerText(),/1500 mg/);assert.match(await page.locator('#module-dose-result').innerText(),/500 mg cada 8 h/);await inspect('metformin-sequence-dose');});
  await check(profile.id,'obesidad: inicio propuesto y dosis inicial',async()=>{await reset();await open('obesidad');await stage(3);await completeSequence('obesidad');await showDose('wegovy');await fill({tfge:'60',tx_revision:confirmed});assert.match(await page.locator('#module-dose-result').innerText(),/0.25 mg · una vez a la semana/);await inspect('weight-dose-inline');await page.locator('details').evaluateAll(xs=>xs.forEach(x=>x.open=false));await page.evaluate(()=>scrollTo(0,0));assert.ok(await page.locator('.dose-number').evaluate(el=>el.getBoundingClientRect().top<innerHeight),'Dosis fuera de la primera pantalla tras completar el caso');await page.screenshot({path:fileURLToPath(new URL(profile.id+'-weight-dose.png',output)),fullPage:true});});
  await check(profile.id,'obesidad: dosis actual y respuesta insuficiente generan siguiente escalón',async()=>{await reset();await open('obesidad');await stage(3);await completeSequence('obesidad',{seq_actual_obesidad:['Semaglutida para peso · Wegovy'],seq_adherencia:'Dosis y adherencia confirmadas',seq_tolerancia:'Buena tolerancia',seq_respuesta_peso:'Insuficiente tras evaluación',seq_dosis_wegovy:'0.25',seq_semanas_wegovy:'4'});await showDose('wegovy');await fill({tfge:'60',tx_revision:confirmed});assert.match(await page.locator('#module-dose-result').innerText(),/0.5 mg · una vez a la semana/);await inspect('weight-escalation');});

  await check(profile.id,'HTA: la reducción propuesta no vuelve a pedir fármaco ni operación',async()=>{await reset();await open('hta');await stage(3);await completeSequence('hta',{seq_objetivo:'Reducir o simplificar tratamiento',seq_actual_hta:['Amlodipino','Losartán'],seq_adherencia:'Dosis y adherencia confirmadas',seq_tolerancia:'Efectos adversos o intolerancia',pas:'110',pad:'65',seq_retirada_motivo:'Edema atribuido a amlodipino tras revisión',seq_dosis_amlodipino:'10',seq_hta_una_toma:'Una toma diaria confirmada',seq_indicacion_solo_hta:'Solo HTA, sin otra indicación del candidato',seq_control_retirada:'Cambio acordado y seguimiento disponible'});assert.match(await page.locator('#therapy-sequence').innerText(),/Reducir Amlodipino/);await showDose('amlodipino');assert.equal(await page.locator('[data-field="tx_operacion"]').count(),0);await fill({tx_revision:confirmed});assert.match(await page.locator('#module-dose-result').innerText(),/5 mg · cada 24 h/);await inspect('hta-reduction');await page.locator('details').evaluateAll(xs=>xs.forEach(x=>x.open=false));await page.screenshot({path:fileURLToPath(new URL(profile.id+'-hta-reduction.png',output)),fullPage:true});});
  await check(profile.id,'HTA: retirada de un retard sin fraccionarlo',async()=>{await reset();await open('hta');await stage(3);await completeSequence('hta',{seq_objetivo:'Reducir o simplificar tratamiento',seq_actual_hta:['Indapamida retard','Amlodipino'],seq_adherencia:'Dosis y adherencia confirmadas',seq_tolerancia:'Buena tolerancia',pas:'110',pad:'65',seq_retirada_motivo:'PA baja u ortostatismo sintomático',seq_dosis_indapamida:'1.5',seq_hta_una_toma:'Una toma diaria confirmada',seq_indicacion_solo_hta:'Solo HTA, sin otra indicación del candidato',seq_control_retirada:'Cambio acordado y seguimiento disponible'});assert.match(await page.locator('#therapy-sequence').innerText(),/Retirar un solo fármaco: Indapamida/);assert.match(await page.locator('#therapy-sequence').innerText(),/No partir/);assert.equal(await page.locator('[data-action="sequence-dose"]').count(),0);await inspect('indapamide-withdrawal');});
  const fine={seq_actual_ic:['Finerenona'],seq_adherencia:'Dosis y adherencia confirmadas',seq_tolerancia:'Buena tolerancia',seq_fin_indicacion:'IC con FEVI ≥40 %',seq_dosis_finerenona:'20',seq_semanas_finerenona:'4',seq_mra_control:'Analítica actual revisada, sin deterioro agudo',fin_tfge_inicio:'70',fin_tfge_previa:'70'};
  await check(profile.id,'finerenona: continuidad por tabla IC sin duplicidad de inicio',async()=>{await reset();await open('ic');await stage(3);await completeSequence('ic',fine);await showDose('fine_ic');await fill({tx_revision:confirmed});assert.match(await page.locator('#module-dose-result').innerText(),/40 mg · cada 24 h/);await inspect('finerenone-continuation');});
  await check(profile.id,'eplerenona: inicio por función renal y NYHA',async()=>{await reset();await open('ic');await stage(3);await completeSequence('ic',{fevi:'30',seq_ic_nyha:'II'});await showDose('eplerenona');await fill({lip_aclaramiento:'40',seq_epl_cyp:'Sin inhibidor relevante tras revisión',tx_revision:confirmed});assert.match(await page.locator('#module-dose-result').innerText(),/25 mg · cada 48 h/);await inspect('eplerenone-start');});
  await check(profile.id,'eplerenona: frecuencia actual alterna pasa a diaria según control',async()=>{await reset();await open('ic');await stage(3);await completeSequence('ic',{seq_actual_ic:['Eplerenona'],seq_adherencia:'Dosis y adherencia confirmadas',seq_tolerancia:'Buena tolerancia',fevi:'30',seq_ic_nyha:'II',seq_dosis_eplerenona:'25',seq_semanas_eplerenona:'4',seq_epl_indicacion_previa:'IC crónica NYHA II y FEVI ≤30 % al inicio, revisado',seq_epl_frecuencia:'Cada 48 h',lip_aclaramiento:'40',seq_epl_cyp:'Sin inhibidor relevante tras revisión',seq_mra_control:'Analítica actual revisada, sin deterioro agudo'});await showDose('eplerenona');await fill({tx_revision:confirmed});assert.match(await page.locator('#module-dose-result').innerText(),/25 mg · cada 24 h/);await inspect('eplerenone-continuation');});
  await check(profile.id,'hiperpotasemia: información de tabla no habilita una pauta rutinaria',async()=>{await reset();await open('ic');await stage(3);await completeSequence('ic',fine);await page.locator('details').evaluateAll(xs=>xs.forEach(x=>x.open=true));await page.locator('[data-action="sequence-edit"][data-field-id="potasio"]').click();await fill({potasio:'5.6'});await page.waitForTimeout(220);assert.match(await page.locator('[role="alert"]').innerText(),/10 mg/);assert.equal(await page.locator('[data-action="sequence-dose"]').count(),0);await inspect('mra-priority');});
  const enterInsulin=async(values)=>{
   await reset();await open('dm2');await stage(3);await page.locator('details').evaluateAll(xs=>xs.forEach(x=>x.open=true));await page.locator('[data-action="flow-insulin"]').click();
   for(let pass=0;pass<12;pass++){
    if(await page.locator('[data-action="insulin-dose-result"]').count())return;
    const ids=await page.locator('#sequence-insulin-panel [data-field]').evaluateAll(xs=>[...new Set(xs.map(x=>x.dataset.field))]);
    for(const key of ids){assert.ok(Object.hasOwn(values,key),'Dato de insulina no previsto: '+key);await fill({[key]:values[key]});}
    await page.locator('[data-action="sequence-insulin-evaluate"]').click();
   }throw new Error('No resuelve la decisión de insulina');
  };
  const insBase={seq_ambito:shared.seq_ambito,dm2:'Sí',insulina_esquema:'Solo basal',ins_calc_hipo:'Sin episodios confirmados'};
  for(const [name,decision,doseValues,expected]of [
   ['inicio',{...insBase,insulina_esquema:'Sin insulina',hba1c:'9',dm_objetivo_valor:'7',ins_calc_glp1:'Ya utilizado o alternativa valorada y no adecuada'},{tfge:'60'},/10 U al día/],
   ['ajuste',{...insBase,ins_calc_g1:'150',ins_calc_g2:'160',ins_calc_g3:'150',ins_calc_min:'80',ins_calc_max:'130'},{ins_calc_producto:'Glargina U300 · Toujeo SoloStar',insulina_dosis_basal:'20',ins_calc_dias:'4',tfge:'60'},/22 U al día/],
   ['bolo',{...insBase,ins_calc_g1:'110',ins_calc_g2:'110',ins_calc_g3:'110',ins_calc_min:'80',ins_calc_max:'130',hba1c:'8.5',dm_objetivo_valor:'7',insulina_posprandial:'Elevaciones posprandiales repetidas'},{ins_calc_producto:'Glargina U300 · Toujeo SoloStar',insulina_dosis_basal:'20',ins_calc_glp1:'Ya utilizado o alternativa valorada y no adecuada',ins_calc_comida:'Comida',tfge:'60'},/4 U en la comida/],
   ['reducción',{...insBase,ins_calc_hipo:'Leve, resuelta y sin causa corregible identificada'},{ins_calc_producto:'Glargina U300 · Toujeo SoloStar',insulina_dosis_basal:'20',ins_calc_causa:'Revisada: basal responsable, sin bolo ni causa corregible',tfge:'60'},/18 U al día/]
  ])await check(profile.id,'insulina: '+name+' derivado del caso, sin escoger acción ni estrategia',async()=>{await enterInsulin(decision);assert.equal(await page.locator('[data-field="ins_calc_accion"],[data-field="ins_calc_metodo"],[data-field="ins_calc_bolo"],[data-field="ins_calc_reduccion"]').count(),0);await fill({...doseValues,ins_calc_revision:'Indicación, seguridad y educación revisadas'});await page.locator('[data-action="insulin-dose-result"]').click();assert.match(await page.locator('#insulin-dose-result').innerText(),expected);await inspect('insulin-'+name);});
  await check(profile.id,'alerta compartida retiene la secuencia en otra patología',async()=>{await reset();await module('dm2','detail');await fill({glucemia_actual:'55'});await open('hta');assert.match(await page.locator('[role="alert"]').innerText(),/Glucemia actual baja/);await stage(3);assert.equal(await page.locator('[data-action="sequence-dose"]').count(),0);await stage(4);assert.equal(await page.locator('#route-followup .route-item').count(),0);assert.match(await page.locator('#route-followup').innerText(),/prioridad clínica/);await reset();await open('hta');assert.equal(await page.locator('[role="alert"]').count(),0);});
  await check(profile.id,'datos compartidos y privacidad al recargar',async()=>{await open('erc');await stage(2);await fill({tfge:'54'});await module('dm2','detail');await page.locator('details').evaluateAll(xs=>xs.forEach(x=>x.open=true));assert.equal(await page.locator('[data-field="tfge"]').inputValue(),'54');await page.reload();await open('erc');await stage(2);assert.equal(await page.locator('[data-field="tfge"]').inputValue(),'');assert.deepEqual(await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)})),{local:[],session:[]});assert.deepEqual(await context.cookies(),[]);assert.deepEqual(external,[]);});
  await check(profile.id,'las vistas anteriores remiten a la misma selección clínica',async()=>{await reset();await open('hta');await page.locator('.flow-reference summary').click();await page.locator('[data-action="flow-context"]').click();assert.equal(await page.locator('.medication-list,#flow-treatment').count(),0);await page.locator('[data-action="sequence-context-return"]').click();assert.ok(await page.locator('#sequence-questions').isVisible());assert.equal(await page.locator('#flow-treatment').count(),0);await inspect('context-return');});
  await check(profile.id,'actualización recupera una portada antigua en caché y conserva cachés ajenas',async()=>{
   await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
   await page.evaluate(async()=>{
    const keys=await caches.keys(),key=keys.find(x=>x.startsWith('cahreme-shell-%2F-'));
    const cache=await caches.open(key);await cache.put(location.origin+'/',new Response('<!doctype html><meta charset="utf-8"><h1>Prototipo en revisión: versión antigua de prueba</h1>',{headers:{'Content-Type':'text/html'}}));
    await (await caches.open('otra-aplicacion-prueba')).put(location.origin+'/fixture.txt',new Response('conservar'));
   });
   await page.goto(origin+'/');assert.match(await page.locator('body').innerText(),/versión antigua de prueba/);
   await page.goto(origin+'/actualizar.html');await page.locator('#update').click();await page.waitForURL(origin+'/');
   assert.equal(await page.locator('button.module-card').count(),8);assert.doesNotMatch(await page.locator('body').innerText(),/Prototipo en revisión|Ningún resultado autoriza/);
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
    await page.reload({waitUntil:'load'});assert.equal(await page.locator('button.module-card').count(),8);
   for(const id of ['obesidad','hepatico']){await open(id);await stage(2);await page.locator('[data-action="flow-classify"]').click();assert.ok(await page.locator('.brief-result').isVisible());}
   await open('dm2');await stage(3);assert.ok(await page.locator('[data-action="flow-insulin"]').isVisible());
   const urls=await page.evaluate(async()=>{const all=[];for(const key of await caches.keys())for(const request of await (await caches.open(key)).keys())all.push(request.url);return all;});
   assert.ok(urls.some(url=>url.endsWith('/src/clinical/plan-integral.mjs')));for(const file of ['clinical/rutas-patologia.mjs','sequence-fields.mjs','clinical/secuencia-terapeutica.mjs','clinical/secuencia-insulina.mjs','clinical/ajustes-seguros.mjs','clinical/identidad-farmaco.mjs'])assert.ok(urls.some(url=>url.endsWith('/src/'+file)),file+' offline');assert.ok(urls.every(url=>!new URL(url).search));
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
