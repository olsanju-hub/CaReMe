# Continuidad, titulación y seguimiento · CaHReMe

**Versión:** prototipo no prescriptivo B.3 · **revisión de fuentes:** 12 de noviembre de 2026  
**Implementación:** `src/clinical/continuidad.mjs` · **pruebas:** `tests/continuidad.test.mjs`  
**Estado:** lógica reproducible con referencias de ficha técnica; sin validación asistencial externa. No utilizar para tratar pacientes.

## 1. Fundamento y distinción entre referencias y actuaciones

CaHReMe distingue tres objetos:
1. **Resultado de la ficha técnica:** lo que establece una tabla de CIMA, siempre subordinado a la indicación y dosis actual.
2. **Revisión clínica pendiente:** datos incompletos, contraindicaciones e información necesaria antes de modificar una pauta.
3. **Actuación confirmada:** registro introducido por el profesional de algo **ya realizado**; únicamente entonces se calculan fechas de control.

No hay prescripción, envío de datos, almacenamiento local ni ejecución automática de ajustes. Las fechas y dosis de las actuaciones confirmadas permanecen solo en la memoria de la página, como el resto de la evaluación, y desaparecen al recargarla o borrar la evaluación.

## 2. Fuentes CIMA-AEMPS verificadas

- [Kerendia (finerenona), ficha técnica](https://cima.aemps.es/cima/dochtml/ft/1211616002/FT_1211616002.html), apartado **4.2, tablas 2 y 4**, además de 4.4.
- [Jardiance (empagliflozina), ficha técnica](https://cima.aemps.es/cima/dochtml/ft/114930014), apartados **4.2 y 4.4**.

La dosis actual, TFGe y potasio se declaran en el formulario. Para IC se incorpora **TFGe al inicio de finerenona**, imprescindible para el objetivo de dosis, y TFGe de medición anterior para controlar descensos porcentuales. No inferir dosis actual de una prescripción previa ni interpretar un dato ausente como normal.

## 3. Finerenona — ERC asociada a DM2 (tabla 2)

La ficha renal utiliza dosis de **10 o 20 mg/día**. No aplicar las dosis de 40 mg de IC.

| Potasio sérico, mmol/L | Con 10 mg/día | Con 20 mg/día |
| --- | --- | --- |
| ≤4,8 | La ficha contempla aumento a 20 mg, salvo descenso de TFGe >30 % frente a previa (mantener 10 mg) | Mantener 20 mg |
| >4,8 a 5,5 | Mantener 10 mg | Mantener 20 mg |
| >5,5 | Interrumpir; reinicio con 10 mg cuando K ≤5,0, individualizando situación | Interrumpir; reinicio con 10 mg cuando K ≤5,0 |

**Restricciones implementadas:** no emitir propuesta de subida si falta TFGe previa, salida no evaluable si la dosis no consta. Si el potasio supera 5,5 mientras consta tratamiento, se emite advertencia prioritaria incluso con otros datos incompletos. En TFGe <15, se señala la indicación de interrupción de la ficha por progresión a enfermedad renal terminal. No se registra una suspensión como ya realizada.

## 4. Finerenona — IC sintomática con FEVI ≥40 % (tabla 4)

La ficha de IC usa dosis **10, 20 o 40 mg/día**; el objetivo depende de TFGe inicial: 40 mg/día si ≥60 y 20 mg/día si ≥25 y <60 mL/min/1,73 m².

| Potasio sérico, mmol/L | 10 mg | 20 mg | 40 mg |
| --- | --- | --- | --- |
| <5,0 | Considerar aumento a 20 mg si descenso TFGe no >30 % | Considerar aumento a 40 mg si función renal inicial lo permite y descenso no >30 %; si TFGe inicial <60 mantener 20 mg | Mantener 40 mg; reducir si descenso TFGe >30 % |
| 5,0 a <5,5 | Mantener 10 mg | Mantener 20 mg | Mantener 40 mg, reducir a 20 mg si descenso TFGe >30 % |
| 5,5 a <6,0 | Interrumpir | Reducir a 10 mg | Reducir a 20 mg |
| ≥6,0 | Interrumpir | Interrumpir | Interrumpir |

Si TFGe disminuye **≥40 %**, la ficha recomienda considerar reducción o interrupción; se prioriza una revisión clínica. Las salidas distinguen **>30 %** de **≥40 %**, y no intentan calcular posología sin la dosis verdaderamente administrada. Para reinicio tras interrupción, el sistema requiere nueva valoración, sin generar una orden automática.

En ambos itinerarios de finerenona, **K y TFGe se deben controlar a las cuatro semanas** de inicio, reinicio y modificación de dosis. Posteriormente, según situación y riesgo.

## 5. Empagliflozina — continuidad, interrupción y reevaluación

- IC/ERC: dosis de ficha de 10 mg/día; no se extrapola automáticamente una posible subida a 25 mg desde DM2.
- DM2: paso de 10 a 25 mg solo figura como opción documental si se declara tolerancia, necesidad de mayor control glucémico y TFGe ≥60.
- Sospecha o diagnóstico de cetoacidosis: la ficha indica suspensión y **valoración inmediata**, incluso con glucemia poco elevada.
- Hospitalización por enfermedad aguda grave o procedimiento quirúrgico mayor: la ficha indica interrupción, control de cetonas y reconsideración de reinicio tras **normalización de cuerpos cetónicos y estabilización clínica**.
- Cetoacidosis previa durante un iSGLT2: **no recomendar reinicio** sin que se haya identificado y resuelto claramente otro factor desencadenante.
- Control de función renal antes del inicio y **al menos anual** durante tratamiento; adelantar según situación clínica y tratamientos asociados.

La revisión no prescribe, no reanuda y no afirma que se haya suspendido empagliflozina. El módulo separa `emp_estado` (tratamiento realmente administrado o interrumpido) de las recomendaciones.

## 6. Calendario condicionado a confirmación profesional

`confirmedAction(history, action)` requiere:
- Principio activo e indicación existentes.
- Acción de **inicio**, **reinicio**, **ajuste** o **interrupción**.
- Fecha efectiva válida en formato ISO (`AAAA-MM-DD`).
- Dosis realmente administrada tras la actuación (si no es interrupción).
- `confirmedByClinician: true`, activado únicamente por interacción explícita en la interfaz.

**No se crean controles a partir de candidatos ni de una simple revisión.**

`followUpFromHistory()` entrega:
- Finerenona tras inicio/reinicio/ajuste confirmados: control de **K + TFGe a los 28 días (4 semanas)**.
- Empagliflozina tras inicio/reinicio confirmados: próxima revisión renal anual orientativa, advirtiendo que puede ser necesaria antes.
- Interrupción confirmada: **reevaluación clínica sin fecha fija**, por no existir un intervalo universal atribuible a la ficha.
- Si se confirma interrupción o cambio de dosis de finerenona antes de una fecha prevista, el control anterior se marca **sustituido** y no desaparece del historial.
- Un ajuste de empagliflozina no elimina el control renal anual. La interrupción/reinicio puede sustituirlo.

El calendario **no envía notificaciones ni se sincroniza**. No debe presentarse como un sistema de alertas asistenciales. Las fechas futuras requieren confirmación al realizar el procedimiento.

## 7. Pruebas incluidas

- Límites exactos de K: **4,8 / 5,0 / 5,5 / 6,0** según tabla e indicación.
- Continuación de finerenona 10/20/40 mg, y frontera de descenso de TFGe **>30 % / ≥40 %**.
- TFGe inicial distinta de la actual para la indicación de IC.
- No sugerir subida cuando falta TFGe previa; advertencias no silenciadas por otros datos ausentes.
- Empagliflozina en situación aguda, cetoacidosis y criterios de reinicio.
- Historial vacío y sin confirmación; fechas inválidas y dosis no confirmadas.
- Control a cuatro semanas y manejo del 29 de febrero para revisión anual.
- Sustitución de controles futuros por actuaciones posteriores.

**Pendiente antes de uso asistencial:** pruebas externas con casos clínicos reales anonimizados bajo supervisión, revisión especializada de ambas fichas, interacción exhaustiva entre medicamentos, contexto agudo y embarazo, revisión de indicaciones actuales y autorización regulatoria que corresponda.
