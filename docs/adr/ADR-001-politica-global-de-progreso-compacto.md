# ADR-001: Política global de progreso compacto

**Fecha:** 2026-08-19
**Estado:** Aceptado
**Autor:** architect

## Contexto

El PRD aprobado `docs/prd/compact-chat-progress.md` exige reducir la narración durante el trabajo de los agentes sin perder bloqueos, decisiones, evidencias ni quality gates. Los doce agentes comparten instrucciones globales y cada uno tiene reglas propias de activación, lo que genera mensajes redundantes entre handoffs.

## Opciones evaluadas

### Opción 1: Política común en las instrucciones globales con excepciones locales mínimas

Definir la semántica de progreso compacto en `instructions/global-instructions.md.instructions.md`. Los agentes solo mantienen reglas locales cuando un flujo tiene una excepción real, como la confirmación previa de Lucius o el cierre de fase de Alfred.

**Ventajas:**

- Una fuente de verdad para todos los agentes.
- Reduce duplicación y divergencias entre roles.
- No modifica el runtime, los handoffs ni los permisos.
- Permite adaptar solo los casos que tienen un contrato distinto.

**Desventajas:**

- La aplicación depende de que VS Code cargue las instrucciones globales.
- Requiere revisar los agentes con reglas locales que contradigan la política.

### Opción 2: Duplicar una política completa en los doce agentes

Añadir el mismo bloque de progreso compacto a cada archivo `.agent.md`.

**Ventajas:**

- Cada agente es autosuficiente si se instala de forma aislada.

**Desventajas:**

- Duplica texto y aumenta el coste de mantenimiento.
- Es fácil que un agente se quede desactualizado.
- Contradice la regla del proyecto de una única fuente de verdad por concepto.

### Opción 3: Implementar un controlador en la extensión VSIX

Cambiar `src/` para interceptar, filtrar o resumir mensajes de los agentes en tiempo de ejecución.

**Ventajas:**

- Podría aplicar límites mecánicos al contenido mostrado.

**Desventajas:**

- Los mensajes de los agentes no están controlados por el runtime actual de la extensión.
- Añade complejidad, superficie de fallo y mantenimiento para un problema de instrucciones.
- No cumple el filtro de sobreingeniería del proyecto.

## Decisión

Adoptar la opción 1: una política global declarativa para el progreso compacto, reforzada únicamente con adaptaciones locales donde exista un contrato de seguridad, coste o gate.

## Justificación

La política pertenece a todos los agentes y no a un rol concreto. La instrucción global ya se aplica a `**`, por lo que es el punto de control más pequeño y consistente. Un filtro de runtime no puede garantizar el comportamiento de proveedores externos y sería una capa de abstracción innecesaria.

## Consecuencias

### Positivas

- Menos mensajes y tokens durante ejecución.
- Comportamiento uniforme en handoffs.
- Menor mantenimiento que duplicar reglas por agente.
- Sin cambios de dependencias ni de código TypeScript.

### Negativas

- Los agentes instalados sin las instrucciones globales no reciben esta política.
- Las excepciones locales deben auditarse para evitar que reintroduzcan narración innecesaria.

## Referencias

- `docs/prd/compact-chat-progress.md`
- `instructions/global-instructions.md.instructions.md`
