import { useMemo, useState } from "react";
import { WorkflowDialog } from "../campaignWorkflowUi";
import { Button, Icon } from "../ui";
import { canPerform, type CampaignActor } from "./permissions";
import MessageComposer from "./MessageComposer";
import { GuardedButton, Pill } from "./workspaceUi";
import { MESSAGE_TEMPLATES, MESSAGE_TEMPLATE_LABEL, type CampaignWorkspaceStore, type CandidateMessage, type MessageStatus } from "./workspaceStore";

const FILTERS: Array<{ id: "all" | MessageStatus; label: string }> = [
  { id: "all", label: "All" }, { id: "queued", label: "Queued" }, { id: "sending", label: "Sending" }, { id: "sent", label: "Sent" }, { id: "failed", label: "Failed" },
];
const statusTone = (status: MessageStatus) => status === "sent" ? "success" : status === "failed" ? "danger" : status === "sending" ? "info" : "warning";
const statusLabel = (status: MessageStatus) => status[0].toUpperCase() + status.slice(1);
const when = (iso: string | null) => iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function MessagesTab({ store, actor }: { store: CampaignWorkspaceStore; actor: CampaignActor }) {
  const { messages, autoSend, emailConfigured } = store.data;
  const [view, setView] = useState<"compose" | "outbox">("compose");
  const [filter, setFilter] = useState<"all" | MessageStatus>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ subject: "", body: "" });
  const [editError, setEditError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: Array<{ name: string; error: string }> } | null>(null);
  const shown = useMemo(() => [...messages].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).filter(item => filter === "all" || item.status === filter), [messages, filter]);
  const queuedShown = shown.filter(item => item.status === "queued");
  const selectedQueued = queuedShown.filter(item => selected.has(item.id));
  const allQueuedSelected = queuedShown.length > 0 && queuedShown.every(item => selected.has(item.id));
  const open = messages.find(item => item.id === openId) ?? null;
  const canSend = canPerform(actor.role, "sendMessages").allowed;
  const notConfigured = emailConfigured ? null : "Email sending is not set up. No email can go until it is.";

  const send = async (ids: string[]) => {
    setBusy(true);
    const outcome = await store.sendMessages(ids, actor);
    setBusy(false);
    setSelected(new Set());
    setResult({ sent: outcome.sent.length, failed: outcome.failed.map(item => ({ name: messages.find(message => message.id === item.messageId)?.candidateName ?? "Unknown", error: item.error })) });
  };

  const openMessage = (message: CandidateMessage) => { setOpenId(message.id); setEditing(false); setEditError(""); setDraft({ subject: message.subject, body: message.body }); };

  return <section className="cw-messages">
    {!emailConfigured && <p className="rf-banner warning" role="alert"><Icon name="mail" size={16}/>Email sending is not set up. No email can go until it is.</p>}
    <div className="cw-messages-views" role="tablist" aria-label="Messages">
      <button type="button" role="tab" aria-selected={view === "compose"} className={view === "compose" ? "on" : ""} onClick={() => setView("compose")}><Icon name="file" size={14}/>Write a message</button>
      <button type="button" role="tab" aria-selected={view === "outbox"} className={view === "outbox" ? "on" : ""} onClick={() => setView("outbox")}><Icon name="mail" size={14}/>Outbox<span>{messages.length}</span></button>
    </div>
    {view === "compose" ? <MessageComposer store={store} actor={actor} onOpenOutbox={() => { setFilter("all"); setView("outbox"); }}/> : <>
    <div className="cw-messages-toolbar">
      <div className="cw-filter-chips" role="group" aria-label="Filter emails by status">{FILTERS.map(item => <button type="button" key={item.id} className={filter === item.id ? "on" : ""} aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setSelected(new Set()); }}>{item.label}<span>{item.id === "all" ? messages.length : messages.filter(message => message.status === item.id).length}</span></button>)}</div>
      <span className="cw-row-actions">
        <GuardedButton role={actor.role} action="sendMessages" extraBlock={notConfigured} variant="primary" icon="mail" disabled={!selectedQueued.length || busy} onClick={() => { void send(selectedQueued.map(item => item.id)); }}>{busy ? "Sending…" : `Send selected (${selectedQueued.length})`}</GuardedButton>
        <Button variant="secondary" icon="settings" onClick={() => setSettingsOpen(true)}>Settings</Button>
      </span>
    </div>
    {result && <div className={`cw-send-result ${result.failed.length ? "warning" : "success"}`} role="status">
      <strong>{result.sent} sent, {result.failed.length} failed</strong>
      {result.failed.length > 0 && <ul>{result.failed.map((item, index) => <li key={index}>{item.name}: {item.error}</li>)}</ul>}
      <button type="button" onClick={() => setResult(null)}>Dismiss</button>
    </div>}
    {shown.length === 0 ? <div className="campaign-queue-empty"><strong>No emails here</strong><p>Candidate emails are queued automatically as applications move through the pipeline.</p></div> : <div className="campaign-candidate-table-wrap"><table className="campaign-candidate-table cw-table cw-message-table">
      <thead><tr>
        <th className="cw-check-col"><input type="checkbox" aria-label="Select all queued emails" checked={allQueuedSelected} disabled={!queuedShown.length} onChange={() => setSelected(allQueuedSelected ? new Set() : new Set(queuedShown.slice(0, 100).map(item => item.id)))}/></th>
        <th>Candidate</th><th>Email type</th><th>Subject</th><th>Status</th><th>Created</th><th>Sent at / Sent by</th>
      </tr></thead>
      <tbody>{shown.map(message => <tr key={message.id} className="cw-clickable" onClick={() => openMessage(message)}>
        <td data-label="Select" className="cw-check-col" onClick={event => event.stopPropagation()}><input type="checkbox" aria-label={`Select email to ${message.candidateName}`} disabled={message.status !== "queued"} checked={selected.has(message.id)} onChange={() => setSelected(previous => { const next = new Set(previous); if (next.has(message.id)) next.delete(message.id); else if (next.size < 100) next.add(message.id); return next; })}/></td>
        <td data-label="Candidate"><button type="button" className="cw-name-link" onClick={event => { event.stopPropagation(); openMessage(message); }}>{message.candidateName}</button><small className="cw-block">{message.candidateEmail}</small></td>
        <td data-label="Email type">{MESSAGE_TEMPLATE_LABEL[message.template]}</td>
        <td data-label="Subject" className="cw-subject">{message.subject}</td>
        <td data-label="Status"><span className="cw-stack"><Pill tone={statusTone(message.status)}>{statusLabel(message.status)}</Pill>{message.status === "failed" && message.error && <small className="cw-danger-text">{message.error}</small>}</span></td>
        <td data-label="Created">{when(message.createdAt)}</td>
        <td data-label="Sent">{message.sentAt ? <span className="cw-stack"><span>{when(message.sentAt)}</span><small>{message.sentBy ?? "Sent automatically"}</small></span> : "—"}</td>
      </tr>)}</tbody>
    </table></div>}

    </>}

    {open && <WorkflowDialog eyebrow={MESSAGE_TEMPLATE_LABEL[open.template]} title={editing ? "Edit email" : "Email preview"} wide onClose={() => setOpenId(null)} footer={<>
      <Button variant="secondary" onClick={() => setOpenId(null)}>Close</Button>
      {open.status === "queued" && !editing && <GuardedButton role={actor.role} action="queueMessages" icon="file" onClick={() => { setEditing(true); setDraft({ subject: open.subject, body: open.body }); }}>Edit</GuardedButton>}
      {editing && <Button onClick={() => { const error = store.editMessage(open.id, draft.subject, draft.body); setEditError(error ?? ""); if (!error) setEditing(false); }}>Save changes</Button>}
      {open.status === "queued" && !editing && <GuardedButton role={actor.role} action="sendMessages" extraBlock={notConfigured} variant="primary" icon="mail" disabled={busy} onClick={() => { void send([open.id]).then(() => setOpenId(null)); }}>Send</GuardedButton>}
      {open.status === "failed" && <GuardedButton role={actor.role} action="sendMessages" extraBlock={notConfigured} variant="primary" disabled={busy} onClick={() => { void send([open.id]).then(() => setOpenId(null)); }}>Retry</GuardedButton>}
    </>}>
      <dl className="rf-email-meta">
        <div><dt>To</dt><dd>{open.candidateName} &lt;{open.candidateEmail}&gt;</dd></div>
        <div><dt>Status</dt><dd><Pill tone={statusTone(open.status)}>{statusLabel(open.status)}</Pill>{open.sentAt ? ` ${when(open.sentAt)} · ${open.sentBy ?? "Sent automatically"}` : ""}</dd></div>
        {!editing && <div><dt>Subject</dt><dd>{open.subject}</dd></div>}
      </dl>
      {open.status === "failed" && open.error && <p className="rf-banner danger"><Icon name="close" size={16}/>{open.error}</p>}
      {editing ? <>
        <label className="rf-field"><span>Subject</span><input value={draft.subject} maxLength={200} onChange={event => setDraft(current => ({ ...current, subject: event.target.value }))}/></label>
        <label className="rf-field"><span>Message</span><textarea rows={10} value={draft.body} onChange={event => setDraft(current => ({ ...current, body: event.target.value }))}/></label>
        {editError && <p className="campaign-status-error" role="alert">{editError}</p>}
      </> : <div className="rf-email-body">{open.body.split("\n").map((line, index) => line ? <p key={index}>{line}</p> : <br key={index}/>)}</div>}
      {!canSend && open.status === "queued" && <p className="rf-dialog-note">Only the main recruiter can send candidate emails. You can still edit queued emails if you are a recruiter on this campaign.</p>}
    </WorkflowDialog>}

    {settingsOpen && <WorkflowDialog eyebrow="Messages" title="Auto-send settings" onClose={() => setSettingsOpen(false)} footer={<Button onClick={() => setSettingsOpen(false)}>Done</Button>}>
      <p className="rf-dialog-note">Emails that are off wait here until a recruiter sends them.</p>
      <ul className="cw-toggle-list">{MESSAGE_TEMPLATES.map(template => {
        const allowed = canPerform(actor.role, "editCampaign");
        return <li key={template}>
          <span><strong>{MESSAGE_TEMPLATE_LABEL[template]}</strong><small>{autoSend[template] ? "Sends automatically" : "Waits for a recruiter"}</small></span>
          <label className="cw-switch" title={allowed.allowed ? undefined : allowed.reason}><input type="checkbox" role="switch" checked={autoSend[template]} disabled={!allowed.allowed} onChange={event => store.setAutoSend(template, event.target.checked)} aria-label={`Send ${MESSAGE_TEMPLATE_LABEL[template]} emails automatically`}/><i/></label>
        </li>;
      })}</ul>
      {!canPerform(actor.role, "editCampaign").allowed && <p className="rf-dialog-note">Only the main recruiter or an administrator can change these.</p>}
      <div className="cw-mock-note"><span className="cw-section-label">Mock only</span><label className="cw-check"><input type="checkbox" checked={emailConfigured} onChange={event => store.setEmailConfigured(event.target.checked)}/>Email service is set up</label></div>
    </WorkflowDialog>}
  </section>;
}
