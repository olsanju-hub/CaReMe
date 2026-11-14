# Acceso directo al tratamiento — 14 de noviembre de 2026

## Problema

El recorrido obligaba a entrar por diagnóstico, pasar tandas de preguntas con «Continuar» y abrir otra sección para concretar la dosis. La sucesión de pantallas hacía difícil encontrar el tratamiento.

## Cambio

Al abrir una patología se entra en Tratamiento. Diagnóstico y Clasificación permanecen accesibles como consultas opcionales. Los datos se completan en una sola pantalla adaptativa: aparecen los necesarios para la decisión y se conservan mientras se completa el caso. No se asumen ausencia de medicación ni condiciones clínicas favorables.

Cuando el motor reúne los datos suficientes, muestra la propuesta y prepara automáticamente la primera pauta recomendada. Las otras pautas propuestas se consultan en el mismo lugar. El médico confirma la revisión de indicación, contraindicaciones e interacciones; la dosis aparece sin un segundo botón de cálculo. Una modificación clínica invalida la comprobación previa.

La pauta confirmada queda inmediatamente bajo el nombre del tratamiento, antes de la justificación y las comprobaciones plegadas. Las escaladas se consultan debajo de la pauta. Los datos utilizados pueden editarse desde un resumen plegable. En DM2, el acceso a insulinización queda visible en la parte superior; su calculadora conserva su recorrido específico.

## Alcance y evaluación

No se modifican algoritmos, dosis, umbrales ni fuentes clínicas. Se mantienen los bloqueos del motor y los datos compartidos solo durante la sesión. La reducción de navegación no sustituye la revisión clínica ni implica que se haya administrado un tratamiento.

Comprobación local y CI: 1.620 pruebas superadas, sin fallos. Auditoría final: 224 comprobaciones superadas, sin fallos, con Chromium de escritorio/móvil y WebKit de 390 y 320 px. Incluye teclado, etiquetas, datos compartidos, invalidación de la revisión, privacidad, reparación de caché y recarga offline con servidor detenido y control negativo. La dosis de inicio de obesidad se verifica dentro de la primera pantalla de los cuatro perfiles tras completar el caso.

Durante la implementación se corrigieron la selección accidental de un paso sin pauta, la pérdida del campo numérico al editar y el arrastre de campos entre medicamentos. La confirmación se aplica después de sincronizar el último dato escrito. En la auditoría intermedia, 220 comprobaciones pasaron y 4 fallaron: la expectativa antigua rechazaba cualquier pauta después de elevar K, aunque el motor retiraba losartán y proponía amlodipino. La prueba final exige borrar la dosis anterior, confirmar de nuevo y no mostrar la dosis de losartán; no se alteró el motor clínico para hacerla pasar.

Código funcional: `4a347de2e7e26ddda24606cdede880efd29d4cdc`. Auditoría de navegador: [run 43586712222](https://github.com/olsanju-hub/CaReMe/actions/runs/43586712222). Verificación Node: [run 43586712256](https://github.com/olsanju-hub/CaReMe/actions/runs/43586712256). Pages: [run 43586711837](https://github.com/olsanju-hub/CaReMe/actions/runs/43586711837). Caché `v0-58`. Los archivos públicos de aplicación, estilos y service worker coinciden por SHA-256 con la revisión local.

Se inspeccionaron las capturas finales de pauta de obesidad y reducción de HTA en 320 px. El PR #4 permanece abierto como borrador y no se fusiona con main. Siguen pendientes una evaluación de usabilidad con médicos, validación clínica independiente y prueba en iPhone físico. Las comprobaciones automatizadas no acreditan esas validaciones.
