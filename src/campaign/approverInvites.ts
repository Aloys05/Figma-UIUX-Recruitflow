import { ORGANISATION_PEOPLE } from "./team";

/**
 * Approver (line manager) invitations, kept in browser storage for the demo.
 * A campaign has at most one open invitation; accepting it makes the invitee
 * the campaign's line manager and moves waiting approvals to them.
 */

export const INVITE_LIFETIME_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

export type ApproverInviteStatus = "sent" | "email_failed" | "accepted" | "cancelled";

export type ApproverInvite = {
  token: string;
  campaignId: string;
  campaignTitle: string;
  organisation: string;
  name: string;
  email: string;
  invitedBy: string;
  status: ApproverInviteStatus;
  sentAt: string;
  expiresAt: string;
  acceptedAt?: string;
  /** The approver this invitation replaces once accepted. */
  replaces?: { name: string; email: string } | null;
};

const invitesKey = "recruitflow.approverInvites";
const accountsKey = "recruitflow.approverAccounts";
const sessionKey = "recruitflow.approverSession";

function readJson<T>(key: string, fallback: T, valid: (value: unknown) => boolean): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return valid(parsed) ? parsed as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Could not save ${key} to browser storage.`, error);
    return false;
  }
}

const isInvite = (value: unknown): value is ApproverInvite => {
  const item = value as Partial<ApproverInvite>;
  return typeof item === "object" && item !== null && typeof item.token === "string" && typeof item.campaignId === "string" && typeof item.email === "string" && typeof item.status === "string";
};

export function readApproverInvites(): ApproverInvite[] {
  return readJson<ApproverInvite[]>(invitesKey, [], value => Array.isArray(value) && value.every(isInvite));
}

function saveInvites(invites: ApproverInvite[]) {
  return writeJson(invitesKey, invites);
}

export const isOpenInvite = (invite: ApproverInvite) => invite.status === "sent" || invite.status === "email_failed";
export const isExpired = (invite: ApproverInvite, now = Date.now()) => Date.parse(invite.expiresAt) <= now;

/** The campaign's open (sent or failed) invitation, if any. */
export function openInviteFor(campaignId: string): ApproverInvite | null {
  return readApproverInvites().filter(item => item.campaignId === campaignId && isOpenInvite(item)).sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt))[0] ?? null;
}

export function lastAcceptedInviteFor(campaignId: string, email: string): ApproverInvite | null {
  return readApproverInvites().find(item => item.campaignId === campaignId && item.status === "accepted" && item.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function findInvite(token: string): ApproverInvite | null {
  return demoInvite(token) ?? readApproverInvites().find(item => item.token === token) ?? null;
}

const newToken = () => `${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;

export function inviteUrl(token: string) {
  const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return `${window.location.origin}${basePath}approver-invite/${token}`;
}

/** Demo rule: addresses on the reserved `.invalid` domain bounce, so the "could not send" state can be tried. */
const emailBounces = (email: string) => /\.invalid$/i.test(email.trim());

export function createApproverInvite(input: Omit<ApproverInvite, "token" | "status" | "sentAt" | "expiresAt" | "acceptedAt">): ApproverInvite | null {
  const now = Date.now();
  const invite: ApproverInvite = {
    ...input,
    token: newToken(),
    status: emailBounces(input.email) ? "email_failed" : "sent",
    sentAt: new Date(now).toISOString(),
    expiresAt: new Date(now + INVITE_LIFETIME_DAYS * DAY).toISOString(),
  };
  // Only one open invitation per campaign: a new one cancels the previous one.
  const rest = readApproverInvites().map(item => item.campaignId === input.campaignId && isOpenInvite(item) ? { ...item, status: "cancelled" as const } : item);
  return saveInvites([...rest, invite]) ? invite : null;
}

function patchInvite(token: string, change: (invite: ApproverInvite) => ApproverInvite): ApproverInvite | null {
  const invites = readApproverInvites();
  const current = invites.find(item => item.token === token);
  if (!current) return null;
  const next = change(current);
  return saveInvites(invites.map(item => item.token === token ? next : item)) ? next : null;
}

/** Sends the email again and restarts the 7 days. */
export function resendApproverInvite(token: string) {
  const now = Date.now();
  return patchInvite(token, invite => ({ ...invite, status: emailBounces(invite.email) ? "email_failed" : "sent", sentAt: new Date(now).toISOString(), expiresAt: new Date(now + INVITE_LIFETIME_DAYS * DAY).toISOString() }));
}

export function cancelApproverInvite(token: string) {
  return patchInvite(token, invite => ({ ...invite, status: "cancelled" }));
}

export function markInviteAccepted(token: string) {
  return patchInvite(token, invite => ({ ...invite, status: "accepted", acceptedAt: new Date().toISOString() }));
}

/* ------------------------------------------------------------------ */
/* Who an email belongs to                                              */
/* ------------------------------------------------------------------ */

const KNOWN_CANDIDATE_EMAILS = ["alex@example.com"];

/** Approvers need their own account: recruiter and candidate emails are refused. */
export function emailBelongsToRecruiterOrCandidate(email: string): boolean {
  const wanted = email.trim().toLowerCase();
  if (ORGANISATION_PEOPLE.some(person => person.email.toLowerCase() === wanted)) return true;
  if (KNOWN_CANDIDATE_EMAILS.includes(wanted)) return true;
  const team = readJson<{ members?: Array<{ email?: string }> }>("recruitflow.demoTeam", {}, value => typeof value === "object" && value !== null);
  if (team.members?.some(member => member.email?.toLowerCase() === wanted)) return true;
  // Anyone who has applied to a campaign has a candidate account.
  const workspace = readJson<Record<string, { applications?: Array<{ email?: string }> }>>("recruitflow.campaignWorkspace", {}, value => typeof value === "object" && value !== null);
  return Object.values(workspace).some(data => data?.applications?.some(application => application.email?.toLowerCase() === wanted));
}

/* ------------------------------------------------------------------ */
/* Mock approver accounts and sign-in                                   */
/* ------------------------------------------------------------------ */

export type ApproverAccount = { name: string; email: string };

const SEEDED_ACCOUNTS: ApproverAccount[] = [{ name: "Johnny Test", email: "johnny.test@northstarlabs.com" }];

export function readApproverAccounts(): ApproverAccount[] {
  const saved = readJson<ApproverAccount[]>(accountsKey, [], value => Array.isArray(value));
  return [...SEEDED_ACCOUNTS, ...saved.filter(item => !SEEDED_ACCOUNTS.some(seed => seed.email === item.email))];
}

export function approverAccountExists(email: string) {
  return readApproverAccounts().some(account => account.email.toLowerCase() === email.toLowerCase());
}

export function createApproverAccount(account: ApproverAccount) {
  const saved = readJson<ApproverAccount[]>(accountsKey, [], value => Array.isArray(value));
  return writeJson(accountsKey, [...saved.filter(item => item.email.toLowerCase() !== account.email.toLowerCase()), account]);
}

export function readApproverSession(): ApproverAccount | null {
  return readJson<ApproverAccount | null>(sessionKey, null, value => typeof value === "object" && value !== null && typeof (value as ApproverAccount).email === "string");
}

export function signInApprover(account: ApproverAccount) {
  return writeJson(sessionKey, account);
}

export function signOutApprover() {
  try {
    window.localStorage.removeItem(sessionKey);
  } catch {
    // Nothing to clear.
  }
}

/* ------------------------------------------------------------------ */
/* Demo links, so the invitation page can be reviewed without setup     */
/* ------------------------------------------------------------------ */

function demoInvite(token: string): ApproverInvite | null {
  if (!token.startsWith("demo")) return null;
  const now = Date.now();
  const base: ApproverInvite = {
    token,
    campaignId: "demo",
    campaignTitle: "Senior Product Designer",
    organisation: "Northstar Labs",
    name: "Maria Shilongo",
    email: "maria.shilongo@northstarlabs.com",
    invitedBy: "Dave Sench",
    status: "sent",
    sentAt: new Date(now - DAY).toISOString(),
    expiresAt: new Date(now + (INVITE_LIFETIME_DAYS - 1) * DAY).toISOString(),
  };
  if (token === "demo") return base;
  if (token === "demo-expired") return { ...base, sentAt: new Date(now - 9 * DAY).toISOString(), expiresAt: new Date(now - 2 * DAY).toISOString() };
  if (token === "demo-used") return { ...base, status: "accepted", acceptedAt: new Date(now - DAY).toISOString() };
  return null;
}

export function formatInviteDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function daysLeft(invite: ApproverInvite, now = Date.now()) {
  return Math.max(0, Math.ceil((Date.parse(invite.expiresAt) - now) / DAY));
}
