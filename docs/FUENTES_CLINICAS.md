# Fuentes y reglas clínicas — CaHReMe

**Revisión documental:** 2026-11-11  
**Estado:** borrador técnico con fuentes primarias comprobadas. **Sin validación clínica asistencial formal.**  
**Alcance activado:** clasificación descriptiva G/A renal y cálculo/interpretación condicionada del índice FIB-4. No se incorporan dosis, prescripciones ni diagnóstico automático.

## 1. KDIGO-2024-CKD — TFGe y albuminuria

**Fuente primaria:** KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. *Kidney International* (2024), 105 (Suppl 4S), S117–S314. Tablas 1–3, página S137.  
PDF oficial: https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf

**Entradas usadas:** TFGe **informada por el laboratorio** (mL/min/1,73 m²); cociente albúmina/creatinina en orina **en mg/g**; persistencia documentada. La aplicación **no deriva la TFGe a partir de la creatinina** en esta versión.

| Identificador de regla | Condición | Salida |
| --- | --- | --- |
| REN-G-01 | TFGe ≥90 | G1 |
| REN-G-02 | 60 ≤TFGe <90 | G2 |
| REN-G-03 | 45 ≤TFGe <60 | G3a |
| REN-G-04 | 30 ≤TFGe <45 | G3b |
| REN-G-05 | 15 ≤TFGe <30 | G4 |
| REN-G-06 | TFGe <15, positiva | G5 |
| REN-A-01 | CAC <30 mg/g, no negativa | A1 |
| REN-A-02 | 30 ≤CAC ≤300 mg/g | A2 |
| REN-A-03 | CAC >300 mg/g | A3 |

**Restricciones:** G/A describen resultados, **no determinan por sí solas el diagnóstico** de enfermedad renal crónica. ERC exige ≥3 meses de persistencia de alteraciones renales estructurales o funcionales con repercusión en la salud. Una medición aislada no permite inferir cronicidad. La etiología forma parte de CGA y no se calcula en la app. G1–G2 no indican ERC sin otros marcadores; tampoco una G1/A1 descarta daño renal por otras causas.

**Comportamiento ante falta de datos:** se pueden obtener G y A de forma independiente. **A requiere unidad mg/g confirmada**; si está ausente, en mg/mmol o «No consta», no se categoriza y se exige conciliación antes de utilizar albuminuria para decisiones. La cifra faltante aparece como «—». TFGe 0/negativa, CAC negativa o entradas no numéricas son inválidas y no generan categoría. «No consta» o «No» en persistencia impiden informar ERC confirmada.

**Pendiente:** trayectoria temporal, confirmación de albuminuria, marcadores estructurales, ecuación de TFGe y valoración integrada de riesgo renal/derivación; no generar plan de actuación con G/A solas.

## 2. EASL-EASD-EASO-2024-MASLD — FIB-4

**Fuente primaria:** EASL–EASD–EASO Clinical Practice Guidelines on the management of metabolic dysfunction-associated steatotic liver disease (MASLD). *Journal of Hepatology* 2024. DOI: 10.1016/j.jhep.2024.04.031. Fórmula y algoritmo de evaluación no invasiva (figura 2).  
Texto abierto: https://pmc.ncbi.nlm.nih.gov/articles/PMC11299976/  
Registro PubMed: https://pubmed.ncbi.nlm.nih.gov/38851997/

**Fórmula implementada:**

```text
FIB-4 = (edad en años × AST en U/L) / (plaquetas en 10^9/L × raíz cuadrada de ALT en U/L)
```

Exige **edad adulta**, AST >0, ALT >0 y plaquetas >0. El valor calculado se muestra a dos decimales sin redondearlo previamente para la clasificación. El FIB-4 informado manualmente es un campo independiente; nunca se usa silenciosamente como sustituto de la fórmula calculada.

**Contexto obligatorio para interpretar:** el profesional declara un perfil compatible con evaluación de MASLD/riesgo de fibrosis y **ausencia de enfermedad aguda**. Sin estos dos datos, la aplicación solo muestra el índice calculado sin adjudicar nivel de probabilidad.

| Identificador de regla | Condición | Salida interpretativa |
| --- | --- | --- |
| HEP-FIB4-01 | Faltan datos o son inválidos | No calculable; indicar variables pendientes |
| HEP-FIB4-02 | Enfermedad aguda activa | Cifra disponible, sin interpretación |
| HEP-FIB4-03 | Perfil de cribado no establecido o no adecuado | Cifra disponible, sin interpretación |
| HEP-FIB4-04 | Edad 18–34 años | Cifra disponible, sin usarla para excluir fibrosis avanzada (rendimiento limitado) |
| HEP-FIB4-05 | Edad 35–65 y FIB-4 <1,3 | Por debajo del umbral de cribado |
| HEP-FIB4-06 | Edad >65 y FIB-4 <2,0 | Por debajo del umbral ajustado por edad |
| HEP-FIB4-07 | FIB-4 desde umbral inferior hasta ≤2,67 | Evaluación adicional según contexto y recursos |
| HEP-FIB4-08 | FIB-4 >2,67 | Probabilidad aumentada; valoración adicional de fibrosis necesaria |

