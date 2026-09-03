# Registro de dependencias

| Paquete | Versión | Licencia | CVEs | Transitivas | Veredicto | Fecha |
|---------|---------|----------|------|-------------|-----------|-------|
| `@vscode/vsce` | 3.9.2 | MIT | Ninguno en `npm audit --audit-level=high` (2026-09-03) | Compartidas en un árbol de 403 paquetes resueltos | APROBAR | 2026-09-03 |
| `@cyclonedx/cyclonedx-npm` | 6.0.1 | Apache-2.0 | Ninguno en `npm audit --audit-level=high` (2026-09-03) | 108 paquetes añadidos al árbol de desarrollo | APROBAR | 2026-09-03 |

`@vscode/vsce` se usa solo como dependencia de desarrollo para generar el VSIX local. La version queda fijada en `package-lock.json` v3 con integridad `sha512-XSxMosEEDO6vLxELAHVkwmhC0qe0ijZni2jB9Rcs8kQsW4lhTDQ/wMzmwFs/buotAWSnpmUp/dRWD2ufG3UYKA==`. Npm publica licencia MIT, tamano desempaquetado de 250338 bytes y actividad de metadatos el 2026-08-11. El resultado de `npm audit` cubre directas y transitivas, incluidas las de desarrollo.

La auditoria del 2026-09-03 detecto cuatro advisories HIGH de `fast-uri`
3.1.5 y dos MODERATE de `qs` 6.15.3, ambas transitivas de desarrollo de
`@vscode/vsce`. `npm audit fix` sin `--force` actualizo solo `fast-uri` a 3.1.7
y `qs` a 6.16.0, con sus URL e integridades en `package-lock.json`. Tras el
cambio, `npm audit --audit-level=high` informa `found 0 vulnerabilities`.

La comprobacion de contenido en el commit
la entrega actual usa `npx vsce ls --tree` y enumera 22 ficheros: tres metadatos
y 17 JavaScript bajo `out/`. No contiene
fuentes TypeScript, tests, `node_modules`, skills, agentes, instrucciones,
plantillas, documentación interna ni mapas. La allowlist de `.vscodeignore`
parte de `*` y solo reintroduce `out/**/*.js`, `package.json`, `README.md` y
`LICENSE`.

`@cyclonedx/cyclonedx-npm` 6.0.1 se usa solo para generar y validar el SBOM
CycloneDX desde el lockfile mediante `npm run sbom`. El registro npm publica
licencia Apache-2.0, tamaño desempaquetado de 88.568 bytes, integridad
`sha512-/aU3bBC6qP6cV/qQ5SfUSygE/+2hQhwgg6sJML31/gZ96NyMvIUuwdk637H4z+LS/NryRT2kjR2wtD0qBEVVHQ==`
y última modificación el 2026-08-11. Declara seis dependencias directas:
`@cyclonedx/cyclonedx-library`, `commander`, `normalize-package-data`,
`packageurl-js`, `spdx-expression-parse` y `xmlbuilder2`. La instalación se
realizó con lifecycle scripts deshabilitados y añadió 108 paquetes al árbol;
la auditoría posterior de 396 paquetes informó `found 0 vulnerabilities`.

La alternativa nativa sería construir CycloneDX manualmente a partir de
`package-lock.json`; se rechaza porque duplicaría un estándar complejo y no
ofrecería validación independiente. Usar `npx` sin fijar la herramienta
tampoco es reproducible. El veredicto se cierra como `APROBAR` tras confirmar
que el empaquetado excluye `node_modules`, `npm run verify-package` pasa y el
audit del árbol instalado no contiene vulnerabilidades conocidas.

La instalación limpia emite avisos de deprecación para `glob` 10.5.0 y
`prebuild-install` 7.1.3, transitivos de `libxmljs2` bajo la herramienta
CycloneDX. `prebuild-install` también es compartido por `@vscode/vsce`;
`whatwg-encoding` 3.1.1 ya procedía de `@vscode/vsce`. No tienen advisories
activos en el audit actual y no entran en el VSIX, pero deben revisarse al
actualizar cualquiera de las dos herramientas de build.

Issue #2 y el MVP de Issue #3A no añaden dependencias de runtime: el servidor
MCP, la memoria, el scanner, la galería y el bridge Ralph usan Node y VS Code.
La API MCP y Ralph Suite se detectan en runtime; ninguna es dependencia
obligatoria ni se instala para esta entrega.
