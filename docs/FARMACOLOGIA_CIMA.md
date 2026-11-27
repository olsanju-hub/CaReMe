# Farmacología contrastada con CIMA-AEMPS · Bloque 1

**Proyecto:** CaHReMe  
**Fecha de consulta de CIMA:** 2026-11-11  
**Estado:** fichas estructuradas y pruebas de software; **pendiente de revisión clínica formal**.  
**Código:** `src/clinical/farmacologia.mjs`  
**Pruebas:** `tests/farmacologia.test.mjs`

## 1. Contrato de seguridad

- **La información sobre dosis procede de la ficha técnica** de un producto concreto y se muestra bajo la indicación correspondiente.
- La app **no calcula dosis individuales, no prescribe y no etiqueta al paciente como apto**; incluso cuando los datos esenciales están registrados el estado permanece en `revision_pendiente`.
- El formulario devuelve `bloqueo`, `datos_insuficientes` o `revision_pendiente`. **Nunca «autorizado para iniciar»**.
- El motor diferencia las indicaciones aprobadas de la misma molécula: **no aplica una pauta de DM2/ ERC a una insuficiencia cardíaca sin comprobar la ficha**.
- La prescripción definitiva requiere fármaco concreto, indicación, situación renal y de volemia, alergias, otras contraindicaciones, interacciones y revisión de la última ficha técnica.
- No se asume que datos vacíos signifiquen «No». Se excluye el almacenamiento persistente de datos identificativos.

## 2. Empagliflozina (Jardiance)

