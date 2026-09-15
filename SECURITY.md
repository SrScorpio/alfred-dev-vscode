# Política de seguridad

Esta política es evidencia técnica del publicador. No es un dictamen
jurídico, no declara conformidad CRA, NIS2 ni RGPD, y no sustituye el
asesoramiento de un abogado.

## Alcance

Cubre los agentes, las skills, la extensión VSIX, los workflows del
repositorio, los scripts de instalación y las dependencias usadas durante
la compilación y el empaquetado.

No cubre forks, modificaciones locales, proveedores de modelos ajenos,
bridges de Copilot ni el tratamiento de datos que realicen Visual Studio
Marketplace, VS Code o GitHub Copilot.

## Comunicar una vulnerabilidad

Canal preferente: GitHub Security Advisories, si el informe privado está
habilitado:

<https://github.com/SrScorpio/alfred-dev-vscode/security/advisories/new>

La disponibilidad de ese canal depende de la configuración de GitHub y
puede no estar habilitada en todo momento.

Si el aviso privado no está disponible, contacte de forma privada con el
mantenedor desde su [perfil de GitHub](https://github.com/SrScorpio). No
publique secretos, credenciales, tokens, datos personales ni detalles
explotables en issues, discusiones u otros canales públicos.

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

Matriz vigente a 2026-09-15. El manifiesto `package.json` declara la
versión **0.7.0** y el motor **VS Code `^1.85.0`**. En esa fecha el
repositorio **no tiene GitHub Releases ni tags publicados**. Un enlace
genérico a Releases no demuestra soporte.

| Artefacto | Soporte | Host |
|-----------|---------|------|
| `0.7.0` (versión del manifiesto) | Única versión menor declarada; es la línea soportada | VS Code `^1.85.0` |
| Cuando exista un GitHub Release | La última versión menor publicada en Releases | VS Code `^1.85.0` |
| Versiones anteriores a esa menor | Sin soporte de seguridad | — |
| Pre-releases, commits intermedios, VSIX locales no publicados | Sin soporte formal | — |

Hasta que exista un Release, la línea soportada es el manifiesto `0.7.0`
en el commit publicado de `main`, no un binario de Marketplace.

## SLA de divulgación

Plazos **objetivo** del mantenedor, en días naturales salvo que se indique
lo contrario. No hay un SOC 24/7 ni un equipo de guardia. El reloj empieza
cuando el mantenedor tiene acceso efectivo al informe por el canal privado
(Security Advisory o perfil). Si el canal está cerrado, el informe llega
fuera de días laborables en Europe/Madrid, o el mantenedor no está
disponible, el reloj se reanuda el siguiente día laborable en que el
informe sea accesible.

| Hito | Plazo objetivo | Qué incluye |
|------|----------------|-------------|
| Acuse de recibo | 24 horas | Confirmación de que el informe ha llegado y un identificador de seguimiento. No es un parche. |
| Análisis inicial | 72 horas tras el acuse | Clasificación de severidad, componente afectado y si se reproduce. |
| Corrección o mitigación publicada | Según severidad, tras el análisis inicial | Parche, mitigación pública o riesgo documentado. |

Plazos de corrección o mitigación **publicada** (repositorio, Security
Advisory o, si existe, Release):

| Severidad | Objetivo | Si no hay parche a tiempo |
|-----------|----------|---------------------------|
| Crítica | 7 días | Mitigación pública o aviso de no usar el componente afectado |
| Alta | 14 días | Igual |
| Media | 30 días o la siguiente versión menor | Documentar el residual |
| Baja / informativa | Siguiente versión menor | Puede quedar como residual aceptado |

Estos plazos no prometen un VSIX en Marketplace ni un Release si aún no
existe canal de publicación. La evidencia de publicación, mientras no haya
Release, es el commit en `main` y, cuando proceda, el Security Advisory.

## Protocolo de incidentes (NIS2 art. 23)

Alineación de relojes con el artículo 23 de la Directiva (UE) 2022/2555
para incidentes de seguridad **significativos** del producto o del
repositorio. **No clasifica** al titular como entidad esencial, importante
ni proveedor sujeto a NIS2. Si esa clasificación aplica, la notificación
a CSIRT o autoridad competente es obligación del titular, no un envío
automático desde este repositorio.

| Fase | Plazo desde el conocimiento efectivo | Contenido mínimo |
|------|--------------------------------------|------------------|
| Alerta temprana | 24 horas | Naturaleza del incidente, si hay explotación activa, y canal de seguimiento. |
| Notificación | 72 horas | Evaluación inicial, impacto conocido o estimado, y medidas ya tomadas. |
| Informe final | 1 mes | Causa, impacto, mitigación y acciones preventivas. |

El postmortem interno se archiva en
[`docs/project/incidents/`](docs/project/incidents/README.md) con el
nombre `YYYY-MM-DD-<slug>.md`. No se inventan incidentes: la carpeta
puede estar vacía de casos reales.

Destinatarios de la comunicación **pública o coordinada** de este
proyecto: GitHub Security Advisories y, cuando el aviso ya no sea
explotable, el repositorio. No se notifica a ENISA ni a un CSIRT desde
este documento.

## Actualizaciones de seguridad

El publicador se compromete a publicar correcciones o mitigaciones de la
línea soportada según la tabla de severidad. El canal de actualización
es el repositorio GitHub y, cuando existan, sus Releases.

No hay evidencia de distribución en Visual Studio Marketplace a
2026-09-15. **No se garantiza** que una corrección llegue al Marketplace
mientras no exista un GitHub Release del VSIX.

## Qué no se garantiza

- Asesoramiento legal ni declaración de conformidad CRA, NIS2 o RGPD.
- Soporte de forks, copias, parches locales o modificaciones que alteren
  el comportamiento del proyecto.
- Bridges de modelos, proveedores de Copilot o extensiones de terceros.
- Actualización en Marketplace si no hay Release publicado.
- Respuesta 24/7, tiempos de parche inferiores a los de la tabla, o que
  el formulario de Security Advisories esté siempre habilitado.
- Cobertura de GitHub Advanced Security / CodeQL como proceso completo
  de este publicador.

Esta política no garantiza soporte técnico general fuera de los informes
de seguridad descritos aquí.
