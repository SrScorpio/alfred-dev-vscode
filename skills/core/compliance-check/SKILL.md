---
name: compliance-check
description: "Usar para verificar cumplimiento RGPD, NIS2 y CRA. También: verificar RGPD, cumplimiento normativo, NIS2, CRA, Cyber Resilience Act, protección de datos, regulación europea."
---

# Verificación de cumplimiento normativo

Evaluación **técnica** (no dictamen jurídico) contra RGPD, NIS2 y CRA.
Destino: `docs/project/compliance.md` (o `plans/seguridad.md` si el proyecto
ya concentra compliance ahí). Plantilla: la del proyecto, o
`~/.copilot/alfred-dev/templates/compliance.md`, o `references/compliance.md`
junto a esta skill.

## Proceso

1. **Qué aplica.** No todos los proyectos están sujetos a las tres:

   - **RGPD:** trata datos personales de personas en la UE.
   - **NIS2:** sector crítico o proveedor de servicios digitales.
   - **CRA:** producto con elementos digitales comercializado en la UE
     (incluye OSS con uso comercial).

2. **Checklist RGPD:** base jurídica, minimización, DPIA si alto riesgo,
   registro de actividades, acceso/rectificación/olvido/portabilidad,
   notificación de brechas en 72 h, cifrado en tránsito y reposo, DPO si aplica.

3. **Checklist NIS2:** gestión de riesgos, política de seguridad, alerta 24 h /
   informe 72 h, cadena de suministro, gobernanza, continuidad, formación,
   vulnerabilidades, MFA en accesos críticos.

4. **Checklist CRA:** SBOM, actualizaciones de seguridad en el ciclo de vida,
   secure by default, documentación técnica, proceso de reporte de
   vulnerabilidades, notificación a ENISA en 24 h si hay explotación activa,
   evaluación de conformidad.

5. **Escribe el registro.** Para cada control: estado (`cumple` / `parcial` /
   `pendiente` / `no aplica` / `riesgo aceptado`), evidencia (ruta de código,
   test o config) y acciones. Sin evidencia no marques `cumple`.

Referencias: RGPD 2016/679, NIS2 2022/2555, CRA 2024/2847. Comprueba si hay
actualizaciones posteriores antes de dar la evaluación por válida.

## Criterios de éxito

- Normativas aplicables identificadas (y las que no, con motivo).
- Cada control con estado y evidencia.
- Acciones priorizadas por riesgo.

## Qué NO hacer

- No sustituir asesoría legal.
- No marcar cumplido sin evidencia verificable.
- No ignorar el CRA por ser OSS: aplica si hay uso comercial.
- No usar helpers de Claude ni MCP de memoria.
