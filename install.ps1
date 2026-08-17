# Alfred Dev for VS Code — instalador (Windows / PowerShell)
#
# Uso:
#   .\install.ps1             -> verifica prerequisitos y muestra instrucciones
#   .\install.ps1 -Local      -> registra este directorio como plugin local en
#                                chat.pluginLocations (con copia de seguridad)
#
# La instalación soportada es el sistema nativo de agent plugins de VS Code:
#   1. Paleta de comandos -> "Chat: Install Plugin From Source"
#   2. Introducir la URL de este repositorio Git

param(
    [switch]$Local
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "Alfred Dev for VS Code — instalador" -ForegroundColor Green
Write-Host "------------------------------------"
Write-Host ""

# --- 1. Verificar VS Code CLI -------------------------------------------------
$codeBin = Get-Command code -ErrorAction SilentlyContinue
if (-not $codeBin) {
    $codeBin = Get-Command code-insiders -ErrorAction SilentlyContinue
}

if ($codeBin) {
    Write-Host "[ok] VS Code CLI encontrado: $($codeBin.Source)" -ForegroundColor Green
} else {
    Write-Host "[aviso] CLI 'code' no encontrado en PATH." -ForegroundColor Yellow
    Write-Host "       Abre VS Code y ejecuta: Shell Command: Install 'code' command in PATH" -ForegroundColor Yellow
}

# --- 2. Verificar estructura del plugin --------------------------------------
if ((Test-Path "$ScriptDir\plugin.json") -and (Test-Path "$ScriptDir\agents")) {
    $agentes = (Get-ChildItem "$ScriptDir\agents\*.agent.md" -ErrorAction SilentlyContinue).Count
    Write-Host "[ok] plugin.json presente, $agentes agentes en agents\" -ForegroundColor Green
} else {
    Write-Host "[error] Falta plugin.json o agents\. Ejecuta este script desde la raiz del repo." -ForegroundColor Red
    exit 1
}

# --- 3. Modo -Local: registrar chat.pluginLocations ---------------------------
if ($Local) {
    $userSettings = "$env:APPDATA\Code\User\settings.json"

    if (-not (Test-Path $userSettings)) {
        Write-Host "[error] No se encontro settings.json en: $userSettings" -ForegroundColor Red
        exit 1
    }

    Copy-Item $userSettings "$userSettings.bak-alfred-dev"
    Write-Host "[backup] $userSettings.bak-alfred-dev" -ForegroundColor Yellow

    $settings = Get-Content $userSettings -Raw | ConvertFrom-Json

    if (-not $settings.'chat.pluginLocations') {
        $settings | Add-Member -MemberType NoteProperty -Name 'chat.pluginLocations' -Value (New-Object PSObject)
    }

    $pluginDir = $ScriptDir.Replace('\', '\\')
    Add-Member -InputObject $settings.'chat.pluginLocations' -MemberType NoteProperty -Name $ScriptDir -Value $true -Force

    $settings | ConvertTo-Json -Depth 10 | Set-Content $userSettings -Encoding UTF8
    Write-Host "[ok] chat.pluginLocations actualizado con: $ScriptDir" -ForegroundColor Green

    Write-Host ""
    Write-Host "Plugin local registrado. Reinicia VS Code (o recarga la ventana) y busca los agentes en el dropdown del chat." -ForegroundColor Green
    exit 0
}

# --- 4. Instrucciones ---------------------------------------------------------
Write-Host @"
Este repo es un agent plugin de VS Code (formato Copilot).

Instalacion recomendada (cualquier maquina con el repo publicado en Git):
  1. Paleta de comandos (Ctrl+Shift+P)
  2. "Chat: Install Plugin From Source"
  3. URL del repositorio Git de alfred-dev-vscode

Instalacion local de desarrollo (esta maquina):
  .\install.ps1 -Local
  -> registra este directorio en chat.pluginLocations (con backup de settings).

Instalacion para equipos:
  settings.json del usuario:
    "chat.plugins.marketplaces": ["<owner>/alfred-dev-vscode"]
  .github/copilot/settings.json del workspace:
    "extraKnownMarketplaces" + "enabledPlugins" (ver README)

Despues de instalar:
  - El dropdown de agentes del chat mostrara: alfred, product-owner, selina,
    architect, senior-dev, security-officer, qa-engineer, tech-writer,
    devops-engineer y lucius.
  - Para diagnosticar problemas: clic derecho en el chat -> Diagnostics.

Requisitos opcionales por agente:
  - lucius necesita Codex CLI: npm install -g `@openai/codex && codex login
  - Modelos Grok/GPT/GLM requieren sus extensiones de proveedor (ver README).
"@
