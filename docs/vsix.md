# Extensión VS Code y VSIX

La extensión nativa añade una vista de estado y comandos de Alfred Dev a VS
Code. Requiere VS Code `^1.85.0` y GitHub Copilot Chat para las acciones que
abren el chat con `@alfred`.

## Uso

### Activity Bar y TreeView

1. Abre **Alfred Dev** en la Activity Bar.
2. En **Estado del Proyecto (status.md)** consulta el flujo, la fase, la gate
   pendiente y la siguiente acción del primer workspace abierto.
3. Usa las acciones del árbol para **Refrescar estado**, **Hablar con Alfred**
   o **Seleccionar perfil de modelo**.

La vista lee `docs/project/status.md` desde el primer workspace. Si el fichero
no existe, muestra que el estado vive en GitHub Issues; si no hay un workspace,
muestra que no hay ninguno abierto. El lector rechaza snapshots de más de 64
KiB y el parser limita cada campo visible a 200 caracteres.

### Paleta de comandos

Abre la Paleta de comandos y busca la categoría **Alfred Dev**:

| Comando | Resultado |
|---------|-----------|
| **Alfred Dev: Iniciar Flujo (Feature, Fix, Audit, Ship)** | Permite elegir un flujo y abre el chat con `@alfred`. |
| **Alfred Dev: Refrescar Estado** | Vuelve a leer y representar el snapshot local. |
| **Alfred Dev: Hablar con Alfred** | Abre el chat con `@alfred`. |
| **Alfred Dev: Seleccionar perfil de modelo** | Guarda el perfil elegido como ajuste global. |

## Perfil global de modelo

El ajuste `alfred-dev.modelProfile` acepta `luna`, `terra` o `sol` y tiene
`luna` como valor predeterminado. El comando **Alfred Dev: Seleccionar perfil
de modelo** lo guarda con alcance **global**, por lo que es una preferencia
de la instalación de VS Code y no de un agente o workspace concreto.

Este selector es una referencia de coste y de uso para la interfaz. No
reescribe ni selecciona dinámicamente los arrays `model` del frontmatter de
los agentes: esos arrays siguen definiendo su propia prioridad y sus fallbacks.

## Desarrollo local

Desde la raíz del repositorio:

```bash
npm ci
npm test
npm run compile
npm run package
```

`npm ci` instala las dependencias fijadas por el lockfile. `npm test` ejecuta
los contratos con `node:test` y compila antes mediante `pretest`. `npm run
compile` genera JavaScript en `out/`. `npm run package` crea el VSIX local con
`@vscode/vsce`; no publica nada en el Marketplace.

## Contenido permitido del VSIX

`.vscodeignore` aplica una allowlist al paquete. El VSIX contiene únicamente:

- `out/**/*.js`, el runtime compilado de la extensión;
- `package.json`, el manifiesto de contribuciones de VS Code;
- `README.md`, la documentación principal;
- `LICENSE`, la licencia del proyecto.

Quedan excluidos, entre otros, `src/`, `tests/`, `docs/`, `agents/`, `skills/`,
`instructions/`, `templates/`, `plugin.json`, los instaladores, los mapas de
fuente, `.github/`, `.vscode/` y `node_modules/`. Por eso el VSIX distribuye la
interfaz nativa y su runtime, no el catálogo completo de agentes y skills.
