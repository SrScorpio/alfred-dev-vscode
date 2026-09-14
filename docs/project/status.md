# Estado del flujo — alfred-dev-vscode

> Snapshot local duplicado desde GitHub Issues y PRs. La fuente de verdad
> colaborativa son las issues y los PRs; este fichero es el respaldo offline.
> Lo escribe `tech-writer`. Actualizado: 2026-09-14 (tarde).

## Flujo activo

- **Flujo:** sin flujo de implementación activo.
- **Feature / descripción:** feature #2 completada (PR #16). Residual MEDIA de clave MCP en entorno y wipe incompleto del hijo cerrado en `main` por PR #18. Queda el residual de la issue #3 (Ralph Suite), sin trabajo de implementación en curso.
- **Fase actual:** completada para #2; residuales MEDIA de #2 mitigados en #18.
- **Gate pendiente:** ninguna de implementación para #2 ni para #18. Residuales de seguridad y CRA/NIS2 (ver Bloqueos); no constituyen un flujo abierto.
- **Siguiente acción:** la issue #3 permanece abierta con label `backlog`. No priorizar implementación hasta que Ralph Suite publique APIs verificables (`ralph-suite.syncIssue` y scheduler paralelo).

## Issues

| Issue | Historia | Estado | PR |
|-------|----------|--------|----|
| #1 | Extensión VSIX nativa: UI de estado y selector de modelos | done | [#9](https://github.com/SrScorpio/alfred-dev-vscode/pull/9) merged |
| #2 | Memoria MCP, Secret Guards y Galería Visual | done (closed/completed) | [#16](https://github.com/SrScorpio/alfred-dev-vscode/pull/16) merged; residuales MEDIA mitigados en [#18](https://github.com/SrScorpio/alfred-dev-vscode/pull/18) |
| #3 | Integración con Ralph Suite (Runner + Kanban) | backlog (open) | — |

Notas verificadas en GitHub el 2026-09-14 (tarde):

