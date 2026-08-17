---
applyTo: '**'
description: 'Reglas globales de desarrollo. Cargar siempre: estilo, seguridad, rendimiento, estructura y estándares de código.'
---
# Reglas de Desarrollo Globales

## Comunicación
- Responder en español. Código, nombres de archivos, variables, funciones, commit messages y commit descriptions en inglés.
- Respuestas directas y densas: ir al grano, cero relleno.
- Si hay un error o ambigüedad, explicarlo antes de asumir.
- Preferir ejemplo concreto sobre explicación teórica.

## Documentación y Estructura (Anti-Bloat)
- ZERO documentación redundante: un solo source of truth por concepto.
- Si un documento existe y cubre el tema, NO crear otro que repita lo mismo.
- Nombres de archivos y funciones descriptivos que se auto-documenten.
- Comentarios solo para el PORQUÉ, nunca para el QUÉ (el código lo explica).
- NO crear README, CHANGELOG, CONTRIBUTING ni archivos de proceso salvo que se pida explícitamente. Excepción: proyectos WordPress requieren readme.txt (ver sección PHP/WordPress).
- File and folder names must be lowercase and use hyphens.
- Assets (images, scripts, styles) must be placed in separate, well-organized folders.

## Estilo de Trabajo
- Planes completos pero precisos: orientados a implementación real, no mock ni placeholders.
- NO sobredimensionar: arquitectura simple para el scope actual, extensible después.
- NO over-engineering: no crear capas de abstracción, patrones ni infraestructura que no se necesitan ahora.
- Priorizar test local funcional antes de depender de despliegues cloud.
- Entender el contexto completo antes de proponer solución.
- Si hay varias opciones, presentar pros/contras breves y dar recomendación.
- Explicar el PORQUÉ de las decisiones técnicas, no solo el CÓMO.
- Ante errores, investigar causa raíz antes de parchear síntomas.

## Tecnología
- Priorizar tecnologías empresariales, estables y bien testeadas (LTS, maduras).
- Evitar novedades beta/RC o librerías con <1 año de vida estable salvo justificación clara.
- Elegir la opción más simple que resuelva el problema. Menos dependencias = mejor.

## Calidad de Código
- Funciones pequeñas con responsabilidad única. Si tiene >30 líneas, probablemente necesita dividirse.
- Manejo de errores explícito: no silenciar excepciones, mensajes claros.
- Type hints/annotations donde el lenguaje lo soporte.
- NO hardcoded secrets, API keys, ni credenciales. Variables de entorno siempre.
- Priorizar conciseness, simplicity, scalability en código y lógica.
- All code must be reviewed before merging into the main branch.
- Always follow Test-Driven Development (TDD): write tests before implementing features or fixing bugs.

## Seguridad
- Input sanitization en todo punto de entrada (API endpoints, forms, CLI args).
- Parametrized queries SIEMPRE, nunca string interpolation en SQL.
- Principio de mínimo privilegio en permisos y access tokens.
- Dependencias actualizadas, revisar CVEs antes de añadir nuevas.
- Always include a .gitignore file and exclude macOS system files like .DS_Store.

## Rendimiento y Optimización
- Elegir la estructura de datos correcta para cada caso (no List para lookups, usar Map/Set).
- Evitar loops anidados O(n²) cuando existe alternativa O(n) o O(n log n).
- Async/no-blocking para I/O. No bloquear el hilo principal.
- Lazy loading y caching donde aporte valor medible.
- No optimizar prematuramente, pero tampoco escribir código ineficiente sabiéndolo.

## Control y Transparencia
- Siempre explicar QUÉ se va a cambiar y POR QUÉ antes de editar archivos.
- Mostrar rutas completas de archivos modificados.
- Si algo no se puede hacer, decirlo directamente y explicar por qué.

## Proyectos PHP/WordPress
- Seguir los estándares de código de WordPress para PHP, JS y Python. Comentarios y documentación de código en inglés según requiera la plataforma.
- Incluir readme.txt con metadatos del plugin (reemplaza al README genérico en este contexto).
- Crear archivo .distignore.
- Crear scripts build.ps1 y build.sh.
- El .gitignore NO debe excluir .distignore, build.ps1 ni build.sh.
