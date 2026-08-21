# Registro de dependencias

| Paquete | Versión | Licencia | CVEs | Transitivas | Veredicto | Fecha |
|---------|---------|----------|------|-------------|-----------|-------|
| `@vscode/vsce` | 3.9.2 | MIT | Ninguno encontrado en `npm audit` tras la instalación | 25 directas declaradas por el paquete | APROBAR CON CONDICIONES | 2026-08-21 |

`@vscode/vsce` se usa solo como dependencia de desarrollo para generar el VSIX local. El paquete se mantiene activo en npm y su tamaño desempaquetado publicado es de aproximadamente 250 KB; sus transitivas no se incluyen en el VSIX final.
