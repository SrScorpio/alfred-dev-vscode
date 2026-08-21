# Plan de pruebas: VSIX nativa

## Objetivo y gate

Validar la extensión VSIX de la issue #1: TreeView de estado, comandos de chat y flujo, selector global Luna/Terra/Sol y empaquetado local. La gate exige tests verdes, empaquetado reproducible y cero hallazgos bloqueantes contra los criterios de aceptación.

## Cobertura actual

| Área | Tipo | Evidencia actual | Estado |
| --- | --- | --- | --- |
| Parser de `status.md` | Unitario | `tests/status-parser.test.js` cubre `Siguiente acción`, `Próxima acción` y snapshot ausente | Parcial |
| Perfiles Luna/Terra/Sol | Unitario | `tests/model-profile.test.js` comprueba catálogo, orden y textos | Parcial |
| Contribuciones de extensión | Contrato | `tests/extension-contract.test.js` comprueba comandos, configuración y exclusiones básicas | Parcial |
| Compatibilidad de instrucciones existente | Regresión | `tests/compact-chat-progress.test.js` | Cubierto |
| Compilación y suite | Integración ligera | `npm test` | Cubierto |
| VSIX | Empaquetado | `npm run package` | Cubierto manualmente |

## Casos priorizados por riesgo

| Prioridad | Área y escenario | Tipo | Resultado esperado |
| --- | --- | --- | --- |
| Crítica | Selector global: elegir un perfil y reiniciar la extensión | Integración / E2E | Se conserva y aplica una única preferencia global; los perfiles por agente quedan fuera de esta issue. |
| Crítica | Activar la extensión sin GitHub Copilot Chat disponible y ejecutar `alfred-dev.openChat` o iniciar un flujo | Integración | Error manejado y mensaje accionable; no hay rechazo de promesa sin capturar ni falso mensaje de éxito. |
| Alta | Abrir workspace con `docs/project/status.md` válido y pulsar refrescar | E2E | TreeView expone Flujo, Fase, Gate, Acción y se actualiza tras modificar el archivo. |
| Alta | `status.md` ausente | Integración | Se muestran acciones y el mensaje de GitHub Issues. |
| Alta | `status.md` malformado, ilegible o sin campos reconocidos | Integración / edge case | La vista conserva acciones, comunica el estado no interpretable y no queda vacía sin explicación. |
| Alta | Cancelar el QuickPick de perfil | Integración | No se escribe configuración ni se muestra confirmación. |
| Alta | Ejecutar `alfred-dev.startFlow`, elegir cada flujo y cancelar | E2E | Los cuatro flujos abren chat con `@alfred`; cancelar no ejecuta comandos. |
| Alta | Empaquetar con directorios generados no versionados presentes | Empaquetado / regresión | El VSIX sólo contiene el runtime y metadatos necesarios; no incluye salidas obsoletas o artefactos ajenos. |
| Media | Workspace vacío (sin `workspaceFolders`) | Integración | Se muestra `Sin Workspace abierto` sin lanzar excepciones. |
| Media | Parser con CRLF, Unicode, campos duplicados, valor vacío y texto largo | Unitario / edge case | Extrae el campo esperado de forma determinista o presenta estado no interpretable. |
| Media | Persistir cada perfil y reiniciar VS Code | E2E | La preferencia seleccionada permanece en su ámbito declarado. |
| Baja | Iconos y tooltips del TreeView en tema claro y oscuro | Exploratorio | Controles distinguibles y etiquetas completas. |

## Huecos que deben automatizarse

1. Mock de `vscode.window.showQuickPick` y `workspace.getConfiguration().update` para cubrir selección y cancelación.
2. Pruebas de `StatusTreeProvider` con workspace vacío, archivo ausente, lectura fallida y contenido malformado.
3. Pruebas de fallo de `workbench.action.chat.open` para ambos comandos de chat.
4. Prueba de contenido del VSIX con `vsce ls --tree`, ejecutada en un árbol con salidas generadas no permitidas.
5. E2E de VS Code Extension Host para comandos, TreeView y persistencia. El requisito literal de perfil por agente necesita antes una especificación implementable y una API compatible.

## Sesión exploratoria cerrada

**Objetivo:** romper los flujos de UI y empaquetado que los tests de contrato no ejecutan.

**Duración:** 45 minutos equivalentes.

**Notas acumuladas:**

- El selector persiste únicamente `alfred-dev.modelProfile` en `ConfigurationTarget.Global`; no existe identificador de agente, mapa por agente ni consumo que altere el modelo de cada agente.
- El código de chat delega directamente en `workbench.action.chat.open` y no captura un rechazo ni verifica que Copilot Chat esté disponible.
- `npm run package` genera el VSIX correctamente, pero con el directorio local generado `1260721182603-out/` incluido en el artefacto porque no está excluido.
- `npm test` pasa 16 pruebas, pero ninguna prueba integra la API `vscode`, el host de extensiones ni el contenido real del VSIX.

**Resumen:** la regresión unitaria básica y la compilación están en verde. Los escenarios críticos de cumplimiento funcional requieren corrección y cobertura antes de aprobar la gate.

## Evidencia de ejecución

- CI del PR #9: check `test` completado con `success` en el commit `084e64eaf1b51656a5149cb0b5a22021c90f56d2`.
- Local: `npm test` completó 20 de 20 pruebas sin fallos.
- Local: `npx vsce ls` devolvió 10 archivos permitidos, sin mapas ni salidas locales.
