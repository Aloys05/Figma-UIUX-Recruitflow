# Route inventory

## Phase 0
- `/` — sign-in screen
- `/login` — sign-in screen
- `/recruiter` — recruiter overview
- `/recruiter/campaigns` — campaigns list
- `/candidate` — candidate overview
- `/candidate/jobs` — job board
- `/candidate/applications` — candidate applications
- `/public/campaign/1` — public campaign application page
- `/invitation/:inviteId` — recruiter invitation sign-up; a successful sign-up consumes the one-time local demo invite

## Phase 1 (D1)
- `/recruiter/settings/team` — owner team management page, with owner/recruiter view variants
- `/recruiter/settings/business` — business profile settings, with owner/recruiter view variants
- `/recruiter/evaluations` — AI evaluation settings, with owner/recruiter view variants
- `/recruiter/campaigns?view=recruiter` — recruiter campaign list; add `&state=empty` to preview the no-campaigns state
- `/recruiter/candidates?view=recruiter` — candidates in the recruiter's campaigns; add `&state=empty` to preview the empty state
- `/style-guide` — shared component and token guide
- `/approver` — standalone approver approvals page, outside the recruiter workspace shell

## Phase 3 (D3)
- `/recruiter/campaigns/:id/edit#campaign-edit-team` — Team section: main recruiter, additional recruiters, approver. Use "Preview as" for the main recruiter and additional recruiter (read-only) versions
- `/recruiter/campaigns/:id/edit?approverState=none|sent|failed|refused|accepted|replacing` — open the approver group in one of its six designed states (also the "Preview state" menu)
- `/approver-invite/:token` — approver invitation page. Demo tokens: `demo` (valid), `demo-expired`, `demo-used`; any other unknown token shows "link not valid"
- `/approver-invite/demo?preview=new|existing|signed-in|other|invalid|expired|used` — open one version of the invitation page (also the "Preview" menu)
- Campaign workspace `?tab=overview|shortlists|offers` — shows the no-approver warning when the campaign has no approver; Propose shortlist and Submit for approval are disabled with the same reason
- Demo rule: an approver email ending in `.invalid` simulates "email could not be sent"

## Phase 4 (D4) — Approver app
- `/approver` — Approvals page in its own frame (logo, "Approvals", the approver's name, Sign out; no recruiter navigation). Tabs Waiting for you and Decided, plus Roles you approve for
- `/approver?tab=decided` — open the Decided tab
- `/approver?state=empty` — both tabs empty ("Nothing is waiting for you."); also the "Preview" menu
- `/approver/shortlists/:id` — shortlist decision, candidate by candidate: requirement results, application answers, Download CV, Approve or Send back with a required reason, progress and a finished state. Demo ids: `sl-spd` (5 candidates), `sl-fe` (1 of 3 already decided), `sl-da` (finished)
- `/approver/shortlists/sl-spd?preview=undecided|mixed|finished` — open one designed state (also the "Preview" menu). Preview decisions are not saved
- `/approver` overview — four summary cards above the tabs: Waiting for you, Shortlists to review, Offers awaiting sign-off, Approval rate
- `/approver/offers/:id` — offer decision: candidate, offer details in the same plain layout as the recruiter's offer card (salary, start date, probation, notice period, reports to, work arrangement, conditions), and a decision panel (Approve with a confirm step, or Send back with a required reason). Demo ids: `of-csl` (waiting), `of-da` (approved)
- `/approver/offers/of-csl?preview=undecided|approved|sent-back` — open one designed state (also the "Preview" menu). Preview decisions are not saved
- Demo rule: decisions made in Live mode are kept in browser storage, so a finished shortlist or offer moves to Decided. "Reset demo" on the Approvals page clears them
- The signed-in approver's name comes from the approver invitation sign-in (D3); otherwise the demo approver Maria Shilongo is shown

## Phase 5 (D5) — Workflow tabs after the Longlist
Open a campaign as the main recruiter (e.g. `/recruiter/campaigns/1`) and use the tabs. "Preview as" at the top switches between main recruiter, additional recruiter and approver.
- `?tab=shortlists` — D5.1 Propose a shortlist. Select candidates (the bar turns blue and counts them), name the shortlist, Propose shortlist. No approver picker: it goes to the campaign's approver. Each shortlist shows Waiting for approval, Approved, or Partly sent back / Sent back with each candidate's reason. Blocked state: the propose bar and button lock when the campaign has no approver (D3.4)
- `?tab=references` — D5.2 References. Candidate picker on the left (chosen candidate highlighted in blue with a tick), Add referee, Preview & send (request sent), View answers (reference received and its content), empty state when nobody is past the shortlist
- `?tab=offers` — D5.3 Offers. Candidate picker, offer form, Submit for approval. States: Draft, Waiting for approval, Approved, Sent, Sent back. Demo: Sara Nguyen is waiting for approval; Mateo Silva's offer was sent back, and the approver's reason shows until it is submitted again. Preview as the approver to Approve or Send back (reason required)
- `?tab=messages` — D5.4 Messages. Write a message: template list, To (candidate), wording that starts from that candidate's real email, Customise wording, Preview, Send, Confirm send. Outbox: everything queued, sent or failed. As the additional recruiter you can prepare and Save to outbox but not send
- Demo rule: workspace and reference/offer data moved to new storage keys (`.v2`), so the demo re-seeds once with these states
