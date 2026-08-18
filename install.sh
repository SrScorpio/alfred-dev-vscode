#!/usr/bin/env bash
#
# Alfred Dev for VS Code — instalador (macOS / Linux)
#
# Uso:
#   ./install.sh              -> copia los 12 agentes a ~/.copilot/agents/ (nivel usuario:
#                                disponibles en TODOS los proyectos, sin más configuración)
#   ./install.sh --plugin     -> además registra este directorio como plugin local
#                                (chat.pluginLocations, con backup de settings)
#   ./install.sh --uninstall  -> retira los agentes de ~/.copilot/agents/
#
# Alternativa sin descargar nada (repo publicado en GitHub):
#   Paleta de comandos -> "Chat: Install Plugin From Source" -> URL del repo
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HOME/.copilot/agents"

amarillo() { printf '\033[33m%s\033[0m\n' "$1"; }
verde()    { printf '\033[32m%s\033[0m\n' "$1"; }
rojo()     { printf '\033[31m%s\033[0m\n' "$1"; }

echo
verde "Alfred Dev for VS Code — instalador"
echo "-------------------------------------"

# --- Verificar estructura del repo -------------------------------------------
if [ ! -f "$SCRIPT_DIR/plugin.json" ] || [ ! -d "$SCRIPT_DIR/agents" ]; then
  rojo "[error] Falta plugin.json o agents/. Ejecuta este script desde la raíz del repo."
  exit 1
fi

# --- Desinstalación -----------------------------------------------------------
if [ "${1:-}" = "--uninstall" ]; then
  n=0
  for f in "$SCRIPT_DIR"/agents/*.agent.md; do
    base="$(basename "$f")"
    if [ -f "$DEST/$base" ]; then rm "$DEST/$base"; n=$((n+1)); fi
  done
  verde "[ok] $n agentes retirados de $DEST"
  echo "Recarga la ventana de VS Code para que desaparezcan del selector."
  exit 0
fi

# --- 1. Copiar agentes a la carpeta oficial de usuario de Copilot -------------
mkdir -p "$DEST"
n=0
for f in "$SCRIPT_DIR"/agents/*.agent.md; do
  cp "$f" "$DEST/"
  n=$((n+1))
done
verde "[ok] $n agentes instalados en $DEST"
echo "      (nivel usuario: disponibles en todos tus proyectos)"

# --- 2. Registro opcional como plugin local ------------------------------------
if [ "${1:-}" = "--plugin" ]; then
  case "$(uname -s)" in
    Darwin) USER_SETTINGS="$HOME/Library/Application Support/Code/User/settings.json" ;;
    *)      USER_SETTINGS="$HOME/.config/Code/User/settings.json" ;;
  esac
  if [ -f "$USER_SETTINGS" ]; then
    cp "$USER_SETTINGS" "$USER_SETTINGS.bak-alfred-dev"
    python3 - "$USER_SETTINGS" "$SCRIPT_DIR" <<'PYEOF'
import json, sys
settings_path, plugin_dir = sys.argv[1], sys.argv[2]
data = json.load(open(settings_path, encoding="utf-8"))
data.setdefault("chat.pluginLocations", {})[plugin_dir] = True
json.dump(data, open(settings_path, "w", encoding="utf-8"), indent=4, ensure_ascii=False)
PYEOF
    verde "[ok] Plugin local registrado en chat.pluginLocations (backup: settings.json.bak-alfred-dev)"
  else
    amarillo "[aviso] No se encontró settings.json ($USER_SETTINGS); se omite el registro del plugin."
  fi
fi

# --- 3. Pasos finales ----------------------------------------------------------
echo
verde "Listo. Pasos finales:"
echo "  1. Recarga VS Code: paleta (Mayús+Cmd+P) -> 'Developer: Reload Window'"
echo "  2. Abre el Chat de Copilot y pulsa el selector de agente (abajo-izquierda del input)"
echo "  3. Deben aparecer los 12 agentes: alfred, product-owner, selina, architect,"
echo "     junior-dev, senior-dev, security-officer, qa-engineer, tech-writer,"
echo "     devops-engineer, seo-specialist y lucius"
echo
echo "Instrucciones globales (opcional, por proyecto):"
echo "  cp instructions/global-instructions.md.instructions.md <tu-proyecto>/.github/instructions/"
echo
echo "Desinstalar:  ./install.sh --uninstall"
