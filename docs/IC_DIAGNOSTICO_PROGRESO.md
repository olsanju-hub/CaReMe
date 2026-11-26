# Control de desarrollo — IC: diagnóstico

Actualizado 2026-11-26. No iniciar clasificación hasta cierre completo de diagnóstico.

| Apartado | Estado |
|---|---|
| Pantalla principal | Implementada; estructura aprobada |
| Sospecha clínica | v0.79: interpretación por dimensiones y seguridad independiente; pruebas y aprobación pendientes |
| Pruebas diagnósticas | v0.77: plan contextual, registro ECG/Rx/analítica y accesos específicos implementados; revisión técnica, clínica y visual pendientes |
| BNP / NT-proBNP | Pendiente |
| Ecocardiografía | Pendiente |
| Asistente diagnóstico integrado | Entrada guiada disponible; integración completa pendiente |
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

## Confirmación única
La versión de conclusión visible (e791d10) superó CI, auditorías de navegador y Pages. Por preferencia del usuario, se retiran las confirmaciones por bloque y se agrega una sola confirmación explícita de todos los apartados al final. No cambia la precedencia de alarmas, ni se presupone la revisión de constantes. Si se desmarca un hallazgo positivo, vuelve a desconocido y la confirmación deja de estar completa. Nueva verificación y aprobación visual pendientes.

