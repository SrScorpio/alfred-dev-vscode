# Skills

Dos catálogos. El instalador pregunta qué paquete quieres.

| Paquete | Qué incluye | Para quién |
|---------|-------------|------------|
| **Solo agentes** | Los 12 `.agent.md` | Quien solo quiere el equipo |
| **Básicas** | Agentes + 11 skills de **proceso** (`skills/core/`) | Quien quiere el *cómo* de ADRs, threat model, SBOM, PRs... |
| **Completas** | Básicas + 30 skills de **stack** (`skills/stack/`) | Quien además quiere expertise de lenguaje/framework bajo demanda |

En VS Code las skills viven en `~/.copilot/skills/<nombre>/` (usuario) o
`.github/skills/<nombre>/` (proyecto). El agente las descubre por el
`description` y las carga solo cuando encajan.

## `core/` — proceso (11)

Fuente: [686f6c61/alfred-dev](https://github.com/686f6c61/alfred-dev) `skills/`
(MIT). Se conservan para no perder el procedimiento original. **Aún no están
portadas al runtime de VS Code** (el original usa helpers Python y MCP
`alfred-memory`): el flujo feature/fix/ship/audit **sí funciona** porque vive
en los agentes. Estas skills son el *cómo* detallado de cada artefacto.

| Skill | Qué hace | Cubierta hoy por | Acción Fase 3 |
|-------|----------|------------------|---------------|
| `write-adr` | Plantilla y protocolo de ADRs | `architect` | Portar plantilla a `templates/` |
| `threat-model` | STRIDE sistemático | `security-officer` | Portar protocolo STRIDE |
| `evaluate-dependency` | Evaluación de paquetes | `architect` | Portar checklist |
| `compliance-check` | RGPD / NIS2 / CRA | `security-officer` | Portar checklist normativo |
| `sbom-generate` | Inventario CycloneDX/SPDX | `security-officer` | Portar procedimiento |
| `sync-project-docs` | Actualizar docs vivas | `tech-writer` + `status.md` | Portar checklist de sync |
| `pr-workflow` | PRs bien documentadas | `junior-dev` / `senior-dev` | Fusionar lo que falte |
| `style-direction` | Companion visual de Selina | `selina` | El servidor visual es runtime Claude |
| `incident-response` | Triaje → postmortem | **Nadie** | Portar a `qa-engineer` o skill |
| `sonarqube` | Análisis estático con Docker | **Nadie** | Opcional |
| `memory` | MCP `alfred-memory` | `status.md` + issues | Servidor MCP (Fase 3 avanzada) |

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

Estas sí están en formato `SKILL.md` de VS Code y se activan al instalar el
paquete **completas**.
