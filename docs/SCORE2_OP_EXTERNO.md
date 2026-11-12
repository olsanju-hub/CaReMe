# SCORE2-OP: registro externo con procedencia

Fecha: 12/11/2026. Base: e5d6112cd0848103f4d4422f21e39d80318337f3. PR #4.

## Auditoría previa y decisión de alcance

La base reproducía 492 pruebas. SCORE2 local estaba implementado para 40–69 años; a partir de 70 el circuito se detenía sin porcentaje. Se revisó el artículo original SCORE2-OP, pero no se pudieron verificar todos los parámetros y la recalibración del suplemento original mediante las fuentes primarias accesibles. Las implementaciones públicas encontradas diferían en precisión y centrado. No se copió ni habilitó una de esas fórmulas como si estuviera comprobada.

Este incremento completa una vía de documentación externa, no el motor matemático SCORE2-OP. El cálculo interno sigue pendiente de comprobación documental y casos numéricos de referencia independientes. Ninguna prueba de este bloque valida una ecuación OP interna.

## Fuentes primarias

- [Artículo original SCORE2-OP](https://doi.org/10.1093/eurheartj/ehab312), Eur Heart J 2021;42:2455–2467; [PubMed 34120185](https://pubmed.ncbi.nlm.nih.gov/34120185/). Su tabla 2 documenta coeficientes y la figura 3 muestra las bandas 70–89. No se han dado por verificados todos los parámetros complementarios necesarios para cálculo local.
- [ESC: SCORE2 y SCORE2-OP](https://www.escardio.org/guidelines/practice-tools/cvd-prevention-toolbox/score2-and-score2-op-calculators/).
- [HeartScore ESC](https://www.heartscore.org/) y [regiones](https://www.heartscore.org/en_GB/heartscore-europe-risk-regions): contexto europeo y calibración baja de España.

## Comportamiento

El circuito actual permite registrar un porcentaje obtenido por el profesional en HeartScore para SCORE2-OP a diez años, en personas de 70–89 años que superen las exclusiones de esta primera vía. No se automatiza la consulta a HeartScore ni se envía ningún dato de la ficha.

Se registran fuente/modelo/horizonte, fecha, porcentaje y revisión de aplicabilidad/contexto geriátrico. La confirmación explícita debe hacerse después de introducir los datos. La calibración regional España debe estar confirmada. La fecha no puede ser posterior a la evaluación ni anterior a las mediciones de PA/lípidos aportadas.

Esta vía conservadora excluye diabetes, ERC/marcadores renales, enfermedad cardiovascular conocida y las demás situaciones retenidas por el motor. No pretende resolver toda la aplicabilidad clínica del modelo publicado ni sustituir SCORE2-Diabetes o CKD Add-On. No se extrapola por debajo de 70 o a partir de 90. El SCORE2 interno de 40–69 se conserva.

`evaluateCvRisk` mantiene `percent=null` y `model=null` para cálculo interno, y devuelve `externalEstimate` con modelo SCORE2-OP, porcentaje, fuente, región, fecha, horizonte y `internallyCalculated=false`. La interfaz identifica expresamente el origen externo, sin presentarlo como resultado recalculado por CaHReMe. No se asignan automáticamente categoría terapéutica, estadio CKM o dosis.

## Asociación y edición

`setValue` conserva en memoria una instantánea ordenada de los datos/estados de disponibilidad cuando se confirma la correspondencia del resultado externo. Una edición efectiva posterior invalida esa confirmación, también si cambia el propio porcentaje o la disponibilidad. Escribir de nuevo el mismo valor no la invalida. El evaluador comprueba la instantánea para no aceptar una confirmación antigua tras modificaciones fuera del flujo normal.

No es una firma electrónica ni acredita que el cálculo ajeno sea correcto. No identifica al paciente, no evita errores de transcripción por sí sola y no sustituye la verificación profesional de que HeartScore se utilizó con los mismos datos. La instantánea desaparece al cerrar/recargar como el resto de la ficha.

## Auditoría posterior

521/521 pruebas locales superadas y sintaxis correcta. Se añaden 29 casos: fuente no confirmada, fechas incompatibles, edad, exclusiones, ausencia de resultado, origen externo, cambios posteriores, disponibilidad y recorrido de interfaz con DOM simulado. La cifra 12,3 % de los casos es una entrada sintética de transcripción, no un resultado numérico de referencia de SCORE2-OP.

No se han realizado pruebas visuales reales, en iPhone o de uso interactivo de HeartScore. No se ha validado el cálculo matemático OP local porque sigue sin implementarse. La caché estática se versiona para actualizar modelo/interfaz.

## Pendientes

1. Obtener y comprobar el suplemento original completo (coeficientes exactos, centrado, supervivencia y recalibración) y verificar casos numéricos externos para habilitar cálculo OP propio.
2. Completar SCORE2-Diabetes y CKD Add-On.
3. Revisión clínica independiente y QA real antes de publicación.

La PR sigue en borrador. Esta vía parcial no cierra el requisito de cálculo interno SCORE2-OP ni el MVP.
