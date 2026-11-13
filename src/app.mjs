import {BRIEF_FIELDS,evaluateClinicalBrief} from './clinical/consulta-breve.mjs';
import {evaluateObesity} from './clinical/obesidad.mjs';
import {evaluateMasld} from './clinical/masld.mjs';
import {LIPID_FIELDS,evaluateDyslipidemia} from './clinical/dislipemia.mjs';
import {HTA_FIELDS,evaluateHypertension} from './clinical/hta.mjs';
import {CKM_FIELDS,evaluateCkm} from './clinical/ckm.mjs';
import {CV_FIELDS,OP_FIELDS,evaluateCvRisk} from './clinical/riesgo-cv.mjs';
import { SECTIONS, FIELDS, createDraft, setValue, setUnavailable, fieldState, sectionStats, totalStats, sectionForFocus } from './model.mjs';
import { MODULES, MODULE_BY_ID, moduleFields, readMulti } from './consultas.mjs';
import { SOURCES, evaluateRenal } from './clinical/engine.mjs';
import { integratePatient, INTEGRATION_SOURCES } from './clinical/integracion.mjs';
import { DRUGS, getDrug, getDrugRoute, reviewDrug } from './clinical/farmacologia.mjs';
import { reviewFinerenoneContinuation, reviewEmpagliflozinContinuation, confirmedAction } from './clinical/continuidad.mjs';
import {buildIntegratedPlan} from './clinical/plan-integral.mjs';
import { evaluateDm2Quick } from './clinical/dm2-rapida.mjs';
import { evaluateDm2Detail } from './clinical/dm2-detallada.mjs';
import { evaluateInsulinization } from './clinical/insulinizacion.mjs';
import { evaluateKidney } from './clinical/renal.mjs';
import { evaluateHeartFailure } from './clinical/insuficiencia-cardiaca.mjs';

let draft = createDraft();
let confirmedHistory = [];
let followupError = '';
let current = { page: 'home', step: 0, focus: 'integral', module: null, mode:'quick', drug:'empagliflozina', route:'dm2' };
const app = document.getElementById('app');
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const counts = () => totalStats(draft);

