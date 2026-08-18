#!/usr/bin/env bash
#
# Alfred Dev for VS Code — instalador (macOS / Linux)
#
# Ejecuta ./install.sh y elige en el menú:
#   1) Global   -> todos los proyectos (~/.copilot/agents y ~/.copilot/skills)
#   2) Proyecto -> solo un repo (.github/agents y .github/skills)
#   3) Desinstalar
# Tras 1 o 2 elige el paquete: solo agentes / básicas (proceso) / completas (proceso + stack).
#
# Sin terminal interactiva (scripts/CI) se instala global, solo agentes.
#
# Alternativa sin descargar nada (repo publicado en GitHub):
#   Paleta de comandos -> "Chat: Install Plugin From Source" -> URL del repo
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GLOBAL_AGENTS="$HOME/.copilot/agents"
GLOBAL_SKILLS="$HOME/.copilot/skills"

amarillo() { printf '\033[33m%s\033[0m\n' "$1"; }
verde()    { printf '\033[32m%s\033[0m\n' "$1"; }
rojo()     { printf '\033[31m%s\033[0m\n' "$1"; }

AGENTES="alfred product-owner selina architect junior-dev senior-dev
security-officer qa-engineer tech-writer devops-engineer seo-specialist lucius"

copiar_agentes() {  # $1 = destino
  mkdir -p "$1"
  local n=0 f
  for f in "$SCRIPT_DIR"/agents/*.agent.md; do
    cp "$f" "$1/"; n=$((n+1))
  done
  verde "[ok] $n agentes instalados en $1"
}

copiar_skills() {  # $1 = destino  $2 = core|stack|ambas
  local dest="$1" modo="$2" n=0 d name
  mkdir -p "$dest"
  if [ "$modo" = "core" ] || [ "$modo" = "ambas" ]; then
    for d in "$SCRIPT_DIR"/skills/core/*/; do
      [ -d "$d" ] || continue
      name="$(basename "$d")"
      rm -rf "$dest/$name"
      cp -R "$d" "$dest/$name"
      n=$((n+1))
    done
  fi
  if [ "$modo" = "stack" ] || [ "$modo" = "ambas" ]; then
    for d in "$SCRIPT_DIR"/skills/stack/*/; do
      [ -d "$d" ] || continue
      name="$(basename "$d")"
      rm -rf "$dest/$name"
      cp -R "$d" "$dest/$name"
      n=$((n+1))
    done
  fi
  verde "[ok] $n skills instaladas en $dest"
}

retirar_agentes() {  # $1 = destino (solo retira los 12 de este repo)
  local n=0 base
  for base in $AGENTES; do
    if [ -f "$1/$base.agent.md" ]; then rm "$1/$base.agent.md"; n=$((n+1)); fi
  done
  verde "[ok] $n agentes retirados de $1"
}

retirar_skills() {  # $1 = destino de skills
  local n=0 d name dest="$1"
  [ -d "$dest" ] || { verde "[ok] 0 skills (no había carpeta $dest)"; return 0; }
  for d in "$SCRIPT_DIR"/skills/core/*/ "$SCRIPT_DIR"/skills/stack/*/; do
    [ -d "$d" ] || continue
    name="$(basename "$d")"
    if [ -d "$dest/$name" ]; then rm -rf "$dest/$name"; n=$((n+1)); fi
  done
  verde "[ok] $n skills retiradas de $dest"
}

elegir_paquete() {
  echo
  echo "  Paquete:"
  echo "    1) Solo agentes"
  echo "    2) Básicas  — agentes + 11 skills de proceso"
  echo "    3) Completas — básicas + 30 skills de stack (lenguajes/frameworks)"
  printf 'Elige un paquete [1]: '
  read -r paquete || true
  case "${paquete:-1}" in
    2) PAQUETE="basicas" ;;
    3) PAQUETE="completas" ;;
    *) PAQUETE="agentes" ;;
  esac
}

aplicar_paquete() {  # $1 = dest agentes  $2 = dest skills
  copiar_agentes "$1"
  case "$PAQUETE" in
    basicas)   copiar_skills "$2" core ;;
    completas) copiar_skills "$2" ambas ;;
  esac
}

instalar_global() {
  elegir_paquete
  aplicar_paquete "$GLOBAL_AGENTS" "$GLOBAL_SKILLS"
  echo "      (nivel usuario: disponibles en todos tus proyectos)"
}

instalar_proyecto() {
  local ruta=""
  printf 'Ruta del proyecto (vacío = directorio actual): '
  read -r ruta || true
  ruta="${ruta:-$PWD}"
  if [ ! -d "$ruta" ]; then
    rojo "[error] La ruta no existe: $ruta"
    return 1
  fi
  elegir_paquete
  aplicar_paquete "$ruta/.github/agents" "$ruta/.github/skills"
  echo "      (solo ese proyecto; commitea .github/ para compartirlo con el equipo)"
  if [ -f "$GLOBAL_AGENTS/alfred.agent.md" ]; then
    amarillo "[aviso] También tienes los agentes a nivel usuario: en este proyecto saldrán duplicados."
    echo "        Desinstala el global (opción 3) o borra .github/agents/ de este proyecto."
  fi
  local resp=""
  printf '¿Copiar también las instrucciones globales a .github/instructions/? [s/N]: '
  read -r resp || true
  case "$resp" in
    s|S|si|sí)
      mkdir -p "$ruta/.github/instructions"
      cp "$SCRIPT_DIR/instructions/global-instructions.md.instructions.md" "$ruta/.github/instructions/"
      verde "[ok] Instrucciones copiadas a $ruta/.github/instructions/"
      ;;
  esac
}

desinstalar() {
  local opcion="" ruta=""
  printf 'Desinstalar de: 1) usuario (global)  2) un proyecto  [1]: '
  read -r opcion || true
  case "${opcion:-1}" in
    1)
      retirar_agentes "$GLOBAL_AGENTS"
      retirar_skills "$GLOBAL_SKILLS"
      ;;
    2)
      printf 'Ruta del proyecto: '
      read -r ruta || true
      if [ -z "$ruta" ] || [ ! -d "$ruta" ]; then
        rojo "[error] Ruta no válida."
        return 1
      fi
      retirar_agentes "$ruta/.github/agents"
      retirar_skills "$ruta/.github/skills"
      ;;
    *) rojo "[error] Opción no válida."; return 1 ;;
  esac
  echo "Recarga la ventana de VS Code para que desaparezcan del selector."
}

pasos_finales() {
  echo
  verde "Listo. Pasos finales:"
  echo "  1. Recarga VS Code: paleta (Mayús+Cmd+P) -> 'Developer: Reload Window'"
  echo "  2. Abre el Chat de Copilot y pulsa el selector de agente (abajo-izquierda del input)"
  echo "  3. Deben aparecer los agentes: $(echo $AGENTES | tr -s '[:space:]' ' ')"
}

# --- Verificar estructura del repo --------------------------------------------
if [ ! -f "$SCRIPT_DIR/plugin.json" ] || [ ! -d "$SCRIPT_DIR/agents" ]; then
  rojo "[error] Falta plugin.json o agents/. Ejecuta este script desde la raíz del repo."
  exit 1
fi

echo
verde "Alfred Dev for VS Code — instalador"
echo "-------------------------------------"

# --- Sin terminal interactiva (scripts/CI): instalación global directa ---------
if [ ! -t 0 ]; then
  instalar_global
  exit 0
fi

# --- Menú ----------------------------------------------------------------------
while true; do
  echo
  echo "  1) Instalar a nivel usuario (global — todos los proyectos)"
  echo "  2) Instalar en un proyecto concreto"
  echo "  3) Desinstalar (global o proyecto)"
  echo "  0) Salir"
  printf 'Elige una opción: '
  read -r opcion || exit 0
  case "$opcion" in
    1) instalar_global; pasos_finales; break ;;
    2) if instalar_proyecto; then pasos_finales; break; fi ;;
    3) desinstalar; break ;;
    0) exit 0 ;;
    *) amarillo "Opción no válida." ;;
  esac
done
