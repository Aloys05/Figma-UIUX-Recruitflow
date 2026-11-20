import { useState } from "react";
import { Button } from "../ui";
import type { CampaignActor } from "./permissions";
import { GuardedButton } from "./workspaceUi";
import { screenApplication, stageName, type WorkspaceData, type WorkspaceRequirement } from "./workspaceStore";

/** Spreadsheet export, kept from the current RecruitFlow workspace. */
export default function ExportTab({ campaignTitle, data, requirements, actor, onDownloaded }: { campaignTitle: string; data: WorkspaceData; requirements: readonly WorkspaceRequirement[]; actor: CampaignActor; onDownloaded: () => void }) {
  const [state, setState] = useState<"ready" | "downloading" | "downloaded" | "failed">("ready");
  const longlist = data.applications.filter(item => item.stage === "longlist").sort((a, b) => screenApplication(b, requirements).requirementsScore - screenApplication(a, requirements).requirementsScore || a.name.localeCompare(b.name));
  const shortlisted = data.applications.filter(item => item.proposalId || ["shortlist-proposed", "shortlist-approved", "reference-check", "offer"].includes(item.stage)).sort((a, b) => b.fitScore - a.fitScore || a.name.localeCompare(b.name));
  const decisionFor = (applicationId: string) => {
    const proposal = data.proposals.find(item => item.applicationIds.includes(applicationId) && item.status !== "Withdrawn");
    return proposal?.decisions[applicationId]?.decision ?? (proposal ? "Awaiting decision" : "Not proposed");
  };

  const download = async () => {
    setState("downloading");
    try {
      await new Promise(resolve => window.setTimeout(resolve, 180));
      const escapeXml = (value: string | number) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
      const row = (cells: Array<string | number>) => `<Row>${cells.map(value => `<Cell><Data ss:Type="${typeof value === "number" ? "Number" : "String"}">${escapeXml(value)}</Data></Cell>`).join("")}</Row>`;
      const sheet = (name: string, headers: string[], rows: Array<Array<string | number>>) => `<Worksheet ss:Name="${name}"><Table>${row(headers)}${rows.map(row).join("")}</Table></Worksheet>`;
      const longlistRows = longlist.map(item => {
        const screening = screenApplication(item, requirements);
        return [item.name, item.email, new Date(item.appliedDate).toLocaleDateString(), screening.requirementsScore, `${screening.mustHave.met} of ${screening.mustHave.total}`, item.fitScore];
      });
      const shortlistRows = shortlisted.map(item => [item.name, item.email, new Date(item.appliedDate).toLocaleDateString(), stageName(item.stage), decisionFor(item.id)]);
      const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${sheet("Longlist", ["Applicant", "Email", "Applied", "Requirements score (%)", "Must-haves met", "AI fit (%)"], longlistRows)}${sheet("Shortlist", ["Applicant", "Email", "Applied", "Current stage", "Approver decision"], shortlistRows)}</Workbook>`;
      const url = URL.createObjectURL(new Blob([workbook], { type: "application/vnd.ms-excel" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${campaignTitle.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "campaign"}-export.xls`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setState("downloaded");
      onDownloaded();
    } catch (error) {
      console.error("Could not create the campaign spreadsheet.", error);
      setState("failed");
    }
  };

  return <section className="campaign-export-screen">
    <article className="campaign-export-card">
      <header><div><h3>Spreadsheet export</h3><p>Download one workbook with two sheets, based on the latest saved campaign data.</p></div>
        <GuardedButton role={actor.role} action="exportData" variant="primary" disabled={state === "downloading"} onClick={() => { void download(); }}>{state === "downloading" ? "Downloading…" : state === "failed" ? "Retry download" : state === "downloaded" ? "Download again" : "Download spreadsheet"}</GuardedButton>
      </header>
      <div className="campaign-export-sheets"><section><h4>Longlist</h4><p>Everyone on the Longlist now, best requirements score first.</p><small>{longlist.length} candidates</small></section><section><h4>Shortlist</h4><p>Everyone ever proposed, including candidates who moved on to references or an offer, with the approver’s decision.</p><small>{shortlisted.length} candidates</small></section></div>
      <p className="cw-muted">Every download is recorded in the campaign history.</p>
      {state === "downloading" && <p className="campaign-export-status" role="status">Preparing your spreadsheet…</p>}
      {state === "downloaded" && <p className="campaign-export-status" role="status">Spreadsheet downloaded.</p>}
      {state === "failed" && <p className="campaign-export-error" role="alert">The spreadsheet could not be downloaded. Please try again. <Button variant="ghost" onClick={() => setState("ready")}>Dismiss</Button></p>}
    </article>
  </section>;
}
