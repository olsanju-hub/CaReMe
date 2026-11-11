# CaHReMe

**Evaluación cardiorrenal-hepatometabólica — proyecto en diseño.**

**Repositorio:** `olsanju-hub/CaReMe` · **Nombre visual:** CaHReMe (de trabajo)

## Propósito
PWA independiente de apoyo a la decisión clínica en Atención Primaria en España. Evaluación integrada de los dominios **cardiovascular, renal, hepático y metabólico**, sin reducir la app a diabetes mellitus.

> Estado: planificación. **No contiene algoritmos clínicos verificados y no debe utilizarse todavía para decisiones asistenciales.**

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

Documentación: [Documento rector v0.1](docs/DOCUMENTO_RECTOR.md) · [Alcance e iteraciones del MVP](docs/MVP.md) · [Decisiones del proyecto](docs/DECISIONES.md).

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
| Interfaz y PWA | Pendiente |
| Icono final exportado | Pendiente |
| Pruebas y validación clínica | Pendiente |
| Despliegue | Pendiente |

## Criterios de calidad
No inventar umbrales ni dosis. Verificar versiones de las guías, contraindicaciones y fichas CIMA-AEMPS. Separar lo recomendado de lo efectivamente ejecutado. Mantener registro de fuentes y pruebas. No copiar código o recursos protegidos de otras aplicaciones sin licencia. No incorporar datos personales reales a repositorio ni pruebas.

**Marca:** CaHReMe es un nombre de trabajo; su disponibilidad jurídica y posibles colisiones deben comprobarse antes de publicarlo como marca.
