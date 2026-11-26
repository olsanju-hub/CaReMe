import {GROUPS,SOURCE,createClinicalContext,updateFinding,evaluateSuspicion,setEvaluationReviewed,isEvaluationReviewed,isGroupReviewed,toggleFinding,INVESTIGATIONS,setInvestigation,diagnosticNext,diagnosticAction,LAB_FIELDS,REPORT_FIELDS,setStudyResult,investigationPlan,interpretSuspicion,labPlan,setPeptide,interpretPeptide,peptideFactors} from './ic/suspicion.mjs?v=81';
const BUILD='0.81';
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
function suspicionResult(){
 const r=interpretSuspicion(clinicalContext), step=r.next,safety=r.safety;
 const reasoning=r.reasoning.length?'<div class="sus-interpretation"><strong>Justificación clínica</strong>'+r.reasoning.map(g=>'<p><strong>'+g.label+':</strong> '+g.findings.join(' · ')+'</p>').join('')+'</div>':'';
 const secondary=step.kind==='safety'?'<button class="text-link" type="button" data-action="complete-safety">Revisar seguridad</button>':step.kind==='incomplete'?'<button class="text-link" type="button" data-action="complete-review">Revisar datos pendientes</button>':step.kind==='known'?'<button class="text-link" type="button" data-action="ic">Otros módulos de IC</button>':'';
 const next='<div class="sus-next"><strong>Siguiente actuación</strong><p>'+step.text+'</p><button class="sus-result-button'+(step.kind==='urgent'?' urgent-next':'')+'" type="button" data-action="'+step.action+'">'+step.label+' ›</button>'+secondary+'</div>';
 const detail=(r.pending.length?'<p><strong>Datos pendientes:</strong> '+r.pending.join(' · ')+'</p>':'')+(r.differential.length?'<p><strong>Diagnóstico diferencial:</strong> '+r.differential.join(' ')+'</p>':'');
 return '<section class="pearl-card sus-result '+safety.level+'" aria-live="polite"><h2 class="sus-clinical-title">'+r.title+'</h2><p>'+r.interpretation+'</p>'+reasoning+'<div class="sus-safety-axis '+safety.level+'"><strong>'+safety.title+'</strong><p>'+safety.text+'</p></div>'+next+'<details class="sus-evidence"><summary>Justificación ampliada y fuente</summary>'+detail+'<p>'+r.id+' · v'+r.source.version+' · '+r.source.sections+'</p><p>'+r.ruleType+'</p><a class="text-link" href="'+r.source.url+'" target="_blank" rel="noopener noreferrer">Consultar publicación original</a> · <a class="text-link" href="https://doi.org/10.1093/eurheartj/ehag500" target="_blank" rel="noopener noreferrer">Definición universal 2026</a></details></section>';
}
function suspicionBar(){
 const r=interpretSuspicion(clinicalContext),safety=r.safety;
 return '<div class="sus-bar '+safety.level+'"><div class="sus-bar-status" role="status"><small>Resultado de la evaluación</small><strong>'+r.title+'</strong>'+(safety.level!=='review'?'<p class="sus-bar-safety">'+safety.title+'</p>':'')+'</div><button type="button" class="sus-result-button" data-action="show-suspicion-result">Ver conclusión <span aria-hidden="true">↓</span></button></div>';
}
function groupFields(g){
 const count=g.fields.filter(([id])=>clinicalContext.findings[id]==='yes').length;
 const reviewed=isGroupReviewed(clinicalContext,g.id);
 const field=([id,label])=>'<label class="sus-check"><input type="checkbox" data-finding="'+id+'" '+(clinicalContext.findings[id]==='yes'?'checked':'')+'><span>'+label+'</span></label>';
 return '<details class="pearl-card sus-group" data-suspicion-group="'+g.id+'" '+(g.id==='alarms'?'open':'')+'><summary><strong>'+g.label+'</strong><span data-count="'+g.id+'">'+count+' positivos · '+(reviewed?'Revisado':'Pendiente')+'</span></summary><p class="sus-hint">'+g.hint+'</p>'+g.fields.map(field).join('')+(g.id==='alarms'?field(['vitalsReviewed','Constantes revisadas y estabilidad valorada']):'')+'</details>';
}
function suspicion(){return '<div class="page pearl-home ic-page suspicion-page">'+back('Diagnóstico','diagnosis')+'<h1>Sospecha clínica</h1><p class="ic-subtitle">Demostración educativa · Solo casos ficticios. No utilizar en asistencia clínica.</p><p class="sus-hint sus-check-help">Marca los hallazgos presentes. Confirma los ausentes una sola vez al final.</p><div class="sus-groups">'+GROUPS.map(groupFields).join('')+'</div><details class="pearl-card sus-group"><summary><strong>Diagnóstico diferencial</strong></summary><p class="sus-hint">Valorar según presentación; pueden coexistir con IC.</p><dl class="sus-diff"><dt>Disnea</dt><dd>EPOC/asma, infección respiratoria, anemia, tromboembolismo pulmonar, obesidad o desacondicionamiento.</dd><dt>Edema</dt><dd>Insuficiencia venosa, enfermedad renal, hepatopatía o causas farmacológicas.</dd><dt>Inicio brusco o inestabilidad</dt><dd>Considera causas tiempo-dependientes como síndrome coronario agudo, TEP o arritmia grave.</dd></dl></details><div class="pearl-card sus-final-review"><label class="sus-check sus-review"><input type="checkbox" data-review-all '+(isEvaluationReviewed(clinicalContext)?'checked':'')+'><span>He revisado todos los apartados. Los hallazgos no marcados están ausentes.</span></label></div><section id="suspicion-conclusion" tabindex="-1" class="sus-conclusion"><h2 class="sus-conclusion-heading">Conclusión clínica</h2><div id="suspicion-result">'+suspicionResult()+'</div></section><div id="suspicion-bar">'+suspicionBar()+'</div><div class="diagnosis-links"><a class="text-link" href="'+SOURCE.url+'" target="_blank" rel="noopener noreferrer">ESC 2026 · Evidencia</a><button type="button" class="text-link" data-action="reset-context">Nueva evaluación</button></div><p class="diagnosis-status">Prototipo no validado: no confirma ni descarta IC. No introducir datos de pacientes reales. Datos de demostración en memoria de sesión.</p></div>';}
function refreshSuspicion(){
 const box=document.getElementById('suspicion-result');if(!box)return;box.innerHTML=suspicionResult();const bar=document.getElementById('suspicion-bar');if(bar){const focused=bar.contains(document.activeElement);bar.innerHTML=suspicionBar();if(focused)bar.querySelector('button').focus({preventScroll:true});}
 for(const g of GROUPS){
  const reviewed=isGroupReviewed(clinicalContext,g.id);
  const el=document.querySelector('[data-count="'+g.id+'"]');if(el)el.textContent=g.fields.filter(([id])=>clinicalContext.findings[id]==='yes').length+' positivos · '+(reviewed?'Revisado':'Pendiente');

 }
 const control=document.querySelector('[data-review-all]');if(control)control.checked=isEvaluationReviewed(clinicalContext);
}
app.addEventListener('change',e=>{
 const id=e.target.dataset.finding;
 if(e.target.dataset.npInput){
  const before=clinicalContext;clinicalContext=setPeptide(clinicalContext,e.target.dataset.npInput,e.target.value);
  const invalid=before===clinicalContext;e.target.setAttribute('aria-invalid',String(invalid));
  const error=e.target.closest('label').querySelector('.np-error');if(error)error.textContent=invalid?'Valor inválido':'';
  const box=document.getElementById('np-result');if(box)box.innerHTML=invalid?'<p class="np-alert">Corrige el valor antes de interpretarlo.</p>':peptideResult();
  return;
 }
 if(e.target.dataset.studyResult){
  const key=e.target.dataset.studyResult,previous=clinicalContext;
  clinicalContext=setStudyResult(clinicalContext,key,e.target.value);
  const invalid=previous===clinicalContext;
  e.target.setAttribute('aria-invalid',String(invalid));
  const error=e.target.closest('label')?.querySelector('.study-input-error');if(error)error.textContent=invalid?'Valor inválido':'';
  const etiology=document.getElementById('study-etiology');if(etiology&&!invalid){const p=investigationPlan(clinicalContext);etiology.innerHTML=p.targeted.length?'<ul>'+p.targeted.map(x=>'<li>'+x.text+'</li>').join('')+'</ul>':'<p>No hay hallazgos registrados que orienten un estudio adicional específico.</p>';}
  return;
 }
 if(e.target.dataset.investigation){clinicalContext=setInvestigation(clinicalContext,e.target.dataset.investigation,e.target.value);return;}
 if(id)clinicalContext=toggleFinding(clinicalContext,id,e.target.checked);
 else if(e.target.hasAttribute('data-review-all'))clinicalContext=setEvaluationReviewed(clinicalContext,e.target.checked);
 else return;
 if(location.hash==='#ic/diagnostico/pruebas'){render();return;}
 refreshSuspicion();
});
function studyView(){
 const step=diagnosticNext(clinicalContext),plan=investigationPlan(clinicalContext);
 const recorded=GROUPS.flatMap(g=>g.fields.filter(([id])=>clinicalContext.findings[id]==='yes').map(([,label])=>label));
 const summary=interpretSuspicion(clinicalContext).title;
 const safetyPending=step.kind==='safety';
 const safety=safetyPending?'<section class="pearl-card study-safety study-alert"><h2>Seguridad pendiente</h2><p>Estabilidad pendiente. No implica autorización de manejo ambulatorio.</p><label class="sus-check"><input type="checkbox" data-finding="vitalsReviewed" '+(clinicalContext.findings.vitalsReviewed==='yes'?'checked':'')+'><span>Constantes revisadas y estabilidad valorada</span></label>'+(!isGroupReviewed(clinicalContext,'alarms')?'<p>Alarmas pendientes de revisar.</p><button class="text-link" type="button" data-action="diagnostic-section" data-section="sospecha">Revisar alarmas en sospecha clínica</button>':'')+'</section>':'';
 const message=step.kind==='urgent'?'Hay una alarma registrada. No utilizar el circuito ambulatorio para resolver la urgencia.':step.kind==='safety'||step.kind==='incomplete'?'Valoración clínica incompleta. Puedes consultar y registrar pruebas, pero no se emite un plan individualizado.':step.kind==='study'?'Sospecha clínica de IC. Pendiente de confirmación objetiva.':step.kind==='known'?'IC conocida según antecedente registrado. Revisar pruebas en su contexto.':'No se confirma ni se descarta IC con la información disponible.';

 const options=[['unknown','Sin registrar'],['requested','Solicitada'],['available','Resultado disponible'],['notIndicated','No indicada (criterio médico)']];
 const status=id=>'<label class="study-row"><span>Estado</span><select data-investigation="'+id+'" aria-label="Estado de '+INVESTIGATIONS.find(x=>x[0]===id)[1]+'">'+options.map(([value,title])=>'<option value="'+value+'" '+((clinicalContext.investigations?.[id]?.status||'unknown')===value?'selected':'')+'>'+title+'</option>').join('')+'</select></label>';
 const report=id=>'<label class="study-result-field"><span>'+REPORT_FIELDS[id].label+'</span><select data-study-result="'+id+'">'+REPORT_FIELDS[id].options.map(([value,title])=>'<option value="'+value+'" '+((clinicalContext.results?.[id]?.value||'unknown')===value?'selected':'')+'>'+title+'</option>').join('')+'</select></label>';
 const lp=labPlan(clinicalContext);
 const labField=([id,label,unit,purpose])=>'<label class="study-lab-field lab-compact-field"><span><strong>'+label+'</strong><small>'+unit+'</small></span><span class="study-value"><input type="text" inputmode="decimal" autocomplete="off" data-study-result="'+id+'" aria-label="'+label+' ('+unit+')" title="'+purpose+'" value="'+(clinicalContext.results?.[id]?.value??'')+'" placeholder="—"><small class="study-input-error" aria-live="polite"></small></span></label>';
 const block=(title,icon,hint,body)=>'<details class="pearl-card study-block"><summary><span class="pearl-icon study-icon">'+svg(icon)+'</span><strong>'+title+'</strong></summary><div class="study-body"><p class="study-purpose">'+hint+'</p>'+body+'</div></details>';
 const priority=lp.priority.map(id=>LAB_FIELDS.find(x=>x[0]===id));
 const extras=LAB_FIELDS.filter(x=>!lp.priority.includes(x[0]));
 const existing=extras.filter(x=>clinicalContext.results?.[x[0]]!==undefined);
 const extraRows=extras.map(x=>'<div data-lab-extra="'+x[0]+'" '+(existing.includes(x)?'':'hidden')+'>'+labField(x)+'</div>').join('');
 const choices=extras.map(x=>'<button type="button" class="lab-add-choice" data-action="add-lab-result" data-lab-id="'+x[0]+'" '+(existing.includes(x)?'hidden':'')+'>+ '+x[1]+'</button>').join('');
 const request='<details class="lab-request"><summary><strong>Analítica recomendada</strong><small>'+lp.title+'</small></summary><p>'+lp.note+'</p><ul>'+lp.basal.map(x=>'<li>'+x+'</li>').join('')+'</ul>'+(lp.emphasis.length?'<div class="lab-emphasis"><strong>Según el perfil</strong>'+lp.emphasis.map(x=>'<p>'+x+'</p>').join('')+'</div>':'')+(lp.canCopy?'<button type="button" class="text-link lab-copy" data-action="copy-lab-request">Copiar solicitud</button><span class="lab-copy-status" role="status"></span>':'')+'</details>';
 const labBody=request+'<div class="lab-priority"><h3>Resultados disponibles <small>Opcional</small></h3>'+priority.map(labField).join('')+'</div><details class="lab-more"><summary>Añadir otros resultados'+(existing.length?' · '+existing.length+' registrados':'')+'</summary><div class="lab-extra-fields">'+extraRows+'</div><div class="lab-choices">'+choices+'</div></details><p class="sus-hint lab-note">No es necesario rellenar ningún valor para continuar. Los resultados se conservan durante esta sesión; fecha de muestra pendiente.</p>';
 const conditional='<div id="study-etiology">'+(plan.targeted.length?'<ul>'+plan.targeted.map(x=>'<li>'+x.text+'</li>').join('')+'</ul>':'<p>No hay hallazgos registrados que orienten un estudio adicional específico. Individualizar según historia y exploración.</p>')+'</div>';
 const icons={ecg:'M2 12h5l3-7 4 14 3-7h5',lab:diagnosticItems[2][3],rx:'M4 3h16v18H4zM12 5v14M10 7c-4 0-5 5-4 9 2 1 4 0 4-2V7m4 0c4 0 5 5 4 9-2 1-4 0-4-2V7',etiology:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z'};
 const specific=item=>diagnosticCard([item[0],item[1],'',item[3],item[4]],'study-specific-card');
 const context='<details class="pearl-card study-context"><summary><span><strong>'+summary+'</strong><small>Ver contexto clínico</small></span></summary><div class="study-body"><p>'+message+'</p><p><strong>'+plan.basal+'</strong></p><p>ECG, analítica, radiografía, péptidos natriuréticos y ecocardiografía forman parte del estudio de referencia ante sospecha. Revisar resultados previos y adecuar al contexto. No es una orden automática.</p>'+(recorded.length?'<ul>'+recorded.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'<p>No hay hallazgos positivos registrados en esta sesión.</p>')+'<button class="text-link" type="button" data-action="diagnostic-section" data-section="sospecha">Revisar sospecha clínica</button><button type="button" class="text-link" data-action="reset-context">Nueva evaluación</button></div></details>';
 const urgent=step.kind==='urgent'?'<section class="pearl-card study-alert study-critical" role="alert"><strong>Alarma clínica</strong><p>'+evaluateSuspicion(clinicalContext).action+'</p></section>':'';
 const next=step.kind==='urgent'?'<button class="sus-result-button study-next urgent-next" data-action="ic-section" data-section="descompensada" type="button">IC descompensada (en desarrollo) ›</button>':'<button class="sus-result-button study-next" data-action="diagnostic-section" data-section="peptidos" type="button">Continuar estudio diagnóstico ›</button>';
 return '<div class="page pearl-home ic-page study-page study-compact">'+back('Diagnóstico','diagnosis')+'<h1>Pruebas diagnósticas</h1>'+context+urgent+safety+'<div class="study-blocks">'+block('Electrocardiograma',icons.ecg,'Ritmo, conducción y cardiopatía. Revisar ECG previo o registrar el disponible.',status('ecg')+report('ecg'))+block('Analítica',icons.lab,'Función renal, comorbilidades y seguridad farmacológica.',labBody)+block('Radiografía de tórax',icons.rx,'Estudio inicial de referencia: congestión y diagnósticos alternativos.',status('rx')+report('rx'))+block('Estudio etiológico',icons.etiology,'Pruebas adicionales condicionadas por los antecedentes y hallazgos.',conditional)+'</div><div class="study-links">'+specific(diagnosticItems[3])+specific(diagnosticItems[4])+'</div>'+next+'<div class="study-foot"><a class="text-link" href="'+SOURCE.url+'" target="_blank" rel="noopener noreferrer">Evidencia científica</a><p class="diagnosis-status">Prototipo educativo · Asistentes específicos en desarrollo · No validado para uso asistencial</p></div></div>';
}
function peptideResult(){
 const r=interpretPeptide(clinicalContext);
 const units='pg/mL', threshold=r.low===null?'':('<p class="np-threshold">Umbral de exclusión: &lt;'+r.low+' '+units+(r.high!==null?' · Umbral orientativo: '+(r.context==='acute'?'&gt;':'≥')+r.high+' '+units:'')+'</p>');
 const next=r.urgent?'<button type="button" class="sus-result-button urgent-next" data-action="ic-section" data-section="descompensada">'+r.next.label+' ›</button>':'<button type="button" class="sus-result-button" data-action="diagnostic-section" data-section="ecocardiografia">'+r.next.label+' ›</button>';
 return '<section class="pearl-card np-result" aria-live="polite"><h2>'+r.title+'</h2><p>'+r.text+'</p>'+threshold+(r.notes.length?'<details><summary>Factores modificadores</summary><ul>'+r.notes.map(x=>'<li>'+x+'</li>').join('')+'</ul></details>':'')+'<div class="sus-next"><strong>Siguiente actuación</strong><p>'+r.next.text+'</p>'+next+'</div></section>';
}
function peptideView(){
 const p=clinicalContext.peptides||{},r=interpretPeptide(clinicalContext),kind=p.kind||'nt',context=p.context||'unknown';
 const segmented=(key,choices,selected)=>'<div class="np-segment" role="group">'+choices.map(([v,t])=>'<button type="button" data-action="np-select" data-np-key="'+key+'" data-np-value="'+v+'" aria-pressed="'+(v===selected)+'">'+t+'</button>').join('')+'</div>';
 const field=(id,label,unit)=>'<label class="np-field"><span>'+label+'</span><span class="np-entry"><input data-np-input="'+id+'" inputmode="'+(id==='age'?'numeric':'decimal')+'" type="text" autocomplete="off" placeholder="—" value="'+(p[id]??'')+'" aria-label="'+label+'"><small>'+unit+'</small></span><small class="np-error" role="status"></small></label>';
 const factors=Object.entries({obesity:'Obesidad',af:'Fibrilación auricular',renal:'Disfunción renal',arni:'Sacubitrilo/valsartán'}).map(([id,label])=>'<div class="np-factor"><span>'+label+'</span>'+segmented(id,[['yes','Sí'],['no','No'],['unknown','?']],r.factors[id])+'</div>').join('');
 const safety=r.urgent?'<p class="np-alert" role="alert">Contexto agudo o alarma registrada: priorizar valoración urgente.</p>':r.context==='outpatient'&&interpretSuspicion(clinicalContext).safety.level==='pending'?'<p class="np-alert">Estabilidad pendiente de valorar.</p>':'';
 return '<div class="page pearl-home ic-page np-page">'+back('Diagnóstico','diagnosis')+'<h1>Péptidos natriuréticos</h1><p class="ic-subtitle">Prototipo educativo · casos ficticios</p>'+safety+'<section class="pearl-card np-inputs">'+segmented('kind',[['nt','NT-proBNP'],['bnp','BNP']],kind)+segmented('context',[['outpatient','Ambulatorio'],['acute','Agudo']],context)+(context==='unknown'?'<p class="sus-hint">Selecciona el contexto asistencial.</p>':'')+'<div class="np-fields">'+field('age','Edad','años')+field(kind,kind==='nt'?'NT-proBNP':'BNP','pg/mL')+'</div><details class="np-modifiers"><summary>Factores modificadores</summary>'+factors+'<p class="sus-hint">? = sin valorar. Datos recuperados del contexto si están disponibles; confirmar según situación actual.</p></details><button class="sus-result-button" data-action="interpret-np" type="button">Interpretar resultado</button></section><div id="np-result" tabindex="-1">'+peptideResult()+'</div><div class="study-foot"><a class="text-link" href="'+SOURCE.url+'" target="_blank" rel="noopener noreferrer">Evidencia científica</a><p class="diagnosis-status">No establece diagnóstico ni sustituye valoración clínica. Pendiente de validación y licencia.</p><button class="text-link" type="button" data-action="reset-context">Nueva evaluación</button></div></div>';
}
function guidedEntry(title){
 return '<div class="page pearl-home ic-page">'+back('Insuficiencia cardiaca','ic')+'<h1>'+title+'</h1><section class="pearl-card pending-card"><h2>Recorrido guiado</h2><p>Comienza por sospecha o continúa el estudio registrado en esta sesión. El recorrido completo sigue en desarrollo.</p><button type="button" class="sus-result-button" data-action="diagnostic-section" data-section="sospecha">Evaluar sospecha clínica</button><button type="button" class="text-link" data-action="diagnostic-section" data-section="pruebas">Abrir pruebas diagnósticas</button></section><button class="text-link" type="button" data-action="ic">Elegir otro módulo</button></div>';
}
function route(){const hash=location.hash.slice(1);if(hash==='ic')return ic();if(hash==='ic/diagnostico')return diagnosis();if(hash==='ic/diagnostico/sospecha')return suspicion();if(hash==='ic/diagnostico/pruebas')return studyView();if(hash==='ic/diagnostico/peptidos')return peptideView();if(hash==='ic/diagnostico/asistente')return guidedEntry('Asistente diagnóstico');if(hash==='ic/valoracion')return guidedEntry('Valoración del paciente');if(hash==='ic/diagnostico/referencias')return pending('Referencias científicas','diagnosis','Diagnóstico',true);if(hash.startsWith('ic/diagnostico/')){const item=diagnosticItems.find(x=>x[0]===hash.slice('ic/diagnostico/'.length));if(item)return pending(item[1],'diagnosis','Diagnóstico',true);return diagnosis();}if(hash.startsWith('ic/')){const item=all.find(x=>x[0]===hash.slice(3));if(item)return pending(item[1],'ic','Insuficiencia cardiaca',item[0]!=='descompensada');}if(hash==='integral')return pending('Valoración integral');if(hash==='sources')return pending('Fuentes');if(hash.startsWith('area/')){const item=PATHOLOGIES.find(x=>x[0]===hash.slice(5));if(item)return pending(item[1]);}return home();}
function render(focus=false){app.innerHTML='<a class="skip-link" href="#main-content">Saltar al contenido</a><main id="main-content" tabindex="-1">'+route()+'</main><footer class="footer">CaHReMe · Salud cardiorrenal-hepatometabólica · v'+BUILD+'</footer>';if(focus){document.getElementById('main-content').focus({preventScroll:true});window.scrollTo(0,0);}}
function go(hash){if(location.hash==='#'+hash||(!hash&&!location.hash))render(true);else location.hash=hash;}
app.addEventListener('click',event=>{const btn=event.target.closest('button[data-action]');if(!btn)return;switch(btn.dataset.action){case 'np-select':{
 clinicalContext=setPeptide(clinicalContext,btn.dataset.npKey,btn.dataset.npValue);render();break;
 }case 'interpret-np':{
 const fields=[...document.querySelectorAll('[data-np-input]')];
 let valid=true;for(const field of fields){const before=clinicalContext;clinicalContext=setPeptide(clinicalContext,field.dataset.npInput,field.value);const invalid=before===clinicalContext;field.setAttribute('aria-invalid',String(invalid));const err=field.closest('label').querySelector('.np-error');if(err)err.textContent=invalid?'Valor inválido':'';if(invalid)valid=false;}
 const result=document.getElementById('np-result');if(result){result.innerHTML=valid?peptideResult():'<p class="np-alert">Corrige el valor antes de interpretarlo.</p>';result.focus({preventScroll:true});result.scrollIntoView({block:'start',behavior:'auto'});}break;
 }case 'add-lab-result':{
 const id=btn.dataset.labId;if(!LAB_FIELDS.some(x=>x[0]===id))break;
 const row=document.querySelector('[data-lab-extra="'+id+'"]');if(row){row.hidden=false;btn.hidden=true;row.querySelector('input').focus();}break;
 }case 'copy-lab-request':{
 const p=labPlan(clinicalContext);if(!p.canCopy)break;
 const text=p.basal.join('; ')+'.';const output=document.querySelector('.lab-copy-status');
 const fallback=()=>{const t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.cssText='position:fixed;left:8px;top:8px;width:calc(100% - 16px);height:100px;z-index:100';document.body.append(t);t.select();let ok=false;try{ok=document.execCommand('copy');}catch{}if(ok){t.remove();if(output)output.textContent='Solicitud copiada.';}else{t.remove();if(output){output.textContent='No se pudo copiar. Selecciona el texto del listado.';}}};
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>{if(output)output.textContent='Solicitud copiada.';}).catch(fallback);else fallback();break;
 }case 'complete-safety':{
 const group=document.querySelector('[data-suspicion-group="alarms"]');
 if(group){group.open=true;const target=clinicalContext.findings.vitalsReviewed!=='yes'?group.querySelector('[data-finding="vitalsReviewed"]'):group.querySelector('summary');if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'center',behavior:'auto'});}}
 break;
 }case 'complete-review':{
 const group=GROUPS.find(g=>!isGroupReviewed(clinicalContext,g.id));
 const section=group&&document.querySelector('[data-suspicion-group="'+group.id+'"]');
 if(section){section.open=true;const target=section.querySelector('summary');target.focus({preventScroll:true});target.scrollIntoView({block:'center',behavior:'auto'});}
 else{const target=document.querySelector('[data-review-all]');if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'center',behavior:'auto'});}}
 break;
 }case 'open-urgent':{if(diagnosticNext(clinicalContext).kind==='urgent')go('ic/descompensada');break;}case 'continue-study':{const step=diagnosticNext(clinicalContext);if(step.kind!=='urgent')go('ic/diagnostico/pruebas');break;}case 'show-suspicion-result':{const target=document.getElementById('suspicion-conclusion');if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'auto'});}break;}case 'reset-context':if(confirm('¿Borrar la evaluación clínica de esta sesión?')){clinicalContext=createClinicalContext();render(true);}break;case 'home':go('');break;case 'ic':go('ic');break;case 'diagnosis':go('ic/diagnostico');break;case 'diagnostic-evidence':go('ic/diagnostico/referencias');break;case 'diagnostic-section':if(diagnosticItems.some(x=>x[0]===btn.dataset.section))go('ic/diagnostico/'+btn.dataset.section);break;case 'start':go('integral');break;case 'sources':go('sources');break;case 'open-pathology':go(btn.dataset.pathology==='ic'?'ic':'area/'+btn.dataset.pathology);break;case 'ic-section':if(all.some(x=>x[0]===btn.dataset.section))go('ic/'+btn.dataset.section);break;}});
window.addEventListener('hashchange',()=>render(true));
render();
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
 let hadController=!!navigator.serviceWorker.controller, updateNotice=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(!hadController){hadController=true;return;}
  if(updateNotice)return;updateNotice=true;
  const hasData=Object.keys(clinicalContext.findings).length||Object.keys(clinicalContext.investigations||{}).length||Object.keys(clinicalContext.results||{}).length||Object.keys(clinicalContext.peptides||{}).length;
  if(!hasData){location.reload();return;}
  const notice=document.createElement('div');notice.setAttribute('role','status');
  notice.style.cssText='position:relative;padding:10px 16px;background:#fff;color:#173347;text-align:center;border-bottom:1px solid #d6e6e8;font-size:.85rem';
  notice.textContent='Nueva versión disponible. Termina tu evaluación antes de recargar; los datos de sesión no se conservan.';
  const refresh=document.createElement('button');refresh.className='text-link';refresh.textContent='Actualizar ahora';refresh.addEventListener('click',()=>{if(confirm('¿Actualizar y borrar los datos de esta sesión?'))location.reload();});notice.append(refresh);document.body.prepend(notice);
 });
 window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{}));
}