**Ficha técnica primaria:** [CIMA-AEMPS — Jardiance 10/25 mg](https://cima.aemps.es/cima/dochtml/ft/114930014), apartados 4.1–4.5.

| Indicación | Pauta de ficha técnica en adultos |
| --- | --- |
| DM2 no suficientemente controlada | Inicio 10 mg por vía oral una vez al día; si tolera 10 mg, necesita mayor control glucémico y **TFGe ≥60**, se puede aumentar hasta 25 mg/día |
| Insuficiencia cardíaca crónica sintomática | 10 mg una vez al día |
| Enfermedad renal crónica | 10 mg una vez al día |

**Función renal:** inicio no recomendado con TFGe <20 mL/min/1,73 m²; con TFGe <60, dosis diaria 10 mg. Su efecto hipoglucemiante disminuye por debajo de TFGe 45 y es probablemente ausente por debajo de 30. Ello **no equivale a ausencia de beneficio cardiorrenal**.

**Contraindicación formal (FT 4.3):** hipersensibilidad a empagliflozina o excipientes. **Advertencias relevantes**: no utilizar en diabetes tipo 1; cetoacidosis incluso con glucemia no muy elevada; enfermedad aguda grave, cirugía o ayuno; hipovolemia/hipotensión; hepatopatía grave; riesgo de hipoglucemia con insulina o sulfonilureas.

**Monitorización:** función renal antes de iniciar y de forma periódica, al menos anual; presión arterial/volemia y electrolitos según contexto. En enfermedad grave o procedimientos mayores, valorar cetonemia y condiciones para reinicio conforme a la ficha.

**Control codificado:** TFGe <20, sospecha de cetoacidosis, diabetes tipo 1 y enfermedad aguda grave bloquean cualquier salida de inicio. No se propone 25 mg en la vía de IC ni en la de ERC.

## 3. Finerenona (Kerendia)

**Ficha técnica primaria:** [CIMA-AEMPS — Kerendia 10/20/40 mg](https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html), apartados 4.1–4.5.

**Cambio respecto al enfoque renal original de la app:** la ficha CIMA vigente incorpora también **insuficiencia cardíaca crónica sintomática con FEVI ≥40 %**, incluso sin DM2 como requisito de esa indicación. Se deben mantener dos vías terapéuticas independientes.

| Dato | ERC con albuminuria asociada a DM2 | IC crónica sintomática con FEVI ≥40 % |
| --- | --- | --- |
| Inicio con TFGe ≥60 | 20 mg una vez al día | 20 mg una vez al día |
| Inicio con TFGe ≥25 y <60 | 10 mg una vez al día | 10 mg una vez al día |
| Inicio con TFGe <25 | No recomendado | No recomendado |
| Objetivo con TFGe inicial ≥60 | 20 mg/día | 40 mg/día |
| Objetivo con TFGe inicial ≥25 y <60 | 20 mg/día | 20 mg/día |
| Máximo | 20 mg/día | 40 mg/día |
| Potasio previo | Si ≤4,8 puede iniciarse; >4,8 a 5,0 solo considerar con monitorización adicional; >5,0 no iniciar | Si ≤5,0 puede iniciarse; >5,0 no iniciar |
| Seguimiento | K y TFGe a 4 semanas y periódicamente | K y TFGe a 4 semanas y periódicamente |

**Importante:** los algoritmos de **continuación y titulación** por potasio y descenso de TFGe también son distintos por indicación (tablas 2 y 4). Todavía **no están automatizados**. Se presentan las dosis de ficha como referencia, no como recomendación individual.

**Contraindicaciones (FT 4.3):** hipersensibilidad, inhibidores potentes CYP3A4 y enfermedad de Addison. **Otras barreras:** no usar con otros ARM o diuréticos ahorradores de potasio; no iniciar en insuficiencia hepática grave; revisar embarazo e interacciones.

**Control codificado:** inicio bloqueado si TFGe <25, potasio >5,0, ARM registrado, CYP3A4 potente, Addison o insuficiencia hepática grave. En la vía de IC se exige FEVI ≥40 y condición sintomática. La presencia aislada de ERC no autoriza utilizar la pauta cardíaca.

## 4. Contrato informático

`reviewDrug(draft, drugId, routeId)` devuelve:

- `state`: `bloqueo` | `datos_insuficientes` | `revision_pendiente`.
- `blocked`: condiciones observadas que impiden proponer inicio en esta vía.
- `missing`: variables esenciales no confirmadas.
- `checks`: comprobaciones profesionales que deben realizarse.
- `labelDoses`: lista informativa **específica de la indicación**, procedente de CIMA.
- `monitoring`: controles referidos en la ficha.
- `patientDose = null`, `prescription = null`: **constantes por diseño**.

La interfaz `Herramientas → Farmacología` muestra las dos moléculas. Las cinco vías de uso se consultan individualmente sin fusionar el itinerario renal y el cardíaco.

## 5. Pruebas de seguridad

La batería cubre: TFGe 19,9/20 para empagliflozina, TFGe 24,99/25 y K 5,0/5,01 para finerenona, FEVI 39,9/40, diabetes tipo 1, sospecha de cetoacidosis, proceso agudo, CYP3A4 potente, Addison, ARM concomitante, datos ausentes, separación de dosis máxima por indicación y ausencia de prescripción automática.

**Pendientes para uso clínico:** validación farmacológica individual de las fichas, confirmación de vigencia al publicar, interacciones exhaustivas, manejo de tratamiento ya iniciado, tablas de titulación para cada vía, situaciones especiales, financiación autonómica/estatal si procede, auditoría clínica por casos y aceptación explícita del contenido.

## 6. Próximo bloque

- Incorporar las fichas de otros principios activos prioritarios de DM2/CKM con revisión CIMA independiente.
- Revisar rutas de insuficiencia cardíaca y DM2 con guías actuales; registrar discrepancias.
- Desarrollar calendario de controles y reevaluación condicionados a la indicación y al tratamiento **efectivamente confirmado**, evitando atribuir acciones no realizadas.

## 7. Continuidad de tratamiento, titulación y seguimiento (12/11/2026)

Se añadieron las tablas completas de continuidad de **finerenona** diferenciadas por **ERC-DM2** (tabla 2) e **IC sintomática FEVI ≥40 %** (tabla 4), y la reevaluación de **empagliflozina** ante cetoacidosis, enfermedad aguda o ajuste del tratamiento glucémico. El resultado siempre es una **referencia de ficha**, sin prescripción. Los controles programables solo nacen de actuaciones confirmadas mediante fecha/dosis real.

Especificación, umbrales, pruebas y limitaciones: [CONTINUIDAD_Y_SEGUIMIENTO.md](CONTINUIDAD_Y_SEGUIMIENTO.md).

## 8. Incretinas añadidas por producto (12/11/2026)

El catálogo se amplía con tres referencias de ficha CIMA: **Ozempic inyectable** (semaglutida · DM2), **Wegovy inyectable** (semaglutida · control del peso) y **Mounjaro** (tirzepatida · DM2/peso). Se evita trasladar pautas entre productos que contienen semaglutida; Wegovy oral se mantiene fuera del módulo. La información de dosis es exclusivamente documental. Se incluye contraste con BIFIMED por presentación, sin asumir financiación automática.

Ver [INCRETINAS_CIMA.md](INCRETINAS_CIMA.md) para fuentes, restricciones, pruebas y límites.

## 9. Metformina y dapagliflozina (12/11/2026)

Se añaden fichas CIMA de **metformina Tarbis 850/1000 mg (liberación inmediata, DM2)** y **dapagliflozina Forxiga (DM2, IC y ERC)**. Los límites renales **no son intercambiables**: metformina tiene reducción de máximos diarios según filtrado y contraindicación con TFGe <30; Forxiga no requiere ajuste por TFGe pero no se recomienda iniciarla con TFGe <25. Se muestran advertencias por acidosis, situaciones agudas, contraste o cirugía, y se distingue inicio de tratamiento ya instaurado.

Ver [METFORMINA_DAPAGLIFLOZINA_CIMA.md](METFORMINA_DAPAGLIFLOZINA_CIMA.md). Estas fichas siguen siendo no prescriptivas y no autorizan un calendario de seguimiento nuevo.
