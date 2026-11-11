# Flujo de consulta — CaHReMe

Estado: **decisión de producto para prototipo**, sin reglas clínicas activas.

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
