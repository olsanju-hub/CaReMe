# Semaglutida y tirzepatida — catálogo CIMA-AEMPS de CaHReMe

**Revisión documental:** 12 de noviembre de 2026  
**Estado:** fichas informativas y comprobaciones de seguridad; **sin autorización para prescribir**.  
**Archivos:** `src/clinical/incretinas.mjs`, `tests/incretinas.test.mjs`.  
**Ámbito:** personas adultas. Las indicaciones pediátricas que algunas fichas actuales puedan contemplar **no se implementan**.

## 1. Separación obligatoria de molécula, producto, formulación e indicación

Semaglutida no equivale a una única pauta:

| Producto de referencia | Formulación incluida | Indicaciones desarrolladas | Fuente oficial CIMA |
| --- | --- | --- | --- |
| **Ozempic** (semaglutida) | Subcutánea semanal | **DM2** insuficientemente controlada, adultos | [Ozempic 0,25 mg](https://cima.aemps.es/cima/dochtml/ft/117251002/), FT §§4.1–4.6 |
| **Wegovy** (semaglutida) | **Subcutánea semanal** | **Control del peso** adulto | [Wegovy FlexTouch](https://cima.aemps.es/cima/dochtml/ft/1211608006/FT_1211608006.html), FT §§4.1–4.6 |
| **Mounjaro** (tirzepatida) | Subcutánea semanal | **DM2** y **control del peso**, adultos | [Mounjaro KwikPen](https://cima.aemps.es/cima/dochtml/ft/1221685002/FT_1221685002.html), FT §§4.1–4.6 |

**Precaución de versión:** en 2026, CIMA contiene **Wegovy en comprimidos** con pautas y absorción diferentes. **No se incluye** ni se permite extrapolarle la dosis de la formulación subcutánea. Debe ser un producto independiente si se implementa en un futuro bloque. CIMA también ha incorporado a Wegovy subcutáneo una opción de mantenimiento de **7,2 mg** en circunstancias específicas; no congelar automáticamente su máximo en 2,4 mg.

## 2. Posologías informativas (nunca para generar una orden médica)

| Indicación | Escalado de ficha | Mantenimiento / máximo |
| --- | --- | --- |
| Ozempic · DM2 | 0,25 mg/semana durante 4 semanas; después 0,5 mg/semana; si procede, ≥4 semanas por escalón antes de 1 y 2 mg | Máximo 2 mg/semana; 0,25 mg **no** es mantenimiento |
| Wegovy inyectable · control del peso | 0,25 → 0,5 → 1 → 1,7 mg semanal, normalmente 4 semanas por nivel | 2,4 mg/semana; ficha contempla 7,2 mg/semana tras ≥4 semanas a 2,4 mg **solo si IMC inicial ≥30 en adultos**, con revisión de respuesta |
| Mounjaro · DM2 o peso | 2,5 mg semanal durante 4 semanas, luego 5 mg; aumentos de 2,5 mg con **≥4 semanas** entre niveles | Mantenimiento 5, 10 o 15 mg; máximo adulto 15 mg/semana |

**No son dosis calculadas para el paciente.** El catálogo guarda las pautas como texto de la ficha, separadas por vía de indicación. Los resultados de `reviewDrug` devuelven en todos los casos `patientDose: null` y `prescription: null`.

## 3. Diferencias renales y hepáticas de la ficha

- **Ozempic subcutáneo:** sin ajuste de dosis por insuficiencia renal leve, moderada o grave; experiencia limitada en enfermedad renal terminal. En insuficiencia hepática grave también hay limitación de experiencia.
- **Wegovy inyectable:** no requiere ajuste renal leve/moderado, pero **no se recomienda con TFGe <30 mL/min/1,73 m²**, incluida enfermedad renal terminal. No recomendado en insuficiencia hepática grave.
- **Mounjaro:** la ficha no exige ajuste de dosis por insuficiencia renal, incluida fase terminal, pero advierte experiencia limitada en insuficiencia renal grave o terminal. En insuficiencia hepática grave tampoco exige ajuste farmacocinético, con experiencia limitada.

**Conclusión funcional:** no utilizar una única regla renal para «arGLP-1». La app bloquea como revisión de inicio el uso no recomendado de Wegovy inyectable con TFGe <30, pero **no aplica ese umbral** automáticamente a Ozempic o Mounjaro. La ausencia de TFGe en Wegovy impide dar por completados los datos imprescindibles.

## 4. Indicaciones de control del peso en adultos

Wegovy inyectable y Mounjaro:
- IMC ≥30 kg/m², o
- IMC ≥27 y <30 kg/m², con **al menos una comorbilidad asociada al peso**.

La ficha de **Ozempic no se utiliza como autorización de tratamiento del peso aislado sin DM2**. Si no consta IMC o no está documentada la comorbilidad necesaria para sobrepeso, la evaluación se mantiene incompleta. El IMC actual para valoración del inicio **no debe confundirse con el IMC previo al tratamiento** exigido para considerar mantenimiento de Wegovy a 7,2 mg.

El motor multiorgánico incorpora `WEIGHT-REVIEW` para adultos **sin DM2** cuando los datos de peso aportados cumplen estos criterios de entrada. Es exclusivamente una **opción de revisión**, no una selección de molécula. Se evita sugerir un nuevo fármaco cuando existe otra terapia incretínica o el paciente está en fase aguda.

## 5. Seguridad y comprobaciones

**No inicio / alerta clínica prioritaria** según perfil:
- Hipersensibilidad documentada al producto: contraindicación de ficha, requiere comprobación explícita.
- Sospecha de pancreatitis: evaluación y revisión de suspensión; si se confirma pancreatitis, no reiniciar según ficha.
- Embarazo: no iniciar; semaglutida debe interrumpirse **al menos 2 meses** antes de concepción planificada, tirzepatida **al menos 1 mes**.
- Tratamiento incretínico ya registrado: reconciliar molécula y fecha de última administración antes de plantear un nuevo inicio; no asumir combinaciones o cambios automáticos.
- Proceso agudo grave o vómitos/diarrea con deshidratación: priorizar estabilidad y riesgo de daño renal antes de iniciar o escalar.

**Revisar de forma explícita**:
- Insulina o sulfonilureas: hipoglucemia; el módulo no modifica sus dosis.
- Antecedente de pancreatitis, gastroparesia grave u otra patología digestiva con tolerancia limitada.
- Retinopatía diabética con semaglutida, especialmente si se usa insulina.
- Pérdida visual súbita durante semaglutida: evaluación oftalmológica por riesgo de neuropatía óptica isquémica anterior no arterítica (NOIANA).
- Función renal y estado de hidratación tras pérdidas gastrointestinales.
- Comorbilidades y medicación concomitante antes de valorar indicación/seguimiento.

Estas alertas **no sustituyen una consulta clínica** ni representan una evaluación completa de interacciones, contraindicaciones o ajustes. Una casilla «no valorado» no significa ausencia de riesgo.

## 6. Financiación en España

**Autorización y financiación son decisiones distintas.** La aplicación no asume financiación a partir de la ficha CIMA. La situación se debe contrastar por **presentación y código nacional** en [BIFIMED (Ministerio de Sanidad)](https://www.sanidad.gob.es/profesionales/medicamentos.do) en la fecha de prescripción.

En el Nomenclátor de noviembre de 2026, las fichas consultadas muestran **no financiadas por resolución** determinadas presentaciones de [Wegovy 0,25 mg FlexTouch (CN 758085)](https://www.sanidad.gob.es/profesionales/medicamentos.do?cn=758085&metodo=verDetalle) y [Mounjaro 2,5 mg/dosis KwikPen (CN 764820)](https://www.sanidad.gob.es/ca/profesionales/medicamentos.do?cn=764820&metodo=verDetalle). **No extrapolar esa situación a todas las presentaciones o indicaciones ni a fechas futuras.**

## 7. Contrato técnico y pruebas

Tres entradas de producto dentro del catálogo farmacológico, aunque solo dos principios activos. Cada una contiene URL primaria propia, rutas de indicación y seguimiento informativo.

La función `reviewIncretinDrug` y el despachador `reviewDrug` devuelven únicamente:
- `bloqueo`: se ha observado un criterio que impide proponer inicio de esa vía, o una situación que exige atención clínica primero.
- `datos_insuficientes`: faltan variables críticas.
- `revision_pendiente`: no se ha detectado un bloqueo en los datos presentes, **pero no se ha aprobado tratamiento**.

La batería automatizada prueba las fronteras **IMC 27/30**, TFGe **29,9/30** en Wegovy, embarazo, terapia incretínica concomitante, síndrome gastrointestinal, DM1 frente a vía DM2, separación de formulaciones y no generación de dosis individual.

El registro de **actuaciones confirmadas y calendario** permanece restringido a finerenona y empagliflozina. No se habilita automáticamente para estas nuevas moléculas hasta crear sus propias reglas validadas de continuidad.

**Pendiente:** revisión clínica externa, actualización antes de publicación, controles de interacciones más completos, relación con prescripción oficial, financiabilidad y validación visual en móvil.
