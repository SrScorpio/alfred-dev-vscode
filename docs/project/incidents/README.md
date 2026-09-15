# Incidentes

Registro interno de respuesta ante incidentes de seguridad o de
disponibilidad del producto. No sustituye a [`SECURITY.md`](../../../SECURITY.md).

A 2026-09-15 **no hay incidentes reales** archivados. No se fabrica un
caso para rellenar esta carpeta.

## Cómo registrar un incidente

1. Copiar [`YYYY-MM-DD-slug.md`](YYYY-MM-DD-slug.md) a un fichero nuevo
   `YYYY-MM-DD-<slug>.md` (fecha del conocimiento efectivo, slug corto).
2. No editar la plantilla con datos de un incidente ficticio.
3. Completar triaje, mitigación, causa raíz y postmortem. Cada acción
   correctiva lleva responsable y fecha.
4. Aplicar los relojes de [`SECURITY.md`](../../../SECURITY.md): alerta
   temprana 24 h, notificación 72 h, informe final 1 mes (NIS2 art. 23).
5. Si hay componente de seguridad, interviene `security-officer`.

## Severidad

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| P0 | Crítico | Explotación activa, secreto publicado, integridad del VSIX rota |
| P1 | Alto | Vulnerabilidad explotable sin mitigación pública |
| P2 | Medio | Degradación o residual con mitigación |
| P3 | Bajo | Incidente contenido, sin datos ni integridad del producto |

## Qué no va aquí

- Issues de producto sin impacto de seguridad o de servicio.
- Informes de vulnerabilidad aún coordinados: viven en Security Advisories
  hasta que dejen de ser explotables.
- Dictámenes jurídicos, notificaciones a CSIRT/ENISA ni clasificación
  NIS2 del titular.
