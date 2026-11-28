import {GROUPS,SOURCE,createClinicalContext,updateFinding,evaluateSuspicion,setEvaluationReviewed,isEvaluationReviewed,isGroupReviewed,toggleFinding,diagnosticNext,diagnosticAction,LAB_FIELDS,REPORT_FIELDS,setStudyResult,investigationPlan,interpretSuspicion,labPlan,setPeptide,interpretPeptide,peptideFactors,ECHO_FINDINGS,ECHO_NUMERIC,setEcho,interpretEcho,STAGE_QUESTIONS,setStageAssessment,interpretStage,setPhenotypeAssessment,interpretPhenotype,NYHA_OPTIONS,setNyha,interpretNyha,SITUATION_QUESTIONS,setSituation,interpretSituation,classificationSummary,TREATMENT_VITALS,setTreatmentValue,confirmTreatmentLabs,treatmentSafetyData,MEDICATION_GROUPS,MEDICATION_FREQUENCIES,MEDICATION_ABSENCE_REASONS,MEDICATION_TOLERANCE,setMedicationField,addMedication,removeMedication,medicationSummary,confirmMedicationReview,MEDICATION_QUICK_DOSES,medicationEntryComplete,setMedicationQuickDose,MEDICATION_FAMILIES,medicationFamilyLabel,addNamedMedication,deleteRecordedMedication,medicationFrequencyOptions,medicationSafety,treatmentProposal,MEDICATION_INDICATIONS,confirmExternalMedicationReview,setAbsenceReason,setTherapyRisk,medicationProblemOptions} from './ic/suspicion.mjs?v=102';
const BUILD='0.102';
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
 ['tratamiento','Tratamiento','Selección y ajustes','M7 17a5 5 0 0 1 0-7l5-5a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7 0Zm2-9 7 7','#087047'],
 ['optimizacion','Optimización','Reevaluación del tratamiento','M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-5 0v6','#4c65ac'],
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
function back(label,action){
 const brand='<button type="button" class="app-home-link" data-action="home" aria-label="CaHReMe · Volver al inicio">CaHReMe</button>';
 const previous=action==='home'?'':'<button type="button" class="ic-back text-link" data-action="'+action+'"><span aria-hidden="true">‹</span> '+label+'</button>';
 return '<nav class="inner-nav" aria-label="Navegación de la aplicación">'+brand+previous+'</nav>';
}
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
let proposalMedicationId=null;
function suspicionResult(){
 const r=interpretSuspicion(clinicalContext), step=r.next,safety=r.safety;
 const reasoning=r.reasoning.length?'<div class="sus-interpretation"><strong>Justificación clínica</strong>'+r.reasoning.map(g=>'<p><strong>'+g.label+':</strong> '+g.findings.join(' · ')+'</p>').join('')+'</div>':'';
 const secondary=step.kind==='safety'?'<button class="text-link" type="button" data-action="complete-safety">Revisar seguridad</button>':step.kind==='incomplete'?'<button class="text-link" type="button" data-action="complete-review">Revisar datos pendientes</button>':step.kind==='known'?'<button class="text-link" type="button" data-action="ic">Otros módulos de IC</button>':'';
 const next='<div class="sus-next"><strong>Siguiente actuación</strong><p>'+step.text+'</p><button class="sus-result-button'+(step.kind==='urgent'?' urgent-next':'')+'" type="button" data-action="'+step.action+'">'+step.label+' ›</button>'+secondary+'</div>';
 const detail=(r.pending.length?'<p><strong>Datos pendientes:</strong> '+r.pending.join(' · ')+'</p>':'')+(r.differential.length?'<p><strong>Diagnóstico diferencial:</strong> '+r.differential.join(' ')+'</p>':'');
 return '<section class="pearl-card sus-result '+safety.level+'" aria-live="polite"><h2 class="sus-clinical-title">'+r.title+'</h2><p>'+r.interpretation+'</p>'+reasoning+'<div class="sus-safety-axis '+safety.level+'"><strong>'+safety.title+'</strong><p>'+safety.text+'</p></div>'+next+'<details class="sus-evidence" data-panel="suspicion-evidence"><summary>Justificación ampliada y fuente</summary>'+detail+'<p>'+r.id+' · v'+r.source.version+' · '+r.source.sections+'</p><p>'+r.ruleType+'</p><a class="text-link" href="'+r.source.url+'" target="_blank" rel="noopener noreferrer">Consultar publicación original</a> · <a class="text-link" href="https://doi.org/10.1093/eurheartj/ehag500" target="_blank" rel="noopener noreferrer">Definición universal 2026</a></details></section>';
}
function suspicionBar(){
 const r=interpretSuspicion(clinicalContext),safety=r.safety;
 return '<div class="sus-bar '+safety.level+'"><div class="sus-bar-status" role="status"><small>Resultado de la evaluación</small><strong>'+r.title+'</strong>'+(safety.level!=='review'?'<p class="sus-bar-safety">'+safety.title+'</p>':'')+'</div><button type="button" class="sus-result-button" data-action="show-suspicion-result">Ver conclusión <span aria-hidden="true">↓</span></button></div>';
}
function groupFields(g){
 const count=g.fields.filter(([id])=>clinicalContext.findings[id]==='yes').length;
 const reviewed=isGroupReviewed(clinicalContext,g.id);
 const field=([id,label])=>'<label class="sus-check"><input type="checkbox" data-finding="'+id+'" '+(clinicalContext.findings[id]==='yes'?'checked':'')+'><span>'+label+'</span></label>';
 return '<details class="pearl-card sus-group" data-panel="suspicion-'+g.id+'" data-suspicion-group="'+g.id+'" '+(g.id==='alarms'?'open':'')+'><summary><strong>'+g.label+'</strong><span data-count="'+g.id+'">'+count+' positivos · '+(reviewed?'Revisado':'Pendiente')+'</span></summary><p class="sus-hint">'+g.hint+'</p>'+g.fields.map(field).join('')+(g.id==='alarms'?field(['vitalsReviewed','Constantes revisadas y estabilidad valorada']):'')+'</details>';
}
function suspicion(){return '<div class="page pearl-home ic-page suspicion-page">'+back('Diagnóstico','diagnosis')+'<h1>Sospecha clínica</h1><p class="ic-subtitle">Demostración educativa · Solo casos ficticios. No utilizar en asistencia clínica.</p><p class="sus-hint sus-check-help">Marca los hallazgos presentes. Confirma los ausentes una sola vez al final.</p><div class="sus-groups">'+GROUPS.map(groupFields).join('')+'</div><details class="pearl-card sus-group" data-panel="suspicion-differential"><summary><strong>Diagnóstico diferencial</strong></summary><p class="sus-hint">Valorar según presentación; pueden coexistir con IC.</p><dl class="sus-diff"><dt>Disnea</dt><dd>EPOC/asma, infección respiratoria, anemia, tromboembolismo pulmonar, obesidad o desacondicionamiento.</dd><dt>Edema</dt><dd>Insuficiencia venosa, enfermedad renal, hepatopatía o causas farmacológicas.</dd><dt>Inicio brusco o inestabilidad</dt><dd>Considera causas tiempo-dependientes como síndrome coronario agudo, TEP o arritmia grave.</dd></dl></details><div class="pearl-card sus-final-review"><label class="sus-check sus-review"><input type="checkbox" data-review-all '+(isEvaluationReviewed(clinicalContext)?'checked':'')+'><span>He revisado todos los apartados. Los hallazgos no marcados están ausentes.</span></label></div><section id="suspicion-conclusion" tabindex="-1" class="sus-conclusion"><h2 class="sus-conclusion-heading">Conclusión clínica</h2><div id="suspicion-result">'+suspicionResult()+'</div></section><div id="suspicion-bar">'+suspicionBar()+'</div><div class="diagnosis-links"><a class="text-link" href="'+SOURCE.url+'" target="_blank" rel="noopener noreferrer">ESC 2026 · Evidencia</a><button type="button" class="text-link" data-action="reset-context">Nueva evaluación</button></div><p class="diagnosis-status">Prototipo no validado: no confirma ni descarta IC. No introducir datos de pacientes reales. Datos de demostración en memoria de sesión.</p></div>';}
function refreshSuspicion(){
 const box=document.getElementById('suspicion-result');if(!box)return;replacePanelContent(box,suspicionResult());const bar=document.getElementById('suspicion-bar');if(bar){const focused=bar.contains(document.activeElement);bar.innerHTML=suspicionBar();if(focused)bar.querySelector('button').focus({preventScroll:true});}
 for(const g of GROUPS){
  const reviewed=isGroupReviewed(clinicalContext,g.id);
  const el=document.querySelector('[data-count="'+g.id+'"]');if(el)el.textContent=g.fields.filter(([id])=>clinicalContext.findings[id]==='yes').length+' positivos · '+(reviewed?'Revisado':'Pendiente');

 }
 const control=document.querySelector('[data-review-all]');if(control)control.checked=isEvaluationReviewed(clinicalContext);
}
app.addEventListener('input',e=>{
 const field=e.target;if(field.matches('input[data-med-field]')){
  clinicalContext=setMedicationField(clinicalContext,field.dataset.medId,field.dataset.medField,field.value);
  refreshMedication();
 }
});
app.addEventListener('change',e=>{
 const id=e.target.dataset.finding;
 if(e.target.hasAttribute('data-med-external')){clinicalContext=confirmExternalMedicationReview(clinicalContext,e.target.checked);refreshMedication();return;}
 if(e.target.hasAttribute('data-med-confirm')){clinicalContext=confirmMedicationReview(clinicalContext,e.target.checked);refreshMedication();return;}
 if(e.target.dataset.therapyInput){
  const before=clinicalContext;clinicalContext=setTreatmentValue(clinicalContext,e.target.dataset.therapyInput,e.target.value);
  const invalid=before===clinicalContext;e.target.setAttribute('aria-invalid',String(invalid));const err=e.target.closest('label').querySelector('.therapy-error');if(err)err.textContent=invalid?'Valor inválido':'';
  if(invalid){clinicalContext=confirmTreatmentLabs(clinicalContext,false);}refreshTherapySafety();if(invalid&&['egfr','potassium'].includes(e.target.dataset.therapyInput))document.querySelector('[data-therapy-confirm]').disabled=true;return;
 }
 if(e.target.hasAttribute('data-therapy-confirm')){clinicalContext=confirmTreatmentLabs(clinicalContext,e.target.checked);refreshTherapySafety();return;}
 if(e.target.dataset.nyha){
  clinicalContext=setNyha(clinicalContext,e.target.dataset.nyha);render();const selected=document.querySelector('[data-nyha="'+e.target.dataset.nyha+'"]');if(selected)selected.focus({preventScroll:true});return;
 }
 if(e.target.dataset.echoInput){
  const before=clinicalContext;clinicalContext=setEcho(clinicalContext,e.target.dataset.echoInput,e.target.value);
  const invalid=before===clinicalContext;e.target.setAttribute('aria-invalid',String(invalid));
  const error=e.target.closest('label').querySelector('.np-error');if(error)error.textContent=invalid?'Valor inválido':'';
  return;
 }
 if(e.target.dataset.npInput){
  const before=clinicalContext;clinicalContext=setPeptide(clinicalContext,e.target.dataset.npInput,e.target.value);
  const invalid=before===clinicalContext;e.target.setAttribute('aria-invalid',String(invalid));
  const error=e.target.closest('label').querySelector('.np-error');if(error)error.textContent=invalid?'Valor inválido':'';
  const box=document.getElementById('np-result');if(box)replacePanelContent(box,invalid?'<p class="np-alert">Corrige el valor antes de interpretarlo.</p>':peptideResult());
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

 const report=id=>'<label class="study-result-field"><span>'+REPORT_FIELDS[id].label+'</span><select data-study-result="'+id+'">'+REPORT_FIELDS[id].options.map(([value,title])=>'<option value="'+value+'" '+((clinicalContext.results?.[id]?.value||'unknown')===value?'selected':'')+'>'+title+'</option>').join('')+'</select></label>';
 const lp=labPlan(clinicalContext);
 const labField=([id,label,unit,purpose])=>'<label class="study-lab-field lab-compact-field"><span><strong>'+label+'</strong><small>'+unit+'</small></span><span class="study-value"><input type="text" inputmode="decimal" autocomplete="off" data-study-result="'+id+'" aria-label="'+label+' ('+unit+')" title="'+purpose+'" value="'+(clinicalContext.results?.[id]?.value??'')+'" placeholder="—"><small class="study-input-error" aria-live="polite"></small></span></label>';
 const block=(title,icon,hint,body)=>'<details class="pearl-card study-block" data-panel="study-'+title+'"><summary><span class="pearl-icon study-icon">'+svg(icon)+'</span><strong>'+title+'</strong></summary><div class="study-body"><p class="study-purpose">'+hint+'</p>'+body+'</div></details>';
 const priority=lp.priority.map(id=>LAB_FIELDS.find(x=>x[0]===id));
 const extras=LAB_FIELDS.filter(x=>!lp.priority.includes(x[0]));
 const existing=extras.filter(x=>clinicalContext.results?.[x[0]]!==undefined);
 const extraRows=extras.map(x=>'<div data-lab-extra="'+x[0]+'" '+(existing.includes(x)?'':'hidden')+'>'+labField(x)+'</div>').join('');
 const choices=extras.map(x=>'<button type="button" class="lab-add-choice" data-action="add-lab-result" data-lab-id="'+x[0]+'" '+(existing.includes(x)?'hidden':'')+'>+ '+x[1]+'</button>').join('');
 const request='<details class="lab-request" data-panel="lab-request"><summary><strong>Analítica recomendada</strong><small>'+lp.title+'</small></summary><p>'+lp.note+'</p><ul>'+lp.basal.map(x=>'<li>'+x+'</li>').join('')+'</ul>'+(lp.emphasis.length?'<div class="lab-emphasis"><strong>Según el perfil</strong>'+lp.emphasis.map(x=>'<p>'+x+'</p>').join('')+'</div>':'')+(lp.canCopy?'<button type="button" class="text-link lab-copy" data-action="copy-lab-request">Copiar solicitud</button><span class="lab-copy-status" role="status"></span>':'')+'</details>';
 const labBody=request+'<div class="lab-priority"><h3>Resultados disponibles <small>Opcional</small></h3>'+priority.map(labField).join('')+'</div><details class="lab-more" data-panel="lab-more"><summary>Añadir otros resultados'+(existing.length?' · '+existing.length+' registrados':'')+'</summary><div class="lab-extra-fields">'+extraRows+'</div><div class="lab-choices">'+choices+'</div></details><p class="sus-hint lab-note">No es necesario rellenar ningún valor para continuar. Los resultados se conservan durante esta sesión; fecha de muestra pendiente.</p>';
 const conditional='<div id="study-etiology">'+(plan.targeted.length?'<ul>'+plan.targeted.map(x=>'<li>'+x.text+'</li>').join('')+'</ul>':'<p>No hay hallazgos registrados que orienten un estudio adicional específico. Individualizar según historia y exploración.</p>')+'</div>';
 const icons={ecg:'M2 12h5l3-7 4 14 3-7h5',lab:diagnosticItems[2][3],rx:'M4 3h16v18H4zM12 5v14M10 7c-4 0-5 5-4 9 2 1 4 0 4-2V7m4 0c4 0 5 5 4 9-2 1-4 0-4-2V7',etiology:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z'};
 const specific=item=>diagnosticCard([item[0],item[1],'',item[3],item[4]],'study-specific-card');
 const context='<details class="pearl-card study-context" data-panel="study-context"><summary><span><strong>'+summary+'</strong><small>Ver contexto clínico</small></span></summary><div class="study-body"><p>'+message+'</p><p><strong>'+plan.basal+'</strong></p><p>ECG, analítica, radiografía, péptidos natriuréticos y ecocardiografía forman parte del estudio de referencia ante sospecha. Revisar resultados previos y adecuar al contexto. No es una orden automática.</p>'+(recorded.length?'<ul>'+recorded.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'<p>No hay hallazgos positivos registrados en esta sesión.</p>')+'<button class="text-link" type="button" data-action="diagnostic-section" data-section="sospecha">Revisar sospecha clínica</button><button type="button" class="text-link" data-action="reset-context">Nueva evaluación</button></div></details>';
 const urgent=step.kind==='urgent'?'<section class="pearl-card study-alert study-critical" role="alert"><strong>Alarma clínica</strong><p>'+evaluateSuspicion(clinicalContext).action+'</p></section>':'';
 const next=step.kind==='urgent'?'<button class="sus-result-button study-next urgent-next" data-action="ic-section" data-section="descompensada" type="button">IC descompensada (en desarrollo) ›</button>':'<button class="sus-result-button study-next" data-action="diagnostic-section" data-section="peptidos" type="button">Continuar estudio diagnóstico ›</button>';
 return '<div class="page pearl-home ic-page study-page study-compact">'+back('Diagnóstico','diagnosis')+'<h1>Pruebas diagnósticas</h1>'+context+urgent+safety+'<div class="study-blocks">'+block('Electrocardiograma',icons.ecg,'Ritmo, conducción y cardiopatía. Revisar ECG previo o registrar el disponible.',report('ecg'))+block('Analítica',icons.lab,'Función renal, comorbilidades y seguridad farmacológica.',labBody)+block('Radiografía de tórax',icons.rx,'Estudio inicial de referencia: congestión y diagnósticos alternativos.',report('rx'))+block('Estudio etiológico',icons.etiology,'Pruebas adicionales condicionadas por los antecedentes y hallazgos.',conditional)+'</div><div class="study-links">'+specific(diagnosticItems[3])+specific(diagnosticItems[4])+'</div>'+next+'<div class="study-foot"><a class="text-link" href="'+SOURCE.url+'" target="_blank" rel="noopener noreferrer">Evidencia científica</a><p class="diagnosis-status">Prototipo educativo · Asistentes específicos en desarrollo · No validado para uso asistencial</p></div></div>';
}
function peptideResult(){
 const r=interpretPeptide(clinicalContext);
 const units='pg/mL', threshold=r.low===null?'':('<p class="np-threshold">Umbral de exclusión: &lt;'+r.low+' '+units+(r.high!==null?' · Umbral orientativo: '+(r.context==='acute'?'&gt;':'≥')+r.high+' '+units:'')+'</p>');
 const next=r.urgent?'<button type="button" class="sus-result-button urgent-next" data-action="ic-section" data-section="descompensada">'+r.next.label+' ›</button>':'<button type="button" class="sus-result-button" data-action="diagnostic-section" data-section="ecocardiografia">'+r.next.label+' ›</button>';
 return '<section class="pearl-card np-result" aria-live="polite"><h2>'+r.title+'</h2><p>'+r.text+'</p>'+threshold+(r.notes.length?'<details data-panel="np-result-modifiers"><summary>Factores modificadores</summary><ul>'+r.notes.map(x=>'<li>'+x+'</li>').join('')+'</ul></details>':'')+'<div class="sus-next"><strong>Siguiente actuación</strong><p>'+r.next.text+'</p>'+next+'</div></section>';
}
function peptideView(){
 const p=clinicalContext.peptides||{},r=interpretPeptide(clinicalContext),kind=p.kind||'nt',context=p.context||'unknown';
 const segmented=(key,choices,selected)=>'<div class="np-segment" role="group">'+choices.map(([v,t])=>'<button type="button" data-action="np-select" data-np-key="'+key+'" data-np-value="'+v+'" aria-pressed="'+(v===selected)+'">'+t+'</button>').join('')+'</div>';
 const field=(id,label,unit)=>'<label class="np-field"><span>'+label+'</span><span class="np-entry"><input data-np-input="'+id+'" inputmode="'+(id==='age'?'numeric':'decimal')+'" type="text" autocomplete="off" placeholder="—" value="'+(p[id]??'')+'" aria-label="'+label+'"><small>'+unit+'</small></span><small class="np-error" role="status"></small></label>';
 const factors=Object.entries({obesity:'Obesidad',af:'Fibrilación auricular',renal:'Disfunción renal',arni:'Sacubitrilo/valsartán'}).map(([id,label])=>'<div class="np-factor"><span>'+label+'</span>'+segmented(id,[['yes','Sí'],['no','No'],['unknown','?']],r.factors[id])+'</div>').join('');
 const safety=r.urgent?'<p class="np-alert" role="alert">Contexto agudo o alarma registrada: priorizar valoración urgente.</p>':r.context==='outpatient'&&interpretSuspicion(clinicalContext).safety.level==='pending'?'<p class="np-alert">Estabilidad pendiente de valorar.</p>':'';
 return '<div class="page pearl-home ic-page np-page">'+back('Diagnóstico','diagnosis')+'<h1>Péptidos natriuréticos</h1><p class="ic-subtitle">Prototipo educativo · casos ficticios</p>'+safety+'<section class="pearl-card np-inputs">'+segmented('kind',[['nt','NT-proBNP'],['bnp','BNP']],kind)+segmented('context',[['outpatient','Ambulatorio'],['acute','Agudo']],context)+(context==='unknown'?'<p class="sus-hint">Selecciona el contexto asistencial.</p>':'')+'<div class="np-fields">'+field('age','Edad','años')+field(kind,kind==='nt'?'NT-proBNP':'BNP','pg/mL')+'</div><details class="np-modifiers" data-panel="np-input-modifiers"><summary>Factores modificadores</summary>'+factors+'<p class="sus-hint">? = sin valorar. Datos recuperados del contexto si están disponibles; confirmar según situación actual.</p></details><button class="sus-result-button" data-action="interpret-np" type="button">Interpretar resultado</button></section><div id="np-result" tabindex="-1">'+peptideResult()+'</div><div class="study-foot"><a class="text-link" href="'+SOURCE.url+'" target="_blank" rel="noopener noreferrer">Evidencia científica</a><p class="diagnosis-status">No establece diagnóstico ni sustituye valoración clínica. Pendiente de validación y licencia.</p><button class="text-link" type="button" data-action="reset-context">Nueva evaluación</button></div></div>';
}
function echoResult(){
 const r=interpretEcho(clinicalContext);
 const urgent=r.urgent;
 const detail='<details class="echo-justification" data-panel="echo-justification"><summary>Justificación clínica</summary><p><strong>Clínica:</strong> '+r.clinicalTitle+'</p><p><strong>Péptidos:</strong> '+r.npLabel+'</p>'+(r.positive.length?'<p><strong>Ecocardiografía:</strong> '+r.positive.map(x=>x[1]).join(' · ')+'</p>':'')+(r.prior!==null?'<p>'+r.trajectory+'</p>':'')+(r.notes.length?'<ul>'+r.notes.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'')+'<p>ESC 2026 · <a href="'+SOURCE.url+'" target="_blank" rel="noopener noreferrer">Evidencia científica</a></p></details>';
 const safety='<div class="echo-safety '+(urgent?'urgent':r.safety.level)+'" '+(urgent?'role="alert"':'')+'><strong>'+(urgent?'Priorizar valoración urgente':r.safety.title)+'</strong>'+(urgent?'<p>'+(['critical','urgent'].includes(r.safety.level)?r.safety.text:'Contexto agudo: no retrasar la atención por clasificación.')+'</p>':r.safety.level==='pending'?'<p>Revisar alarmas y constantes antes de decidir el ámbito asistencial.</p>':'')+'</div>';
 const next='<button class="sus-result-button'+(urgent?' urgent-next':'')+'" type="button" data-action="ic-section" data-section="'+r.next+'">'+(urgent?'IC descompensada (en desarrollo)':'Ir a clasificación')+' ›</button>';
 return '<div class="page pearl-home ic-page np-page echo-page echo-conclusion">'+back('Ecocardiografía','edit-echo')+'<h1>Conclusión</h1><section id="echo-result" class="pearl-card np-result echo-result" aria-live="polite">'+(r.ef!==null?'<div class="echo-metric"><small>FEVI</small><strong>'+String(r.ef).replace('.',',')+' %</strong></div>':'')+'<h2>'+r.title+'</h2><div class="echo-integration"><h3>'+r.integratedTitle+'</h3><p>'+r.integrated+'</p></div>'+detail+'</section>'+safety+next+'<p class="echo-disclaimer">Prototipo educativo · No validado para uso asistencial</p></div>';
}
function echoView(){
 const e=clinicalContext.echo||{},r=interpretEcho(clinicalContext);
 const numeric=([id,label,unit])=>'<label class="np-field echo-field"><span>'+label+'</span><span class="np-entry"><input type="text" inputmode="decimal" autocomplete="off" data-echo-input="'+id+'" aria-label="'+label+'" value="'+(e[id]??'')+'" placeholder="—"><small>'+unit+'</small></span><small class="np-error" role="status"></small></label>';
 const choice=(id,label,options=[['yes','Sí'],['no','No'],['unknown','?']])=>'<div class="np-factor echo-factor"><span>'+label+'</span><div class="np-segment" role="group" aria-label="'+label+'">'+options.map(([v,t])=>'<button type="button" data-action="echo-select" data-echo-key="'+id+'" data-echo-value="'+v+'" aria-pressed="'+((e[id]||'unknown')===v)+'">'+t+'</button>').join('')+'</div></div>';
 const hasEcho=Object.entries(e).some(([k,v])=>v==='yes'||v==='no'||Number.isFinite(v));
 const safety=r.urgent?'<div class="echo-safety urgent" role="alert"><strong>Priorizar valoración urgente</strong><p>'+(['critical','urgent'].includes(r.safety.level)?r.safety.text:'Contexto agudo: no retrasar la atención por clasificación.')+'</p><button class="text-link" type="button" data-action="ic-section" data-section="descompensada">IC descompensada (en desarrollo) ›</button></div>':'';
 return '<div class="page pearl-home ic-page np-page echo-page echo-form">'+back('Diagnóstico','diagnosis')+'<h1>Ecocardiografía</h1>'+safety+'<section class="pearl-card np-inputs"><div class="echo-primary">'+numeric(ECHO_NUMERIC[0])+'</div><details class="np-modifiers echo-optional" data-panel="echo-history"><summary>FEVI previa y evolución</summary>'+numeric(ECHO_NUMERIC[1])+choice('priorReduced','Antecedente de FEVI &lt;50%')+'</details><details class="np-modifiers echo-optional" data-panel="echo-findings"><summary>Hallazgos ecocardiográficos'+(r.positive.length?' · '+r.positive.length+' positivos':'')+'</summary>'+ECHO_FINDINGS.map(([id,label])=>choice(id,label)).join('')+'<p class="sus-hint">? = no evaluado o no descrito.</p></details><details class="np-modifiers echo-optional" data-panel="echo-parameters"><summary>Parámetros adicionales</summary>'+choice('sex','Sexo de referencia del informe',[['female','Mujer'],['male','Varón'],['unknown','?']])+choice('rhythm','Ritmo durante el estudio',[['sinus','Sinusal'],['af','FA'],['unknown','?']])+'<div class="echo-advanced">'+ECHO_NUMERIC.slice(2).map(numeric).join('')+'</div><p class="sus-hint">Registro opcional; criterios de apoyo de la tabla 10 ESC 2026. No establecen el diagnóstico.</p></details><p class="echo-optional-note">Introduce solo los datos disponibles.</p></section><button class="sus-result-button" data-action="interpret-echo" type="button">Integrar diagnóstico</button><button class="text-link echo-skip" type="button" data-action="interpret-echo">'+(hasEcho?'Ver conclusión':'Continuar sin resultados')+' ›</button><p class="echo-disclaimer">Prototipo educativo · No validado para uso asistencial</p></div>';

}
function guidedEntry(title){
 return '<div class="page pearl-home ic-page">'+back('Insuficiencia cardiaca','ic')+'<h1>'+title+'</h1><section class="pearl-card pending-card"><h2>Recorrido guiado</h2><p>Comienza por sospecha o continúa el estudio registrado en esta sesión. El recorrido completo sigue en desarrollo.</p><button type="button" class="sus-result-button" data-action="diagnostic-section" data-section="sospecha">Evaluar sospecha clínica</button><button type="button" class="text-link" data-action="diagnostic-section" data-section="pruebas">Abrir pruebas diagnósticas</button></section><button class="text-link" type="button" data-action="ic">Elegir otro módulo</button></div>';
}
const classificationItems=[
 ['estadio','Estadio evolutivo','A–D','M4 20V14h4v6M10 20V9h4v11M16 20V4h4v16','#176c86'],
 ['fenotipo','Fenotipo','FEVI','M2 12h5l3-7 4 14 3-7h5','#087047'],
 ['nyha','Clase funcional','NYHA','M13 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM10 22l2-7-3-3 2-4 4 4h4M5 22l4-7','#185cb5'],
 ['situacion','Situación clínica','Estabilidad','M12 3 2 20h20L12 3Zm0 6v5m0 3h.01','#007e87'],
 ['evolucion','Evolución de la FEVI','Comparar mediciones','M3 3v18h18M6 16l5-6 4 3 5-7','#4c65ac']
];
function classification(){
 const r=interpretEcho(clinicalContext),e=clinicalContext.echo||{},st=interpretStage(clinicalContext),ph=interpretPhenotype(clinicalContext),ny=interpretNyha(clinicalContext),sit=interpretSituation(clinicalContext);
 const ef=r.ef===null?'FEVI pendiente':String(r.ef).replace('.',',')+' %';
 const trajectory=r.prior!==null&&r.ef!==null?String(r.prior).replace('.',',')+' % → '+String(r.ef).replace('.',',')+' %':r.prior!==null?'FEVI previa '+String(r.prior).replace('.',',')+' %':'FEVI previa no registrada';
 const subtitles={estadio:st.stage!==null?st.title.split(' · ')[1]:'Pendiente de evaluar',fenotipo:r.ef===null?'Pendiente de FEVI':ph.short,nyha:ny.short,situacion:sit.short};
 const values={estadio:st.stage!==null?st.stage:'A–D',fenotipo:ef,nyha:ny.functionalClass?'NYHA '+ny.functionalClass:'NYHA',situacion:'Estabilidad'};
 const tile=([id,label,,path,color])=>'<button type="button" class="module-card class-tile" data-action="classification-section" data-section="'+id+'" style="--icon:'+color+'"><span class="class-icon">'+svg(path)+'</span><span class="class-label">'+label+'</span><strong>'+values[id]+'</strong><small>'+subtitles[id]+'</small></button>';
 const safety=sit.urgent?'<div class="echo-safety urgent" role="alert"><strong>Priorizar valoración urgente</strong><p>'+sit.safety.text+'</p></div>':'';
 const summaryButton='<button class="sus-result-button" type="button" data-action="classification-summary">Ver conclusión clínica ›</button>';
 const next=sit.urgent?'<button class="sus-result-button urgent-next" type="button" data-action="ic-section" data-section="descompensada">IC descompensada (en desarrollo) ›</button><button class="text-link" type="button" data-action="classification-summary">Ver conclusión clínica ›</button>':summaryButton;
 return '<div class="page pearl-home ic-page class-page">'+back('Insuficiencia cardiaca','ic')+'<h1>Clasificación</h1><p class="class-context">Datos disponibles de la evaluación previa</p>'+safety+'<div class="class-grid">'+classificationItems.slice(0,4).map(tile).join('')+'</div><button type="button" class="module-card class-evolution" data-action="classification-section" data-section="evolucion" style="--icon:#4c65ac"><span class="class-icon">'+svg(classificationItems[4][3])+'</span><span><strong>Evolución de la FEVI</strong><small>'+trajectory+(ph.improved?' · IC con FEVI mejorada':'')+'</small></span><span aria-hidden="true">›</span></button>'+next+'<p class="class-status">Prototipo educativo · No validado para uso asistencial</p></div>';
}
function stageSafety(r){
 return r.urgent?'<div class="echo-safety urgent" role="alert"><strong>Priorizar valoración urgente</strong><p>'+(['critical','urgent'].includes(r.safety.level)?r.safety.text:'Contexto agudo: no retrasar la atención por clasificación.')+'</p><button class="text-link" type="button" data-action="ic-section" data-section="descompensada">IC descompensada (en desarrollo) ›</button></div>':r.safety.level==='pending'?'<div class="echo-safety pending"><strong>Estabilidad pendiente de valorar</strong><p>Revisar alarmas y constantes antes de decidir el ámbito asistencial.</p></div>':'';
}
function stageView(){
 const r=interpretStage(clinicalContext),a=clinicalContext.stageAssessment||{},echo=interpretEcho(clinicalContext);
 const q=key=>'<div class="stage-question"><p>'+STAGE_QUESTIONS[key]+'</p><div class="np-segment" role="group" aria-label="'+STAGE_QUESTIONS[key]+'">'+[['yes','Sí'],['no','No'],['unknown','?']].map(([v,t])=>'<button type="button" data-action="stage-select" data-stage-key="'+key+'" data-stage-value="'+v+'" aria-pressed="'+((a[key]||'unknown')===v)+'">'+t+'</button>').join('')+'</div></div>';
 const summary='<details class="stage-context" data-panel="stage-context"><summary>Datos recuperados</summary><ul>'+r.reason.filter(x=>!Object.values(STAGE_QUESTIONS).some(t=>x.startsWith(t))).map(x=>'<li>'+x+'</li>').join('')+'</ul><button class="text-link" type="button" data-action="diagnosis">Revisar diagnóstico previo ›</button></details>';
 const extra=r.advancedQuestions.length?'<details class="stage-context" data-panel="stage-advanced"><summary>Señales de IC avanzada (opcional)</summary>'+r.advancedQuestions.map(q).join('')+'</details>':'';
 return '<div class="page pearl-home ic-page class-page stage-page">'+back('Clasificación','classification')+'<h1>Estadio evolutivo</h1>'+stageSafety(r)+'<section class="pearl-card stage-card">'+summary+(r.contradictions.length?'<div class="echo-safety pending"><strong>Revisar datos discordantes</strong><p>'+r.contradictions.join(' ')+'</p></div>':'')+(r.questions.length?r.questions.map(q).join(''):'<p>Datos previos disponibles. Puedes revisar la conclusión.</p>')+extra+'<p class="stage-hint">? = desconocido. Responde solo si dispones de información.</p></section><button class="sus-result-button" type="button" data-action="stage-result">Determinar estadio ›</button><p class="class-status">Prototipo educativo · No validado para uso asistencial</p></div>';
}
function stageResult(){
 const r=interpretStage(clinicalContext);
 return '<div class="page pearl-home ic-page class-page stage-page">'+back('Estadio evolutivo','stage-edit')+'<h1>Conclusión</h1><section class="pearl-card stage-card stage-result" aria-live="polite"><h2>'+r.title+'</h2><p>'+r.text+'</p>'+(r.contradictions.length?'<ul>'+r.contradictions.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'')+'<details class="stage-context" data-panel="clinical-justification"><summary>Justificación clínica</summary><ul>'+r.reason.map(x=>'<li>'+x+'</li>').join('')+'</ul><a href="https://doi.org/10.1093/eurheartj/ehag500" target="_blank" rel="noopener noreferrer">Definición universal 2026 · tabla 1</a><p><a href="'+SOURCE.url+'" target="_blank" rel="noopener noreferrer">ESC 2026 · sección 3.3</a></p></details></section>'+stageSafety(r)+'<button class="sus-result-button'+(r.urgent?' urgent-next':'')+'" type="button" '+(r.urgent?'data-action="ic-section" data-section="descompensada"':'data-action="classification"')+'>'+(r.urgent?'IC descompensada (en desarrollo)':'Volver a clasificación')+' ›</button><p class="class-status">Prototipo educativo · No validado para uso asistencial</p></div>';
}
function phenotypeView(){
 const r=interpretPhenotype(clinicalContext),e=clinicalContext.echo||{},a=clinicalContext.phenotypeAssessment||{};
 const numeric=(id,label)=>'<label class="np-field echo-field"><span>'+label+'</span><span class="np-entry"><input type="text" inputmode="decimal" autocomplete="off" data-echo-input="'+id+'" aria-label="'+label+'" value="'+(e[id]??'')+'" placeholder="—"><small>%</small></span><small class="np-error" role="status"></small></label>';
 const q=(key,label,value,kind='phenotype-select')=>'<div class="stage-question"><p>'+label+'</p><div class="np-segment" role="group" aria-label="'+label+'">'+[['yes','Sí'],['no','No'],['unknown','?']].map(([v,t])=>'<button type="button" data-action="'+kind+'" data-phenotype-key="'+key+'" data-phenotype-value="'+v+'" aria-pressed="'+((value||'unknown')===v)+'">'+t+'</button>').join('')+'</div></div>';
 const history='<details class="stage-context phenotype-history" data-panel="phenotype-history"><summary>FEVI previa y evolución'+(r.prior!==null?' · '+r.prior+' %':'')+'</summary>'+(r.prior===null?numeric('priorEf','FEVI previa'):'<p>FEVI previa registrada: <strong>'+r.prior+' %</strong></p>')+q('priorReduced','¿Antecedente de FEVI inferior al 50%?',e.priorReduced,'phenotype-history')+(r.priorReduced||a.priorClinical?q('priorClinical','¿La reducción previa correspondía a IC clínica?',a.priorClinical):'')+'</details>';
 const extra=r.clinicalHF&&r.current==='preserved'&&!r.priorReduced?q('diastolicEvidence','¿Evidencia objetiva compatible con IC-FEp tras revisar eco y péptidos?',a.diastolicEvidence):'';
 return '<div class="page pearl-home ic-page class-page stage-page phenotype-page">'+back('Clasificación','classification')+'<h1>Fenotipo</h1>'+stageSafety(r)+'<section class="pearl-card stage-card">'+(r.ef===null?numeric('ef','FEVI actual'):'<div class="echo-metric"><small>FEVI registrada</small><strong>'+r.ef+' %</strong></div><p class="stage-hint">'+(r.current==='reduced'?'FEVI reducida':'FEVI preservada')+'</p>')+'<div class="phenotype-context"><small>IC clínica</small><strong>'+(r.clinicalHF?'Registrada':'Pendiente de establecer')+'</strong></div>'+history+extra+'<div class="phenotype-links"><button class="text-link" type="button" data-action="edit-echo">Revisar ecocardiografía</button>'+(!r.clinicalHF?'<button class="text-link" type="button" data-action="stage-edit">Revisar estadio</button>':'')+'</div></section><button class="sus-result-button" type="button" data-action="phenotype-result">Determinar fenotipo ›</button><p class="class-status">Prototipo educativo · No validado para uso asistencial</p></div>';
}
function phenotypeResult(){
 const r=interpretPhenotype(clinicalContext);
 return '<div class="page pearl-home ic-page class-page stage-page phenotype-page">'+back('Fenotipo','phenotype-edit')+'<h1>Conclusión</h1><section class="pearl-card stage-card stage-result">'+(r.ef!==null?'<div class="echo-metric"><small>FEVI actual</small><strong>'+r.ef+' %</strong></div>':'')+'<h2>'+r.title+'</h2><p>'+r.text+'</p>'+(r.delta!==null||r.priorReduced?'<div class="phenotype-context"><small>Trayectoria</small><strong>'+r.trajectory+'</strong>'+(r.delta!==null?'<p>'+r.prior+' % → '+r.ef+' % · '+(r.delta>0?'+':'')+r.delta+' puntos</p>':'')+'</div>':'')+'<details class="stage-context" data-panel="clinical-justification"><summary>Justificación clínica</summary>'+(r.notes.length?'<ul>'+r.notes.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'')+'<a href="'+SOURCE.url+'" target="_blank" rel="noopener noreferrer">ESC 2026 · sección 5.2</a><p><a href="https://doi.org/10.1093/eurheartj/ehag500" target="_blank" rel="noopener noreferrer">Definición universal 2026</a></p></details></section>'+stageSafety(r)+'<button class="sus-result-button'+(r.urgent?' urgent-next':'')+'" type="button" '+(r.urgent?'data-action="ic-section" data-section="descompensada"':'data-action="classification"')+'>'+(r.urgent?'IC descompensada (en desarrollo)':'Volver a clasificación')+' ›</button><p class="class-status">Prototipo educativo · No validado para uso asistencial</p></div>';
}
function nyhaView(){
 const r=interpretNyha(clinicalContext);
 const options=NYHA_OPTIONS.map(([value,label,description])=>'<label class="nyha-option'+(r.selected===value?' nyha-selected':'')+'"><input type="radio" name="nyha-class" data-nyha="'+value+'" value="'+value+'" '+(r.selected===value?'checked':'')+'><span class="nyha-number">'+(value==='unknown'?'?':value)+'</span><span class="nyha-description"><strong>'+label+'</strong><small>'+description+'</small></span></label>').join('');
 const result=r.selected?'<div class="nyha-result" role="status"><strong>'+r.title+'</strong><span>'+r.short+'</span></div>':'';
 const warning=r.warning?'<div class="echo-safety pending"><p>'+r.warning+'</p><button class="text-link" type="button" data-action="ic-section" data-section="descompensada">Valorar IC descompensada ›</button></div>':'';
 const reference='<details class="stage-context nyha-reference" data-panel="nyha-reference"><summary>Evidencia científica</summary><p><a href="'+SOURCE.url+'" target="_blank" rel="noopener noreferrer">ESC 2026 · tabla 8</a></p><p><a href="https://www.heart.org/en/health-topics/heart-failure/what-is-heart-failure/classes-of-heart-failure/" target="_blank" rel="noopener noreferrer">AHA · Clase funcional NYHA</a></p></details>';
 const body=r.eligible?'<section class="pearl-card nyha-card"><fieldset class="nyha-fieldset"><legend>¿Con qué grado de actividad aparecen síntomas atribuibles a la IC?</legend>'+options+'</fieldset>'+result+'</section>':'<section class="pearl-card stage-card"><h2 class="nyha-ineligible">'+r.title+'</h2><p>'+r.text+'</p><button class="text-link" type="button" data-action="stage-edit">Revisar estadio evolutivo ›</button></section>';
 const next=r.urgent?'<button class="sus-result-button urgent-next" type="button" data-action="ic-section" data-section="descompensada">IC descompensada (en desarrollo) ›</button>':'<button class="sus-result-button" type="button" data-action="classification">Volver a clasificación ›</button>';
 return '<div class="page pearl-home ic-page class-page stage-page nyha-page">'+back('Clasificación','classification')+'<h1>Clase funcional</h1>'+stageSafety(r)+body+warning+next+reference+'<p class="class-status">Prototipo educativo · No validado para uso asistencial</p></div>';
}
function situationSafety(r){
 return r.urgent?'<div class="echo-safety urgent" role="alert"><strong>'+r.safety.title+'</strong><p>'+r.safety.text+'</p></div>':r.safety.level==='pending'?'<div class="echo-safety pending"><strong>'+r.safety.title+'</strong><p>'+r.safety.text+'</p></div>':'';
}
function situationView(){
 const r=interpretSituation(clinicalContext);
 const q=key=>'<div class="stage-question"><p>'+SITUATION_QUESTIONS[key]+'</p><div class="np-segment" role="group" aria-label="'+SITUATION_QUESTIONS[key]+'">'+[['yes','Sí'],['no','No'],['unknown','?']].map(([v,t])=>'<button type="button" data-action="situation-select" data-situation-key="'+key+'" data-situation-value="'+v+'" aria-pressed="'+(r.values[key]===v)+'">'+t+'</button>').join('')+'</div></div>';
 const ny=interpretNyha(clinicalContext);
 const recovered='<details class="stage-context situation-recovered" data-panel="situation-recovered"><summary>Datos recuperados'+(r.recovered.length?' · '+r.recovered.length+' variables':'')+'</summary>'+(ny.functionalClass?'<p>NYHA '+ny.functionalClass+'</p>':'')+(r.findings.length?'<p>Hallazgos compatibles: '+r.findings.join(' · ')+'</p>':'<p>Sin hallazgos positivos de congestión registrados; no equivale a ausencia.</p>')+(r.recovered.length?r.recovered.map(q).join(''):'')+'<button class="text-link" type="button" data-action="diagnostic-section" data-section="sospecha">Revisar evaluación previa ›</button></details>';
 const next=r.urgent?'<button class="sus-result-button urgent-next" type="button" data-action="ic-section" data-section="descompensada">IC descompensada (en desarrollo) ›</button><button class="text-link" type="button" data-action="situation-result">Ver conclusión ›</button>':'<button class="sus-result-button" type="button" data-action="situation-result">Determinar situación clínica ›</button>';
 return '<div class="page pearl-home ic-page class-page stage-page situation-page">'+back('Clasificación','classification')+'<h1>Situación clínica</h1>'+ (r.urgent?situationSafety(r):'')+'<section class="pearl-card stage-card">'+recovered+(!r.eligible?'<p class="stage-hint">IC clínica no establecida. Se puede valorar la seguridad independientemente del estadio.</p>':'')+r.questions.map(q).join('')+'<p class="stage-hint">? = desconocido. «No» en estabilidad indica inestabilidad comprobada, no falta de valoración.</p></section>'+next+'<p class="class-status">Prototipo educativo · No validado para uso asistencial</p></div>';
}
function situationResult(){
 const r=interpretSituation(clinicalContext);
 return '<div class="page pearl-home ic-page class-page stage-page situation-page">'+back('Situación clínica','situation-edit')+'<h1>Conclusión</h1><section class="pearl-card stage-card stage-result"><h2>'+r.title+'</h2><p>'+r.text+'</p>'+(r.contradictions.length?'<p class="np-alert">'+r.contradictions.join(' ')+'</p>':'')+'<details class="stage-context" data-panel="clinical-justification"><summary>Justificación clínica</summary><ul>'+r.reason.map(x=>'<li>'+x+'</li>').join('')+'</ul><p>Regla educativa local, no escala validada.</p><a href="'+SOURCE.url+'" target="_blank" rel="noopener noreferrer">ESC 2026 · IC descompensada</a></details></section>'+situationSafety(r)+'<button class="sus-result-button'+(r.urgent?' urgent-next':'')+'" type="button" '+(r.urgent?'data-action="ic-section" data-section="descompensada"':'data-action="classification"')+'>'+(r.urgent?'IC descompensada (en desarrollo)':'Volver a clasificación')+' ›</button><p class="class-status">Prototipo educativo · No validado para uso asistencial</p></div>';
}
function evolutionView(){
 const r=interpretPhenotype(clinicalContext),sit=interpretSituation(clinicalContext);
 const fmt=v=>v===null?'—':String(v).replace('.',',')+' %';
 const delta=r.delta===null?'No calculable':(r.delta>0?'+':'')+String(r.delta).replace('.',',')+' puntos porcentuales';
 const metrics='<div class="evolution-metrics"><div><small>FEVI previa</small><strong>'+fmt(r.prior)+'</strong></div><div><small>FEVI actual</small><strong>'+fmt(r.ef)+'</strong></div></div>';
 const y=v=>112-v;
 const grid=[0,25,50,75,100].map(v=>'<line x1="36" x2="286" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#dce8ed"/><text x="29" y="'+(y(v)+3)+'" text-anchor="end">'+v+'%</text>').join('');
 const chart=r.delta===null?'':'<svg class="evolution-chart" viewBox="0 0 300 135" role="img" aria-label="FEVI previa '+fmt(r.prior)+'; FEVI actual '+fmt(r.ef)+'"><g class="evolution-axis">'+grid+'<text x="78" y="130" text-anchor="middle">Previa</text><text x="242" y="130" text-anchor="middle">Actual</text></g><path d="M78 '+y(r.prior)+' L242 '+y(r.ef)+'" fill="none" stroke="#176c86" stroke-width="2.5" stroke-linecap="round"/><circle cx="78" cy="'+y(r.prior)+'" r="4" fill="#176c86"/><circle cx="242" cy="'+y(r.ef)+'" r="4" fill="#176c86"/></svg>';
 const title=r.conflict?'Datos discordantes':r.delta===null?'Evolución pendiente':r.trajectory;
 const explanation=r.conflict?'Revisar antecedentes y mediciones antes de interpretar el fenotipo o la trayectoria.':r.delta===null?'Se necesitan ambas mediciones para cuantificar el cambio.':r.improved?'La mejoría de FEVI no equivale a curación de la IC ni justifica retirar el tratamiento por sí sola.':r.trajectoryPattern?'El cambio cuantitativo es compatible con mejoría. Falta confirmar el contexto clínico de IC previa con FEVI reducida.':'La diferencia entre mediciones no demuestra por sí sola un cambio clínico significativo. Considerar la variabilidad ecocardiográfica y el contexto clínico.';
 const next=sit.urgent?'<button class="sus-result-button urgent-next" type="button" data-action="ic-section" data-section="descompensada">IC descompensada (en desarrollo) ›</button>':'<button class="sus-result-button" type="button" data-action="classification">Volver a clasificación ›</button>';
 return '<div class="page pearl-home ic-page class-page stage-page evolution-page">'+back('Clasificación','classification')+'<h1>Evolución de la FEVI</h1>'+situationSafety(sit)+'<section class="pearl-card stage-card evolution-card">'+metrics+chart+'<div class="evolution-delta"><small>Variación absoluta</small><strong>'+delta+'</strong></div><div class="evolution-interpretation"><h2>'+title+'</h2><p>'+explanation+'</p></div><div class="phenotype-links"><button class="text-link" type="button" data-action="edit-echo">Revisar ecocardiografía</button><button class="text-link" type="button" data-action="phenotype-edit">Revisar fenotipo</button></div><details class="stage-context" data-panel="clinical-justification"><summary>Justificación clínica</summary><p>Comparación de dos mediciones registradas; sin fechas ni tendencia temporal continua.</p>'+(r.notes.length?'<ul>'+r.notes.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'')+'<p>Interpretación compartida con Fenotipo.</p></details></section>'+next+'<p class="class-status">Prototipo educativo · No validado para uso asistencial</p></div>';
}
function classificationSummaryView(){
 const r=classificationSummary(clinicalContext);
 const fmt=v=>v===null?'FEVI no registrada':String(v).replace('.',',')+' %';
 const rows=r.rows.map(({section,label,value})=>'<button type="button" class="summary-row" data-action="classification-section" data-section="'+section+'"><span>'+label+'</span><strong>'+value+'</strong><span aria-hidden="true">›</span></button>').join('');
 const pending=r.pending.length?'<div class="summary-pending"><strong>Datos necesarios pendientes</strong><div>'+r.pending.map(x=>'<button class="text-link" type="button" data-action="classification-section" data-section="'+x.section+'">'+x.label+' ›</button>').join('')+'</div></div>':'';
 const optional=r.optional.length?'<details class="stage-context" data-panel="summary-optional"><summary>Información adicional · '+r.optional.length+'</summary><div class="summary-links">'+r.optional.map(x=>'<button class="text-link" type="button" data-action="classification-section" data-section="'+x.section+'">'+x.label+' ›</button>').join('')+'</div></details>':'';
 const warning=r.contradictions.length?'<div class="echo-safety pending"><strong>Revisar datos discordantes</strong><ul>'+r.contradictions.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>':'';
 const attr=r.next.kind==='review'?(r.next.section?'data-action="classification-section" data-section="'+r.next.section+'"':'data-action="classification"'):r.next.kind==='preclinical'?'data-action="ic"':'data-action="ic-section" data-section="'+r.next.section+'"';
 const next='<button class="sus-result-button'+(r.urgent?' urgent-next':'')+'" type="button" '+attr+'>'+r.next.label+' ›</button>';
 const note=r.nyhaWarning&&!r.urgent?'<details class="stage-context" data-panel="summary-nyha"><summary>Precaución · NYHA IV</summary><p>'+r.nyhaWarning+'</p></details>':'';
 return '<div class="page pearl-home ic-page class-page stage-page classification-summary-page">'+back('Clasificación','classification')+'<h1>Conclusión clínica</h1>'+situationSafety(r)+warning+'<section class="pearl-card stage-card summary-card"><div class="summary-hero"><h2>'+r.title+'</h2><strong>'+fmt(r.ef)+'</strong></div><div class="summary-rows">'+rows+'</div></section><section class="pearl-card stage-card summary-interpretation"><h2>Interpretación clínica</h2><p>'+r.narrative+'</p>'+pending+optional+note+'</section>'+next+'<p class="class-status">Prototipo educativo · No validado para uso asistencial</p></div>';
}
// Treatment landing: shared clinical context, independent reference access, no prescribing rules yet.
const treatmentPrimary=['asistente','Asistente terapéutico','Qué iniciar, mantener, titular o sustituir','M5 5h4m6 0h4v16H5V5m4-2h6v4H9zM8 13l3 3 5-6','#007e87'];
const treatmentItems=[
 ['fer','IC-FEr','',homeIcons.ic,'#185cb5'],
 ['fep','IC-FEp','','M12 21S2 15 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 7-10 13-10 13Z','#087047'],
 ['mejorada','FEVI mejorada','','M3 17l6-6 4 4 8-9m-6 0h6v6','#007e87'],
 ['diureticos','Diuréticos','','M12 2C9 7 5 10 5 15a7 7 0 0 0 14 0c0-5-4-8-7-13Z','#4c65ac'],
 ['ajustes','Titulación y ajustes','',sections.find(x=>x[0]==='optimizacion')[3],'#176c86'],
 ['seguridad','Seguridad farmacológica','',homeIcons['cv-risk'],'#087047']
];
function treatmentCard(item,extra=''){return card(item,extra).replace('data-action="ic-section"','data-action="treatment-section"');}
function treatmentHome(){
 const r=classificationSummary(clinicalContext);
 const fmt=v=>String(v).replace('.',',')+' %';
 const stage=r.stage===null?'Estadio pendiente':'Estadio '+r.stageLabel;
 const phenotype=r.contradictions.length?'Datos discordantes':r.improved?'IC con FEVI mejorada':r.clinicalHF?r.phenotypeLabel:r.preclinical?'Sin IC clínica establecida':r.ef!==null?'FEVI registrada; IC no establecida':'Perfil clínico pendiente';
 const nyha=r.nyha?'NYHA '+r.nyha:r.clinicalHF?'NYHA pendiente':'';
 const situation=r.situation==='compensated'?'Compensada':r.situation==='congested'?'Congestión':r.urgent?'Valoración urgente':r.clinicalHF?'Situación pendiente':'';
 const meta=[stage,nyha,situation].filter(Boolean).join(' · ');
 const profile='<section class="pearl-card treatment-profile"><div><small>Perfil clínico recuperado</small><h2>'+phenotype+(r.ef===null?'':' · '+fmt(r.ef))+'</h2><p>'+meta+'</p></div><button type="button" class="text-link" data-action="classification-summary">Revisar ›</button></section>';
 const safety=r.urgent?'<div class="echo-safety urgent" role="alert"><strong>'+r.safety.title+'</strong><p>'+r.safety.text+'</p><button class="text-link" type="button" data-action="ic-section" data-section="descompensada">IC descompensada (en desarrollo) ›</button></div>':r.contradictions.length?'<div class="echo-safety pending"><strong>Revisar datos discordantes</strong><p>Completar la clasificación antes de orientar un tratamiento individual.</p></div>':'';
 // Clinical profile is informative, not permission to prescribe. Direct reference always remains accessible.
 return '<div class="page home pearl-home ic-page treatment-page">'+back('Insuficiencia cardiaca','ic')+'<h1>Tratamiento</h1>'+safety+profile+'<div class="treatment-primary">'+treatmentCard(treatmentPrimary,'ic-hero')+'</div><h2 class="treatment-direct-title">Consulta directa</h2><div class="module-grid ic-grid treatment-grid">'+treatmentItems.map(x=>treatmentCard(x)).join('')+'</div><div class="treatment-foot"><button type="button" class="text-link" data-action="treatment-evidence">Evidencia científica</button><p class="class-status">En desarrollo · Sin recomendaciones terapéuticas activas</p></div></div>';
}
function therapyStepHeader(n,label){
 return '<div class="therapy-progress"><div><strong>Paso '+n+' de 3</strong><span>'+label+'</span></div><div class="therapy-track" role="progressbar" aria-label="Progreso del asistente" aria-valuemin="0" aria-valuemax="3" aria-valuenow="'+n+'"><span style="width:'+(n/3*100)+'%"></span></div></div>';
}
function therapyProfile(r){
 const title=r.contradictions.length?'Datos discordantes':r.improved?'IC con FEVI mejorada':r.clinicalHF?r.phenotypeLabel:r.preclinical?'Sin IC clínica establecida':'Perfil clínico pendiente';
 const meta=[r.stage!==null?'Estadio '+r.stageLabel:'Estadio pendiente',r.nyha?'NYHA '+r.nyha:'',r.situation==='compensated'?'Compensada':r.situation==='congested'?'Congestión':r.urgent?'Valoración urgente':r.clinicalHF?'Situación pendiente':''].filter(Boolean).join(' · ');
 return '<section class="pearl-card treatment-profile"><div><small>Perfil clínico recuperado</small><h2>'+title+(r.ef===null?'':' · '+String(r.ef).replace('.',',')+' %')+'</h2><p>'+meta+'</p></div><button class="text-link" type="button" data-action="classification-summary">Revisar ›</button></section>';
}
function therapySafetyStatus(d){
 const messages=[];
 if(d.pressureDiscordant)messages.push('<p class="np-alert">Revisar presión arterial: la sistólica es inferior a la diastólica.</p>');
 if(d.missing.length)messages.push('<p class="stage-hint">Datos no disponibles: '+d.missing.map(k=>({sbp:'PAS',dbp:'PAD',hr:'FC',egfr:'FG',potassium:'potasio'}[k])).join(', ')+'. Se podrán registrar después.</p>');
 if(!d.labsConfirmed&&d.labsAvailable)messages.push('<p class="stage-hint">Confirma la vigencia de los resultados antes de utilizarlos en una decisión farmacológica.</p>');
 return messages.join('');
}
function therapyStepOne(){
 const d=treatmentSafetyData(clinicalContext),r=d.profile;
 const field=(key,label,unit)=>'<label class="therapy-field"><span>'+label+'</span><span class="therapy-entry"><input type="text" inputmode="decimal" autocomplete="off" data-therapy-input="'+key+'" aria-label="'+label+'" value="'+(d.values[key]===null?'':String(d.values[key]).replace('.',','))+'" placeholder="—"><small>'+unit+'</small></span><small class="therapy-error" role="status"></small></label>';
 const urgent=r.urgent?'<div class="echo-safety urgent" role="alert"><strong>'+r.safety.title+'</strong><p>'+r.safety.text+'</p></div>':d.classificationNeedsReview?'<div class="echo-safety pending"><strong>Perfil clínico por revisar</strong><p>No se puede orientar una propuesta individual hasta completar la clasificación y la seguridad.</p></div>':r.next.kind==='advanced'?'<div class="echo-safety pending"><strong>Valoración especializada</strong><p>El perfil recuperado requiere revisar IC avanzada.</p></div>':'';
 const next=r.urgent?'<button class="sus-result-button urgent-next" type="button" data-action="ic-section" data-section="descompensada">IC descompensada (en desarrollo) ›</button>':'<button class="sus-result-button" type="button" data-action="therapy-next">Medicación actual ›</button>';
 const checked=d.labsConfirmed?'checked':'';
 return '<div class="page pearl-home ic-page class-page stage-page therapy-page">'+back('Tratamiento','treatment-home')+'<h1>Asistente terapéutico</h1>'+therapyStepHeader(1,'Perfil clínico y seguridad')+urgent+therapyProfile(r)+'<section class="pearl-card stage-card therapy-card"><h2>Constantes</h2><div class="therapy-bp"><span>Presión arterial</span><div>'+field('sbp','Sistólica','mmHg')+field('dbp','Diastólica','mmHg')+'</div></div>'+field('hr','Frecuencia cardiaca','lpm')+'<h2>Función renal y potasio</h2><div class="therapy-labs">'+field('egfr','FG estimado','mL/min/1,73 m²')+field('potassium','Potasio','mmol/L')+'</div><p class="stage-hint">Datos compartidos con Diagnóstico. Fecha de muestra no registrada; comprueba que son vigentes.</p><label class="sus-check therapy-confirm"><input type="checkbox" data-therapy-confirm '+checked+(d.labsAvailable?'':' disabled')+'><span>FG y potasio revisados y vigentes para esta evaluación.</span></label><div id="therapy-data-status">'+therapySafetyStatus(d)+'</div></section>'+next+'<p class="class-status">Registro educativo · Sin recomendaciones farmacológicas activas</p></div>';
}
function medEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function medLabel(m){
 if(m.drug==='unknown')return 'Sin revisar';
 if(m.drug==='none')return 'No toma'+(m.reason!=='unknown'?' · Motivo registrado':'');
 const name=m.drug==='other'?m.name||'Otro medicamento':m.drug;
 const dose=m.dose?(m.drug==='Sacubitrilo/valsartán'?m.dose+'/'+(m.dose2||'—')+' mg':m.dose+(m.drug==='other'?'':' mg')):'';
 const freq=m.frequency==='other'?m.customFrequency:m.frequency==='48'?'días alternos':m.frequency?m.frequency+' h':'';
 return name+(dose?' '+dose:'')+(freq?' / '+freq:'');
}
function medChoice(id,key,label,value,options,style='chips'){
 return '<div class="med-choice '+style+'" role="group" aria-label="'+medEscape(label)+'">'+options.map(([v,t])=>'<button type="button" class="med-chip" data-action="med-choice" data-med-id="'+id+'" data-med-field="'+key+'" data-med-value="'+medEscape(v)+'" aria-pressed="'+(value===v)+'">'+medEscape(t)+'</button>').join('')+'</div>';
}
function medicationRow(m,open=false,openContext=false){
 const id=m.id;
 const input=(key,label,value,mode='text',limit=80)=>'<label class="med-field"><span>'+label+'</span><input type="text" inputmode="'+mode+'" autocomplete="off" maxlength="'+limit+'" data-med-id="'+id+'" data-med-field="'+key+'" aria-label="'+medEscape(label)+'" value="'+medEscape(value)+'" placeholder="—"></label>';
 const active=!['unknown','none'].includes(m.drug),other=m.drug==='other',arni=m.drug==='Sacubitrilo/valsartán';
 const preset=MEDICATION_QUICK_DOSES[m.drug]||[];
 const selectedDose=arni?m.dose+'/'+m.dose2:m.dose;
 const normalized=selectedDose.replaceAll('.',',');
 const custom=other||!preset.includes(normalized)&&!!m.dose;
 const customInputs=arni?'<div class="med-dose-grid">'+input('dose','Sacubitrilo (mg)',m.dose,'decimal')+input('dose2','Valsartán (mg)',m.dose2,'decimal')+'</div>':input('dose',other?'Dosis y unidad por toma':'Otra dosis por toma (mg)',m.dose,other?'text':'decimal');
 const doseOptions=preset.length?'<p class="med-label">Dosis por toma (mg)'+(m.drug==='Metoprolol succinato'?' · mg de succinato (no equivalentes de tartrato)':'')+'</p>'+medChoice(id,'quick-dose','Dosis por toma',normalized,preset.map(v=>[v,v]))+'<details class="stage-context med-context" data-panel="med-custom-'+id+'" '+(custom?'open':'')+'><summary>Otra dosis</summary>'+customInputs+'</details>':customInputs;
 const dose=active?(other?input('name','Principio activo',m.name):'')+doseOptions+'<p class="med-label">Frecuencia</p>'+medChoice(id,'frequency','Frecuencia',m.frequency,medicationFrequencyOptions(m).map(([v,t])=>[v,v==='other'?'Otra pauta':t.replace('Cada ','')]))+(m.frequency==='other'?input('customFrequency','Pauta exacta',m.customFrequency):''):'';
 const detail=m.drug==='none'?'<details class="stage-context med-context" data-panel="med-context-'+id+'"><summary>Motivo de ausencia (opcional)'+(m.reason!=='unknown'?' · Registrado':'')+'</summary>'+medChoice(id,'reason','Motivo',m.reason,MEDICATION_ABSENCE_REASONS)+(m.reason!=='unknown'?input('note','Detalle (opcional)',m.note,'text',240):'')+'</details>':active?'<details class="stage-context med-context" data-panel="med-context-'+id+'" '+(openContext?'open':'')+'><summary>Tolerancia y contexto de ajuste (opcional)'+(m.tolerance!=='unknown'?' · Registrada':'')+'</summary>'+medChoice(id,'tolerance','Tolerancia',m.tolerance,MEDICATION_TOLERANCE)+(m.tolerance==='problem'?medChoice(id,'problem','Problema de tolerancia',m.problem||'unknown',medicationProblemOptions(m))+(m.problem==='other'||!m.problem||m.problem==='unknown'?input('note','Problema referido',m.note,'text',240):''):'')+(other?'<p class="med-label">Clasificación profesional del medicamento adicional</p>'+medChoice(id,'otherClass','Clasificación adicional',m.otherClass||'unknown',[['unknown','Sin comprobar'],['outside','Fuera de familias basales']]):input('product','Presentación exacta (nombre comercial)',m.product||'')+'<p class="med-label">Indicación real</p>'+medChoice(id,'indication','Indicación real',m.indication||'unknown',MEDICATION_INDICATIONS)+input('doseDays','Días con la pauta actual',m.doseDays||'','numeric')+(m.drug==='Finerenona'?input('initialEgfr','FG al inicio de finerenona',m.initialEgfr||'','decimal'):'')+(['Finerenona','Sacubitrilo/valsartán','Candesartán','Valsartán','Enalapril','Ramipril'].includes(m.drug)?input('priorEgfr','FG previo al ajuste',m.priorEgfr||'','decimal'):''))+'</details>':'';

 const name=m.drug==='other'?m.name||'Otro medicamento':m.drug;
 return '<details class="med-row med-accordion" data-panel="med-row-'+id+'" data-med-row="'+id+'" '+(open?'open':'')+'><summary><span><small class="med-family-label">'+medEscape(medicationFamilyLabel(m))+'</small><strong>'+medEscape(name)+'</strong><small class="med-row-value">'+medEscape(medLabel(m).slice(name.length).trim()||'Pauta pendiente')+'</small></span></summary><div class="med-row-body">'+dose+detail+'<div class="med-row-actions"><button type="button" class="text-link med-delete" data-action="med-remove" data-med-id="'+id+'">Quitar</button><button type="button" class="text-link med-done" data-action="med-done" data-med-id="'+id+'">Listo ›</button></div><p class="med-row-error" role="status"></p></div></details>';
}
function advanceMedication(id){
 const m=medicationSummary(clinicalContext);
 if(!medicationEntryComplete(m,id))return false;
 const current=document.querySelector('[data-med-row="'+id+'"]');if(current)current.open=false;
 document.querySelector('[data-panel="med-catalog"]>summary')?.focus({preventScroll:true});
 return true;
}
function medicationCatalogView(m){
 const families=MEDICATION_FAMILIES.map(([id,label,drugs])=>'<section class="med-catalog-family"><h3>'+label+'</h3><div class="med-catalog-drugs">'+drugs.map(drug=>'<button type="button" class="med-catalog-drug" data-action="med-add-named" data-med-drug="'+medEscape(drug)+'"'+(m.additional.length>=30?' disabled':'')+'>'+medEscape(drug)+'<span aria-hidden="true">+</span></button>').join('')+'</div></section>').join('');
 return '<details class="med-catalog" data-panel="med-catalog" '+(m.active.length?'':'open')+'><summary>+ Añadir medicamento</summary><div class="med-catalog-content">'+families+'<button type="button" class="text-link med-add" data-action="med-add-named" data-med-drug="other"'+(m.additional.length>=30?' disabled':'')+'>+ Otro medicamento</button></div></details>';
}
function medicationSafetyView(alerts=medicationSafety(clinicalContext),compact=false){
 const renderAlert=a=>'<div class="med-safety-alert '+a.level+'" role="'+(a.level==='red'?'alert':'status')+'"><strong>'+medEscape(a.title)+'</strong><p>'+medEscape(a.text)+'</p><a class="text-link" href="'+a.source+'" target="_blank" rel="noopener noreferrer">Consultar fuente ›</a></div>';
 // Keep actionable red/amber alerts visible; informational monitoring stays in a
 // collapsed panel, without suppressing any underlying rule or source.
 const visible=alerts.filter(a=>a.level!=='blue'),monitor=alerts.filter(a=>a.level==='blue');
 return (compact?'':'<p class="stage-hint">Interacciones: comprobación parcial.</p>')+visible.map(renderAlert).join('')+(monitor.length?'<details class="stage-context med-context" data-panel="med-monitoring"><summary>Controles recomendados · '+monitor.length+'</summary>'+monitor.map(renderAlert).join('')+'</details>':'')+(compact?'':'<details class="stage-context med-context" data-panel="med-safety-scope"><summary>Alcance de la comprobación</summary><p class="stage-hint">No detectar una alerta no descarta interacciones ni contraindicación. Prototipo educativo, no validado para decisiones asistenciales.</p></details>');
}
function medicationStatus(m){
 const pending=[...(!m.reviewed?['Lista pendiente de confirmar']:m.unknown.length?['Familias pendientes de identificar en la medicación registrada']:[]),...m.missing.map(x=>x.label)];
 return (m.duplicates.length?'<div class="np-alert" role="alert"><strong>Revisar posibles duplicidades</strong><ul>'+m.duplicates.map(x=>'<li>'+medEscape(x)+'</li>').join('')+'</ul></div>':'')+(pending.length?'<details class="stage-context med-pending" data-panel="med-pending"><summary>Datos pendientes · '+pending.length+'</summary><ul>'+pending.map(x=>'<li>'+medEscape(x)+'</li>').join('')+'</ul><p>Un dato desconocido no equivale a ausencia de tratamiento.</p></details>':'<p class="stage-hint">Pautas registradas. Detección limitada a reglas verificadas; no equivale a ausencia de interacciones.</p>');
}
function externalMedicationStatus(m){
 if(!m.otherRows.length)return '';
 return '<div class="stage-hint"><p>Medicamentos adicionales: clasifica cada uno desde su apartado de contexto. Si pertenece a una familia basal reconocida, requiere revisión individual.</p><label class="sus-check therapy-confirm"><input type="checkbox" data-med-external '+(m.externalReviewValid?'checked':'')+(m.externalReady?'':' disabled')+'><span>He verificado los principios activos y sus interacciones con la lista actual en una fuente externa, teniendo en cuenta estos datos clínicos. No equivale a una comprobación automática.</span></label></div>';
}
function absenceReasonView(m){
 return '<details class="stage-context med-context" data-panel="med-absence"><summary>Motivos de ausencia o retirada (opcional)</summary><p class="stage-hint">Registra una contraindicación o intolerancia previa para evitar una propuesta de reinicio de esa familia.</p>'+m.groups.filter(g=>m.familyStatus.find(f=>f.id===g.id)?.status!=='present').map(g=>'<p class="med-label">'+medEscape(g.label)+'</p>'+medChoice(g.id,'absence-reason','Motivo de ausencia',g.reason,MEDICATION_ABSENCE_REASONS)).join('')+'</details>';
}
function refreshMedication(){
 const m=medicationSummary(clinicalContext),c=document.querySelector('[data-med-confirm]'),status=document.getElementById('med-status');
 if(c)c.checked=m.reviewed;
 if(status)replacePanelContent(status,medicationStatus(m));
 const safety=document.getElementById('med-safety');if(safety)replacePanelContent(safety,medicationSafetyView());
 const external=document.getElementById('med-external');if(external)replacePanelContent(external,externalMedicationStatus(m));
 for(const row of [...m.groups,...m.additional]){const value=document.querySelector('[data-med-row="'+row.id+'"] .med-row-value');if(value){const name=row.drug==='other'?row.name||'Otro medicamento':row.drug;value.textContent=medLabel(row).slice(name.length).trim()||'Pauta pendiente';const parent=value.closest('summary');parent.querySelector('strong').textContent=name;parent.querySelector('.med-family-label').textContent=medicationFamilyLabel(row);}}
}
function therapyStepTwo(){
 const r=classificationSummary(clinicalContext),m=medicationSummary(clinicalContext);
 const requested=m.active.find(x=>x.id===proposalMedicationId)?.id;
 const firstPending=requested||m.active.find(x=>!medicationEntryComplete(m,x.id))?.id;
 const next=r.urgent?'<button class="sus-result-button urgent-next" type="button" data-action="ic-section" data-section="descompensada">IC descompensada (en desarrollo) ›</button>':'<button class="sus-result-button" type="button" data-action="therapy-proposal">Ver propuesta de tratamiento ›</button>';
 return '<div class="page pearl-home ic-page class-page stage-page therapy-page medication-page">'+back('Perfil clínico y seguridad','therapy-first')+'<h1>Medicación actual</h1>'+therapyStepHeader(2,'Registro de tratamiento')+(r.urgent?situationSafety(r):'')+'<section class="pearl-card stage-card med-card"><h2 class="med-list-title">Tratamiento registrado</h2>'+(m.active.length?m.active.map(x=>medicationRow(x,x.id===firstPending,x.id===requested)).join(''):'<p class="med-empty">Ningún medicamento registrado.</p>')+ '<div id="med-safety">'+medicationSafetyView()+'</div>' +medicationCatalogView(m)+absenceReasonView(m)+'<div id="med-external">'+externalMedicationStatus(m)+'</div><label class="sus-check therapy-confirm"><input type="checkbox" data-med-confirm '+(m.reviewed?'checked':'')+'><span>Confirmo que he registrado toda la medicación relevante, incluso si no toma ninguna.</span></label><div id="med-status">'+medicationStatus(m)+'</div></section>'+next+'<p class="class-status">Registro educativo · Sin recomendaciones farmacológicas activas</p></div>';
}
// Step 3 presents evaluated actions; it does not calculate clinical eligibility.
function candidateRiskView(a,scope=a.candidate){
 if(!a.screening?.items?.length)return '';
 return '<div class="proposal-risk"><p class="stage-hint">'+medEscape(a.candidate)+' · '+a.screening.pending.length+' comprobaciones pendientes. Cribado parcial.</p>'+a.screening.items.map(item=>'<div class="np-factor"><span>'+medEscape(item.label)+'</span><div class="np-segment" role="group" aria-label="'+medEscape(item.label)+'">'+[['yes','Sí'],['no','No'],['unknown','?']].map(([value,label])=>'<button type="button" data-action="therapy-risk" data-risk-scope="'+medEscape(scope)+'" data-risk-key="'+item.key+'" data-risk-value="'+value+'" aria-label="'+(value==='unknown'?'Sin valorar':label)+'" aria-pressed="'+(item.value===value)+'">'+label+'</button>').join('')+'</div></div>').join('')+'</div>';
}
const proposalLabels={start:'Valorar inicio',titrate:'Valorar titulación',switch:'Valorar sustitución',reduce:'Valorar reducción',stop:'Valorar suspensión',restart:'Valorar reintroducción',maintain:'Continuidad del tratamiento',review:'Revisar antes de decidir',follow:'Seguimiento'};
function proposalStatus(a){
 if(a.screening?.positives.length)return 'Revisar riesgo registrado';
 if(a.kind==='review'&&a.candidate)return 'Revisar antes de decidir';
 return a.presentation?.label||proposalLabels[a.kind]||'Revisar';
}
function proposalDetails(a,index,{shared=false,summary='Requisitos y fuente',includeDetail=false}={}){
 const panel=a.candidate?encodeURIComponent(a.candidate):'action-'+index;
 return '<details class="stage-context proposal-details" data-panel="proposal-'+panel+'"><summary>'+medEscape(summary)+'</summary>'+(includeDetail?'<p>'+medEscape(a.detail)+'</p>':'')+(shared?'':candidateRiskView(a))+'<p>'+medEscape(a.check)+'</p><a class="text-link" href="'+medEscape(a.source)+'" target="_blank" rel="noopener noreferrer">Consultar fuente ›</a></details>';
}
function proposalAction(a,index,shared=false){
 const name=a.candidate||a.title;
 // Compact dose label is only shown for a candidate that still has kind=start.
 // When the motor downgrades to review, its full reason remains visible.
 const compact=shared&&a.kind==='start'&&a.presentation?.referenceDose;
 const status=a.kind==='follow'||compact?'':('<p class="proposal-action-status '+(a.kind==='start'?'start':'review')+'">'+medEscape(proposalStatus(a))+'</p>');
 const summary=a.screening&&!shared?(a.screening.pending.length?'Comprobaciones pendientes · '+a.screening.pending.length:'Requisitos y fuente'):'Requisitos y fuente';
 const follow=a.presentation?.monitoring?.length?'<div class="proposal-follow"><p>Controles a individualizar</p><ul>'+a.presentation.monitoring.map(label=>'<li>'+medEscape(label)+'</li>').join('')+'</ul></div>':'';
 const heading=compact?'<div class="proposal-dose-row"><h3>'+medEscape(name)+'</h3><strong>'+medEscape(a.presentation.referenceDose)+'</strong></div>':'<h3>'+medEscape(name)+'</h3>';
 return '<article class="proposal-action" data-proposal-kind="'+medEscape(a.kind)+'">'+heading+status+(compact?'':'<p class="proposal-action-detail">'+medEscape(a.detail)+'</p>')+follow+proposalDetails(a,index,{shared,summary,includeDetail:!!compact})+'</article>';
}
function proposalAlternativeGroup(rows){
 // Same context keys are asked once; each evaluated alternative retains its source.
 const items=[...new Map(rows.flatMap(({a})=>a.screening?.items||[]).map(item=>[item.key,item])).values()];
 const pending=items.filter(item=>item.value==='unknown');
 const shared=items.length>0;
 const options=rows.map(({a,index},i)=>(i?'<div class="proposal-or">o bien</div>':'')+proposalAction(a,index,shared)).join('');
 return '<div class="proposal-alternatives" data-proposal-alternative="sglt2"><div class="proposal-alternative-head"><h3>iSGLT2</h3><span>'+(rows.some(({a})=>a.kind==='start')?'Valorar inicio':'Revisar antes de decidir')+'</span></div><p class="proposal-alternative-note">'+(rows.length>1?'Opciones alternativas, no asociar dos iSGLT2. Dosis habituales de referencia.':'Opción evaluada por el motor; no asociar dos iSGLT2.')+'</p>'+options+(shared?'<details class="stage-context proposal-details proposal-shared" data-panel="proposal-sglt2-checks"><summary>'+(pending.length?'Comprobaciones comunes pendientes · '+pending.length:'Revisar comprobaciones comunes')+'</summary>'+candidateRiskView({candidate:'iSGLT2',screening:{items,pending}},'sglt2')+'</details>':'')+'</div>';
}
function proposalMedicationCard(row,rows){
 const name=row.drug==='other'?row.name||'Otro medicamento':row.drug;
 const dose=medLabel(row).slice(name.length).trim();
 return '<div class="proposal-medication" data-proposal-medication="'+medEscape(row.id)+'"><div class="proposal-medication-head"><div><h3>'+medEscape(name)+'</h3><p class="proposal-current">Actual: '+medEscape(dose||'Pauta pendiente')+'</p></div><span class="proposal-family">'+medEscape(medicationFamilyLabel(row))+'</span></div>'+rows.map(({a,index})=>{
  const show=a.presentation?.showDetail||!['review','maintain'].includes(a.kind);
  return '<article class="proposal-action proposal-medication-action" data-proposal-kind="'+medEscape(a.kind)+'">'+(show?'<p class="proposal-action-status review">'+medEscape(proposalStatus(a))+'</p><p class="proposal-action-detail">'+medEscape(a.detail)+'</p>':'')+proposalDetails(a,index,{summary:show?'Requisitos y fuente':proposalStatus(a),includeDetail:!show})+'</article>';
 }).join('')+'<button class="text-link proposal-edit" type="button" data-action="proposal-edit-medication" data-med-id="'+medEscape(row.id)+'">Revisar datos de esta pauta ›</button></div>';
}
function proposalSections(p,m){
 const indexed=p.actions.map((a,index)=>({a,index}));
 const sectionOf=({a})=>a.presentation?.section||({start:'complete',titrate:'optimize',switch:'optimize',maintain:'maintain',follow:'follow'})[a.kind]||'review';
 const sections=[['review','Revisiones previas'],['complete','Tratamiento por completar'],['optimize','Optimización del tratamiento actual'],['maintain','Continuidad del tratamiento'],['follow','Seguimiento']];
 const meds=new Map(m.active.map(row=>[row.id,row]));
 return sections.map(([section,label])=>{
  const rows=indexed.filter(x=>sectionOf(x)===section);
  if(!rows.length)return '';
  const rendered=new Set(),body=[];
  for(const entry of rows){
   const {a,index}=entry,view=a.presentation||{};
   if(view.alternativeGroup==='sglt2'){
    if(rendered.has('alt-sglt2'))continue;
    rendered.add('alt-sglt2');body.push(proposalAlternativeGroup(rows.filter(x=>x.a.presentation?.alternativeGroup==='sglt2')));continue;
   }
   if(view.medicationId&&meds.has(view.medicationId)){
    const key='med-'+view.medicationId;if(rendered.has(key))continue;rendered.add(key);
    body.push(proposalMedicationCard(meds.get(view.medicationId),rows.filter(x=>x.a.presentation?.medicationId===view.medicationId)));continue;
   }
   body.push(proposalAction(a,index));
  }
  return '<section class="pearl-card proposal-group '+section+'" data-proposal-section="'+section+'"><h2>'+label+'</h2>'+body.join('')+'</section>';
 }).join('');
}
function therapyStepThree(){
 const p=treatmentProposal(clinicalContext),r=p.profile,m=medicationSummary(clinicalContext);
 const v=p.values,fmt=n=>n===null?'—':String(n).replace('.',',');
 const values='<div class="proposal-vitals">'+[['PA',fmt(v.sbp)+'/'+fmt(v.dbp),'mmHg'],['FC',fmt(v.hr),'lpm'],['FG',fmt(v.egfr),'mL/min/1,73 m²'],['K⁺',fmt(v.potassium),'mmol/L']].map(([label,value,unit])=>'<div class="proposal-vital"><small>'+label+'</small><strong>'+value+'</strong><span>'+unit+'</span></div>').join('')+'</div>';
 const blocked=p.status!=='conditional'?'<section class="pearl-card proposal-block '+(p.status==='urgent'?'urgent':'')+'"><h2>'+(p.status==='urgent'?'Prioridad urgente':'Revisión necesaria antes de proponer cambios')+'</h2><ul>'+[...p.urgent,...p.blockers].map(x=>'<li>'+medEscape(x)+'</li>').join('')+'</ul><div class="proposal-links"><button class="text-link" type="button" data-action="therapy-first">Revisar perfil y seguridad ›</button><button class="text-link" type="button" data-action="therapy-medication">Revisar medicación ›</button></div></section>':'<p class="proposal-note">Propuesta condicionada · comprobar los requisitos antes de decidir.</p>';
 const safety=p.alerts.length?'<div class="proposal-safety">'+medicationSafetyView(p.alerts,true)+'</div>':'';
 const correction=clinicalContext.treatmentAssessment?.risks?.ketoacidosis==='yes'?'<button type="button" class="text-link" data-action="therapy-risk" data-risk-key="ketoacidosis" data-risk-value="unknown">Corregir registro de sospecha de cetoacidosis ›</button>':'';
 const urgent=p.status==='urgent'?card(special[1],'ic-urgent'):'';
 const profile='<div class="proposal-profile">'+therapyProfile(r)+values+'</div>';
 return '<div class="page pearl-home ic-page class-page stage-page therapy-page proposal-page">'+back('Medicación actual','therapy-medication')+'<h1>Propuesta de tratamiento</h1>'+therapyStepHeader(3,'Propuesta de tratamiento')+(p.status==='urgent'?blocked+correction+urgent+profile:profile+blocked)+safety+proposalSections(p,m)+'<p class="proposal-note">Prototipo educativo · comprobación parcial de interacciones y contraindicaciones.</p><details class="pearl-card proposal-scope" data-panel="proposal-scope"><summary>Alcance y evidencia</summary><p>Casos ficticios adultos. Motor no validado clínicamente. La ausencia de una alerta o de un fármaco en la propuesta no confirma compatibilidad, indicación ni mantenimiento. No utilizar para decisiones reales. Consulta original: <a href="'+medEscape(p.source)+'" target="_blank" rel="noopener noreferrer">ESC 2026</a>. Las dosis son referencias de fichas técnicas y deben interpretarse según cada indicación.</p></details></div>';
}
function refreshTherapySafety(){
 const d=treatmentSafetyData(clinicalContext),c=document.querySelector('[data-therapy-confirm]'),status=document.getElementById('therapy-data-status');
 if(c){c.disabled=!d.labsAvailable;c.checked=d.labsConfirmed;}
 if(status)status.innerHTML=therapySafetyStatus(d);
}
function treatmentDetail(id){
 if(id==='asistente')return therapyStepOne();
 if(id==='asistente/medicacion')return therapyStepTwo();
 if(id==='asistente/propuesta')return therapyStepThree();
 const item=[treatmentPrimary,...treatmentItems,['referencias','Evidencia científica']].find(x=>x[0]===id);
 if(!item)return treatmentHome();
 return pending(item[1],'treatment-home','Tratamiento',false);
}
function classificationDetail(id){
 const item=classificationItems.find(x=>x[0]===id);if(!item)return classification();
 const r=interpretEcho(clinicalContext);
 const summary=id==='fenotipo'?(r.ef===null?'FEVI pendiente':String(r.ef).replace('.',',')+' % · '+r.title):id==='evolucion'?r.trajectory:id==='situacion'?r.safety.title:'Datos adicionales pendientes de evaluar';
 return '<div class="page pearl-home ic-page class-page">'+back('Clasificación','classification')+'<h1>'+item[1]+'</h1><section class="pearl-card pending-card"><h2>Pendiente de desarrollo</h2><p>'+summary+'</p><p>El asistente de este apartado todavía no está operativo.</p></section>'+ (r.urgent?card(special[1],'ic-urgent'):'')+'</div>';
}
function route(){const hash=location.hash.slice(1);if(hash==='ic')return ic();if(hash==='ic/tratamiento')return treatmentHome();if(hash.startsWith('ic/tratamiento/'))return treatmentDetail(hash.slice('ic/tratamiento/'.length));if(hash==='ic/clasificacion')return classification();if(hash==='ic/clasificacion/conclusion')return classificationSummaryView();if(hash==='ic/clasificacion/evolucion')return evolutionView();if(hash==='ic/clasificacion/nyha')return nyhaView();if(hash==='ic/clasificacion/situacion')return situationView();if(hash==='ic/clasificacion/situacion/conclusion')return situationResult();if(hash==='ic/clasificacion/fenotipo')return phenotypeView();if(hash==='ic/clasificacion/fenotipo/conclusion')return phenotypeResult();if(hash==='ic/clasificacion/estadio')return stageView();if(hash==='ic/clasificacion/estadio/conclusion')return stageResult();if(hash.startsWith('ic/clasificacion/'))return classificationDetail(hash.slice('ic/clasificacion/'.length));if(hash==='ic/diagnostico')return diagnosis();if(hash==='ic/diagnostico/sospecha')return suspicion();if(hash==='ic/diagnostico/pruebas')return studyView();if(hash==='ic/diagnostico/peptidos')return peptideView();if(hash==='ic/diagnostico/ecocardiografia')return echoView();if(hash==='ic/diagnostico/ecocardiografia/conclusion')return echoResult();if(hash==='ic/diagnostico/asistente')return guidedEntry('Asistente diagnóstico');if(hash==='ic/valoracion')return guidedEntry('Valoración del paciente');if(hash==='ic/diagnostico/referencias')return pending('Referencias científicas','diagnosis','Diagnóstico',true);if(hash.startsWith('ic/diagnostico/')){const item=diagnosticItems.find(x=>x[0]===hash.slice('ic/diagnostico/'.length));if(item)return pending(item[1],'diagnosis','Diagnóstico',true);return diagnosis();}if(hash.startsWith('ic/')){const item=all.find(x=>x[0]===hash.slice(3));if(item)return pending(item[1],'ic','Insuficiencia cardiaca',item[0]!=='descompensada');}if(hash==='integral')return pending('Valoración integral');if(hash==='sources')return pending('Fuentes');if(hash.startsWith('area/')){const item=PATHOLOGIES.find(x=>x[0]===hash.slice(5));if(item)return pending(item[1]);}return home();}
// Preserve UI state only for updates on the same screen. Route changes and reset start fresh.
function capturePanels(root){
 return new Map([...root.querySelectorAll('details[data-panel]')].map(e=>[e.dataset.panel,e.open]));
}
function restorePanels(root,state){
 for(const e of root.querySelectorAll('details[data-panel]'))if(state.has(e.dataset.panel))e.open=state.get(e.dataset.panel);
}
function replacePanelContent(root,html){
 const state=capturePanels(root),x=window.scrollX,y=window.scrollY;
 root.innerHTML=html;restorePanels(root,state);window.scrollTo(x,y);
}
function render(focus=false){
 const state=focus?null:capturePanels(app),x=window.scrollX,y=window.scrollY;
 const active=!focus&&app.contains(document.activeElement)?document.activeElement:null;
 const focusKey=active&&active.matches('button,input,select,summary')?JSON.stringify([active.tagName,[...active.attributes].filter(a=>a.name.startsWith('data-')||['name','value'].includes(a.name)).map(a=>[a.name,a.value]),active.tagName==='SUMMARY'?active.parentElement?.dataset.panel:null]):null;
 app.innerHTML='<a class="skip-link" href="#main-content">Saltar al contenido</a><main id="main-content" tabindex="-1">'+route()+'</main><footer class="footer">CaHReMe · Salud cardiorrenal-hepatometabólica · v'+BUILD+'</footer>';
 if(focus){document.getElementById('main-content').focus({preventScroll:true});window.scrollTo(0,0);if(proposalMedicationId){const target=app.querySelector('[data-med-row="'+proposalMedicationId+'"] > summary');proposalMedicationId=null;if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'start'});}}return;}
 restorePanels(app,state);
 if(focusKey){
  const candidate=[...app.querySelectorAll('button,input,select,summary')].find(e=>JSON.stringify([e.tagName,[...e.attributes].filter(a=>a.name.startsWith('data-')||['name','value'].includes(a.name)).map(a=>[a.name,a.value]),e.tagName==='SUMMARY'?e.parentElement?.dataset.panel:null])===focusKey);
  if(candidate&&candidate.getClientRects().length)candidate.focus({preventScroll:true});
 }
 window.scrollTo(x,y);
}
function go(hash){if(location.hash==='#'+hash||(!hash&&!location.hash))render(true);else location.hash=hash;}
app.addEventListener('click',event=>{const btn=event.target.closest('button[data-action]');if(!btn)return;switch(btn.dataset.action){case 'situation-edit':go('ic/clasificacion/situacion');break;case 'situation-result':go('ic/clasificacion/situacion/conclusion');break;
 case 'situation-select':{const key=btn.dataset.situationKey,value=btn.dataset.situationValue;const wasRecovered=!!btn.closest('.situation-recovered');clinicalContext=setSituation(clinicalContext,key,value);render();const d=document.querySelector('.situation-recovered');if(d&&!wasRecovered&&['perfusion','worsening'].includes(key)&&value!=='unknown')d.open=true;const target=document.querySelector('[data-situation-key="'+key+'"][data-situation-value="'+value+'"]');if(target)target.focus({preventScroll:true});break;}case 'phenotype-edit':go('ic/clasificacion/fenotipo');break;
 case 'phenotype-history':case 'phenotype-select':{
 if(document.querySelector('[data-echo-input][aria-invalid="true"]'))break;
 clinicalContext=btn.dataset.action==='phenotype-history'?setEcho(clinicalContext,btn.dataset.phenotypeKey,btn.dataset.phenotypeValue):setPhenotypeAssessment(clinicalContext,btn.dataset.phenotypeKey,btn.dataset.phenotypeValue);
 render();break;
 }case 'phenotype-result':{
 let valid=true;for(const field of document.querySelectorAll('[data-echo-input]')){const before=clinicalContext;clinicalContext=setEcho(clinicalContext,field.dataset.echoInput,field.value);const invalid=before===clinicalContext;field.setAttribute('aria-invalid',String(invalid));const err=field.closest('label').querySelector('.np-error');if(err)err.textContent=invalid?'Valor inválido':'';if(invalid)valid=false;}
 if(valid)go('ic/clasificacion/fenotipo/conclusion');else{const first=document.querySelector('[data-echo-input][aria-invalid="true"]');if(first){const details=first.closest('details');if(details)details.open=true;first.focus();}}break;
 }case 'stage-edit':go('ic/clasificacion/estadio');break;case 'stage-result':go('ic/clasificacion/estadio/conclusion');break;case 'stage-select':{clinicalContext=setStageAssessment(clinicalContext,btn.dataset.stageKey,btn.dataset.stageValue);render();const target=document.querySelector('[data-stage-key="'+btn.dataset.stageKey+'"][data-stage-value="'+btn.dataset.stageValue+'"]');if(target)target.focus({preventScroll:true});break;}case 'proposal-edit-medication':{proposalMedicationId=btn.dataset.medId;go('ic/tratamiento/asistente/medicacion');break;}case 'therapy-risk':{clinicalContext=setTherapyRisk(clinicalContext,btn.dataset.riskKey,btn.dataset.riskValue);render();break;}case 'med-choice':{
 const id=btn.dataset.medId,key=btn.dataset.medField,value=btn.dataset.medValue,wasComplete=medicationEntryComplete(medicationSummary(clinicalContext),id);
 clinicalContext=key==='quick-dose'?setMedicationQuickDose(clinicalContext,id,value):key==='absence-reason'?setAbsenceReason(clinicalContext,id,value):setMedicationField(clinicalContext,id,key,value);
 render();
 const panel=document.querySelector('[data-med-row="'+id+'"]');
 if(key==='quick-dose'){const custom=panel?.querySelector('[data-panel="med-custom-'+id+'"]');if(custom)custom.open=false;}
 if(['quick-dose','frequency'].includes(key)&&!wasComplete&&medicationEntryComplete(medicationSummary(clinicalContext),id))advanceMedication(id);
 break;
 }case 'med-done':{const id=btn.dataset.medId;if(!advanceMedication(id)){const panel=document.querySelector('[data-med-row="'+id+'"]');if(panel)panel.querySelector('.med-row-error').textContent='Completa la dosis, frecuencia o principio activo antes de cerrar la pauta.';}break;}
 case 'med-add-named':{
 const before=clinicalContext;clinicalContext=addNamedMedication(clinicalContext,btn.dataset.medDrug);if(before===clinicalContext)break;
 const id=medicationSummary(clinicalContext).additional.at(-1).id;render();
 const catalog=document.querySelector('[data-panel="med-catalog"]');if(catalog)catalog.open=false;
 document.querySelectorAll('.med-accordion').forEach(e=>{e.open=e.dataset.medRow===id;});
 const panel=document.querySelector('[data-med-row="'+id+'"]');panel?.querySelector(':scope > summary')?.focus({preventScroll:true});panel?.scrollIntoView({block:'nearest'});
 break;
 }case 'med-remove':clinicalContext=deleteRecordedMedication(clinicalContext,btn.dataset.medId);render();break;case 'therapy-medication':go('ic/tratamiento/asistente/medicacion');break;case 'therapy-proposal':go(classificationSummary(clinicalContext).urgent?'ic/descompensada':'ic/tratamiento/asistente/propuesta');break;case 'therapy-first':go('ic/tratamiento/asistente');break;case 'therapy-next':{
 const inputs=[...document.querySelectorAll('[data-therapy-input]')];let valid=true;
 for(const field of inputs){const before=clinicalContext;clinicalContext=setTreatmentValue(clinicalContext,field.dataset.therapyInput,field.value);const invalid=before===clinicalContext;field.setAttribute('aria-invalid',String(invalid));const err=field.closest('label').querySelector('.therapy-error');if(err)err.textContent=invalid?'Valor inválido':'';if(invalid)valid=false;}
 const d=treatmentSafetyData(clinicalContext);refreshTherapySafety();if(d.urgent){go('ic/descompensada');break;}if(!valid){document.querySelector('[data-therapy-input][aria-invalid="true"]')?.focus();break;}if(d.pressureDiscordant){document.querySelector('[data-therapy-input="sbp"]')?.focus();break;}go('ic/tratamiento/asistente/medicacion');break;
 }case 'treatment-home':go('ic/tratamiento');break;case 'treatment-section':if([treatmentPrimary,...treatmentItems].some(x=>x[0]===btn.dataset.section))go('ic/tratamiento/'+btn.dataset.section);break;case 'treatment-evidence':go('ic/tratamiento/referencias');break;case 'classification-summary':go('ic/clasificacion/conclusion');break;case 'classification':go('ic/clasificacion');break;case 'classification-section':if(classificationItems.some(x=>x[0]===btn.dataset.section))go('ic/clasificacion/'+btn.dataset.section);break;case 'edit-echo':go('ic/diagnostico/ecocardiografia');break;case 'echo-select':{
 clinicalContext=setEcho(clinicalContext,btn.dataset.echoKey,btn.dataset.echoValue);
 const group=btn.closest('.np-segment');for(const b of group.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===btn));
 break;
 }case 'interpret-echo':{
 let valid=true;for(const field of document.querySelectorAll('[data-echo-input]')){const before=clinicalContext;clinicalContext=setEcho(clinicalContext,field.dataset.echoInput,field.value);const invalid=before===clinicalContext;field.setAttribute('aria-invalid',String(invalid));const err=field.closest('label').querySelector('.np-error');if(err)err.textContent=invalid?'Valor inválido':'';if(invalid)valid=false;}
 if(valid)go('ic/diagnostico/ecocardiografia/conclusion');else{const first=document.querySelector('[data-echo-input][aria-invalid="true"]');if(first){const details=first.closest('details');if(details)details.open=true;first.focus();}}break;
 }case 'np-select':{
 clinicalContext=setPeptide(clinicalContext,btn.dataset.npKey,btn.dataset.npValue);render();break;
 }case 'interpret-np':{
 const fields=[...document.querySelectorAll('[data-np-input]')];
 let valid=true;for(const field of fields){const before=clinicalContext;clinicalContext=setPeptide(clinicalContext,field.dataset.npInput,field.value);const invalid=before===clinicalContext;field.setAttribute('aria-invalid',String(invalid));const err=field.closest('label').querySelector('.np-error');if(err)err.textContent=invalid?'Valor inválido':'';if(invalid)valid=false;}
 const result=document.getElementById('np-result');if(result){replacePanelContent(result,valid?peptideResult():'<p class="np-alert">Corrige el valor antes de interpretarlo.</p>');result.focus({preventScroll:true});result.scrollIntoView({block:'start',behavior:'auto'});}break;
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
  const hasData=Object.keys(clinicalContext.findings).length||Object.keys(clinicalContext.results||{}).length||Object.keys(clinicalContext.peptides||{}).length||Object.keys(clinicalContext.echo||{}).length||Object.keys(clinicalContext.stageAssessment||{}).length||Object.keys(clinicalContext.phenotypeAssessment||{}).length||Object.keys(clinicalContext.nyhaAssessment||{}).length||Object.keys(clinicalContext.situationAssessment||{}).length||Object.keys(clinicalContext.treatmentAssessment||{}).length||Object.keys(clinicalContext.medicationAssessment?.groups||{}).length||clinicalContext.medicationAssessment?.additional?.length||clinicalContext.medicationAssessment?.reviewed;
  if(!hasData){location.reload();return;}
  const notice=document.createElement('div');notice.setAttribute('role','status');
  notice.style.cssText='position:relative;padding:10px 16px;background:#fff;color:#173347;text-align:center;border-bottom:1px solid #d6e6e8;font-size:.85rem';
  notice.textContent='Nueva versión disponible. Termina tu evaluación antes de recargar; los datos de sesión no se conservan.';
  const refresh=document.createElement('button');refresh.className='text-link';refresh.textContent='Actualizar ahora';refresh.addEventListener('click',()=>{if(confirm('¿Actualizar y borrar los datos de esta sesión?'))location.reload();});notice.append(refresh);document.body.prepend(notice);
 });
 window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{}));
}
