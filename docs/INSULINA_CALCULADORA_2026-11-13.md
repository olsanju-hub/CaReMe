# Calculadora de pautas de insulina

Revisión: 13/11/2026. Motor: `src/clinical/insulina-dosis.mjs`. Acceso destacado en Insulinización → Abrir calculadora de insulina. Se implementan propuestas numéricas explícitas, separadas de la orientación y del historial de actuaciones. Una propuesta no se considera administrada ni alimenta el calendario como actuación confirmada.

## Alcance y fuentes

DM2 adulta estable, sin gestación. Tres presentaciones basales y una prandial, verificadas individualmente en CIMA; no son selección comercial automática. El profesional elige la presentación. No se deduce financiación ni superioridad de una marca a partir de la inclusión.

| Presentación | Inicio calculado | Dispositivo |
| --- | --- | --- |
| Glargina U100, Lantus SoloStar | Estrategia explícita: 10 U o 0,1–0,2 U/kg/día, ADA 2026 | Pasos de 1 U; máximo 80 U/inyección |
| Glargina U300, Toujeo SoloStar | 0,2 U/kg/día, CIMA | Pasos de 1 U; máximo 80 U/inyección |
| Degludec U100, Tresiba FlexTouch | 10 U/día, CIMA | Pasos de 1 U; máximo 80 U/inyección |
| Asparta U100, NovoRapid FlexPen | Primer bolo 4 U o 10 % de basal, ADA 2026 | Pasos de 1 U; máximo 60 U/inyección |

CIMA Lantus establece individualización, no una dosis inicial fija propia. Sus estrategias de inicio proceden de ADA, diferenciadas en el resultado. No se trasladan estas reglas a DoubleStar, Tresiba U200, FlexPen, biosimilares, NPH, mezclas o combinaciones fijas.

Fuentes primarias revisadas:

- [ADA 2026 §9 / figura 9.4](https://diabetesjournals.org/care/article/49/Supplement_1/S183/163934): inicio, titulación, reducción por hipoglucemia y primer bolo. El PDF directo devolvió 403; se contrastaron contenido indexado del original y texto editorial original, sin copiar material gráfico.
- [redGDPS 2026, capítulo 5.5](https://www.redgdps.org/vivir-con-diabetes-tipo-2/5-5-insulinizacion/), publicado el 12/11/2026: tablas 2–3 y secuencia práctica. Se verifica el capítulo íntegro, sustituyendo la limitación documental previa de disponer solo del anuncio de la guía. No se extrapola una revisión a todos sus capítulos.
- [Lantus SoloStar CIMA §§4.2–4.4](https://cima.aemps.es/cima/dochtml/ft/00134033/FT_00134033.html).
- [Toujeo CIMA §§4.2–4.4/5.1](https://cima.aemps.es/cima/dochtml/ft/100133034/FT_100133034.html).
- [Tresiba CIMA §§4.2–4.4/5.1](https://cima.aemps.es/cima/dochtml/ft/112807004/FT_112807004.html).
- [NovoRapid CIMA §§4.2–4.4](https://cima.aemps.es/cima/dochtml/ft/99119009/FT_99119009.html).

## Ramas implementadas

Inicio: exige esquema sin insulina. El peso solo se solicita si interviene en el cálculo. Un tratamiento o dosis basal ya registrados impiden tratarlo como primer inicio.

Ajuste basal: exige una sola basal diaria, dosis realmente administrada, objetivo acordado y tres glucemias consecutivas. Se propone +2 U solo si las tres superan el objetivo y ha transcurrido el período mínimo. Para dos cifras bajo objetivo sin hipoglucemia, se contempla −2 U; no se espera el intervalo de subida para reducir. Los valores <70, ≥300 o un patrón mixto bajo/alto retienen titulación. Una elevación aislada no genera aumento.

Intervalo de aumentos: glargina U100 tres días; Toujeo y degludec cuatro. Es una decisión conservadora de implementación: Toujeo alcanza estado estacionario en 3–4 días según CIMA; degludec en 2–3, pero se conserva margen de cuatro días antes de encadenar aumentos. No se atribuye a CIMA una obligación de cuatro días para degludec.

Primer bolo: requiere basal sola, patrón posprandial repetido con ayunas controladas, evaluación de alternativa GLP-1, comida identificada e ingesta asegurada. Producto explícito NovoRapid FlexPen. Con HbA1c <8 %, calcula además la alternativa ADA de reducir basal 10 %. El resultado distingue dosis del bolo y basal asociada. No calcula bolos correctores, raciones, insulina activa ni ajustes sucesivos de un esquema basal-bolo.

Reducción basal: limitada a hipoglucemia leve resuelta, sin causa corregible y atribuida a basal, con elección profesional explícita de 10 % o 20 %. No calcula retirada completa ni aplica el porcentaje a bolos o dosis totales. Ante episodios actuales, graves o recurrentes, exige valoración prioritaria.

## Límites y seguridad

La confirmación final cubre ámbito clínico, indicación, revisión por producto, medicación concomitante y educación. Cambiar cualquier dato o su disponibilidad invalida esa confirmación. Una selección negativa no borra alertas previamente registradas. El cálculo vuelve a consultar la auditoría transversal.

ERC con TFGe <30, fragilidad/paliativos, corticoides, embarazo, DM1, insuficiencia hepática y procesos agudos quedan fuera del cálculo rutinario. El intervalo TFGe 30–180 y los intervalos de objetivos del formulario son límites técnicos del recorrido; no definen una contraindicación farmacológica. No se presentan como imposibilidad de usar insulina en esos pacientes.

Redondeo visible hacia abajo a unidades enteras. Se retienen cero, dosis superiores a la capacidad de una inyección y reducciones porcentuales que por el paso de la pluma acabarían superando 20 %. No hay división automática en varias inyecciones ni conversión a mL.

Persisten brechas: simplificación basal-bolo/premezclas, manejo por fragilidad y corticoides, cambios entre productos, titulación prandial posterior y otras formulaciones. La revisión independiente de las reglas y la prueba física en iPhone siguen pendientes. Los ensayos de software no acreditan validación clínica independiente.

## Auditoría

94 escenarios nuevos del motor: cálculo y redondeo por producto, dosis no administrables, umbrales de glucemia y función renal, intervalos de ajuste, contradicciones, ausencia de datos, seguridad transversal, caducidad de confirmación y ausencia de mutación/administración. Base total local: 1170/1170 pruebas y sintaxis superadas.

Se amplía el recorrido Chromium/WebKit para probar inicio por peso, cambio de peso sin confirmación, titulación, bolo y reducción. Su resultado se consulta en Actions antes de cerrar el incremento.

La primera ejecución de navegador conservó 176 comprobaciones previas correctas. El nuevo escenario no arrancó porque intentaba borrar una sesión ya vacía; se corrige su preparación sin retirar aserciones de dosis. Se añade retención de HbA1c fuera de 3–20 % y salto/foco al resultado tras calcular.

### Cierre de ejecución

Código funcional `a2d055b97a8cf103735c68a146c7f9fbcf250817`: 1170/1170 pruebas Node y 180/180 comprobaciones Chromium/WebKit, cero fallos. Runs navegador 43440515414 y 43440524550 correctos; Pages 43440514303 desplegado. Cuatro perfiles, 320–1280 px; escenarios nuevos de inicio, invalidación, titulación, bolo y reducción superados en todos. Captura WebKit de 320 px revisada: producto, dosis, fórmula y seguimiento visibles. Informe y capturas sintéticas conservados como artifact de Actions. No equivale a prueba en iPhone físico ni validación clínica externa.
