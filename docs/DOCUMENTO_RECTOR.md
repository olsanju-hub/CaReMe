# Documento rector · CaHReMe

**Versión:** 0.1 — borrador de alcance para revisión  
**Fecha:** 2026-11-11  
**Repositorio:** `olsanju-hub/CaReMe` (privado)  
**Nombre de presentación:** CaHReMe (nombre de trabajo)  
**Estado:** especificación de producto. No son instrucciones clínicas ni reglas de prescripción validadas.

## 1. Propósito y ámbito

CaHReMe será una **PWA independiente de apoyo a la decisión clínica en Atención Primaria en España**, diseñada para evaluar el riesgo y la enfermedad cardiovascular, renal, hepática y metabólica de manera integrada.

La unidad de trabajo es **una evaluación de un paciente en una consulta**, no un catálogo de cuatro algoritmos inconexos. La herramienta debe ofrecer una salida práctica: situación clínica, lo que está probado, lo que falta comprobar, prioridades, alternativas y seguimiento.

Los términos y modelos CKM y hepatometabólicos se tratarán según su respaldo documental. No se fabricará una clasificación única denominada «CaHReMe» ni un índice numérico de riesgo multiorgánico no validado.

## 2. Usuarios y contexto

- Destinatarios: profesionales sanitarios, especialmente Medicina Familiar y Comunitaria.
- Contexto inicial: adultos en AP de España. Casos pediátricos, gestación y otras poblaciones especiales no se extrapolarán desde algoritmos de adultos.
- Uso: consulta individual, revisión de factores de riesgo, evaluación longitudinal en la consulta y selección de próximos pasos.
- Infraestructura: experiencia `mobile-first`, accesible también desde escritorio, con funcionamiento local cuando sea técnicamente viable.
- Independencia: no integrar ni compartir runtime con NexoClx AP/Urg/061/Ped en la versión inicial.

## 3. Principios de diseño clínico

1. **Paciente primero.** Inicio por consulta integral, con acceso secundario a una evaluación dirigida por órgano.
2. **Rigor por dominio.** Utilizar escalas y criterios de clasificación validados en su población; no sumar sus puntuaciones en una supuesta escala global.
3. **Calibrar resultados.** Diferenciar hechos introducidos, cálculos derivados, interpretaciones y recomendaciones pendientes de confirmación.
4. **Seguridad ante datos ausentes.** Mostrar `No evaluable` cuando falten variables obligatorias; no estimar silenciosamente valores.
5. **Comorbilidad simultánea.** Contrastar recomendaciones entre dominios en vez de ordenar una sola enfermedad como si fuera aislada.
6. **Terapéutica trazable.** No mostrar dosis ni contraindicaciones como reglas activas hasta confirmar cada una en fuentes actuales y ficha técnica cuando proceda.
7. **Acciones no presumidas.** Un plan sugerido no equivale a prueba solicitada ni tratamiento administrado; registrar la acción como realizada solo tras confirmación explícita.
8. **Privacidad.** No recopilar nombre, DNI, historia clínica, fecha de nacimiento completa o información identificativa en la primera versión.
9. **Trazabilidad científica.** Cada regla tendrá un identificador estable, fuente, versión, fecha de verificación, población aplicable y casos de prueba.

## 4. Dominios clínicos y preguntas de consulta

### 4.1 Cardiovascular
Incluye factores de riesgo, presión arterial, lípidos, antecedentes cardiovasculares y, cuando proceda, insuficiencia cardíaca.

Preguntas: ¿qué riesgo puede estimarse válidamente?, ¿hay enfermedad establecida o datos de alarma?, ¿qué pruebas o decisiones preventivas hay que valorar?, ¿qué condicionantes cambian la elección terapéutica?

### 4.2 Renal
Incluye función renal, albuminuria, antecedentes de lesión renal o ERC, evolución temporal y tratamientos relevantes.

