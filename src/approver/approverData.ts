/*
 * D4 — Approver (line manager) app demo data.
 * Shortlists and offers sent to the signed-in approver, plus the decisions they make.
 * Decisions are kept in browser storage so the Approvals page and the shortlist screen agree.
 */
import type { CriterionStatus } from "../campaign/workspaceStore";

export const APPROVER_ORGANISATION = "Northstar Labs";
export const DEFAULT_APPROVER = { name: "Maria Shilongo", email: "maria.shilongo@northstarlabs.com" };

export type RequirementResult = { name: string; mustHave: boolean; status: CriterionStatus; reason: string };
export type ApplicationAnswer = { question: string; answer: string };

export type ShortlistCandidate = {
  id: string;
  name: string;
  headline: string;
  location: string;
  experienceYears: number;
  email: string;
  requirements: RequirementResult[];
  answers: ApplicationAnswer[];
  cvFileName: string;
  cvSize: string;
};

export type CandidateDecision = { decision: "approved" | "sent-back"; reason: string; decidedAt: string };

export type OfferDetails = {
  candidateName: string;
  headline: string;
  location: string;
  /** Monthly salary in NAD. */
  salary: number;
  startDate: string;
  workArrangement: string;
  probation: string;
  noticePeriod: string;
  reportsTo: string;
  /** Plain-text conditions, as the recruiter wrote them on the offer. */
  conditions: string;
  /** When the candidate needs an answer by. */
  respondBy: string;
};

/** Key under which an offer's decision is kept in the decision map. */
export const OFFER_DECISION = "offer";

export type ApprovalRequest = {
  id: string;
  kind: "shortlist" | "offer";
  roleId: string;
  roleTitle: string;
  sentBy: string;
  sentAt: string;
  note: string;
  candidates: ShortlistCandidate[];
  offer?: OfferDetails;
  /** Decisions that already exist in the demo before the approver opens it. Offers use the OFFER_DECISION key. */
  seededDecisions: Record<string, CandidateDecision>;
};

export type ApproverRole = { id: string; title: string; mainRecruiter: string; status: "Open" | "Filled" };

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 60 * 60 * 1000).toISOString();
const daysAhead = (days: number) => new Date(Date.now() + days * DAY).toISOString();

export const APPROVER_ROLES: ApproverRole[] = [
  { id: "spd", title: "Senior Product Designer", mainRecruiter: "Dave Sench", status: "Open" },
  { id: "fe", title: "Frontend Engineer", mainRecruiter: "Dave Sench", status: "Open" },
  { id: "csl", title: "Customer Success Lead", mainRecruiter: "Ruth Amadhila", status: "Open" },
  { id: "da", title: "Data Analyst", mainRecruiter: "Ruth Amadhila", status: "Filled" },
];

/* ------------------------------------------------------------------ */
/* Candidates                                                          */
/* ------------------------------------------------------------------ */

const fileName = (name: string) => `${name.replace(/\s+/g, "-")}-CV.pdf`;

type Requirement = { name: string; mustHave: boolean };

function results(requirements: Requirement[], statuses: CriterionStatus[], reasons: Partial<Record<number, string>> = {}): RequirementResult[] {
  return requirements.map((item, index) => {
    const status = statuses[index] ?? "Unverified";
    const subject = item.name.toLowerCase();
    const fallback = status === "Met" ? `The CV and answers show clear evidence of ${subject}.`
      : status === "Not met" ? `Nothing in the application shows ${subject}.`
      : `Not enough evidence yet to confirm ${subject}. Worth asking at interview.`;
    return { ...item, status, reason: reasons[index] ?? fallback };
  });
}

