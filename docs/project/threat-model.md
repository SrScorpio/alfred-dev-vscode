# Modelo de amenazas: extension nativa VSIX

**Fecha:** 2026-09-15
**Autor:** senior-dev (revisión técnica; no sustituye la gate de security-officer)
**Commit revisado:** entrega actual
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
  extension -->|custodia de clave| secrets[VS Code SecretStorage]
  extension -->|socket one-shot 32 bytes| mcp
  mcp -->|put get search cifrados| memory[Sobre JSON AES-256-GCM]
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
| Clave de cifrado de memoria | Secreto | Lectura o manipulación de toda la memoria local. |
| Blobs staged del indice Git | Sensible potencial | Commit accidental de credenciales. |
| Proceso MCP local | Integridad y disponibilidad | Escritura indebida o agotamiento del host. |
| Configuracion `.ralph` | No confiable | Lectura de rutas o tareas fuera del workspace. |
| Lockfile y dependencias de build | Integridad | Ejecucion de codigo comprometido durante build o empaquetado. |

## Analisis STRIDE

### Spoofing (suplantacion de identidad)

No se implementa autenticacion propia. Los comandos de chat se registran con identificadores propios y abren `workbench.action.chat.open` con literales, no con texto de `status.md`. La identidad del usuario y el chat dependen de VS Code/Copilot, fuera del alcance probado.

### Tampering (manipulacion)

`status.md` es controlable por el workspace, pero sus valores solo se convierten en etiquetas y no seleccionan comandos ni rutas. La cadena de empaquetado usa una allowlist que parte de `*` y `npx vsce ls --tree` confirma que solo distribuye runtime y metadatos.

La galería escapa texto, usa nonce y CSP sin recursos remotos. La memoria
sanitiza credenciales comunes, cifra cada payload con AES-256-GCM e IV aleatorio,
autentica el formato, limita el sobre JSON antes de escribir y usa un temporal
con `rename` atómico. MCP y fallback comparten ese backend; el proceso y la ruta son fijos
desde la extensión. Los ficheros legados `version: 1` se rechazan de forma
explícita en lugar de migrar texto sensible silenciosamente. Secret Guard lee el índice con `git show :<path>` usando
`execFile`/argv, y Git resuelve la ruta de hooks incluso en worktrees. Ralph
valida workspace trust, IDs, estados, rutas y tamaño; `runTask` lee
`.ralph/config.json` antes de pedir el ID. Solo resuelve el ID
`ralph-suite.ralph-suite`, cada acción exige su comando exacto y la
sincronización solo se confirma si ese proveedor anuncia el comando.

### Repudiation (repudio)

No hay registro de acciones de seguridad, publicacion de VSIX ni cambios de perfil atribuible. Para un producto distribuido debe existir trazabilidad de releases y un proceso de incidentes.

### Information Disclosure (fuga de informacion)

`npx vsce ls --tree` no incluye salidas locales, `.vscode/`, documentación interna, mapas, fuentes, tests, dependencias ni skills. Los diagnósticos y la memoria redactan GitHub tokens, Bearer, `sk-*`, bloques PEM y credenciales AWS. La memoria persiste solo ciphertext AES-256-GCM; la clave se genera y custodia en `SecretStorage`, no en `memory.json`. El hijo MCP recibe solo la ruta del JSON y `ALFRED_DEV_MEMORY_KEY_SOCKET`; la clave cruza por IPC local de un solo uso (32 bytes, un accept, timeout corto) porque la API stdio de VS Code no permite inyectar un descriptor. Tras `listen`, el socket Unix queda `0o600`; el path sigue enumerable por el mismo usuario. En Windows el listener usa `exclusive: true`; Node `net` no expone DACL del named pipe y no se finge un ACL de solo el usuario actual (Everyone puede ser residual en máquinas compartidas). Residual: un proceso del mismo usuario que conozca el path durante esa ventana podría ganar la primera conexión. El hook no imprime contenido ni rutas: solo el número de ficheros staged con hallazgos. El comando de borrado local elimina fichero y clave de este perfil y recicla el provider MCP; no cubre marketplace ni Copilot.

### Denial of Service (denegacion de servicio)

La lectura de `status.md` es asincrona y se rechaza antes de abrir el fichero si supera 64 KiB; solo `ENOENT` se comunica como ausencia de snapshot. La memoria rechaza antes del write cualquier JSON superior a 256 KiB; `.ralph` limita configuración y tareas. Los diagnósticos de secretos no escanean documentos de más de 64 KiB. El hook limita cada blob a 1 MiB y bloquea si no puede analizarlo. No hay endpoints de red propios.

