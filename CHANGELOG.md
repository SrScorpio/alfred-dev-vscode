# Changelog

Todos los cambios notables de este proyecto se documentan en este fichero.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-08-18

### Added

- **Memoria GitHub-first con fallback local**: el estado del trabajo vive en dos
  capas. (1) GitHub Issues + PRs como fuente de verdad colaborativa: convención
  de labels de estado (`story`, `backlog`, `in-progress`, `in-review`,
  `blocked`) gestionada por el equipo — junior-dev/senior-dev marcan `in-progress`
  al empezar e `in-review` al abrir PR; qa-engineer comenta su veredicto en la
  issue y la devuelve a `in-progress` si rechaza; el merge con `Closes #N`
  cierra el ciclo. Las gates pasadas quedan como comentarios: historial
  auditable que sobrevive a cualquier persona. (2) `docs/project/status.md`
  como snapshot local commiteado tras cada gate (fallback offline, sobrevive en
  cualquier remoto). Plantilla de referencia en `templates/status.md`.
- `alfred`: protocolo de arranque con memoria — reconstruye el estado real
  desde issues/PRs (`gh`) o desde `status.md` antes de proponer nada; «retoma»
  continúa el flujo donde estaba.

### Changed

- `product-owner`: las issues pasan de "espejo" a registro del estado del
  trabajo (el PRD sigue mandando el contenido); crea los labels si no existen.

## [0.3.0] - 2026-08-18

### Added

- **Flujo GitHub** repartido entre agentes existentes (sin agentes nuevos para
  ello): `product-owner` publica las historias del PRD como GitHub Issues (una
  por historia, con criterios Given/When/Then); `junior-dev` y `senior-dev`
  trabajan en ramas `feat/<slug>` / `fix/<slug>` y abren PR con `Closes #N`;
  `qa-engineer` revisa el PR como gate de calidad (request-changes /
  approve, CI rojo = rechazado); `devops-engineer` mantiene CI por PR y
  `main` protegida. El merge siempre lo decide el usuario. Las issues son
  espejo del PRD, no la fuente de verdad.
- Nuevo agente opcional `seo-specialist` (El Rastreador): auditoría de meta
  tags, datos estructurados JSON-LD, Core Web Vitals y rastreabilidad, con
  HARD-GATE de indexación. Solo se activa en proyectos con contenido web
  público (patrón selina). Modelo Luna.
- `qa-engineer`: revisión de pull requests como responsabilidad propia,
  validación de estándares del workspace en 6 categorías (documentación
  anti-bloat, estilo de trabajo, tecnología, calidad, seguridad,
  rendimiento) y checklist rápido por lenguaje (Python, TS/JS, Rust, Go).
- `architect`: filtro de sobre-ingeniería con señales de alerta explícitas
  (dependencia para 20 líneas, microservicios innecesarios, auth custom,
  etc.) y la pregunta "qué pasaría si NO se hace".
- Instrucciones globales: mandatos de comunicación senior (conclusión
  primero, candor radical con evidencia, declarar incertidumbre, alcance
  estricto, advertencia pre-operaciones destructivas).

### Changed

- `plugin.json`: versión 0.3.0, descripción actualizada (12 agentes, flujo
  GitHub) y URL del repositorio corregida a `SrScorpio/alfred-dev-vscode`
  (el origin real).
- README: sección "Flujo GitHub", seo-specialist en tablas de equipo y
  herramientas, Fase 2 del roadmap completada.
- Instaladores: mensajes actualizados a 12 agentes.

## [0.2.1] - 2026-08-18

### Changed

- Instaladores reescritos: la acción por defecto ahora copia los agentes a
  `~/.copilot/agents/` (carpeta oficial de usuario de Copilot, disponible en
  todos los proyectos). Nuevo modo `--uninstall` / `-Uninstall`. El registro
  como plugin local pasa a ser opcional (`--plugin` / `-Plugin`).
- README: sección de instalación reordenada (instalador → plugin desde
  GitHub → equipos → plugin local → copia manual).

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
