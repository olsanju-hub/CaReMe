# MVP · CaHReMe

**Versión:** 0.1 — propuesta de producto para revisión  
**Fecha:** 2026-11-11  
**Dependencia:** [Documento rector](DOCUMENTO_RECTOR.md)

## Requisito de equivalencia funcional (2026-11-11)

**Es imprescindible reproducir mediante implementación original la cobertura clínica funcional de las seis consultas de GlucoGuía**: DM2, IC, ERC, sobrepeso/obesidad, enfermedad hepática metabólica e insulinización, con consulta rápida, revisión detallada cuando exista, resultados y acceso a fuentes. **La evaluación integral es un séptimo acceso adicional, no reemplaza las seis consultas.**

Las variables y resultados de cada consulta se detallan en la [matriz de equivalencia GlucoGuía → CaHReMe](MATRIZ_EQUIVALENCIA_GLUCOGUIA.md). La interfaz actual es solo un prototipo de captura y **todavía no cumple esa paridad**. No activar recomendaciones sin verificar evidencia vigente y casos clínicos.

## Resultado buscado
Una evaluación integral de un adulto en consulta de AP, sin identificarlo, que muestre resultados por dominio y una síntesis de próximos pasos sin inventar una puntuación multiorgánica.

El MVP se desarrollará progresivamente. **La interfaz podrá demostrarse con datos sintéticos antes de que existan algoritmos clínicos habilitados.**

## Estado de implementación (iteración A.2)

En la rama `feat/prototipo-interfaz` ya se muestran las seis consultas con **captura rápida y detallada**, más la entrada integral. La ficha compartida evita duplicar variables comunes y admite selección de comorbilidades y clases farmacológicas. El resumen por consulta **no interpreta ni prescribe**. Pendiente: revisión visual móvil, icono final e implementación de reglas verificadas.

## Iteración A — prototipo navegable (sin recomendaciones clínicas)

| Código | Función | Condición de aceptación |
| --- | --- | --- |
| UI-01 | Inicio con acceso «Nueva evaluación», «Herramientas» y «Fuentes» | Móvil y escritorio; sin navegación rota |
| UI-02 | Formulario por etapas: contexto, cardiovascular, renal, hepático, metabólico, tratamientos | Se puede avanzar, retroceder y corregir sin perder lo escrito |
| UI-03 | Resumen de datos introducidos | Diferenciar dato registrado, dato no disponible y dato pendiente |
| UI-04 | Resultado demostrativo con datos sintéticos claramente etiquetados | Ninguna indicación terapéutica real |
| UI-05 | Información de privacidad y estado de validación | Visible desde inicio y resultados |
| UI-06 | Identidad Atlántico | Paleta, tipografía, estados de foco y contraste comprobables |

## Estado parcial del bloque B (2026-11-11)

Se han incorporado **categorías G/A (KDIGO 2024)** y **FIB-4 calculado (EASL-EASD-EASO 2024)** en `src/clinical/engine.mjs`, con controles de información ausente, situación aguda y límites por edad. Fuente, límites y pruebas: [registro clínico](FUENTES_CLINICAS.md).

**No equivale a cierre de los módulos renal y hepático:** pendientes son cronicidad/documentación de causa, escalado/seguimiento, indicaciones y contraindicaciones farmacológicas, revisión clínica formal y demás cálculos. Ninguna recomendación de tratamiento se publica por estos resultados.

## Prototipo de integración terapéutica para revisión (2026-11-11)

Se ha incorporado un motor determinista de **alertas de seguridad, candidatos farmacológicos y contexto pendiente**, sin elección de molécula ni dosis. Se basa en diagnósticos declarados, resultados G/A, FIB-4 y tratamiento actual. No se considera una recomendación asistencial operativa ni acredita paridad terapéutica con GlucoGuía.

Fuentes y casos de prueba: [Integración terapéutica](INTEGRACION_TERAPEUTICA.md). Pendiente revisión clínica profesional, adaptación individual CIMA-AEMPS y completar el motor de seguimiento.

## Iteración B — cálculo validado por dominios

| Código | Función | Condición de aceptación |
| --- | --- | --- |
| CL-01 | Evaluación de riesgo cardiovascular con herramienta apropiada | Identificar fórmula, población, exclusiones y fuente; «No evaluable» cuando proceda |
| CL-02 | Clasificación de función renal y albuminuria | No afirmar cronicidad sin evidencia temporal |
| CL-03 | Evaluación metabólica | Interpretación condicionada a la situación clínica y criterios actualizados |
| CL-04 | Estratificación hepática no invasiva cuando esté indicada | Entradas completas, fórmula validada y rutas según aplicabilidad |
| CL-05 | Síntesis transversal | No sumar escalas; prioridades justificadas y datos pendientes |
| CL-06 | Avisos de seguridad | Alertas solo desde reglas verificadas, sin falsos «descartes» |

Ninguno de estos cálculos se activará en producción antes de aprobar su especificación y su batería de pruebas.

## Estado parcial del bloque farmacológico (2026-11-11)

