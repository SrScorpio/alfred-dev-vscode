# ADR-001 — Project setup

**Project:** Project
**Date:** 2026-10-03 | **Status:** Accepted

**Decision:** Keep the agent index at root (`AGENTS.md`). Human docs live under `docs/` (`docs/project/` for architecture and threat model, `docs/adr/` for this log). Machine backlog is `docs/ralph/prd.json`. Runtime stays in `.ralph/`.

**Consequences:**
- ✅ Single source of truth for each concern
- ⚠️ Keep `docs/` updated; do not scatter project files at the workspace root

---
*Add ADR-NNN for each significant technical decision.*
