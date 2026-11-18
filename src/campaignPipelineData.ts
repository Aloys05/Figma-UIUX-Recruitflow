export type CandidateStage =
  | "longlist"
  | "below-requirements"
  | "shortlist-proposed"
  | "shortlist-approved"
  | "reference-check"
  | "offer"
  | "rejected";

export type CampaignPipelineStage = {
  id: CandidateStage;
  title: string;
  description: string;
};

export type CampaignCandidate = {
  id: string;
  campaignId: string;
  name: string;
  email: string;
  appliedAt: string;
  requirementsScore: number;
  mustHaveResults: Array<{ requirement: string; met: boolean }>;
  aiFitScore: number;
  stage: CandidateStage;
  overriddenByRecruiter?: boolean;
  stageHistory?: CandidateStage[];
  shortlistDecision?: "Pending" | "Approved" | "Returned";
  screeningCorrections?: Record<string, ScreeningCorrection>;
};

export type ScreeningResult = "Met" | "Needs verification" | "Not met";
export type ScreeningSource = "Checked by AI" | "Checked against the form" | "Set by a recruiter";
export type ScreeningCorrectionResult = "Met" | "Not met";
export type ScreeningStatus = "complete" | "in-progress" | "failed";
export type ScreeningCorrection = {
  result: ScreeningCorrectionResult;
  note: string;
  who: string;
  correctedAt: string;
  originalResult: ScreeningResult;
  originalReason: string;
  originalSource: ScreeningSource;
};
export type CandidateScreeningRequirement = {
  requirement: string;
  result: ScreeningResult;
  reason: string;
  source: ScreeningSource;
  mustHave: boolean;
  correction?: ScreeningCorrection;
};
export type CandidateScreeningData = {
  status: ScreeningStatus;
  requirements: CandidateScreeningRequirement[];
  error?: string;
};

