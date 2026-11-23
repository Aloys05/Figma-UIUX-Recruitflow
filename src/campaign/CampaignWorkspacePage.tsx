import { useEffect, useMemo, useState } from "react";
import CampaignOffersTab from "../CampaignOffersTab";
import CampaignReferencesTab from "../CampaignReferencesTab";
import { loadReferencesOffers, offerStatusLabels, offerSummary, viewerFromActor } from "../campaignReferencesOffersData";
import { Badge, Button, Icon } from "../ui";
import ApplicationsTable from "./ApplicationsTable";
import CandidatePanel from "./CandidatePanel";
import { CampaignStatusDialog, LIFECYCLE_LABEL, PublishCampaignDialog, type LifecycleChange, type LifecycleState } from "./CampaignStatusDialog";
import ExportTab from "./ExportTab";
import MessagesTab from "./MessagesTab";
import OverviewTab from "./OverviewTab";
import PipelineBoard from "./PipelineBoard";
import ShortlistsTab from "./ShortlistsTab";
import { ROLE_LABEL, actorForRole, canPerform, setMockCampaignRole, useMockCampaignRole, type CampaignActor, type CampaignRole } from "./permissions";
import { campaignTeamOf, type CampaignTeamInput } from "./team";
import { openInviteFor } from "./approverInvites";
import { useCampaignWorkspaceStore, type CampaignWorkspaceStore, type WorkspaceRequirement } from "./workspaceStore";
import { GuardedButton, NO_APPROVER_MESSAGE, NoApproverWarning, Toast, type ApproverOption } from "./workspaceUi";

export type WorkspaceCampaign = CampaignTeamInput & {
  id: string;
  title: string;
  department: string;
  location: string;
  workArrangement: string;
  published: boolean;
  publishedAt: string | null;
  paused?: boolean;
  archived?: boolean;
  deleted?: boolean;
  closingDate?: string | null;
  statusChangeReason?: string;
  slug?: string;
};

type TabId = "overview" | "pipeline" | "longlist" | "below-requirements" | "shortlists" | "references" | "offers" | "messages" | "rejected" | "export";
const TABS: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "Pipeline" },
  { id: "longlist", label: "Longlist" },
  { id: "below-requirements", label: "Below requirements" },
  { id: "shortlists", label: "Shortlists" },
  { id: "references", label: "References" },
  { id: "offers", label: "Offers" },
  { id: "messages", label: "Messages" },
  { id: "rejected", label: "Rejected" },
  { id: "export", label: "Export" },
];
const isTab = (value: string | null): value is TabId => TABS.some(tab => tab.id === value);
const PREVIEW_ROLES: CampaignRole[] = ["admin", "main_recruiter", "additional_recruiter", "line_manager"];
const LIFECYCLE_TONE: Record<LifecycleState, "neutral" | "success" | "warning" | "danger"> = { draft: "neutral", published: "success", paused: "warning", closed: "danger" };

export function lifecycleOf(campaign: WorkspaceCampaign): LifecycleState {
  if (campaign.archived || campaign.deleted) return "closed";
  if (campaign.published && campaign.paused) return "paused";
  if (campaign.published) return "published";
  return "draft";
}

const delay = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