function banner() {
  return '';
}
function header() {
  return `<header class="topbar"><div class="topbar-inner">
    <button class="brand" type="button" data-action="home" aria-label="Volver al inicio de CaHReMe">
      <span class="brand-mark" aria-hidden="true"><img src="./public/icon-concept.svg" alt="" /></span>
      <span><strong>Ca<span class="brand-accent">H</span>ReMe</strong><small>Salud cardiorrenal-hepatometabólica</small></span>
    </button>
    <nav class="desktop-nav" aria-label="Navegación principal en ordenador">
      ${[['home','Inicio'],['evaluation','Integral'],['tools','Herramientas'],['sources','Fuentes']].map(([id,label])=>`<button type="button" class="text-link" data-action="${id}" ${current.page===id?'aria-current="page"':''}>${label}</button>`).join('')}
    </nav><div class="top-right"></div>
  </div></header>`;
}
function nav() {
  const items = [['home','Inicio','⌂'],['evaluation','Integral','＋'],['tools','Herramientas','▦'],['sources','Fuentes','≡']];
  return `<nav class="bottom-nav" aria-label="Navegación principal">${items.map(([id,label,sym]) =>
    `<button type="button" class="${current.page === id || (id==='evaluation' && ['module','summary'].includes(current.page)) ? 'active' : ''}" data-action="${id}" ${current.page === id ? 'aria-current="page"' : ''}>
      <span aria-hidden="true" class="nav-symbol">${sym}</span><span>${label}</span></button>`).join('')}</nav>`;
}
function home() {
 const more=[['cv-risk','Riesgo cardiovascular','Elegibilidad y cálculo SCORE2'],['ckm','Estadio CKM','Clasificación con los datos disponibles'],['hta','Presión arterial','Confirmar o revisar tratamiento'],['lipids','Dislipemia','Objetivo LDL y tratamiento']];
 return `<div class="page home"><section class="quick-home"><h1>¿Qué necesitas resolver?</h1><p>Elige una consulta. Introduce sus criterios y consulta la conducta.</p>
 ${(counts().registrado+counts().no_disponible+counts().revisar)>0?'<button type="button" class="ghost" data-action="new">Borrar datos y comenzar otra evaluación</button>':''}</section>
 <div class="module-grid">${MODULES.map(m=>`<button type="button" class="module-card" data-action="start-module" data-module="${escape(m.id)}"><span class="module-art" aria-hidden="true"><img src="./public/domain-${escape(m.domain)}.svg" alt="" /></span><span class="module-content"><strong>${escape(m.title)}</strong><small>${escape(m.short)}</small></span><span class="module-arrow" aria-hidden="true">↗</span></button>`).join('')}
 ${more.map(([action,title,description])=>`<button type="button" class="task-card" data-action="${action}"><strong>${title}</strong><small>${description}</small><span aria-hidden="true">↗</span></button>`).join('')}</div>
 <details class="integral-access"><summary>Evaluación integral y ficha compartida</summary><p>Acceso opcional para reunir la evaluación de varias áreas.</p><button class="ghost" type="button" data-action="start" data-focus="integral">${counts().registrado?'Continuar evaluación integral':'Nueva evaluación integral'}</button></details></div>`;
}
function obesityResult(mode='detail'){
 const r=evaluateObesity(draft,mode);
 const list=xs=>xs.length?`<ul>${xs.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`:'';
 return `<section id="obesity-result" class="dm2-result" aria-live="polite"><div class="eyebrow">OBESIDAD · GIRO2025 / CIMA</div><h2>Plan de peso, función y seguimiento</h2>
 ${r.alerts.length?`<div class="dm2-safety"><h3>Prioridad clínica</h3>${list(r.alerts)}</div>`:''}
 ${r.missing.length?`<h3>Información necesaria</h3>${list(r.missing)}`:''}
 ${r.anthropometry?`<h3>Antropometría disponible</h3><p>IMC ${escape(r.anthropometry.bmi.toFixed(2))} kg/m² · ${escape(r.anthropometry.origin)}. Categoría descriptiva: ${escape(r.anthropometry.category.replaceAll('_',' '))}.</p>
 ${r.anthropometry.waistHeightRatio!==null?`<p>Cintura/talla: ${escape(r.anthropometry.waistHeightRatio.toFixed(2))}.</p>`:''}`:''}
 <h3>Siguiente paso</h3>${list(r.steps)}
 ${r.goal?`<h3>Objetivo acordado</h3><p>${escape(r.goal.type)}${r.goal.percent!==null?`: ${escape(r.goal.percent)} % respecto al basal (${escape(r.goal.weightKg.toFixed(1))} kg de referencia).`:'.'}</p>`:''}
 ${r.response?`<h3>Evolución respecto al basal documentado</h3><p>Pérdida: ${escape(r.response.lossKg.toFixed(1))} kg (${escape(r.response.lossPercent.toFixed(1))} %). Una cifra negativa indica ganancia. No demuestra por sí sola respuesta a un fármaco.</p>`:''}
 ${r.lifestyle.length?`<h3>Intervención adaptada</h3>${list(r.lifestyle.map(x=>x.text))}`:''}
 ${r.options.length?`<h3>Opciones farmacológicas para revisión</h3>${list(r.options.map(x=>x.title))}`:''}
 ${r.productReviews.length?`<details><summary>Comprobaciones por producto</summary>${r.productReviews.map(x=>`<h4>${escape(x.labelRoute)}</h4>${list([...x.blocked,...x.missing,...x.checks])}`).join('')}</details>`:''}
 ${r.referral.length?`<h3>Valoración especializada</h3>${list(r.referral.map(x=>x.text))}`:''}
 <h3>Comprobaciones</h3>${list(r.checks)}
 <h3>Seguimiento</h3><p>${r.followUp?`Revisión orientativa: ${escape(r.followUp.dueOn)}. ${r.followUp.status==='plazo_superado'?'Plazo superado: revisar contactos/controles ya realizados. ':''}${escape(r.followUp.text)}`:'Acordar revisión tras completar la evaluación. Una propuesta no se considera iniciada.'}</p>
 <details><summary>Fichas de referencia · sin pauta individual</summary><button type="button" class="text-link" data-action="open-drug" data-drug-id="semaglutida_wegovy_sc" data-route-id="peso">Semaglutida subcutánea para peso: ficha CIMA →</button>
 <button type="button" class="text-link" data-action="open-drug" data-drug-id="tirzepatida" data-route-id="peso">Tirzepatida para peso: ficha CIMA →</button><p>Las fichas se consultan para revisión; no determinan elegibilidad ni financiación. Otros productos requieren revisión individual.</p></details>
 <details><summary>Fuentes</summary>${r.sources.map(x=>`<p><a href="${escape(x.url)}" target="_blank" rel="noopener noreferrer">${escape(x.title)}</a> · ${escape(x.locator)}</p>`).join('')}</details>
 </section>`;
}
function obesityFieldsMarkup(fields,mode){
 if(mode==='quick')return fields.map(id=>moduleFieldMarkup(FIELDS[id])).join('');
 const basic=MODULE_BY_ID.obesidad.quick;
 const habits=['cintura','ob_complicacion_grave','ob_secundaria','ob_adaptacion_muscular','ob_alimentacion','ob_actividad','ob_limitacion_ejercicio','ob_sueno_psicosocial','ob_respuesta_previa'];
 const goals=['ob_peso_basal','ob_fecha_basal','ob_basal_confirmado','ob_objetivo','ob_objetivo_porcentaje','ob_objetivo_salud','ob_plan_estado','ob_plan_confirmado','ob_fecha_plan'];
 const rest=fields.filter(id=>![...basic,...habits,...goals].includes(id));
 return basic.map(id=>moduleFieldMarkup(FIELDS[id])).join('')+[[habits,'Hábitos y preservación muscular'],[goals,'Objetivos, evolución y plan confirmado'],[rest,'Tratamiento y seguridad por producto']].map(([ids,title])=>`<details><summary>${title}</summary><div class="field-grid">${ids.map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div></details>`).join('');
}
function obesitySummaryCard(){
 const r=evaluateObesity(draft,'quick');
 return `<section class="calc-card"><h2>Obesidad y función</h2><p>${r.alerts.length?'Existen alertas para valoración.':r.anthropometry?'IMC disponible: '+escape(r.anthropometry.bmi.toFixed(2))+'; revisar complicaciones y plan individual.':'Completar antropometría y evaluación de complicaciones.'}</p><button class="text-link" type="button" data-action="start-module" data-module="obesidad">Ver recorrido de obesidad →</button></section>`;
}
function lipidResult(){
 const r=evaluateDyslipidemia(draft);
 const list=xs=>xs.length?`<ul>${xs.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`:'';
 return `<section id="lipid-result" class="dm2-result" aria-live="polite"><h2>Dislipemia: resultado para revisión</h2>
 ${r.alerts.length?`<div class="dm2-safety"><h3>Prioridad clínica</h3>${list(r.alerts)}</div>`:''}
 ${r.missing.length?`<h3>Información necesaria</h3>${list(r.missing)}`:''}
 <h3>Riesgo y objetivos</h3><p>${r.risk?escape(r.risk)+' · '+escape(r.riskOrigin):'Categoría no confirmada; no se asigna objetivo automático.'}</p>
 ${r.goal?`<p>Objetivo LDL <strong>&lt;${escape(r.goal.ldlLessThan)} mg/dL</strong>${r.goal.requiresFiftyPercent?' y reducción ≥50 % respecto al basal sin tratamiento.':'.'} Marco ESC/EAS 2025.</p>`:''}
 ${r.comparison?`<p>Objetivo absoluto: <strong>${r.comparison.absoluteMet?'alcanzado':'no alcanzado'}</strong>. ${r.goal.requiresFiftyPercent?'Reducción ≥50 %: '+(r.comparison.reductionMet===null?'no evaluable':r.comparison.reductionMet?'alcanzada':'no alcanzada')+'.':''}</p>`:''}
 ${r.reduction!==null?`<p>Reducción respecto al basal documentado: ${escape(r.reduction.toFixed(1))} %.</p>`:''}
 ${r.nonHdl!==null?`<p>Colesterol no-HDL: ${escape(r.nonHdl.toFixed(1))} mg/dL.</p>`:''}
 <h3>Próximos pasos</h3>${list(r.steps)}
 ${r.options.length?`<h3>Opciones para valoración profesional</h3>${r.options.map(x=>`<article><h4>${escape(x.title)}</h4><p>${escape(x.detail)}</p></article>`).join('')}`:''}
 <h3>Comprobaciones</h3>${list(r.checks)}
 <h3>Seguimiento</h3>${r.followUp?`<p>Ventana orientativa: ${escape(r.followUp.from)} a ${escape(r.followUp.to)}. ${r.followUp.status==='plazo_superado'?'Plazo superado: revisar controles disponibles.':''} ${escape(r.followUp.text)}</p>`:'<p>No se genera una fecha de control desde una propuesta o con datos insuficientes. Individualizar seguimiento.</p>'}
 <details><summary>Referencias farmacológicas CIMA · sin pauta individual</summary>${r.drugReferences.map(x=>`<h4>${escape(x.name)}</h4><p>${escape(x.reference)} <a href="${escape(x.source)}" target="_blank" rel="noopener noreferrer">Ficha técnica</a></p>`).join('')}</details>
 <details><summary>Guías y fuentes</summary>${r.sources.map(x=>`<p><a href="${escape(x.url)}" target="_blank" rel="noopener noreferrer">${escape(x.title)}</a> · ${escape(x.locator)}</p>`).join('')}</details>
 </section>`;
}
function briefStandaloneView(id,title){
 const fields=BRIEF_FIELDS[id],visible=(id==='hta'?current.htaVisible:current.lipidVisible)||fields.every(x=>fieldState(draft,x)==='registrado')||evaluateClinicalBrief(draft,id).safety.length;
 return `<div class="page"><div class="bread"><button type="button" data-action="home">Inicio</button><span>${title}</span></div><h1>${title}</h1><section class="form-card"><div class="field-grid">${fields.map(x=>moduleFieldMarkup(FIELDS[x])).join('')}</div><button type="button" class="primary" data-action="${BRIEF_ACTIONS[id]}">${BRIEF_BUTTONS[id]} →</button></section>${visible?briefResult(id):''}<button type="button" class="text-link" data-action="brief-advanced" data-target="${id}">Revisión detallada · opcional →</button></div>`;
}
function lipidView(){
 if(!current.lipidDetail)return briefStandaloneView('lipids','Dislipemia');
 const basic=['edad','embarazo','lip_lactancia','fecha_evaluacion','colesterol_total','hdl','ldl','trigliceridos','fecha_lipidos','lip_metodo_ldl','lip_alarma'];
 return `<div class="page"><div class="bread"><button type="button" data-action="home">Inicio</button><span>Dislipemia</span></div>
 <h1>Dislipemia</h1>${banner()}<section class="form-card"><h2>Perfil lipídico disponible</h2><div class="field-grid">${basic.map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div>
 <details><summary>Riesgo, basal y modificadores</summary><button type="button" class="text-link" data-action="cv-risk">Abrir evaluación del riesgo cardiovascular →</button><div class="field-grid">${LIPID_FIELDS.slice(10,24).filter(id=>!basic.includes(id)).map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div></details>
 <details><summary>Tratamiento, seguridad y seguimiento</summary><div class="field-grid">${LIPID_FIELDS.filter(id=>!basic.includes(id)&&!LIPID_FIELDS.slice(10,24).includes(id)).map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div></details>
 <button type="button" class="primary" data-action="lipid-result">Ver orientación de dislipemia →</button></section>
 ${current.lipidVisible?lipidResult():''}</div>`;
}
function lipidSummaryCard(){
 const r=evaluateDyslipidemia(draft);
 return `<section class="calc-card"><h2>Dislipemia</h2><p>${r.alerts.length?'Existen alertas que requieren valoración.':r.goal?'Objetivo LDL para revisión: &lt;'+escape(r.goal.ldlLessThan)+' mg/dL; comprobar también reducción y contexto.':'Falta confirmar riesgo y procedencia del perfil.'}</p>
 <button type="button" class="text-link" data-action="lipids">Ver riesgo, objetivo y tratamiento →</button></section>`;
}
function htaResult(){
 const r=evaluateHypertension(draft);
 const labels={no_evaluable:'Patrón no evaluable',elevacion_sostenida:'Elevación en consulta y fuera de consulta',
 compatible_bata_blanca:'Patrón compatible con HTA de bata blanca',efecto_bata_blanca:'Posible efecto de bata blanca durante tratamiento',
 compatible_hta_enmascarada:'Patrón compatible con HTA enmascarada',posible_mal_control_enmascarado:'Posible mal control enmascarado',
 sin_elevacion_diagnostica_sostenida:'Sin elevación diagnóstica en las medias disponibles',
 consulta_rango_hta:'PA de consulta en rango de HTA: confirmar',consulta_pa_elevada:'PA de consulta elevada',consulta_pa_no_elevada:'PA de consulta no elevada'};
 const list=xs=>xs.length?`<ul>${xs.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`:'';
 return `<section id="hta-result" class="dm2-result" aria-live="polite"><h2>Valoración de presión arterial</h2>
 ${r.alerts.length?`<div class="dm2-safety"><h3>Prioridad de revisión</h3>${list(r.alerts)}</div>`:''}
 <p>${escape(labels[r.pattern]||'Revisar contexto clínico')}</p>
 ${r.missing.length?`<h3>Información necesaria</h3>${list(r.missing)}`:''}
 <h3>Próximos pasos</h3>${list(r.steps)}
 <h3>Objetivo durante tratamiento</h3>${r.target
 ?`<p>Referencia de consulta: PAS 120–129 y PAD 70–79 mmHg, si se tolera. ${escape(r.target.context)}</p>`
 :'<p>Objetivo individual pendiente de valoración; no se aplica automáticamente un intervalo intensivo.</p>'}
 ${r.options.length?`<h3>Opciones para revisión profesional</h3>${r.options.map(x=>`<article><h4>${escape(x.title)}</h4><p>${escape(x.detail)}</p>${list(x.checks)}</article>`).join('')}`:''}
 <h3>Comprobaciones</h3>${list(r.checks)}<h3>Reevaluación</h3><p>${escape(r.followUp)}</p>
 <p><a href="${escape(r.source.url)}" target="_blank" rel="noopener noreferrer">${escape(r.source.title)}</a> · ${escape(r.source.locator)}</p>
 </section>`;
}
function htaView(){
 if(!current.htaDetail)return briefStandaloneView('hta','Presión arterial e HTA');
 const basic=['edad','embarazo','fecha_evaluacion','hta_conocida','pas','pad','fecha_pas','hta_consulta_calidad','hta_alarma','hta_dano_agudo','hta_tratamiento'];
 return `<div class="page"><div class="bread"><button type="button" data-action="home">Inicio</button><span>PA e HTA</span></div>
 <h1>Presión arterial e HTA</h1>${banner()}
 <section class="form-card"><h2>Datos iniciales</h2><div class="field-grid">${basic.map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div>
 <details><summary>AMPA/MAPA, seguridad y revisión de tratamiento</summary><div class="field-grid">${HTA_FIELDS.filter(id=>!basic.includes(id)).map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div></details>
 <button type="button" class="primary" data-action="hta-result">Ver orientación de PA e HTA →</button></section>
 ${current.htaVisible?htaResult():''}</div>`;
}
function htaSummaryCard(){
 const r=evaluateHypertension(draft);
 return `<section class="calc-card"><h2>Presión arterial e HTA</h2><p>${r.alerts.length?'Hay alertas que requieren valoración.':r.office?'Medición de consulta disponible; revisar confirmación y contexto.':'Faltan mediciones estandarizadas y contexto clínico.'}</p>
 <button type="button" class="text-link" data-action="hta">Ver confirmación y objetivos →</button></section>`;
}
function ckmResult(){
 const r=evaluateCkm(draft);
 const list=xs=>xs.length?`<ul>${xs.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`:'';
 const title=r.stage!==null?'Estadio CKM '+(r.substage||r.stage)+' · para revisión'
  :r.minimumStage!==null?'Evidencia de al menos estadio '+r.minimumStage+' · evaluación incompleta':'Estadio CKM no evaluable';
 return `<section id="ckm-result" class="dm2-result" aria-live="polite"><h2>${escape(title)}</h2>
  ${r.alerts.length?`<div class="dm2-safety">${list(r.alerts)}</div>`:''}
  ${r.evidence.length?`<h3>Evidencia aportada</h3>${list(r.evidence)}`:''}
  ${r.missing.length?`<h3>Para precisar el resultado</h3>${list(r.missing.slice(0,2))}${r.missing.length>2?`<details><summary>Otras comprobaciones pendientes (${r.missing.length-2})</summary>${list(r.missing.slice(2))}</details>`:''}`:''}
  <details><summary>Interpretación y límites</summary>${list(r.notes)}</details>
  <p><a href="${escape(r.source.url)}" target="_blank" rel="noopener noreferrer">${escape(r.source.title)}</a> · ${escape(r.source.locator)}</p>
  </section>`;
}
// Preguntas dirigidas: solo se representa un bloque; los valores compartidos se conservan.
function ckmQuestionBlocks(){
 const v=id=>fieldState(draft,id)==='registrado'?draft.values[id]:null;
 const r=evaluateCkm(draft),level=r.stage??r.minimumStage;
 const blocks=[
  {id:'contexto',title:'¿Es aplicable este circuito?',fields:['edad','embarazo','dm1','situacion_aguda','lra_sospecha','fecha_evaluacion']},
  {id:'cardiovascular',title:'¿Hay enfermedad cardiovascular conocida?',fields:['ckm_cvd','ecv','ic',...((v('ckm_cvd')==='Confirmada'||v('ic')==='Sí')?['ckm_fecha_cvd']:[])]},
  {id:'factores',title:'¿Qué factores ya están documentados?',fields:['dm2','ckm_hta_tratada','ckm_mets','imc']},
  {id:'renal',title:'¿Qué sabemos de la función renal?',fields:['erc','ckm_reemplazo_renal','tfge',...(v('tfge')?['fecha_tfge']:[]),'persistencia']}
 ];
 if(level!==4){
  blocks.push({id:'albuminuria',title:'Albuminuria disponible',fields:['cac',...(v('cac')?['unidad_cac','fecha_cac']:[])]});
  if(level!==3)blocks.push({id:'subclinica',title:'¿Existe evidencia de mayor riesgo?',fields:['ckm_subclinica',...(v('ckm_subclinica')==='Confirmada por evaluación clínica/especializada'?['ckm_fecha_subclinica']:[]),'ckm_prevent',...(v('ckm_prevent')==='PREVENT-CVD ≥20 % a 10 años documentado'?['ckm_fecha_prevent','ckm_version_prevent']:[])]});
  if(level===null||level<2){
   blocks.push({id:'presion',title:'Presión habitual disponible',fields:['pas','pad','fecha_pas','ckm_pa_contexto']});
   blocks.push({id:'lipidos',title:'Perfil metabólico disponible',fields:['trigliceridos','fecha_lipidos','ckm_lipidos']});
  }
  if(level===null){
   blocks.push({id:'adiposidad',title:'Adiposidad: precisar la evaluación',fields:['cintura','cv_sexo_modelo','ckm_ascendencia']});
   blocks.push({id:'glucemia',title:'Glucemia disponible',fields:['hba1c','fecha_hba1c','dm_hba1c_fiable','glucemia_ayunas','fecha_glucemia_ayunas']});
  }
 }
 blocks.push({id:'confirmacion',title:'Confirmar la revisión',fields:['ckm_evaluacion_confirmada']});
 return blocks;
}
function ckmView(){
 const blocks=ckmQuestionBlocks();
 const index=Math.max(0,blocks.findIndex(x=>x.id===(current.ckmBlock??'contexto'))),block=blocks[index];
 current.ckmBlock=block.id;
 const r=evaluateCkm(draft);
 return `<div class="page"><div class="bread"><button type="button" data-action="home">Inicio</button><span>Estadificación CKM</span></div>
  <h1>Estadificación CKM</h1>
  <p>Revisa solo lo que necesitas. Puedes detenerte con un estadio mínimo documentado; los datos desconocidos no se consideran normales.</p>
  ${ckmResult()}
  <section class="form-card"><h2>${escape(block.title)}</h2>
  <p>${block.fields.length} datos en este bloque. Los ya registrados se reutilizan. No necesitas recorrer todos los apartados.</p>
  <div class="field-grid">${block.fields.map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div>
  <div class="wizard-actions"><button type="button" class="ghost" data-action="ckm-block" data-block="${blocks[Math.max(0,index-1)].id}" ${index===0?'disabled':''}>Anterior</button>
  <button type="button" class="primary" data-action="ckm-next">${index===blocks.length-1?'Actualizar resultado':'Revisar siguiente apartado →'}</button></div>
  <button type="button" class="text-link" data-action="ckm-result">Actualizar orientación con lo disponible</button>
  </section>
  <details><summary>Elegir qué dato revisar</summary><div class="ckm-block-links">${blocks.map(x=>`<button type="button" class="text-link" data-action="ckm-block" data-block="${x.id}" ${x.id===block.id?'aria-current="step"':''}>${escape(x.title)}</button>`).join('')}</div></details>
  ${r.stage!==null?'<p>La clasificación ya está disponible. Revisa otros apartados solo si necesitas corregir datos o precisar el resultado.</p>':''}
  <p class="privacy-note">No se solicitan pruebas nuevas solo para completar la clasificación.</p></div>`;
}
function ckmSummaryCard(){
 const r=evaluateCkm(draft);
 return `<section class="calc-card"><h2>Estadificación CKM</h2><p>${r.stage!==null
  ?'Estadio '+escape(r.substage||r.stage)+' para revisión clínica.'
  :r.minimumStage!==null?'Al menos estadio '+escape(r.minimumStage)+' documentado; evaluación incompleta.'
  :'No evaluable con los datos revisados actualmente.'}</p>
  <button type="button" class="text-link" data-action="ckm">Revisar estadio, evidencia y límites →</button></section>`;
}
function cvRiskView(){
 const r=evaluateCvRisk(draft);
 const list=xs=>xs.length?`<ul>${xs.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`:'';
 return `<div class="page"><div class="bread"><button type="button" data-action="home">Inicio</button><span>Riesgo cardiovascular</span></div>
  <h1>Riesgo cardiovascular</h1>${banner()}
  <section class="form-card"><h2>Elegibilidad y datos disponibles</h2><p>Los valores se comparten con la evaluación integral. No se solicita una prueba solo para completar la herramienta.</p>
  <div class="field-grid">${(current.cvDetail?CV_FIELDS:['edad','ecv','ic','dm2','erc']).map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div>
  ${!current.cvDetail?'<p>Comprueba el circuito antes de calcular.</p><button type="button" class="text-link" data-action="cv-expand">Completar los datos del cálculo →</button>':''}
  ${current.cvDetail&&Number(draft.values.edad)>=70&&Number(draft.values.edad)<90?`<section><h2>SCORE2-OP calculado externamente</h2>
   <p>Registra el resultado obtenido en <a href="https://www.heartscore.org/" target="_blank" rel="noopener noreferrer">HeartScore ESC</a> con los mismos datos. El cálculo no se envía ni se importa automáticamente.</p>
   <div class="field-grid">${OP_FIELDS.map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div></section>`:''}
  <button type="button" class="primary" data-action="cv-risk-result">Ver evaluación de riesgo →</button></section>
  ${current.cvVisible?`<section id="cv-result" class="dm2-result" aria-live="polite"><h2>Resultado y siguiente paso</h2>
  ${r.percent!==null?`<p><strong>${escape(r.percent.toFixed(1))} % a 10 años</strong> · SCORE2, región de riesgo bajo (España). Resultado en revisión clínica.</p>`:r.externalEstimate?`<p><strong>${escape(r.externalEstimate.percent.toFixed(1))} % a 10 años</strong> · SCORE2-OP externo de HeartScore, región baja España. Confirmado por el profesional; no calculado por CaHReMe.</p>`:'<p>No se emite un porcentaje con estos datos o en este circuito.</p>'}
  ${r.alerts.length?`<div class="dm2-safety">${list(r.alerts)}</div>`:''}
  ${r.missing.length?`<h3>Para precisar</h3>${list(r.missing.slice(0,2))}${r.missing.length>2?`<details><summary>Datos adicionales del cálculo</summary>${list(r.missing.slice(2))}</details>`:''}`:''}
  ${list(r.steps)}<details><summary>Fuentes y límites</summary>${r.sources.map(x=>`<p><a href="${escape(x.url)}" target="_blank" rel="noopener noreferrer">${escape(x.title)}</a> · ${escape(x.locator)}</p>`).join('')}</details>
  </section>`:''}
 </div>`;
}
function moduleFieldMarkup(f) {
  const unavailable = draft.unavailable.includes(f.id);
  const value = draft.values[f.id] ?? '';
  let control;
  if (f.type === 'multi') {
    const selected = readMulti(value);
    control = `<fieldset class="checks-field" ${unavailable ? 'disabled' : ''}><legend class="sr-only">${escape(f.label)}</legend>
      ${f.options.map(opt => `<label class="check-option"><input type="checkbox" data-field="${escape(f.id)}" value="${escape(opt)}"
       ${selected.includes(opt) ? 'checked' : ''}/> ${escape(opt)}</label>`).join('')}</fieldset>`;
  } else if (f.type === 'select') {
    control = `<select id="f-${escape(f.id)}" data-field="${escape(f.id)}" ${unavailable ? 'disabled' : ''}>
      <option value="">Selecciona una opción</option>${f.options.map(opt =>
      `<option value="${escape(opt)}" ${value===opt?'selected':''}>${escape(opt)}</option>`).join('')}</select>`;
  } else if (f.type === 'textarea') {
    control = `<textarea id="f-${escape(f.id)}" data-field="${escape(f.id)}" rows="3" placeholder="Sin registrar" ${unavailable?'disabled':''}>${escape(value)}</textarea>`;
  } else if (f.type === 'date') {
    control = `<input id="f-${escape(f.id)}" type="date" data-field="${escape(f.id)}"
       value="${escape(value)}" ${unavailable?'disabled':''}/>`;
  } else {
    control = `<div class="input-unit"><input id="f-${escape(f.id)}" type="number" data-field="${escape(f.id)}"
       inputmode="decimal" step="${f.integer?'1':'any'}" ${f.min !== undefined ? `min="${f.min}"` : 'min="0"'}
       ${f.max !== undefined ? `max="${f.max}"` : ''}
       value="${escape(value)}" placeholder="Sin registrar" ${unavailable?'disabled':''}/>
       ${f.unit?`<span>${escape(f.unit)}</span>`:''}</div>`;
  }
  return `<div class="field module-field"><div class="field-head"><label ${f.type === 'multi' ? '' : `for="f-${escape(f.id)}"`}>${escape(f.label)}</label>
    <button type="button" class="availability ${unavailable?'selected':''}"
     data-action="unavailable" data-field-id="${escape(f.id)}" aria-pressed="${unavailable}">
     ${unavailable?'No disponible ✓':'Marcar no disponible'}</button></div>${control}</div>`;
}
function renalResultCard() {
  const x=evaluateRenal(draft);
  const g=x.categories.gfr || '—';
  const a=x.categories.albuminuria || '—';
  const info=x.inputs;
  const note=x.missing.length ? '<p class="clinical-missing">Datos incompletos o por revisar: '+
    x.missing.map(k=>escape(FIELDS[k]?.label||k)).join(' · ')+'</p>' : '';
  return `<section class="calc-card" aria-label="Clasificación descriptiva renal">
    <div class="calc-top"><div><span class="eyebrow">KDIGO 2024 · RESULTADO DESCRIPTIVO</span>
      <h3>TFGe y albuminuria</h3></div><span class="calc-type">${escape(x.status)}</span></div>
    <div class="calc-values">
      <div><strong>${escape(g)}</strong><small>Función renal (G)</small></div>
      <div><strong>${escape(a)}</strong><small>Albuminuria (A)</small></div>
    </div>
    <p>${escape(x.message)}</p>
    ${note}
    <p class="calc-limits">No determina por sí solo ERC ni la causa. La confirmación exige evaluar duración ≥3 meses y/o otros marcadores; no se calcula TFGe a partir de creatinina.</p>
    <a href="${SOURCES.kdigo2024.url}" target="_blank" rel="noopener noreferrer">Fuente: KDIGO 2024, tablas 1–3 ↗</a>
  </section>`;
}
function fib4ResultCard() {
 const r=evaluateMasld(draft);
 const list=xs=>xs.length?`<ul>${xs.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`:'';
 const bands={bajo:'Por debajo del umbral de cribado',intermedio:'Zona de evaluación adicional',alto:'Probabilidad aumentada: valorar derivación'};
 return `<section id="masld-result" class="calc-card" aria-live="polite"><div class="eyebrow">MASLD · EASL-EASD-EASO 2024</div>
 <h2>Fibrosis hepática y derivación</h2>
 ${r.alerts.length?`<div class="dm2-safety"><h3>Prioridad clínica</h3>${list(r.alerts)}</div>`:''}
 ${r.missing.length?`<h3>Información necesaria</h3>${list(r.missing)}`:''}
 ${r.fib4?`<h3>FIB-4 utilizado: ${escape(r.fib4.value.toFixed(2))}</h3><p>${escape(r.fib4.origin)} · ${escape(r.fib4.date)}. ${escape(bands[r.fib4.band]||'Sin interpretación automática en este contexto.')}</p>
 <p>Umbral inferior: ${escape(r.fib4.lowCutoff)} para la edad actual. La decisión usa el valor completo, sin redondearlo a dos decimales.</p>`:'<p>No se utiliza un FIB-4 sin procedencia suficiente. El cálculo requiere analítica fechada en la revisión detallada.</p>'}
 ${r.elastography?`<h3>Rigidez hepática: ${escape(r.elastography.value)} kPa</h3><p>${escape(r.elastography.method||'Método sin confirmar')}. ${r.elastography.valid?'Informe VCTE revisado.':'Resultado pendiente de verificar: no se aplican umbrales de VCTE a otro método.'}</p>`:''}
 <h3>Siguiente paso</h3>${list(r.steps)}
 ${r.referral.length?`<h3>Valoración especializada</h3>${list(r.referral.map(x=>x.text))}`:''}
 <h3>Comprobaciones</h3>${list(r.checks)}
 <h3>Seguimiento</h3><p>${r.followUp?escape(r.followUp.text):'Individualizar tras completar la evaluación; sin calendario rutinario automático.'}</p>
 <details><summary>Fuentes y límites</summary>${r.sources.map(x=>`<p><a href="${escape(x.url)}" target="_blank" rel="noopener noreferrer">${escape(x.title)}</a> · ${escape(x.locator)}</p>`).join('')}
 <p>Fórmula: edad × AST / (plaquetas × √ALT). Umbral inferior 1,3 hasta 65 años; 2,0 por encima de 65. Por debajo de 35 años la precisión es limitada. No confirma MASLD, MASH o cirrosis.</p></details>
 </section>`;
}
function calculatorsForModule(id) {
  if(id==='erc') return renalResultCard();
  if(id==='hepatico') return fib4ResultCard();
  return '';
}

function pharmaLink(card) {
  let info=null;
  if(card.id==='FIN-HF-LABEL') info={drug:'finerenona',route:'ic_fevi40'};
  else if(card.id.startsWith('NSMRA-')) info={drug:'finerenona',route:'erc_dm2'};
  else if(card.id.startsWith('SGLT2-')) {
    const route=draft.values.ic==='Sí'?'ic':draft.values.erc==='Sí'?'erc':'dm2';
    return `<div class="incretin-links">${[
      ['empagliflozina','Jardiance · empagliflozina'],
      ['dapagliflozina','Forxiga · dapagliflozina']
    ].map(([drug,label])=>`<button type="button" class="text-link" data-action="open-drug"
      data-drug-id="${drug}" data-route-id="${route}">Consultar CIMA: ${label} →</button>`).join('')}</div>`;
  }
  else if(card.id.startsWith('MET-')) info={drug:'metformina',route:'dm2'};
  if(['GLP-REVIEW','GLP-EXISTING','WEIGHT-REVIEW','WEIGHT-EXISTING'].includes(card.id)) {
    const candidates=card.id.startsWith('WEIGHT-') ? [
      ['semaglutida_wegovy_sc','peso','Wegovy inyectable · peso'],
      ['tirzepatida','peso','Mounjaro · peso']
    ] : [
      ['semaglutida_ozempic','dm2','Ozempic · DM2'],
      ['semaglutida_wegovy_sc','peso','Wegovy inyectable · peso'],
      ['tirzepatida','dm2','Mounjaro · DM2']
    ];
    return `<div class="incretin-links">${candidates.map(([drug,route,label])=>`<button
      type="button" class="text-link" data-action="open-drug"
      data-drug-id="${drug}" data-route-id="${route}">Consultar CIMA: ${label} →</button>`).join('')}</div>`;
  }
  if(!info) return '';
  return `<button type="button" class="text-link" data-action="open-drug"
    data-drug-id="${info.drug}" data-route-id="${info.route}">Consultar ficha CIMA específica →</button>`;
}
function integratedPlanPanel(){
 const p=buildIntegratedPlan(draft,confirmedHistory);
 const label=id=>p.domains.find(x=>x.id===id)?.title??(id==='historial'?'Historial':id==='farmacologia'?'Tratamiento y controles':'Transversal');
 const jump=d=>d.module?`<button type="button" class="text-link" data-action="start-module" data-module="${escape(d.module)}">Revisar →</button>`:`<button type="button" class="text-link" data-action="${escape(d.action)}">Revisar →</button>`;
 const list=xs=>xs.length?`<ul>${xs.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`:'';
 const priorities=kind=>p.priorities.filter(x=>x.priority===kind);
 const tasks=xs=>xs.map(x=>`<article class="verification-item ${escape(x.priority)}"><h4>${escape(x.title)}</h4><p>${escape(x.detail)}</p><small>${escape(x.domains.map(label).join(' · '))}</small></article>`).join('');
 const controls=xs=>xs.map(x=>`<article class="verification-item"><h4>${escape(label(x.domain))}${x.drugId?' · '+escape(x.drugId):''}</h4>
 <p><strong>${x.from?escape(x.from)+' a '+escape(x.to):x.dueOn?escape(x.dueOn):'Sin fecha fija'}</strong></p><p>${escape(x.description)}</p>
 ${x.temporalStatus==='plazo_superado'?'<p>Plazo pasado: revisar controles ya realizados y necesidades actuales; no se presupone falta de asistencia.</p>':''}
 ${list(x.holdReasons)}<a href="${escape(x.source)}" target="_blank" rel="noopener noreferrer">Fuente del control ↗</a></article>`).join('');
 const activeControls=p.controls.filter(x=>x.status!=='requiere_reevaluacion'),held=p.controls.filter(x=>x.status==='requiere_reevaluacion');
 const routine=p.orientations.filter(x=>x.status==='orientacion_sin_cita'),conditional=p.orientations.filter(x=>x.status!=='orientacion_sin_cita');
 const orientationList=xs=>xs.map(x=>`<p><strong>${escape(label(x.domain))}</strong> · ${escape(x.text)}</p>`).join('');
 return `<section id="integrated-plan" class="verification-panel" aria-label="Plan integral de objetivos y seguimiento"><div class="eyebrow">SÍNTESIS PARA REVISIÓN PROFESIONAL</div>
 <h2>Plan integral de objetivos y seguimiento</h2><p>${p.globalHold?'Resolver primero las alertas de seguridad. Las fechas previas no determinan la urgencia actual.':'Objetivos y plazos reunidos desde los módulos evaluados, con su procedencia.'}</p>
 ${priorities('seguridad').length?`<div class="dm2-safety"><h3>Prioridad clínica</h3>${tasks(priorities('seguridad'))}</div>`:''}
 <h3>Objetivos documentados para revisar</h3>
 ${p.goals.length?p.goals.map(x=>`<article class="verification-item"><h4>${escape(x.title)}</h4><p>${escape(x.detail)}</p>${x.status==='reevaluar_seguridad'?'<p>Aplicación condicionada a resolver la seguridad actual.</p>':''}</article>`).join(''):'<p>No hay objetivos utilizables desde los módulos actuales. No se asignan objetivos universales ni se presume que estén alcanzados.</p>'}
 <h3>Controles derivados de actuaciones confirmadas</h3>
 ${activeControls.length?controls(activeControls):'<p>No se han generado controles nuevos aplicables: revisar confirmaciones, fechas y seguridad.</p>'}
 ${held.length?`<details><summary>Plazos previos que requieren reevaluación (${held.length})</summary>${controls(held)}</details>`:''}
 ${p.coordination.length?`<details><summary>Posible coordinación de controles</summary>${p.coordination.map(x=>`<p>${escape(x.from)} a ${escape(x.to)} · ${escape(x.text)}</p>`).join('')}</details>`:''}
 <h3>Orientaciones sin cita individual</h3>${routine.length?orientationList(routine):'<p>No hay un intervalo individualizable mostrado desde los módulos actuales.</p>'}
 ${conditional.length?`<details><summary>Orientaciones condicionadas a completar la evaluación</summary>${orientationList(conditional)}</details>`:''}
 ${p.referrals.length?`<h3>Valoraciones especializadas propuestas</h3>${list(p.referrals.map(x=>label(x.domain)+': '+x.text+(x.status==='revisar_seguridad_y_urgencia'?' Revisar primero seguridad y urgencia actual.':'')))}`:''}
 <details><summary>Plan de verificación clínica · datos pendientes y próximos pasos (${priorities('completar').length+priorities('revisar').length})</summary>${tasks(priorities('completar'))}${tasks(priorities('revisar'))}
 ${p.priorities.length?'':'<p>Sin comprobaciones pendientes detectadas; esto no equivale a alta clínica.</p>'}</details>
 ${p.cautions.length?`<details><summary>Comprobaciones y cautelas por área</summary>${p.domains.filter(d=>d.active).map(d=>`<h4>${escape(d.title)}</h4>${list(p.cautions.filter(x=>x.domain===d.id).map(x=>x.text))}`).join('')}</details>`:''}
 <details open><summary>Cobertura de la evaluación</summary><p>Las áreas no evaluadas no se consideran normales ni libres de enfermedad. No se requieren pruebas solo para completar esta lista.</p>
 ${p.domains.map(d=>`<p><strong>${escape(d.title)}</strong> · ${!d.active?'No evaluado':d.state==='fuera_de_ambito'?'Circuito específico':d.missingCount?'Datos por completar':'Para revisión profesional'} ${jump(d)}</p>`).join('')}</details>
 ${p.contexts.length?`<details><summary>Contexto de riesgo y CKM</summary>${list(p.contexts.map(x=>x.text))}</details>`:''}
 <details><summary>Fuentes de los módulos evaluados</summary>${p.domains.filter(d=>d.active).map(d=>`<h4>${escape(d.title)}</h4>${d.sources.map(x=>`<p><a href="${escape(x.url)}" target="_blank" rel="noopener noreferrer">${escape(x.title)}</a>${x.locator?' · '+escape(x.locator):''}</p>`).join('')}`).join('')}</details>
 ${p.archivedControls.length?`<details><summary>Referencias históricas sustituidas (${p.archivedControls.length})</summary><p>No se presentan como controles actuales; se conservan en el historial de esta sesión.</p></details>`:''}
 <p class="privacy-note">Actuaciones registradas: ${p.history.acceptedRecords}.${p.history.heldRecords?' Registros históricos por conciliar: '+p.history.heldRecords+'.':''} </p></section>`;
}
function integratedCards(focus = null) {
  const result=integratePatient(draft);
  const match=(card)=>!focus || card.domains.includes(focus) ||
    (focus==='Metabólico' && card.domains.includes('DM2'));
  const groups=[
    {title:'Revisiones de seguridad',cards:result.alerts.filter(match),className:'risk'},
    {title:'Opciones que requieren evaluación médica',cards:result.options.filter(match),className:'candidate'},
    {title:'Contexto y datos pendientes',cards:result.context.filter(match),className:'missing'}
  ];
  const nonempty=groups.filter(x=>x.cards.length>0);
  return `<section class="integration-panel" aria-label="Integración cardiorrenal-hepatometabólica">
    <div class="integration-head"><div><div class="eyebrow">INTEGRACIÓN MULTIORGÁNICA</div>
    <h2>Prioridades para revisión clínica</h2>
    <p>Basadas en antecedentes declarados y datos disponibles. </p>
    </div><span class="integration-status">SIN PRESCRIPCIONES</span></div>
    ${nonempty.length ? nonempty.map(group=>`<div class="integration-group">
      <h3>${escape(group.title)}</h3>
      <div class="integration-list">${group.cards.map(card=>`<article class="integration-card ${group.className}">
        <h4>${escape(card.title)}</h4><p>${escape(card.summary)}</p>
        <strong>Antes de decidir:</strong><ul>${card.checks.map(check=>`<li>${escape(check)}</li>`).join('')}</ul>
        <details><summary>Reglas y fuentes (${card.sources.length})</summary>
        <div class="integration-sources">${card.sources.map(id=>{
          const source=Object.values(INTEGRATION_SOURCES).find(x=>x.id===id);
          return source?`<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.short)} · ${escape(source.section)} ↗</a>`:'';}).join('')}
        </div></details>${pharmaLink(card)}</article>`).join('')}</div></div>`).join('')
      : '<p class="integration-empty">No se han identificado condiciones documentadas para generar candidatos de revisión en este apartado. Esto no descarta enfermedad ni implica ausencia de tratamiento indicado.</p>'}
    <p class="integration-disclaimer">La documentación clínica, las dosis y la idoneidad del principio activo deben verificarse en su ficha CIMA-AEMPS. Las actuaciones reales solo se registrarán con confirmación profesional.</p>
  </section>`;
}
function dm2RapidResult() {
  const r=evaluateDm2Quick(draft);
  const state={
    datos_insuficientes:'Faltan criterios esenciales',
    seguridad_prioritaria:'Prioridad de seguridad',
    revisar_coherencia:'Revisar datos contradictorios',
    revision_pendiente:'Orientación para revisión'
  }[r.state]||'Revisión necesaria';
  const li=items=>items.length?
    `<ul>${items.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`
    :'<p>No se han generado entradas en esta sección.</p>';
  return `<section id="dm2-rapid-result" class="dm2-result" aria-live="polite">
    <div class="eyebrow">DM2 · REDGDPS / ADA 2026</div>
    <h2>Orientación rápida según el caso</h2>
    <strong class="dm2-status ${escape(r.state)}">${escape(state)}</strong>
    <h3>Situación clínica</h3><p>${escape(r.situation)}</p>
    ${r.missing.length?`<div class="dm2-missing"><h3>Datos esenciales pendientes</h3>${li(r.missing)}</div>`:''}
    ${r.safety.length?`<div class="dm2-safety"><h3>Alertas y discrepancias</h3>${li(r.safety)}</div>`:''}
    <h3>Siguiente paso para revisar</h3>${li(r.nextSteps)}
    <h3>Clases farmacológicas y opciones</h3>
    ${r.options.length?`<div class="dm2-options">${r.options.map(x=>`<article>
       <h4>${escape(x.title)}</h4><p>${escape(x.reason)}</p>
       <strong>Comprobaciones antes de decidir:</strong>${li(x.checks)}
    </article>`).join('')}</div>`
     :'<p>No se ofrecen candidatos de inicio con los datos actuales; completar o revisar la evaluación.</p>'}
    <h3>Datos por contrastar</h3>${li(r.checks)}
    <h3>Reevaluación</h3><p>${escape(r.followUp)}</p>
    <details class="dm2-sources"><summary>Fuentes verificadas para esta orientación</summary>
      <ul>${r.sourceIds.map(id=>Object.values(r.sources).find(x=>x.id===id)).filter(Boolean).map(x=>
        `<li><a target="_blank" rel="noopener noreferrer" href="${escape(x.url)}">${escape(x.name)}</a>
        <small> · ${escape(x.detail)}</small></li>`).join('')}</ul>
    </details>
    
  </section>`;
}
function dm2DetailedResult() {
  const result=evaluateDm2Detail(draft);
  const labels={
    revision_pendiente:'Orientación detallada para revisión',
    datos_insuficientes:'Datos necesarios pendientes',
    seguridad_prioritaria:'Seguridad clínica prioritaria',
    revisar_coherencia:'Incoherencias pendientes de conciliación'
  };
  const li=values=>values.length
    ?`<ul>${values.map(value=>`<li>${escape(value)}</li>`).join('')}</ul>`
    :'<p>Sin elementos registrados en esta sección.</p>';
  const goal=result.objective;
  const comparison=goal.comparison;
  const numberText=number=>number===null?'No registrado':number.toLocaleString('es-ES',{maximumFractionDigits:2});
  return `<section id="dm2-detailed-result" class="dm2-result dm2-detailed" aria-live="polite">
    <div class="eyebrow">DM2 DETALLADA · REDGDPS / ADA 2026</div>
    <h2>Interpretación del objetivo individual</h2>
    <strong class="dm2-status ${escape(result.state)}">${escape(labels[result.state]||'Revisión pendiente')}</strong>
    <div class="dm2-detail-metrics">
      <div><small>HbA1c aportada</small><strong>${escape(numberText(goal.hba1c))}${goal.hba1c!==null?' %':''}</strong></div>
      <div><small>Objetivo individual: HbA1c inferior a</small><strong>${escape(numberText(goal.limit))}${goal.limit!==null?' %':''}</strong></div>
      <div><small>Diferencia respecto al límite</small><strong>${comparison
        ?escape((comparison.difference>0?'+':'')+numberText(comparison.difference)+' puntos')
        :'No evaluable'}</strong></div>
    </div>
    <p>${escape(goal.message)} Es un objetivo declarado por el profesional, no calculado por la aplicación.</p>
    <h3>Situación</h3><p>${escape(result.situation)}</p>
    ${result.alerts.length?`<div class="dm2-safety"><h3>Alertas y contradicciones</h3>${li(result.alerts)}</div>`:''}
    ${result.missing.length?`<div class="dm2-missing"><h3>Datos esenciales pendientes</h3>${li(result.missing)}</div>`:''}
    <h3>Conciliación del tratamiento</h3>
    <p>Clases glucémicas registradas: ${result.medicationSummary.count}.
      Dosis confirmadas: ${result.medicationSummary.dosesConfirmed?'Sí':'No'}.
      Adherencia: ${escape(result.medicationSummary.adherence||'No valorada')}.</p>
    <p>${result.medicationSummary.classes.length
      ?escape(result.medicationSummary.classes.join(' · '))
      :'No se han identificado clases glucémicas; esto no significa ausencia de tratamiento.'}</p>
    <h3>Siguientes pasos</h3>${li(result.nextSteps)}
    <h3>Opciones condicionadas a revisión</h3>
    ${result.alternatives.length?`<div class="dm2-options">${result.alternatives.map(option=>
      `<article><h4>${escape(option.title)}</h4><p>${escape(option.reason)}</p>
       <strong>Antes de decidir</strong>${li(option.conditions)}</article>`).join('')}</div>`
      :'<p>No se emiten propuestas farmacológicas con los datos actuales; revisar las alertas y la información pendiente.</p>'}
    <h3>Comprobaciones restantes</h3>${li(result.checks)}
    <h3>Seguimiento</h3><p>${escape(result.followUp)}</p>
    <details class="dm2-sources"><summary>Guías y fichas de referencia</summary><ul>
      ${Object.values(result.sources).map(source=>
        `<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.name)}</a>
        <small> · ${escape(source.detail)}</small></li>`).join('')}
    </ul></details>
    
  </section>`;
}
function insulinResult(mode) {
  const result=evaluateInsulinization(draft,mode);
  const stateLabels={
    revision_pendiente:'Orientación para revisión',
    datos_insuficientes:'Información pendiente',
    seguridad_prioritaria:'Prioridad clínica de seguridad',
    revisar_coherencia:'Conciliar información contradictoria'
  };
  const li=items=>items.length
    ?`<ul>${items.map(v=>`<li>${escape(v)}</li>`).join('')}</ul>`
    :'<p>No se han registrado elementos en esta sección.</p>';
  const r=result.glycemicPattern;
  return `<section id="insulin-result" class="dm2-result insulin-result" aria-live="polite">
    <div class="eyebrow">INSULINIZACIÓN DM2 · ADA/EASD 2026</div>
    <h2>${escape(result.phase||'Seleccionar el circuito de insulinización')}</h2>
    <strong class="dm2-status ${escape(result.state)}">${escape(stateLabels[result.state]||'Revisión')}</strong>
    <p>${escape(result.summary)}</p>
    ${mode==='detail'?`<div class="dm2-detail-metrics">
      <div><small>Ayunas respecto al objetivo</small><strong>${escape(r.fastingStatus||'No valorado')}</strong></div>
      <div><small>Patrón posprandial</small><strong>${escape(r.postmeal||'No valorado')}</strong></div>
      <div><small>Insulina basal actual</small><strong>${r.basalUnits===null?'No registrada':escape(r.basalUnits)+' U/día'}</strong></div>
    </div>`:''}
    ${result.alerts.length?`<div class="dm2-safety"><h3>Alertas de seguridad</h3>${li(result.alerts)}</div>`:''}
    ${result.missing.length?`<div class="dm2-missing"><h3>Información necesaria</h3>${li(result.missing)}</div>`:''}
    <h3>Próximas comprobaciones</h3>${li(result.nextSteps)}
    <h3>Alternativas para valoración profesional</h3>
    ${result.options.length?`<div class="dm2-options">${result.options.map(o=>
      `<article><h4>${escape(o.title)}</h4><p>${escape(o.rationale)}</p>
       <strong>Antes de decidir</strong>${li(o.checks)}</article>`).join('')}</div>`
      :'<p>No se propone iniciar, ajustar ni retirar insulina con los datos disponibles.</p>'}
    <h3>Seguridad y educación terapéutica</h3>${li(result.checks)}
    <h3>Seguimiento</h3><p>${escape(result.followUp)}</p>
    <details class="dm2-sources"><summary>Guías y ficha técnica</summary><ul>
      ${Object.values(result.sources).map(x=>`<li>
        <a href="${escape(x.url)}" target="_blank" rel="noopener noreferrer">${escape(x.name)}</a>
        <small> · ${escape(x.detail)}</small></li>`).join('')}
    </ul></details>
    
  </section>`;
}
function heartFailureResult(mode){
  const r=evaluateHeartFailure(draft,mode);
  const labels={
    revision_pendiente:'Orientación para revisión',
    datos_insuficientes:'Información clínica pendiente',
    seguridad_prioritaria:'Evaluación prioritaria de seguridad',
    revisar_coherencia:'Reconciliar datos contradictorios'
  };
  const list=entries=>entries.length
    ?`<ul>${entries.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`
    :'<p>No se han identificado elementos en esta sección.</p>';
  return `<section id="ic-result" class="dm2-result ic-result" aria-live="polite">
    <div class="eyebrow">INSUFICIENCIA CARDÍACA · ESC 2026</div>
    <h2>Valoración por fenotipo y congestión</h2>
    <strong class="dm2-status ${escape(r.state)}">${escape(labels[r.state]||'Revisión')}</strong>
    <div class="dm2-detail-metrics">
      <div><small>Fenotipo según datos aportados</small><strong>${escape(r.phenotype.label)}</strong></div>
      <div><small>Situación</small><strong>${escape(r.situation)}</strong></div>
    </div>
    ${r.alerts.length?`<div class="dm2-safety"><h3>Alertas y discrepancias</h3>${list(r.alerts)}</div>`:''}
    ${r.missing.length?`<div class="dm2-missing"><h3>Datos clínicos necesarios</h3>${list(r.missing)}</div>`:''}
    <h3>Conducta para revisión profesional</h3>${list(r.steps)}
    <h3>Clases y actuaciones a considerar</h3>
    ${r.options.length?`<div class="dm2-options">${r.options.map(x=>
       `<article><h4>${escape(x.title)}</h4><p>${escape(x.reason)}</p>
        <strong>Antes de decidir</strong>${list(x.checks)}
        ${x.id==='HF-FINERENONE-CIMA-REVIEW'
          ?'<button type="button" class="text-link" data-action="open-drug" data-drug-id="finerenona" data-route-id="ic_fevi40">Comprobar ficha CIMA de finerenona para IC →</button>'
          :''}</article>`).join('')}</div>`
      :'<p>Sin candidatos de inicio: completar diagnóstico, estabilidad y seguridad antes de valorar tratamientos.</p>'}
    <h3>Comprobaciones</h3>${list(r.checks)}
    <h3>Reevaluación</h3><p>${escape(r.followUp)}</p>
    <details class="dm2-sources"><summary>Fuentes ESC y fichas CIMA</summary><ul>
      ${Object.values(r.sources).map(x=>`<li><a href="${escape(x.url)}"
        target="_blank" rel="noopener noreferrer">${escape(x.name)}</a>
        <small> · ${escape(x.detail)}</small></li>`).join('')}
    </ul></details>
    <p>La FEVI aislada no diagnostica IC.</p>
  </section>`;
}
function kidneyResult(mode){
  const r=evaluateKidney(draft,mode);
  const list=xs=>xs.length?`<ul>${xs.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`:'<p>Sin elementos registrados.</p>';
  return `<section id="renal-result" class="dm2-result" aria-live="polite">
    <div class="eyebrow">ERC · KDIGO 2024 · REVISIÓN PROFESIONAL</div>
    <h2>Seguridad, seguimiento y derivación renal</h2>
    <p>${escape(r.classification.message)}</p>
    ${r.alerts.length?`<div class="dm2-safety"><h3>Prioridad de seguridad</h3>${list(r.alerts)}</div>`:''}
    ${r.missing.length?`<div class="dm2-missing"><h3>Información pendiente</h3>${list(r.missing)}</div>`:''}
    <h3>Próximos pasos</h3>${list(r.steps)}
    <h3>Valoración por Nefrología</h3>${r.referral.length?list(r.referral.map(x=>x.text)):'<p>Sin criterio automático mostrado; esto no descarta necesidad de derivación.</p>'}
    <h3>Comprobaciones</h3>${list(r.checks)}
    <h3>Seguimiento</h3><p>${escape(r.followUp)}</p>
    <section class="renal-treatment" aria-label="Revisión de IECA o ARA-II">
      <h3>IECA/ARA-II actual: controles tras cambios confirmados</h3>
      ${r.treatment.alerts.length?`<div class="dm2-safety">${list(r.treatment.alerts)}</div>`:''}
      ${r.treatment.missing.length?list(r.treatment.missing):''}
      ${list(r.treatment.checks)}
      ${r.treatment.creatinineChange?`<p>Variación de creatinina respecto a la referencia previa: <strong>${escape(r.treatment.creatinineChange.percent.toFixed(1))} %</strong>. No implica un cambio de dosis.</p>`:''}
      ${r.treatment.window?`<p>Ventana orientativa: <strong>${escape(r.treatment.window.from)} a ${escape(r.treatment.window.to)}</strong>. ${r.treatment.window.status==='plazo_superado'?'Plazo superado: revisar controles pendientes.':'Individualizar según función renal y potasio.'} No se ha creado ninguna cita.</p>`:''}
    </section>
    <details><summary>Fuente y reglas</summary>${r.sources.map(x=>`<p><a href="${escape(x.url)}" target="_blank" rel="noopener noreferrer">${escape(x.title)}</a> · ${escape(x.locator)}</p>`).join('')}</details>
    
  </section>`;
}
function treatmentReferences(moduleId){
 const entries={dm2:[['metformina','dm2'],['empagliflozina','dm2'],['dapagliflozina','dm2'],['semaglutida_ozempic','dm2'],['tirzepatida','dm2']],ic:[['empagliflozina','ic'],['dapagliflozina','ic'],['finerenona','ic_fevi40']],erc:[['empagliflozina','erc'],['dapagliflozina','erc'],['finerenona','erc_dm2']],obesidad:[['semaglutida_wegovy_sc','peso'],['tirzepatida','peso']]};
 const refs=entries[moduleId]??[];
 return `<section class="treatment-access"><h2>Tratamiento y dosis de referencia</h2><p>${refs.length?'Pautas CIMA por indicación, con dosis y ajustes.':'No hay una pauta farmacológica individual disponible en este módulo.'}</p>
 ${refs.map(([id,route])=>{const d=getDrug(id),r=getDrugRoute(id,route);return `<button type="button" class="ghost" data-action="open-drug" data-drug-id="${id}" data-route-id="${route}">${escape(d.generic)} · ${escape(d.exampleBrand)} · dosis y seguridad →</button>`}).join('')}</section>`;
}
function directedFieldsMarkup(module,fields,mode){
 const initial={obesidad:['edad','imc','peso','talla','dm2','ob_farmaco_actual'],hepatico:['edad','masld_fib4_origen','fib4_informado','masld_alarma']}[module.id];
 if(mode==='quick'&&initial){const elasto=['elastografia','masld_elasto_metodo','masld_fecha_elasto','masld_elasto_calidad','masld_elasto_confusores'];const rest=fields.filter(id=>!initial.includes(id)&&!(module.id==='hepatico'&&elasto.includes(id)));return initial.map(id=>moduleFieldMarkup(FIELDS[id])).join('')+`<details class="progressive-fields"><summary>Completar seguridad y contexto (${rest.length} datos)</summary><p>Se necesitan para decisiones específicas; puedes consultar primero la orientación disponible.</p><div class="field-grid">${rest.map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div></details>`+(module.id==='hepatico'?`<details class="progressive-fields"><summary>Elastografía disponible (opcional)</summary><div class="field-grid">${elasto.map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div></details>`:'');}
 if(mode==='detail'&&!['obesidad','hepatico'].includes(module.id)){const initial=module.quick;return initial.map(id=>moduleFieldMarkup(FIELDS[id])).join('')+`<details class="progressive-fields"><summary>Datos para valorar tratamiento y seguimiento</summary><div class="field-grid">${fields.filter(id=>!initial.includes(id)).map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div></details>`;}
 return module.id==='obesidad'?obesityFieldsMarkup(fields,mode):fields.map(id=>moduleFieldMarkup(FIELDS[id])).join('');
}
function consultationReview(module) {
  const fields = [...new Set([...module.quick,...module.detail])];
  const missing = fields.filter(id => fieldState(draft,id) === 'sin_registrar');
  const invalid = fields.filter(id => fieldState(draft,id) === 'revisar');
  return `<div class="module-review">
    <details class="capture-details"><summary>Resumen de captura · ${escape(module.title)}</summary>
    <p>Información aportada en esta sesión. No constituye valoración diagnóstica ni terapéutica.</p>
    <div class="review-list">${fields.map(id=>{
      const f=FIELDS[id],state=fieldState(draft,id);
      const value = state==='registrado' || state==='revisar'
        ? (f.type==='multi' ? readMulti(draft.values[id]).join(' · ') : draft.values[id]) +
          (f.unit ? ` ${f.unit}` : '')
        : statusLabel(state);
      return `<div class="review-row"><span>${escape(f.label)}</span>
        <strong class="${state}">${escape(value)}</strong></div>`;
    }).join('')}</div>
    </details>
    ${calculatorsForModule(module.id)}
    ${module.id==='dm2'?dm2RapidResult()+dm2DetailedResult():''}
    ${module.id==='insulina'?insulinResult('detail'):''}
    ${module.id==='ic'?heartFailureResult('detail'):''}
    ${module.id==='erc'?kidneyResult('detail'):''}
    ${module.id==='obesidad'?obesityResult('detail'):''}
    ${integratedCards(({dm2:'DM2',ic:'IC',erc:'Renal',obesidad:'Metabólico',hepatico:'Hepático',insulina:'DM2'})[module.id])}
    <div class="wizard-actions"><button type="button" class="ghost" data-action="module-mode" data-mode="quick">Volver a consulta</button>
      <button class="primary" type="button" data-action="summary">Ver ficha integral →</button></div>
  </div>`;
}
const BRIEF_RESULT_IDS={dm2:'dm2-rapid-result',ic:'ic-result',erc:'renal-result',obesidad:'obesity-result',hepatico:'masld-result',insulina:'insulin-result',hta:'hta-result',lipids:'lipid-result'};
const BRIEF_ACTIONS={dm2:'dm2-result',ic:'ic-result',erc:'renal-result',obesidad:'obesity-result',hepatico:'masld-result',insulina:'insulin-result',hta:'hta-result',lipids:'lipid-result'};
const BRIEF_BUTTONS={dm2:'Ver orientación clínica rápida',ic:'Ver orientación de insuficiencia cardíaca',erc:'Ver orientación renal',obesidad:'Ver plan de obesidad y seguimiento',hepatico:'Ver evaluación de fibrosis y derivación',insulina:'Ver orientación de insulinización',hta:'Ver orientación de PA e HTA',lipids:'Ver orientación de dislipemia'};
function briefResult(id){
 const r=evaluateClinicalBrief(draft,id),list=xs=>xs.length?`<ul>${xs.map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`:'';
 return `<section id="${BRIEF_RESULT_IDS[id]}" class="dm2-result brief-result" aria-live="polite"><h2>${escape(r.title)}</h2>
 ${r.safety.length?`<div class="dm2-safety"><h3>Prioridad clínica</h3>${list(r.safety)}</div>`:''}<p class="brief-conduct">${escape(r.situation)}</p>
 ${r.treatment.length?'<h3>Tratamiento a considerar</h3>'+r.treatment.map(x=>`<article><h4>${escape(x.title)}</h4><p>${escape(x.detail)}</p></article>`).join(''):''}
 ${r.steps.length?`<h3>Siguiente paso</h3>${list(r.steps)}`:''}
 ${r.missing.length?`<p>Para precisar esta rama: ${r.missing.map(escape).join(' · ')}.</p>`:''}
 <details><summary>Fuentes</summary>${r.sources.map(x=>`<p><a href="${escape(x.url)}" target="_blank" rel="noopener noreferrer">${escape(x.title)}</a></p>`).join('')}</details></section>`;
}
function briefModuleView(m){
 const fields=BRIEF_FIELDS[m.id],r=evaluateClinicalBrief(draft,m.id),complete=fields.every(id=>fieldState(draft,id)==='registrado');
 const forced=current.briefForced||({dm2:current.dm2ResultVisible,ic:current.icVisible,erc:current.renalVisible,obesidad:current.obesityVisible,hepatico:current.masldVisible,insulina:current.insulinVisible})[m.id];
 const show=complete||forced||r.safety.length;
 return `<div class="page module-page"><div class="bread"><button type="button" data-action="home">Inicio</button><span>${escape(m.title)}</span></div><h1>${escape(m.title)}</h1>
 <div class="module-tabs" role="group" aria-label="Nivel de revisión"><button type="button" class="active" data-action="module-mode" data-mode="quick" aria-pressed="true">Consulta rápida</button><button type="button" data-action="module-mode" data-mode="detail" aria-pressed="false">Revisión detallada · opcional</button><button type="button" data-action="module-mode" data-mode="review" aria-pressed="false">Resumen</button></div>
 <section class="form-card"><div class="field-grid">${fields.map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div><button type="button" class="primary" data-action="${BRIEF_ACTIONS[m.id]}">${BRIEF_BUTTONS[m.id]} →</button></section>
 ${show?briefResult(m.id):'<p class="quick-empty">Selecciona los criterios para ver la orientación.</p>'}
 ${['dm2','ic','erc','obesidad'].includes(m.id)?`<details class="brief-drugs"><summary>Dosis y ajustes por medicamento</summary>${treatmentReferences(m.id)}</details>`:''}
 <button type="button" class="text-link" data-action="module-mode" data-mode="detail">Concretar tratamiento o seguimiento →</button></div>`;
}
function moduleView() {
  const m=MODULE_BY_ID[current.module];
  if (!m) return home();
  const mode=current.mode || 'quick';
  if(mode==='quick')return briefModuleView(m);
  const fields=moduleFields(m.id, mode === 'detail' ? 'detail' : 'quick');
  const completed=fields.filter(id => fieldState(draft,id)==='registrado').length;
  return `<div class="page module-page">
    <div class="bread"><button data-action="home" type="button">Inicio</button><span>›</span><span>${escape(m.title)}</span></div>
    <div class="module-title"><span class="module-icon"><img src="./public/domain-${escape(m.domain)}.svg" alt="" /></span>
      <div><div class="eyebrow">CONSULTA DIRIGIDA · CAPTURA</div><h1>${escape(m.title)}</h1><p>${escape(m.short)}</p></div></div>
    ${banner()}
    <div class="module-tabs" role="group" aria-label="Nivel de revisión">
      ${[['quick','Consulta rápida'],['detail','Revisión detallada'],['review','Resumen']].map(([id,name])=>
       `<button type="button" data-action="module-mode" data-mode="${id}" class="${mode===id?'active':''}" aria-pressed="${mode===id}">${name}</button>`).join('')}
    </div>
    ${mode!=='review'?`<div class="consultation-actions"><button class="primary" type="button" data-action="module-outcome">Ver orientación y tratamiento →</button><p>Puedes continuar con datos parciales. El resultado señalará qué falta para decidir.</p></div>`:''}
    ${treatmentReferences(m.id)}
    ${mode==='review' ? consultationReview(m) : `<section class="form-card">
      <div class="form-title"><div><h2>${mode==='quick'?'Datos esenciales':'Datos clínicos detallados'}</h2>
        <p>La información se comparte con los demás módulos y la evaluación integral.</p></div>
        <span class="count-pill" id="section-count">${completed} de ${fields.length} registrados</span></div>
      <div class="field-grid">${directedFieldsMarkup(m,fields,mode)}</div>
      <div class="wizard-actions">
        <button type="button" class="ghost" data-action="module-mode" data-mode="${mode==='quick'?'detail':'quick'}">${mode==='quick'?'Revisión detallada':'Consulta rápida'}</button>
        <button type="button" class="primary" data-action="module-mode" data-mode="review">Ver resumen de datos →</button>
      </div>
    </section>`}
    ${m.id==='obesidad' && (mode==='quick'||mode==='detail')?`<div class="dm2-result-trigger"><button type="button" class="primary" data-action="obesity-result">Ver plan de obesidad y seguimiento →</button><p>Objetivos, tratamiento y seguimiento.</p></div>${current.obesityVisible?obesityResult(mode):''}`:''}
    ${m.id==='hepatico' && (mode==='quick'||mode==='detail')?`<div class="dm2-result-trigger">
      <button class="primary" type="button" data-action="masld-result">Ver evaluación de fibrosis y derivación →</button>
      <p>FIB-4 con procedencia y elastografía según método. Sin diagnóstico automático.</p>
    </div>${current.masldVisible?fib4ResultCard():''}`:''}
    ${m.id==='erc' && (mode==='quick'||mode==='detail')?`<div class="dm2-result-trigger">
      <button class="primary" type="button" data-action="renal-result">Ver orientación renal →</button>
      <p>Cronicidad, seguridad y derivación.</p>
    </div>${current.renalVisible?kidneyResult(mode):''}`:''}
    ${m.id==='ic' && (mode==='quick'||mode==='detail')?`<div class="dm2-result-trigger">
      <button class="primary" type="button" data-action="ic-result">Ver orientación de insuficiencia cardíaca →</button>
      <p>FEVI y congestión según ESC 2026.</p>
    </div>${current.icVisible?heartFailureResult(mode):''}`:''}
    ${m.id==='insulina' && (mode==='quick'||mode==='detail')?`<div class="dm2-result-trigger">
      <button class="primary" type="button" data-action="insulin-result">Ver orientación de insulinización →</button>
      <p>Inicio, intensificación o desintensificación.</p>
    </div>${current.insulinVisible?insulinResult(mode):''}`:''}
    ${m.id==='dm2' && mode==='detail'?`<div class="dm2-result-trigger">
      <button class="primary" type="button" data-action="dm2-detailed-result">Ver orientación clínica detallada →</button>
      <p>Comparación con objetivo individual, conciliación y seguridad antes de valorar alternativas.</p>
    </div>${current.dm2DetailedVisible?dm2DetailedResult():''}`:''}
    ${m.id==='dm2' && mode==='quick'?`<div class="dm2-result-trigger">
      <button class="primary" type="button" data-action="dm2-result">Ver orientación clínica rápida →</button>
      <p>Orientación según los datos disponibles.</p>
    </div>${current.dm2ResultVisible?dm2RapidResult():''}`:''}
    <p class="privacy-note">No introduzcas identificadores del paciente. Los datos no se guardan después de cerrar o recargar.</p>
  </div>`;
}
function fieldMarkup(f) {
  const unavailable = draft.unavailable.includes(f.id);
  const value = draft.values[f.id] ?? '';
  let control = '';
  if (f.type === 'select') {
    control = `<select id="f-${f.id}" data-field="${f.id}" ${unavailable ? 'disabled' : ''}>
      <option value="">Selecciona una opción</option>${f.options.map(x =>
      `<option value="${escape(x)}" ${value === x ? 'selected' : ''}>${escape(x)}</option>`).join('')}</select>`;
  } else if (f.type === 'textarea') {
    control = `<textarea id="f-${f.id}" data-field="${f.id}" rows="3" placeholder="Sin registrar" ${unavailable ? 'disabled' : ''}>${escape(value)}</textarea>`;
  } else if (f.type === 'date') {
    control = `<input id="f-${f.id}" data-field="${f.id}" type="date"
      value="${escape(value)}" ${unavailable?'disabled':''}/>`;
  } else {
    control = `<div class="input-unit"><input id="f-${f.id}" data-field="${f.id}" type="number" step="${f.integer ? '1' : 'any'}" min="${f.min ?? '0'}" ${f.max ? `max="${f.max}"` : ''}
      inputmode="decimal" value="${escape(value)}" placeholder="Sin registrar" ${unavailable ? 'disabled' : ''} />${f.unit ? `<span>${escape(f.unit)}</span>` : ''}</div>`;
  }
  return `<div class="field"><div class="field-head"><label for="f-${f.id}">${escape(f.label)}</label>
    <button type="button" class="availability ${unavailable ? 'selected' : ''}" data-action="unavailable" data-field-id="${f.id}" aria-pressed="${unavailable}">${unavailable ? 'No disponible ✓' : 'Marcar no disponible'}</button></div>
    ${control}</div>`;
}
function evaluation() {
  const section = SECTIONS[current.step];
  const stats = sectionStats(draft, section);
  return `<div class="page evaluation">
    <div class="bread"><button type="button" data-action="home">Inicio</button><span>›</span><span>Evaluación ${current.focus === 'integral' ? 'integral' : 'dirigida'}</span></div>
    <div class="wizard-top"><div><div class="eyebrow">CAPTURA DE INFORMACIÓN</div>
      <h1>${escape(section.title)}</h1><p>${escape(section.intro)}</p></div>
      <span class="step-count">Paso ${current.step + 1} de ${SECTIONS.length}</span></div>
    <div class="stepper" aria-label="Progreso de las secciones">${SECTIONS.map((s,i) => `<button type="button" class="${i === current.step ? 'current' : ''} ${sectionStats(draft,s).registrado > 0 ? 'has-data' : ''}"
    data-action="go-step" data-step="${i}" title="${escape(s.title)}" aria-label="Ir a ${escape(s.title)}" ${i === current.step ? 'aria-current="step"' : ''}><span></span></button>`).join('')}</div>
    ${banner()}
    <div class="wizard-layout"><aside class="step-list"><div class="sidebar-title">Apartados</div>${SECTIONS.map((s,i) =>
      `<button class="${i === current.step ? 'active' : ''}" type="button" data-action="go-step" data-step="${i}">
      <span class="step-num">${String(i + 1).padStart(2,'0')}</span>${escape(s.title)}</button>`).join('')}</aside>
      <section class="form-card" aria-label="Datos de ${escape(section.title)}">
      <div class="form-title"><div><h2>${escape(section.title)}</h2><p>Completa los datos disponibles.</p></div>
      <span class="count-pill" id="section-count">${stats.registrado} registrados</span></div>
      <div class="field-grid">${section.fields.map(fieldMarkup).join('')}</div>
      <div class="wizard-actions"><button type="button" class="ghost" data-action="prev" ${current.step === 0 ? 'disabled' : ''}>← Anterior</button>
      <button type="button" class="primary" data-action="${current.step === SECTIONS.length - 1 ? 'summary' : 'next'}">${current.step === SECTIONS.length - 1 ? 'Ver resumen' : 'Siguiente →'}</button></div>
      <button type="button" class="quiet-link" data-action="summary">Ver resumen en cualquier momento</button>
      </section></div>
    <p class="privacy-note">No introduzcas nombres, documentos identificativos ni números de historia clínica.</p></div>`;
}
function statusLabel(status) {
  return ({ registrado: 'Registrado', no_disponible: 'No disponible', sin_registrar: 'Sin registrar', revisar: 'Revisar' })[status];
}
function summary() {
  const stats = counts();
  return `<div class="page summary"><div class="bread"><button data-action="home">Inicio</button><span>›</span><span>Resumen</span></div>
    <div class="summary-head"><div><div class="eyebrow">SÍNTESIS DE CAPTURA</div><h1>Datos de la evaluación</h1>
    <p>Datos disponibles y resultados de los módulos evaluados, para revisión profesional.</p></div>
    <button class="ghost" type="button" data-action="new">Nueva evaluación</button></div>
    ${banner()}

    ${integratedPlanPanel()}
    <details class="capture-details"><summary>Ficha compartida · datos registrados</summary><div class="summary-grid">${SECTIONS.map((s,i) =>
      `<section class="summary-card"><div class="summary-card-head"><h2>${escape(s.title)}</h2>
        <button type="button" class="text-link" data-action="go-step" data-step="${i}">Editar →</button></div>
        <dl>${s.fields.map(f => {
          const state = fieldState(draft, f.id);
          const content = state === 'registrado' || state === 'revisar'
            ? escape(draft.values[f.id]) + (f.unit ? ' ' + escape(f.unit) : '') : statusLabel(state);
          return `<div><dt>${escape(f.label)}</dt><dd class="${state}">${content}</dd></div>`;
        }).join('')}</dl></section>`).join('')}</div></details>
    ${obesitySummaryCard()}
    ${lipidSummaryCard()}
    ${htaSummaryCard()}
    ${ckmSummaryCard()}
    <section class="calc-card"><h2>Riesgo cardiovascular</h2>
      <p>${evaluateCvRisk(draft).externalEstimate?'SCORE2-OP externo documentado: revisar procedencia y contexto.':evaluateCvRisk(draft).percent===null?'Sin porcentaje disponible: revisar elegibilidad, circuito y datos.':'SCORE2: '+escape(evaluateCvRisk(draft).percent.toFixed(1))+' % a 10 años; pendiente de revisión clínica.'}</p>
      <button type="button" class="text-link" data-action="cv-risk">Ver evaluación y fuentes →</button></section>
    <div class="calc-stack">${renalResultCard()}${fib4ResultCard()}</div>
    
    ${integratedCards()}
    <div class="clinical-lock"><strong>Prescripción automática desactivada</strong>
      <p>Las categorías renales y el FIB-4 son indicadores descriptivos. No confirman diagnósticos ni generan tratamientos, ni descartan enfermedad por sí solos.</p></div>
    <div class="summary-actions"><button type="button" class="ghost" data-action="go-step" data-step="0">Volver a editar</button>
      <button type="button" class="primary" data-action="new">Finalizar y borrar datos</button></div></div>`;
}
function currentContinuityFields() {
  return current.drug==='finerenona'
    ? ['fecha_evaluacion','fin_estado','fin_dosis_actual','potasio','fecha_potasio','tfge','fecha_tfge','fin_tfge_previa',
      ...(current.route==='ic_fevi40'?['fin_tfge_inicio']:[])]
    : ['fecha_evaluacion','emp_estado','emp_dosis_actual','tfge','fecha_tfge','situacion_aguda','cetoacidosis_sospecha',
       'emp_cetonas','emp_estable','emp_dka_previa','emp_factor_resuelto',
       ...(current.route==='dm2'?['emp_control_insuficiente','emp_tolerancia']:[])];
}
function continuityPanel() {
  const report=current.drug==='finerenona'
    ? reviewFinerenoneContinuation(draft,current.route)
    : reviewEmpagliflozinContinuation(draft,current.route);
  const labels={alerta:'Alerta de seguridad',precaucion:'Revisión prioritaria',
    datos_insuficientes:'Datos insuficientes',referencia:'Referencia de ficha técnica',
    revision_contextual:'Reevaluación requerida'};
  const fieldItems=currentContinuityFields();
  return `<section class="drug-card" id="continuidad">
    <div class="eyebrow">CONTINUIDAD Y TITULACIÓN · FICHA CIMA</div>
    <h2>Reevaluación del tratamiento en curso</h2>
    <p>Indica únicamente medicación realmente administrada y resultados analíticos disponibles.
       Esta revisión es orientativa y no modifica ninguna pauta.</p>
    <div class="field-grid continuity-fields">${fieldItems.map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div>
    <button type="button" class="ghost continuity-recalc" data-action="refresh">Actualizar evaluación →</button>
    <div class="continuity-result ${escape(report.state)}">
      <span class="continuity-status">${escape(labels[report.state]||report.state)}</span>
      <h3>${escape(report.title)}</h3>
      <p>${escape(report.guidance)}</p>
      ${report.missing.length ? `<strong>Información necesaria</strong><ul>${report.missing.map(t=>`<li>${escape(t)}</li>`).join('')}</ul>`:''}
      ${report.cautions.length ? `<strong>Precauciones</strong><ul>${report.cautions.map(t=>`<li>${escape(t)}</li>`).join('')}</ul>`:''}
      <small>Regla: ${escape(report.ruleId)} · ${escape(report.source.reference)}</small>
    </div>
    <button type="button" class="primary" data-action="followup">Registrar actuación realizada / ver seguimiento →</button>
  </section>`;
}
function followupPage() {
  if(!['empagliflozina','finerenona'].includes(current.drug))
    return `<div class="page interior"><h1>Seguimiento farmacológico</h1>
      ${banner()}<section class="drug-card"><p>Este módulo aún no tiene un calendario
      validado para la presentación seleccionada. No se registrarán actuaciones ni fechas inventadas.</p>
      <button type="button" class="ghost" data-action="tools">Volver a Herramientas</button>
      </section></div>`;
  const drug=getDrug(current.drug),route=getDrugRoute(current.drug,current.route);
  const plan=buildIntegratedPlan(draft,confirmedHistory);
  const events=[...plan.controls.filter(x=>x.domain==='farmacologia'),...plan.archivedControls];
  const last=confirmedHistory.filter(e=>e.drugId===current.drug && e.routeId===current.route);
  const actionName={inicio:'Inicio',reinicio:'Reinicio',ajuste:'Modificación de dosis',interrupcion:'Interrupción'};
  return `<div class="page interior">
    <div class="bread"><button type="button" data-action="tools">Herramientas</button><span>›</span><span>Seguimiento</span></div>
    <div class="eyebrow">REGISTRO EFECTIVAMENTE CONFIRMADO</div>
    <h1>Seguimiento farmacológico</h1>
    <p>El calendario se genera exclusivamente cuando confirmas una actuación que ya se ha realizado. No crea avisos automáticos ni envía datos.</p>
    ${banner()}
    <section class="drug-card">
      <h2>Registrar una actuación realizada</h2>
      <p>Medicamento: <strong>${escape(drug.generic)}</strong>; indicación: <strong>${escape(route.name)}</strong>.</p>
      <div class="followup-form">
        <div><label for="action-type">Actuación ya realizada</label>
        <select id="action-type"><option value="inicio">Inicio</option><option value="reinicio">Reinicio</option>
        <option value="ajuste">Modificación de dosis</option><option value="interrupcion">Interrupción</option></select></div>
        <div><label for="action-date">Fecha efectiva</label><input id="action-date" type="date" required /></div>
        <div><label for="action-dose">Dosis realmente administrada tras esta actuación (mg/día)</label>
          <select id="action-dose"><option value="">Seleccionar (no procede si interrupción)</option>
          ${(current.drug==='finerenona'?[10,20,40]:[10,25]).map(n=>`<option value="${n}">${n} mg/día</option>`).join('')}</select></div>
      </div>
      <label class="confirm-check"><input type="checkbox" id="action-confirm" />
        Confirmo que esta actuación realmente se realizó. No es una recomendación de la aplicación.</label>
      ${followupError ? `<p class="form-error" role="alert">${escape(followupError)}</p>`:''}
      <button type="button" class="primary" data-action="confirm-med-action">Registrar actuación confirmada</button>
    </section>
    <section class="drug-card"><h2>Registro de esta indicación</h2>
      ${last.length ? `<ul class="history-list">${last.map(x=>`<li><strong>${escape(x.performedOn)}</strong> · ${escape(actionName[x.type])} ${x.doseMg===null?'': '· '+escape(x.doseMg)+' mg/día'} · confirmado</li>`).join('')}</ul>`
       : '<p>No hay actuaciones confirmadas en esta sesión.</p>'}
    </section>
    <section class="drug-card"><h2>Controles vinculados a actuaciones confirmadas</h2>
      ${plan.history.heldRecords ? '<p class="form-error" role="alert">Hay registros históricos que requieren revisión de fechas o contenido; no generan un control automático.</p>' : ''}
      ${events.length ? `<div class="review-list">${events.map(e=>`<div class="review-row">
        <span><strong>${escape(e.drugId)}</strong> · ${escape(e.trigger)}
          <small class="followup-description">${escape(e.description)}</small>
          ${e.holdReasons?.length ? `<small class="followup-description">${escape(e.holdReasons.join(' '))}</small>` : ''}
          <small class="followup-status">${e.status==='sustituido'?'Sustituido por una actuación posterior':e.status==='requiere_reevaluacion'?'Referencia retenida: revisar seguridad y contexto actuales':e.temporalStatus==='plazo_superado'?'Plazo superado: revisar cumplimiento':e.status==='referencia_activa'?'Control de referencia para revisión':'Reevaluación clínica pendiente'}</small></span>
        <strong class="${e.status==='sustituido'?'followup-superseded':''}">${e.dueOn?escape(e.dueOn):'Sin fecha fija'}</strong></div>`).join('')}</div>`
        : '<p>No hay controles aplicables con el historial y contexto actuales. Revisa fechas y confirmaciones.</p>'}
      <p class="drug-disclaimer">Estas fechas se muestran en pantalla, sin notificaciones. La periodicidad puede requerir adelanto o modificación según la situación clínica.</p>
    </section>
  </div>`;
}
function pharmaLibrary() {
  return `<section class="pharma-library">
  <div class="eyebrow">CIMA-AEMPS · FICHAS POR PRINCIPIO ACTIVO</div>
  <h2>Farmacología verificada</h2>
  <p>Dosis de ficha técnica, separadas por indicación. La aplicación no calcula recetas ni confirma elegibilidad.</p>
  <div class="pharma-grid">${Object.values(DRUGS).map(drug=>`<article class="pharma-preview">
    <div><strong>${escape(drug.generic)}</strong><span>${escape(drug.className)} · ${escape(drug.exampleBrand)}</span></div>
    <button type="button" class="ghost" data-action="open-drug" data-drug-id="${escape(drug.id)}" data-route-id="${escape(drug.routes[0].id)}">Consultar ficha →</button>
  </article>`).join('')}</div>
  </section>`;
}
function drugView() {
  const drug=getDrug(current.drug);
  if(!drug) return tools();
  const route=getDrugRoute(drug.id,current.route) || drug.routes[0];
  const review=reviewDrug(draft,drug.id,route.id);
  const states={bloqueo:'Bloqueo o precaución mayor',datos_insuficientes:'Datos esenciales incompletos',
    revision_pendiente:'Revisión profesional pendiente'};
  const items=(arr)=>arr.map(t=>`<li>${escape(t)}</li>`).join('');
  return `<div class="page interior">
    <div class="bread"><button type="button" data-action="tools">Herramientas</button><span>›</span><span>Farmacología</span></div>
    <div class="eyebrow">FICHA TÉCNICA ESPAÑOLA · REFERENCIA NO PRESCRIPTIVA</div>
    <h1>${escape(drug.generic)}</h1><p>${escape(drug.className)} · Referencia comercial: ${escape(drug.exampleBrand)}</p>
    ${banner()}
    <div class="drug-tabs" role="group" aria-label="Indicación farmacológica">
      ${drug.routes.map(r=>`<button type="button" data-action="drug-route" data-route-id="${escape(r.id)}"
        class="${r.id===route.id?'active':''}" aria-pressed="${r.id===route.id}">${escape(r.name)}</button>`).join('')}
    </div>
    <section class="drug-card">
      <div class="eyebrow">DOSIS DE FICHA TÉCNICA</div>
      <h2>${escape(route.name)}</h2>
      <ul>${items(route.labelDoses)}</ul>
      <p class="drug-disclaimer">Consulta los bloqueos y ajustes del producto antes de aplicar la pauta.</p>
    </section>
    <section class="drug-card">
      <div class="drug-state ${escape(review.state)}">${escape(states[review.state])}</div>
      <h2>Aplicación de la ficha al contexto introducido</h2>
      <p>Datos declarados: esta pantalla no determina si el paciente puede recibir el medicamento.</p>
      ${review.blocked.length ? `<div class="drug-warning"><strong>Bloqueos identificados</strong><ul>${items(review.blocked)}</ul></div>`:''}
      ${review.missing.length ? `<div class="drug-missing"><strong>Información obligatoria pendiente</strong><ul>${items(review.missing)}</ul></div>`:''}
      <div class="drug-checks"><strong>Verificaciones antes de prescribir</strong><ul>${items(review.checks)}</ul></div>
      ${review.renalReference ? `<div class="drug-missing"><strong>Límite renal documental (no dosis individual)</strong>
      <p>${review.renalReference.maxMgPerDay===null
        ?'TFGe inferior a 30: ficha contraindica metformina.'
        :'Máximo diario según la ficha: '+review.renalReference.maxMgPerDay.toLocaleString('es-ES')+' mg/día.'}</p>
      </div>`:''}
    </section>
    ${['finerenona','empagliflozina'].includes(drug.id)
       ?continuityPanel()
       :`<section class="drug-card"><h2>Escalada y seguimiento</h2>
          <p>Solo se muestra la pauta autorizada de la ficha técnica. La decisión de escalada
          requiere duración de tratamiento, tolerancia, situación clínica y revisión por el profesional.
          No hay motor de continuación ni calendario automatizado para esta presentación.</p></section>`}
    <section class="drug-card"><h2>Monitorización y advertencias</h2>
      <h3>Seguimiento de ficha técnica</h3><ul>${items(drug.monitoring)}</ul>
      <h3>Precauciones y contraindicaciones relevantes</h3><ul>${items(drug.warningText)}</ul>
      <div class="drug-source"><strong>CIMA-AEMPS · Revisado ${escape(drug.source.reviewed)}</strong>
        <a href="${escape(drug.source.url)}" target="_blank" rel="noopener noreferrer">Abrir ficha técnica · apartados 4.1–4.5 ↗</a></div>
    </section>
  </div>`;
}
function tools() {
  return `<div class="page interior">
    <div class="eyebrow">MOTOR CLÍNICO · FASE DE CÁLCULO</div><h1>Herramientas de evaluación</h1>
    <p>Estas clasificaciones utilizan los datos ya introducidos en la consulta. No generan diagnósticos ni recomendaciones terapéuticas.</p>
    ${banner()}
    <p class="privacy-note">La fecha y unidad real de cada analítica deben verificarse antes de utilizarla para decidir. Una fecha no consignada no significa que el resultado sea actual.</p>
    ${obesitySummaryCard()}
    ${lipidSummaryCard()}
    ${htaSummaryCard()}
    ${ckmSummaryCard()}
    <section class="calc-card"><h2>Riesgo cardiovascular</h2>
      <p>${evaluateCvRisk(draft).externalEstimate?'SCORE2-OP externo documentado: revisar procedencia y contexto.':evaluateCvRisk(draft).percent===null?'Sin porcentaje disponible: revisar elegibilidad, circuito y datos.':'SCORE2: '+escape(evaluateCvRisk(draft).percent.toFixed(1))+' % a 10 años; pendiente de revisión clínica.'}</p>
      <button type="button" class="text-link" data-action="cv-risk">Ver evaluación y fuentes →</button></section>
    <div class="calc-stack">${renalResultCard()}${fib4ResultCard()}</div>
    ${integratedPlanPanel()}
    ${integratedCards()}
    ${pharmaLibrary()}
    <div class="followup-link"><button type="button" class="ghost" data-action="followup">Historial y calendario de controles →</button></div>
    <div class="tool-grid">
      <div class="tool-card"><span class="tag">DM2 · rápida y detallada preliminares</span>
        <h2>Diabetes tipo 2</h2><p>Consulta rápida y revisión detallada por objetivo individual, conciliación y seguridad. Fuentes redGDPS/ADA 2026.</p>
        <button type="button" class="text-link" data-action="start-module" data-module="dm2">Abrir DM2 rápida →</button>
      </div>
      <div class="tool-card"><span class="tag">Insulinización · tres circuitos preliminares</span>
        <h2>Insulinización</h2>
        <p>Inicio, intensificación y desintensificación según glucemias y tratamiento actual. Revisión ADA/EASD 2026 y redGDPS.</p>
        <button type="button" class="text-link" data-action="start-module" data-module="insulina">Abrir insulinización →</button>
      </div>
      <div class="tool-card"><span class="tag">Insuficiencia cardíaca · ESC 2026</span>
        <h2>Insuficiencia cardíaca</h2>
        <p>FEVI actual e historial, congestión y clases farmacológicas para revisión.</p>
        <button type="button" class="text-link" data-action="start-module" data-module="ic">Abrir IC →</button>
      </div>
      ${['obesidad'].map(id=>{
        const m=MODULE_BY_ID[id];
        return `<div class="tool-card"><span class="tag">GIRO2025 · revisión profesional</span>
          <h2>${escape(m.title)}</h2><p>Evaluación de complicaciones, objetivos y hábitos, con revisión farmacológica y derivación.</p>
          <button type="button" class="text-link" data-action="start-module" data-module="${escape(m.id)}">Abrir consulta →</button>
        </div>`;
      }).join('')}
    </div></div>`;
}
function sources() {
  return `<div class="page interior"><div class="eyebrow">TRANSPARENCIA</div><h1>Fuentes clínicas</h1>
  <p>CaHReMe calcula categorías G/A y FIB-4, además de mostrar candidatos multiorgánicos para revisión profesional. No determina idoneidad terapéutica individual ni genera dosis, recetas o suspensiones automáticas.</p>
  ${banner()}
  <section class="sources-card"><h2>Documentación de desarrollo</h2>
  <p>Guías, reglas y documentación del proyecto.</p>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/DOCUMENTO_RECTOR.md" target="_blank" rel="noopener noreferrer">Documento rector ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/MVP.md" target="_blank" rel="noopener noreferrer">Alcance del MVP ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/FUENTES_CLINICAS.md" target="_blank" rel="noopener noreferrer">Registro de fuentes clínicas ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/INTEGRACION_TERAPEUTICA.md" target="_blank" rel="noopener noreferrer">Matriz de integración terapéutica ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/INCRETINAS_CIMA.md" target="_blank" rel="noopener noreferrer">Ozempic, Wegovy inyectable y Mounjaro · CIMA ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/DM2_RAPIDA_REDGDPS_2026.md" target="_blank" rel="noopener noreferrer">DM2 rápida · redGDPS y ADA 2026 ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/DM2_DETALLADA_ADA_REDGDPS_2026.md" target="_blank" rel="noopener noreferrer">DM2 detallada · objetivo, seguridad y fuentes ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/INSULINIZACION_ADA_EASD_2026.md" target="_blank" rel="noopener noreferrer">Insulinización · ADA/EASD 2026 y redGDPS 2022 ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/INSUFICIENCIA_CARDIACA_ESC_2026.md" target="_blank" rel="noopener noreferrer">Insuficiencia cardíaca · ESC 2026 y control de seguridad ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/IC_ESC_2026.md" target="_blank" rel="noopener noreferrer">Insuficiencia cardíaca · ESC 2026 y CIMA ↗</a>
  <a href="https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/heart-failure" target="_blank" rel="noopener noreferrer">Guía oficial ESC 2026 de insuficiencia cardíaca ↗</a>
  <a href="https://diabetesjournals.org/care/article/doi/10.2337/dci26-0141/172591" target="_blank" rel="noopener noreferrer">Consenso ADA/EASD de tratamiento DM2 2026 ↗</a>
  <a href="https://redgdps.org/algoritmo-de-tratamiento-de-la-dm2-de-la-redgdps-2026/" target="_blank" rel="noopener noreferrer">Algoritmo redGDPS 2026 · fuente oficial ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/DECISIONES.md" target="_blank" rel="noopener noreferrer">Decisiones de identidad ↗</a>
  </section>
  <section class="sources-card"><h2>Privacidad en esta versión</h2><p>Los valores permanecen exclusivamente en memoria durante la sesión abierta: no se usan cookies, almacenamiento local ni servicios remotos. Al recargar se pierden los datos.</p></section></div>`;
}
function render() {
  const contents = current.page === 'home' ? home() : current.page === 'lipids' ? lipidView() : current.page === 'hta' ? htaView() : current.page === 'ckm' ? ckmView() : current.page === 'cv-risk' ? cvRiskView() : current.page === 'module' ? moduleView() : current.page === 'evaluation' ? evaluation()
    : current.page === 'summary' ? summary() : current.page === 'tools' ? tools() : current.page === 'drug' ? drugView() : current.page === 'followup' ? followupPage() : sources();
  app.innerHTML = '<a class="skip-link" href="#main-content">Saltar al contenido</a>' + header() + '<main id="main-content" tabindex="-1">' + contents + '</main>' + nav() +
    '<footer class="footer">CaHReMe · Salud cardiorrenal-hepatometabólica</footer>';
}
function navigate(page) { current.page = page; render(); scrollTo({ top: 0, behavior: 'auto' }); document.getElementById('main-content')?.focus?.({preventScroll:true}); }
function start(focus) {
  current.module = null;
  current.focus = focus;
  current.step = sectionForFocus(focus);
  navigate('evaluation');
}
app.addEventListener('input', event => {
  const el = event.target.closest('[data-field]');
  if (!el || !['evaluation','module','drug','cv-risk','ckm','hta','lipids'].includes(current.page)) return;
  const id=el.dataset.field;
  if (el.type === 'checkbox') {
    const checked=[...document.querySelectorAll('input[data-field="'+id+'"]:checked')].map(e=>e.value);
    const chosen=checked.filter(x=>! /^(Sin |Ninguna )/.test(x));
    const selected=checked.length>1 && checked.some(x=>/^(Sin |Ninguna )/.test(x))
      ? (el.checked && /^(Sin |Ninguna )/.test(el.value) ? [el.value] : chosen)
      : checked;
    draft = setValue(draft,id,JSON.stringify(selected));
    // Refrescar tras seleccionar «ninguna» para garantizar exclusividad.
    if (selected.length !== checked.length) {
      const openGroups=[...document.querySelectorAll('details[open]')].map(x=>x.querySelector?.('summary')?.textContent).filter(Boolean);
      render();
      for(const group of document.querySelectorAll('details'))if(openGroups.includes(group.querySelector?.('summary')?.textContent))group.open=true;
      return;
    }
  } else draft=setValue(draft,id,el.value);
  if(current.obesityVisible){current.obesityVisible=false;document.getElementById('obesity-result')?.remove();}
  if(current.masldVisible){current.masldVisible=false;document.getElementById('masld-result')?.remove();}
  if(current.lipidVisible){current.lipidVisible=false;document.getElementById('lipid-result')?.remove();}
  if(current.htaVisible){current.htaVisible=false;document.getElementById('hta-result')?.remove();}
  if(current.page==='ckm'){current.ckmVisible=false;document.getElementById('ckm-result')?.remove();}
  if(current.cvVisible){current.cvVisible=false;document.getElementById('cv-result')?.remove();}
  if(current.renalVisible){
    current.renalVisible=false;
    document.getElementById('renal-result')?.remove();
  }
  if(current.icVisible){
    current.icVisible=false;
    const previous=document.getElementById('ic-result');
    if(previous&&typeof previous.remove==='function')previous.remove();
  }
  if(current.insulinVisible){
    current.insulinVisible=false;
    const previous=document.getElementById('insulin-result');
    if(previous&&typeof previous.remove==='function')previous.remove();
  }
  if(current.dm2ResultVisible||current.dm2DetailedVisible){
    current.dm2ResultVisible=false;current.dm2DetailedVisible=false;
    for(const id of ['dm2-rapid-result','dm2-detailed-result']){
      const previous=document.getElementById(id);
      if(previous && typeof previous.remove==='function')previous.remove();
    }
  }
  if((current.page==='hta'&&!current.htaDetail)||(current.page==='lipids'&&!current.lipidDetail)){document.getElementById(BRIEF_RESULT_IDS[current.page])?.remove();if(['select','multi'].includes(FIELDS[id]?.type))return render();}
  if(current.page==='module'&&current.mode==='quick'){
    current.briefForced=false;document.getElementById(BRIEF_RESULT_IDS[current.module])?.remove();
    if(['select','multi'].includes(FIELDS[id]?.type))return render();
  }
  if(current.page==='ckm'&&FIELDS[id]?.type==='select')return render();
  const counter=document.getElementById('section-count');
  if (!counter) return;
  const fields=current.page==='lipids'?LIPID_FIELDS:current.page==='hta'?HTA_FIELDS:current.page==='ckm'?CKM_FIELDS:current.page==='cv-risk'?CV_FIELDS:current.page==='module'?moduleFields(current.module,current.mode):current.page==='drug'?currentContinuityFields():SECTIONS[current.step].fields.map(f=>f.id);
  const n=fields.filter(key=>fieldState(draft,key)==='registrado').length;
  counter.textContent=current.page==='module'?n+' de '+fields.length+' registrados':n+' registrados';
});
app.addEventListener('click', event => {
  const btn = event.target.closest('button[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if(action==='lipids'){current.lipidDetail=false;current.lipidVisible=false;return navigate('lipids');}
  if(action==='lipid-result'){if(current.page!=='lipids')return;current.lipidVisible=true;return render();}
  if(action==='hta'){current.htaDetail=false;current.htaVisible=false;return navigate('hta');}
  if(action==='brief-advanced'){if(current.page==='hta')current.htaDetail=true;if(current.page==='lipids')current.lipidDetail=true;return render();}
  if(action==='hta-result'){if(current.page!=='hta')return;current.htaVisible=true;return render();}
  if(action==='ckm'){current.ckmVisible=false;current.ckmBlock='contexto';return navigate('ckm');}
  if(action==='ckm-block'){if(current.page!=='ckm')return;if(ckmQuestionBlocks().some(x=>x.id===btn.dataset.block))current.ckmBlock=btn.dataset.block;return navigate('ckm');}
  if(action==='ckm-next'){if(current.page!=='ckm')return;const blocks=ckmQuestionBlocks(),i=blocks.findIndex(x=>x.id===current.ckmBlock);current.ckmBlock=blocks[Math.min(Math.max(0,i)+1,blocks.length-1)].id;current.ckmVisible=true;return navigate('ckm');}
  if(action==='ckm-result'){if(current.page!=='ckm')return;current.ckmVisible=true;return render();}
  if(action==='cv-expand'){current.cvDetail=true;return render();}
  if(action==='cv-risk'){current.cvDetail=false;current.cvVisible=false;return navigate('cv-risk');}
  if(action==='cv-risk-result'){if(current.page!=='cv-risk')return;current.cvVisible=true;return render();}
  if(action==='obesity-result'){
    if(current.page!=='module'||current.module!=='obesidad'||!['quick','detail'].includes(current.mode))return;
    current.obesityVisible=true;return render();
  }
  if(action==='masld-result'){
    if(current.page!=='module'||current.module!=='hepatico'||!['quick','detail'].includes(current.mode))return;
    current.masldVisible=true;return render();
  }
  if (action === 'renal-result') {
    if(current.page!=='module'||current.module!=='erc'||!['quick','detail'].includes(current.mode))return;
    current.renalVisible=true;return render();
  }
  if (action === 'ic-result') {
    if(current.page!=='module'||current.module!=='ic'||
      !['quick','detail'].includes(current.mode))return;
    current.icVisible=true;return render();
  }
  if (action === 'insulin-result') {
    if(current.page!=='module'||current.module!=='insulina'||
      !['quick','detail'].includes(current.mode))return;
    current.insulinVisible=true;return render();
  }
  if (action === 'dm2-detailed-result') {
    if(current.page!=='module'||current.module!=='dm2'||current.mode!=='detail')return;
    current.dm2DetailedVisible=true;return render();
  }
  if (action === 'dm2-result') {
    if(current.page!=='module'||current.module!=='dm2'||current.mode!=='quick')return;
    current.dm2ResultVisible=true;
    return render();
  }
  if (action === 'refresh') return render();
  if (action === 'followup') { followupError=''; return navigate('followup'); }
  if (action === 'confirm-med-action') {
    const type=document.getElementById('action-type')?.value;
    const performedOn=document.getElementById('action-date')?.value;
    const doseMg=document.getElementById('action-dose')?.value;
    const checked=document.getElementById('action-confirm')?.checked === true;
    const today=new Date();
    const localToday=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),
      String(today.getDate()).padStart(2,'0')].join('-');
    if(!checked || !performedOn || performedOn>localToday) {
      followupError='Debes confirmar la actuación y una fecha efectiva válida, que no puede ser futura.';
      return render();
    }
    if(!confirm('¿Confirmas que la actuación se realizó realmente?')) return;
    try {
      confirmedHistory=confirmedAction(confirmedHistory,{
        drugId:current.drug,routeId:current.route,type,performedOn,doseMg,confirmedByClinician:true
      });
      followupError='';
    } catch(e) { followupError=e?.message||'No se ha registrado la actuación'; }
    return render();
  }
  if (action === 'start') return start(btn.dataset.focus || 'integral');
  if (action === 'open-drug') {
    const drug=getDrug(btn.dataset.drugId);
    if (!drug) return;
    current.drug=drug.id;
    current.route=getDrugRoute(drug.id,btn.dataset.routeId)?.id || drug.routes[0].id;
    return navigate('drug');
  }
  if (action === 'drug-route') {
    if (!getDrugRoute(current.drug,btn.dataset.routeId)) return;
    current.route=btn.dataset.routeId; return navigate('drug');
  }
  if (action === 'start-module') {
    if (!MODULE_BY_ID[btn.dataset.module]) return;
    current.briefForced=false;current.obesityVisible=false; current.masldVisible=false; current.renalVisible=false; current.module=btn.dataset.module; current.mode='quick'; current.dm2ResultVisible=false; current.dm2DetailedVisible=false; current.insulinVisible=false; current.icVisible=false; return navigate('module');
  }
  if (action === 'module-outcome') {
    if(current.page!=='module')return;if(current.mode==='quick'){current.briefForced=true;return render();}current.mode='review';return navigate('module');
  }
  if (action === 'module-mode') {
    if (!['quick','detail','review'].includes(btn.dataset.mode)) return;
    current.mode=btn.dataset.mode; return navigate('module');
  }
  if (action === 'home') return navigate('home');
  if (action === 'tools') return navigate('tools');
  if (action === 'sources') return navigate('sources');
  if (action === 'evaluation') return start('integral');
  if (action === 'summary') return navigate('summary');
  if (action === 'next') { current.step = Math.min(current.step + 1, SECTIONS.length - 1); return navigate('evaluation'); }
  if (action === 'prev') { current.step = Math.max(0, current.step - 1); return navigate('evaluation'); }
  if (action === 'go-step') { current.step = Number(btn.dataset.step); return navigate('evaluation'); }
  if (action === 'unavailable') {
    const id = btn.dataset.fieldId;
    draft = setUnavailable(draft, id, !draft.unavailable.includes(id));
    return render();
  }
  if (action === 'new') {
    if (!confirm('¿Borrar los datos de esta evaluación? Esta acción no se puede deshacer.')) return;
    draft = createDraft(); confirmedHistory=[]; followupError=''; current = { page: 'home', step: 0, focus: 'integral', module:null,mode:'quick',drug:'empagliflozina',route:'dm2' };
    return navigate('home');
  }
});
render();

// Instala solo recursos estáticos. Los datos clínicos siguen en memoria y no se persisten.
if (typeof window !== 'undefined' && typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).then(registration => registration.update()).catch(() => {});
  });
}

