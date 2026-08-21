# Política de seguridad

## Alcance

Esta política cubre los agentes, las skills, la extensión VSIX, los workflows
del repositorio, los scripts de instalación y las dependencias usadas durante
la compilación y el empaquetado.

## Comunicar una vulnerabilidad

Se recomienda usar GitHub Security Advisories o el mecanismo de informe privado
de vulnerabilidades de este repositorio, si está habilitado:
<https://github.com/SrScorpio/alfred-dev-vscode/security/advisories/new>.
La disponibilidad de ese canal privado depende de la configuración de GitHub y
puede no estar habilitada en todo momento.

Cuando ese mecanismo no esté disponible, contacte de forma privada con el
mantenedor desde su [perfil de GitHub](https://github.com/SrScorpio) o mediante
el repositorio. No publique secretos, credenciales, tokens, datos personales ni
detalles explotables en issues, discusiones u otros canales públicos.

Incluya, como mínimo:

- El componente afectado: agente, skill, extensión, workflow, instalador o
	dependencia.
- La versión afectada o el commit concreto.
- El impacto observado o esperado.
- Los pasos mínimos para reproducirlo.
- El sistema operativo, la versión de VS Code y las dependencias relevantes.
- Logs o evidencias depurados de credenciales y otros datos sensibles.
- Una forma segura de contactar con usted para las preguntas de seguimiento.

## Versiones soportadas

Consulte el último release o tag publicado en el
[repositorio](https://github.com/SrScorpio/alfred-dev-vscode/releases). No hay
una matriz formal de versiones soportadas ni una política de soporte aprobada
por el mantenedor en este momento. La extensión declara compatibilidad con
VS Code `^1.85.0`; no se ofrece soporte formal para versiones fuera de ese
rango, para proveedores externos o bridges de modelos, ni para forks o
modificaciones locales que cambien el comportamiento del proyecto.

## Proceso de divulgación

El mantenedor evaluará los informes recibidos y podrá coordinar la divulgación
con la persona informante. No se garantizan acuse de recibo, plazos de análisis,
corrección ni publicación hasta que exista un SLA aprobado. Cuando haya un
parche disponible, las actualizaciones públicas se comunicarán a través del
repositorio o de sus releases.

Esta política no garantiza respuesta, soporte técnico ni asesoramiento legal.