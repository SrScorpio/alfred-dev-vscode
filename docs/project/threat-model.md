# Modelo de amenazas: extension nativa VSIX

**Fecha:** 2026-08-21
**Autor:** security-officer
**Commit revisado:** `084e64eaf1b51656a5149cb0b5a22021c90f56d2`
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

`status.md` es controlable por el workspace, pero sus valores solo se convierten en etiquetas y no seleccionan comandos ni rutas. El riesgo relevante es la cadena de empaquetado: `vsce` admite archivos locales no versionados con las reglas actuales.

### Repudiation (repudio)

No hay registro de acciones de seguridad, publicacion de VSIX ni cambios de perfil atribuible. Para un producto distribuido debe existir trazabilidad de releases y un proceso de incidentes.

### Information Disclosure (fuga de informacion)

`npx vsce ls` incluye `1260721182603-out/`, `.vscode/launch.json` y `docs/test/`. Los mapas evaluados no contienen `sourcesContent`, pero el contenido no versionado puede variar entre estaciones y no debe distribuirse. El escaneo de secretos de codigo y configuracion no encontro coincidencias de credenciales; las del lockfile son nombres de paquetes.

### Denial of Service (denegacion de servicio)

La lectura sincronica e ilimitada de `status.md` puede bloquear el host de extensiones ante un fichero muy grande. No hay endpoints de red propios ni superficie de rate limiting en el cambio revisado.

### Elevation of Privilege (elevacion de privilegios)

No hay `child_process`, shell, acceso de red ni comandos derivados de contenido de workspace. La configuracion declara el enum `luna`, `terra`, `sol`; debe mantenerse ese limite en cualquier futura ruta de escritura.

## Matriz de riesgo

| Amenaza | Probabilidad | Impacto | Riesgo | Mitigacion |
|---------|--------------|---------|--------|------------|
| VSIX incluye artefactos locales no revisados | Media | Alto | Medio | Lista permitida de release o exclusiones estrictas y comprobacion `vsce ls` en CI. |
| `status.md` agota el host de extensiones | Media | Medio | Medio | Limite de tamano, lectura asincrona y limite de longitud renderizada. |
| Cambio no autorizado de la preferencia global | Baja | Bajo | Bajo | Mantener enum en `contributes.configuration` y no aceptar valores desde `status.md`. |
| Dependencia comprometida en build | Baja | Alto | Medio | Lockfile con integridad, SBOM, `npm audit` y actualizaciones revisadas. |
| Fuga de secretos en VSIX | Baja | Alto | Medio | Escaneo de secretos y lista de archivos permitidos antes de publicar. |

## Recomendaciones

1. Bloquear la publicacion hasta que `vsce ls` contenga exclusivamente runtime y metadatos de release aprobados.
2. Limitar y leer de forma asincrona `docs/project/status.md` antes de parsearlo.
3. Anadir politica de vulnerabilidades y soporte de actualizaciones para cerrar los controles CRA/NIS2 pendientes.