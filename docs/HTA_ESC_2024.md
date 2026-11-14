# PA e HTA: primer algoritmo dirigido

Fecha: 12/11/2026. Base: d7bd9f5d86d73fa397d4e15bc8bfc8fbe4bae91b. Rama feat/prototipo-interfaz, PR #4.

## Auditoría previa

La matriz original conservaba HTA como ausente. Existían captura de PA y barreras específicas de IC, pero faltaban un recorrido propio, interpretación de AMPA/MAPA, patrones discordantes y revisión de objetivos. La base reproducía 521 pruebas. Se comprobó la guía ESC 2024 en la fuente oficial y su texto original antes de implementar.

## Fuente primaria y reglas clínicas

[ESC 2024, guía completa](https://academic.oup.com/eurheartj/article/45/38/3912/7741010), tabla 5 y secciones 5, 6, 8 y 10; [página oficial](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/elevated-blood-pressure-and-hypertension/).

Consulta: umbral diagnóstico 140/90; AMPA/MAPA diurna: 135/85; MAPA 24 h: 130/80; nocturna: 120/70 mmHg, superable por cualquiera de los componentes. PA de consulta elevada: 120–139 sistólica o 70–89 diastólica, sin alcanzar HTA. Se requiere confirmación mediante mediciones adicionales; preferentemente fuera de consulta, o repetidas en otra visita si no es factible.

PA ≥180 sistólica o ≥110 diastólica exige valorar daño agudo; una cifra sola no establece emergencia. Tras descartar daño agudo, confirmar preferentemente dentro de una semana. El rango 160–179/100–109 requiere confirmación pronta, dentro de un mes.

Objetivo de referencia tratado: 120–129/70–79 si se tolera. Se individualiza ante edad ≥85, ortostatismo sintomático, fragilidad o expectativa limitada. Revisiones durante ajustes: aproximadamente cada 1–3 meses, buscando control en unos tres meses.

## Contrato y separación de decisiones

`evaluateHypertension` devuelve patrón, alertas, datos necesarios, comprobaciones, referencia de objetivo y opciones generales para revisión. No confirma automáticamente diagnósticos, prescribe, registra actuaciones o genera citas. El criterio de presión CKM 130/80 no se traslada como umbral diagnóstico español de HTA.

Las cifras compartidas PAS/PAD se consideran de consulta solo tras declarar técnica estandarizada/media y fecha. AMPA y cada periodo de MAPA tienen campos, método y procedencia propios. Se requiere que el profesional revise validez del registro. No se agregan lecturas crudas ni se verifica automáticamente cumplimiento de protocolo/dispositivo.

Con medias válidas en ambos ámbitos se distinguen elevación sostenida, patrón compatible con bata blanca y patrón compatible con HTA enmascarada. En personas tratadas se nombran efecto de bata blanca o posible mal control enmascarado, evitando etiquetar una HTA nueva. La historia conocida no desaparece porque la PA actual esté controlada. No se diagnostica resistencia por contar clases.

Las señales de alarma conservan prioridad aunque falte PA o haya selección contradictoria de ausencia/presencia. La cifra muy elevada aportada en consulta o fuera también retiene el circuito rutinario hasta repetir/valorar actualidad y contexto. Las nuevas reglas `BP_SEVERE_REVIEW` y `BP_ALARM_REVIEW` se integran en auditoría común, reteniendo candidatos de los demás motores.

## Objetivos y revisión farmacológica

El objetivo numérico se muestra únicamente con tratamiento/HTA conocida, contexto básico completo, técnica documentada y tolerancia revisada. Además de las excepciones de la guía, este primer bloque retiene la referencia intensiva automática en ERC avanzada; eso es una precaución de implementación, no una nueva recomendación universal de objetivo renal.

Una opción de revisión de inicio aparece únicamente ante HTA previamente confirmada, elevación sostenida, ausencia de tratamiento y comprobaciones de seguridad. Menciona clases de primera línea como referencia de guía, pero exige verificación por molécula en CIMA antes de cualquier prescripción. No se han añadido dosis ni se ha completado el catálogo antihipertensivo por producto en este incremento.

La barrera operativa para presentar esa opción exige TFGe/fecha, conciliación, alergias revisadas, potasio con fecha y 3,5≤K<5,0, junto a contexto de fragilidad/ortostatismo/expectativa. Es un filtro conservador de entrada; no define contraindicaciones universales ni sustituye el rango del laboratorio o las fichas técnicas. Un valor fuera retiene la propuesta, no ordena retirar medicamentos.

En persona ya tratada se prioriza revisar adherencia, dosis y contexto antes de intensificar. En PA elevada sin HTA conocida ni tratamiento, el panel solicita evaluación global de riesgo; si existe alto riesgo documentado y persistencia tras hábitos, señala revisión profesional, sin pauta. No trata un resultado de riesgo desconocido como riesgo bajo ni asume que una estimación externa sea cálculo propio validado.

## Auditoría posterior

573/573 pruebas locales superadas, cero fallos y sintaxis correcta. Se añadieron 52 casos: umbrales por método, patrones tratados/no tratados, calidad, fechas, alarmas sin PA, excepción geriátrica/renal, procedencia, ausencia de condiciones farmacológicas y retención transversal. Se revisó también que una persona con HTA conocida y tratada no reciba el texto de PA elevada sin HTA confirmada. Las pruebas de interfaz usan DOM simulado.

La UI ofrece captura inicial y una sección desplegable para AMPA/MAPA, objetivos y tratamiento. Accesos en inicio, herramientas y resumen integral, manteniendo las seis consultas originales. El motor está en la lista permitida del servidor y en caché estática versionada. No hubo pruebas visuales reales ni iPhone.

## Pendientes

- Algoritmos completos por principio activo/dosis, combinaciones y titulación con CIMA individualizada.
- Hipertensión resistente/secundaria y circuitos de derivación completos.
- Incorporar validación de protocolos/lecturas y evolucionar seguimiento longitudinal.
- Revisión clínica independiente, QA real y accesibilidad antes del uso asistencial.

La matriz original pasa HTA de ausente a parcial. No se cierra el MVP. PR en borrador, sin fusión.
