# EdFarm Hub (was SideQuest BHM): status

## Latest: 12:55 PM CST

- **Done:** S1 (12:47), S2 (fd4128a at 12:53). Typecheck passes.
- **Next:** S3, target end ~1:15 (plan 1:33).
- **Pace:** about 20 min ahead. If this holds, full scope (S5 + S6) fits.
- Git identity for this repo now Kakumrkr (local config, from S2 commit on).

### Target clock (S1 started 12:38)

| Session | Plan end | Actual end |
|---|---|---|
| S1 Foundation (20) | 12:58 | 12:47 ✅ |
| S2 Orgs/admin/posts (15) | 1:13 | 12:53 ✅ |
| S3 Students/apply/accept (20) | 1:33 | |
| S4 Complete/review/profiles/landing (20) | 1:53 | |
| **Checkpoint: core loop works** | **2:00** | |
| S5 Admin trust tools (10) | 2:03 | |
| S6 AI + polish (10) | 2:13 | |
| S7 QA + db reset (10) | 2:23 → must be 2:15 | |
| Freeze | 2:20 | |
| Deadline | 2:35 | |

The plan as written overshoots the 2:15 QA target by about 8 min (more with `/clear` gaps). Something in S5/S6 has to give.

### Risks
1. **No AI key in `.env`** (only DATABASE_URL, SESSION_SECRET, DEMO_MODE). S6 AI draft will be skipped, so demo step 2 is a manual post. To keep AI in: add `ANTHROPIC_API_KEY=...` to `.env` before S6 starts. You do this, not the builder.
2. Schedule is 8 min over at full scope (see above).
3. Seed is large (6 orgs, 4 students, 6 posts, resumes). If `db:reset` fails at the end of S1, fix it before moving on. Every later session depends on it.

### Decisions
- Default plan: S6 = polish only (no AI) unless a key is added. That saves ~5 min.
- At the 1:53 checkpoint: S4 done by 1:53 → run S5, then S6 polish only if it's before 2:05. S4 done after 2:00 → skip S5 and S6, go straight to S7.
- Cut order (PLAN §10): S6 AI → S5 flags → S5 hide review → S5 close stale → landing polish. Never cut the core loop.

---

## Demo kit

### 3-minute demo script (adjust after S6)
Before you start: `npm run db:reset`, open the app at `/login`, password for everything is `demo1234`.

1. **Admin (0:00–0:30).** Quick-login "Ed Farm admin". Pending orgs: Magic City Youth Chess shows "Domain matches", approve it. QuickCash shows "Domain mismatch", reject it. Say: "Only real orgs get in."
2. **Org (0:30–1:00).** Quick-login Brightloop. New post: title "Test our iPhone rebooking feature", category iOS app testing, 2 positions, 4 hours, Stipend "$150 stipend", beginner-friendly, tick the safety box, publish. Point out: startups can't pick Volunteer.
   - *If AI is built:* paste "need a couple people to test the new rebooking feature on our iPhone app before Friday" → Draft with AI → set compensation → publish.
3. **Student (1:00–1:25).** Quick-login Jordan. Browse → open the post → apply with teammate `priya@student.demo` + short note.
4. **Org (1:25–1:55).** Brightloop → the post → Applicants: Jordan + Priya, "Team of 2", Ed Farm verified achievements, resume links. Accept → In progress, emails shown, post now FILLED.
5. **Student (1:55–2:15).** Jordan → "We're done" + one-line summary.
6. **Org (2:15–2:35).** Mark completed, 5 stars, short review.
7. **Public profile (2:35–3:00).** Jordan's `/s/[id]`: verified project, "Team project with Priya" → click Priya, same project. Then Aaliyah's profile: what a learner looks like after a few projects.

Backup if a step breaks live: skip to Aaliyah's public profile (seeded, always works) and talk through the loop.

### 30-second pitch
"Ed Farm learners finish with certifications but no real work history, and Birmingham startups and nonprofits need small tech jobs done. EdFarm Hub connects them with trust on both sides: Ed Farm vouches for the orgs and the training, orgs vouch for the work. Learners can team up, and every finished project becomes a verified track record the next employer can see."

### Judge Q&A (short answers)
- **How is this different from Riipen / Upwork?** Riipen is built around college courses and credit; Upwork is an open market. This is local, small projects for Ed Farm cohorts, with Ed Farm staff approving every org.
- **Isn't this free labor?** Startups must offer paid or stipend work; the server blocks "Volunteer" for them. Only nonprofits can post volunteer work.
- **Fake or shady orgs?** Manual Ed Farm approval with an email-vs-website domain check, student reports, and suspension, which hides all their posts.
- **What if an org ghosts the student?** The student's "We're done" is timestamped, and Ed Farm can close stale work as verified.
- **Why email, not chat?** Orgs already live in email. The portal is the trust record, which kept the build small and safe.
- **Teammate consent?** The teammate can leave the team any time before the org accepts.
- **Student safety / data?** Posts must confirm no production passwords, customer data or security testing. Emails and resumes are only shown to the org after acceptance (resumes to orgs the student applied to).
- **Is this real data?** No, all sample data, labeled in the app. It's a hackathon prototype, not an official Ed Farm product.
- **What's next?** Pilot with one Ed Farm cohort and a handful of partner orgs; email notifications; Ed Farm achievements synced from their records instead of typed in.

### Submission description
**EdFarm Hub** connects Ed Farm learners with small, real tech projects from Birmingham startups and nonprofits, like app testing, accessibility audits and small website fixes.

**Who it helps.** Learners who have training and certifications but no work history, and local orgs that need small tech jobs done but have no time or budget to find help.

**How it works.** Ed Farm staff approve each organization (with a domain check) and add verified achievements to learner profiles. Approved orgs post projects; startups must offer pay or a stipend, nonprofits may post volunteer work. Learners apply alone or with one teammate. The org reviews achievements and resumes, accepts, and the work happens over email. When it's done, the learner writes a short summary and the org marks it complete with a rating and review. That finished project shows up on every team member's public profile, marked "Verified by Ed Farm", so the next org can trust them faster. Students can report an org, and Ed Farm can suspend it or close stalled work.

**Ed Farm tie-in.** Ed Farm is the trust layer: it vouches for the organizations and the training, and the orgs vouch for the work.

**Tech stack.** Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS 4, Prisma 6 with SQLite, custom JWT session auth (jose + bcryptjs), zod validation.

**What's next.** Pilot with one cohort, email notifications, and syncing achievements from Ed Farm's own records.

*All data in the demo is fictional sample data. Hackathon prototype, not an official Ed Farm product.*
