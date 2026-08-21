---
name: sync-project-docs
description: "Usar para sincronizar la documentación viva después de una fase. También: actualizar docs/project, plans/, status.md, architecture, compliance, threat-model."
---

# Sincronizar documentación viva

Esta skill la usa `tech-writer`. Alfred no la ejecuta: no tiene `edit`.

Tras una fase, actualiza **solo lo que ha cambiado**. Si el proyecto usa
`plans/` u otra convención, respétala: no crees `docs/` en paralelo.

## Proceso

1. **Lee el mapa actual.** `docs/project/status.md`, `docs/prd/`, `docs/adr/`,
   `plans/` si existe. No inventes ficheros que el proyecto no usa.

2. **Actualiza lo de esta fase:**

   | Si en esta fase... | Actualiza |
   |--------------------|-----------|
   | Hubo decisión de arquitectura | ADR + fila en architecture o `plans/decisiones.md` |
   | Cambió la superficie de ataque | `threat-model.md` / `plans/seguridad.md` |
   | Se evaluó una dependencia | `dependencies.md` |
   | Se tocó compliance | `compliance.md` |
   | Se cerró una gate | `docs/project/status.md` (fase, gate, siguiente acción, historial) |

3. **No toques** guías de API, changelogs o arquitectura si no hubo cambio real.

4. **status.md** es el snapshot offline, duplicado desde GitHub. Solo
   `tech-writer` lo escribe. Tras cada gate superada, commitea `chore: update
   flow status` si el usuario quiere persistirlo. No copies el chat al snapshot:
   replica Issues, PRs y veredictos.

## Criterios de éxito

- El estado en `status.md` (o issues) coincide con la realidad.
- No hay prosa inventada sobre código que no se ha tocado.

## Qué NO hacer

- No reescribas todo `docs/` en cada fase.
- No copies el chat al Markdown.
- No llames a `.claude/alfred-continuity.py`.