Los límites corresponden al algoritmo EASL 2024; este módulo **no declara fibrosis, estadio histológico ni MASLD por sí mismo**. Por prudencia, la salida es descriptiva y no ordena automáticamente elastografía, derivación o tratamiento.

**Limitaciones y discrepancias:** el rendimiento es inferior en personas jóvenes y de edad avanzada, así como en algunos subgrupos con DM2; la decisión depende del escenario clínico. La guía EASL utiliza **>65 años** para aplicar el umbral inferior 2,0. En la implementación, **65 años exactos mantiene el umbral general 1,3**, con documentación explícita de esta frontera. Otras recomendaciones —como el consenso ADA sobre MASLD en personas con diabetes— simplifican el umbral a 1,3 y requieren análisis antes de fijar una regla asistencial única. La presencia de enfermedad aguda bloquea la interpretación según las precauciones de AASLD.

**Fuentes complementarias de control:**
- AASLD Practice Guidance on clinical assessment and management of NAFLD (2023; nomenclatura actualizada en 2024): https://pubmed.ncbi.nlm.nih.gov/38445559/
- ADA Consensus Report on MASLD in Diabetes (2025): https://doi.org/10.2337/dci24-0094

## 3. Estado de pruebas y aprobación

El código fuente se mantiene en `src/clinical/engine.mjs`. La batería `tests/clinical.test.mjs` cubre:
- Umbrales exactos renales (90, 60, 45, 30, 15; y 30/300 mg/g).
- Ausencia de cronicidad y G1/A1 sin datos de daño renal.
- FIB-4 calculado frente a ejemplo aritmético, valores faltantes, cero y entradas inválidas.
- Umbrales 1,3, 2,0 (edad >65) y 2,67, así como edades 30/64/65/66.
- Contexto agudo, perfil sin indicación documentada y valor de FIB-4 informado independientemente.

**Prueba automatizada superada ≠ revisión clínica.** Cada regla necesita revisión profesional, control de fuentes vigentes, casos externos de referencia, escenarios de seguridad y aceptación del propietario antes de etiquetarse como validada para uso asistencial.

## 4. Siguiente incremento

1. Consistencia entre variables de DM2, IC, ERC y hepatopatía (fechas, unidades, tratamiento actual).
2. Separación explícita de diagnóstico establecido, sospecha, hallazgo analítico y dato calculado.
3. Validación de cribado y derivación por dominio.
4. Reglas terapéuticas individualizadas y verificación de cada medicamento en CIMA-AEMPS.

**Prohibido en este estado:** extrapolar estas cifras a prescripciones, registrar actuaciones como realizadas o emitir un «bajo riesgo» global cardiometabólico sin una escala validada.

## Verificación de contexto y datos (12/11/2026)

KDIGO 2024 requiere acreditar cronicidad y evaluar TFGe y albuminuria en su contexto. El clasificador G/A de CaHReMe utiliza **CAC en mg/g** y evita clasificar cifras en mg/mmol sin una transformación explícita y revisada. La fecha de cada analítica puede registrarse; su ausencia no prueba actualidad. FIB-4 no combina automáticamente AST, ALT y plaquetas con fechas registradas incompatibles.

Las discrepancias y controles de procedencia son reglas técnicas internas, no recomendaciones farmacológicas independientes. [Informe de los tres bloques auditados](AUDITORIAS_3_BLOQUES.md).

## Revisión de frontera y unidades · 12/11/2026

Se verificó visualmente la tabla 3 KDIGO 2024, página S137: **A2 comprende 30–300 mg/g y A3 corresponde a >300 mg/g**. Por tanto, **300 mg/g debe quedar en A2**, tal como estaba en la versión original. Se corrigió únicamente la aceptación previa de CAC sin unidad explícita. La cifra sin unidad se considera no interpretable para estratificación o decisión farmacológica. [Contrato técnico y reglas DM2](DM2_RAPIDA_REDGDPS_2026.md). Este control no establece diagnóstico de ERC.

## Insulinización DM2 (12/11/2026)

La nueva ruta se fundamenta en consenso ADA/EASD 2026, ADA 2026 secciones 6, 9 y 13, redGDPS de insulinización 2022 como referencia contextual española y ficha CIMA individual de insulina glargina U100 como ejemplo de producto. Las pautas de referencia no se convierten en dosis individualizadas. [Especificación y enlaces oficiales](INSULINIZACION_ADA_EASD_2026.md).

## Insuficiencia cardíaca ESC 2026 (12/11/2026)

La guía ESC 2026 (publicada 28/08/2026) reemplaza la clasificación ESC 2021/2023 de FEVI ≤40/41–49/≥50 por dos fenotipos: <50 y ≥50 con evidencia de IC-FEp. La valoración dirigida incluye congestión, clase farmacológica, seguridad renal/potasio y signos de alarma, con referencias CIMA separadas de las indicaciones de guía. [Especificación con enlaces primarios](IC_ESC_2026.md).


