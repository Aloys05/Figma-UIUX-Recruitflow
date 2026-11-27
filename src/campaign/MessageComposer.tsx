import { useState } from "react";
import { WorkflowDialog } from "../campaignWorkflowUi";
import { Button, Icon, type IconName } from "../ui";
import { canPerform, type CampaignActor } from "./permissions";
import { Avatar, GuardedButton, Pill } from "./workspaceUi";
import { MESSAGE_TEMPLATES, MESSAGE_TEMPLATE_LABEL, stageName, type CampaignWorkspaceStore, type MessageTemplate } from "./workspaceStore";

const TEMPLATE_INFO: Record<MessageTemplate, { icon: IconName; text: string }> = {
  application_received: { icon: "mail", text: "Confirms we have their application." },
  shortlisted: { icon: "users", text: "Tells them they are on the shortlist." },
  reference_check_started: { icon: "check", text: "Lets them know we are contacting their referees." },
  offer: { icon: "file", text: "Covers the offer and what happens next." },
  not_selected: { icon: "close", text: "Lets them know they were not selected, kindly." },
};

type Draft = { subject: string; body: string };

/** D5.4: pick a template, start from the candidate's real email, customise the wording, preview and send. */
export default function MessageComposer({ store, actor, onOpenOutbox }: { store: CampaignWorkspaceStore; actor: CampaignActor; onOpenOutbox: () => void }) {
  const candidates = store.data.applications.filter(item => item.email);
  const [template, setTemplate] = useState<MessageTemplate>("shortlisted");
  const [candidateId, setCandidateId] = useState(candidates[0]?.id ?? "");
  const startFor = (id: string, kind: MessageTemplate) => store.messageStartFor(id, kind);
  const [start, setStart] = useState(() => startFor(candidateId, template));
  const [draft, setDraft] = useState<Draft>(() => ({ subject: start?.subject ?? "", body: start?.body ?? "" }));
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [problem, setProblem] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null);

  const candidate = candidates.find(item => item.id === candidateId) ?? null;
  const canSend = canPerform(actor.role, "sendMessages");
  const notConfigured = store.data.emailConfigured ? null : "Email sending is not set up. No email can go until it is.";
  const edited = Boolean(start) && (draft.subject !== start?.subject || draft.body !== start?.body);

  const reset = (id: string, kind: MessageTemplate) => {
    const next = startFor(id, kind);
    setStart(next);
    setDraft({ subject: next?.subject ?? "", body: next?.body ?? "" });
    setMode("preview");
    setProblem("");
  };
  const chooseTemplate = (kind: MessageTemplate) => { setTemplate(kind); setOutcome(null); reset(candidateId, kind); };
  const chooseCandidate = (id: string) => { setCandidateId(id); setOutcome(null); reset(id, template); };

  const validate = () => {
    if (!draft.subject.trim()) { setProblem("Give the email a subject."); setMode("edit"); return false; }
    if (!draft.body.trim()) { setProblem("The email needs a message."); setMode("edit"); return false; }
    setProblem("");
    return true;
  };

  const saveToOutbox = () => {
    if (!candidate || !validate()) return;
    const saved = store.prepareMessage(candidate.id, template, draft.subject, draft.body);
    if ("error" in saved) { setProblem(saved.error); return; }
    setOutcome({ tone: "success", text: canSend.allowed ? `Saved to the outbox for ${candidate.name}. Send it from there when you are ready.` : `Saved to the outbox for ${candidate.name}. The main recruiter can review and send it.` });
    reset(candidate.id, template);
  };

  const confirmSend = async () => {
    if (!candidate) return;
    const saved = store.prepareMessage(candidate.id, template, draft.subject, draft.body);
    if ("error" in saved) { setProblem(saved.error); setConfirming(false); return; }
    setBusy(true);
    const result = await store.sendMessages([saved.id], actor);
    setBusy(false);
    setConfirming(false);
    if (result.sent.length) setOutcome({ tone: "success", text: `Sent to ${candidate.name} at ${candidate.email}.` });
    else setOutcome({ tone: "danger", text: `Could not send to ${candidate.name}: ${result.failed[0]?.error ?? "unknown error"}. It is in the outbox to retry.` });
    reset(candidate.id, template);
  };

  if (!candidates.length) return <div className="campaign-queue-empty"><strong>No candidates to email yet</strong><p>Candidates appear here once they apply to this campaign.</p></div>;

  return <div className="cw-compose">
    <nav className="cw-template-list" aria-label="Email templates">
      <p className="rf-picker-label">Templates<span>{MESSAGE_TEMPLATES.length}</span></p>
      <ul>{MESSAGE_TEMPLATES.map(kind => <li key={kind}>
        <button type="button" className={`cw-template${kind === template ? " selected" : ""}`} aria-pressed={kind === template} onClick={() => chooseTemplate(kind)}>
          <span className="cw-template-icon"><Icon name={TEMPLATE_INFO[kind].icon} size={15}/></span>
          <span className="cw-template-text"><strong>{MESSAGE_TEMPLATE_LABEL[kind]}</strong><small>{TEMPLATE_INFO[kind].text}</small></span>
        </button>
      </li>)}</ul>
    </nav>

    <section className="cw-compose-main" aria-labelledby="cw-compose-title">
      <header className="cw-compose-head">
        <div>
          <span className="eyebrow">{MESSAGE_TEMPLATE_LABEL[template]}</span>
          <h3 id="cw-compose-title">Write to a candidate</h3>
        </div>
        <label className="cw-compose-to"><span>To</span>
          <select value={candidateId} onChange={event => chooseCandidate(event.target.value)}>
            {candidates.map(item => <option key={item.id} value={item.id}>{item.name} · {stageName(item.stage)}</option>)}
          </select>
        </label>
      </header>

      {!canSend.allowed && <p className="rf-banner info"><Icon name="lock" size={16}/>You can prepare emails and save them to the outbox. Only the main recruiter can send them.</p>}
      {outcome && <div className={`cw-send-result ${outcome.tone}`} role="status"><strong>{outcome.text}</strong>{outcome.tone === "success" && <button type="button" onClick={onOpenOutbox}>Open outbox</button>}<button type="button" onClick={() => setOutcome(null)}>Dismiss</button></div>}

      <div className="cw-compose-bar">
        <p>{start?.fromExisting ? <><Icon name="mail" size={14}/> Starts from the email already written for {candidate?.name.split(" ")[0]}.</> : <><Icon name="file" size={14}/> Starts from the {MESSAGE_TEMPLATE_LABEL[template].toLowerCase()} template, written for {candidate?.name.split(" ")[0]}.</>}</p>
        <span className="cw-row-actions">
          {edited && <Pill tone="purple">Edited</Pill>}
          {edited && <button type="button" className="cw-link-btn" onClick={() => reset(candidateId, template)}>Reset wording</button>}
          <div className="cw-mode" role="group" aria-label="Customise or preview">
            <button type="button" className={mode === "edit" ? "on" : ""} aria-pressed={mode === "edit"} onClick={() => setMode("edit")}><Icon name="file" size={13}/>Customise wording</button>
            <button type="button" className={mode === "preview" ? "on" : ""} aria-pressed={mode === "preview"} onClick={() => { if (validate()) setMode("preview"); }}><Icon name="eye" size={13}/>Preview</button>
          </div>
        </span>
      </div>

      {mode === "edit" ? <div className="cw-compose-edit">
        <label className="rf-field"><span>Subject</span><input value={draft.subject} maxLength={200} onChange={event => { setDraft(current => ({ ...current, subject: event.target.value })); setProblem(""); }}/></label>
        <label className="rf-field"><span>Message</span><textarea rows={12} value={draft.body} onChange={event => { setDraft(current => ({ ...current, body: event.target.value })); setProblem(""); }}/></label>
      </div> : <article className="cw-email-card" aria-label="Email preview">
        <dl>
          <div><dt>To</dt><dd>{candidate ? <><Avatar name={candidate.name}/><span>{candidate.name} <small>&lt;{candidate.email}&gt;</small></span></> : "—"}</dd></div>
          <div><dt>Subject</dt><dd><strong>{draft.subject || "No subject"}</strong></dd></div>
        </dl>
        <div className="cw-email-body">{draft.body.split("\n").map((line, index) => line ? <p key={index}>{line}</p> : <br key={index}/>)}</div>
      </article>}
      {problem && <p className="campaign-status-error" role="alert">{problem}</p>}

      <footer className="cw-compose-actions">
        <GuardedButton role={actor.role} action="queueMessages" icon="file" onClick={saveToOutbox}>Save to outbox</GuardedButton>
        <GuardedButton role={actor.role} action="sendMessages" extraBlock={notConfigured} variant="primary" icon="mail" onClick={() => { if (validate()) setConfirming(true); }}>Send</GuardedButton>
      </footer>
    </section>

    {confirming && candidate && <WorkflowDialog eyebrow="Confirm send" title={`Send this email to ${candidate.name}?`} onClose={() => { if (!busy) setConfirming(false); }} footer={<>
      <Button variant="secondary" disabled={busy} onClick={() => setConfirming(false)}>Go back</Button>
      <Button icon="mail" disabled={busy} onClick={() => { void confirmSend(); }}>{busy ? "Sending…" : "Confirm send"}</Button>
    </>}>
      <dl className="rf-email-meta">
        <div><dt>To</dt><dd>{candidate.name} &lt;{candidate.email}&gt;</dd></div>
        <div><dt>Subject</dt><dd>{draft.subject}</dd></div>
        <div><dt>Template</dt><dd>{MESSAGE_TEMPLATE_LABEL[template]}{edited ? " (wording customised)" : ""}</dd></div>
      </dl>
      <p className="rf-dialog-note">This sends now and cannot be undone. A copy is kept in the outbox.</p>
    </WorkflowDialog>}
  </div>;
}
