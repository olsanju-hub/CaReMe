import { SECTIONS, FIELDS, createDraft, setValue, setUnavailable, fieldState, sectionStats, totalStats, sectionForFocus } from './model.mjs';
import { MODULES, MODULE_BY_ID, moduleFields, readMulti } from './consultas.mjs';
import { SOURCES, evaluateRenal, evaluateFib4 } from './clinical/engine.mjs';
import { integratePatient, INTEGRATION_SOURCES } from './clinical/integracion.mjs';
import { DRUGS, getDrug, getDrugRoute, reviewDrug } from './clinical/farmacologia.mjs';
import { reviewFinerenoneContinuation, reviewEmpagliflozinContinuation, confirmedAction, followUpFromHistory } from './clinical/continuidad.mjs';
import { buildVerificationPlan } from './clinical/plan.mjs';
import { evaluateDm2Quick } from './clinical/dm2-rapida.mjs';

let draft = createDraft();
let confirmedHistory = [];
let followupError = '';
let current = { page: 'home', step: 0, focus: 'integral', module: null, mode:'quick', drug:'empagliflozina', route:'dm2' };
const app = document.getElementById('app');
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const counts = () => totalStats(draft);

function banner() {
  return '<div class="safety" role="note"><span class="safety-dot"></span><span>Prototipo en revisión: cálculos G/A y FIB-4, y propuestas multiorgánicas para revisión. Ningún resultado autoriza diagnóstico, prescripción o suspensión farmacológica.</span></div>';
}
function header() {
  return `<header class="topbar"><div class="topbar-inner">
    <button class="brand" type="button" data-action="home" aria-label="Volver al inicio de CaHReMe">
      <span class="brand-mark" aria-hidden="true"><img src="./public/icon-concept.svg" alt="" /></span>
      <span><strong>Ca<span class="brand-accent">H</span>ReMe</strong><small>Salud cardiorrenal-hepatometabólica</small></span>
    </button>
    <div class="top-right"><span class="dev-label">PROTOTIPO · V0.1</span>
      <button class="ghost small" type="button" data-action="sources">Fuentes y estado</button></div>
  </div></header>`;
}
function nav() {
  const items = [['home','Inicio','⌂'],['evaluation','Evaluar','＋'],['tools','Herramientas','▦'],['sources','Fuentes','≡']];
  return `<nav class="bottom-nav" aria-label="Navegación principal">${items.map(([id,label,sym]) =>
    `<button type="button" class="${current.page === id || (id==='evaluation' && ['module','summary'].includes(current.page)) ? 'active' : ''}" data-action="${id}" ${current.page === id ? 'aria-current="page"' : ''}>
      <span aria-hidden="true" class="nav-symbol">${sym}</span><span>${label}</span></button>`).join('')}</nav>`;
}
function home() {
  return `<div class="page home">
    <section class="hero">
      <div class="hero-copy"><div class="eyebrow light">ATENCIÓN PRIMARIA · ESPAÑA</div>
        <h1>Una visión completa.<br><em>Un paciente.</em></h1>
        <p>Evaluación multiorgánica y seis consultas dirigidas. Los datos compartidos no se vuelven a introducir.</p>
        <button class="primary hero-button" type="button" data-action="start" data-focus="integral">
          ${(counts().registrado + counts().no_disponible + counts().revisar)>0 ? 'Continuar evaluación integral' : 'Nueva evaluación integral'}
          <span aria-hidden="true">→</span></button>
          ${(counts().registrado + counts().no_disponible + counts().revisar)>0
            ? '<button type="button" class="hero-reset" data-action="new">Borrar datos y comenzar otra evaluación</button>' : ''}
      </div>
      <div class="hero-art" aria-hidden="true"><img class="hero-logo" src="./public/icon-concept.svg" alt="" /></div>
    </section>
    ${banner()}
    <div class="section-heading"><div><div class="eyebrow">SEIS CONSULTAS CLÍNICAS</div><h2>¿Qué necesitas valorar?</h2></div>
      <p>Consulta rápida con orientación preliminar de DM2; otros módulos aún pendientes de validación.</p>
    </div>
    <div class="module-grid">${MODULES.map(m =>
      `<button type="button" class="module-card" data-action="start-module" data-module="${escape(m.id)}">
      <span class="module-art" aria-hidden="true"><img src="./public/domain-${escape(m.domain)}.svg" alt="" /></span>
      <span class="module-content"><strong>${escape(m.title)}</strong><small>${escape(m.short)}</small></span>
      <span class="module-arrow" aria-hidden="true">↗</span></button>`
    ).join('')}</div>
    <section class="info-strip"><div><strong>Una ficha compartida, sin identificación</strong>
      <p>Las seis consultas y la evaluación integral reutilizan la información disponible. Los datos permanecen en memoria y se pierden al recargar.</p></div>
      <button type="button" class="text-link" data-action="sources">Fuentes y limitaciones →</button></section>
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
  const x=evaluateFib4(draft);
  const displayed=x.status==='calculated' ? x.value.toFixed(2) : '—';
  const interpretations={
    lower_probability:'Bajo el umbral de cribado',
    additional_assessment:'Requiere evaluación adicional',
    higher_probability:'Probabilidad aumentada de fibrosis avanzada',
    context_missing:'Contexto por completar',
    age_limited:'Validez limitada por edad',
    acute:'No interpretar durante enfermedad aguda',
    not_evaluable:'No evaluable'
  };
  const reported=x.reported.state==='ok'
    ? '<p class="calc-reported">Índice informado por otra fuente: '+escape(String(x.reported.value))+
      ' (no sustituye al cálculo ni se interpreta automáticamente).</p>' : '';
  const missing=x.missing.length ? '<p class="clinical-missing">Faltan o deben revisarse: '+
    x.missing.map(k=>escape(FIELDS[k]?.label||k)).join(' · ')+'</p>' : '';
  return `<section class="calc-card" aria-label="Cálculo FIB-4">
    <div class="calc-top"><div><span class="eyebrow">EASL-EASD-EASO 2024 · ÍNDICE NO INVASIVO</span><h3>FIB-4</h3></div>
      <span class="calc-type">${escape(x.status)}</span></div>
    <div class="fib-figure"><strong>${displayed}</strong><span>${escape(interpretations[x.interpretation])}</span></div>
    <p>${escape(x.note)}</p>${missing}${reported}
    <p class="calc-limits">Fórmula: edad × AST / (plaquetas × √ALT). En edades &gt;65 se utiliza umbral inferior ajustado de 2,0; por debajo de 35 años su precisión es limitada. No confirma MASLD ni fibrosis.</p>
    <a href="${SOURCES.easl2024.url}" target="_blank" rel="noopener noreferrer">Fuente: EASL-EASD-EASO 2024, figura 2 ↗</a>
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
function verificationPanel() {
  const plan=buildVerificationPlan(draft,confirmedHistory);
  const priorities={seguridad:'Revisión prioritaria',completar:'Dato o conciliación pendiente'};
  const followup=plan.followup.filter(x=>x.status!=='sustituido');
  return `<section class="verification-panel" aria-label="Plan de verificación documental">
    <div class="eyebrow">CONTROL DE CALIDAD · SIN PRESCRIPCIÓN</div>
    <h2>Plan de verificación clínica</h2>
    <p>${escape(plan.summary)}. Las comprobaciones no se registran como realizadas por aparecer aquí.</p>
    ${plan.heldCandidates?`<p class="verification-hold">Se han retenido ${plan.heldCandidates} opciones hasta corregir las incoherencias clínicas.</p>`:''}
    ${plan.checks.length?`<div class="verification-list">${plan.checks.map(item=>`
      <article class="verification-item ${escape(item.priority)}">
        <span class="verification-kind">${escape(priorities[item.priority]||'Revisar')}</span>
        <h3>${escape(item.title)}</h3><p>${escape(item.detail)}</p>
        ${item.fields.length?`<small>Campos: ${item.fields.map(id=>escape(FIELDS[id]?.label||id)).join(' · ')}</small>`:''}
      </article>`).join('')}</div>`
      :'<p>Sin comprobaciones pendientes detectadas por las reglas implementadas; esto no valida la historia ni equivale a alta clínica.</p>'}
    <h3>Controles derivados de actuaciones confirmadas</h3>
    ${followup.length?`<div class="verification-followup">${followup.map(x=>`
      <p><strong>${x.dueOn?escape(x.dueOn):'Fecha a individualizar'}</strong> ·
      ${escape(x.drugId)} — ${escape(x.description)}.</p>`).join('')}</div>`
      :'<p>No se han generado controles nuevos: no hay actuaciones confirmadas que los activen.</p>'}
    <p class="integration-disclaimer">Opciones terapéuticas identificadas: ${plan.candidates.length}.
      Son propuestas para revisión, no tratamientos iniciados. Actuaciones registradas: ${plan.confirmedActions}.</p>
  </section>`;
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
    <p>Basadas en antecedentes declarados y datos disponibles. No son órdenes médicas ni un plan de prescripción.</p>
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
    <div class="eyebrow">DM2 · REDGDPS / ADA 2026 · SIN PRESCRIPCIÓN</div>
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
    <p class="privacy-note">${escape(r.scope)} Ninguna alternativa es una prescripción realizada.</p>
  </section>`;
}
function consultationReview(module) {
  const fields = [...new Set([...module.quick,...module.detail])];
  const missing = fields.filter(id => fieldState(draft,id) === 'sin_registrar');
  const invalid = fields.filter(id => fieldState(draft,id) === 'revisar');
  return `<div class="module-review">
    <h2>Resumen de captura · ${escape(module.title)}</h2>
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
    ${calculatorsForModule(module.id)}
    ${module.id==='dm2'?dm2RapidResult():''}
    ${integratedCards(({dm2:'DM2',ic:'IC',erc:'Renal',obesidad:'Metabólico',hepatico:'Hepático',insulina:'DM2'})[module.id])}
    ${module.id==='dm2'
      ? '<p class="clinical-lock">DM2: orientación rápida implementada; revisión detallada terapéutica y validación clínica formal pendientes.</p>'
      : `<div class="clinical-lock"><strong>Motor terapéutico pendiente de validación</strong>
      <p>${missing.length} datos sin registrar y ${invalid.length} entradas por revisar.
       Aquí aparecerán situación, siguiente paso, alternativas, seguridad, seguimiento y fuentes,
       solo cuando cada regla esté verificada y probada.</p></div>`}
    <div class="wizard-actions"><button type="button" class="ghost" data-action="module-mode" data-mode="quick">Volver a consulta</button>
      <button class="primary" type="button" data-action="summary">Ver ficha integral →</button></div>
  </div>`;
}
function moduleView() {
  const m=MODULE_BY_ID[current.module];
  if (!m) return home();
  const mode=current.mode || 'quick';
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
    ${mode==='review' ? consultationReview(m) : `<section class="form-card">
      <div class="form-title"><div><h2>${mode==='quick'?'Datos esenciales':'Datos clínicos detallados'}</h2>
        <p>La información se comparte con los demás módulos y la evaluación integral.</p></div>
        <span class="count-pill" id="section-count">${completed} de ${fields.length} registrados</span></div>
      <div class="field-grid">${fields.map(id=>moduleFieldMarkup(FIELDS[id])).join('')}</div>
      <div class="wizard-actions">
        <button type="button" class="ghost" data-action="module-mode" data-mode="${mode==='quick'?'detail':'quick'}">${mode==='quick'?'Revisión detallada':'Consulta rápida'}</button>
        <button type="button" class="primary" data-action="module-mode" data-mode="review">Ver resumen de datos →</button>
      </div>
    </section>`}
    ${m.id==='dm2' && mode==='quick'?`<div class="dm2-result-trigger">
      <button class="primary" type="button" data-action="dm2-result">Ver orientación clínica rápida →</button>
      <p>El resultado se genera para revisión. No prescribe ni confirma diagnósticos.</p>
    </div>${current.dm2ResultVisible?dm2RapidResult():''}`:''}
    <div class="module-note"><strong>Documentación:</strong> las recomendaciones rápidas de DM2 son provisionales; otras consultas siguen sin salida clínica validada.</div>
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
      <div class="form-title"><div><h2>${escape(section.title)}</h2><p>Los campos son opcionales en este prototipo.</p></div>
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
    <p>Este es un resumen de datos introducidos, no una interpretación clínica.</p></div>
    <button class="ghost" type="button" data-action="new">Nueva evaluación</button></div>
    ${banner()}
    <div class="stats-grid"><div><strong>${stats.registrado}</strong><span>Registrados</span></div>
    <div><strong>${stats.no_disponible}</strong><span>No disponibles</span></div>
    <div><strong>${stats.sin_registrar}</strong><span>Sin registrar</span></div>
    <div><strong>${stats.revisar}</strong><span>Por revisar</span></div></div>
    <div class="summary-grid">${SECTIONS.map((s,i) =>
      `<section class="summary-card"><div class="summary-card-head"><h2>${escape(s.title)}</h2>
        <button type="button" class="text-link" data-action="go-step" data-step="${i}">Editar →</button></div>
        <dl>${s.fields.map(f => {
          const state = fieldState(draft, f.id);
          const content = state === 'registrado' || state === 'revisar'
            ? escape(draft.values[f.id]) + (f.unit ? ' ' + escape(f.unit) : '') : statusLabel(state);
          return `<div><dt>${escape(f.label)}</dt><dd class="${state}">${content}</dd></div>`;
        }).join('')}</dl></section>`).join('')}</div>
    <div class="calc-stack">${renalResultCard()}${fib4ResultCard()}</div>
    ${verificationPanel()}
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
  const events=followUpFromHistory(confirmedHistory);
  const last=confirmedHistory.filter(e=>e.drugId===current.drug && e.routeId===current.route);
  const actionName={inicio:'Inicio',reinicio:'Reinicio',ajuste:'Modificación de dosis',interrupcion:'Interrupción'};
  return `<div class="page interior">
    <div class="bread"><button type="button" data-action="tools">Herramientas</button><span>›</span><span>Seguimiento</span></div>
    <div class="eyebrow">REGISTRO EFECTIVAMENTE CONFIRMADO · NO PRESCRIPCIÓN</div>
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
      ${events.length ? `<div class="review-list">${events.map(e=>`<div class="review-row">
        <span><strong>${escape(e.drugId)}</strong> · ${escape(e.trigger)}
          <small class="followup-description">${escape(e.description)}</small>
          <small class="followup-status">${e.status==='sustituido'?'Sustituido por una actuación posterior':e.status==='previsto'?'Control previsto':'Reevaluación clínica pendiente'}</small></span>
        <strong class="${e.status==='sustituido'?'followup-superseded':''}">${e.dueOn?escape(e.dueOn):'Sin fecha fija'}</strong></div>`).join('')}</div>`
        : '<p>Aún no hay controles programables: ninguna actuación se ha confirmado.</p>'}
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
    <section class="drug-card">
      <div class="eyebrow">SOLO PAUTA DE FICHA TÉCNICA · NO DOSIS PERSONALIZADA</div>
      <h2>${escape(route.name)}</h2>
      <ul>${items(route.labelDoses)}</ul>
      <p class="drug-disclaimer">La tabla es informativa incluso si existen bloqueos. No equivale a una recomendación para el paciente.</p>
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
    <div class="calc-stack">${renalResultCard()}${fib4ResultCard()}</div>
    ${verificationPanel()}
    ${integratedCards()}
    ${pharmaLibrary()}
    <div class="followup-link"><button type="button" class="ghost" data-action="followup">Historial y calendario de controles →</button></div>
    <div class="tool-grid">
      <div class="tool-card"><span class="tag">DM2 · versión clínica preliminar</span>
        <h2>Diabetes tipo 2</h2><p>Consulta rápida con situación, seguridad, alternativas para revisión y fuentes redGDPS/ADA 2026. Sin prescripción; detalle aún pendiente.</p>
        <button type="button" class="text-link" data-action="start-module" data-module="dm2">Abrir DM2 rápida →</button>
      </div>
      ${['ic','obesidad','insulina'].map(id=>{
        const m=MODULE_BY_ID[id];
        return `<div class="tool-card"><span class="tag">Algoritmo pendiente</span>
          <h2>${escape(m.title)}</h2><p>La consulta rápida y detallada ya está disponible; los resultados clínicos necesitan especificación y revisión.</p>
          <button type="button" class="text-link" data-action="start-module" data-module="${escape(m.id)}">Abrir consulta →</button>
        </div>`;
      }).join('')}
    </div></div>`;
}
function sources() {
  return `<div class="page interior"><div class="eyebrow">TRANSPARENCIA</div><h1>Fuentes y validación</h1>
  <p>CaHReMe calcula categorías G/A y FIB-4, además de mostrar candidatos multiorgánicos para revisión profesional. No determina idoneidad terapéutica individual ni genera dosis, recetas o suspensiones automáticas.</p>
  ${banner()}
  <section class="sources-card"><h2>Documentación de desarrollo</h2>
  <p>El proyecto se gestiona en un repositorio privado. El acceso a estos enlaces requiere los permisos correspondientes.</p>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/DOCUMENTO_RECTOR.md" target="_blank" rel="noopener noreferrer">Documento rector ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/MVP.md" target="_blank" rel="noopener noreferrer">Alcance del MVP ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/FUENTES_CLINICAS.md" target="_blank" rel="noopener noreferrer">Registro de fuentes clínicas ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/INTEGRACION_TERAPEUTICA.md" target="_blank" rel="noopener noreferrer">Matriz de integración terapéutica ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/INCRETINAS_CIMA.md" target="_blank" rel="noopener noreferrer">Ozempic, Wegovy inyectable y Mounjaro · CIMA ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/DM2_RAPIDA_REDGDPS_2026.md" target="_blank" rel="noopener noreferrer">DM2 rápida · redGDPS y ADA 2026 (estado provisional) ↗</a>
  <a href="https://redgdps.org/algoritmo-de-tratamiento-de-la-dm2-de-la-redgdps-2026/" target="_blank" rel="noopener noreferrer">Algoritmo redGDPS 2026 · fuente oficial ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/DECISIONES.md" target="_blank" rel="noopener noreferrer">Decisiones de identidad ↗</a>
  </section>
  <section class="sources-card"><h2>Privacidad en esta versión</h2><p>Los valores permanecen exclusivamente en memoria durante la sesión abierta: no se usan cookies, almacenamiento local ni servicios remotos. Al recargar se pierden los datos.</p></section></div>`;
}
function render() {
  const contents = current.page === 'home' ? home() : current.page === 'module' ? moduleView() : current.page === 'evaluation' ? evaluation()
    : current.page === 'summary' ? summary() : current.page === 'tools' ? tools() : current.page === 'drug' ? drugView() : current.page === 'followup' ? followupPage() : sources();
  app.innerHTML = header() + '<main id="main-content">' + contents + '</main>' + nav() +
    '<footer class="footer">CaHReMe · Identidad Atlántico · Prototipo no validado para uso asistencial</footer>';
}
function navigate(page) { current.page = page; render(); scrollTo({ top: 0, behavior: 'auto' }); }
function start(focus) {
  current.module = null;
  current.focus = focus;
  current.step = sectionForFocus(focus);
  navigate('evaluation');
}
app.addEventListener('input', event => {
  const el = event.target.closest('[data-field]');
  if (!el || !['evaluation','module','drug'].includes(current.page)) return;
  const id=el.dataset.field;
  if (el.type === 'checkbox') {
    const checked=[...document.querySelectorAll('input[data-field="'+id+'"]:checked')].map(e=>e.value);
    const chosen=checked.filter(x=>! /^(Sin |Ninguna )/.test(x));
    const selected=checked.length>1 && checked.some(x=>/^(Sin |Ninguna )/.test(x))
      ? (el.checked && /^(Sin |Ninguna )/.test(el.value) ? [el.value] : chosen)
      : checked;
    draft = setValue(draft,id,JSON.stringify(selected));
    // Refrescar tras seleccionar «ninguna» para garantizar exclusividad.
    if (selected.length !== checked.length) return render();
  } else draft=setValue(draft,id,el.value);
  if(current.dm2ResultVisible){
    current.dm2ResultVisible=false;
    const oldResult=document.getElementById('dm2-rapid-result');
    if(oldResult && typeof oldResult.remove==='function')oldResult.remove();
  }
  const counter=document.getElementById('section-count');
  if (!counter) return;
  const fields=current.page==='module'?moduleFields(current.module,current.mode):current.page==='drug'?currentContinuityFields():SECTIONS[current.step].fields.map(f=>f.id);
  const n=fields.filter(key=>fieldState(draft,key)==='registrado').length;
  counter.textContent=current.page==='module'?n+' de '+fields.length+' registrados':n+' registrados';
});
app.addEventListener('click', event => {
  const btn = event.target.closest('button[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
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
    if(!confirm('¿Confirmas que la actuación se realizó realmente? No se está emitiendo una prescripción.')) return;
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
    current.module=btn.dataset.module; current.mode='quick'; current.dm2ResultVisible=false; return navigate('module');
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
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
