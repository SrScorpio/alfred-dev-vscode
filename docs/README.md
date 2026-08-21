# Documentación pública

Esta carpeta reúne la documentación orientada a las personas que usan,
instalan o contribuyen a Alfred Dev para VS Code.

## Por audiencia

### Quiero usar el catálogo

- [Catálogo de agentes y skills](catalog.md): qué contiene el repositorio,
  qué se puede instalar y dónde vive cada pieza.
- [README de skills](../skills/README.md): paquetes Básicas y Completas,
  skills de proceso y skills de stack.

### Quiero usar la extensión VS Code

- [Guía de la VSIX](vsix.md): Activity Bar, TreeView, comandos, perfil global
de modelo, desarrollo local y contenido del paquete.

### Quiero contribuir

- [Guía de contribución](../CONTRIBUTING.md): ramas, pull requests, CI,
tests y documentación.
- [Plan de pruebas de la VSIX](test/vsix-nativa-test-plan.md): cobertura
manual y de contrato de la extensión nativa.

### Quiero revisar el estado o la seguridad

- [Estado del proyecto](project/status.md): snapshot local de Issues y PRs.
  GitHub sigue siendo la fuente de verdad colaborativa.
- [Política de seguridad](../SECURITY.md): alcance, canales de reporte y
  límites del soporte.
- [Compliance](project/compliance.md), [modelo de amenazas](project/threat-model.md),
  [dependencias](project/dependencies.md) y [SBOM](project/sbom.md): artefactos
  técnicos de seguridad y cumplimiento.

## Mapa rápido

| Necesidad | Documento o carpeta |
|-----------|---------------------|
| Agentes | [`agents/`](../agents/) |
| Skills | [`skills/`](../skills/) |
| Instructions | [`instructions/`](../instructions/) |
| Plantillas | [`templates/`](../templates/) |
| Extensión nativa | [Guía de la VSIX](vsix.md) |
| Contribución | [`CONTRIBUTING.md`](../CONTRIBUTING.md) |
| Seguridad | [`SECURITY.md`](../SECURITY.md) |

## Límites documentales actuales

Esta iteración no crea `docs/adr/`, `docs/project/architecture.md` ni
`docs/security/`. Los dos primeros requieren una decisión arquitectónica
explícita; `docs/security/` no se crea porque mover allí la documentación
rompería las rutas de las skills existentes. La política pública vive en
[`SECURITY.md`](../SECURITY.md) y los artefactos técnicos permanecen en
`docs/project/`.
