import { useEffect, useRef, useState } from "react";
import { getCandidateScreeningData, loadCampaignCandidates, type CampaignCandidate, type CandidateStage } from "../campaignPipelineData";
import { canPerform, type CampaignActor, type CampaignRole, type CampaignTeamMember } from "./permissions";

/* ------------------------------------------------------------------ */
/* Stages and board move rules (ported from Refrane pipelineMoves)      */
/* ------------------------------------------------------------------ */

export type StageId = CandidateStage;

export const PIPELINE_STAGES: ReadonlyArray<{ id: StageId; name: string; helpText: string }> = [
  { id: "longlist", name: "Longlist", helpText: "Candidates currently in the longlist." },
  { id: "below-requirements", name: "Below requirements", helpText: "Candidates who are below the campaign requirements." },
  { id: "shortlist-proposed", name: "Shortlist proposed", helpText: "Candidates included in a shortlist proposal." },
  { id: "shortlist-approved", name: "Shortlist approved", helpText: "Candidates approved for the shortlist." },
  { id: "reference-check", name: "Reference check", helpText: "Candidates at the reference check stage." },
  { id: "offer", name: "Offer", helpText: "Candidates at the offer stage." },
  { id: "rejected", name: "Rejected", helpText: "Candidates whose application was rejected." },
];

export const stageName = (stage: StageId) => PIPELINE_STAGES.find(item => item.id === stage)?.name ?? stage;

export function applicationStatusLabel(stage: StageId) {
  return stage === "longlist" ? "Longlisted" : stageName(stage);
}

export type DirectMoveKind = "override" | "reject" | "unreject";
export type AllowedMove = { to: StageId; allowed: boolean; reason: string | null; kind: DirectMoveKind | null };

const REJECTABLE_FROM: StageId[] = ["longlist", "below-requirements", "shortlist-approved", "reference-check"];

function directMove(from: StageId, to: StageId): { kind: DirectMoveKind; action: "manageLonglist" | "reject" } | null {
  if (from === "below-requirements" && to === "longlist") return { kind: "override", action: "manageLonglist" };
  if (to === "rejected" && REJECTABLE_FROM.includes(from)) return { kind: "reject", action: "reject" };
  if (from === "rejected" && to === "longlist") return { kind: "unreject", action: "reject" };
  return null;
}

function blockedReason(from: StageId, to: StageId): string {
  switch (to) {
    case "below-requirements": return "Below requirements is decided by screening against the campaign requirements.";
    case "shortlist-proposed": return from === "longlist" ? "Propose a shortlist to move candidates here." : "Only longlisted candidates can be proposed for a shortlist.";
    case "shortlist-approved": return "Only the line manager approves a shortlist, from the Approvals screen.";
    case "reference-check": return from === "shortlist-approved" ? "Add a referee to start reference checks." : "Reference checks start after the shortlist is approved.";
    case "offer": return from === "shortlist-approved" || from === "reference-check" ? "Draft an offer from the Offers tab." : "An offer follows an approved shortlist.";
    case "rejected":
      if (from === "shortlist-proposed") return "Withdraw the proposal, or wait for the line manager, before rejecting.";
      if (from === "offer") return "Withdraw the offer before rejecting.";
      return "This candidate cannot be rejected from here.";
    case "longlist":
      if (from === "shortlist-proposed") return "Withdraw the proposal, or let the line manager return it.";
      if (from === "offer") return "Withdraw the offer to move this candidate back.";
      return "An approved candidate can only move on, or be rejected.";
  }
}

export function describeMove(from: StageId, to: StageId, role: CampaignRole): AllowedMove {
  if (from === to) return { to, allowed: false, reason: "The candidate is already in this stage.", kind: null };
  const move = directMove(from, to);
  if (!move) return { to, allowed: false, reason: blockedReason(from, to), kind: null };
  const permission = canPerform(role, move.action);
  if (!permission.allowed) return { to, allowed: false, reason: permission.reason, kind: move.kind };
  return { to, allowed: true, reason: null, kind: move.kind };
}

/** Moves that open another tab instead of moving the card on the board. */
export function workflowTabForMove(from: StageId, to: StageId): "references" | "offers" | null {
  if (to === "reference-check" && from === "shortlist-approved") return "references";
  if (to === "offer" && (from === "shortlist-approved" || from === "reference-check")) return "offers";
  return null;
}

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export type CriterionStatus = "Met" | "Unverified" | "Not met";
export type ReviewStatus = "Not submitted" | "Returned for revision" | "Under review" | "Reviewed";
export type ScreeningState = "Completed" | "Pending" | "Failed";

export type ScreeningSource = "Checked by AI" | "Checked against the form" | "Set by a recruiter";
export type ScreeningEvidence = { reason: string; source: ScreeningSource };
export type ScreeningCorrection = { result: "Met" | "Not met"; note: string; who: string; correctedAt: string; originalResult: CriterionStatus; originalReason: string; originalSource: ScreeningSource };

export type RejectionDecision = { reason: string; decidedBy: string; decidedAt: string; sharedWithCandidate: boolean };

export type WorkspaceApplication = {
  id: string;
  name: string;
  email: string;
  headline: string;
  location: string;
  experienceYears: number;
  profession: string;
  availability: string;
  qualification: string;
  languages: string[];
  skills: string[];
  employer: string;
  notes: string;
  source: string;
  fitScore: number;
  aiScreeningSummary: string;
  /** Screening results by lower-case requirement name. Requirements without a result read as Unverified. */
  results: Record<string, CriterionStatus>;
  /** Why screening gave each result, and where it came from. */
  evidence?: Record<string, ScreeningEvidence>;
  /** Recruiter corrections, keyed like results. */
  corrections?: Record<string, ScreeningCorrection>;
  screeningError?: string;
  screeningState: ScreeningState;
  stage: StageId;
  previousStage?: StageId;
  appliedDate: string;
  reviewStatus: ReviewStatus;
  skillsMatch: { matched: number; total: number; percentage: number };
  tags: string[];
  assignedReviewer?: string;
  rejection?: RejectionDecision;
  overridden?: boolean;
  overrideReason?: string;
  proposalId?: string;
};

export type ProposalStatus = "Pending approval" | "Approved" | "Returned" | "Partially approved" | "Withdrawn";
export type ProposalItemDecision = { decision: "Approved" | "Returned"; comment: string };

export type ShortlistProposal = {
  id: string;
  name: string;
  version: number;
  status: ProposalStatus;
  approverId: string;
  approverName: string;
  submittedBy: string;
  submittedById: string;
  submittedAt: string;
  note: string;
  applicationIds: string[];
  decisions: Record<string, ProposalItemDecision>;
  decidedBy?: string;
  decidedAt?: string;
  withdrawalReason?: string;
  withdrawnAt?: string;
};

