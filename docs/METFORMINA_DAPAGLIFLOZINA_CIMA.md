# Metformina y dapagliflozina — bloque CIMA de CaHReMe

**Corte documental:** 12/11/2026. **Estado:** implementación técnica y pruebas automatizadas, sin validación profesional para uso asistencial.

**Código:** `src/clinical/basales.mjs` (fichas y reglas), `src/clinical/farmacologia.mjs` (catálogo), `src/clinical/integracion.mjs` (avisos transversales). **Pruebas:** `tests/basales.test.mjs`.

## 1. Fuentes primarias y límites

- **Metformina:** [CIMA-AEMPS, Metformina Tarbis 850/1000 mg, comprimidos de liberación inmediata](https://cima.aemps.es/cima/dochtml/ft/76579/FT_76579.html), apartados 4.1–4.5. La posología y forma de administración **no se extrapolan** a otras formulaciones, en especial liberación prolongada.
- **Dapagliflozina:** [CIMA-AEMPS, Forxiga 5/10 mg, comprimidos](https://cima.aemps.es/cima/dochtml/ft/112795007/), apartados 4.1–4.5. Se implementan únicamente las vías **adultas** de DM2, insuficiencia cardíaca crónica sintomática y ERC. La ficha también contempla pediatría para DM2, fuera del alcance de CaHReMe.

Las dosis documentadas son **referencias de ficha** y no constituyen prescripción. `reviewDrug` retorna siempre `patientDose:null` y `prescription:null`. Se muestran `bloqueo`, `datos_insuficientes` o `revision_pendiente`, nunca «apto» o «tratamiento indicado automáticamente».

## 2. Metformina (liberación inmediata): función renal

| TFGe (mL/min/1,73 m²) | Dosis diaria máxima de ficha | Estado |
| --- | ---: | --- |
| ≥60 | 3.000 mg | Máximo de referencia; individualizar |
| 45 a <60 | 2.000 mg | Revisar factores de riesgo de acidosis láctica y dosis inicial |
| 30 a <45 | 1.000 mg | Revisar riesgo de acidosis láctica y función renal |
| <30 | Ninguna | **Contraindicada** |

La dosis inicial habitual con TFGe ≥90 figura como **500 u 850 mg dos o tres veces al día**, con titulación según tolerancia y control glucémico; no se calcula una dosis a partir del máximo renal. La ficha contempla evaluación de TFG antes de iniciar y al menos anual; cada 3–6 meses en mayores o riesgo incrementado de progresión.

**Bloqueos y avisos destacados:**
- Acidosis metabólica aguda (incluida cetoacidosis), hipoxia tisular y enfermedad cardíaca descompensada.
- Insuficiencia hepática; deshidratación grave, infección o shock con posible deterioro renal.
- Contraste yodado intravascular: la ficha ordena interrumpir antes o en el momento y **no reanudar antes de 48 horas** sin reevaluación renal estable.
- Cirugía con anestesia general, espinal o epidural: interrumpir en el momento; reinicio según recuperación y función renal estable.
- Antecedentes de patología mitocondrial y consumo excesivo de alcohol requieren evaluación.
- Valorar déficit de vitamina B12 ante anemia, neuropatía o factores de riesgo durante uso prolongado.

El software solo identifica **necesidad de valorar una interrupción**, no la ejecuta ni la marca como realizada.

## 3. Dapagliflozina (Forxiga): indicaciones y TFGe

| Vía adulta | Dosis de ficha |
| --- | --- |
| DM2 insuficientemente controlada | 10 mg por vía oral una vez al día |
| IC crónica sintomática | 10 mg por vía oral una vez al día |
| ERC | 10 mg por vía oral una vez al día |

- **No requiere ajustar la dosis por función renal**; la ficha **no recomienda iniciar** con TFGe <25. Ese umbral no puede emplearse para inferir suspensión automática de tratamiento vigente.
- En DM2, el efecto hipoglucemiante disminuye con TFGe <45. Esto no debe interpretarse como ausencia de protección cardiorrenal.
- En insuficiencia hepática grave, la ficha de Forxiga recomienda **iniciar con 5 mg**, pudiendo aumentar a 10 mg si se tolera. El módulo impide trasladar la pauta general de 10 mg a esta situación sin revisión específica.
- No usar en DM1; ante sospecha de cetoacidosis se requiere evaluación inmediata, aunque la glucemia no sea muy elevada.
- La ficha recomienda interrupción durante cirugía mayor/hospitalización por enfermedad aguda grave, con valoración de cetonemia y estabilidad antes de reanudar.
- Riesgo de depleción de volumen/hipotensión; hipoglucemia al asociar insulina o sulfonilureas. Reconciliar el tratamiento y no duplicar iSGLT2.

## 4. Integración multiorgánica

La clase iSGLT2 puede aportar beneficio renal/cardiovascular en pacientes apropiados con ERC e insuficiencia cardíaca, pero **los puntos de corte de recomendación de una guía NO sustituyen a la ficha técnica individual**.

En CaHReMe las tarjetas de iSGLT2 enlazan a **empagliflozina** y **dapagliflozina**. En el intervalo TFGe 20 a <25 se advierte que la ficha española de Forxiga no recomienda iniciar, aunque algunos algoritmos de clase empleen un umbral diferente. La indicación de DM2 no es necesaria para la vía cardíaca o renal del producto.

Para metformina la integración ofrece contexto de tratamiento glucémico y avisos de seguridad ante TFGe <30 o descompensación, sin atribuirle por defecto efectos cardiorrenales equivalentes a iSGLT2.

## 5. Pruebas y pendientes

Pruebas de frontera en TFGe: **29,99/30; 44,99/45; 59,99/60** para metformina, y **24,99/25; 44,99/45** para dapagliflozina. Se incluyen exclusiones por acidosis metabólica, hipoxia, IC descompensada, insuficiencia hepática y contraste/cirugía; evaluación de duplicidades y ausencia de prescripción.

**Pendiente:** conciliación exhaustiva por molécula y dosis, evaluación personalizada de suspensión/reinicio, manejo de situaciones agudas reales, validación clínica, comprobación de financiación por presentación, control regulatorio y prueba de interfaz real en móvil.

El módulo de historial confirmado y calendario **no se amplía** a estos medicamentos: su seguimiento específico aún no está formalizado ni validado. No registrar actuaciones falsas ni generar recordatorios automáticos.
