# Software Bill of Materials (SBOM)

**Proyecto:** alfred-dev-vscode
**Version:** 0.6.5
**Commit revisado:** entrega actual
**Fecha:** 2026-09-14
**Autor:** senior-dev (generación técnica reproducible)
**Formato verificable:** `docs/project/sbom.cdx.json`, CycloneDX 1.5 generado y validado desde `package-lock.json`.

## Alcance e integridad

- `package-lock.json` v3 contiene 404 entradas: el proyecto raíz y 403 paquetes resueltos, incluidas entradas opcionales por plataforma.
- El documento CycloneDX contiene 357 componentes, 404 relaciones y 0 componentes sin licencia identificada.
- Se generó de modo reproducible: no contiene timestamp ni UUID aleatorios.
- La extensión no declara dependencias de producción. Las dependencias de desarrollo se incluyen porque ejecutan código durante build y empaquetado.
- Issue #2 y el MVP opcional de Issue #3A no añaden dependencias de runtime: servidor MCP, memoria, scanner, galería y bridge Ralph usan Node/VS Code y feature detection.
- El lockfile fija `@vscode/vsce` 3.9.2 con integridad `sha512-XSxMosEEDO6vLxELAHVkwmhC0qe0ijZni2jB9Rcs8kQsW4lhTDQ/wMzmwFs/buotAWSnpmUp/dRWD2ufG3UYKA==`.
- El lockfile fija `@cyclonedx/cyclonedx-npm` 6.0.1 como herramienta de desarrollo; no se distribuye en el VSIX.

Comando reproducible ejecutado con la herramienta local fijada
`@cyclonedx/cyclonedx-npm` 6.0.1:

```bash
npm run sbom
```

## Componente principal

| Componente | Version | Licencia | Proveedor |
|------------|---------|----------|-----------|
| `alfred-dev-vscode` | 0.6.5 | MIT | SrScorpio |

## Dependencias directas

| Componente | Version declarada | Uso | Licencia |
|------------|-------------------|-----|----------|
| `@vscode/vsce` | 3.9.2 | Empaquetado VSIX | MIT |
| `@cyclonedx/cyclonedx-npm` | 6.0.1 | Generación y validación del SBOM | Apache-2.0 |
| `@types/node` | ^20.11.0 | Tipos de desarrollo | MIT |
| `@types/vscode` | ^1.85.0 | Tipos de desarrollo | MIT |
| `typescript` | ^5.3.3 | Compilacion | Apache-2.0 |

Las versiones resueltas, PURLs, licencias, relaciones y transitivas estan en `docs/project/sbom.cdx.json`; no se inventan hashes ni licencias fuera de esa fuente generada.

## Vulnerabilidades conocidas

| Fuente | Critica | Alta | Moderada | Baja | Resultado |
|--------|----------|------|----------|------|-----------|
| `npm audit --audit-level=high` (2026-09-14, tras `npm ci`) | 0 | 0 | 0 | 0 | `found 0 vulnerabilities`; `js-yaml` transitiva en 4.3.2 (GHSA-2883-xcg3-v3hh cerrado) |

## Conformidad CRA

- [x] Componentes identificados en SBOM reproducible.
- [x] Dependencias de build incluidas en el inventario.
- [x] Sin vulnerabilidades criticas o altas conocidas en la auditoria ejecutada.
- [x] Licencias de componentes registradas por CycloneDX.
- [ ] Proceso de divulgacion y correccion de vulnerabilidades documentado.
- [ ] Politica de actualizaciones de seguridad documentada.
- [x] Empaquetado restringido a contenido aprobado: `npx vsce ls --tree` enumera 22 ficheros de runtime y metadatos, sin salidas locales, mapas, fuentes, tests ni dependencias.