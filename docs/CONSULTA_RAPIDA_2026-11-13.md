# Consulta rápida por problema clínico

Fecha: 13/11/2026. El encargo es recuperar la sencillez de la aplicación de referencia y ampliar su cobertura. No se copia su implementación ni se incorporan sus PDFs. Se conservan identidad y motores propios.

## Cambio de arquitectura de uso

La portada abre consultas clínicas. La evaluación integral pasa a un apartado secundario y explícito; deja de ser la acción destacada. La navegación la identifica como «Integral». La ficha completa del resumen se pliega y se retiran sus contadores de completitud.

| Consulta | Criterios de entrada |
| --- | --- |
| DM2 | Condicionantes y control respecto al objetivo |
| IC | Grupo FEVI y congestión |
| ERC | TFGe, CAC, unidad real y persistencia |
| Obesidad | IMC, DM2 y comorbilidades |
| Hepática | Edad, FIB-4 disponible y evaluación inicial |
| Insulina | Fase y situación clínica asociada |
| HTA | PAS, PAD, HTA conocida y tratamiento actual |
| Dislipemia | LDL, categoría lipídica aportada, estatina y ezetimiba |
| Riesgo CV | Aplicabilidad primero; datos del cálculo con acceso explícito |
| CKM | Conserva el recorrido dirigido, no vuelve a una lista de 43 campos |

Las selecciones actualizan la orientación automáticamente. Las cifras permiten consultar el resultado mediante el botón, evitando reescribir mientras se teclea. Los datos compartidos no se borran al cambiar de consulta. La ampliación es opcional y conserva resultados y verificaciones por producto. Dosis y ajustes quedan accesibles desde el resultado, sin colocarse antes de los criterios.

## Contrato clínico de la capa breve

`src/clinical/consulta-breve.mjs` entrega orientación de rama: conducta, clases terapéuticas condicionales y siguientes pasos. Su contrato mantiene `eligibilityEstablished=false`, `patientDose=null`, `prescription=null` y `actionPerformed=false`. No transforma una rama orientativa en elegibilidad farmacológica ni en una actuación realizada. Una categoría de riesgo seleccionada se identifica como aportada, sin confirmarla.

La capa breve usa la auditoría transversal existente. Las alarmas ya documentadas prevalecen aunque procedan de otra consulta; se retienen tratamientos ante embarazo/ámbito específico o datos inválidos relevantes. Se comprueban antecedentes de FEVI reducida, cronicidad y unidad renal, planificación gestacional y condicionantes nutricionales conocidos, limitación de FIB-4 por edad, enfermedad avanzada y evidencia externa invalidada. Si ya consta elastografía, no se asigna seguimiento rutinario desde un FIB-4 bajo ignorándola.

Las revisiones detalladas y el plan integrado conservan sus contratos anteriores. La orientación breve no alimenta el plan como si hubiese completado la verificación de esos motores. No se añaden dosis individuales, cálculo local de SCORE2-OP, pautas específicas de corticoides ni tratamiento farmacológico de MASH.

## Fuentes contrastadas para la síntesis

- ESC IC 2026, secciones3.3/6.1.2: https://academic.oup.com/eurheartj/article/47/38/5346/8766302 . Se mantiene el marco FEVI<50/≥50, condicionado a diagnóstico e historial; congestión y tratamiento pronóstico se revisan por separado.
- KDIGO ERC2024: https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf . Categorías mediante el motor existente; la rama iSGLT2 exige contexto compatible y la ficha concreta sigue siendo necesaria.
- CIMA Wegovy SC y Mounjaro, §4.1: https://cima.aemps.es/cima/dochtml/ft/1211608006/FT_1211608006.html y https://cima.aemps.es/cima/dochtml/ft/1221685002/FT_1221685002.html . IMC y comorbilidad seleccionan una valoración, no autorizan un producto ni su financiación.
- EASL-EASD-EASO2024: https://easlcampus.eu/sites/default/files/2024-08/EASL_CPGs_management_of_MASLD.pdf . Se reutiliza el clasificador de FIB-4 y se conserva la distinción entre orientación inicial y verificación secuencial.
- ESC HTA2024, §8.3: https://academic.oup.com/eurheartj/article/45/38/3912/7741010 . Confirmación y elección de clase son decisiones distintas; una cifra de PA elevada no se convierte automáticamente en indicación de medicación.
- DM2/insulina y lípidos: fuentes y reglas ya registradas en sus motores. La tabla de objetivos LDL se extrae a una función compartida para impedir discrepancias entre las vistas breve y detallada.

Se contrastan también los objetivos LDL conservados de ESC/EAS2019 (https://doi.org/10.1093/EURHEARTJ/EHZ455) y el inicio/intensificación de insulina de ADA/EASD2026 (https://link.springer.com/article/10.1007/s00125-026-06855-7). La vista breve retiene categorías lipídicas discordantes con antecedentes y respeta los bloqueos CIMA ya conocidos por producto.

No se declara una validación clínica independiente. Las pruebas de software verifican escenarios, coherencia y navegación; no validan por sí solas todas las combinaciones asistenciales.

## Auditoría

Base local: 958 pruebas. Nueva capa: 118 escenarios adicionales de seguridad y orientación. Total Node: 1076/1076 superadas, cero fallos, antes de CI. Se conservan las pruebas clínicas anteriores y se adaptan expectativas de interfaz a la entrada explícita en detalle.

Navegadores: se amplía el recorrido reproducible para comprobar entrada compacta, resultado de IC con dos criterios, tratamiento de peso sin historia completa, acceso a dosis, revisión opcional, conservación/invalidez de datos y ausencia de desbordamiento. El resultado de Actions se consulta antes de cerrar el cambio. Sigue pendiente prueba de uso en iPhone físico por el usuario.
