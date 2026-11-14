# EdFarm Hub

EdFarm Hub connects Ed Farm learners with small, real tech projects from Birmingham startups and nonprofits, like app testing, accessibility audits and small website fixes.

**Who it helps.** Learners who have training and certifications but no work history, and local orgs that need small tech jobs done but have no time or budget to find help.

**How it works.** Ed Farm staff approve each organization (with an email-vs-website domain check) and add verified achievements to learner profiles. Approved orgs post projects; startups must offer pay or a stipend, nonprofits may post volunteer work. Learners apply alone or with one teammate. The org reviews achievements and resumes, accepts, and the work happens over email. When it's done, the learner writes a short summary and the org marks it complete with a rating and review. The finished project shows up on every team member's public profile, marked "Verified by Ed Farm". Students can report an org, and Ed Farm can suspend it or close stalled work.

**Ed Farm tie-in.** Ed Farm is the trust layer: it vouches for the organizations and the training, and the orgs vouch for the work.

## Ed Farm records sync

When a student signs up with an email found in Ed Farm's learner records, their completed Ed Farm courses are added to their profile as verified achievements, their cohort is filled in, and their current Ed Farm program is shown on their profile. In this prototype the records are a read-only mock file (`src/lib/edfarm-records.ts`); in production this would be an API call to Ed Farm. Signup works the same if no record matches. Try it by registering `brahma@student.demo`.

## Tech stack

Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS 4, Prisma 6 with SQLite, custom JWT session auth (jose + bcryptjs), zod validation.

## How to run

```bash
npm install
cp .env.example .env    # then set SESSION_SECRET to a long random string
npm run db:reset        # create the SQLite database and load sample data
npm run dev             # http://localhost:3000
```

## Demo logins (password `demo1234`)

| Role | Login |
|---|---|
| Ed Farm admin | coach@edfarm.demo |
| Startup (approved) | founder@brightloop.demo |
| Nonprofit (approved) | hello@northsidepantry.demo |
| Nonprofit (pending, domain matches) | coach@mcyouthchess.demo |
| Startup (pending, domain mismatch) | quickcash.jobs@freemail.demo |
| Student (new) | jordan@student.demo |
| Student (teammate) | priya@student.demo |
| Student (experienced) | aaliyah@student.demo |

## What's next

Pilot with one cohort, email notifications, and syncing achievements from Ed Farm's own records instead of a mock file.

Hackathon prototype with fictional sample data, not an official Ed Farm product.
