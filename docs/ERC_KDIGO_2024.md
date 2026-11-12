# Consulta renal dirigida y auditoría de continuidad

Fecha: 12/11/2026. Base revisada: cdfbc4f2471a3959641be96761ef4d1f071cd936, rama feat/prototipo-interfaz, PR #4.

## Auditoría previa

Se inspeccionaron las definiciones de captura, clasificación renal y FIB-4, procedencia, auditoría transversal, integración y composición de resultados dirigidos. Se reprodujeron las 288 pruebas de la base y el control de sintaxis. La existencia de pruebas no acredita corrección clínica de todas las reglas previas.

Insulinización e IC ya tienen motores propios. ERC tenía G/A y tarjetas transversales, pero no una salida dirigida de seguimiento/derivación. La matriz conservaba descripciones antiguas sobre ausencia de otros resultados; se ha actualizado ese inventario sin borrar el registro histórico.

## Fuentes verificadas para este incremento

[KDIGO 2024, guía completa](https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf): criterios de ERC y tablas G/A; PP 1.1.3 (cronicidad); PP 2.1.1–5 (seguimiento); PP 2.2.1 (riesgo y derivación); figura 48 (derivación); tabla 28, p. S227 (potasio).

[Estado editorial KDIGO](https://kdigo.org/guidelines/ckd-evaluation-and-management/): la actualización farmacológica 2027 está en revisión tras consulta pública. No se utiliza como guía final.

No se revalidaron en este incremento todas las referencias ESC/ADA/CIMA del código previo; permanecen dentro de la revisión clínica independiente pendiente. No se declara validado el conjunto de la aplicación.

## Contrato funcional

`evaluateKidney(draft, mode)` devuelve clasificación descriptiva G/A, información pendiente, alertas, comprobaciones, orientación de seguimiento y criterios parciales de derivación. Rápida y detallada comparten barreras; el resumen renal presenta la misma evaluación. No diagnostica ERC, prescribe o calcula dosis.

Se conserva A2 30–300 mg/g de la tabla 3. La figura 48 usa ≥300 mg/g con hematuria para un criterio distinto de derivación: no se confunden ambas reglas.

TFGe <30 permite valorar Nefrología aunque falte cronicidad; si es reciente o sintomática se valora urgencia primero. CAC >700 exige confirmación del valor actual en muestras repetidas. No se interpreta una ausencia de criterios mostrados como ausencia de necesidad de derivación.

K ≥6,5: actuar inmediatamente. K 6,0–6,4 con enfermedad aguda o LRA: evaluación hospitalaria; en resultado inesperado con paciente bien, repetir como máximo en 24 h según valoración clínica, sin demorar atención por síntomas/ECG. Se añade retención transversal de candidatos con K ≥6 aun sin IC.

Sin cronicidad, fechas válidas, estabilidad y datos de ámbito no se asigna seguimiento estable. G1/G2 A1 no confirma ERC por sí solo. En ERC estable documentada se muestra control de TFGe/CAC al menos anual, individualizando mayor frecuencia; no se genera cita. Las referencias de variación >20 %, caída >30 % tras tratamiento hemodinámico y duplicación del CAC se muestran como comprobaciones prospectivas: no se calcula tendencia con datos inexistentes.

Ámbitos de pediatría, embarazo, diálisis y trasplante requieren circuito específico. No se extrapolan pautas.

## Auditoría posterior

319 pruebas locales superadas, cero fallos; `npm run check` incluye sintaxis. Se añadieron 31 pruebas: umbrales renales y de potasio, fechas inválidas/futuras, unidades ausentes, cronicidad, ámbito especial, valor no disponible, retención transversal y navegación con DOM simulado. Dos aserciones sobre edad detectaron la limitación del campo adulto; el motor ahora reconoce una edad pediátrica explícita como fuera de ámbito. Una prueba de interfaz se corrigió para aportar unidad de CAC antes de esperar una derivación interpretable.

No se han realizado pruebas visuales reales ni revisión en iPhone. La caché estática y la lista permitida del servidor incluyen el nuevo motor.

## Pendientes

- KFRE calculado y validado, evolución longitudinal y amplitud completa de criterios de derivación.
- Conciliación renal por principio activo y ruta RAAS con monitorización tras cambios confirmados; no se añaden dosis en este bloque.
- Completar circuitos hepático y de obesidad, incluido FIB-4 informado.
- Validación clínica independiente de todos los módulos, verificación individual de fuentes previas y QA visual móvil.

PR en borrador sin fusión. Sin paridad funcional completa ni aprobación asistencial.
