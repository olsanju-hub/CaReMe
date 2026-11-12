# Insulinización DM2 · inicio, intensificación y desintensificación

**Corte de revisión:** 12/11/2026. **Ámbito:** atención primaria, adultos con DM2 previamente conocida.  
**Estado:** prototipo de orientación clínica **no prescriptiva**. No debe usarse para establecer dosis ni como protocolo asistencial hasta validar clínica y regulatoriamente.  
**Código:** `src/clinical/insulinizacion.mjs`; captura `src/consultas.mjs`; UI `src/app.mjs`.  
**Pruebas:** `tests/insulinizacion.test.mjs`, `tests/insulinizacion-ui.test.mjs`, regresión `tests/consultas.test.mjs`.

## 1. Fuentes primarias y jerarquía

1. [ADA/EASD — *Management of Type 2 Diabetes, 2026*, consenso](https://diabetesjournals.org/care/article/doi/10.2337/dci26-0141/172591). Es la referencia más reciente del conjunto revisado para ubicación de la insulina: si está indicada, empezar habitualmente con basal; valorar terapia GLP-1 y mantener tratamientos de beneficio cardiorrenal cuando no estén contraindicados; individualizar la intensificación y revisar sobrebasalización.
2. [ADA — *Standards of Care in Diabetes 2026*, sección 9](https://diabetesjournals.org/care/article/49/Supplement_1/S183/163934): criterios de inicio ante síntomas o hiperglucemia marcada (HbA1c >10% o glucemia ≥300 mg/dL); si basal controla ayunas pero persisten elevaciones posprandiales, valorar arGLP-1/agonista dual antes de prandial si procede; reconocer hipoglucemia y gran variabilidad como señales de posible sobrebasalización. Como **referencia de guía**, basal suele comenzar con 0,1–0,2 U/kg/día, seguida de titulación individual.
3. [ADA 2026, sección 6](https://diabetesjournals.org/care/article/49/Supplement_1/S132/163927): educación para prevención/tratamiento de hipoglucemia, glucagón en personas tratadas con insulina, y revisión de tratamiento tras hipoglucemia clínicamente relevante.
4. [ADA 2026, sección 13: adultos mayores](https://diabetesjournals.org/care/article/49/Supplement_1/S277/163921/13-Older-Adults-Standards-of-Care-in-Diabetes-2026): recomendaciones de simplificar regímenes complejos y desintensificar terapias asociadas a hipoglucemia cuando daño o carga superan beneficio, individualizando objetivo y capacidad de autocuidado.
5. [Fundación redGDPS — Algoritmo de insulinización DM2 2022](https://www.redgdps.org/algoritmo-insulinizacion-2022/). Marco histórico español de inicio, intensificación y situaciones especiales. **No se traslada literalmente su pauta de dosis ni sus umbrales de 2022 si no coinciden con referencias 2026.** Revisión de la representación gráfica y notas del documento original.
6. [CIMA-AEMPS — Lantus SoloStar insulina glargina 100 U/mL](https://cima.aemps.es/cima/dochtml/ft/00134033/). Ficha individual: pauta subcutánea una vez al día y ajuste de dosis/horario individual. El producto es un ejemplo de ficha verificable, **no un fármaco seleccionado ni una receta**. No extrapolar pautas, dispositivos o equivalencias a otras concentraciones de insulina.

**Prioridad ante diferencias entre guías:** las indicaciones y restricciones de ficha CIMA del producto concreto deben verificarse al tomar una decisión real. Las clases o dosis de fuentes científicas no equivalen por sí solas a autorización de una presentación en España.

## 2. Contrato de entrada

Las tres rutas comparten `insulina_fase` y `insulina_perfil`. La modalidad detallada añade variables necesarias para diferenciar decisiones:

| Campo | Razón |
| --- | --- |
| DM2/DM1, edad y gestación | Determinar ámbito y detectar circuitos no aplicables |
| Esquema real (`Sin insulina`, `Solo basal`, `Basal y prandial`, `Premezclas`) | No tratar como nuevo inicio una insulinización ya existente |
| Dosis basal diaria confirmada + peso | Describir **U/kg/día actual**, sin establecer corte diagnóstico universal |
| Glucemia de ayunas y relación con objetivo | Separar falta de control basal de hiperglucemia posprandial |
| Patrón posprandial | Identificar cuándo no corresponde aumentar insulina basal |
| Hipoglucemia nocturna y episodios graves/recurrentes | Detectar situaciones que requieren revisión de seguridad y posible simplificación |
| HbA1c, fecha/fiabilidad y objetivo individual | Determinar si existe necesidad glucémica de intensificación habitual |
| Conciliación farmacológica, dosis reales, adherencia | Evitar duplicidades y supuestos de fracaso terapéutico |
| Capacidad para autocuidado y apoyo | Identificar educación, técnica y soporte necesarios |
| Motivo de desintensificación | Evitar sugerir retirada sin causa clínica registrada |
| Estado agudo, TFGe, corticoides, fragilidad | Condicionantes de seguridad y de patrón glucémico |

No se registran datos identificativos, ni se persisten los datos de consulta en el servidor.

## 3. Inicio de insulinización

En una valoración ambulatoria sin riesgo agudo se revisan diagnóstico DM2, objetivo, HbA1c, medicación previa y si está indicada realmente una insulinización. Si no hay hiperglucemia grave, la referencia ADA/EASD 2026 da prioridad a valorar terapias basadas en GLP-1 antes de insulina cuando corresponda.

En modalidad detallada, y **solo si** consta ausencia real de insulinización, HbA1c fuera del objetivo, buena documentación del contexto y barreras descartadas, el motor emite un candidato `INS-START-BASAL` para revisión profesional.

La guía ADA 2026 describe un rango de **0,1–0,2 U/kg/día** como referencia de inicio de basal. CaHReMe **NO multiplica el peso por ese rango para producir una dosis prescrita**, no selecciona insulina específica y no registra un inicio.

Antes de una prescripción real quedarían por definir producto, concentración, dispositivo, autocuidado, objetivos de glucosa, educación y plan de titulación específico según la ficha técnica.

## 4. Intensificación

Para pacientes ya tratados con basal:
- **Ayunas por encima del objetivo:** revisar pauta realmente utilizada, adherencia, técnica, horario y patrón glucémico antes de plantear titulación. Sin dosis confirmada no se emite candidato de ajuste.
- **Ayunas en objetivo con hiperglucemia posprandial repetida:** evitar escalar basal únicamente por HbA1c. Valorar tratamiento basado en GLP-1 si no se recibe y existe elegibilidad; si procede, evaluar estrategia dirigida a comidas, sin calcular bolo.
- **Ayunas por debajo del objetivo o hipoglucemias nocturnas:** detener las propuestas de intensificación habitual; comprobar sobrebasalización y seguridad.
- **HbA1c por debajo del objetivo individual:** no intensificar de rutina por un patrón aislado, sin integrar contexto y otras medidas.

El cociente `dosis basal actual (U/día) / peso (kg)`, cuando ambos datos constan, se muestra solo como **descripción**. No se diagnostica sobrebasalización a partir de un umbral de unidades por kilogramo aislado; ADA 2026 insiste en hipoglucemia, discrepancias de glucosa y variabilidad.

## 5. Desintensificación

En pacientes insulinados se exige esquema actual confirmado, motivo de simplificación, información sobre hipoglucemias, estado funcional, adherencia y capacidad de autocuidado. Se valoran fragilidad, carga de inyecciones, insulinización transitoria y evolución clínica.

Cuando la situación es adecuada para una evaluación no urgente, se ofrece la tarjeta `INS-DEINTENSIFY-REVIEW` con las comprobaciones necesarias, sin ordenar reducción, suspensión ni modificación de dosis. Ante hipoglucemia grave/recurrente la prioridad es revisar seguridad y tratamiento, sin aplicar una pauta rutinaria desde la herramienta.

## 6. Seguridad transversal y seguimiento

El motor utiliza `auditCrossDomain`. DM1 conocida, gestación, posible crisis metabólica, glucemia ≥300 mg/dL, hipoglucemia grave, enfermedad aguda o alteraciones de datos detienen propuestas de rutina.

La salida incluye:
- `state`: `revision_pendiente`, `datos_insuficientes`, `revisar_coherencia` o `seguridad_prioritaria`.
- `nextSteps`, `options`, `alerts`, `checks`, `missing`, `glycemicPattern`, `followUp` y fuentes.
- `patientDose:null`, `prescription:null`, `actionPerformed:false`, `noPrescription:true`.

Las recomendaciones de autocontrol de glucemia/MCG, técnica de inyección, educación en hipoglucemia y acceso a glucagón deben individualizarse. La periodicidad HbA1c de aproximadamente tres meses tras cambios reales no sustituye una revisión anterior de glucemias o síntomas.

El sistema **no genera citas, recordatorios o acciones sobre insulina**: la continuidad programada de otros productos de CaHReMe no se reutiliza para insulinización sin reglas específicas.

## 7. Pruebas y puertas de publicación

Las pruebas cubren:
- Ausencia de fase, perfiles y diagnóstico DM2; caso compatible con DM1.
- Diferencia entre inicio y tratamiento ya instaurado; falta de régimen real.
- Ayunas en objetivo frente a hiperglucemia posprandial; supresión de duplicidad GLP-1.
- Falta de dosis basal, no adherencia y esquema sin confirmar.
- Ayunas bajas y hipoglucemia nocturna pese a HbA1c elevada.
- Desintensificación con motivo / sin motivo, y ausencia de insulina real.
- Fronteras de glucemia **299/300 mg/dL** y crisis/embarazo.
- Cálculo descriptivo U/kg/día, sin aumento automático.
- Interfaz rápida/detallada, compartición de datos, integridad del modo resumen y PWA.

**Pendientes:** selección validada de producto por situación, algoritmo de titulación supervisada con dosis y controles, manejo de dosis de insulina rápida y mezclas, contrastes con registros clínicos externos, QA real en iPhone y escritorio, revisión científica y evaluación regulatoria.

No declarar paridad clínica completa con GlucoGuía ni fusionar PR #4 hasta cerrar las puertas de validación.
