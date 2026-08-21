# ADR-002: Excepciones obligatorias de comunicación compacta

**Fecha:** 2026-08-19
**Estado:** Aceptado
**Autor:** architect

## Contexto

El modo muy compacto reduce actualizaciones de progreso, pero el PRD exige que no oculte bloqueos, riesgos, operaciones destructivas, confirmaciones ni evidencias de gates. Los flujos de Alfred, QA, seguridad y Lucius tienen obligaciones distintas que no deben degradarse al compactar la conversación.

## Opciones evaluadas

### Opción 1: Definir una lista explícita de excepciones obligatorias

La política global prohíbe narrar microacciones exitosas y exige comunicar inmediatamente bloqueos, decisiones, riesgos, confirmaciones, divergencias de integridad y resultados de gates. Cada excepción emite solo la evidencia mínima necesaria.

**Ventajas:**

- Conserva seguridad y control del usuario.
- Da un contrato verificable a QA.
- Evita que “muy compacto” se interprete como ocultar información relevante.

**Desventajas:**

- Requiere criterio del agente para distinguir un cambio relevante de una microacción.

### Opción 2: Silencio total hasta el informe final

No mostrar mensajes intermedios bajo ninguna circunstancia.

**Ventajas:**

- Máxima reducción de tokens de salida.

**Desventajas:**

- Oculta bloqueos y decisiones que requieren intervención.
- No permite solicitar confirmación antes de operaciones sensibles.
- Contradice los criterios de aceptación AC4, AC5 y AC10.

### Opción 3: Mantener el nivel de detalle actual y reducir solo las frases de personalidad

Evitar frases ornamentales sin cambiar el protocolo de progreso.

**Ventajas:**

- Riesgo mínimo de omitir información.

**Desventajas:**

- No reduce la principal fuente de mensajes: anuncios y microactualizaciones.
- No satisface las métricas del PRD.

## Decisión

Adoptar la opción 1. Las excepciones obligatorias son: bloqueo, decisión del usuario, riesgo de seguridad, operación destructiva, confirmación con coste, divergencia de integridad, resultado de una gate y entrega final.

## Justificación

La compacidad es una optimización de comunicación, no una relajación de controles. Estas excepciones cubren los puntos donde el usuario necesita decidir o donde el sistema debe demostrar evidencia para seguir avanzando.

## Consecuencias

### Positivas

- Se preservan los límites de seguridad y las gates.
- Los mensajes necesarios son accionables y breves.
- QA puede validar el comportamiento con criterios objetivos.

### Negativas

- Las tareas largas sin cambios relevantes pueden parecer silenciosas.
- La calidad de la clasificación de eventos depende de las instrucciones y del modelo.

## Referencias

- `docs/prd/compact-chat-progress.md`
- `agents/alfred.agent.md`
- `agents/qa-engineer.agent.md`
- `agents/lucius.agent.md`
