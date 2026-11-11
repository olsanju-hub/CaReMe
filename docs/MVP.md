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
