---
name: session
description: Run one numbered build session of the SideQuest BHM plan. Only when the user types /session N.
argument-hint: "[session-number]"
disable-model-invocation: true
---

Run Session $ARGUMENTS from docs/PLAN.md.

1. Read docs/PLAN.md section 8, "Session $ARGUMENTS", and only the other sections it points to. CLAUDE.md rules apply.
2. Make a short task list from the session's build list.
3. Build exactly that scope. Don't stop to ask questions. Make the simplest reasonable choice and list it at the end.
4. Use subagents or skills only where the session says so.
5. Run `npm run typecheck` and fix every error. Then do the session's "Done check" steps that can be checked from code or the terminal.
6. Commit: `git add -A && git commit -m "session $ARGUMENTS: <short summary>"`.
7. Reply in max 5 bullets: what was built, shortcuts taken, and exactly what to click in the browser to verify.
