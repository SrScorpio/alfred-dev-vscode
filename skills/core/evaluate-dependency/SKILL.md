---
name: evaluate-dependency
description: "Usar antes de aceptar una dependencia nueva. También: auditar paquete, licencia, CVEs, transitivas, bundle, npm install, pip, cargo add."
---

# Evaluar una dependencia

Antes de añadir un paquete, evalúalo y deja el veredicto en
`docs/project/dependencies.md` (o en `plans/` si el proyecto ya documenta
dependencias ahí).

## Proceso

1. Confirma que el paquete no está ya en el manifiesto ni en el registro.

2. Recoge datos verificables (lockfile, registro npm/pypi/crates, GitHub Advisory):

   - nombre y versión exacta
   - peso aproximado o impacto en el bundle
   - último release y mantenimiento
   - licencia y compatibilidad con el proyecto
   - CVEs conocidos o «ninguno encontrado» (con fuente)
   - número de transitivas
   - alternativa más ligera o nativa

3. Veredicto: `APROBAR`, `RECHAZAR` o `APROBAR CON CONDICIONES`.

4. Añade o actualiza una fila en el registro. Crea el fichero si no existe:

   | Paquete | Versión | Licencia | CVEs | Transitivas | Veredicto | Fecha |
   |---------|---------|----------|------|-------------|-----------|-------|

5. Si el veredicto no es `APROBAR`, no la instales. Propón alternativa.

## Criterios de éxito

- La fila existe con versión, licencia y veredicto.
- Un CVE «no aplica» lleva una frase técnica, no un supuesto.
- El registro vive en el repo, no solo en el chat.

## Qué NO hacer

- No evalúes de memoria sin mirar el lockfile o el manifiesto.
- No apruebes una dependencia por «ya la usamos todos» sin dato.
- No dejes licencias como desconocidas sin decirlo.
