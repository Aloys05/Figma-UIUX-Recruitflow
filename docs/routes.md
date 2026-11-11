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
