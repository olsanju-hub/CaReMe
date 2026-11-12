# CaHReMe

**Evaluación cardiorrenal-hepatometabólica — prototipo con cálculos y revisión multiorgánica, sin prescripción.**

**Repositorio:** `olsanju-hub/CaReMe` · **Nombre de la aplicación:** CaHReMe

## Propósito
PWA independiente de apoyo a la decisión clínica en Atención Primaria en España. Evaluación integrada de los dominios **cardiovascular, renal, hepático y metabólico**, sin reducir la app a diabetes mellitus.

> Estado: **prototipo técnico en revisión**. Calcula categorías G/A y FIB-4 e identifica opciones multiorgánicas **para revisión profesional**, con comprobaciones pendientes. No prescribe, no suspende fármacos ni constituye validación para uso asistencial.

## Requisito funcional de referencia

CaHReMe cubre ya la **navegación y captura de datos** de seis consultas inspiradas en GlucoGuía y debe completar su **lógica clínica validada** (DM2, IC, ERC, sobrepeso/obesidad, enfermedad hepática metabólica e insulinización), **con consulta rápida, detalle y resultados equivalentes en funcionalidad**, ampliadas con evaluación integral, datos compartidos, recomendaciones clínicas trazables y seguimiento. **Los algoritmos específicos de decisión terapéutica y seguimiento siguen pendientes.** Véase [matriz de equivalencia y brechas](docs/MATRIZ_EQUIVALENCIA_GLUCOGUIA.md).

## Insuficiencia cardíaca · clasificación y orientación ESC 2026 (12/11/2026)

- **Nueva clasificación ESC 2026:** FEVI **<50 %** con clínica compatible = fenotipo IC-FEr; FEVI **≥50 %** precisa evidencia objetiva adicional para IC-FEp. La categoría independiente de FEVI 41–49 % corresponde a ESC 2021/2023 y ya no define una tercera vía en ESC 2026.
- `src/clinical/insuficiencia-cardiaca.mjs` añade salidas rápida y detallada: situación, seguridad, congestión, tratamiento farmacológico existente, opciones de clase para revisar y seguimiento.
- Para IC-FEr sintomática estable revisa ARNI/IECA (ARA-II si intolerancia), betabloqueante con evidencia, ARM e iSGLT2; para IC-FEp confirmada revisa iSGLT2 y ARM. Diurético de asa solo se revisa ante congestión y se distingue el ya utilizado.
- Sin diagnóstico, evidencia de IC-FEp, estabilidad, valoración de alarmas, TFGe, potasio, PA o conciliación no se muestran inicios. Con alarma se prioriza evaluación aguda.
- La indicación CIMA de finerenona en IC con **FEVI ≥40 %** **no cambia** la frontera fenotípica ESC 2026.
- Pruebas: `tests/insuficiencia-cardiaca.test.mjs`, `tests/insuficiencia-cardiaca-ui.test.mjs`. [Guías, reglas y auditoría](docs/IC_ESC_2026.md).
- Se conserva **sin prescripción**, y sin validación clínica o móvil real.

## Insulinización DM2 · tres circuitos preliminares (12/11/2026)

- `src/clinical/insulinizacion.mjs` genera orientación **diferenciada** de inicio, intensificación y desintensificación.
- Entrada rápida: fase y condicionantes. Detallada: esquema real, dosis basal declarada, glucemias de ayunas frente al objetivo, patrón posprandial, hipoglucemia, tratamiento conciliado, autocuidado y motivo de simplificación.
- Salida: situación y seguridad, siguientes pasos, opciones para revisión, comprobaciones, seguimiento y guías **ADA/EASD 2026**, ADA 2026, redGDPS insulinización 2022 y CIMA de producto.
- Distingue HbA1c en objetivo frente a falta de control, ayunas altas frente a hiperglucemia posprandial, y **no incrementa basal** con ayunas bajas o hipoglucemias nocturnas.
- En fragilidad, riesgo de hipoglucemia y carga terapéutica, orienta a revisar simplificación sin ejecutar ningún descenso de dosis.
- Se conserva como referencia documental el rango ADA basal de 0,1–0,2 U/kg/día, **sin calcular una pauta para el paciente, ni registrarla como iniciada**.
- [Fuentes, condiciones y riesgos de insulinización](docs/INSULINIZACION_ADA_EASD_2026.md) y pruebas `tests/insulinizacion.test.mjs`, `tests/insulinizacion-ui.test.mjs`.

