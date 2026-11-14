# Ruta completa de consulta — 14/11/2026

## Comportamiento

El cambio anterior daba acceso directo al tratamiento, pero no una ruta de consulta. Ahora cada patología empieza por «Diagnóstico reciente» o «Enfermedad conocida». Esa selección organiza la interfaz; no escribe diagnósticos ni negativos farmacológicos en el modelo clínico.

La ruta visible contiene Evaluación, Tratamiento inicial, Escaladas y Seguimiento. La evaluación reciente indica analítica y pruebas de partida; en enfermedad conocida se revisa lo disponible y se puede desplegar el estudio inicial si faltó. No se obliga a introducir resultados para consultar qué pedir o cuándo revisar. Clasificación y calculadoras se abren en el contexto de evaluación.

Tratamiento inicial y escaladas reutilizan el motor clínico existente: medicación realmente tomada, perfil y seguridad determinan la propuesta. Elegir «Escaladas» no da por hecho que haya tratamiento ni autoriza intensificar. Los pasos posteriores siguen condicionados a respuesta y tolerancia. La dosis requiere la comprobación invalidable ya existente. Consultar seguimiento y volver a tratamiento o escaladas conserva una revisión válida si los datos y la pauta no han cambiado. Cambiar datos sigue invalidándola. Al cambiar de etapa se sale de la subruta de insulina, para evitar quedar atrapado en ella.

Seguimiento ofrece plazos y contenido de las revisiones por enfermedad, con controles adicionales de la pauta consultada. Ante una alerta crítica compartida se retiene el calendario estable. No se crean citas, solicitudes de pruebas ni administraciones. La situación reciente/conocida se conserva en memoria durante la sesión por patología y se borra al iniciar otro paciente.

La prevención cardiovascular conserva su acceso a riesgo y CKM; no se presenta como una enfermedad con pauta universal. Las siete patologías son DM2, HTA, dislipemia, obesidad, ERC, IC e hígado metabólico. Insulinización permanece dentro de DM2.

## Verificación de contenido

Se revisaron recomendaciones de evaluación y seguimiento en fuentes primarias; no se realizó una nueva validación exhaustiva de todos los algoritmos previos.

| Área | Fuente y apartado |
|---|---|
| DM2 | [ADA 2026, evaluación integral, tabla 4.1](https://doi.org/10.2337/dc26-S004); [objetivos y frecuencia de control glucémico, 6.2](https://doi.org/10.2337/dc26-S006). |
| HTA | [ESC 2024, tabla 8 y seguimiento](https://academic.oup.com/eurheartj/article/45/38/3912/7741010). |
| Lípidos | [ESC/EAS 2019, monitorización de lípidos y enzimas](https://doi.org/10.1093/eurheartj/ehz455), [actualización ESC/EAS 2025](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/dyslipidaemias/) y [NICE NG238, 1.5 y 1.11](https://www.nice.org.uk/guidance/ng238/chapter/Recommendations). El control lipídico temprano conserva las 4–6 semanas del motor previo, dentro de la ventana ESC de 8 ± 4 semanas; transaminasas a 2–3 meses y 12 meses según NICE. |
| Obesidad | [NICE NG246, evaluación de complicaciones](https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity). Los intervalos de escalada y controles del producto permanecen en las fichas CIMA ya incorporadas. |
| ERC | [KDIGO 2024, 2.1.1 y 3.6.2–3.6.4](https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf). |
| IC | [ESC 2021, evaluación inicial y 9.5, seguimiento](https://doi.org/10.1093/eurheartj/ehab368). Estos apartados organizan las pruebas; no sustituyen las fuentes posteriores del motor farmacológico. |
| Hígado | [EASL–EASD–EASO 2024, evaluación secuencial de fibrosis](https://pmc.ncbi.nlm.nih.gov/articles/PMC11299976/). Las bandas y limitaciones se interpretan con la clasificación existente, sin diagnosticar MASH por FIB-4. |

Las recomendaciones se sintetizan con redacción propia. Los plazos son de planificación; la pauta concreta puede requerir un control anterior. El contenido no convierte todas las pruebas listadas en obligatorias en cada visita.

## Auditoría

Pruebas locales: 1.636 superadas, sin fallos. Se añaden comprobaciones de las dos entradas por enfermedad y un caso de DM2 reciente que termina en dosis y seguimiento. Auditoría final: 284 comprobaciones de navegador superadas, sin fallos, en Chromium de escritorio/móvil y WebKit de 390/320 px. Incluye las dos entradas por cada patología, consulta de evaluación y seguimiento sin formulario obligatorio, clasificación contextual, tratamiento y dosis, conservación de revisión válida entre etapas, alertas críticas, privacidad y recarga offline con servidor detenido y control negativo.

Durante la implementación, el primer intento de auditoría no pudo completar los recorridos: el servidor local excluía el nuevo módulo y la aplicación no arrancaba en ese entorno. Se corrigió su lista de recursos y se añadió una prueba del grafo completo de importaciones frente a los recursos servidos y precacheados. También se actualizó el acceso de prueba a Clasificación, ahora dentro de Evaluación. No se omitieron escenarios clínicos para conseguir la ejecución final.

Revisión comprobada: `3dd515c1975e3521b3b2e473a1acb878f8397db5`. [Auditoría de navegador 43595560385](https://github.com/olsanju-hub/CaReMe/actions/runs/43595560385) y [verificación Node 43595560390](https://github.com/olsanju-hub/CaReMe/actions/runs/43595560390). [Pages 43595559997](https://github.com/olsanju-hub/CaReMe/actions/runs/43595559997) desplegado. Caché `v0-61`.

Se inspeccionaron las capturas de evaluación inicial de DM2 y dosis de obesidad en 320 px. Aplicación, estilos, módulo de rutas y service worker públicos coinciden por SHA-256 con la revisión local. El PR #4 permanece abierto como borrador, sin fusionar main.

Pendientes: revisión clínica independiente, prueba en iPhone físico y evaluación de usabilidad con médicos. No se declara validación asistencial ni app definitiva a partir de los tests de software.
