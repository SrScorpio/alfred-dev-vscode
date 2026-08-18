# Alfred Dev for VS Code — instalador (Windows / PowerShell)
#
# Uso:
#   .\install.ps1             -> copia los 12 agentes a ~\.copilot\agents\ (nivel usuario:
#                                disponibles en TODOS los proyectos, sin mas configuracion)
#   .\install.ps1 -Plugin     -> ademas registra este directorio como plugin local
#                                (chat.pluginLocations, con copia de settings)
#   .\install.ps1 -Uninstall  -> retira los agentes de ~\.copilot\agents\
#
# Alternativa sin descargar nada (repo publicado en GitHub):
#   Paleta de comandos -> "Chat: Install Plugin From Source" -> URL del repo

param(
    [switch]$Plugin,
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Dest = "$env:USERPROFILE\.copilot\agents"

Write-Host "Alfred Dev for VS Code — instalador" -ForegroundColor Green
Write-Host "------------------------------------"

# --- Verificar estructura del repo -------------------------------------------
if (-not ((Test-Path "$ScriptDir\plugin.json") -and (Test-Path "$ScriptDir\agents"))) {
    Write-Host "[error] Falta plugin.json o agents\. Ejecuta este script desde la raiz del repo." -ForegroundColor Red
    exit 1
}

# --- Desinstalacion -----------------------------------------------------------
if ($Uninstall) {
    $n = 0
    Get-ChildItem "$ScriptDir\agents\*.agent.md" | ForEach-Object {
        $target = Join-Path $Dest $_.Name
        if (Test-Path $target) { Remove-Item $target; $n++ }
    }
    Write-Host "[ok] $n agentes retirados de $Dest" -ForegroundColor Green
    Write-Host "Recarga la ventana de VS Code para que desaparezcan del selector."
    exit 0
}

# --- 1. Copiar agentes a la carpeta oficial de usuario de Copilot -------------
New-Item -ItemType Directory -Path $Dest -Force | Out-Null
$n = 0
Get-ChildItem "$ScriptDir\agents\*.agent.md" | ForEach-Object {
    Copy-Item $_.FullName $Dest -Force
    $n++
}
Write-Host "[ok] $n agentes instalados en $Dest" -ForegroundColor Green
Write-Host "      (nivel usuario: disponibles en todos tus proyectos)"

# --- 2. Registro opcional como plugin local ------------------------------------
if ($Plugin) {
    $userSettings = "$env:APPDATA\Code\User\settings.json"
    if (Test-Path $userSettings) {
        Copy-Item $userSettings "$userSettings.bak-alfred-dev"
        $raw = Get-Content $userSettings -Raw
        $settings = if ($raw.Trim()) { $raw | ConvertFrom-Json } else { New-Object PSObject }
        if (-not $settings.'chat.pluginLocations') {
            $settings | Add-Member -MemberType NoteProperty -Name 'chat.pluginLocations' -Value (New-Object PSObject)
        }
        Add-Member -InputObject $settings.'chat.pluginLocations' -MemberType NoteProperty -Name $ScriptDir -Value $true -Force
        $settings | ConvertTo-Json -Depth 10 | Set-Content $userSettings -Encoding UTF8
        Write-Host "[ok] Plugin local registrado en chat.pluginLocations (backup: settings.json.bak-alfred-dev)" -ForegroundColor Green
    } else {
        Write-Host "[aviso] No se encontro settings.json ($userSettings); se omite el registro del plugin." -ForegroundColor Yellow
    }
}

# --- 3. Pasos finales ----------------------------------------------------------
Write-Host ""
Write-Host "Listo. Pasos finales:" -ForegroundColor Green
Write-Host "  1. Recarga VS Code: paleta (Ctrl+Shift+P) -> 'Developer: Reload Window'"
Write-Host "  2. Abre el Chat de Copilot y pulsa el selector de agente (abajo-izquierda del input)"
Write-Host "  3. Deben aparecer los 12 agentes: alfred, product-owner, selina, architect,"
Write-Host "     junior-dev, senior-dev, security-officer, qa-engineer, tech-writer,"
Write-Host "     devops-engineer, seo-specialist y lucius"
Write-Host ""
Write-Host "Instrucciones globales (opcional, por proyecto):"
Write-Host "  copy instructions\global-instructions.md.instructions.md <tu-proyecto>\.github\instructions\"
Write-Host ""
Write-Host "Desinstalar:  .\install.ps1 -Uninstall"
