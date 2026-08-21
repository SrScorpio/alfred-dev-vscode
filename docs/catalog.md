# Catálogo de agentes y skills

Alfred Dev para VS Code combina un equipo de agentes personalizados con
skills que los agentes cargan cuando encajan con la tarea. El repositorio es
la fuente del catálogo; el instalador decide qué piezas copiar al perfil de
usuario o al proyecto.

## Qué se puede instalar

- **Agentes:** los ficheros `agents/*.agent.md`. El paquete «Solo agentes»
  instala los 12 agentes.
- **Skills de proceso:** `skills/core/`. El paquete «Básicas» añade las ocho
  skills adaptadas a VS Code.
- **Skills de stack:** `skills/stack/`. El paquete «Completas» añade las
  skills de lenguajes, frameworks, infraestructura y datos.
- **Instructions y plantillas:** `instructions/` y `templates/` son recursos
  de configuración y apoyo que el instalador puede copiar junto con el
  paquete elegido; no son agentes ni skills.

La instalación puede hacerse con `install.ps1` en Windows o `install.sh` en
macOS y Linux. También se pueden instalar los agentes mediante el sistema de
plugins de VS Code o copiar piezas concretas manualmente, tal como explica el
[README principal](../README.md).

## Qué no se instala como catálogo VS Code

`skills/source-claude/` conserva material de referencia procedente del
entorno Claude. No forma parte de los paquetes que instala este repositorio.
Las skills de `core/` son las adaptadas para VS Code; las de `stack/` son un
catálogo curado de lenguajes y frameworks.

## Dónde consultar cada pieza

- [Agentes](../agents/): roles, instrucciones y cadenas de modelos de los
  agentes personalizados.
- [Skills](../skills/README.md): paquetes, categorías, instalación y
  procedencia del catálogo.
- [Instructions](../instructions/): reglas globales que el instalador puede
  colocar en el ámbito de usuario o de proyecto.
- [Plantillas](../templates/): ADR, compliance, SBOM, threat model, estado y
  `AGENTS.md`.

El catálogo no sustituye la documentación de uso de la extensión. Para la
interfaz nativa, los comandos y el empaquetado, consulta la [guía de la
VSIX](vsix.md).
