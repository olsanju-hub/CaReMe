# Insuficiencia cardíaca · orientación por FEVI y congestión (ESC 2026)

**Revisión:** 12 de noviembre de 2026.  
**Ámbito:** atención primaria de adultos; consulta dirigida y valoración integral de CaHReMe.  
**Estado:** primera implementación técnica, no prescriptiva. No existe aún validación clínica independiente, evaluación regulatoria ni pruebas manuales en iPhone.

Código: `src/clinical/insuficiencia-cardiaca.mjs`. Interfaz: `src/app.mjs`. Pruebas: `tests/insuficiencia-cardiaca.test.mjs`, `tests/insuficiencia-cardiaca-ui.test.mjs`.

## 1. Fuentes verificadas y cambio de clasificación

**Fuente rectora:** [Sociedad Europea de Cardiología, *2026 ESC Guidelines for the management of heart failure*, publicada el 28/08/2026](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/heart-failure). [Texto original, *European Heart Journal* 47(38), pp. 5346 y siguientes](https://academic.oup.com/eurheartj/article/47/38/5346/8766302).

ESC **2026** sustituye los tres grupos de FEVI (≤40 %, 41–49 %, ≥50 %) de ESC 2021/2023 por dos fenotipos:
- **IC con FEVI reducida (IC-FEr): FEVI <50 %**, junto a clínica compatible.
- **IC con FEVI preservada (IC-FEp): FEVI ≥50 %** y síntomas/signos compatibles **más evidencia objetiva** estructural o funcional de alteración del llenado/disfunción diastólica, apoyada por péptidos natriuréticos. **FEVI aislada no establece diagnóstico.**

[ESC 2023, actualización histórica](https://academic.oup.com/eurheartj/article/44/37/3627/7246292): se conserva para comparación, **no** como criterio de clasificación actual.

**Tratamiento resumido según ESC 2026:** en IC-FEr sintomática, revisar ARNI/IECA (ARA-II si intolerancia), betabloqueante con evidencia, antagonista del receptor mineralocorticoide y un iSGLT2. En IC-FEp sintomática confirmada, revisar iSGLT2 y ARM según indicación y formulación. Para congestión clínica, los diuréticos de asa se individualizan según estado de volumen; la ausencia de congestión no justifica un diurético por la FEVI aislada.

**Fichas CIMA-AEMPS consultadas:**
- [Empagliflozina, Jardiance](https://cima.aemps.es/cima/dochtml/ft/114930014): IC crónica sintomática; la aplicación no extrapola restricciones de diabetes a IC.
- [Dapagliflozina, Forxiga](https://cima.aemps.es/cima/dochtml/ft/112795007/): IC crónica sintomática; no recomienda inicio con TFGe <25 ml/min/1,73 m².
- [Finerenona, Kerendia](https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html): **indicación de IC crónica sintomática con FEVI ≥40 %**. Esa frontera de ficha técnica **es distinta** de la frontera ESC 2026 de clasificación IC-FEr (<50 %) y no puede utilizarse para atribuir fenotipo. La ficha requiere valorar potasio, TFGe e interacciones. No duplicar ARM ni confundir dosis de ERC-DM2 con las de IC.

Las fuentes respaldan las opciones por clase; **ninguna clase equivale a una autorización para prescribir un producto concreto** sin verificar ficha, indicación y contexto.

## 2. Contrato de entrada

**Rápida:** `ic` (antecedente declarado), `ic_fevigrupo` (nuevo grupo ESC 2026), `congestion`, `ic_alarma` (signos de alarma). El grupo «FEVI desconocida» sigue permitido. Se mantienen opciones históricas de FEVI solo como entradas a revisar, no para diagnóstico.

**Detallada:** añade FEVI numérica y fecha, evidencia objetiva de IC-FEp, síntomas/estadio, estabilidad respiratoria y hemodinámica, presión arterial, frecuencia cardíaca, TFGe y fecha, potasio y fecha, sospecha de LRA, situación aguda, clases actuales reconciliadas, alergias y embarazo. Los datos se comparten con la ficha integral sin persistencia de información clínica.

## 3. Reglas operativas principales

| Condición | Resultado programado | Restricción |
| --- | --- | --- |
| FEVI <50% e IC clínica confirmada | IC-FEr ESC 2026 | No diagnosticar por FEVI aislada |
| FEVI ≥50% y evidencia objetiva documentada | IC-FEp compatible | Requiere clínica y pruebas objetivas; revisar ecocardiograma y péptidos |
| FEVI ≥50% sin evidencia objetiva | «IC-FEp no establecida» | No ofrecer inicio por fenotipo |
| Grupo declarado contradice FEVI numérica | Conciliación | No ofrecer inicio farmacológico |
| Congestión estable y evaluación completa | Revisión de diurético de asa y seguimiento de volemia | Ninguna dosis ni orden de inicio |
| IC-FEr confirmada sin alarmas, laboratorios disponibles y tratamiento reconciliado | Evaluar cuatro clases fundamentales | Diferenciar clase ya administrada frente a candidato |
| IC-FEp confirmada estable | Revisar iSGLT2 y ARM | No trasladar automáticamente RAAS/betabloqueantes como pilares por FEVI |
| Potasio >5,5 mmol/L o ≥6 mmol/L | Priorización de seguridad; a ≥6 valorar ECG y atención urgente según situación | El punto de corte es una barrera operativa conservadora, no un algoritmo completo de hiperpotasemia |
| K ≥5,0 o TFGe <30 para vía genérica | No mostrar candidato genérico de ARM esteroideo | Finerenona cuenta con **vía CIMA diferenciada**: FEVI ≥40, TFGe ≥25, K ≤5,0 y contraindicaciones comprobadas; no confundir ambas vías |
| Doble declaración de IECA/ARA-II/ARNI | Conciliación | No duplicar tratamientos de RAAS |
| Signos de hipoperfusión, hipoxemia, disnea intensa, dolor torácico sugestivo de isquemia, síncope o hipotensión sintomática | Seguridad prioritaria, evaluación de constantes/ECG/oxigenación y derivación según gravedad | No ejecutar modificaciones del tratamiento crónico |
| FEVI fechada después de evaluación, fecha imposible o entradas invalidas | Bloqueo de coherencia | Repetir/confirmar medición y fecha |
| Medicamentos sin conciliar, TFGe/potasio/PA o alarmas sin valorar | Datos insuficientes | No mostrar candidatos de inicio |

Si el paciente declara simultáneamente una alarma y «sin señales de alarma», el motor **conserva la alarma a efectos de seguridad**, bloquea cualquier candidato y exige reconciliar el formulario. Un dato invalidado no implica ausencia de peligro.

## 4. Salida y seguimiento

`evaluateHeartFailure(draft,mode)` produce:
- `state`: `revision_pendiente`, `datos_insuficientes`, `revisar_coherencia` o `seguridad_prioritaria`.
- `phenotype`, `situation`, `steps`, `alerts`, `checks`, `missing`.
- `options` para revisión: iSGLT2, ARM, RAAS/ARNI, betabloqueante y descongestión cuando se cumplen las condiciones implementadas. No sustituye farmacología individual.
- `sourceIds` y `sources`, con hipervínculos a ESC y fichas CIMA.
- `followUp`: revisión de síntomas, presión/FC, TFGe y electrolitos tras cambios **realmente efectuados**.

Todas las alternativas tienen `patientDose:null`, `prescription:null` y `actionPerformed:false`. La app **no registra cambios, altas, dispensaciones, suspensiones ni citas**.

La revisión de descompensación es prioritaria respecto a la optimización crónica. Los controles en las primeras semanas deben individualizarse y, tras hospitalización por IC descompensada, la ESC 2026 destaca una estrategia de reevaluación clínica frecuente.

## 5. Auditoría previa y posterior

**Hallazgos previos:** ausencia de algoritmo IC, grupo FEVI de clasificación anterior/provisional, formulario sin evidencia específica de IC-FEp ni red flags, sin diferenciación por congestión y sin salida dirigida al profesional.

**Implementado:** captura rápida y detallada, clasificación **<50/≥50**, evidencia diagnóstica, orientación por clases y medicamentos actuales, bloqueos de seguridad, comprobación de fechas y cálculo de pasos de revisión. Panel visible en ambas consultas y en resumen.

**Auditoría técnica posterior:** pruebas de límites 39,9/40/49,9/50 %, evidencia insuficiente, diuréticos según congestión, clases ausentes/presentes, potasio, TFGe, hipotensión, LRA, embarazo, medicamentos duplicados, señales de alarma y contradicción «sin alarmas» + señal grave. También pruebas de navegación y caché PWA.

**Riesgos pendientes:** no hay calculadora de péptidos natriuréticos ni confirmación ecocardiográfica automática; no se verifica la etiología ni la FEVI recuperada, no se modelan dispositivos ni toda la farmacoterapia de IC, no se titulan dosis individuales, no se realiza seguimiento de peso domiciliario automatizado y falta validación en casos externos. Los cambios en criterios ESC 2026 exigen reauditar reglas heredadas de IC de las monografías de productos.

**Liberación:** PR #4 en borrador; sin validación clínica, revisión móvil ni aprobación regulatoria.

## Auditoría adicional de indicación de ARM y ficha CIMA (12/11/2026)

Se verificó de nuevo [ESC 2026, tabla 5](https://academic.oup.com/eurheartj/article/47/38/5346/8766302) y la [ficha CIMA actual de Kerendia](https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html). La guía ESC 2026 sitúa los ARM entre los tratamientos fundamentales de IC sintomática y advierte de mayor riesgo con **K ≥5,0 mmol/L** o deterioro de función renal. CIMA mantiene una **indicación particular** para finerenona en IC crónica sintomática con **FEVI ≥40 %**, **TFGe ≥25 ml/min/1,73 m²** y **K ≤5,0 mmol/L** para valorar inicio. La condición de seguridad **no es intercambiable** con espironolactona/eplerenona, ni convierte 40 % en umbral de clasificación ESC.

**Cambio implementado:** el motor muestra una única opción genérica de revisión de ARM cuando TFGe ≥30 y K <5,0. Si no procede esa vía genérica, permite **solo una alternativa diferenciada de finerenona** con FEVI ≥40, TFGe ≥25, K ≤5,0 y confirmación negativa de Addison, uso de inhibidores potentes CYP3A4 y hepatopatía grave. Los campos desconocidos impiden mostrar este candidato. Una declaración de ARM existente impide sugerir otro inicio. Se conservan los límites por ficha y no se emiten dosis.

La tarjeta diferenciada enlaza directamente a la **revisión CIMA de finerenona para IC**. La ficha obliga a revisar potasio y TFGe a las **4 semanas** de inicio, reinicio o modificación real de dosis; el sistema no crea una cita ni presupone que esa actuación se realizó. Para K exactamente 5,0 se explicita la cautela y comprobación del laboratorio.

**Casos añadidos** en `tests/ic-finerenona-esc2026.test.mjs`: FEVI 39,9/40/45, TFGe 24,99/25/30, K 4,99/5,0/5,01, contraindicación por Addison/CYP3A4, ausencia de dato, ARM preexistente, IC descompensada y potasio ≥6. No se sustituye la necesidad de revisión clínica por pasar esas pruebas.

Se mantienen pendientes la selección por producto, revisión farmacológica independiente y validación de casos clínicos externos.
