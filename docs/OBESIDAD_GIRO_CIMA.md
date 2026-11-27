# Obesidad: recorrido funcional y auditoría

Revisión: 12/11/2026. Se completa el recorrido funcional previsto para este bloque. Obesidad sigue parcial en la matriz global porque faltan validación clínica independiente y QA real. No es un prescriptor ni una autorización quirúrgica. PR #4 en borrador.

## Auditoría previa y fuentes

Existían formulario y fichas incretínicas, pero faltaba una salida propia que relacionara objetivos, hábitos, riesgo muscular, evolución y derivación. Se verificaron GIRO 2.0 (abril2025), el marco EASO2024 y las fichas CIMA vigentes de Wegovy subcutáneo/Mounjaro. Los criterios ampliados de cirugía se contrastaron con ASMBS/IFSO2022.

La guía redGDPS de obesidad2026 se localizó anunciada el 12/11/2026; no pudo verificarse su PDF íntegro. No se atribuyen a esa edición nuevas reglas ni dosis. Del algoritmo redGDPS2025 se utiliza únicamente la orientación de reevaluación trimestral; no se trasladan sus dosis ni afirmaciones de financiación. La comprobación farmacológica se hace por ficha actual del producto.

## Contrato y datos

`src/clinical/obesidad.mjs` ofrece `evaluateObesity(draft,mode)` y `classifyAdultBmi`. Modo rápido: evaluación inicial y prioridades. Detallado: añade objetivos e intervención adaptada, revisión farmacológica y seguimiento. No sustituye el diagnóstico clínico: `diagnosisEstablished=false`, `prescription=null`, `patientDose=null`, `surgeryEligibility=null`. Opciones y derivaciones conservan `performed=false`.

Peso/talla calculan IMC cuando están disponibles; en su ausencia puede utilizarse el IMC informado, con fecha. La diferencia >1 kg/m² entre ambos se retiene para conciliación: es tolerancia operativa, no umbral diagnóstico. Se controlan valores positivos, fechas reales y desbordamiento numérico. La clasificación IMC es descriptiva y no asigna EOSS. Cintura/talla informa revisión de adiposidad central sin sustituir la indicación CIMA. No se infiere composición corporal desde IMC.

La captura incluye acuerdo para abordar peso, revisión de complicaciones y estado funcional, además de tratamiento real. Una negativa a abordar el peso conserva atención disponible y no genera un plan impuesto. Los datos permanecen en memoria; no se guardan identificadores ni se transmite una derivación.

## Reglas y localizadores

| Componente | Salida | Fuente principal |
|---|---|---|
| Evaluación integral | Revisar complicaciones y salud funcional; IMC no basta para establecer obesidad clínica | GIRO bloque2; EASO tabla1 |
| Hábitos | Plan sostenible e individual; actividad/fuerza adaptadas y apoyo conductual | GIRO bloque3; EASO tabla1 |
| Riesgo muscular | Evaluación de fuerza/función y apoyo nutricional; adaptación necesaria antes de intensificar | GIRO pp.106–108; EASO tabla1 |
| Medicamentos | Revisar umbrales de ficha, respuesta previa y gravedad; no seleccionar dosis individual | GIRO recomendaciones60–66; CIMA4.1–4.6 |
| Cirugía | Valoración multidisciplinar; separar criterios clásicos y ampliados | GIRO pp.63–68; ASMBS/IFSO2022 |
| Seguimiento | Revisión trimestral orientativa desde plan realmente iniciado y confirmado | redGDPS2025, anillo de seguimiento |

### Intervención y seguridad

La salida nutricional no calcula déficit calórico ni gramos de proteína por kg. Con riesgo muscular exige plan adaptado; en ERC/IC señala individualización de proteína, sodio y líquidos. Si no hay limitaciones conocidas, la actividad aeróbica usa la referencia GIRO de al menos150 minutos semanales, progresando según tolerancia. Con limitación funcional o riesgo muscular, propone adaptación y supervisión, sin imponer ese objetivo.

La pérdida involuntaria/desnutrición y el bajo peso dirigen a valoración nutricional. La sospecha de TCA orienta atención especializada y retiene un plan restrictivo. Con edema/ascitis no se atribuye el cambio de peso a pérdida de grasa o eficacia. La sospecha secundaria/sindrómica orienta Endocrinología. Embarazo/lactancia y pediatría requieren circuito específico. Pancreatitis sospechada, deshidratación significativa o pérdida súbita de visión priorizan valoración aguda. La auditoría común mantiene las demás barreras de seguridad.

La integración multiorgánica evita generar el candidato `WEIGHT-REVIEW` cuando constan condicionantes nutricionales/etiológicos o riesgo muscular sin adaptación. Esto no impone la suspensión de otros tratamientos por sus indicaciones independientes.

### Objetivos y evolución

