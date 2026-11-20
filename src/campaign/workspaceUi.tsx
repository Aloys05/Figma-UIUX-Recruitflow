import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { WorkflowDialog } from "../campaignWorkflowUi";
import { Button, Icon, type IconName } from "../ui";
import { canPerform, type CampaignAction, type CampaignRole } from "./permissions";
import { applicationStatusLabel, screenApplication, stageName, type CriterionStatus, type WorkspaceApplication, type WorkspaceRequirement } from "./workspaceStore";

export const initials = (name: string) => name.split(" ").map(part => part[0]).join("").toUpperCase().slice(0, 2);

const avatarTones = ["rose", "blue", "green", "amber", "purple", "cyan", "pink", "teal"];
export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const tone = avatarTones[name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarTones.length];
  return <span className={`cw-avatar tone-${tone} ${size}`} aria-hidden="true">{initials(name)}</span>;
}

export function Pill({ tone = "neutral", children, title }: { tone?: "neutral" | "info" | "success" | "warning" | "danger" | "purple"; children: React.ReactNode; title?: string }) {
  return <span className={`cw-pill ${tone}`} title={title}>{children}</span>;
}

export const criterionTone = (status: CriterionStatus) => status === "Met" ? "success" : status === "Unverified" ? "warning" : "danger";

export function CriteriaChips({ criteria }: { criteria: { name: string; status: CriterionStatus }[] }) {
  if (!criteria.length) return null;
  return <div className="cw-chips">{criteria.map(item => <Pill key={item.name} tone={criterionTone(item.status)}>{item.name}: {item.status}</Pill>)}</div>;
}

export function MandatoryCriteriaBadge({ met, total, failed }: { met: number; total: number; failed: readonly string[] }) {
  const tone = failed.length ? "danger" : met < total ? "warning" : "success";
  const label = failed.length ? "Requirement not met" : met < total ? "Needs verification" : "All met";
  return <span className="cw-stack"><Pill tone={tone}>{label}</Pill><small>{met}/{total} must have</small></span>;
}

export function FitBadge({ value }: { value: number }) {
  return <span className={`cw-fit ${value >= 80 ? "high" : value >= 60 ? "mid" : ""}`}>{value}%</span>;
}

/** A button that stays visible but disabled, with the permission reason as its tooltip. */
export function GuardedButton({ role, action, extraBlock, children, variant = "secondary", icon, onClick, disabled = false, type = "button", className = "" }: {
  role: CampaignRole;
  action: CampaignAction;
  /** A further reason to block the action, shown the same way. */
  extraBlock?: string | null;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconName;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const permission = canPerform(role, action);
  const reason = !permission.allowed ? permission.reason : extraBlock ?? null;
  if (!reason) return <Button variant={variant} icon={icon} onClick={onClick} disabled={disabled} type={type} className={className}>{children}</Button>;
  return <span className="rf-permission-guard" title={reason} tabIndex={0} aria-label={`${typeof children === "string" ? children : "Action"} unavailable. ${reason}`}>
    <Button variant={variant} icon={icon} disabled className={className}>{children}</Button>
  </span>;
}

export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) return null;
  return <p className="cw-toast" role="status"><span>{message}</span><button type="button" onClick={onDismiss}>Dismiss</button></p>;
}

export function NotAvailableButton({ children }: { children: React.ReactNode }) {
  return <button type="button" className="cw-mini-btn" title="Not available in this mock yet." aria-disabled="true" onClick={event => event.preventDefault()}>{children}</button>;
}

/* ------------------------------------------------------------------ */
/* Profile drawer                                                       */
/* ------------------------------------------------------------------ */

