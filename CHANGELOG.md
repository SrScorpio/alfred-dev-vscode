# Changelog

Todos los cambios notables de este proyecto se documentan en este fichero.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
