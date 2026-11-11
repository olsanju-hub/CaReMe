# CaHReMe

**Evaluación cardiorrenal-hepatometabólica — prototipo con formularios y cálculos descriptivos, sin prescripción.**

**Repositorio:** `olsanju-hub/CaReMe` · **Nombre visual:** CaHReMe (de trabajo)

## Propósito
PWA independiente de apoyo a la decisión clínica en Atención Primaria en España. Evaluación integrada de los dominios **cardiovascular, renal, hepático y metabólico**, sin reducir la app a diabetes mellitus.

> Estado: **prototipo funcional (iteración A + primer bloque B), en revisión**. Calcula categorías G/A (KDIGO 2024) y FIB-4 (EASL 2024) con límites de interpretación. No contiene recomendaciones terapéuticas validadas y **no debe utilizarse para decisiones asistenciales**.

## Requisito funcional de referencia

CaHReMe cubre ya la **navegación y captura de datos** de seis consultas inspiradas en GlucoGuía y debe completar su **lógica clínica validada** (DM2, IC, ERC, sobrepeso/obesidad, enfermedad hepática metabólica e insulinización), **con consulta rápida, detalle y resultados equivalentes en funcionalidad**, ampliadas con evaluación integral, datos compartidos, recomendaciones clínicas trazables y seguimiento. **El motor de resultados clínicos sigue pendiente.** Véase [matriz de equivalencia y brechas](docs/MATRIZ_EQUIVALENCIA_GLUCOGUIA.md).

## Primer bloque del motor clínico — cálculos descriptivos

- `src/clinical/engine.mjs`: categorías G1–G5 y A1–A3 desde TFGe/CAC, sin deducir el diagnóstico de ERC por una medición aislada.
- Cálculo FIB-4 desde edad, AST, ALT y plaquetas, con exclusión de interpretación en enfermedad aguda, contexto inadecuado y precaución en menores de 35 años; umbral ajustado en >65 años.
- Herramientas y resúmenes renal/hepático muestran resultados, limitaciones y vínculo a la fuente; faltantes no se transforman en cero.
- `tests/clinical.test.mjs`: umbrales exactos, casos de referencia y estados no evaluables.
- Documento [Fuentes y reglas clínicas](docs/FUENTES_CLINICAS.md).
- **Estas funciones no están aprobadas para uso asistencial.** Las reglas terapéuticas siguen sin implementar.

## Estado de las seis consultas (iteración A.2)

- Se han implementado **seis pantallas dirigidas**, cada una con pestañas de **consulta rápida**, **revisión detallada** y **resumen de datos**.
- Los campos habituales —TFGe, HbA1c, medicación, etc.— comparten un único estado de evaluación mientras la app está abierta, sin duplicar valores al cambiar de módulo.
- Se admite selección simultánea de comorbilidades y clases farmacológicas. Los campos tienen estado registrado, ausente, no disponible o por revisar.
- Se conserva además el séptimo acceso a **evaluación integral** del paciente.
- **No se ha implementado el motor clínico de interpretación, cálculo o tratamiento**; la paridad de resultados con GlucoGuía sigue pendiente de verificación científica y desarrollo. No utilizar para decisiones asistenciales.
- Pruebas automatizadas de rutas, captura y reutilización de datos; renderizado en dispositivos reales pendiente de revisión.

## Funcionalidades previstas
- Entrada por paciente; consulta rápida y evaluación avanzada, con tratamiento explícito de información ausente.
- Estadificación y cálculo por dominio usando herramientas validadas, con límites de aplicabilidad.
- Motor de decisión terapéutica integrada, con recomendaciones justificadas y seguridad farmacológica verificada en fuentes actuales y CIMA-AEMPS.
- Objetivos, controles, reevaluación, intensificación y criterios de derivación.
- Funcionamiento mobile-first y, cuando sea viable, local; sin datos identificativos de pacientes en la primera versión.

## Identidad y navegación aprobadas
- **Paleta Atlántico:** azul petróleo `#173347`, turquesa `#138B8B`, blanco frío `#F3F7F8`, verde agua `#DCEEEE`.
- **Fuente:** Inter.
- **Icono:** concepto A, tercera variante coloreada: cuatro lóbulos conectados; corazón arriba, riñones a la izquierda, hígado a la derecha y figura humana abajo. **Asset final pendiente de incorporar.**
- **Iconos internos:** ilustraciones anatómicas reconocibles, de estilo editorial, evitando imágenes artificiales recargadas.
- **Ventanas:** dashboard de inicio; evaluación guiada; paneles de información auxiliar; resultados clínicos completos.
- **Independencia:** no fusionar con NexoClx AP, Urg, 061 o Ped.

