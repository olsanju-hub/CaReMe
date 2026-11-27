# Plan integral de objetivos y seguimiento

Revisión: 12/11/2026. Estado: síntesis funcional para revisión. Revisión clínica independiente y pruebas reales en móvil pendientes. PR #4 en borrador, sin fusión ni publicación.

## Auditoría previa

Los módulos ya producían objetivos, orientaciones y algunos plazos desde actuaciones confirmadas. `buildVerificationPlan` reunía conciliaciones y controles de dos medicamentos, pero no consolidaba las salidas dirigidas recientes ni diferenciaba en una misma vista los dominios no evaluados. El nuevo bloque reúne esas salidas conservando el contrato anterior del plan documental.

## Contrato

`src/clinical/plan-integral.mjs` expone `buildIntegratedPlan(draft,history)`. Compone los motores actuales de DM2, IC y ERC, además de insulinización, HTA, dislipemia, MASLD y obesidad. Incluye riesgo cardiovascular y CKM como contexto descriptivo, separados de objetivos terapéuticos. No introduce nuevos umbrales clínicos ni interpreta reglas por su cuenta.

Devuelve dominios, prioridades, objetivos y cautelas, con derivaciones propuestas y referencias de control. Distingue orientaciones sin fecha individual, posibles coincidencias entre controles e historial sustituido. Las salidas mantienen `prescription=null`, `patientDose=null`, `actionPerformed=false`. `completed=null` significa que no consta realización del control; no se convierte en una prueba pendiente o realizada por inferencia.

## Activación y cobertura

Un antecedente afirmativo, resultado pertinente o dato propio del área activa su revisión. Edad y TFGe normal aisladas no fuerzan completar todos los algoritmos. Las señales de seguridad explícitas activan el circuito pertinente aunque falte el diagnóstico crónico, para no perder una alerta por datos incompletos.

Un área sin datos se presenta como **no evaluada**, sin asignar normalidad ni ausencia de enfermedad. La lista de diez recorridos no representa diez diagnósticos. No se solicitan pruebas solo para completar la cobertura. Un contador de datos no constituye alta clínica o aprobación del plan.

## Objetivos y contexto

Se muestran únicamente objetivos que sus motores devuelven en un contexto utilizable: HbA1c individual fiable, PA de consulta condicionada, LDL según marco lipídico y objetivo de peso/función acordado. No se inventan valores universales para las otras áreas. Las cautelas de cada módulo se conservan junto a sus fuentes.

SCORE2/OP y CKM siguen siendo contexto: no se suman porcentajes, no se convierten mutuamente y no se presentan como objetivos. Las categorías de prevención y dislipemia mantienen su procedencia. Una alerta de seguridad puede condicionar el uso de un objetivo previamente documentado, sin modificarlo o sustituirlo por otro.

## Prioridades y derivaciones

La auditoría transversal y las alertas prioritarias de los motores preceden a completar datos y revisar próximos pasos. Los avisos exactamente repetidos con la misma prioridad se reúnen conservando dominios y fuentes; no se fusionan por semejanza semántica ni se rebaja su prioridad. Las cautelas permanecen por área.

Las derivaciones se presentan como propuestas, con `performed=false`. La presencia de alerta exige revisar seguridad y urgencia antes de interpretar una derivación como seguimiento rutinario. No se envía ninguna solicitud.

## Controles y fechas

| Procedencia | Qué se conserva |
|---|---|
| Motor renal | Ventana original tras cambio de IECA/ARA-II confirmado |
| Dislipemia | Ventana original tras cambio realmente administrado |
| Obesidad | Día orientativo desde inicio de plan confirmado |
| Historial farmacológico | Referencias de finerenona/empagliflozina según evento confirmado |
| Resto de módulos | Orientación clínica original, sin inventar fecha individual |

Los intervalos y fechas se reutilizan del motor de origen; el agregador no crea una regla clínica adicional. Sin fecha válida de evaluación, no declara un control vencido o vigente. Se mantiene la frontera inclusiva del último día: superar el plazo documental no demuestra ausencia de asistencia. Deben revisarse contactos y controles ya realizados.