Se añadieron dos monografías CIMA-AEMPS: **empagliflozina** (DM2, IC y ERC) y **finerenona** (ERC-DM2 e IC con FEVI ≥40 %). La interfaz separa dosis **de referencia de ficha técnica** de criterios clínicos individuales. El estado nunca es «autorizado»: solo bloqueo, datos insuficientes o revisión profesional pendiente. El resultado no contiene pauta personalizada.

[Fuentes y especificación CIMA](FARMACOLOGIA_CIMA.md). Pendientes: medicamentos restantes, decisiones de monitorización/ajustes y validación clínica completa.

## Continuidad y seguimiento sin prescripción (bloque parcial B.4)

El motor `src/clinical/continuidad.mjs` revisa tratamientos **ya existentes**, con tablas CIMA de finerenona según indicación, condiciones de interrupción/reinicio de empagliflozina y registro en memoria de actuaciones **confirmadas**. Solo estas actuaciones generan fechas de control. No hay prescripción automática, recordatorios ni persistencia.

Fuente y límites: [Continuidad y seguimiento](CONTINUIDAD_Y_SEGUIMIENTO.md). Pendiente validación médica de casos y calendario, otros principios activos, interacciones completas y revisión de la interfaz en dispositivo real.

## Incretinas por formulación/indicación (bloque 2026-11-12)

Se añadieron Ozempic (semaglutida para DM2), Wegovy **inyectable** (semaglutida para control del peso) y Mounjaro (tirzepatida para DM2/peso). Sus referencias de dosis, limitaciones renales y riesgos relevantes proceden de fichas CIMA individualizadas. La semaglutida oral de Wegovy está fuera de este módulo.

La evaluación multiorgánica permite considerar el tratamiento del peso **sin DM2** cuando hay un perfil de IMC documentado, siempre como candidato de revisión. No se generan prescripciones, elegibilidad definitiva ni financiación automática.

[INCRETINAS_CIMA.md](INCRETINAS_CIMA.md) · código `src/clinical/incretinas.mjs`.

## Bloque farmacológico metformina y dapagliflozina (12/11/2026)

Se sumaron **metformina** (liberación inmediata, DM2) y **dapagliflozina/Forxiga** (DM2, insuficiencia cardíaca, ERC) como fichas independientes en CIMA. El límite máximo diario documental de metformina está estratificado por TFGe, sin equivaler a una pauta individual; dapagliflozina distingue su umbral de inicio CIMA de las recomendaciones de clase. Se añaden barreras por contraste, cirugía, acidosis y situaciones agudas. No se habilitan prescripciones ni historial/calendario de continuidad para estos dos productos.

[Metformina y dapagliflozina · CIMA](METFORMINA_DAPAGLIFLOZINA_CIMA.md).

## Iteración C — conducta y seguimiento

| Código | Función | Condición de aceptación |
| --- | --- | --- |
| TX-01 | Opciones terapéuticas por prioridad | Regla versionada, condiciones y alternativas documentadas |
| TX-02 | Seguridad farmacológica | Contraindicaciones, dosis y ajustes verificados por fármaco con CIMA-AEMPS |
| TX-03 | Seguimiento | Qué controlar, cuándo reevaluar y qué hallazgo motiva intensificación o derivación, sustentado |
| TX-04 | Estado de acciones | Separar «propuesto» y «confirmado por profesional» |
| TX-05 | Resumen exportable | Copiable/imprimible sin datos identificativos |

## Datos: grupos de captura

- **Esenciales según caso**: edad, condición clínica de base, antecedentes relevantes y variables específicas requeridas por la escala/regla escogida.
- **Frecuentes**: TA, peso, talla, HbA1c, perfil lipídico, TFGe/creatinina, albuminuria, AST, ALT, plaquetas, tratamientos y alergias.
- **Contextuales**: síntomas/signos de alarma, temporalidad de hallazgos, medicación concomitante, condiciones que excluyen una herramienta.

Los campos exactos, obligatoriedad y unidades se definirán **por algoritmo**. No bloquear toda la evaluación por faltar una prueba perteneciente a un dominio.

## Historias de usuario prioritarias

1. Como médico, quiero introducir resultados parciales y ver qué puedo evaluar sin inventar valores.
2. Como médico, quiero revisar el estado de los cuatro dominios desde una sola pantalla.
3. Como médico, quiero saber qué datos faltan y por qué importan.
4. Como médico, quiero consultar la fórmula y fecha de la fuente detrás de cada resultado.
5. Como médico, quiero que posibles conflictos entre recomendaciones se señalen antes de elegir tratamientos.
6. Como médico, quiero un plan de seguimiento revisable sin presuponer que ya he ejecutado ninguna actuación.

## Fuera de alcance hasta nueva decisión
Pacientes guardados por nombre, autenticación, integración con IB-Salut, historial clínico persistente, conexión automática a laboratorios, IA generativa de prescripción, algoritmos pediátricos y publicación abierta como producto clínicamente validado.

