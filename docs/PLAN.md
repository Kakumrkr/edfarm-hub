# SideQuest BHM: build plan

Build a Better Birmingham hackathon. Community partner: Ed Farm. Total time: about 2 hours.

## 0. Timeline

| Session | Minutes | Goal | Skills / agents |
|---|---|---|---|
| S0 | 3 | Open the folder, start Claude Code, install plugin (you) | frontend-design plugin |
| S1 | 20 | Foundation: config, DB, full seed, auth, UI kit, shell, login | frontend-design skill |
| S2 | 15 | Org signup, admin approval, posts | |
| S3 | 20 | Student signup, resume, browse, apply with teammate, accept | |
| S4 | 20 | Done, complete, review, public profiles, landing, report org | frontend-design skill |
| S5 | 10 | Ed Farm trust tools (admin pages) | 3 parallel subagents |
| S6 | 10 | AI post draft + UI polish | frontend-design skill |
| S7 | 10 | QA, fixes, demo reset | access-guard + demo-check in parallel |
| Prep | 10 | Rehearse the demo twice (you) | |

**Checkpoint:** the core loop (S1 to S4) must work by minute 85. If not, skip S5 and S6 and go to S7.
Between sessions: `/clear`, then `/session N`.

## 1. Product

**Problem.** Ed Farm learners finish training with certifications but little real work history. Birmingham startups and nonprofits have small tech jobs (testing, audits, small fixes) and no time or budget to find help.

**Solution.** A trust layer between them. Ed Farm vouches for the orgs (approval) and the training (verified achievements). Orgs vouch for the work (completion + review). Students build a public, verified track record, alone or with a teammate.

**Core loop.** Org registers → Ed Farm approves → org posts a project → student applies (optionally with one teammate) → org checks Ed Farm achievements + resume → accepts → work happens over email (app only shows In progress) → student marks done with a summary → org marks complete with rating and review → it shows on the public profile of every team member → the next org trusts them faster.

**Out of scope:** chat, payments, email notifications, password reset, full-text search, automated org verification.

## 2. Roles

| Role | Can do |
|---|---|
| ADMIN (Ed Farm staff) | Approve/reject/suspend orgs, add/remove achievements, close stale engagements, hide unfair reviews, resolve reports |
| ORG | Register (pending), create posts once approved, view applicants and resumes, accept/decline, mark complete, rate and review |
| STUDENT | Register, upload resume, browse, apply with optional teammate, withdraw or leave team, mark done with summary, report an org |

## 3. Data model

`prisma/schema.prisma` is given and validated. Models: User, Org, Student, Achievement, Post, Application, Flag.
- SQLite has no enums or string lists: status/type fields are Strings, skills are comma-separated Strings.
- Resumes are stored in the DB (`Student.resumeData` Bytes, max 2 MB PDF). No file system or cloud storage.
- Teammate: `Application.studentId` is the lead, `Application.teammateId` is the optional second student. A team uses 2 seats. Ratings, reviews and the summary live on the Application, so both members share one record.

`src/lib/constants.ts` values:
- ROLES: ADMIN, ORG, STUDENT
- ORG_TYPES: STARTUP "Startup", NONPROFIT "Nonprofit"
- ORG_STATUS: PENDING (amber), APPROVED (emerald), REJECTED (red), SUSPENDED (red)
- POST_STATUS: OPEN (emerald), FILLED (stone), CLOSED (stone)
- APP_STATUS: APPLIED "Applied" (sky), IN_PROGRESS "In progress" (amber), COMPLETED "Completed" (emerald), DECLINED (stone), WITHDRAWN (stone), CANCELLED (stone)
- COMP_TYPES: PAID "Paid" (emerald), STIPEND "Stipend" (sky), UNPAID "Volunteer" (violet)
- CATEGORIES: IOS_TESTING "iOS app testing", QA_TESTING "QA / usability testing", WEB_FIX "Website fix", ACCESSIBILITY "Accessibility audit", PERFORMANCE_SEO "Performance / SEO audit", TEST_CASES "Write test cases", OTHER "Other"

## 4. Business rules (enforce on the server)

