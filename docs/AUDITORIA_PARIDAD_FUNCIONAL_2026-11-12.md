# Auditoría funcional verificada · GlucoGuía 1.6 → CaHReMe

**Fecha:** 12 de noviembre de 2026  
**Estado:** auditoría de cobertura y brechas, **no** validación científica ni clínica.  
**Aplicación auditada:** CaHReMe, repositorio privado `olsanju-hub/CaReMe`, rama `feat/prototipo-interfaz`, PR #4 (borrador).  
**Referencia original:** [GlucoGuía · Edición Congreso redGDPS](https://github.com/aarnal80/diabetes-congreso-mobile), versión 1.6. Autores acreditados en el repositorio original: Antonio Arnal y Francisco M. Adán Gil.

## 1. Método y evidencia

Se comparó directamente el **código fuente disponible**, no únicamente la descripción de producto:

| Fuente de comparación | Evidencia |
| --- | --- |
| GlucoGuía | `README.md`, `app.js`, `flow.js`, `mobile.js`, `drug-legend.js`, `sw.js`, `index.html`, `manifest.webmanifest` del repositorio público `aarnal80/diabetes-congreso-mobile`, rama principal |
| Revisión GlucoGuía | Blob de `app.js`: `c60bf8bc72db8a0a4b863b8e50c0a8d04dfb3705`, versión documentada 1.6 |
| CaHReMe | `src/consultas.mjs`, `src/model.mjs`, `src/app.mjs`, `src/clinical/engine.mjs`, `src/clinical/integracion.mjs`, monografías, seguridad, continuidad y pruebas |
| Especificación previa | [MATRIZ_EQUIVALENCIA_GLUCOGUIA.md](MATRIZ_EQUIVALENCIA_GLUCOGUIA.md) (versión histórica 0.1, escrita antes de los últimos bloques) |
| Inventario comprobable | [COBERTURA_FUNCIONAL_GLUCOGUIA.json](COBERTURA_FUNCIONAL_GLUCOGUIA.json) |

La web de GlucoGuía no pudo inspeccionarse como interfaz ejecutándose dentro de esta auditoría. La comparación **sí** se basó en su repositorio público real; la interfaz de CaHReMe tampoco se ha probado manualmente en iPhone. No confundir pruebas unitarias de Node con equivalencia visual/funcional de ambos productos.

**Límite jurídico:** el repositorio de referencia declara todos los derechos reservados sobre su adaptación. Este trabajo **describe capacidades observadas**, sin copiar código, textos clínicos extensos, gráficos ni PDF originales. La equivalencia exigida es **funcional** y exige validación clínica independiente; no equivalencia de implementación ni reproducción automática de criterios obsoletos.

## 2. Resultado global

- **6 de 6 módulos:** disponibles como rutas de consulta rápida y detallada, con captura clínica.
- **0 de 6 módulos:** paridad completa de **resultados clínicos y siguientes pasos** demostrada. Dos (ERC y hepático) disponen de calculadoras parciales; otros módulos presentan alertas o candidatos generales, pero no reproducen un recorrido decisional específico completo.
- **Evaluación integral:** disponible como capacidad extra de CaHReMe, con datos compartidos y auditoría transversal.
- **Fármacos:** siete productos documentados con fichas CIMA y barreras, pero **sin selección individual ni prescripción**; este avance no sustituye los seis algoritmos de consulta.
- **Seguridad:** las reglas de coherencia, fechas, clases y actuaciones confirmadas existen y son mejoras reales. Persisten bloqueos identificados en el apartado 5.

Una pantalla que solo muestra campos, G/A, FIB-4 o candidatos multiorgánicos no satisface todavía «igual funcionalidad» cuando la referencia devuelve **orientación y siguiente paso** según la rama seleccionada.

## 3. Paridad por consulta

| Consulta | Entradas y comportamiento comprobados en GlucoGuía 1.6 | CaHReMe comprobado en código | Resultado | Prioridad |
| --- | --- | --- | --- | --- |
| **DM2** | Rápida con condicionante predominante + control respecto a objetivo, incluyendo corte docente de HbA1c 8,5 % y síntomas. Detallada con HbA1c, objetivo individual, TFGe, IMC, síntomas, comorbilidades y medicación. Orienta intensidad, clases faltantes y escenarios sintomáticos | Captura rápida/detallada y datos reutilizados. Existen candidatos generales y fichas CIMA; **no existe salida de decisión DM2 específica que combine control, objetivos y clases actuales** | **Parcial (captura); salida clínica ausente** | **P0** |
| **Insuficiencia cardíaca** | Rápida FEVI categorizada y congestión; detallada FEVI exacta, TFGe, congestión y medicación. Orienta tratamiento por fenotipo, diuréticos si congestión y combinaciones a revisar | Captura FEVI/congestión, TFGe y medicación. Hay referencias iSGLT2/finerenona y avisos farmacológicos; **no hay resultado dirigido completo por FEVI, congestión y pilares** | Parcial | P1 |
| **ERC** | Rápida TFGe, CAC mg/g, cronicidad; detallada añade potasio y tratamiento. Valora confirmación de ERC, protección renal, tratamiento concomitante, hiperpotasemia y seguimiento | Captura y cálculo descriptivo de categoría G/A; iSGLT2/finerenona contextualizados, con seguridad por molécula. **Faltan la salida renal priorizada completa, manejo contextual de potasio y calendario longitudinal por módulo** | Parcial con cálculo | P1 |
| **Sobrepeso/obesidad** | Rápida IMC, DM2 y comorbilidad dominante; detallada incluye AOS, gonartrosis y obesidad sarcopénica. Integra medidas no farmacológicas, opciones por perfil, respuesta y valoración de cirugía | Captura de perfiles y comorbilidades; candidatos de fármacos para peso con/sin DM2; **faltan ruta estructurada de hábitos, protección muscular, reevaluación y derivación por respuesta** | Parcial | P1 |
| **Hepático** | Rápida edad, FIB-4 informado, evaluación de esteatosis/otras causas y elastografía opcional. Orienta bajo/intermedio/alto riesgo, elastografía y derivación | Captura FIB-4 informado, elastografía y contexto. Calcula FIB-4 **a partir de AST, ALT y plaquetas**; la cifra `fib4_informado` se analiza pero no alimenta el resultado clínico si faltan componentes. **Tampoco existe ruta operativa por elastografía/derivación** | Parcial con cálculo | P1 |
| **Insulinización** | Rápida inicio/intensificación/desintensificación y perfil clínico; detallada incluye IMC, TFGe, fragilidad, situaciones especiales y fármacos. Orienta opciones de basal, intensificación y simplificación | Captura de los tres recorridos y contextos especiales, pero **no existe algoritmo clínico por fase, riesgo de hipoglucemia y necesidad de seguimiento** | **Salida clínica ausente** | **P0** |

**Nota científica:** algunas ramas y clasificaciones propias de la referencia emplean documentos redGDPS de diferentes años. Se reproducirá su **capacidad de decidir**, contrastando umbrales/indicaciones con guías actuales antes de habilitar resultados. No se trasladarán sin examen las denominaciones FEVI, umbrales hepáticos ni criterios de seguimiento.

## 4. Requisitos transversales

| Requisito de referencia / mejora acordada | Evidencia CaHReMe | Estado |
| --- | --- | --- |
| Seis entradas dirigidas | `src/consultas.mjs::MODULES` + `src/app.mjs::moduleView` | Cubierto en código |
| Consulta rápida y revisión detallada | `MODULES.quick/detail` y pestañas `quick/detail/review` | Captura cubierta; **el botón «Resumen» no equivale a resultado clínico** |
| Cambio entre módulos sin reintroducir datos | `draft` compartido, `setValue()` | Cubierto |
| Séptima evaluación integral y comorbilidad simultánea | `evaluation`, `summary`, `integratePatient` | Mejora de CaHReMe presente |
| Informe de situación y siguiente paso específico por consulta | `consultationReview` muestra «Motor terapéutico pendiente de validación» | **Brecha P0** |
| Desglose por clases terapéuticas actuales y exclusiones | `farmacos_clases`, `integracion`, `auditoria` | Parcial: no equivale a resultados por cada rama |
| Cálculos renales y hepáticos | `evaluateRenal`, `evaluateFib4` | Parcial y no validados para uso asistencial |
| Fichas de siete productos CIMA | `farmacologia.mjs` y ficheros por clase/producto | Adicional, sin prescripción |
| Fuente específica desde resultado y PDF originales | GlucoGuía enlaza a PDF de sus seis algoritmos; CaHReMe enlaza a guías y documentación/CIMA, **sin biblioteca equivalente de algoritmos originales** | Parcial; respetar licencias |
| Leyenda contextual de clases/medicamentos | GlucoGuía `drug-legend.js`; CaHReMe tiene biblioteca de moléculas sin leyenda equivalente integrada en cada resultado dirigido | Pendiente P2 |
| Ajustes de lectura | GlucoGuía dispone de configuración en `mobile.js`; no se identificó control de preferencias de lectura equivalente en CaHReMe | Pendiente P2 |
| Instalación y uso sin conexión | CaHReMe contiene manifest y service worker | Implementación técnica; **sin prueba de instalación real** |
| Privacidad de la consulta | Estado en memoria, sin guardar datos identificativos | Cubierto como intención y código observado; auditoría de red pendiente |
| Identidad visual e iconografía | Paleta Atlántico y SVG provisionales | En desarrollo; icono final pendiente |
| Seguimiento condicionado a actuación realizada | Historial confirmado de finerenona y empagliflozina | Mejora adicional parcial; no cubre todos los recorridos |
| Equivalencia visual y accesibilidad móvil | Sin pruebas manuales de ambos entornos | No verificada |

## 5. Hallazgos que requieren corrección antes de ampliar los módulos

### P0 — No declarar equivalencia decisional mientras la salida sea captura

**Evidencia:** `src/app.mjs::consultationReview()` incluye todavía el aviso «Motor terapéutico pendiente de validación». Las tarjetas transversales de `integratePatient()` no aplican el resultado de cada consulta rápida a la elección/seguimiento de ese módulo. Se requiere un contrato de salida por módulo: `situación → próximos pasos → opciones/exclusiones → comprobaciones → seguimiento/derivación → fuentes`.

**Criterio de cierre:** pruebas con casos sintéticos en cada ruta, verificando que la modificación de un dato decisivo cambia la salida apropiada y que faltantes/contraindicaciones bloquean falsas conclusiones.

### P0 — CAC sin unidad explícita

**Evidencia:** en `src/clinical/engine.mjs::evaluateRenal()`, un CAC puede clasificarse si `unidad_cac` está vacía: la condición actual solo invalida unidades **presentes y distintas** de `mg/g`. `src/clinical/proveniencia.mjs` considera `!cacUnit` compatible con mg/g.

**Riesgo:** un valor realmente en mg/mmol podría generar A1/A2/A3 erróneo. Esta situación contradice la regla declarada de no presumir unidad. **Debe cerrarse antes de utilizar albuminuria para recomendar medicamentos o clasificar riesgo.**

**Corrección propuesta para el siguiente incremento de seguridad:** exigir unidad conocida `mg/g` para clasificar, o convertir unidades mediante fórmula trazable con pruebas y confirmación explícita. Nunca asumir mg/g a partir de un campo vacío.

### P1 — FIB-4 informado sin circuito decisional

**Evidencia:** la consulta hepática rápida captura `fib4_informado`; `evaluateFib4()` devuelve `reported` en los metadatos, pero su `status`, `value` e `interpretation` dependen solo del cálculo a partir de AST/ALT/plaquetas. `integratePatient()` no lo utiliza.

**Criterio:** distinguir «calculado por CaHReMe», «aportado y verificado» y «discordante»; impedir comparación entre cifras con fecha/contexto incompatible, y no asignar estadio de fibrosis automáticamente.

### P2 — Metadatos y lectura

El archivo `manifest.webmanifest` aún describe un prototipo «sin cálculos», aunque G/A y FIB-4 están implementados. Ajustar esa descripción y documentar controles de lectura/contraste y revisiones reales en móvil antes de publicar.

## 6. Orden de implementación recomendado

| Orden | Incremento | Criterio observable de aceptación |
| --- | --- | --- |
| **0** | Cerrar riesgo de unidad CAC y añadir pruebas negativas | Sin unidad explícita, A1/A2/A3 no calculable; pruebas de persistencia de ERC e integridad de recomendaciones |
| **1** | **DM2 rápida funcional** | Combinar perfil coexistente, control/objetivo, síntomas, medicación y función renal; devolver siguiente paso y fuentes, sin dosis no verificadas |
| **2** | DM2 detallada y conciliación terapéutica | Distinguir mono/doble/múltiples clases, objetivos, riesgo de hipoglucemia, contraindicaciones y cambios condicionados |
| **3** | Insulinización | Recorridos independientes de inicio/intensificación/desintensificación, controles y supuestos especiales, con contenido clínico y fuentes validados |
| **4** | IC y ERC | FEVI/congestión/pilares, riesgo renal/albuminuria/potasio y reevaluación, sin confundir umbrales de clase y fichas CIMA |
| **5** | Hepático | FIB-4 aportado frente a calculado, elastografía/derivación, edad y límites de interpretación |
| **6** | Sobrepeso/obesidad | Rutas de hábitos, salud muscular, respuesta, farmacología y derivación, sin convertir MASLD aislada en indicación automática |
| **7** | Fuentes, leyenda y revisión móvil | Enlaces oficiales y accesibles; derechos respetados; estados/contraste/lectura; prueba real iPhone/escritorio |

**Para el siguiente bloque de construcción:** abordar primero el P0 de CAC y el flujo DM2 rápido. Esa secuencia elimina una falla de calidad de datos y recupera la función de mayor uso de la referencia, sin ampliar prematuramente el número de fármacos.

## 7. Casos de aceptación mínimos que aún faltan

- **DM2:** objetivo conocido/desconocido, HbA1c en distintos tramos, síntomas, ausencia de tratamiento y tratamientos previos por clase; perfil cardiorrenal con HbA1c en objetivo.
- **IC:** FEVI conocida/desconocida, congestión presente/ausente y medicación existente, con barreras de seguridad por fármaco.
- **ERC:** datos aislados sin cronicidad, G/A, TFGe 20–25 con ficha específica, K elevado y fármacos que requieren revisión.
- **Obesidad:** IMC 26,9/27/30, con y sin DM2 o comorbilidad; obesidad sarcopénica y evaluación longitudinal.
- **Hepático:** FIB-4 aportado y calculado, edad, fechas de analíticas y elastografía con umbrales revisados conforme a la guía vigente.
- **Insulinización:** inicio, intensificación, desintensificación, fragilidad, corticoides y riesgo de hipoglucemia.
- **Global:** incoherencias de unidades, fechas y diagnósticos; no inferir un tratamiento realizado; nunca generar dosis ni intervenciones desde un candidato no validado.

## 8. Decisión de control

**La paridad de cobertura de datos y navegación está avanzada. La paridad de conducta clínica y resultados permanece incompleta.** Los 139 tests anteriores verificaban funciones del prototipo y seguridad de reglas implementadas, **no** demostraban igualdad funcional con GlucoGuía.

No fusionar el PR #4 ni etiquetar CaHReMe como lista para uso asistencial. Mantener trazabilidad de cada regla con su evidencia y no trasladar material ajeno sin permisos.

## 9. Actualización posterior a la auditoría inicial (12/11/2026)

**El informe precedente conserva los hallazgos del estado de partida.** Se han aplicado ya los siguientes cambios en la misma rama: (1) el CAC no puede categorizarse ni servir para proponer tratamientos con unidad no declarada o diferente de mg/g; (2) comprobación directa de la tabla 3 KDIGO: **A2 30–300 mg/g y A3 >300 mg/g**, conservando 300 mg/g en A2; (3) se añadió la salida propia de **DM2 rápida** con estado glucémico, comorbilidades coexistentes, tratamiento actual, seguridad, reevaluación y fuentes verificadas redGDPS/ADA 2026; (4) se actualizó el manifiesto PWA para reconocer los cálculos y la nueva orientación.

**Paridad actualizada:** 6/6 módulos conservan captura, **DM2 rápida tiene ahora una primera salida clínica no prescriptiva**, pero **0/6 módulos acreditan todavía la paridad clínica completa rápida+detallada**. Quedan pendientes el detalle DM2, los otros recorridos completos y la revisión de navegador real.

Véase [DM2 rápida y corrección del CAC](DM2_RAPIDA_REDGDPS_2026.md) y el [inventario actualizado](COBERTURA_FUNCIONAL_GLUCOGUIA.json).

## 10. Nueva implementación de consulta DM2 detallada (12/11/2026)

La matriz histórica y las brechas descritas en el análisis inicial son una fotografía del estado anterior. Ahora **DM2 rápida y detallada cuentan con una primera salida funcional**, incluyendo objetivo individual numérico, conciliación de dosis y adherencia, alertas, candidatos condicionales y seguimiento orientativo. `src/clinical/dm2-detallada.mjs` y [documentación](DM2_DETALLADA_ADA_REDGDPS_2026.md).

Las barreras globales de glucemia ≥300 mg/dL, hipoglucemias graves y embarazo se han unificado con el motor integrado. **Paridad clínica completa de DM2 aún no demostrada**: faltan revisión científica independiente, validación por escenarios reales, selección por producto con financiación y prueba manual en navegador móvil. Los otros cinco módulos conservan su propia lista de pendientes.

## 11. Actualización insulinización (12/11/2026)

**El apartado de insulinización de la matriz inicial ya es histórico:** el módulo dispone ahora de resultados preliminares de inicio, intensificación y desintensificación con clasificación de patrones glucémicos, seguridad, educación y seguimiento. `src/clinical/insulinizacion.mjs`.

**Paridad funcional completa pendiente:** no se ha validado prescripción individualizada por formulación, titulación, conversiones de insulinas, dosis prandiales, temporalidad del seguimiento o QA móvil; las referencias de dosis no se ejecutan. Los algoritmos antiguos de redGDPS 2022 se contextualizan frente a ADA/EASD 2026.

[Documento de insulinización](INSULINIZACION_ADA_EASD_2026.md).

## 12. Actualización de insuficiencia cardíaca (12/11/2026)

**Fotografía inicial superada:** se añadió una primera salida funcional en `src/clinical/insuficiencia-cardiaca.mjs` para consulta rápida/detallada, con FEVI, congestión, antecedentes, seguridad, medicamentos actuales y seguimiento. La clasificación utiliza **ESC 2026**, no el fenotipo intermedio histórico 41–49 %. La FEVI numérica no confirma por sí sola un diagnóstico, especialmente en la IC-FEp.

No se considera paridad clínica completa: faltan validación externa de casos, etiología/subtipos, biomarcadores, dosificación individual por producto, seguimiento de alta y revisión visual móvil. [Contrato clínico y auditoría](IC_ESC_2026.md).
