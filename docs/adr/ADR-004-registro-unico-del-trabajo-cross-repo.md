# ADR-004 — Registro único del trabajo que cruza de repo

Fecha: 2026-10-18
Estado: aceptada

## Contexto

ISSUE-004 e ISSUE-005 del backlog de alfred-dev-vscode describen código que
aterriza en ralph-suite. El 2026-10-04 el `prd.json` de Alfred y el runtime
`.ralph/` contaban historias distintas de ese mismo trabajo. ADR-003 mantiene
los dos repositorios separados.

## Decisión

Alfred Dev es el registro único del trabajo que afecta a los dos productos.
La historia vive como issue de `SrScorpio/alfred-dev-vscode` y, si hace falta
un backlog local, como entrada de `docs/ralph/prd.json` de ese mismo repo.

La entrada cita el repo de destino (`SrScorpio/ralph-suite`) y el camino del
código. ralph-suite no abre un backlog paralelo para ese trabajo: su README
remite a las issues de Alfred. Cada repo conserva su propio código, releases
y tests. Esta decisión no fusiona los repositorios.

## Consecuencias

- Una tarea hecha en ralph-suite se cierra en el registro de Alfred, no en dos.
- El código de ISSUE-005 ya está en ralph-suite 1.12.0 (`viewsContainers`).
  Su registro queda cerrado en el backlog de Alfred, sin copia en ralph-suite.
- Un futuro producto que una las dos extensiones hereda esta regla: una issue,
  un backlog, el repo de destino escrito en la propia tarea.
