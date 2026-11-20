import { useEffect, useState } from "react";
import { campaignPipelineStages, type CandidateStage } from "./campaignPipelineData";

export type WorkflowCandidate = { id: string; name: string; email: string; stage: CandidateStage };
import {
  MAX_CONDITIONS_LENGTH,
  UNUSUAL_SALARY_THRESHOLD,
  buildOfferEmail,
  canApproveOffers,
  canManageOffers,
  createId,
  formatDate,
  formatDateTime,
  formatSalary,
  offerApprovePermissionMessage,
  offerManagePermissionMessage,
  offerStatusLabels,
  offerStatusTones,
  useReferencesOffers,
  type CampaignViewer,
  type CandidateOffer,
  type OfferDetails,
  type WorkArrangement,
} from "./campaignReferencesOffersData";
import { EmailPreviewDialog, PermissionButton, WorkflowDialog } from "./campaignWorkflowUi";
import { Badge, Button, Icon } from "./ui";

type OfferDraft = Omit<OfferDetails, "monthlySalary"> & { monthlySalary: string };
type OfferErrors = Partial<Record<keyof OfferDraft, string>>;
const emptyDraft: OfferDraft = { monthlySalary: "", startDate: "", probation: "", noticePeriod: "", reportsTo: "", workArrangement: "", conditions: "" };
const arrangements: WorkArrangement[] = ["On site", "Hybrid", "Remote"];
const stageTitle = (stage: CandidateStage) => campaignPipelineStages.find(item => item.id === stage)?.title ?? stage;
const initials = (name: string) => name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();
const toDraft = (offer?: CandidateOffer): OfferDraft => offer ? {
  monthlySalary: offer.monthlySalary ? String(offer.monthlySalary) : "",
  startDate: offer.startDate,
  probation: offer.probation,
  noticePeriod: offer.noticePeriod,
  reportsTo: offer.reportsTo,
  workArrangement: offer.workArrangement,
  conditions: offer.conditions,
} : emptyDraft;

function validateOffer(draft: OfferDraft, complete: boolean): OfferErrors {
  const errors: OfferErrors = {};
  const salary = Number(draft.monthlySalary);
  if ((complete || draft.monthlySalary.trim()) && (!draft.monthlySalary.trim() || !Number.isFinite(salary) || salary <= 0)) errors.monthlySalary = "Enter a monthly salary greater than 0.";
  if (draft.conditions.length > MAX_CONDITIONS_LENGTH) errors.conditions = "Keep conditions to 2,000 characters or fewer.";
  if (!complete) return errors;
  if (!draft.startDate) errors.startDate = "Choose a start date.";
  else if (draft.startDate < new Date().toISOString().slice(0, 10)) errors.startDate = "The start date cannot be in the past.";
  if (!draft.probation.trim()) errors.probation = "Give the probation period.";
  if (!draft.noticePeriod.trim()) errors.noticePeriod = "Give the notice period.";
  if (!draft.reportsTo.trim()) errors.reportsTo = "Say who they will report to.";
  if (!draft.workArrangement) errors.workArrangement = "Choose a work arrangement.";
  return errors;
}