- **R1** Org signup creates status PENDING. Only APPROVED orgs can create posts. Posts of non-approved orgs are hidden from students and can't take applications.
- **R2** Admin org list shows a domain check: login email domain vs website host (ignore `www.`). Match = "Domain matches" (emerald). Mismatch = "Domain mismatch" (red, AlertTriangle).
- **R3** Compensation: STARTUP may use PAID or STIPEND only, and `compensationNote` is required (example "$150 stipend"). NONPROFIT may also use UNPAID (shown as "Volunteer"). The form hides UNPAID for startups and the server rejects it.
- **R4** Creating a post requires the safety checkbox: "This project needs no production passwords, no customer data, and no security testing."
- **R5** Apply: STUDENT only; post OPEN and org APPROVED; student has a resume; the student is not already on this post as lead or teammate.
- **R6** Teammate (optional, max 1): entered by email; must be an existing STUDENT, not the applicant, not already on this post, and must have a resume. A team needs 2 free seats.
- **R7** Accept: org owns the post; application is APPLIED; `seatsUsed + teamSize <= positions`. seatsUsed = IN_PROGRESS + COMPLETED applications on the post, counting 2 for teams. Run it in `prisma.$transaction`. After accepting, if seatsUsed == positions: post becomes FILLED and every remaining APPLIED application becomes DECLINED.
- **R8** Contact reveal: the org sees member emails only for IN_PROGRESS and COMPLETED applications. Students see the org's login email + contactName only when their application is IN_PROGRESS or COMPLETED. Show the line "Work together over email. The portal only tracks status."
- **R9** Resume access (`GET /api/resume/[studentId]`): ADMIN, the student, or an ORG that has any application (as lead or teammate) from this student on one of its posts. Otherwise 403.
- **R10** Done: lead or teammate on an IN_PROGRESS application sets `doneRequestedAt` and `studentSummary` (20 to 400 chars, "what we did and how"). Either member can edit the summary while IN_PROGRESS or COMPLETED.
- **R11** Complete: org owns the post; IN_PROGRESS → COMPLETED, `completedAt`, `completedBy = "ORG"`, optional `rating` 1 to 5, optional `review` up to 600 chars. Allowed even if the student hasn't clicked done.
- **R12** Admin close: IN_PROGRESS → COMPLETED (`completedBy = "ADMIN"`, no rating) or CANCELLED.
- **R13** Hidden reviews (`reviewHidden`) never show publicly and don't count in average rating.
- **R14** Report: lead or teammate on any application with that org creates a Flag (reason 10 to 500 chars). Admin resolves it or suspends the org. A SUSPENDED org can't post, its posts are hidden, and /org shows a banner.
- **R15** Withdraw: lead on APPLIED. Leave team: teammate on APPLIED sets `teammateId = null`.
- **R16** Public profile `/s/[id]` never shows email or resume, and never shows DECLINED, WITHDRAWN or CANCELLED items.
- **R17** Only ADMIN creates achievements. They show as "Verified by Ed Farm".
- **R18** Demo quick-login works only when `DEMO_MODE=true` and only for seeded demo emails.

## 5. Routes

| Route | Who | Contents |
|---|---|---|
| `/` | public | Hero, 3-step how it works, CTAs, live counts (labeled sample data in demo mode), footer "Hackathon prototype, not an official Ed Farm product" |
| `/login` | public | Email + password form, demo quick-login buttons (R18) |
| `/register` | public | Choose: organization or Ed Farm student |
| `/register/org` | public | name, type, website, contact name, description, email, password → PENDING, logged in, → /org |
| `/register/student` | public | name, email, password, cohort, skills, bio → /student/profile |
| `/s/[id]` | public | Public trust profile (S4) |
| `/org` | ORG | Status banner, posts with counts (applicants, in progress, completed, seats used/positions), New post button |
| `/org/posts/new` | ORG | Post form (R3, R4), "Draft with AI" (S6) |
| `/org/posts/[id]` | ORG owner | Post details, Close post, applicants, in-progress, completed |
| `/posts` | STUDENT | Open posts, filters via searchParams: category, beginner-friendly, compensation |
| `/posts/[id]` | STUDENT | Details + apply form with optional teammate email |
| `/student` | STUDENT | My applications grouped: Applied, In progress, Completed, Closed. Shows role (Lead / Teammate) |
| `/student/profile` | STUDENT | Edit bio, skills, cohort, upload resume, link to public profile |
| `/admin` | ADMIN | Orgs: pending first (R2), approve/reject with note, suspend/reinstate |
| `/admin/students` | ADMIN | Students + add/remove achievements (S5) |
| `/admin/engagements` | ADMIN | In progress (oldest and done-requested first) + close (R12); completed reviews hide/unhide (R13) (S5) |
| `/admin/flags` | ADMIN | Open reports, resolve, suspend org (S5) |
| `POST /api/resume` | STUDENT | multipart upload, PDF only, max 2 MB |
| `GET /api/resume/[studentId]` | R9 | `application/pdf`, inline |

