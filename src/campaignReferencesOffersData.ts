import { useEffect, useState } from "react";
import type { CandidateStage } from "./campaignPipelineData";
import { renderCandidateMessage } from "./campaign/workspaceStore";

/* ------------------------------------------------------------------ */
/* Shared constants                                                     */
/* ------------------------------------------------------------------ */

export const employerName = "Northstar Labs";
export const MAX_REFEREES = 5;
export const OVERDUE_DAYS = 5;
export const LINK_VALID_DAYS = 14;
export const MAX_ANSWER_LENGTH = 2000;
export const MAX_CONDITIONS_LENGTH = 2000;
export const UNUSUAL_SALARY_THRESHOLD = 150000;
const DAY = 24 * 60 * 60 * 1000;

export const referenceQuestions = [
  "Can you confirm the dates and the role this person held?",
  "Would you employ this person again?",
  "What did they do well?",
  "Is there anything we should look into further?",
  "Overall, how would you describe working with them?",
];

/** Stages whose candidates appear on the References tab. */
export const referenceStages: CandidateStage[] = ["shortlist-approved", "reference-check", "offer"];

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export type RefereeStatus = "not-sent" | "sent" | "responded" | "declined";
export type RefereeDisplayStatus = "Not sent" | "Sent" | "Overdue" | "Responded" | "Declined";

export type Referee = {
  id: string;
  token: string;
  campaignId: string;
  candidateId: string;
  candidateName: string;
  roleTitle: string;
  name: string;
  relationship: string;
  company: string;
  email: string;
  status: RefereeStatus;
  addedAt: string;
  addedBy: string;
  /** When the first request was sent. */
  sentAt?: string;
  /** When the most recent request or reminder was sent; the link is valid for 14 days from here. */
  lastSentAt?: string;
  reminderCount?: number;
  respondedAt?: string;
  answers?: string[];
  checkedBy?: string;
  checkedAt?: string;
};

export type OfferStatus = "draft" | "pending" | "approved" | "sent" | "withdrawn";
export type WorkArrangement = "On site" | "Hybrid" | "Remote";

export type OfferDetails = {
  monthlySalary: number;
  startDate: string;
  probation: string;
  noticePeriod: string;
  reportsTo: string;
  workArrangement: WorkArrangement | "";
  conditions: string;
};

export type CandidateOffer = OfferDetails & {
  id: string;
  campaignId: string;
  candidateId: string;
  status: OfferStatus;
  /** The pipeline stage the candidate was in before the offer moved them to Offer. */
  previousStage: CandidateStage;
  draftedBy: string;
  draftedAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  withdrawnAt?: string;
  withdrawnBy?: string;
  withdrawReason?: string;
};

export type ReferencesOffersData = { referees: Referee[]; offers: CandidateOffer[] };

export const offerStatusLabels: Record<OfferStatus, string> = {
  draft: "Draft",
  pending: "Pending approval",
  approved: "Approved",
  sent: "Sent",
  withdrawn: "Withdrawn",
};
export const offerStatusTones: Record<OfferStatus, "neutral" | "warning" | "info" | "success" | "danger"> = {
  draft: "neutral",
  pending: "warning",
  approved: "info",
  sent: "success",
  withdrawn: "danger",
};
export const refereeStatusTones: Record<RefereeDisplayStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  "Not sent": "neutral",
  Sent: "info",
  Overdue: "warning",
  Responded: "success",
  Declined: "danger",
};

/* ------------------------------------------------------------------ */
/* Who is viewing (mock roles)                                          */
/* ------------------------------------------------------------------ */

export type ViewerRole = "main-recruiter" | "additional-recruiter" | "line-manager" | "admin" | "outsider";
export type CampaignViewer = { id: string; name: string; role: ViewerRole; label: string };

