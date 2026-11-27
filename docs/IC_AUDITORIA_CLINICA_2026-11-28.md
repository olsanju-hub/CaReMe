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