## Criterio de finalización del MVP
- No existe fórmula clínica activa sin especificación y revisión.
- Casos de prueba de cada algoritmo incluidos con valores frontera, entradas ausentes e incompatibles.
- Navegación y accesibilidad funcionales en móvil y escritorio.
- Identidad visual implementada y iconos optimizados.
- Referencias y estado de validación visibles.
- Ningún dato identificativo en el repositorio ni en telemetría.

## Estado posterior a tres auditorías (12/11/2026)

Se añadieron barreras transversales de seguridad, comprobación documental de fechas y unidades, y un plan de verificación clínica separado de cualquier acción efectuada. El motor de continuidad se retiene ante incoherencias de datos, sin ocultar alertas agudas. No existe un límite universal programado de caducidad de analíticas.

**139 pruebas automatizadas superadas** tras los tres bloques. Sigue pendiente la revisión clínica externa, la validación manual móvil, comprobación regulatoria y homologación del resto de algoritmos. Documento rector de este avance: [Auditorías de tres bloques](AUDITORIAS_3_BLOQUES.md).

## DM2 rápida y seguridad del CAC (12/11/2026)

Se implementó el primer resultado específico de **DM2 rápida** en `src/clinical/dm2-rapida.mjs`: situación, próximos pasos, clases de revisión, seguridad, datos faltantes, reevaluación y fuentes redGDPS/ADA 2026. Se utiliza la HbA1c 8,5% para clasificar intensidad inicial, no como objetivo terapéutico universal ni indicación automática de insulina. La revisión detallada de DM2 y la paridad clínica global de los seis módulos siguen pendientes.

Se confirmó visualmente **A2 30–300 mg/g y A3 >300 mg/g** en KDIGO 2024 (tabla 3, S137), conservando 300 en A2; y se impide calcular albuminuria categórica o utilizar CAC en decisiones si no se ha confirmado la unidad `mg/g`. Un resultado en mg/mmol requiere transformación revisada fuera del motor vigente.

[Especificación y fuentes del bloque](DM2_RAPIDA_REDGDPS_2026.md). Sin publicación ni validación asistencial.

## DM2 detallada: primera salida clínica para revisión (12/11/2026)

Se incorpora el motor `src/clinical/dm2-detallada.mjs` y su vista en la consulta dirigida. Interpreta el **objetivo numérico individual**, estado de HbA1c, conciliación, hipoglucemias y seguridad de las clases, manteniendo propuestas como candidatas de revisión. No calcula una pauta personalizada ni garantiza elegibilidad por producto.

Las alarmas declaradas de glucemia ≥300 mg/dL, hipoglucemias graves y embarazo retienen candidatos también en la evaluación global. No existe aprobación para uso asistencial, aunque las pruebas automatizadas pasen. [Fuentes y contrato](DM2_DETALLADA_ADA_REDGDPS_2026.md).

## Insulinización DM2 · inicio, intensificación y simplificación (12/11/2026)

Se incorporó `src/clinical/insulinizacion.mjs` y panel de revisión con tres recorridos. Las situaciones de ayunas controladas con hiperglucemia posprandial evitan una escalada automática de basal. Se priorizan los riesgos de hipoglucemia y se exige motivo/medicación real para orientar desintensificación.

Las referencias ADA/EASD 2026 y ADA 2026 prevalecen en el contrato clínico sobre la referencia redGDPS insulinización 2022 si son incompatibles. Los datos y resultados siguen en memoria, sin prescripción ni calendario de insulinización. [Documentación clínica](INSULINIZACION_ADA_EASD_2026.md).

## Insuficiencia cardíaca · revisión ESC 2026 (12/11/2026)

`src/clinical/insuficiencia-cardiaca.mjs` incorpora FEVI <50 % (IC-FEr) y ≥50 % (IC-FEp si evidencia objetiva), condiciones de congestión y seguridad, con reconciliación de tratamiento existente y opciones de clase para revisión. La categoría intermedia 41–49 % de guías antiguas ya no debe mostrarse como fenotipo independiente.

No asigna diagnóstico por FEVI aislada, no administra diuréticos y no calcula dosis. CIMA finerenona FEVI ≥40 % es una **indicación de producto**, distinta de la definición fenotípica ESC. [Documentación clínica y pruebas](IC_ESC_2026.md).


## IC dirigida · FEVI, congestión y seguridad con ESC 2026 (12/11/2026)

Se ha auditado y reforzado la primera orientación de `src/clinical/insuficiencia-cardiaca.mjs`. Se diferencia FEVI <50 % y ≥50 % con evidencia objetiva, congestión, estabilidad y terapia fundacional. Se requieren fechas de FEVI/TFGe/K antes de revisar opciones; un registro antiguo o sin fecha no se asume actual. Hiperpotasemia significativa y duplicidad RAAS se integran en las barreras comunes de todos los motores y fichas.

[Fuentes y especificación](INSUFICIENCIA_CARDIACA_ESC_2026.md). No hay prescripciones, ajustes de diuréticos o actuaciones ejecutadas por el prototipo.
