# Integración terapéutica multiorgánica — especificación v0.1

**Fecha:** 2026-11-11 · **Estado:** bloque funcional **para revisión profesional**, no prescriptivo.  
**Archivo de implementación:** `src/clinical/integracion.mjs`  
**Pruebas:** `tests/integracion.test.mjs`

## 1. Contrato de seguridad

La herramienta no inicia, cambia, retira ni prescribe medicación. No elige molécula ni dosis. Las tarjetas son **candidatos de revisión** y sus comprobaciones son condiciones **pendientes de verificar**, incluso cuando un formulario parece completo. Las acciones reales requieren confirmación del profesional.

- **Alerta:** hay una condición de seguridad potencialmente relevante (ejemplo: cetoacidosis sospechada o terapia aparentemente duplicada).
- **Opción:** evidencia para valorar una clase farmacológica con beneficio en uno o varios órganos. **Nunca equivale a elegibilidad completa o indicación automática.**
- **Contexto:** falta confirmar diagnóstico, medicación actual, función renal o situación hepática; no se infiere un resultado normal.

**Orden de salida:** alertas → opciones a considerar → datos pendientes. Ninguna tarjeta presenta un paciente como «apto» para un medicamento. Un resultado ausente se mantiene ausente.

## 2. Fuentes científicas comprobadas

