# Modelo de amenazas: extension nativa VSIX

**Fecha:** 2026-09-03
**Autor:** senior-dev (revisión técnica; no sustituye la gate de security-officer)
**Commit revisado:** `f23eedefefe5264a80ad431dcc580a00ac248cce`
**Metodologia:** STRIDE

## Superficie de ataque

La extension se activa en VS Code, lee `docs/project/status.md` del primer workspace, muestra campos parseados en un TreeView, abre el chat con mensajes fijos `@alfred`, ofrece memoria local opt-in por MCP o comandos, diagnósticos de secretos, una galería local, un hook Git explícito y un puente opcional a Ralph Suite. La cadena de release compila TypeScript y usa `@vscode/vsce` para crear el VSIX.

```mermaid
flowchart LR
  workspace[Workspace controlado por usuario] -->|status.md| extension[Host de extension VS Code]
  extension -->|campos renderizados| tree[TreeView]
  extension -->|mensaje fijo @alfred| chat[GitHub Copilot Chat]
  extension -->|luna terra sol| config[Configuracion global VS Code]
  extension -->|opt-in y feature detection| mcp[Servidor MCP stdio]
  extension -->|fallback compatible| commands[Comandos de memoria]
  mcp -->|put get search| memory[Memoria JSON global local]
  commands -->|put get search| memory
  gitindex[Indice Git no confiable] -->|git show con argv| hook[Secret Guard]
  extension -->|comandos fijos| ralph[Ralph Suite opcional]
  source[Repositorio y lockfile] --> build[Build local]
  build --> vsce[@vscode/vsce]
  vsce --> vsix[VSIX distribuido]
```

## Activos a proteger

| Activo | Clasificacion | Impacto de compromiso |
|--------|--------------|-----------------------|
| Contenido del VSIX | Integridad | Distribucion de codigo o datos no revisados. |
| Host de extensiones VS Code | Disponibilidad | Bloqueo local del editor. |
| Preferencia de modelo | Baja sensibilidad | Alteracion de la politica visual de coste. |
| Contenido de `status.md` | No confiable | Desinformacion de la interfaz o consumo de recursos. |
| Memoria local | Sensible potencial | Persistencia accidental de contexto o secretos. |
| Blobs staged del indice Git | Sensible potencial | Commit accidental de credenciales. |
| Proceso MCP local | Integridad y disponibilidad | Escritura indebida o agotamiento del host. |
| Configuracion `.ralph` | No confiable | Lectura de rutas o tareas fuera del workspace. |
| Lockfile y dependencias de build | Integridad | Ejecucion de codigo comprometido durante build o empaquetado. |

## Analisis STRIDE

### Spoofing (suplantacion de identidad)

No se implementa autenticacion propia. Los comandos de chat se registran con identificadores propios y abren `workbench.action.chat.open` con literales, no con texto de `status.md`. La identidad del usuario y el chat dependen de VS Code/Copilot, fuera del alcance probado.

### Tampering (manipulacion)

`status.md` es controlable por el workspace, pero sus valores solo se convierten en etiquetas y no seleccionan comandos ni rutas. La cadena de empaquetado usa una allowlist que parte de `*` y `npx vsce ls --tree` confirma que solo distribuye 20 ficheros de runtime y metadatos.

La galería escapa texto, usa nonce y CSP sin recursos remotos. La memoria
sanitiza credenciales comunes, limita el JSON antes de escribir y usa un
temporal con `rename` atómico. MCP y fallback comparten ese backend; el proceso y la ruta son fijos
desde la extensión. Secret Guard lee el índice con `git show :<path>` usando
`execFile`/argv, y Git resuelve la ruta de hooks incluso en worktrees. Ralph
valida workspace trust, IDs, estados, rutas y tamaño; los comandos se invocan
por nombres fijos.

### Repudiation (repudio)

No hay registro de acciones de seguridad, publicacion de VSIX ni cambios de perfil atribuible. Para un producto distribuido debe existir trazabilidad de releases y un proceso de incidentes.

### Information Disclosure (fuga de informacion)

`npx vsce ls --tree` no incluye salidas locales, `.vscode/`, documentación interna, mapas, fuentes, tests, dependencias ni skills. Los diagnósticos y la memoria redactan GitHub tokens, Bearer, `sk-*`, bloques PEM y credenciales AWS. El hook no imprime contenido ni rutas: solo el número de ficheros staged con hallazgos.

### Denial of Service (denegacion de servicio)

La lectura de `status.md` es asincrona y se rechaza antes de abrir el fichero si supera 64 KiB; solo `ENOENT` se comunica como ausencia de snapshot. La memoria rechaza antes del write cualquier JSON superior a 256 KiB; `.ralph` limita configuración y tareas. El hook limita cada blob a 1 MiB y bloquea si no puede analizarlo. No hay endpoints de red propios.

### Elevation of Privilege (elevacion de privilegios)

No hay comandos derivados de contenido de workspace. La configuracion declara
el enum `luna`, `terra`, `sol`; debe mantenerse ese limite en cualquier futura
ruta de escritura. Galería e instalación del hook exigen workspace trust. El
provider MCP solo se registra con opt-in y feature detection; en runtimes sin
API queda una degradación explícita por comandos. Ralph recibe únicamente un
número y un estado seleccionados por el usuario, nunca cuerpos de issues ni
prompts, y no se simula paralelismo sin API/scheduler público.

## Matriz de riesgo

| Amenaza | Probabilidad | Impacto | Riesgo | Mitigacion |
|---------|--------------|---------|--------|------------|
| VSIX incluye artefactos locales no revisados | Baja | Alto | Bajo | Mitigado: allowlist de release y `npx vsce ls --tree` con 20 ficheros. Mantener comprobacion en CI. |
| `status.md` agota el host de extensiones | Baja | Medio | Bajo | Mitigado: limite previo de 64 KiB, lectura asincrona y limite de longitud renderizada. |
| Cambio no autorizado de la preferencia global | Baja | Bajo | Bajo | Mantener enum en `contributes.configuration` y no aceptar valores desde `status.md`. |
| Dependencia comprometida en build | Baja | Alto | Medio | Lockfile con integridad, SBOM, `npm audit` y actualizaciones revisadas. |
| Fuga de secretos en VSIX | Baja | Alto | Medio | Escaneo de secretos y lista de archivos permitidos antes de publicar. |
| Secreto guardado en memoria local | Baja | Alto | Medio | Memoria apagada por defecto, sanitización ampliada, cap previo al write, almacenamiento global local y sin red. |
| MCP arranca sin consentimiento o ejecuta una ruta manipulada | Baja | Alto | Bajo | Provider solo con opt-in/API, definición fija y proceso iniciado bajo demanda por VS Code. |
| Hook omite un secreto staged por leer el working tree | Baja | Alto | Bajo | Enumera con `-z` y analiza cada blob del índice mediante `git show` sin shell. |
| Webview con contenido local inseguro | Baja | Alto | Bajo | CSP nonce, escape HTML, sin recursos remotos ni raíces locales. |
| Ralph lee o ejecuta fuera del workspace | Baja | Alto | Bajo | Workspace trust, esquema estricto, rutas sin `..`, comandos fijos y sync limitado a issue/estado. |

## Recomendaciones

1. Mantener en CI una comprobacion de `npx vsce ls` que permita exclusivamente runtime y metadatos de release aprobados.
2. Anadir politica de vulnerabilidades y soporte de actualizaciones para cerrar los controles CRA/NIS2 pendientes.
3. Mantener la confirmacion explicita de la galería, el opt-in de memoria y la instalación voluntaria del hook.