export default function CampaignWorkspacePage({ campaign: initialCampaign, description, requirements, createdLabel, publicUrl, onSaveCampaign, onBack, onEdit, onBulkUpload }: {
  campaign: WorkspaceCampaign;
  description: string;
  requirements: WorkspaceRequirement[];
  createdLabel: string;
  publicUrl: (campaign: WorkspaceCampaign) => string;
  /** Saves changes to the campaign; returns the saved campaign, or null if saving failed. */
  onSaveCampaign: (changes: Partial<WorkspaceCampaign>) => WorkspaceCampaign | null;
  onBack: () => void;
  onEdit: (section?: string) => void;
  onBulkUpload: () => void;
}) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const team = useMemo(() => campaignTeamOf(campaign), [campaign]);
  const role = useMockCampaignRole();
  const actor = actorForRole(role, team);
  const roleTitle = campaign.title || "Untitled campaign";
  const store = useCampaignWorkspaceStore(campaign.id, roleTitle, team);
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    return isTab(requested) ? requested : "overview";
  });
  const [focusApplication, setFocusApplication] = useState<string | null>(() => new URLSearchParams(window.location.search).get("application"));
  const [statusOpen, setStatusOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [profileFromWorkflow, setProfileFromWorkflow] = useState<string | null>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", activeTab);
    if (focusApplication && (activeTab === "references" || activeTab === "offers")) params.set("application", focusApplication);
    else params.delete("application");
    window.history.replaceState(window.history.state, "", `${window.location.pathname}?${params.toString()}`);
  }, [activeTab, focusApplication]);

  const state = lifecycleOf(campaign);
  const canOwn = canPerform(role, "editCampaign").allowed && canPerform(role, "changeLifecycle").allowed;
  const hasApprover = team.some(member => member.role === "Line manager");
  const noApproverReason = hasApprover ? null : NO_APPROVER_MESSAGE;
  const pendingInvite = useMemo(() => hasApprover ? null : openInviteFor(campaign.id), [hasApprover, campaign.id]);
  const today = new Date().toISOString().slice(0, 10);
  const accepting = state === "published" && (!campaign.closingDate || campaign.closingDate >= today);
  const applyLink = state === "draft" ? "" : publicUrl(campaign);
  const counts = (stage: string) => store.data.applications.filter(item => item.stage === stage).length;
  const shortlistCount = counts("shortlist-proposed") + counts("shortlist-approved");
  const approvers: ApproverOption[] = [
    ...team.filter(member => member.role === "Line manager").map(member => ({ id: member.id, name: member.name, role: "Line manager" })),
    { id: "admin-sophie", name: "Sophie Okafor", role: "Administrator" },
  ];
  const offers = useMemo(() => loadReferencesOffers(campaign.id, roleTitle).data.offers, [campaign.id, roleTitle, activeTab, store.data]);
  // Live counts shown on each tab.
  const activeOffers = new Set(offers.filter(offer => offer.status !== "withdrawn").map(offer => offer.candidateId)).size;
  const tabCounts: Partial<Record<TabId, { value: number; label: string }>> = {
    pipeline: { value: store.data.applications.length, label: "candidates" },
    longlist: { value: counts("longlist"), label: "candidates" },
    "below-requirements": { value: store.data.applications.filter(item => item.stage === "below-requirements" && !item.overridden).length, label: "candidates" },
    shortlists: { value: shortlistCount, label: "candidates proposed or approved" },
    references: { value: counts("shortlist-approved") + counts("reference-check") + counts("offer"), label: "candidates" },
    offers: { value: activeOffers, label: "offers" },
    messages: { value: store.data.messages.filter(item => item.status === "queued" || item.status === "failed").length, label: "emails waiting or failed" },
    rejected: { value: counts("rejected"), label: "candidates" },
  };
  const offerStatusFor = (applicationId: string) => {
    const mine = offers.filter(offer => offer.candidateId === applicationId).sort((a, b) => Date.parse(b.draftedAt) - Date.parse(a.draftedAt));
    const current = mine.find(offer => offer.status !== "withdrawn");
    return current ? offerStatusLabels[current.status] : null;
  };
  const workflowCandidates = store.data.applications.map(item => ({ id: item.id, name: item.name, email: item.email, stage: item.stage }));

  const saveCampaign = (changes: Partial<WorkspaceCampaign>) => {
    const saved = onSaveCampaign(changes);
    if (saved) setCampaign(saved);
    return saved;
  };

  const changeLifecycle = async (change: LifecycleChange): Promise<string | null> => {
    await delay(350);
    if (change.action === "pause") {
      if (!saveCampaign({ paused: true, statusChangeReason: change.reason })) return "We could not change the status. Try again.";
      store.logActivity("campaign.paused", actor);
    } else if (change.action === "close") {
      if (!saveCampaign({ published: false, paused: false, archived: true, statusChangeReason: change.reason })) return "We could not change the status. Try again.";
      store.logActivity("campaign.closed", actor);
    } else if (change.action === "reopen") {
      // A paused campaign has been published; a closed one must have been published before.
      if (state === "closed" && !campaign.publishedAt) return "Only a campaign that was published before can be reopened.";
      if (!saveCampaign({ published: true, paused: false, archived: false, deleted: false, closingDate: change.closingDate, statusChangeReason: undefined, publishedAt: campaign.publishedAt || new Date().toISOString() })) return "We could not change the status. Try again.";
      store.logActivity("campaign.reopened", actor);
    } else if (change.action === "set_closing_date") {
      if (!saveCampaign({ closingDate: change.closingDate })) return "We could not change the status. Try again.";
      store.logActivity("campaign.closing_date_set", actor);
    }
    return null;
  };

  const publish = async (slug: string): Promise<string | null> => {
    if (!campaign.department.trim() || !campaign.workArrangement.trim()) return "Service category and work arrangement must be set before publishing.";
    await delay(350);
    if (!saveCampaign({ published: true, paused: false, archived: false, deleted: false, publishedAt: campaign.publishedAt || new Date().toISOString(), slug })) return "We could not publish the campaign. Try again.";
    store.logActivity("campaign.published", actor);
    setPublishOpen(false);
    return null;
  };

  const copyLink = async () => {
    if (!applyLink || !accepting) return;
    try {
      await navigator.clipboard.writeText(applyLink);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    window.setTimeout(() => setCopyState("idle"), 2000);
  };

  const openWorkflow = (applicationId: string, tab: "references" | "offers") => {
    setFocusApplication(applicationId);
    setActiveTab(tab);
  };
  const selectTab = (tab: TabId) => {
    setActiveTab(tab);
    setFocusApplication(null);
  };

  const viewer = viewerFromActor(actor);
  const tabLabel = TABS.find(tab => tab.id === activeTab)?.label ?? "";

  return <section className="campaign-workspace cw-workspace">
    <header className="campaign-workspace-header surface cw-hero">
      <div className="cw-hero-top">
        <button type="button" className="cw-back-link" onClick={onBack}><Icon name="chevron" size={16}/>Back to campaigns</button>
        <label className="cw-preview-as" title="Mock mode only: preview which buttons each role can use."><span>Preview as</span><select value={role} onChange={event => setMockCampaignRole(event.target.value as CampaignRole)}>{PREVIEW_ROLES.map(option => <option key={option} value={option}>{ROLE_LABEL[option]}</option>)}</select></label>
      </div>

      <div className="cw-hero-main">
        <div className="cw-hero-copy">
          <span className="eyebrow">Campaign overview</span>
          <h1>{roleTitle}</h1>
          <div className="cw-hero-pills">
            <Badge tone={LIFECYCLE_TONE[state]}>{LIFECYCLE_LABEL[state]}</Badge>
            <Badge tone={accepting ? "success" : "neutral"}>{accepting ? "Visible to candidates" : "Hidden from candidates"}</Badge>
          </div>
          <ul className="cw-hero-meta">
            <li><Icon name="building" size={14}/>{campaign.department || "Service category not set"}</li>
            <li><Icon name="location" size={14}/>{campaign.location || "Location not set"}</li>
            <li><Icon name="briefcase" size={14}/>{campaign.workArrangement || "Work arrangement not set"}</li>
            <li><Icon name="calendar" size={14}/>{campaign.closingDate ? `Closes ${campaign.closingDate}` : "No closing date"}</li>
          </ul>
          {description && <>
            <p className={`cw-hero-description${descriptionOpen ? " open" : ""}`}>{description}</p>
            {description.length > 160 && <button type="button" className="cw-more" aria-expanded={descriptionOpen} onClick={() => setDescriptionOpen(open => !open)}>{descriptionOpen ? "Show less" : "Show more"}</button>}
          </>}
        </div>
        <div className={`cw-hero-actions${canOwn ? "" : " view-only"}`}>
          {canOwn && <Button icon="settings" onClick={() => setStatusOpen(true)}>Change status</Button>}
          {canOwn && <Button variant="secondary" icon="file" onClick={() => onEdit()}>Edit campaign &amp; form</Button>}
          {canPerform(role, "screen").allowed && <Button variant="secondary" icon="upload" onClick={onBulkUpload}>Bulk upload CVs</Button>}
          {!canOwn && <p className="cw-view-only-note"><Icon name="lock" size={14}/>Only the main recruiter or an administrator can edit this campaign or change its status.</p>}
        </div>
      </div>
      {store.error && <p className="demo-storage-error" role="alert">{store.error}</p>}

      <section className="cw-link-row" aria-label="Public apply link">
        <span className="cw-link-icon"><Icon name="external" size={18}/></span>
        <div className="cw-link-body">
          <div className="cw-link-heading"><strong>Public apply link</strong><Badge tone={accepting ? "success" : "warning"}>{accepting ? "Accepting applications" : "Not accepting applications"}</Badge></div>
          <code className="cw-link" title={applyLink || undefined}>{applyLink || "Not published"}</code>
          <small>Created {createdLabel}. Closing {campaign.closingDate || "date not set"}.</small>
        </div>
        <Button variant="secondary" icon={copyState === "copied" ? "check" : "file"} className="cw-copy" disabled={!applyLink || !accepting} onClick={() => { void copyLink(); }}>{copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy link"}</Button>
      </section>

      <dl className="cw-metrics">
        {([
          ["Applications", store.data.applications.length, "total", "users"],
          ["Longlist", counts("longlist"), "", "filter"],
          ["Below requirements", counts("below-requirements"), "red", "target"],
          ["Shortlist proposed", counts("shortlist-proposed"), "blue", "clock"],
          ["Shortlist approved", counts("shortlist-approved"), "green", "check"],
          ["Reference check", counts("reference-check"), "blue", "users"],
          ["Offer", counts("offer"), "purple", "file"],
          ["Rejected", counts("rejected"), "muted", "close"],
        ] as const).map(([label, value, tone, icon]) => <div className={`cw-metric ${tone}`} key={label}>
          <dt><Icon name={icon} size={14}/>{label}</dt>
          <dd>{value}</dd>
        </div>)}
      </dl>
    </header>

    <nav className="campaign-workspace-tabs" aria-label="Campaign workspace tabs">
      {TABS.map(tab => <button key={tab.id} type="button" className={activeTab === tab.id ? "active" : ""} aria-current={activeTab === tab.id ? "page" : undefined} onClick={() => selectTab(tab.id)}>{tab.label}{tabCounts[tab.id] && <span className={`campaign-tab-count${tab.id === "messages" && tabCounts[tab.id]!.value > 0 ? " attention" : ""}`} aria-label={`${tabCounts[tab.id]!.value} ${tabCounts[tab.id]!.value === 1 ? tabCounts[tab.id]!.label.replace(/^(candidate|offer|email)s/, "$1") : tabCounts[tab.id]!.label}`}>{tabCounts[tab.id]!.value}</span>}</button>)}
    </nav>

    <section className="campaign-workspace-content cw-panel" aria-labelledby="workspace-panel-title">
      <div className="cw-panel-card">
        <span className="eyebrow">Campaign workspace</span>
        <h2 id="workspace-panel-title">{tabLabel}</h2>
        <Toast message={store.toast} onDismiss={store.dismissToast}/>
        <div className="cw-panel-body">
          {!hasApprover && (activeTab === "overview" || activeTab === "shortlists" || activeTab === "offers") && <NoApproverWarning pendingInvite={pendingInvite} onOpenTeam={() => onEdit("campaign-edit-team")}/>}
          {activeTab === "overview" && <OverviewTab data={store.data} requirements={requirements} onOpenShortlists={() => selectTab("shortlists")} onEditRequirements={() => onEdit("campaign-edit-requirements")}/>}
          {activeTab === "pipeline" && <PipelineBoard store={store} requirements={requirements} actor={actor} offerStatusFor={offerStatusFor} onOpenWorkflow={openWorkflow}/>}
          {(activeTab === "longlist" || activeTab === "below-requirements" || activeTab === "rejected") && <ApplicationsTable section={activeTab} store={store} requirements={requirements} actor={actor} approvers={approvers} offerStatusFor={offerStatusFor} blockedReason={noApproverReason}/>}
          {activeTab === "shortlists" && <ShortlistsTab store={store} requirements={requirements} actor={actor} approvers={approvers} offerStatusFor={offerStatusFor} onOpenOverview={() => selectTab("overview")} blockedReason={noApproverReason}/>}
          {activeTab === "references" && <CampaignReferencesTab campaignId={campaign.id} roleTitle={roleTitle} candidates={workflowCandidates} onMoveCandidate={(id, stage) => store.setStageFromWorkflow(id, stage, actor)} onSelectCandidate={setProfileFromWorkflow} viewer={viewer} focusCandidateId={focusApplication}/>}
          {activeTab === "offers" && <CampaignOffersTab campaignId={campaign.id} roleTitle={roleTitle} candidates={workflowCandidates} onMoveCandidate={(id, stage) => store.setStageFromWorkflow(id, stage, actor)} onSelectCandidate={setProfileFromWorkflow} viewer={viewer} focusCandidateId={focusApplication} onOfferSent={(id, offer) => store.queueOfferEmail(id, offerSummary(offer))} submitBlockedReason={noApproverReason}/>}
          {activeTab === "messages" && <MessagesTab store={store} actor={actor}/>}
          {activeTab === "export" && <ExportTab campaignTitle={roleTitle} data={store.data} requirements={requirements} actor={actor} onDownloaded={() => store.logActivity("campaign.exported", actor)}/>}
        </div>
      </div>
      <p className="cw-footnote">Showing applications for this campaign.</p>
    </section>

    {profileFromWorkflow && <WorkflowProfile applicationId={profileFromWorkflow} store={store} actor={actor} requirements={requirements} offerStatusFor={offerStatusFor} onClose={() => setProfileFromWorkflow(null)}/>}
    {statusOpen && <CampaignStatusDialog state={state} closingDate={campaign.closingDate ?? null} reason={campaign.statusChangeReason ?? null} onClose={() => setStatusOpen(false)} onChange={changeLifecycle} onPublish={() => { setStatusOpen(false); setPublishOpen(true); }}/>}
    {publishOpen && <PublishCampaignDialog defaultSlug={campaign.slug || Math.random().toString(36).slice(2, 10)} onCancel={() => setPublishOpen(false)} onPublish={publish}/>}
  </section>;
}


function WorkflowProfile({ applicationId, store, requirements, offerStatusFor, actor, onClose }: { applicationId: string; store: CampaignWorkspaceStore; requirements: readonly WorkspaceRequirement[]; offerStatusFor: (id: string) => string | null; actor: CampaignActor; onClose: () => void }) {
  const application = store.data.applications.find(item => item.id === applicationId);
  if (!application) return null;
  return <CandidatePanel application={application} requirements={requirements} offerStatus={offerStatusFor(application.id)} store={store} actor={actor} onClose={onClose}/>;
}
