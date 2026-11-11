# Flujo de consulta — CaHReMe

Estado: **decisión de producto para prototipo**, sin reglas clínicas activas.

## Consultas de referencia añadidas (iteración A.2)

La portada ofrece **siete rutas**: evaluación integral y seis consultas clínicas dirigidas (DM2, insuficiencia cardíaca, ERC, sobrepeso/obesidad, enfermedad hepática metabólica e insulinización). Cada consulta tiene tres vistas: **Rápida → Detallada → Resumen**. Se puede alternar entre ellas sin perder los datos. Los campos compartidos permanecen en memoria y se reutilizan entre módulos. Las entradas sin datos quedan «Sin registrar»; no se asigna resultado normal.

**La vista «Resumen» solo recapitula información introducida, no es un resultado diagnóstico ni terapéutico.** Las salidas asistenciales permanecen desactivadas hasta contar con reglas y pruebas validadas.

## Entrada dual
- **Evaluación integral (predeterminada):** empieza en contexto y recorre cardiovascular, renal, hepático, metabólico y tratamientos.
- **Consulta dirigida:** permite entrar directamente en el dominio solicitado. No se considera que el resto de dominios esté descartado; el resumen los mantiene visibles como pendientes.
- Ninguna ruta genera automáticamente diagnóstico o prescripción.

## Estados de captura
- **Registrado:** valor aportado por el usuario, no verificado clínicamente.
- **No disponible:** el profesional declara que no dispone del dato.
- **Sin registrar:** campo todavía vacío.
- **Revisar:** entrada incompatible con el contrato básico del formulario.

Estos estados no equivalen a «normal», «patológico» o «descartado». Los estados clínicos del Documento rector no se activan en la iteración A.

## Navegación
1. Inicio: elegir integral o dirigida.
2. Formulario: sección elegida, anterior/siguiente, acceso a resumen.
3. Resumen: datos introducidos y faltantes, agrupados por dominio.
4. Herramientas/Fuentes: secciones informativas con funciones pendientes y evidencia no validada.
5. Borrado: nueva evaluación reinicia todos los datos; no hay persistencia, cookies ni almacenamiento identificativo.

## Condiciones de aceptación
- Un campo no disponible no se sustituye por cero ni por otro valor supuesto.
- Los pasos mantienen los valores mientras la página está abierta.
- El resumen muestra el estado de todos los campos sin clasificar riesgos.
- La evaluación dirigida no elimina los datos contextuales ni oculta dominios.
- No se usan datos clínicos reales en pruebas o capturas; los ejemplos son sintéticos.
- No está publicado ni habilitado para uso asistencial.

## Indicadores descriptivos por fuente (bloque B inicial)

En la pantalla **Herramientas**, en el resumen integral y en las consultas renal/hepática se muestran:
- **G/A KDIGO**: dos categorías independientes calculadas desde TFGe y CAC, con advertencia sobre cronicidad y causa no evaluadas.
- **FIB-4**: fórmula aplicada a edad, AST, ALT y plaquetas cuando están presentes; la interpretación exige contexto adecuado y ausencia de enfermedad aguda y advierte rendimiento limitado <35 años. Ajuste de corte inferior >65 años.

Los resultados no generan diagnósticos ni conductas terapéuticas. Están documentados en [Fuentes y reglas clínicas](FUENTES_CLINICAS.md), con pruebas automatizadas; la revisión profesional formal sigue pendiente.
