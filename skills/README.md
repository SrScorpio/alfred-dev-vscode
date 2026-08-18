# Skills

Dos catálogos. El instalador pregunta qué paquete quieres.

| Paquete | Qué incluye | Para quién |
|---------|-------------|------------|
| **Solo agentes** | Los 12 `.agent.md` | Quien solo quiere el equipo |
| **Básicas** | Agentes + 8 skills de **proceso** (`skills/core/`) | Quien quiere el *cómo* de ADRs, threat model, SBOM, PRs... |
| **Completas** | Básicas + 30 skills de **stack** (`skills/stack/`) | Quien además quiere expertise de lenguaje/framework bajo demanda |

En VS Code las skills viven en `~/.copilot/skills/<nombre>/` (usuario) o
`.github/skills/<nombre>/` (proyecto). El agente las descubre por el
`description` y las carga solo cuando encajan.

## `core/` — proceso (8, adaptadas a VS Code)

Fuente: [686f6c61/alfred-dev](https://github.com/686f6c61/alfred-dev) `skills/`
(MIT), reescritas para VS Code: sin helpers `.claude/`, sin MCP
`alfred-memory`. Plantillas en `references/` de cada skill y, tras instalar,
en `~/.copilot/alfred-dev/templates/` o `.github/alfred-dev/templates/`.

| Skill | Qué hace | Quién la usa |
|-------|----------|--------------|
| `write-adr` | ADR numerado en `docs/adr/` | `architect` |
| `evaluate-dependency` | Evaluación + fila en `dependencies.md` | `architect` |
| `threat-model` | STRIDE sobre arquitectura real | `security-officer` |
| `compliance-check` | RGPD / NIS2 / CRA con evidencia | `security-officer` |
| `sbom-generate` | Inventario (syft/cyclonedx o markdown) | `security-officer` |
| `pr-workflow` | PR con `gh` y `Closes #N` | `junior-dev` / `senior-dev` |
| `sync-project-docs` | Docs vivas / `plans/` / `status.md` | `tech-writer`, `alfred` |
| `incident-response` | Triaje → mitigación → postmortem | `qa-engineer`, `senior-dev` |

El archivo Claude (`memory`, `style-direction`, `sonarqube`) no vive en
`core/`. Está en `skills/source-claude/` y el instalador no lo toca.

## `stack/` — lenguajes y frameworks (30)

Fuente: catálogo MIT de [Jeffallan](https://github.com/Jeffallan) (vía archivo
Scolf). **No se copió el catálogo entero** (78): se excluyen skills
propietarias (`docx`, `pdf`, `xlsx`, `frontend-design`...) y las que
duplican un agente del equipo (`code-reviewer`, `security-reviewer`,
`devops-engineer`, `code-documenter`...).

Lenguajes: `python-pro`, `typescript-pro`, `javascript-pro`, `php-pro`,
`golang-pro`, `rust-engineer`, `csharp-developer`, `java-architect`,
`kotlin-specialist`, `swift-expert`, `cpp-pro`.

Frameworks: `django-expert`, `fastapi-expert`, `laravel-specialist`,
`wordpress-pro`, `nextjs-developer`, `react-expert`, `vue-expert`,
`nestjs-expert`, `flutter-expert`, `rails-expert`, `spring-boot-engineer`,
`react-native-expert`, `dotnet-core-expert`, `angular-architect`.

Infra / datos: `postgres-pro`, `playwright-expert`, `kubernetes-specialist`,
`terraform-engineer`, `graphql-architect`.