Preguntas: ¿hay datos suficientes para clasificar la situación renal?, ¿se trata de un hallazgo aislado o persistente?, ¿qué riesgos farmacológicos o pruebas pendientes condicionan la conducta?

### 4.3 Hepático
Incluye antecedentes, factores de riesgo metabólico, bioquímica hepática, plaquetas y pruebas no invasivas de fibrosis cuando estén indicadas y sean aplicables.

Preguntas: ¿hay sospecha razonable de enfermedad hepática esteatósica?, ¿se dispone de variables válidas para estratificar fibrosis?, ¿qué dato o prueba adicional permitiría orientar el siguiente paso?

### 4.4 Metabólico
Incluye diabetes/prediabetes según criterios aplicables, adiposidad, perfil lipídico y otros condicionantes metabólicos.

Preguntas: ¿qué objetivos y riesgos deben individualizarse?, ¿qué tratamientos ya recibe?, ¿qué opciones conviene revisar sin duplicidades ni interacciones?

## 5. Datos de entrada: propuesta inicial

Cada campo debe indicar unidad, fuente (declarado/documentado), fecha cuando sea relevante, estado de disponibilidad y validación. **No pedir todos los campos para iniciar.**

| Bloque | Datos candidatos | Observación |
| --- | --- | --- |
| Contexto | Edad o intervalo relevante, sexo/variable requerida por cada fórmula, tabaquismo, antecedentes de ECV, IC, DM2, ERC, enfermedad hepática | No se pide identidad personal |
| Antropometría | Peso, talla, IMC calculado, perímetro abdominal cuando aplique | Unidades visibles |
| Constantes | PAS, PAD, frecuencia cardiaca cuando corresponda | Contexto de medición |
| Metabólico | HbA1c, glucemia pertinente, perfil lipídico | Fecha y tipo de determinación |
| Renal | Creatinina, TFGe informada o calculable, cociente albúmina/creatinina urinario | No diagnosticar cronicidad con una sola medida |
| Hepático | AST, ALT, plaquetas y otros datos según la herramienta elegida | No calcular un índice si falta un componente |
| Tratamiento | Principios activos y dosis declaradas, alergias relevantes, intolerancias | Reconciliación y posibles discordancias |
| Contexto clínico | Síntomas, signos de alarma, embarazo cuando sea relevante, otras comorbilidades | Activar exclusiones/derivación según reglas validadas |

La lista final de variables y obligatoriedad se congelará con cada algoritmo clínico, no con este documento preliminar.

## 6. Recorrido de usuario previsto

1. **Inicio:** crear evaluación sin identificadores o abrir calculadora dirigida.
2. **Captura rápida:** datos esenciales disponibles. Mostrar qué dominios pueden evaluarse ya.
3. **Evaluación avanzada:** añadir datos organizados por sección, conservando contexto.
4. **Resultados por dominio:** puntuaciones/clasificaciones cuando sean válidas, estados «no evaluable», fuentes y límites.
5. **Síntesis integrada:** riesgos o problemas prioritarios, concordancias/conflictos entre dominios y datos críticos pendientes. Sin producir una puntuación global artificial.
6. **Propuesta de plan:** siguientes pruebas, consideración terapéutica, monitorización, reevaluación y criterios de derivación, solo tras revisión de reglas.
7. **Exportación no identificativa:** futura función opcional de resumen copiable/imprimible; sin almacenamiento persistente por defecto.

## 7. Estados mínimos de cada recomendación

- `NO_EVALUABLE`: faltan datos esenciales o la fórmula no es aplicable.
- `CALCULADO`: resultado reproducible con datos completos y fórmula documentada.
- `REVISAR`: información incongruente, condición de exclusión o discrepancia entre fuentes.
- `PROPUESTO`: actuación sugerida que requiere decisión profesional.
- `CONFIRMADO_POR_USUARIO`: acto confirmado por quien utiliza la app, nunca inferido.

La UI debe distinguir claramente cálculo, recomendación y actuación confirmada.

## 8. Arquitectura funcional por capas

