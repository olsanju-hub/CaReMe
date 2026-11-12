# Insuficiencia cardíaca · orientación dirigida ESC 2026

**Fecha de revisión:** 12 de noviembre de 2026.  
**Alcance:** adultos en Atención Primaria con posible o conocida insuficiencia cardíaca (IC).  
**Estado:** prototipo **no prescriptivo**, sin validación clínica independiente, ni diagnóstico automático, ni autorización asistencial.  
**Código:** `src/clinical/insuficiencia-cardiaca.mjs`, `src/clinical/auditoria.mjs` y `src/app.mjs`.

## 1. Fuentes primarias y actualización relevante

1. [Sociedad Europea de Cardiología — ESC Guidelines for the management of heart failure 2026](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/heart-failure), publicada el **28/08/2026**; [texto original en European Heart Journal](https://academic.oup.com/eurheartj/article/47/38/5346/8766302), doi:10.1093/eurheartj/ehag100. Referencia principal actual.
2. [ESC 2026 — noticia de cambios en clasificación](https://www.escardio.org/news/news-room/congress-news/2026-esc-guidelines-for-the-management-of-heart-failure/). La guía elimina el grupo anterior de FEVI 41–49 % como categoría clínica independiente: **IC-FEr FEVI <50 %** e **IC-FEp FEVI ≥50 % con evidencia objetiva adicional**. No equivale a diagnosticar IC mediante FEVI aislada.
3. [ESC 2026 — tabla 5 (recomendaciones de IC crónica)](https://academic.oup.com/eurheartj/article/47/38/5346/8766302): iSGLT2 y ARM en IC sintomática independientemente de FEVI, con elección concreta según fenotipo, evidencia y producto; ARNI/IECA y betabloqueantes en IC-FEr estable; diuréticos de asa para síntomas/signos de congestión, con individualización por volemia.
4. [CIMA-AEMPS — Jardiance (empagliflozina)](https://cima.aemps.es/cima/dochtml/ft/114930014), [Forxiga (dapagliflozina)](https://cima.aemps.es/cima/dochtml/ft/112795007/) y [Kerendia (finerenona)](https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html). Las indicaciones, límites de TFGe y precauciones deben comprobarse por molécula y **por indicación**, no inferirse de la clase.
5. [ESC Focused Update 2023](https://academic.oup.com/eurheartj/article/44/37/3627/7246292), referencia **histórica**: su división FEVI ≤40 % / 41–49 % / ≥50 % **no** se utiliza como la clasificación ESC vigente.

Los vínculos a textos externos sirven para revisión profesional. Este desarrollo no incorpora ni reproduce código, figuras o PDF propietarios.

## 2. Contrato del módulo

Se dispone de consulta **rápida** (antecedente de IC, grupo de FEVI, congestión y señales de alarma) y **detallada** (FEVI medida y fechada, evidencia objetiva si FEVI ≥50 %, síntomas, estabilidad, constantes, TFGe/K fechados, medicación, alergias y factores de riesgo de efectos adversos).

**Fenotipo:** `classifyHf2026(fevi,evidencia)` informa una clasificación de datos, nunca diagnostica IC. FEVI de 49,9 % pertenece al grupo reducido. FEVI de 50 % requiere evidencias adicionales para clasificar IC-FEp. Un informe no fechado no acredita actualidad.

**Salida:** `evaluateHeartFailure(draft,mode)` devuelve `state` (`revision_pendiente`, `datos_insuficientes`, `revisar_coherencia` o `seguridad_prioritaria`), `phenotype`, `steps`, `options`, `alerts`, `checks`, `missing`, `followUp` y `sources`.

Cada propuesta farmacológica está etiquetada **`candidato_para_revision`**. `patientDose:null`, `prescription:null` y `actionPerformed:false` prohíben interpretar un resultado como una actuación realizada.

## 3. Prioridades de decisión

| Situación | Resultado implementado | Límite de seguridad |
| --- | --- | --- |
| IC desconocida o FEVI sin confirmar | Solicitar antecedentes, examen, ecocardiograma y, según caso, péptidos natriuréticos | No inferir IC por FEVI aislada |
| FEVI <50 % e IC sintomática estable | Revisar pilares ESC 2026: iSGLT2, ARM, ARNI/IECA (ARA-II si intolerancia), betabloqueante con evidencia | Evaluar tratamientos ya recibidos; no duplicar clases ni titular sin datos |
| FEVI ≥50 % | Requiere evidencia objetiva de alteración cardíaca/funcional y contexto clínico | Sin evidencia objetiva, no emitir propuestas de terapia fundacional |
| Congestión clínica presente | Revisar volemia, tratamiento de asa actual y respuesta; seguimiento de constantes y analítica | No generar ni modificar dosis de diuréticos |
| Ausencia de congestión | Revisar otras indicaciones, sin ofrecer diurético por FEVI solamente | Evitar sobretratamiento descongestivo |
| iSGLT2 o ARM ya registrado | Revisar continuidad, producto y tolerancia | No proponer un segundo principio activo de la misma clase |
| Potasio elevado o TFGe baja | Conciliar analítica y revisar ficha específica | No aplicar un umbral renal universal a todas las moléculas |
| FEVI mejorada o ausencia de síntomas actuales | Revisar evolución y terapias existentes | No retirar terapia fundacional por normalización aislada |

El plan se aplica únicamente al fenotipo reconocido y a la información aportada. La consulta rápida no prescribe ni propone inicio por carecer de las variables necesarias.

## 4. Barreras transversales y regresiones auditadas

- Señales de alarma: disnea intensa en reposo, hipoxemia, dolor torácico compatible con isquemia, síncope/hipotensión sintomática o hipoperfusión; no utilizar circuito rutinario de optimización crónica.
- Descompensación o inestabilidad, lesión renal aguda y sospecha de problemas agudos: priorizar evaluación clínica y destino.
- **K ≥6 mmol/L**: comprobación, ECG y decisión urgente según contexto. **K >5,5 y <6 mmol/L**: reconciliar el valor y tratamiento antes de nuevos candidatos; no se denomina automáticamente emergencia vital.
- **PAS <90 mmHg**: valorar perfusión y síntomas antes de titular. **PAS 90–99 mmHg**: advertencia de tolerancia hemodinámica, sin diagnósticos derivados del umbral aislado.
- Asociación simultánea declarada de **IECA + ARA-II/ARNI**, o más de una de esas clases: conciliación obligatoria también en integración multiorgánica y fichas CIMA.
- La revisión detallada requiere **fecha de FEVI, TFGe y K**, además de fecha de evaluación. La ausencia de una fecha no valida que el resultado sea actual; el sistema no impone un plazo universal de caducidad.
- Si se registra un grupo FEVI incompatible con su cifra o una analítica posterior a la fecha de evaluación, se retienen propuestas hasta reconciliar.
- En embarazo no se utiliza automáticamente el circuito farmacológico habitual de IC.

La revisión del motor se acompaña de casos de frontera FEVI 49,9/50, evidencia objetiva ausente, falta de fechas, K 5,6/6, duplicidad RAAS, congestión con o sin diurético y pacientes sin medicación reconciliada.

## 5. Interpretación de la seguridad y límites residuales

El bloqueo de candidatos **no** significa retirar medicación actual ni diagnostica hiperpotasemia o shock. Un aviso se debe interpretar clínicamente. El motor no selecciona moléculas concretas ni verifica por sí mismo interacciones, dosis, financiación o historial de ingresos.

**Pendiente:** revisión clínica independiente; validación de diagnóstico y fenotipo por datos objetivos reales; verificación de fichas AEMPS de tratamientos adicionales (betabloqueantes, ARNI y ARM esteroideos) antes de habilitar decisiones de molécula; plan operativo de seguimiento y derivación; revisión móvil, accesibilidad y evaluación regulatoria.

**Fusión/despliegue:** PR #4 permanece en borrador. No se habilita prescripción ni uso asistencial.

## Auditoría adicional de indicación de ARM y ficha CIMA (12/11/2026)

Se verificó de nuevo [ESC 2026, tabla 5](https://academic.oup.com/eurheartj/article/47/38/5346/8766302) y la [ficha CIMA actual de Kerendia](https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html). La guía ESC 2026 sitúa los ARM entre los tratamientos fundamentales de IC sintomática y advierte de mayor riesgo con **K ≥5,0 mmol/L** o deterioro de función renal. CIMA mantiene una **indicación particular** para finerenona en IC crónica sintomática con **FEVI ≥40 %**, **TFGe ≥25 ml/min/1,73 m²** y **K ≤5,0 mmol/L** para valorar inicio. La condición de seguridad **no es intercambiable** con espironolactona/eplerenona, ni convierte 40 % en umbral de clasificación ESC.

**Cambio implementado:** el motor muestra una única opción genérica de revisión de ARM cuando TFGe ≥30 y K <5,0. Si no procede esa vía genérica, permite **solo una alternativa diferenciada de finerenona** con FEVI ≥40, TFGe ≥25, K ≤5,0 y confirmación negativa de Addison, uso de inhibidores potentes CYP3A4 y hepatopatía grave. Los campos desconocidos impiden mostrar este candidato. Una declaración de ARM existente impide sugerir otro inicio. Se conservan los límites por ficha y no se emiten dosis.

La tarjeta diferenciada enlaza directamente a la **revisión CIMA de finerenona para IC**. La ficha obliga a revisar potasio y TFGe a las **4 semanas** de inicio, reinicio o modificación real de dosis; el sistema no crea una cita ni presupone que esa actuación se realizó. Para K exactamente 5,0 se explicita la cautela y comprobación del laboratorio.

**Casos añadidos** en `tests/ic-finerenona-esc2026.test.mjs`: FEVI 39,9/40/45, TFGe 24,99/25/30, K 4,99/5,0/5,01, contraindicación por Addison/CYP3A4, ausencia de dato, ARM preexistente, IC descompensada y potasio ≥6. No se sustituye la necesidad de revisión clínica por pasar esas pruebas.

Se mantienen pendientes la selección por producto, revisión farmacológica independiente y validación de casos clínicos externos.
