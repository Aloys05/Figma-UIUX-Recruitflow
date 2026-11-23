import type { CampaignTeamMember } from "./permissions";

export type CampaignTeamInput = {
  campaignTeam?: Array<{ id: string; name: string; email: string; role: CampaignTeamMember["role"] }>;
  approver?: { name: string; email: string } | null;
};

/** Recruiters in the organisation who can be added to a campaign team (mock directory). Approvers are invited separately. */
export const ORGANISATION_PEOPLE: ReadonlyArray<{ id: string; name: string; email: string }> = [
  { id: "owner-dave", name: "Dave Sench", email: "dave30@gmail.com" },
  { id: "person-priya", name: "Priya Naidoo", email: "priya.naidoo@northstarlabs.com" },
  { id: "person-lina", name: "Lina Amadhila", email: "lina.amadhila@northstarlabs.com" },
  { id: "person-even", name: "Even Hashikutuva", email: "even.hashikutuva@northstarlabs.com" },
  { id: "person-james", name: "James Kevin", email: "james.kevin@northstarlabs.com" },
  { id: "person-thandi", name: "Thandi Nekwaya", email: "thandi.nekwaya@northstarlabs.com" },
  { id: "admin-sophie", name: "Sophie Okafor", email: "sophie.okafor@northstarlabs.com" },
];

export const DEFAULT_CAMPAIGN_TEAM: CampaignTeamMember[] = [
  { id: "owner-dave", name: "Dave Sench", email: "dave30@gmail.com", role: "Main recruiter" },
  { id: "person-priya", name: "Priya Naidoo", email: "priya.naidoo@northstarlabs.com", role: "Additional recruiter" },
  { id: "person-johnny", name: "Johnny Test", email: "johnny.test@northstarlabs.com", role: "Line manager" },
];

/** The campaign's team, falling back to the demo team and folding in a legacy approver as line manager. */
export function campaignTeamOf(campaign: CampaignTeamInput): CampaignTeamMember[] {
  const team = campaign.campaignTeam?.length ? campaign.campaignTeam.map(member => ({ ...member })) : DEFAULT_CAMPAIGN_TEAM.map(member => ({ ...member }));
  if (!team.some(member => member.role === "Line manager")) {
    if (campaign.approver) team.push({ id: `line-manager-${campaign.approver.email}`, name: campaign.approver.name, email: campaign.approver.email, role: "Line manager" });
    else if (!campaign.campaignTeam?.length) team.push({ ...DEFAULT_CAMPAIGN_TEAM[2] });
  }
  return team;
}