| Código | Fuente exacta | Alcance |
| --- | --- | --- |
| KDIGO-2024-CKD | [KDIGO 2024 CKD guideline](https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf), recomendaciones 3.7.1, 3.7.2, 3.8.1, 3.9.1 | iSGLT2, ARM no esteroideos y arGLP1 en ERC |
| ADA-2026-9 | [ADA Standards of Care 2026, Section 9](https://diabetesjournals.org/care/article/49/Supplement_1/S183/163934), recomendaciones 9.7–9.13 | Tratamiento de DM2 según ECV, IC, ERC y adiposidad |
| ADA-2026-11 | [ADA Standards of Care 2026, Section 11](https://diabetesjournals.org/care/article/49/Supplement_1/S246/163914), recomendaciones 11.7a–b | Protección cardiorrenal en DM2 y ERC |
| ESC-HF-2026 | [ESC 2026 Guidelines for management of heart failure](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/heart-failure), sección 6.1.2 | Tratamiento de IC sintomática con independencia de FEVI, adaptado al individuo |
| EASL-EASD-EASO-MASLD-2024 | [EASL-EASD-EASO 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11299976/), apartado sobre terapias para comorbilidades y figura 4 | Diabetes, obesidad y MASLD; distinguir medicamentos metabólicos de tratamiento hepático dirigido |
| CIMA-AEMPS-EMPAGLIFLOZINA | [Empagliflozina Tecnigen, ficha técnica](https://cima.aemps.es/cima/pdfs/es/ft/90784/FT_90784.html.pdf), apartado 4.4 | Cetoacidosis, suspensión en enfermedad aguda grave/cirugía mayor y uso según TFGe |
| CIMA-AEMPS-FINERENONA | [Kerendia, ficha técnica](https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html), apartados 4.2–4.5 | En ERC asociada a DM2, no iniciar finerenona con K >5,0 mmol/L; revisar ARM concomitante e interacciones |

Las fichas CIMA citadas corresponden a **productos concretos**: empagliflozina y finerenona; no validan automáticamente la posología, indicaciones ni advertencias de todas las moléculas de sus respectivas clases. Antes de recomendar una molécula será obligatoria la comprobación **individual** de su ficha vigente. El módulo no genera dosis.

Las indicaciones, recomendaciones, autorizaciones europeas y financiación pueden cambiar: la matriz se versionará antes de uso asistencial. Las normas ESC 2026 deben prevalecer sobre resúmenes ESC de años previos en los puntos en que sean concordantes con evidencia actual.

## 3. Entradas compartidas

- Diagnósticos declarados: DM2, enfermedad cardiovascular, IC, ERC, hepatopatía/esteatosis.
- Documentación renal: persistencia, TFGe, CAC, potasio, normalidad de potasio y optimización IECA/ARA-II.
- Metabolismo: IMC informado y contexto metabólico.
- Medicación: clases actuales, conciliación, alergias revisadas; no se presume que un cuadro en blanco equivale a ausencia.
- Seguridad: estado clínico agudo, cirugía/ayuno prolongado y sospecha de cetoacidosis.
- Hepático: FIB-4 calculado y contexto de aplicabilidad.

No se recopilan nombres, DNI, números de historia ni se guardan datos al recargar.

## 4. Reglas implementadas

| ID de regla | Disparador | Estado y limitación |
| --- | --- | --- |
| SGLT2-REVIEW | IC declarada o DM2 + ERC documentada como crónica; TFGe ≥20, sin estado agudo ni sospecha declarada de cetoacidosis | **Opción para revisar**, exige conciliación y datos de seguridad; no propone dosis ni inicio |
| SGLT2-EGFR-UNKNOWN | Indicación potencial y TFGe no disponible | Contexto; **sin opción de inicio** |
| SGLT2-LOW-GFR | Indicación potencial y TFGe <20 | Contexto; **sin inicio automático**. No equivale a ordenar suspensión de un tratamiento existente |
| SGLT2-ACUTE-SAFETY | Indicación potencial y enfermedad aguda grave, cirugía mayor/ayuno prolongado o sospecha de cetoacidosis | Alerta prioritaria, **oculta la propuesta de inicio**; requiere valoración urgente si hay sospecha de cetoacidosis |
| KETO-URGENT-REVIEW | Sospecha de cetoacidosis, independientemente de ERC/IC y del fármaco registrado | Alerta de valoración inmediata, sin depender de otras reglas |
| SGLT2-CURRENT-ACUTE | Paciente con iSGLT2 registrado durante enfermedad aguda grave/cirugía mayor | Alerta para revisión del medicamento y situación aguda aunque no haya ERC/IC declaradas |
| GLP-ACUTE-DEFER | Valoración aguda en paciente que podría optar a terapia incretínica | Se suprime candidato de intensificación hasta reevaluación clínica |
| NSMRA-ACUTE-DEFER | Valoración aguda en paciente con posible elegibilidad ARM no esteroideo | Sin candidato de inicio durante enfermedad aguda |
| SGLT2-EXISTING | iSGLT2 ya registrado | Contexto; evita recomendar duplicación de clase |
| GLP-REVIEW | DM2 + ECV/ ERC crónica / obesidad por IMC aportado / enfermedad hepática declarada | Opción condicionada por indicación glucémica, CV, renal o peso; **no terapia dirigida a MASLD** |
| GLP-EXISTING | arGLP-1 o agonista dual GIP/GLP-1 registrado en caso pertinente | Contexto; sin nuevo inicio |
| INCRETIN-DOUBLE, INCRETIN-DPP4 | Combinaciones potencialmente redundantes | Alerta para conciliación, sin modificar tratamiento |
| HF-MED-REVIEW | IC declarada con pioglitazona o saxagliptina registradas | Alerta para comprobar la ficha del medicamento y su idoneidad |
| CKD-CHRONICITY | ERC declarada sin persistencia confirmada en ficha | Contexto; no convierte analítica aislada en ERC confirmada |
| NSMRA-REVIEW | DM2 + ERC crónica, CAC >30 mg/g y TFGe >25, sin bloqueo de seguridad | Opción sujeta a potasio estable normal y tratamiento IECA/ARA-II optimizado, comprobación de interacciones y ficha CIMA |
| NSMRA-K-BLOCK | Misma rama, potasio sérico >5,0 mmol/L | Alerta; **no se presenta inicio de finerenona como candidato** |
| NSMRA-MRA-EXISTING | Misma rama con clase ARM ya registrada | Alerta de conciliación; no se sugiere otro ARM mientras no se identifique el tratamiento actual |
| NSMRA-MISSING | DM2 + ERC crónica con CAC/TFGe incompletas | Contexto; no propone ARM no esteroideo |
| LIVER-NOT-INDICATION | Enfermedad hepática declarada sin otros condicionantes para GLP | Contexto: **la sola MASLD no autoriza farmacoterapia hepática** |
| FIB4-CROSS | FIB-4 calculado interpretable por encima de 2,67 | Contexto: priorizar evaluación adicional de fibrosis, sin diagnóstico automático |
| NO-PROFILE | Sin enfermedades o perfiles declarados | Contexto: completar antecedentes, no «paciente sano» |

**No automatizado:** indicación específica por molécula, embarazo, factores de riesgo de cetoacidosis no recogidos, interacciones exhaustivas, pruebas longitudinales, contraindicación renal/hepática individual, financiación y prescripción. No presentar estas dimensiones como ya revisadas.

## 4.1. Corrección por actualización de CIMA — finerenona

La ficha técnica española de Kerendia consultada el **2026-11-11** recoge **dos indicaciones** distintas: ERC con albuminuria asociada a DM2 e insuficiencia cardíaca crónica sintomática con FEVI ≥40 %. El motor incorpora la tarjeta contextual `FIN-HF-LABEL` cuando existen datos de IC y FEVI ≥40. **No traslada** las dosis de la indicación renal a la cardíaca.

El catálogo farmacológico diferencia pautas de referencia: en ERC-DM2 la dosis objetivo/máxima es **20 mg/día**, mientras que en IC la dosis objetivo puede ser **40 mg/día** cuando TFGe al inicio ≥60. En ambas indicaciones se requiere verificar K y TFGe antes de iniciar. La app sigue sin generar dosis individuales ni autorizaciones de prescripción.

Detalle completo: [Farmacología CIMA-AEMPS](FARMACOLOGIA_CIMA.md).

## 5. Condiciones que pueden invalidar las conclusiones

- Diagnóstico renal basado en medición aislada sin documentación de ≥3 meses.
- IC declarada sin confirmar sintomatología, situación de volemia o FEVI.
- TFGe no disponible, discordante o desactualizada.
- Medicación registrada solo por clase sin molécula ni dosis; fármacos en transición.
- Alergias revisadas «Sí» pero sin documentación fiable.
- Paciente con enfermedad aguda, ayuno prolongado, cirugía o sospecha de cetoacidosis. Estas situaciones priorizan alertas y aplazan candidatos crónicos.
- Potasio sérico >5,0 mmol/L en la rama de finerenona o un ARM ya registrado sin aclarar molécula.
- Sospecha de MASLD utilizada como indicación farmacológica hepática dirigida.
- Valor de FIB-4 usado sin contexto o en proceso agudo.

## 6. Pruebas y criterios para habilitar terapéutica real

La batería automatizada contempla multicomorbilidad, TFGe por debajo de 20, TFGe ausente, diagnóstico ERC no confirmado, seguridad aguda, duplicidad farmacológica, medicación existente, MASLD aislada, precondiciones de ARM no esteroideo y trazabilidad de fuentes.

**Pendientes antes de activar una recomendación concreta:** confirmar actualizaciones científicas, crear fichas farmacológicas independientes por principio activo, parametrizar dosis/ajustes/contraindicaciones desde CIMA-AEMPS, pruebas con casos clínicos externos, segunda revisión médica y revisión de alcance regulatorio como software de apoyo clínico.

**Ninguna salida de esta fase debe utilizarse como prescripción asistencial.**

## 7. Control del peso sin DM2 y fichas incretínicas (12/11/2026)

El motor añade `WEIGHT-REVIEW` cuando el IMC aportado es ≥30 o ≥27 y <30 con comorbilidad asociada al peso confirmada, incluso sin DM2, siempre como revisión de alternativas y no como autorización automática. Se activa `WEIGHT-EXISTING` si ya consta una terapia incretínica y `WEIGHT-ACUTE-DEFER` si hay proceso agudo. No se confunde la coexistencia de MASLD con una indicación hepática dirigida.

CIMA por producto: [INCRETINAS_CIMA.md](INCRETINAS_CIMA.md). Falta una comparación individual completa de seguridad, financiación e interacciones; no generar prescripciones ni pautas de escalada automáticas.
