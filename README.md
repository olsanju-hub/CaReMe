# CaHReMe — README maestro de continuidad

PWA de apoyo a la decisión clínica para Atención Primaria, centrada en el abordaje cardiorrenal-hepatometabólico. Se conserva la portada aprobada y se reconstruyen los módulos clínicos por patologías. La primera patología es insuficiencia cardiaca (IC).

**Actualizado: 28/11/2026. Punto de reanudación: IC → Tratamiento → Asistente terapéutico → paso 3, Propuesta de tratamiento.**

> Este README es el documento operativo vivo del proyecto. No es una guía clínica ni una certificación. Ante un nuevo chat, leerlo antes de modificar código. El historial y las pruebas permiten continuar sin repetir una auditoría general. Solo reabrir comprobaciones concretas cuando exista una nueva fuente, una modificación de reglas, un fallo o una discrepancia relevante.

## 1. Estado de trabajo y ramas

| Elemento | Estado |
| --- | --- |
| Repositorio | [olsanju-hub/CaReMe](https://github.com/olsanju-hub/CaReMe) |
| Versión de referencia de interfaz | v0.101 |
| Rama del prototipo | `feat/prototipo-interfaz` |
| Rama de trabajo vigente | `audit/ic-validacion-clinica` |
| Integración | [PR #12 en borrador](https://github.com/olsanju-hub/CaReMe/pull/12), hacia la rama del prototipo |
| Último corte de código y auditoría verificado | `b9a2cb03807bafc0389c1a8dfc2dd44824a2f99b` |
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
| IC: Tratamiento, asistente, paso 3 | Propuesta condicionada implementada; **pantalla y flujo por terminar** |
| IC: accesos directos de Tratamiento | IC-FEr, IC-FEp, FEVI mejorada, diuréticos, titulación y ajustes, seguridad farmacológica: todavía pendientes como apartados de consulta independientes |
| IC: Optimización | Pendiente como módulo independiente; parte de la lógica ya reside en el motor terapéutico |
| IC: Seguimiento / Comorbilidades / Derivación / IC avanzada | Pendientes |
| IC: IC descompensada | Acceso prioritario y alertas de seguridad; contenido asistencial completo pendiente |
| IC: Calculadoras / Farmacoteca / Evidencia | Accesos existentes; apartados completos pendientes |
| Resto de patologías | Mantener la navegación; reconstrucción futura una a una: riesgo CV, HTA, dislipemia, obesidad, DM2, ERC, MASLD y las áreas aprobadas del proyecto |

## 4. Punto exacto de reanudación — terminar el asistente terapéutico

Ruta: `#ic/tratamiento/asistente/propuesta`. Función de interfaz: `therapyStepThree()` en `src/app.mjs`. Motor: `treatmentProposal(ctx)` en `src/ic/suspicion.mjs`.

El asistente tiene tres pasos: (1) perfil y seguridad; (2) medicación actual; (3) propuesta de tratamiento. Los dos primeros existen. No volver a diseñarlos desde cero. El tercer paso ya presenta acciones agrupadas, bloqueadores, alertas, requisitos y fuentes. La tarea inmediata es terminar y simplificar **la propuesta**, no crear un cuarto formulario general.

### Siguiente intervención, en orden

1. Abrir la propuesta con casos ficticios representativos (IC-FEr, FEVI 41–49 %, IC-FEp, FEVI mejorada, medicación incompleta y situación de alarma).
2. Revisar la distribución visual de la salida: perfil recuperado compacto, prioridad de seguridad, actuaciones concretas por fármaco, seguimiento. Evitar duplicidades entre los avisos del motor y los de la interfaz. Mostrar el motivo clínico de una acción solo cuando sea útil.
3. Proponer un diseño de la pantalla de resultado y validarlo con el titular antes de alterar su estructura definitiva. Mantener la estética y navegación aprobadas.
4. Vincular cada acción con los requisitos que realmente faltan, reutilizando lo registrado. Mostrar esos datos de manera progresiva y únicamente en el contexto de la acción. Mantener advertencia de alcance parcial, sin ocultar alertas relevantes.
5. Completar en el motor los casos que todavía devuelven referencias condicionadas por falta de algoritmo o de datos. En especial, enlazar transición IECA/ARNI y el registro longitudinal necesario, ajustes que dependen de aclaramiento y contraindicaciones de la presentación. No ampliar catálogo sin verificar fuentes.
6. Verificar los escenarios positivos, negativos, límites, privacidad y regresiones. Actualizar este README y el registro clínico técnico. Cerrar el asistente funcional solo cuando se hayan satisfecho sus criterios de aceptación; no confundirlo con autorización de uso clínico.

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

Último corte de código comprobado: `b9a2cb03807bafc0389c1a8dfc2dd44824a2f99b`.

| Control | Resultado al 28/11/2026 |
| --- | --- |
| P0, adquisición documental ESC | Completada |
| P1/P2, diagnóstico y clasificación | Implementación revisada parcialmente y ampliada |
| P3, farmacología | 16/16 principios activos del catálogo con presentación de referencia; cobertura no exhaustiva |
| P4, seguridad | Alertas y cribado contextual ampliados; cobertura de interacciones y contraindicaciones incompleta |
| P5, optimización | Reglas y referencias diferenciadas; faltan algoritmos y datos longitudinales específicos |
| Pruebas del motor | 102/102 en adaptador aislado; ejecución nativa de check de CI superada |
| Node.js / sintaxis | [Success, run 46124984535](https://github.com/olsanju-hub/CaReMe/actions/runs/46124984535) |
| Chromium + WebKit | [Success, run 46124984617](https://github.com/olsanju-hub/CaReMe/actions/runs/46124984617), incluidos escenarios nuevos de riesgos contextuales |
| Validación clínica independiente | Pendiente |
| Publicación / integración | No autorizada en este corte; PR borrador |

Pendientes específicos que deben acompañar el desarrollo, sin bloquear por defecto el progreso de las pantallas del prototipo:

- Completar contraindicaciones por presentación e indicación y ampliar el reconocimiento de principios activos, marcas y combinaciones; no certificar compatibilidad exhaustiva.
- Completar decisiones de ajuste/reintroducción, aclaramiento de creatinina, fecha de analíticas y tendencias pertinentes. Integrar el helper de transición IECA/ARNI (36 h) en el flujo real de cambio.
- Resolver diferencias documentales concretas: por ejemplo, el motor usa la referencia de sacubitrilo/valsartán 90716 y una anotación posterior de auditoría cita 90717; contrastar ficha exacta antes de ampliar esa regla, sin sustituir el código por una referencia no verificada.
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

## 9. Protocolo de actualización y relevo de chat

Al terminar cada intervención que cambie el proyecto:

1. Actualizar el encabezado con fecha y punto exacto de reanudación; indicar rama y último commit de código comprobado.
2. Actualizar el mapa de estado y el siguiente paso. No declarar terminado un apartado pendiente o parcialmente implementado.
3. Añadir una fila cronológica con fecha, cambio, archivo/commit/PR y resultados reales de pruebas. Si se desconoce el resultado, indicarlo como pendiente.
4. Registrar fuente, razonamiento y límites de cualquier cambio clínico en el documento de auditoría; conservar entradas anteriores y señalar correcciones que las sustituyen.
5. Si surge un impedimento, consignar el dato o acción necesarios para resolverlo. No prometer ejecución de fondo sin una tarea activa verificable.
6. Dejar una instrucción concreta de continuidad que no dependa de la memoria del chat. Una nueva conversación debe seguir ese punto, no reiniciar auditorías ni volver a pedir decisiones ya registradas.

**Instrucción de continuidad vigente:** continuar en la rama `audit/ic-validacion-clinica`, abrir IC → Tratamiento → Asistente terapéutico → Propuesta de tratamiento, revisar su interfaz y terminar ese paso sin trasladar la complejidad del motor al médico. No tocar otras pantallas aprobadas, no fusionar ni publicar. Actualizar README al finalizar cada bloque.
