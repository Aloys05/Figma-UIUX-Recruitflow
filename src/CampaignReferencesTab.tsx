import { useEffect, useState } from "react";
import { campaignPipelineStages, type CandidateStage } from "./campaignPipelineData";

export type WorkflowCandidate = { id: string; name: string; email: string; stage: CandidateStage };
import {
  MAX_REFEREES,
  buildRefereeEmail,
  canManageReferences,
  createId,
  formatDate,
  getRefereeDisplayStatus,
  getRefereeLink,
  referenceQuestions,
  referenceStages,
  refereeStatusTones,
  referencesPermissionMessage,
  useReferencesOffers,
  type CampaignViewer,
  type Referee,
} from "./campaignReferencesOffersData";
import { EmailPreviewDialog, PermissionButton, WorkflowDialog } from "./campaignWorkflowUi";
import { Badge, Button, Icon } from "./ui";

type RefereeDraft = { name: string; relationship: string; company: string; email: string };
type RefereeErrors = Partial<Record<keyof RefereeDraft, string>>;
const emptyDraft: RefereeDraft = { name: "", relationship: "", company: "", email: "" };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const stageTitle = (stage: CandidateStage) => campaignPipelineStages.find(item => item.id === stage)?.title ?? stage;
const initials = (name: string) => name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();