## 6. Server actions

- auth.ts: `login`, `demoLogin(email)`, `logout`, `registerOrg`, `registerStudent`
- org.ts: `createPost`, `closePost(postId)`
- application.ts: `apply(postId, form)`, `withdraw(appId)`, `leaveTeam(appId)`, `accept(appId)`, `decline(appId)`, `markDone(appId, summary)`, `updateSummary(appId, summary)`, `complete(appId, rating?, review?)`, `reportOrg(appId, reason)`
- student.ts: `updateProfile`
- admin.ts: `approveOrg`, `rejectOrg(note)`, `suspendOrg`, `reinstateOrg` (S5 adds admin-students.ts, admin-engagements.ts, admin-flags.ts)
- ai.ts: `draftPostWithAI(rawText)` (S6)
- queries.ts: `seatsUsed(postId)`, `getPublicProfile(studentId)` (merges lead + teammate applications), `getStudentStats(studentId)` (completed count, avg visible rating, distinct orgs)

## 7. Seed data (`prisma/seed.ts`, all in Session 1)

All passwords `demo1234`. All domains end in `.demo`. All names are fictional. Generate a one-page resume PDF per student with pdf-lib ("<Name>, Resume (sample)", cohort, skills, "Ed Farm Pathways learner").

**Admin:** Taylor Brooks, `coach@edfarm.demo` (Ed Farm career coach).

**Orgs**
| Org | Type | Status | Login | Website | Contact |
|---|---|---|---|---|---|
| Brightloop | STARTUP | APPROVED | founder@brightloop.demo | https://brightloop.demo | Dana Whitfield. Booking app for Birmingham barbershops and salons |
| Ferrous Labs | STARTUP | APPROVED | team@ferrouslabs.demo | https://ferrouslabs.demo | Luis Ortega. Invoicing tool for small contractors |
| Northside Community Pantry | NONPROFIT | APPROVED | hello@northsidepantry.demo | https://northsidepantry.demo | Gloria Hayes. Neighborhood food pantry |
| Magic City Youth Chess | NONPROFIT | PENDING | coach@mcyouthchess.demo | https://mcyouthchess.demo | Andre Simmons. After-school chess club (domain matches) |
| QuickCash Opportunities | STARTUP | PENDING | quickcash.jobs@freemail.demo | https://quickcash-opps.demo | "Recruiter". Vague description (domain mismatch) |
| Velocity Growth Partners | STARTUP | APPROVED | ops@velocitygrowth.demo | https://velocitygrowth.demo | Kyle Benton. Growth agency |

**Students** (cohort "Fall 2026 cohort")
| Student | Login | Skills | Achievements (added by Taylor) |
|---|---|---|---|
| Jordan Ellis (new, demo lead) | jordan@student.demo | Swift, iOS, Manual testing, Bug reports | Swift Fundamentals (Pathways module); QA Testing Workshop |
| Priya Nair (demo teammate) | priya@student.demo | iOS, Figma, Usability testing | Swift Fundamentals (Pathways module); Career Readiness: Professional Communication |
| Aaliyah Carter (experienced) | aaliyah@student.demo | QA, Accessibility, HTML/CSS | QA Testing Workshop; Accessibility Basics Workshop; Git and GitHub Essentials |
| Marcus Reed | marcus@student.demo | JavaScript, React, Testing | Git and GitHub Essentials |

**Posts and applications**
1. Brightloop "Usability test our booking web page": STIPEND "$100 stipend", 2 positions, 5 h, beginner-friendly, OPEN. Aaliyah IN_PROGRESS (accepted 3 days ago). Priya APPLIED.
2. Ferrous Labs "Accessibility audit of our invoicing dashboard": PAID "$25/hour, about 8 hours", 1 position, FILLED. Aaliyah COMPLETED 5★, review "Clear, organized report. We fixed most issues the same week.", summary "Ran keyboard-only and screen reader checks on 6 screens and logged 14 issues with suggested fixes and screenshots."
3. Ferrous Labs "Write test cases for invoice export": PAID "$20/hour, about 6 hours", 2 positions, OPEN. Marcus APPLIED.
4. Northside Pantry "Fix the mobile layout of our volunteer sign-up page": UNPAID, 2 positions, FILLED. TEAM Aaliyah (lead) + Marcus (teammate) COMPLETED 4★, review "Works on phones now. Great communication.", summary "Rebuilt the form layout with flexbox, fixed tap targets, and tested on 3 phone sizes."
5. Northside Pantry "Check our donation form for bugs on iPhone and Android": UNPAID, 1 position, beginner-friendly, FILLED. Marcus IN_PROGRESS, doneRequestedAt 6 days ago, summary "Found 3 bugs and documented steps to reproduce in a shared sheet." (stale example for admin)
6. Velocity Growth "Build our full MVP": PAID "Paid after launch", 1 position, OPEN. Priya APPLIED + Flag from Priya: "They asked for 30+ hours of work before any payment and wanted me to use their production admin login."