/** The References and Offers screens act as whoever the workspace previews. */
export function viewerFromActor(actor: { id: string; name: string; role: "admin" | "main_recruiter" | "additional_recruiter" | "line_manager" | "viewer" }): CampaignViewer {
  const role: ViewerRole = actor.role === "admin" ? "admin" : actor.role === "main_recruiter" ? "main-recruiter" : actor.role === "additional_recruiter" ? "additional-recruiter" : actor.role === "line_manager" ? "line-manager" : "outsider";
  return { id: actor.id, name: actor.name, role, label: actor.name };
}

export const canManageReferences = (viewer: CampaignViewer) => viewer.role === "main-recruiter" || viewer.role === "additional-recruiter" || viewer.role === "admin";
export const canManageOffers = (viewer: CampaignViewer) => viewer.role === "main-recruiter" || viewer.role === "admin";
export const canApproveOffers = (viewer: CampaignViewer) => viewer.role === "line-manager" || viewer.role === "admin";

export const referencesPermissionMessage = "Only recruiters on this campaign can manage references.";
export const offerManagePermissionMessage = "Only the main recruiter can draft, send or withdraw an offer.";
export const offerApprovePermissionMessage = "Only a line manager or an administrator can approve an offer.";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

export function getRefereeDisplayStatus(referee: Referee, now = Date.now()): RefereeDisplayStatus {
  if (referee.status === "responded") return "Responded";
  if (referee.status === "declined") return "Declined";
  if (referee.status === "not-sent") return "Not sent";
  const sent = Date.parse(referee.lastSentAt ?? referee.sentAt ?? "");
  return Number.isFinite(sent) && now - sent > OVERDUE_DAYS * DAY ? "Overdue" : "Sent";
}

export function isRefereeLinkExpired(referee: Referee, now = Date.now()) {
  const sent = Date.parse(referee.lastSentAt ?? referee.sentAt ?? "");
  return Number.isFinite(sent) && now - sent > LINK_VALID_DAYS * DAY;
}

