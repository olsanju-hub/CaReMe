# Primer circuito dirigido de dislipemia

Fecha de revisión: 12/11/2026. Estado: implementación para revisión; no validación clínica independiente ni autorización asistencial. Rama de desarrollo y PR #4 en borrador.

## Auditoría previa

Existían captura de lípidos y SCORE2, pero no un circuito de objetivos y revisión del tratamiento. Se revisaron la actualización ESC/EAS 2025, las secciones no sustituidas de 2019 y fichas CIMA de productos concretos. No se reutiliza sin más la categoría de prevención de 2021 como categoría de dislipemia de 2025.

## Contrato

`src/clinical/dislipemia.mjs` acepta el borrador común, devuelve información faltante, categoría y origen, objetivo LDL, comparación absoluta/relativa, comprobaciones y opciones para valoración. `prescription` y `patientDose` son siempre nulos. Una opción no equivale a una actuación realizada. Los datos permanecen en memoria.

Interfaz propia desde inicio, herramientas y resumen. Conserva las seis consultas anteriores. Captura inicial breve con secciones desplegables de riesgo/basal y tratamiento/seguridad. Los cambios de entrada invalidan el resultado mostrado; la disponibilidad se reevalúa al renderizar. Acceso al circuito de riesgo cardiovascular sin transmitir datos a un servicio externo.

## Reglas y fuentes

| Regla | Comportamiento | Localizador primario |
|---|---|---|
| Categorías por SCORE2/OP | <2% bajo; 2–<10% moderado; 10–<20% alto; ≥20% muy alto. Se identifica el marco lipídico 2025 | ESC/EAS 2025, tabla 3; tabla oficial EAS |
| Procedencia del riesgo | SCORE2 local elegible sin tratamiento; OP externo solo con asociación válida ya implementada; categoría clínica confirmada con fundamento documental | ESC/EAS 2025, evaluación del riesgo |
| Perfil bajo tratamiento | No calcular un riesgo basal menor desde los lípidos tratados; completar clasificación clínica | ESC/EAS 2025, límites de estimación y población elegible |
| Mínimos clínicos | ASCVD fechada: muy alto; ERC conocida con TFGe fechada <30: muy alto, 30–<60: alto; LDL sin tratamiento >190 o colesterol total >310: al menos alto | ESC/EAS 2025, tabla 3 |
| Conflictos | Retener categoría inferior al mínimo anterior; DM2 no admite categoría baja. IC sola no se transforma en ASCVD; TFGe aislada no diagnostica ERC | Tabla 3 y restricciones del contrato |
| Objetivos LDL | <116/<100/<70/<55 mg/dL para bajo/moderado/alto/muy alto; en alto/muy alto comprobar además reducción ≥50% | Objetivos 2019 conservados por actualización 2025 |
| Basal | Solo reducción con basal positivo, confirmado sin tratamiento y fechado antes o el mismo día que el perfil actual | Objetivo relativo y comprobación de procedencia |
| Basal desconocido | Mostrar reducción no evaluable. Si el objetivo absoluto se alcanza, la ausencia de basal no genera por sí sola escalada | Salvaguarda de implementación |
| ASCVD sin tratamiento | Revisar prevención secundaria aunque LDL esté por debajo del objetivo absoluto; sin pauta automática | ESC/EAS 2019 y actualización 2025, prevención secundaria |
| Lp(a) | >50 mg/dL o >105 nmol/L en la unidad original: modificador para valoración. Sin conversión fija ni ascenso automático de categoría | ESC/EAS 2025, modificadores de riesgo |
| LDL calculado | Friedewald con TG ≥400 o desconocidos retiene interpretación. El original dice >400: se aplica frontera conservadora en 400, documentada aquí | ESC/EAS 2019, medición de lípidos |
| TG | >880 mg/dL prioriza evaluación antes de circuito crónico; 440–880 advierte riesgo de pancreatitis. No diagnostica pancreatitis ni ingreso por cifra aislada | ESC/EAS 2019, hipertrigliceridemia grave |
| Seguridad transversal | Síntomas agudos declarados o TG >880 retienen candidatos crónicos en la auditoría común | Auditoría de seguridad de implementación |
| Escalada | Primero hábitos, causas secundarias y adherencia. Opciones: valorar inicio, optimización de estatina, ezetimiba, terapia adicional/derivación o alternativas tras intolerancia documentada | ESC/EAS 2025, umbrales en primaria; tratamiento LDL 2019/2025 |
| Cambio y analítica | Perfil anterior al cambio confirmado no se atribuye al tratamiento actual; no genera otra escalada. Una fecha efectiva ausente retiene opciones | Salvaguarda temporal de implementación |
| Seguimiento | Ventana orientativa 8 ±4 semanas solo después de actuación confirmada, fechada y con seguridad suficiente. Revisar controles ya realizados; no se crea cita ni se supone incumplimiento por no registrar historia | ESC/EAS 2019, tabla 13 |

