# Tres bloques auditados · CaHReMe

**Fecha de trabajo:** 12 de noviembre de 2026  
**Rama:** `feat/prototipo-interfaz` · **PR:** #4 (borrador, no fusionado)  
**Alcance:** prototipo clínico no prescriptivo para atención primaria de adultos en España.  
**Resultado:** tres incrementos integrados, con comprobaciones previas/posteriores y pruebas automatizadas. **No existe validación clínica formal ni autorización de uso asistencial.**

## Rastro lógico de auditoría

Inspección del código vigente → identificación de fallos de seguridad o calidad → implementación acotada → tests con casos normales, contradictorios y fronteras → GitHub Actions → revisión posterior de errores/regresiones.

El análisis está basado en las funciones reales de los módulos, no en un supuesto despliegue o una captura del dispositivo. Los tests de Node no equivalen a una auditoría manual de accesibilidad, navegador móvil ni casos clínicos externos.

## Bloque 1. Auditoría transversal de seguridad

**Auditoría previa:** las ramas farmacológicas podían emitir candidatos al trabajar aisladamente con datos incompatibles; no existía un control transversal común a las siete monografías ni al motor de integración.

**Implementación:**
- `src/clinical/auditoria.mjs` identifica declaraciones conflictivas: DM1/DM2 simultáneas, IC negada frente a IC sintomática declarada, estabilidad frente a enfermedad aguda y severidad hepática incompatible. Estos ejemplos son **motivos para conciliar**, no pruebas automáticas de error diagnóstico.
- Revisa tratamiento «ninguno» junto a medicaciones declaradas y coherencia de potasio con el estado «normal». La banda 3,5–5,0 mmol/L es una **heurística de consistencia de entrada**, no un umbral diagnóstico universal.
- Discrepancias renales entre antecedente de ERC y persistencia analítica se marcan para revisión, sin diagnosticar ERC por una medición aislada.
- El motor multiorgánico retiene opciones farmacológicas bajo incoherencias críticas, manteniendo las alertas visibles. Cada ficha CIMA pasa por la misma auditoría.
- Las reglas internas tienen identificadores estables `AUDIT-...` y `ON-HOLD-...`, y son distintas de las recomendaciones de sociedades científicas.

**Auditoría posterior:** 116 pruebas automáticas superadas, 0 fallos. Casos: conflictos diagnósticos, conciliación y bloqueo coherente entre moléculas. No se habilita prescripción.

**Referencia clínica de control:** [KDIGO 2024 CKD](https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf), puntos prácticos 1.1.3.1–1.1.3.3 sobre cronicidad y necesidad de comprobación de hallazgos.

## Bloque 2. Procedencia, unidades y fechas

**Auditoría previa:** la TFGe, el potasio, la albuminuria y los componentes de FIB-4 podían utilizarse sin comprobar la fecha; el motor renal asumía un CAC expresado en mg/g.

**Implementación:**
- `src/clinical/proveniencia.mjs` controla fechas reales de TFGe, potasio, CAC, AST, ALT y plaquetas, referidas a una fecha de evaluación opcional.
- Fechas posteriores a una fecha de evaluación declarada y fechas imposibles quedan señaladas como críticas. La falta de fecha **no se interpreta como actualidad**.
- Se distingue **CAC mg/g** de **mg/mmol**. El motor implementado no transforma automáticamente mg/mmol a mg/g y deja la clasificación A como no válida hasta contrastar una unidad apropiada.
- El FIB-4 no se genera cuando dos o más fechas conocidas de AST, ALT y plaquetas son incompatibles, aunque estén presentes los valores numéricos.
- Comprobación operativa de discordancia entre IMC introducido y peso/talla; diferencia >1 kg/m² activa aviso **no diagnóstico**.
- La interfaz integral y las consultas renal/hepática aceptan fechas ISO mediante control de calendario. No se ha introducido un plazo universal de caducidad analítica.

**Auditoría posterior:** 126 pruebas automáticas superadas, 0 fallos (antes del incremento del bloque 3). Incluye fechas imposibles, albuminuria de unidad equivocada, FIB-4 no comparable y cifras futuras respecto a la evaluación.

