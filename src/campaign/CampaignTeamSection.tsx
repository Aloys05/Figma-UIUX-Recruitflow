import { useState } from "react";
import { countPendingOffers } from "../campaignReferencesOffersData";
import { Button, Icon } from "../ui";
import {
  cancelApproverInvite,
  createApproverInvite,
  daysLeft,
  emailBelongsToRecruiterOrCandidate,
  formatInviteDate,
  INVITE_LIFETIME_DAYS,
  inviteUrl,
  lastAcceptedInviteFor,
  openInviteFor,
  resendApproverInvite,
  type ApproverInvite,
} from "./approverInvites";
import { canPerform, ROLE_LABEL, setMockCampaignRole, useMockCampaignRole, type CampaignRole, type CampaignTeamMember } from "./permissions";
import { ORGANISATION_PEOPLE } from "./team";
import { appendCampaignActivity, countPendingShortlists, type ActivityAction } from "./workspaceStore";
import { Avatar } from "./workspaceUi";

type TeamAction = Extract<ActivityAction, "campaign.member_added" | "campaign.member_role_changed" | "campaign.member_removed">;
type Person = { name: string; email: string };
type Waiting = { shortlists: number; offers: number };

const PREVIEW_ROLES: CampaignRole[] = ["main_recruiter", "additional_recruiter", "admin"];

