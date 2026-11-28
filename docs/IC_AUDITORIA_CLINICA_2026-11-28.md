# Auditoría clínica de IC — registro de control
Fecha: 2026-11-28. Base: v0.101, rama feat/prototipo-interfaz. Rama de trabajo: audit/ic-validacion-clinica. No fusionar ni publicar hasta revisión y pruebas.

## P0: documentación (en curso)
- ESC 2026: European Heart Journal 47(38), 5346–5457; DOI 10.1093/eurheartj/ehag100. Registro editorial y extractos contrastados: https://academic.oup.com/eurheartj/article/47/38/5346/8766302 ; https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/heart-failure ; https://pubmed.ncbi.nlm.nih.gov/42661420/ . El acceso automatizado al texto editorial completo sigue fallando; no se declara auditada la guía completa.
- Titular del proyecto declara el 28/11/2026 disponer de autorización de uso de la guía. Alcance documental de incorporación a software y distribución no comprobado por el auditor; conservar el permiso.
- Jerarquía de evidencia: recomendación clínica ESC y condición regulatoria de cada ficha técnica son campos distintos. Si discrepan, documentar la discrepancia; no convertir la ficha de una presentación en regla universal del principio activo.
- CIMA: Aldactone 25 mg, apartados 4.1–4.5: https://cima.aemps.es/cima/dochtml/ft/39059/FT_39059.html ; espironolactona Accord: https://cima.aemps.es/cima/dochtml/ft/81033/FichaTecnica_81033.html ; eplerenona STADA: https://cima.aemps.es/cima/dochtml/ft/76182/FT_76182.html ; eplerenona Kern: https://cima.aemps.es/cima/dochtml/ft/76353/FT_76353.html ; Kerendia 40 mg: https://cima.aemps.es/cima/dochtml/ft/1211616012/FT_1211616012.html ; sacubitrilo/valsartán Normon: https://cima.aemps.es/cima/dochtml/ft/91063/FT_91063.html . Consultadas 28/11/2026. Pendiente completar inventario por presentación/indicación.
## Correcciones prioritarias preliminares (P4/P5)
- Añadidas alertas de trimetoprim/cotrimoxazol con los tres ARM y de inhibidores fuertes de CYP3A4 con eplerenona/finerenona. Coincidencias exactas de un repertorio limitado de nombres, NO normalización completa ni comprobador integral.
- ARNI + aliskireno: alerta roja si FG confirmado <60; ámbar si no consta ese criterio. Diabetes también determina contraindicación según ficha, pero falta automatizar su identificación: el texto de alerta exige comprobarla.
- Espironolactona: alerta si K confirmado >5 según ficha de Aldactone, roja a partir de 6 como prioridad de valoración clínica. El código no ordena suspensiones.
- Propuesta de ARM esteroideo en NYHA II: sustituida sugerencia de dosis de inicio genérica por revisión de la indicación de la presentación y criterios específicos de eplerenona. No implica que los ARM estén contraindicados en todos los pacientes NYHA II. Pendiente conciliar recomendación ESC, ficha, función renal y situación clínica, y restituir opciones pertinentes.
- Referencia de finerenona corregida a ficha actual de 40 mg con indicación IC.
- Pruebas de regresión añadidas al archivo tests/ic-suspicion.test.mjs. Ejecución no confirmada; no declarar pruebas superadas.
## Fases pendientes
P0 completar texto y referencias; P1 diagnóstico; P2 clasificación; P3 inventario farmacológico; P4 interacciones/seguridad (incluye amilorida, triamtereno, suplementos de K, inductores CYP3A4, etc.); P5 tratamiento y ajustes por medicamento, indicación, tolerancia y evolución; P6 pruebas, revisión independiente y alcance regulatorio. Ninguna fase se considera cerrada.
## Condiciones de salida
No asumir ausencia de riesgo por falta de alerta; no automatizar con información insuficiente; revisión independiente cardiología/farmacia; pruebas negativas, límites y regresión; documentar cobertura y cambios; verificar permiso de distribución y requisitos regulatorios. Conservar interfaz aprobada y no modificar producción durante la auditoría.


