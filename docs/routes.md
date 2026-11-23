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
