# Registro de dependencias

| Paquete | Versión | Licencia | CVEs | Transitivas | Veredicto | Fecha |
|---------|---------|----------|------|-------------|-----------|-------|
| `@vscode/vsce` | 3.9.2 | MIT | Ninguno en `npm audit --json` (2026-08-21): 0 critica, 0 alta, 0 moderada | 29 directas declaradas; 295 paquetes resueltos en `package-lock.json` | APROBAR | 2026-08-21 |

`@vscode/vsce` se usa solo como dependencia de desarrollo para generar el VSIX local. La version queda fijada en `package-lock.json` v3 con integridad `sha512-XSxMosEEDO6vLxELAHVkwmhC0qe0ijZni2jB9Rcs8kQsW4lhTDQ/wMzmwFs/buotAWSnpmUp/dRWD2ufG3UYKA==`. Npm publica licencia MIT, tamano desempaquetado de 250338 bytes y actividad de metadatos el 2026-08-11. El resultado de `npm audit` cubre directas y transitivas, incluidas las de desarrollo.

`npm audit --json` y `npm audit --omit=dev --json` del 2026-08-21 informan 0 vulnerabilidades en todos los niveles. La aprobacion del paquete se completa con la comprobacion de contenido: en el commit `29b1dbc897758a5ced3082623cffe7278cc971cb`, `npx vsce ls` enumera solo 10 ficheros de runtime o metadatos. La allowlist de `.vscodeignore` parte de `*` y solo reintroduce `out/**/*.js`, `package.json`, `README.md` y `LICENSE`; las exclusiones explicitas aportan defensa en profundidad.
