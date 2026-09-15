# Estado del flujo — alfred-dev-vscode

> Snapshot local duplicado desde GitHub Issues y PRs. La fuente de verdad
> colaborativa son las issues y los PRs; este fichero es el respaldo offline.
> Lo escribe `tech-writer`. Actualizado: 2026-09-15.

## Flujo activo

- **Flujo:** ship 0.7.0 cerrado en GitHub (tag anotado `v0.7.0` y GitHub Release). No hay Marketplace. Sin flujo de implementación activo.
- **Feature / descripción:** feature #2 completada (PR #16). Residual MEDIA de clave MCP en entorno y wipe incompleto del hijo cerrado en `main` por PR #18. ACL Unix `0o600` del socket one-shot cerrado en `main` por PR #26 (`Closes #25`). Proceso CRA/NIS2 cerrado en #21 (PR #23). Manifiesto y changelog congelados en 0.7.0 por #20 (PR #22). Queda el residual de la issue #3 (Ralph Suite), sin trabajo de implementación en curso.
- **Fase actual:** ship 0.7.0 publicado como GitHub Release. `origin/main` HEAD `1c0d09acc1d591b5cfb183aca881fbea4f92d54b` (squash PR #26). Tag anotado `v0.7.0` en ese commit. Marketplace fuera de alcance.
- **Gate pendiente:** ninguna HARD-GATE de despliegue GitHub. Marketplace no forma parte de este ship. Residual MEDIA del path del socket (mismo usuario) y backlog #3.
- **Siguiente acción:** no hay implementación activa. La issue #3 permanece abierta con label `backlog`. No priorizar implementación hasta que Ralph Suite publique APIs verificables (`ralph-suite.syncIssue` y scheduler paralelo). El residual MEDIA del path `ALFRED_DEV_MEMORY_KEY_SOCKET` no tiene issue abierta.

## Issues

| Issue | Historia | Estado | PR |
|-------|----------|--------|----|
| #1 | Extensión VSIX nativa: UI de estado y selector de modelos | done | [#9](https://github.com/SrScorpio/alfred-dev-vscode/pull/9) merged |
| #2 | Memoria MCP, Secret Guards y Galería Visual | done (closed/completed) | [#16](https://github.com/SrScorpio/alfred-dev-vscode/pull/16) merged; residuales MEDIA mitigados en [#18](https://github.com/SrScorpio/alfred-dev-vscode/pull/18) |
| #3 | Integración con Ralph Suite (Runner + Kanban) | backlog (open) | — |
| #20 | Ship Release 0.7.0: changelog, tag y VSIX versionado | done (closed/completed) | [#22](https://github.com/SrScorpio/alfred-dev-vscode/pull/22) merged; el tag y GitHub Release se crearon después, fuera de esa PR |
| #21 | SLA, versiones soportadas y protocolo de incidentes CRA/NIS2 | done (closed/completed) | [#23](https://github.com/SrScorpio/alfred-dev-vscode/pull/23) merged |
| #25 | Restringir ACL del canal one-shot de clave MCP | done (closed/completed) | [#26](https://github.com/SrScorpio/alfred-dev-vscode/pull/26) merged |

Notas verificadas en GitHub el 2026-09-15:

- [#2](https://github.com/SrScorpio/alfred-dev-vscode/issues/2) está `closed` con `state_reason: completed` (cierre 2026-09-14T17:43:37Z por SrScorpio). Labels actuales: `[]`. El label `in-progress` ya no está; se retiró tras el snapshot de PR #17 (`updated_at` 2026-09-14T18:21:52Z). PR #18 no reabre #2.
- [#3](https://github.com/SrScorpio/alfred-dev-vscode/issues/3) está `open` con label `backlog`. Comentario del 2026-09-03: bloqueada por capacidad upstream de Ralph Suite 1.9.1 (sin `ralph-suite.syncIssue` ni scheduler paralelo). El label de GitHub es `backlog`, no `blocked`.
- [#20](https://github.com/SrScorpio/alfred-dev-vscode/issues/20) está `closed` con `state_reason: completed` (cierre 2026-09-15T11:28:04Z por SrScorpio). Labels actuales: `[]` (el `in-progress` residual del snapshot de PR #24 ya no está). Cerrada por PR #22. El tag y GitHub Release no formaban parte de esa PR; se crearon después sobre `1c0d09a`. Marketplace no se publica.
- [#21](https://github.com/SrScorpio/alfred-dev-vscode/issues/21) está `closed` con `state_reason: completed` (cierre 2026-09-15T11:15:31Z por SrScorpio). Labels actuales: `[]`. Cerrada por PR #23 (`Closes #21`). GitHub también lista PR #22 y PR #24 como referencias de cierre porque el rebase de #22 incorpora el squash de #23 y #24 sincroniza el snapshot; el cierre semántico de #21 es PR #23.
- [#25](https://github.com/SrScorpio/alfred-dev-vscode/issues/25) está `closed` con `state_reason: completed` (cierre 2026-09-15T13:37:25Z por SrScorpio). Labels actuales: `[]`. Cerrada por PR #26 (`Closes #25`). Residual documentado: el path sigue enumerable por el mismo usuario; Windows no finge DACL.

## PRs

| PR | Título | Estado |
|----|--------|--------|
| [#26](https://github.com/SrScorpio/alfred-dev-vscode/pull/26) | fix: restringir ACL del socket one-shot de clave MCP | merged (squash) el 2026-09-15T13:37:23Z; commit [`1c0d09acc1d591b5cfb183aca881fbea4f92d54b`](https://github.com/SrScorpio/alfred-dev-vscode/commit/1c0d09acc1d591b5cfb183aca881fbea4f92d54b). Closes #25 |
| [#24](https://github.com/SrScorpio/alfred-dev-vscode/pull/24) | chore: update flow status | merged (squash) el 2026-09-15T11:36:30Z; commit [`bb3cc447036f82eeb4d125854f4ad05251659da9`](https://github.com/SrScorpio/alfred-dev-vscode/commit/bb3cc447036f82eeb4d125854f4ad05251659da9). Snapshot de #20/#21; no cierra #3. Quedó desfasado respecto a #25/#26, el tag `v0.7.0` y la GitHub Release |
| [#23](https://github.com/SrScorpio/alfred-dev-vscode/pull/23) | docs: add CRA/NIS2 disclosure SLA and incident process | merged (squash) el 2026-09-15T11:15:30Z; commit [`5984211c3ced70673e8a1e02f0e536c657460321`](https://github.com/SrScorpio/alfred-dev-vscode/commit/5984211c3ced70673e8a1e02f0e536c657460321). Closes #21 |
| [#22](https://github.com/SrScorpio/alfred-dev-vscode/pull/22) | chore: release 0.7.0 | merged (squash) el 2026-09-15T11:28:03Z; commit [`34e04a51592495883b1efe17eecbfeef5400a0f4`](https://github.com/SrScorpio/alfred-dev-vscode/commit/34e04a51592495883b1efe17eecbfeef5400a0f4). Closes #20. Rebase sobre el squash de #23 |
| [#19](https://github.com/SrScorpio/alfred-dev-vscode/pull/19) | chore: update flow status | merged (squash) el 2026-09-14T20:03:53Z; commit [`4fc3a4cada9a6d06e56b1ffbea711c410c9e605b`](https://github.com/SrScorpio/alfred-dev-vscode/commit/4fc3a4cada9a6d06e56b1ffbea711c410c9e605b). Snapshot de #18; no cierra #3 |
| [#18](https://github.com/SrScorpio/alfred-dev-vscode/pull/18) | fix: canal one-shot de clave MCP y recycle tras wipe | merged (squash) el 2026-09-14T19:57:41Z; commit [`a78aad9608ccd41da41a16e0f650e5448f670a0b`](https://github.com/SrScorpio/alfred-dev-vscode/commit/a78aad9608ccd41da41a16e0f650e5448f670a0b) |
| [#17](https://github.com/SrScorpio/alfred-dev-vscode/pull/17) | chore: update flow status | merged (squash) el 2026-09-14; commit [`5dc818f2d9f9aca010d63ee5270f439cbbd86767`](https://github.com/SrScorpio/alfred-dev-vscode/commit/5dc818f2d9f9aca010d63ee5270f439cbbd86767). Ese snapshot quedó desfasado: decía que no había PRs abiertas y que el residual MEDIA era `ALFRED_DEV_MEMORY_KEY` en el entorno del hijo |
| [#16](https://github.com/SrScorpio/alfred-dev-vscode/pull/16) | feat: memoria MCP, Secret Guard y galería visual (#2) | merged (squash) el 2026-09-14; commit [`30d980e4336a07ea4e0905163901a6259c788440`](https://github.com/SrScorpio/alfred-dev-vscode/commit/30d980e4336a07ea4e0905163901a6259c788440) |
| [#15](https://github.com/SrScorpio/alfred-dev-vscode/pull/15) | chore(deps-dev): bump js-yaml from 4.3.1 to 4.3.2 | closed, no merged (2026-09-14). Comentario de Dependabot: js-yaml ya está actualizado (el bump 4.3.2 entra por #16) |
| [#14](https://github.com/SrScorpio/alfred-dev-vscode/pull/14) | chore(deps-dev): bump fast-uri from 3.1.5 to 3.1.7 | closed, no merged (2026-09-14). Comentario de Dependabot: fast-uri ya está actualizado |

Tras el merge de #26 no hay PRs abiertas en el repositorio en el momento de este snapshot (antes de la PR de sincronización de este fichero). `origin/main` apunta a `1c0d09acc1d591b5cfb183aca881fbea4f92d54b`. Tag anotado `v0.7.0` (objeto de tag `62a070da0aaa8e4b18388d377a8683d00f0d43f3`, apunta al commit `1c0d09a`, tagger 2026-09-15T13:38:48Z). GitHub Release: [v0.7.0](https://github.com/SrScorpio/alfred-dev-vscode/releases/tag/v0.7.0), publicada 2026-09-15T13:39:05Z, adjunto `alfred-dev-vscode-0.7.0.vsix` (43 644 bytes). No hay publicación en Marketplace.

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
| 2026-09-14 (tarde) | 4 — seguridad (#18) | APROBADO CON CONDICIONES | La clave MCP ya no viaja en `ALFRED_DEV_MEMORY_KEY`. Residual MEDIA actual: el path `ALFRED_DEV_MEMORY_KEY_SOCKET` es enumerable durante el `accept` (ventana corta, mismo usuario). El wipe recicla el provider MCP. SLA CRA/NIS2, matriz de versiones y protocolo 24/72 h siguen pendientes en aquel momento. |
| 2026-09-14 (tarde) | 4 — entrega y merge (#18) | APROBADO | PR #18 fusionada por squash a `main`; commit `a78aad9608ccd41da41a16e0f650e5448f670a0b`. No reabre #2 ni cierra #3. |
| 2026-09-14 (tarde) | 5 — documentación (#18) | APROBADO | Snapshot de PR #19 (`4fc3a4c`): replica Issues y PRs de #18; no reescribe compliance, threat-model ni changelog. Quedó desfasado respecto a #21/#20 (PRs #23 y #22). |
| 2026-09-15 | 4 — calidad (#23 / #21) | APROBADO CON CONDICIONES | QA: contrato laxo (el test de `SECURITY.md` comprueba presencia de «versiones soportadas», «24» y «72», no el texto normativo). Orden de merge con #22 resuelto: #23 entra primero en `main` (`5984211`); #22 se rebasea encima. CI de PR #23: `test`, `security` y `package` SUCCESS en [workflow run 34961192596](https://github.com/SrScorpio/alfred-dev-vscode/actions/runs/34961192596). |
| 2026-09-15 | 4 — seguridad / proceso (#23 / #21) | APROBADO | SLA de divulgación (acuse 24 h, análisis 72 h), matriz de versiones soportadas y protocolo NIS2 art. 23 publicados en `SECURITY.md`; plantillas en `docs/project/incidents/`. No declara conformidad jurídica. Controles CRA de notificación, divulgación y actualizaciones pasan a `parcial` en `compliance.md`. |
| 2026-09-15 | 4 — entrega y merge (#23 / #21) | APROBADO | PR #23 fusionada por squash a `main`; commit `5984211c3ced70673e8a1e02f0e536c657460321`; issue #21 closed/completed. |
| 2026-09-15 | 4 — calidad (#22 / #20) | APROBADO | QA: 92/92. CI de PR #22: `test`, `security` y `package` SUCCESS en [workflow run 34962988315](https://github.com/SrScorpio/alfred-dev-vscode/actions/runs/34962988315). |
| 2026-09-15 | 4 — entrega y merge (#22 / #20) | APROBADO | PR #22 fusionada por squash a `main`; commit `34e04a51592495883b1efe17eecbfeef5400a0f4`; issue #20 closed/completed. Congela changelog `[0.7.0] - 2026-09-15`, bump de manifiesto y matriz `SECURITY.md` a `0.7.0`. |
| 2026-09-15 | 5 — documentación (#20 / #21) | APROBADO | Snapshot de PR #24 (`bb3cc44`): replica Issues y PRs de #20/#21; HARD-GATE de ship aún pendiente en aquel momento (sin tag ni Release). Quedó desfasado respecto a #25/#26, el tag `v0.7.0` y la GitHub Release. |
| 2026-09-15 | 4 — calidad (#26 / #25) | APROBADO | Comentario de QA en issue #25 (`acd7c2b` vs `main` `bb3cc44`). CI de PR #26: `test`, `security` y `package` SUCCESS en [workflow run 34974844774](https://github.com/SrScorpio/alfred-dev-vscode/actions/runs/34974844774). |
| 2026-09-15 | 4 — seguridad (#26 / #25) | APROBADO CON CONDICIONES | Unix: inode `0o600` tras `listen`. Windows: `exclusive: true` sin DACL fingida. Residual MEDIA vigente: el path `ALFRED_DEV_MEMORY_KEY_SOCKET` sigue enumerable por el mismo usuario durante el `accept` (≤5 s). |
| 2026-09-15 | 4 — entrega y merge (#26 / #25) | APROBADO | PR #26 fusionada por squash a `main`; commit `1c0d09acc1d591b5cfb183aca881fbea4f92d54b`; issue #25 closed/completed. Entra en 0.7.0 (sin bump de versión). |
| 2026-09-15 | 4 — ship / despliegue | APROBADO CON CONDICIONES | Tag anotado `v0.7.0` en `1c0d09a` (objeto de tag `62a070da0aaa8e4b18388d377a8683d00f0d43f3`). GitHub Release [v0.7.0](https://github.com/SrScorpio/alfred-dev-vscode/releases/tag/v0.7.0) con adjunto `alfred-dev-vscode-0.7.0.vsix`. Marketplace no se publica. |
| 2026-09-15 | 5 — documentación (post-ship 0.7.0) | APROBADO | Este snapshot replica Issues, PRs, tag y Release verificados en GitHub; no reescribe compliance, threat-model ni changelog. No cierra #3. |

## Bloqueos

- Issue [#3](https://github.com/SrScorpio/alfred-dev-vscode/issues/3): abierta, label `backlog`. Comentario del 2026-09-03: el manifiesto público de Ralph Suite 1.9.1 no expone `ralph-suite.syncIssue` ni scheduler de dispatch paralelo. El bridge local solo puede integrar `openKanban`, `runTask`, `startRunner` y `stopRunner` con ID canónico `ralph-suite.ralph-suite`. No hay label `blocked` en GitHub.
- Residual MEDIA vigente (tras #18 y #26): el path `ALFRED_DEV_MEMORY_KEY_SOCKET` es enumerable durante el `accept` (ventana ≤5 s, mismo usuario). Unix recorta el inode a `0o600`. Windows no finge DACL. La clave ya no va en `ALFRED_DEV_MEMORY_KEY`. El wipe recicla el provider MCP. No hay issue abierta para este residual.
- El hueco de proceso CRA/NIS2 (SLA, matriz de versiones, protocolo 24/72 h) quedó cerrado en #21 / PR #23. No es un dictamen jurídico ni conformidad CRA/NIS2 completa; los controles de `compliance.md` siguen en `parcial`.
- Marketplace: no forma parte del ship 0.7.0. No es un bloqueo de implementación; es un alcance excluido.
