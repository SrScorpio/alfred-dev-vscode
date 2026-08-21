# PRD: Mensajes de chat muy compactos

**Estado:** Aprobado por el usuario; implementado
**Fecha:** 2026-08-19
**Propietario:** Alfred Dev
**Gate:** implementación publicada en `5cdb5a1`; siguiente fase: entrega

## Problema

Las personas que usan Alfred Dev reciben demasiados mensajes mientras los agentes trabajan: anuncian búsquedas, lecturas, comandos, microdecisiones y pasos internos que no requieren intervención. Ese ruido aumenta el consumo de tokens, dificulta distinguir bloqueos reales y hace más lenta la revisión del estado del trabajo.

El usuario necesita visibilidad sobre cambios relevantes sin recibir una narración continua de la actividad interna de los agentes.

## Contexto

Alfred Dev coordina varios agentes y modelos mediante handoffs. Los agentes tienen instrucciones de anunciar su activación, explicar la fase y comunicar avances. En la práctica, esas reglas se combinan con mensajes de progreso del entorno y generan repeticiones entre agentes, especialmente cuando una tarea pasa de un agente a otro.

La necesidad expresada es una política común de comunicación durante el trabajo, aplicable a Alfred y al resto de agentes, que reduzca el coste conversacional sin ocultar información necesaria para tomar decisiones o superar gates.

La decisión de producto acordada para esta iteración es el nivel **B: muy compacto**.

## Solución propuesta

Establecer un modo de comunicación muy compacto para el trabajo en curso:

- Emitir como máximo una línea de estado cuando exista un cambio relevante que el usuario deba conocer.
- No enviar actualizaciones intermedias sobre búsquedas, lecturas, comandos, inspecciones o microacciones internas.
- Interrumpir el silencio únicamente ante un bloqueo, una decisión necesaria, un error relevante, un riesgo o una operación que requiera confirmación.
- Entregar al final un resumen completo con resultado, evidencias, cambios, bloqueos y siguiente acción.
- Mantener el detalle exigido por los informes de calidad, seguridad, gates y auditorías en su entrega final, sin repetirlo antes como mensajes de progreso.

La política debe aplicarse de forma coherente a Alfred y a los agentes que participan en sus flujos. Los informes finales y las preguntas necesarias no se consideran mensajes de progreso y mantienen sus formatos propios.

## Usuarios y necesidades

### Historia 1: trabajo silencioso durante la ejecución

Como desarrollador que supervisa un flujo de Alfred,
quiero que los agentes omitan la narración de sus pasos internos,
para reducir el consumo de tokens y poder concentrarme en decisiones y resultados.

### Historia 2: estado relevante en una línea

Como desarrollador que espera una tarea larga,
quiero recibir una línea solo cuando cambie el estado del trabajo,
para saber si el flujo sigue activo sin leer mensajes repetidos.

### Historia 3: bloqueo accionable

Como responsable del proyecto,
quiero que un agente interrumpa el modo compacto cuando exista un bloqueo o una decisión pendiente,
para poder desbloquear el trabajo a tiempo.

### Historia 4: resultado final verificable

Como responsable de una entrega,
quiero recibir un resumen final con resultado, evidencias, gate y siguiente acción,
para evaluar el estado sin reconstruirlo a partir de mensajes intermedios.

### Historia 5: consistencia entre agentes

Como usuario que recibe handoffs entre agentes,
quiero que todos respeten la misma política de comunicación,
para que el cambio de agente no multiplique anuncios ni repita el contexto.

## Criterios de aceptación

### AC1. No hay narración de microacciones

**Given** un agente ejecutando búsquedas, lecturas, comandos o comprobaciones internas sin incidencias,
**When** esas acciones terminan correctamente,
**Then** el agente no envía un mensaje de progreso por cada acción.

### AC2. Estado compacto

**Given** una tarea en curso sin bloqueo ni decisión pendiente,
**When** el estado cambia de forma relevante,
**Then** el agente comunica como máximo una línea de estado con el cambio y la siguiente acción.

### AC3. Sin anuncios repetidos

**Given** un handoff entre dos agentes,
**When** el segundo agente recibe contexto ya conocido,
**Then** no repite el historial completo, el plan ni los artefactos salvo que exista una contradicción o falte información necesaria.

### AC4. Bloqueo inmediato

**Given** un error, bloqueo, riesgo de seguridad, operación destructiva o divergencia que requiera intervención,
**When** el agente lo detecta,
**Then** lo comunica inmediatamente con el impacto y la decisión concreta que necesita del usuario.

