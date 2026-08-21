# Estado del flujo — alfred-dev-vscode

> Snapshot local duplicado desde GitHub Issues y PRs. La fuente de verdad
> colaborativa son las issues y los PRs; este fichero es el respaldo offline.
> Lo escribe `tech-writer`. Actualizado: 2026-08-21.

## Flujo activo

- **Flujo:** documentación pública.
- **Feature / descripción:** feature #1 completada: extensión VSIX nativa con TreeView de estado, comandos de Alfred, perfil global de modelos y empaquetado VSIX local.
- **Fase actual:** documentación (Fase 5).
- **Gate pendiente:** QA documental y merge de la PR #11; la PR #12 ya está fusionada y la CI reproducible y la protección de `main` están integradas.
- **Siguiente acción:** Completar el residual de seguridad documentado y pasar QA antes del merge de la PR #11.

## Issues

| Issue | Historia | Estado | PR |
|-------|----------|--------|----|
| #1 | Extensión VSIX nativa: UI de estado y selector de modelos | done | #9 merged |
| #2 | Memoria MCP, Secret Guards y Galería Visual | backlog | — |
| #3 | Integración con Ralph Suite (Runner + Kanban) | backlog | — |

## Historial de gates

| Fecha | Fase | Veredicto | Evidencia |
|-------|------|-----------|-----------|
| 2026-08-21 | 4 — calidad | APROBADO | Comentario de cierre de QA en issue #1 y PR #9; CI `test` verde en [job 96904158050](https://github.com/SrScorpio/alfred-dev-vscode/actions/runs/32524695685/job/96904158050), commit `337747d`. |
| 2026-08-21 | 4 — seguridad | APROBADO CON CONDICIONES | `docs/project/compliance.md`, `docs/project/dependencies.md`, `docs/project/sbom.md` y `docs/project/threat-model.md`; residual CRA: falta definir el proceso de divulgación y actualizaciones de seguridad. |
| 2026-08-21 | 5 — documentación | APROBADO | Sincronización final de este snapshot después del merge de la PR #9; el estado refleja las issues y PRs verificadas en GitHub. |
| 2026-08-21 | 4 — entrega y merge | APROBADO | PR #9 fusionada por squash; commit `a91fd0195c1ef0d45b326b1fe2b5bfce51bbfa81`; CI de `main` correcto en [workflow run 32525800934](https://github.com/SrScorpio/alfred-dev-vscode/actions/runs/32525800934). |
| 2026-08-21 | 5 — documentación pública | APROBADO CON CONDICIONES | PR #11 abierta; existe canal público en `SECURITY.md` y la PR #12 ya integró la CI reproducible y la protección de `main`. Siguen pendientes el SLA, la matriz formal de versiones soportadas, las actualizaciones de seguridad y el protocolo NIS2 completo; QA y merge de #11 pendientes. |

## Bloqueos

- Ninguno de producto.
- Residual de seguridad: existe un canal público en `SECURITY.md`, pero faltan el SLA, la matriz formal de versiones soportadas y el proceso de actualizaciones de seguridad.
- Residual NIS2: falta el protocolo completo de incidentes. CRA y NIS2 siguen parciales; no se consideran cumplidos por completo.