## DM2 detallada · objetivo individual, conciliación y seguridad (12/11/2026)

- `src/clinical/dm2-detallada.mjs` calcula la diferencia entre la HbA1c aportada y **un límite numérico individual confirmado por el médico**; 8,5 % no se utiliza como objetivo universal.
- La captura incluye fiabilidad/fecha de HbA1c, glucemia actual, hipoglucemias, adherencia, dosis realmente verificadas, edad y contexto de embarazo.
- La conducta estructura situación, siguientes pasos, clases ya utilizadas, alternativas para revisar, alertas, seguimiento y fuentes redGDPS/ADA/CIMA. **No crea dosis ni recetas**.
- Se retienen propuestas por HbA1c no interpretable, datos contradictorios, hipoglucemias graves, glucemia ≥300 mg/dL, embarazo, LRA o duplicidades no conciliadas. Seguridad transversal compartida con los módulos rápido e integral.
- `tests/dm2-detallada.test.mjs`, `tests/dm2-detallada-ui.test.mjs`, `tests/dm2-transversal.test.mjs` prueban metas, límites, medicación, seguridad y navegación.
- [Contrato clínico y limitaciones](docs/DM2_DETALLADA_ADA_REDGDPS_2026.md).
- **Cobertura DM2:** ambas rutas tienen salida técnica preliminar; la paridad clínica completa y la revisión independiente siguen pendientes.

## Corrección de unidad renal y primera orientación rápida DM2 (12/11/2026)

- **CAC con unidad confirmada obligatoria:** `evaluateRenal()` exige `mg/g`, no convierte silenciosamente `mg/mmol`, y el motor de integración evita utilizar CAC no validado. Si se introduce un CAC sin unidad, las opciones terapéuticas relacionadas se retienen mediante auditoría.
- **KDIGO, tabla 3 (S137):** A2 **30–300 mg/g**, A3 **>300 mg/g**. Se conserva el límite exacto de la guía: **300 permanece en A2**; las pruebas cubren 299,99/300/300,01.
- **DM2 rápida:** `src/clinical/dm2-rapida.mjs` produce situación clínica, próximos pasos, opciones por clase, alertas, datos a comprobar, reevaluación y fuentes redGDPS/ADA 2026. Se accede mediante «Ver orientación clínica rápida» o el resumen del módulo.
- La consulta rápida distingue HbA1c **8,5 % como nivel de intensidad** del **objetivo individual**; síntomas, sospecha de CAD e hiperglucemia muy elevada se evalúan antes que un tratamiento crónico. No inventa medicamentos ausentes ni confirma acciones.
- La **revisión detallada DM2 ya dispone de una primera implementación**, pero el motor rápido no convierte ninguna opción en prescripción ni valida uso asistencial.
- [Documentación clínica, alcance y escenarios](docs/DM2_RAPIDA_REDGDPS_2026.md). Tests `tests/dm2-rapida.test.mjs`, `tests/dm2-rapida-ui.test.mjs`, `tests/cac-unidad.test.mjs`.

## Auditoría funcional contra GlucoGuía 1.6 · 12/11/2026

Se verificó directamente el código de la aplicación pública de referencia y el estado real de esta rama. Resultado: **seis consultas con captura rápida/detallada**, pero **ninguna de las seis tiene todavía paridad completa de salida clínica**; G/A y FIB-4, las fichas farmacológicas y el motor multiorgánico son capacidades parciales o adicionales, no sustitutos de una conducta por módulo.

**Bloqueos detectados:** una cifra de CAC puede clasificarse sin unidad explícita; el FIB-4 informado no alimenta la salida hepática cuando faltan AST/ALT/plaquetas; DM2 e insulinización necesitan un motor de conducta específico. La inspección se hizo por código, no por navegador real, y no acredita equivalencia clínica.

- [Informe verificado y prioridades P0–P2](docs/AUDITORIA_PARIDAD_FUNCIONAL_2026-11-12.md).
- [Inventario de cobertura comprobable](docs/COBERTURA_FUNCIONAL_GLUCOGUIA.json).
- [Matriz de requisitos original (versión histórica)](docs/MATRIZ_EQUIVALENCIA_GLUCOGUIA.md).

