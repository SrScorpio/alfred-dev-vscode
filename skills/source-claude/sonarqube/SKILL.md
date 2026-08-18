---
name: sonarqube
description: "Levantar SonarQube con Docker (flujo /alfred audit de Claude Code). Fuente — no instalable en VS Code."
disable-model-invocation: true
---

# Análisis de calidad con SonarQube (fuente — no instalable)

El original levanta `sonarqube-alfred` en Docker, espera `/api/system/status`
y corre el scanner. Encaja en el runtime de Claude (`/alfred audit`), no en
el menú de este port.

Si hace falta análisis estático en un proyecto concreto, que `qa-engineer`
use el linter/CI del repo. No copiar esta skill a `~/.copilot/skills/`.
