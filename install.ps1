# Alfred Dev for VS Code — instalador (Windows / PowerShell)
#
# Ejecuta .\install.ps1 y elige en el menú:
#   1) Global   -> copia los 12 agentes a ~\.copilot\agents\ (disponibles en TODOS los proyectos)
#   2) Proyecto -> copia los agentes (y opcionalmente las instrucciones) a .github\ de un proyecto
#   3) Desinstalar (global o proyecto)
#
# Alternativa sin descargar nada (repo publicado en GitHub):
#   Paleta de comandos -> "Chat: Install Plugin From Source" -> URL del repo

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$GlobalDest = "$env:USERPROFILE\.copilot\agents"

$Agentes = @("alfred","product-owner","selina","architect","junior-dev","senior-dev",
             "security-officer","qa-engineer","tech-writer","devops-engineer",
             "seo-specialist","lucius")

function Copy-Agentes($dest) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    $n = 0
    Get-ChildItem "$ScriptDir\agents\*.agent.md" | ForEach-Object {
        Copy-Item $_.FullName $dest -Force; $n++
    }
    Write-Host "[ok] $n agentes instalados en $dest" -ForegroundColor Green
}

function Remove-Agentes($dest) {
    $n = 0
    foreach ($a in $Agentes) {
        $target = Join-Path $dest "$a.agent.md"
        if (Test-Path $target) { Remove-Item $target; $n++ }
    }
    Write-Host "[ok] $n agentes retirados de $dest" -ForegroundColor Green
}

function Install-GlobalAlfred {
    Copy-Agentes $GlobalDest
    Write-Host "      (nivel usuario: disponibles en todos tus proyectos)"
}

function Install-ProyectoAlfred {
    $ruta = Read-Host "Ruta del proyecto (vacío = directorio actual)"
    if ([string]::IsNullOrWhiteSpace($ruta)) { $ruta = (Get-Location).Path }
    if (-not (Test-Path $ruta)) {
        Write-Host "[error] La ruta no existe: $ruta" -ForegroundColor Red
        return $false
    }
    Copy-Agentes "$ruta\.github\agents"
    Write-Host "      (solo ese proyecto; commitea .github\agents\ para compartirlo con el equipo)"
    if (Test-Path "$GlobalDest\alfred.agent.md") {
        Write-Host "[aviso] Tambien tienes los agentes a nivel usuario: en este proyecto saldran duplicados." -ForegroundColor Yellow
    }
    $resp = Read-Host "Copiar tambien las instrucciones globales a .github\instructions\? [s/N]"
    if ($resp -match '^[sS]') {
        New-Item -ItemType Directory -Path "$ruta\.github\instructions" -Force | Out-Null
        Copy-Item "$ScriptDir\instructions\global-instructions.md.instructions.md" "$ruta\.github\instructions\"
        Write-Host "[ok] Instrucciones copiadas a $ruta\.github\instructions\" -ForegroundColor Green
    }
    return $true
}

function Uninstall-AlfredDev {
    $opcion = Read-Host "Desinstalar de: 1) usuario (global)  2) un proyecto  [1]"
    if ([string]::IsNullOrWhiteSpace($opcion)) { $opcion = "1" }
    switch ($opcion) {
        "1" { Remove-Agentes $GlobalDest }
        "2" {
            $ruta = Read-Host "Ruta del proyecto"
            if (-not (Test-Path $ruta)) {
                Write-Host "[error] Ruta no valida." -ForegroundColor Red
                return
            }
            Remove-Agentes "$ruta\.github\agents"
        }
        default { Write-Host "[error] Opcion no valida." -ForegroundColor Red; return }
    }
    Write-Host "Recarga la ventana de VS Code para que desaparezcan del selector."
}

function Show-PasosFinales {
    Write-Host ""
    Write-Host "Listo. Pasos finales:" -ForegroundColor Green
    Write-Host "  1. Recarga VS Code: paleta (Ctrl+Shift+P) -> 'Developer: Reload Window'"
    Write-Host "  2. Abre el Chat de Copilot y pulsa el selector de agente (abajo-izquierda del input)"
    Write-Host "  3. Deben aparecer los agentes: $($Agentes -join ', ')"
}

# --- Verificar estructura del repo -------------------------------------------
if (-not ((Test-Path "$ScriptDir\plugin.json") -and (Test-Path "$ScriptDir\agents"))) {
    Write-Host "[error] Falta plugin.json o agents\. Ejecuta este script desde la raiz del repo." -ForegroundColor Red
    exit 1
}

Write-Host "Alfred Dev for VS Code — instalador" -ForegroundColor Green
Write-Host "------------------------------------"

:menu while ($true) {
    Write-Host ""
    Write-Host "  1) Instalar a nivel usuario (global — todos los proyectos)"
    Write-Host "  2) Instalar en un proyecto concreto"
    Write-Host "  3) Desinstalar (global o proyecto)"
    Write-Host "  0) Salir"
    $opcion = Read-Host "Elige una opcion"
    switch ($opcion) {
        "1" { Install-GlobalAlfred; Show-PasosFinales; break menu }
        "2" { $ok = Install-ProyectoAlfred; if ($ok) { Show-PasosFinales; break menu } }
        "3" { Uninstall-AlfredDev; break menu }
        "0" { break menu }
        default { Write-Host "Opcion no valida." -ForegroundColor Yellow }
    }
}

