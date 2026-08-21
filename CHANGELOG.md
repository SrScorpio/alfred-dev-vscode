# Changelog

Todos los cambios notables de este proyecto se documentan en este fichero.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Contrato `tests/compact-chat-progress.test.js` y script `npm test` para
  bloquear regresiones de la política de progreso compacto y de las
  excepciones de seguridad, integridad, coste y aprobación.

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

## [0.6.4] - 2026-08-18

### Fixed

- Instalador no interactivo (CI): ya no llama al menú; instala agentes +
  instructions + templates sin preguntar.
- `alfred` y README: plantilla de `status.md` en rutas instaladas, no en el
  repo del plugin.
- Comentario de cabecera de `install.ps1` alineado con el de `install.sh`.

### Removed

- Stubs `memory`, `style-direction` y `sonarqube` de `skills/core/` (el
  instalador no las copiaba). La referencia Claude queda solo en
  `skills/source-claude/`.

## [0.6.3] - 2026-08-18

### Fixed

- Las instructions globales se instalan en `Code/User/instructions/`
  (donde VS Code las descubre), no en `User/prompts/`. El
  `templates/copilot-instructions.md` sigue siendo plantilla de
  `AGENTS.md` por proyecto: no se copia al perfil.

## [0.6.2] - 2026-08-18

### Changed

- El instalador es autónomo: al instalar se copian **instructions +
  templates** al perfil (`Code/User/prompts` y
  `~/.copilot/alfred-dev/templates/`) o al proyecto
  (`.github/instructions/` y `.github/alfred-dev/templates/`). Tras
  instalar no hace falta tener el repo abierto. Desinstalar los retira.
- Plantillas de ADR / STRIDE / compliance / SBOM también van en
  `skills/core/<skill>/references/` para que viajen con la skill.

## [0.6.1] - 2026-08-18

### Changed

- Las 8 skills de proceso de `skills/core/` están adaptadas a VS Code: sin
  `.claude/alfred-continuity.py`, sin MCP `alfred-memory`. Plantillas
  `templates/adr.md`, `threat-model.md`, `compliance.md` y `sbom.md`.
- El instalador (paquete Básicas) copia solo esas 8. `memory`,
  `style-direction` y `sonarqube` no se instalan (runtime Claude); referencia
  en `skills/source-claude/`.

## [0.6.0] - 2026-08-18

### Added

- **Paquetes de instalación** (menú, sin flags): Solo agentes / Básicas
  (agentes + 11 skills de proceso) / Completas (básicas + 30 skills de
  stack). Alcance global (`~/.copilot/skills/`) o por proyecto
  (`.github/skills/`).
- Catálogo `skills/stack/` (30, MIT, autor Jeffallan): lenguajes,
  frameworks e infra curados. No se copió el catálogo entero de Scolf
  (78): se excluyen skills propietarias y las que duplican un agente
  del equipo (`code-reviewer`, `security-reviewer`, `devops-engineer`...).
- `skills/` reorganizado en `core/` (proceso del original) y `stack/`.

## [0.5.2] - 2026-08-18

### Added

- Conservadas las 11 skills de proceso del original (`skills/`, fuente
  `686f6c61/alfred-dev`) para no perder el procedimiento: write-adr,
  threat-model, evaluate-dependency, compliance-check, sbom-generate,
  sync-project-docs, pr-workflow, style-direction, incident-response,
  sonarqube y memory. Aún no están activas en VS Code (formato Claude Code).
  Inventario y plan de port en `skills/README.md`. Las fases del flujo no
  dependen de ellas: viven en los agentes.

## [0.5.1] - 2026-08-18

### Changed

- Atribución reforzada al autor original: cabecera del README con nota
  destacada (repo `686f6c61/alfred-dev` + documentación en alfred-dev.com),
  sección de créditos ampliada con desglose qué-viene-del-original /
  qué-añade-el-port, y LICENSE con doble línea de copyright (el original se
  conserva expresamente, como exige el MIT).

## [0.5.0] - 2026-08-18

### Changed

- **Instaladores reescritos como menú interactivo sencillo**, sin argumentos
  (`--plugin`, `--uninstall`, `-Plugin` eliminados). Opciones: 1) instalar a
  nivel usuario (global, `~/.copilot/agents/`), 2) instalar en un proyecto
  concreto (`.github/agents/` + instrucciones opcionales a
  `.github/instructions/`, con aviso de duplicados si hay global), 3)
  desinstalar (global o proyecto; solo retira los ficheros de este repo), 0)
  salir. Sin terminal interactiva (scripts/CI) instala global directamente.
- Eliminado el registro como plugin local del instalador (la vía plugin queda
  como instalación desde GitHub, documentada en el README).

## [0.4.2] - 2026-08-18

### Added

- Instrucciones globales, cierre de la revisión de la gía de 60 buenas
  prácticas: composición sobre herencia, SOLID/DRY donde reduzcan complejidad
  real (no dogma) y seguir el linter/formatter del proyecto cuando esté
  configurado. El resto de la gía ya estaba cubierto por global-instructions,
  los agentes o la plantilla por proyecto.

## [0.4.1] - 2026-08-18

### Added

- Instrucciones globales: nueva sección "Documentación del proyecto (fuente de
  verdad)" — el equipo se adapta a la convención de docs del proyecto
  (`plans/`, `docs/` u otra) en vez de crear estructuras paralelas; si hay
  conflicto, gana el proyecto salvo en seguridad. Incluye equivalencias
  habituales (`decisiones.md` ≈ ADRs, etc.).
- Instrucciones globales: magic numbers/strings prohibidos (constantes con
  nombre), excepciones específicas + logging estructurado (refuerza manejo de
  errores), checklist antes/después de mover código (callers, handlers inline,
  globales, fallos preexistentes documentados) y no eliminar ficheros ni ramas
  sin confirmación.
- Nueva plantilla `templates/copilot-instructions.md`: instrucciones por
  proyecto (leer primero, stack, innegociables, reglas de modularización,
  validación) para copiar como `AGENTS.md` en la raíz.
- `architect`: diseño para fallar con gracia en llamadas externas (timeouts,
  reintentos con backoff, fallback); patrones pesados solo con dependencias
  inestables demostradas.

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