export function ProfileDrawer({ application, requirements, offerStatus, detailed = false, onClose }: {
  application: WorkspaceApplication;
  requirements: readonly WorkspaceRequirement[];
  offerStatus?: string | null;
  detailed?: boolean;
  onClose: () => void;
}) {
  const screening = screenApplication(application, requirements);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); };
  }, [onClose]);
  return createPortal(<div className="campaign-candidate-panel-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="campaign-candidate-panel cw-drawer" role="dialog" aria-modal="true" aria-labelledby="cw-profile-title">
      <header className="campaign-candidate-panel-header">
        <div className="cw-drawer-id"><Avatar name={application.name} size="md"/><div>
          <h2 id="cw-profile-title">{application.name}</h2>
          <p>{application.headline}{application.location ? `, ${application.location}` : ""}{application.experienceYears ? `, ${application.experienceYears} yrs` : ""}</p>
          <small>{application.email}</small>
        </div></div>
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Close profile"><Icon name="close"/></button>
      </header>
      <div className="campaign-candidate-panel-body cw-drawer-body">
        <span className="eyebrow">Candidate profile</span>
        <div className="cw-chips"><Pill>Fit {application.fitScore}/100</Pill><Pill tone="info">{screening.requirementsSummary}</Pill></div>
        <section><h3>Must-have criteria</h3><p>{screening.mustHave.met}/{screening.mustHave.total} met</p>{screening.mustHave.failed.length > 0 && <ul className="cw-failed">{screening.mustHave.failed.map(item => <li key={item}>✗ {item}</li>)}</ul>}</section>
        {screening.criteria.length > 0 && <section><h3>Requirements</h3><CriteriaChips criteria={screening.criteria}/></section>}
        <section><h3>Skills match</h3><p>{application.skillsMatch.matched}/{application.skillsMatch.total} ({application.skillsMatch.percentage}%)</p></section>
        <section><h3>AI screening</h3><p>{application.aiScreeningSummary}</p></section>
        <div className="cw-chips">
          {screening.screeningFailed && <Pill tone="danger">Screening failed</Pill>}
          {screening.knockedOut && <Pill tone="danger">Knocked out</Pill>}
          {offerStatus && <Pill tone="purple">Offer: {offerStatus}</Pill>}
        </div>
        {detailed && <>
          <section><h3>Application info</h3><p>Applied: {new Date(application.appliedDate).toLocaleDateString()}</p><p>Review status: {application.reviewStatus}</p><p>Stage: {stageName(application.stage)}</p></section>
          {application.rejection && <section><h3>Rejection</h3><div className="cw-note-box"><p>{application.rejection.reason}</p><small>Decided by {application.rejection.decidedBy} on {new Date(application.rejection.decidedAt).toLocaleString()}</small><small>{application.rejection.sharedWithCandidate ? "Shared with candidate" : "Internal only"}</small></div></section>}
          {application.overrideReason && <section><h3>Override</h3><p className="cw-warning-text">{application.overrideReason}</p></section>}
          {application.tags.length > 0 && <section><h3>Tags</h3><div className="cw-chips">{application.tags.map(tag => <Pill key={tag}>{tag}</Pill>)}</div></section>}
          {application.assignedReviewer && <section><h3>Assigned reviewer</h3><p>{application.assignedReviewer}</p></section>}
        </>}
      </div>
      <footer className="campaign-candidate-panel-footer cw-drawer-footer">
        {detailed ? <><Button variant="secondary" onClick={event => event.preventDefault()}>Full profile</Button><Button onClick={onClose}>Shortlist</Button></> : <Button variant="secondary" onClick={onClose}>Close</Button>}
      </footer>
    </aside>
  </div>, document.body);
}

/* ------------------------------------------------------------------ */
/* Dialogs                                                              */
/* ------------------------------------------------------------------ */

