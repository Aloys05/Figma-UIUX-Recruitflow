import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Icon } from "../ui";
import { canPerform, type CampaignActor } from "./permissions";
import { Avatar, GuardedButton, Pill, ReasonDialog } from "./workspaceUi";
import {
  applicationStatusLabel,
  screenApplication,
  type ApplicationScreening,
  type CampaignWorkspaceStore,
  type CriterionStatus,
  type ScreenedCriterion,
  type WorkspaceApplication,
  type WorkspaceRequirement,
} from "./workspaceStore";

type PanelTab = "Overview" | "Evaluation" | "Decision" | "Download Results";
const TABS: PanelTab[] = ["Overview", "Evaluation", "Decision", "Download Results"];

export const resultLabel = (status: CriterionStatus) => status === "Unverified" ? "Needs verification" : status;

/** The three clearly different result badges: a tick, a clock and a cross. */
export function ResultBadge({ status }: { status: CriterionStatus }) {
  const tone = status === "Met" ? "met" : status === "Unverified" ? "verify" : "not-met";
  return <span className={`cw-result ${tone}`}><Icon name={status === "Met" ? "check" : status === "Unverified" ? "clock" : "close"} size={13}/>{resultLabel(status)}</span>;
}

/** "Moved by screening" or "Overridden by recruiter", where they apply. */
export function OverrideLabel({ application }: { application: WorkspaceApplication }) {
  if (application.overridden) return <span className="cw-origin overridden">Overridden by recruiter</span>;
  if (application.stage === "below-requirements") return <span className="cw-origin screening">Moved by screening</span>;
  return null;
}

export function screeningStatusText(application: WorkspaceApplication, screening: ApplicationScreening) {
  if (screening.screeningPending) return "Screening…";
  if (screening.screeningFailed) return "Screening failed";
  return screening.unverified ? "Needs verification" : "Screening complete";
}