export default function CampaignReferencesTab({ campaignId, roleTitle, candidates, onMoveCandidate, onSelectCandidate, viewer, focusCandidateId }: {
  campaignId: string;
  roleTitle: string;
  candidates: WorkflowCandidate[];
  onMoveCandidate: (candidateId: string, stage: CandidateStage) => void;
  onSelectCandidate: (candidateId: string) => void;
  viewer: CampaignViewer;
  focusCandidateId?: string | null;
}) {
  const store = useReferencesOffers(campaignId, roleTitle);
  useEffect(() => {
    if (!focusCandidateId) return;
    const element = document.getElementById(`rf-group-${focusCandidateId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
    element?.classList.add("rf-focus");
    const timer = window.setTimeout(() => element?.classList.remove("rf-focus"), 2400);
    return () => window.clearTimeout(timer);
  }, [focusCandidateId]);
  const allowed = canManageReferences(viewer);
  const eligible = candidates.filter(candidate => referenceStages.includes(candidate.stage));
  const earlier = candidates.filter(candidate => ["longlist", "below-requirements", "shortlist-proposed"].includes(candidate.stage)).length;

  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [draft, setDraft] = useState<RefereeDraft>(emptyDraft);
  const [errors, setErrors] = useState<RefereeErrors>({});
  const [formError, setFormError] = useState("");
  const [emailFor, setEmailFor] = useState<{ refereeId: string; reminder: boolean } | null>(null);
  const [emailError, setEmailError] = useState("");
  const [answersFor, setAnswersFor] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ candidateId: string; text: string; tone: "success" | "error" } | null>(null);

  const refereesFor = (candidateId: string) => store.data.referees.filter(referee => referee.candidateId === candidateId);
  const findReferee = (refereeId: string) => store.data.referees.find(referee => referee.id === refereeId);
  const emailReferee = emailFor ? findReferee(emailFor.refereeId) : undefined;
  const answersReferee = answersFor ? findReferee(answersFor) : undefined;
  const allReferees = store.data.referees.filter(referee => eligible.some(candidate => candidate.id === referee.candidateId));
  const outstanding = allReferees.filter(referee => ["Sent", "Overdue"].includes(getRefereeDisplayStatus(referee))).length;
  const overdue = allReferees.filter(referee => getRefereeDisplayStatus(referee) === "Overdue").length;

  const openAddForm = (candidateId: string) => {
    setAddingFor(candidateId);
    setDraft(emptyDraft);
    setErrors({});
    setFormError("");
    setNotice(null);
  };

  const addReferee = (event: React.FormEvent<HTMLFormElement>, candidate: WorkflowCandidate) => {
    event.preventDefault();
    if (!allowed) return;
    if (!referenceStages.includes(candidate.stage)) {
      setFormError("References start after the shortlist is approved.");
      return;
    }
    const existing = refereesFor(candidate.id);
    if (existing.length >= MAX_REFEREES) {
      setFormError("A candidate can have up to 5 referees.");
      return;
    }
    const next: RefereeErrors = {};
    if (!draft.name.trim()) next.name = "Give the referee's name.";
    if (!draft.relationship.trim()) next.relationship = "Say how they know the candidate.";
    if (!draft.company.trim()) next.company = "Give the referee's company.";
    if (!emailPattern.test(draft.email.trim())) next.email = "Give a valid email address.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const duplicate = existing.find(referee => referee.email.toLowerCase() === draft.email.trim().toLowerCase());
    if (duplicate) {
      setFormError(duplicate.status === "responded" || duplicate.status === "declined"
        ? "This referee has already answered."
        : duplicate.status === "sent"
          ? "This request has already been sent. Chase it instead."
          : "This referee is already on the list.");
      return;
    }
    const now = new Date().toISOString();
    const saved = store.update(data => ({
      ...data,
      referees: [...data.referees, {
        id: createId("ref"),
        token: createId("tok").replace(/^tok-/, ""),
        campaignId,
        candidateId: candidate.id,
        candidateName: candidate.name,
        roleTitle,
        name: draft.name.trim().slice(0, 120),
        relationship: draft.relationship.trim().slice(0, 80),
        company: draft.company.trim().slice(0, 120),
        email: draft.email.trim().toLowerCase(),
        status: "not-sent",
        addedAt: now,
        addedBy: viewer.name,
      }],
    }));
    if (!saved) {
      setFormError("The referee could not be saved. Please try again.");
      return;
    }
    const movedToReferences = candidate.stage === "shortlist-approved" && existing.length === 0;
    if (movedToReferences) onMoveCandidate(candidate.id, "reference-check");
    setAddingFor(null);
    setDraft(emptyDraft);
    setNotice({ candidateId: candidate.id, tone: "success", text: `${draft.name.trim()} added. Send the request when you are ready.${movedToReferences ? ` ${candidate.name} moved to Reference check.` : ""}` });
  };

  const openEmail = (referee: Referee, reminder: boolean) => {
    setEmailFor({ refereeId: referee.id, reminder });
    setEmailError("");
    setNotice(null);
  };

  const sendEmail = () => {
    if (!emailFor || !emailReferee || !allowed) return;
    const latest = findReferee(emailFor.refereeId);
    if (!latest) return;
    if (latest.status === "responded" || latest.status === "declined") {
      setEmailError("This referee has already answered.");
      return;
    }
    if (!emailFor.reminder && latest.status === "sent") {
      setEmailError("This request has already been sent. Chase it instead.");
      return;
    }
    const now = new Date().toISOString();
    const saved = store.update(data => ({
      ...data,
      referees: data.referees.map(referee => referee.id === latest.id ? {
        ...referee,
        status: "sent",
        sentAt: referee.sentAt ?? now,
        lastSentAt: now,
        // A reminder carries a new link; the old one stops working.
        token: emailFor.reminder ? createId("tok").replace(/^tok-/, "") : referee.token,
        reminderCount: emailFor.reminder ? (referee.reminderCount ?? 0) + 1 : referee.reminderCount,
      } : referee),
    }));
    if (!saved) {
      setEmailError("The request could not be sent. Please try again.");
      return;
    }
    setNotice({ candidateId: latest.candidateId, tone: "success", text: `${emailFor.reminder ? "Reminder sent to " + latest.name + " with a new link. The old link no longer works." : "Reference request sent to " + latest.name + "."} This mock does not send real email.` });
    setEmailFor(null);
  };

  const markChecked = (referee: Referee) => {
    if (!allowed || referee.status !== "responded") return;
    store.update(data => ({ ...data, referees: data.referees.map(item => item.id === referee.id ? { ...item, checkedBy: viewer.name, checkedAt: new Date().toISOString() } : item) }));
  };

  return <section className="rf-workflow">
    <div className="rf-toolbar">
      <p className="rf-toolbar-note">Acting as <strong>{viewer.name}</strong>. Change who you are previewing with “Preview as” at the top of the campaign.</p>
      <div className="rf-summary" aria-label="Reference summary">
        <span><strong>{eligible.length}</strong> candidates</span>
        <span><strong>{allReferees.length}</strong> referees</span>
        <span><strong>{outstanding}</strong> awaiting answers</span>
        <span className={overdue ? "warning" : ""}><strong>{overdue}</strong> overdue</span>
      </div>
    </div>
    {!allowed && <p className="rf-banner info"><Icon name="lock" size={16}/>{referencesPermissionMessage}</p>}
    {store.error && <p className="demo-storage-error" role="alert">{store.error}</p>}
    {earlier > 0 && eligible.length > 0 && <p className="rf-banner"><Icon name="clock" size={16}/>{earlier} more candidate{earlier === 1 ? " is" : "s are"} earlier in the pipeline. References start after the shortlist is approved.</p>}

    {!eligible.length ? <section className="rf-empty">
      <span><Icon name="users" size={22}/></span>
      <h3>No candidates ready for references</h3>
      <p>References start after the shortlist is approved. Candidates at Shortlist approved, Reference check or Offer will appear here.</p>
    </section> : <div className="rf-groups">{eligible.map(candidate => {
      const referees = refereesFor(candidate.id);
      const atLimit = referees.length >= MAX_REFEREES;
      const groupNotice = notice?.candidateId === candidate.id ? notice : null;
      return <article className="rf-group" id={`rf-group-${candidate.id}`} key={candidate.id}>
        <header className="rf-group-header">
          <span className="rf-avatar">{initials(candidate.name)}</span>
          <div className="rf-group-title">
            <button type="button" className="rf-link-button" onClick={() => onSelectCandidate(candidate.id)}>{candidate.name}</button>
            <span><Badge tone={candidate.stage === "offer" ? "success" : candidate.stage === "reference-check" ? "info" : "neutral"}>{stageTitle(candidate.stage)}</Badge><small>{referees.length} of {MAX_REFEREES} referees</small></span>
          </div>
          <PermissionButton allowed={allowed} reason={referencesPermissionMessage} icon="plus" onClick={() => openAddForm(candidate.id)} disabled={atLimit || addingFor === candidate.id}>Add referee</PermissionButton>
        </header>
        {atLimit && <p className="rf-inline-note">A candidate can have up to 5 referees.</p>}
        {groupNotice && <p className={`rf-notice ${groupNotice.tone}`} role="status">{groupNotice.text}</p>}

        {addingFor === candidate.id && allowed && <form className="rf-form" onSubmit={event => addReferee(event, candidate)} noValidate>
          <h4>Add a referee</h4>
          {candidate.stage === "shortlist-approved" && referees.length === 0 && <p className="rf-inline-note">Adding the first referee moves {candidate.name} to Reference check.</p>}
          <div className="rf-form-grid">
            <RefereeField label="Name" required value={draft.name} maxLength={120} error={errors.name} onChange={value => { setDraft(current => ({ ...current, name: value })); setErrors(current => ({ ...current, name: undefined })); setFormError(""); }}/>
            <RefereeField label="Relationship" required placeholder="e.g. Line manager" value={draft.relationship} maxLength={80} error={errors.relationship} onChange={value => { setDraft(current => ({ ...current, relationship: value })); setErrors(current => ({ ...current, relationship: undefined })); setFormError(""); }}/>
            <RefereeField label="Company" required value={draft.company} maxLength={120} error={errors.company} onChange={value => { setDraft(current => ({ ...current, company: value })); setErrors(current => ({ ...current, company: undefined })); setFormError(""); }}/>
            <RefereeField label="Email" required type="email" placeholder="name@company.com" value={draft.email} maxLength={254} error={errors.email} onChange={value => { setDraft(current => ({ ...current, email: value })); setErrors(current => ({ ...current, email: undefined })); setFormError(""); }}/>
          </div>
          {formError && <p className="campaign-status-error" role="alert">{formError}</p>}
          <div className="rf-form-actions"><Button variant="secondary" onClick={() => setAddingFor(null)}>Cancel</Button><Button type="submit">Add referee</Button></div>
        </form>}

        {referees.length ? <ul className="rf-referee-list">{referees.map(referee => {
          const status = getRefereeDisplayStatus(referee);
          return <li className="rf-referee" key={referee.id}>
            <div className="rf-referee-main">
              <div className="rf-referee-name"><strong>{referee.name}</strong><Badge tone={refereeStatusTones[status]}>{status}</Badge></div>
              <p>{referee.relationship} · {referee.company}</p>
              <a href={`mailto:${referee.email}`}>{referee.email}</a>
            </div>
            <dl className="rf-referee-dates">
              <div><dt>Sent</dt><dd>{formatDate(referee.lastSentAt ?? referee.sentAt)}{referee.reminderCount ? <small> · {referee.reminderCount} reminder{referee.reminderCount === 1 ? "" : "s"}</small> : null}</dd></div>
              <div><dt>Responded</dt><dd>{formatDate(referee.respondedAt)}</dd></div>
            </dl>
            {referee.checkedBy && <p className="rf-checked"><Icon name="check" size={14}/>Checked by {referee.checkedBy} · {formatDate(referee.checkedAt)}</p>}
            <div className="rf-referee-actions">
              {status === "Not sent" && <PermissionButton allowed={allowed} reason={referencesPermissionMessage} variant="primary" icon="mail" onClick={() => openEmail(referee, false)}>Preview &amp; send</PermissionButton>}
              {(status === "Sent" || status === "Overdue") && <PermissionButton allowed={allowed} reason={referencesPermissionMessage} variant={status === "Overdue" ? "primary" : "secondary"} icon="bell" onClick={() => openEmail(referee, true)}>Preview &amp; chase</PermissionButton>}
              {(status === "Sent" || status === "Overdue") && <a className="rf-demo-link" href={getRefereeLink(referee.token)} target="_blank" rel="noreferrer"><Icon name="external" size={13}/>Open referee form (demo)</a>}
              {status === "Responded" && <Button variant="secondary" icon="eye" onClick={() => setAnswersFor(referee.id)}>View answers</Button>}
              {status === "Responded" && !referee.checkedBy && <PermissionButton allowed={allowed} reason={referencesPermissionMessage} icon="check" onClick={() => markChecked(referee)}>Mark as checked</PermissionButton>}
            </div>
          </li>;
        })}</ul> : addingFor !== candidate.id && <div className="rf-group-empty">No referees yet. Add up to {MAX_REFEREES} referees for {candidate.name}.</div>}
      </article>;
    })}</div>}

    {emailFor && emailReferee && <EmailPreviewDialog
      eyebrow={emailFor.reminder ? "Chase referee" : "Send reference request"}
      email={buildRefereeEmail(emailReferee, emailFor.reminder)}
      actionLabel={emailFor.reminder ? "Send reminder" : "Send"}
      linkLabel="Give a reference"
      note="Mock preview. Sending updates the referee's status but no real email is sent."
      error={emailError}
      onSend={sendEmail}
      onClose={() => setEmailFor(null)}
    />}
    {answersReferee && <WorkflowDialog eyebrow={`Reference for ${answersReferee.candidateName}`} title={`${answersReferee.name}'s answers`} onClose={() => setAnswersFor(null)} wide footer={<>
      <Button variant="secondary" onClick={() => setAnswersFor(null)}>Close</Button>
      {!answersReferee.checkedBy && <PermissionButton allowed={allowed} reason={referencesPermissionMessage} variant="primary" icon="check" onClick={() => markChecked(answersReferee)}>Mark as checked</PermissionButton>}
    </>}>
      <p className="rf-dialog-note">{answersReferee.relationship} at {answersReferee.company} · Responded {formatDate(answersReferee.respondedAt)}{answersReferee.checkedBy ? ` · Checked by ${answersReferee.checkedBy} · ${formatDate(answersReferee.checkedAt)}` : ""}</p>
      <ol className="rf-answers">{referenceQuestions.map((question, index) => <li key={question}><strong>{question}</strong><p>{answersReferee.answers?.[index]?.trim() || "No answer given."}</p></li>)}</ol>
    </WorkflowDialog>}
  </section>;
}

function RefereeField({ label, value, onChange, error, maxLength, required = false, type = "text", placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maxLength: number;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  const id = `referee-${label.toLowerCase()}`;
  return <label className={`rf-field${error ? " has-error" : ""}`} htmlFor={id}>
    <span>{label}{required && <b aria-hidden="true">*</b>}</span>
    <input id={id} type={type} value={value} maxLength={maxLength} placeholder={placeholder} aria-required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={event => onChange(event.target.value)}/>
    {error && <small id={`${id}-error`} role="alert">{error}</small>}
  </label>;
}
