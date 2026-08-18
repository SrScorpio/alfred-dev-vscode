---
name: write-adr
description: "Usar para escribir o cerrar un Architecture Decision Record. También: ADR, docs/adr, decisión de stack, persistencia, autenticación o límites de arquitectura."
---

# Escribir un ADR

Documenta una decisión arquitectónica significativa en `docs/adr/`. Un ADR no
es un diario: solo se escribe si hay una elección real (stack, persistencia,
auth, límites, integración).

Plantilla (en este orden; no hace falta el repo del plugin):

1. `templates/adr.md` del proyecto, si existe.
2. `~/.copilot/alfred-dev/templates/adr.md` (instalación global).
3. `references/adr.md` junto a esta skill.

## Proceso

1. **Número siguiente.** Lista `docs/adr/ADR-*.md`. El número es el mayor + 1,
   con tres dígitos (`ADR-001`, `ADR-002`...). Si no hay ninguno, empieza en 001.
   Slug del título en kebab-case: `docs/adr/ADR-003-sqlite-para-memoria.md`.

2. **Copia la plantilla** y rellena con hechos del repo:

   - contexto y restricciones
   - al menos dos opciones reales, con pros y contras
   - decisión y por qué
   - consecuencias y deuda asumida

3. **Estado inicial:** `propuesto` hasta que el usuario o la gate de
   arquitectura lo acepten. Entonces `aceptado`. Si más tarde cambia, crea un
   ADR nuevo que apunte al anterior; no reescribas el viejo.

4. **Índice.** Si existe `docs/adr/README.md` o `docs/project/architecture.md`,
   añade una fila. Si el proyecto usa `plans/decisiones.md`, actualiza ese
   fichero en vez de crear un índice paralelo.

## Criterios de éxito

- El fichero está en `docs/adr/ADR-NNN-....md`.
- Hay al menos dos opciones evaluadas.
- La decisión y sus consecuencias se pueden leer sin el chat.

## Qué NO hacer

- No abras un ADR por un rename o un ajuste local.
- No dejes `_(pendiente)_` en un ADR que declaras cerrado.
- No copies un ADR genérico que no menciona el repo.
- No llames a helpers de Claude (`.claude/alfred-continuity.py`) ni a MCP de memoria.