### Elevation of Privilege (elevacion de privilegios)

No hay comandos derivados de contenido de workspace. La configuracion declara
el enum `luna`, `terra`, `sol`; debe mantenerse ese limite en cualquier futura
ruta de escritura. Galería e instalación del hook exigen workspace trust. El
provider MCP solo se registra con opt-in, feature detection y workspace trust;
si el usuario concede trust o activa `alfred-dev.memory.enabled` durante la
sesión, se registra, y si desactiva el opt-in se libera, sin doble registro.
Tras `alfred-dev.memory.clear` se dispone el registro y, si el opt-in y el
trust siguen, se vuelve a registrar una sola vez.
En runtimes sin API queda una degradación explícita por comandos.
Ralph recibe únicamente un
número y un estado seleccionados por el usuario, nunca cuerpos de issues ni
prompts, y no se simula paralelismo sin API/scheduler público.

## Matriz de riesgo

| Amenaza | Probabilidad | Impacto | Riesgo | Mitigacion |
|---------|--------------|---------|--------|------------|
| VSIX incluye artefactos locales no revisados | Baja | Alto | Bajo | Mitigado: allowlist de release y `npx vsce ls --tree` con runtime y metadatos. Mantener comprobacion en CI. |
| `status.md` agota el host de extensiones | Baja | Medio | Bajo | Mitigado: limite previo de 64 KiB, lectura asincrona y limite de longitud renderizada. |
| Cambio no autorizado de la preferencia global | Baja | Bajo | Bajo | Mantener enum en `contributes.configuration` y no aceptar valores desde `status.md`. |
| Dependencia comprometida en build | Baja | Alto | Medio | Lockfile con integridad, SBOM, `npm audit` y actualizaciones revisadas. |
| Fuga de secretos en VSIX | Baja | Alto | Medio | Escaneo de secretos y lista de archivos permitidos antes de publicar. |
| Secreto guardado en memoria local | Baja | Alto | Bajo | Memoria apagada por defecto, sanitización, AES-256-GCM, clave en `SecretStorage`, cap previo al write, comando de borrado local con recycle MCP y sin red. Residual: el path del socket one-shot sigue enumerable por el mismo usuario durante el arranque (Unix `0o600`; Windows sin DACL explícita). |
| MCP arranca sin consentimiento o ejecuta una ruta manipulada | Baja | Alto | Bajo | Provider solo con opt-in/API/trust, registro y dispose reactivos a configuración y trust, definición fija y proceso iniciado bajo demanda por VS Code. |
| Hook omite un secreto staged por leer el working tree | Baja | Alto | Bajo | Enumera con `-z` y analiza cada blob del índice mediante `git show` sin shell. |
| Webview con contenido local inseguro | Baja | Alto | Bajo | CSP nonce, escape HTML, sin recursos remotos ni raíces locales. |
| Extensión impostora ejecuta comandos `ralph-suite.*` | Baja | Alto | Bajo | Lookup exclusivo del ID `ralph-suite.ralph-suite` y capacidad exacta por acción. |
| Ralph lee o ejecuta fuera del workspace | Baja | Alto | Bajo | Workspace trust, `runTask` valida `.ralph/config.json` antes del prompt, rutas sin `..`, comandos fijos y sync condicionado a una capacidad anunciada. |
| Diagnósticos de secretos agotan el host | Baja | Medio | Bajo | Tope de 64 KiB antes de escanear el documento guardado; el hook staged sigue en 1 MiB. |

## Recomendaciones

1. Mantener en CI una comprobacion de `npx vsce ls` que permita exclusivamente runtime y metadatos de release aprobados.
2. `SECURITY.md` (2026-09-15) documenta matriz de versiones soportadas, SLA de divulgación y protocolo NIS2 art. 23. Residual: no hay GitHub Release, Marketplace ni clasificación NIS2 del titular; GHAS/CodeQL no está habilitado.
3. Mantener la confirmacion explicita de la galería, el opt-in de memoria y la instalación voluntaria del hook.
4. El canal one-shot sustituye la clave en entorno. Unix aplica `chmod 0o600` tras `listen`. Residual restante: el path del socket es visible en el entorno del hijo; un proceso del mismo usuario puede ganar el `accept`; VS Code no permite un descriptor heredado. En Windows no hay DACL nativa vía Node `net`.
5. Completar el wipe RGPD: retención, portabilidad y evidencia sobre marketplace/Copilot. El comando local borra fichero, clave de este perfil y recicla el provider MCP.