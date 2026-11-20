import { useEffect, useState } from "react";

/**
 * Who may do what on a campaign. Ported one-to-one from the Refrane
 * `campaignPermissions` rules: screens read them to disable buttons and show
 * the same reason the API would give.
 */

export const CAMPAIGN_ROLES = ["admin", "main_recruiter", "additional_recruiter", "line_manager", "viewer"] as const;
export type CampaignRole = (typeof CAMPAIGN_ROLES)[number];

export const CAMPAIGN_TEAM_ROLES = ["main_recruiter", "additional_recruiter", "line_manager"] as const;
export type CampaignTeamRole = (typeof CAMPAIGN_TEAM_ROLES)[number];

export type CampaignAction =
  | "view" | "viewDocuments" | "editCampaign" | "manageTeam" | "changeLifecycle" | "screen" | "manageLonglist"
  | "propose" | "approveShortlist" | "reject" | "manageReferences" | "manageOffers" | "approveOffer"
  | "queueMessages" | "sendMessages" | "exportData";

export type PermissionResult = { allowed: true } | { allowed: false; reason: string };

const RECRUITERS: readonly CampaignRole[] = ["admin", "main_recruiter", "additional_recruiter"];
const OWNERS: readonly CampaignRole[] = ["admin", "main_recruiter"];
const APPROVERS: readonly CampaignRole[] = ["admin", "line_manager"];
const TEAM: readonly CampaignRole[] = ["admin", "main_recruiter", "additional_recruiter", "line_manager"];

const RULES: Record<CampaignAction, { roles: readonly CampaignRole[]; reason: string }> = {
  view: { roles: [...TEAM, "viewer"], reason: "You do not have access to this campaign." },
  viewDocuments: { roles: [...TEAM, "viewer"], reason: "You do not have access to candidate documents on this campaign." },
  editCampaign: { roles: OWNERS, reason: "Only the main recruiter or an administrator can change this campaign." },
  manageTeam: { roles: OWNERS, reason: "Only the main recruiter or an administrator can change the campaign's team." },
  changeLifecycle: { roles: OWNERS, reason: "Only the main recruiter or an administrator can publish, pause or close this campaign." },
  screen: { roles: RECRUITERS, reason: "Only recruiters on this campaign can run screening." },
  manageLonglist: { roles: RECRUITERS, reason: "Only recruiters on this campaign can manage the longlist." },
  propose: { roles: OWNERS, reason: "Only the main recruiter can propose a shortlist." },
  approveShortlist: { roles: APPROVERS, reason: "Only a line manager or an administrator can approve a shortlist." },
  reject: { roles: OWNERS, reason: "Only the main recruiter can reject a candidate." },
  manageReferences: { roles: RECRUITERS, reason: "Only recruiters on this campaign can manage references." },
  manageOffers: { roles: OWNERS, reason: "Only the main recruiter can draft, send or withdraw an offer." },
  approveOffer: { roles: APPROVERS, reason: "Only a line manager or an administrator can approve an offer." },
  queueMessages: { roles: RECRUITERS, reason: "Only recruiters on this campaign can prepare candidate emails." },
  sendMessages: { roles: OWNERS, reason: "Only the main recruiter can send candidate emails." },
  exportData: { roles: TEAM, reason: "Only people on this campaign's team can export its data." },
};

const NOT_ON_TEAM_REASON = "You can view this campaign, but you are not on its team. Ask the main recruiter to add you.";

export function canPerform(role: CampaignRole, action: CampaignAction): PermissionResult {
  const rule = RULES[action];
  if (rule.roles.includes(role)) return { allowed: true };
  return { allowed: false, reason: role === "viewer" ? NOT_ON_TEAM_REASON : rule.reason };
}

export const ROLE_LABEL: Record<CampaignRole, string> = {
  admin: "Administrator",
  main_recruiter: "Main recruiter",
  additional_recruiter: "Additional recruiter",
  line_manager: "Line manager",
  viewer: "Viewer (not on the team)",
};

export const TEAM_ROLE_LABEL: Record<CampaignTeamRole, string> = {
  main_recruiter: "Main recruiter",
  additional_recruiter: "Additional recruiter",
  line_manager: "Line manager",
};

/* ------------------------------------------------------------------ */
/* Mock "Preview as" role, shared by the workspace, its tabs and editor */
/* ------------------------------------------------------------------ */

const roleStorageKey = "recruitflow.mockCampaignRole";
const roleEvent = "recruitflow:mock-campaign-role";

function readRole(): CampaignRole {
  try {
    const stored = window.sessionStorage.getItem(roleStorageKey);
    if (stored && (CAMPAIGN_ROLES as readonly string[]).includes(stored)) return stored as CampaignRole;
  } catch {
    // Session storage can be unavailable; fall back to the default role.
  }
  return "main_recruiter";
}

export function setMockCampaignRole(role: CampaignRole) {
  try {
    window.sessionStorage.setItem(roleStorageKey, role);
  } catch {
    // The preview role is a convenience; losing it is harmless.
  }
  window.dispatchEvent(new Event(roleEvent));
}

export function useMockCampaignRole(): CampaignRole {
  const [role, setRole] = useState(readRole);
  useEffect(() => {
    const update = () => setRole(readRole());
    window.addEventListener(roleEvent, update);
    return () => window.removeEventListener(roleEvent, update);
  }, []);
  return role;
}

/** The people a previewed role stands for, so actions record a real name. */
export type CampaignTeamMember = { id: string; name: string; email: string; role: "Main recruiter" | "Additional recruiter" | "Line manager" };
export type CampaignActor = { id: string; name: string; role: CampaignRole };

export const ADMIN_ACTOR: CampaignActor = { id: "admin-sophie", name: "Sophie Okafor", role: "admin" };

export function actorForRole(role: CampaignRole, team: readonly CampaignTeamMember[]): CampaignActor {
  if (role === "admin") return ADMIN_ACTOR;
  if (role === "viewer") return { id: "viewer-maya", name: "Maya Daniels", role };
  const wanted = role === "main_recruiter" ? "Main recruiter" : role === "additional_recruiter" ? "Additional recruiter" : "Line manager";
  const member = team.find(item => item.role === wanted);
  if (member) return { id: member.id, name: member.name, role };
  const fallback = { main_recruiter: "Dave Sench", additional_recruiter: "Priya Naidoo", line_manager: "Johnny Test" } as const;
  return { id: `${role}-fallback`, name: fallback[role], role };
}
