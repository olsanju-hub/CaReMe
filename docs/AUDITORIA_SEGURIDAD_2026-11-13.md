# Auditoría de seguridad transversal y seguimiento

Fecha: 13/11/2026. Base: `a9ac2d90d14488e272fcd5d6f5a7a27ae4d437ee`. Revisión técnica/documental con contraste selectivo de fuentes primarias. No es una validación clínica independiente ni acredita el uso asistencial.

## Alcance y método

Revisión de `auditCrossDomain`, composición del plan integral, integración de candidatos, fichas farmacológicas y calendario de actuaciones confirmadas. Se introducen señales agudas aisladas, sin diagnósticos declarados, y se comparan estados con estabilidad ausente, no valorada o afirmada. Se revisan además antecedentes frente a problemas actuales y datos marcados no disponibles. La auditoría de interfaz anterior se conserva en `AUDITORIA_GLOBAL_2026-11-13.md`.

## Hallazgos reproducidos

| Hallazgo | Riesgo observado | Corrección |
| --- | --- | --- |
| S01 · bloqueo transversal incompleto | Una ficha con solo `cetoacidosis_sospecha=Sí` generaba alerta inmediata, pero `audit.requiresResolution=false` y `plan.globalHold=false`. Con `acidosis_metabolica=Sí` no se producía prioridad transversal. La respuesta dependía de la activación de DM2/insulina o de la contradicción con estabilidad. | Se conserva cada señal aguda afirmativa en la puerta común, aunque no haya diagnóstico o módulo activado. |
| S02 · alertas locales sin barrera común | LRA, hipoxia, pancreatitis, deshidratación o pérdida súbita de visión tenían cobertura desigual entre motores; una vista podía retener su salida mientras otra conservaba candidatos. | Siete señales actuales tienen regla crítica común. Enfermedad aguda grave y cirugía/ayuno requieren revisión del contexto antes del tratamiento rutinario. Cirugía/ayuno no se etiqueta por sí sola como emergencia. |
| S03 · calendario divergente | La pantalla farmacológica calculaba directamente `followUpFromHistory`, mientras el plan integral conciliaba seguridad y estado actual. La misma referencia podía mostrarse prevista y retenida según la vista. | El calendario reutiliza controles e historial archivado del plan integral. Conserva fecha/documentación, pero distingue referencia retenida, plazo superado y sustituido. |

«Critical» es una barrera del software, no un diagnóstico ni una categoría universal de urgencia. No se añaden dosis o cambios de pauta. Una alarma no se elimina por faltar respuesta a estabilidad ni se atribuye automáticamente a un medicamento. Las decisiones sobre tratamiento requieren valoración del profesional conforme a su ficha técnica.

## Contraste de fuentes primarias

| Fuente consultada | Localizador | Regla verificada y límite |
| --- | --- | --- |
| [CIMA Jardiance](https://cima.aemps.es/cima/dochtml/ft/114930014/FT_114930014.html) | 4.4 · Cetoacidosis | Evaluación inmediata ante sospecha independientemente de glucemia; se describen casos sin diabetes. La FT exige suspensión inmediata de empagliflozina ante sospecha/diagnóstico; la app no ejecuta ni registra una suspensión no confirmada. |
| [CIMA Metformina Tarbis 850/1000](https://cima.aemps.es/cima/dochtml/ft/76579/FT_76579.html) | 4.3–4.4 | Acidosis aguda, deterioro renal y procesos con hipoxia/deshidratación requieren revisar seguridad. La contraindicación de una ficha concreta no se extrapola a toda molécula. |
| [CIMA Wegovy subcutáneo](https://cima.aemps.es/cima/dochtml/ft/1211608006/FT_1211608006.html) | 4.4 · Pancreatitis, NOIANA y deshidratación | Se distingue pancreatitis sospechada de antecedente; pérdida súbita de visión requiere examen, sin diagnóstico automático de NOIANA. Interrumpir semaglutida ante sospecha de pancreatitis; para NOIANA, la interrupción indicada exige confirmación diagnóstica. |

La barrera común que retiene nuevas decisiones crónicas es una elección conservadora del producto. No se presenta como una recomendación literal de una guía para todas las combinaciones posibles. No se revalidaron exhaustivamente dosis, interacciones ni toda la bibliografía de los módulos.

## Pruebas de regresión

Base anterior: 925 pruebas Node. Tras la corrección: **957/957 superadas, cero fallos**, más comprobación de sintaxis. Los 32 casos nuevos cubren señales afirmativas con tres estados de estabilidad, controles negativos, barrera farmacológica y conservación del plazo histórico; incluyen una prueba de navegación del calendario.

Archivos: `tests/auditoria-aguda-transversal.test.mjs` y `tests/seguimiento-seguridad-ui.test.mjs`. La prueba de calendario distingue una referencia activa con contexto suficiente de otra retenida. Ningún caso nuevo prescribe ni da por realizada una modificación farmacológica.

Se añade a `qa/browser-audit.mjs` la reproducción en navegador de cetoacidosis sin diagnóstico y su calendario retenido. Resultado comprobado en [GitHub Actions 43357982704](https://github.com/olsanju-hub/CaReMe/actions/runs/43357982704), commit `6eec09f7cf637a9d42bd5bf6ba87684e16b8ab6b`: **156/156 comprobaciones superadas, cero fallos**. Son 39 por perfil: Chromium escritorio 1280×900, Chromium móvil 390×844, WebKit móvil 390×844 y WebKit estrecho 320×740. Se ha revisado el recuento del registro de ejecución. Incluye el nuevo caso de cetoacidosis sin diagnóstico y calendario retenido, además de la cobertura de navegación/privacidad/offline anterior.

La revisión final de la pantalla añade motivos de retención y aviso explícito de registros incompatibles, sin borrar la fecha de actuaciones válidas. Los 957 casos Node se han repetido tras estos ajustes. La caché v0-30 distribuye la versión actual.

## Brechas que permanecen

- Revisión clínica independiente por profesionales ajenos a esta implementación y validación de escenarios asistenciales.
- Cálculo interno SCORE2-OP y otras variantes, KFRE y discrepancia renal CKM ya registrada.
- Titulación individual por producto, interacciones y situaciones específicas aún parciales.
- Instalación y pruebas en iPhone físico; auditoría completa de accesibilidad.

PR #4 en borrador, sin fusión ni publicación. Este informe no declara el MVP completo ni la paridad clínica con GlucoGuía.

## Comprobación de la versión funcional final

Commit `f94e9466be17109db09a33e3f85fc0f958f9ce20`: verificación Node y navegador superadas en [Actions 43358244818](https://github.com/olsanju-hub/CaReMe/actions/runs/43358244818) y [Actions 43358244764](https://github.com/olsanju-hub/CaReMe/actions/runs/43358244764), respectivamente. Se confirma de nuevo 957 pruebas Node y 156 comprobaciones Chromium/WebKit, sin fallos. Esta ejecución incluye los motivos visibles de retención y el aviso de registros históricos incompatibles.
