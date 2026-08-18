---
name: incident-response
description: "Usar ante un incidente en producción: triaje, mitigación, causa raíz y postmortem. También: caída, error crítico, brecha, degradación de servicio, RCA."
---

# Respuesta ante incidentes

Protocolo rápido y ordenado. Documenta cada paso. No saltes al código sin
triaje. Artefacto final: `docs/project/incidents/YYYY-MM-DD-<slug>.md`.

## Proceso

### 1. Triaje

- Severidad: P0 crítico, P1 alto, P2 medio, P3 bajo.
- Impacto: usuarios, funcionalidad, datos.
- Evidencia: logs, trazas, errores.
- Workaround inmediato: sí/no.

### 2. Mitigación (P0/P1)

- Workaround (rollback, feature flag, redirigir tráfico) antes que hotfix.
- Si hace falta código: cambio mínimo + test que reproduzca el fallo.
- Verificar que el impacto baja. No investigues la causa raíz todavía.

### 3. Causa raíz

- Cadena de eventos del trigger al fallo.
- Causa, no síntoma.
- Si hay componente de seguridad, involucra a `security-officer`.

### 4. Postmortem

Incluye: fecha, severidad, duración, impacto, cronología, causa raíz,
acciones correctivas con responsable y fecha, acciones preventivas, lecciones.

## Qué NO hacer

- No desplegar hotfix sin test que reproduzca el incidente.
- No buscar culpables en el postmortem.
- No dejar las acciones correctivas sin dueño ni fecha.
- No usar la herramienta Agent de Claude ni MCP de memoria.