export function getScreeningRequirementKey(requirement: string): string {
  return requirement.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const campaignPipelineStages: CampaignPipelineStage[] = [
  { id: "longlist", title: "Longlist", description: "Candidates currently in the longlist." },
  { id: "below-requirements", title: "Below requirements", description: "Candidates who are below the campaign requirements." },
  { id: "shortlist-proposed", title: "Shortlist proposed", description: "Candidates included in a shortlist proposal." },
  { id: "shortlist-approved", title: "Shortlist approved", description: "Candidates approved for the shortlist." },
  { id: "reference-check", title: "Reference check", description: "Candidates undergoing reference checks." },
  { id: "offer", title: "Offer", description: "Candidates with an offer in progress." },
  { id: "rejected", title: "Rejected", description: "Candidates whose application was rejected." },
];

const storageKey = "recruitflow.demoCampaignPipeline";
const mustHaves = ["Relevant experience", "Required qualification", "Work authorization", "Valid driving licence"];

function results(met: number): CampaignCandidate["mustHaveResults"] {
  return mustHaves.map((requirement, index) => ({ requirement, met: index < met }));
}

const demoCandidates: Omit<CampaignCandidate, "campaignId">[] = [
  { id: "jamie-morris", name: "Jamie Morris", email: "jamie.morris@email.com", appliedAt: "2026-11-15T10:20:00.000Z", requirementsScore: 92, mustHaveResults: results(4), aiFitScore: 94, stage: "longlist" },
  { id: "noah-kim", name: "Noah Kim", email: "noah.kim@email.com", appliedAt: "2026-11-14T08:45:00.000Z", requirementsScore: 88, mustHaveResults: results(4), aiFitScore: 91, stage: "longlist" },
  { id: "eva-chen", name: "Eva Chen", email: "eva.chen@email.com", appliedAt: "2026-11-06T15:15:00.000Z", requirementsScore: 85, mustHaveResults: results(4), aiFitScore: 88, stage: "longlist" },
  { id: "luca-bennett", name: "Luca Bennett", email: "luca.bennett@email.com", appliedAt: "2026-11-05T12:30:00.000Z", requirementsScore: 83, mustHaveResults: results(4), aiFitScore: 86, stage: "longlist" },
  { id: "harper-james", name: "Harper James", email: "harper.james@email.com", appliedAt: "2026-11-04T09:10:00.000Z", requirementsScore: 90, mustHaveResults: results(4), aiFitScore: 88, stage: "longlist" },
  { id: "ravi-kapoor", name: "Ravi Kapoor", email: "ravi.kapoor@email.com", appliedAt: "2026-11-03T08:25:00.000Z", requirementsScore: 78, mustHaveResults: results(4), aiFitScore: 81, stage: "longlist" },
  { id: "priya-shah", name: "Priya Shah", email: "priya.shah@email.com", appliedAt: "2026-11-13T14:10:00.000Z", requirementsScore: 64, mustHaveResults: results(2), aiFitScore: 84, stage: "below-requirements" },
  { id: "daniel-okoro", name: "Daniel Okoro", email: "daniel.okoro@email.com", appliedAt: "2026-11-12T11:05:00.000Z", requirementsScore: 72, mustHaveResults: results(3), aiFitScore: 79, stage: "below-requirements" },
  { id: "sophie-laurent", name: "Sophie Laurent", email: "sophie.laurent@email.com", appliedAt: "2026-11-02T13:40:00.000Z", requirementsScore: 69, mustHaveResults: results(3), aiFitScore: 75, stage: "below-requirements" },
  { id: "marcus-reed", name: "Marcus Reed", email: "marcus.reed@email.com", appliedAt: "2026-11-01T10:55:00.000Z", requirementsScore: 67, mustHaveResults: results(3), aiFitScore: 73, stage: "below-requirements" },
  { id: "ibrahim-yusuf", name: "Ibrahim Yusuf", email: "ibrahim.yusuf@email.com", appliedAt: "2026-10-31T08:10:00.000Z", requirementsScore: 55, mustHaveResults: results(2), aiFitScore: 69, stage: "below-requirements" },
  { id: "chloe-bennett", name: "Chloe Bennett", email: "chloe.bennett@email.com", appliedAt: "2026-10-30T16:30:00.000Z", requirementsScore: 61, mustHaveResults: results(3), aiFitScore: 77, stage: "below-requirements" },
  { id: "amina-toure", name: "Amina Toure", email: "amina.toure@email.com", appliedAt: "2026-11-11T09:30:00.000Z", requirementsScore: 96, mustHaveResults: results(4), aiFitScore: 95, stage: "shortlist-proposed", stageHistory: ["longlist", "shortlist-proposed"], shortlistDecision: "Pending" },
  { id: "elena-voss", name: "Elena Voss", email: "elena.voss@email.com", appliedAt: "2026-11-10T16:20:00.000Z", requirementsScore: 90, mustHaveResults: results(4), aiFitScore: 89, stage: "shortlist-approved", stageHistory: ["longlist", "shortlist-proposed", "shortlist-approved"], shortlistDecision: "Approved" },
  { id: "mateo-silva", name: "Mateo Silva", email: "mateo.silva@email.com", appliedAt: "2026-11-09T12:15:00.000Z", requirementsScore: 87, mustHaveResults: results(4), aiFitScore: 92, stage: "reference-check", stageHistory: ["longlist", "shortlist-proposed", "shortlist-approved", "reference-check"], shortlistDecision: "Approved" },
  { id: "sara-nguyen", name: "Sara Nguyen", email: "sara.nguyen@email.com", appliedAt: "2026-11-08T07:50:00.000Z", requirementsScore: 89, mustHaveResults: results(4), aiFitScore: 90, stage: "offer", stageHistory: ["longlist", "shortlist-proposed", "shortlist-approved", "reference-check", "offer"], shortlistDecision: "Approved" },
  { id: "zoya-patel", name: "Zoya Patel", email: "zoya.patel@email.com", appliedAt: "2026-11-07T13:40:00.000Z", requirementsScore: 58, mustHaveResults: results(2), aiFitScore: 70, stage: "rejected" },
];

const screeningExamples: Record<string, CandidateScreeningData> = {
  "priya-shah": {
    status: "complete",
    requirements: [
      { requirement: "Relevant experience", result: "Met", reason: "Profile states 5 years of experience; needs at least 3.", source: "Checked by AI", mustHave: true },
      { requirement: "Required qualification", result: "Needs verification", reason: "A qualification is listed, but the submitted form does not include evidence to verify it.", source: "Checked against the form", mustHave: true },
      { requirement: "Work authorization", result: "Met", reason: "The candidate confirmed work authorization in the application form.", source: "Checked against the form", mustHave: true },
      { requirement: "Valid driving licence", result: "Not met", reason: "No valid driving licence was identified in the application.", source: "Checked by AI", mustHave: true },
      { requirement: "Collaborative communication", result: "Met", reason: "The candidate describes working with design and engineering teams.", source: "Set by a recruiter", mustHave: false },
    ],
  },
  "noah-kim": {
    status: "in-progress",
    requirements: [
      { requirement: "Relevant experience", result: "Met", reason: "The application describes relevant experience for this role.", source: "Checked by AI", mustHave: true },
      { requirement: "Required qualification", result: "Needs verification", reason: "The listed qualification is being checked against the submitted details.", source: "Checked against the form", mustHave: true },
      { requirement: "Work authorization", result: "Met", reason: "The candidate confirmed work authorization in the application form.", source: "Checked against the form", mustHave: true },
      { requirement: "Valid driving licence", result: "Needs verification", reason: "Screening has not finished checking the supporting information.", source: "Checked by AI", mustHave: true },
    ],
  },
  "zoya-patel": {
    status: "failed",
    error: "The uploaded CV could not be read. These partial results need review before they are relied on.",
    requirements: [
      { requirement: "Relevant experience", result: "Not met", reason: "The application does not show the required relevant experience.", source: "Checked by AI", mustHave: true },
      { requirement: "Required qualification", result: "Needs verification", reason: "The qualification details could not be verified from the uploaded file.", source: "Checked against the form", mustHave: true },
      { requirement: "Work authorization", result: "Met", reason: "The candidate confirmed work authorization in the application form.", source: "Checked against the form", mustHave: true },
      { requirement: "Valid driving licence", result: "Not met", reason: "No valid driving licence was identified in the available application details.", source: "Checked by AI", mustHave: true },
    ],
  },
};

export function getCandidateScreeningData(candidate: CampaignCandidate): CandidateScreeningData {
  const example = screeningExamples[candidate.id];
  if (example) return example;
  return {
    status: "complete",
    requirements: candidate.mustHaveResults.map((item, index) => ({
      requirement: item.requirement,
      result: item.met ? "Met" : "Not met",
      reason: item.met
        ? `The application shows evidence for ${item.requirement.toLowerCase()}.`
        : `The application does not provide evidence that meets ${item.requirement.toLowerCase()}.`,
      source: (["Checked by AI", "Checked against the form", "Set by a recruiter"] as ScreeningSource[])[index % 3],
      mustHave: true,
    })),
  };
}

function isCandidateStage(value: unknown): value is CandidateStage {
  return typeof value === "string" && campaignPipelineStages.some(stage => stage.id === value);
}

function isScreeningCorrection(value: unknown): value is ScreeningCorrection {
  if (typeof value !== "object" || value === null) return false;
  const correction = value as Partial<ScreeningCorrection>;
  return (correction.result === "Met" || correction.result === "Not met") &&
    typeof correction.note === "string" && correction.note.trim().length > 0 &&
    typeof correction.who === "string" && typeof correction.correctedAt === "string" &&
    (correction.originalResult === "Met" || correction.originalResult === "Needs verification" || correction.originalResult === "Not met") &&
    typeof correction.originalReason === "string" &&
    (correction.originalSource === "Checked by AI" || correction.originalSource === "Checked against the form" || correction.originalSource === "Set by a recruiter");
}

function isScreeningCorrections(value: unknown): value is Record<string, ScreeningCorrection> {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    Object.values(value).every(isScreeningCorrection);
}

function isShortlistDecision(value: unknown): value is CampaignCandidate["shortlistDecision"] {
  return value === "Pending" || value === "Approved" || value === "Returned";
}

function isCampaignCandidate(value: unknown): value is CampaignCandidate {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<CampaignCandidate>;
  return typeof candidate.id === "string" &&
    typeof candidate.campaignId === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.appliedAt === "string" &&
    typeof candidate.requirementsScore === "number" &&
    candidate.requirementsScore >= 0 && candidate.requirementsScore <= 100 &&
    Array.isArray(candidate.mustHaveResults) &&
    candidate.mustHaveResults.every(result => typeof result.requirement === "string" && typeof result.met === "boolean") &&
    typeof candidate.aiFitScore === "number" && candidate.aiFitScore >= 0 && candidate.aiFitScore <= 100 &&
    isCandidateStage(candidate.stage) &&
    (candidate.overriddenByRecruiter === undefined || typeof candidate.overriddenByRecruiter === "boolean") &&
    (candidate.stageHistory === undefined || (Array.isArray(candidate.stageHistory) && candidate.stageHistory.every(isCandidateStage))) &&
    (candidate.shortlistDecision === undefined || isShortlistDecision(candidate.shortlistDecision)) &&
    (candidate.screeningCorrections === undefined || isScreeningCorrections(candidate.screeningCorrections));
}

export function loadCampaignCandidates(campaignId: string): { candidates: CampaignCandidate[]; error: string | null } {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return { candidates: demoCandidates.map(candidate => ({ ...candidate, campaignId })), error: null };
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Saved campaign candidate data is not in the expected format.");
    }
    const storedCandidates = (parsed as Record<string, unknown>)[campaignId];
    if (storedCandidates === undefined) return { candidates: demoCandidates.map(candidate => ({ ...candidate, campaignId })), error: null };
    if (!Array.isArray(storedCandidates) || !storedCandidates.every(isCampaignCandidate) || storedCandidates.some(candidate => candidate.campaignId !== campaignId)) {
      throw new Error("Saved campaign candidates are not in the expected format.");
    }
    return { candidates: storedCandidates, error: null };
  } catch (error) {
    console.error("Could not load campaign candidate data from browser storage.", error);
    return { candidates: [], error: "Candidate data could not be loaded from this browser." };
  }
}

export function saveCampaignCandidates(campaignId: string, candidates: CampaignCandidate[]): string | null {
  try {
    const saved = window.localStorage.getItem(storageKey);
    const parsed: unknown = saved ? JSON.parse(saved) : {};
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Saved campaign candidate data is not in the expected format.");
    }
    if (!candidates.every(isCampaignCandidate) || candidates.some(candidate => candidate.campaignId !== campaignId)) {
      throw new Error("Campaign candidate updates are not in the expected format.");
    }
    window.localStorage.setItem(storageKey, JSON.stringify({ ...parsed, [campaignId]: candidates }));
    return null;
  } catch (error) {
    console.error("Could not save campaign candidate data to browser storage.", error);
    return "Candidate changes could not be saved in this browser. Please try again.";
  }
}