**Limitación consciente:** ausencia de fecha o de unidad confirmada no demuestra que una medición sea reciente o adecuada. La aplicabilidad temporal real depende del cuadro clínico.

## Bloque 3. Verificación clínica y seguimiento documental

**Auditoría previa:** faltaba una síntesis operativa de problemas detectados. El motor de continuidad no aplicaba todavía la auditoría transversal de fechas/unidades y podía ofrecer referencias de ajuste con datos incoherentes.

**Implementación:**
- `src/clinical/plan.mjs` genera un **plan de verificación**, no de tratamiento: información a corregir, comorbilidades a documentar, comprobaciones farmacológicas y controles derivados de actuaciones confirmadas.
- Panel visible en **Herramientas** y en el **Resumen integral**. Se muestran todas las comprobaciones pendientes, sin ocultarlas al superar un número arbitrario.
- `src/clinical/continuidad.mjs` aplica el control transversal a las tablas de finerenona y al seguimiento de empagliflozina. Si se detectan datos incompatibles retiene la referencia de titulación; **no silencia** alertas urgentes de hiperpotasemia o enfermedad aguda ya identificadas.
- Los controles de K/TFGe de finerenona y los controles de función renal de empagliflozina dependen de **acciones confirmadas como realmente realizadas**, con fecha efectiva y dosis real (cuando procede).
- Cuando otra actuación confirmada sustituye un control anterior, el calendario lo marca como **sustituido** y conserva la trazabilidad. Las fechas previstas no generan avisos externos.
- El plan distingue `candidato_para_revision` de `confirmedActions`: jamás interpreta un candidato farmacológico como prescripción ejecutada.

**Auditoría posterior:** **139 pruebas automáticas superadas, 0 fallos**. Último resultado comprobado en GitHub Actions tras corregir una regresión de sintaxis de la interfaz. Escenarios: enfermedad múltiple, datos contradictorios, fechas de laboratorio, unidad CAC, FIB-4 no comparable, actuaciones confirmadas/sustituidas, reinicio de sesión y ausencia de dosis prescrita.

## Control de alcance y criterios de aprobación pendientes

| Dimensión | Estado |
| --- | --- |
| Captura y navegación de seis consultas y evaluación integral | Implementada como prototipo |
| Auditoría transversal de coherencia | Implementada, con reglas deterministas |
| Fechas y unidad explícita de albuminuria | Implementadas; vigencia clínica siempre a verificar |
| FIB-4 y G/A | Cálculos descriptivos con reglas de no evaluabilidad |
| Siete fichas de productos CIMA | Referencias no prescriptivas; sin homologación farmacológica formal |
| Plan de verificación | Implementado; no constituye pauta de tratamiento |
| Registro de actuaciones realizadas | Solo si el profesional confirma explícitamente |
| Persistencia de datos clínicos | No implementada; datos solo en memoria de sesión |
| Prescripción, suspensión automática, dosis individual | No implementadas |
| Validación manual en navegador móvil / accesibilidad | Pendiente |
| Revisión clínica independiente / farmacológica final | Pendiente |
| Revisión regulatoria como software de apoyo clínico | Pendiente |
| Fusión en `main` y despliegue | No realizados |

**Riesgos residuales:** no se ha efectuado una reconciliación exhaustiva de moléculas desde texto libre; no se asume que el catálogo de siete productos cubra toda la farmacoterapia; el control de fechas no evalúa por sí solo la estabilidad de una función renal; los datos declarados dependen de verificación profesional y el motor no reproduce aún toda la funcionalidad terapéutica de GlucoGuía.

**Conclusión de auditoría técnica:** los tres incrementos están implementados y las pruebas automatizadas actuales pasan. **No concluye seguridad o eficacia clínica para asistir decisiones reales**. El PR debe permanecer en borrador hasta validación clínica, revisión visual y aceptación explícita.


## Revisión posterior · 13/11/2026

La auditoría transversal incorpora señales agudas independientes del módulo activado y concilia el calendario con el plan integral. Véase [hallazgos reproducidos, fuentes y límites](AUDITORIA_SEGURIDAD_2026-11-13.md). Los recuentos de secciones anteriores se conservan como históricos.
