# Software Bill of Materials (SBOM)

**Proyecto:** alfred-dev-vscode
**Version:** 0.6.5
**Commit revisado:** `29b1dbc897758a5ced3082623cffe7278cc971cb`
**Fecha:** 2026-08-21
**Autor:** security-officer
**Formato verificable:** `docs/project/sbom.cdx.json`, CycloneDX 1.5 generado con `npx @cyclonedx/cyclonedx-npm` desde `package-lock.json`.

## Alcance e integridad

- `package-lock.json` v3 contiene 295 paquetes resueltos de desarrollo, incluidas entradas opcionales por plataforma.
- El documento CycloneDX contiene 272 componentes con licencia identificada; las diferencias son entradas de lockfile opcionales o duplicadas por ruta que no se materializan como componentes independientes.
- La extension no declara dependencias de produccion. Las 295 dependencias de desarrollo se incluyen porque ejecutan codigo en la construccion y empaquetado del VSIX.
- El lockfile fija `@vscode/vsce` 3.9.2 con integridad `sha512-XSxMosEEDO6vLxELAHVkwmhC0qe0ijZni2jB9Rcs8kQsW4lhTDQ/wMzmwFs/buotAWSnpmUp/dRWD2ufG3UYKA==`.

## Componente principal

| Componente | Version | Licencia | Proveedor |
|------------|---------|----------|-----------|
| `alfred-dev-vscode` | 0.6.5 | MIT | SrScorpio |

## Dependencias directas

| Componente | Version declarada | Uso | Licencia |
|------------|-------------------|-----|----------|
| `@vscode/vsce` | 3.9.2 | Empaquetado VSIX | MIT |
| `@types/node` | ^20.11.0 | Tipos de desarrollo | MIT |
| `@types/vscode` | ^1.85.0 | Tipos de desarrollo | MIT |
| `typescript` | ^5.3.3 | Compilacion | Apache-2.0 |

Las versiones resueltas, PURLs, licencias, relaciones y transitivas estan en `docs/project/sbom.cdx.json`; no se inventan hashes ni licencias fuera de esa fuente generada.

## Vulnerabilidades conocidas

| Fuente | Critica | Alta | Moderada | Baja | Resultado |
|--------|----------|------|----------|------|-----------|
| `npm audit --json` | 0 | 0 | 0 | 0 | Sin CVEs/advisories reportados para directas y transitivas |
| `npm audit --omit=dev --json` | 0 | 0 | 0 | 0 | Sin dependencias de produccion vulnerables |

## Conformidad CRA

- [x] Componentes identificados en SBOM reproducible.
- [x] Dependencias de build incluidas en el inventario.
- [x] Sin vulnerabilidades criticas o altas conocidas en la auditoria ejecutada.
- [x] Licencias de componentes registradas por CycloneDX.
- [ ] Proceso de divulgacion y correccion de vulnerabilidades documentado.
- [ ] Politica de actualizaciones de seguridad documentada.
- [x] Empaquetado restringido a contenido aprobado y reproducible: `npx vsce ls` enumera solo 10 ficheros de runtime y metadatos, sin salidas locales, mapas, fuentes, tests ni dependencias.