- [#2](https://github.com/SrScorpio/alfred-dev-vscode/issues/2) está `closed` con `state_reason: completed` (cierre 2026-09-14T17:43:37Z por SrScorpio). Labels actuales: `[]`. El label `in-progress` ya no está; se retiró tras el snapshot de PR #17 (`updated_at` 2026-09-14T18:21:52Z). PR #18 no reabre #2.
- [#3](https://github.com/SrScorpio/alfred-dev-vscode/issues/3) está `open` con label `backlog`. Comentario del 2026-09-03: bloqueada por capacidad upstream de Ralph Suite 1.9.1 (sin `ralph-suite.syncIssue` ni scheduler paralelo). El label de GitHub es `backlog`, no `blocked`.

## PRs

| PR | Título | Estado |
|----|--------|--------|
| [#18](https://github.com/SrScorpio/alfred-dev-vscode/pull/18) | fix: canal one-shot de clave MCP y recycle tras wipe | merged (squash) el 2026-09-14T19:57:41Z; commit [`a78aad9608ccd41da41a16e0f650e5448f670a0b`](https://github.com/SrScorpio/alfred-dev-vscode/commit/a78aad9608ccd41da41a16e0f650e5448f670a0b) |
| [#17](https://github.com/SrScorpio/alfred-dev-vscode/pull/17) | chore: update flow status | merged (squash) el 2026-09-14; commit [`5dc818f2d9f9aca010d63ee5270f439cbbd86767`](https://github.com/SrScorpio/alfred-dev-vscode/commit/5dc818f2d9f9aca010d63ee5270f439cbbd86767). Ese snapshot quedó desfasado: decía que no había PRs abiertas y que el residual MEDIA era `ALFRED_DEV_MEMORY_KEY` en el entorno del hijo |
| [#16](https://github.com/SrScorpio/alfred-dev-vscode/pull/16) | feat: memoria MCP, Secret Guard y galería visual (#2) | merged (squash) el 2026-09-14; commit [`30d980e4336a07ea4e0905163901a6259c788440`](https://github.com/SrScorpio/alfred-dev-vscode/commit/30d980e4336a07ea4e0905163901a6259c788440) |
| [#15](https://github.com/SrScorpio/alfred-dev-vscode/pull/15) | chore(deps-dev): bump js-yaml from 4.3.1 to 4.3.2 | closed, no merged (2026-09-14). Comentario de Dependabot: js-yaml ya está actualizado (el bump 4.3.2 entra por #16) |
| [#14](https://github.com/SrScorpio/alfred-dev-vscode/pull/14) | chore(deps-dev): bump fast-uri from 3.1.5 to 3.1.7 | closed, no merged (2026-09-14). Comentario de Dependabot: fast-uri ya está actualizado |

Tras el merge de #18 no hay PRs abiertas en el repositorio en el momento de este snapshot (antes de la PR de sincronización de este fichero). `origin/main` apunta a `a78aad9608ccd41da41a16e0f650e5448f670a0b`.

## Historial de gates

| Fecha | Fase | Veredicto | Evidencia |
|-------|------|-----------|-----------|
| 2026-08-21 | 4 — calidad | APROBADO | Comentario de cierre de QA en issue #1 y PR #9; CI `test` verde en [job 96904158050](https://github.com/SrScorpio/alfred-dev-vscode/actions/runs/32524695685/job/96904158050), commit `337747d`. |
| 2026-08-21 | 4 — seguridad | APROBADO CON CONDICIONES | `docs/project/compliance.md`, `docs/project/dependencies.md`, `docs/project/sbom.md` y `docs/project/threat-model.md`; no se considera una gate de seguridad completa: faltan el SLA, la matriz formal de versiones soportadas, la política de actualizaciones y el protocolo completo de incidentes. |
| 2026-08-21 | 5 — documentación | APROBADO | La documentación de la fase está sincronizada con las issues y PRs verificadas en GitHub. |
| 2026-08-21 | 4 — entrega y merge | APROBADO | PR #9 fusionada por squash; commit `a91fd0195c1ef0d45b326b1fe2b5bfce51bbfa81`; CI de `main` correcto en [workflow run 32525800934](https://github.com/SrScorpio/alfred-dev-vscode/actions/runs/32525800934). |
| 2026-08-21 | 4 — gobernanza/CI | APROBADO | PR #12 fusionada; CI reproducible y protección de `main` integradas. |
| 2026-08-21 | 5 — documentación pública | APROBADO | PR #11 fusionada; índice, guías públicas y política de seguridad disponibles, con los controles CRA/NIS2 aún parciales indicados en esta página. |
| 2026-09-14 | 4 — calidad (#2) | APROBADO | QA: 73/73, VSIX 22 ficheros, `npm audit --audit-level=high` a 0. CI de PR #16: `test`, `security` y `package` SUCCESS en [workflow run 34876379968](https://github.com/SrScorpio/alfred-dev-vscode/actions/runs/34876379968). |
| 2026-09-14 | 4 — seguridad (#2) | APROBADO CON CONDICIONES | Sin HIGH/CRITICAL. Residuales MEDIA en aquel momento: clave MCP por entorno `ALFRED_DEV_MEMORY_KEY`; wipe incompleto si el hijo MCP sigue vivo; SLA CRA/NIS2, matriz de versiones y protocolo 24/72 h pendientes (ya existían). Comentario en issue #2 y cuerpo de PR #16. Mitigados en #18 (fila posterior). |
| 2026-09-14 | 4 — entrega y merge (#2) | APROBADO | PR #16 fusionada por squash a `main`; commit `30d980e4336a07ea4e0905163901a6259c788440`; issue #2 closed/completed. |
| 2026-09-14 | 5 — documentación (#2) | APROBADO | Snapshot de PR #17 (`5dc818f`): replicaba Issues y PRs de #16; quedó desfasado respecto a #18 (PRs abiertas y residual `ALFRED_DEV_MEMORY_KEY` en env). |
| 2026-09-14 (tarde) | 4 — calidad (#18) | APROBADO | QA: 87/87. CI de PR #18: `test`, `security` y `package` SUCCESS en [workflow run 34889174906](https://github.com/SrScorpio/alfred-dev-vscode/actions/runs/34889174906). |
| 2026-09-14 (tarde) | 4 — seguridad (#18) | APROBADO CON CONDICIONES | La clave MCP ya no viaja en `ALFRED_DEV_MEMORY_KEY`. Residual MEDIA actual: el path `ALFRED_DEV_MEMORY_KEY_SOCKET` es enumerable durante el `accept` (ventana corta, mismo usuario). El wipe recicla el provider MCP. SLA CRA/NIS2, matriz de versiones y protocolo 24/72 h siguen pendientes. |
| 2026-09-14 (tarde) | 4 — entrega y merge (#18) | APROBADO | PR #18 fusionada por squash a `main`; commit `a78aad9608ccd41da41a16e0f650e5448f670a0b`. No reabre #2 ni cierra #3. |
| 2026-09-14 (tarde) | 5 — documentación (#18) | APROBADO | Este snapshot replica Issues y PRs verificadas en GitHub; no reescribe compliance, threat-model ni changelog. |

## Bloqueos

- Issue [#3](https://github.com/SrScorpio/alfred-dev-vscode/issues/3): abierta, label `backlog`. Comentario del 2026-09-03: el manifiesto público de Ralph Suite 1.9.1 no expone `ralph-suite.syncIssue` ni scheduler de dispatch paralelo. El bridge local solo puede integrar `openKanban`, `runTask`, `startRunner` y `stopRunner` con ID canónico `ralph-suite.ralph-suite`. No hay label `blocked` en GitHub.
- Residual CRA/NIS2 (arrastrado desde #1 y reiterado en las gates de seguridad de #2 y #18): existe `SECURITY.md` como canal público, pero faltan el SLA, la matriz formal de versiones soportadas, la política de actualizaciones y el protocolo completo de incidentes (24/72 h).
- Residual MEDIA actual (tras #18): el path `ALFRED_DEV_MEMORY_KEY_SOCKET` es enumerable durante el `accept` (ventana corta, mismo usuario). La clave ya no va en `ALFRED_DEV_MEMORY_KEY`. El wipe recicla el provider MCP.