**Siguiente incremento propuesto:** cerrar la unidad obligatoria de CAC y desarrollar un flujo clínico de consulta rápida para DM2, con reglas clínicas versionadas y pruebas. **No fusionar ni desplegar para uso asistencial.**

## Metformina y dapagliflozina · seguridad renal y condiciones de uso

- Fichas CIMA independientes en `src/clinical/basales.mjs`: **metformina de liberación inmediata** (DM2) y **dapagliflozina / Forxiga** (DM2, IC crónica sintomática, ERC).
- Metformina: **máximo diario de ficha según TFGe** (≥60: 3.000 mg, 45–<60: 2.000 mg, 30–<45: 1.000 mg; <30 contraindicada), sin calcular una dosis individual.
- Metformina: revisiones ante acidosis, hipoxia, enfermedad aguda, insuficiencia hepática, contraste yodado y cirugía con anestesia.
- Dapagliflozina: **10 mg/día** en las tres vías adultas, inicio no recomendado con TFGe <25; advertencia de que la TFGe <45 reduce efecto hipoglucemiante en DM2. La ficha indica **inicio 5 mg en hepatopatía grave**, bajo revisión.
- Las tarjetas de iSGLT2 abren **Jardiance y Forxiga por separado**, con aviso de que un corte de clase KDIGO no sustituye el umbral CIMA individual.
- Pruebas de umbrales, situaciones agudas y navegación: `tests/basales.test.mjs`, `tests/basales-ui.test.mjs`.
- [Matriz de metformina y dapagliflozina en CIMA](docs/METFORMINA_DAPAGLIFLOZINA_CIMA.md).
- Sin nuevas reglas de calendario automático para estos productos, sin prescripción ni ajustes ejecutados.

## Incretinas · revisión CIMA por producto e indicación

- Se incorporaron **Ozempic subcutáneo (semaglutida · DM2)**, **Wegovy subcutáneo (semaglutida · control del peso)** y **Mounjaro (tirzepatida · DM2 o control del peso)** como tres fichas independientes.
- Las pautas documentales contemplan los cambios de ficha de 2026: **Wegovy subcutáneo 7,2 mg/semana solo en circunstancias definidas**, mientras Wegovy **oral** queda expresamente fuera de este módulo.
- Los formularios distinguen indicación, IMC, comorbilidad asociada al peso, función renal, embarazo y alertas de pancreatitis, intolerancia gastrointestinal o retinopatía. No generan dosis ni recetas.
- Para **obesidad sin DM2**, la integración puede mostrar una **opción de revisión farmacológica** basada en IMC; no la convierte en indicación hepática dirigida ni atribuye elegibilidad o financiación.
- Contrastes de seguridad por formulación y pruebas de frontera: `src/clinical/incretinas.mjs`, `tests/incretinas.test.mjs`.
- [Documentación clínica de incretinas](docs/INCRETINAS_CIMA.md). Financiación por presentación y fecha debe comprobarse en BIFIMED.
- **No habilitar continuidad/seguimiento ni prescripción de incretinas** hasta disponer de reglas específicas verificadas y revisión profesional.

## Bloque de continuidad y seguimiento condicionado a actuaciones confirmadas

- `src/clinical/continuidad.mjs`: referencias de **continuidad y titulación** para finerenona por indicación ERC-DM2 (CIMA tabla 2) e IC FEVI ≥40 % (tabla 4), con límites de K y evolución de TFGe. No prescribe ni ajusta.
- Empagliflozina: seguridad en enfermedad aguda/cetoacidosis, condiciones de reevaluación del reinicio y opción documental DM2 de 25 mg cuando corresponde.
- Ficha de cada molécula incorpora formulario de **tratamiento actual, dosis real y resultados clínicos**, así como resultado de continuidad que no modifica pautas.
- El médico puede registrar **inicio, reinicio, ajuste o interrupción realmente efectuados**, con confirmación explícita, fecha y dosis efectiva. Las actuaciones se conservan **solo en memoria**.
- El calendario muestra control de K/TFGe **a las 4 semanas de acciones confirmadas de finerenona** y revisión de función renal **al menos anual** tras inicio/reinicio confirmado de empagliflozina; la periodicidad puede cambiar por riesgo clínico.
- Las fechas previas se marcan sustituidas cuando otro ajuste/interrupción confirmados cambia la situación; el historial no se borra.
- Referencia y tests: [Continuidad y seguimiento](docs/CONTINUIDAD_Y_SEGUIMIENTO.md), `tests/continuidad.test.mjs`.
- **No existe envío de recordatorios**, integración con agenda, prescripción ni aprobación de uso asistencial.

