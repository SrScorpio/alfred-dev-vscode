# Changelog

Todos los cambios notables de este proyecto se documentan en este fichero.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-08-18

### Added

- Nuevo agente `junior-dev` (El Aprendiz): desarrollador del día a día con
  modelos baratos (Luna). Implementa historias del PRD, fixes acotados y
  refactors mecánicos con TDD estricto y protocolo de escalada (2 intentos
  máximo, luego escala a senior-dev con contexto).
- Handoffs de junior-dev: escalar a senior-dev y entregar a qa-engineer.
- Handoff de delegación en senior-dev hacia junior-dev.

### Changed

- `senior-dev` re-escalado: reservado a tareas MUY complicadas (bugs
  difíciles, refactors de riesgo) y a las escaladas de junior-dev. Modelo
  Sol (solo muy complicado, según política de coste).
- `alfred` actualizado: equipo de 9 de núcleo, junior-dev en subagentes y
  routing (implementación por defecto = junior-dev; senior-dev para lo
  difícil), nuevo handoff "Cambio acotado".
- `architect` entrega ahora el diseño a junior-dev por defecto (con
  instrucción de escalar a senior-dev si algo no encaja).
- Política de modelos GPT-primero documentada en README: Luna máximo
  posible, Terra complicado, Sol muy complicado; Grok 4.6 y GLM-5.3 como
  cadena alternativa tras openai-codex y copilot.

## [0.1.0] - 2026-08-18

### Added

- Plugin en formato Copilot para VS Code (`plugin.json`) con discovery de
  agentes desde `agents/`.
- Los 10 agentes del equipo Alfred Dev portados a custom agents de VS Code
  (`.agent.md`): `alfred`, `product-owner`, `selina`, `architect`,
  `senior-dev`, `security-officer`, `qa-engineer`, `tech-writer`,
  `devops-engineer` y `lucius`.
- Arrays `model` multi-proveedor con fallback automático en cada agente
  (Grok / GPT / GLM / copilot).
- Campo `agents` (subagentes) en `alfred`, `senior-dev` y `qa-engineer` para
  delegación en fases paralelas.
- Campo `handoffs` en los 10 agentes para encadenar las fases del flujo
  feature (producto → estilo → arquitectura → desarrollo → calidad →
  documentación → entrega) y los flujos fix / audit / ship.
- Instrucciones globales del workspace (`instructions/global-instructions.md.instructions.md`)
  con reglas de comunicación, anti-bloat, estilo, seguridad y rendimiento.
- Instaladores `install.sh` (macOS/Linux) y `install.ps1` (Windows).
- Port de origen: [alfred-dev](https://github.com/686f6c61/alfred-dev) 0.7.0
  (plugin de Claude Code). Los prompts se adaptaron eliminando dependencias
  del runtime de Claude (estado en `.claude/`, prefetch por hooks, MCP
  `alfred-memory`, `${CLAUDE_PLUGIN_ROOT}`) y sustituyéndolas por mecanismos
  nativos de VS Code (handoffs, subagentes, arrays de modelos).