export function ReasonDialog({ kind, applications, requirements, onCancel, onConfirm }: {
  kind: "reject" | "override" | "unreject";
  applications: readonly WorkspaceApplication[];
  requirements: readonly WorkspaceRequirement[];
  onCancel: () => void;
  onConfirm: (reason: string, share: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [share, setShare] = useState(false);
  const valid = reason.trim().length > 0;
  const title = kind === "reject" ? `Reject ${applications.length} selected candidate(s)?` : kind === "override" ? "Override and move to Longlist" : "Return to Longlist";
  return <WorkflowDialog title={title} onClose={onCancel} footer={<>
    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
    <Button variant={kind === "reject" ? "danger" : "primary"} disabled={!valid} onClick={() => valid && onConfirm(reason.trim(), share)}>{kind === "reject" ? "Reject selected" : kind === "override" ? "Override with reason" : "Return with reason"}</Button>
  </>}>
    {kind === "reject" && <p className="rf-dialog-note">This action records a decision for the selected candidates. No email will be sent.</p>}
    {kind === "override" && <>
      <p className="rf-dialog-note">This moves the candidate back despite an unmet must-have.</p>
      <ul className="cw-failed">{applications.flatMap(application => screenApplication(application, requirements).mustHave.failed.map(item => <li key={`${application.id}-${item}`}>{application.name}: {item}</li>))}</ul>
    </>}
    {kind === "unreject" && <p className="rf-dialog-note">This returns the candidate to the Longlist. Record why.</p>}
    <label className="rf-field"><span>{kind === "reject" ? "Rejection reason" : kind === "override" ? "Override reason" : "Reason"}<b aria-hidden="true">*</b></span><textarea rows={3} value={reason} onChange={event => setReason(event.target.value)} aria-required="true"/></label>
    {kind === "reject" && <div className="cw-share">
      <label className="cw-check"><input type="checkbox" checked={share} onChange={event => setShare(event.target.checked)}/>Share this reason with the candidate</label>
      {share && <p className="cw-note-box">Message preview: “Your application was not selected. Reason: {reason.trim() || "[reason]"}”</p>}
    </div>}
  </WorkflowDialog>;
}

export type ApproverOption = { id: string; name: string; role: string };

export function ProposeDialog({ applications, requirements, approvers, onCancel, onConfirm }: {
  applications: readonly WorkspaceApplication[];
  requirements: readonly WorkspaceRequirement[];
  approvers: readonly ApproverOption[];
  onCancel: () => void;
  onConfirm: (input: { name: string; approverId: string; approverName: string; note: string }) => void;
}) {
  const [name, setName] = useState("");
  const [approverId, setApproverId] = useState("");
  const [note, setNote] = useState("");
  const approver = approvers.find(item => item.id === approverId);
  const valid = name.trim().length > 0 && Boolean(approver) && applications.length > 0;
  return <WorkflowDialog title="Propose a shortlist" wide onClose={onCancel} footer={<>
    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
    <Button disabled={!valid} onClick={() => valid && approver && onConfirm({ name: name.trim(), approverId: approver.id, approverName: approver.name, note })}>Submit for approval</Button>
  </>}>
    <p className="rf-dialog-note">This creates a proposal for the line manager. It is not an approval.</p>
    <label className="rf-field"><span>Proposal name</span><input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Senior React Engineer shortlist"/></label>
    <label className="rf-field"><span>Approver</span><select value={approverId} onChange={event => setApproverId(event.target.value)}><option value="">Choose an approver</option>{approvers.map(item => <option key={item.id} value={item.id}>{item.name}, {item.role}</option>)}</select></label>
    <label className="rf-field"><span>Note</span><textarea rows={3} value={note} onChange={event => setNote(event.target.value)} placeholder="Anything the approver should know before deciding."/></label>
    <div><p className="cw-section-label">{applications.length} candidate{applications.length === 1 ? "" : "s"}</p>
      <ul className="cw-list">{applications.map(application => {
        const screening = screenApplication(application, requirements);
        return <li key={application.id}><span className="cw-person"><Avatar name={application.name}/><strong>{application.name}</strong></span><span className="cw-chips"><FitBadge value={application.skillsMatch.percentage}/><Pill tone={screening.mustHave.failed.length ? "danger" : screening.mustHave.met < screening.mustHave.total ? "warning" : "success"}>{screening.mustHave.failed.length ? "Requirement not met" : screening.mustHave.met < screening.mustHave.total ? "Needs verification" : "All met"}</Pill></span></li>;
      })}</ul>
    </div>
  </WorkflowDialog>;
}

export function CompareDialog({ applications, requirements, onClose }: { applications: readonly WorkspaceApplication[]; requirements: readonly WorkspaceRequirement[]; onClose: () => void }) {
  return <WorkflowDialog title="Compare selected candidates" wide onClose={onClose} footer={<Button variant="secondary" onClick={onClose}>Close comparison</Button>}>
    <p className="rf-dialog-note">Side-by-side details for the current selection.</p>
    <div className="cw-compare">{applications.map(application => {
      const screening = screenApplication(application, requirements);
      return <article key={application.id}>
        <h4>{application.name}</h4><p>{application.headline}</p>
        <p>Fit {application.fitScore}/100</p><p>{screening.requirementsSummary}</p>
        <p>Must-haves: {screening.mustHave.met}/{screening.mustHave.total} met</p>
        <p>Stage: {applicationStatusLabel(application.stage)}</p>
        {screening.mustHave.failed.length > 0 && <p className="cw-danger-text">Failed: {screening.mustHave.failed.join(", ")}</p>}
        {application.tags.length > 0 && <p>Tags: {application.tags.join(", ")}</p>}
      </article>;
    })}</div>
  </WorkflowDialog>;
}

export function TagDialog({ count, onCancel, onConfirm }: { count: number; onCancel: () => void; onConfirm: (tag: string) => void }) {
  const [tag, setTag] = useState("");
  return <WorkflowDialog title={`Add tag to ${count} selected candidate(s)`} onClose={onCancel} footer={<>
    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
    <Button disabled={!tag.trim()} onClick={() => tag.trim() && onConfirm(tag.trim())}>Add tag</Button>
  </>}>
    <label className="rf-field"><span>Tag</span><input value={tag} onChange={event => setTag(event.target.value)} list="cw-tag-options"/></label>
    <datalist id="cw-tag-options">{["Priority", "Referred", "Interviewed before", "Do not contact", "Rehire"].map(item => <option key={item} value={item}/>)}</datalist>
  </WorkflowDialog>;
}