## Actualización documental: PDF entregado por el titular
Archivo de referencia local «ICC 2026.pdf», 112 páginas, edición anticipada, DOI 10.1093/eurheartj/ehag100, SHA-256 cb022202b460f59b73a02acd56dc931a5175c950b54e7818b5b58ca60a7f8ebc. Se ha inspeccionado el texto y las figuras originales. El documento principal está disponible en su integridad; no se sube el PDF al repositorio público. Pendiente cotejar correcciones de la edición final y recuperar suplementos S4–S9 (uso práctico de fármacos) y S11 (investigación de IC descompensada): https://academic.oup.com/eurheartj/article-lookup/doi/10.1093/eurheartj/ehag100#supplementary-data .
### Matriz de contraste inicial P1/P2/P5
Páginas de la edición aportada:
- P1, §5.1, pp.21–24, figura 4 y recomendación 3: estudio basal compatible con hemograma, función renal y UACR, electrolitos, función hepática/tiroidea, glucemia (HbA1c), lípidos, ferritina/TSAT, ECG/Rx, péptidos y ecocardiografía. Pendiente auditar flujo completo, datos no disponibles y causas de falsos negativos. 
- Figura 4, p.23: BNP ≥35 orienta a ecocardiografía si sospecha clínica. Corregido NP-03; NT-proBNP >2000, eco y revisión especializada preferentemente en dos semanas; la urgencia clínica prevalece. Edad 75: el diagrama explicita banda ≥75 (500); se mantiene cautela con resultados inferiores. La descripción de texto p.22 es menos precisa. 
- §7.2 p.42 y figura 11 p.43: confirmados umbrales de exclusión y orientación por edad en IC descompensada; >5000 NT-proBNP marcador de muy alto riesgo, ingreso generalmente recomendado. La unidad de BNP en la leyenda de figura 11 parece errata; confirmar fuente antes de cambios de unidad.
- P2, §3.3.1 p.16, figura 2 p.17 y §5.2 pp.24–25: dos fenotipos, <50 y ≥50; la FEVI mejorada requiere incremento absoluto ≥10 puntos y FEVI >40 con historia clínica. Referencia actualizada; revisión de contradicciones de historia pendiente. IC-FEp exige no haber tenido FEVI <50 y evidencia objetiva. Tabla 10: umbrales cuantitativos no automatizados todavía, deben actuar como apoyo y no como diagnóstico aislado. 
- Tabla 8 p.22: NYHA IV no exige síntomas en reposo, corregida definición; revisar captura de datos y señales de IC avanzada (tablas 14–15 pp.52–53).
- P5, §6.1.2–6.1.8 pp.31–36, tabla 11 pp.36–37 y recomendación 5 pp.37–38: tratamiento basal recomendado también en IC-FEr 41–49, aunque el pie e explicita ausencia de grandes ECA exclusivos en ese rango. Se explicita recomendación de SRAA y betabloqueante; no se automatiza dosis aún. ARM esteroideo en IC-FEr; en IC-FEp esteroideo o no esteroideo. Finerenona tiene indicación regulatoria desde FEVI ≥40, no equivale a preferencia ESC por fenotipo. En IC-FEp se añade revisión de IECA/ARA/ARNI (IIb C). 
- Recomendación 5: reevaluar titulación de FMT al menos cada 1–2 semanas según tolerancia; no confundir frecuencia de revisión con incremento de dosis autorizado. Mantener FMT aunque asintomático o FEVI mejorada (I C); retirada gradual excepcional (IIb C) con criterios estrictos y vigilancia especializada. Corregida información, no automatizada retirada.
- Tabla 11: revisar catálogo de fármacos ausentes, dosis, equivalencias de sal y formulación. Diferencia de límite FG de finerenona a 60 entre pie de tabla ESC y ficha CIMA previamente registrada: verificar regulación y contexto antes de automatizar.
- §6.1.6 p.35: no suspender FMT por hipotensión asintomática/tolerable sin evaluación, ni por cambios renales aislados; considerar situaciones de AKI, hiperpotasemia e inestabilidad y reintroducción posterior. Pendiente algoritmo específico.
Pruebas: añadidas/actualizadas pruebas unitarias de umbrales, clasificación y recomendaciones. No afirmar que han pasado hasta obtener resultado de ejecución.
Estado: P0 documento principal disponible, suplementos/versionado pendientes; P1/P2 contraste inicial y correcciones parciales; P3 pendiente; P4/P5 parcial; P6 pendiente. Mantener rama de producción sin cambios.

