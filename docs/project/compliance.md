# Registro de compliance

No es un dictamen juridico. Es un registro tecnico con evidencia de la revision actual de la extension nativa para VSIX.

**Fecha:** 2026-09-15
**Autor:** security-officer (revisión técnica de proceso CRA/NIS2; no es dictamen jurídico)

## Alcance

| Marco | Aplica | Motivo |
|-------|--------|--------|
| RGPD | parcial | El codigo lee Markdown del workspace, puede guardar memoria local solo con opt-in y guarda una preferencia global (`alfred-dev.modelProfile`) en VS Code. `alfred-dev.checkUpdate` hace un GET HTTPS público a GitHub Releases (`/repos/SrScorpio/alfred-dev-vscode/releases/latest`), User-Agent `alfred-dev-vscode`, sin token y bajo demanda; no es telemetría. El TreeView hace un segundo GET público a `api.github.com/repos/{owner}/{repo}/issues` (mismo User-Agent, sin token) si el workspace es trusted. No hay evidencia sobre la base juridica, informacion al usuario, retencion o tratamiento realizado por el marketplace, VS Code, Copilot o GitHub al atender esa consulta. |
| NIS2 | pendiente | La condicion de entidad esencial/importante o proveedor sujeto a NIS2 sigue sin clasificar por el titular. `SECURITY.md` (2026-09-15) documenta relojes de alerta 24 h / notificacion 72 h / informe final 1 mes alineados con el art. 23; no hay evidencia de notificacion a CSIRT, ENISA ni de que esas obligaciones juridicas recaigan sobre este publicador. |
| CRA | parcial | Una extension VSIX distribuida puede ser un producto con elementos digitales si se comercializa o distribuye en la UE. Hay SBOM CycloneDX, audit de dependencias, canal de reporte, matriz de versiones soportadas, SLA de divulgacion y politica de actualizaciones en `SECURITY.md`. No hay GitHub Release, no hay Marketplace y este registro no declara conformidad juridica. |

## Controles

| Control | Marco | Estado | Evidencia |
|---------|-------|--------|-----------|
| Inventario de componentes directos y transitivos | CRA | cumple | `npm run sbom` genera y valida `docs/project/sbom.cdx.json` CycloneDX 1.5 desde `package-lock.json`: 357 componentes, 404 relaciones y 0 componentes sin licencia. La herramienta 6.0.1 está fijada como dependencia de desarrollo. |
| Analisis de vulnerabilidades conocidas | CRA / NIS2 | cumple | `npm audit --audit-level=high` del 2026-09-14, tras `npm ci`: `found 0 vulnerabilities`. Incluye el parche transitivo `js-yaml` 4.3.1 -> 4.3.2 (GHSA-2883-xcg3-v3hh) aplicado con `npm audit fix` sin `--force`. |
| Integridad de la cadena de build | CRA / NIS2 | cumple | `package-lock.json` v3 fija integridades SHA-512. `npx vsce ls --tree` en la entrega actual enumera metadatos y JavaScript bajo `out/`; excluye fuentes, tests, dependencias, skills, documentos internos y mapas. |
| Minimizacion y finalidad de datos | RGPD art. 5 | parcial | El TreeView lee solo `docs/project/status.md`; la memoria requiere opt-in, limita el sobre cifrado a 256 KiB, limita entradas y valores, y sanitiza secretos; MCP y comandos usan el mismo almacenamiento global local; la galería guarda solo la elección confirmada. El borrado local es explícito y de este perfil. Falta inventario del tratamiento de marketplace/Copilot y aviso de privacidad del responsable. |
| Base juridica y transparencia | RGPD arts. 6 y 13 | pendiente | No hay politica de privacidad ni evidencia de base juridica para la preferencia global o los servicios de terceros asociados. |
| Derechos de acceso, supresion y portabilidad | RGPD arts. 15, 17 y 20 | parcial | El comando `alfred-dev.memory.clear` borra el fichero cifrado y la clave de `SecretStorage` de este perfil, con confirmación, y recicla el provider MCP. No hay portabilidad formal ni evidencia sobre datos tratados por publicador, marketplace o Copilot. |
| Seguridad del tratamiento | RGPD art. 32 | parcial | Memoria local opt-in cifrada con AES-256-GCM e IV aleatorio, clave de 256 bits custodiada por `SecretStorage`, escritura atómica, límites y sanitización de Bearer, `sk-*`, PEM, GitHub y AWS. El formato legado en claro se rechaza. Secret Guard es explícito; la galería usa CSP/nonce; memoria y Ralph exigen workspace trust. La clave MCP no viaja en el entorno del hijo: cruza por un socket local de un solo uso. En Unix el socket queda `0o600` tras `listen`. Residual: el path sigue enumerable por el mismo usuario; en Windows Node `net` no expone DACL. |
| Secretos y ejecución local | CRA / NIS2 | parcial | El hook obtiene blobs staged mediante `git show` con argumentos sin shell, no imprime valores y resuelve hooks con Git para admitir worktrees. Los diagnósticos al guardar no escanean más de 64 KiB. El MCP solo se registra con opt-in, API y trust; reacciona a `onDidGrantWorkspaceTrust` y a `alfred-dev.memory.enabled`, expone tres tools y no usa red. Ralph solo resuelve `ralph-suite.ralph-suite`, valida `.ralph/config.json` antes de `runTask` y no procesa contenido remoto como instrucciones. `syncIssue` y paralelismo siguen no disponibles en Ralph Suite 1.9.1. |
| Gestion de riesgos y cadena de suministro | NIS2 arts. 20 y 21 | parcial | Audit, lockfile, modelo STRIDE y protocolo de incidentes en `SECURITY.md` y `docs/project/incidents/`. Faltan propietario de riesgo, clasificacion NIS2 del titular y politica formal de proveedores. |
| Notificacion de incidentes | NIS2 art. 23 | parcial | `SECURITY.md` fija alerta temprana 24 h, notificacion 72 h e informe final 1 mes desde el conocimiento efectivo, con archivo en `docs/project/incidents/`. Canal: Security Advisories y perfil GitHub. No hay evidencia de envio a CSIRT/ENISA ni clasificacion del titular; no hay SOC 24/7. Este estado no es conformidad juridica. |
| Gestion y divulgacion de vulnerabilidades | CRA | parcial | `SECURITY.md` publica canal, SLA de acuse 24 h, analisis inicial 72 h y correccion o mitigacion segun severidad (7/14/30 dias), mas matriz de versiones soportadas (`0.6.5`, VS Code `^1.85.0`, sin GitHub Releases a 2026-09-15). No se marca `cumple` juridico: no hay Release, no hay Marketplace y el formulario de Advisories puede no estar habilitado. |
| Actualizaciones de seguridad | CRA | parcial | `SECURITY.md` compromete correcciones o mitigaciones de la linea soportada en el repositorio y, cuando existan, Releases. A 2026-09-15 no hay GitHub Release ni VSIX en Marketplace; el canal verificable es `main`. No se garantiza actualizacion en Marketplace. |

