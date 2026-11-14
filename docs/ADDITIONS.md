# Additions

## A1. Rename to EdFarm Hub (2 min, run after S3 commits, before S4)

Approved 1:00 PM. Display name only. Folder stays `sidequest-bhm` (renaming it mid-build breaks the builder session and OneDrive path).

Rules:
- `APP_NAME` = "EdFarm Hub". Every visible name comes from `APP_NAME`.
- package.json `name` = "edfarm-hub" (and the top `name` fields in package-lock.json).
- Keep the disclaimer "Hackathon prototype, not an official Ed Farm product" in the banner and footer.
- Update the name in CLAUDE.md and docs/PLAN.md titles and pitch text (SideQuest BHM → EdFarm Hub).

Files: `src/lib/config.ts`, `package.json`, `package-lock.json`, `CLAUDE.md`, `docs/PLAN.md`.

Done check: `grep -ri sidequest src package.json` returns nothing; header and tab title say EdFarm Hub; typecheck passes; commit `rename: EdFarm Hub`.
