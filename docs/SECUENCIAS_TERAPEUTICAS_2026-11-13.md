# Selección y secuencia terapéutica · 13/11/2026

## Criterios de aceptación

La entrada terapéutica no pregunta qué medicamento quiere utilizar el médico. Captura medicamentos realmente administrados y solicita datos que cambian la decisión. Cada grupo presenta como máximo cuatro campos clínicos; la lista de medicación actual es un grupo desplegable. La salida distingue conducta actual de siguientes escalones condicionados. Las pautas numéricas mantienen los requisitos del producto y no registran administración. Las recomendaciones se retiran o recalculan al cambiar datos.

## Fase 1. Motor de selección

Nuevo motor puro `secuencia-terapeutica.mjs`, con casos de DM2, HTA, dislipemia, obesidad, ERC, IC y evaluación hepática. Se conservan los motores anteriores. Los representantes farmacológicos del circuito (p. ej., empagliflozina, semaglutida o atorvastatina) no se presentan como moléculas universalmente superiores ni como una preferencia expresa de la guía sobre todas sus alternativas.

Evaluación: pruebas de selección, datos ausentes, estados no valorados, mantenimiento en objetivo, seguridad transversal, adherencia, clases ya presentes y preparación de dosis. Correcciones realizadas: evitar duplicar clases procedentes de otra patología; no asumir que «ninguno» permite ignorar datos positivos previos; no tratar un estado no valorado como negativo; distinguir el máximo de una vía de cálculo del máximo tolerado del paciente.

## Fase 2. Secuencias por patología

- DM2: prioridad cardiorrenal cuando corresponde; revisión de insulina/secretagogos, objetivo individual, optimización de metformina conocida y selección de clase complementaria. GLP-1 implica revisar retirada de iDPP-4. El inicio de metformina en esta selección se limita a TFGe ≥45; el motor de ficha conserva los límites CIMA por separado. Se distingue dosis TOTAL diaria de metformina y formulación de liberación inmediata para escalar. Intervalo conservador mínimo de dos semanas y escalones de comprimidos de 500 mg; objetivo de esta titulación de hasta 2 g/día sin superar el límite renal.
- HTA: confirmación de control y objetivo individual; doble combinación, triple combinación, optimización y valoración de resistencia. La vulnerabilidad impide una combinación inicial rutinaria. Nunca se añade IECA/ARA-II al ARNI.
- Lípidos: intensidad inicial por riesgo, escalada desde la dosis realmente tomada, ezetimiba tras estatina tolerada y siguiente línea por indicación. No se supone que rosuvastatina 20 mg sea la máxima tolerada. SCA reciente exige la estrategia específica de intensificación precoz.
- Obesidad: indicación por IMC/comorbilidad, contexto nutricional, respuesta actual y escalado condicionado. Respuesta suficiente evita escalada por calendario. No se convierten productos incretínicos automáticamente.
- ERC: cronicidad y unidades, protección con iSGLT2 según perfil, RAAS y finerenona con condiciones de elegibilidad. No se extrapola la pauta numérica de losartán en HTA a toda albuminuria sin HTA.
- IC: clases pronósticas según FEVI y estabilidad, sustitución/lavado antes de ARNI, titulación de bisoprolol y manejo separado de congestión. No exige alcanzar el máximo de una clase antes de completar otras. Las indicaciones no cubiertas por una pauta verificada se identifican como revisión específica.
- Hígado: fibrosis orienta la siguiente prueba/derivación y tratamiento de comorbilidades; no genera tratamiento específico de MASH desde FIB-4.

## Fase 3. Insulina

Nuevo resolver `secuencia-insulina.mjs`. La decisión procede del esquema real, hipoglucemia, objetivo y patrón de glucemias. Inicio sin insulina: propuesta de referencia glargina U100 10 U/día tras comprobar indicación y alternativas GLP-1. Basal actual: conserva producto/pluma como dato factual; el patrón selecciona ajuste basal o primer bolo. Bolo de referencia: asparta U100 4 U en la comida identificada, con revisión de GLP-1 y ajustes asociados del motor previo. Hipoglucemia leve resuelta atribuible a basal: reducción conservadora del 10 %. No calcula conversiones complejas ni retirada de bolos. Todas las comprobaciones de dosis y educación permanecen activas.

Evaluación: pruebas de inicio, selección de acción por ayunas, patrón posprandial, mantenimiento en objetivo, hipoglucemia y datos insuficientes. Se elimina de este recorrido la pregunta por estrategia de dosis o tratamiento futuro.

## Fase 4. Interfaz y seguridad

Se sustituye el selector público `flow-treatment` por preguntas progresivas, plan, escaladas condicionadas y comprobación de la pauta propuesta. La operación de inicio/escalada y la intensidad inicial proceden del motor; no se solicitan de nuevo al médico. La revisión final farmacológica sigue siendo explícita y se invalida al cambiar datos. Los campos ya conocidos se reutilizan; un resumen permite editar cada dato. Insulina abre un panel propio para evitar controles duplicados. Hay desplazamiento al plan y a la pauta, para que el resultado no quede fuera de vista.

Evaluación local: 1547 pruebas Node y sintaxis correctas. Auditoría de navegador de la interfaz nueva: pendiente de Actions. PWA incluye en caché los nuevos motores y el registro de captura, sin almacenar información clínica. Versión de caché v0-47.

## Fuentes verificadas

ADA Standards 2026, sección 9, DOI 10.2337/dc26-S009; redGDPS 2026, capítulos de tratamiento e insulinización; ESC HTA 2024, DOI 10.1093/eurheartj/ehae178; ESC/EAS dislipemia 2025; KDIGO ERC 2024; ESC IC 2026, DOI 10.1093/eurheartj/ehag100; EASL–EASD–EASO MASLD 2024. Las pautas por producto enlazan la ficha CIMA del registro farmacológico. Se consultó CIMA de metformina 500 mg (89780) para el intervalo de ajuste 10–15 días y los límites renales.

## Límites explícitos

El catálogo sigue siendo parcial: no se fabrican dosis de medicamentos todavía no implementados ni se interpreta una confirmación genérica como comprobación automática de todas las interacciones. Las alternativas equivalentes requieren valorar preferencia/acceso y condiciones individuales. Los supuestos fuera del ámbito se resuelven con el siguiente paso de revisión necesario, en lugar de producir una pauta sin fundamento. Reducir o simplificar no equivale a una retirada automática de tratamientos pronósticos. Se mantienen pendientes la validación clínica independiente, un estudio de usabilidad con médicos y la prueba física en iPhone. Las pruebas de software no acreditan esos resultados.
