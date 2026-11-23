import { useState } from "react";
import { Button, Icon } from "./ui";
import {
  approverAccountExists,
  createApproverAccount,
  daysLeft,
  findInvite,
  formatInviteDate,
  isExpired,
  readApproverSession,
  signInApprover,
  signOutApprover,
  type ApproverAccount,
  type ApproverInvite,
} from "./campaign/approverInvites";

type Version = "new" | "existing" | "signed-in" | "other" | "invalid" | "expired" | "used";
const VERSION_LABEL: Record<Version, string> = {
  new: "1. New account",
  existing: "2. Account exists",
  "signed-in": "3. Signed in as the right person",
  other: "4. Signed in as someone else",
  invalid: "5a. Link not valid",
  expired: "5b. Link expired",
  used: "5c. Link already used",
};
const isVersion = (value: string | null): value is Version => value !== null && value in VERSION_LABEL;

const PASSWORD_RULES: Array<{ label: string; test: (value: string) => boolean }> = [
  { label: "At least 8 characters", test: value => value.length >= 8 },
  { label: "An uppercase and a lowercase letter", test: value => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { label: "At least one number", test: value => /\d/.test(value) },
];

const OTHER_ACCOUNT: ApproverAccount = { name: "Sam Iyambo", email: "sam.iyambo@harbourretail.com" };
const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
const initials = (name: string) => name.split(" ").map(part => part[0]).join("").toUpperCase().slice(0, 2);

function go(path: string) {
  const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  window.history.pushState({}, "", `${basePath}${path.replace(/^\/+/, "")}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function naturalVersion(invite: ApproverInvite | null, session: ApproverAccount | null): Version {
  if (!invite || invite.status === "cancelled") return "invalid";
  if (invite.status === "accepted") return "used";
  if (isExpired(invite)) return "expired";
  if (session) return session.email.toLowerCase() === invite.email.toLowerCase() ? "signed-in" : "other";
  return approverAccountExists(invite.email) ? "existing" : "new";
}

export default function ApproverInvitePage({ token, onAccepted }: { token: string; onAccepted: (invite: ApproverInvite) => boolean }) {
  const invite = findInvite(token);
  const [, setTick] = useState(0);
  const refresh = () => setTick(value => value + 1);
  const [preview, setPreview] = useState<Version | "live">(() => {
    const requested = new URLSearchParams(window.location.search).get("preview");
    return isVersion(requested) ? requested : "live";
  });
  const [mode, setMode] = useState<"auto" | "new" | "existing">("auto");
  const [done, setDone] = useState(false);

  const realSession = readApproverSession();
  let version: Version = preview === "live" ? naturalVersion(invite, realSession) : preview;
  if (preview === "live" && mode !== "auto" && (version === "new" || version === "existing")) version = mode;
  const session = preview === "live" ? realSession : version === "signed-in" && invite ? { name: invite.name, email: invite.email } : version === "other" ? OTHER_ACCOUNT : null;
  const isError = version === "invalid" || version === "expired" || version === "used";

  const changePreview = (next: Version | "live") => {
    setPreview(next);
    setMode("auto");
    setDone(false);
    const url = new URL(window.location.href);
    if (next === "live") url.searchParams.delete("preview");
    else url.searchParams.set("preview", next);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  };

  const accept = (account: ApproverAccount, kind: "create" | "sign-in" | "accept"): string | null => {
    if (!invite) return "This invitation link is not valid.";
    if (preview !== "live") {
      setDone(true);
      return null;
    }
    if (kind === "create" && !createApproverAccount(account)) return "We could not create your account. Try again.";
    if (kind !== "accept" && !signInApprover(account)) return "We could not sign you in. Try again.";
    if (!onAccepted(invite)) return "We could not accept the invitation. Try again.";
    setDone(true);
    return null;
  };

  return <div className="auth-layout auth-login ai-page">
    <aside className="auth-aside ai-aside">
      <div className="auth-brand-lockup"><button className="logo" onClick={() => go("/approver/login")}><span className="brand-symbol"><img src={asset("assets/recruitflow-logo.png")} alt=""/></span><span>RecruitFlow</span></button><span>by Refrane</span></div>
      <div className="ai-aside-body">
        <span className="auth-feature-eyebrow">APPROVER INVITATION</span>
        {invite && version !== "invalid" ? <>
          <h2 className="ai-headline">{invite.organisation} has asked you to approve hiring for {invite.campaignTitle}.</h2>
          <p className="ai-lede">You will review the shortlist and the offer, and approve them or send them back with a reason.</p>
          <ol className="ai-steps">
            <li><span>1</span><div><strong>Review the shortlist</strong><small>The recruiter proposes the candidates they recommend.</small></div></li>
            <li><span>2</span><div><strong>Review the offer</strong><small>Salary, start date and terms, before the candidate sees it.</small></div></li>
            <li><span>3</span><div><strong>Approve or send back</strong><small>If something is not right, send it back with a reason.</small></div></li>
          </ol>
          <p className="ai-invited-by"><Icon name="mail" size={14}/>Invited by {invite.invitedBy} · {invite.organisation}</p>
        </> : <>
          <h2 className="ai-headline">Approve hiring decisions with RecruitFlow.</h2>
          <p className="ai-lede">Line managers use an approver account to review shortlists and offers for the roles they are hiring for.</p>
        </>}
      </div>
      <p className="aside-foot">RecruitFlow by Refrane</p>
    </aside>

    <main className="auth-main ai-main">
      <div className="auth-form ai-form">
        <label className="cw-preview-as ai-preview" title="Mock mode only: show each designed version of this page."><span>Preview</span><select value={preview} onChange={event => changePreview(event.target.value as Version | "live")}><option value="live">Live data</option>{(Object.keys(VERSION_LABEL) as Version[]).map(key => <option key={key} value={key}>{VERSION_LABEL[key]}</option>)}</select></label>

        {done && invite ? <Accepted invite={invite}/>
          : isError ? <InviteError version={version} invite={invite}/>
          : invite && version === "new" ? <NewAccount key={`new-${preview}`} invite={invite} onSubmit={account => accept(account, "create")} onSwitch={() => setMode("existing")}/>
          : invite && version === "existing" ? <SignIn key={`existing-${preview}`} invite={invite} onSubmit={account => accept(account, "sign-in")} onSwitch={() => setMode("new")}/>
          : invite && version === "signed-in" && session ? <SignedIn invite={invite} session={session} onAccept={() => accept(session, "accept")} onSignOut={() => { if (preview === "live") { signOutApprover(); refresh(); } else changePreview("existing"); }}/>
          : invite && session ? <SignedInAsOther invite={invite} session={session} onSignOut={() => { if (preview === "live") { signOutApprover(); setMode("auto"); refresh(); } else changePreview("existing"); }}/>
          : null}
      </div>
    </main>
  </div>;
}

function InviteSummary({ invite }: { invite: ApproverInvite }) {
  const left = daysLeft(invite);
  return <div className="ai-summary">
    <span className="org-icon">{invite.organisation.charAt(0)}</span>
    <span><strong>{invite.campaignTitle}</strong><small>{invite.organisation} · Approver · {left === 0 ? "Expires today" : `Expires in ${left} day${left === 1 ? "" : "s"}`}</small></span>
  </div>;
}

function LockedEmail({ email }: { email: string }) {
  return <label className="field"><span className="field-label">Email address</span><span className="input-wrap ai-locked"><Icon name="mail" size={17}/><input type="email" value={email} readOnly aria-readonly="true"/><Icon name="lock" size={15}/></span><span className="field-helper">This invitation is for this email only.</span></label>;
}

function FormError({ message }: { message: string }) {
  return message ? <p className="demo-storage-error" role="alert">{message}</p> : null;
}

function NewAccount({ invite, onSubmit, onSwitch }: { invite: ApproverInvite; onSubmit: (account: ApproverAccount) => string | null; onSwitch: () => void }) {
  const [name, setName] = useState(invite.name);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState("");
  const rulesMet = PASSWORD_RULES.every(rule => rule.test(password));
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (!name.trim() || !rulesMet) return;
    setError(onSubmit({ name: name.trim(), email: invite.email }) ?? "");
  };
  return <>
    <div className="auth-heading"><span className="auth-kicker">You're invited</span><h1>Create your approver account</h1><p>Set a password, and you accept the invitation in the same step.</p></div>
    <InviteSummary invite={invite}/>
    <form onSubmit={submit} noValidate>
      <label className="field"><span className="field-label">Full name</span><span className="input-wrap"><Icon name="user" size={17}/><input value={name} autoComplete="name" aria-invalid={tried && !name.trim() ? true : undefined} onChange={event => setName(event.target.value)}/></span>{tried && !name.trim() && <span className="ai-field-error">Enter your name.</span>}</label>
      <LockedEmail email={invite.email}/>
      <label className="field"><span className="field-label">Password</span><span className="input-wrap"><Icon name="lock" size={17}/><input type={show ? "text" : "password"} value={password} autoComplete="new-password" aria-describedby="ai-rules" aria-invalid={tried && !rulesMet ? true : undefined} onChange={event => setPassword(event.target.value)}/><button type="button" className="ai-eye" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(value => !value)}><Icon name="eye" size={17}/></button></span></label>
      <ul className="ai-rules" id="ai-rules" aria-label="Password rules">{PASSWORD_RULES.map(rule => {
        const met = rule.test(password);
        return <li key={rule.label} className={met ? "met" : tried ? "missing" : ""}><span aria-hidden="true">{met ? <Icon name="check" size={12}/> : tried ? <Icon name="close" size={12}/> : null}</span>{rule.label}<span className="sr-only">{met ? " (done)" : " (not yet)"}</span></li>;
      })}</ul>
      <FormError message={error}/>
      <Button type="submit" className="full">Create account and accept</Button>
    </form>
    <p className="auth-bottom">Already have an approver account? <button type="button" onClick={onSwitch}>Sign in to accept</button></p>
  </>;
}

function SignIn({ invite, onSubmit, onSwitch }: { invite: ApproverInvite; onSubmit: (account: ApproverAccount) => string | null; onSwitch: () => void }) {
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (!password) return;
    setError(onSubmit({ name: invite.name, email: invite.email }) ?? "");
  };
  return <>
    <div className="auth-heading"><span className="auth-kicker">You're invited</span><h1>Sign in to accept</h1><p>You already have an approver account with {invite.email}. Sign in, and this role is added to your approvals.</p></div>
    <InviteSummary invite={invite}/>
    <form onSubmit={submit} noValidate>
      <LockedEmail email={invite.email}/>
      <label className="field"><span className="field-label">Password</span><span className="input-wrap"><Icon name="lock" size={17}/><input type="password" value={password} autoComplete="current-password" aria-invalid={tried && !password ? true : undefined} onChange={event => setPassword(event.target.value)}/></span>{tried && !password && <span className="ai-field-error">Enter your password.</span>}</label>
      <div className="form-options"><span/><button type="button" onClick={() => go("/forgot-password")}>Forgot password?</button></div>
      <FormError message={error}/>
      <Button type="submit" className="full">Sign in to accept</Button>
    </form>
    <p className="auth-bottom">No approver account yet? <button type="button" onClick={onSwitch}>Create one</button></p>
  </>;
}

function AccountCard({ account, tone = "blue" }: { account: ApproverAccount; tone?: "blue" | "amber" }) {
  return <div className={`ai-account ${tone}`}><span className="ai-avatar">{initials(account.name)}</span><span><small>Signed in as</small><strong>{account.name}</strong><em>{account.email}</em></span></div>;
}

function SignedIn({ invite, session, onAccept, onSignOut }: { invite: ApproverInvite; session: ApproverAccount; onAccept: () => string | null; onSignOut: () => void }) {
  const [error, setError] = useState("");
  return <>
    <div className="auth-heading"><span className="auth-kicker">You're invited</span><h1>Accept the invitation</h1><p>You become the approver for {invite.campaignTitle}. Shortlists and offers for this role will wait for your decision.</p></div>
    <InviteSummary invite={invite}/>
    <AccountCard account={session}/>
    <FormError message={error}/>
    <Button className="full" icon="check" onClick={() => setError(onAccept() ?? "")}>Accept invitation</Button>
    <p className="auth-bottom">Not {session.name.split(" ")[0]}? <button type="button" onClick={onSignOut}>Sign out</button></p>
  </>;
}

function SignedInAsOther({ invite, session, onSignOut }: { invite: ApproverInvite; session: ApproverAccount; onSignOut: () => void }) {
  return <>
    <div className="auth-heading"><span className="auth-kicker">Wrong account</span><h1>This invitation is for someone else</h1><p>You are signed in as {session.email}, but {invite.organisation} sent this invitation to <strong>{invite.email}</strong>. Only that person can accept it.</p></div>
    <AccountCard account={session} tone="amber"/>
    <div className="ai-callout"><Icon name="user" size={18}/><p>Sign out, then sign in or create an account with {invite.email}. If this invitation should be yours, ask {invite.invitedBy} to send it to your email instead.</p></div>
    <Button className="full" icon="logOut" onClick={onSignOut}>Sign out</Button>
  </>;
}

function Accepted({ invite }: { invite: ApproverInvite }) {
  return <div className="ai-result">
    <span className="ai-result-icon success"><Icon name="check" size={28}/></span>
    <h1>You're the approver for {invite.campaignTitle}</h1>
    <p>{invite.invitedBy} has been told. When a shortlist or an offer is ready, it appears in your approvals and we email you.</p>
    <Button className="full" onClick={() => go("/approver")}>Go to my approvals</Button>
  </div>;
}

function InviteError({ version, invite }: { version: Version; invite: ApproverInvite | null }) {
  const asker = invite ? `${invite.invitedBy} at ${invite.organisation}` : "the recruiter who invited you";
  const copy = version === "expired"
    ? { icon: "clock" as const, tone: "warning", title: "This invitation has expired", text: `Invitations work for 7 days${invite ? `, and this one ended on ${formatInviteDate(invite.expiresAt)}` : ""}. Ask ${asker} to send it again.`, action: null }
    : version === "used"
      ? { icon: "check" as const, tone: "info", title: "This invitation has already been used", text: `${invite ? `It was accepted${invite.acceptedAt ? ` on ${formatInviteDate(invite.acceptedAt)}` : ""}. ` : ""}If that was you, sign in to see your approvals. If not, ask ${asker} for a new invitation.`, action: "Sign in" }
      : { icon: "close" as const, tone: "danger", title: "This invitation link is not valid", text: "The link may be incomplete, or the invitation was cancelled. Check that you copied the whole link from the email, or ask the recruiter who invited you for a new one.", action: null };
  return <div className="ai-result">
    <span className={`ai-result-icon ${copy.tone}`}><Icon name={copy.icon} size={28}/></span>
    <h1>{copy.title}</h1>
    <p>{copy.text}</p>
    {copy.action && <Button className="full" onClick={() => go("/approver/login")}>{copy.action}</Button>}
    <p className="auth-bottom">Hiring a candidate or applying for a job? <button type="button" onClick={() => go("/login")}>Go to RecruitFlow sign in</button></p>
  </div>;
}