export type ActivityAction =
  | "campaign.member_added" | "campaign.member_role_changed" | "campaign.member_removed" | "campaign.criteria_updated"
  | "campaign.published" | "campaign.unpublished" | "campaign.paused" | "campaign.closed" | "campaign.reopened" | "campaign.closing_date_set"
  | "application.screened" | "application.moved" | "application.overridden" | "application.rejected"
  | "shortlist.proposed" | "shortlist.withdrawn" | "shortlist.decided" | "application.corrected" | "campaign.exported"
  | "campaign.approver_invited" | "campaign.approver_invite_cancelled" | "campaign.approver_accepted";

export type ActivityEvent = { id: string; actorName: string | null; action: ActivityAction; count?: number; createdAt: string };

export const MESSAGE_TEMPLATES = ["application_received", "shortlisted", "reference_check_started", "offer", "not_selected"] as const;
export type MessageTemplate = (typeof MESSAGE_TEMPLATES)[number];
export type MessageStatus = "queued" | "sending" | "sent" | "failed";
export const MESSAGE_TEMPLATE_LABEL: Record<MessageTemplate, string> = {
  application_received: "Application received",
  shortlisted: "Shortlisted",
  reference_check_started: "Reference check started",
  offer: "Offer",
  not_selected: "Not selected",
};
export const DEFAULT_AUTO_SEND: Record<MessageTemplate, boolean> = {
  application_received: true,
  shortlisted: false,
  reference_check_started: false,
  offer: false,
  not_selected: false,
};

export type CandidateMessage = {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  template: MessageTemplate;
  subject: string;
  body: string;
  status: MessageStatus;
  error: string | null;
  createdAt: string;
  sentAt: string | null;
  sentBy: string | null;
};

export type OfferSummary = { salary: number; startDate: string; probation: string; noticePeriod: string; reportsTo: string; workArrangement: string; conditions: string | null };

export type WorkspaceData = {
  applications: WorkspaceApplication[];
  proposals: ShortlistProposal[];
  activity: ActivityEvent[];
  messages: CandidateMessage[];
  autoSend: Record<MessageTemplate, boolean>;
  emailConfigured: boolean;
};

export type WorkspaceRequirement = { id: string; title: string; category: string; kind: "Must-have" | "Preferred"; weight: number; value?: string };

/* ------------------------------------------------------------------ */
/* Screening view of an application against the current requirements   */
/* ------------------------------------------------------------------ */

export type ScreenedCriterion = {
  key: string;
  name: string;
  status: CriterionStatus;
  mustHave: boolean;
  weight: number;
  reason: string;
  source: ScreeningSource;
  correction?: ScreeningCorrection;
};

export type ApplicationScreening = {
  criteria: ScreenedCriterion[];
  mustHave: { met: number; total: number; failed: string[] };
  preferredCriteria: { met: number; total: number };
  unverified: number;
  requirementsSummary: "Meets requirements" | "Needs verification" | "Requirement not met" | "No requirements set";
  /** Weighted: Met counts in full, Needs verification counts half, Not met counts nothing. */
  requirementsScore: number;
  screeningFailed: boolean;
  screeningPending: boolean;
  knockedOut: boolean;
};

export const requirementKey = (title: string) => title.trim().toLowerCase();

function fallbackReason(status: CriterionStatus, name: string) {
  const subject = name.toLowerCase();
  if (status === "Met") return `The application shows evidence for ${subject}.`;
  if (status === "Not met") return `The application does not provide evidence that meets ${subject}.`;
  return `There is not enough evidence yet to confirm ${subject}.`;
}

export function screenApplication(application: WorkspaceApplication, requirements: readonly WorkspaceRequirement[]): ApplicationScreening {
  const criteria: ScreenedCriterion[] = requirements.map(requirement => {
    const key = requirementKey(requirement.title);
    const name = requirement.title || "Untitled requirement";
    const correction = application.corrections?.[key];
    const screened = application.results[key] ?? "Unverified" as CriterionStatus;
    const evidence = application.evidence?.[key];
    return {
      key,
      name,
      status: correction?.result ?? screened,
      mustHave: requirement.kind === "Must-have",
      weight: requirement.weight || 1,
      reason: correction?.note ?? evidence?.reason ?? fallbackReason(screened, name),
      source: correction ? "Set by a recruiter" : evidence?.source ?? "Checked by AI",
      correction,
    };
  });
  const must = criteria.filter(item => item.mustHave);
  const preferred = criteria.filter(item => !item.mustHave);
  const failed = must.filter(item => item.status === "Not met").map(item => item.name);
  const unverified = criteria.filter(item => item.status === "Unverified").length;
  // The summary follows the must-haves: preferred criteria only help rank candidates.
  const mustUnverified = must.filter(item => item.status === "Unverified").length;
  const requirementsSummary = !criteria.length ? "No requirements set" : failed.length ? "Requirement not met" : mustUnverified ? "Needs verification" : "Meets requirements";
  const totalWeight = criteria.reduce((sum, item) => sum + item.weight, 0);
  const earned = criteria.reduce((sum, item) => sum + item.weight * (item.status === "Met" ? 1 : item.status === "Unverified" ? 0.5 : 0), 0);
  return {
    criteria,
    mustHave: { met: must.filter(item => item.status === "Met").length, total: must.length, failed },
    preferredCriteria: { met: preferred.filter(item => item.status === "Met").length, total: preferred.length },
    unverified,
    requirementsSummary,
    requirementsScore: totalWeight ? Math.round((earned / totalWeight) * 100) : 0,
    screeningFailed: application.screeningState === "Failed",
    screeningPending: application.screeningState === "Pending",
    knockedOut: application.stage === "below-requirements" && failed.length > 0 && !application.overridden,
  };
}

/* ------------------------------------------------------------------ */
/* Candidate emails (ported from candidateMessageTemplates)            */
/* ------------------------------------------------------------------ */

export const employerName = "Northstar Labs";

