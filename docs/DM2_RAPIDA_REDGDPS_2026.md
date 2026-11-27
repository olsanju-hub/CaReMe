# DM2: consulta rápida original de CaHReMe, versión técnica inicial

**Fecha documental:** 12/11/2026.  
**Ámbito:** Atención Primaria de personas adultas en España.  
**Código:** `src/clinical/dm2-rapida.mjs` y `src/app.mjs`.  
**Pruebas:** `tests/dm2-rapida.test.mjs`, `tests/dm2-rapida-ui.test.mjs`, `tests/cac-unidad.test.mjs`.  
**Estado:** orientación de revisión sin dosis individuales, sin órdenes terapéuticas, **pendiente de revisión clínica independiente**.

## Evidencia y procedimiento de actualización

1. [Fundación redGDPS — Algoritmo de tratamiento de DM2 2026](https://redgdps.org/algoritmo-de-tratamiento-de-la-dm2-de-la-redgdps-2026/). Documento oficial de actualización redGDPS: condicionantes clínicos y dos niveles de intensidad en torno a HbA1c 8,5 %. La fecha publicada de la nota de actualización es 25/09/2025 para la edición 2026.
2. [ADA — Standards of Care 2026, sección 9: Pharmacologic Approaches](https://diabetesjournals.org/care/article/49/Supplement_1/S183/163934). Recomendaciones 9.6–9.12, 9.16–9.21: objetivos individualizados, comorbilidades y beneficio cardiorrenal independiente de HbA1c; síntomas/intensidad, terapias GLP-1 y prevención de hipoglucemia.
3. [ADA — Standards of Care 2026, sección 6: Glycemic Goals](https://diabetesjournals.org/care/article/49/Supplement_1/S132/163927). Recomendación 6.2: valorar glucemia con más frecuencia, por ejemplo cada tres meses cuando no se cumple el objetivo o existen cambios terapéuticos; alrededor de dos veces/año cuando se mantiene objetivo.

Las fuentes originales se enlazan desde la propia salida. No se incluyen en el repositorio copias de PDF, gráficos ni textos extensos de la aplicación GlucoGuía de terceros; se ha implementado un algoritmo de software independiente basado en fuentes clínicas contrastadas.

## Contrato de salida

`evaluateDm2Quick(draft)` recibe la ficha compartida. Requiere para ubicar una rama rápida:
- `dm_prioridad`: condicionantes clínicos presentes (pueden coexistir varios, a diferencia de una única prioridad excluyente).
- `dm_control`: estado respecto a objetivo individual y tramo de 8,5% o ausencia de objetivo.

Utiliza como comprobaciones de contexto, **solo si se han aportado**, diagnóstico declarado de DM2/DM1, HbA1c cuantitativa, objetivo individual, síntomas, IC/ERC, TFGe, medicación, situación aguda, sospecha de cetoacidosis y seguridad.

Devuelve de forma estructurada:
- Estado: `datos_insuficientes`, `revisar_coherencia`, `seguridad_prioritaria` o `revision_pendiente`.
- `situation`, `nextSteps`, `safety`, `checks`, `missing`, `followUp`.
- `options`: candidatos de clase para revisión, con justificación y comprobaciones, nunca inicios confirmados.
- `sources` y `sourceIds`, con organismo, sección y URL verificable.
- `noPrescription: true`, `patientDose: null`, `actionPerformed: false`; cada opción tiene `prescription: null`.

La interfaz presenta el resultado bajo **«Ver orientación clínica rápida»** y en la vista de **Resumen** del módulo DM2. Los valores compartidos no se guardan fuera de la memoria de sesión. Cualquier edición de campos después de generar la orientación invalida el resultado anterior.

## Reglas clínicas implementadas

| Situación declarada | Conducta documental del motor | Barreras |
| --- | --- | --- |
| Faltan los dos criterios rápidos | Solicitar datos, no elegir vía de intensificación | Ningún candidato |
| DM2 negada o DM1 afirmada | Retener algoritmo de DM2 y revisar clasificación | Ningún candidato |
| Rama clínica contradicha por HbA1c introducida o por síntomas | Reconciliar antes de emitir candidatos | Ningún candidato |
| Sospecha de CAD/acidosis metabólica | Priorizar valoración urgente con glucemia, cetonas y ácido-base | No seguir algoritmo crónico, aun si el estado agudo se contradice con «estable» |
| Síntomas de hiperglucemia | Comprobar glucemia, signos de gravedad y desencadenantes; valorar cetonas e insulinización según situación clínica | No se prescribe insulina desde esta pantalla |
| HbA1c >10% (si cuantificada) | Señalar hiperglucemia importante y valorar insulinización según guía ADA | No equiparar «>10%» con inicio automático |
| HbA1c en objetivo individual | No intensificar por la cifra aislada; revisar hipoglucemias y tolerancia | El beneficio cardiorrenal puede justificar evaluar otras clases |
| Fuera de objetivo y HbA1c <8,5% | Contextualizar mono/doble/múltiples clases si existe medicación reconciliada | No asumir ausencia de fármacos si la lista no está registrada |
| HbA1c ≥8,5% sin síntomas | Valorar mayor intensidad de tratamiento en función de la historia, no de la cifra aislada | Confirmar síntomas, fármacos, comorbilidades |
| Objetivo HbA1c no establecido | Individualizar antes de intensificar por umbral general | Sin objetivo universal |
| IC/ ERC coexistentes | Revisar beneficio iSGLT2 por molécula incluso con HbA1c en objetivo | Confirmar indicación, TFGe, situación aguda y ficha CIMA de producto |
| ECV / riesgo elevado | Revisar terapias con beneficio demostrado por principio activo | No inferir financiación ni elegibilidad |
| Obesidad / afectación hepática | Revisar posibilidades de beneficio glucémico y ponderal | Sin atribuir indicación hepatológica a la sola esteatosis |
| Fragilidad / SU / insulina | Revisar simplificación y riesgo de hipoglucemia | No ajustar ni retirar dosis automáticamente |

**Importante:** el corte **8,5 %** de redGDPS organiza un tramo de **intensidad inicial**; **no es el objetivo individual de HbA1c**. ADA 2026 permite considerar insulina ante síntomas significativos o hiperglucemia muy elevada (HbA1c >10% o glucemia ≥300 mg/dl), pero el motor no deduce glucemia a partir de una HbA1c, no emite pauta ni sustituye evaluación de crisis.

La frecuencia sugerida de HbA1c es **orientativa**, no una cita programada: en objetivo estable, alrededor de seis meses; fuera de objetivo o con cambio terapéutico, aproximadamente tres meses. La monitorización de procesos agudos se decide por gravedad y no debe demorarse por estos plazos.

## Corrección renal en el mismo incremento

Se verificó [KDIGO CKD 2024](https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf), tabla de clasificación C/G/A: **A1 <30 mg/g, A2 de 30 a 300 mg/g, A3 >300 mg/g**.

**Antes de este bloque:**
- Sin unidad `unidad_cac`, `evaluateRenal` podía asumir mg/g y clasificar el valor.
- El corte exacto de **300 mg/g** estaba asignado a **A2**. Se había cuestionado este límite durante la primera auditoría, pero la comprobación visual de la tabla 3 KDIGO confirmó que era correcto.

**Después:**
- La categoría A solo se obtiene con **unidad explícita `mg/g`** y resultado válido. No se convierte automáticamente `mg/mmol`.
- `CAC_UNIT_MISSING` y `CAC_UNIT_INCOMPATIBLE` son hallazgos de **prioridad crítica** que bloquean propuestas farmacológicas integradas hasta completar/corregir el dato.
- `integratePatient` utiliza el CAC **validado por `evaluateRenal`**, nunca la cifra cruda para decidir elegibilidad.
- A3 se obtiene con **CAC >300 mg/g**. Las fronteras 29,99/30 y 300/300,01 están cubiertas por pruebas.
- Un CAC elevado no permite por sí solo atribuir ERC sin comprobar la cronicidad y otras causas.

## Límites para el próximo bloque

- Este incremento corresponde a **consulta rápida DM2**, no equivale aún a la revisión detallada ni a toda la cobertura terapéutica de GlucoGuía.
- El objetivo individual puede estar **declarado**, pero aún falta un sistema formal de consistencia entre objetivos numéricos específicos y HbA1c, incluido tratamiento hipoglucemiante actual con dosis verificadas.
- Las opciones por clase no sustituyen la selección validada por indicación/producto, seguridad, dosis y financiación.
- El riesgo cardiovascular global, vacunación, cribado de complicaciones y adherencia requiere ampliar el algoritmo con fuentes y criterios propios.
- No hay pruebas manuales en navegador real móvil ni revisión clínica/farmacológica independiente, ni evaluación regulatoria.
- Las alertas generales no sustituyen evaluación clínica de urgencia; la priorización depende de la información declarada.

**Criterio de aceptación de esta iteración:** resultado rápido reproducible, no prescriptivo, diferenciando estado glucémico, síntomas, comorbilidades, tratamientos actuales y datos contradictorios; corrección del fallo CAC; regresión completa de CI. El PR debe seguir como borrador.

## Actualización posterior: DM2 detallada (12/11/2026)

Ya existe una primera orientación de la consulta detallada, basada en la HbA1c medida y **el objetivo numérico individual**, con controles de medicación, adherencia, seguridad y datos incompletos. El módulo rápido sigue siendo independiente, y la revisión detallada no ofrece recetas ni dosis. La seguridad clínica de ambas rutas se contrasta ahora con las alertas de la evaluación integral. Consultar [DM2_DETALLADA_ADA_REDGDPS_2026.md](DM2_DETALLADA_ADA_REDGDPS_2026.md). La validación clínica externa y la paridad completa siguen pendientes.