Los umbrales de inicio en prevención primaria se revisan por separado del objetivo: recomendación de tratamiento en muy alto con LDL ≥70 y alto con ≥100, tras medidas no farmacológicas; consideración en intervalos inferiores según guía. La aplicación solo plantea revisión profesional, no una prescripción individual. La gradación completa de diabetes/HF y todas las discrepancias entre guías no están automatizadas.

## Referencias CIMA incorporadas

- [Atorvastatina cinfa 10 mg, registro 69534](https://cima.aemps.es/cima/dochtml/ft/69534/FT_69534.html), apartados 4.2–4.6: referencia de inicio habitual 10 mg/día, máximo 80 mg/día, ajustes ≥4 semanas. No se selecciona dosis para el paciente.
- [Rosuvastatina cinfa 10 mg, registro 80213](https://cima.aemps.es/cima/dochtml/ft/80213/FT_80213.html), 4.2–4.6: CrCl <30 mL/min contraindica su uso; 40 mg contraindicado con CrCl <60. Se solicita aclaramiento documentado separado: la TFGe normalizada no lo sustituye. La ficha contempla inicio 5 mg con insuficiencia moderada; esa titulación individual queda pendiente.
- [Ezetimiba Sandoz 10 mg, registro 77541](https://cima.aemps.es/cima/dochtml/ft/77541/FT_77541.html), 4.2–4.6: referencia 10 mg/día; revisar función hepática y ficha de estatina en asociación. No recomendada en insuficiencia hepática moderada/grave. No se automatiza una pauta por producto.

Se retienen opciones con enfermedad hepática activa o ALT ≥3 veces el límite superior normal, usando frontera conservadora para revisión, sin ordenar retirada. Mialgias requieren valoración; no se diagnostica intolerancia completa automáticamente ni se pide CK rutinaria. Se exige revisión explícita de interacciones, medicación y alergias. La lista automática de interacciones no es exhaustiva. No se implementan reglas completas de bempedoico, PCSK9, financiación o elegibilidad.

## Auditoría posterior

`npm run check`: 671 pruebas superadas, 0 fallos, incluida sintaxis. Base anterior: 573; se añaden 98 escenarios de dislipemia/interfaz. Se comprueban fronteras de objetivos, reducción, procedencia, unidades, restricciones CrCl, fechas, alarmas y ausencia de prescripción. El ejemplo publicado SCORE2 5,9% comprueba el cambio de marco de categoría, sin afirmar validación externa de todo el nuevo circuito.

Interfaz comprobada con DOM simulado: campos únicos, conservación de seis consultas, datos compartidos, invalidación del resultado y disponibilidad del módulo en servidor/caché. No equivale a prueba de navegador, instalación PWA, accesibilidad completa o iPhone real.

Pendientes: revisión clínica independiente, selección/titulación por principio activo y formulación, interacciones completas, intolerancia e hipertrigliceridemia con tratamiento específico, algoritmos completos de HF/diabetes, variantes de riesgo y QA móvil. Dislipemia pasa de ausente a parcial; el MVP completo sigue pendiente.

## Bibliografía primaria

1. [ESC/EAS. Focused Update 2025](https://academic.oup.com/eurheartj/article/46/42/4359/8234482). Eur Heart J. 2025;46:4359–4378.
2. [EAS. Tabla y recomendaciones SCORE2/SCORE2-OP 2025](https://eas-society.org/publications/guidelines/score2-score2-op/).
3. [ESC/EAS 2019, documento completo](https://eas-society.org/wp-content/uploads/2022/05/2019_EAS-ESC_Guidelines_dyslipidaemia_ATH.pdf). Secciones vigentes de objetivos, medición, hipertrigliceridemia y controles.
4. AEMPS-CIMA: registros 69534, 80213 y 77541, enlazados arriba. Verificación 12/11/2026.
