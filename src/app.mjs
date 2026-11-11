import { SECTIONS, FIELDS, createDraft, setValue, setUnavailable, fieldState, sectionStats, totalStats, sectionForFocus } from './model.mjs';
import { MODULES, MODULE_BY_ID, moduleFields, readMulti } from './consultas.mjs';
import { SOURCES, evaluateRenal, evaluateFib4 } from './clinical/engine.mjs';

let draft = createDraft();
let current = { page: 'home', step: 0, focus: 'integral', module: null, mode:'quick' };
const app = document.getElementById('app');
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const counts = () => totalStats(draft);

function banner() {
  return '<div class="safety" role="note"><span class="safety-dot"></span><span>Prototipo clínico en revisión: calcula categorías G/A y FIB-4, pero no realiza diagnósticos ni indica tratamientos. No usar para tomar decisiones asistenciales.</span></div>';
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
      <p>Consulta rápida y revisión detallada por problema. Sin interpretaciones automáticas todavía.</p>
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
    <div class="clinical-lock"><strong>Motor terapéutico pendiente de validación</strong>
      <p>${missing.length} datos sin registrar y ${invalid.length} entradas por revisar.
       Aquí aparecerán situación, siguiente paso, alternativas, seguridad, seguimiento y fuentes,
       solo cuando cada regla esté verificada y probada.</p></div>
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
    <div class="module-note"><strong>Documentación:</strong> matriz de equivalencia y reglas pendientes de verificación en fuentes actuales.</div>
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
    <div class="clinical-lock"><strong>Motor de decisiones clínicas desactivado</strong>
      <p>Las categorías renales y el FIB-4 son indicadores descriptivos. No confirman diagnósticos ni generan tratamientos, ni descartan enfermedad por sí solos.</p></div>
    <div class="summary-actions"><button type="button" class="ghost" data-action="go-step" data-step="0">Volver a editar</button>
      <button type="button" class="primary" data-action="new">Finalizar y borrar datos</button></div></div>`;
}
function tools() {
  return `<div class="page interior">
    <div class="eyebrow">MOTOR CLÍNICO · FASE DE CÁLCULO</div><h1>Herramientas de evaluación</h1>
    <p>Estas clasificaciones utilizan los datos ya introducidos en la consulta. No generan diagnósticos ni recomendaciones terapéuticas.</p>
    ${banner()}
    <div class="calc-stack">${renalResultCard()}${fib4ResultCard()}</div>
    <div class="tool-grid">
      ${['dm2','ic','obesidad','insulina'].map(id=>{
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
  <p>CaHReMe incorpora cálculo descriptivo de categorías G/A y FIB-4 basado en fuentes identificadas. El resto de decisiones clínicas, incluidas las farmacológicas, están pendientes de validación.</p>
  ${banner()}
  <section class="sources-card"><h2>Documentación de desarrollo</h2>
  <p>El proyecto se gestiona en un repositorio privado. El acceso a estos enlaces requiere los permisos correspondientes.</p>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/DOCUMENTO_RECTOR.md" target="_blank" rel="noopener noreferrer">Documento rector ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/MVP.md" target="_blank" rel="noopener noreferrer">Alcance del MVP ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/FUENTES_CLINICAS.md" target="_blank" rel="noopener noreferrer">Registro de fuentes clínicas ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/feat/prototipo-interfaz/docs/DECISIONES.md" target="_blank" rel="noopener noreferrer">Decisiones de identidad ↗</a>
  </section>
  <section class="sources-card"><h2>Privacidad en esta versión</h2><p>Los valores permanecen exclusivamente en memoria durante la sesión abierta: no se usan cookies, almacenamiento local ni servicios remotos. Al recargar se pierden los datos.</p></section></div>`;
}
function render() {
  const contents = current.page === 'home' ? home() : current.page === 'module' ? moduleView() : current.page === 'evaluation' ? evaluation()
    : current.page === 'summary' ? summary() : current.page === 'tools' ? tools() : sources();
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
  if (!el || !['evaluation','module'].includes(current.page)) return;
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
  const counter=document.getElementById('section-count');
  if (!counter) return;
  const fields=current.page==='module'?moduleFields(current.module,current.mode):SECTIONS[current.step].fields.map(f=>f.id);
  const n=fields.filter(key=>fieldState(draft,key)==='registrado').length;
  counter.textContent=current.page==='module'?n+' de '+fields.length+' registrados':n+' registrados';
});
app.addEventListener('click', event => {
  const btn = event.target.closest('button[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'start') return start(btn.dataset.focus || 'integral');
  if (action === 'start-module') {
    if (!MODULE_BY_ID[btn.dataset.module]) return;
    current.module=btn.dataset.module; current.mode='quick'; return navigate('module');
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
    draft = createDraft(); current = { page: 'home', step: 0, focus: 'integral', module:null,mode:'quick' };
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
