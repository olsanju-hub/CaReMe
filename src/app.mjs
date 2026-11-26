import {GROUPS,SOURCE,createClinicalContext,updateFinding,evaluateSuspicion} from './ic/suspicion.mjs';
const app=document.getElementById('app');
const PATHOLOGIES = [
 ['dm2','Diabetes tipo 2','Incluye insulinización'],['hta','Hipertensión arterial','Confirmación y control'],
 ['lipids','Dislipemia','Objetivo LDL y pauta'],['obesidad','Obesidad','Clasificación y tratamiento'],
 ['erc','Enfermedad renal crónica','Categoría renal y protección'],['ic','Insuficiencia cardíaca','FEVI, congestión y tratamiento'],
 ['hepatico','Hígado metabólico','Riesgo de fibrosis'],['cv-risk','Prevención cardiovascular','Riesgo y estadio CKM']
];
const homeIcons = {
  "dm2": "M12 2C9 7 5 10 5 15a7 7 0 0 0 14 0c0-5-4-8-7-13ZM9 13h6v5H9z",
  "hta": "M3 8h6v9H3z M9 13h4a3 3 0 0 0 3-3V8 M20 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM16 6l2-2",
  "lipids": "M12 2C9 7 5 10 5 15a7 7 0 0 0 14 0c0-5-4-8-7-13ZM10 12h.01 M14 15h.01 M10 17h.01",
  "obesidad": "M4 6q8-5 16 0l-2 14H6z M8 9q4-3 8 0 M12 12l2-4",
  "erc": "M9 4C2 3 1 15 6 17c4 2 6-3 3-5-2-1 4-6 0-8ZM15 4c7-1 8 11 3 13-4 2-6-3-3-5 2-1-4-6 0-8ZM10 16v5m4-5v5",
  "ic": "M12 21S2 15 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 7-10 13-10 13ZM4 12h4l2-4 3 7 2-3h5",
  "hepatico": "M3 8c3-5 9-5 13-4l5 1c-2 7-7 8-11 9l-5 5c-3 1-3-7-2-11Z",
  "cv-risk": "M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6z M8 12l3 3 5-6",
  "integral": "M12 3v5m0 8v5M3 12h5m8 0h5M9 9h6v6H9z M10 2h4m-4 20h4M2 10v4m20-4v4"
};
function homeIcon(id) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${homeIcons[id]}"/></svg>`;
}
function home() {
  return `<div class="page home pearl-home">
    <h1>CaHReMe</h1>
    <button type="button" class="pearl-card pearl-integral" data-action="start" data-focus="integral">
      <span class="pearl-icon">${homeIcon('integral')}</span>
      <span><strong>Valoración integral</strong><small>Perfil cardiorrenal, metabólico y hepático</small></span>
      <span aria-hidden="true">→</span>
    </button>
    <h2>Consulta por área clínica</h2>
    <div class="module-grid">${PATHOLOGIES.map(([id,title])=>`<button type="button" class="module-card" data-action="open-pathology" data-pathology="${id}"><span class="pearl-icon">${homeIcon(id)}</span><span class="module-content"><strong>${title}</strong></span></button>`).join('')}</div>
    <div class="pearl-links"><button type="button" class="text-link" data-action="sources">Fuentes</button>
    </div>
  </div>`;
}