## Primer bloque de verificación farmacológica (CIMA-AEMPS)

- Se ha añadido `src/clinical/farmacologia.mjs`, con fichas **por principio activo y por indicación**, basadas en CIMA-AEMPS, para **empagliflozina** y **finerenona**.
- Vías separadas: empagliflozina en DM2, IC y ERC; finerenona en **ERC con albuminuria asociada a DM2** y en **IC crónica sintomática con FEVI ≥40 %** (nueva vía diferenciada).
- Cada ficha muestra posología **de referencia de la FT**, monitorización, contraindicaciones y verificaciones pendientes del caso. **No calcula dosis para el paciente, no prescribe y no considera ningún caso «apto» automáticamente**.
- Los bloqueos incluyen TFGe insuficiente, potasio >5,0 para finerenona, diabetes tipo 1 o cetoacidosis para empagliflozina, interacción CYP3A4 potente, Addison y ARM concomitante cuando proceda.
- Acceso: **Herramientas → Farmacología**, y enlaces desde las tarjetas relevantes.
- Referencias y restricciones: [Farmacología CIMA](docs/FARMACOLOGIA_CIMA.md). Casos de prueba: `tests/farmacologia.test.mjs`.
- **Pendiente**: validación clínica profesional, ajustes de continuidad por vía, revisión de interacciones exhaustivas, otros medicamentos y posterior autorización asistencial.

## Segundo bloque del motor clínico — integración multiorgánica

- `src/clinical/integracion.mjs`: analiza diagnósticos declarados de DM2, IC, ERC, ECV y enfermedad hepática junto con TFGe, albuminuria, FIB-4 y clases farmacológicas.
- En resultados dirigidos e integrales ofrece **alertas de seguridad**, **opciones para revisión profesional** y **datos pendientes**. No hay dosis, recetas ni actuaciones automáticas.
- Cruza candidatos de beneficio cardiorrenal (iSGLT2), opciones incretínicas según comorbilidades y elegibilidad de ARM no esteroideos **solo como listas de comprobación**.
- Prioriza situaciones agudas, sospecha de cetoacidosis y combinaciones potencialmente problemáticas. No afirma que alergias o contraindicaciones estén descartadas.
- `tests/integracion.test.mjs`: escenarios con datos omitidos, TFGe <20, ERC no confirmada, terapia ya presente y duplicidades.
- [Matriz de integración terapéutica](docs/INTEGRACION_TERAPEUTICA.md). Fichas CIMA **por principio activo, dosis y restricciones individuales pendientes**. Sin habilitación asistencial.

## Primer bloque del motor clínico — cálculos descriptivos

- `src/clinical/engine.mjs`: categorías G1–G5 y A1–A3 desde TFGe/CAC, sin deducir el diagnóstico de ERC por una medición aislada.
- Cálculo FIB-4 desde edad, AST, ALT y plaquetas, con exclusión de interpretación en enfermedad aguda, contexto inadecuado y precaución en menores de 35 años; umbral ajustado en >65 años.
- Herramientas y resúmenes renal/hepático muestran resultados, limitaciones y vínculo a la fuente; faltantes no se transforman en cero.
- `tests/clinical.test.mjs`: umbrales exactos, casos de referencia y estados no evaluables.
- Documento [Fuentes y reglas clínicas](docs/FUENTES_CLINICAS.md).
- **Estas funciones no están aprobadas para uso asistencial.** Las decisiones prescriptivas siguen sin implementar.

## Estado de las seis consultas (iteración A.2)