function candidate(id: string, name: string, headline: string, location: string, experienceYears: number, requirements: RequirementResult[], answers: ApplicationAnswer[], cvSize = "212 KB"): ShortlistCandidate {
  return { id, name, headline, location, experienceYears, email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`, requirements, answers, cvFileName: fileName(name), cvSize };
}

const SPD_REQUIREMENTS: Requirement[] = [
  { name: "5+ years in product design", mustHave: true },
  { name: "Portfolio with shipped work", mustHave: true },
  { name: "Design systems experience", mustHave: true },
  { name: "Fintech experience", mustHave: false },
  { name: "Runs research workshops", mustHave: false },
];
const spdAnswers = (why: string, change: string, notice: string, salary: string): ApplicationAnswer[] => [
  { question: "Why do you want to join Northstar Labs?", answer: why },
  { question: "Tell us about a design decision you changed after research.", answer: change },
  { question: "What is your notice period?", answer: notice },
  { question: "What are your salary expectations?", answer: salary },
];

const SPD_CANDIDATES: ShortlistCandidate[] = [
  candidate("spd-amina", "Amina Toure", "Lead Product Designer at Paystack", "Windhoek", 8,
    results(SPD_REQUIREMENTS, ["Met", "Met", "Met", "Met", "Unverified"], {
      0: "8 years across three product teams, the last 3 as lead.",
      1: "Portfolio links to two live payments products with case studies.",
      2: "Built and maintained the Paystack dashboard component library.",
      3: "Has worked on payments and lending products since 2019.",
    }),
    spdAnswers("I want to work on tools that small businesses depend on every day, and Northstar's focus on clarity matches how I work.", "We planned a multi-step onboarding wizard. Interviews showed people wanted to explore first, so we shipped a skippable checklist instead and activation rose 18%.", "One month", "NAD 68,000 per month"), "248 KB"),
  candidate("spd-daniel", "Daniel Mbeki", "Senior UX Designer at Standard Bank", "Cape Town", 6,
    results(SPD_REQUIREMENTS, ["Met", "Met", "Unverified", "Met", "Met"], {
      2: "Mentions contributing to a design system but does not say what they owned.",
    }),
    spdAnswers("I'd like a smaller team where design has a real seat at the table.", "Usability tests showed our card-freeze toggle was being missed, so we moved it to the card itself. Support calls about lost cards dropped noticeably.", "Two months", "NAD 72,000 per month")),
  candidate("spd-lena", "Lena Hoffmann", "Product Designer, freelance", "Berlin (remote)", 5,
    results(SPD_REQUIREMENTS, ["Met", "Met", "Met", "Not met", "Met"]),
    spdAnswers("Remote-first and design-led. I've followed your product updates for a year.", "A client wanted dark mode first. Research showed accessibility of forms was the bigger problem, so we fixed contrast and labels before anything else.", "Two weeks", "NAD 75,000 per month")),
  candidate("spd-tomas", "Tomas Nangolo", "Product Designer at MTC", "Windhoek", 5,
    results(SPD_REQUIREMENTS, ["Met", "Unverified", "Met", "Not met", "Unverified"], {
      1: "Portfolio link was password protected. The recruiter has asked for access.",
    }),
    spdAnswers("I'd like to stay in Windhoek and work on a product with more design maturity.", "We assumed customers wanted bundles. Diary studies showed they cared about predictable monthly cost, so we redesigned around a single plan card.", "One month", "NAD 52,000 per month")),
  candidate("spd-grace", "Grace Achieng", "Senior Designer at Twiga Foods", "Nairobi", 7,
    results(SPD_REQUIREMENTS, ["Met", "Met", "Met", "Unverified", "Met"]),
    spdAnswers("I want to keep building for African markets and grow into design leadership.", "Field visits showed our ordering app was used on shared phones, so we added quick profile switching and dropped forced log-outs.", "One month", "NAD 70,000 per month")),
];

const FE_REQUIREMENTS: Requirement[] = [
  { name: "React and TypeScript", mustHave: true },
  { name: "3+ years in frontend", mustHave: true },
  { name: "Accessibility (WCAG)", mustHave: true },
  { name: "Automated testing", mustHave: false },
];
const feAnswers = (why: string, proud: string, notice: string): ApplicationAnswer[] => [
  { question: "Why this role?", answer: why },
  { question: "What are you most proud of building?", answer: proud },
  { question: "What is your notice period?", answer: notice },
];
const FE_CANDIDATES: ShortlistCandidate[] = [
  candidate("fe-noah", "Noah Kim", "Frontend Engineer at Yoco", "Cape Town", 4,
    results(FE_REQUIREMENTS, ["Met", "Met", "Met", "Met"]),
    feAnswers("I like product teams that ship small and often.", "An offline-first point-of-sale screen used in over 2,000 shops.", "One month")),
  candidate("fe-sara", "Sara Nel", "Software Engineer at Takealot", "Johannesburg", 3,
    results(FE_REQUIREMENTS, ["Met", "Met", "Unverified", "Met"]),
    feAnswers("I want to work closer to design.", "Rebuilt our checkout in React and cut page weight by half.", "Two months")),
  candidate("fe-kofi", "Kofi Mensah", "Frontend Developer, freelance", "Accra (remote)", 5,
    results(FE_REQUIREMENTS, ["Met", "Met", "Met", "Unverified"]),
    feAnswers("Remote-first with a clear product focus.", "An accessible forms library now used by four client teams.", "Two weeks")),
];

const DA_REQUIREMENTS: Requirement[] = [
  { name: "SQL", mustHave: true },
  { name: "Dashboarding (Power BI or Looker)", mustHave: true },
  { name: "Statistics degree", mustHave: false },
];
const daAnswers = (why: string): ApplicationAnswer[] => [{ question: "Why this role?", answer: why }, { question: "What is your notice period?", answer: "One month" }];
const DA_CANDIDATES: ShortlistCandidate[] = [
  candidate("da-thandi", "Thandi Moyo", "Data Analyst at FNB", "Windhoek", 4, results(DA_REQUIREMENTS, ["Met", "Met", "Met"]), daAnswers("I want my work to shape product decisions directly.")),
  candidate("da-peter", "Peter Shikongo", "BI Developer at NamPower", "Windhoek", 6, results(DA_REQUIREMENTS, ["Met", "Met", "Not met"]), daAnswers("Looking for a faster-moving team.")),
  candidate("da-joy", "Joy Okafor", "Junior Analyst at Jumia", "Lagos (remote)", 2, results(DA_REQUIREMENTS, ["Met", "Unverified", "Met"]), daAnswers("I'd like to grow in a product company.")),
  candidate("da-ben", "Ben Haufiku", "Analyst at Bank Windhoek", "Windhoek", 3, results(DA_REQUIREMENTS, ["Met", "Met", "Unverified"]), daAnswers("Closer to the customer.")),
];

/* ------------------------------------------------------------------ */
/* Requests                                                            */
/* ------------------------------------------------------------------ */

export function buildApprovalRequests(): ApprovalRequest[] {
  return [
    {
      id: "sl-spd", kind: "shortlist", roleId: "spd", roleTitle: "Senior Product Designer", sentBy: "Dave Sench", sentAt: daysAgo(1, 3),
      note: "Our five strongest after screening. Amina and Grace are my top picks. Tomas's portfolio is still locked; I've asked him for access.",
      candidates: SPD_CANDIDATES, seededDecisions: {},
    },
    {
      id: "of-csl", kind: "offer", roleId: "csl", roleTitle: "Customer Success Lead", sentBy: "Ruth Amadhila", sentAt: daysAgo(2, 1),
      note: "",
      candidates: [],
      offer: {
        candidateName: "Priya Shah", headline: "Customer Success Manager at Paymenow", location: "Windhoek",
        salary: 58000,
        startDate: "11 Jan 2027", workArrangement: "Hybrid", probation: "3 months", noticePeriod: "1 month",
        reportsTo: "Head of Customer Success",
        conditions: "Subject to two satisfactory references, proof of qualifications, a clear background check and a signed confidentiality agreement.",
        respondBy: daysAhead(3),
      },
      seededDecisions: {},
    },
    {
      id: "sl-fe", kind: "shortlist", roleId: "fe", roleTitle: "Frontend Engineer", sentBy: "Dave Sench", sentAt: daysAgo(4, 5), note: "Three solid engineers. Noah stands out.",
      candidates: FE_CANDIDATES,
      seededDecisions: { "fe-noah": { decision: "approved", reason: "", decidedAt: daysAgo(3) } },
    },
    {
      id: "sl-da", kind: "shortlist", roleId: "da", roleTitle: "Data Analyst", sentBy: "Ruth Amadhila", sentAt: daysAgo(14), note: "",
      candidates: DA_CANDIDATES,
      seededDecisions: {
        "da-thandi": { decision: "approved", reason: "", decidedAt: daysAgo(12) },
        "da-peter": { decision: "approved", reason: "", decidedAt: daysAgo(12) },
        "da-joy": { decision: "sent-back", reason: "Needs more dashboarding experience for this level. Keep her in mind for the junior role.", decidedAt: daysAgo(12) },
        "da-ben": { decision: "approved", reason: "", decidedAt: daysAgo(12) },
      },
    },
    {
      id: "of-da", kind: "offer", roleId: "da", roleTitle: "Data Analyst", sentBy: "Ruth Amadhila", sentAt: daysAgo(8), note: "",
      candidates: [],
      offer: {
        candidateName: "Thandi Moyo", headline: "Data Analyst at FNB", location: "Windhoek",
        salary: 45000,
        startDate: "4 Jan 2027", workArrangement: "On site", probation: "3 months", noticePeriod: "1 month",
        reportsTo: "Head of Data",
        conditions: "Subject to proof of qualifications and a clear background check.",
        respondBy: daysAgo(4),
      },
      seededDecisions: { [OFFER_DECISION]: { decision: "approved", reason: "", decidedAt: daysAgo(6) } },
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Decisions in browser storage                                        */
/* ------------------------------------------------------------------ */

export type DecisionMap = Record<string, Record<string, CandidateDecision>>;
const DECISIONS_KEY = "recruitflow.approverDecisions.v1";

export function readStoredDecisions(): DecisionMap {
  try {
    const raw = window.localStorage.getItem(DECISIONS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed as DecisionMap : {};
  } catch {
    return {};
  }
}

export function writeStoredDecisions(map: DecisionMap) {
  try {
    window.localStorage.setItem(DECISIONS_KEY, JSON.stringify(map));
  } catch {
    // Storage unavailable: decisions last for this visit only.
  }
}

export function clearStoredDecisions() {
  try {
    window.localStorage.removeItem(DECISIONS_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** The seeded decisions with anything the approver decided on top. */
export function decisionsFor(request: ApprovalRequest, stored: DecisionMap): Record<string, CandidateDecision> {
  return { ...request.seededDecisions, ...(stored[request.id] ?? {}) };
}

export function isRequestDecided(request: ApprovalRequest, decisions: Record<string, CandidateDecision>) {
  if (request.kind === "offer") return Boolean(decisions[OFFER_DECISION]);
  return request.candidates.length > 0 && request.candidates.every(item => decisions[item.id]);
}

/** The latest decision time, used for "Decided on". */
export function decidedAt(request: ApprovalRequest, decisions: Record<string, CandidateDecision>): string | null {
  if (request.kind === "offer") return decisions[OFFER_DECISION]?.decidedAt ?? null;
  const times = Object.values(decisions).map(item => Date.parse(item.decidedAt)).filter(Number.isFinite);
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
}

/** Demo decisions for the "mixed" and "finished" previews of the shortlist screen. */
export function previewDecisions(request: ApprovalRequest, state: "undecided" | "mixed" | "finished"): Record<string, CandidateDecision> {
  if (state === "undecided") return {};
  const reasons = [
    "Fintech experience is important for this team. Please look for someone who has shipped payments work.",
    "Portfolio is still locked, so I can't judge the work. Send him back once we have access.",
  ];
  const plan: Array<"approved" | "sent-back"> = ["approved", "approved", "sent-back", "sent-back", "approved"];
  const count = state === "mixed" ? Math.min(3, request.candidates.length) : request.candidates.length;
  let reasonIndex = 0;
  return Object.fromEntries(request.candidates.slice(0, count).map((item, index) => {
    const decision = plan[index % plan.length];
    const reason = decision === "sent-back" ? reasons[reasonIndex++ % reasons.length] : "";
    return [item.id, { decision, reason, decidedAt: new Date(Date.now() - (count - index) * 6 * 60 * 1000).toISOString() }];
  }));
}

export function requirementsSummary(requirements: readonly RequirementResult[]): { label: string; tone: "success" | "warning" | "danger" } {
  const must = requirements.filter(item => item.mustHave);
  if (must.some(item => item.status === "Not met")) return { label: "Requirement not met", tone: "danger" };
  if (must.some(item => item.status === "Unverified")) return { label: "Needs verification", tone: "warning" };
  return { label: "Meets requirements", tone: "success" };
}

/** Demo decisions for the offer screen's previews. */
export function previewOfferDecision(state: "undecided" | "approved" | "sent-back"): CandidateDecision | null {
  const decidedAt = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  if (state === "approved") return { decision: "approved", reason: "", decidedAt };
  if (state === "sent-back") return { decision: "sent-back", reason: "This is above what we agreed for this level. Please come back at NAD 55,000 or below, or make the case for an exception.", decidedAt };
  return null;
}

export const formatMoney = (amount: number) => `NAD ${new Intl.NumberFormat("en-GB").format(amount)}`;

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