Documentación: [Documento rector v0.1](docs/DOCUMENTO_RECTOR.md) · [Alcance e iteraciones del MVP](docs/MVP.md) · [Flujo de consulta](docs/FLUJO_DE_CONSULTA.md) · [Decisiones del proyecto](docs/DECISIONES.md).

## Vista previa privada en GitHub Codespaces

[**Abrir o reanudar CaHReMe en Codespaces**](https://codespaces.new/olsanju-hub/CaReMe/tree/feat/prototipo-interfaz?quickstart=1)

1. Inicia sesión en GitHub y pulsa **Create codespace** la primera vez; para sesiones posteriores, **Resume this codespace**.
2. Al abrirse el editor web, la configuración inicia el servidor de prueba en el puerto **4173**.
3. Abre la notificación **Open in Browser** o la pestaña **Ports** y selecciona **CaHReMe — abrir interfaz**. Si no arranca, ejecuta `npm run dev` desde el terminal.
4. Usa datos sintéticos. Al recargar el formulario se pierden; no hay backend ni persistencia.

El Codespace y el puerto de vista previa son **privados** y requieren tu sesión de GitHub. Esta vista previa es una máquina de desarrollo; puede consumir la cuota de Codespaces. Deténla cuando termines de revisar. La URL de GitHub Pages aún no existe.

## Prototipo local (rama `feat/prototipo-interfaz`)

Requiere Node.js 20 o superior (sin dependencias npm externas):

```bash
npm run dev
```

Abrir `http://localhost:4173`. Para ejecutar pruebas y comprobar sintaxis:

```bash
npm run check
```

Incluye entrada integral o dirigida, captura por secciones, distinción entre campo registrado/no disponible/sin registrar/por revisar y resumen no interpretativo. Dispone de manifiesto PWA y caché **exclusivamente de los archivos estáticos** para pruebas de instalación y funcionamiento sin conexión una vez cargado. **No guarda datos** en el navegador ni los envía a servicios externos; al recargar se pierde el formulario. No introducir datos identificativos.

**Recursos provisionales:** se han añadido cuatro ilustraciones anatómicas SVG originales y un símbolo SVG de instalación como **alternativa temporal**. El icono A de la tercera variante aprobada (ilustración rica en color, corazón superior, riñones, hígado y silueta humana en cuatro lóbulos) **no ha sido sustituido ni incorporado como archivo definitivo**. Queda pendiente exportarlo, contrastar su legibilidad en tamaños pequeños, instalarlo como icono principal y confirmar diseño en pantalla real. El SVG incluido no es el diseño final. No se han activado algoritmos médicos.

## Plan por fases
1. Documento rector y matriz de evidencia actualizada.
2. Modelo de datos y recorrido de consulta.
3. Algoritmos y reglas clínicas trazables por fuente y versión.
4. Diseño final de interfaz e identidad gráfica.
5. Implementación modular y pruebas de software.
6. Validación clínica con casos de referencia y escenarios de seguridad.
7. Despliegue y mantenimiento científico.

## Estado de implementación

| Componente | Estado |
| --- | --- |
| Documentación inicial | Borrador v0.1 disponible para revisión |
| Evidencia y especificaciones clínicas | KDIGO G/A y EASL FIB-4 documentadas; resto pendiente |
| Motor de evaluación y recomendaciones | Cálculos G/A y FIB-4 implementados; recomendaciones pendientes |
| Interfaz y PWA | Prototipo en rama de revisión; manifiesto PWA y caché estática implementados; validación visual e instalación pendientes |
| Icono final exportado | Pendiente |
| Pruebas y validación clínica | Pendiente |
| Despliegue | Pendiente |

## Criterios de calidad
No inventar umbrales ni dosis. Verificar versiones de las guías, contraindicaciones y fichas CIMA-AEMPS. Separar lo recomendado de lo efectivamente ejecutado. Mantener registro de fuentes y pruebas. No copiar código o recursos protegidos de otras aplicaciones sin licencia. No incorporar datos personales reales a repositorio ni pruebas.

**Marca:** CaHReMe es un nombre de trabajo; su disponibilidad jurídica y posibles colisiones deben comprobarse antes de publicarlo como marca.