## Hallazgos activos

Ninguno con severidad critica o alta en el alcance de esta revision. Los residuales
de severidad media se listan en condiciones pendientes.

## Hallazgos cerrados

- **Ubicacion:** `package-lock.json` (`node_modules/js-yaml`)
- **Severidad:** ALTA (confianza: 99)
- **Categoria:** CRA / cadena de suministro / GHSA-2883-xcg3-v3hh
- **Hallazgo:** `js-yaml` 4.3.1, transitiva de desarrollo, no limita CPU con merge keys vacias.
- **Vector de ataque:** YAML malicioso durante build o empaquetado (`vsce` / CycloneDX), no en el VSIX de runtime.
- **Impacto:** Denegacion de servicio en la cadena de build.
- **Solucion:** `npm audit fix` sin `--force` resolvio 4.3.2; `npm ci` y `npm audit --audit-level=high` del 2026-09-14 informan `found 0 vulnerabilities`. El contrato de empaquetado fija esa version.

- **Ubicacion:** `src/memory/memoryStore.ts`, `src/memory/memoryIntegration.ts` y `src/extension.ts`
- **Severidad:** ALTA (confianza: 99)
- **Categoria:** OWASP A02 / RGPD art. 32 / CRA
- **Hallazgo:** La memoria opt-in se persistía como JSON legible sin cifrado verificable.
- **Vector de ataque:** Lectura del almacenamiento global de la extensión por otro proceso o copia del perfil local.
- **Impacto:** Exposición de contexto potencialmente sensible pese a la sanitización de patrones conocidos.
- **Solucion:** Sobre `version: 2` AES-256-GCM, clave aleatoria fuera del fichero y custodiada por `SecretStorage`, límites antes de persistir, rechazo explícito del formato legado y tests de round-trip, no texto plano y clave ausente.

- **Ubicacion:** `.vscodeignore` y contenido evaluado por `npx vsce ls`
- **Severidad:** MEDIA (confianza: 99)
- **Categoria:** OWASP A05 / CRA
- **Hallazgo:** La allowlist parte de `*`, reintroduce solo los metadatos y JavaScript de `out/`, y las exclusiones explicitas cubren contenido no distribuible.
- **Vector de ataque:** Un arbol de trabajo con contenido local no versionado intentaba colarse en el VSIX.
- **Impacto:** Habria permitido filtrar informacion interna o distribuir artefactos no auditados.
- **Solucion:** `npx vsce ls --tree` confirma la allowlist de runtime y metadatos, y la ausencia de salidas locales, documentos internos, mapas, fuentes, tests, dependencias y skills. Mantener esta comprobacion en CI antes de publicar.

