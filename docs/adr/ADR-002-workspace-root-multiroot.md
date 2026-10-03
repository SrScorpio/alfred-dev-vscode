# ADR-002: Carpeta de workspace en multi-root

**Fecha:** 2026-10-03
**Estado:** aceptado
**Autor:** architect

## Contexto

`ralph-suite.runTask` y `ralph-suite.syncIssue` aceptan un `workspaceRoot`
opcional. Ralph lo valida contra la allowlist de
`vscode.workspace.workspaceFolders` (`resolveCommandWorkspaceRoot` en
`ralph-suite/src/activate.ts`) y, si no llega, elige la carpeta que tiene PRD
o, si ninguna lo tiene, la primera.

Alfred ya resolvía esa carpeta para leer el PRD del QuickPick
(`findRalphWorkspaceRoot`), pero el puente solo enviaba `taskId` o el número
de issue y el estado. En una ventana con varias carpetas, la carpeta que
Alfred había leído y la que Ralph ejecutaba podían no coincidir. Si dos
carpetas tienen PRD, ambos eligen la primera de la lista.

## Opciones evaluadas

### Opción 1: Alfred pasa la carpeta del QuickPick

El valor sale de `workspaceFolders`. Alfred solo lo envía si sigue estando
en esa lista. Ralph lo vuelve a comprobar contra su allowlist y rechaza
cualquier otra ruta.

**Ventajas:**
- La carpeta leída y la carpeta ejecutada son la misma.
- La allowlist de Ralph sigue siendo la barrera: Alfred no puede apuntar fuera del workspace.
- Sin carpeta, el argumento se omite y Ralph conserva su fallback.

**Desventajas:**
- Con dos PRD gana el primero de `workspaceFolders`. No hay selector de carpeta.
- Un `workspaceRoot` que Ralph no tenga en su allowlist hace fallar el comando.

### Opción 2: Aceptar el límite y no enviar la carpeta

Dejar que Ralph elija siempre: carpeta con PRD, o la primera.

**Ventajas:**
- Ningún cambio de contrato en el puente.
- No aparece un argumento nuevo que Ralph pueda rechazar.

**Desventajas:**
- Alfred y Ralph pueden resolver la carpeta por separado y divergir.
- El hueco de `docs/ralph/integracion.md` se queda abierto a propósito.

### Opción 3: QuickPick de carpeta antes de la tarea

Pedir al usuario qué carpeta usar cuando hay más de un PRD.

**Ventajas:**
- Cubre el caso de dos PRD de forma explícita.

**Desventajas:**
- Añade un paso que esta decisión no necesita: la regla ya es «la primera carpeta con PRD».
- Duplica en la paleta de Alfred una elección que el Kanban de Ralph ya puede hacer.

## Decisión

Se adopta la opción 1. Alfred envía en `runTask` y `syncIssue` la carpeta que
ya usó para el QuickPick, y solo si ese valor pertenece a
`workspaceFolders`. Ralph valida el argumento contra su allowlist. Si Alfred
no tiene carpeta, no envía el argumento.

Con dos PRD se pasa la primera carpeta de `workspaceFolders` que contiene un
PRD. No hay selector de carpeta.

## Justificación

La allowlist ya existe en Ralph y el valor ya existía en Alfred. Pasarlo
cierra la divergencia sin abrir una ruta nueva ni pedir otra confirmación al
usuario. La opción 2 deja el fallo que esta tarea describe. La opción 3
resuelve un caso que la regla de «primera carpeta con PRD» ya decide.

## Consecuencias

### Positivas
- `runTask` y `syncIssue` nombran la misma carpeta que alimentó el QuickPick.
- Una ruta fuera de `workspaceFolders` no sale de Alfred.
- Ralph sigue pudiendo rechazar una raíz que no esté en su allowlist.

### Negativas
- Dos PRD en la misma ventana siguen sin selector: gana el primero.
- Si la allowlist de Ralph y las `workspaceFolders` de Alfred no coinciden, el comando falla en vez de caer al fallback.

## Referencias

- `src/integrations/ralph.ts`: `findRalphWorkspaceRoot`, `selectRalphCommandRoot`, `RalphBridge`.
- `src/commands/index.ts`: `getRalphWorkspaceRoot`.
- `docs/ralph/integracion.md`.
- `ralph-suite/src/activate.ts`: `resolveCommandWorkspaceRoot`.
