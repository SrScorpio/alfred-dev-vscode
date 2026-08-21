# Registro de compliance

No es un dictamen juridico. Es un registro tecnico con evidencia de la revision de la extension nativa para VSIX en el commit `29b1dbc897758a5ced3082623cffe7278cc971cb`.

**Fecha:** 2026-08-21
**Autor:** security-officer

## Alcance

| Marco | Aplica | Motivo |
|-------|--------|--------|
| RGPD | parcial | El codigo revisado lee un Markdown del workspace y guarda una preferencia global (`alfred-dev.modelProfile`) en VS Code. No hay llamadas de red, base de datos ni telemetria propias en `src/`, pero no hay evidencia sobre la base juridica, informacion al usuario, retencion o tratamiento realizado por el marketplace, VS Code y Copilot. |
| NIS2 | pendiente | La condicion de entidad esencial/importante o proveedor sujeto a NIS2 depende del titular y del despliegue; no existe clasificacion del servicio ni evidencia de protocolo de incidentes. |
| CRA | parcial | Una extension VSIX distribuida puede ser un producto con elementos digitales si se comercializa o distribuye en la UE. Hay SBOM CycloneDX y audit de dependencias, pero no existe politica de divulgacion de vulnerabilidades ni proceso de actualizaciones de seguridad documentado. |

## Controles

| Control | Marco | Estado | Evidencia |
|---------|-------|--------|-----------|
| Inventario de componentes directos y transitivos | CRA | cumple | `docs/project/sbom.cdx.json` generado desde `package-lock.json`; 272 componentes CycloneDX y `@vscode/vsce` 3.9.2 identificado. |
| Analisis de vulnerabilidades conocidas | CRA / NIS2 | cumple | `npm audit --json` y `npm audit --omit=dev --json` del 2026-08-21: 0 critica, 0 alta, 0 moderada, 0 baja. |
| Integridad de la cadena de build | CRA / NIS2 | cumple | `package-lock.json` v3 fija integridades SHA-512. `npx vsce ls` en `29b1dbc` enumera 10 ficheros: metadatos y JavaScript bajo `out/`; no contiene `1260721182603-out/`, `docs/test/`, `.vscode/`, `.github/`, mapas, fuentes, tests, dependencias ni skills. |
| Minimizacion y finalidad de datos | RGPD art. 5 | parcial | `src/providers/statusTreeProvider.ts` lee solo `docs/project/status.md`; `src/commands/index.ts` persiste un literal de tres perfiles. Falta inventario del tratamiento de marketplace/Copilot y aviso de privacidad del responsable. |
| Base juridica y transparencia | RGPD arts. 6 y 13 | pendiente | No hay politica de privacidad ni evidencia de base juridica para la preferencia global o los servicios de terceros asociados. |
| Derechos de acceso, supresion y portabilidad | RGPD arts. 15, 17 y 20 | pendiente | No hay evidencia de flujo para datos que pudieran tratar el publicador, marketplace o Copilot; el codigo revisado no implementa almacenamiento propio fuera de la configuracion gestionada por VS Code. |
| Seguridad del tratamiento | RGPD art. 32 | parcial | No hay trafico ni almacenamiento propio en el codigo revisado. El cifrado y controles del almacenamiento de configuracion de VS Code no se han verificado; no se marca como cumple sin esa evidencia. |
| Gestion de riesgos y cadena de suministro | NIS2 arts. 20 y 21 | parcial | Audit, lockfile y modelo STRIDE presentes. Faltan propietario de riesgo, clasificacion NIS2, politica de proveedores y procedimiento de respuesta. |
| Notificacion de incidentes | NIS2 art. 23 | pendiente | No existe `SECURITY.md` ni protocolo que cubra alerta temprana en 24 h, informe en 72 h e informe final. |
| Gestion y divulgacion de vulnerabilidades | CRA | pendiente | No existe politica publica de reporte ni SLA de correccion de vulnerabilidades. |
| Actualizaciones de seguridad | CRA | pendiente | No hay evidencia de politica de soporte, canal de actualizacion ni periodo de correcciones para VSIX publicados. |

## Hallazgos activos

Ninguno con severidad critica, alta o media en el alcance de esta revision.

## Hallazgos cerrados

- **Ubicacion:** `.vscodeignore` y contenido evaluado por `npx vsce ls`
- **Severidad:** MEDIA (confianza: 99)
- **Categoria:** OWASP A05 / CRA
- **Hallazgo:** Corregido en `29b1dbc`: la allowlist parte de `*`, reintroduce solo los metadatos y JavaScript de `out/`, y las exclusiones explicitas cubren contenido no distribuible.
- **Vector de ataque:** Un arbol de trabajo con contenido local no versionado intentaba colarse en el VSIX.
- **Impacto:** Habria permitido filtrar informacion interna o distribuir artefactos no auditados.
- **Solucion:** `npx vsce ls` confirma 10 ficheros permitidos y la ausencia de `1260721182603-out/`, `docs/test/`, `.vscode/`, `.github/`, mapas, fuentes, tests, dependencias y skills. Mantener esta comprobacion en CI antes de publicar.

- **Ubicacion:** `src/providers/statusTreeProvider.ts`
- **Severidad:** MEDIA (confianza: 99)
- **Categoria:** OWASP A04 / A05
- **Hallazgo:** Corregido en `79e1618`: `readStatusFile` ejecuta `fs.stat` antes de `fs.readFile`, rechaza archivos de mas de 64 KiB y el TreeView usa la API asincrona.
- **Vector de ataque:** Un repositorio malicioso o corrupto aporta un `docs/project/status.md` desproporcionadamente grande y el usuario abre o refresca el TreeView.
- **Impacto:** Habria podido causar denegacion local de servicio y degradar el host de extensiones.
- **Solucion:** El error por tamano no se trata como `ENOENT`; `statusTreeProvider` muestra error generico y reserva «Sin snapshot local» exclusivamente para `ENOENT`. Los campos mostrados se limitan a 200 caracteres.

## Condiciones pendientes

- La divulgacion y correccion coordinada de vulnerabilidades CRA sigue pendiente: no hay politica publica de reporte ni SLA de correccion. Severidad MEDIA de proceso, no bloqueante para esta PR de UI.
- La politica de actualizaciones de seguridad CRA sigue pendiente de evidencia del publicador.