## Navegación libre y continuidad
La versión de confirmación única (fe25066) superó CI, navegador y Pages. Se añade transición desde sospecha al registro de pruebas, condicionada a seguridad y revisión en recorrido guiado. El acceso directo sigue disponible sin completar pasos anteriores. El contexto en memoria conserva hallazgos y estados de pruebas; un estado disponible no equivale a resultado normal. La entrada Valoración del paciente y Asistente diagnóstico permiten iniciar el recorrido, no constituyen todavía asistentes completos. El registro de pruebas es una lista de trabajo, no una indicación personalizada; fuentes de referencia: ESC 2026 DOI ehag100, tabla de recomendaciones 3 (https://academic.oup.com/view-large/578907370). No se implementan todavía interpretación de péptidos, ecocardiografía ni clasificación; no se cierra diagnóstico. Licencia y validación clínica independiente pendientes.

## Actualización de PWA
La versión de navegación 26deb28 superó CI, auditorías y publicación. Se detecta riesgo de servir archivos desactualizados por la estrategia cache-first con ignoreSearch. v0.74: HTML en línea con prioridad de red y fallback offline; JS/CSS versionados y coincidencia exacta de caché; versión visible en pie; recarga al cambiar controlador solo sin datos introducidos, en otro caso aviso. Sin cambios clínicos. La URL pública no pudo verificarse directamente desde el entorno; pendiente comprobar el nuevo despliegue y Safari físico.

## Siguiente actuación accesible desde cada conclusión
v0.74 (5b8f66e) superó CI, navegador y publicación. v0.75 añade una acción visible para todos los resultados: completar seguridad (abre el bloque y enfoca constantes o alarmas pendientes), completar evaluación (abre el bloque pendiente), continuar a pruebas, elegir módulo de IC conocida o acceso al apartado de IC descompensada expresamente rotulado como no operativo. No se altera la lógica clínica ni se obliga a seguir el circuito. La navegación a pruebas se mantiene bloqueada como recomendación guiada si faltan datos de seguridad o hay alarma. Pendientes: verificación de v0.75, validación independiente y licencia.

## Continuidad sin bloqueo de navegación (v0.76)
Se distingue acceso a pruebas de autorización de manejo ambulatorio. El botón principal en la conclusión abre pruebas diagnósticas incluso si falta revisión de seguridad o existe IC conocida, conservando todos los datos. El registro de pruebas muestra contexto, advertencia de seguridad y permite comprobar las constantes sin regresar; las alarmas no revisadas se mantienen desconocidas. La alarma positiva conserva prioridad urgente y no ofrece continuación ambulatoria como paso recomendado. Se prueba el caso de la captura del usuario. No se implementan nuevas indicaciones ni se confirma IC por síntomas; validación y licencia pendientes.

## Pruebas diagnósticas v0.77
v0.76 superó CI, navegador y Pages. Fuente primaria consultada: ESC 2026, DOI 10.1093/eurheartj/ehag100, sección 5.1.2 y tabla de recomendaciones 3; la radiografía se incluye en el estudio inicial, no solo ante hallazgos condicionantes. Se separa sospecha, IC conocida, información incompleta y urgencia. Se incorporan registros manuales ECG y Rx, analítica numérica con unidades, estado de pruebas y estudio etiológico contextual. BNP/NT-proBNP y ecocardiografía conservan sus propios accesos; no se duplican valores ni interpretación. El registro no es prescripción ni confirma IC. Fecha de muestra, interpretación de valores, recomendaciones individualizadas, licencia y validación independiente quedan pendientes; la app sigue en modo educativo. Revisión bibliográfica parcial de publicación original, no acceso verificado al texto íntegro. Pendiente aprobación del usuario antes de avanzar a los asistentes específicos.

## Pruebas diagnósticas: interfaz compacta v0.78
v0.77 superó CI, navegador y Pages. Por aprobación expresa del usuario, se ajusta la pantalla a la maqueta de cuatro filas desplegables, contexto plegado, dos accesos específicos sin controles de estado duplicados, botón de continuación y evidencia. Se conservan datos, funciones de registro y reglas clínicas. Seguridad y alarmas siguen visibles cuando proceden; la alarma positiva no propone continuar a péptidos. Prueba móvil verifica que el botón principal es visible en el estado estable inicial y que no se muestran formularios cerrados. No se inicia BNP/NT-proBNP ni ecocardiografía; pendientes de autorización, validación clínica y licencia.

## Interpretación por dimensiones v0.79
v0.78 superó CI, auditorías y Pages. Autorizado por el usuario: motor de conclusión cualitativa independiente de seguridad. Cada ítem se asigna a una dimensión, con justificación componible; no se usan puntuaciones, probabilidades, clasificaciones ni combinaciones cerradas. Se conserva la lógica previa de seguridad y navegación; la conclusión clínica no se oculta por constantes pendientes. Los síntomas típicos pueden ser inespecíficos; no se confirma ni se excluye IC sin evaluación objetiva. Las reglas son locales y experimentales. Fuentes: ESC 2026 DOI ehag100, apartado 5.1/tabla 7 y descompensación; definición universal 2026 DOI ehag500. Se pudieron consultar extractos indexados; acceso directo al texto y tabla íntegros falló. Pruebas de cobertura de todos los ítems y estados por parejas, escenarios conocidos y caso aportado. No se afirma exhaustividad de todas las combinaciones posibles ni validación clínica. Licencia y revisión independiente pendientes. Sin cambios en cuestionario ni en módulos de péptidos o ecocardiografía. Se reutiliza título clínico en contexto de pruebas para evitar resultados discordantes.

## Analítica progresiva v0.80
v0.79 superó CI, navegador y Pages. Autorizado por el usuario: se muestra solicitud orientativa plegada, tres valores opcionales prioritarios según perfil, incorporación individual de otros parámetros y copia del listado solo cuando existe sospecha sintomática o IC conocida sin alarma positiva. Se conserva el modelo de resultados y su reutilización en memoria de sesión. El listado basal se contrastó con ESC 2026 ehag100, sección 5.1.2 y tabla 3 (https://academic.oup.com/view-large/578907370): el CAC urinario se incluye también en el estudio basal de sospecha, no solo por DM/HTA/ERC. Se destacan indicaciones de revisión según hallazgos sin duplicar determinaciones. Las prioridades de entrada son una decisión de interfaz, no umbrales ni indicaciones obligatorias; las fechas de muestra y lógica terapéutica siguen pendientes. Sin cambios en asistentes BNP o ecocardiografía. Validación clínica independiente y licencia pendientes. Pruebas de máximo tres campos visibles, ampliación individual y persistencia de resultados durante navegación.