- Se han implementado **seis pantallas dirigidas**, cada una con pestañas de **consulta rápida**, **revisión detallada** y **resumen de datos**.
- Los campos habituales —TFGe, HbA1c, medicación, etc.— comparten un único estado de evaluación mientras la app está abierta, sin duplicar valores al cambiar de módulo.
- Se admite selección simultánea de comorbilidades y clases farmacológicas. Los campos tienen estado registrado, ausente, no disponible o por revisar.
- Se conserva además el séptimo acceso a **evaluación integral** del paciente.
- Ya existen cálculos G/A y FIB-4, y un motor **no prescriptivo** de alertas y candidatos de revisión. La paridad terapéutica con GlucoGuía sigue pendiente de verificación científica. No utilizar para decisiones asistenciales.
- Pruebas automatizadas de rutas, captura y reutilización de datos; renderizado en dispositivos reales pendiente de revisión.

## Funcionalidades previstas
- Entrada por paciente; consulta rápida y evaluación avanzada, con tratamiento explícito de información ausente.
- Estadificación y cálculo por dominio usando herramientas validadas, con límites de aplicabilidad.
- Motor de decisión terapéutica integrada, con recomendaciones justificadas y seguridad farmacológica verificada en fuentes actuales y CIMA-AEMPS.
- Objetivos, controles, reevaluación, intensificación y criterios de derivación.
- Funcionamiento mobile-first y, cuando sea viable, local; sin datos identificativos de pacientes en la primera versión.

## Identidad y navegación aprobadas
- **Paleta Atlántico:** azul petróleo `#173347`, turquesa `#138B8B`, blanco frío `#F3F7F8`, verde agua `#DCEEEE`.
- **Fuente:** Inter.
- **Icono:** concepto A, tercera variante coloreada: cuatro lóbulos conectados; corazón arriba, riñones a la izquierda, hígado a la derecha y figura humana abajo. **Asset final pendiente de incorporar.**
- **Iconos internos:** ilustraciones anatómicas reconocibles, de estilo editorial, evitando imágenes artificiales recargadas.
- **Ventanas:** dashboard de inicio; evaluación guiada; paneles de información auxiliar; resultados clínicos completos.
- **Independencia:** no fusionar con NexoClx AP, Urg, 061 o Ped.

Documentación: [Documento rector v0.1](docs/DOCUMENTO_RECTOR.md) · [Alcance e iteraciones del MVP](docs/MVP.md) · [Flujo de consulta](docs/FLUJO_DE_CONSULTA.md) · [Decisiones del proyecto](docs/DECISIONES.md).

## Vista previa privada en GitHub Codespaces

