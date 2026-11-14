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

## Incremento: revisión de IECA/ARA-II administrado

### Auditoría previa

La base cb709c0c reproduce 319 pruebas. Las clases IECA/ARA-II y el campo de optimización ya existían, pero no distinguían un cambio propuesto de un inicio/aumento administrado ni permitían comparar creatinina con una referencia fechada previa.

### Reglas y límites

KDIGO 2024 PP 3.6.2–7, verificados en esta revisión: comprobar PA, creatinina y K en 2–4 semanas tras inicio o aumento, individualizando controles más precoces; revisar aumentos de creatinina >30 % en las primeras cuatro semanas y evitar suspensiones automáticas por TFGe <30 o hiperpotasemia aislada.

La nueva función `evaluateRenalTreatment` opera sobre una única actuación vigente declarada, confirmada expresamente como administrada. No mantiene un historial de cambios RAAS ni registra una nueva administración. Se requiere clase IECA/ARA-II actual, conciliación con principio activo/dosis en texto y contexto adulto estable. No selecciona molécula, dosis, escalada ni suspensión; no extrapola a ARNI.

La ventana de 14–28 días se calcula desde la fecha efectiva confirmada y se presenta como referencia, sin crear cita, recordatorio u orden de analítica. Si pasó, no se reinicia desde hoy. No se genera ventana cuando la actuación no está confirmada, hay fechas incompatibles o existe una alerta de seguridad. La fecha basal debe ser anterior o coincidente con el cambio; se debe verificar clínicamente su idoneidad, sin asumir un plazo universal de vigencia.

Los tres controles deben tener valor positivo y fecha posterior o coincidente con el cambio y no posterior a la evaluación. Controles previos no cierran seguimiento; controles tempranos tampoco cierran automáticamente la revisión de 2–4 semanas. Un dato desconocido o no disponible no equivale a un resultado normal.

La variación de creatinina se calcula solo con referencia válida y orden temporal compatible. El umbral es estrictamente >30 %, con tolerancia aritmética de 1e-9 puntos porcentuales para ruido de coma flotante. Una subida fuera de cuatro semanas sigue provocando revisión, sin atribución causal automática al IECA/ARA-II. Un aumento ≤30 % tampoco acredita seguridad global.

Doble bloqueo, contexto especial, hipotensión sintomática, LRA o hiperpotasemia impiden el calendario rutinario. Las alertas del panel se elevan a la salida renal general. Un cambio pendiente de revisión evita presentar solo el control anual de ERC estable.

### Auditoría posterior

361/361 pruebas locales superadas y sintaxis correcta: 42 casos nuevos y recorrido de interfaz renal ampliado con DOM simulado. Cubren fronteras temporales y de creatinina, fechas futuras, valor cero o no disponible, confirmación de actuación, ámbito, doble bloqueo y controles tempranos. No se han hecho pruebas visuales reales ni en iPhone.

Siguen pendientes la revalidación clínica independiente, seguimiento histórico de actuaciones RAAS, interpretación por producto y dosis, y cierre de los demás módulos. Esta revisión no revalida todas las fuentes clínicas previas de la aplicación.
