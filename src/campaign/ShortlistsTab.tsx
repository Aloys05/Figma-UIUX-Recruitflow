import { useMemo, useState } from "react";
import { WorkflowDialog } from "../campaignWorkflowUi";
import CandidatePanel from "./CandidatePanel";
import { Button, Icon } from "../ui";
import type { CampaignActor } from "./permissions";
import { Avatar, CriteriaChips, FitBadge, GuardedButton, NotAvailableButton, Pill, ProposeDialog, type ApproverOption } from "./workspaceUi";
import { screenApplication, timeAgo, type CampaignWorkspaceStore, type ProposalItemDecision, type ProposalStatus, type ShortlistProposal, type WorkspaceApplication, type WorkspaceRequirement } from "./workspaceStore";

const proposalTone = (status: ProposalStatus) => status === "Pending approval" ? "warning" : status === "Approved" ? "success" : status === "Returned" ? "info" : status === "Partially approved" ? "purple" : "neutral";

export default function ShortlistsTab({ store, requirements, actor, approvers, offerStatusFor, onOpenOverview }: {
  store: CampaignWorkspaceStore;
  requirements: readonly WorkspaceRequirement[];
  actor: CampaignActor;
  approvers: readonly ApproverOption[];
  offerStatusFor: (applicationId: string) => string | null;
  onOpenOverview: () => void;
}) {
  const { applications, proposals } = store.data;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [withdrawTarget, setWithdrawTarget] = useState<ShortlistProposal | null>(null);
  const [approvalId, setApprovalId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [view, setView] = useState<"side-by-side" | "overlap">("side-by-side");
  const [showTop, setShowTop] = useState(5);

  const longlist = useMemo(() => applications.filter(item => item.stage === "longlist").map(item => ({ item, screening: screenApplication(item, requirements) })), [applications, requirements]);
  const requirementsRanked = useMemo(() => [...longlist].sort((a, b) => {
    const aScore = a.screening.mustHave.met * 10 + a.screening.preferredCriteria.met;
    const bScore = b.screening.mustHave.met * 10 + b.screening.preferredCriteria.met;
    return bScore !== aScore ? bScore - aScore : b.item.fitScore - a.item.fitScore;
  }).slice(0, showTop), [longlist, showTop]);
  const aiRanked = useMemo(() => [...longlist].sort((a, b) => b.item.fitScore - a.item.fitScore).slice(0, showTop), [longlist, showTop]);
  const requirementIds = new Set(requirementsRanked.map(entry => entry.item.id));
  const aiIds = new Set(aiRanked.map(entry => entry.item.id));
  const inBoth = requirementsRanked.filter(entry => aiIds.has(entry.item.id));
  const requirementsOnly = requirementsRanked.filter(entry => !aiIds.has(entry.item.id));
  const aiOnly = aiRanked.filter(entry => !requirementIds.has(entry.item.id));
  const shownProposals = [...proposals].sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt)).filter(item => statusFilter === "all" || item.status === statusFilter);
  const toggle = (id: string) => setSelectedIds(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  const profile = applications.find(item => item.id === profileId) ?? null;

  const row = (entry: { item: WorkspaceApplication; screening: ReturnType<typeof screenApplication> }, index: number, mode: "requirements" | "ai") => <div className="cw-rank-row" key={entry.item.id}>
    <span className="cw-rank">{index + 1}</span>
    <input type="checkbox" checked={selectedIds.includes(entry.item.id)} onChange={() => toggle(entry.item.id)} aria-label={`Select ${entry.item.name}`}/>
    <Avatar name={entry.item.name}/>
    <span className="cw-rank-name"><button type="button" className="cw-name-link" onClick={() => setProfileId(entry.item.id)}>{entry.item.name}</button><small>{entry.item.headline}</small></span>
    <span className="cw-rank-meta"><FitBadge value={entry.item.skillsMatch.percentage}/><small>{mode === "requirements" ? `${entry.screening.mustHave.met}/${entry.screening.mustHave.total} must have, ${entry.screening.preferredCriteria.met}/${entry.screening.preferredCriteria.total} preferred` : `${entry.item.skillsMatch.matched} of ${entry.item.skillsMatch.total} skills`}</small></span>
  </div>;

  const overlapGroup = (title: string, text: string, tone: string, entries: typeof inBoth) => <section className="campaign-shortlist-list cw-overlap-group">
    <header><h3>{title}</h3><span className={`cw-count ${tone}`}>{entries.length}</span></header>
    <p>{text}</p>
    {entries.length === 0 ? <p className="cw-muted">Nobody is on this list alone.</p> : entries.map((entry, index) => row(entry, index, "requirements"))}
  </section>;

  if (approvalId) {
    return <div className="cw-approvals-wrap">
      <ApprovalsScreen store={store} requirements={requirements} actor={actor} initialProposalId={approvalId} onOpenCampaign={onOpenOverview} onOpenProfile={setProfileId} onDone={() => setApprovalId(null)}/>
      <Button variant="secondary" className="cw-back" onClick={() => setApprovalId(null)}>Back to shortlists</Button>
      {profile && <CandidatePanel application={profile} requirements={requirements} offerStatus={offerStatusFor(profile.id)} store={store} actor={actor} onClose={() => setProfileId(null)}/>}
    </div>;
  }

  return <section className="campaign-shortlists-screen">
    <div className="campaign-shortlist-toolbar">
      <div className="campaign-shortlist-view" role="group" aria-label="Shortlist comparison view">
        <button type="button" className={view === "side-by-side" ? "active" : ""} aria-pressed={view === "side-by-side"} onClick={() => setView("side-by-side")}>Side by side</button>
        <button type="button" className={view === "overlap" ? "active" : ""} aria-pressed={view === "overlap"} onClick={() => setView("overlap")}>Overlap</button>
      </div>
      <label>Show top<select value={showTop} onChange={event => setShowTop(Number(event.target.value))}>{[3, 5, 10, 20].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
    </div>
    {view === "side-by-side" ? <div className="campaign-shortlist-columns">
      <section className="campaign-shortlist-list"><header><h3>Requirements shortlist</h3><span>Your criteria</span></header><p>Weighted by the must haves you set. Preferred criteria break ties.</p>{requirementsRanked.length ? requirementsRanked.map((entry, index) => row(entry, index, "requirements")) : <div className="campaign-shortlist-empty">No longlisted candidates to rank yet.</div>}</section>
      <section className="campaign-shortlist-list"><header><h3>AI shortlist</h3><span>Fit score</span></header><p>Ranked by the same fit score shown on every application.</p>{aiRanked.length ? aiRanked.map((entry, index) => row(entry, index, "ai")) : <div className="campaign-shortlist-empty">No longlisted candidates to rank yet.</div>}</section>
    </div> : <div className="cw-overlap">
      {overlapGroup("In both lists", "The safest candidates to put in front of a manager, because both orderings agree.", "success", inBoth)}
      {overlapGroup("Requirements only", "They tick your boxes but the evidence behind the role is thinner.", "info", requirementsOnly)}
      {overlapGroup("AI only", "Strong on evidence, but something you asked for is missing or unverified. These are the ones worth a second look.", "warning", aiOnly)}
    </div>}
    <div className="campaign-propose-row"><p>Pick from either list. They become one proposed shortlist, which still goes to a line manager for a decision.</p><GuardedButton role={actor.role} action="propose" variant="primary" disabled={selectedIds.length === 0} onClick={() => setProposeOpen(true)}>{`Propose ${selectedIds.length} selected`}</GuardedButton></div>

    <div className="campaign-proposals-header"><h3>Proposals</h3><select aria-label="Proposal status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{["Pending approval", "Approved", "Returned", "Partially approved", "Withdrawn"].map(status => <option key={status}>{status}</option>)}</select></div>
    {shownProposals.length ? <ul className="cw-proposals">{shownProposals.map(proposal => <li key={proposal.id} className="cw-proposal">
      <header><div><h4>{proposal.name}</h4><p>Version {proposal.version}, submitted by {proposal.submittedBy} {timeAgo(proposal.submittedAt)}, approver {proposal.approverName}</p></div><Pill tone={proposalTone(proposal.status)}>{proposal.status}</Pill></header>
      <ul className="cw-list">{proposal.applicationIds.map(id => {
        const application = applications.find(item => item.id === id);
        if (!application) return null;
        const decision = proposal.decisions[id];
        return <li key={id}><span className="cw-person"><Avatar name={application.name}/><span><strong>{application.name}</strong><small>{application.headline}</small></span></span><Pill tone={!decision ? "warning" : decision.decision === "Approved" ? "success" : "danger"}>{!decision ? "Awaiting decision" : decision.decision}</Pill></li>;
      })}</ul>
      {proposal.note && <p className="cw-note-box">{proposal.note}</p>}
      {proposal.withdrawalReason && <p className="cw-muted">Withdrawn: {proposal.withdrawalReason}</p>}
      <footer>
        {proposal.status === "Pending approval" ? <GuardedButton role={actor.role} action="propose" onClick={() => setWithdrawTarget(proposal)}>Withdraw proposal</GuardedButton> : <span/>}
        <span className="cw-proposal-end">
          {proposal.status === "Pending approval" && <Button onClick={() => setApprovalId(proposal.id)}>Open approval</Button>}
          {proposal.decidedBy && <small>Decided by {proposal.decidedBy} on {new Date(proposal.decidedAt ?? "").toLocaleString()}</small>}
        </span>
      </footer>
    </li>)}</ul> : <div className="campaign-proposals-empty">No information found</div>}

    {proposeOpen && <ProposeDialog applications={applications.filter(item => selectedIds.includes(item.id))} requirements={requirements} approvers={approvers} onCancel={() => setProposeOpen(false)} onConfirm={input => { store.proposeShortlist({ ...input, applicationIds: selectedIds }, actor); setSelectedIds([]); setProposeOpen(false); }}/>}
    {withdrawTarget && <WithdrawProposalDialog proposal={withdrawTarget} onCancel={() => setWithdrawTarget(null)} onConfirm={reason => { store.withdrawProposal(withdrawTarget.id, reason, actor); setWithdrawTarget(null); }}/>}
    {profile && <CandidatePanel application={profile} requirements={requirements} offerStatus={offerStatusFor(profile.id)} store={store} actor={actor} onClose={() => setProfileId(null)}/>}
  </section>;
}

function WithdrawProposalDialog({ proposal, onCancel, onConfirm }: { proposal: ShortlistProposal; onCancel: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return <WorkflowDialog title="Withdraw proposal?" onClose={onCancel} footer={<><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button variant="danger" onClick={() => onConfirm(reason.trim())}>Withdraw proposal</Button></>}>
    <p className="rf-dialog-note">{proposal.name}. The candidates go back to Longlist.</p>
    <label className="rf-field"><span>Reason (optional)</span><textarea rows={2} value={reason} onChange={event => setReason(event.target.value)}/></label>
  </WorkflowDialog>;
}

function ApprovalsScreen({ store, requirements, actor, initialProposalId, onOpenCampaign, onOpenProfile, onDone }: {
  store: CampaignWorkspaceStore;
  requirements: readonly WorkspaceRequirement[];
  actor: CampaignActor;
  initialProposalId: string;
  onOpenCampaign: () => void;
  onOpenProfile: (applicationId: string) => void;
  onDone: () => void;
}) {
  const { proposals, applications } = store.data;
  const [selectedId, setSelectedId] = useState(initialProposalId);
  const [decisions, setDecisions] = useState<Record<string, ProposalItemDecision>>({});
  const [problem, setProblem] = useState("");
  const proposal = proposals.find(item => item.id === selectedId);
  if (!proposal) return <div className="rf-empty"><h3>Nothing to approve</h3><p>There are no proposals for this campaign.</p></div>;
  const blocked = store.canDecide(proposal, actor);
  const submitter = proposal.submittedById === actor.id || proposal.submittedBy === actor.name;
  const decided = proposal.status !== "Pending approval";
  const canSubmit = !blocked && !decided && proposal.applicationIds.every(id => decisions[id]);
  const decide = (id: string, decision: "Approved" | "Returned") => { setProblem(""); setDecisions(previous => ({ ...previous, [id]: { decision, comment: previous[id]?.comment ?? "" } })); };

  return <div className="cw-approvals">
    <header className="cw-approvals-head">
      <div><span className="eyebrow">Approvals</span><h3>{proposal.name}</h3><p>Version {proposal.version}, submitted by {proposal.submittedBy} {timeAgo(proposal.submittedAt)}</p></div>
      <Button variant="secondary" onClick={onOpenCampaign}>Open campaign</Button>
    </header>
    {proposals.length > 1 && <div className="cw-proposal-chips">{proposals.map(item => <button type="button" key={item.id} className={item.id === selectedId ? "on" : ""} aria-pressed={item.id === selectedId} onClick={() => { setSelectedId(item.id); setDecisions({}); setProblem(""); }}>{item.name} v{item.version}, {item.status}</button>)}</div>}
    {blocked && !decided && <div className="rf-banner warning cw-stack-banner"><Icon name="lock" size={16}/><div><strong>You cannot decide this proposal</strong><p>Only the assigned line manager or an administrator can approve a shortlist.</p>{submitter && <p>You submitted this, so someone else must approve it.</p>}</div></div>}
    {proposal.note && <div className="cw-note-box"><span className="cw-section-label">Note from {proposal.submittedBy}</span><p>{proposal.note}</p></div>}
    <ul className="cw-approval-cards">{proposal.applicationIds.map(id => {
      const application = applications.find(item => item.id === id);
      if (!application) return null;
      const screening = screenApplication(application, requirements);
      const current = decided ? proposal.decisions[id] : decisions[id];
      const notMet = screening.criteria.filter(item => item.status === "Not met").length;
      const unverified = screening.unverified;
      const summary = notMet ? `One or more stated requirements were not met.${unverified ? ` ${unverified} still need verification before a decision.` : " Recruiter review is still required before any decision."}` : unverified ? `Meets the requirements that could be checked. ${unverified} still need verification before a decision.` : "Meets all must-have and preferred criteria.";
      const requirementsScore = screening.mustHave.total ? Math.round((screening.mustHave.met / screening.mustHave.total) * 100) : 0;
      return <li key={id} className="cw-approval-card">
        <header>
          <span className="cw-person"><Avatar name={application.name} size="md"/><span><button type="button" className="cw-name-link" onClick={() => onOpenProfile(application.id)}>{application.name}</button><small>{application.headline}{application.location ? `, ${application.location}` : ""}{application.experienceYears ? `, ${application.experienceYears} yrs` : ""}</small></span></span>
          <span className="cw-chips"><FitBadge value={application.fitScore}/>{notMet ? <Pill tone="danger">Requirement not met</Pill> : unverified ? <Pill tone="warning">Needs verification</Pill> : null}{current && <Pill tone={current.decision === "Approved" ? "success" : "info"}>{current.decision}</Pill>}</span>
        </header>
        <CriteriaChips criteria={screening.criteria}/>
        <p>{summary}</p>
        <p className="cw-muted">Requirements score {requirementsScore}%, {screening.mustHave.met} of {screening.mustHave.total} must haves met.</p>
        <footer>
          <span className="cw-row-actions"><NotAvailableButton>View CV</NotAvailableButton><button type="button" className="cw-mini-btn" onClick={() => onOpenProfile(application.id)}>Full profile</button></span>
          {!decided && <span className="cw-row-actions">
            <GuardedButton role={actor.role} action="approveShortlist" extraBlock={blocked} variant={current?.decision === "Approved" ? "primary" : "secondary"} onClick={() => decide(id, "Approved")}>Approve</GuardedButton>
            <GuardedButton role={actor.role} action="approveShortlist" extraBlock={blocked} variant={current?.decision === "Returned" ? "danger" : "secondary"} onClick={() => decide(id, "Returned")}>Return</GuardedButton>
          </span>}
        </footer>
        {current?.decision === "Returned" && <label className="rf-field"><span>Return comment (required)</span><textarea rows={3} value={current.comment} disabled={decided || Boolean(blocked)} placeholder="Explain why this candidate is being returned…" onChange={event => { const comment = event.target.value; setDecisions(previous => ({ ...previous, [id]: { decision: "Returned", comment } })); }}/></label>}
      </li>;
    })}</ul>
    {!decided && !blocked && <div className="cw-decision-bar">
      <p>Approving records your name, the date and any comments against each candidate. Returned candidates go back to the recruiter with their comment.</p>
      <span className="cw-row-actions">
        <Button variant="secondary" onClick={() => setDecisions(Object.fromEntries(proposal.applicationIds.map(id => [id, { decision: "Returned", comment: decisions[id]?.comment ?? "" }])))}>Return all</Button>
        <Button disabled={!canSubmit} onClick={() => {
          if (proposal.applicationIds.some(id => decisions[id].decision === "Returned" && !decisions[id].comment.trim())) { setProblem("Add a return comment for every returned candidate."); return; }
          if (store.decideProposal(proposal.id, decisions, actor)) onDone();
        }}>Submit decision</Button>
      </span>
      {problem && <p className="campaign-status-error" role="alert">{problem}</p>}
    </div>}
    {decided && <div className="cw-decision-box">
      <span className="cw-section-label">Decision</span>
      <p>{proposal.status === "Withdrawn" ? `Withdrawn on ${new Date(proposal.withdrawnAt ?? "").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.` : `${proposal.status} by ${proposal.decidedBy ?? "Unknown"} on ${proposal.decidedAt ? new Date(proposal.decidedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "an unknown date"}, ${proposal.decidedAt ? new Date(proposal.decidedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}.`}</p>
      <p className="cw-muted">Changing an approved shortlist creates a new version. This one stays on the record.</p>
    </div>}
  </div>;
}