const sections=[
 ['diagnostico','Diagnóstico','Sospecha y confirmación','M4 3v6a5 5 0 0 0 10 0V3M4 3H2m12 0h2M9 14v2a4 4 0 0 0 8 0v-2m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z','#007e87'],
 ['clasificacion','Clasificación','Estadio, FEVI y NYHA','M3 7l9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4','#185cb5'],
 ['tratamiento','Tratamiento','Inicio y selección','M7 17a5 5 0 0 1 0-7l5-5a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7 0Zm2-9 7 7','#087047'],
 ['optimizacion','Optimización','Titulación y tolerancia','M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-5 0v6','#4c65ac'],
 ['seguimiento','Seguimiento','Controles y reevaluación','M4 5h16v16H4zM8 2v6m8-6v6M4 10h16m-12 5 3 3 5-5','#007e87'],
 ['comorbilidades','Comorbilidades','Abordaje integrado','M12 5v5m0 4v5M5 12h5m4 0h5M9 9h6v6H9zM3 10h4v4H3zM17 10h4v4h-4z','#438225'],
 ['derivacion','Derivación','Prioridad y destino','M12 3v18M5 6h14l3 3-3 3H5zM19 14H5l-3 3 3 3h14','#174776'],
 ['avanzada','IC avanzada','Dispositivos y paliativos',homeIcons.ic,'#0076a2']
];
const utilities=[
 ['calculadoras','Calculadoras','', 'M5 3h14v18H5zM8 7h8M8 11h2m4 0h2M8 15h2m4 0h2M8 18h2m4 0h2','#185cb5'],
 ['farmacoteca','Farmacoteca','','M3 5h7l2 2 2-2h7v15h-7l-2 2-2-2H3zM12 7v15','#087047'],
 ['evidencia','Evidencia','','M5 3h10l4 4v14H5zM14 3v5h5M8 13h8m-8 4h6','#007e87']
];
const special=[
 ['valoracion','Valoración del paciente','Evaluación clínica individualizada',homeIcons.integral,'#0076a2'],
 ['descompensada','IC descompensada','Valoración urgente y actuación inicial','M12 3 2 20h20L12 3Zm0 6v5m0 3h.01','#a93c43']
];
const all=[...special,...sections,...utilities];
function svg(path){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg>';}
function card(item,extra=''){const [id,label,description,path,color]=item;return '<button type="button" class="module-card ic-card '+extra+'" data-action="ic-section" data-section="'+id+'" style="--icon:'+color+'"><span class="pearl-icon">'+svg(path)+'</span><span class="module-content"><strong>'+label+'</strong>'+(description?'<small>'+description+'</small>':'')+'</span></button>';}
function back(label,action){return '<button type="button" class="ic-back text-link" data-action="'+action+'"><span aria-hidden="true">‹</span> '+label+'</button>';}
function ic(){return '<div class="page home pearl-home ic-page">'+back('CaHReMe','home')+'<h1>Insuficiencia cardiaca</h1><p class="ic-subtitle">Atención Primaria · Módulo en desarrollo</p><div class="ic-priority">'+card(special[0],'ic-hero')+card(special[1],'ic-urgent')+'</div><h2>Consulta clínica</h2><div class="module-grid ic-grid">'+sections.map(x=>card(x)).join('')+'</div><div class="ic-tools">'+utilities.map(x=>card(x,'ic-tool')).join('')+'</div></div>';}
function pending(title,action='home',label='CaHReMe',urgent=false){return '<div class="page pearl-home ic-page pending-page">'+back(label,action)+'<h1>'+title+'</h1><section class="pearl-card pending-card"><h2>Pendiente de desarrollo</h2><p>Este apartado todavía no contiene reglas ni recomendaciones clínicas validadas.</p><p>No utilizar como apoyo a decisiones asistenciales.</p></section>'+(urgent?card(special[1],'ic-urgent'):'')+'</div>';}
const diagnosticItems=[
 ['asistente','Asistente diagnóstico','Evaluación y siguiente actuación clínica','M5 5h4m6 0h4v16H5V5m4-2h6v4H9zM8 13l3 3 5-6','#0076a2'],
 ['sospecha','Sospecha clínica','Riesgo, síntomas y signos',sections[0][3],'#007e87'],
 ['pruebas','Pruebas diagnósticas','ECG, analítica y radiografía','M9 3h6m-5 0v7l-6 9a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3M7 15h10','#185cb5'],
 ['peptidos','BNP / NT-proBNP','Interpretación clínica','M2 12h5l3-7 4 14 3-7h5','#087047'],
 ['ecocardiografia','Ecocardiografía','Indicación y resultados',homeIcons.ic,'#0076a2']
];
function diagnosticCard(item,extra=''){return card(item,extra).replace('data-action="ic-section"','data-action="diagnostic-section"');}
function diagnosis(){return '<div class="page home pearl-home ic-page diagnosis-page">'+back('Insuficiencia cardiaca','ic')+'<h1>Diagnóstico</h1><p class="ic-subtitle">Sospecha y confirmación de IC</p><div class="diagnosis-primary">'+diagnosticCard(diagnosticItems[0],'ic-hero')+'</div><div class="module-grid ic-grid diagnosis-grid">'+diagnosticItems.slice(1).map(x=>diagnosticCard(x)).join('')+'</div><div class="diagnosis-links"><button class="text-link" type="button" data-action="diagnostic-evidence">Referencias científicas</button><button class="text-link diagnostic-urgent-link" type="button" data-action="ic-section" data-section="descompensada">IC descompensada</button></div><p class="diagnosis-status">En desarrollo · Sin recomendaciones clínicas activas</p></div>';}
let clinicalContext=createClinicalContext();
function suspicionResult(){const r=evaluateSuspicion(clinicalContext);const next=r.id==='IC-SUS-05'?'<button type="button" class="text-link" data-action="diagnostic-section" data-section="pruebas">Ir a pruebas diagnósticas ›</button>':'';return '<section class="pearl-card sus-result '+r.level+'" aria-live="polite"><h2>'+r.title+'</h2><p>'+r.action+'</p>'+(r.details.length?'<details><summary>Hallazgos registrados ('+r.details.length+')</summary><ul>'+r.details.map(x=>'<li>'+x+'</li>').join('')+'</ul></details>':'')+next+'</section>';}
function groupFields(g){const count=g.fields.filter(([id])=>['yes','no'].includes(clinicalContext.findings[id])).length;return '<details class="pearl-card sus-group" '+(g.id==='alarms'?'open':'')+'><summary><strong>'+g.label+'</strong><span data-count="'+g.id+'">'+count+'/'+g.fields.length+'</span></summary><p class="sus-hint">'+g.hint+'</p>'+g.fields.map(([id,label])=>'<label class="sus-field"><span>'+label+'</span><select data-finding="'+id+'" aria-label="'+label+'">'+[['unknown','Sin valorar'],['yes','Sí'],['no','No']].map(([value,title])=>'<option value="'+value+'" '+((clinicalContext.findings[id]||'unknown')===value?'selected':'')+'>'+title+'</option>').join('')+'</select></label>').join('')+'<button type="button" class="text-link sus-all-no" data-action="review-negative" data-group="'+g.id+'">Marcar los pendientes como no, tras comprobarlos</button></details>';}
function suspicion(){return '<div class="page pearl-home ic-page suspicion-page">'+back('Diagnóstico','diagnosis')+'<h1>Sospecha clínica</h1><p class="ic-subtitle">Evaluación breve · Prototipo pendiente de validación clínica</p><div id="suspicion-result">'+suspicionResult()+'</div><div class="sus-groups">'+GROUPS.map(groupFields).join('')+'</div><details class="pearl-card sus-group"><summary><strong>Diagnóstico diferencial</strong></summary><p class="sus-hint">Valorar según presentación; pueden coexistir con IC.</p><dl class="sus-diff"><dt>Disnea</dt><dd>EPOC/asma, infección respiratoria, anemia, tromboembolismo pulmonar, obesidad o desacondicionamiento.</dd><dt>Edema</dt><dd>Insuficiencia venosa, enfermedad renal, hepatopatía o causas farmacológicas.</dd><dt>Inicio brusco o inestabilidad</dt><dd>Considera causas tiempo-dependientes como síndrome coronario agudo, TEP o arritmia grave.</dd></dl></details><div class="diagnosis-links"><a class="text-link" href="'+SOURCE.url+'" target="_blank" rel="noopener noreferrer">ESC 2026 · Evidencia</a><button type="button" class="text-link" data-action="reset-context">Nueva evaluación</button></div><p class="diagnosis-status">Orientación cualitativa; no es una escala validada ni confirma o descarta IC. Datos en memoria durante esta sesión.</p></div>';}
function refreshSuspicion(){const box=document.getElementById('suspicion-result');if(!box)return;box.innerHTML=suspicionResult();for(const g of GROUPS){const el=document.querySelector('[data-count="'+g.id+'"]');if(el)el.textContent=g.fields.filter(([id])=>['yes','no'].includes(clinicalContext.findings[id])).length+'/'+g.fields.length;}}
app.addEventListener('change',e=>{const id=e.target.dataset.finding;if(!id)return;clinicalContext=updateFinding(clinicalContext,id,e.target.value);refreshSuspicion();});
function route(){const hash=location.hash.slice(1);if(hash==='ic')return ic();if(hash==='ic/diagnostico')return diagnosis();if(hash==='ic/diagnostico/sospecha')return suspicion();if(hash==='ic/diagnostico/referencias')return pending('Referencias científicas','diagnosis','Diagnóstico',true);if(hash.startsWith('ic/diagnostico/')){const item=diagnosticItems.find(x=>x[0]===hash.slice('ic/diagnostico/'.length));if(item)return pending(item[1],'diagnosis','Diagnóstico',true);return diagnosis();}if(hash.startsWith('ic/')){const item=all.find(x=>x[0]===hash.slice(3));if(item)return pending(item[1],'ic','Insuficiencia cardiaca',item[0]!=='descompensada');}if(hash==='integral')return pending('Valoración integral');if(hash==='sources')return pending('Fuentes');if(hash.startsWith('area/')){const item=PATHOLOGIES.find(x=>x[0]===hash.slice(5));if(item)return pending(item[1]);}return home();}
function render(focus=false){app.innerHTML='<a class="skip-link" href="#main-content">Saltar al contenido</a><main id="main-content" tabindex="-1">'+route()+'</main><footer class="footer">CaHReMe · Salud cardiorrenal-hepatometabólica</footer>';if(focus){document.getElementById('main-content').focus({preventScroll:true});window.scrollTo(0,0);}}
function go(hash){if(location.hash==='#'+hash||(!hash&&!location.hash))render(true);else location.hash=hash;}
app.addEventListener('click',event=>{const btn=event.target.closest('button[data-action]');if(!btn)return;switch(btn.dataset.action){case 'reset-context':if(confirm('¿Borrar la evaluación clínica de esta sesión?')){clinicalContext=createClinicalContext();render(true);}break;case 'review-negative':{const g=GROUPS.find(g=>g.id===btn.dataset.group);if(g&&confirm('¿Has comprobado que todos los hallazgos pendientes de este apartado están ausentes?')){for(const [id] of g.fields)if(!['yes','no'].includes(clinicalContext.findings[id])){clinicalContext=updateFinding(clinicalContext,id,'no');const el=document.querySelector('[data-finding="'+id+'"]');if(el)el.value='no';}refreshSuspicion();}break;}case 'home':go('');break;case 'ic':go('ic');break;case 'diagnosis':go('ic/diagnostico');break;case 'diagnostic-evidence':go('ic/diagnostico/referencias');break;case 'diagnostic-section':if(diagnosticItems.some(x=>x[0]===btn.dataset.section))go('ic/diagnostico/'+btn.dataset.section);break;case 'start':go('integral');break;case 'sources':go('sources');break;case 'open-pathology':go(btn.dataset.pathology==='ic'?'ic':'area/'+btn.dataset.pathology);break;case 'ic-section':if(all.some(x=>x[0]===btn.dataset.section))go('ic/'+btn.dataset.section);break;}});
window.addEventListener('hashchange',()=>render(true));
render();
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{}));
