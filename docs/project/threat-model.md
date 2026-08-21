# Modelo de amenazas: extension nativa VSIX

**Fecha:** 2026-08-21
**Autor:** security-officer
**Commit revisado:** `29b1dbc897758a5ced3082623cffe7278cc971cb`
**Metodologia:** STRIDE

## Superficie de ataque

La extension se activa en VS Code, lee `docs/project/status.md` del primer workspace, muestra campos parseados en un TreeView, abre el chat con mensajes fijos `@alfred` y persiste una preferencia global con tres valores declarados. La cadena de release compila TypeScript y usa `@vscode/vsce` para crear el VSIX.

```mermaid
flowchart LR
  workspace[Workspace controlado por usuario] -->|status.md| extension[Host de extension VS Code]
  extension -->|campos renderizados| tree[TreeView]
  extension -->|mensaje fijo @alfred| chat[GitHub Copilot Chat]
  extension -->|luna terra sol| config[Configuracion global VS Code]
  source[Repositorio y lockfile] --> build[Build local]
  build --> vsce[@vscode/vsce]
  vsce --> vsix[VSIX distribuido]
```

## Activos a proteger

| Activo | Clasificacion | Impacto de compromiso |
|--------|--------------|-----------------------|
| Contenido del VSIX | Integridad | Distribucion de codigo o datos no revisados. |
| Host de extensiones VS Code | Disponibilidad | Bloqueo local del editor. |
| Preferencia de modelo | Baja sensibilidad | Alteracion de la politica visual de coste. |
| Contenido de `status.md` | No confiable | Desinformacion de la interfaz o consumo de recursos. |
| Lockfile y dependencias de build | Integridad | Ejecucion de codigo comprometido durante build o empaquetado. |

## Analisis STRIDE

### Spoofing (suplantacion de identidad)

No se implementa autenticacion propia. Los comandos de chat se registran con identificadores propios y abren `workbench.action.chat.open` con literales, no con texto de `status.md`. La identidad del usuario y el chat dependen de VS Code/Copilot, fuera del alcance probado.

### Tampering (manipulacion)

`status.md` es controlable por el workspace, pero sus valores solo se convierten en etiquetas y no seleccionan comandos ni rutas. La cadena de empaquetado usa una allowlist que parte de `*` y `npx vsce ls` confirma que solo distribuye 10 ficheros de runtime y metadatos.

### Repudiation (repudio)

No hay registro de acciones de seguridad, publicacion de VSIX ni cambios de perfil atribuible. Para un producto distribuido debe existir trazabilidad de releases y un proceso de incidentes.

### Information Disclosure (fuga de informacion)

`npx vsce ls` no incluye `1260721182603-out/`, `.vscode/`, `docs/test/`, mapas, fuentes, tests, dependencias ni skills. El escaneo de secretos de codigo y configuracion no encontro coincidencias de credenciales; las del lockfile son nombres de paquetes.

### Denial of Service (denegacion de servicio)

La lectura de `status.md` es asincrona y se rechaza antes de abrir el fichero si supera 64 KiB; solo `ENOENT` se comunica como ausencia de snapshot. No hay endpoints de red propios ni superficie de rate limiting en el cambio revisado.

### Elevation of Privilege (elevacion de privilegios)

No hay `child_process`, shell, acceso de red ni comandos derivados de contenido de workspace. La configuracion declara el enum `luna`, `terra`, `sol`; debe mantenerse ese limite en cualquier futura ruta de escritura.

## Matriz de riesgo

| Amenaza | Probabilidad | Impacto | Riesgo | Mitigacion |
|---------|--------------|---------|--------|------------|
| VSIX incluye artefactos locales no revisados | Baja | Alto | Bajo | Mitigado: allowlist de release y `npx vsce ls` con 10 ficheros. Mantener comprobacion en CI. |
| `status.md` agota el host de extensiones | Baja | Medio | Bajo | Mitigado: limite previo de 64 KiB, lectura asincrona y limite de longitud renderizada. |
| Cambio no autorizado de la preferencia global | Baja | Bajo | Bajo | Mantener enum en `contributes.configuration` y no aceptar valores desde `status.md`. |
| Dependencia comprometida en build | Baja | Alto | Medio | Lockfile con integridad, SBOM, `npm audit` y actualizaciones revisadas. |
| Fuga de secretos en VSIX | Baja | Alto | Medio | Escaneo de secretos y lista de archivos permitidos antes de publicar. |

## Recomendaciones

1. Mantener en CI una comprobacion de `npx vsce ls` que permita exclusivamente runtime y metadatos de release aprobados.
2. Anadir politica de vulnerabilidades y soporte de actualizaciones para cerrar los controles CRA/NIS2 pendientes.