- **Ubicacion:** `src/providers/statusTreeProvider.ts`
- **Severidad:** MEDIA (confianza: 99)
- **Categoria:** OWASP A04 / A05
- **Hallazgo:** En el artefacto revisado, `readStatusFile` ejecuta `fs.stat` antes de `fs.readFile`, rechaza archivos de mas de 64 KiB y el TreeView usa la API asincrona.
- **Vector de ataque:** Un repositorio malicioso o corrupto aporta un `docs/project/status.md` desproporcionadamente grande y el usuario abre o refresca el TreeView.
- **Impacto:** Habria podido causar denegacion local de servicio y degradar el host de extensiones.
- **Solucion:** El error por tamano no se trata como `ENOENT`; `statusTreeProvider` muestra error generico y reserva «Sin snapshot local» exclusivamente para `ENOENT`. Los campos mostrados se limitan a 200 caracteres.

- **Ubicacion:** `src/extension.ts`, `src/memory/memoryKeyChannel.ts` y `src/memory/memoryMcpServer.ts`
- **Severidad:** MEDIA (confianza: 99)
- **Categoria:** OWASP A02 / RGPD art. 32
- **Hallazgo:** La clave AES-256-GCM cruzaba al hijo MCP por `ALFRED_DEV_MEMORY_KEY` en el entorno permanente del proceso.
- **Vector de ataque:** Un proceso del mismo usuario lee el entorno del hijo mientras vive.
- **Impacto:** Lectura o reescritura de toda la memoria local cifrada.
- **Solucion:** Canal one-shot local (pipe Windows / socket Unix): 32 bytes, un accept, timeout corto. El entorno del hijo solo lleva path JSON y `ALFRED_DEV_MEMORY_KEY_SOCKET`. Tras `listen`, Unix aplica `chmod 0o600`. Windows usa `listen({ path, exclusive: true })` sin fingir DACL: Node `net` no la expone sin FFI. Residual: el path del socket es enumerable por el mismo usuario durante esa ventana; VS Code no inyecta descriptores. En máquinas Windows compartidas Everyone puede seguir en la DACL por defecto.

- **Ubicacion:** `src/memory/memoryIntegration.ts` y `src/commands/index.ts`
- **Severidad:** MEDIA (confianza: 99)
- **Categoria:** RGPD art. 17
- **Hallazgo:** `alfred-dev.memory.clear` borraba fichero y clave, pero un hijo MCP ya arrancado conservaba la clave vieja y podía reescribir `memory.json`.
- **Vector de ataque:** Wipe local con el proceso MCP aún vivo.
- **Impacto:** Persistencia de datos que el usuario creía borrados.
- **Solucion:** Tras un wipe con éxito se dispone el registro MCP y, si opt-in y trust siguen, se vuelve a registrar una sola vez.

## Condiciones pendientes

- GitHub Advanced Security / CodeQL no está evidenciado como SAST completo.
	La API del repositorio (2026-09-15) reporta `secret_scanning` y
	`secret_scanning_push_protection` habilitados, y Dependabot security
	updates. Eso no sustituye GHAS ni el scanner local de los 17 JavaScript
	empaquetables.
- El titular no está clasificado como entidad esencial, importante ni
	proveedor sujeto a NIS2. Los relojes del art. 23 en `SECURITY.md` son
	proceso interno; no hay evidencia de notificación a CSIRT o ENISA.
- No hay política de privacidad ni evidencia de base jurídica para el
	tratamiento de marketplace, VS Code o Copilot. Fuera del alcance de #21.
- No hay GitHub Release ni VSIX en Marketplace. La política de
	actualizaciones no puede cumplir un canal de publicación que no existe.
- El path del socket one-shot (`ALFRED_DEV_MEMORY_KEY_SOCKET`) sigue en el entorno del hijo durante el arranque. Un proceso del mismo usuario podría ganar la primera conexión en esa ventana. Unix recorta el inode a `0o600`; Windows no tiene DACL explícita vía Node `net`. VS Code no permite inyectar un descriptor heredado. Residual MEDIA de IPC local (mismo usuario; named pipe Windows en hosts compartidos), no de clave en entorno.
- El comando de borrado local cubre fichero, clave de este perfil y recycle del provider MCP. Falta política de retención, portabilidad y wipe de datos tratados por marketplace o Copilot.