## IC ESC 2026 · verificación del 12/11/2026

Se utiliza la [ESC 2026](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/heart-failure), publicada 28/08/2026, como guía principal en sustitución del esquema de tres grupos de FEVI de 2021/2023. IC-FEr: **FEVI <50 %**; IC-FEp: **FEVI ≥50 %** con evidencia clínica y cardíaca objetiva. En IC sintomática estable, la guía recomienda iSGLT2 y ARM por fenotipo/indicación; para IC-FEr estable también ARNI/IECA y betabloqueantes, con comprobación de seguridad. Los diuréticos de asa se individualizan por congestión. Los productos se verifican por separado en CIMA. [Contrato completo](INSUFICIENCIA_CARDIACA_ESC_2026.md).



## CKM 2026 · contrato y estado actual

Se incorpora la clasificación descriptiva CKM desde la tabla 4 AHA/ACC/ADA/ASN 2026, sin extrapolar sus umbrales a diagnóstico español de HTA o tratamientos. [Fuentes, discrepancias y auditoría](CKM_2026.md). Se conserva explícitamente la discrepancia de frontera renal y se distingue SCORE2 de PREVENT-CVD. El módulo no calcula PREVENT ni asigna estadio 0 desde datos ausentes. Pendiente revisión clínica independiente.


## PA e HTA: ESC 2024

Se verifica la guía oficial ESC 2024 para el primer circuito dirigido. [Reglas, fuente primaria, barreras operativas y auditoría](HTA_ESC_2024.md). No se confunde el umbral CKM 130/80 con diagnóstico de HTA ni se convierten referencias de clases en pautas individuales. CIMA por producto/dosis y validación clínica independiente siguen pendientes.


## Dislipemia: revisión 12/11/2026

Se incorporan ESC/EAS 2025 (tabla 3, umbrales y modificadores), secciones conservadas ESC/EAS 2019 y CIMA 69534/80213/77541. Las categorías lipídicas 2025 no son los cortes por edad de prevención 2021. Unidades de Lp(a) y CrCl tienen tratamiento separado, sin conversiones implícitas. [Matriz de reglas, fuentes primarias y límites](DISLIPEMIA_ESC_EAS_2025.md). Titulación individual, cobertura farmacológica exhaustiva y validación clínica permanecen pendientes.


## MASLD: evaluación secuencial revisada el 12/11/2026

EASL-EASD-EASO 2024, figura 2 (J Hepatol p.501) y tabla 6 verificadas en el PDF primario oficial. Se mantiene el umbral ajustado en >65 años; no se mezclan los cortes de otras guías ni métodos de elastografía. [Reglas, fuentes y salvaguardas](MASLD_EASL_2024.md). La nueva implementación no diagnostica MASH ni selecciona un fármaco específico.


## Obesidad · revisión12/11/2026

Se verifican GIRO2.0 (abril2025), EASO2024, criterios ASMBS/IFSO2022 y CIMA vigente de Wegovy subcutáneo/Mounjaro. Los marcos clínicos no se intercambian con indicación o acceso quirúrgico local. El algoritmo redGDPS2025 aporta únicamente el intervalo de reevaluación; no se copian sus dosis/financiación. La guía redGDPS2026 se localizó anunciada, sin PDF íntegro verificado: no se le atribuyen reglas nuevas. [Fuentes primarias, reglas y límites](OBESIDAD_GIRO_CIMA.md).


## Trazabilidad del plan integral · 12/11/2026

La síntesis reutiliza objetivos y controles de los motores existentes con sus fuentes primarias. No introduce umbrales, plazos o recomendaciones clínicas nuevos ni acredita revalidación independiente del conjunto. [Contrato de composición y auditoría](PLAN_INTEGRAL.md). Las referencias de origen permanecen separadas; riesgo/CKM no se convierten en objetivos terapéuticos.

## Comprobación selectiva de coherencia · 13/11/2026

ESC2026, sección5.2.2: antes de clasificar IC-FEp con FEVI≥50 debe comprobarse que no existió FEVI<50. Se añade historial explícito y se retienen nuevas opciones si falta esa revisión. Fuente primaria: https://academic.oup.com/eurheartj/article/47/38/5346/8766302 . Esta comprobación no representa revalidación exhaustiva de todas las referencias ni validación clínica independiente. Véase AUDITORIA_GLOBAL_2026-11-13.md.

## Contraste selectivo de seguridad aguda · 13/11/2026

Consultadas CIMA Jardiance 114930014 §4.4, Metformina Tarbis 76579 §§4.3–4.4 y Wegovy subcutáneo 1211608006 §4.4. La barrera de decisiones crónicas se conserva ante señales agudas aunque falte diagnóstico o dato de estabilidad. Fuente, límites y distinción entre sospecha/antecedente en [auditoría de seguridad](AUDITORIA_SEGURIDAD_2026-11-13.md). No equivale a revisión farmacológica exhaustiva ni validación clínica independiente.