**Login quick buttons:** Ed Farm admin (coach@edfarm.demo), Brightloop startup, Northside Pantry nonprofit, Jordan (new student), Priya (teammate), Aaliyah (experienced student).

## 8. Sessions

### Session 0 (you, 3 min)
The folder `Documents\sidequest-bhm` already has the Next.js 16.4.6 app files (from create-next-app, no node_modules yet) plus this kit. next.config.ts and .gitignore are already fixed.
1. PowerShell: `cd $HOME\Documents; Expand-Archive $HOME\Downloads\sidequest-bhm.zip -DestinationPath .; cd sidequest-bhm`
2. Optional for S6: create `.env` with `ANTHROPIC_API_KEY=...` (or `OPENAI_API_KEY=...` and `AI_MODEL=...`).
3. Run `claude`, trust the folder. Shift+Tab should show accept-edits mode (set in .claude/settings.json).
4. In Claude Code: `/plugin install frontend-design@claude-plugins-official` then `/reload-plugins`. If that marketplace isn't found: `/plugin marketplace add anthropics/claude-code` then `/plugin install frontend-design@claude-code-plugins`.
5. `/session 1`

### Session 1: Foundation (20 min)
Build:
1. First: `git init`, `npm install`, then `git add -A && git commit -m "starter kit"`. Confirm next.config.ts has no `cacheComponents` or `partialPrefetching` (already removed; keep the turbopack Tailwind rule exactly).
2. `npm i prisma@6 @prisma/client@6 bcryptjs jose zod lucide-react` and `npm i -D tsx pdf-lib`.
3. `.env`: `DATABASE_URL="file:./dev.db"`, `SESSION_SECRET` (random 48 chars), `DEMO_MODE=true`. Keep any API key lines already there. Write `.env.example` without secrets. (.gitignore already has `!.env.example` and `prisma/*.db*`.)
4. package.json scripts: `"typecheck": "next typegen && tsc --noEmit"`, `"db:push": "prisma db push"`, `"db:seed": "tsx prisma/seed.ts"`, `"db:reset": "prisma db push --force-reset && tsx prisma/seed.ts"`.
5. `src/lib/`: db.ts, session.ts, auth.ts, constants.ts, config.ts, format.ts (CLAUDE.md layout).
6. `prisma/seed.ts` with ALL of section 7 (later sessions only build UI). Then `npm run db:reset`.
7. UI kit `src/components/ui/`: button (primary, secondary, ghost, danger; sm, md), card, badge (tones from section 3), input, textarea, select (native), field (label + error), submit-button, empty-state, page-header, status-badge, verified-badge, stars (display + 1 to 5 radio input), initials-avatar. Use the frontend-design skill inside the fixed direction.
8. Shell: root layout (title APP_NAME, Geist), `site-header.tsx` (name, role nav, user name, logout), demo banner when DEMO_MODE: "Demo with sample data. Hackathon prototype, not an official Ed Farm product."
9. `/login` with quick-login buttons (section 7), role redirect (ADMIN → /admin, ORG → /org, STUDENT → /student). Logout.
10. Placeholder pages with PageHeader: /admin, /org, /student, /posts.

Done check: `npm run db:reset` succeeds; each quick-login lands on its dashboard; typecheck passes.

### Session 2: Orgs, admin approval, posts (15 min)
Read sections 4 (R1 to R4), 5, 6.
1. `/register` chooser and `/register/org` → `registerOrg` (User ORG + Org PENDING), log in, → /org.
2. `/admin`: pending orgs first with domain check (R2), Approve, Reject with optional note; all orgs list with Suspend / Reinstate.
3. `/org`: status banner (pending, rejected + note, suspended); post list with counts and seats used/positions; New post button only when APPROVED.
4. `/org/posts/new`: title, description, category, skills (comma list), positions (1 to 5), estimated hours, compensation type + note (R3), beginner-friendly, safety checkbox (R4). `createPost` validates everything server-side.
5. `/org/posts/[id]`: details, badges, Close post. Leave an "Applicants" section placeholder for S3.

