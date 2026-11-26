# Control de desarrollo — IC: diagnóstico

Actualizado 2026-11-26. No iniciar clasificación hasta cierre completo de diagnóstico.

| Apartado | Estado |
|---|---|
| Pantalla principal | Implementada; estructura aprobada |
| Sospecha clínica | v0.1: CI, Chromium, WebKit y Pages superados (36f45bb). v0.2: CI, Chromium, WebKit y Pages superados (396c7f3). Interfaz de casillas: implementada, pendiente de CI y publicación; revisión clínica independiente y aprobación visual pendientes |
| Pruebas diagnósticas | Pendiente |
| BNP / NT-proBNP | Pendiente |
| Ecocardiografía | Pendiente |
| Asistente diagnóstico integrado | Pendiente |
| Referencias científicas | Pendiente de consolidación |
| Validación integral | Pendiente |

## Sospecha
Fuente: ESC 2026, DOI 10.1093/eurheartj/ehag100, diagnóstico crónico, tabla 7 e IC descompensada. Revisión bibliográfica parcial mediante extractos de la publicación original; acceso al texto íntegro no verificado. La lógica cualitativa IC-SUS-01 a IC-SUS-10 es una adaptación de flujo local, no una escala validada ni una prescripción. No asigna clases de evidencia ficticias. Datos no evaluados se conservan como desconocidos. No se implementan umbrales numéricos ni cribado universal. Falta validación independiente y revisión de derechos/licencia. No utilizar el prototipo para decisiones asistenciales hasta completar la validación.

## Cierre
Cada apartado requiere pruebas, publicación, validación científica y aprobación visual del usuario. Mantener el estado explícito hasta verificar cada requisito.

## Auditoría 2026-11-26 — v0.2
- Fuente primaria: https://doi.org/10.1093/eurheartj/ehag100. Revisión de extractos de sección 5.1, tabla 7 y sección 7.2: síntomas y signos no específicos; evaluación precoz de estabilidad, congestión y perfusión. Las reglas cualitativas son una adaptación experimental, no clases de recomendación ESC ni escala validada.
- Confirmación explícita de revisión de constantes y estabilidad antes de orientación ordinaria; no se permite marcar alarmas negativas en bloque. Las alarmas críticas prevalecen aunque existan datos desconocidos. Solo demostración con casos ficticios, no uso asistencial.
- Identificador, versión y apartado de fuente en el resultado; nuevas pruebas de seguridad y trazabilidad.
- Licencia: ESC declara que la integración en CDS y el despliegue operativo requieren licencia; comprobar condiciones aplicables también al desarrollo y al prototipo público: https://www.escardio.org/guidelines/clinical-practice-guidelines/esc-guidelines-licensing-for-ai-llms-and-cds-tools/. No se ha obtenido autorización ni determinado una excepción. No copiar tablas, algoritmos o contenido de guías. Evaluar finalidad prevista y clasificación de software sanitario bajo MDR UE 2017/745 antes de uso real.
- Pendientes de cierre: revisión médica independiente documentada, resolución de licencia y evaluación regulatoria, revisión visual por el usuario. No iniciar clasificación hasta cierre del diagnóstico.

## Interfaz de selección directa
Se sustituyen desplegables Sí/No/Sin valorar por casillas. Marcado = presente; desmarcado = desconocido hasta confirmación expresa de revisión de cada bloque. La confirmación convierte exclusivamente los no marcados en ausentes; los positivos no se alteran. En alarmas se exige confirmación explícita de ausencia de las no marcadas y una casilla separada de constantes revisadas. Desmarcar un positivo vuelve a desconocido. Se mantiene la precedencia de alarmas y el bloqueo por datos de seguridad pendientes. La confirmación de revisión no es una inferencia automática de normalidad. No se modifica la lógica clínica ni el estado de validación.

## Conclusión visible
Versión de casillas (2402069): CI, Chromium, WebKit y Pages superados. Se mueve la conclusión al final y se añade barra fija con estado actualizado, aviso de alarma y acceso directo a la conclusión. El resultado muestra hallazgos presentes, datos pendientes y siguiente paso si procede; no enlaza a un estudio aún no implementado como si fuera operativo. Sin cambios en reglas clínicas. Nueva publicación y revisión visual pendientes.
