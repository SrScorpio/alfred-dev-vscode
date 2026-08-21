# Estado del flujo — alfred-dev-vscode

> Snapshot local duplicado desde GitHub Issues y PRs. La fuente de verdad
> colaborativa son las issues y los PRs; este fichero es el respaldo offline.
> Lo escribe `tech-writer`. Actualizado: 2026-08-21.

## Flujo activo

- **Flujo:** feature
- **Feature / descripción:** [Fase 4] Extensión VSIX nativa con TreeView de estado, comandos de Alfred, perfil global de modelos y empaquetado VSIX local.
- **Fase actual:** 5 — documentación
- **Gate pendiente:** documentación viva de esta fase; después, entrega DevOps + seguridad.
- **Siguiente acción:** El usuario revisa la documentación y decide el merge de la PR #9. La entrega DevOps + seguridad queda pendiente.

## Issues

| Issue | Historia | Estado | PR |
|-------|----------|--------|----|
| #1 | Extensión VSIX nativa: UI de estado y selector de modelos | in-review (PR abierta) | #9 |
| #2 | Memoria MCP, Secret Guards y Galería Visual | backlog | — |
| #3 | Integración con Ralph Suite (Runner + Kanban) | backlog | — |

La issue #1 no tiene actualmente la label `in-review` en GitHub; su estado se
deriva de la PR #9 abierta y pendiente de decisión de merge.

## Historial de gates

| Fecha | Fase | Veredicto | Evidencia |
|-------|------|-----------|-----------|
| 2026-08-21 | 4 — calidad | APROBADO | Comentario de cierre de QA en issue #1 y PR #9; CI `test` verde en [job 96904158050](https://github.com/SrScorpio/alfred-dev-vscode/actions/runs/32524695685/job/96904158050), commit `337747d`. |
| 2026-08-21 | 4 — seguridad | APROBADO CON CONDICIONES | `docs/project/compliance.md`, `docs/project/dependencies.md`, `docs/project/sbom.md` y `docs/project/threat-model.md`; residual CRA: falta `SECURITY.md` de proceso. |
| 2026-08-21 | 5 — documentación | PENDIENTE | Esta sincronización de `CHANGELOG.md`, `README.md`, documentación inline y este snapshot. |

## Bloqueos

- Ninguno de producto.
- Residual de seguridad: falta `SECURITY.md` de proceso CRA; sigue pendiente y no se inventa una política de vulnerabilidades con SLA.