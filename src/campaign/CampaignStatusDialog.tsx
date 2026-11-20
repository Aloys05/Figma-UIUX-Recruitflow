import { useState } from "react";
import { WorkflowDialog } from "../campaignWorkflowUi";
import { Button } from "../ui";

export type LifecycleState = "draft" | "published" | "paused" | "closed";
type StatusAction = "publish" | "pause" | "close" | "reopen" | "set_closing_date";

export const LIFECYCLE_LABEL: Record<LifecycleState, string> = { draft: "Draft", published: "Published", paused: "Paused", closed: "Closed" };

const ACTION_LABEL: Record<StatusAction, string> = { publish: "Publish", pause: "Pause", close: "Close", reopen: "Reopen", set_closing_date: "Change closing date" };
const SUBMIT_LABEL: Record<StatusAction, string> = { publish: "Continue to publish", pause: "Pause campaign", close: "Close campaign", reopen: "Reopen campaign", set_closing_date: "Save closing date" };
const ACTION_HELP: Record<StatusAction, string> = {
  publish: "Candidates can find the campaign and apply through its public link.",
  pause: "Candidates cannot apply while it is paused.",
  close: "Candidates can no longer apply. The campaign moves to Archived.",
  reopen: "Candidates can apply again.",
  set_closing_date: "Leave it blank for no end date.",
};
const ACTIONS_BY_STATE: Record<LifecycleState, StatusAction[]> = {
  draft: ["publish"],
  published: ["pause", "close", "set_closing_date"],
  paused: ["reopen", "close", "set_closing_date"],
  closed: ["reopen"],
};

export type LifecycleChange =
  | { action: "pause" | "close"; reason: string }
  | { action: "reopen" | "set_closing_date"; closingDate: string | null };

export function CampaignStatusDialog({ state, closingDate, reason, onClose, onChange, onPublish }: {
  state: LifecycleState;
  closingDate: string | null;
  reason: string | null;
  onClose: () => void;
  /** Applies a change; resolves to an error message, or null when it worked. */
  onChange: (change: LifecycleChange) => Promise<string | null>;
  onPublish: () => void;
}) {
  const actions = ACTIONS_BY_STATE[state];
  const [action, setAction] = useState<StatusAction>(actions[0]);
  const [reasonText, setReasonText] = useState("");
  const [date, setDate] = useState(closingDate ?? "");
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const needsReason = action === "pause" || action === "close";
  const takesDate = action === "reopen" || action === "set_closing_date";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProblem(null);
    if (action === "publish") {
      onPublish();
      return;
    }
    let change: LifecycleChange;
    if (action === "pause" || action === "close") {
      if (!reasonText.trim()) {
        setProblem(`Give a reason for ${action === "pause" ? "pausing" : "closing"} the campaign.`);
        return;
      }
      change = { action, reason: reasonText.trim() };
    } else {
      change = { action, closingDate: date || null };
    }
    setSaving(true);
    const error = await onChange(change);
    setSaving(false);
    if (error) setProblem(error);
    else onClose();
  };

  return <WorkflowDialog title="Campaign status" onClose={onClose}>
    <form className="cw-status-form" onSubmit={event => { void submit(event); }}>
      <p className="rf-dialog-note">This campaign is <strong>{LIFECYCLE_LABEL[state].toLowerCase()}</strong>{closingDate ? ` and closes on ${closingDate}` : ""}.{reason ? ` Reason given: ${reason}` : ""}</p>
      <fieldset className="campaign-status-fieldset">
        <legend>What do you want to do?</legend>
        <div className="campaign-status-options">{actions.map(option => <label key={option} className={`campaign-status-option${action === option ? " selected" : ""}`}>
          <input type="radio" name="campaign-status-action" value={option} checked={action === option} onChange={() => { setAction(option); setProblem(null); }}/>
          <span className="campaign-status-option-copy"><strong>{ACTION_LABEL[option]}</strong><small>{ACTION_HELP[option]}</small></span>
        </label>)}</div>
      </fieldset>
      {needsReason && <label className="campaign-status-reason"><span>Reason (required)</span><textarea rows={3} maxLength={500} value={reasonText} aria-required="true" aria-invalid={problem ? true : undefined} onChange={event => { setReasonText(event.target.value); setProblem(null); }}/></label>}
      {takesDate && <label className="campaign-status-reason"><span>Closing date (optional)</span><input type="date" value={date} onChange={event => setDate(event.target.value)}/><small className="cw-hint">The last day candidates can apply, in Namibia time.</small></label>}
      {problem && <p className="campaign-status-error" role="alert">{problem}</p>}
      <footer className="campaign-status-footer">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : SUBMIT_LABEL[action]}</Button>
      </footer>
    </form>
  </WorkflowDialog>;
}

export function PublishCampaignDialog({ defaultSlug, onCancel, onPublish }: { defaultSlug: string; onCancel: () => void; onPublish: (slug: string) => Promise<string | null> }) {
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const publish = async () => {
    const value = slug.trim();
    if (value && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      setError("Use lowercase letters, numbers and single hyphens only.");
      return;
    }
    setPublishing(true);
    const problem = await onPublish(value || defaultSlug);
    setPublishing(false);
    if (problem) setError(problem);
  };
  return <WorkflowDialog title="Publish campaign" onClose={onCancel} footer={<><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button disabled={publishing} onClick={() => { void publish(); }}>{publishing ? "Publishing…" : "Publish"}</Button></>}>
    <p className="rf-dialog-note">Candidates use a public link. Service category and work arrangement must be set before publishing. Leave the slug blank to generate a secure random link, or choose your own (lowercase, hyphens).</p>
    <label className="rf-field"><span>Custom slug (optional)</span><input value={slug} autoComplete="off" spellCheck={false} placeholder="e.g. senior-engineer-berlin" onChange={event => { setSlug(event.target.value); setError(null); }}/></label>
    {error && <p className="campaign-status-error" role="alert">{error}</p>}
  </WorkflowDialog>;
}
