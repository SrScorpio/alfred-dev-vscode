#!/usr/bin/env bash
#
# Alfred Dev for VS Code — instalador (macOS / Linux)
#
# Uso:
#   ./install.sh            -> muestra verificación de prerequisitos e instrucciones
#   ./install.sh --local    -> registra este directorio como plugin local en
#                              chat.pluginLocations (con copia de seguridad de settings)
#
# La instalación soportada es el sistema nativo de agent plugins de VS Code:
#   1. Paleta de comandos -> "Chat: Install Plugin From Source"
#   2. Introducir la URL de este repositorio Git
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

amarillo() { printf '\033[33m%s\033[0m\n' "$1"; }
verde()    { printf '\033[32m%s\033[0m\n' "$1"; }
rojo()     { printf '\033[31m%s\033[0m\n' "$1"; }

echo
verde "Alfred Dev for VS Code — instalador"
echo "-------------------------------------"
echo

# --- 1. Verificar VS Code CLI -------------------------------------------------
CODE_BIN="$(command -v code || command -v code-insiders || true)"
if [ -n "$CODE_BIN" ]; then
  verde "[ok] VS Code CLI encontrado: $CODE_BIN"
else
  amarillo "[aviso] CLI 'code' no encontrado en PATH."
  amarillo "       Abre VS Code y ejecuta: Shell Command: Install 'code' command in PATH"
fi

# --- 2. Verificar estructura del plugin --------------------------------------
if [ -f "$SCRIPT_DIR/plugin.json" ] && [ -d "$SCRIPT_DIR/agents" ]; then
  AGENTES="$(ls -1 "$SCRIPT_DIR/agents"/*.agent.md 2>/dev/null | wc -l | tr -d ' ')"
  verde "[ok] plugin.json presente, $AGENTES agentes en agents/"
else
  rojo "[error] Falta plugin.json o agents/. Ejecuta este script desde la raíz del repo."
  exit 1
fi

# --- 3. Modo --local: registrar chat.pluginLocations --------------------------
if [ "${1:-}" = "--local" ]; then
  if [ -z "$CODE_BIN" ]; then
    rojo "[error] El modo --local necesita el CLI 'code' para localizar settings.json."
    exit 1
  fi

  SETTINGS="$("$CODE_BIN" --locate-shell-integration-dir >/dev/null 2>&1; true)"
  # Ruta estándar de settings.json por plataforma
  case "$(uname -s)" in
    Darwin) USER_SETTINGS="$HOME/Library/Application Support/Code/User/settings.json" ;;
    *)      USER_SETTINGS="$HOME/.config/Code/User/settings.json" ;;
  esac

  if [ ! -f "$USER_SETTINGS" ]; then
    rojo "[error] No se encontró settings.json en: $USER_SETTINGS"
    exit 1
  fi

  cp "$USER_SETTINGS" "$USER_SETTINGS.bak-alfred-dev"
  amarillo "[backup] $USER_SETTINGS.bak-alfred-dev"

  python3 - "$USER_SETTINGS" "$SCRIPT_DIR" <<'PYEOF'
import json, sys

settings_path, plugin_dir = sys.argv[1], sys.argv[2]

with open(settings_path, "r", encoding="utf-8") as f:
    text = f.read()

data = json.loads(text) if text.strip() else {}

locations = data.setdefault("chat.pluginLocations", {})
locations[plugin_dir] = True

with open(settings_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=4, ensure_ascii=False)
    f.write("\n")

print("[ok] chat.pluginLocations actualizado con: " + plugin_dir)
PYEOF

  echo
  verde "Plugin local registrado. Reinicia VS Code (o recarga la ventana) y busca los agentes en el dropdown del chat."
  exit 0
fi

# --- 4. Instrucciones ---------------------------------------------------------
cat <<EOF
Este repo es un agent plugin de VS Code (formato Copilot).

Instalación recomendada (cualquier máquina con el repo publicado en Git):
  1. Paleta de comandos (Cmd+Shift+P / Ctrl+Shift+P)
  2. "Chat: Install Plugin From Source"
  3. URL del repositorio Git de alfred-dev-vscode

Instalación local de desarrollo (esta máquina):
  ./install.sh --local
  -> registra este directorio en chat.pluginLocations (con backup de settings).

Instalación para equipos:
  settings.json del usuario:
    "chat.plugins.marketplaces": ["<owner>/alfred-dev-vscode"]
  .github/copilot/settings.json del workspace:
    "extraKnownMarketplaces" + "enabledPlugins" (ver README)

Después de instalar:
  - El dropdown de agentes del chat mostrará: alfred, product-owner, selina,
    architect, senior-dev, security-officer, qa-engineer, tech-writer,
    devops-engineer y lucius.
  - Para diagnosticar problemas: clic derecho en el chat -> Diagnostics.

Requisitos opcionales por agente:
  - lucius necesita Codex CLI: npm install -g @openai/codex && codex login
  - Modelos Grok/GPT/GLM requieren sus extensiones de proveedor (ver README).
EOF
