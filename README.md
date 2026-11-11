# CaHReMe

**Evaluación cardiorrenal-hepatometabólica — prototipo funcional de captura, sin motor clínico.**

**Repositorio:** `olsanju-hub/CaReMe` · **Nombre visual:** CaHReMe (de trabajo)

## Propósito
PWA independiente de apoyo a la decisión clínica en Atención Primaria en España. Evaluación integrada de los dominios **cardiovascular, renal, hepático y metabólico**, sin reducir la app a diabetes mellitus.

> Estado: **prototipo de interfaz (iteración A, en revisión)**. No contiene algoritmos clínicos verificados y **no debe utilizarse para decisiones asistenciales**.

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

Incluye entrada integral o dirigida, captura por secciones, distinción entre campo registrado/no disponible/sin registrar/por revisar y resumen no interpretativo. **No guarda datos** en el navegador ni los envía a servicios externos; al recargar se pierde el formulario. No introducir datos identificativos.

**Pendiente:** integrar el icono final aprobado y las ilustraciones anatómicas en tamaños adecuados; validar la experiencia móvil y accesibilidad; incorporar el manifiesto y funcionalidad PWA. El logotipo tipográfico actual es provisional y no sustituye el icono elegido.

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
| Evidencia y especificaciones clínicas | Pendiente |
| Motor de evaluación y recomendaciones | Pendiente |
| Interfaz y PWA | Prototipo inicial en rama de revisión; PWA pendiente |
| Icono final exportado | Pendiente |
| Pruebas y validación clínica | Pendiente |
| Despliegue | Pendiente |

## Criterios de calidad
No inventar umbrales ni dosis. Verificar versiones de las guías, contraindicaciones y fichas CIMA-AEMPS. Separar lo recomendado de lo efectivamente ejecutado. Mantener registro de fuentes y pruebas. No copiar código o recursos protegidos de otras aplicaciones sin licencia. No incorporar datos personales reales a repositorio ni pruebas.

**Marca:** CaHReMe es un nombre de trabajo; su disponibilidad jurídica y posibles colisiones deben comprobarse antes de publicarlo como marca.
