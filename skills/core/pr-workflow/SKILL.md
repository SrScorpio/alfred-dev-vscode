---
name: pr-workflow
description: "Usar para abrir o completar una pull request con descripción, labels y enlace a issue. También: gh pr create, Closes #N, rama feat/fix."
---

# Crear pull requests

Una PR explica qué cambió, por qué y cómo verificarlo. Requiere `gh`
autenticado y remoto. Si no hay `gh`, dilo y no finjas la PR.

Alineado con el flujo GitHub del equipo: rama `feat/<slug>` o `fix/<slug>`,
issue en `in-review` al abrir, merge lo decide el usuario.

## Proceso

1. **Estado.** `git status` y `git diff`. Si hay cambios sin commitear,
   confirma con el usuario.

2. **Rama.** Nunca `main`. Si no hay rama: `feat/issue-N-slug` o `fix/slug`.

3. **Título** menor de 70 caracteres, `tipo: descripción`. Ejemplos:
   `feat: add date search filter`, `fix: correct invoice VAT`.

4. **Cuerpo** (sigue `.github/pull_request_template.md` si existe):

   ## Resumen
   - qué cambia y por qué

   ## Motivación
   Closes #N

   ## Plan de pruebas
   - [ ] paso verificable
   - [ ] regresión

   ## Notas para el revisor
   decisiones, zonas delicadas

5. **Abrir:** `gh pr create` con título, cuerpo y `Closes #N`. Labels
   (`bug`, `feature`, `refactor`, `docs`) si el repo las tiene. Reviewers
   solo si el usuario indica quién.

6. Marca la issue `in-review` (quita `in-progress`). Comprueba que CI arranca.

## Qué NO hacer

- No menciones asistentes ni herramientas de IA en la PR.
- No abras PR sin cuerpo.
- No mezcles cambios no relacionados.
- No fusiones tú: el merge es del usuario (o de devops si el flujo de entrega lo dice).
