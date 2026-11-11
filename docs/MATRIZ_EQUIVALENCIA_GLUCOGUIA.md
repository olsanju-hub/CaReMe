# Matriz de equivalencia funcional · GlucoGuía → CaHReMe

**Versión:** 0.1 · 2026-11-11  
**Estado:** especificación funcional; no es una validación clínica.  
**Referencia inspeccionada:** [aarnal80/diabetes-congreso-mobile](https://github.com/aarnal80/diabetes-congreso-mobile), README, `index.html`, `app.js` y `flow.js`. README: **GlucoGuía 1.6**, noviembre de 2026, Dr. Antonio Arnal y Francisco M. Adán Gil. Web de referencia: https://aarnal80.github.io/diabetes-congreso-mobile/

## Decisión vinculante de producto

**CaHReMe conservará como mínimo la cobertura funcional de los seis módulos de la referencia —consulta rápida, revisión detallada, campos clínicos, orientación y fuentes— y la ampliará con evaluación integral cardiovascular-hepática-renal-metabólica.** La información de la referencia se utiliza como inventario funcional, no como autoridad clínica ni como licencia para copiar código, textos extensos, iconografía o PDF.

Cada módulo se construirá con **implementación original** y contenido sanitario revisado frente a guías aplicables en España. Si una recomendación antigua resulta discordante con una actualización fiable, se conserva la **capacidad de decisión** y se actualiza la regla, documentando la discrepancia. No se replicarán automáticamente umbrales o tratamientos sin verificación.

## 1. Paridad de navegación y comportamiento

| Función observada | Comportamiento exigido en CaHReMe |
| --- | --- |
| Portada con seis módulos | Mantener seis consultas dirigidas, con un séptimo acceso integral transversal |
| Flujo de tres vistas | Módulos → selección rápida → resultado, con navegación atrás que conserve opciones |
| Revisión detallada opcional | No repetir datos ya registrados; reutilizar los de la evaluación global cuando correspondan |
| Opciones seleccionables y valores numéricos | Validación de unidad, rango, contexto clínico y faltantes |
| Resultado con orientación, siguiente paso, clases farmacológicas y cautelas | Mantener categorías como mínimo; añadir priorización, dosis verificadas cuando sean seguras, controles y seguimiento |
| Recomendaciones situadas en ramas del algoritmo | Cada decisión enlazada a evidencia, edición, capítulo/página o recomendación concreta |
| PDF del algoritmo, biblioteca de fuentes, leyenda de clases y principios activos | Mantener acceso a fuentes oficiales con enlaces válidos, permisos de uso y metadatos auditable |
| Ajustes de lectura e instalación PWA | Texto accesible, diseño móvil Atlántico, instalación y recursos offline cuando lo permita la licencia |
| Sin identidad del paciente ni envío de datos clínicos | Mantener por defecto sesión en memoria y ningún dato identificativo |
| Advertencia de validación | Estado de revisión por módulo visible, sin presentar como validado lo pendiente |

## 2. Consultas rápidas — campos de referencia y correspondencia

Los campos observados se transcriben aquí como **tipos de datos y opciones**, no como código reutilizado.

| Módulo | Entrada rápida existente en referencia | CaHReMe: requisito |
| --- | --- | --- |
| DM2 | Condicionante predominante: ninguno, ECV/riesgo alto, IC, ERC, obesidad, EH metabólica o fragilidad. Grado de control: en objetivo, fuera de objetivo con HbA1c inferior a 8,5 %, HbA1c ≥8,5 % sin síntomas, HbA1c ≥8,5 % con síntomas, objetivo no establecido | Reproducir decisión rápida con perfil multicomórbido; no forzar un único condicionante ni usar el corte de 8,5 % sin verificar el algoritmo y la aplicabilidad |
| IC | FEVI: reducida, preservada, desconocida; congestión: presente, ausente, no valorada | Añadir FEVI exacta en detalle, síntomas, datos de seguridad, posible descompensación y armonización con guías vigentes |
| ERC | TFGe (mL/min/1,73 m²), cociente albúmina/creatinina (mg/g), persistencia ≥3 meses / no confirmada | Mantener clasificación renal, temporalidad y estado no evaluable con datos incompletos |
| Sobrepeso/obesidad | IMC (kg/m²), DM2 sí/no, comorbilidad: ninguna, CV, cardiorrenal, hepática, apnea del sueño, gonartrosis u obesidad sarcopénica | Añadir datos antropométricos de origen, situación funcional y alternativas terapéuticas sujetas a indicación y financiación vigentes |
| Enfermedad hepática metabólica | Edad, FIB-4, esteatosis/otras causas evaluadas, elastografía opcional (kPa) | Permitir FIB-4 informado o calculado mediante entradas necesarias; reflejar procedencia y discrepancias; no interpretar un FIB-4 sin verificar población y umbrales |
| Insulinización | Situación: inicio, intensificación tras basal, desintensificación. Perfil: general, obesidad, fragilidad/FG disminuido, cardiorrenal, debut sintomático/proceso intercurrente o corticoides | Mantener los tres recorridos y analizar hipoglucemias, patrón glucémico, tratamiento previo y capacidad de autocuidado |

## 3. Revisión detallada — inventario de campos de la referencia

| Módulo | Campos existentes en revisión detallada |
| --- | --- |
| DM2 | HbA1c, objetivo individual elegido, TFGe, IMC, síntomas de hiperglucemia, condicionantes coexistentes (IC/ERC/ECV o riesgo CV/EH metabólica/fragilidad), tratamiento actual |
| IC | FEVI numérica, TFGe, congestión, tratamiento actual |
| ERC | TFGe, cociente albúmina/creatinina, cronicidad de la alteración, potasio, tratamiento actual |
| Sobrepeso/obesidad | IMC, existencia de DM2, comorbilidades (ECV, ERC, IC, EH metabólica, AOS, gonartrosis, obesidad sarcopénica), tratamiento actual |
| Hepático | La referencia utiliza la captura rápida como ruta principal sin revisión detallada separada; edad, valoración inicial, FIB-4, elastografía opcional |
| Insulinización | Situación de tratamiento, IMC, TFGe, fragilidad/paliativos, situaciones especiales (debut sintomático, enfermedad intercurrente, corticoides, IC, ERC, ECV), tratamiento actual |

**Clases recogidas en la referencia** (lista de selección para tratamiento actual; ampliar con molécula/dosis/fecha cuando se necesite): sin tratamiento, metformina, iSGLT2, arGLP-1, tirzepatida, iDPP-4, sulfonilureas, insulina, pioglitazona, saxagliptina, repaglinida, IECA, ARA-II, INRA/ARNI, ARM y betabloqueantes.

**Campos adicionales en CaHReMe:** alergias, intolerancias, medicación concreta, dosis, tiempo de uso, hipoglucemia, HbA1c objetivo individual, antecedentes CV, PAS/PAD, lípidos, riesgo renal, AST/ALT/plaquetas, peso/talla/perímetro abdominal, fechas analíticas y contexto de medición. Los campos adicionales se exigirán solo cuando una regla los necesite.

## 4. Resultados exigidos

Por cada consulta rápida y detallada:

1. **Situación:** valoración basada en datos disponibles con alcance y principales condicionantes.
2. **Orientación y siguiente paso:** rama aplicable, qué comprobar y qué decisión considerar.
3. **Opciones terapéuticas:** clases o principios activos candidatos, exclusiones, contraindicaciones y posibles duplicidades.
4. **Reevaluación:** pruebas y fecha de control, modificaciones pendientes y criterios de derivación.
5. **Bibliografía:** referencia concreta con fecha/versión; si no hay guía comprobada, mostrar pendiente de verificación, nunca inventar.
6. **Calidad:** avisos sobre datos no disponibles, inconsistencias y límites de aplicabilidad.
7. **Estado de acción:** separar recomendación generada de prescripción o actividad efectivamente realizada.

La versión detallada añadirá, **solo después de validación**, dosis de inicio y ajuste, frecuencia, duración cuando proceda, administración, monitorización, manejo de efectos adversos e interacciones con revisión de CIMA-AEMPS. La app no prescribe automáticamente.

## 5. Mejora exclusiva CaHReMe — integración multiorgánica

- **Ficha única de consulta** y reutilización de variables comunes para los seis módulos.
- **Séptima ruta integral:** cuatro dominios visibles con afecciones y riesgos coexistentes.
- **No imponer un condicionante principal:** pueden coexistir IC, ERC, obesidad y MASLD; mostrar conflictos y beneficios multiorgánicos sin sumar escalas en una puntuación inventada.
- **Priorización clínica explícita:** seguridad inmediata, datos críticos ausentes, objetivos de cada dominio, medidas modificadoras de pronóstico y seguimiento.
- **Calculadoras validadas por dominio:** selección de riesgo CV aplicable, KDIGO (con confirmación de cronicidad), cálculo FIB-4 cuando proceda, antropometría y control glucémico. No publicar sin casos de prueba.
- **Plan operativo:** acciones priorizadas, fármaco/alternativa con dosis verificada, seguimiento y derivación.
- **Explicabilidad:** por qué una recomendación aparece, qué dato la cambiaría y qué fuente la respalda.
- **Diseño:** paleta Atlántico, tipografía Inter, icono CaHReMe seleccionado y tarjetas con ilustraciones anatómicas editoriales.
- **Privacidad:** sin datos identificativos ni almacenamiento de historias clínicas en MVP.

## 6. Mapa de brechas al 2026-11-11

| Requisito | Estado real en rama `feat/prototipo-interfaz` |
| --- | --- |
| Inicio, navegación, formulario por dominios y resumen no clínico | Prototipo creado; pendiente revisión visual en navegador real |
| DM2 rápida con sus criterios | **Captura rápida y detallada implementada; resultados clínicos no implementados** |
| IC rápida y detallada | **Captura rápida y detallada implementada; resultados clínicos no implementados** |
| ERC rápida y detallada | **Captura implementada; categorías G/A descriptivas KDIGO 2024 calculadas, sin diagnóstico ni recomendaciones terapéuticas** |
| Sobrepeso/obesidad rápida y detallada | **Captura rápida y detallada implementada; resultados clínicos no implementados** |
| Hepático rápido con interpretación validada | **Captura implementada; FIB-4 calculado con interpretación condicionada EASL 2024, pendiente revisión clínica formal y ruta terapéutica** |
| Inicio/intensificación/desintensificación de insulina | **Captura de las tres situaciones implementada; algoritmo y recomendaciones no implementados** |
| Recomendaciones clínicas y terapéuticas comprobadas | **No implementado** |
| Biblioteca de algoritmos oficiales y leyenda farmacológica | **No implementado** |
| Integración multiorgánica de reglas | **No implementado** |
| PWA y cuatro ilustraciones de dominio provisionales | Estructura inicial creada; icono final, instalación y verificación visual pendientes |

## 7. Orden de construcción

**Bloque A — paridad de recorrido:** navegación de seis módulos + evaluación integral; formularios rápidos y detallados; datos compartidos; estados de seguridad; resultados estructurados no terapéuticos.

**Bloque B — evidencia por módulo:** documentos originales / alternativas oficiales, versiones actualizadas, reglas trazables y pruebas. Cada módulo se habilita independientemente al quedar validado.

**Bloque C — síntesis multiorgánica:** motor de conflictos, prioridades, recomendaciones y seguimiento. Sin obligación de completar todos los módulos para usar uno dirigido.

**Bloque D — presentación y despliegue:** icono definitivo, biblioteca de fuentes, lectura accesible, PWA/offline, revisión móvil, controles de privacidad.

## 8. Alcance jurídico y científico

El repositorio de GlucoGuía indica **© Antonio Arnal. Todos los derechos reservados sobre su adaptación**. Este documento es una matriz de **requisitos funcionales observados**: no autoriza copiar su implementación, textos de recomendaciones, gráficos ni PDF de terceros. Reimplementación propia, atribución de bibliografía legítima y verificación independiente de cada recomendación. Diferencias de fechas/versiones de fuentes deben resolverse con análisis clínico, no con reproducción automática.

**Criterio de aceptación final:** CaHReMe no podrá declararse equivalente a GlucoGuía hasta que cada una de las seis consultas rápidas y sus revisiones detalladas correspondientes produzcan salidas verificables, con casos de prueba y fuentes. La integración multiorgánica es un requisito adicional, no un sustituto de esa equivalencia.
