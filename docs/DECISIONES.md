# Registro de decisiones de CaHReMe

Fecha: 2026-11-11

## Aprobado en conversación

| Tema | Decisión |
| --- | --- |
| Repositorio | `olsanju-hub/CaReMe` (privado), independiente de NexoClx |
| Nombre visible | `CaHReMe` (nombre de trabajo sujeto a comprobación registral) |
| Color | Atlántico: `#173347`, `#138B8B`, `#F3F7F8`, `#DCEEEE` |
| Tipografía | Inter |
| Icono principal | Variante A, **última revisión cromática seleccionada**: cuatro lóbulos interconectados; corazón arriba, riñones a la izquierda, hígado a la derecha y figura humana abajo |
| Iconografía de módulos | Ilustraciones anatómicas creíbles, coherentes entre sí, más expresivas que los iconos estándar |
| Inicio | Dashboard |
| Captura | Evaluación guiada por etapas, con datos parciales si es seguro |
| Consultas contextuales | Paneles inferiores auxiliares |
| Resultado | Vista completa con prioridades terapéuticas, seguridad, plan y seguimiento |

## Marco clínico
Abordar cardiovascular, renal, hepático y metabólico como dominios relacionados. Usar escalas validadas por dominio, **no inventar un índice compuesto**. Diferenciar CKM de propuestas emergentes de integración hepática según la evidencia y el nivel de consenso. Mantener fuentes/versiones auditables por cada decisión terapéutica.

## Pendiente
1. Comprobación formal de nombre/marca.
2. Exportar icono seleccionado a PNG y SVG o equivalente, variantes y tamaños PWA.
3. Precisar el conjunto mínimo de datos y los casos de uso del MVP.
4. Validar bibliografía y diseñar matriz de reglas clínicas.
5. Programar y probar antes de cualquier uso asistencial.

## Regla de avance
El desarrollo visual no autoriza inventar criterios clínicos; toda recomendación con efecto asistencial requiere especificación clínica revisada y casos de prueba.

## Avance técnico del prototipo (2026-11-11)

- Se han incorporado SVG vectoriales originales de cuatro dominios como recursos **provisionales** para validar el layout, no como diseños finales aprobados.
- Se ha incorporado un símbolo provisional de PWA `public/icon-concept.svg`. **No se debe confundir con la tercera versión del icono A aprobada en conversación**, cuyo archivo de producción sigue pendiente de integrar.
- Se ha configurado un manifiesto web y un service worker que solo guarda recursos estáticos; los datos de formulario se mantienen en memoria, sin persistencia.
- Se ha restringido el servidor de desarrollo a una lista explícita de archivos públicos para evitar exponer archivos del repositorio.
- Todos los cambios siguen en una rama de revisión; no se han fusionado automáticamente con `main`.