export const ROLE_LINES = {
  main: "Owns the campaign: edits it, manages this team, proposes shortlists, and drafts, sends or withdraws offers.",
  additional: "Screens candidates, manages the longlist and references, and prepares emails. Cannot propose shortlists, send offers or change the team.",
  approver: "Approves the shortlist and the offer, or sends them back with a reason. Signs in to the approver space, not the recruiter workspace.",
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const describeWaiting = (waiting: Waiting) => [waiting.shortlists ? plural(waiting.shortlists, "shortlist") : "", waiting.offers ? plural(waiting.offers, "offer") : ""].filter(Boolean).join(" and ");
const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

function Guard({ allowed, reason, children }: { allowed: boolean; reason: string | null; children: React.ReactElement }) {
  return allowed ? children : <span className="rf-permission-guard" title={reason ?? undefined} tabIndex={0}>{children}</span>;
}

function PersonRow({ person, you, badge, children }: { person: Person; you?: boolean; badge?: React.ReactNode; children?: React.ReactNode }) {
  return <div className="ct-person">
    <Avatar name={person.name} size="md"/>
    <span className="ct-person-text"><strong>{person.name}{you && <em> (you)</em>}</strong><small>{person.email}</small></span>
    {badge}
    {children && <span className="ct-person-actions">{children}</span>}
  </div>;
}

function Group({ title, line, count, children }: { title: string; line: string; count?: string; children: React.ReactNode }) {
  return <section className="ct-group">
    <header className="ct-group-head"><h3>{title}{count && <span className="ct-count">{count}</span>}</h3><p>{line}</p></header>
    <div className="ct-group-body">{children}</div>
  </section>;
}

export default function CampaignTeamSection({ campaignId, campaignTitle, organisation, team, actorName, onSaveTeam }: {
  campaignId: string;
  campaignTitle: string;
  organisation: string;
  team: readonly CampaignTeamMember[];
  actorName: string;
  /** Saves the team; returns false if saving failed. */
  onSaveTeam: (next: CampaignTeamMember[], action: TeamAction) => boolean;
}) {
  const role = useMockCampaignRole();
  const permission = canPerform(role, "manageTeam");
  const canManage = permission.allowed;
  const reason = permission.allowed ? null : permission.reason;

  const main = team.find(member => member.role === "Main recruiter") ?? null;
  const additional = team.filter(member => member.role === "Additional recruiter");
  const approver = team.find(member => member.role === "Line manager") ?? null;

  const [addId, setAddId] = useState("");
  const [handoverId, setHandoverId] = useState("");
  const [confirmHandover, setConfirmHandover] = useState(false);
  const [removing, setRemoving] = useState<CampaignTeamMember | null>(null);
  const [error, setError] = useState("");

  const available = ORGANISATION_PEOPLE.filter(person => !team.some(member => member.email.toLowerCase() === person.email.toLowerCase()));
  const handoverTo = additional.find(member => member.id === handoverId) ?? null;

  const save = (next: CampaignTeamMember[], action: TeamAction) => {
    if (onSaveTeam(next, action)) setError("");
    else setError("That did not work. Try again.");
  };
  const add = () => {
    const person = available.find(item => item.id === addId);
    if (!person) {
      setError("Choose a recruiter to add.");
      return;
    }
    save([...team, { id: person.id, name: person.name, email: person.email, role: "Additional recruiter" }], "campaign.member_added");
    setAddId("");
  };
  const handover = () => {
    if (!handoverTo) return;
    save(team.map(item => item.id === handoverTo.id ? { ...item, role: "Main recruiter" } : item.role === "Main recruiter" ? { ...item, role: "Additional recruiter" } : item), "campaign.member_role_changed");
    setConfirmHandover(false);
    setHandoverId("");
  };

  return <div className="ct-team">
    <div className="ct-toolbar">
      {canManage
        ? <p className="ct-toolbar-note">Choose who works on this role. Only people on the team, and the organisation owner, can see the campaign.</p>
        : <p className="ct-readonly-note" role="note"><Icon name="lock" size={15}/><span><strong>View only.</strong> {role === "additional_recruiter" ? "You are an additional recruiter on this campaign. Ask the main recruiter if the team needs to change." : reason}</span></p>}
      <label className="cw-preview-as" title="Mock mode only: see the section as each role."><span>Preview as</span><select value={role} onChange={event => setMockCampaignRole(event.target.value as CampaignRole)}>{[...PREVIEW_ROLES, ...(PREVIEW_ROLES.includes(role) ? [] : [role])].map(option => <option key={option} value={option}>{ROLE_LABEL[option]}</option>)}</select></label>
    </div>

    <div className="ct-groups">
      <Group title="Main recruiter" line={ROLE_LINES.main}>
        {main ? <PersonRow person={main} you={main.name === actorName} badge={<span className="cw-pill info">Main recruiter</span>}/> : <p className="ct-empty">No main recruiter. Every campaign needs one.</p>}
        {canManage && <div className="ct-inline-form">
          {additional.length === 0
            ? <p className="ct-hint">To hand this campaign over, first add the person as an additional recruiter.</p>
            : <>
              <label className="campaign-edit-field"><span>Hand over to</span><select value={handoverId} onChange={event => { setHandoverId(event.target.value); setConfirmHandover(false); }}><option value="">Choose an additional recruiter</option>{additional.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
              <Button variant="secondary" disabled={!handoverTo} onClick={() => setConfirmHandover(true)}>Hand over</Button>
            </>}
        </div>}
        {confirmHandover && handoverTo && <div className="cw-confirm warning" role="alertdialog" aria-labelledby="ct-handover-title">
          <strong id="ct-handover-title">Make {handoverTo.name} the main recruiter?</strong>
          <p>{main ? `${main.name} becomes an additional recruiter and can no longer change the team, propose shortlists or send offers.` : "They will own this campaign."}</p>
          <div><Button onClick={handover}>Make main recruiter</Button><Button variant="secondary" onClick={() => setConfirmHandover(false)}>Cancel</Button></div>
        </div>}
      </Group>

      <Group title="Additional recruiters" line={ROLE_LINES.additional} count={String(additional.length)}>
        {additional.length === 0 ? <p className="ct-empty">No additional recruiters yet.{canManage ? " Add someone from your organisation to help screen." : ""}</p> : <div className="ct-list">
          {additional.map(member => <PersonRow key={member.id} person={member} you={member.name === actorName}>
            {canManage && <Button variant="ghost" className="ct-remove" onClick={() => { setError(""); setRemoving(member); }}>Remove</Button>}
          </PersonRow>)}
        </div>}
        {removing && <div className="cw-confirm danger" role="alertdialog" aria-labelledby="ct-remove-title">
          <strong id="ct-remove-title">Remove {removing.name} from this campaign?</strong>
          <p>They can no longer screen candidates here. Their past actions stay in the activity log.</p>
          <div><Button variant="danger" onClick={() => { save(team.filter(item => item.id !== removing.id), "campaign.member_removed"); setRemoving(null); }}>Remove</Button><Button variant="secondary" onClick={() => setRemoving(null)}>Cancel</Button></div>
        </div>}
        {canManage && <div className="ct-inline-form">
          <label className="campaign-edit-field"><span>Add a recruiter</span><select value={addId} disabled={!available.length} onChange={event => { setAddId(event.target.value); setError(""); }}><option value="">{available.length ? "Choose from your organisation's recruiters" : "Every recruiter is already on this campaign"}</option>{available.map(person => <option key={person.id} value={person.id}>{person.name} · {person.email}</option>)}</select></label>
          <Button variant="secondary" icon="plus" disabled={!addId} onClick={add}>Add</Button>
        </div>}
        {error && <p className="campaign-edit-error" role="alert">{error}</p>}
      </Group>

      <Group title="Approver" line={ROLE_LINES.approver}>
        <ApproverGroup campaignId={campaignId} campaignTitle={campaignTitle} organisation={organisation} approver={approver} actorName={actorName} canManage={canManage} reason={reason}/>
      </Group>
    </div>
  </div>;
}

/* ------------------------------------------------------------------ */
/* Approver group: the six states                                       */
/* ------------------------------------------------------------------ */

type PreviewState = "live" | "none" | "sent" | "failed" | "refused" | "accepted" | "replacing";
const PREVIEW_LABEL: Record<PreviewState, string> = {
  live: "Live data",
  none: "1. No approver",
  sent: "2. Invitation sent",
  failed: "3. Email could not be sent",
  refused: "4. Refused",
  accepted: "5. Approver accepted",
  replacing: "6. Replacing with items waiting",
};

function ApproverGroup({ campaignId, campaignTitle, organisation, approver, actorName, canManage, reason }: {
  campaignId: string;
  campaignTitle: string;
  organisation: string;
  approver: Person | null;
  actorName: string;
  canManage: boolean;
  reason: string | null;
}) {
  const [preview, setPreview] = useState<PreviewState>(() => {
    const requested = new URLSearchParams(window.location.search).get("approverState");
    return requested && requested in PREVIEW_LABEL ? requested as PreviewState : "live";
  });
  const [invite, setInvite] = useState<ApproverInvite | null>(() => openInviteFor(campaignId));
  const [replacing, setReplacing] = useState(false);
  const [refused, setRefused] = useState(false);
  const [notice, setNotice] = useState("");

  const waiting: Waiting = { shortlists: countPendingShortlists(campaignId), offers: countPendingOffers(campaignId) };
  const acceptedAt = approver ? lastAcceptedInviteFor(campaignId, approver.email)?.acceptedAt : undefined;

  const refresh = () => setInvite(openInviteFor(campaignId));
  const sendInvite = (person: Person): string | null => {
    if (emailBelongsToRecruiterOrCandidate(person.email)) {
      setRefused(true);
      return "refused";
    }
    if (approver && approver.email.toLowerCase() === person.email.trim().toLowerCase()) return `${approver.name} is already the approver.`;
    const created = createApproverInvite({ campaignId, campaignTitle: campaignTitle || "Untitled campaign", organisation, name: person.name.trim(), email: person.email.trim(), invitedBy: actorName, replaces: approver });
    if (!created) return "The invitation could not be saved. Try again.";
    appendCampaignActivity(campaignId, "campaign.approver_invited", actorName);
    setRefused(false);
    setReplacing(false);
    setNotice("");
    refresh();
    return null;
  };

  let view: React.ReactNode;
  if (preview !== "live") {
    view = <PreviewApprover state={preview} campaignTitle={campaignTitle} actorName={actorName} canManage={canManage} reason={reason} onGo={setPreview}/>;
  } else if (invite) {
    view = <InviteStatus invite={invite} current={approver} waiting={waiting} canManage={canManage} reason={reason} notice={notice}
      onResend={() => { const next = resendApproverInvite(invite.token); if (next) { setInvite(next); setNotice(next.status === "sent" ? `Sent again to ${next.email}.` : ""); } }}
      onCancel={() => { if (cancelApproverInvite(invite.token)) { appendCampaignActivity(campaignId, "campaign.approver_invite_cancelled", actorName); setNotice(""); refresh(); } }}/>;
  } else if (approver && !replacing) {
    view = <ApproverAccepted approver={approver} acceptedAt={acceptedAt} canManage={canManage} reason={reason} onReplace={() => setReplacing(true)}/>;
  } else if (!canManage) {
    view = <div className="ct-state ct-state-empty"><span className="ct-state-icon warning"><Icon name="user" size={18}/></span><div><strong>No approver yet</strong><p>The main recruiter invites the line manager. Until then, shortlists and offers cannot be decided.</p></div></div>;
  } else {
    view = <InviteForm current={replacing ? approver : null} waiting={waiting} refused={refused} onClearRefused={() => setRefused(false)} onSubmit={sendInvite} onCancel={replacing ? () => { setReplacing(false); setRefused(false); } : undefined}/>;
  }

  return <div className="ct-approver">
    <label className="ct-state-preview" title="Mock mode only: show each designed state of the approver group."><span>Preview state</span><select value={preview} onChange={event => setPreview(event.target.value as PreviewState)}>{(Object.keys(PREVIEW_LABEL) as PreviewState[]).map(key => <option key={key} value={key}>{PREVIEW_LABEL[key]}</option>)}</select></label>
    {view}
  </div>;
}

function InviteForm({ current, waiting, refused, onClearRefused, onSubmit, onCancel, initial }: {
  current: Person | null;
  waiting: Waiting;
  refused: boolean;
  onClearRefused: () => void;
  onSubmit: (person: Person) => string | null;
  onCancel?: () => void;
  initial?: Person;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [problem, setProblem] = useState<{ name?: string; email?: string; form?: string }>({});
  const total = waiting.shortlists + waiting.offers;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found: typeof problem = {};
    if (!name.trim()) found.name = "Enter the approver's name.";
    if (!email.trim()) found.email = "Enter the approver's work email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = "Enter a valid email, like name@company.com.";
    setProblem(found);
    if (found.name || found.email) return;
    const result = onSubmit({ name, email });
    if (result && result !== "refused") setProblem({ form: result });
  };

  return <form className="ct-invite-form" onSubmit={submit} noValidate>
    {current && (total > 0
      ? <div className="ct-callout warning" role="note"><Icon name="clock" size={18}/><div><strong>{describeWaiting(waiting)} {total === 1 ? "is" : "are"} waiting for {current.name}</strong><p>When the new approver accepts, waiting shortlists and offers move to them and {firstName(current.name)} can no longer decide them. Until then, {firstName(current.name)} stays the approver.</p></div></div>
      : <div className="ct-callout info" role="note"><Icon name="user" size={18}/><div><strong>Replacing {current.name}</strong><p>{firstName(current.name)} stays the approver until the new approver accepts the invitation.</p></div></div>)}
    {!current && <p className="ct-form-intro">Invite the line manager for this role. They get an email with a link to create an approver account. The link works for {INVITE_LIFETIME_DAYS} days.</p>}
    <div className="ct-form-grid">
      <label className={`campaign-edit-field${problem.name ? " has-error" : ""}`}><span>Name</span><input value={name} autoComplete="off" placeholder="e.g. Maria Shilongo" aria-invalid={problem.name ? true : undefined} onChange={event => { setName(event.target.value); setProblem(previous => ({ ...previous, name: undefined })); }}/>{problem.name && <small className="ct-field-error">{problem.name}</small>}</label>
      <label className={`campaign-edit-field${problem.email || refused ? " has-error" : ""}`}><span>Work email</span><input type="email" value={email} autoComplete="off" placeholder="name@company.com" aria-invalid={problem.email || refused ? true : undefined} aria-describedby={refused ? "ct-refused" : undefined} onChange={event => { setEmail(event.target.value); setProblem(previous => ({ ...previous, email: undefined })); onClearRefused(); }}/>{problem.email && <small className="ct-field-error">{problem.email}</small>}</label>
    </div>
    {refused && <div className="ct-callout danger" id="ct-refused" role="alert"><Icon name="close" size={18}/><div><strong>This email belongs to a recruiter or candidate account.</strong><p>An approver needs their own approver account. Use a different work email for the line manager, or add a recruiter under Additional recruiters instead.</p></div></div>}
    {problem.form && <p className="campaign-edit-error" role="alert">{problem.form}</p>}
    <div className="ct-actions">
      <Button type="submit" icon="mail">{current ? "Invite new approver" : "Invite approver"}</Button>
      {onCancel && <Button variant="ghost" onClick={onCancel}>Keep {current ? firstName(current.name) : "current approver"}</Button>}
    </div>
  </form>;
}

function InviteStatus({ invite, current, waiting, canManage, reason, notice, onResend, onCancel, preview = false }: {
  invite: ApproverInvite;
  current: Person | null;
  waiting: Waiting;
  canManage: boolean;
  reason: string | null;
  notice: string;
  onResend: () => void;
  onCancel: () => void;
  preview?: boolean;
}) {
  const [copy, setCopy] = useState<"idle" | "copied" | "error">("idle");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const failed = invite.status === "email_failed";
  const link = preview ? inviteUrl("demo") : inviteUrl(invite.token);
  const left = daysLeft(invite);
  const total = waiting.shortlists + waiting.offers;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopy("copied");
    } catch {
      setCopy("error");
    }
    window.setTimeout(() => setCopy("idle"), 2500);
  };

  return <div className={`ct-state ${failed ? "ct-state-failed" : "ct-state-sent"}`}>
    <div className="ct-state-top">
      <span className={`ct-state-icon ${failed ? "danger" : "info"}`}><Icon name="mail" size={18}/></span>
      <div className="ct-state-text">
        <strong>{failed ? "The invitation email could not be sent" : "Invitation sent"}</strong>
        <p><b>{invite.name}</b> · {invite.email}</p>
        <p className="ct-meta">{failed ? "Tried" : "Sent"} {formatInviteDate(invite.sentAt)} by {invite.invitedBy} · <span className="ct-expiry">{left === 0 ? "Expires today" : `Expires in ${left} day${left === 1 ? "" : "s"}`}</span></p>
      </div>
      <span className={`cw-pill ${failed ? "danger" : "warning"}`}>{failed ? "Not delivered" : "Waiting to accept"}</span>
    </div>

    {failed && <div className="ct-callout danger" role="alert"><Icon name="file" size={18}/><div><strong>Send the link yourself</strong><p>We could not deliver the email to {invite.email}. The address may be wrong, or their mail server refused it. Copy the invitation link and send it by chat or your own email. It works for {left} more day{left === 1 ? "" : "s"}, and only for {invite.email}. If the address is wrong, cancel and invite again.</p></div></div>}
    {current && <p className="ct-hint">{firstName(current.name)} stays the approver until {firstName(invite.name)} accepts.{total > 0 ? ` Then ${describeWaiting(waiting)} waiting for a decision move to ${firstName(invite.name)}.` : ""}</p>}
    {notice && <p className="campaign-edit-saved" role="status">{notice}</p>}

    {canManage ? <div className="ct-actions">
      {failed && <Button icon={copy === "copied" ? "check" : "file"} onClick={() => { void copyLink(); }}>{copy === "copied" ? "Link copied" : copy === "error" ? "Copy failed, try again" : "Copy link"}</Button>}
      <Button variant="secondary" icon="mail" onClick={onResend}>Send again</Button>
      <Button variant="ghost" className="ct-remove" onClick={() => setConfirmCancel(true)}>Cancel invitation</Button>
      <a className="ct-link" href={link} target="_blank" rel="noreferrer">Open invitation page <Icon name="external" size={13}/></a>
    </div> : <p className="ct-hint"><Icon name="lock" size={13}/> {reason}</p>}
    {confirmCancel && <div className="cw-confirm danger" role="alertdialog" aria-labelledby="ct-cancel-title">
      <strong id="ct-cancel-title">Cancel the invitation to {invite.name}?</strong>
      <p>The link stops working straight away. You can invite them or someone else again.</p>
      <div><Button variant="danger" onClick={() => { setConfirmCancel(false); onCancel(); }}>Cancel invitation</Button><Button variant="secondary" onClick={() => setConfirmCancel(false)}>Keep it</Button></div>
    </div>}
  </div>;
}

