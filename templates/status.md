# Estado del flujo — <nombre-del-proyecto>

> Snapshot local del estado del trabajo. La fuente de verdad colaborativa son las
> GitHub Issues (labels de estado) y los PRs; este fichero es el respaldo offline,
> commiteado al repo para que el estado sobreviva en cualquier remoto.
> Plantilla de referencia de alfred-dev-vscode. Actualizado: <fecha-hora>

## Flujo activo

- **Flujo:** feature | fix | spike | ship | audit
- **Feature / descripción:** <qué se está construyendo>
- **Fase actual:** <n — nombre de la fase>
- **Gate pendiente:** <qué gate falta por superar>
- **Siguiente acción:** <acción concreta y quién>

## Issues

| Issue | Historia | Estado | PR |
|-------|----------|--------|----|
| #N | Como [rol], quiero [acción] | backlog \| in-progress \| in-review \| blocked \| done | #M o — |

## Historial de gates

| Fecha | Fase | Veredicto | Evidencia |
|-------|------|-----------|-----------|
| <fecha> | <fase> | APROBADO / APROBADO CON CONDICIONES / RECHAZADO | <PR #, ADR #N, comentario en issue, commit> |

## Bloqueos

- <Si hay issues `blocked`: cuál, por qué y qué se necesita para desbloquear. Si no, "ninguno".>
