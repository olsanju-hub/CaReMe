# CaHReMe — README maestro de continuidad

PWA de apoyo a la decisión clínica para Atención Primaria, centrada en el abordaje cardiorrenal-hepatometabólico. Se conserva la portada aprobada y se reconstruyen los módulos clínicos por patologías. La primera patología es insuficiencia cardiaca (IC).

**Actualizado: 28/11/2026. Punto de reanudación: IC → Tratamiento → Asistente terapéutico → paso 3, Propuesta de tratamiento (v0.104 verificada; v0.105 permite completar requisitos directamente en propuesta; verificar nuevo CI y valorar facilidad de uso).**

> Este README es el documento operativo vivo del proyecto. No es una guía clínica ni una certificación. Ante un nuevo chat, leerlo antes de modificar código. El historial y las pruebas permiten continuar sin repetir una auditoría general. Solo reabrir comprobaciones concretas cuando exista una nueva fuente, una modificación de reglas, un fallo o una discrepancia relevante.

## 1. Estado de trabajo y ramas

| Elemento | Estado |
| --- | --- |
| Repositorio | [olsanju-hub/CaReMe](https://github.com/olsanju-hub/CaReMe) |
| Versión de interfaz en rama de trabajo | v0.105 (base visual v0.102) |
| Rama del prototipo | `feat/prototipo-interfaz` |
| Rama de trabajo vigente | `audit/ic-validacion-clinica` |
| Integración | [PR #12 en borrador](https://github.com/olsanju-hub/CaReMe/pull/12), hacia la rama del prototipo |
| Último corte de código verificado íntegramente (CI) | `af20d8972f37aef37266d635bff639645964360b` (v0.104) |
| Corte v0.105 implementado | `88cf1771d26430c4afc77b163be9f3a441bfb02d` (CI pendiente de verificar) |
| Aplicación publicada | [CaReMe](https://olsanju-hub.github.io/CaReMe/), sin modificar durante este trabajo |
| Alcance actual | Prototipo educativo con casos ficticios; no validado para decisiones asistenciales |

No fusionar, publicar ni modificar la rama de producción desde la rama de trabajo sin autorización explícita y sin resolver los criterios de salida pertinentes. No incorporar datos reales de pacientes. La sesión clínica reside en memoria; el service worker cachea recursos estáticos, no datos clínicos. Mantener esta separación.

La decisión operativa actual es **continuar el desarrollo del asistente terapéutico**; los pendientes de auditoría se conservan como tareas específicas y puertas de salida, no como una orden de reiniciar todo el proyecto.

## 2. Instrucciones permanentes de desarrollo

### Diseño y flujo

- Principio rector confirmado por el titular: **la complejidad clínica debe permanecer en los motores, no trasladarse al usuario a través de las pantallas**.
- Conservar la portada y estética aprobadas: blanco perlado/cristal, relieve y reflejos sutiles de inspiración iOS; colores diferenciados por patología; jerarquía clara, lectura móvil, sin ornamentación que perjudique el uso.
- Trabajar una pantalla y un apartado cada vez. No rediseñar pantallas aprobadas ni saltar a otra patología por iniciativa propia. El usuario decide el avance funcional/visual de cada pantalla; las correcciones técnicas y clínicas ya autorizadas pueden resolverse sin pedir aprobaciones intermedias.
- Introducir cada dato una sola vez: recuperar de Diagnóstico y Clasificación las variables ya registradas. Preguntar solo por datos que cambien una decisión y solo cuando sean necesarios. Nunca inferir normalidad o ausencia por desconocimiento.
- Medicación: seleccionar por familias y principio activo, dosis por toma y frecuencia específica. Registro en línea, sin ventanas flotantes que oculten contenido. Retraer el acordeón al completar una pauta para facilitar añadir la siguiente. Permitir registrar la pauta real incluso si difiere de una referencia; avisar, no cambiarla automáticamente.
- Alertas rojas y ámbar accionables visibles; monitorización rutinaria y evidencia en desplegables. Evitar duplicar avisos, confirmaciones, formularios o datos. La salida debe ayudar al médico a decidir, tratar, calcular, derivar o verificar una fuente; no limitarse a reproducir texto de una guía.

### Motor, evidencia y seguridad

- Motor determinista, trazable y separado de la presentación. Reutilizar el contexto clínico común. No implementar algoritmos paralelos o reglas de dosis en la interfaz.
- Diferenciar registro, indicación, elegibilidad, pauta de referencia y decisión clínica. Separar recomendación ESC de autorización regulatoria AEMPS-CIMA; documentar discrepancias por presentación, indicación y contexto. No convertir una referencia en prescripción automática.
- Distinguir inicio, mantenimiento, titulación, sustitución, reducción, suspensión y reintroducción. Ante datos insuficientes, mostrar la comprobación concreta pendiente, no una recomendación falsamente positiva. La ausencia de una alerta no descarta interacciones.
- Priorizar urgencia y estabilidad sobre optimización crónica. Distinguir cambios renales relativos de cifras aisladas; no aplicar límites de una familia indiscriminadamente a otra. No retirar automáticamente tratamiento pronóstico solo por FEVI mejorada, hipotensión tolerada o un valor analítico aislado.
- Cada nueva regla clínica debe conservar fuente exacta (documento/tabla/apartado o ficha técnica, fecha de consulta), condiciones de aplicación, límites y prueba de regresión. Si la fuente no puede comprobarse, registrar pendiente y no inventar la regla.
- No declarar una fase validada solo porque pasen sus pruebas. Diferenciar verificación informática, revisión documental y validación clínica independiente.

## 3. Mapa de la aplicación y estado funcional

| Apartado | Estado en la rama vigente |
| --- | --- |
| Portada general | Aprobada; conservar |
| Valoración integral cardiorrenal-hepatometabólica | Pendiente de desarrollo |
| IC: portada y navegación | Implementadas |
| IC: valoración del paciente / asistente diagnóstico | Entrada guiada disponible, recorrido integrado incompleto |
| IC: sospecha clínica | Implementada como motor educativo, con prioridad de seguridad |
| IC: pruebas diagnósticas | Registro y orientación implementados parcialmente |
| IC: BNP / NT-proBNP | Interpretación implementada; umbrales y factores modificadores contrastados parcialmente |
| IC: ecocardiografía | FEVI actual y previa, criterios cuantitativos de apoyo; no diagnóstico automático |
| IC: clasificación | Estadio A–D, fenotipo, NYHA, situación clínica, evolución FEVI y conclusión integradora implementados |
| IC: Tratamiento, portada | Perfil recuperado y accesos directos implementados |
| IC: Tratamiento, asistente, paso 1 | Perfil clínico y seguridad: PA, FC, FG y K; reutilización de datos y comprobación de vigencia |
| IC: Tratamiento, asistente, paso 2 | Medicación actual por familias, dosis/frecuencia, conciliación y alertas; pantalla de registro aprobada en su estructura, preservar |
| IC: Tratamiento, asistente, paso 3 | Maqueta aprobada implementada en v0.102; propuesta condicionada por actuaciones, alternativas iSGLT2 agrupadas, pauta actual recuperada, requisitos contextuales y seguimiento. v0.103 verificada por CI, incluye transición a ARNI; v0.104 verificada, añade evaluación renal fechada compartida, aclaramiento y tendencia por pauta; v0.105 permite completar requisitos in situ. Completar integración clínica pendiente antes de cierre funcional |
| IC: accesos directos de Tratamiento | IC-FEr, IC-FEp, FEVI mejorada, diuréticos, titulación y ajustes, seguridad farmacológica: todavía pendientes como apartados de consulta independientes |
| IC: Optimización | Pendiente como módulo independiente; parte de la lógica ya reside en el motor terapéutico |
| IC: Seguimiento / Comorbilidades / Derivación / IC avanzada | Pendientes |
| IC: IC descompensada | Acceso prioritario y alertas de seguridad; contenido asistencial completo pendiente |
| IC: Calculadoras / Farmacoteca / Evidencia | Accesos existentes; apartados completos pendientes |
| Resto de patologías | Mantener la navegación; reconstrucción futura una a una: riesgo CV, HTA, dislipemia, obesidad, DM2, ERC, MASLD y las áreas aprobadas del proyecto |

## 4. Punto exacto de reanudación — terminar el asistente terapéutico

Ruta: `#ic/tratamiento/asistente/propuesta`. Función de interfaz: `therapyStepThree()` en `src/app.mjs`. Motor: `treatmentProposal(ctx)` en `src/ic/suspicion.mjs`.

El asistente tiene tres pasos: (1) perfil y seguridad; (2) medicación actual; (3) propuesta de tratamiento. Los dos primeros existen. No volver a diseñarlos desde cero. El titular aprobó la maqueta de paso 3 y se implementó en v0.102: perfil compacto con constantes y unidades; tratamiento por completar (opciones iSGLT2 mutuamente excluyentes, comprobaciones compartidas); optimización agrupada por pauta actual; seguimiento y evidencia desplegable. Las alertas accionables permanecen visibles y el caso urgente tiene prioridad. Las secciones vacías se omiten. Desde la propuesta se puede abrir directamente la pauta y su contexto existente en el paso 2, sin nuevo formulario. No interpretar ausencia de actuación como recomendación de mantenimiento.

La v0.102 superó CI nativo y Chromium/WebKit. En v0.103 se añade, solo dentro de la actuación de sustitución por ARNI, la última dosis real o prevista, primera dosis prevista y comprobación de plan sin solapamiento. El motor calcula intervalo (36 h si IECA) y límite horario teórico; no prescribe ni modifica la medicación, no certifica retirada real. La interfaz aprobada se mantiene. En v0.104 se incorpora un único desplegable de analítica renal compartida, fecha de extracción (no fecha de entrada), CrCl separado del FG indexado, confirmación de vigencia/estabilidad y comparación con valor previo fechado dentro de cada actuación pertinente. Se integran referencias específicas de CIMA para enalapril, ramipril y eplerenona. No deducir CrCl de FG ni certificar lesión renal aguda o elegibilidad por una cifra aislada. El titular detectó que los requisitos pendientes eran difíciles de localizar y pidió poder rellenarlos directamente. En v0.105 se muestran exclusivamente constantes/analítica ausentes, pautas incompletas y confirmaciones pendientes en la propia propuesta; los requisitos editables de titulación aparecen en la tarjeta de cada medicamento. Los datos renales compartidos tienen acceso directo al desplegable y la clasificación que requiere evaluación completa dispone de enlace y retorno a propuesta. No se convierte una alerta clínica en un simple tick ni se relajan los bloqueos; urgencia conserva prioridad. **Continuar ajustes específicos**, no volver a diseñar ni repetir auditoría general.

### Siguiente intervención, en orden

1. Confirmar CI nativo y Chromium/WebKit de v0.105, revisar el flujo directo de datos pendientes y corregir únicamente fallos concretos. v0.104 verificada.
2. Continuar los ajustes, interrupciones y reintroducciones específicas por fármaco, reutilizando el nuevo contexto renal. Priorizar ARM (eplerenona/finerenona/espironolactona según presentación e indicación) y después iSGLT2 y diuréticos; no convertir referencia inicial ni límite de ficha en decisión automática. Completar captura pertinente de basal de finerenona y criterios de reinicio. No crear un formulario general.
3. Revisar la interfaz y el resultado individualizado con casos ficticios representativos, mantener el diseño aprobado. La planificación temporal de transición a ARNI ya está implementada; falta completar la elección individualizada de dosis y demás criterios de elegibilidad cuando se disponga de fuentes y datos suficientes.
4. Verificar escenarios positivos, negativos, límites, privacidad y regresiones. Actualizar README y registro clínico técnico. Cerrar el asistente funcional solo al satisfacer criterios de aceptación; no confundirlo con autorización de uso clínico.

Después, desarrollar los apartados de consulta directa de Tratamiento, reutilizando el mismo motor. El orden de esas pantallas y de los módulos posteriores es una propuesta de continuidad, no una aprobación anticipada del diseño: mantener desarrollo secuencial y acordar cada nuevo apartado con el titular.

### Criterios de aceptación del asistente

- Recorrido completo desde perfil hasta resultado sin duplicar datos ni preguntas.
- Propuesta comprensible y accionable, sin confundir alternativas excluyentes con tratamientos simultáneos.
- Dosis y frecuencia por molécula/presentación; comprobación de tolerancia, función renal, potasio, interacciones y otros requisitos según la acción.
- Situaciones desconocidas, contradictorias y urgentes correctamente diferenciadas. No mostrar escalones como indicaciones confirmadas con datos insuficientes.
- Interfaz móvil sin desbordamientos, acordeones retraídos cuando procede, controles accesibles y persistencia de contexto durante la sesión.
- Casos ficticios y pruebas del motor, Node.js, Chromium y WebKit superados para el corte de código que se vaya a aceptar. Validación clínica independiente y criterios regulatorios siguen siendo requisitos para uso asistencial.

## 5. Archivos y cómo trabajar

| Archivo | Responsabilidad |
| --- | --- |
| `src/ic/suspicion.mjs` | Motor de IC, contexto, diagnóstico, clasificación, medicación, seguridad y propuesta terapéutica |
| `src/app.mjs` | Vistas, navegación, eventos, recuperación del contexto; no duplicar decisiones del motor |
| `src/styles.css` | Sistema visual y adaptación móvil |
| `tests/ic-suspicion.test.mjs` | Pruebas unitarias y de regresión del motor |
| `qa/browser-audit.mjs` | Escenarios integrados de navegador con casos ficticios |
| `package.json`, `server.mjs` | Scripts y servidor local |
| `index.html`, `service-worker.js`, `manifest.webmanifest` | Shell y funcionamiento PWA; mantener coherencia de versión/cache en una futura publicación |
| `.github/workflows/check.yml`, `.github/workflows/browser.yml` | Verificación continua de Node y navegadores |
| [Registro clínico de auditoría](docs/IC_AUDITORIA_CLINICA_2026-11-28.md) | Fuentes, decisiones, commits y limitaciones clínicas. Documento histórico; no repetir aquí sus tablas completas. |

Comandos de desarrollo (Node.js >=20; CI usa Node 22):

```sh
npm run dev
npm run check
npm ci
npx playwright install chromium webkit
npm run test:browser
```

Antes de modificar, comprobar rama y estado actual. Si existen cambios posteriores a este README, leerlos y actualizar únicamente las secciones afectadas. No reconstruir módulos ya implementados por falta de memoria del chat. No anunciar una prueba como superada si solo se ha añadido el caso o comprobado sintaxis.

## 6. Fuentes clínicas y material entregado

- ESC 2026, edición definitiva: `ehag100.pdf`, European Heart Journal 47(38), 5346–5457, DOI [10.1093/eurheartj/ehag100](https://doi.org/10.1093/eurheartj/ehag100). Sustituye la copia anticipada `ICC 2026.pdf`.
- `ehag100_supplementary_data.pdf`, 49 páginas: S4–S9 (uso práctico de fármacos, pp.10–20), S11–S16 (IC descompensada, pp.23–27).
- `ehag100_evidence_tables.pdf`, 1051 páginas y 111 tablas: tablas 17–19 diagnóstico, 20–28 etiología y 29–41 tratamiento crónico.
- [AEMPS-CIMA](https://cima.aemps.es/cima/publico/home.html): fichas exactas por presentación. Referencias de las 16 moléculas actuales en el motor y registro de auditoría.
- Los PDF fueron aportados y contrastados durante la auditoría. No están incorporados al repositorio público. Si un nuevo chat no tiene acceso a ellos, recuperar los archivos originales o consultar su fuente oficial solo para la regla que lo requiera; no inventar contenido ni repetir la adquisición general. El alcance del permiso de distribución declarado por el titular debe comprobarse antes de publicar material protegido.

## 7. Validación y pendientes técnicos/clínicos

Último corte con CI integral confirmado: `af20d8972f37aef37266d635bff639645964360b` (v0.104). La v0.105 está implementada y sus pruebas actualizadas; no atribuirle automáticamente los resultados anteriores.

| Control | Resultado al 28/11/2026 |
| --- | --- |
| P0, adquisición documental ESC | Completada |
| P1/P2, diagnóstico y clasificación | Implementación revisada parcialmente y ampliada |
| P3, farmacología | 16/16 principios activos del catálogo con presentación de referencia; cobertura no exhaustiva |
| P4, seguridad | Alertas y cribado contextual ampliados; cobertura de interacciones y contraindicaciones incompleta |
| P5, optimización | Reglas y referencias diferenciadas; faltan algoritmos y datos longitudinales específicos |
| Pruebas del motor | v0.105: 108/108 en adaptador aislado; v0.104: 107/107 en adaptador aislado antes de integración final; v0.103: 105/105. v0.102: 103/103; comparación de 576 escenarios ficticios con v0.101: 576/576 iguales en decisiones, bloqueadores, alertas y valores, excluidos metadatos de presentación. No equivale a validación clínica |
| Node.js / sintaxis | v0.102 [success](https://github.com/olsanju-hub/CaReMe/actions/runs/46154762030), 119/119 pruebas nativas y sintaxis (expectativa fija de caché corregida). v0.103 [success](https://github.com/olsanju-hub/CaReMe/actions/runs/46158129963), 121/121 pruebas nativas y sintaxis. v0.104 [success](https://github.com/olsanju-hub/CaReMe/actions/runs/46158992888), 123/123 y sintaxis. v0.105 pendiente de verificar CI nativo |
| Chromium + WebKit | v0.102 [success](https://github.com/olsanju-hub/CaReMe/actions/runs/46154762015), alternativas, respuesta compartida, pauta actual y navegación contextual. v0.103: [success, escenarios de transición](https://github.com/olsanju-hub/CaReMe/actions/runs/46158129964). v0.104: [success, escenarios renales](https://github.com/olsanju-hub/CaReMe/actions/runs/46158992877). v0.105: pruebas de entrada directa y titulación pendientes de confirmar |
| Validación clínica independiente | Pendiente |
| Publicación / integración | No autorizada en este corte; PR borrador |

Pendientes específicos que deben acompañar el desarrollo, sin bloquear por defecto el progreso de las pantallas del prototipo:

- Completar contraindicaciones por presentación e indicación y ampliar el reconocimiento de principios activos, marcas y combinaciones; no certificar compatibilidad exhaustiva.
- Completar decisiones de ajuste/reintroducción por fármaco. Aclaramiento independiente, fechas de muestras y tendencias por pauta integrados en v0.104; pendiente cobertura completa y validación del uso de los datos (incluido basal de finerenona). Planificador de transición IECA/ARA-II a ARNI integrado en v0.103; pendiente elección individualizada de dosis y comprobación clínica completa, no prescripción automática.
- Diferencia documental 90716/90717 resuelta el 28/11/2026: ambas presentaciones de sacubitrilo/valsartán Kern Pharma remiten a ficha conjunta de tres concentraciones; se mantiene 90716. No extrapolar a todas las marcas. Conservar otras discrepancias concretas pendientes en registro técnico.
- Mantener distinción entre finerenona en IC y ERC-DM2, límites de inicio/continuación de iSGLT2 y criterios de ARM esteroideos. Conservar la advertencia de cobertura parcial.
- Completar módulos de IC aún pendientes (incluida IC descompensada), trazabilidad exhaustiva, revisión clínica independiente y alcance regulatorio/licencias antes de uso asistencial.

## 8. Bitácora cronológica (añadir al final, no borrar)

Las entradas del 28/11/2026 reconstruyen el orden de las intervenciones documentadas; no se atribuyen horas ni fechas concretas a hitos anteriores sin evidencia.

| Fecha / secuencia | Trabajo realizado | Resultado / referencia |
| --- | --- | --- |
| Etapa previa, antes del 28/11/2026 | Reconstrucción del prototipo con portada perlada aprobada, navegación por patologías; IC como primera patología | Base v0.101, rama feat/prototipo-interfaz |
| Etapa previa | Diagnóstico: sospecha, pruebas, péptidos y ecocardiografía; clasificación: estadio, fenotipo, NYHA, situación y evolución | Motor y vistas existentes |
| Etapa previa | Tratamiento: portada, perfil de seguridad y medicación por familias; cambio de modal a acordeones en línea con retracción al completar pauta | Estructura de registro aprobada; siguiente pantalla: propuesta |
| 28/11/2026 · 01 | Inicio de auditoría aislada; primeras alertas y pruebas | Rama audit/ic-validacion-clinica; registro técnico |
| 28/11/2026 · 02 | Recepción de guía principal definitiva y suplementos; resolución de adquisición documental | P0 completada; fuentes referenciadas sin publicar PDFs |
| 28/11/2026 · 03 | Contraste diagnóstico y clasificación: NP, NYHA, FEVI, criterios ecográficos y contradicciones | P1/P2 parciales; cambios y pruebas documentados |
| 28/11/2026 · 04 | Matriz farmacológica por presentación e indicación, inicialmente seis y después 16 moléculas | P3 inventario del catálogo; 83 y después 86 pruebas aisladas |
| 28/11/2026 · 05 | Ampliación de interacciones, conciliación, seguridad y condiciones de ajuste de finerenona, diferenciación IC/ERC-DM2 | 95 pruebas aisladas; registro técnico |
| 28/11/2026 · 06 | Requisito UX explícito: complejidad en los motores. Alertas accionables visibles y monitorización retraída. PR borrador y CI de navegador | 3c545f155ac3e17395c4fe7eb14da95f9fa60fe6; PR #12 |
| 28/11/2026 · 07 | Primer CI de navegador fallido por selector ambiguo; se corrige y se verifica | f553e5f96670027c0df13afa992a1bb37424b87e; check y navegador success |
| 28/11/2026 · 08 | P4/P5 ampliados: interacciones CIMA, mantenimiento SRAA S4/S5, escalones condicionados, transición ARNI, riesgos contextuales e intolerancia | 102 pruebas aisladas; últimos cambios de motor y UI documentados en auditoría |
| 28/11/2026 · 09 | P6: confirmación de check nativo y Chromium/WebKit, incluidos casos nuevos | b9a2cb03807bafc0389c1a8dfc2dd44824a2f99b; runs 46124984535 y 46124984617 success |
| 28/11/2026 · 10 | Decisión de continuidad: retomar Tratamiento y terminar el asistente terapéutico. Crear README maestro con hoja de ruta, reglas y pendientes | Este documento; sin alterar la interfaz ni publicar cambios |
| 28/11/2026 · 11 | Maqueta de propuesta terapéutica aprobada por el titular. Implementación v0.102: metadatos de agrupación desde motor, alternativas iSGLT2 y cribado común, tarjetas por pauta actual, acceso contextual, seguimiento y estilo perlado; actualización de caché PWA. No se modifican las decisiones clínicas | Motor 9131d809 / 8dd79daf; UI bdbc9fca / 47ad107e; CSS 046a24e3 / 664c8c0d; QA 9a1df533; tests 0dacd978 / a27febed. 103/103 pruebas aisladas y 576/576 escenarios de equivalencia; CI nativo 119/119 y sintaxis superados tras corregir comprobación de caché; Chromium/WebKit confirmados success en 74b16e48 (runs 46154762030 y 46154762015) |
| 28/11/2026 · 12 | v0.103: integrar planificación temporal IECA/ARA-II a ARNI dentro de la actuación existente; intervalo, límite de 36 h, plan sin solapamiento y riesgos compartidos; sin alterar la lista de medicación. Fichas 90716/90717 contrastadas | Motor a21377bc, tests 4cb81c1b (105/105 aisladas), UI d85c29cd, QA 063ec060, shell a7bf051b; registro clínico 17185445. CI nativo 121/121 y sintaxis superados; navegador success 46158129964 |
| 28/11/2026 · 13 | v0.104: analítica compartida fechada, CrCl independiente, vigencia clínica y tendencia por pauta; límites de referencia de enalapril, ramipril y eplerenona; sin ajuste automático | Motor 7e1455c7 / a9160240; tests dfea01b1 (107/107 en aislado previo a integración final); UI 15593483 / c4c651b2; QA d5eff59e; shell af20d897; registro clínico 1e3001f6. CI nativo 123/123 y sintaxis superados; navegador success |
| 28/11/2026 · 14 | v0.105: respuesta a dificultad de localizar requisitos. Campos faltantes directamente editables, confirmaciones, pautas y requisitos de ajuste, acceso renal compartido, enlaces de clasificación y retorno; sin relajar bloqueos | Motor 3d6f8e63; tests 96c4ea31 (108/108 aisladas); UI 3e17f146 / e8504a85; CSS f30be3c5; QA df37f837 / 88cf1771; shell f5ded36f. CI pendiente de confirmar |

## 9. Protocolo de actualización y relevo de chat

Al terminar cada intervención que cambie el proyecto:

1. Actualizar el encabezado con fecha y punto exacto de reanudación; indicar rama y último commit de código comprobado.
2. Actualizar el mapa de estado y el siguiente paso. No declarar terminado un apartado pendiente o parcialmente implementado.
3. Añadir una fila cronológica con fecha, cambio, archivo/commit/PR y resultados reales de pruebas. Si se desconoce el resultado, indicarlo como pendiente.
4. Registrar fuente, razonamiento y límites de cualquier cambio clínico en el documento de auditoría; conservar entradas anteriores y señalar correcciones que las sustituyen.
5. Si surge un impedimento, consignar el dato o acción necesarios para resolverlo. No prometer ejecución de fondo sin una tarea activa verificable.
6. Dejar una instrucción concreta de continuidad que no dependa de la memoria del chat. Una nueva conversación debe seguir ese punto, no reiniciar auditorías ni volver a pedir decisiones ya registradas.

**Instrucción de continuidad vigente:** continuar en `audit/ic-validacion-clinica` sobre v0.105. Distribución aprobada y v0.104 verificada; transición ARNI, contexto renal y entrada directa de requisitos integrados. Confirmar checks v0.105 y comprobar facilidad de uso; después continuar ajustes, interrupciones/reintroducciones de ARM y restantes familias, usando contexto compartido. No repetir diseño ni auditorías generales; no tocar otras pantallas aprobadas, no fusionar ni publicar. Actualizar README al finalizar cada bloque.
