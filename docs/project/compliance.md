# Registro de compliance

No es un dictamen juridico. Es un registro tecnico con evidencia de la revision de la extension nativa para VSIX en el commit `084e64eaf1b51656a5149cb0b5a22021c90f56d2`.

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
| Integridad de la cadena de build | CRA / NIS2 | parcial | `package-lock.json` v3 fija integridades SHA-512, pero `npx vsce ls` incluye `1260721182603-out/` y `docs/test/` no versionados. Falta una lista permitida o exclusiones que cierren el artefacto. |
| Minimizacion y finalidad de datos | RGPD art. 5 | parcial | `src/providers/statusTreeProvider.ts` lee solo `docs/project/status.md`; `src/commands/index.ts` persiste un literal de tres perfiles. Falta inventario del tratamiento de marketplace/Copilot y aviso de privacidad del responsable. |
| Base juridica y transparencia | RGPD arts. 6 y 13 | pendiente | No hay politica de privacidad ni evidencia de base juridica para la preferencia global o los servicios de terceros asociados. |
| Derechos de acceso, supresion y portabilidad | RGPD arts. 15, 17 y 20 | pendiente | No hay evidencia de flujo para datos que pudieran tratar el publicador, marketplace o Copilot; el codigo revisado no implementa almacenamiento propio fuera de la configuracion gestionada por VS Code. |
| Seguridad del tratamiento | RGPD art. 32 | parcial | No hay trafico ni almacenamiento propio en el codigo revisado. El cifrado y controles del almacenamiento de configuracion de VS Code no se han verificado; no se marca como cumple sin esa evidencia. |
| Gestion de riesgos y cadena de suministro | NIS2 arts. 20 y 21 | parcial | Audit, lockfile y modelo STRIDE presentes. Faltan propietario de riesgo, clasificacion NIS2, politica de proveedores y procedimiento de respuesta. |
| Notificacion de incidentes | NIS2 art. 23 | pendiente | No existe `SECURITY.md` ni protocolo que cubra alerta temprana en 24 h, informe en 72 h e informe final. |
| Gestion y divulgacion de vulnerabilidades | CRA | pendiente | No existe politica publica de reporte ni SLA de correccion de vulnerabilidades. |
| Actualizaciones de seguridad | CRA | pendiente | No hay evidencia de politica de soporte, canal de actualizacion ni periodo de correcciones para VSIX publicados. |

## Hallazgos

- **Ubicacion:** `.vscodeignore` y contenido evaluado por `npx vsce ls`
- **Severidad:** MEDIA (confianza: 99)
- **Categoria:** OWASP A05 / CRA
- **Hallazgo:** El empaquetador incluye `1260721182603-out/` y `docs/test/`, ambos no versionados, ademas de mapas de fuentes y configuracion de desarrollo.
- **Vector de ataque:** Quien genere un VSIX desde un arbol de trabajo con archivos locales puede distribuir contenido no revisado ni versionado.
- **Impacto:** Fuga de informacion interna o inclusion de artefactos no auditados; se pierde reproducibilidad e integridad del paquete distribuido.
- **Solucion:** Definir una lista permitida de ficheros de release o excluir explicitamente directorios temporales, `.vscode/`, `docs/test/`, mapas y cualquier salida no destinada a runtime; validar el listado en CI antes de publicar.

- **Ubicacion:** `src/providers/statusTreeProvider.ts`
- **Severidad:** MEDIA (confianza: 92)
- **Categoria:** OWASP A04 / A05
- **Hallazgo:** `fs.readFileSync(statusPath, 'utf8')` consume sin limite un fichero controlado por el workspace y bloquea el host de extensiones durante la lectura y el parseo.
- **Vector de ataque:** Un repositorio malicioso o corrupto aporta un `docs/project/status.md` desproporcionadamente grande y el usuario abre o refresca el TreeView.
- **Impacto:** Denegacion local de servicio del host de extensiones y degradacion de VS Code.
- **Solucion:** Consultar el tamano antes de leer, rechazar un maximo pequeno y usar lectura asincrona; limitar tambien las longitudes mostradas de los campos parseados.

## Riesgos aceptados

Ninguno. Los dos hallazgos medios deben corregirse antes de una publicacion de produccion.