Done check: new org registers → pending banner → admin approves → org can post; startup can't pick Volunteer.

### Session 3: Students, resume, apply with teammate, accept (20 min)
Read sections 4 (R5 to R9, R15), 5, 6.
1. `/register/student` → `registerStudent` → /student/profile.
2. `/student/profile`: edit bio, skills, cohort; resume upload (`POST /api/resume`, PDF only, max 2 MB, store bytes + name + date); "View my public profile" link to `/s/[id]`.
3. `GET /api/resume/[studentId]` with R9.
4. `/posts`: OPEN posts of APPROVED orgs. Filters: category, beginner-friendly, compensation. Card: title, org name + verified badge, org type, compensation badge, hours, skills chips, seats left.
5. `/posts/[id]`: details + apply form: note (optional, 500 chars) + teammate email (optional). Server enforces R5, R6. If already on the post, show the status instead of the form. If no resume, show a link to upload first.
6. `/org/posts/[id]` Applicants: per application show lead (and teammate) name, cohort, verified achievements, skills, completed count + avg rating, public profile link, resume link per member, note, "Team of 2" badge, seats needed. Accept / Decline. Accept follows R7 in a transaction.
7. In-progress section on `/org/posts/[id]` with member emails (R8).
8. `/student`: grouped lists. Each card: post title, org, status badge, role (Lead or Teammate), teammate name. APPLIED: Withdraw (lead) or Leave team (teammate). IN_PROGRESS: org contact email + contact name + the R8 line.

Done check: Jordan applies to a 2-seat post with priya@student.demo; the org sees a team of 2; Accept → both students see In progress + org email; post shows FILLED.

### Session 4: Completion, reviews, public profiles, landing (20 min)
Read sections 1, 4 (R10, R11, R13, R14, R16), 5.
1. `/student` IN_PROGRESS card: "We're done" form with summary → `markDone`. Summary editable afterward (`updateSummary`).
2. `/org/posts/[id]` in-progress card: "Marked done on <date>" + summary; "Mark completed" form with stars (optional) + review (optional) → `complete`.
3. `/s/[id]` public profile (use the frontend-design skill): header (initials avatar, name, cohort, bio, skills), stats row (completed projects, avg rating, orgs worked with), "Verified by Ed Farm" achievements, "Currently working with <org>" items, completed history cards: org name + type badge, post title, category, completed date, stars, review (unless hidden), summary, "Team project with <teammate link>", "Closed by Ed Farm" when completedBy ADMIN. Empty state: "New here. No completed projects yet." Copy-link button. Must merge lead + teammate applications (queries.ts `getPublicProfile`).
4. `/` landing (use the frontend-design skill): hero "Real projects. Verified by Ed Farm." + subline, 3 steps (Ed Farm verifies orgs → learners take real projects, solo or as a team → every finished project builds a verified track record), CTAs, counts from DB (approved orgs, completed projects, students) with "sample data" label in demo mode, footer disclaimer.
5. "Report a problem" on student application cards → `reportOrg` (R14).

Done check: finish the Jordan + Priya project as the org with 5 stars → it appears on both `/s/[id]` pages with "Team project with".

### Session 5: Ed Farm trust tools (10 min)
Tell Claude: "Spawn 3 general-purpose subagents in parallel. Each owns only its own files. Then integrate, add admin nav links, typecheck, commit."
- Agent A: `/admin/students` + `src/server/actions/admin-students.ts`: list students (name, cohort, achievements, completed count); add achievement (title, detail); remove achievement. R17.
- Agent B: `/admin/engagements` + `src/server/actions/admin-engagements.ts`: IN_PROGRESS list (done-requested and oldest first, days since accepted), "Mark completed (Ed Farm verified)" and "Cancel" (R12); completed list with Hide review / Unhide (R13).
- Agent C: `/admin/flags` + `src/server/actions/admin-flags.ts`: open reports (org, student, reason, date), Resolve, Suspend org (R14).

Done check: hide Aaliyah's 4★ review → gone from her public profile; suspend Velocity → its post disappears from /posts.