function ApproverAccepted({ approver, acceptedAt, canManage, reason, onReplace }: { approver: Person; acceptedAt?: string; canManage: boolean; reason: string | null; onReplace: () => void }) {
  return <div className="ct-state ct-state-accepted">
    <PersonRow person={approver} badge={<span className="cw-pill success"><Icon name="check" size={12}/> Approver</span>}/>
    <p className="ct-meta">{acceptedAt ? `Accepted ${formatInviteDate(acceptedAt)}. ` : ""}Shortlists and offers on this campaign go to {firstName(approver.name)} for a decision.</p>
    {canManage ? <div className="ct-actions">
      <Button variant="secondary" icon="user" onClick={onReplace}>Invite a new approver</Button>
      <span className="ct-hint">The new approver replaces {firstName(approver.name)} once they accept.</span>
    </div> : <p className="ct-hint"><Icon name="lock" size={13}/> {reason}</p>}
  </div>;
}

/** Sample data for each designed state, so reviewers can step through them. */
function PreviewApprover({ state, campaignTitle, actorName, canManage, reason, onGo }: { state: Exclude<PreviewState, "live">; campaignTitle: string; actorName: string; canManage: boolean; reason: string | null; onGo: (state: PreviewState) => void }) {
  const now = Date.now();
  const sample: ApproverInvite = {
    token: "demo", campaignId: "demo", campaignTitle: campaignTitle || "Senior Product Designer", organisation: "Northstar Labs",
    name: "Maria Shilongo", email: state === "failed" ? "maria.shilongo@northstarlabs.invalid" : "maria.shilongo@northstarlabs.com",
    invitedBy: actorName, status: state === "failed" ? "email_failed" : "sent", sentAt: new Date(now - 60 * 60 * 1000).toISOString(), expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString(),
  };
  const current = { name: "Johnny Test", email: "johnny.test@northstarlabs.com" };
  const none: Waiting = { shortlists: 0, offers: 0 };
  if (state === "sent" || state === "failed") return <InviteStatus key={state} preview invite={sample} current={null} waiting={none} canManage={canManage} reason={reason} notice="" onResend={() => onGo("sent")} onCancel={() => onGo("none")}/>;
  if (state === "accepted") return <ApproverAccepted approver={current} acceptedAt={new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString()} canManage={canManage} reason={reason} onReplace={() => onGo("replacing")}/>;
  if (!canManage) return <div className="ct-state ct-state-empty"><span className="ct-state-icon warning"><Icon name="user" size={18}/></span><div><strong>No approver yet</strong><p>The main recruiter invites the line manager. Until then, shortlists and offers cannot be decided.</p></div></div>;
  return <InviteForm key={state}
    current={state === "replacing" ? current : null}
    waiting={state === "replacing" ? { shortlists: 1, offers: 1 } : none}
    refused={state === "refused"}
    initial={state === "refused" ? { name: "Priya Naidoo", email: "priya.naidoo@northstarlabs.com" } : undefined}
    onClearRefused={() => undefined}
    onSubmit={() => { onGo("sent"); return null; }}
    onCancel={state === "replacing" ? () => onGo("accepted") : undefined}/>;
}