export default function CandidatePanel({ application, requirements, offerStatus, store, actor, onClose }: {
  application: WorkspaceApplication;
  requirements: readonly WorkspaceRequirement[];
  offerStatus?: string | null;
  store: CampaignWorkspaceStore;
  actor: CampaignActor;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<PanelTab>("Overview");
  const [overrideOpen, setOverrideOpen] = useState(false);
  const screening = screenApplication(application, requirements);
  const status = screeningStatusText(application, screening);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !overrideOpen) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); };
  }, [onClose, overrideOpen]);

  const download = () => {
    const lines = [
      `Candidate: ${application.name}`,
      `Email: ${application.email}`,
      `Stage: ${applicationStatusLabel(application.stage)}`,
      `Requirements score: ${screening.requirementsScore}%`,
      `AI fit: ${application.fitScore}%`,
      `Must-haves met: ${screening.mustHave.met} of ${screening.mustHave.total}`,
      `Screening: ${status}`,
      "",
      ...screening.criteria.flatMap(item => [
        `${item.name} — ${resultLabel(item.status)}${item.mustHave ? " (Must-have)" : " (Preferred)"}`,
        `Reason: ${item.reason}`,
        `Where it came from: ${item.source}`,
        ...(item.correction ? [`Corrected by ${item.correction.who} on ${new Date(item.correction.correctedAt).toLocaleString()}. Original answer: ${resultLabel(item.correction.originalResult)} (${item.correction.originalSource}) — ${item.correction.originalReason}`] : []),
        "",
      ]),
      application.screeningError ? `Screening note: ${application.screeningError}` : "",
    ].filter(line => line !== undefined);
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${application.id}-screening-results.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return createPortal(<div className="campaign-candidate-panel-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="campaign-candidate-panel cw-drawer cw-panel-v2" role="dialog" aria-modal="true" aria-labelledby="cw-panel-title">
      <header className="campaign-candidate-panel-header">
        <div className="cw-drawer-id"><Avatar name={application.name} size="md"/><div>
          <h2 id="cw-panel-title">{application.name}</h2>
          <p>{application.headline}{application.location ? `, ${application.location}` : ""}{application.experienceYears ? `, ${application.experienceYears} yrs` : ""}</p>
          <small>{application.email}</small>
        </div></div>
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Close candidate panel"><Icon name="close"/></button>
      </header>
      <section className="campaign-candidate-panel-profile cw-panel-summary">
        <div className="cw-chips">
          <Pill tone="info">Requirements score {screening.requirementsScore}%</Pill>
          <Pill>AI fit {application.fitScore}%</Pill>
          <span className={`cw-screen-state ${screening.screeningPending ? "pending" : screening.screeningFailed ? "failed" : screening.unverified ? "verify" : "complete"}`}>{status}</span>
          <OverrideLabel application={application}/>
          {offerStatus && <Pill tone="purple">Offer: {offerStatus}</Pill>}
        </div>
        <p className="cw-panel-musthaves"><strong>Must-haves</strong> {screening.mustHave.met} of {screening.mustHave.total} met{screening.mustHave.failed.length ? <span className="cw-danger-text"> · Failed: {screening.mustHave.failed.join(", ")}</span> : null}</p>
        {application.stage === "below-requirements" && !application.overridden && <GuardedButton role={actor.role} action="manageLonglist" icon="arrow" onClick={() => setOverrideOpen(true)}>Move to Longlist</GuardedButton>}
      </section>
      <nav className="campaign-candidate-panel-tabs" role="tablist" aria-label="Candidate panel tabs">
        {TABS.map(item => <button key={item} type="button" role="tab" id={`cw-panel-tab-${item.replace(/\s+/g, "-")}`} aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
      </nav>
      <div className="campaign-candidate-panel-body cw-drawer-body" role="tabpanel" aria-labelledby={`cw-panel-tab-${tab.replace(/\s+/g, "-")}`}>
        {tab === "Overview" && <>
          <ScreeningBanner application={application} screening={screening} store={store} actor={actor}/>
          <div className="cw-score-card"><span>Requirements score</span><strong>{screening.requirementsScore}%</strong><div className="cw-progress"><i style={{ width: `${screening.requirementsScore}%` }}/></div><small>Must-haves count in full; results that need verification count half.</small></div>
          <RequirementResults application={application} screening={screening} store={store} actor={actor}/>
        </>}
        {tab === "Evaluation" && <>
          <ScreeningBanner application={application} screening={screening} store={store} actor={actor}/>
          <div className="cw-eval-scores">
            <div><span>Requirements score</span><strong>{screening.requirementsScore}%</strong></div>
            <div><span>AI fit</span><strong>{application.fitScore}%</strong></div>
            <div><span>Must-haves met</span><strong>{screening.mustHave.met}/{screening.mustHave.total}</strong></div>
            <div><span>Skills match</span><strong>{application.skillsMatch.matched}/{application.skillsMatch.total}</strong></div>
          </div>
          <section><h3>AI screening</h3><p>{application.aiScreeningSummary}</p></section>
          <RequirementResults application={application} screening={screening} store={store} actor={actor}/>
        </>}
        {tab === "Decision" && <>
          <section className="cw-decision-facts">
            <div><span>Stage</span><strong>{applicationStatusLabel(application.stage)}</strong></div>
            <div><span>Screening</span><strong>{status}</strong></div>
            <div><span>Must-haves met</span><strong>{screening.mustHave.met} of {screening.mustHave.total}</strong></div>
            <div><span>Review status</span><strong>{application.reviewStatus}</strong></div>
            <div><span>Applied</span><strong>{new Date(application.appliedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong></div>
            {application.assignedReviewer && <div><span>Assigned reviewer</span><strong>{application.assignedReviewer}</strong></div>}
          </section>
          {application.overridden && <section><h3>Override</h3><p className="cw-warning-text">{application.overrideReason || "Moved to the Longlist by a recruiter."} Screening will not move this candidate back.</p></section>}
          {application.rejection && <section><h3>Rejection</h3><div className="cw-note-box"><p>{application.rejection.reason}</p><small>Decided by {application.rejection.decidedBy} on {new Date(application.rejection.decidedAt).toLocaleString()}</small><small>{application.rejection.sharedWithCandidate ? "Shared with candidate" : "Internal only"}</small></div></section>}
          {application.tags.length > 0 && <section><h3>Tags</h3><div className="cw-chips">{application.tags.map(tag => <Pill key={tag}>{tag}</Pill>)}</div></section>}
          <p className="cw-muted">Stage changes happen on the board, in the stage tabs, or through shortlists, references and offers.</p>
        </>}
        {tab === "Download Results" && <section className="cw-download">
          <span className="cw-link-icon"><Icon name="file" size={22}/></span>
          <h3>Download screening results</h3>
          <p>Save {application.name}’s requirements score, each requirement’s result, reason and source, and any corrections as a text report.</p>
          {application.screeningError && <p className="cw-danger-text">{application.screeningError}</p>}
          <Button icon="file" onClick={download}>Download results</Button>
        </section>}
      </div>
      <footer className="campaign-candidate-panel-footer cw-drawer-footer"><Button variant="secondary" onClick={onClose}>Close</Button></footer>
    </aside>
    {overrideOpen && <ReasonDialog kind="override" applications={[application]} requirements={requirements} onCancel={() => setOverrideOpen(false)} onConfirm={reason => { store.overrideApplications([application.id], reason, actor); setOverrideOpen(false); }}/>}
  </div>, document.body);
}

function ScreeningBanner({ application, screening, store, actor }: { application: WorkspaceApplication; screening: ApplicationScreening; store: CampaignWorkspaceStore; actor: CampaignActor }) {
  if (screening.screeningPending) return <div className="cw-screen-banner pending" role="status"><span className="cw-spinner" aria-hidden="true"/><div><strong>Screening…</strong><p>Screening is still running. These results may change when all checks finish.</p></div></div>;
  if (screening.screeningFailed) return <div className="cw-screen-banner failed" role="alert"><Icon name="close" size={18}/><div><strong>Screening failed</strong><p>{application.screeningError ?? "Screening could not be completed. Review the partial results with care."}</p>
    <GuardedButton role={actor.role} action="screen" onClick={() => store.rerunScreening(application.id)}>Screen now</GuardedButton></div></div>;
  return <div className="cw-screen-banner complete" role="status"><Icon name="check" size={18}/><div><strong>Screening complete</strong><p>Review the evidence, reason and source for each requirement. Correct any result the AI got wrong.</p></div></div>;
}

function RequirementResults({ application, screening, store, actor }: { application: WorkspaceApplication; screening: ApplicationScreening; store: CampaignWorkspaceStore; actor: CampaignActor }) {
  const [draft, setDraft] = useState<{ key: string; result: "Met" | "Not met"; note: string } | null>(null);
  const [error, setError] = useState("");
  const permission = canPerform(actor.role, "manageLonglist");
  if (!screening.criteria.length) return <p className="cw-muted">No requirements are set for this campaign, so there is nothing to screen against.</p>;

  const submit = (event: React.FormEvent<HTMLFormElement>, criterion: ScreenedCriterion) => {
    event.preventDefault();
    if (!draft?.note.trim()) {
      setError("A note is required to save this correction.");
      return;
    }
    const problem = store.correctResult(application.id, criterion, draft.result, draft.note, actor);
    if (problem) setError(problem);
    else { setDraft(null); setError(""); }
  };

  return <section className="cw-requirements">
    <h3>Requirement results</h3>
    {screening.criteria.map(criterion => <article className="cw-requirement" key={criterion.key}>
      <header>
        <h4>{criterion.name}</h4>
        <span className="cw-chips"><ResultBadge status={criterion.status}/><span className={`cw-kind ${criterion.mustHave ? "must" : ""}`}>{criterion.mustHave ? "Must-have" : "Preferred"}</span></span>
      </header>
      <p>{criterion.reason}</p>
      <small className="cw-source"><span>Where it came from</span>{criterion.source}</small>
      {criterion.correction ? <div className="cw-correction">
        <div className="cw-correction-note"><strong>Correction note</strong><p>{criterion.correction.note}</p><small>{criterion.correction.who} · {new Date(criterion.correction.correctedAt).toLocaleString()}</small></div>
        <div className="cw-correction-original"><strong>Original screening answer</strong><ResultBadge status={criterion.correction.originalResult}/><p>{criterion.correction.originalReason}</p><small>Source: {criterion.correction.originalSource}</small></div>
        {permission.allowed ? <button type="button" className="cw-link-action" onClick={() => store.undoCorrection(application.id, criterion.key)}>Undo correction</button> : <span className="cw-muted" title={permission.reason}>Only recruiters on this campaign can undo a correction.</span>}
      </div> : <div className="cw-correction-actions">
        <GuardedButton role={actor.role} action="manageLonglist" disabled={criterion.status === "Met"} onClick={() => { setDraft({ key: criterion.key, result: "Met", note: "" }); setError(""); }}>Mark as met</GuardedButton>
        <GuardedButton role={actor.role} action="manageLonglist" disabled={criterion.status === "Not met"} onClick={() => { setDraft({ key: criterion.key, result: "Not met", note: "" }); setError(""); }}>Mark as not met</GuardedButton>
      </div>}
      {draft?.key === criterion.key && <form className="cw-correction-form" onSubmit={event => submit(event, criterion)} noValidate>
        <strong>Correct this result to “{draft.result === "Met" ? "Met" : "Not met"}”</strong>
        <label className={`rf-field${error ? " has-error" : ""}`}><span>Recruiter note<b aria-hidden="true">*</b></span><textarea rows={3} value={draft.note} aria-required="true" aria-invalid={Boolean(error)} placeholder="Explain why the screening result should change." onChange={event => { const note = event.target.value; setDraft(current => current ? { ...current, note } : current); setError(""); }}/>{error ? <small role="alert">{error}</small> : <em className="cw-hint">A note is required before this correction can be saved.</em>}</label>
        <div className="cw-row-actions"><Button variant="secondary" onClick={() => { setDraft(null); setError(""); }}>Cancel</Button><Button type="submit" disabled={!draft.note.trim()}>Save correction</Button></div>
      </form>}
    </article>)}
  </section>;
}
