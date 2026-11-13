# Cálculos y pautas dentro de cada consulta

Fecha: 13/11/2026. Objetivo: resolver una tarea clínica sin exigir el formulario integral y sin obligar a buscar la medicación en otra sección.

## Cambios de uso

Cada consulta terapéutica presenta alternativas con principio activo, indicación y pauta de referencia visible. El detalle de escalado y advertencias se puede abrir allí mismo; «Concretar pauta» solicita únicamente las variables de la opción elegida. No se proponen todos los medicamentos como combinación obligatoria.

| Consulta | Opciones con pauta y cálculo condicionado |
| --- | --- |
| DM2 | Metformina inmediata, empagliflozina, dapagliflozina, semaglutida SC para DM2 y tirzepatida |
| IC | iSGLT2 por indicación, bisoprolol, sacubitrilo/valsartán, espironolactona, finerenona IC y furosemida por congestión |
| ERC | iSGLT2 renal, finerenona ERC-DM2 y acceso a losartán para HTA cuando corresponda |
| Obesidad | Semaglutida SC para peso y tirzepatida, por indicación |
| HTA | Losartán, amlodipino e indapamida retard como alternativas/componentes a valorar |
| Lípidos | Atorvastatina, rosuvastatina y ezetimiba |
| Insulinización | Calculadora de inicio/ajuste/bolo/reducción implementada en el incremento previo |
| Hepático, CKM y riesgo CV | Acceso al tratamiento del problema identificado; no se inventa una medicación para un FIB-4, estadio o porcentaje |

Son 23 combinaciones producto/indicación; varias son el mismo principio activo en indicaciones distintas. La cobertura farmacológica continúa parcial, no un vademécum completo. Se conservan las fichas previas y sus motores de seguridad.

## Calculadoras directas

- IMC desde peso en kg y talla en cm. Se verifica el intervalo técnico de talla para evitar interpretar metros como centímetros.
- FIB-4 desde edad, AST, ALT y plaquetas. Se reutilizan fórmula y clasificador existentes; resultado descriptivo, con limitación por edad y proceso agudo.
- TFGe CKD-EPI 2021 desde edad, sexo de la ecuación y creatinina, con unidad explícita mg/dL o µmol/L. Sin raza.
- Aclaramiento de Cockcroft–Gault separado de TFGe normalizada, con peso seleccionado y revisado por el profesional. No se presupone peso real en obesidad/edema ni se calcula un peso ajustado no solicitado.
- Reducción adicional de LDL hasta el umbral absoluto aportado, dentro de la consulta lipídica; no equivale a eficacia esperada de un fármaco ni valida la categoría de riesgo.
- Se mantienen SCORE2 y estadificación CKM existentes. SCORE2-OP sigue siendo un registro externo verificado, no un cálculo local; PREVENT continúa sin implementarse. No se presenta esta incorporación como cierre de esas brechas.

El resultado enseña la fórmula. Solo «Usar este valor» incorpora IMC/TFGe/CrCl a la consulta, conservando precisión completa y origen calculado en memoria. No se recicla una fecha anterior de laboratorio. Cambiar un dato de origen o su disponibilidad invalida el valor derivado y la fecha asociada. Los resultados de laboratorio introducidos manualmente no se borran por cambios de calculadoras ajenas. FIB-4 calculado no se convierte en un supuesto índice externo validado.

## Contrato terapéutico

`tratamientos-modulo.mjs` separa referencia documental de propuesta numérica. Para esta última se exige ámbito adulto estable, tipo real de operación y revisión explícita de indicación/contraindicaciones/interacciones asociada a todos los datos de la sesión. Cualquier cambio invalida la confirmación. Las respuestas ausentes no se convierten en negativas. El esquema de confirmación incluye la revisión clínica de cuestiones no automatizadas; no sustituye una conciliación independiente.

Los bloqueos conocidos prevalecen, incluida la auditoría transversal y los revisores farmacológicos previos. Se controlan duplicidades por clase y alias, sustitución de IECA/ARA-II por ARNI y lavado, límites renales por indicación, potasio y PA cuando corresponda, glucemia/embarazo/DM1 según ámbito, hepatopatía y fragilidad conocidas. No se registra administración ni se generan citas desde una propuesta.

Metformina: inicio de comprimido de 500 mg por toma, con frecuencia y máximo diario según función renal. Fuente concreta de 500 mg: no se obtiene dividiendo una presentación de 850 mg cuya ranura no garantice dosis iguales.

Finerenona: separa inicio y objetivo ERC-DM2/IC. La continuidad no se reduce a un aumento de mg: se deriva al seguimiento específico existente. La rama ERC-DM2 pide albuminuria, unidad, cronicidad y RAAS optimizado; la IC, FEVI.

