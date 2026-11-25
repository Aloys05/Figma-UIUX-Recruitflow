import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Icon, type IconName } from "../ui";
import { ResultBadge } from "../campaign/CandidatePanel";
import { Avatar, Pill } from "../campaign/workspaceUi";
import { readApproverSession, signOutApprover } from "../campaign/approverInvites";
import {
  APPROVER_ORGANISATION,
  APPROVER_ROLES,
  DEFAULT_APPROVER,
  buildApprovalRequests,
  clearStoredDecisions,
  decidedAt,
  decisionsFor,
  formatDay,
  formatMoney,
  isRequestDecided,
  OFFER_DECISION,
  previewDecisions,
  previewOfferDecision,
  readStoredDecisions,
  requirementsSummary,
  writeStoredDecisions,
  type ApprovalRequest,
  type CandidateDecision,
  type DecisionMap,
  type ShortlistCandidate,
} from "./approverData";

const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

function go(path: string) {
  const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  window.history.pushState({}, "", `${basePath}${path.replace(/^\/+/, "")}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

const searchParam = (name: string) => new URLSearchParams(window.location.search).get(name);

function setSearchParam(name: string, value: string | null) {
  const url = new URL(window.location.href);
  if (value === null) url.searchParams.delete(name);
  else url.searchParams.set(name, value);
  window.history.replaceState({}, "", url);
}

/** Decisions shared by both screens, saved in browser storage. */
function useDecisions() {
  const [stored, setStored] = useState<DecisionMap>(readStoredDecisions);
  const update = (next: DecisionMap) => { setStored(next); writeStoredDecisions(next); };
  return {
    stored,
    setDecision: (requestId: string, candidateId: string, decision: CandidateDecision | null) => {
      const forRequest = { ...(stored[requestId] ?? {}) };
      if (decision) forRequest[candidateId] = decision;
      else delete forRequest[candidateId];
      update({ ...stored, [requestId]: forRequest });
    },
    reset: () => { clearStoredDecisions(); setStored({}); },
  };
}

export default function ApproverApp({ path }: { path: string }) {
  const shortlistMatch = path.match(/^\/approver\/shortlists\/([^/]+)$/);
  if (shortlistMatch) return <ShortlistDecisionPage requestId={decodeURIComponent(shortlistMatch[1])}/>;
  const offerMatch = path.match(/^\/approver\/offers\/([^/]+)$/);
  if (offerMatch) return <OfferDecisionPage requestId={decodeURIComponent(offerMatch[1])}/>;
  return <ApprovalsPage/>;
}

/* ------------------------------------------------------------------ */
/* Frame: logo, "Approvals", the person's name and sign out             */
/* ------------------------------------------------------------------ */

function ApproverFrame({ children }: { children: React.ReactNode }) {
  const person = readApproverSession() ?? DEFAULT_APPROVER;
  return <div className="ap-app">
    <header className="ap-header">
      <button type="button" className="ap-logo" onClick={() => go("/approver")} aria-label="RecruitFlow, go to Approvals">
        <span className="brand-symbol"><img src={asset("assets/recruitflow-logo.png")} alt=""/></span><span className="ap-logo-word">RecruitFlow</span>
      </button>
      <span className="ap-header-divider" aria-hidden="true"/>
      <span className="ap-header-title">Approvals</span>
      <span className="ap-header-person" title={person.email}><Avatar name={person.name}/><span className="ap-header-name">{person.name}</span></span>
      <Button variant="ghost" icon="logOut" className="ap-signout" onClick={() => { signOutApprover(); go("/approver/login"); }}>Sign out</Button>
    </header>
    <main className="ap-main">{children}</main>
  </div>;
}

function PreviewSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<[T, string]>; onChange: (value: T) => void }) {
  return <label className="ap-preview"><Icon name="eye" size={14}/>{label}<select value={value} onChange={event => onChange(event.target.value as T)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}

/* ------------------------------------------------------------------ */
/* D4.1 Approvals page                                                 */
/* ------------------------------------------------------------------ */

type ListTab = "waiting" | "decided";
type ListPreview = "live" | "empty";

function ApprovalsPage() {
  const { stored, reset } = useDecisions();
  const [tab, setTab] = useState<ListTab>(() => searchParam("tab") === "decided" ? "decided" : "waiting");
  const [preview, setPreview] = useState<ListPreview>(() => searchParam("state") === "empty" ? "empty" : "live");
  const requests = useMemo(() => preview === "empty" ? [] : buildApprovalRequests(), [preview]);

  const rows = requests.map(request => {
    const decisions = decisionsFor(request, stored);
    return { request, decisions, decided: isRequestDecided(request, decisions) };
  });
  const waiting = rows.filter(row => !row.decided).sort((a, b) => Date.parse(b.request.sentAt) - Date.parse(a.request.sentAt));
  const decided = rows.filter(row => row.decided).sort((a, b) => Date.parse(decidedAt(b.request, b.decisions) ?? "") - Date.parse(decidedAt(a.request, a.decisions) ?? ""));
  const shown = tab === "waiting" ? waiting : decided;
  const tabRefs = useRef<Record<ListTab, HTMLButtonElement | null>>({ waiting: null, decided: null });

  const chooseTab = (next: ListTab) => { setTab(next); setSearchParam("tab", next === "waiting" ? null : next); };
  const onTabKey = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const next = tab === "waiting" ? "decided" : "waiting";
    chooseTab(next);
    tabRefs.current[next]?.focus();
  };

  return <ApproverFrame>
    <div className="ap-page-head">
      <div>
        <span className="ap-eyebrow">{APPROVER_ORGANISATION}</span>
        <h1>Approvals</h1>
        <p>Shortlists and offers recruiters have sent you. You decide, and the recruiter takes it from there.</p>
      </div>
      <div className="ap-preview-row">
        <PreviewSelect label="Preview" value={preview} options={[["live", "With items"], ["empty", "Empty"]]} onChange={value => { setPreview(value); setSearchParam("state", value === "empty" ? "empty" : null); }}/>
        <button type="button" className="ap-reset" onClick={reset} title="Clear the decisions you made in this demo">Reset demo</button>
      </div>
    </div>

    <ApprovalsOverview waiting={waiting} decided={decided}/>

    <div className="ap-layout">
      <section className="ap-queue" aria-label="Approval requests">
        <div className="ap-tabs" role="tablist" aria-label="Approvals" onKeyDown={onTabKey}>
          {([["waiting", "Waiting for you", waiting.length], ["decided", "Decided", decided.length]] as const).map(([key, label, count]) =>
            <button key={key} ref={element => { tabRefs.current[key] = element; }} type="button" role="tab" id={`ap-tab-${key}`} aria-controls="ap-tabpanel" aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} className={tab === key ? "active" : ""} onClick={() => chooseTab(key)}>
              {label}<span className="ap-tab-count">{count}</span>
            </button>)}
        </div>
        <div id="ap-tabpanel" role="tabpanel" aria-labelledby={`ap-tab-${tab}`}>
          {shown.length === 0
            ? <EmptyState tab={tab}/>
            : <ul className="ap-items">{shown.map(row => <ApprovalItem key={row.request.id} request={row.request} decisions={row.decisions} decided={row.decided}/>)}</ul>}
        </div>
      </section>

      <aside className="ap-roles" aria-labelledby="ap-roles-title">
        <h2 id="ap-roles-title">Roles you approve for</h2>
        <p>Recruiters on these roles send their shortlists and offers to you.</p>
        <ul>{APPROVER_ROLES.map(role => {
          const open = waiting.filter(row => row.request.roleId === role.id).length;
          return <li key={role.id}>
            <span className="ap-role-icon"><Icon name="briefcase" size={16}/></span>
            <span className="ap-role-text"><strong>{role.title}</strong><small>Recruiter: {role.mainRecruiter}</small></span>
            {open > 0 ? <Pill tone="warning">{open} waiting</Pill> : <Pill tone={role.status === "Filled" ? "success" : "neutral"}>{role.status}</Pill>}
          </li>;
        })}</ul>
      </aside>
    </div>
  </ApproverFrame>;
}

type OverviewRow = { request: ApprovalRequest; decisions: Record<string, CandidateDecision>; decided: boolean };

function daysSince(iso: string) {
  const days = Math.floor((Date.now() - Date.parse(iso)) / (24 * 60 * 60 * 1000));
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
}

function ApprovalsOverview({ waiting, decided }: { waiting: OverviewRow[]; decided: OverviewRow[] }) {
  const waitingShortlists = waiting.filter(row => row.request.kind === "shortlist");
  const waitingOffers = waiting.filter(row => row.request.kind === "offer");
  const candidatesLeft = waitingShortlists.reduce((sum, row) => sum + row.request.candidates.filter(item => !row.decisions[item.id]).length, 0);
  const oldest = waiting.reduce<string | null>((min, row) => !min || Date.parse(row.request.sentAt) < Date.parse(min) ? row.request.sentAt : min, null);

  const madeDecisions = [...waiting, ...decided].flatMap(row => Object.values(row.decisions));
  const approvedCount = madeDecisions.filter(item => item.decision === "approved").length;
  const approvalRate = madeDecisions.length ? Math.round((approvedCount / madeDecisions.length) * 100) : null;

  const cards: Array<{ key: string; tone: "blue" | "amber" | "purple" | "green"; icon: IconName; label: string; value: string; note: string }> = [
    { key: "waiting", tone: "blue", icon: "bell", label: "Waiting for you", value: String(waiting.length),
      note: oldest ? `Oldest sent ${daysSince(oldest)}` : "You're all caught up" },
    { key: "shortlists", tone: "amber", icon: "users", label: "Shortlists to review", value: String(waitingShortlists.length),
      note: candidatesLeft ? `${candidatesLeft} candidate${candidatesLeft === 1 ? "" : "s"} to decide on` : "No candidates waiting" },
    { key: "offers", tone: "purple", icon: "file", label: "Offers awaiting sign-off", value: String(waitingOffers.length),
      note: waitingOffers[0]?.request.offer ? `Next: ${waitingOffers[0].request.offer.candidateName}` : "No offers waiting" },
    { key: "rate", tone: "green", icon: "check", label: "Approval rate", value: approvalRate === null ? "—" : `${approvalRate}%`,
      note: madeDecisions.length ? `${approvedCount} of ${madeDecisions.length} decisions approved` : "No decisions yet" },
  ];

  return <section className="ap-overview" aria-labelledby="ap-overview-title">
    <h2 id="ap-overview-title" className="ap-sr-only">Overview</h2>
    <ul>{cards.map(card => <li key={card.key} className={`ap-stat ${card.tone}`}>
      <span className="ap-stat-icon"><Icon name={card.icon} size={17}/></span>
      <span className="ap-stat-label">{card.label}</span>
      <strong className="ap-stat-value">{card.value}</strong>
      <span className="ap-stat-note">{card.note}</span>
    </li>)}</ul>
  </section>;
}

function EmptyState({ tab }: { tab: ListTab }) {
  return <div className="ap-empty">
    <span className="ap-empty-icon"><Icon name={tab === "waiting" ? "check" : "clock"} size={22}/></span>
    <h3>{tab === "waiting" ? "Nothing is waiting for you." : "Nothing decided yet."}</h3>
    <p>{tab === "waiting" ? "When a recruiter sends you a shortlist or an offer, it appears here and we email you." : "Shortlists and offers you decide on are kept here for your records."}</p>
  </div>;
}

function ApprovalItem({ request, decisions, decided }: { request: ApprovalRequest; decisions: Record<string, CandidateDecision>; decided: boolean }) {
  const isShortlist = request.kind === "shortlist";
  const total = request.candidates.length;
  const done = request.candidates.filter(item => decisions[item.id]).length;
  const approved = request.candidates.filter(item => decisions[item.id]?.decision === "approved").length;
  const detail = isShortlist ? `${total} candidates${!decided && done ? `, ${done} of ${total} decided` : ""}` : `For ${request.offer?.candidateName}${request.offer ? `, ${formatMoney(request.offer.salary)} a month` : ""}`;
  const open = () => go(`/approver/${isShortlist ? "shortlists" : "offers"}/${request.id}`);
  const offerDecision = decisions[OFFER_DECISION];
  const when = decided ? decidedAt(request, decisions) : null;

  let outcome: React.ReactNode = null;
  if (decided && isShortlist) outcome = <Pill tone={approved === total ? "success" : approved === 0 ? "danger" : "purple"}>{approved} approved, {total - approved} sent back</Pill>;
  if (decided && !isShortlist) outcome = <Pill tone={offerDecision?.decision === "approved" ? "success" : "danger"}>{offerDecision?.decision === "approved" ? "Approved" : "Sent back"}</Pill>;

  return <li className={`ap-item${decided ? " decided" : ""}`}>
    <span className={`ap-item-icon ${request.kind}`}><Icon name={isShortlist ? "users" : "file"} size={18}/></span>
    <div className="ap-item-main">
      <span className={`ap-kind ${request.kind}`}>{isShortlist ? "Shortlist" : "Offer"}</span>
      <h3>{request.roleTitle}</h3>
      <p>{detail}</p>
      {!decided && isShortlist && done > 0 && <span className="ap-mini-progress" aria-hidden="true"><i style={{ width: `${(done / total) * 100}%` }}/></span>}
    </div>
    <dl className="ap-item-meta">
      <div><dt>Sent by</dt><dd>{request.sentBy}</dd></div>
      <div><dt>{decided ? "Decided on" : "Sent on"}</dt><dd>{formatDay(decided && when ? when : request.sentAt)}</dd></div>
    </dl>
    <div className="ap-item-action">
      {outcome}
      <Button variant={decided ? "secondary" : "primary"} onClick={open}>{decided ? "View" : isShortlist && done ? "Continue" : "Review"}</Button>
    </div>
  </li>;
}

/* ------------------------------------------------------------------ */
/* D4.2 Shortlist decision                                             */
/* ------------------------------------------------------------------ */

type DecisionPreview = "live" | "undecided" | "mixed" | "finished";
const isDecisionPreview = (value: string | null): value is DecisionPreview => value === "undecided" || value === "mixed" || value === "finished";

function ShortlistDecisionPage({ requestId }: { requestId: string }) {
  const request = useMemo(() => buildApprovalRequests().find(item => item.id === requestId && item.kind === "shortlist") ?? null, [requestId]);
  const { stored, setDecision } = useDecisions();
  const [preview, setPreview] = useState<DecisionPreview>(() => { const value = searchParam("preview"); return isDecisionPreview(value) ? value : "live"; });
  const [previewMap, setPreviewMap] = useState<Record<string, CandidateDecision>>(() => request && preview !== "live" ? previewDecisions(request, preview) : {});

  if (!request) return <ApproverFrame>
    <div className="ap-empty ap-not-found">
      <span className="ap-empty-icon"><Icon name="search" size={22}/></span>
      <h3>We can't find that shortlist.</h3>
      <p>It may have been withdrawn by the recruiter.</p>
      <Button variant="secondary" onClick={() => go("/approver")}>Back to Approvals</Button>
    </div>
  </ApproverFrame>;

  const decisions = preview === "live" ? decisionsFor(request, stored) : previewMap;
  const decide = (candidateId: string, decision: CandidateDecision | null) => {
    if (preview === "live") { setDecision(request.id, candidateId, decision); return; }
    setPreviewMap(previous => { const next = { ...previous }; if (decision) next[candidateId] = decision; else delete next[candidateId]; return next; });
  };
  const choosePreview = (value: DecisionPreview) => {
    setPreview(value);
    setSearchParam("preview", value === "live" ? null : value);
    if (value !== "live") setPreviewMap(previewDecisions(request, value));
  };

  return <ApproverFrame>
    <ShortlistReview key={preview} request={request} decisions={decisions} onDecide={decide}
      previewControl={<PreviewSelect label="Preview" value={preview} options={[["live", "Live"], ["undecided", "Undecided"], ["mixed", "Mixed"], ["finished", "Finished"]]} onChange={choosePreview}/>}/>
  </ApproverFrame>;
}

function ShortlistReview({ request, decisions, onDecide, previewControl }: {
  request: ApprovalRequest;
  decisions: Record<string, CandidateDecision>;
  onDecide: (candidateId: string, decision: CandidateDecision | null) => void;
  previewControl: React.ReactNode;
}) {
  const candidates = request.candidates;
  const total = candidates.length;
  const firstOpen = candidates.find(item => !decisions[item.id])?.id ?? candidates[0]?.id;
  const [currentId, setCurrentId] = useState(firstOpen);
  const detailRef = useRef<HTMLDivElement>(null);
  const done = candidates.filter(item => decisions[item.id]).length;
  const approved = candidates.filter(item => decisions[item.id]?.decision === "approved").length;
  const sentBack = done - approved;
  const finished = done === total;
  const index = Math.max(0, candidates.findIndex(item => item.id === currentId));
  const current = candidates[index];

  const select = (id: string) => {
    setCurrentId(id);
    detailRef.current?.focus({ preventScroll: true });
    if (window.matchMedia("(max-width: 760px)").matches) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const record = (candidateId: string, decision: CandidateDecision) => {
    onDecide(candidateId, decision);
    const after = { ...decisions, [candidateId]: decision };
    const position = candidates.findIndex(item => item.id === candidateId);
    const next = [...candidates.slice(position + 1), ...candidates.slice(0, position)].find(item => !after[item.id]);
    if (next) select(next.id);
  };

  return <div className="ap-decision">
    <button type="button" className="ap-back" onClick={() => go("/approver")}><Icon name="arrow" size={14}/>Approvals</button>
    <header className="ap-decision-head">
      <div>
        <span className="ap-kind shortlist">Shortlist</span>
        <h1>{request.roleTitle}</h1>
        <p>Sent by <strong>{request.sentBy}</strong> on {formatDay(request.sentAt)}, {total} candidates</p>
      </div>
      {previewControl}
    </header>

    {request.note && <div className="ap-note"><Avatar name={request.sentBy}/><div><strong>Note from {request.sentBy}</strong><p>{request.note}</p></div></div>}

    <div className={`ap-progress${finished ? " finished" : ""}`} role="status" aria-live="polite">
      <div className="ap-progress-text">
        <strong>{done} of {total} decided</strong>
        <span>{approved} approved, {sentBack} sent back{finished ? "" : `, ${total - done} to go`}</span>
      </div>
      <div className="ap-progress-bar" aria-hidden="true">
        <i className="approved" style={{ width: `${(approved / total) * 100}%` }}/>
        <i className="sent-back" style={{ width: `${(sentBack / total) * 100}%` }}/>
      </div>
    </div>

    {finished
      ? <FinishedSummary request={request} decisions={decisions}/>
      : <div className="ap-review">
        <nav className="ap-rail" aria-label="Candidates on this shortlist">
          <ol>{candidates.map((item, position) => {
            const decision = decisions[item.id];
            const state = decision ? decision.decision : "open";
            return <li key={item.id}>
              <button type="button" className={`ap-rail-item ${state}${item.id === current.id ? " current" : ""}`} aria-current={item.id === current.id ? "step" : undefined} onClick={() => select(item.id)}>
                <span className="ap-rail-number">{position + 1}</span>
                <Avatar name={item.name}/>
                <span className="ap-rail-text"><strong>{item.name}</strong><small>{decision ? decision.decision === "approved" ? "Approved" : "Sent back" : "To decide"}</small></span>
                <span className="ap-rail-state" aria-hidden="true">{decision && <Icon name={decision.decision === "approved" ? "check" : "close"} size={12}/>}</span>
              </button>
            </li>;
          })}</ol>
        </nav>
        <div className="ap-detail-wrap" ref={detailRef} tabIndex={-1} aria-label={`${current.name}, candidate ${index + 1} of ${total}`}>
          <CandidateDetail key={current.id} candidate={current} position={index + 1} total={total} decision={decisions[current.id] ?? null}
            onDecide={decision => record(current.id, decision)} onUndo={() => onDecide(current.id, null)}
            onPrevious={index > 0 ? () => select(candidates[index - 1].id) : null}
            onNext={index < total - 1 ? () => select(candidates[index + 1].id) : null}/>
        </div>
      </div>}
  </div>;
}

function downloadCv(candidate: ShortlistCandidate) {
  const lines = [
    candidate.name,
    candidate.headline,
    `${candidate.location}, ${candidate.experienceYears} years' experience`,
    candidate.email,
    "",
    "This is a placeholder CV generated by the RecruitFlow demo.",
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = candidate.cvFileName.replace(/\.pdf$/, ".txt");
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CandidateDetail({ candidate, position, total, decision, onDecide, onUndo, onPrevious, onNext }: {
  candidate: ShortlistCandidate;
  position: number;
  total: number;
  decision: CandidateDecision | null;
  onDecide: (decision: CandidateDecision) => void;
  onUndo: () => void;
  onPrevious: (() => void) | null;
  onNext: (() => void) | null;
}) {
  const [sendingBack, setSendingBack] = useState(false);
  const [reason, setReason] = useState("");
  const [problem, setProblem] = useState("");
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const summary = requirementsSummary(candidate.requirements);
  const must = candidate.requirements.filter(item => item.mustHave);
  const preferred = candidate.requirements.filter(item => !item.mustHave);

  useEffect(() => { if (sendingBack) reasonRef.current?.focus(); }, [sendingBack]);

  const confirmSendBack = () => {
    if (!reason.trim()) { setProblem("Add a reason so the recruiter knows why."); reasonRef.current?.focus(); return; }
    onDecide({ decision: "sent-back", reason: reason.trim(), decidedAt: new Date().toISOString() });
  };

  const requirementGroup = (title: string, items: typeof must) => items.length > 0 && <div className="ap-req-group">
    <h4>{title}</h4>
    <ul>{items.map(item => <li key={item.name}>
      <div className="ap-req-top"><span>{item.name}</span><ResultBadge status={item.status}/></div>
      <p>{item.reason}</p>
    </li>)}</ul>
  </div>;

  return <article className="ap-detail">
    <header className="ap-detail-head">
      <Avatar name={candidate.name} size="md"/>
      <div className="ap-detail-id">
        <span className="ap-step">Candidate {position} of {total}</span>
        <h2>{candidate.name}</h2>
        <p>{candidate.headline}, {candidate.location}, {candidate.experienceYears} yrs</p>
      </div>
      <Pill tone={summary.tone}>{summary.label}</Pill>
    </header>

    <section className="ap-section" aria-labelledby={`ap-req-${candidate.id}`}>
      <h3 id={`ap-req-${candidate.id}`}>Requirement results</h3>
      {requirementGroup("Must have", must)}
      {requirementGroup("Preferred", preferred)}
    </section>

    <section className="ap-section" aria-labelledby={`ap-ans-${candidate.id}`}>
      <h3 id={`ap-ans-${candidate.id}`}>Application answers</h3>
      <dl className="ap-answers">{candidate.answers.map(item => <div key={item.question}><dt>{item.question}</dt><dd>{item.answer}</dd></div>)}</dl>
    </section>

    <section className="ap-section ap-cv" aria-label="CV">
      <span className="ap-cv-icon"><Icon name="file" size={20}/></span>
      <span className="ap-cv-text"><strong>{candidate.cvFileName}</strong><small>PDF, {candidate.cvSize}</small></span>
      <Button variant="secondary" icon="download" className="ap-cv-download" onClick={() => downloadCv(candidate)}>Download CV</Button>
    </section>

    <footer className={`ap-decide${decision ? ` decided ${decision.decision}` : ""}`}>
      {decision ? <div className="ap-decided">
        <span className="ap-decided-icon"><Icon name={decision.decision === "approved" ? "check" : "close"} size={16}/></span>
        <div>
          <strong>{decision.decision === "approved" ? "You approved this candidate." : "You sent this candidate back."}</strong>
          {decision.reason && <p>Reason: {decision.reason}</p>}
        </div>
        <button type="button" className="ap-link" onClick={onUndo}>Change decision</button>
      </div>
      : sendingBack ? <div className="ap-sendback">
        <label htmlFor={`ap-reason-${candidate.id}`}>Why are you sending {candidate.name.split(" ")[0]} back? <span className="ap-required">Required</span></label>
        <textarea id={`ap-reason-${candidate.id}`} ref={reasonRef} rows={3} value={reason} aria-invalid={Boolean(problem)} aria-describedby={problem ? `ap-reason-error-${candidate.id}` : `ap-reason-hint-${candidate.id}`}
          placeholder="For example: needs more people-management experience for this level."
          onChange={event => { setReason(event.target.value); if (problem) setProblem(""); }}/>
        {problem ? <p className="ap-error" id={`ap-reason-error-${candidate.id}`} role="alert">{problem}</p> : <p className="ap-hint" id={`ap-reason-hint-${candidate.id}`}>The recruiter sees this reason. The candidate does not.</p>}
        <div className="ap-decide-buttons">
          <Button variant="secondary" onClick={() => { setSendingBack(false); setProblem(""); }}>Cancel</Button>
          <Button variant="danger" onClick={confirmSendBack}>Send back</Button>
        </div>
      </div>
      : <div className="ap-decide-row">
        <p>Your decision on {candidate.name.split(" ")[0]}</p>
        <div className="ap-decide-buttons">
          <Button variant="secondary" icon="close" className="ap-btn-sendback" onClick={() => setSendingBack(true)}>Send back</Button>
          <Button variant="primary" icon="check" onClick={() => onDecide({ decision: "approved", reason: "", decidedAt: new Date().toISOString() })}>Approve</Button>
        </div>
      </div>}
    </footer>

    <nav className="ap-pager" aria-label="Move between candidates">
      <button type="button" className="ap-link" disabled={!onPrevious} onClick={onPrevious ?? undefined}><span className="ap-flip"><Icon name="arrow" size={14}/></span>Previous</button>
      <button type="button" className="ap-link" disabled={!onNext} onClick={onNext ?? undefined}>Next<Icon name="arrow" size={14}/></button>
    </nav>
  </article>;
}

function FinishedSummary({ request, decisions }: { request: ApprovalRequest; decisions: Record<string, CandidateDecision> }) {
  const approved = request.candidates.filter(item => decisions[item.id]?.decision === "approved");
  const sentBack = request.candidates.filter(item => decisions[item.id]?.decision === "sent-back");
  const when = decidedAt(request, decisions);
  return <section className="ap-finished" aria-labelledby="ap-finished-title">
    <header>
      <span className="ap-finished-icon"><Icon name="check" size={24}/></span>
      <div>
        <h2 id="ap-finished-title">Shortlist decided</h2>
        <p>You approved {approved.length} and sent back {sentBack.length}{when ? ` on ${formatDay(when)}` : ""}. {request.sentBy} has been told{approved.length ? ", and approved candidates move on to reference checks" : ""}.</p>
      </div>
    </header>
    <ul className="ap-finished-list">{request.candidates.map(item => {
      const decision = decisions[item.id];
      return <li key={item.id}>
        <Avatar name={item.name}/>
        <span className="ap-finished-text"><strong>{item.name}</strong><small>{item.headline}</small>{decision?.reason && <span className="ap-finished-reason">{decision.reason}</span>}</span>
        <Pill tone={decision?.decision === "approved" ? "success" : "danger"}>{decision?.decision === "approved" ? "Approved" : "Sent back"}</Pill>
      </li>;
    })}</ul>
    <footer><Button variant="primary" onClick={() => go("/approver")}>Back to Approvals</Button></footer>
  </section>;
}

/* ------------------------------------------------------------------ */
/* D4.3 Offer decision                                                 */
/* ------------------------------------------------------------------ */

type OfferPreview = "live" | "undecided" | "approved" | "sent-back";
const isOfferPreview = (value: string | null): value is OfferPreview => value === "undecided" || value === "approved" || value === "sent-back";

function OfferDecisionPage({ requestId }: { requestId: string }) {
  const request = useMemo(() => buildApprovalRequests().find(item => item.id === requestId && item.kind === "offer") ?? null, [requestId]);
  const { stored, setDecision } = useDecisions();
  const [preview, setPreview] = useState<OfferPreview>(() => { const value = searchParam("preview"); return isOfferPreview(value) ? value : "live"; });
  const [previewDecision, setPreviewDecision] = useState<CandidateDecision | null>(() => preview === "live" ? null : previewOfferDecision(preview));

  if (!request?.offer) return <ApproverFrame>
    <div className="ap-empty ap-not-found">
      <span className="ap-empty-icon"><Icon name="search" size={22}/></span>
      <h3>We can't find that offer.</h3>
      <p>It may have been withdrawn by the recruiter.</p>
      <Button variant="secondary" onClick={() => go("/approver")}>Back to Approvals</Button>
    </div>
  </ApproverFrame>;

  const decision = preview === "live" ? decisionsFor(request, stored)[OFFER_DECISION] ?? null : previewDecision;
  const decide = (next: CandidateDecision | null) => {
    if (preview === "live") setDecision(request.id, OFFER_DECISION, next);
    else setPreviewDecision(next);
  };
  const choosePreview = (value: OfferPreview) => {
    setPreview(value);
    setSearchParam("preview", value === "live" ? null : value);
    if (value !== "live") setPreviewDecision(previewOfferDecision(value));
  };

  return <ApproverFrame>
    <OfferReview key={preview} request={request} decision={decision} onDecide={decide}
      previewControl={<PreviewSelect label="Preview" value={preview} options={[["live", "Live"], ["undecided", "Undecided"], ["approved", "Approved"], ["sent-back", "Sent back"]]} onChange={choosePreview}/>}/>
  </ApproverFrame>;
}

function daysUntil(iso: string) {
  return Math.ceil((Date.parse(iso) - Date.now()) / (24 * 60 * 60 * 1000));
}

function OfferReview({ request, decision, onDecide, previewControl }: {
  request: ApprovalRequest;
  decision: CandidateDecision | null;
  onDecide: (decision: CandidateDecision | null) => void;
  previewControl: React.ReactNode;
}) {
  const offer = request.offer!;
  const first = offer.candidateName.split(" ")[0];
  const recruiterFirst = request.sentBy.split(" ")[0];
  const [step, setStep] = useState<"choose" | "confirm" | "send-back">("choose");
  const [reason, setReason] = useState("");
  const [problem, setProblem] = useState("");
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const left = daysUntil(offer.respondBy);

  useEffect(() => { if (step === "send-back") reasonRef.current?.focus(); }, [step]);

  const approve = () => { onDecide({ decision: "approved", reason: "", decidedAt: new Date().toISOString() }); setStep("choose"); };
  const sendBack = () => {
    if (!reason.trim()) { setProblem("Add a reason so the recruiter knows what to change."); reasonRef.current?.focus(); return; }
    onDecide({ decision: "sent-back", reason: reason.trim(), decidedAt: new Date().toISOString() });
    setStep("choose");
  };

  // Same fields and order as the recruiter's offer card.
  const terms: Array<[string, string]> = [
    ["Monthly salary", `${formatMoney(offer.salary)}/month`],
    ["Start date", offer.startDate],
    ["Probation", offer.probation],
    ["Notice period", offer.noticePeriod],
    ["Reports to", offer.reportsTo],
    ["Work arrangement", offer.workArrangement],
  ];

  return <div className="ap-decision">
    <button type="button" className="ap-back" onClick={() => go("/approver")}><Icon name="arrow" size={14}/>Approvals</button>
    <header className="ap-decision-head">
      <div>
        <span className="ap-kind offer">Offer</span>
        <h1>{request.roleTitle}</h1>
        <p>Sent by <strong>{request.sentBy}</strong> on {formatDay(request.sentAt)}, for <strong>{offer.candidateName}</strong></p>
      </div>
      {previewControl}
    </header>

    <div className="ap-offer">
      <article className="ap-detail ap-offer-main">
        <header className="ap-detail-head">
          <Avatar name={offer.candidateName} size="md"/>
          <div className="ap-detail-id">
            <span className="ap-step">Candidate</span>
            <h2>{offer.candidateName}</h2>
            <p>{offer.headline}, {offer.location}</p>
          </div>
        </header>

        <section className="ap-section" aria-labelledby="ap-offer-details">
          <h3 id="ap-offer-details">Offer</h3>
          <dl className="ap-offer-details">
            {terms.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}
            {offer.conditions && <div className="wide"><dt>Conditions</dt><dd>{offer.conditions}</dd></div>}
          </dl>
        </section>
      </article>

      <aside className={`ap-offer-side${decision ? ` decided ${decision.decision}` : ""}`} aria-labelledby="ap-offer-decision-title">
        <h2 id="ap-offer-decision-title">Your decision</h2>
        <dl className="ap-offer-summary">
          <div><dt>Salary</dt><dd>{formatMoney(offer.salary)} <small>/ month</small></dd></div>
          <div><dt>Starts</dt><dd>{offer.startDate}</dd></div>
          <div><dt>Candidate needs an answer</dt><dd className={!decision && left <= 3 ? "urgent" : ""}>{left > 1 ? `In ${left} days` : left === 1 ? "Tomorrow" : left === 0 ? "Today" : formatDay(offer.respondBy)}</dd></div>
        </dl>

        <div className="ap-offer-decide" aria-live="polite">
          {decision ? <div className="ap-offer-done">
            <span className="ap-decided-icon"><Icon name={decision.decision === "approved" ? "check" : "close"} size={16}/></span>
            <strong>{decision.decision === "approved" ? "You approved this offer." : "You sent this offer back."}</strong>
            <p>{decision.decision === "approved"
              ? `${request.sentBy} has been told and can now send it to ${first}.`
              : `${request.sentBy} has been told and will rework it. ${first} hasn't seen anything.`}</p>
            {decision.reason && <p className="ap-offer-reason">{decision.reason}</p>}
            <small>Decided on {formatDay(decision.decidedAt)}. Offer decisions are final.</small>
            <div className="ap-offer-done-actions">
              <Button variant="primary" onClick={() => go("/approver")}>Back to Approvals</Button>
            </div>
          </div>
          : step === "confirm" ? <div className="ap-offer-confirm">
            <strong>Approve this offer?</strong>
            <p>{request.sentBy} can then send {first} an offer of <b>{formatMoney(offer.salary)} a month</b>, starting {offer.startDate}. You can't change this afterwards.</p>
            <div className="ap-offer-buttons">
              <Button variant="secondary" onClick={() => setStep("choose")}>Cancel</Button>
              <Button variant="primary" icon="check" onClick={approve}>Yes, approve</Button>
            </div>
          </div>
          : step === "send-back" ? <div className="ap-sendback">
            <label htmlFor="ap-offer-reason">What should {recruiterFirst} change? <span className="ap-required">Required</span></label>
            <textarea id="ap-offer-reason" ref={reasonRef} rows={4} value={reason} aria-invalid={Boolean(problem)} aria-describedby={problem ? "ap-offer-reason-error" : "ap-offer-reason-hint"}
              placeholder="For example: please bring the salary down to NAD 55,000, or explain why we should go above."
              onChange={event => { setReason(event.target.value); if (problem) setProblem(""); }}/>
            {problem ? <p className="ap-error" id="ap-offer-reason-error" role="alert">{problem}</p> : <p className="ap-hint" id="ap-offer-reason-hint">{recruiterFirst} sees this. {first} does not.</p>}
            <div className="ap-offer-buttons">
              <Button variant="secondary" onClick={() => { setStep("choose"); setProblem(""); }}>Cancel</Button>
              <Button variant="danger" onClick={sendBack}>Send back</Button>
            </div>
          </div>
          : <div className="ap-offer-buttons stacked">
            <Button variant="primary" icon="check" onClick={() => setStep("confirm")}>Approve offer</Button>
            <Button variant="secondary" icon="close" className="ap-btn-sendback" onClick={() => setStep("send-back")}>Send back</Button>
            <p className="ap-hint">Nothing goes to {first} until you approve.</p>
          </div>}
        </div>
      </aside>
    </div>
  </div>;
}
