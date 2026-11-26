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
   await page.goto(url);await page.getByRole('heading',{name:'CaHReMe',exact:true}).waitFor();await page.screenshot({path:'qa-results/'+name+'-home.png',fullPage:true});
   await page.getByRole('button',{name:'Insuficiencia cardíaca',exact:true}).click();await page.getByRole('heading',{name:'Insuficiencia cardiaca',exact:true}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
   await page.screenshot({path:'qa-results/'+name+'-ic.png',fullPage:true});
   for(const id of ['valoracion','diagnostico','clasificacion','tratamiento','optimizacion','seguimiento','comorbilidades','derivacion','avanzada','calculadoras','farmacoteca','evidencia','descompensada']){
    await page.locator('[data-section="'+id+'"]').first().click();await page.getByRole('heading',{name:'Pendiente de desarrollo'}).waitFor();await page.getByRole('button',{name:'Insuficiencia cardiaca',exact:false}).first().click();await page.getByRole('heading',{name:'Insuficiencia cardiaca',exact:true}).waitFor();
   }
   await page.getByRole('button',{name:'CaHReMe',exact:false}).first().click();await page.getByRole('heading',{name:'CaHReMe',exact:true}).waitFor();
   await page.getByRole('button',{name:'Diabetes tipo 2',exact:true}).click();await page.getByRole('heading',{name:'Pendiente de desarrollo'}).waitFor();assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 }
}finally{server.kill();}
