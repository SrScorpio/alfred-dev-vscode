# Registro de dependencias

| Paquete | Versión | Licencia | CVEs | Transitivas | Veredicto | Fecha |
|---------|---------|----------|------|-------------|-----------|-------|
| `@vscode/vsce` | 3.9.2 | MIT | Ninguno en `npm audit --json` (2026-08-21): 0 critica, 0 alta, 0 moderada | 29 directas declaradas; 295 paquetes resueltos en `package-lock.json` | APROBAR | 2026-08-21 |

`@vscode/vsce` se usa solo como dependencia de desarrollo para generar el VSIX local. La version queda fijada en `package-lock.json` v3 con integridad `sha512-XSxMosEEDO6vLxELAHVkwmhC0qe0ijZni2jB9Rcs8kQsW4lhTDQ/wMzmwFs/buotAWSnpmUp/dRWD2ufG3UYKA==`. Npm publica licencia MIT, tamano desempaquetado de 250338 bytes y actividad de metadatos el 2026-08-11. El resultado de `npm audit` cubre directas y transitivas, incluidas las de desarrollo.

La aprobacion del paquete no aprueba el contenido distribuido: `npx vsce ls` ha demostrado que las reglas actuales pueden incluir directorios locales no versionados. Ese riesgo se registra en el modelo de amenazas y en compliance.