La pérdida porcentual y en kg se calculan únicamente con peso basal positivo, fechado y confirmado, anterior o igual al actual. No se usa cero para datos ausentes. El objetivo puede ser reducción ponderal o mantenimiento/función; se documenta un objetivo de salud. No se impone una pérdida universal del5%. Un objetivo que conduciría a IMC <18,5 exige revisión.

Una ganancia aparece con signo negativo en la pérdida. Las medidas anteriores al inicio confirmado del plan no demuestran su respuesta. El cambio aislado no constituye fracaso terapéutico. Alcanzar el objetivo orienta mantenimiento y revisión de complicaciones, sin retirada automática de fármacos.

### Revisión farmacológica

Las opciones nuevas se plantean tras revisión detallada y seguridad suficiente: umbral de indicación, objetivos no alcanzados/reganancia tras intervención previa o complicación grave que justifique valoración temprana. Se reutiliza `reviewDrug` y sus barreras por producto.

Solo se enlazan desde esta ruta las fichas ya verificadas de semaglutida subcutánea para peso y tirzepatida. Ozempic no se ofrece como indicación de obesidad sin DM2; no se intercambian formulaciones. Wegovy mantiene su restricción renal específica; no se extrapola a tirzepatida. Otros productos necesitan revisión individual; este bloque no cierra el catálogo farmacológico completo.

El tratamiento actual necesita identificación, dosis y adherencia verificadas. Una incretina ya utilizada impide proponer otra como inicio adicional. Problemas de tolerancia exigen revisión antes de fijar control rutinario. Un IMC actual inferior al de inicio no implica retirada. Tampoco se aplica una regla universal de suspensión por no alcanzar5% de pérdida. Autorización, financiación y acceso son cuestiones distintas que no se infieren aquí.

### Valoración quirúrgica

Con IMC≥40 o ≥35 más comorbilidad, se propone valoración de unidad multidisciplinar según GIRO. IMC≥35 sin comorbilidad identifica la discusión de criterios ampliados ASMBS/IFSO, no elegibilidad local automática. En IMC30–34,9 y respuesta insuficiente se orienta valoración especializada, considerando cirugía metabólica si DM2 y discusión individual en otros casos. La aplicación no autoriza una técnica ni comprueba requisitos locales de acceso.

### Seguimiento

Solo un plan marcado como acordado/iniciado, con confirmación y fecha efectiva coherente, genera revisión orientativa a tres meses naturales. Se ajusta al último día del mes si es necesario. Las propuestas no se consideran iniciadas y no crean citas. Un plazo pasado exige revisar contactos ya realizados; no demuestra falta de asistencia. No es un calendario de titulación. La seguridad/tolerancia pueden exigir contacto anterior.

## Interfaz y auditoría posterior

Resultado en rápida, detallada y resumen de consulta; acceso desde ficha integral y herramientas. La captura detallada agrupa hábitos, objetivos y seguridad en desplegables, sin duplicar campos. Editar datos retira el resultado visible; disponibilidad se reevalúa con el nuevo borrador. Se conservan seis consultas y todos los datos compartidos.

`npm run check`: **853 pruebas superadas, 0 fallos**, incluida sintaxis. Base759: se añaden94 escenarios de obesidad/interfaz. Se comprueban fronteras IMC, procedencia antropométrica, objetivos, riesgo nutricional y seguridad farmacológica, además de fechas y criterios de derivación. Interfaz con DOM simulado; no equivale a prueba real de instalación/offline o iPhone.

Pendientes: revisión clínica independiente, QA real, catálogo/titulación completa por producto y EOSS. Se actualizan alcance y cobertura sin declarar MVP o paridad clínica completos. Siguiente trabajo transversal: integrar los objetivos y seguimiento de todos los dominios y cerrar validación antes de publicar.

## Fuentes primarias

1. [SEEDO. GIRO2.0, abril2025, versión completa de GuíaSalud](https://portal.guiasalud.es/wp-content/uploads/2025/10/gpc_650_obesidad_seedo_compl.pdf).
2. [Busetto et al. EASO. Nat Med.2024;30:2395–2399. DOI10.1038/s41591-024-03095-3, texto de la sociedad](https://easo.org/wp-content/uploads/2025/03/EASO-Framework-final-edited-version-.pdf).
3. [ASMBS/IFSO. Indications for Metabolic and Bariatric Surgery2022](https://asmbs.org/wp-content/uploads/2023/09/ASMBS-IFSO-Guidelines-2022-PIIS1550728922006414.pdf).
4. [AEMPS-CIMA. Wegovy subcutáneo, 1211608006](https://cima.aemps.es/cima/dochtml/ft/1211608006/FT_1211608006.html).
5. [AEMPS-CIMA. Mounjaro, 1221685002](https://cima.aemps.es/cima/dochtml/ft/1221685002/FT_1221685002.html).
6. [redGDPS. Algoritmo de obesidad2025](https://www.redgdps.org/algoritmoobesidad/algoritmo_OBESIDAD_v4.pdf). Fuente del intervalo de reevaluación, no de posología ni financiación.
