import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
const app=await readFile(new URL('../src/app.mjs',import.meta.url),'utf8');
test('No existe motor clínico anterior',async()=>{assert.deepEqual((await readdir(new URL('../src/',import.meta.url))).sort(),['app.mjs','ic','styles.css']);assert.doesNotMatch(app,/from ['"]\.\/clinical/);});
test('Portada y navegación IC',()=>{for(const title of ['CaHReMe','Valoración integral','Insuficiencia cardiaca','Diagnóstico','Clasificación','Tratamiento','Optimización','Seguimiento','Comorbilidades','Derivación','IC avanzada','IC descompensada'])assert.ok(app.includes(title),title);assert.ok(app.includes('Pendiente de desarrollo'));});
test('Todos los recursos PWA existen',async()=>{const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');const list=JSON.parse(sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1]);for(const p of list)await access(new URL('../'+p.slice(2).split('?')[0],import.meta.url));assert.ok(!list.some(p=>p.includes('/clinical/')));});

test('Diagnóstico condensado y sin recomendaciones activas',()=>{for(const title of ['Asistente diagnóstico','Sospecha clínica','Pruebas diagnósticas','BNP / NT-proBNP','Ecocardiografía','Referencias científicas'])assert.ok(app.includes(title),title);assert.ok(app.includes('Sin recomendaciones clínicas activas'));assert.ok(app.includes("if(hash==='ic/diagnostico')return diagnosis()"));});

test('Versión de recursos y caché coherente',async()=>{const html=await readFile(new URL('../index.html',import.meta.url),'utf8');const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');assert.match(html,/app\.mjs\?v=100/);assert.match(html,/styles\.css\?v=100/);assert.match(app,/suspicion\.mjs\?v=100/);assert.match(sw,/v0-100/);assert.doesNotMatch(sw,/ignoreSearch:\s*true/);assert.match(sw,/cache:'no-store'/);});

test('Sin selectores de estado administrativo de pruebas',()=>{assert.doesNotMatch(app,/data-investigation|setInvestigation|<span>Estado<\/span>/);});

test('Navegación común: marca de inicio y acceso a evolución',()=>{assert.match(app,/class="app-home-link" data-action="home"/);assert.match(app,/if\(hash==='ic\/clasificacion\/evolucion'\)return evolutionView\(\)/);assert.match(app,/function evolutionView\(\)/);});

test('Los desplegables tienen identidad estable y conservan su apertura en renderizado local',()=>{assert.match(app,/function capturePanels\(/);assert.match(app,/function restorePanels\(/);assert.doesNotMatch(app,/<details(?![^>]*data-panel=)[^>]*>/);assert.match(app,/restorePanels\(app,state\)/);});

test('Conclusión integrada de clasificación y navegación desde portada',()=>{assert.match(app,/if\(hash==='ic\/clasificacion\/conclusion'\)return classificationSummaryView\(\)/);assert.match(app,/classificationSummary\(clinicalContext\)/);assert.match(app,/data-action="classification-summary"/);});

test('Tratamiento tiene portada contextual y consulta directa independiente',()=>{assert.match(app,/if\(hash==='ic\/tratamiento'\)return treatmentHome\(\)/);assert.match(app,/function treatmentHome\(\)/);assert.match(app,/Consulta directa/);assert.match(app,/Sin recomendaciones terapéuticas activas/);});

test('Asistente terapéutico: primer paso y continuación a medicación sin prescripción',()=>{assert.match(app,/function therapyStepOne\(\)/);assert.match(app,/if\(id==='asistente'\)return therapyStepOne\(\)/);assert.match(app,/data-therapy-confirm/);assert.match(app,/Sin recomendaciones farmacológicas activas/);});

test('Asistente terapéutico: conciliación de medicación y tercera pantalla reservada',()=>{assert.match(app,/function therapyStepTwo\(\)/);assert.match(app,/function therapyStepThreePending\(\)/);assert.match(app,/data-med-field/);assert.match(app,/data-med-confirm/);assert.match(app,/Propuesta de tratamiento/);});

test('Medicación inline: acordeón, selección rápida y avance de fila',()=>{assert.match(app,/function advanceMedication\(/);assert.match(app,/med-accordion/);assert.match(app,/setMedicationQuickDose/);assert.doesNotMatch(app,/function medOptions\(/);});

test('Lista de medicación agrupada por familias educativas',()=>{assert.match(app,/function medicationCatalogView\(/);assert.match(app,/MEDICATION_FAMILIES/);assert.match(app,/Confirmo que he registrado toda la medicación relevante/);assert.match(app,/data-action="med-add-named"/);});

test('Registro de medicación con frecuencias específicas y alertas acotadas',()=>{assert.match(app,/medicationFrequencyOptions\(m\)/);assert.match(app,/function medicationSafetyView\(/);assert.match(app,/id="med-safety"/);});