### Session 6: AI post draft + polish (10 min)
1. If `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` exists, `AI_ENABLED = true`. Otherwise skip to step 4.
2. `src/server/actions/ai.ts` `draftPostWithAI(rawText)` (ORG only, 10 to 1000 chars). Use `fetch`, no SDK, 15 s timeout.
   - Anthropic: POST `https://api.anthropic.com/v1/messages`, headers `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json`; body `{ model: process.env.AI_MODEL ?? "claude-haiku-5-5", max_tokens: 800, system, messages: [{ role: "user", content: rawText }] }`; read `content[0].text`.
   - OpenAI: POST `https://api.openai.com/v1/chat/completions` with `response_format: { type: "json_object" }`, model from `AI_MODEL` (required).
   - System prompt: "Turn a small Birmingham organization's rough request into a clear, safe project post for adult tech learners. Never include work that needs production passwords, customer data, or security testing. If the request needs any of these, rewrite the task without them and explain in safetyWarning. Do not invent pay. Return only JSON: {title, description, category, skills, estimatedHours, beginnerFriendly, safetyWarning}. description has three short sections: What you'll do, Deliverables, Done when. category is one of: IOS_TESTING, QA_TESTING, WEB_FIX, ACCESSIBILITY, PERFORMANCE_SEO, TEST_CASES, OTHER."
   - Parse the text between the first `{` and last `}`, validate with zod, return `{ ok, draft }` or a friendly error.
3. `/org/posts/new`: textarea "Describe what you need" + "Draft with AI" button fills the form fields, shows safetyWarning in an amber box, sets hidden `aiDrafted=true`. Org still edits and submits. Compensation is never AI-filled.
4. Polish with the frontend-design skill, inside the fixed direction: landing hero, `/s/[id]`, post cards, applicant cards. Check 390px width.

### Session 7: QA and demo reset (10 min)
Tell Claude: "Run the access-guard and demo-check agents in parallel. Fix every BLOCKER and FAIL. Then npm run build, npm run db:reset, commit 'demo ready'."
Then you: run section 9 twice in the browser. Run `npm run db:reset` right before presenting.

## 9. Demo (3 minutes)

1. **Admin** (quick-login Ed Farm admin). Pending orgs: approve Magic City Youth Chess (domain matches), reject QuickCash (domain mismatch). "Only real orgs get in."
2. **Org** (Brightloop). New post → paste "need a couple people to test the new rebooking feature on our iPhone app before Friday" → Draft with AI → set Stipend "$150 stipend", 2 positions → safety check → publish.
3. **Student** (Jordan). Browse → open the post → apply with teammate `priya@student.demo` + short note.
4. **Org** (Brightloop). Applicants: Jordan + Priya, Ed Farm verified achievements, resumes → Accept team → In progress, emails shown, post auto-filled.
5. **Student** (Jordan). "We're done" + summary.
6. **Org**. Mark completed, 5 stars, short review.
7. **Public profile** of Jordan: the verified project with "Team project with Priya" → click Priya: same project. Then open Aaliyah's profile: what a learner looks like after a few projects.

**Pitch (30 s).** "Ed Farm learners finish with certifications but no real work history, and Birmingham startups and nonprofits need small tech jobs done. SideQuest BHM connects them with trust on both sides: Ed Farm vouches for the orgs and the training, orgs vouch for the work. Learners can team up, and every finished project becomes a verified track record the next employer can see."

**Q&A prep**
- Riipen? Built mostly around college courses and credit. This is local, small projects for Ed Farm cohorts, run by Ed Farm staff.
- Free labor? Startups must post paid or stipend work. Unpaid is allowed only for nonprofits, where volunteering is generally fine.
- Fake orgs? Manual Ed Farm approval with a domain check, plus student reports and suspension.
- Org ghosts the student? "We're done" timestamp, and Ed Farm can close stale work as verified.
- Why email, not in-app chat? Orgs already work in email. The portal stays the trust record, which kept the build small.
- Teammate consent? The teammate can leave the team any time before acceptance.

## 10. Cut list and recovery

Cut in this order if behind: S6 AI draft → S5 flags page → S5 hide review → S5 close stale → landing polish. Never cut: org approval, post, apply with teammate, accept, done/complete/review, public profiles.

Recovery:
- Bad edit: Esc Esc (or `/rewind`) → restore code. Note: it doesn't undo bash commands.
- Bad session: `git reset --hard HEAD` returns to the last session commit (loses uncommitted work).
- Broken data: `npm run db:reset`.
- Type errors piling up: ask Claude "run npm run typecheck and fix all errors, nothing else".
