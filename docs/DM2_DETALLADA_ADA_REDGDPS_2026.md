# DM2 detallada · conciliación y decisión condicionada

**Fecha:** 12 de noviembre de 2026  
**Alcance:** Atención Primaria de adultos en España.  
**Estado:** prototipo técnico para revisión profesional, sin validación clínica externa. **No genera prescripciones.**  
**Módulo:** `src/clinical/dm2-detallada.mjs`  
**Interfaz:** `src/app.mjs`, formulario «Revisión detallada» y panel en «Resumen».  
**Pruebas:** `tests/dm2-detallada.test.mjs`, `tests/dm2-detallada-ui.test.mjs`, regresión general.

## 1. Fuentes primarias verificadas

- [Fundación redGDPS — Algoritmo de tratamiento de la DM2 2026](https://redgdps.org/algoritmo-de-tratamiento-de-la-dm2-de-la-redgdps-2026/). Versión de aplicación española, con condicionantes clínicos y niveles de intensidad según la situación glucémica. No convierte el corte docente **8,5 %** en objetivo individual.
- [ADA, Standards of Care in Diabetes 2026 — sección 6, Glycemic Goals](https://diabetesjournals.org/care/article/49/Supplement_1/S132/163927). Objetivo individualizado, limitaciones de HbA1c, hipoglucemias y desintensificación; recomendación 6.2 para periodicidad de evaluación.
- [ADA 2026 — sección 9, Pharmacologic Approaches](https://diabetesjournals.org/care/article/49/Supplement_1/S183/163934). Recomendaciones 9.16–9.23: individualizar según comorbilidades y riesgos, reconciliar hipoglucemiantes, no combinar iDPP-4 con arGLP-1/agonista dual GIP/GLP-1. HbA1c **≥1,5 puntos** por encima del objetivo justifica valorar combinación o terapia de mayor potencia; síntomas, HbA1c **>10 %** o glucemia **≥300 mg/dL** obligan a considerar insulinización según clínica, sin generar pauta automática.
- [ADA 2026 — sección 11, ERC](https://diabetesjournals.org/care/article/49/Supplement_1/S246/163914). Beneficio renal/cardiovascular de fármacos adecuados al perfil, independiente de HbA1c en ciertos escenarios.
- **CIMA-AEMPS:** metformina (Tarbis liberación inmediata), empagliflozina y dapagliflozina, cada una con ficha independiente. Otras fichas (semaglutida, tirzepatida) están catalogadas en [INCRETINAS_CIMA.md](INCRETINAS_CIMA.md). Los límites de una molécula no se extrapolan a toda la clase.

Las fuentes están enlazadas en el resultado. La selección por producto y las condiciones de financiación **no se deducen** de la presencia de una clase farmacológica.

## 2. Entradas de la consulta detallada

Se reutilizan campos compartidos y se incorporan variables específicas:

| Variable | Contrato |
| --- | --- |
| `dm2`, `dm1`, `edad`, `embarazo` | Confirmar ámbito de DM2 en adulto y descartar que corresponda a otra ruta, incluida gestación |
| `hba1c`, `fecha_hba1c`, `dm_hba1c_fiable` | HbA1c medida, fecha y limitaciones para su interpretación |
| `dm_objetivo`, `dm_objetivo_valor` | Categoría de objetivo y **límite numérico individual acordado**; la aplicación no lo fija automáticamente |
| `glucemia_actual`, `dm_sintomas` | Evaluación de gravedad cuando procede |
| `dm_hipoglucemias` | Ausencia, episodios leves, graves/recurrentes o dato desconocido |
| `farmacos_clases`, `farmacos`, `medicacion_revisada` | Conciliación de clases y principios activos; los nombres/dosis de texto libre **no se interpretan automáticamente** |
| `dm_dosis_confirmadas`, `dm_adherencia` | Dosis/pauta real confirmadas y adherencia |
| `tfge`, `fecha_tfge`, `ic`, `erc`, `persistencia`, `ecv`, `imc` | Condiciones cardiorrenales/metabólicas; no se diagnostican nuevas enfermedades a partir de un campo aislado |
| Datos de alergias, LRA, hipoxia, deshidratación y estado agudo | Barreras de seguridad; un campo «no valorado» no descarta contraindicación |

La mayoría de datos se comparten con la evaluación integral; el formulario dirigido evita recopilar identificadores personales y no utiliza almacenamiento persistente.

## 3. Cálculo y estados

`compareIndividualGoal(hba1c,upperLimit)` utiliza un límite superior proporcionado y confirmado por el profesional. Como el campo se define **«objetivo HbA1c inferior a X %»**, el valor **igual al límite** cuenta como fuera de objetivo. La diferencia se calcula en **puntos porcentuales**, no en porcentaje relativo.

Ejemplo puramente aritmético: HbA1c 8,5% y límite individual inferior a 7% → **+1,5 puntos**. No implica prescripción.

El motor `evaluateDm2Detail(draft)` devuelve:
- `revision_pendiente`: hay datos suficientes para una orientación no prescriptiva de clases.
- `datos_insuficientes`: faltan objetivo, datos de medicación, síntomas, hipoglucemias, calidad de HbA1c o información crítica.
- `revisar_coherencia`: discrepancia de diagnóstico, fechas, meta numérica/categórica, rama rápida o duplicidad relevante.
- `seguridad_prioritaria`: crisis metabólica, hiperglucemia marcada, hipoglucemias graves/recurrentes, embarazo, proceso agudo, LRA o tratamiento de metformina con TFGe <30, entre otros condicionantes.

El orden prioriza alertas de seguridad. **Ninguno de esos estados equivale a elegibilidad farmacológica.**

## 4. Conciliación y selección condicionada

Con información suficiente, el motor muestra solo **candidatos para revisión**. No se asignan moléculas, dosis ni instrucciones de inicio.

- Si la HbA1c está **por debajo del objetivo individual**, no se intensifica por esa cifra aislada. Puede revisarse protección cardiorrenal por indicación independiente de HbA1c.
- Si está **fuera del objetivo**, se revisan adherencia, dosis administradas y clases actuales antes de evaluar asociación/intensificación. La desviación **≥1,5 puntos** activa una advertencia de necesidad posible de combinación o terapia más potente; no una orden.
- Si se documenta **IC/ ERC** y la TFGe está disponible, se ofrece revisión de iSGLT2 por molécula; si ya existe uno, se muestra continuidad/reconciliación y no un segundo inicio.
- Si existe ECV u obesidad, se revisan clases con beneficio correspondiente; si hay incretina actual, el motor no plantea un inicio adicional de la misma familia.
- Metformina registrada requiere evaluar función renal y tolerancia; si TFGe <30, priorizar seguridad y ficha CIMA.
- Se identifican **iDPP-4 + arGLP-1/agonista dual**, **arGLP-1 + agonista dual** y **sulfonilurea + repaglinida** como duplicidades o asociaciones a revisar antes de sugerir nuevos cambios.
- Con **adherencia insuficiente** o **dosis no verificadas**, no se proponen nuevas clases. La prioridad es reconciliar y comprender la respuesta al tratamiento real.
- En embarazo, enfermedad aguda, sospecha de cetoacidosis, hipoglucemias graves o criterios de hiperglucemia importante no se muestra una propuesta rutinaria de intensificación.

La revisión por clase **no sustituye** la evaluación de ficha individual, interacciones, embarazo, financiación ni disponibilidad.

## 5. Reevaluación

La recomendación ADA 2026, sección 6.2, orienta a comprobar HbA1c **al menos dos veces al año** cuando hay estabilidad mantenida y **aproximadamente cada 3 meses** si no se alcanza objetivo o existen cambios de tratamiento. Son referencias de periodicidad, **no citas registradas** ni calendario generado automáticamente.

Los cuadros agudos se evalúan de acuerdo con su gravedad, sin esperar a un control programado de HbA1c.

## 6. Validación técnica y riesgos pendientes

**Pruebas implementadas:** objetivo inferior/igual/superior, brecha exacta de 1,5 puntos, meta numérica/categórica discordante, HbA1c no fiable, datos ausentes, medicación ya registrada, TFGe no disponible, protección cardiorrenal incluso en objetivo, hipoglucemia, glucemia 299/300 mg/dL, CAD, embarazo, LRA, metformina con TFGe <30, duplicidad farmacológica, adherencia insuficiente, navegación y ausencia de prescripción.

**Limitaciones persistentes:** no existe evaluación independiente de la fiabilidad de HbA1c (el formulario registra la declaración), reconciliación automatizada de nombres y dosis desde texto libre, cálculo de riesgo cardiovascular global, selección por producto/financiación o revisión externa de casos en una cohorte clínica. La consulta detallada todavía no equivale a un protocolo prescriptivo validado.

**Puertas de liberación:** revisión clínica independiente, actualización de fichas CIMA/BIFIMED por presentación, comprobación de seguridad de algoritmos, pruebas manuales en móvil y evaluación regulatoria. PR en **borrador**, sin fusión ni despliegue.