Las escaladas automáticas disponibles son las sucesiones verificadas de incretinas, bisoprolol, amlodipino, losartán, atorvastatina y rosuvastatina, y empagliflozina en DM2 según TFGe. Exigen dosis realmente tomada, continuidad, tiempo mínimo, tolerancia y necesidad declarada. No se infiere necesidad por tiempo transcurrido. El intervalo de cuatro semanas para amlodipino y seis para losartán son decisiones conservadoras de esta implementación; no se atribuyen a una obligación literal de ficha.

Rosuvastatina: inicio conservador de 5 mg; cálculo de escalado hasta 20 mg, sin seleccionar automáticamente 40 mg. Indapamida: 1,5 mg de liberación prolongada, sin escalada de dosis. Ambas usan CrCl, no TFGe como sustituto. Sacubitrilo/valsartán solicita la pareja real de dosis y calcula ambos componentes juntos, con intervalo mínimo según tratamiento previo; no interpreta un número de mg aislado. No se calculan conversiones de combinaciones fijas.

Wegovy: la vía automática termina en 2,4 mg. La referencia vigente de 7,2 mg se conserva, pero requiere evaluación separada del IMC inicial, beneficio y presentación; no se transforma un simple contador de semanas en una recomendación de ese escalón. No se calculan clics ni mL.

## Fuentes primarias comprobadas

Fórmulas: [NKF CKD-EPI 2021](https://www.kidney.org/professionals/ckd-epi-creatinine-equation-2021), [NKF evaluación de función renal/Cockcroft–Gault](https://www.kidney.org/sites/default/files/441-8491_2202_faqs_aboutgfr_v5.pdf), [OMS IMC](https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight) y fuente EASL 2024 ya incorporada para FIB-4. Se contrastó la separación de medidas para dosificación con [NIDDK](https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/ckd-drug-dosing-providers).

CIMA §§4.1–4.5, por presentación:

| Producto de referencia | Registro |
| --- | --- |
| Metformina Biofarm 500 mg inmediata | [89780](https://cima.aemps.es/cima/dochtml/ft/89780/FT_89780.html) |
| Losartán Pharmaclan | [89364](https://cima.aemps.es/cima/dochtml/ft/89364/FT_89364.html) |
| Amlodipino cinfa | [65460](https://cima.aemps.es/cima/dochtml/ft/65460/FichaTecnica_65460.html) |
| Indapamida retard Kern Pharma | [69391](https://cima.aemps.es/cima/dochtml/ft/69391/FichaTecnica_69391.html) |
| Bisoprolol cinfa | [87952](https://cima.aemps.es/cima/dochtml/ft/87952/FT_87952.html) |
| Entresto | [1151058001](https://cima.aemps.es/cima/dochtml/ft/1151058001/FT_1151058001.html) |
| Espironolactona Accord | [81034](https://cima.aemps.es/cima/dochtml/ft/81034/FichaTecnica_81034.html) |
| Furosemida cinfa | [64140](https://cima.aemps.es/cima/dochtml/ft/64140/FT_64140.html) |
| Atorvastatina cinfa | [69537](https://cima.aemps.es/cima/dochtml/ft/69537/FichaTecnica_69537.html) |
| Rosuvastatina cinfa | [80212](https://cima.aemps.es/cima/dochtml/ft/80212/FT_80212.html) |
| Ezetimiba cinfa | [80305](https://cima.aemps.es/cima/dochtml/ft/80305/FT_80305.html) |

Se mantienen fuentes originales por producto para iSGLT2 e incretinas; se contrastaron otra vez dosis y límites renales de Jardiance/Forxiga, secuencia Ozempic, Wegovy SC y diferenciación de indicaciones Kerendia. Las intensidades de estatina son categorías de guías, no eficacia garantizada ni elección basada solo en LDL. No se afirma vigencia de financiación o comercialización a partir de una ficha autorizada.

## Auditoría y pendientes

Base previa: 1170 pruebas. Incremento: 242 escenarios del motor/interfaz funcional de datos, hasta 1412/1412 Node y sintaxis superadas. Incluye estados vacíos, cambios de disponibilidad, retención por alertas, duplicidades, extremos y equivalencia de unidades, escalones, máximos y caducidad de confirmaciones. Los escenarios de las nuevas funciones se añaden; no se retiran las pruebas clínicas anteriores.

Se amplía la auditoría real de navegador a calculadoras, transferencia/invalidez, presencia de pauta por consulta, dosis HTA e incretinas y ausencia de desbordamiento. Se revisará Actions y capturas antes del cierre. La revisión clínica independiente y la prueba en dispositivos físicos siguen pendientes. Los resultados de software no acreditan validación clínica de todas las combinaciones ni completan el catálogo.
