# CaHReMe

PWA de apoyo a la decisión clínica en desarrollo. La portada aprobada se mantiene y comienza la reconstrucción desde cero de los módulos clínicos. La primera patología es insuficiencia cardiaca.

## Estado

Solo está disponible la navegación de la nueva interfaz. Los apartados clínicos, valoración integral y fuentes están pendientes de validación e implementación. No hay reglas clínicas activas ni recomendaciones terapéuticas. No utilizar esta versión para decisiones asistenciales.

## Desarrollo

- `npm run dev`: servidor local.
- `npm run check`: pruebas y sintaxis.
- `npm ci` y `npx playwright install`: dependencias de navegador.
- `npm run test:browser`: auditoría de navegación en Chromium y WebKit.

## Criterios

Conservar la estética perlada de la portada; validar una pantalla y un apartado cada vez. El futuro motor clínico será determinista y trazable, con filtros de seguridad y fuentes verificadas antes de activar cualquier recomendación.
