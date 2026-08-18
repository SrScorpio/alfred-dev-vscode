# Alfred Dev for VS Code — instalador (Windows / PowerShell)
#
# Ejecuta .\install.ps1 y elige en el menú:
#   1) Global   -> todos los proyectos (~/.copilot/agents y ~/.copilot/skills)
#   2) Proyecto -> solo un repo (.github/agents y .github/skills)
#   3) Desinstalar
# Tras 1 o 2 elige el paquete: solo agentes / básicas (proceso) / completas (proceso + stack).
#
# Alternativa sin descargar nada (repo publicado en GitHub):
#   Paleta de comandos -> "Chat: Install Plugin From Source" -> URL del repo

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$GlobalAgents = "$env:USERPROFILE\.copilot\agents"
$GlobalSkills = "$env:USERPROFILE\.copilot\skills"
$script:Paquete = "agentes"

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

function Copy-Skills($dest, $modo) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    $n = 0
    $dirs = @()
    if ($modo -eq "core" -or $modo -eq "ambas") {
        $dirs += Get-ChildItem "$ScriptDir\skills\core" -Directory -ErrorAction SilentlyContinue
    }
    if ($modo -eq "stack" -or $modo -eq "ambas") {
        $dirs += Get-ChildItem "$ScriptDir\skills\stack" -Directory -ErrorAction SilentlyContinue
    }
    foreach ($d in $dirs) {
        $target = Join-Path $dest $d.Name
        if (Test-Path $target) { Remove-Item $target -Recurse -Force }
        Copy-Item $d.FullName $target -Recurse
        $n++
    }
    Write-Host "[ok] $n skills instaladas en $dest" -ForegroundColor Green
}

function Remove-Agentes($dest) {
    $n = 0
    foreach ($a in $Agentes) {
        $target = Join-Path $dest "$a.agent.md"
        if (Test-Path $target) { Remove-Item $target; $n++ }
    }
    Write-Host "[ok] $n agentes retirados de $dest" -ForegroundColor Green
}

function Remove-Skills($dest) {
    $n = 0
    if (-not (Test-Path $dest)) {
        Write-Host "[ok] 0 skills (no habia carpeta $dest)" -ForegroundColor Green
        return
    }
    $known = @()
    $known += Get-ChildItem "$ScriptDir\skills\core" -Directory -ErrorAction SilentlyContinue
    $known += Get-ChildItem "$ScriptDir\skills\stack" -Directory -ErrorAction SilentlyContinue
    foreach ($d in $known) {
        $target = Join-Path $dest $d.Name
        if (Test-Path $target) { Remove-Item $target -Recurse -Force; $n++ }
    }
    Write-Host "[ok] $n skills retiradas de $dest" -ForegroundColor Green
}

function Choose-Paquete {
    Write-Host ""
    Write-Host "  Paquete:"
    Write-Host "    1) Solo agentes"
    Write-Host "    2) Basicas  — agentes + 11 skills de proceso"
    Write-Host "    3) Completas — basicas + 30 skills de stack (lenguajes/frameworks)"
    $p = Read-Host "Elige un paquete [1]"
    if ([string]::IsNullOrWhiteSpace($p)) { $p = "1" }
    switch ($p) {
        "2" { $script:Paquete = "basicas" }
        "3" { $script:Paquete = "completas" }
        default { $script:Paquete = "agentes" }
    }
}

function Apply-Paquete($destAgents, $destSkills) {
    Copy-Agentes $destAgents
    switch ($script:Paquete) {
        "basicas"   { Copy-Skills $destSkills "core" }
        "completas" { Copy-Skills $destSkills "ambas" }
    }
}

function Install-GlobalAlfred {
    Choose-Paquete
    Apply-Paquete $GlobalAgents $GlobalSkills
    Write-Host "      (nivel usuario: disponibles en todos tus proyectos)"
}

function Install-ProyectoAlfred {
    $ruta = Read-Host "Ruta del proyecto (vacio = directorio actual)"
    if ([string]::IsNullOrWhiteSpace($ruta)) { $ruta = (Get-Location).Path }
    if (-not (Test-Path $ruta)) {
        Write-Host "[error] La ruta no existe: $ruta" -ForegroundColor Red
        return $false
    }
    Choose-Paquete
    Apply-Paquete "$ruta\.github\agents" "$ruta\.github\skills"
    Write-Host "      (solo ese proyecto; commitea .github\ para compartirlo con el equipo)"
    if (Test-Path "$GlobalAgents\alfred.agent.md") {
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
        "1" {
            Remove-Agentes $GlobalAgents
            Remove-Skills $GlobalSkills
        }
        "2" {
            $ruta = Read-Host "Ruta del proyecto"
            if (-not (Test-Path $ruta)) {
                Write-Host "[error] Ruta no valida." -ForegroundColor Red
                return
            }
            Remove-Agentes "$ruta\.github\agents"
            Remove-Skills "$ruta\.github\skills"
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

