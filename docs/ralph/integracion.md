# Matriz de contrato Alfred Dev ↔ Ralph Suite

Fecha: 2026-10-03. Evidencia de código, no de intención.

- Puente: [src/integrations/ralph.ts](../../src/integrations/ralph.ts). Solo `executeCommand` sobre el id `ralph-suite.ralph-suite`.
- Registro Ralph: [src/activate.ts](../../../ralph-suite/src/activate.ts) del repo `SrScorpio/ralph-suite`.
- Decisión de paralelismo: ADR-016, estado propuesto. El scheduler, si llega, vive en el runner de Ralph.

## Comandos

| Comando Ralph | ¿Alfred lo envuelve? | Argumentos que Ralph acepta | Qué envía Alfred | Hueco |
|---|---|---|---|---|
| `ralph-suite.openKanban` | Sí, si Ralph lo anuncia | ninguno | ninguno | ninguno |
| `ralph-suite.runTask` | Sí | `taskId?`, `workspaceRoot?` allowlisted | `taskId` y la carpeta del QuickPick, si está en `workspaceFolders` | Ralph vuelve a validar la carpeta contra su allowlist. Si Alfred no tiene carpeta, omite el argumento |
| `ralph-suite.startRunner` | Sí | ninguno | ninguno | Exige el webview Kanban abierto. Sin él, no arranca |
| `ralph-suite.stopRunner` | Sí | ninguno | ninguno | El abort es del panel entero, no de una tarea |
| `ralph-suite.syncIssue` | Sí, y la paleta solo aparece si Ralph lo anuncia | número `1..999999`, estado, `workspaceRoot?` | número, estado y la misma carpeta que `runTask` | Falla salvo que el backlog tenga el label `github:#N` u `owner/repo#N`. No modifica `prd.json`; escribe `.ralph/task-<id>-status`. Ralph valida la carpeta |
| `ralph-suite.initProject` | No | — | — | Solo paleta de Ralph |
| `ralph-suite.analyzeProject` | No | — | — | Solo paleta de Ralph |
| `ralph-suite.setupProject` | No | — | — | Solo paleta de Ralph |
| `ralph-suite.showMenu` | No | — | — | Solo paleta de Ralph |
| `ralph-suite.openSettings` | No | — | — | Abre settings de `ralph-suite`, no los de Alfred |
| `ralph-suite.optimizeMemory` | No | — | — | Solo paleta de Ralph |
| `ralph-suite.markDone` | No | `taskId` | — | Lo usa el webview. Fuera del contrato de host |
| `ralph-suite.resetTask` | No | `taskId` | — | Lo usa el webview. Fuera del contrato de host |

## Lo que no cruza el puente

- **Modelo.** `alfred-dev.modelProfile` (`luna`, `terra`, `sol`) no selecciona nada en Ralph. Ralph lee `ralph-suite.modelProfiles` (`engine`, `model`, `mode`) y no consulta la configuración de Alfred.
- **Paralelismo.** Un solo `AbortController` y un solo chat. N llamadas a `runTask` pisan el mismo panel. ADR-016 lo deja fuera de Alfred.
- **Backlog.** Alfred lee `docs/ralph/prd.json` (o `prd.json` heredado) para el QuickPick. Tope 64 KiB y 200 issues. No lo escribe.
- **Estados.** Alfred traduce `backlog→todo`, `in-progress→inprogress`, `blocked→blocked`, `closed→completed`. Ralph, al leer, acepta además `in_progress`, `done` y `closed`.

## Qué no es un bug

Que Alfred no envuelva init, analyze, setup, menú, settings ni memoria. Son superficie de Ralph. Envolverlos sin un caso de uso sería un segundo panel de control.