export function formatDate(value?: string) {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatSalary(value: number) {
  return `NAD ${value.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getRefereeLink(token: string) {
  const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return `${window.location.origin}${basePath}reference/${token}`;
}

export function buildRefereeEmail(referee: Referee, reminder: boolean) {
  const subject = `${reminder ? "Reminder: " : ""}Reference request for ${referee.candidateName}`;
  const body = [
    `Hi ${referee.name},`,
    "",
    `${referee.candidateName} has applied for ${referee.roleTitle} at ${employerName} and named you as a referee.`,
    "",
    "Please answer five short questions using the link below. It takes about five minutes. You can also decline.",
    "",
    "[ Give a reference ]",
    "",
    `The link works once and expires in ${LINK_VALID_DAYS} days.`,
    "",
    "Thank you,",
    `Recruitment team, ${employerName}`,
  ].join("\n");
  return { to: `${referee.name} <${referee.email}>`, subject, body };
}

export function offerSummary(offer: CandidateOffer) {
  return { salary: offer.monthlySalary, startDate: offer.startDate, probation: offer.probation, noticePeriod: offer.noticePeriod, reportsTo: offer.reportsTo, workArrangement: offer.workArrangement || "Not set", conditions: offer.conditions.trim() || null };
}

export function buildOfferEmail(offer: CandidateOffer, candidate: { name: string; email: string }, roleTitle: string) {
  const { subject, body } = renderCandidateMessage("offer", candidate.name, roleTitle, { offer: offerSummary(offer) });
  return { to: candidate.email ? `${candidate.name} <${candidate.email}>` : "No email address on record", subject, body };
}

/* ------------------------------------------------------------------ */
/* Storage                                                              */
/* ------------------------------------------------------------------ */

const storageKey = "recruitflow.demoReferencesOffers";
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 60 * 60 * 1000).toISOString();
const inDays = (days: number) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
const token = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

function seedData(campaignId: string, roleTitle: string): ReferencesOffersData {
  const referee = (candidateId: string, candidateName: string, details: Partial<Referee> & Pick<Referee, "name" | "relationship" | "company" | "email" | "status">): Referee => ({
    id: createId("ref"),
    token: token(),
    campaignId,
    candidateId,
    candidateName,
    roleTitle,
    addedAt: ago(9),
    addedBy: "Dave Sench",
    ...details,
  });
  const sampleAnswers = [
    "Yes. She was a Product Designer with us from March 2021 to August 2024, working on our onboarding and billing products.",
    "Yes, without hesitation.",
    "Clear thinking, strong research habits and calm, practical collaboration with engineers.",
    "Nothing of concern. She is still growing as a people manager, which is normal at her level.",
    "Reliable, kind and very easy to work with. Teams were better for having her.",
  ];
  return {
    referees: [
      referee("mateo-silva", "Mateo Silva", { name: "Hannah Brooks", relationship: "Line manager", company: "Brightpath Studio", email: "hannah.brooks@brightpath.co", status: "responded", sentAt: ago(6), lastSentAt: ago(6), respondedAt: ago(4), answers: sampleAnswers.map(answer => answer.replace(/She|she/g, match => match === "She" ? "He" : "he").replace(/\bher\b/g, "him")) }),
      referee("mateo-silva", "Mateo Silva", { name: "Oliver Grant", relationship: "Senior colleague", company: "Brightpath Studio", email: "oliver.grant@brightpath.co", status: "sent", sentAt: ago(7), lastSentAt: ago(7) }),
      referee("mateo-silva", "Mateo Silva", { name: "Grace Mbeki", relationship: "Client lead", company: "Harbour Retail", email: "grace.mbeki@harbourretail.com", status: "not-sent", addedAt: ago(1) }),
      referee("sara-nguyen", "Sara Nguyen", { name: "Ben Carter", relationship: "Line manager", company: "Orbit Analytics", email: "ben.carter@orbitanalytics.io", status: "responded", sentAt: ago(10), lastSentAt: ago(10), respondedAt: ago(8), answers: sampleAnswers, checkedBy: "Dave Sench", checkedAt: ago(7) }),
      referee("sara-nguyen", "Sara Nguyen", { name: "Lena Fischer", relationship: "Product manager", company: "Orbit Analytics", email: "lena.fischer@orbitanalytics.io", status: "sent", sentAt: ago(2), lastSentAt: ago(2) }),
      referee("sara-nguyen", "Sara Nguyen", { name: "Tom Hale", relationship: "Former director", company: "Kestrel Labs", email: "tom.hale@kestrellabs.com", status: "sent", sentAt: ago(16), lastSentAt: ago(16) }),
    ],
    offers: [{
      id: createId("offer"),
      campaignId,
      candidateId: "sara-nguyen",
      status: "pending",
      previousStage: "reference-check",
      monthlySalary: 42000,
      startDate: inDays(30),
      probation: "3 months",
      noticePeriod: "1 month",
      reportsTo: "Head of Design",
      workArrangement: "Hybrid",
      conditions: "Subject to proof of qualifications and a clear background check.",
      draftedBy: "Dave Sench",
      draftedAt: ago(1, 4),
      updatedAt: ago(1, 2),
      submittedAt: ago(1, 2),
    }],
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";

function isReferee(value: unknown): value is Referee {
  return isRecord(value) && ["id", "token", "campaignId", "candidateId", "candidateName", "roleTitle", "name", "relationship", "company", "email", "addedAt", "addedBy"].every(key => isString(value[key])) &&
    (value.status === "not-sent" || value.status === "sent" || value.status === "responded" || value.status === "declined") &&
    (value.answers === undefined || (Array.isArray(value.answers) && value.answers.every(isString)));
}

function isOffer(value: unknown): value is CandidateOffer {
  return isRecord(value) && ["id", "campaignId", "candidateId", "previousStage", "startDate", "probation", "noticePeriod", "reportsTo", "workArrangement", "conditions", "draftedBy", "draftedAt", "updatedAt"].every(key => isString(value[key])) &&
    typeof value.monthlySalary === "number" && isString(value.status) && value.status in offerStatusLabels;
}

function isData(value: unknown): value is ReferencesOffersData {
  return isRecord(value) && Array.isArray(value.referees) && value.referees.every(isReferee) && Array.isArray(value.offers) && value.offers.every(isOffer);
}

function readAll(): Record<string, unknown> {
  const saved = window.localStorage.getItem(storageKey);
  const parsed: unknown = saved ? JSON.parse(saved) : {};
  if (!isRecord(parsed)) throw new Error("Saved references and offers are not in the expected format.");
  return parsed;
}

export function saveReferencesOffers(campaignId: string, data: ReferencesOffersData): string | null {
  try {
    if (!isData(data)) throw new Error("Reference and offer updates are not in the expected format.");
    window.localStorage.setItem(storageKey, JSON.stringify({ ...readAll(), [campaignId]: data }));
    return null;
  } catch (error) {
    console.error("Could not save references and offers to browser storage.", error);
    return "Changes could not be saved in this browser. Please try again.";
  }
}

/** Offers on this campaign waiting for approval, without seeding demo data. */
export function countPendingOffers(campaignId: string): number {
  try {
    const stored = readAll()[campaignId];
    return isData(stored) ? stored.offers.filter(offer => offer.status === "pending").length : 0;
  } catch {
    return 0;
  }
}

export function loadReferencesOffers(campaignId: string, roleTitle: string): { data: ReferencesOffersData; error: string | null } {
  try {
    const stored = readAll()[campaignId];
    if (stored === undefined) {
      const seeded = seedData(campaignId, roleTitle);
      saveReferencesOffers(campaignId, seeded);
      return { data: seeded, error: null };
    }
    if (!isData(stored)) throw new Error("Saved references and offers are not in the expected format.");
    return { data: stored, error: null };
  } catch (error) {
    console.error("Could not load references and offers from browser storage.", error);
    return { data: { referees: [], offers: [] }, error: "References and offers could not be loaded from this browser." };
  }
}

export function useReferencesOffers(campaignId: string, roleTitle: string) {
  const [state, setState] = useState(() => loadReferencesOffers(campaignId, roleTitle));
  useEffect(() => setState(loadReferencesOffers(campaignId, roleTitle)), [campaignId, roleTitle]);
  const update = (change: (data: ReferencesOffersData) => ReferencesOffersData) => {
    const latest = loadReferencesOffers(campaignId, roleTitle);
    const next = change(latest.error ? state.data : latest.data);
    const error = saveReferencesOffers(campaignId, next);
    setState({ data: error ? state.data : next, error });
    return error === null;
  };
  return { ...state, update };
}

/** Finds a referee anywhere in saved data from the token in their email link. */
export function findRefereeByToken(refereeToken: string): { campaignId: string; referee: Referee } | null {
  try {
    const all = readAll();
    for (const [campaignId, data] of Object.entries(all)) {
      if (!isData(data)) continue;
      const referee = data.referees.find(item => item.token === refereeToken);
      if (referee) return { campaignId, referee };
    }
  } catch (error) {
    console.error("Could not read reference requests from browser storage.", error);
  }
  return null;
}

export function updateRefereeByToken(refereeToken: string, change: (referee: Referee) => Referee): boolean {
  try {
    const all = readAll();
    for (const [campaignId, data] of Object.entries(all)) {
      if (!isData(data) || !data.referees.some(item => item.token === refereeToken)) continue;
      const next = { ...data, referees: data.referees.map(item => item.token === refereeToken ? change(item) : item) };
      return saveReferencesOffers(campaignId, next) === null;
    }
  } catch (error) {
    console.error("Could not update the reference request in browser storage.", error);
  }
  return false;
}
