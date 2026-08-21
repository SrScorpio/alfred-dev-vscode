# Contribuir

Gracias por mejorar Alfred Dev para VS Code. Las contribuciones deben ser
pequeñas, verificables y coherentes con el catálogo de agentes, skills y la
extensión nativa.

## Tipos de cambio

- Agentes: cambios en `agents/` y sus contratos de activación.
- Skills: cambios en `skills/core/` o `skills/stack/`, incluida su
  documentación y referencias.
- Configuración: cambios en `instructions/` y `templates/`.
- Extensión: cambios en `src/`, `package.json` o los contratos de `tests/`.
- Documentación: cambios en `README.md`, `docs/`, `CHANGELOG.md` o esta guía.
- Automatización: cambios en `.github/workflows/` y scripts de instalación.

Explica en la descripción del PR el alcance y evita mezclar cambios de
producto con una reorganización documental sin relación.

## Rama y cambios locales

No trabajes directamente sobre `main`. Actualiza la referencia remota y crea
una rama propia. Para una historia existente usa `feat/issue-N-slug`; para
una corrección usa `fix/slug`:

```bash
git fetch origin
git switch -c feat/issue-N-slug origin/main
```

Conserva los cambios locales que no pertenezcan a tu tarea y no uses comandos
destructivos para descartarlos.

## Pull request

- Incluye un título que describa el cambio.
- Relaciona la pull request con la issue mediante `Closes #N` cuando el
  cambio complete una issue.
- Explica qué cambia, cómo se ha verificado y qué riesgos quedan.
- Mantén la pull request enfocada y deja que las revisiones sean trazables.
- No fusiones tu propia pull request ni publiques directamente en `main`.

Las pull requests ejecutan la CI del repositorio. Una CI roja bloquea la
entrega hasta entender y corregir la causa o documentar por qué es ajena al
cambio.

## Verificación

Antes de abrir la pull request, ejecuta los checks aplicables al cambio:

```bash
npm ci
npm test
npm run compile
```

Para validar el empaquetado de la extensión, añade `npm run package`. Para
cambios documentales, comprueba también los enlaces relativos y ejecuta
`git diff --check`.

Los cambios de lógica o de contratos requieren tests. Los cambios de
instrucciones, agentes, skills o flujos deben actualizar la documentación
correspondiente. La revisión de QA y la revisión de seguridad se solicitan
según el riesgo: seguridad, autenticación, datos, dependencias, workflows y
contenido que pueda ejecutarse merecen una revisión explícita.

## Seguridad

No publiques secretos, credenciales ni detalles de una vulnerabilidad sin
corrección en una issue. Consulta la [política de seguridad](SECURITY.md) para
los canales de reporte y la información que debe acompañar a un aviso.
