# Software Bill of Materials (SBOM)

**Proyecto:** alfred-dev-vscode
**Version:** 0.6.5
**Commit revisado:** entrega actual
**Fecha:** 2026-09-03
**Autor:** senior-dev (generación técnica reproducible)
**Formato verificable:** `docs/project/sbom.cdx.json`, CycloneDX 1.5 generado y validado desde `package-lock.json`.

## Alcance e integridad

- `package-lock.json` v3 contiene 296 entradas: el proyecto raíz y 295 paquetes resueltos, incluidas entradas opcionales por plataforma.
- El documento CycloneDX contiene 280 componentes, 296 relaciones y 0 componentes sin licencia identificada.
- Se generó de modo reproducible: no contiene timestamp ni UUID aleatorios.
- La extensión no declara dependencias de producción. Las dependencias de desarrollo se incluyen porque ejecutan código durante build y empaquetado.
- Issue #2 y el MVP opcional de Issue #3A no añaden dependencias: servidor MCP, memoria, scanner, galería y bridge Ralph usan Node/VS Code y feature detection.
- El lockfile fija `@vscode/vsce` 3.9.2 con integridad `sha512-XSxMosEEDO6vLxELAHVkwmhC0qe0ijZni2jB9Rcs8kQsW4lhTDQ/wMzmwFs/buotAWSnpmUp/dRWD2ufG3UYKA==`.

Comando reproducible ejecutado con la herramienta local
`@cyclonedx/cyclonedx-npm 6.0.1`:

```bash
npx --no-install @cyclonedx/cyclonedx-npm --package-lock-only --output-reproducible --spec-version 1.5 --output-format JSON --output-file docs/project/sbom.cdx.json --validate
```

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
| `npm audit --audit-level=high` | 0 | 0 | 0 | 0 | `found 0 vulnerabilities` tras actualizar `fast-uri` a 3.1.7 y `qs` a 6.16.0 |

## Conformidad CRA

- [x] Componentes identificados en SBOM reproducible.
- [x] Dependencias de build incluidas en el inventario.
- [x] Sin vulnerabilidades criticas o altas conocidas en la auditoria ejecutada.
- [x] Licencias de componentes registradas por CycloneDX.
- [ ] Proceso de divulgacion y correccion de vulnerabilidades documentado.
- [ ] Politica de actualizaciones de seguridad documentada.
- [x] Empaquetado restringido a contenido aprobado: `npx vsce ls --tree` enumera 22 ficheros de runtime y metadatos, sin salidas locales, mapas, fuentes, tests ni dependencias.