const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] || "there";
const money = (amount: number) => `NAD ${amount.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
const longDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};
const signOff = `Recruitment team\n${employerName}`;

export function renderCandidateMessage(template: MessageTemplate, candidateName: string, roleTitle: string, extra: { sharedReason?: string | null; offer?: OfferSummary | null } = {}) {
  const hi = `Hi ${firstName(candidateName)},`;
  const role = roleTitle;
  const org = employerName;
  switch (template) {
    case "application_received":
      return { subject: `We have your application for ${role}`, body: [hi, `Thank you for applying for ${role} at ${org}. Your application is in and nothing further is needed from you right now.`, "We review every application. You will hear from us again once yours has been looked at, whether or not you go further.", signOff].join("\n\n") };
    case "shortlisted":
      return { subject: `You have been shortlisted for ${role}`, body: [hi, `Good news. You have been shortlisted for ${role} at ${org}.`, "We will be in touch shortly about the next step.", signOff].join("\n\n") };
    case "reference_check_started":
      return { subject: "We are contacting your referees", body: [hi, `We have started reference checks for ${role}. Your referees will receive a short questionnaire from us.`, "If any of their details have changed, reply to this email and we will update them.", signOff].join("\n\n") };
    case "offer": {
      const offer = extra.offer;
      const terms = offer ? [
        `Salary: ${money(offer.salary)} per month`,
        `Start date: ${longDate(offer.startDate)}`,
        `Probation: ${offer.probation}`,
        `Notice period: ${offer.noticePeriod}`,
        `Reports to: ${offer.reportsTo}`,
        `Working arrangement: ${offer.workArrangement}`,
        ...(offer.conditions ? [`Conditions: ${offer.conditions}`] : []),
      ].join("\n") : null;
      return { subject: `An offer for ${role}`, body: [hi, `We are pleased to offer you the position of ${role} at ${org}.`, ...(terms ? [terms] : []), "Please reply to this email to accept, decline or ask a question.", signOff].join("\n\n") };
    }
    case "not_selected":
      return { subject: `Your application for ${role}`, body: [hi, `Thank you for the time you put into applying for ${role} at ${org}. We will not be taking your application further on this occasion.`, ...(extra.sharedReason ? [`The reason recorded was: ${extra.sharedReason}`] : []), "You are welcome to apply for other roles with us in future.", signOff].join("\n\n") };
  }
}

/** Mock delivery: an address without a proper domain is rejected, everything else goes. */
function deliveryError(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? null : `The address ${email} was rejected by the email provider.`;
}

/* ------------------------------------------------------------------ */
/* Demo data                                                            */
/* ------------------------------------------------------------------ */

type Profile = Pick<WorkspaceApplication, "headline" | "location" | "experienceYears" | "profession" | "availability" | "qualification" | "languages" | "skills" | "employer" | "source" | "reviewStatus" | "tags" | "aiScreeningSummary"> & { assignedReviewer?: string; email?: string };

const PROFILES: Record<string, Profile> = {
  "jamie-morris": { headline: "Senior Product Designer at Brightpath", location: "Windhoek", experienceYears: 8, profession: "Designers", availability: "Notice period", qualification: "BA Visual Communication", languages: ["English", "Afrikaans"], skills: ["Figma", "Design Systems", "UX Research", "Usability"], employer: "Brightpath", source: "Public form", reviewStatus: "Under review", tags: ["Priority"], assignedReviewer: "Lina Amadhila", aiScreeningSummary: "Strong design systems and research evidence. Portfolio shows end-to-end product work." },
  "noah-kim": { headline: "Product Designer at Harbour Retail", location: "Swakopmund", experienceYears: 5, profession: "Designers", availability: "Available now", qualification: "Diploma Graphic Design", languages: ["English"], skills: ["Figma", "Illustrator", "Branding"], employer: "Harbour Retail", source: "Public form", reviewStatus: "Not submitted", tags: [], aiScreeningSummary: "Solid UI craft. Qualification still being checked against the submitted details." },
  "eva-chen": { headline: "UX Designer at Orbit Analytics", location: "Remote", experienceYears: 6, profession: "Designers", availability: "Notice period", qualification: "BSc Psychology", languages: ["English", "Portuguese"], skills: ["UX Research", "Analytics", "Figma"], employer: "Orbit Analytics", source: "Bulk CV upload", reviewStatus: "Reviewed", tags: ["Referred"], aiScreeningSummary: "Research-led designer with clear evidence of measurable outcomes." },
  "luca-bennett": { headline: "Interaction Designer at Kestrel Labs", location: "Walvis Bay", experienceYears: 4, profession: "Designers", availability: "Available now", qualification: "BA Communications", languages: ["English"], skills: ["Figma", "Usability", "Copywriting"], employer: "Kestrel Labs", source: "Public form", reviewStatus: "Not submitted", tags: [], aiScreeningSummary: "Good interaction work; less evidence of leading research." },
  "harper-james": { headline: "Lead Designer at Tech Hub", location: "Windhoek", experienceYears: 10, profession: "Designers", availability: "Notice period", qualification: "BA Visual Communication", languages: ["English", "Otjiherero"], skills: ["Design Systems", "Roadmapping", "Stakeholders", "Figma"], employer: "Tech Hub", source: "CSV import", reviewStatus: "Under review", tags: ["Interviewed before"], assignedReviewer: "James Kevin", aiScreeningSummary: "Experienced lead with strong stakeholder management evidence." },
  "ravi-kapoor": { headline: "Product Designer at Fihankra", location: "Ongwediva", experienceYears: 3, profession: "Designers", availability: "Available now", qualification: "Diploma Graphic Design", languages: ["English", "Oshiwambo"], skills: ["Figma", "Branding"], employer: "Fihankra", source: "Manual", reviewStatus: "Not submitted", tags: [], aiScreeningSummary: "Promising mid-level designer; fewer complex product examples." },
  "priya-shah": { headline: "UX Researcher at Buildwise", location: "Windhoek", experienceYears: 5, profession: "Designers", availability: "Notice period", qualification: "BSc Psychology", languages: ["English"], skills: ["UX Research", "Usability", "Analytics"], employer: "Buildwise", source: "Public form", reviewStatus: "Returned for revision", tags: [], aiScreeningSummary: "Strong research background. No valid driving licence found and the qualification needs evidence." },
  "daniel-okoro": { headline: "Visual Designer at Bella Vida", location: "Oshakati", experienceYears: 4, profession: "Designers", availability: "Available now", qualification: "Diploma Graphic Design", languages: ["English", "Oshiwambo"], skills: ["Illustrator", "Branding", "After Effects"], employer: "Bella Vida", source: "Bulk CV upload", reviewStatus: "Not submitted", tags: [], aiScreeningSummary: "Visual design strength; no driving licence evidence." },
  "sophie-laurent": { headline: "Product Designer at Tupabloom", location: "Rundu", experienceYears: 3, profession: "Designers", availability: "Not available", qualification: "BA Marketing", languages: ["English", "Portuguese"], skills: ["Figma", "Copywriting"], employer: "Tupabloom", source: "Public form", reviewStatus: "Not submitted", tags: ["Rehire"], aiScreeningSummary: "Earlier career; licence requirement not met." },
  "marcus-reed": { headline: "UI Designer at EmpowerMine", location: "Katima Mulilo", experienceYears: 2, profession: "Designers", availability: "Available now", qualification: "Certificate Marketing", languages: ["English"], skills: ["Figma", "CSS"], employer: "EmpowerMine", source: "CSV import", reviewStatus: "Not submitted", tags: [], aiScreeningSummary: "Junior UI designer; below the experience bar for this role." },
  "ibrahim-yusuf": { headline: "Graphic Designer at MA Railway", location: "Rosh Pinah", experienceYears: 1, profession: "Designers", availability: "Available now", qualification: "Certificate Business Admin", languages: ["English", "Afrikaans"], skills: ["Illustrator"], employer: "MA Railway", source: "Manual", reviewStatus: "Not submitted", tags: ["Do not contact"], email: "ibrahim.yusuf@mail", aiScreeningSummary: "Limited product design experience; two must-haves not met." },
  "chloe-bennett": { headline: "Designer at Document Warehouse", location: "Windhoek", experienceYears: 3, profession: "Designers", availability: "Notice period", qualification: "Diploma Graphic Design", languages: ["English"], skills: ["Figma", "Usability"], employer: "Document Warehouse", source: "Public form", reviewStatus: "Not submitted", tags: [], aiScreeningSummary: "Good fundamentals; licence requirement not met." },
  "amina-toure": { headline: "Principal Product Designer at Orbit Analytics", location: "Windhoek", experienceYears: 9, profession: "Designers", availability: "Notice period", qualification: "MSc Computer Science", languages: ["English", "Afrikaans"], skills: ["Design Systems", "UX Research", "Figma", "Roadmapping", "Stakeholders"], employer: "Orbit Analytics", source: "Public form", reviewStatus: "Reviewed", tags: ["Priority", "Referred"], assignedReviewer: "Lina Amadhila", aiScreeningSummary: "Exceptional fit: meets all must-have and preferred criteria with strong evidence." },
  "elena-voss": { headline: "Senior UX Designer at Kestrel Labs", location: "Swakopmund", experienceYears: 7, profession: "Designers", availability: "Notice period", qualification: "BA Visual Communication", languages: ["English"], skills: ["Figma", "UX Research", "Design Systems"], employer: "Kestrel Labs", source: "Public form", reviewStatus: "Reviewed", tags: [], aiScreeningSummary: "Meets every must-have; strong design systems work." },
  "mateo-silva": { headline: "Senior Product Designer at Brightpath", location: "Windhoek", experienceYears: 7, profession: "Designers", availability: "Notice period", qualification: "BSc Information Systems", languages: ["English", "Portuguese"], skills: ["Figma", "Design Systems", "Analytics", "Stakeholders"], employer: "Brightpath", source: "Bulk CV upload", reviewStatus: "Reviewed", tags: ["Interviewed before"], aiScreeningSummary: "Strong product thinking and clear evidence for each requirement." },
  "sara-nguyen": { headline: "Product Design Lead at Orbit Analytics", location: "Remote", experienceYears: 8, profession: "Designers", availability: "Notice period", qualification: "BA Visual Communication", languages: ["English"], skills: ["Figma", "Design Systems", "Roadmapping", "UX Research"], employer: "Orbit Analytics", source: "Public form", reviewStatus: "Reviewed", tags: ["Priority"], aiScreeningSummary: "Leads design teams; all must-haves met with good evidence." },
  "zoya-patel": { headline: "Junior Designer at Fihankra", location: "Oshakati", experienceYears: 1, profession: "Designers", availability: "Available now", qualification: "Certificate Marketing", languages: ["English", "Oshiwambo"], skills: ["Illustrator"], employer: "Fihankra", source: "Public form", reviewStatus: "Not submitted", tags: [], aiScreeningSummary: "The uploaded CV could not be read; partial results need review." },
};

const fallbackProfile = (candidate: CampaignCandidate): Profile => ({
  headline: "Applicant", location: "Windhoek", experienceYears: 3, profession: "Other / Unclassified", availability: "Available now", qualification: "", languages: ["English"], skills: [], employer: "", source: "Public form", reviewStatus: "Not submitted", tags: [], aiScreeningSummary: `Screened against the campaign requirements with a fit score of ${candidate.aiFitScore}.`,
});

const mapResult = (result: string): CriterionStatus => result === "Met" ? "Met" : result === "Not met" ? "Not met" : "Unverified";

function toApplication(candidate: CampaignCandidate): WorkspaceApplication {
  const profile = PROFILES[candidate.id] ?? fallbackProfile(candidate);
  const screening = getCandidateScreeningData(candidate);
  const results: Record<string, CriterionStatus> = {};
  const evidence: Record<string, ScreeningEvidence> = {};
  screening.requirements.forEach(requirement => {
    const key = requirement.requirement.trim().toLowerCase();
    results[key] = mapResult(requirement.result);
    evidence[key] = { reason: requirement.reason, source: requirement.source };
  });
  const matched = Math.max(0, Math.min(10, Math.round(candidate.requirementsScore / 10)));
  return {
    id: candidate.id,
    name: candidate.name,
    email: profile.email ?? candidate.email,
    headline: profile.headline,
    location: profile.location,
    experienceYears: profile.experienceYears,
    profession: profile.profession,
    availability: profile.availability,
    qualification: profile.qualification,
    languages: profile.languages,
    skills: profile.skills,
    employer: profile.employer,
    notes: "",
    source: profile.source,
    fitScore: candidate.aiFitScore,
    aiScreeningSummary: profile.aiScreeningSummary,
    results,
    evidence,
    screeningError: screening.error,
    screeningState: screening.status === "failed" ? "Failed" : screening.status === "in-progress" ? "Pending" : "Completed",
    stage: candidate.stage,
    appliedDate: candidate.appliedAt,
    reviewStatus: profile.reviewStatus,
    skillsMatch: { matched, total: 10, percentage: matched * 10 },
    tags: [...profile.tags],
    assignedReviewer: profile.assignedReviewer,
    overridden: candidate.overriddenByRecruiter,
    rejection: candidate.stage === "rejected" ? { reason: "The CV could not be read and the required qualification was not shown.", decidedBy: "Dave Sench", decidedAt: new Date(Date.now() - 4 * 864e5).toISOString(), sharedWithCandidate: false } : undefined,
  };
}

const ago = (days: number, hours = 0) => new Date(Date.now() - days * 864e5 - hours * 36e5).toISOString();
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function seedWorkspace(campaignId: string, roleTitle: string, team: readonly CampaignTeamMember[]): WorkspaceData {
  const { candidates } = loadCampaignCandidates(campaignId);
  const applications = candidates.map(toApplication);
  const main = team.find(member => member.role === "Main recruiter")?.name ?? "Dave Sench";
  const lineManager = team.find(member => member.role === "Line manager");
  const approverId = lineManager?.id ?? "line_manager-fallback";
  const approverName = lineManager?.name ?? "Johnny Test";
  const mainId = team.find(member => member.role === "Main recruiter")?.id ?? "main_recruiter-fallback";
  const approved = applications.filter(item => ["shortlist-approved", "reference-check", "offer"].includes(item.stage)).map(item => item.id);
  const proposed = applications.filter(item => item.stage === "shortlist-proposed").map(item => item.id);
  const proposals: ShortlistProposal[] = [];
  // An earlier shortlist the approver partly sent back, so the demo shows each reason.
  const longlisted = applications.filter(item => item.stage === "longlist").map(item => item.id);
  if (approved.length && longlisted.length >= 2) {
    const earlierIds = [approved[0], longlisted[0], longlisted[1]];
    proposals.push({
      id: "proposal-v0", name: `${roleTitle} first shortlist`, version: 1, status: "Partially approved", approverId, approverName, submittedBy: main, submittedById: mainId, submittedAt: ago(6), note: "First pass after the screening call.",
      applicationIds: earlierIds,
      decisions: {
        [earlierIds[0]]: { decision: "Approved", comment: "" },
        [earlierIds[1]]: { decision: "Returned", comment: "No evidence of the must-have experience at this level. Happy to look again if the portfolio shows it." },
        [earlierIds[2]]: { decision: "Returned", comment: "Salary expectation is well above the band for this role." },
      },
      decidedBy: approverName, decidedAt: ago(5, 2),
    });
  }
  if (approved.length) proposals.push({
    id: "proposal-v1", name: `${roleTitle} shortlist`, version: 1, status: "Approved", approverId, approverName, submittedBy: main, submittedById: mainId, submittedAt: ago(3), note: "Our three strongest candidates after screening.",
    applicationIds: approved, decisions: Object.fromEntries(approved.map(id => [id, { decision: "Approved", comment: "" }])), decidedBy: approverName, decidedAt: ago(2, 5),
  });
  if (proposed.length) proposals.push({
    id: "proposal-v2", name: `${roleTitle} shortlist`, version: proposals.filter(item => item.name === `${roleTitle} shortlist`).length + 1, status: "Pending approval", approverId, approverName, submittedBy: main, submittedById: mainId, submittedAt: ago(0, 3), note: "A late, very strong applicant. Please review before Friday.",
    applicationIds: proposed, decisions: {},
  });
  applications.forEach(item => {
    if (approved.includes(item.id)) item.proposalId = "proposal-v1";
    if (proposed.includes(item.id)) item.proposalId = "proposal-v2";
  });
  const activity: ActivityEvent[] = [
    { id: newId("act"), actorName: main, action: "shortlist.proposed", createdAt: ago(0, 3) },
    { id: newId("act"), actorName: approverName, action: "shortlist.decided", createdAt: ago(2, 5) },
    { id: newId("act"), actorName: main, action: "application.rejected", createdAt: ago(4) },
    { id: newId("act"), actorName: main, action: "shortlist.proposed", createdAt: ago(3) },
    { id: newId("act"), actorName: null, action: "application.screened", count: applications.length, createdAt: ago(5) },
    { id: newId("act"), actorName: main, action: "campaign.criteria_updated", count: 4, createdAt: ago(6) },
    { id: newId("act"), actorName: main, action: "campaign.published", createdAt: ago(7) },
    { id: newId("act"), actorName: main, action: "campaign.member_added", createdAt: ago(8) },
  ];
  const message = (application: WorkspaceApplication, template: MessageTemplate, status: MessageStatus, createdAt: string, sentBy: string | null, error: string | null = null): CandidateMessage => ({
    id: newId("msg"), applicationId: application.id, candidateName: application.name, candidateEmail: application.email, template,
    ...renderCandidateMessage(template, application.name, roleTitle), status, error, createdAt, sentAt: status === "sent" ? createdAt : null, sentBy,
  });
  const messages: CandidateMessage[] = [];
  applications.forEach(application => {
    const failure = deliveryError(application.email);
    messages.push(message(application, "application_received", failure ? "failed" : "sent", application.appliedDate, null, failure));
  });
  applications.filter(item => approved.includes(item.id)).forEach((application, index) => {
    messages.push(message(application, "shortlisted", index === 0 ? "queued" : "sent", ago(2, 4), index === 0 ? null : main));
  });
  applications.filter(item => item.stage === "reference-check" || item.stage === "offer").forEach((application, index) => {
    messages.push(message(application, "reference_check_started", index === 0 ? "failed" : "sent", ago(1, 6), index === 0 ? null : main, index === 0 ? "The recipient's mail server did not respond. Try again." : null));
  });
  applications.filter(item => item.stage === "rejected").forEach(application => messages.push(message(application, "not_selected", "queued", ago(4), null)));
  activity.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return { applications, proposals, activity, messages: messages.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)), autoSend: { ...DEFAULT_AUTO_SEND }, emailConfigured: true };
}

/* ------------------------------------------------------------------ */
/* Storage                                                              */
/* ------------------------------------------------------------------ */

// v2: re-seeds once so the D5 demo states (partly sent back shortlist) appear.
const storageKey = "recruitflow.campaignWorkspace.v2";
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function isWorkspaceData(value: unknown): value is WorkspaceData {
  return isRecord(value) && Array.isArray(value.applications) && Array.isArray(value.proposals) && Array.isArray(value.activity) &&
    Array.isArray(value.messages) && isRecord(value.autoSend) && typeof value.emailConfigured === "boolean" &&
    value.applications.every(item => isRecord(item) && typeof item.id === "string" && typeof item.stage === "string" && isRecord(item.results));
}

function readAll(): Record<string, unknown> {
  const raw = window.localStorage.getItem(storageKey);
  const parsed: unknown = raw ? JSON.parse(raw) : {};
  if (!isRecord(parsed)) throw new Error("Saved campaign workspace data is not in the expected format.");
  return parsed;
}

function save(campaignId: string, data: WorkspaceData): string | null {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ ...readAll(), [campaignId]: data }));
    return null;
  } catch (error) {
    console.error("Could not save the campaign workspace.", error);
    return "Changes could not be saved in this browser. Please try again.";
  }
}

function load(campaignId: string, roleTitle: string, team: readonly CampaignTeamMember[]): { data: WorkspaceData; error: string | null } {
  try {
    const stored = readAll()[campaignId];
    if (stored === undefined) {
      const seeded = seedWorkspace(campaignId, roleTitle, team);
      save(campaignId, seeded);
      return { data: seeded, error: null };
    }
    if (!isWorkspaceData(stored)) throw new Error("Saved campaign workspace data is not in the expected format.");
    // Data saved before screening reasons were stored: fill them in from the demo screening.
    if (stored.applications.some(item => !item.evidence)) {
      const demo = new Map(loadCampaignCandidates(campaignId).candidates.map(candidate => [candidate.id, toApplication(candidate)]));
      const upgraded = { ...stored, applications: stored.applications.map(item => item.evidence ? item : { ...item, evidence: demo.get(item.id)?.evidence ?? {}, screeningError: item.screeningError ?? demo.get(item.id)?.screeningError }) };
      save(campaignId, upgraded);
      return { data: upgraded, error: null };
    }
    return { data: stored, error: null };
  } catch (error) {
    console.error("Could not load the campaign workspace.", error);
    return { data: seedWorkspace(campaignId, roleTitle, team), error: "Saved campaign data could not be read, so demo data is shown instead." };
  }
}

/** Records an event from outside the workspace (the editor) if the campaign's workspace data exists. */
export function appendCampaignActivity(campaignId: string, action: ActivityAction, actorName: string | null, count?: number) {
  try {
    const all = readAll();
    const stored = all[campaignId];
    if (!isWorkspaceData(stored)) return;
    const next: WorkspaceData = { ...stored, activity: [{ id: newId("act"), actorName, action, count, createdAt: new Date().toISOString() }, ...stored.activity] };
    window.localStorage.setItem(storageKey, JSON.stringify({ ...all, [campaignId]: next }));
  } catch (error) {
    console.error("Could not record campaign activity.", error);
  }
}

/** Shortlists on this campaign still waiting for a decision (0 if the workspace has not been opened yet). */
export function countPendingShortlists(campaignId: string): number {
  try {
    const stored = readAll()[campaignId];
    return isWorkspaceData(stored) ? stored.proposals.filter(item => item.status === "Pending approval").length : 0;
  } catch {
    return 0;
  }
}

/** A new approver accepted: waiting shortlists move to them. */
export function reassignPendingShortlists(campaignId: string, approver: { id: string; name: string }) {
  try {
    const all = readAll();
    const stored = all[campaignId];
    if (!isWorkspaceData(stored)) return;
    const next: WorkspaceData = { ...stored, proposals: stored.proposals.map(item => item.status === "Pending approval" ? { ...item, approverId: approver.id, approverName: approver.name } : item) };
    window.localStorage.setItem(storageKey, JSON.stringify({ ...all, [campaignId]: next }));
  } catch (error) {
    console.error("Could not move waiting shortlists to the new approver.", error);
  }
}

/* ------------------------------------------------------------------ */
/* Hook                                                                 */
/* ------------------------------------------------------------------ */

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export type CampaignWorkspaceStore = ReturnType<typeof useCampaignWorkspaceStore>;

export function useCampaignWorkspaceStore(campaignId: string, roleTitle: string, team: readonly CampaignTeamMember[]) {
  const [state, setState] = useState(() => load(campaignId, roleTitle, team));
  const [toast, setToast] = useState<string | null>(null);
  const dataRef = useRef(state.data);
  dataRef.current = state.data;
  useEffect(() => {
    const next = load(campaignId, roleTitle, team);
    dataRef.current = next.data;
    setState(next);
    // Reload only when switching campaigns; team and title changes keep existing data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const commit = (change: (data: WorkspaceData) => WorkspaceData) => {
    const next = change(dataRef.current);
    dataRef.current = next;
    const error = save(campaignId, next);
    setState({ data: next, error });
    return error === null;
  };

  const event = (actorName: string | null, action: ActivityAction, count?: number): ActivityEvent => ({ id: newId("act"), actorName, action, count, createdAt: new Date().toISOString() });

  const buildMessage = (data: WorkspaceData, template: MessageTemplate, applicationId: string, extra: { sharedReason?: string | null; offer?: OfferSummary | null } = {}): CandidateMessage | null => {
    const application = data.applications.find(item => item.id === applicationId);
    if (!application) return null;
    const now = new Date().toISOString();
    const content = renderCandidateMessage(template, application.name, roleTitle, extra);
    const base: CandidateMessage = { id: newId("msg"), applicationId, candidateName: application.name, candidateEmail: application.email, template, ...content, status: "queued", error: null, createdAt: now, sentAt: null, sentBy: null };
    if (data.autoSend[template] && data.emailConfigured) {
      const failure = deliveryError(application.email);
      return failure ? { ...base, status: "failed", error: failure } : { ...base, status: "sent", sentAt: now };
    }
    return base;
  };

  const withMessages = (data: WorkspaceData, messages: (CandidateMessage | null)[]): WorkspaceData => ({ ...data, messages: [...messages.filter((item): item is CandidateMessage => item !== null), ...data.messages] });

  const updateApplications = (data: WorkspaceData, ids: ReadonlySet<string>, change: (application: WorkspaceApplication) => WorkspaceApplication) => ({
    ...data,
    applications: data.applications.map(application => ids.has(application.id) ? change(application) : application),
  });

  /** Reject: from Longlist, Below requirements, Shortlist approved or Reference check. */
  const rejectApplications = (ids: readonly string[], reason: string, share: boolean, actor: CampaignActor) => {
    const eligible = new Set(dataRef.current.applications.filter(item => ids.includes(item.id) && REJECTABLE_FROM.includes(item.stage)).map(item => item.id));
    if (!eligible.size) return 0;
    const decidedAt = new Date().toISOString();
    commit(data => withMessages({
      ...updateApplications(data, eligible, application => ({ ...application, previousStage: application.stage, stage: "rejected", proposalId: undefined, rejection: { reason: reason.trim(), decidedBy: actor.name, decidedAt, sharedWithCandidate: share } })),
      activity: [event(actor.name, "application.rejected", eligible.size), ...data.activity],
    }, [...eligible].map(id => buildMessage(data, "not_selected", id, { sharedReason: share ? reason.trim() : null }))));
    setToast(`${plural(eligible.size, "application")} rejected.`);
    return eligible.size;
  };

  const overrideApplications = (ids: readonly string[], reason: string, actor: CampaignActor) => {
    const eligible = new Set(dataRef.current.applications.filter(item => ids.includes(item.id) && item.stage === "below-requirements").map(item => item.id));
    if (!eligible.size) return 0;
    commit(data => ({
      ...updateApplications(data, eligible, application => ({ ...application, previousStage: application.stage, stage: "longlist", overridden: true, overrideReason: reason.trim() })),
      activity: [event(actor.name, "application.overridden", eligible.size), ...data.activity],
    }));
    setToast(`${plural(eligible.size, "application")} overridden.`);
    return eligible.size;
  };

  const returnRejectedToLonglist = (ids: readonly string[], actor: CampaignActor, reason?: string) => {
    const eligible = new Set(dataRef.current.applications.filter(item => ids.includes(item.id) && item.stage === "rejected").map(item => item.id));
    if (!eligible.size) return 0;
    commit(data => ({
      ...updateApplications(data, eligible, application => ({ ...application, previousStage: "rejected", stage: "longlist", rejection: undefined, overrideReason: reason?.trim() || application.overrideReason })),
      activity: [event(actor.name, "application.moved", eligible.size), ...data.activity],
    }));
    setToast(`${plural(eligible.size, "application")} returned to Longlist.`);
    return eligible.size;
  };

  const tagApplications = (ids: readonly string[], tag: string) => {
    const normalized = tag.trim();
    if (!normalized) return 0;
    const selected = new Set(ids);
    commit(data => updateApplications(data, selected, application => ({ ...application, tags: [...new Set([...application.tags, normalized])] })));
    setToast(`Tag "${normalized}" added to ${plural(selected.size, "application")}.`);
    return selected.size;
  };

  /** Board moves: override, reject or un-reject, each with a reason. */
  const moveOnBoard = (applicationId: string, to: StageId, reason: string, share: boolean, actor: CampaignActor): string | null => {
    const application = dataRef.current.applications.find(item => item.id === applicationId);
    if (!application) return "This candidate is no longer on the board.";
    const move = describeMove(application.stage, to, actor.role);
    if (!move.allowed) return move.reason;
    if (!reason.trim()) return "Give a reason for this move.";
    if (move.kind === "override") overrideApplications([applicationId], reason, actor);
    if (move.kind === "reject") rejectApplications([applicationId], reason, share, actor);
    if (move.kind === "unreject") returnRejectedToLonglist([applicationId], actor, reason);
    setToast(`${application.name} moved to ${stageName(to)}.`);
    return null;
  };

  /** Stage changes made by other workflows (references and offers). */
  const setStageFromWorkflow = (applicationId: string, to: StageId, actor: CampaignActor) => {
    const application = dataRef.current.applications.find(item => item.id === applicationId);
    if (!application || application.stage === to) return;
    const forward = PIPELINE_STAGES.findIndex(item => item.id === to) > PIPELINE_STAGES.findIndex(item => item.id === application.stage);
    commit(data => withMessages({
      ...updateApplications(data, new Set([applicationId]), item => ({ ...item, previousStage: item.stage, stage: to })),
      activity: [event(actor.name, "application.moved"), ...data.activity],
    }, [forward && to === "reference-check" ? buildMessage(data, "reference_check_started", applicationId) : null]));
  };

  const queueOfferEmail = (applicationId: string, offer: OfferSummary) => {
    commit(data => withMessages(data, [buildMessage(data, "offer", applicationId, { offer })]));
  };

  const proposeShortlist = (input: { name: string; approverId: string; approverName: string; note: string; applicationIds: readonly string[] }, actor: CampaignActor) => {
    const eligible = dataRef.current.applications.filter(item => input.applicationIds.includes(item.id) && item.stage === "longlist").map(item => item.id);
    if (!eligible.length || !input.name.trim()) return false;
    const name = input.name.trim();
    const proposal: ShortlistProposal = {
      id: newId("proposal"), name, version: dataRef.current.proposals.filter(item => item.name === name).length + 1, status: "Pending approval",
      approverId: input.approverId, approverName: input.approverName, submittedBy: actor.name, submittedById: actor.id, submittedAt: new Date().toISOString(),
      note: input.note.trim(), applicationIds: eligible, decisions: {},
    };
    commit(data => ({
      ...updateApplications(data, new Set(eligible), application => ({ ...application, previousStage: application.stage, stage: "shortlist-proposed", proposalId: proposal.id })),
      proposals: [proposal, ...data.proposals],
      activity: [event(actor.name, "shortlist.proposed"), ...data.activity],
    }));
    setToast(`Shortlist proposed to ${input.approverName}.`);
    return true;
  };

  const withdrawProposal = (proposalId: string, reason: string, actor: CampaignActor) => {
    const proposal = dataRef.current.proposals.find(item => item.id === proposalId);
    if (!proposal || proposal.status !== "Pending approval") return;
    const ids = new Set(proposal.applicationIds);
    commit(data => ({
      ...updateApplications(data, ids, application => application.proposalId === proposalId && application.stage === "shortlist-proposed" ? { ...application, previousStage: application.stage, stage: "longlist", proposalId: undefined } : application),
      proposals: data.proposals.map(item => item.id === proposalId ? { ...item, status: "Withdrawn", withdrawalReason: reason.trim(), withdrawnAt: new Date().toISOString() } : item),
      activity: [event(actor.name, "shortlist.withdrawn"), ...data.activity],
    }));
    setToast(`Shortlist "${proposal.name}" withdrawn. ${proposal.approverName} was notified.`);
  };

  /** Only the named approver, or an administrator who did not submit it. */
  const canDecide = (proposal: ShortlistProposal, actor: CampaignActor): string | null => {
    if (proposal.submittedById === actor.id || proposal.submittedBy === actor.name) return "You submitted this, so someone else must approve it.";
    if (actor.role === "admin") return null;
    if (actor.role === "line_manager" && proposal.approverId === actor.id) return null;
    return "Only the assigned line manager or an administrator can approve a shortlist.";
  };

  const decideProposal = (proposalId: string, decisions: Record<string, ProposalItemDecision>, actor: CampaignActor) => {
    const proposal = dataRef.current.proposals.find(item => item.id === proposalId);
    if (!proposal || proposal.status !== "Pending approval" || canDecide(proposal, actor)) return false;
    if (!proposal.applicationIds.every(id => decisions[id]) || proposal.applicationIds.some(id => decisions[id].decision === "Returned" && !decisions[id].comment.trim())) return false;
    const approvedIds = proposal.applicationIds.filter(id => decisions[id].decision === "Approved");
    const returnedCount = proposal.applicationIds.length - approvedIds.length;
    const status: ProposalStatus = returnedCount === 0 ? "Approved" : approvedIds.length === 0 ? "Returned" : "Partially approved";
    const now = new Date().toISOString();
    commit(data => withMessages({
      ...updateApplications(data, new Set(proposal.applicationIds), application => {
        if (application.proposalId !== proposalId) return application;
        const decision = decisions[application.id];
        return decision.decision === "Approved"
          ? { ...application, previousStage: application.stage, stage: "shortlist-approved" }
          : { ...application, previousStage: application.stage, stage: "longlist", proposalId: undefined, overrideReason: decision.comment.trim() || application.overrideReason };
      }),
      proposals: data.proposals.map(item => item.id === proposalId ? { ...item, status, decisions, decidedBy: actor.name, decidedAt: now } : item),
      activity: [event(actor.name, "shortlist.decided"), ...data.activity],
    }, approvedIds.map(id => buildMessage(data, "shortlisted", id))));
    setToast(`Decision submitted for "${proposal.name}".`);
    return true;
  };

  const logActivity = (action: ActivityAction, actor: CampaignActor | null, count?: number) => {
    commit(data => ({ ...data, activity: [event(actor?.name ?? null, action, count), ...data.activity] }));
  };

  const editMessage = (messageId: string, subject: string, body: string) => {
    const message = dataRef.current.messages.find(item => item.id === messageId);
    if (!message || message.status !== "queued") return "Only queued emails can be edited.";
    if (!subject.trim()) return "Give the email a subject.";
    if (!body.trim()) return "The email needs a message.";
    commit(data => ({ ...data, messages: data.messages.map(item => item.id === messageId ? { ...item, subject: subject.trim(), body } : item) }));
    return null;
  };

  /** Starting wording for a candidate: their latest email of this type if there is one, otherwise the template written for them. */
  const messageStartFor = (applicationId: string, template: MessageTemplate): { subject: string; body: string; fromExisting: boolean } | null => {
    const application = dataRef.current.applications.find(item => item.id === applicationId);
    if (!application) return null;
    const existing = dataRef.current.messages
      .filter(item => item.applicationId === applicationId && item.template === template)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
    if (existing) return { subject: existing.subject, body: existing.body, fromExisting: true };
    return { ...renderCandidateMessage(template, application.name, roleTitle), fromExisting: false };
  };

  /** Puts a customised email in the outbox as queued. Returns its id, or an error. */
  const prepareMessage = (applicationId: string, template: MessageTemplate, subject: string, body: string): { id: string } | { error: string } => {
    if (!subject.trim()) return { error: "Give the email a subject." };
    if (!body.trim()) return { error: "The email needs a message." };
    const application = dataRef.current.applications.find(item => item.id === applicationId);
    if (!application) return { error: "This candidate is no longer on the campaign." };
    const message: CandidateMessage = { id: newId("msg"), applicationId, candidateName: application.name, candidateEmail: application.email, template, subject: subject.trim(), body, status: "queued", error: null, createdAt: new Date().toISOString(), sentAt: null, sentBy: null };
    if (!commit(data => ({ ...data, messages: [message, ...data.messages] }))) return { error: "The email could not be saved. Try again." };
    return { id: message.id };
  };

  const sendMessages = async (messageIds: readonly string[], actor: CampaignActor): Promise<{ sent: string[]; failed: Array<{ messageId: string; error: string }> }> => {
    if (!dataRef.current.emailConfigured) return { sent: [], failed: messageIds.map(messageId => ({ messageId, error: "Email sending is not set up." })) };
    const claim = new Set(dataRef.current.messages.filter(item => messageIds.includes(item.id) && (item.status === "queued" || item.status === "failed")).map(item => item.id).slice(0, 100));
    commit(data => ({ ...data, messages: data.messages.map(item => claim.has(item.id) ? { ...item, status: "sending" } : item) }));
    await new Promise(resolve => window.setTimeout(resolve, 700));
    const sent: string[] = [];
    const failed: Array<{ messageId: string; error: string }> = [];
    const now = new Date().toISOString();
    commit(data => ({
      ...data,
      messages: data.messages.map(item => {
        if (!claim.has(item.id)) return item;
        const failure = deliveryError(item.candidateEmail);
        if (failure) {
          failed.push({ messageId: item.id, error: failure });
          return { ...item, status: "failed", error: failure };
        }
        sent.push(item.id);
        return { ...item, status: "sent", error: null, sentAt: now, sentBy: actor.name };
      }),
    }));
    return { sent, failed };
  };

  /** Correct one screening result; a note is required. */
  const correctResult = (applicationId: string, criterion: ScreenedCriterion, result: "Met" | "Not met", note: string, actor: CampaignActor): string | null => {
    if (!note.trim()) return "A note is required to save this correction.";
    const application = dataRef.current.applications.find(item => item.id === applicationId);
    if (!application) return "This candidate is no longer on the campaign.";
    if (application.corrections?.[criterion.key]) return "This result has already been corrected. Undo it first.";
    const correction: ScreeningCorrection = { result, note: note.trim(), who: actor.name, correctedAt: new Date().toISOString(), originalResult: criterion.status, originalReason: criterion.reason, originalSource: criterion.source };
    const saved = commit(data => ({
      ...updateApplications(data, new Set([applicationId]), item => ({ ...item, corrections: { ...item.corrections, [criterion.key]: correction } })),
      activity: [event(actor.name, "application.corrected"), ...data.activity],
    }));
    if (saved) setToast(`${criterion.name} marked as ${result.toLowerCase()} for ${application.name}.`);
    return saved ? null : "The correction could not be saved. Please try again.";
  };

  const undoCorrection = (applicationId: string, key: string) => {
    const application = dataRef.current.applications.find(item => item.id === applicationId);
    if (!application?.corrections?.[key]) return false;
    return commit(data => updateApplications(data, new Set([applicationId]), item => {
      const corrections = { ...item.corrections };
      delete corrections[key];
      return { ...item, corrections: Object.keys(corrections).length ? corrections : undefined };
    }));
  };

  /** Mock re-run of screening: shows "Screening…" briefly, then completes. */
  const rerunScreening = (applicationId: string) => {
    commit(data => updateApplications(data, new Set([applicationId]), item => ({ ...item, screeningState: "Pending" })));
    window.setTimeout(() => {
      commit(data => ({
        ...updateApplications(data, new Set([applicationId]), item => ({ ...item, screeningState: "Completed", screeningError: undefined })),
        activity: [event(null, "application.screened", 1), ...data.activity],
      }));
      setToast("Screening finished.");
    }, 1600);
  };

  const setAutoSend = (template: MessageTemplate, on: boolean) => commit(data => ({ ...data, autoSend: { ...data.autoSend, [template]: on } }));
  const setEmailConfigured = (on: boolean) => commit(data => ({ ...data, emailConfigured: on }));

  return {
    data: state.data,
    error: state.error,
    toast,
    showToast: setToast,
    dismissToast: () => setToast(null),
    rejectApplications,
    overrideApplications,
    returnRejectedToLonglist,
    tagApplications,
    moveOnBoard,
    setStageFromWorkflow,
    queueOfferEmail,
    messageStartFor,
    prepareMessage,
    proposeShortlist,
    withdrawProposal,
    canDecide,
    decideProposal,
    logActivity,
    editMessage,
    sendMessages,
    setAutoSend,
    setEmailConfigured,
    correctResult,
    undoCorrection,
    rerunScreening,
  };
}

/* ------------------------------------------------------------------ */
/* Activity wording (ported from campaignManageModel)                  */
/* ------------------------------------------------------------------ */

const ACTIVITY_PHRASE: Record<ActivityAction, (event: ActivityEvent) => string> = {
  "campaign.member_added": () => "added someone to the campaign team",
  "campaign.member_role_changed": () => "changed a team member's role",
  "campaign.member_removed": () => "removed someone from the campaign team",
  "campaign.approver_invited": () => "invited an approver",
  "campaign.approver_invite_cancelled": () => "cancelled the approver invitation",
  "campaign.approver_accepted": () => "accepted the invitation to approve this campaign",
  "campaign.criteria_updated": event => typeof event.count === "number" ? `updated the requirements (${event.count} now)` : "updated the requirements",
  "campaign.published": () => "published the campaign",
  "campaign.unpublished": () => "unpublished the campaign",
  "campaign.paused": () => "paused the campaign",
  "campaign.closed": () => "closed the campaign",
  "campaign.reopened": () => "reopened the campaign",
  "campaign.closing_date_set": () => "changed the closing date",
  "application.screened": event => typeof event.count === "number" ? `screened ${event.count} application${event.count === 1 ? "" : "s"}` : "screened an application",
  "application.moved": () => "moved a candidate to another stage",
  "application.overridden": () => "overrode a screening result",
  "application.rejected": () => "rejected a candidate",
  "shortlist.proposed": () => "proposed a shortlist",
  "shortlist.withdrawn": () => "withdrew a shortlist",
  "shortlist.decided": () => "decided on a shortlist",
  "application.corrected": () => "corrected a screening result",
  "campaign.exported": () => "downloaded the campaign spreadsheet",
};

export function describeActivity(event: ActivityEvent) {
  return `${event.actorName ?? "The system"} ${ACTIVITY_PHRASE[event.action]?.(event) ?? event.action.replace(/[._]/g, " ")}`;
}

export function formatEventTime(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(iso: string) {
  const hours = Math.floor((Date.now() - Date.parse(iso)) / 36e5);
  return hours < 24 ? `${Math.max(0, hours)}h ago` : `${Math.floor(hours / 24)}d ago`;
}