- **Presentación:** componentes accesibles, interfaz Atlántico, pasos de captura y resultados legibles en móvil.
- **Modelo de paciente:** validación de tipos, unidades, fechas y disponibilidad.
- **Cálculo por dominio:** módulos independientes con entradas/salidas y pruebas de referencia.
- **Motor de integración:** reglas explícitas de prioridad y conflictos; no IA generativa para generar órdenes clínicas.
- **Contenido científico:** catálogo versionado de fuentes, criterios, reglas, advertencias y restricciones.
- **Calidad:** pruebas unitarias, de integración, accesibilidad y evaluación de casos clínicos por profesionales.

La tecnología concreta se decidirá al abrir la implementación. No es necesaria conexión a un servicio de IA para el MVP.

## 9. Identidad y experiencia visual ya seleccionadas

- Nombre visible: **CaHReMe**. Repositorio: **CaReMe**.
- Paleta Atlántico: `#173347`, `#138B8B`, `#F3F7F8`, `#DCEEEE`.
- Tipografía: Inter con fuentes alternativas del sistema.
- Icono de app: concepto A, **última variante con más color aprobada**, cuatro lóbulos conectados; corazón arriba, riñones izquierda, hígado derecha, figura humana abajo. Falta incorporar recurso final y comprobar legibilidad a 48 px y tamaños menores.
- Iconos interiores: ilustraciones anatómicas editoriales con anatomía reconocible; no emojis ni símbolos genéricos como identidad del módulo.
- Patrones: dashboard, evaluación paso a paso, paneles auxiliares desde abajo y resultados completos; diseño responsive.
- La disponibilidad del nombre como marca está pendiente de comprobación.

## 10. Seguridad y límites de la primera versión

- No se utilizará clínicamente hasta que los algoritmos implementados superen revisión bibliográfica, casos de prueba y revisión profesional.
- Evitar el almacenamiento de datos identificativos. Los datos introducidos de prueba serán sintéticos.
- No mostrar una prescripción como segura si faltan función renal, alergias, tratamientos concomitantes u otros campos obligatorios definidos por la regla.
- No presentar como diagnósticas clasificaciones que dependan de cronicidad, confirmación o pruebas adicionales.
- Los criterios de urgencia, derivación y contraindicaciones deben diseñarse y revisarse específicamente; ningún resultado normal de la app descartará por sí solo una enfermedad.
- No copiar código de la app de referencia ni elementos visuales protegidos sin licencia.

## 11. Criterios de aceptación para empezar a programar lógica clínica

Se requiere para cada módulo:

1. Alcance, población y exclusiones documentadas.
2. Contrato de entradas, unidades, datos obligatorios y valores válidos.
3. Algoritmo paso a paso con condición de salida y fuente exacta.
4. Casos correctos, fronterizos, contradictorios y no evaluables.
5. Fuente principal y divergencias relevantes entre guías registradas.
6. Revisión del tratamiento y ficha técnica de cada fármaco cuando corresponda.
7. Revisión clínica explícita del módulo antes de habilitar recomendaciones asistenciales.

## 12. Fuera del MVP

- Integración con historia clínica, receta electrónica y autenticación.
- Almacenamiento de pacientes longitudinal, servidor y sincronización en la nube.
- Diagnóstico mediante fotografías o IA generativa.
- Pacientes pediátricos y gestantes con reglas extrapoladas de adultos.
- Un índice inventado de «riesgo CaHReMe».
- Automatizar órdenes terapéuticas sin confirmación del profesional.

## 13. Decisiones pendientes

1. Prioridad exacta de casos clínicos de la primera iteración.
2. Conjunto mínimo de campos por cada herramienta seleccionada.
3. Matriz de evidencia con fuentes y fechas de verificación.
4. Formato final de icono y exportación PWA.
5. Especificación de seguridad para propuestas de tratamiento.
6. Política de revisión y actualización científica.

**Control de cambios:** 0.1 — documento rector inicial. Pendiente de aprobación como especificación congelada.