Los registros históricos se validan mediante el contrato de actuaciones existente. Fechas futuras o inválidas, productos/rutas desconocidos y registros no verificables quedan por conciliar sin generar control. Un registro no confirmado no se transforma en actuación. La historia se ordena por fecha efectiva para determinar sustituciones, sin alterar el array original. Un evento posterior a un plazo ya pasado no borra la referencia anterior cuyo cumplimiento no consta.

Aplicar una referencia histórica exige contexto adulto y reproductivo conocido, estabilidad actual y conciliación del estado del medicamento. Si finerenona figura en distintas indicaciones, se solicita conciliación de la pauta vigente; no se suman regímenes.

### Seguridad actual

Una incoherencia crítica transversal o una salida de seguridad prioritaria impide presentar los plazos previos como seguimiento rutinario vigente. Se conservan fecha y fuente en un apartado de reevaluación: no se cancelan controles ni se desplaza la urgencia hasta una fecha antigua. La revisión de la situación actual precede al plazo documental.

### Posible coordinación

Dos controles analíticos pueden mostrarse como candidatos a coordinación si comparten una medición y sus plazos se solapan. Se comprueban por pares: no se crea una unión transitiva de ventanas sin intersección común. No se coordinan referencias retenidas o ya pasadas. Las dos indicaciones y sus límites originales permanecen; no se elige una cita ni se sustituyen controles clínicamente diferentes.

## Interfaz

El plan aparece antes de la tabla de captura en la síntesis integral y también en Herramientas. Muestra primero seguridad, objetivos y controles; deja datos pendientes y cautelas en desplegables sin recortarlos por número. La cobertura ofrece acceso al recorrido correspondiente. Fuentes por área y referencias de controles accesibles.

Se recompone desde el borrador y la historia de la sesión al abrir la vista. Cambiar datos o disponibilidad no conserva una copia antigua. Nueva evaluación vacía ambos. Los textos aportados se escapan antes de representarse como HTML. No se añade persistencia, exportación o transmisión de datos.

## Auditoría posterior

`npm run check`: **907 pruebas superadas, 0 fallos**, incluida sintaxis. Base anterior853; se añaden54 escenarios del plan integral e interfaz.

Se comprueban activación sin falsa normalidad, objetivos con marco propio y separación de riesgo/CKM. Los escenarios cruzan plazos nativos, actuaciones propuestas/confirmadas e historial fuera de orden, con fechas imposibles o futuras. Incluyen seguridad actual frente a una referencia antigua, criterios de coordinación y preservación de procedencia al reunir avisos. La interfaz se verifica con DOM simulado, navegación y escape de un objetivo realmente representado.

No equivale a revisión clínica independiente ni QA real de iPhone/PWA. El plan integra los dominios, pero conserva los límites de cada motor. Persisten catálogo/titulación por producto, variantes de riesgo y otras brechas de la matriz global. No se declara MVP cerrado.

## Trazabilidad de fuentes

Las reglas clínicas siguen documentadas en sus contratos originales, que no se sustituyen:

- [DM2 detallada](DM2_DETALLADA_ADA_REDGDPS_2026.md), [insulinización](INSULINIZACION_ADA_EASD_2026.md) y [IC](IC_ESC_2026.md).
- [ERC](ERC_KDIGO_2024.md) y [continuidad CIMA](CONTINUIDAD_Y_SEGUIMIENTO.md).
- [HTA](HTA_ESC_2024.md), [dislipemia](DISLIPEMIA_ESC_EAS_2025.md), [MASLD](MASLD_EASL_2024.md) y [obesidad](OBESIDAD_GIRO_CIMA.md).
- [Riesgo cardiovascular](RIESGO_CV_SCORE2.md), [SCORE2-OP externo](SCORE2_OP_EXTERNO.md) y [CKM](CKM_2026.md).

Los enlaces primarios se heredan de cada resultado y se conservan en la salida. Esta auditoría verifica composición y trazabilidad del software; no afirma haber revalidado clínicamente todos los motores anteriores.
