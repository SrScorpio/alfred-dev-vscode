# Changelog

Todos los cambios notables de este proyecto se documentan en este fichero.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Contrato `tests/compact-chat-progress.test.js` y script `npm test` para
  bloquear regresiones de la política de progreso compacto y de las
  excepciones de seguridad, integridad, coste y aprobación.
- Workflow GitHub Actions (`.github/workflows/ci.yml`) que ejecuta `npm test`
  y `npm run compile` en `push` y `pull_request`.

### Changed

- Política de progreso conversacional muy compacto (modo B): los agentes no
  narran búsquedas, lecturas, comandos ni microacciones; emiten como máximo
  una línea de estado ante un cambio relevante, bloqueo, decisión, riesgo o
  resultado; y conservan el detalle de informes, veredictos y gates.
- `alfred`, `qa-engineer` y `lucius` adaptan activación y notas exploratorias
  a esa política. Lucius mantiene confirmación explícita, sandbox de solo
  lectura y comparación Git; las HARD-GATE de Alfred no se relajan.
- Las cadenas de modelos priorizan los nombres normalizados que expone Codex
  Bridge (`GPT 5.6 Terra`, `GPT 5.6 Luna` y `GPT 5.6 Sol`) con el vendor
  `(openai-codex)`.
- README ampliado con nota informativa sobre los bridges instalados y una gía
  para añadir proveedores adicionales, incluidos fallbacks opcionales de
  Claude al final de la cadena.
