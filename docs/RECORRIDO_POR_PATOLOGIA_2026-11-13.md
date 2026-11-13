# Recorrido por patología · 13/11/2026

Estado vigente de interfaz: sustituye la portada de consulta rápida y los niveles rápida/detallada/resumen como navegación principal. La documentación anterior se conserva como historial de desarrollo; sus capturas y recuentos no describen esta interfaz.

## Decisión de producto

Entrada por ocho áreas: DM2, HTA, dislipemia, obesidad, ERC, insuficiencia cardíaca, hígado metabólico y prevención cardiovascular. Insulinización se integra en el tratamiento de DM2. Prevención abre riesgo cardiovascular o CKM.

Cada patología ofrece diagnóstico, clasificación y tratamiento. El diagnóstico ya confirmado permite saltar directamente a tratamiento; ese acceso no escribe un diagnóstico ni convierte datos desconocidos en negativos. La primera pantalla no pide campos. La clasificación inicial pide dos a cuatro criterios; los cálculos quedan en un desplegable de esa misma pantalla.

El tratamiento muestra la orientación clínica y un selector de producto/indicación, en lugar de desplegar simultáneamente todas las fichas y pautas. Tras elegir producto aparecen sus requisitos y el cálculo de inicio o escalada; insulina permanece dentro de DM2. Las pautas siguen siendo condicionadas por el ámbito y la revisión del producto. No se registra una actuación realizada al calcular.

La ficha clínica extensa permanece accesible en «Datos clínicos adicionales y fuentes» para casos que precisan contexto. No se ha eliminado el motor clínico ni el contenido documental. Se retira el menú principal Integral/Herramientas y la barra inferior.

## Cálculos y procedencia

IMC, FIB-4 y TFGe se calculan sin salir de la patología; Cockcroft–Gault se abre en la pauta que lo requiere. La transferencia al formulario es explícita. Al modificar entradas se invalidan las mediciones derivadas y las confirmaciones asociadas. Un FIB-4 calculado se identifica como local; no se fabrica una fecha ni una confirmación de informe externo. El algoritmo hepático completo conserva sus exigencias de fechas y coherencia.

## Correcciones de la auditoría

- Glucemia actual <70 mg/dL detiene las pautas crónicas, aunque la revisión genérica se haya confirmado. Fuente: ADA Standards of Care 2026, sección 6, DOI 10.2337/dc26-s006.
- La mala adherencia explícita impide escalar el tratamiento de la patología correspondiente; no se extrapola la adherencia lipídica a obesidad.
- El cribado de fibrosis acepta un perfil de riesgo compatible con evaluación MASLD sin exigir esteatosis ecográfica documentada, después de revisar otras causas. No confirma MASLD ni MASH por FIB-4. Fuente: EASL–EASD–EASO 2024, DOI 10.1007/s00125-024-06196-3.

## Validación y límites

1443 pruebas Node superadas antes de publicación. Auditoría de navegación actual en Chromium y WebKit, incluyendo anchura de 320 px, cálculos integrados, pautas, invalidación, privacidad, reparación de caché y recarga offline con servidor detenido. Resultado de navegador pendiente hasta finalizar Actions.

La auditoría de navegador anterior se conserva en qa/browser-legacy-audit.mjs para trazabilidad; no representa la navegación vigente. Las pruebas unitarias de motores y de las vistas completas permanecen activas. No se han realizado pruebas en iPhone físico ni validación clínica independiente. El selector de medicamento facilita acceso a las pautas disponibles; no constituye un algoritmo de selección exhaustiva ni amplía el catálogo farmacológico.
