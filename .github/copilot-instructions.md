# GitHub Copilot Instructions
> See [AGENTS.md](../AGENTS.md) for the full protocol.

**Project:** See AGENTS.md
**Stack:** See AGENTS.md

## IDs and collaboration
- GitHub references use owner/repo#N; GitHub assigns N. ADR-NNN is reserved for decisions.
- Use the Ralph local ID exactly as provided by the backlog and runner context. Do not infer GitHub issue numbers, renumber IDs, or migrate them.
- The ralph-suite.syncIssue command maps GitHub to Ralph only through explicit github:#N or owner/repo#N labels. Never infer ISSUE-00N from GitHub #N; write only runtime .ralph, never prd.json.
- Ad hoc, analysis, review, documentation, and handoff work does not require an ID or .ralph signals. A Ralph execution without explicit task ID and workspace root must request that context.

## Critical Rules
1. Read `.agent/memories.md` before starting any task
2. Follow conventions already in the codebase
3. Tests required for new features
4. Never commit secrets — use environment variables
5. Commits only when explicitly authorized
6. Write completion signals only for Ralph tasks with explicit context, after all scope and gates pass
