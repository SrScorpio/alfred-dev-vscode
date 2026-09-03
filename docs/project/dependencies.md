# Registro de dependencias

| Paquete | Versión | Licencia | CVEs | Transitivas | Veredicto | Fecha |
|---------|---------|----------|------|-------------|-----------|-------|
| `@vscode/vsce` | 3.9.2 | MIT | Ninguno en `npm audit --audit-level=high` (2026-09-03) | 295 paquetes resueltos en `package-lock.json` | APROBAR | 2026-09-03 |

`@vscode/vsce` se usa solo como dependencia de desarrollo para generar el VSIX local. La version queda fijada en `package-lock.json` v3 con integridad `sha512-XSxMosEEDO6vLxELAHVkwmhC0qe0ijZni2jB9Rcs8kQsW4lhTDQ/wMzmwFs/buotAWSnpmUp/dRWD2ufG3UYKA==`. Npm publica licencia MIT, tamano desempaquetado de 250338 bytes y actividad de metadatos el 2026-08-11. El resultado de `npm audit` cubre directas y transitivas, incluidas las de desarrollo.

La auditoria del 2026-09-03 detecto cuatro advisories HIGH de `fast-uri`
3.1.5 y dos MODERATE de `qs` 6.15.3, ambas transitivas de desarrollo de
`@vscode/vsce`. `npm audit fix` sin `--force` actualizo solo `fast-uri` a 3.1.7
y `qs` a 6.16.0, con sus URL e integridades en `package-lock.json`. Tras el
cambio, `npm audit --audit-level=high` informa `found 0 vulnerabilities`.

La comprobacion de contenido en el commit
`f23eedefefe5264a80ad431dcc580a00ac248cce` usa `npx vsce ls --tree` y
enumera 20 ficheros: tres metadatos y 17 JavaScript bajo `out/`. No contiene
fuentes TypeScript, tests, `node_modules`, skills, agentes, instrucciones,
plantillas, documentación interna ni mapas. La allowlist de `.vscodeignore`
parte de `*` y solo reintroduce `out/**/*.js`, `package.json`, `README.md` y
`LICENSE`.

Issue #2 y el MVP de Issue #3A no añaden dependencias de runtime: el servidor
MCP, la memoria, el scanner, la galería y el bridge Ralph usan Node y VS Code.
La API MCP y Ralph Suite se detectan en runtime; ninguna es dependencia
obligatoria ni se instala para esta entrega.
