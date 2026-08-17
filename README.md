# Alfred Dev for VS Code

**Equipo de 10 agentes de ingeniería de software para VS Code.** Orquestación del ciclo de desarrollo con quality gates verificables, TDD estricto, seguridad y compliance europeo (RGPD, NIS2, CRA) integrados desde el diseño. Multi-modelo: cada agente declara una cadena de modelos preferidos (Grok → GPT → GLM → copilot) con **fallback automático**.

Port del plugin [alfred-dev](https://github.com/686f6c61/alfred-dev) para Claude Code, adaptado a los mecanismos nativos de VS Code: custom agents (`.agent.md`), handoffs entre agentes y subagentes.

---

## El equipo

| Agente | Alias | Rol | Modelo (perfil) |
|--------|-------|-----|-----------------|
| `alfred` | Jefe de operaciones | Orquestador: decide qué agente actúa y evalúa gates | Terra → Grok 4.6 → GLM |
| `product-owner` | El Buscador de Problemas | PRDs, historias de usuario, criterios de aceptación | Luna → Grok 4.6 → GLM |
| `selina` | La Estilista | Dirección de estilo visual (solo frontend) | Luna → Grok 4.6 → GLM |
| `architect` | El Dibujante de Cajas | Diseño, ADRs, elección de stack, dependencias | Terra → Grok 4.6 → GLM |
| `senior-dev` | El Artesano | Implementación TDD, diagnóstico de bugs, refactor | Sol → Grok 4.6 → GLM |
| `security-officer` | El Paranoico | OWASP, CVEs, RGPD/NIS2/CRA, threat model, SBOM | Terra → Grok 4.6 → GLM |
| `qa-engineer` | El Rompe-cosas | Code review, test plans, exploratorio, regresión | Terra → Grok 4.6 → GLM |
| `tech-writer` | El Escriba | Documentación de código y de proyecto | Luna → Grok 4.6 → GLM |
| `devops-engineer` | El Fontanero | Docker, CI/CD, despliegue, monitoring | Luna → Grok 4.6 → GLM |
| `lucius` | El Director Técnico Externo | Segunda opinión vía Codex CLI (solo lectura) | Luna |

Tres principios de diseño heredados de alfred-dev:

- **Responsabilidad única.** El Artesano escribe código; El Paranoico audita seguridad. Ninguno invade el territorio del otro.
- **Herramientas restringidas.** No todos los agentes pueden editar ficheros o ejecutar terminal (ver tabla de tools abajo).
- **Quality gates entre fases.** Ningún artefacto pasa de fase sin veredicto: APROBADO, APROBADO CON CONDICIONES o RECHAZADO.

## Instalación

Requisitos: VS Code con GitHub Copilot Chat (custom agents y agent plugins). Los agentes aparecen en el dropdown de agentes del chat.

### Opción A: instalar desde el código fuente (recomendada)

1. Sube este repo a tu cuenta de GitHub (o usa un fork).
2. En VS Code: paleta de comandos (⇧⌘P) → **`Chat: Install Plugin From Source`**.
3. Introduce la URL del repo Git (p. ej. `https://github.com/686f6c61/alfred-dev-vscode`).
4. Confirma la instalación. Los 10 agentes aparecen en el dropdown de agentes del chat.

### Opción B: instalación local (desarrollo)

Registra la carpeta local del repo como plugin en tu `settings.json`:

```json
"chat.pluginLocations": {
  "/ruta/absoluta/a/alfred-dev-vscode": true
}
```

O ejecuta `./install.sh --local` (macOS/Linux) / `.\install.ps1 -Local` (Windows), que lo hace por ti con copia de seguridad de settings.

### Opción C: para equipos

Añade el marketplace en los settings del usuario y recomienda el plugin en el workspace:

```json
// settings.json (usuario)
"chat.plugins.marketplaces": ["686f6c61/alfred-dev-vscode"]
```

```json
// .github/copilot/settings.json (workspace)
{
  "extraKnownMarketplaces": {
    "alfred-dev-vscode": {
      "source": { "source": "github", "repo": "686f6c61/alfred-dev-vscode" }
    }
  },
  "enabledPlugins": { "alfred-dev-vscode@alfred-dev-vscode": true }
}
```

### Sin plugin: copia manual de agentes

Si prefieres no usar el sistema de plugins, copia los `.agent.md` que quieras a la carpeta oficial de agentes de Copilot:

- **Usuario** (todos tus workspaces): `~/.copilot/agents/`
- **Workspace** (un solo proyecto): `.github/agents/` dentro del repo

Las instrucciones globales (`instructions/global-instructions.md.instructions.md`) se copian a `.github/instructions/` del workspace.

## Configuración de modelos

Cada agente declara en su frontmatter un **array `model` priorizado**: VS Code prueba los modelos en orden y usa el primero disponible. Si un proveedor no está instalado, se salta sin errores y cae al siguiente.

Los arrays por defecto asumen estas extensiones de proveedor (instala las que uses):

| Proveedor | Vendor en el picker | Extensión |
|-----------|--------------------|-----------|
| xAI Grok 4.6 | `(xai-grok)` | [Grok for GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=grikomsn.grok-copilot-chat) |
| OpenAI GPT-5.6 (Luna/Sol/Terra) | `(openai-codex)` | [OpenAI OAuth Copilot Chat](https://marketplace.visualstudio.com/items?itemName=grikomsn.openai-oauth-copilot-chat) |
| Z.ai GLM | `(glm)` | [GLM for VS Code Copilot](https://marketplace.visualstudio.com/items?itemName=ikaros.glm-for-vscode-copilot) |
| GitHub Copilot | `(copilot)` | Incluido con Copilot (fallback garantizado) |

**Cómo ver los nombres exactos de tus modelos:** abre el picker de modelos en el chat de Copilot; el nombre cualificado tiene el formato `Nombre del modelo (vendor)`. Si un nombre del array no coincide con el de tu instalación (p. ej. tu catálogo de xAI expone otra versión de Grok), edita el campo `model` del `.agent.md` correspondiente: es una lista YAML, el orden es la prioridad.

Ejemplo de frontmatter de un agente:

```yaml
model: ['GPT-5.6 Terra (openai-codex)', 'GPT-5.6 Terra (copilot)', 'Grok 4.6 (xai-grok)', 'GLM-5.3 (glm)']
```

**Política de modelos GPT-5.6** (prioridad de coste):

- **Luna** (el más barato): máximo posible, para tareas normales → `product-owner`, `selina`, `tech-writer`, `devops-engineer`, `lucius`.
- **Terra**: tareas complicadas (razonamiento, auditoría) → `alfred`, `architect`, `security-officer`, `qa-engineer`.
- **Sol**: solo tareas muy complicadas → `senior-dev`.

La cadena prioriza tu cuenta de OpenAI (`openai-codex`), cae a las variantes
incluidas con Copilot (`copilot`) si acaso, y después a Grok 4.6 y GLM como
alternativas. Si un nombre no existe en tu catálogo, VS Code lo salta sin
error y usa el siguiente: es una lista YAML, el orden es la prioridad.

Si no quieres cadenas de modelos, borra la línea `model` y el agente usará el modelo que tengas seleccionado en el picker del chat.

## Uso

### Flujos

Arranca hablando con **alfred** (el orquestador). Él enruta al agente adecuado y, al terminar cada fase, los agentes ofrecen **botones de handoff** para pasar al siguiente con el prompt precargado:

```mermaid
flowchart LR
    A[alfred] --> PO[product-owner]
    PO -->|hay frontend| SE[selina]
    PO --> AR[architect]
    SE --> AR
    AR --> SD[senior-dev]
    SD --> QA[qa-engineer]
    QA --> TW[tech-writer]
    TW --> DO[devops-engineer]
    DO --> A
```

- **feature** (completo): producto → estilo visual* → arquitectura+seguridad → desarrollo → calidad+seguridad → documentación → entrega+seguridad.
- **fix** (3 fases): diagnóstico → corrección TDD → validación QA+seguridad.
- **spike**: exploración → conclusiones con ADR.
- **ship** (4 fases): auditoría final → documentación → empaquetado → despliegue (confirmación del usuario siempre).
- **audit**: qa + security + architect + tech-writer en paralelo, informe consolidado.

\* Solo si el proyecto tiene frontend.

Los gates de usuario nunca se autoaprueban: los handoffs usan `send: false` para que tú decidas con un clic cuándo avanzar de fase.

### Subagentes

`alfred`, `senior-dev` y `qa-engineer` pueden lanzar subagentes (campo `agents`): por ejemplo, qa-engineer lanza a security-officer en paralelo durante la fase de calidad, o senior-dev lo lanza para auditar una dependencia nueva.

### Herramientas por agente

| Agente | search | edit | terminal | web | agent (subagentes) |
|--------|:-----:|:----:|:--------:|:---:|:------------------:|
| alfred | ✓ | ✓ | ✓ | ✓ | ✓ (los 9) |
| product-owner | ✓ | ✓ | – | ✓ | – |
| selina | ✓ | ✓ | ✓ | – | – |
| architect | ✓ | ✓ | ✓ | ✓ | – |
| senior-dev | ✓ | ✓ | ✓ | – | ✓ (security) |
| security-officer | ✓ | ✓ | ✓ | ✓ | – |
| qa-engineer | ✓ | ✓ | ✓ | – | ✓ (security) |
| tech-writer | ✓ | ✓ | – | – | – |
| devops-engineer | ✓ | ✓ | ✓ | – | – |
| lucius | ✓ | – | ✓ | – | – |

Restricción deliberada: tech-writer no ejecuta terminal; product-owner no ejecuta comandos; lucius solo busca y ejecuta Codex CLI en read-only.

### Lucius (segunda opinión externa)

Requiere Codex CLI de OpenAI: `npm install -g @openai/codex` y `codex login`. Lucius audita en sandbox de solo lectura y verifica con Git que no ha tocado nada.

### Artefactos que produce el equipo en tu proyecto

- `docs/prd/` — PRDs (product-owner)
- `docs/adr/` — ADRs numerados (architect)
- `docs/style-direction.md` — dirección visual (selina)
- `docs/test/` — planes de testing (qa-engineer)
- `docs/project/` — arquitectura viva, threat-model, compliance, dependencies, sbom (architect, security-officer)
- `.style-options/` — propuestas visuales temporales (selina, se limpia al elegir)

## Estructura del repo

```
alfred-dev-vscode/
├── plugin.json                # Manifest del plugin (formato Copilot)
├── agents/                    # 10 custom agents de VS Code
│   ├── alfred.agent.md
│   ├── product-owner.agent.md
│   ├── selina.agent.md
│   ├── architect.agent.md
│   ├── senior-dev.agent.md
│   ├── security-officer.agent.md
│   ├── qa-engineer.agent.md
│   ├── tech-writer.agent.md
│   ├── devops-engineer.agent.md
│   └── lucius.agent.md
├── .github/agents/            # Copia idéntica: descubrimiento workspace nativo
│                              # (si abres este repo como workspace, los agentes
│                              #  cargan sin necesidad del sistema de plugins)
├── instructions/
│   └── global-instructions.md.instructions.md   # Copiar a .github/instructions/ del workspace
├── install.sh                 # Instalador macOS/Linux
├── install.ps1                # Instalador Windows
├── CHANGELOG.md
└── LICENSE                    # MIT
```

Nota: si tienes el plugin instalado Y abres este repo como workspace a la vez,
los agentes pueden aparecer duplicados (una copia del plugin, otra del
workspace). Es el comportamiento esperado; desactiva el plugin o ignora la
copia sobrante.

## Roadmap

- [x] **Fase 1** — Los 10 agentes con multi-modelo, handoffs y subagentes.
- [ ] **Fase 4** — Skills de proceso (threat-model, write-adr, sbom-generate...), memoria MCP, hooks de seguridad.
- [ ] **Fase 5** — Extensión VSIX con UI de configuración de modelos y bootstrap.
- [ ] **Fase 6** — Integración con Ralph Suite (kanban + runner).

## Créditos y licencia

Port de [alfred-dev](https://github.com/686f6c61/alfred-dev) (MIT). Las instrucciones globales provienen del archivo personal del autor. Licencia [MIT](LICENSE).