[**Abrir o reanudar CaHReMe en Codespaces**](https://codespaces.new/olsanju-hub/CaReMe/tree/feat/prototipo-interfaz?quickstart=1)

1. Inicia sesión en GitHub y pulsa **Create codespace** la primera vez; para sesiones posteriores, **Resume this codespace**.
2. Al abrirse el editor web, la configuración inicia el servidor de prueba en el puerto **4173**.
3. Abre la notificación **Open in Browser** o la pestaña **Ports** y selecciona **CaHReMe — abrir interfaz**. Si no arranca, ejecuta `npm run dev` desde el terminal.
4. Usa datos sintéticos. Al recargar el formulario se pierden; no hay backend ni persistencia.

El Codespace y el puerto de vista previa son **privados** y requieren tu sesión de GitHub. Esta vista previa es una máquina de desarrollo; puede consumir la cuota de Codespaces. Deténla cuando termines de revisar. La URL de GitHub Pages aún no existe.

## Prototipo local (rama `feat/prototipo-interfaz`)

Requiere Node.js 20 o superior (sin dependencias npm externas):

```bash
npm run dev
```

Abrir `http://localhost:4173`. Para ejecutar pruebas y comprobar sintaxis:

```bash
npm run check
```

Incluye entrada integral o dirigida, captura por secciones, distinción entre campo registrado/no disponible/sin registrar/por revisar y resumen no interpretativo. Dispone de manifiesto PWA y caché **exclusivamente de los archivos estáticos** para pruebas de instalación y funcionamiento sin conexión una vez cargado. **No guarda datos** en el navegador ni los envía a servicios externos; al recargar se pierde el formulario. No introducir datos identificativos.

**Recursos provisionales:** se han añadido cuatro ilustraciones anatómicas SVG originales y un símbolo SVG de instalación como **alternativa temporal**. El icono A de la tercera variante aprobada (ilustración rica en color, corazón superior, riñones, hígado y silueta humana en cuatro lóbulos) **no ha sido sustituido ni incorporado como archivo definitivo**. Queda pendiente exportarlo, contrastar su legibilidad en tamaños pequeños, instalarlo como icono principal y confirmar diseño en pantalla real. El SVG incluido no es el diseño final. No se han activado algoritmos médicos.

## Plan por fases
1. Documento rector y matriz de evidencia actualizada.
2. Modelo de datos y recorrido de consulta.
3. Algoritmos y reglas clínicas trazables por fuente y versión.
4. Diseño final de interfaz e identidad gráfica.
5. Implementación modular y pruebas de software.
6. Validación clínica con casos de referencia y escenarios de seguridad.
7. Despliegue y mantenimiento científico.

## Estado de implementación

| Componente | Estado |
| --- | --- |
| Documentación inicial | Borrador v0.1 disponible para revisión |
| Evidencia y especificaciones clínicas | KDIGO/ADA/EASL/ESC + CIMA empagliflozina y finerenona por indicación; validación clínica pendiente |
| Motor de evaluación y recomendaciones | G/A, FIB-4, integración, fichas CIMA y continuidad no prescriptiva; evaluación médica y prescripción pendientes |
| Interfaz y PWA | Prototipo en rama de revisión; manifiesto PWA y caché estática implementados; validación visual e instalación pendientes |
| Icono final exportado | Pendiente |
| Pruebas y validación clínica | Pendiente |
| Despliegue | Pendiente |

## Criterios de calidad
No inventar umbrales ni dosis. Verificar versiones de las guías, contraindicaciones y fichas CIMA-AEMPS. Separar lo recomendado de lo efectivamente ejecutado. Mantener registro de fuentes y pruebas. No copiar código o recursos protegidos de otras aplicaciones sin licencia. No incorporar datos personales reales a repositorio ni pruebas.

**Marca:** El nombre de producto aprobado es CaHReMe. Su disponibilidad jurídica y posibles colisiones deben comprobarse antes de utilizarlo como marca comercial.

## Tres bloques auditados — seguridad, datos y seguimiento (12/11/2026)

- **Bloque 1:** auditoría transversal `src/clinical/auditoria.mjs`, detección de incoherencias clínicas y retención de candidatos farmacológicos hasta conciliar datos. **116 pruebas superadas**.
- **Bloque 2:** procedencia de analíticas `src/clinical/proveniencia.mjs`, fechas ISO, CAC únicamente en mg/g para la clasificación A y exclusión de FIB-4 construido con determinaciones de fechas incompatibles. **126 pruebas superadas**.
- **Bloque 3:** plan operativo **de verificación, no prescripción** `src/clinical/plan.mjs` y auditoría de continuidad/seguimiento. Los controles solo se vinculan a actuaciones realmente confirmadas. **139 pruebas superadas**.
- Documentación de riesgos encontrados, reglas, comprobaciones posteriores y pendientes: [Auditorías de tres bloques](docs/AUDITORIAS_3_BLOQUES.md).
- Las pruebas no validan por sí solas uso clínico ni sustituyen revisión de fichas CIMA, casos externos o evaluación de la interfaz en dispositivo real. El PR continúa **en borrador**, sin fusión ni despliegue.


## Insuficiencia cardíaca: auditoría ESC 2026 y controles de seguridad (12/11/2026)

- Módulo dirigido con FEVI **<50% / ≥50%** según ESC 2026, revisión de congestión y propuestas de clases terapéuticas **no prescriptivas** en IC conocida y estable.
- La consulta detallada exige fechas documentadas de FEVI, TFGe, potasio y evaluación antes de ofrecer candidatos; sin fechas no se presupone vigencia.
- Se coordinan alarmas y bloqueos transversales de **K >5,5 mmol/L**, duplicidad declarada de IECA/ARA-II/ARNI, signos de descompensación y discordancias de FEVI.
- La congestión lleva a revisión de diurético de asa y volemia, nunca titulación automática. FEVI ≥50 % necesita evidencia objetiva para considerar IC-FEp.
- Fuentes ESC 2026 y fichas CIMA por producto. [Contrato, evidencia y riesgos residuales](docs/INSUFICIENCIA_CARDIACA_ESC_2026.md).
- Pruebas: `tests/insuficiencia-cardiaca.test.mjs`, `tests/insuficiencia-cardiaca-seguridad.test.mjs`, `tests/insuficiencia-cardiaca-ui.test.mjs`. Pendientes validación clínica independiente y QA móvil.

## Refinamiento de IC: ARM por indicación y ficha específica (12/11/2026)

Se reauditaron los límites de ARM conforme a ESC 2026 y CIMA de finerenona. El circuito IC distingue una **revisión genérica** de ARM (TFGe ≥30 y K <5) de la **revisión específica de finerenona** en IC sintomática con FEVI ≥40, TFGe ≥25 y K ≤5, siempre con contraindicaciones registradas y sin duplicidad de ARM. En TFGe 25–29 o con K exactamente 5,0 solo puede aparecer la vía específica cuando conste seguridad suficiente. Se incluye enlace desde la tarjeta a la ficha CIMA por indicación y no se calculan dosis.

[Auditoría de ESC 2026 y CIMA](docs/IC_ESC_2026.md) · pruebas `tests/ic-finerenona-esc2026.test.mjs`. Sigue pendiente la revisión clínica y farmacológica independiente.


## Consulta renal dirigida y auditoría de continuidad · 12/11/2026

- Baseline reproducida desde `cdfbc4f`: 288/288 pruebas; comprobación de sintaxis superada.
- `src/clinical/renal.mjs`: rápida, detallada y resumen renal con seguridad, cronicidad, seguimiento condicionado y criterios parciales de Nefrología.
- KDIGO 2024: PP 2.1.1–5, PP 2.2.1, figura 48 y tabla 28. No se incorpora el borrador KDIGO 2027.
- Captura de ámbito renal, hematuria y repetición del CAC actual; no se infiere esta última de la cronicidad global.
- Potasio ≥6 retiene candidatos multiorgánicos aunque no conste IC. K ≥6,5 exige valoración inmediata; K 6,0–6,4 distingue situación aguda de resultado inesperado en paciente clínicamente bien.
- Seguimiento anual mínimo solo ante ERC con datos completos y estabilidad documentada. Sin calendario automático ni cambios terapéuticos.
- **319/319 pruebas locales y sintaxis superadas**. Pruebas de interfaz con DOM simulado: no equivalen a revisión visual ni prueba iPhone.
- [Informe de continuidad y límites](docs/ERC_KDIGO_2024.md). Paridad clínica todavía parcial; PR en borrador, sin fusionar.

## Revisión renal de IECA/ARA-II actual · 12/11/2026

- Inicio/aumento realmente administrado, confirmado y fechado, separado de propuestas.
- Ventana orientativa PA/creatinina/K de 2–4 semanas desde el cambio efectivo, con detección de controles pendientes y plazo superado; sin cita ni orden automática.
- Variación de creatinina con referencia previa fechada: >30 % genera revisión, nunca suspensión o ajuste automático. Se diferencia la medición dentro/fuera de cuatro semanas.
- Barreras de ámbito, doble bloqueo, hipotensión sintomática, LRA, potasio y cronología. Alertas visibles en el resultado renal general.
- **361/361 pruebas locales y sintaxis superadas**. UI comprobada con DOM simulado; QA real móvil pendiente.
- [Reglas y auditoría](docs/ERC_KDIGO_2024.md). Sin selección por producto ni prescripción; PR continúa en borrador.


## Alcance original y riesgo cardiovascular · 12/11/2026

- Matriz auditable de las ocho áreas originales y requisitos transversales: [ALCANCE_ORIGINAL.json](docs/ALCANCE_ORIGINAL.json). La paridad con GlucoGuía no reemplaza este alcance.
- Primer SCORE2 40–69 años, región baja España, con controles de elegibilidad, datos compartidos y cálculo original desde parámetros publicados. Reproduce el ejemplo externo publicado: 5,9 % hombre / 4,2 % mujer.
- Acceso desde inicio, herramientas y resumen; circuito explícito cuando corresponde revisar diabetes, ERC, enfermedad establecida u otra exclusión. No se extrapola a SCORE2-OP o Diabetes.
- **421 pruebas locales superadas y sintaxis correcta**. QA visual real y revisión clínica independiente pendientes. Sin prescripción ni estadio CKM automático.
- [Fuentes y auditoría](docs/RIESGO_CV_SCORE2.md). PR en borrador; no fusionar como producto clínicamente validado.
