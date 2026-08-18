# <Nombre-del-proyecto> — Instrucciones del proyecto

> Plantilla de alfred-dev-vscode. Copia este fichero a la raíz de tu proyecto como
> `AGENTS.md` (o `.github/copilot-instructions.md`) y rellena los `<...>`.
> Lo que pongas aquí manda sobre las instrucciones globales del equipo — salvo en
> seguridad y secretos, que no se negocian.

## Leer primero

`<plans/ | docs/>` es la fuente de verdad de este proyecto. Antes de tocar código, leer:

1. `<ruta>/README.md` — índice y estado actual
2. `<ruta>/arquitectura.md` (o `docs/project/architecture.md`)
3. `<ruta>/seguridad.md` (o `docs/project/threat-model.md`)
4. `<ruta>/decisiones.md` (o `docs/adr/`) — decisiones aceptadas; si tu trabajo contradice una, señalarlo antes de seguir

Si este fichero choca con esa documentación, gana la documentación.

## Stack actual

- Frontend: <...>
- Backend: <...>
- Base de datos / auth: <...>
- Infraestructura / despliegue: <...>

## Innegociables

- <p. ej.: No introducir frameworks de frontend sin ADR previo.>
- <p. ej.: No cambiar auth, CORS, pagos ni webhooks sin checkpoint explícito del usuario.>
- <p. ej.: No añadir dependencias sin aprobación y documentación.>
- <p. ej.: No borrar ficheros sin confirmación.>
- <p. ej.: Preservar los puentes `window.*` existentes.>

## Reglas de modularización / refactor

- Una fase cada vez; conservar comportamiento salvo indicación expresa de la fase.
- Módulos nuevos ≤ 300 líneas; funciones nuevas ≤ 40 líneas.
- Funciones públicas con JSDoc/docstring breve en inglés.
- No crear wrappers vacíos, abstracciones especulativas ni helpers sin uso.
- Usar el logger del proyecto en vez de `console.log` / `print`.

## Antes de mover código

- Localizar todos los callers (búsqueda global, handlers inline en HTML, globales).
- Identificar tests afectados y endpoints/rutas implicadas.

## Después de mover código

- Validar páginas/endpoints afectados y que los globales requeridos siguen existiendo.
- Ejecutar los tests focalizados de la fase.
- Documentar fallos preexistentes en lugar de mezclar fixes del refactor.

## Comandos de validación

```bash
# <tests>
# <lint>
# <build>
```