## Recepción de suplementos oficiales — 28/11/2026
- Documento principal definitivo: ehag100.pdf, EHJ 47(38), 5346–5457; DOI 10.1093/eurheartj/ehag100. Sustituye la edición anticipada como referencia editorial. Pendiente cotejo sistemático de versiones.
- ehag100_supplementary_data.pdf: 49 páginas, DOI coincidente, SHA-256 96ecc055086054a103b548d664fc0a80daf5e9702c7eace7c639f01fc97d7d2f.
- ehag100_evidence_tables.pdf: 1051 páginas, 111 tablas, SHA-256 59296c46ca40fc810e442b5d5b42fd8c2d0734df3bba7cf4fb4562ebdcc093ff.
- No se publican los PDF en GitHub. La disponibilidad de las fuentes ESC queda resuelta; no equivale a auditoría completada ni a comprobar posibles correcciones editoriales o todas las fichas CIMA.
### Índice operativo
- S2 p.9: etiología y pruebas adicionales. S3 p.10: comparativa ARM.
- S4 pp.10–12: IECA/ARA-II; S5 pp.12–14: ARNI; S6 pp.14–15: betabloqueantes; S7 pp.16–17: diuréticos; S8 pp.18–19: ARM; S9 pp.19–20: iSGLT2.
- S11–S16 pp.23–27: IC descompensada.
- Evidence Tables 17–19 pp.117–130: diagnóstico; 20–28 pp.131–190: etiología; 29–41 pp.191–325: tratamiento crónico.
### Hallazgos prioritarios para matriz P3–P5 (no implementados en este registro)
- S4/S5/S6: hipotensión asintomática no justifica automáticamente reducción o retirada. Evaluar congestión y otros fármacos antes de modificar FMT.
- S4/S5: diferenciar inicio y mantenimiento, cambios relativos de FG/creatinina, potasio, monitorización y reintroducción. S4 y S5 no son idénticas en criterios de interrupción; no extrapolar automáticamente.
- S6: pauta de bisoprolol para IC una vez al día; evaluar bradicardia sintomática, bloqueo AV, congestión y fármacos cronotropos; evitar retirada brusca salvo necesidad clínica.
- S7: precisar volemia, sodio, potasio, respuesta y contexto ambulatorio/hospitalario; no aplicar escalada fija de diurético.
- S3/S8: separar ARM esteroideos y finerenona, verificar ficha por indicación, potasio, función renal y dosis. La frontera de FG 60 en S8 requiere reconciliación con CIMA; no automatizar la discrepancia. Las pautas generales de S8 no sustituyen ajustes específicos de cada molécula.
- S9: separar inicio y continuación de iSGLT2 con deterioro renal; verificar límites de cada molécula en CIMA. Incorporar riesgo de cetoacidosis, depleción de volumen y medicación hipoglucemiante; no reiniciar solo por tiempo transcurrido.
- S4–S9: las recomendaciones prácticas se presentan como opinión experta sustentada en ensayos y experiencia; no atribuir a cada pauta una clase/nivel de evidencia de la recomendación de eficacia.
- Seguridad: ampliar normalización de principios activos y combinaciones; datos faltantes no equivalen a resultado negativo. Las alertas anteriores no cubren la totalidad de la medicación.
Estado: adquisición de fuentes ESC completada; revisión documental y clínica, reconciliación regulatoria, implementación y ejecución de pruebas siguen pendientes. No fusionar ni publicar.
