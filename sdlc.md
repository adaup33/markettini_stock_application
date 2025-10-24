# Software Development Life Cycle (SDLC) — stock_application

This document explains the Software Development Life Cycle (SDLC) applied to this repository (`stock_application`). It is written for an average BSc CSE student and includes concrete, repo-specific steps, recommended tools for diagrams and illustrations, and small templates you can use when documenting features and design decisions.

Quick plan (what this file contains)
- Short SDLC overview and recommended model for this project
- Phase-by-phase guide with project-specific examples
- Tools for diagrams/tables/illustrations (how to use them in the repo)
- Reproducible diagram examples (Mermaid and PlantUML) using code from this project
- Documentation placement and templates (where to put files in the repo)
- Checklists for releases, PRs and design docs

---

1) Recommended SDLC model for this repo
- Use an Agile-ish workflow (GitHub Flow or Trunk-based): short feature branches, small PRs, CI checks on PRs.
- Why: this project is a modern Next.js app that uses server actions, background functions (Inngest), and a MongoDB database. Iterative development makes it easier to test UI changes and server functions quickly.


2) Project-specific SDLC phases and examples

2.1 Requirements / Analysis
- Collect feature requests (examples for this repo: add price alerts, improve daily-news email content, add pagination to stocks page).
- Write small user stories with acceptance criteria. Example:
  - "As a user, I want to add a stock to my watchlist so I can track its price." Acceptance: clicking the Add button persists to DB and the Watchlist UI shows the symbol.
- Keep a backlog: GitHub Issues is fine. For very small teams, `docs/backlog.md` also works.

2.2 Design (repo-specific)
- Create a short design doc in `docs/` before medium-sized features. Name it `docs/design/<feature>.md`.
- Useful diagrams for this project:
  - Component / architecture flow: Browser -> Next.js pages -> API routes -> app/api/inngest route -> Inngest functions -> Database -> Email service.
  - Sequence diagram: signup flow and daily-news cron flow (helps understand how server actions and Inngest interact).
  - Data model (ERD): users, watchlists, alerts.
- Store diagram sources in `diagrams/` (Mermaid `.mmd` or PlantUML `.puml`) so they are versioned with code.

2.3 Implementation (Development)
- Implement in a feature branch named `feature/<short-description>`.
- Keep PRs small and focused (one feature or bug per PR when possible).
- Add tests for new logic (unit tests for helpers, small integration tests for server actions).
- Follow repo conventions (TypeScript, Next.js app router, server actions in `app/`, Inngest events in `lib/inngest/`).

2.4 Testing / QA
- Unit tests: library functions in `lib/` (e.g., price/format utilities in `lib/utils.ts`).
- Integration tests: watchlist add/remove flows — use an in-memory MongoDB or a test DB.
- E2E: Playwright or Cypress for flows such as sign-up -> add watchlist -> get email.

2.5 Deployment
- Use CI (GitHub Actions recommended) to run tests and linting on PRs.
- Use preview builds (Vercel) for PR review when possible so UI changes can be checked live.
- Keep secrets out of the repo. Document required env vars in `docs/env.example.md` (do not include real secrets).

2.6 Maintenance & Monitoring
- Log errors from Inngest functions and server routes. Use Vercel logs or a log-hosting service.
- Keep a small `docs/runbook.md` explaining how to recover from common problems (DB connection issues, Inngest registration failures, missing cron runs).


3) Where to put docs and diagrams in this repo (concrete)
- `README.md` — short project summary + how to run locally (already present).
- `docs/architecture.md` — high-level architecture and tradeoffs.
- `docs/design/<feature>.md` — per-feature design docs.
- `docs/runbook.md` — debugging & recovery steps for production issues.
- `diagrams/` — add editable sources: `architecture.mmd`, `signup-sequence.puml`, `watchlist-erd.mmd`.
- `docs/env.example.md` — example environment variables (no real secrets).


4) Tools to create diagrams, tables and illustrations (practical + quick usage tips)
- Mermaid (text-first diagrams)
  - Good for flowcharts, class diagrams, and simple sequence diagrams.
  - Save sources in `diagrams/*.mmd` and preview with a Mermaid extension or the Mermaid live editor.
  - To render to PNG/SVG in CI: `@mermaid-js/mermaid-cli` (mmdc). Example (CI): `npx @mermaid-js/mermaid-cli -i diagrams/architecture.mmd -o docs/images/architecture.png`.

- PlantUML (UML-focused)
  - Great for sequence diagrams and detailed UML diagrams.
  - Save `.puml` files in `diagrams/` and render locally via the PlantUML JAR or Docker image.
  - Docker example (on CI runner or dev machine): `docker run --rm -v %cd%:/work plantuml/plantuml -tpng diagrams/signup-sequence.puml` (Windows paths vary; use CI runner env).

- diagrams.net (draw.io)
  - Fast drag-and-drop editor; export `.drawio` and PNGs. Store the `.drawio` file in `diagrams/` so others can re-open it.

- Figma
  - Best for UI mockups and visual design. Keep links in docs and export PNGs to `public/images/` for static previews.

- Generic options for tables/illustrations
  - Use Markdown tables for simple tabular data inside `docs/` files.
  - For richer docs, use a static site generator (Docusaurus or MkDocs) later.

Editor/UI helpers
- VS Code / JetBrains extensions: Mermaid Preview, PlantUML, Markdown preview enhancements.


How to keep diagrams versioned and reproducible
- Prefer text-first diagrams (Mermaid/PlantUML). Commit both source files (in `diagrams/`) and rendered images (in `docs/images/`) when useful.
- Add a CI step that renders sources to images on push so reviewers always see up-to-date diagrams.


