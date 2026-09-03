# Registro de compliance

No es un dictamen juridico. Es un registro tecnico con evidencia de la revision actual de la extension nativa para VSIX.

**Fecha:** 2026-09-03
**Autor:** senior-dev (revisión técnica; no sustituye la gate de security-officer)

## Alcance

| Marco | Aplica | Motivo |
|-------|--------|--------|
| RGPD | parcial | El codigo lee Markdown del workspace, puede guardar memoria local solo con opt-in y guarda una preferencia global (`alfred-dev.modelProfile`) en VS Code. No hay llamadas de red ni telemetria propias en `src/`, pero no hay evidencia sobre la base juridica, informacion al usuario, retencion o tratamiento realizado por el marketplace, VS Code y Copilot. |
| NIS2 | pendiente | La condicion de entidad esencial/importante o proveedor sujeto a NIS2 depende del titular y del despliegue; no existe clasificacion del servicio ni evidencia de protocolo de incidentes. |
| CRA | parcial | Una extension VSIX distribuida puede ser un producto con elementos digitales si se comercializa o distribuye en la UE. Hay SBOM CycloneDX, audit de dependencias y un canal publico de reporte en `SECURITY.md`, pero SLA, versiones soportadas formales y proceso de actualizaciones de seguridad siguen pendientes. |

## Controles

| Control | Marco | Estado | Evidencia |
|---------|-------|--------|-----------|
| Inventario de componentes directos y transitivos | CRA | cumple | `docs/project/sbom.cdx.json` CycloneDX 1.5 reproducible y validado desde `package-lock.json`: 280 componentes, 296 relaciones y 0 componentes sin licencia. |
| Analisis de vulnerabilidades conocidas | CRA / NIS2 | cumple | `npm audit --audit-level=high` del 2026-09-03: `found 0 vulnerabilities` tras actualizar las transitivas `fast-uri` 3.1.5 -> 3.1.7 y `qs` 6.15.3 -> 6.16.0. |
| Integridad de la cadena de build | CRA / NIS2 | cumple | `package-lock.json` v3 fija integridades SHA-512. `npx vsce ls --tree` en la entrega actual enumera 22 ficheros: metadatos y 17 JavaScript bajo `out/`; excluye fuentes, tests, dependencias, skills, documentos internos y mapas. |
| Minimizacion y finalidad de datos | RGPD art. 5 | parcial | El TreeView lee solo `docs/project/status.md`; la memoria requiere opt-in, limita el JSON a 256 KiB y sanitiza secretos; MCP y comandos usan el mismo almacenamiento global local; la galería guarda solo la elección confirmada. Falta inventario del tratamiento de marketplace/Copilot y aviso de privacidad del responsable. |
| Base juridica y transparencia | RGPD arts. 6 y 13 | pendiente | No hay politica de privacidad ni evidencia de base juridica para la preferencia global o los servicios de terceros asociados. |
| Derechos de acceso, supresion y portabilidad | RGPD arts. 15, 17 y 20 | pendiente | No hay evidencia de flujo para datos que pudieran tratar el publicador, marketplace o Copilot; el codigo revisado no implementa almacenamiento propio fuera de la configuracion gestionada por VS Code. |
| Seguridad del tratamiento | RGPD art. 32 | parcial | Memoria local opt-in con escritura atómica, límite previo al write y sanitización de Bearer, `sk-*`, PEM, GitHub y AWS; Secret Guard explícito; CSP/nonce en galería; workspace trust antes de escrituras y acciones Ralph. El cifrado del almacenamiento global de VS Code no se ha verificado. |
| Secretos y ejecución local | CRA / NIS2 | parcial | El hook obtiene blobs staged mediante `git show` con argumentos sin shell, no imprime valores y resuelve hooks con Git para admitir worktrees. El scanner de producción recorrió 17 JavaScript de `out/` y produjo 0 hallazgos. El MCP solo se registra con opt-in y API disponible; expone tres tools y no usa red. Ralph usa comandos fijos, no procesa contenido remoto como instrucciones y solo confirma sync cuando la extensión anuncia el comando correspondiente; no simula paralelismo. |
| Gestion de riesgos y cadena de suministro | NIS2 arts. 20 y 21 | parcial | Audit, lockfile y modelo STRIDE presentes. Faltan propietario de riesgo, clasificacion NIS2, politica de proveedores y procedimiento de respuesta. |
| Notificacion de incidentes | NIS2 art. 23 | parcial | `SECURITY.md` documenta un canal de reporte privado recomendado y una alternativa de contacto; faltan protocolo de alerta temprana en 24 h, informe en 72 h e informe final. |
| Gestion y divulgacion de vulnerabilidades | CRA | parcial | `SECURITY.md` publica el canal y la coordinacion de divulgacion; no hay SLA de acuse, analisis o correccion, ni matriz formal de versiones soportadas. |
| Actualizaciones de seguridad | CRA | pendiente | No hay evidencia de politica de soporte, canal de actualizacion ni periodo de correcciones para VSIX publicados. |

## Hallazgos activos

Ninguno con severidad critica, alta o media en el alcance de esta revision.

## Hallazgos cerrados

- **Ubicacion:** `.vscodeignore` y contenido evaluado por `npx vsce ls`
- **Severidad:** MEDIA (confianza: 99)
- **Categoria:** OWASP A05 / CRA
- **Hallazgo:** La allowlist parte de `*`, reintroduce solo los metadatos y JavaScript de `out/`, y las exclusiones explicitas cubren contenido no distribuible.
- **Vector de ataque:** Un arbol de trabajo con contenido local no versionado intentaba colarse en el VSIX.
- **Impacto:** Habria permitido filtrar informacion interna o distribuir artefactos no auditados.
- **Solucion:** `npx vsce ls --tree` en la entrega actual confirma 22 ficheros permitidos y la ausencia de salidas locales, documentos internos, mapas, fuentes, tests, dependencias y skills. Mantener esta comprobacion en CI antes de publicar.

- **Ubicacion:** `src/providers/statusTreeProvider.ts`
- **Severidad:** MEDIA (confianza: 99)
- **Categoria:** OWASP A04 / A05
- **Hallazgo:** En el artefacto revisado, `readStatusFile` ejecuta `fs.stat` antes de `fs.readFile`, rechaza archivos de mas de 64 KiB y el TreeView usa la API asincrona.
- **Vector de ataque:** Un repositorio malicioso o corrupto aporta un `docs/project/status.md` desproporcionadamente grande y el usuario abre o refresca el TreeView.
- **Impacto:** Habria podido causar denegacion local de servicio y degradar el host de extensiones.
- **Solucion:** El error por tamano no se trata como `ENOENT`; `statusTreeProvider` muestra error generico y reserva «Sin snapshot local» exclusivamente para `ENOENT`. Los campos mostrados se limitan a 200 caracteres.

## Condiciones pendientes

- GitHub Advanced Security no está habilitado en el repositorio, por lo que no
	hay evidencia de secret scanning remoto. Esta revisión usa el scanner local
	de producción sobre los 17 JavaScript empaquetables; no se presenta como
	sustituto de GHAS.
- La divulgacion y correccion coordinada de vulnerabilidades CRA tiene un canal publico en `SECURITY.md`, pero faltan SLA de acuse, analisis y correccion, y una matriz formal de versiones soportadas. Severidad MEDIA de proceso, no bloqueante para esta PR de documentacion.
- `SECURITY.md` no establece un contacto directo ni un SLA aprobado; la evidencia disponible se limita al canal publico recomendado y a la coordinacion posible de la divulgacion.
- La politica de actualizaciones de seguridad CRA sigue pendiente de evidencia del publicador.