export default function CampaignOffersTab({ campaignId, roleTitle, candidates, onMoveCandidate, onSelectCandidate, viewer, focusCandidateId, onOfferSent }: {
  campaignId: string;
  roleTitle: string;
  candidates: WorkflowCandidate[];
  onMoveCandidate: (candidateId: string, stage: CandidateStage) => void;
  onSelectCandidate: (candidateId: string) => void;
  viewer: CampaignViewer;
  focusCandidateId?: string | null;
  onOfferSent?: (applicationId: string, offer: CandidateOffer) => void;
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
  const canManage = canManageOffers(viewer);
  const canApprove = canApproveOffers(viewer);
  const [editingFor, setEditingFor] = useState<string | null>(null);
  const [draft, setDraft] = useState<OfferDraft>(emptyDraft);
  const [errors, setErrors] = useState<OfferErrors>({});
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [sendId, setSendId] = useState<string | null>(null);
  const [sendError, setSendError] = useState("");
  const [notice, setNotice] = useState<{ candidateId: string; text: string } | null>(null);

  const offersFor = (candidateId: string) => store.data.offers
    .filter(offer => offer.candidateId === candidateId)
    .sort((left, right) => Date.parse(right.draftedAt) - Date.parse(left.draftedAt));
  const currentOffer = (candidateId: string) => {
    const offers = offersFor(candidateId);
    return offers.find(offer => offer.status !== "withdrawn") ?? offers[0];
  };
  const rows = candidates
    .filter(candidate => candidate.stage === "shortlist-approved" || candidate.stage === "reference-check" || candidate.stage === "offer" || store.data.offers.some(offer => offer.candidateId === candidate.id))
    .sort((left, right) => (right.stage === "offer" ? 1 : 0) - (left.stage === "offer" ? 1 : 0));
  const findOffer = (offerId: string | null) => store.data.offers.find(offer => offer.id === offerId);
  const withdrawOffer = findOffer(withdrawId);
  const sendOffer = findOffer(sendId);
  const sendCandidate = sendOffer ? candidates.find(candidate => candidate.id === sendOffer.candidateId) : undefined;

  const startEditing = (candidateId: string, from?: CandidateOffer) => {
    setEditingFor(candidateId);
    setDraft(toDraft(from));
    setErrors({});
    setNotice(null);
  };

  const updateDraft = (changes: Partial<OfferDraft>) => {
    setDraft(current => ({ ...current, ...changes }));
    setErrors(current => {
      const next = { ...current };
      (Object.keys(changes) as Array<keyof OfferDraft>).forEach(key => delete next[key]);
      return next;
    });
  };

  const saveOffer = (candidate: WorkflowCandidate, submit: boolean) => {
    if (!canManage) return;
    const validation = validateOffer(draft, submit);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    const existing = currentOffer(candidate.id);
    const editingDraft = existing?.status === "draft" ? existing : undefined;
    if (existing && existing.status !== "draft" && existing.status !== "withdrawn") {
      setNotice({ candidateId: candidate.id, text: "This offer has been submitted. Withdraw it to make changes." });
      return;
    }
    const now = new Date().toISOString();
    const details: OfferDetails = {
      monthlySalary: Number(draft.monthlySalary) || 0,
      startDate: draft.startDate,
      probation: draft.probation.trim(),
      noticePeriod: draft.noticePeriod.trim(),
      reportsTo: draft.reportsTo.trim(),
      workArrangement: draft.workArrangement,
      conditions: draft.conditions.trim(),
    };
    const previousStage: CandidateStage = editingDraft?.previousStage ?? (candidate.stage === "offer" ? "reference-check" : candidate.stage);
    const offer: CandidateOffer = {
      ...(editingDraft ?? { id: createId("offer"), campaignId, candidateId: candidate.id, draftedBy: viewer.name, draftedAt: now }),
      ...details,
      previousStage,
      status: submit ? "pending" : "draft",
      updatedAt: now,
      submittedAt: submit ? now : undefined,
    } as CandidateOffer;
    const saved = store.update(data => ({ ...data, offers: editingDraft ? data.offers.map(item => item.id === editingDraft.id ? offer : item) : [...data.offers, offer] }));
    if (!saved) {
      setNotice({ candidateId: candidate.id, text: "The offer could not be saved. Please try again." });
      return;
    }
    if (candidate.stage !== "offer") onMoveCandidate(candidate.id, "offer");
    setEditingFor(null);
    setNotice({ candidateId: candidate.id, text: submit ? "Offer submitted for approval." : `Draft saved.${candidate.stage !== "offer" ? ` ${candidate.name} moved to Offer.` : ""}` });
  };

  const changeOffer = (offer: CandidateOffer, changes: Partial<CandidateOffer>, message: string) => {
    const saved = store.update(data => ({ ...data, offers: data.offers.map(item => item.id === offer.id ? { ...item, ...changes, updatedAt: new Date().toISOString() } : item) }));
    setNotice({ candidateId: offer.candidateId, text: saved ? message : "The offer could not be updated. Please try again." });
    return saved;
  };

  const approve = (offer: CandidateOffer) => {
    if (!canApprove || offer.status !== "pending" || offer.draftedBy === viewer.name) return;
    changeOffer(offer, { status: "approved", approvedBy: viewer.name, approvedAt: new Date().toISOString() }, "Offer approved. The main recruiter can now preview and send it.");
  };

  const confirmWithdraw = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!withdrawOffer || !canManage) return;
    if (!withdrawReason.trim()) {
      setWithdrawError("Give a reason for withdrawing this offer.");
      return;
    }
    if (withdrawOffer.status === "sent") {
      setWithdrawError("This offer has been sent and can no longer be changed.");
      return;
    }
    const saved = changeOffer(withdrawOffer, { status: "withdrawn", withdrawnAt: new Date().toISOString(), withdrawnBy: viewer.name, withdrawReason: withdrawReason.trim() }, "Offer withdrawn.");
    if (!saved) return;
    const candidate = candidates.find(item => item.id === withdrawOffer.candidateId);
    if (candidate?.stage === "offer") {
      onMoveCandidate(candidate.id, withdrawOffer.previousStage);
      setNotice({ candidateId: candidate.id, text: `Offer withdrawn. ${candidate.name} moved back to ${stageTitle(withdrawOffer.previousStage)}.` });
    }
    setWithdrawId(null);
  };

  const confirmSend = () => {
    if (!sendOffer || !canManage) return;
    if (sendOffer.status !== "approved") {
      setSendError("Only an approved offer can be sent.");
      return;
    }
    if (changeOffer(sendOffer, { status: "sent", sentAt: new Date().toISOString() }, `Offer recorded as sent to ${sendCandidate?.name ?? "the candidate"}. Their email is in Messages.`)) {
      onOfferSent?.(sendOffer.candidateId, sendOffer);
      setSendId(null);
    }
  };

  return <section className="rf-workflow">
    <div className="rf-toolbar">
      <p className="rf-toolbar-note">Acting as <strong>{viewer.name}</strong>. Change who you are previewing with “Preview as” at the top of the campaign.</p>
      <div className="rf-summary" aria-label="Offer summary">
        {(["draft", "pending", "approved", "sent"] as const).map(status => <span key={status}><strong>{rows.filter(candidate => currentOffer(candidate.id)?.status === status).length}</strong> {offerStatusLabels[status].toLowerCase()}</span>)}
      </div>
    </div>
    {store.error && <p className="demo-storage-error" role="alert">{store.error}</p>}

    {!rows.length ? <section className="rf-empty">
      <span><Icon name="file" size={22}/></span>
      <h3>No candidates ready for an offer</h3>
      <p>Candidates at Shortlist approved, Reference check or Offer appear here. Saving an offer draft moves the candidate to the Offer stage.</p>
    </section> : <div className="rf-groups">{rows.map(candidate => {
      const offer = currentOffer(candidate.id);
      const referees = store.data.referees.filter(referee => referee.candidateId === candidate.id);
      const unanswered = referees.filter(referee => referee.status === "not-sent" || referee.status === "sent").length;
      const editing = editingFor === candidate.id;
      const drafter = offer?.draftedBy === viewer.name;
      const salaryHigh = offer && offer.monthlySalary > UNUSUAL_SALARY_THRESHOLD;
      return <article className="rf-group rf-offer" id={`rf-group-${candidate.id}`} key={candidate.id}>
        <header className="rf-group-header">
          <span className="rf-avatar">{initials(candidate.name)}</span>
          <div className="rf-group-title">
            <button type="button" className="rf-link-button" onClick={() => onSelectCandidate(candidate.id)}>{candidate.name}</button>
            <span><Badge tone={candidate.stage === "offer" ? "success" : "info"}>{stageTitle(candidate.stage)}</Badge>{offer && <Badge tone={offerStatusTones[offer.status]}>{offerStatusLabels[offer.status]}</Badge>}</span>
          </div>
          {(!offer || offer.status === "withdrawn") && !editing && <PermissionButton allowed={canManage} reason={offerManagePermissionMessage} variant="primary" icon="plus" onClick={() => startEditing(candidate.id, offer)}>{offer ? "Start a new offer" : "Draft offer"}</PermissionButton>}
        </header>

        <dl className="rf-offer-facts">
          <div><dt>Expected salary</dt><dd className="muted">Not captured</dd></div>
          <div><dt>References</dt><dd>{unanswered ? <span className="rf-warning-text"><Icon name="clock" size={14}/>{unanswered} referee{unanswered === 1 ? " hasn't" : "s haven't"} answered</span> : referees.length ? "All referees answered" : "No referees added"}</dd></div>
        </dl>
        {notice?.candidateId === candidate.id && <p className="rf-notice success" role="status">{notice.text}</p>}

        {editing && <form className="rf-form" onSubmit={event => { event.preventDefault(); saveOffer(candidate, false); }} noValidate>
          <h4>{offer?.status === "draft" ? "Edit offer draft" : "Draft an offer"}</h4>
          <div className="rf-form-grid">
            <OfferField label="Monthly salary (N$)" required error={errors.monthlySalary}><input type="number" min="1" step="any" inputMode="decimal" value={draft.monthlySalary} onChange={event => updateDraft({ monthlySalary: event.target.value })} aria-invalid={Boolean(errors.monthlySalary)}/></OfferField>
            <OfferField label="Start date" required error={errors.startDate}><input type="date" value={draft.startDate} onChange={event => updateDraft({ startDate: event.target.value })} aria-invalid={Boolean(errors.startDate)}/></OfferField>
            <OfferField label="Probation" required error={errors.probation}><input value={draft.probation} placeholder="e.g. 3 months" maxLength={80} onChange={event => updateDraft({ probation: event.target.value })} aria-invalid={Boolean(errors.probation)}/></OfferField>
            <OfferField label="Notice period" required error={errors.noticePeriod}><input value={draft.noticePeriod} placeholder="e.g. 1 month" maxLength={80} onChange={event => updateDraft({ noticePeriod: event.target.value })} aria-invalid={Boolean(errors.noticePeriod)}/></OfferField>
            <OfferField label="Reports to" required error={errors.reportsTo}><input value={draft.reportsTo} placeholder="e.g. Head of Design" maxLength={120} onChange={event => updateDraft({ reportsTo: event.target.value })} aria-invalid={Boolean(errors.reportsTo)}/></OfferField>
            <OfferField label="Work arrangement" required error={errors.workArrangement}><select value={draft.workArrangement} onChange={event => updateDraft({ workArrangement: event.target.value as WorkArrangement })} aria-invalid={Boolean(errors.workArrangement)}><option value="">Choose an arrangement</option>{arrangements.map(item => <option key={item}>{item}</option>)}</select></OfferField>
            <OfferField label="Conditions" error={errors.conditions} wide hint={`${draft.conditions.length}/${MAX_CONDITIONS_LENGTH}`}><textarea rows={3} value={draft.conditions} maxLength={MAX_CONDITIONS_LENGTH} placeholder="Optional, e.g. subject to a background check" onChange={event => updateDraft({ conditions: event.target.value })} aria-invalid={Boolean(errors.conditions)}/></OfferField>
          </div>
          {Number(draft.monthlySalary) > UNUSUAL_SALARY_THRESHOLD && <p className="rf-banner warning"><Icon name="target" size={16}/>Check the salary: it is unusually high.</p>}
          <div className="rf-form-actions">
            <Button variant="ghost" onClick={() => setEditingFor(null)}>Cancel</Button>
            <Button variant="secondary" type="submit">Save draft</Button>
            <Button onClick={() => saveOffer(candidate, true)}>Submit for approval</Button>
          </div>
        </form>}

        {offer && !editing && <section className={`rf-offer-card status-${offer.status}`}>
          <header><h4>{offer.status === "withdrawn" ? "Latest offer (withdrawn)" : "Current offer"}</h4><Badge tone={offerStatusTones[offer.status]}>{offerStatusLabels[offer.status]}</Badge></header>
          <dl className="rf-offer-details">
            <div><dt>Monthly salary</dt><dd>{offer.monthlySalary ? `${formatSalary(offer.monthlySalary)}/month` : "Not set"}</dd></div>
            <div><dt>Start date</dt><dd>{formatDate(offer.startDate || undefined)}</dd></div>
            <div><dt>Probation</dt><dd>{offer.probation || "—"}</dd></div>
            <div><dt>Notice period</dt><dd>{offer.noticePeriod || "—"}</dd></div>
            <div><dt>Reports to</dt><dd>{offer.reportsTo || "—"}</dd></div>
            <div><dt>Work arrangement</dt><dd>{offer.workArrangement || "—"}</dd></div>
            {offer.conditions && <div className="wide"><dt>Conditions</dt><dd>{offer.conditions}</dd></div>}
          </dl>
          {salaryHigh && offer.status !== "sent" && offer.status !== "withdrawn" && <p className="rf-banner warning"><Icon name="target" size={16}/>Check the salary: it is unusually high.</p>}
          {offer.status === "pending" && drafter && <p className="rf-banner info"><Icon name="users" size={16}/>You drafted this offer, so someone else must approve it.</p>}
          {(offer.status === "pending" || offer.status === "approved") && canManage && <p className="rf-banner"><Icon name="lock" size={16}/>This offer has been submitted. Withdraw it to make changes.</p>}
          {offer.status === "sent" && <p className="rf-banner success"><Icon name="check" size={16}/>This offer has been sent and can no longer be changed.</p>}
          {offer.status === "withdrawn" && <p className="rf-banner danger"><Icon name="close" size={16}/>Withdrawn {formatDate(offer.withdrawnAt)}{offer.withdrawnBy ? ` by ${offer.withdrawnBy}` : ""}. Reason: {offer.withdrawReason}</p>}

          <ul className="rf-audit">
            <li><span>Drafted by</span>{offer.draftedBy} · {formatDateTime(offer.draftedAt)}</li>
            {offer.submittedAt && <li><span>Submitted</span>{formatDateTime(offer.submittedAt)}</li>}
            {offer.approvedAt && <li><span>Approved by</span>{offer.approvedBy} · {formatDateTime(offer.approvedAt)}</li>}
            {offer.sentAt && <li><span>Sent</span>{formatDateTime(offer.sentAt)}</li>}
            {offer.withdrawnAt && <li><span>Withdrawn</span>{formatDateTime(offer.withdrawnAt)} · {offer.withdrawReason}</li>}
          </ul>

          {offer.status !== "sent" && offer.status !== "withdrawn" && <div className="rf-offer-actions">
            {offer.status === "draft" && <>
              <PermissionButton allowed={canManage} reason={offerManagePermissionMessage} icon="file" onClick={() => startEditing(candidate.id, offer)}>Edit</PermissionButton>
              <PermissionButton allowed={canManage} reason={offerManagePermissionMessage} variant="primary" onClick={() => { setDraft(toDraft(offer)); const validation = validateOffer(toDraft(offer), true); if (Object.keys(validation).length) { startEditing(candidate.id, offer); setErrors(validation); return; } changeOffer(offer, { status: "pending", submittedAt: new Date().toISOString() }, "Offer submitted for approval."); }}>Submit for approval</PermissionButton>
            </>}
            {offer.status === "pending" && <PermissionButton allowed={canApprove && !drafter} reason={!canApprove ? offerApprovePermissionMessage : "You drafted this offer, so someone else must approve it."} variant="primary" icon="check" onClick={() => approve(offer)}>Approve</PermissionButton>}
            {offer.status === "approved" && <PermissionButton allowed={canManage} reason={offerManagePermissionMessage} variant="primary" icon="mail" onClick={() => { setSendId(offer.id); setSendError(""); }}>Preview &amp; send</PermissionButton>}
            <PermissionButton allowed={canManage} reason={offerManagePermissionMessage} variant="danger" onClick={() => { setWithdrawId(offer.id); setWithdrawReason(""); setWithdrawError(""); }}>Withdraw</PermissionButton>
          </div>}
        </section>}

        {!offer && !editing && <div className="rf-group-empty">No offer yet. {canManage ? "Draft one when references are complete." : "The main recruiter drafts offers."}</div>}
      </article>;
    })}</div>}

    {withdrawOffer && <WorkflowDialog eyebrow="Withdraw offer" title={`Withdraw the offer for ${candidates.find(item => item.id === withdrawOffer.candidateId)?.name ?? "this candidate"}?`} onClose={() => setWithdrawId(null)}>
      <form className="rf-withdraw-form" onSubmit={confirmWithdraw} noValidate>
        <p className="rf-dialog-note">The candidate goes back to {stageTitle(withdrawOffer.previousStage)}. You can start a new offer afterwards.</p>
        <label className={`rf-field${withdrawError ? " has-error" : ""}`}><span>Reason<b aria-hidden="true">*</b></span><textarea rows={4} value={withdrawReason} maxLength={MAX_CONDITIONS_LENGTH} aria-required="true" aria-invalid={Boolean(withdrawError)} onChange={event => { setWithdrawReason(event.target.value); setWithdrawError(""); }} placeholder="Explain why the offer is being withdrawn."/>{withdrawError && <small role="alert">{withdrawError}</small>}</label>
        <div className="rf-form-actions"><Button variant="secondary" onClick={() => setWithdrawId(null)}>Cancel</Button><Button variant="danger" type="submit">Withdraw offer</Button></div>
      </form>
    </WorkflowDialog>}
    {sendOffer && sendCandidate && <EmailPreviewDialog
      eyebrow="Send offer"
      email={buildOfferEmail(sendOffer, sendCandidate, roleTitle)}
      actionLabel="Send offer"
      note="Mock preview. Sending marks the offer as Sent; no real email is sent. Sent offers can no longer be changed."
      error={sendError}
      onSend={confirmSend}
      onClose={() => setSendId(null)}
    />}
  </section>;
}

function OfferField({ label, required = false, error, hint, wide = false, children }: { label: string; required?: boolean; error?: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`rf-field${error ? " has-error" : ""}${wide ? " wide" : ""}`}>
    <span>{label}{required && <b aria-hidden="true">*</b>}{hint && <em>{hint}</em>}</span>
    {children}
    {error && <small role="alert">{error}</small>}
  </label>;
}