5) Repo-specific reproducible diagram examples

5.1 Architecture flow (Mermaid)
Save source to `diagrams/architecture.mmd` (example):

flowchart LR
  Browser[Browser (React)] -->|navigate| NextPages[Next.js pages]
  NextPages -->|calls| API_Route[/app/api/inngest/route.ts]
  API_Route -->|registers| Inngest[Inngest server]
  NextPages -->|server actions| AuthActions[lib/actions/auth.actions.ts]
  AuthActions -->|emits event| Inngest
  Inngest -->|invokes| Functions[lib/inngest/functions.ts]
  Functions -->|sends email| Mailer[lib/nodemailer/index.ts]
  NextPages -->|reads/writes| DB[(MongoDB via database/mongoose.ts)]
  DB --> Watchlist[watchlist collection]

5.2 Sign-up sequence (PlantUML)
Save source to `diagrams/signup-sequence.puml` (example):

@startuml
actor User
participant "Next.js Page (signup)" as SignupPage
participant "auth.actions.signUpWithEmail" as SignUpAction
participant Inngest
participant "lib/inngest/functions.ts (sendSignUpEmail)" as Fn
participant "nodemailer" as Mailer

User -> SignupPage: submit sign-up form
SignupPage -> SignUpAction: call server action
SignUpAction -> SignUpAction: call auth.api.signUpEmail
SignUpAction -> Inngest: inngest.send(app/user.created)
Inngest -> Fn: trigger sign-up function
Fn -> Mailer: send welcome email
Mailer --> Fn: success
Fn --> Inngest: finished
Inngest --> SignUpAction: ack (optional)
@enduml

5.3 Watchlist ERD (Mermaid classDiagram simplified)
Save source to `diagrams/watchlist-erd.mmd` (example):

classDiagram
  class User{
    +String id
    +String email
    +String name
  }
  class Watchlist{
    +String _id
    +String userId
    +String symbol
    +String company
    +Date addedAt
  }
  User <|-- Watchlist : has

Notes: these examples reflect files and flows already present in this repository (see `app/api/inngest/route.ts`, `lib/actions/*`, `lib/inngest/*`, and `database/`).


6) Documentation templates and examples

6.1 Feature design doc template (save to `docs/design/<feature>.md`)
- Title: e.g., "Design: Daily news email improvements"
- Author(s):
- Date:
- Summary / goal:
- Scope (in / out):
- Requirements (functional / non-functional):
- Proposed architecture (link to `diagrams/architecture.mmd`)
- Data model changes (if any)
- API changes (endpoints, request/response)
- Migration plan (DB migrations, backfills)
- Testing plan (unit/integration/E2E)
- Rollout steps and rollback plan
- Open questions and decisions

6.2 README snippet: how to run project locally (add to `README.md` or `docs/quickstart.md`)
- Prereqs: Node.js (LTS), npm or yarn, MongoDB (or a connection string)
- Install: `npm install`
- Create `.env.local` (copy `docs/env.example.md` and fill values)
- Dev: `npm run dev`
- Tests: `npm test` or `npm run test` (if tests are configured)


7) Documentation process and good practices (project-specific)
- Update docs when public behavior changes (APIs, DB schema, Inngest function IDs).
- Add a short design doc for non-trivial features and link it in the PR description.
- Keep diagrams editable in `diagrams/` and commit both source and rendered images.
- Keep a `docs/runbook.md` with step-by-step recovery instructions for common incidents.


8) Quick checklists (copy into `.github/PULL_REQUEST_TEMPLATE.md`)

8.1 PR checklist
- [ ] Linked issue or design doc
- [ ] Small, focused changes (1 feature/bug per PR)
- [ ] Tests added / updated
- [ ] Linting passes (run `npm run lint`)
- [ ] Docs updated (README or `docs/`)
- [ ] Diagrams updated (if architecture changed)

8.2 Release checklist
- [ ] All tests pass in CI
- [ ] Changelog updated
- [ ] Migration / rollback plan documented
- [ ] Monitoring & alerts ready


9) How to generate diagram images in CI (example ideas)
- Mermaid CLI (mmdc): `npm i -D @mermaid-js/mermaid-cli` then `npx @mermaid-js/mermaid-cli -i diagrams/architecture.mmd -o docs/images/architecture.png`.
- PlantUML in Docker: `docker run --rm -v %cd%:/work plantuml/plantuml -tpng diagrams/signup-sequence.puml` (CI runners typically support Unix-style paths; adjust for Windows if running locally).


10) Study/advice for students working on this repo
- Start with a small end-to-end change: write a unit test for a util in `lib/utils.ts` and make a tiny UI tweak on the Stocks page.
- Write a one-page design doc for a new alert feature and include at least one Mermaid diagram. Store it in `docs/design/` and link the doc in your PR.


11) Next steps (concrete actions I can take for you)
- Create `docs/` and `diagrams/` with the example files (`diagrams/architecture.mmd`, `diagrams/signup-sequence.puml`, `diagrams/watchlist-erd.mmd`).
- Create `.github/PULL_REQUEST_TEMPLATE.md` with the PR checklist.
- Create `docs/env.example.md` listing required env vars (NO secrets).

Tell me which of the three you want me to do next, or say "all" and I'll add them.


---

How this file is handled in this repo
- `sdlc.md` is intentionally kept locally and listed in `.gitignore` so it won't be pushed to remote by accident.
- If you want this file pushed instead, remove it from `.gitignore` and commit it.


End of document.
