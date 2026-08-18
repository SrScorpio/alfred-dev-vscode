---
name: threat-model
description: "Usar para modelar amenazas con metodología STRIDE. También: análisis de amenazas, STRIDE, superficie de ataque, vectores de ataque, modelado de amenazas."
---

# Modelado de amenazas STRIDE

Aplica STRIDE sobre la arquitectura **real** del repo. Destino:
`docs/project/threat-model.md` (o `plans/seguridad.md` si esa es la convención
del proyecto). Plantilla: la del proyecto, o
`~/.copilot/alfred-dev/templates/threat-model.md`, o `references/threat-model.md`
junto a esta skill.

## Proceso

1. **Componentes reales.** Aplicaciones, APIs, bases de datos, infra, roles y
   flujos de datos. Parte del código y de los diagramas existentes, no de una
   lista genérica.

2. **DFD en Mermaid** con límites de confianza. Las amenazas se concentran
   donde los datos cruzan un límite.

3. **STRIDE por componente:**

   | Categoría | Pregunta clave |
   |-----------|----------------|
   | **S**poofing | Cómo se verifica la identidad? |
   | **T**ampering | Cómo se garantiza la integridad? |
   | **R**epudiation | Hay auditoría fiable? |
   | **I**nformation Disclosure | Qué datos se exponen y a quién? |
   | **D**enial of Service | Qué recursos se pueden agotar? |
   | **E**levation of Privilege | Cómo se aplican los controles de acceso? |

4. **Riesgo:** probabilidad (alta/media/baja) × impacto (crítico/alto/medio/bajo).

5. **Mitigaciones concretas.** No «mejorar la seguridad». Sí: «rate limit de
   100 req/min en `/login`». Prioriza alto impacto / bajo esfuerzo.

6. Escribe el modelo en el destino canónico. Revisa el documento cuando cambie
   la arquitectura, se añada una integración o se despliegue en un entorno nuevo.

## Criterios de éxito

- Los componentes reales están evaluados contra las 6 categorías.
- Cada amenaza tiene mitigación accionable y está priorizada.
- El modelo vive en el repo, no solo en el chat.

## Qué NO hacer

- No modelar en abstracto.
- No omitir amenazas organizativas si hay datos sensibles (insiders, phishing).
- No dejar el documento estático para siempre.
- No registrar nada en MCP `alfred-memory`: el markdown es la fuente de verdad.
