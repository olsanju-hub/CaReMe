import { SECTIONS, createDraft, setValue, setUnavailable, fieldState, sectionStats, totalStats, sectionForFocus } from './model.mjs';

let draft = createDraft();
let current = { page: 'home', step: 0, focus: 'integral' };
const app = document.getElementById('app');
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const counts = () => totalStats(draft);

function banner() {
  return '<div class="safety" role="note"><span class="safety-dot"></span><span>Prototipo de interfaz · No realiza diagnósticos, cálculos de riesgo ni recomendaciones de tratamiento.</span></div>';
}
function header() {
  return `<header class="topbar"><div class="topbar-inner">
    <button class="brand" type="button" data-action="home" aria-label="Volver al inicio de CaHReMe">
      <span class="brand-mark" aria-hidden="true">C</span>
      <span><strong>Ca<span class="brand-accent">H</span>ReMe</strong><small>Salud cardiorrenal-hepatometabólica</small></span>
    </button>
    <div class="top-right"><span class="dev-label">PROTOTIPO · V0.1</span>
      <button class="ghost small" type="button" data-action="sources">Fuentes y estado</button></div>
  </div></header>`;
}
function nav() {
  const items = [['home','Inicio','⌂'],['evaluation','Evaluar','＋'],['tools','Herramientas','▦'],['sources','Fuentes','≡']];
  return `<nav class="bottom-nav" aria-label="Navegación principal">${items.map(([id,label,sym]) =>
    `<button type="button" class="${current.page === id ? 'active' : ''}" data-action="${id}" ${current.page === id ? 'aria-current="page"' : ''}>
      <span aria-hidden="true" class="nav-symbol">${sym}</span><span>${label}</span></button>`).join('')}</nav>`;
}
function home() {
  const domains = [
    ['cardio','Ca','Cardiovascular','Presión arterial, lípidos y antecedentes.'],
    ['renal','Re','Renal','Función renal, albuminuria y persistencia.'],
    ['hepatico','H','Hepático','Bioquímica hepática y esteatosis.'],
    ['metabolico','Me','Metabólico','Glucosa, diabetes y adiposidad.']
  ];
  return `<div class="page home">
    <section class="hero">
      <div class="hero-copy"><div class="eyebrow light">ATENCIÓN PRIMARIA · ESPAÑA</div>
      <h1>Una visión completa.<br><em>Un paciente.</em></h1>
      <p>Explora los cuatro dominios desde una sola evaluación. Introduce únicamente la información disponible.</p>
      <button class="primary hero-button" type="button" data-action="start" data-focus="integral">Comenzar evaluación integral <span aria-hidden="true">→</span></button></div>
      <div class="hero-art" aria-hidden="true"><span class="orbit orbit-top">Ca</span><span class="orbit orbit-left">Re</span><span class="orbit orbit-right">H</span><span class="orbit orbit-bottom">Me</span></div>
    </section>
    ${banner()}
    <div class="section-heading"><div><div class="eyebrow">ACCESOS DIRECTOS</div><h2>Consulta por dominio</h2></div>
      <p>Una entrada rápida no oculta los demás dominios.</p></div>
    <div class="domain-grid">${domains.map(([id,short,title,detail]) =>
      `<button type="button" class="domain-card ${id}" data-action="start" data-focus="${id}">
        <span class="domain-monogram" aria-hidden="true">${short}</span>
        <strong>${title}</strong><span>${detail}</span><b aria-hidden="true">↗</b></button>`).join('')}</div>
    <section class="info-strip"><div><strong>Datos temporales</strong><p>Este prototipo conserva la información solo mientras permanece abierta la página. No se guarda en el navegador ni se envía a servidores.</p></div>
      <button type="button" class="text-link" data-action="sources">Ver limitaciones →</button></section>
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
    <div class="clinical-lock"><strong>Evaluación clínica todavía desactivada</strong>
      <p>No se calcula riesgo, no se diagnostica ERC/MASLD/DM2 y no se generan tratamientos. Cada módulo necesitará evidencia documentada y pruebas antes de su activación.</p></div>
    <div class="summary-actions"><button type="button" class="ghost" data-action="go-step" data-step="0">Volver a editar</button>
      <button type="button" class="primary" data-action="new">Finalizar y borrar datos</button></div></div>`;
}
function tools() {
  return `<div class="page interior"><div class="eyebrow">EN PREPARACIÓN</div><h1>Herramientas clínicas</h1><p>Este apartado se habilitará progresivamente al incorporar fórmulas verificadas con sus fuentes y pruebas.</p>
  ${banner()}<div class="tool-grid">${SECTIONS.filter(s => ['cardio','renal','hepatico','metabolico'].includes(s.id)).map(s =>
    `<div class="tool-card"><span class="tag">Pendiente de validación</span><h2>${escape(s.title)}</h2><p>Especificación clínica y casos de referencia todavía no aprobados.</p></div>`).join('')}</div></div>`;
}
function sources() {
  return `<div class="page interior"><div class="eyebrow">TRANSPARENCIA</div><h1>Fuentes y validación</h1>
  <p>CaHReMe es un prototipo. Actualmente solo está implementada la estructura de captura de datos, sin contenido de decisión clínica activado.</p>
  ${banner()}
  <section class="sources-card"><h2>Documentación de desarrollo</h2>
  <p>El proyecto se gestiona en un repositorio privado. El acceso a estos enlaces requiere los permisos correspondientes.</p>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/main/docs/DOCUMENTO_RECTOR.md" target="_blank" rel="noopener noreferrer">Documento rector ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/main/docs/MVP.md" target="_blank" rel="noopener noreferrer">Alcance del MVP ↗</a>
  <a href="https://github.com/olsanju-hub/CaReMe/blob/main/docs/DECISIONES.md" target="_blank" rel="noopener noreferrer">Decisiones de identidad ↗</a>
  </section>
  <section class="sources-card"><h2>Privacidad en esta versión</h2><p>Los valores permanecen exclusivamente en memoria durante la sesión abierta: no se usan cookies, almacenamiento local ni servicios remotos. Al recargar se pierden los datos.</p></section></div>`;
}
function render() {
  const contents = current.page === 'home' ? home() : current.page === 'evaluation' ? evaluation()
    : current.page === 'summary' ? summary() : current.page === 'tools' ? tools() : sources();
  app.innerHTML = header() + '<main id="main-content">' + contents + '</main>' + nav() +
    '<footer class="footer">CaHReMe · Identidad Atlántico · Prototipo no validado para uso asistencial</footer>';
}
function navigate(page) { current.page = page; render(); scrollTo({ top: 0, behavior: 'instant' }); }
function start(focus) {
  current.focus = focus;
  current.step = sectionForFocus(focus);
  navigate('evaluation');
}
app.addEventListener('input', event => {
  const el = event.target.closest('[data-field]');
  if (!el || current.page !== 'evaluation') return;
  draft = setValue(draft, el.dataset.field, el.value);
  const counter = document.getElementById('section-count');
  if (counter) counter.textContent = sectionStats(draft, SECTIONS[current.step]).registrado + ' registrados';
});
app.addEventListener('click', event => {
  const btn = event.target.closest('button[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'start') return start(btn.dataset.focus || 'integral');
  if (action === 'home') return navigate('home');
  if (action === 'tools') return navigate('tools');
  if (action === 'sources') return navigate('sources');
  if (action === 'evaluation') return navigate('evaluation');
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
    draft = createDraft(); current = { page: 'home', step: 0, focus: 'integral' };
    return navigate('home');
  }
});
render();
