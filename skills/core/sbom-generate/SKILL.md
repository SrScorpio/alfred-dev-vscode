---
name: sbom-generate
description: "Usar para generar Software Bill of Materials para cumplimiento del CRA. También: Software Bill of Materials, inventario de componentes, CycloneDX, SPDX, cadena de suministro."
---

# Generar SBOM (Software Bill of Materials)

Inventario de componentes (directos y transitivos) asociado a una versión
concreta del software. Destino: `docs/project/sbom.md` y, si hay herramienta,
un JSON CycloneDX/SPDX junto al release.

Plantilla: la del proyecto, o `~/.copilot/alfred-dev/templates/sbom.md`,
o `references/sbom.md` junto a esta skill.

## Proceso

1. **Ecosistema.** Detecta lockfiles: `package-lock.json` / `yarn.lock` /
   `pnpm-lock.yaml`, `poetry.lock` / `Pipfile.lock` / `uv.lock`, `Cargo.lock`,
   `go.sum`, `composer.lock`, `pom.xml` / `gradle.lockfile`.

2. **Generar con herramienta si existe** (preferido):

   ```bash
   # Si syft está instalado
   syft dir:. -o cyclonedx-json > docs/project/sbom.cdx.json

   # Node
   npx --yes @cyclonedx/cyclonedx-npm --output-file docs/project/sbom.cdx.json
   ```

   Si no hay herramienta, rellena `docs/project/sbom.md` a mano desde el lockfile.
   No finjas hashes ni licencias.

3. **Incluye lo que el lockfile no ve:** vendoring, scripts por CDN, binarios
   y la imagen base de Docker si hay `Dockerfile`.

4. **Completitud.** Cruza el SBOM con el lockfile. Ninguna licencia
   «desconocida» sin decirlo. Asocia el SBOM a tag o versión (`package.json`,
   `pyproject.toml` o `git describe`).

5. Regenera el SBOM en cada release.

## Criterios de éxito

- Directas y transitivas listadas (o JSON de herramienta + resumen en markdown).
- Nombre, versión, licencia; hash si el lockfile lo trae.
- Ligado a una versión concreta.

## Qué NO hacer

- No inventar un CycloneDX a mano si no puedes verificarlo.
- No dejar el inventario solo en el chat.
