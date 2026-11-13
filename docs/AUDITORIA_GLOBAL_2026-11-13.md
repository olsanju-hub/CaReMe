# Auditoría global de coherencia e interfaz

Fecha: 13/11/2026. Base auditada: `de591b638e1a27d9cbcd64af3e05f31fee547d0b` (907 pruebas). La revisión no equivale a validación clínica independiente. PR #4 en borrador.

## Hallazgos y correcciones

1. El service worker precargaba obesidad, MASLD y plan integral, pero su segunda lista de rutas no los interceptaba offline. Se deriva ahora la lista de rutas de los mismos recursos precargados. La caché se limita al ámbito de la aplicación y las lecturas usan exclusivamente su caché actual.
2. La clasificación de IC-FEp con FEVI≥50 no comprobaba un antecedente de FEVI reducida. La guía ESC2026, sección5.2.2, exige revisar ese antecedente. Se incorpora dato documentado y se retiene la clasificación si no se ha revisado. Si existió FEVI<50, se solicita valorar trayectoria y tratamiento previo sin clasificar automáticamente como preservada ni ordenar retirada por mejoría. No se diagnostica automáticamente IC con FEVI mejorada ni se cambia su pauta.
3. La navegación principal solo era visible en móvil; en ordenador faltaba acceso directo a Herramientas. Se añade navegación de ordenador y se mantiene acceso inferior en tablet/móvil.
4. La portada aún describía resultados solo de DM2. Se actualiza para reflejar las seis áreas con salida para revisión.

La comprobación de IC se contrasta con [ESC2026, publicación primaria, sección5.2](https://academic.oup.com/eurheartj/article/47/38/5346/8766302) y [portal de la sociedad](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/heart-failure). La distinción de fenotipo es independiente de la indicación CIMA finerenona FEVI≥40, que permanece en su ficha. No se ha realizado una revalidación exhaustiva de todas las referencias anteriores.

## Pruebas

- Base:907 pruebas Node superadas antes de cambios.
- Tras las correcciones iniciales:925 pruebas Node superadas, con sintaxis. Incluyen historia de FEVI y comportamiento del service worker mediante eventos, no solo presencia de nombres en su código.
- El entorno local impide arrancar Chromium por restricciones de sockets. Se configura una ejecución reproducible de navegadores en GitHub Actions, con Playwright1.62.1 fijado y lockfile. La prueba usa exclusivamente datos sintéticos y genera informe/capturas como artefactos de CI.
- La ejecución de Chromium/WebKit y su resultado definitivo se consignarán después de revisar CI. No se afirman aún pruebas de navegador superadas.

La automatización cubre navegación rápida/detallada/resumen, estructuras de formulario y anchuras de pantalla; añade estado compartido, invalidación y privacidad, con recarga offline. WebKit con viewport móvil no equivale a Safari en un iPhone físico. Instalación real en pantalla de inicio y revisión clínica independiente siguen pendientes.