### AC5. Pregunta de decisión

**Given** que el agente no puede continuar sin una decisión del usuario,
**When** formula la pregunta,
**Then** presenta una única pregunta clara con las opciones necesarias y no continúa ejecutando trabajo dependiente de esa respuesta.

### AC6. Resultado final completo

**Given** que la tarea o fase termina,
**When** el agente entrega el resultado,
**Then** incluye el estado final, evidencias relevantes, cambios o artefactos producidos, bloqueos restantes y siguiente acción.

### AC7. Gates sin pérdida de rigor

**Given** una fase con una gate de calidad, seguridad, producto o entrega,
**When** se evalúa la gate,
**Then** el veredicto mantiene su formato y la evidencia necesaria, aunque no se hayan enviado actualizaciones intermedias.

### AC8. Aplicación transversal

**Given** que Alfred delega trabajo en otro agente,
**When** el agente delegado comienza y termina su tarea,
**Then** respeta la misma política de progreso compacto y no añade anuncios redundantes.

### AC9. Tareas breves

**Given** una tarea que puede completarse en una interacción breve,
**When** no hay bloqueo ni decisión pendiente,
**Then** el agente omite el mensaje de progreso y entrega directamente el resultado final.

### AC10. Excepción de operaciones sensibles

**Given** una operación que pueda romper datos, código, entorno o integridad del repositorio,
**When** se requiere confirmación o se detecta una divergencia,
**Then** el agente comunica una advertencia breve antes de continuar o detiene el flujo hasta recibir confirmación.

## Métricas de éxito

- Reducir en un **60 %** el número mediano de mensajes enviados antes del resultado final en tareas comparables.
- Reducir en un **30 %** el número mediano de tokens de salida durante la ejecución, sin contar el informe final.
- Conseguir que al menos el **90 %** de los mensajes previos al resultado final sean bloqueos, decisiones, cambios de estado o advertencias relevantes.
- Mantener en el **100 %** de las ejecuciones auditadas la presencia del resultado final y de la siguiente acción.
- Mantener en el **100 %** de las gates auditadas el formato de veredicto y sus evidencias obligatorias.
- No introducir aumentos detectables de tareas bloqueadas por falta de información de estado.

## Fuera de alcance

- Cambiar la selección, capacidad o coste de los modelos.
- Modificar la lógica de handoffs, el enrutado de agentes o las quality gates.
- Eliminar informes finales, evidencias, criterios de aceptación o hallazgos de seguridad.
- Ocultar errores, bloqueos, riesgos o solicitudes de confirmación.
- Crear un sistema de métricas remoto o telemetría de conversaciones.
- Añadir un selector de modos visible para el usuario en esta iteración.
- Rediseñar las personalidades, responsabilidades o permisos de los agentes.

## Riesgos y dependencias

- **Riesgo:** una política demasiado silenciosa puede hacer parecer detenido un proceso largo. Mitigación: emitir una línea ante cambios relevantes y conservar el resultado final completo.
- **Riesgo:** un agente puede interpretar “muy compacto” como omitir una gate o evidencia. Mitigación: declarar explícitamente que los contratos de gates e informes tienen prioridad.
- **Riesgo:** distintos agentes pueden aplicar criterios diferentes sobre qué es relevante. Mitigación: usar una política común y ejemplos uniformes de estado, bloqueo, decisión y resultado.
- **Dependencia:** las instrucciones globales deben cargarse en los entornos donde se instalan los agentes.
- **Dependencia:** los handoffs deben conservar el contexto suficiente para evitar que el agente delegado vuelva a preguntar o repetir el diagnóstico.
- **Riesgo:** los mensajes producidos por la plataforma de VS Code o por los proveedores de modelos pueden quedar fuera del control de las instrucciones de Alfred Dev.

## Criterio de finalización del producto

La feature estará lista cuando la política de comunicación compacta esté documentada como fuente única, los agentes respeten las excepciones de bloqueo y gate, y una revisión de QA confirme mediante tareas representativas que se redujo la narración intermedia sin perder resultados, evidencias ni decisiones necesarias.

## Decisiones pendientes

Ninguna. El nivel de concisión está fijado en **B: muy compacto**.

## Aprobación

El usuario aprobó explícitamente este PRD el 2026-08-19. La aprobación cubre el
alcance, las historias, los criterios de aceptación, las métricas y las
excepciones definidas en este documento.
