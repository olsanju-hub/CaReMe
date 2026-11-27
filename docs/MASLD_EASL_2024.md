# MASLD: primer circuito de fibrosis y derivación

Revisión: 12/11/2026. Implementación para revisión, sin validación clínica independiente. La PR #4 permanece en borrador, sin publicación ni fusión con main.

## Auditoría previa

La aplicación calculaba FIB-4 desde analítica, pero el índice informado solo se mostraba; tampoco existía transición desde elastografía a valoración especializada. La vía rápida no podía resolver esa evaluación. Se verificó la guía conjunta EASL-EASD-EASO 2024, especialmente figura 2 y tabla 6, en el documento primario de las sociedades. Se conserva ese marco europeo identificado, sin mezclar cortes de otras guías.

## Contrato de implementación

`src/clinical/masld.mjs` expone `evaluateMasld` y `classifyMasldFib4`. Devuelve ruta, datos pendientes, alertas y pruebas utilizadas con procedencia. Añade propuesta de valoración especializada o intervalo orientativo de reevaluación cuando procede. `diagnosisEstablished=false`, `prescription=null`, `patientDose=null`, `actionPerformed=false`. La derivación propuesta tiene `performed=false`; no se envía ninguna solicitud.

La calculadora descriptiva anterior `evaluateFib4` conserva su contrato. La interfaz hepática dirigida y las tarjetas de herramientas/resumen utilizan el nuevo circuito. No se declara paridad clínica completa ni se sustituye el juicio clínico.

## Reglas clínicas verificadas

| Decisión | Comportamiento | Fuente |
|---|---|---|
| Primera prueba | FIB-4 calculado o informado con procedencia | EASL 2024, figura 2 |
| Edad | <35: precisión limitada; hasta 65 umbral inferior 1,3; >65 umbral 2,0 | Figura 2 y texto |
| Banda intermedia | Desde umbral inferior hasta 2,67 inclusive: evaluar segunda prueba; alternativa anual solo por elección profesional | Figura 2 |
| FIB-4 >2,67 | Valorar derivación, sin esperar VCTE | Figura 2 |
| VCTE | <8 kPa reduce probabilidad; ≥8 orienta derivación. ≥12 aumenta sospecha, sin diagnosticar cirrosis | Figura 2 y tabla 6 |
| Métodos | No trasladar umbrales VCTE a SWE o resonancia | Tabla 6 |
| Reevaluación | Orientación 1–3 años tras evaluación de menor probabilidad y contexto completo | Figura 2 |

La alternativa a la segunda prueba en banda intermedia consiste en intervención sobre hábitos/comorbilidades y repetición de FIB-4 en ≤1 año; si persiste elevado se requiere evaluación secundaria. La aplicación no selecciona automáticamente esa espera. La ruta no diagnostica MASH histológica ni indica tratamiento específico.

## Salvaguardas operativas

- FIB-4 externo: positivo, fechado, fuente no identificativa y confirmación profesional de correspondencia/edad. Asociación en memoria con los datos de origen. Cambiar edad, cifra, fecha o procedencia invalida esa confirmación; también se detectan mutaciones del borrador fuera del modelo. No es validación del cálculo ajeno ni identificación del paciente.
- Cálculo: misma fórmula compartida, sin duplicarla. Requiere AST/ALT/plaquetas positivas y fechas completas de la misma extracción. Se elige explícitamente el origen: no hay sustitución silenciosa por otro valor disponible.
- Dos FIB-4 de la misma fecha que conducen a bandas distintas exigen conciliación. Fechas diferentes permiten usar solo el origen seleccionado, sin mezclar ni inferir tendencia. Las decisiones usan precisión completa, aunque la pantalla muestre dos decimales.
- VCTE: se comprueba método, fecha y revisión de calidad del informe, además de confusores relevantes. No se inventan criterios numéricos de calidad. Valores sin método o con calidad no revisada no se convierten en resultados normales.
- Una prueba alta no queda anulada automáticamente por otra baja. La discrepancia requiere revisión; no se produce calendario rutinario tranquilizador. VCTE elevada válida puede orientar valoración especializada aunque falte la primera prueba, dejando visibles los datos pendientes.
- Contexto: se revisan indicación, etiología y alcohol. No es necesario confirmar esteatosis antes del case finding en un perfil apropiado. MetALD u otra etiología predominante salen del circuito específico, sin concluir que no exista fibrosis.
- FIB-4 no interpretable en contexto agudo o sin confirmar su ausencia. La sospecha/conocimiento de cirrosis dirige al circuito especializado. Se mantiene una salida específica para embarazo/pediatría.
- Hematemesis/melenas, confusión nueva o ictericia con deterioro agudo activan valoración urgente y retienen candidatos crónicos también en otros módulos mediante auditoría transversal. La señal declarada no establece diagnóstico.
- El intervalo de revisión no crea una cita. No se supone que una propuesta de prueba/derivación esté realizada. La actualidad de los informes requiere revisión clínica; no se inventa una caducidad universal.

## Interfaz y cobertura

Consulta rápida con vía de FIB-4 informado; captura opcional de elastografía desplegable. La revisión detallada permite introducir analítica para cálculo. Resultado con origen, siguientes pasos y referencias, accesible también desde resumen y herramientas. Una edición retira el resultado visible; al cambiar disponibilidad se reevalúa desde el nuevo borrador.

Se conservan las seis consultas y la ficha compartida en memoria. No hay persistencia ni transmisión de datos clínicos. Servidor y caché incluyen el módulo. La matriz original mantiene MASLD parcial; se cierra la brecha técnica de FIB-4 informado, conservando su hallazgo histórico y documentando la resolución.

## Auditoría posterior

`npm run check`: **759 pruebas superadas, 0 fallos**, incluida sintaxis. Base previa 671; se añaden 88 escenarios. Se revisan fronteras, procedencia y discordancias, con ausencia de diagnóstico/prescripción/actuación ficticia. La interfaz se comprueba con DOM simulado: acceso, captura compartida y retirada del resultado tras editar.

No se han realizado pruebas reales en iPhone ni revisión clínica independiente. Pendientes alternativas ELF/SWE/MRE automatizadas con umbrales específicos, evaluación longitudinal completa y fármacos específicos de MASH por producto. No se afirma autorización/financiación de esos medicamentos. Próximo dominio original a ampliar: obesidad.

## Fuentes primarias

- EASL–EASD–EASO. Clinical Practice Guidelines on MASLD. J Hepatol. 2024;81:492–542. doi:10.1016/j.jhep.2024.04.031. [PDF oficial](https://easlcampus.eu/sites/default/files/2024-08/EASL_CPGs_management_of_MASLD.pdf). Figura 2: p.501; tabla 6 y sección de evaluación secuencial.
- [Publicación conjunta íntegra en Obesity Facts](https://pmc.ncbi.nlm.nih.gov/articles/PMC11299976/), 2024;17:374–444. doi:10.1159/000539371. Mismo documento de las sociedades; no se contabiliza como fuente independiente.
