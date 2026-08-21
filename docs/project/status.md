# Estado del flujo — alfred-dev-vscode

> Snapshot local duplicado desde GitHub Issues y PRs. La fuente de verdad
> colaborativa son las issues y los PRs; este fichero es el respaldo offline.
> Lo escribe `tech-writer`. Actualizado: 2026-08-21.

## Flujo activo

- **Flujo:** sin flujo activo.
- **Feature / descripción:** feature #1 completada: extensión VSIX nativa con TreeView de estado, comandos de Alfred, perfil global de modelos y empaquetado VSIX local.
- **Fase actual:** completada.
- **Gate pendiente:** ninguna para #1; la CI/gobernanza y la documentación pública están fusionadas.
- **Siguiente acción:** priorizar issue #2 cuando el usuario lo solicite.

## Issues

| Issue | Historia | Estado | PR |
|-------|----------|--------|----|
| #1 | Extensión VSIX nativa: UI de estado y selector de modelos | done | #9 merged |
| #2 | Memoria MCP, Secret Guards y Galería Visual | backlog | — |
| #3 | Integración con Ralph Suite (Runner + Kanban) | backlog | — |

## Historial de gates

| Fecha | Fase | Veredicto | Evidencia |
|-------|----------|-----------|-----------|
| 2026-08-21 | 4 — calidad | APROBADO | Comentario de cierre de QA en issue #1 y PR #9; CI `test` verde en [job 96904158050](https://github.com/SrScorpio/alfred-dev-vscode/actions/runs/32524695685/job/96904158050), commit `337747d`. |
| 2026-08-21 | 4 — seguridad | APROBADO CON CONDICIONES | `docs/project/compliance.md`, `docs/project/dependencies.md`, `docs/project/sbom.md` y `docs/project/threat-model.md`; no se considera una gate de seguridad completa: faltan el SLA, la matriz formal de versiones soportadas, la política de actualizaciones y el protocolo completo de incidentes. |
| 2026-08-21 | 5 — documentación | APROBADO | La documentación de la fase está sincronizada con las issues y PRs verificadas en GitHub. |
| 2026-08-21 | 4 — entrega y merge | APROBADO | PR #9 fusionada por squash; commit `a91fd0195c1ef0d45b326b1fe2b5bfce51bbfa81`; CI de `main` correcto en [workflow run 32525800934](https://github.com/SrScorpio/alfred-dev-vscode/actions/runs/32525800934). |
| 2026-08-21 | 4 — gobernanza/CI | APROBADO | PR #12 fusionada; CI reproducible y protección de `main` integradas. |
| 2026-08-21 | 5 — documentación pública | APROBADO | PR #11 fusionada; índice, guías públicas y política de seguridad disponibles, con los controles CRA/NIS2 aún parciales indicados en esta página. |

## Bloqueos

- Ninguno de producto.
- Residual CRA/NIS2: existe `SECURITY.md` como canal público, pero faltan el SLA, la matriz formal de versiones soportadas, la política de actualizaciones y el protocolo completo de incidentes.
