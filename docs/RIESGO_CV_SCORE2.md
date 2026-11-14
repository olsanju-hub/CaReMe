# Primer cálculo de riesgo cardiovascular y control del alcance

Fecha: 12/11/2026. Base: d3c539bbf88d14179579861de5f4d4fb81217820. Rama feat/prototipo-interfaz, PR #4.

## Auditoría previa

La revisión de la ruta original encontró que los seis módulos de referencia no cubrían el alcance completo: faltaban cálculo cardiovascular, estadificación CKM y algoritmos propios de HTA/dislipemia. La base reproducía 361 pruebas. La matriz [ALCANCE_ORIGINAL.json](ALCANCE_ORIGINAL.json) controla ahora las ocho áreas originales y requisitos transversales. La matriz de paridad con GlucoGuía sigue existiendo y no reemplaza este inventario.

## Fuentes primarias verificadas

- [Autores SCORE2, EHJ 2022, tabla 1](https://academic.oup.com/eurheartj/article/43/3/241/6433491), DOI 10.1093/eurheartj/ehab761: coeficientes por sexo, supervivencia basal y recalibración regional. La implementación es una expresión matemática propia, sin copiar código de terceros.
- [Artículo original SCORE2, EHJ 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8248998/), DOI 10.1093/eurheartj/ehab309: modelo, población y ejemplo numérico publicado.
- [ESC: SCORE2/SCORE2-OP](https://www.escardio.org/guidelines/practice-tools/cvd-prevention-toolbox/score2-and-score2-op-calculators/) y [HeartScore: regiones](https://www.heartscore.org/en_GB/heartscore-europe-risk-regions): selección por edad; España pertenece a región baja.
- [ESC 2023, diabetes](https://academic.oup.com/eurheartj/article/44/39/4043/7238227): circuito SCORE2-Diabetes y exclusiones.
- [ESC/ERA 2026, cardiovascular y ERC](https://doi.org/10.1093/eurheartj/ehag098): CKD Add-On para SCORE2/SCORE2-OP en ERC sin DM2; SCORE2-Diabetes y evaluación de recurrencias según población. No se extrapola la fórmula simple a esos escenarios.

## Contrato implementado

`computeScore2Low` realiza la operación numérica para 40–69 años y región baja. `evaluateCvRisk` controla elegibilidad, procedencia y coherencia antes de emitir porcentaje. Calcula riesgo a 10 años de eventos cardiovasculares mortales/no mortales. No adjudica estadio CKM, categoría terapéutica u objetivo de LDL ni prescribe.

La entrada usa colesterol total y HDL reales en mg/dL, convertidos con 38,67 mg/dL por mmol/L; no se sustituye el HDL por una cifra fija ni se usa solamente no-HDL. La fórmula se evalúa sin redondeo intermedio; la UI muestra una decimal. La variante de sexo se solicita expresamente por exigencia del modelo y no se infiere del nombre u otros campos. Exfumador equivale a no fumador actual para la ecuación.

Se excluye cálculo simple en diabetes, ECV conocida, IC, ERC conocida o marcadores renales que requieren revisión, gestación, sospecha familiar o perfil lipídico marcado. Se priorizan síntomas de alarma, PA ≥180 sistólica o ≥110 diastólica y alertas críticas transversales. Estas salidas no diagnostican una emergencia ni asignan por sí solas riesgo global. SCORE2-OP/Diabetes/CKD Add-On se identifican como pendientes, sin porcentaje inventado.

La barrera LDL ≥190 mg/dL es conservadora de esta primera implementación: exige revisión específica y no pretende sustituir todas las categorías de riesgo de la guía lipídica. Los límites operativos de la primera UI (PAS 90–<180, CT 100–310, HDL 20–100 mg/dL, PAD positiva e inferior a PAS) son controles de entrada, no nuevos umbrales diagnósticos ni una afirmación de rango de validación del estudio. Fuera de ellos no se extrapola.

El cálculo requiere antecedentes/exclusiones valorados y fechas válidas de PA/lípidos no posteriores a la evaluación. No se impone una caducidad universal. No se exige realizar pruebas renales solo para obtener SCORE2 cuando no hay ERC conocida; si existen marcadores de posible daño renal se deriva primero al circuito renal. La validez de los antecedentes declarados sigue dependiendo de la revisión clínica.

## Interfaz y privacidad

Acceso adicional desde inicio, herramientas y resumen integral, manteniendo las seis consultas originales. Los valores se comparten en memoria. Editar invalida el resultado mostrado. No se añaden cuentas, IA, almacenamiento de pacientes, citas o peticiones de red de datos clínicos. El nuevo módulo se incluye en lista del servidor y caché estática versionada.

## Auditoría posterior

421 pruebas locales superadas y comprobación de sintaxis correcta. Incluye 60 casos nuevos: ejemplo externo, fronteras de edad, exclusiones, datos ausentes/no disponibles, incoherencias, calibración, unidades y navegación con DOM simulado. La prueba de interfaz detectó que el manejador de captura aún no aceptaba la nueva página; se corrigió antes del cierre.

Caso externo de referencia publicado: 50 años, fumador actual, PAS 140 mmHg, CT 5,5 mmol/L y HDL 1,3 mmol/L. El resultado reproduce 5,9 % en hombre y 4,2 % en mujer para región baja. Este contraste no equivale a validación clínica independiente de toda la herramienta. No hay prueba visual real ni en iPhone.

## Pendientes explícitos

- Contrato de CKM según guía vigente (se identificó guía AHA/ACC/ADA/ASN 2026, pendiente revisión completa); no confundir CKM, PREVENT y SCORE2.
- Implementación validada de SCORE2-OP, SCORE2-Diabetes y CKD Add-On.
- Algoritmos de HTA/dislipemia; cierre de MASLD y obesidad.
- Revalidación de fuentes previas de todos los módulos, revisión clínica independiente y QA real.

La PR permanece en borrador. No se declara MVP completo ni aprobación asistencial.


## Incremento posterior: registro externo SCORE2-OP

Se incorpora una vía explícita de transcripción de HeartScore, con procedencia y asociación a los datos de sesión. No se ha habilitado la fórmula OP interna: los parámetros suplementarios completos no pudieron verificarse en fuentes primarias accesibles. [Auditoría y estado](SCORE2_OP_EXTERNO.md). El SCORE2 local anterior y sus pruebas se conservan.
