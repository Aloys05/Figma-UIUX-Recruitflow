import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { campaignPipelineStages, getCandidateScreeningData, getScreeningRequirementKey, loadCampaignCandidates, saveCampaignCandidates, type CampaignCandidate, type CandidateScreeningRequirement, type CandidateScreeningData, type CandidateStage, type ScreeningCorrectionResult } from "./campaignPipelineData";

// Resolve bundled reference images correctly on localhost and subpath deployments.
const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

type IconName =
  | "home" | "briefcase" | "users" | "sparkles" | "settings" | "search"
  | "bell" | "plus" | "arrow" | "dots" | "check" | "clock" | "chevron"
  | "filter" | "file" | "target" | "user" | "logOut" | "menu" | "close"
  | "building" | "card" | "lock" | "mail" | "eye" | "upload" | "location" | "minus"
  | "calendar" | "bookmark" | "external";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    sparkles: <><path d="m12 3-1.2 3.2L8 7.5l2.8 1.3L12 12l1.2-3.2L16 7.5l-2.8-1.3L12 3Z"/><path d="m5 13-.9 2.1L2 16l2.1.9L5 19l.9-2.1L8 16l-2.1-.9L5 13ZM19 13l-.9 2.1L16 16l2.1.9L19 19l.9-2.1L22 16l-2.1-.9L19 13Z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    minus: <path d="M5 12h14"/>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    dots: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    filter: <path d="M4 5h16M7 12h10M10 19h4"/>,
    file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 13h6M9 17h6"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    logOut: <><path d="M10 4H4v16h6M14 8l4 4-4 4M18 12H8"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    building: <><path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3M3 21h18"/></>,
    card: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v5h16v-5"/></>,
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4z"/>,
    external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v7H4V6h7"/></>,
  };
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Button({ children, variant = "primary", icon, onClick, className = "", type = "button", disabled = false }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconName; onClick?: React.MouseEventHandler<HTMLButtonElement>; className?: string; type?: "button" | "submit"; disabled?: boolean;
}) {
  return <button type={type} className={`btn btn-${variant} ${className}`} onClick={onClick} disabled={disabled}>{icon && <Icon name={icon} size={16}/>}<span>{children}</span></button>;
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "success" | "warning" | "danger" | "info" | "neutral" }) {
  return <span className={`badge badge-${tone}`}><span className="badge-dot"/>{children}</span>;
}

function Avatar({ initials, color = "blue", size = "md" }: { initials: string; color?: string; size?: "sm" | "md" | "lg" }) {
  return <span className={`avatar avatar-${color} avatar-${size}`}>{initials}</span>;
}

function Field({ label, placeholder, icon, type = "text", helper, required = false, minLength, value, onChange, readOnly = false, disabled = false, name }: { label: string; placeholder?: string; icon?: IconName; type?: string; helper?: string; required?: boolean; minLength?: number; value?: string; onChange?: React.ChangeEventHandler<HTMLInputElement>; readOnly?: boolean; disabled?: boolean; name?: string; }) {
  return <label className="field"><span className="field-label">{label}</span><span className="input-wrap">{icon && <Icon name={icon} size={17}/>}<input type={type} placeholder={placeholder} required={required} minLength={minLength} value={value} onChange={onChange} readOnly={readOnly} disabled={disabled} name={name}/>{type === "password" && <Icon name="eye" size={17}/>}</span>{helper && <span className="field-helper">{helper}</span>}</label>;
}

const recruiterNav = [
  { label: "Overview", icon: "home" as IconName, path: "/recruiter" },
  { label: "Campaigns", icon: "briefcase" as IconName, path: "/recruiter/campaigns" },
  { label: "Candidates", icon: "users" as IconName, path: "/recruiter/candidates" },
  { label: "AI Evaluations", icon: "sparkles" as IconName, path: "/recruiter/evaluations" },
];
const candidateNav = [
  { label: "Overview", icon: "home" as IconName, path: "/candidate" },
  { label: "Find jobs", icon: "search" as IconName, path: "/candidate/jobs" },
  { label: "My applications", icon: "file" as IconName, path: "/candidate/applications" },
  { label: "My profile", icon: "user" as IconName, path: "/candidate/settings/profile-readiness" },
];

function go(path: string) {
  const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const route = path.replace(/^\/+/, "");
  window.history.pushState({}, "", `${basePath}${route}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getAppPath() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = window.location.pathname;
  return basePath && basePath !== "/" && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

function getPublicCampaignUrl(campaignId = "1") {
  const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return `${window.location.origin}${basePath}public/campaign/${campaignId}`;
}

function Logo() {
  return <button className="logo" onClick={() => go("/recruiter")}><span className="brand-symbol"><img src={asset("assets/recruitflow-logo.png")} alt="" /></span><span>RecruitFlow</span></button>;
}

function AppShell({ children, mode, path, hideTopbar = false }: { children: React.ReactNode; mode: "recruiter" | "candidate"; path: string; hideTopbar?: boolean }) {
  const profileReadiness = getDisplayedProfileReadiness();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = mode === "recruiter" ? recruiterNav : candidateNav;
  const current = (p: string) => p === `/${mode}` ? path === p : path.startsWith(p);
  const logOut = () => {
    window.history.replaceState({}, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-top"><Logo/><button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><Icon name="close"/></button></div>
      {mode === "recruiter" ? <div className="org-switch"><span className="org-icon">N</span><span><strong>Northstar Labs</strong><small>Recruiter workspace</small></span><Icon name="chevron" size={15}/></div> : <div className="profile-mini"><Avatar initials="AM" color="purple"/><span><strong>Alex Morgan</strong><small>Candidate account</small></span></div>}
      <nav className="main-nav" aria-label="Primary">
        <span className="nav-label">Workspace</span>
        {nav.map(item => <button key={item.path} className={`nav-item ${current(item.path) ? "active" : ""}`} onClick={() => { go(item.path); setMobileOpen(false); }}><Icon name={item.icon}/><span>{item.label}</span>{item.label === "My profile" && <span className="nav-progress">{profileReadiness}%</span>}</button>)}
        {mode === "recruiter" && <div className="nav-settings">
          <button className={`nav-item ${path.includes("/settings/") ? "active" : ""}`} onClick={() => go("/recruiter/settings/team")}><Icon name="settings"/><span>Settings</span><Icon name="chevron" size={14}/></button>
          {(path.includes("/settings/") || true) && <div className="subnav">
            <button className={path.endsWith("/team") ? "active" : ""} onClick={() => go("/recruiter/settings/team")}>Team</button>
            <button className={path.endsWith("/business") ? "active" : ""} onClick={() => go("/recruiter/settings/business")}>Business</button>
          </div>}
        </div>}
      </nav>
      {mode === "candidate" && <div className="readiness-card">
        <div className="readiness-head"><span>Profile readiness</span><strong>{profileReadiness}%</strong></div>
        <div className="progress"><span style={{ width: `${profileReadiness}%` }}/></div>
        <p>{profileReadiness === 100 ? "Your profile is ready to be matched." : "Add work experience to improve your matches."}</p>
        <button onClick={() => go("/candidate/settings/profile-readiness")}>Complete profile <Icon name="arrow" size={14}/></button>
      </div>}
      <div className="sidebar-footer"><div className="account-row"><Avatar initials={mode === "recruiter" ? "SO" : "AM"} color={mode === "recruiter" ? "green" : "purple"} size="sm"/><span className="account-details"><strong>{mode === "recruiter" ? "Sophie Okafor" : "Alex Morgan"}</strong><small>{mode === "recruiter" ? "Owner" : "alex@example.com"}</small></span><button className="account-signout" onClick={logOut} aria-label="Sign out" title="Sign out"><Icon name="logOut" size={17}/></button></div></div>
    </aside>
    {mobileOpen && <button className="scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation"/>}
    <main className={`main${hideTopbar ? " main-no-topbar" : ""}`}>
      <header className={`topbar${hideTopbar ? " topbar-bulk-upload" : ""}`}>
        <button className="icon-btn menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Icon name="menu"/></button>
        <div className="topbar-spacer"/>
        <button className="workspace-toggle" onClick={() => go(mode === "recruiter" ? "/candidate" : "/recruiter")}><Icon name={mode === "recruiter" ? "user" : "building"} size={15}/>{mode === "recruiter" ? "Candidate view" : "Recruiter view"}</button>
        <button className="icon-btn notification" aria-label="Notifications"><Icon name="bell"/><span/></button>
        <Avatar initials={mode === "recruiter" ? "SO" : "AM"} color={mode === "recruiter" ? "green" : "purple"} size="sm"/>
      </header>
      <div className="content" key={path}><div className="route-content">{children}</div></div>
    </main>
  </div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-actions">{action}</div>}</div>;
}

type RoleView = "owner" | "recruiter";

function getRouteRoleView(defaultView: RoleView = "owner"): RoleView {
  const search = new URLSearchParams(window.location.search);
  const value = search.get("view");
  return value === "owner" || value === "recruiter" ? value : defaultView;
}

function updateRouteRoleView(next: RoleView) {
  const url = new URL(window.location.href);
  url.searchParams.set("view", next);
  window.history.replaceState({}, "", `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ""}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function updateRouteQuery(values: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ""}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

type DemoTeamMember = { id: string; initials: string; name: string; email: string; role: "Owner" | "Recruiter" };
type DemoTeamInvite = { id: string; initials: string; name: string; email: string; role: "Recruiter"; link: string; createdAt: number; expiresAt: number };
type DemoTeamData = { members: DemoTeamMember[]; invites: DemoTeamInvite[] };

const demoTeamStorageKey = "recruitflow.demoTeam";

function createDefaultDemoTeam(): DemoTeamData {
  const now = Date.now();
  const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return {
    members: [
      { id: "owner-dave", initials: "DS", name: "Dave Sench", email: "dave30@gmail.com", role: "Owner" },
      { id: "recruiter-luca", initials: "LM", name: "Luca Meyer", email: "luca@northstarlabs.com", role: "Recruiter" },
      { id: "recruiter-amina", initials: "AT", name: "Amina Toure", email: "amina@northstarlabs.com", role: "Recruiter" },
    ],
    invites: [{
      id: "demo-recruiter-invite",
      initials: "KM",
      name: "K. Moyo",
      email: "k.moyo@example.com",
      role: "Recruiter",
      link: `${window.location.origin}${basePath}invitation/demo-recruiter-invite`,
      createdAt: now - 2 * 24 * 60 * 60 * 1000,
      expiresAt: now + 5 * 24 * 60 * 60 * 1000,
    }],
  };
}

function isDemoTeamData(value: unknown): value is DemoTeamData {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Partial<DemoTeamData>;
  return Array.isArray(data.members) && data.members.every(member =>
    typeof member.id === "string" && typeof member.initials === "string" &&
    typeof member.name === "string" && typeof member.email === "string" &&
    (member.role === "Owner" || member.role === "Recruiter")
  ) && data.members.filter(member => member.role === "Owner").length === 1 &&
    Array.isArray(data.invites) && data.invites.every(invite =>
      typeof invite.id === "string" && typeof invite.initials === "string" &&
      typeof invite.name === "string" && typeof invite.email === "string" &&
      invite.role === "Recruiter" && typeof invite.link === "string" &&
      typeof invite.createdAt === "number" && typeof invite.expiresAt === "number"
    );
}

function readDemoTeam(): DemoTeamData {
  try {
    const saved = window.localStorage.getItem(demoTeamStorageKey);
    if (!saved) return createDefaultDemoTeam();
    const parsed: unknown = JSON.parse(saved);
    if (!isDemoTeamData(parsed)) throw new Error("Saved team data is not in the expected format.");
    return parsed;
  } catch (error) {
    console.error("Could not load demo team data from browser storage.", error);
    return createDefaultDemoTeam();
  }
}

function saveDemoTeam(team: DemoTeamData): boolean {
  try {
    window.localStorage.setItem(demoTeamStorageKey, JSON.stringify(team));
    return true;
  } catch (error) {
    console.error("Could not save demo team data to browser storage.", error);
    return false;
  }
}

function getInvitationId() {
  const parts = getAppPath().split("/").filter(Boolean);
  return parts[0] === "invitation" ? decodeURIComponent(parts[1] || "") : "";
}

function acceptDemoTeamInvite(inviteId: string, name: string, email: string): boolean {
  const team = readDemoTeam();
  const invite = team.invites.find(item => item.id === inviteId);
  if (!invite || invite.expiresAt <= Date.now() || invite.email.toLowerCase() !== email.trim().toLowerCase()) return false;
  const normalizedEmail = email.trim().toLowerCase();
  if (team.members.some(member => member.email.toLowerCase() === normalizedEmail)) return false;
  const member: DemoTeamMember = {
    id: `recruiter-${invite.id}`,
    initials: name.trim().split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase(),
    name: name.trim(),
    email: normalizedEmail,
    role: "Recruiter",
  };
  return saveDemoTeam({ members: [...team.members, member], invites: team.invites.filter(item => item.id !== invite.id) });
}

function ViewAsSwitcher({ value, onChange }: { value: RoleView; onChange: (next: RoleView) => void }) {
  return <div className="view-as-switcher" aria-label="Review the mock-up in owner or recruiter mode">
    <button type="button" className={value === "owner" ? "active" : ""} onClick={() => onChange("owner")}>Owner</button>
    <button type="button" className={value === "recruiter" ? "active" : ""} onClick={() => onChange("recruiter")}>Recruiter</button>
  </div>;
}

const metrics = [
  { label: "Active campaigns", value: "8", meta: "+2 this month", icon: "briefcase" as IconName, tone: "blue" },
  { label: "Total applications", value: "284", meta: "+18% vs last month", icon: "file" as IconName, tone: "purple" },
  { label: "Candidates in progress", value: "46", meta: "12 need review", icon: "users" as IconName, tone: "amber" },
  { label: "Average time to review", value: "1.8d", meta: "0.4d faster", icon: "clock" as IconName, tone: "green" },
];

type ReviewCandidate = { id?: string; demoApplication?: DemoApplication; initials: string; name: string; email: string; role: string; time: string; score: string; status: string; tone: "success" | "info" | "warning" | "neutral"; color: string };

const applicants: ReviewCandidate[] = [
  { initials: "JM", name: "Jamie Morris", email: "jamie.morris@email.com", role: "Senior Product Designer", time: "12 min ago", score: "92", status: "Shortlisted", tone: "success", color: "blue" },
  { initials: "NK", name: "Noah Kim", email: "noah.kim@email.com", role: "Frontend Engineer", time: "48 min ago", score: "88", status: "In review", tone: "info", color: "purple" },
  { initials: "PS", name: "Priya Shah", email: "priya.shah@email.com", role: "Senior Product Designer", time: "2 hr ago", score: "84", status: "New", tone: "warning", color: "amber" },
  { initials: "DO", name: "Daniel Okoro", email: "daniel.okoro@email.com", role: "Customer Success Lead", time: "Yesterday", score: "79", status: "Interview", tone: "neutral", color: "green" },
];

function RecruiterDashboard() {
  return <div>
    <PageHeader eyebrow="Tuesday, 12 March" title="Good morning, Sophie" description="Here’s what’s happening across your recruitment workspace." action={<Button icon="plus" onClick={() => go("/recruiter/campaigns/new")}>Create campaign</Button>}/>
    <WorkspaceShowcase audience="recruiter"/>
    <div className="metrics-grid">{metrics.map(m => <div className="metric" key={m.label}><div className={`metric-icon metric-${m.tone}`}><Icon name={m.icon}/></div><div><span>{m.label}</span><strong>{m.value}</strong><small><Icon name={m.meta.includes("faster") || m.meta.includes("+") ? "arrow" : "clock"} size={12}/>{m.meta}</small></div></div>)}</div>
    <div className="dashboard-grid">
      <section className="surface pipeline-card">
        <div className="section-header"><div><h2>Recruitment pipeline</h2><p>All active campaigns</p></div><button className="text-btn" onClick={() => go("/recruiter/candidates")}>View candidates <Icon name="arrow" size={14}/></button></div>
        <div className="pipeline">
          {[["Applied", "284", 100], ["Qualified", "156", 55], ["Shortlisted", "72", 25], ["Interview", "31", 11], ["Offer", "8", 3]].map(([label, count, width], i) => <div className="pipeline-row" key={label as string}><span>{label}</span><div><i style={{ width: `${width}%` }} className={`pipe-${i}`}/></div><strong>{count}</strong></div>)}
        </div>
        <div className="pipeline-note"><Icon name="sparkles" size={17}/><p><strong>12 candidates need review</strong><span>AI evaluations are ready for your attention.</span></p><Button variant="secondary" onClick={() => go("/recruiter/candidates")}>Review now</Button></div>
      </section>
      <section className="surface campaigns-card">
        <div className="section-header"><div><h2>Active campaigns</h2><p>Performance at a glance</p></div><button className="icon-btn"><Icon name="dots"/></button></div>
        {[
          ["Senior Product Designer", "41 applications", "7 new", "blue", 72],
          ["Frontend Engineer", "86 applications", "12 new", "purple", 58],
          ["Customer Success Lead", "29 applications", "3 new", "green", 44],
        ].map(([title, total, fresh, tone, progress]) => <button className="campaign-row" key={title as string} onClick={() => go("/recruiter/candidates/campaign/1")}><span className={`job-icon job-${tone}`}><Icon name="briefcase"/></span><span className="campaign-info"><strong>{title}</strong><small>{total} <i/> <b>{fresh}</b></small><span className="mini-progress"><i style={{ width: `${progress}%` }}/></span></span><Icon name="chevron" size={16}/></button>)}
        <button className="view-all" onClick={() => go("/recruiter/campaigns")}>View all campaigns</button>
      </section>
    </div>
    <section className="surface recent-section">
      <div className="section-header"><div><h2>Recent applications</h2><p>Latest candidates across your campaigns</p></div><Button variant="secondary" onClick={() => go("/recruiter/candidates")}>View all applications</Button></div>
      <div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Applied for</th><th>AI match</th><th>Status</th><th>Applied</th><th/></tr></thead><tbody>{applicants.map(a => <tr key={a.name}><td><span className="person"><Avatar initials={a.initials} color={a.color}/><span><strong>{a.name}</strong><small>{a.name.toLowerCase().replace(" ", ".")}@email.com</small></span></span></td><td>{a.role}</td><td><span className="score"><i style={{ "--score": `${a.score}%` } as React.CSSProperties}/><strong>{a.score}%</strong></span></td><td><Badge tone={a.tone}>{a.status}</Badge></td><td className="muted">{a.time}</td><td><button className="icon-btn"><Icon name="dots"/></button></td></tr>)}</tbody></table></div>
    </section>
  </div>;
}

type CampaignListItem = {
  id: string;
  title: string;
  department: string;
  status: "Active" | "Paused" | "Draft" | "Archived" | "Deleted";
  applications: string;
  published: string;
  color: string;
  location: string;
  workArrangement: string;
};

const campaigns: CampaignListItem[] = [
  { id: "1", title: "Senior Product Designer", department: "Design", status: "Active", applications: "41", published: "12 Mar 2025", color: "blue", location: "Cape Town", workArrangement: "Hybrid" },
  { id: "2", title: "Frontend Engineer", department: "Engineering", status: "Active", applications: "86", published: "8 Mar 2025", color: "purple", location: "Cape Town", workArrangement: "Hybrid" },
  { id: "3", title: "Customer Success Lead", department: "Operations", status: "Active", applications: "29", published: "4 Mar 2025", color: "green", location: "Cape Town", workArrangement: "Hybrid" },
  { id: "4", title: "Growth Marketing Manager", department: "Marketing", status: "Draft", applications: "—", published: "Not published", color: "amber", location: "Cape Town", workArrangement: "Hybrid" },
  { id: "5", title: "Finance Operations Analyst", department: "Finance", status: "Archived", applications: "54", published: "10 Jan 2025", color: "gray", location: "Cape Town", workArrangement: "Hybrid" },
];

type CampaignRecruiter = { id: string; name: string; email: string; role: "Main recruiter" | "Additional recruiter" };
type CampaignApprover = { name: string; email: string };
type CampaignRequirement = { id: string; title: string; category: string; kind: "Must-have" | "Preferred"; weight: number };
type CampaignEvaluationMode = "default" | "custom";

type DemoCampaign = {
  id: string;
  title: string;
  department: string;
  location: string;
  workArrangement: string;
  summary: string;
  employmentType: string;
  experienceLevel: string;
  roleDescription: string;
  published: boolean;
  publishedAt: string | null;
  paused?: boolean;
  archived?: boolean;
  deleted?: boolean;
  closingDate?: string | null;
  statusChangeReason?: string;
  formBlocks?: FormBlock[];
  campaignTeam?: CampaignRecruiter[];
  approver?: CampaignApprover | null;
  requirements?: CampaignRequirement[];
  evaluationMode?: CampaignEvaluationMode;
  evaluationInstructions?: string;
};

type CampaignStatusAction = "pause" | "resume" | "close" | "publish" | "archive" | "closing-date";

const campaignStorageKey = "recruitflow.demoCampaign";
const createdCampaignsStorageKey = "recruitflow.demoCampaigns";
const defaultDemoCampaign: DemoCampaign = {
  id: "1",
  title: "Senior Product Designer",
  department: "Design",
  location: "Cape Town",
  workArrangement: "Hybrid",
  summary: "Help us shape clear, useful experiences for thousands of growing teams.",
  employmentType: "Full-time",
  experienceLevel: "Senior",
  roleDescription: "",
  published: false,
  publishedAt: null,
};

const defaultCampaignRequirements: CampaignRequirement[] = [
  { id: "requirement-license", title: "Valid driving licence", category: "Skill", kind: "Must-have", weight: 5 },
];

function getCampaignRequirements(campaign: DemoCampaign): CampaignRequirement[] {
  return campaign.requirements ?? (campaign.id === "1" ? defaultCampaignRequirements : []);
}

function isDemoCampaign(value: unknown): value is DemoCampaign {
  if (typeof value !== "object" || value === null) return false;
  const campaign = value as Partial<DemoCampaign>;
  return typeof campaign.id === "string" && typeof campaign.title === "string" &&
    typeof campaign.department === "string" && typeof campaign.location === "string" &&
    typeof campaign.workArrangement === "string" && typeof campaign.summary === "string" &&
    typeof campaign.employmentType === "string" && typeof campaign.experienceLevel === "string" &&
    typeof campaign.roleDescription === "string" && typeof campaign.published === "boolean" &&
    (campaign.publishedAt === null || typeof campaign.publishedAt === "string") &&
    (campaign.paused === undefined || typeof campaign.paused === "boolean") &&
    (campaign.archived === undefined || typeof campaign.archived === "boolean") &&
    (campaign.deleted === undefined || typeof campaign.deleted === "boolean") &&
    (campaign.closingDate === undefined || campaign.closingDate === null || typeof campaign.closingDate === "string") &&
    (campaign.statusChangeReason === undefined || typeof campaign.statusChangeReason === "string") &&
    (campaign.campaignTeam === undefined || Array.isArray(campaign.campaignTeam) && campaign.campaignTeam.every(member =>
      typeof member.id === "string" && typeof member.name === "string" && typeof member.email === "string" &&
      (member.role === "Main recruiter" || member.role === "Additional recruiter")
    )) &&
    (campaign.approver === undefined || campaign.approver === null || typeof campaign.approver.name === "string" && typeof campaign.approver.email === "string") &&
    (campaign.requirements === undefined || Array.isArray(campaign.requirements) && campaign.requirements.every(requirement =>
      typeof requirement.id === "string" && typeof requirement.title === "string" && typeof requirement.category === "string" &&
      (requirement.kind === "Must-have" || requirement.kind === "Preferred") && Number.isInteger(requirement.weight) && requirement.weight >= 1 && requirement.weight <= 5
    )) &&
    (campaign.evaluationMode === undefined || campaign.evaluationMode === "default" || campaign.evaluationMode === "custom") &&
    (campaign.evaluationInstructions === undefined || typeof campaign.evaluationInstructions === "string");
}

function getCampaignRoleDescription(campaign: DemoCampaign): string {
  return campaign.roleDescription.trim() ? campaign.roleDescription : campaign.summary;
}

function sanitizeRoleDescription(value: string): string {
  const parsed = new DOMParser().parseFromString(value, "text/html");
  const allowedTags = new Set(["b", "strong", "i", "em", "u", "p", "div", "br", "ul", "ol", "li"]);
  const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const serialize = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (tag === "script" || tag === "style" || tag === "iframe" || tag === "object") return "";
    const children = Array.from(element.childNodes).map(serialize).join("");
    if (!allowedTags.has(tag)) return children;
    if (tag === "br") return "<br>";
    const textAlign = element.style.textAlign || element.getAttribute("align") || "";
    const safeAlignment = textAlign === "center" || textAlign === "left" ? ` style="text-align:${textAlign}"` : "";
    return `<${tag}${safeAlignment}>${children}</${tag}>`;
  };
  return Array.from(parsed.body.childNodes).map(serialize).join("");
}

function CampaignRoleDescription({ campaign, className, placeholder }: { campaign: DemoCampaign; className: string; placeholder?: string }) {
  const description = getCampaignRoleDescription(campaign);
  if (!description.trim()) return placeholder ? <p className={className}>{placeholder}</p> : null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeRoleDescription(description) }}/>;
}

function loadCreatedCampaigns(): DemoCampaign[] {
  const saved = window.localStorage.getItem(createdCampaignsStorageKey);
  if (!saved) return [];
  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed) || !parsed.every(isDemoCampaign)) {
    throw new Error("Saved campaigns are not in the expected format.");
  }
  return parsed;
}

function readCreatedCampaigns(): DemoCampaign[] {
  try {
    return loadCreatedCampaigns();
  } catch (error) {
    console.error("Could not load created campaigns from browser storage.", error);
    return [];
  }
}

function saveCreatedCampaign(campaign: DemoCampaign): boolean {
  try {
    const saved = loadCreatedCampaigns();
    const updated = [...saved.filter(item => item.id !== campaign.id), campaign];
    window.localStorage.setItem(createdCampaignsStorageKey, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error("Could not save the created campaign to browser storage.", error);
    return false;
  }
}

function getCampaignDetails(campaignId: string): DemoCampaign | null {
  if (campaignId === "1") {
    try {
      if (window.localStorage.getItem(campaignStorageKey)) {
        const savedCampaign = readDemoCampaign();
        return { ...savedCampaign, requirements: savedCampaign.requirements ?? defaultCampaignRequirements };
      }
    } catch (error) {
      console.error("Could not check the saved demo campaign.", error);
      return readDemoCampaign();
    }
    const defaultCampaign = campaigns.find(campaign => campaign.id === campaignId);
    return { ...defaultDemoCampaign, requirements: defaultCampaignRequirements, published: defaultCampaign?.status === "Active" };
  }
  const saved = readCreatedCampaigns().find(campaign => campaign.id === campaignId);
  if (saved) return saved;
  const item = campaigns.find(campaign => campaign.id === campaignId);
  if (!item) return null;
  return {
    ...defaultDemoCampaign,
    id: item.id,
    title: item.title,
    department: item.department,
    location: item.location,
    workArrangement: item.workArrangement,
    published: item.status === "Active",
    archived: item.status === "Archived",
  };
}

function readDemoCampaign(): DemoCampaign {
  try {
    const saved = window.localStorage.getItem(campaignStorageKey);
    if (!saved) return defaultDemoCampaign;
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== "object" || parsed === null) throw new Error("Saved campaign data is invalid.");
    return { ...defaultDemoCampaign, ...(parsed as Partial<DemoCampaign>) };
  } catch (error) {
    console.error("Could not load the demo campaign from browser storage.", error);
    return defaultDemoCampaign;
  }
}

function saveDemoCampaign(campaign: DemoCampaign) {
  try {
    window.localStorage.setItem(campaignStorageKey, JSON.stringify(campaign));
    return true;
  } catch (error) {
    console.error("Could not save the demo campaign to browser storage.", error);
    return false;
  }
}

function Toolbar({ placeholder = "Search by name or email…" }: { placeholder?: string }) {
  return <div className="toolbar"><label className="search"><Icon name="search"/><input aria-label="Search" placeholder={placeholder}/><kbd>⌘ K</kbd></label><Button variant="secondary" icon="filter">Filters</Button><Button variant="secondary" icon="calendar">Date</Button></div>;
}

function CampaignsPage() {
  const [tab, setTab] = useState<"Active & Drafts" | "Archived" | "Deleted">("Active & Drafts");
  const [search, setSearch] = useState("");
  const [createdCampaigns] = useState(readCreatedCampaigns);
  const allCampaigns = [
    ...campaigns.filter(item => !createdCampaigns.some(saved => saved.id === item.id)).map(item => {
      if (item.id !== "1") return item;
      const savedCampaign = getCampaignDetails("1");
      return {
        ...item,
        status: savedCampaign?.deleted ? "Deleted" as const : savedCampaign?.archived ? "Archived" as const : savedCampaign?.paused ? "Paused" as const : savedCampaign?.published ? "Active" as const : "Draft" as const,
        published: savedCampaign?.publishedAt ? new Date(savedCampaign.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : savedCampaign?.published ? item.published : "Not published",
      };
    }),
    ...createdCampaigns.map(campaign => {
      const existingCampaign = campaigns.find(item => item.id === campaign.id);
      return {
        id: campaign.id,
        title: campaign.title || "Untitled campaign",
        department: campaign.department || existingCampaign?.department || "Unassigned",
        status: campaign.deleted ? "Deleted" as const : campaign.archived ? "Archived" as const : campaign.paused ? "Paused" as const : campaign.published ? "Active" as const : "Draft" as const,
        applications: existingCampaign?.applications || "—",
        published: campaign.publishedAt ? new Date(campaign.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : campaign.published ? existingCampaign?.published || "Not published" : "Not published",
        color: existingCampaign?.color || "blue",
        location: campaign.location || existingCampaign?.location || "Location not set",
        workArrangement: campaign.workArrangement || existingCampaign?.workArrangement || "Arrangement not set",
      };
    }),
  ];
  const visible = allCampaigns.filter(campaign => {
    const matchesTab = tab === "Active & Drafts" ? campaign.status === "Active" || campaign.status === "Paused" || campaign.status === "Draft" : campaign.status === tab;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [campaign.title, campaign.department, campaign.location].some(value => value.toLowerCase().includes(query));
    return matchesTab && matchesSearch;
  });
  const totalApplications = allCampaigns.reduce((sum, campaign) => sum + (Number(campaign.applications) || 0), 0);
  return <div className="campaigns-index">
    <PageHeader eyebrow="Recruiter" title="Campaigns" description="Review live roles, then use tabs for drafts, archives, and trash." action={<Button icon="plus" onClick={() => go("/recruiter/campaigns/new")}>Create new campaign</Button>}/>
    <label className="campaigns-index-search"><span>Search</span><span className="search"><Icon name="search"/><input aria-label="Search campaigns" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by title, department, or location"/></span></label>
    <section className="surface organisation-campaign-card">
      <header className="campaigns-index-card-heading"><div><h2>All campaigns</h2><p>A list of all campaigns in your organisation.</p></div></header>
      <div className="organisation-campaign-table-wrap"><table className="organisation-campaign-table"><thead><tr><th>Company</th><th>Campaign</th><th>Applied</th><th>Qualifying</th><th>Actions</th></tr></thead><tbody><tr>
        <td><span className="organisation-cell"><span className="organisation-mark">N</span><strong>Your organisation</strong></span></td>
        <td><span className="organisation-campaign-title"><strong>{allCampaigns.length} campaigns</strong><small>Northstar Labs · Hiring workspace</small></span></td>
        <td>{totalApplications}</td><td>{Math.round(totalApplications * .37)}</td>
        <td><Button variant="secondary" onClick={() => go("/recruiter/campaigns/1")}>Manage</Button></td>
      </tr></tbody></table></div>
    </section>
    <section className="surface campaigns-index-list-card">
      <header className="campaigns-index-card-heading"><div><h2>Campaigns</h2><p>Switch tabs to see active roles, archived pipelines, or deleted items.</p></div></header>
      <div className="campaigns-index-tabs" role="tablist" aria-label="Campaign status">
        {(["Active & Drafts", "Archived", "Deleted"] as const).map(item => <button type="button" role="tab" aria-selected={tab === item} key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
      </div>
      <p className="campaigns-index-list-description">{tab === "Active & Drafts" ? "Live, draft, and in-progress campaigns" : tab === "Archived" ? "Archived campaigns and their pipelines" : "Deleted campaigns in your organisation"}</p>
      {visible.length ? <div className="campaigns-index-rows">{visible.map(campaign => <button type="button" className="campaign-index-row" key={campaign.id} onClick={() => go(`/recruiter/campaigns/${campaign.id}`)}>
        <span className="campaign-index-row-main"><strong>{campaign.title}</strong><small>{campaign.status === "Draft" ? "Draft · Not published" : campaign.status === "Paused" ? "Paused · Not accepting applications" : `Updated ${campaign.published}`}</small></span>
        <span className="campaign-index-row-badges"><Badge tone={campaign.status === "Active" ? "info" : campaign.status === "Draft" || campaign.status === "Paused" ? "warning" : "neutral"}>{campaign.status}</Badge>{campaign.status === "Active" && <Badge tone="success">Published</Badge>}</span>
      </button>)}</div> : <div className="campaign-index-empty"><Icon name="briefcase" size={22}/><h3>{tab === "Deleted" ? "No deleted campaigns" : search ? "No matching campaigns" : "No campaigns in this tab"}</h3><p>{tab === "Deleted" ? "Deleted campaigns will appear here." : "Try another tab or search term."}</p></div>}
    </section>
  </div>;
}

function CandidatesPage({ campaign = false }: { campaign?: boolean }) {
  const [view, setView] = useState<RoleView>(() => getRouteRoleView("owner"));
  const [emptyState, setEmptyState] = useState(() => new URLSearchParams(window.location.search).get("state") === "empty");
  const { applications, error, updateApplicationStatus } = useDemoApplications();
  const [selectedCandidate, setSelectedCandidate] = useState<ReviewCandidate | null>(null);
  const demoCandidates: ReviewCandidate[] = applications.map(application => ({
    id: application.id,
    initials: "AM",
    name: "Alex Morgan",
    email: "alex@example.com",
    role: application.jobTitle,
    time: new Date(application.submittedAt).toLocaleString(),
    score: String(application.match),
    status: application.status,
    tone: application.status === "Interview" || application.status === "Shortlisted" ? "success" : application.status === "Closed" ? "neutral" : "info",
    color: "purple",
    demoApplication: application,
  }));
  const candidateRows = (view === "recruiter"
    ? [...applicants, ...demoCandidates].filter(candidate => ["Senior Product Designer", "Frontend Engineer"].includes(candidate.role))
    : [...applicants, ...applicants.slice(0, 2), ...demoCandidates]);
  const rows = emptyState && view === "recruiter" ? [] : candidateRows;
  const changeView = (next: RoleView) => {
    setView(next);
    setEmptyState(false);
    updateRouteQuery({ view: next, state: null });
  };
  const changeEmptyState = (empty: boolean) => {
    setEmptyState(empty);
    updateRouteQuery({ view, state: empty ? "empty" : null });
  };
  return <div><PageHeader eyebrow={campaign ? "Campaign / Senior Product Designer" : "Candidate inbox"} title={campaign ? "Senior Product Designer" : view === "owner" ? "All candidates" : "Candidates in your campaigns"} description={campaign ? "Review and move applicants through your hiring pipeline." : view === "owner" ? "Review candidates across all active recruitment campaigns." : "Review candidates from the campaigns you’re assigned to."} action={<div className="settings-actions">{!campaign && <ViewAsSwitcher value={view} onChange={changeView}/>}<Button variant="secondary" icon="external">{campaign ? "View campaign" : "Export"}</Button></div>}/>
    {!campaign && view === "recruiter" && <div className="demo-state-switch"><span>Preview recruiter state:</span><button type="button" className={emptyState ? "" : "active"} onClick={() => changeEmptyState(false)}>Has candidates</button><button type="button" className={emptyState ? "active" : ""} onClick={() => changeEmptyState(true)}>No campaigns</button></div>}
    {campaign && <div className="funnel-strip">{[["Applications", "41"], ["Qualified", "24"], ["Shortlisted", "9"], ["Interview", "4"]].map((x, i) => <div key={x[0]}><span className={`funnel-dot f-${i}`}/><span><small>{x[0]}</small><strong>{x[1]}</strong></span></div>)}</div>}
    {rows.length > 0 && <><div className="tabs"><button className="active">All <span>{rows.length}</span></button><button>New <span>{rows.filter(candidate => candidate.status === "New").length}</span></button><button>In review <span>{rows.filter(candidate => candidate.status === "In review").length}</span></button><button>Shortlisted <span>{rows.filter(candidate => candidate.status === "Shortlisted").length}</span></button></div>
    <Toolbar/></>}
    {error && <p className="demo-storage-error" role="alert">{error}</p>}
    {!rows.length ? <section className="surface d1-empty-state"><span className="empty-icon"><Icon name="users" size={23}/></span><h2>No candidates to review</h2><p>You are not on any campaigns yet. The owner or a campaign's main recruiter can add you.</p></section> : <section className="surface list-surface"><div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Campaign</th><th>AI evaluation</th><th>Status</th><th>Applied</th><th/></tr></thead><tbody>{rows.map((a, i) => <tr className="candidate-row" key={a.id || `${a.name}-${i}`} onClick={() => setSelectedCandidate(a)}><td><span className="person"><Avatar initials={a.initials} color={a.color}/><span><strong>{a.name}</strong><small>{a.email}</small></span></span></td><td>{a.role}</td><td><span className="score"><i style={{ "--score": `${a.score}%` } as React.CSSProperties}/><strong>{a.score}%</strong><small>AI-assisted</small></span></td><td><Badge tone={a.tone}>{a.status}</Badge></td><td className="muted">{a.time}</td><td><Button variant="ghost" onClick={event => { event.stopPropagation(); setSelectedCandidate(a); }}>Review <Icon name="arrow" size={14}/></Button></td></tr>)}</tbody></table></div></section>}
    {selectedCandidate && <CandidateReviewModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} onStatusChange={selectedCandidate.id ? status => {
      const applicationId = selectedCandidate.id;
      if (!applicationId || !updateApplicationStatus(applicationId, status)) return false;
      setSelectedCandidate(current => current ? { ...current, status, tone: status === "Interview" || status === "Shortlisted" ? "success" : status === "Closed" ? "neutral" : "info" } : current);
      return true;
    } : undefined}/>}
  </div>;
}

type ReviewTab = "Overview" | "Evaluation" | "Decision" | "Candidate's answers" | "Download Results";

function CandidateReviewModal({ candidate, onClose, onStatusChange }: { candidate: ReviewCandidate; onClose: () => void; onStatusChange?: (status: DemoApplication["status"]) => boolean }) {
  const [tab, setTab] = useState<ReviewTab>("Overview");
  const [feedback, setFeedback] = useState("");
  const [decision, setDecision] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const tabs: ReviewTab[] = ["Overview", "Evaluation", "Decision", "Candidate's answers", "Download Results"];
  const email = candidate.email;
  const downloadResults = () => {
    const content = `Candidate review\n${candidate.name}\n${candidate.role}\nScore: ${candidate.score}/100\nStatus: ${candidate.status}\nFeedback: ${feedback || "None"}\nDecision: ${decision || "Not decided"}`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${candidate.name.replace(" ", "-").toLowerCase()}-review.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  return <div className="review-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-review-title">
      <header className="review-modal-header"><div className="review-candidate"><Avatar initials={candidate.initials} color={candidate.color} size="lg"/><div><span className="eyebrow">Candidate review · {candidate.role}</span><h2 id="candidate-review-title">{candidate.name}</h2><p>{email} · Submitted {candidate.time}</p></div></div><div className="review-header-actions"><Badge tone={candidate.score === "84" ? "warning" : "info"}>{candidate.score === "84" ? "Below bar" : "Pending review"}</Badge><button className="icon-btn" onClick={onClose} aria-label="Close candidate review"><Icon name="close"/></button></div></header>
      <nav className="review-tabs" aria-label="Candidate review tabs">{tabs.map(item => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav>
      <div className="review-modal-body">
        {tab === "Overview" && <div className="review-overview"><div className="review-score-card"><span>Overall score</span><strong>{candidate.score}<small>/100</small></strong><div className="score-bar"><i style={{ width: `${candidate.score}%` }}/></div><p>AI-assisted evaluation</p></div><div className="review-summary-card"><h3>Candidate summary</h3><p>{candidate.name} shows relevant product design experience with a {candidate.score}% skills match for this role. Their strongest signals are user-centred thinking, collaboration, and delivery across the product lifecycle.</p><div className="summary-grid"><span><small>Experience</small><strong>{candidate.score === "84" ? "2–3 years" : "5+ years"}</strong></span><span><small>Skills match</small><strong>{candidate.score}%</strong></span><span><small>Role fit</small><strong>{candidate.score === "84" ? "Junior profile" : "Strong match"}</strong></span></div></div><div className="outcome-note"><Icon name="target"/><div><strong>Outcome rationale</strong><p>{candidate.score === "84" ? "The candidate may be below the seniority bar for this role. Consider a junior or mid-level opening." : "The candidate demonstrates a strong match for the role level and should progress to a human review."}</p></div></div></div>}
        {tab === "Evaluation" && <div className="review-tab-card"><h3>AI evaluation</h3><p>Use this recommendation as a starting point for human review, not as a final hiring decision.</p>{[["Relevant experience", candidate.score === "84" ? "72%" : "94%"], ["Skills alignment", `${candidate.score}%`], ["Application quality", "88%"]].map(item => <div className="evaluation-row" key={item[0]}><span><strong>{item[0]}</strong><small>AI-assisted signal</small></span><b>{item[1]}</b></div>)}<label className="field"><span className="field-label">Recruiter feedback</span><textarea value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="Add notes about strengths, gaps, or follow-up questions…"/></label></div>}
        {tab === "Decision" && <div className="review-tab-card"><h3>Record your decision</h3><p>Choose the next step and leave context for your hiring team.</p><label className="field"><span className="field-label">Hiring decision</span><select className="review-select" value={decision} onChange={event => { setDecision(event.target.value); setDecisionError(""); }}><option value="">Select a decision</option><option>Move to interview</option><option>Shortlist</option><option>Keep in review</option><option>Decline</option></select></label><label className="field"><span className="field-label">Decision notes</span><textarea value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="Explain the decision for your hiring team…"/></label>{decisionError && <p className="demo-storage-error" role="alert">{decisionError}</p>}<Button onClick={() => {
          if (onStatusChange) {
            const nextStatus: DemoApplication["status"] | undefined = decision === "Move to interview" ? "Interview" : decision === "Shortlist" ? "Shortlisted" : decision === "Keep in review" ? "In review" : decision === "Decline" ? "Closed" : undefined;
            if (!nextStatus) {
              setDecisionError("Choose a hiring decision before saving.");
              return;
            }
            if (!onStatusChange(nextStatus)) {
              setDecisionError("The updated status could not be saved. Please try again.");
              return;
            }
          }
          setTab("Overview");
        }}>{onStatusChange ? "Update application" : "Save decision"}</Button></div>}
        {tab === "Candidate's answers" && <div className="review-tab-card"><h3>Candidate's answers</h3>{candidate.demoApplication ? <><div className="answer-item"><strong>CV submitted</strong><p>{candidate.demoApplication.cvFileName} <span className="field-helper">(filename only; the file is not uploaded in demo mode)</span></p></div><div className="answer-item"><strong>Cover letter</strong><p>{candidate.demoApplication.coverLetter}</p></div></> : <><div className="answer-item"><strong>Why are you interested in this role?</strong><p>I’m excited by the opportunity to solve meaningful customer problems with a thoughtful product team.</p></div><div className="answer-item"><strong>What is your proudest project?</strong><p>Improving a complex workflow by combining user research, prototyping, and close collaboration with engineering.</p></div></>}</div>}
        {tab === "Download Results" && <div className="review-tab-card download-results"><span className="download-icon"><Icon name="file" size={24}/></span><h3>Download review results</h3><p>Export {candidate.name}'s score, summary, feedback, and decision as a text file for your records.</p><Button icon="file" onClick={downloadResults}>Download results</Button></div>}
      </div>
    </section>
  </div>;
}

function CampaignWorkspace({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState(() => getCampaignDetails(campaignId));
  const candidateState = useCampaignPipelineCandidates(campaignId);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [copyStatus, setCopyStatus] = useState("");
  const [actionError, setActionError] = useState("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<CampaignStatusAction>("pause");
  const [statusReason, setStatusReason] = useState("");
  const [statusClosingDate, setStatusClosingDate] = useState("");
  useEffect(() => setSelectedCandidateId(null), [campaignId]);
  const [statusError, setStatusError] = useState("");
  const tabs = ["Overview", "Pipeline", "Longlist", "Below requirements", "Shortlists", "References", "Offers", "Messages", "Export", "Rejected"];

  if (!campaign) {
    return <section className="surface campaign-missing"><h1>Campaign not found</h1><p>This campaign may have been removed or is no longer available.</p><Button onClick={() => go("/recruiter/campaigns")}>Back to campaigns</Button></section>;
  }

  const publicUrl = getPublicCampaignUrl(campaign.id);
  const cleanDescription = getCampaignRoleDescription(campaign)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const campaignListItem = campaigns.find(item => item.id === campaign.id);
  const applicationCount = Number(campaignListItem?.applications) || 0;
  const countCandidatesInStage = (stage: CandidateStage) => candidateState.candidates.filter(candidate => candidate.stage === stage).length;
  const campaignRequirements = getCampaignRequirements(campaign);
  const isClosingDatePassed = Boolean(campaign.closingDate && campaign.closingDate < new Date().toISOString().slice(0, 10));
  const isAcceptingApplications = campaign.published && !campaign.paused && !campaign.archived && !isClosingDatePassed;
  const statusDescription = campaign.deleted ? "deleted" : campaign.archived ? "archived" : campaign.paused ? "paused" : campaign.published ? "published" : "a draft";
  const statusChoices: { value: CampaignStatusAction; title: string; description: string }[] = campaign.archived || campaign.deleted
    ? [
      { value: "publish", title: "Reopen", description: "Make the campaign available to candidates again." },
      { value: "closing-date", title: "Change closing date", description: "The last day candidates can apply. Leave it blank for no end date." },
    ]
    : campaign.published
      ? [
        campaign.paused
          ? { value: "resume", title: "Resume", description: "Candidates can apply to this campaign again." }
          : { value: "pause", title: "Pause", description: "Candidates cannot apply while it is paused. You can reopen it later." },
        { value: "close", title: "Close", description: "Candidates can no longer apply. The campaign moves to Archived." },
        { value: "closing-date", title: "Change closing date", description: "The last day candidates can apply. Leave it blank for no end date." },
      ]
      : [
        { value: "publish", title: "Publish", description: "Make the campaign visible to candidates." },
        { value: "archive", title: "Archive", description: "Keep this draft out of the active campaigns list." },
        { value: "closing-date", title: "Change closing date", description: "The last day candidates can apply. Leave it blank for no end date." },
      ];
  const openStatusDialog = () => {
    setStatusAction(campaign.archived ? "publish" : campaign.published ? campaign.paused ? "resume" : "pause" : "publish");
    setStatusReason("");
    setStatusClosingDate(campaign.closingDate || "");
    setStatusError("");
    setStatusDialogOpen(true);
  };
  const saveStatusChange = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reason = statusReason.trim();
    if (!reason) {
      setStatusError("Enter a reason to continue.");
      return;
    }

    let next: DemoCampaign = { ...campaign, statusChangeReason: reason };
    if (statusAction === "pause") next = { ...next, paused: true };
    if (statusAction === "resume" || statusAction === "publish") {
      next = { ...next, published: true, paused: false, archived: false, publishedAt: campaign.publishedAt || new Date().toISOString() };
    }
    if (statusAction === "close" || statusAction === "archive") {
      next = { ...next, published: false, paused: false, archived: true };
    }
    if (statusAction === "closing-date") next = { ...next, closingDate: statusClosingDate || null };

    const saved = campaign.id === "1" ? saveDemoCampaign(next) : saveCreatedCampaign(next);
    if (!saved) {
      setStatusError("Campaign status could not be saved in this browser. Please try again.");
      return;
    }
    setCampaign(next);
    setActionError("");
    setStatusDialogOpen(false);
  };
  const copyPublicLink = async () => {
    if (!navigator.clipboard) {
      setCopyStatus("Clipboard access is unavailable. Select the link to copy it.");
      return;
    }
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyStatus("Link copied.");
    } catch (error) {
      console.error("Could not copy the public campaign link.", error);
      setCopyStatus("Could not copy the link. Select it to copy manually.");
    }
  };

  return <section className="surface campaign-workspace">
    <header className="campaign-workspace-header">
      <button className="text-btn" onClick={() => go("/recruiter/campaigns")}>Back to campaigns</button>
      <div className="campaign-manage-heading">
        <div className="campaign-manage-copy">
          <span className="eyebrow">Campaign overview</span>
          <h1>{campaign.title || "Untitled campaign"}</h1>
          <p>{cleanDescription || `${campaign.department || "Department not set"} · ${campaign.location || "Location not set"} · ${campaign.workArrangement || "Work arrangement not set"}`}</p>
        </div>
        <div className="campaign-manage-actions">
          <div className="campaign-manage-status"><Badge tone={isAcceptingApplications ? "success" : campaign.archived || campaign.deleted ? "neutral" : "warning"}>{campaign.deleted ? "Deleted" : campaign.archived ? "Archived" : campaign.paused ? "Paused" : campaign.published ? "Published" : "Draft"}</Badge><Badge tone={isAcceptingApplications ? "success" : "neutral"}>{isAcceptingApplications ? "Visible to candidates" : campaign.published || campaign.archived || campaign.deleted ? "Not accepting applications" : "Not visible to candidates"}</Badge></div>
          <div className="campaign-manage-buttons">
            <Button variant="secondary" onClick={openStatusDialog}>Change status</Button>
            <Button variant="secondary" onClick={() => go(`/recruiter/campaigns/${campaign.id}/edit`)}>Edit campaign &amp; form</Button>
            <Button variant="secondary" onClick={() => go(`/recruiter/campaigns/${campaign.id}/bulk-upload`)}>Bulk upload CVs</Button>
          </div>
        </div>
      </div>
      {actionError && <p className="demo-storage-error" role="alert">{actionError}</p>}
      {candidateState.error && <p className="demo-storage-error" role="alert">{candidateState.error}</p>}
      <div className="campaign-summary-metrics">
        <section className="campaign-public-link-card">
          <span className="eyebrow">Public apply link</span>
          <input aria-label="Public apply link" readOnly value={publicUrl}/>
          <Button onClick={copyPublicLink}>{copyStatus === "Link copied." ? "Copied" : "Copy link"}</Button>
          <Badge tone={isAcceptingApplications ? "success" : "warning"}>{isAcceptingApplications ? "Accepting applications" : "Not accepting applications"}</Badge>
          <small>Created {campaignListItem?.published || "recently"} · Closing date {campaign.closingDate || "not set"}.</small>
          {copyStatus && <span className="campaign-copy-status" role="status">{copyStatus}</span>}
        </section>
        {[["Applications", applicationCount, "count-blue"], ["Longlist", countCandidatesInStage("longlist"), "count-blue"], ["Proposed", countCandidatesInStage("shortlist-proposed"), "count-purple"], ["Approved", countCandidatesInStage("shortlist-approved"), "count-green"], ["Below requirements", countCandidatesInStage("below-requirements"), "count-red"]].map(([label, count, tone]) => <section className="campaign-count-card" key={label as string}>
          <span className="eyebrow">{label}</span><strong className={tone as string}>{count}</strong>
        </section>)}
      </div>
    </header>
    <nav className="campaign-workspace-tabs" aria-label="Campaign sections">
      {tabs.map(tab => <button key={tab} type="button" className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}
    </nav>
    <div className="campaign-workspace-content">
      <CampaignWorkspaceTabContent tab={activeTab} campaign={campaign} candidateState={candidateState} selectedCandidateId={selectedCandidateId} onSelectCandidate={setSelectedCandidateId} onCloseCandidatePanel={() => setSelectedCandidateId(null)} onOpenTab={setActiveTab}/>
      {statusDialogOpen && <div className="dialog-backdrop campaign-status-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setStatusDialogOpen(false); }}>
        <form className="application-dialog campaign-status-dialog" role="dialog" aria-modal="true" aria-labelledby="campaign-status-title" onSubmit={saveStatusChange}>
          <div className="campaign-status-body">
            <header className="campaign-status-heading"><h2 id="campaign-status-title">Campaign status</h2><p>This campaign is <strong>{statusDescription}</strong>.</p></header>
            <fieldset className="campaign-status-fieldset">
              <legend>What do you want to do?</legend>
              <div className="campaign-status-options">
                {statusChoices.map(choice => <label className={`campaign-status-option${statusAction === choice.value ? " selected" : ""}`} key={choice.value}>
                  <input type="radio" name="campaign-status-action" value={choice.value} checked={statusAction === choice.value} onChange={() => { setStatusAction(choice.value); setStatusError(""); }}/>
                  <span className="campaign-status-option-copy"><strong>{choice.title}</strong><small>{choice.description}</small></span>
                  {choice.value === "closing-date" && statusAction === "closing-date" && <span className="campaign-closing-date-input"><span>Closing date</span><input type="date" value={statusClosingDate} onChange={event => setStatusClosingDate(event.target.value)} aria-label="Closing date"/></span>}
                </label>)}
              </div>
            </fieldset>
            <label className="campaign-status-reason"><span>Reason (required)</span><textarea rows={3} value={statusReason} onChange={event => { setStatusReason(event.target.value); setStatusError(""); }} aria-required="true" aria-invalid={Boolean(statusError)} aria-describedby={statusError ? "campaign-status-error" : undefined}/></label>
            {statusError && <p className="campaign-status-error" id="campaign-status-error" role="alert">{statusError}</p>}
          </div>
          <footer className="campaign-status-footer">
            <Button variant="secondary" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button type="submit">{statusAction === "pause" ? "Pause campaign" : statusAction === "resume" ? "Resume campaign" : statusAction === "close" ? "Close campaign" : statusAction === "publish" ? "Publish campaign" : statusAction === "archive" ? "Archive campaign" : "Save closing date"}</Button>
          </footer>
        </form>
      </div>}
    </div>
  </section>;
}

function CampaignWorkspaceTabContent({ tab, campaign, candidateState, selectedCandidateId, onSelectCandidate, onCloseCandidatePanel, onOpenTab }: { tab: string; campaign: DemoCampaign; candidateState: CampaignPipelineCandidateController; selectedCandidateId: string | null; onSelectCandidate: (candidateId: string) => void; onCloseCandidatePanel: () => void; onOpenTab: (tab: string) => void }) {
  const campaignRequirements = getCampaignRequirements(campaign);
  const selectedCandidate = candidateState.candidates.find(candidate => candidate.id === selectedCandidateId) ?? null;
  return <div className="campaign-tab-screen">
    <span className="eyebrow">Campaign workspace</span>
    <h2>{tab}</h2>
    {tab === "Overview" && <div className="campaign-overview-grid">
      <section className="campaign-overview-card"><span className="eyebrow">Screening progress</span><p>No applications yet. Results will show here as candidates apply.</p></section>
      <section className="campaign-overview-card"><span className="eyebrow">Pending approvals</span><p>Nothing is waiting for approval.</p><button className="campaign-inline-link" onClick={() => onOpenTab("Offers")}>Go to approvals</button></section>
      <section className="campaign-overview-card">
        <span className="eyebrow">Requirements</span>
        {campaignRequirements.length ? campaignRequirements.map(requirement => <div className="campaign-requirement" key={requirement.id}><span>{requirement.title} <small>· {requirement.category}</small></span><Badge>{requirement.kind} · {requirement.weight}</Badge></div>) : <p>No requirements have been added to this campaign yet.</p>}
        <button className="campaign-inline-link" onClick={() => go(`/recruiter/campaigns/${campaign.id}/edit`)}>{campaignRequirements.length ? "Edit requirements" : "Add requirements"}</button>
      </section>
      <section className="campaign-overview-card"><span className="eyebrow">Recent activity</span><ul className="campaign-activity-list">{campaign.id === "1" ? <><li><span>Johnny Test campaign approver joined</span><small>Nov 3, 01:10 PM</small></li><li><span>Dave Sench campaign approver invited</span><small>Nov 3, 01:06 PM</small></li><li><span>Dave Sench campaign approver invite cancelled</span><small>Nov 3, 01:06 PM</small></li><li><span>Dave Sench campaign approver invited</span><small>Nov 3, 01:06 PM</small></li><li><span>Dave Sench updated the requirements (1 now)</span><small>Nov 3, 01:04 PM</small></li></> : <li><span>Campaign created</span><small>{campaign.publishedAt ? new Date(campaign.publishedAt).toLocaleString() : "Just now"}</small></li>}</ul></section>
    </div>}
    {tab === "Pipeline" && <CampaignPipelineScreen campaign={campaign} candidateState={candidateState} onSelectCandidate={onSelectCandidate}/>}
    {["Longlist", "Below requirements", "Rejected"].includes(tab) && <CampaignApplicationTable tab={tab as CampaignCandidateTableTab} campaign={campaign} candidateState={candidateState} onSelectCandidate={onSelectCandidate}/>}
    {tab === "Shortlists" && <CampaignShortlistsScreen/>}
    {tab === "Messages" && <CampaignMessagesScreen/>}
    {tab === "Export" && <CampaignExportScreen campaign={campaign} candidates={candidateState.candidates} candidateError={candidateState.error}/>}
    {!["Overview", "Pipeline", "Longlist", "Below requirements", "Rejected", "Shortlists", "Messages", "Export"].includes(tab) && <section className="campaign-tab-empty"><h3>{tab}</h3><p>There is no {tab.toLowerCase()} activity for this campaign yet. Updates will appear here as candidates move through the hiring process.</p></section>}
    {selectedCandidate && <CampaignCandidatePanel candidate={selectedCandidate} campaign={campaign} onClose={onCloseCandidatePanel} onOverride={candidateState.overrideBelowRequirements} onCorrect={candidateState.correctScreeningResult} onUndo={candidateState.undoScreeningCorrection}/>}
  </div>;
}

type CampaignCandidateTableTab = "Longlist" | "Below requirements" | "Rejected";
type CampaignPipelineCandidateState = { candidates: CampaignCandidate[]; error: string | null };
type CampaignPipelineCandidateController = CampaignPipelineCandidateState & {
  moveCandidate: (candidateId: string, stage: CandidateStage) => void;
  overrideBelowRequirements: (candidateId: string) => void;
  correctScreeningResult: (candidateId: string, requirement: CandidateScreeningRequirement, result: ScreeningCorrectionResult, note: string) => boolean;
  undoScreeningCorrection: (candidateId: string, requirement: string) => boolean;
};

function useCampaignPipelineCandidates(campaignId: string): CampaignPipelineCandidateController {
  const [state, setState] = useState<CampaignPipelineCandidateState>(() => loadCampaignCandidates(campaignId));
  useEffect(() => setState(loadCampaignCandidates(campaignId)), [campaignId]);
  const updateCandidate = (candidateId: string, update: (candidate: CampaignCandidate) => CampaignCandidate) => {
    const currentCandidate = state.candidates.find(candidate => candidate.id === candidateId);
    if (!currentCandidate) return false;
    const updatedCandidate = update(currentCandidate);
    if (updatedCandidate === currentCandidate) return false;
    const candidates = state.candidates.map(candidate => candidate.id === candidateId ? updatedCandidate : candidate);
    const error = saveCampaignCandidates(campaignId, candidates);
    setState({ candidates: error ? state.candidates : candidates, error });
    return error === null;
  };
  const moveToStage = (candidate: CampaignCandidate, stage: CandidateStage): CampaignCandidate => {
    if (candidate.stage === stage) return candidate;
    const stageHistory = [...new Set([...(candidate.stageHistory ?? [candidate.stage]), stage])];
    const shortlistDecision = stage === "shortlist-approved"
      ? "Approved"
      : stage === "shortlist-proposed"
        ? candidate.shortlistDecision ?? "Pending"
        : candidate.shortlistDecision;
    return { ...candidate, stage, stageHistory, shortlistDecision };
  };
  const moveCandidate = (candidateId: string, stage: CandidateStage) => updateCandidate(candidateId, candidate => {
    if (candidate.overriddenByRecruiter && stage === "below-requirements") return candidate;
    return moveToStage(candidate, stage);
  });
  const overrideBelowRequirements = (candidateId: string) => updateCandidate(candidateId, candidate => {
    if (candidate.stage !== "below-requirements" || candidate.overriddenByRecruiter) return candidate;
    return { ...moveToStage(candidate, "longlist"), overriddenByRecruiter: true };
  });
  const correctScreeningResult = (candidateId: string, requirement: CandidateScreeningRequirement, result: ScreeningCorrectionResult, note: string) => {
    const key = getScreeningRequirementKey(requirement.requirement);
    if (!note.trim()) return false;
    return updateCandidate(candidateId, candidate => {
      if (candidate.screeningCorrections?.[key]) return candidate;
      return {
        ...candidate,
        screeningCorrections: {
          ...candidate.screeningCorrections,
          [key]: {
            result,
            note: note.trim(),
            who: "Sophie Okafor",
            correctedAt: new Date().toISOString(),
            originalResult: requirement.result,
            originalReason: requirement.reason,
            originalSource: requirement.source,
          },
        },
      };
    });
  };
  const undoScreeningCorrection = (candidateId: string, requirement: string) => updateCandidate(candidateId, candidate => {
    const key = getScreeningRequirementKey(requirement);
    const corrections = { ...candidate.screeningCorrections };
    if (!corrections[key]) return candidate;
    delete corrections[key];
    return { ...candidate, screeningCorrections: Object.keys(corrections).length ? corrections : undefined };
  });
  return { ...state, moveCandidate, overrideBelowRequirements, correctScreeningResult, undoScreeningCorrection };
}

function getCampaignScreeningData(candidate: CampaignCandidate, campaign: DemoCampaign): CandidateScreeningData {
  const screening = getCandidateScreeningData(candidate);
  const campaignRequirements = getCampaignRequirements(campaign);
  const requirements = campaignRequirements.map((campaignRequirement, index) => {
    const result = screening.requirements.find(item => item.requirement.toLowerCase() === campaignRequirement.title.toLowerCase());
    if (result) return { ...result, mustHave: campaignRequirement.kind === "Must-have" };
    const demoResult = candidate.mustHaveResults.find(item => item.requirement.toLowerCase() === campaignRequirement.title.toLowerCase()) ?? candidate.mustHaveResults[index];
    return {
      requirement: campaignRequirement.title,
      result: demoResult?.met ? "Met" as const : "Not met" as const,
      reason: demoResult?.met ? "The application shows evidence for this requirement." : "The application does not provide evidence that meets this requirement.",
      source: "Set by a recruiter" as const,
      mustHave: campaignRequirement.kind === "Must-have",
    };
  });
  const supplementalRequirements = screening.requirements
    .filter(item => !campaignRequirements.some(requirement => requirement.title.toLowerCase() === item.requirement.toLowerCase()))
    .map(item => ({ ...item, mustHave: false }));
  const correctedRequirements = [...requirements, ...supplementalRequirements].map(requirement => {
    const correction = candidate.screeningCorrections?.[getScreeningRequirementKey(requirement.requirement)];
    return correction ? { ...requirement, result: correction.result, reason: correction.note, source: "Set by a recruiter" as const, correction } : requirement;
  });
  return { ...screening, requirements: correctedRequirements };
}

function getMustHaveSummary(candidate: CampaignCandidate, campaign: DemoCampaign) {
  const results = getCampaignScreeningData(candidate, campaign).requirements.filter(result => result.mustHave);
  const met = results.filter(result => result.result === "Met").length;
  const failed = results.find(result => result.result === "Not met")?.requirement;
  return { met, total: results.length, failed };
}

function CandidateStageMoveMenu({ candidate, onMove, onOverride }: { candidate: CampaignCandidate; onMove: (candidateId: string, stage: CandidateStage) => void; onOverride: (candidateId: string) => void }) {
  return <label className="campaign-stage-move">
    <span>Move to</span>
    <select aria-label={`Move ${candidate.name} to another stage`} value="" onChange={event => {
      if (!event.target.value) return;
      const stage = event.target.value as CandidateStage;
      if (candidate.stage === "below-requirements" && stage === "longlist") onOverride(candidate.id);
      else onMove(candidate.id, stage);
    }}>
      <option value="">Choose stage</option>
      {campaignPipelineStages.filter(stage => stage.id !== candidate.stage &&
        !(candidate.stage === "below-requirements" && stage.id === "longlist") &&
        !(candidate.overriddenByRecruiter && stage.id === "below-requirements")).map(stage => <option value={stage.id} key={stage.id}>{stage.title}</option>)}
    </select>
  </label>;
}

type CampaignCandidatePanelTab = "Overview" | "Evaluation" | "Decision" | "Download Results";

function CampaignCandidatePanel({ candidate, campaign, onClose, onOverride, onCorrect, onUndo }: { candidate: CampaignCandidate; campaign: DemoCampaign; onClose: () => void; onOverride: CampaignPipelineCandidateController["overrideBelowRequirements"]; onCorrect: CampaignPipelineCandidateController["correctScreeningResult"]; onUndo: CampaignPipelineCandidateController["undoScreeningCorrection"] }) {
  const [tab, setTab] = useState<CampaignCandidatePanelTab>("Overview");
  const screening = getCampaignScreeningData(candidate, campaign);
  const stageTitle = campaignPipelineStages.find(stage => stage.id === candidate.stage)?.title ?? candidate.stage;
  const mustHaves = screening.requirements.filter(requirement => requirement.mustHave);
  const mustHavesMet = mustHaves.filter(requirement => requirement.result === "Met").length;
  const needsVerification = screening.requirements.some(requirement => requirement.result === "Needs verification");
  const statusText = screening.status === "in-progress" ? "Screening…" : screening.status === "failed" ? "Screening failed" : needsVerification ? "Needs verification" : "Screening complete";
  const statusTone = screening.status === "complete" && needsVerification ? "needs-verification" : screening.status;
  const tabNames: CampaignCandidatePanelTab[] = ["Overview", "Evaluation", "Decision", "Download Results"];
  const downloadResults = () => {
    const lines = [
      `Candidate: ${candidate.name}`,
      `Campaign: ${campaign.title}`,
      `Requirements score: ${candidate.requirementsScore}%`,
      `AI fit: ${candidate.aiFitScore}%`,
      `Stage: ${stageTitle}`,
      `Screening status: ${statusText}`,
      "",
      ...screening.requirements.flatMap(requirement => [
        `${requirement.requirement} — ${requirement.result}${requirement.mustHave ? " (Must-have)" : " (Preferred)"}`,
        `Reason: ${requirement.reason}`,
        `Source: ${requirement.source}`,
        "",
      ]),
      screening.error ? `Screening note: ${screening.error}` : "",
    ].filter(Boolean);
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${candidate.id}-screening-results.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);
  return createPortal(<div className="campaign-candidate-panel-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="campaign-candidate-panel" role="dialog" aria-modal="true" aria-labelledby="campaign-candidate-panel-title">
      <header className="campaign-candidate-panel-header">
        <div><h2 id="campaign-candidate-panel-title">{candidate.name}</h2><p>{campaign.title}</p><small>{candidate.email}</small></div>
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Close candidate panel"><Icon name="close"/></button>
      </header>
      <section className="campaign-candidate-panel-profile">
        <span className="eyebrow">Candidate profile</span>
        <div className="campaign-candidate-panel-badges">
          <span className="campaign-panel-score">Requirements score {candidate.requirementsScore}%</span>
          <span className="campaign-panel-score">AI fit {candidate.aiFitScore}%</span>
          <span className={`campaign-panel-screening-state ${statusTone}`}>{statusText}</span>
          {candidate.stage === "below-requirements" && !candidate.overriddenByRecruiter && <span className="campaign-override-badge screening-origin">Moved by screening</span>}
          {candidate.overriddenByRecruiter && <span className="campaign-override-badge">Overridden by recruiter</span>}
        </div>
        {candidate.stage === "below-requirements" && !candidate.overriddenByRecruiter && <Button variant="secondary" className="campaign-panel-override-action" onClick={() => onOverride(candidate.id)}>Move to Longlist</Button>}
        <div className="campaign-panel-must-have-summary"><strong>Must-have criteria</strong><span>{mustHavesMet}/{mustHaves.length} met</span></div>
      </section>
      <nav className="campaign-candidate-panel-tabs" role="tablist" aria-label="Candidate screening tabs">
        {tabNames.map(item => <button key={item} type="button" role="tab" id={`campaign-candidate-tab-${item.toLowerCase().replace(/\s+/g, "-")}`} aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
      </nav>
      <div className="campaign-candidate-panel-body" role="tabpanel" aria-labelledby={`campaign-candidate-tab-${tab.toLowerCase().replace(/\s+/g, "-")}`}>
        {tab === "Overview" && <div className="campaign-candidate-panel-section">
          <CampaignScreeningStatusBanner screening={screening}/>
          <div className="campaign-panel-score-card"><span>Requirements score</span><strong>{candidate.requirementsScore}%</strong><div><i style={{ width: `${candidate.requirementsScore}%` }}/></div><small>Based on the screening requirements below.</small></div>
          <CampaignScreeningRequirements candidateId={candidate.id} requirements={screening.requirements} onCorrect={onCorrect} onUndo={onUndo}/>
        </div>}
        {tab === "Evaluation" && <div className="campaign-candidate-panel-section">
          <CampaignScreeningStatusBanner screening={screening}/>
          <div className="campaign-panel-evaluation-scores"><div><span>Requirements score</span><strong>{candidate.requirementsScore}%</strong></div><div><span>AI fit</span><strong>{candidate.aiFitScore}%</strong></div><div><span>Must-haves met</span><strong>{mustHavesMet}/{mustHaves.length}</strong></div></div>
          <CampaignScreeningRequirements candidateId={candidate.id} requirements={screening.requirements} onCorrect={onCorrect} onUndo={onUndo}/>
        </div>}
        {tab === "Decision" && <section className="campaign-candidate-panel-card">
          <h3>Current candidate stage</h3>
          <p>The pipeline stage is shown with the screening evidence so recruiters can understand the candidate’s current position.</p>
          <div className="campaign-panel-decision-stage"><span>Stage</span><strong>{stageTitle}</strong></div>
          <div className="campaign-panel-decision-stage"><span>Screening</span><strong>{statusText}</strong></div>
          <div className="campaign-panel-decision-stage"><span>Must-haves met</span><strong>{mustHavesMet} of {mustHaves.length}</strong></div>
          <small>Candidate stage changes are mock interactions and are not submitted to a hiring backend.</small>
        </section>}
        {tab === "Download Results" && <section className="campaign-candidate-panel-card campaign-panel-download">
          <span className="campaign-panel-download-icon"><Icon name="file" size={23}/></span>
          <h3>Download screening results</h3>
          <p>Save {candidate.name}’s screening score, requirement results, reasons and sources as a text report.</p>
          {screening.error && <p className="campaign-screening-error">{screening.error}</p>}
          <Button icon="file" onClick={downloadResults}>Download results</Button>
        </section>}
      </div>
      <footer className="campaign-candidate-panel-footer"><Button variant="secondary" onClick={onClose}>Close</Button></footer>
    </aside>
  </div>, document.body);
}

function CampaignScreeningStatusBanner({ screening }: { screening: CandidateScreeningData }) {
  const title = screening.status === "in-progress" ? "Screening…" : screening.status === "failed" ? "Screening failed" : "Screening complete";
  const description = screening.status === "in-progress"
    ? "Screening is still running. These results may change when all checks finish."
    : screening.status === "failed"
      ? screening.error ?? "Screening could not be completed. Review the partial results with care."
      : "Review the evidence, reason and source for each requirement.";
  return <div className={`campaign-screening-status-banner ${screening.status}`} role="status"><strong>{title}</strong><p>{description}</p></div>;
}

function CampaignScreeningRequirements({ candidateId, requirements, onCorrect, onUndo }: { candidateId: string; requirements: CandidateScreeningRequirement[]; onCorrect: CampaignPipelineCandidateController["correctScreeningResult"]; onUndo: CampaignPipelineCandidateController["undoScreeningCorrection"] }) {
  const [draft, setDraft] = useState<{ requirement: string; result: ScreeningCorrectionResult; note: string } | null>(null);
  const [correctionError, setCorrectionError] = useState("");
  const startCorrection = (requirement: string, result: ScreeningCorrectionResult) => {
    setDraft({ requirement, result, note: "" });
    setCorrectionError("");
  };
  const submitCorrection = (event: React.FormEvent<HTMLFormElement>, requirement: CandidateScreeningRequirement) => {
    event.preventDefault();
    if (!draft?.note.trim()) {
      setCorrectionError("A note is required to save this correction.");
      return;
    }
    if (!onCorrect(candidateId, requirement, draft.result, draft.note)) {
      setCorrectionError("The correction could not be saved. Please try again.");
      return;
    }
    setDraft(null);
    setCorrectionError("");
  };
  const undoCorrection = (requirement: string) => {
    if (!onUndo(candidateId, requirement)) {
      setCorrectionError("The correction could not be undone. Please try again.");
      return;
    }
    setCorrectionError("");
  };
  return <section className="campaign-screening-requirements">
    <h3>Requirement results</h3>
    {requirements.map((requirement, index) => <article className="campaign-screening-requirement" key={`${requirement.requirement}-${index}`}>
      <header><h4>{requirement.requirement}</h4><div>
        <span className={`campaign-screening-result ${requirement.result.toLowerCase().replace(/\s+/g, "-")}`}>{requirement.result}</span>
        <span className={`campaign-screening-requirement-kind ${requirement.mustHave ? "must-have" : "preferred"}`}>{requirement.mustHave ? "Must-have" : "Preferred"}</span>
      </div></header>
      <p>{requirement.reason}</p>
      <small><span>Where it came from</span>{requirement.source}</small>
      {requirement.correction ? <div className="campaign-screening-correction">
        <div className="campaign-screening-correction-note"><strong>Correction note</strong><p>{requirement.correction.note}</p><small>{requirement.correction.who} · {new Date(requirement.correction.correctedAt).toLocaleString()}</small></div>
        <div className="campaign-screening-original"><strong>Original screening answer</strong><span className={`campaign-screening-result ${requirement.correction.originalResult.toLowerCase().replace(/\s+/g, "-")}`}>{requirement.correction.originalResult}</span><p>{requirement.correction.originalReason}</p><small>Source: {requirement.correction.originalSource}</small></div>
        <button type="button" className="campaign-screening-undo" onClick={() => undoCorrection(requirement.requirement)}>Undo correction</button>
      </div> : <div className="campaign-screening-correction-actions">
        <button type="button" disabled={requirement.result === "Met"} onClick={() => startCorrection(requirement.requirement, "Met")}>Mark as met</button>
        <button type="button" disabled={requirement.result === "Not met"} onClick={() => startCorrection(requirement.requirement, "Not met")}>Mark as not met</button>
      </div>}
      {draft?.requirement === requirement.requirement && <form className="campaign-screening-correction-form" onSubmit={event => submitCorrection(event, requirement)}>
        <strong>Correct this result to “{draft.result}”</strong>
        <label>Recruiter note<textarea required value={draft.note} onChange={event => { setDraft(current => current ? { ...current, note: event.target.value } : current); setCorrectionError(""); }} placeholder="Explain why the screening result should change."/></label>
        <small>A note is required before this correction can be saved.</small>
        {correctionError && <p role="alert">{correctionError}</p>}
        <div><button type="button" onClick={() => { setDraft(null); setCorrectionError(""); }}>Cancel</button><button type="submit" disabled={!draft.note.trim()}>Save correction</button></div>
      </form>}
    </article>)}
    {correctionError && !draft && <p className="campaign-screening-correction-error" role="alert">{correctionError}</p>}
  </section>;
}

function CampaignPipelineScreen({ campaign, candidateState, onSelectCandidate }: { campaign: DemoCampaign; candidateState: CampaignPipelineCandidateController; onSelectCandidate: (candidateId: string) => void }) {
  const { candidates, moveCandidate, overrideBelowRequirements } = candidateState;
  return <section className="campaign-pipeline-screen">
    <p className="campaign-screen-description">Review candidates across the campaign stages. Use each candidate’s move menu to update their stage.</p>
    <div className="campaign-pipeline-scroll" aria-label="Candidate pipeline">
      <div className="campaign-pipeline-grid">{campaignPipelineStages.map(stage => {
        const stageCandidates = candidates.filter(candidate => candidate.stage === stage.id);
        return <section className="campaign-pipeline-stage" key={stage.id}>
          <header><div><h3>{stage.title}</h3><p>{stage.description}</p></div><span className="campaign-stage-count">{stageCandidates.length}</span></header>
          {stageCandidates.length ? <div className="campaign-pipeline-candidates">{stageCandidates.map(candidate => {
            const mustHaves = getMustHaveSummary(candidate, campaign);
            return <article className="campaign-pipeline-candidate" key={candidate.id}>
              <div className="campaign-pipeline-candidate-top"><span className="campaign-candidate-avatar">{candidate.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span><span className="campaign-candidate-score">Requirements {candidate.requirementsScore}%</span></div>
              <button type="button" className="campaign-candidate-profile-button" onClick={() => onSelectCandidate(candidate.id)}><strong>{candidate.name}</strong><small>{candidate.email}</small></button>
              {candidate.stage === "below-requirements" && !candidate.overriddenByRecruiter && <span className="campaign-override-badge screening-origin">Moved by screening</span>}
              {candidate.overriddenByRecruiter && <span className="campaign-override-badge">Overridden by recruiter</span>}
              <div className="campaign-candidate-must-haves"><strong>{mustHaves.met} of {mustHaves.total} must-haves</strong><span>met</span></div>
              {mustHaves.failed && <p className="campaign-candidate-failed"><strong>Failed must-have:</strong> {mustHaves.failed}</p>}
              <p className="campaign-candidate-ai-fit">AI fit <strong>{candidate.aiFitScore}%</strong></p>
              {candidate.stage === "below-requirements" && !candidate.overriddenByRecruiter && <Button variant="secondary" className="campaign-override-action" onClick={() => overrideBelowRequirements(candidate.id)}>Move to Longlist</Button>}
              <CandidateStageMoveMenu candidate={candidate} onMove={moveCandidate} onOverride={overrideBelowRequirements}/>
            </article>;
          })}</div> : <div className="campaign-pipeline-empty">No candidates in this stage.</div>}
        </section>;
      })}</div>
    </div>
  </section>;
}

const campaignCandidateTableColumns = ["Name", "Applied", "Score", "Must-haves", "AI fit", "Status"];

function CampaignApplicationTable({ tab, campaign, candidateState, onSelectCandidate }: { tab: CampaignCandidateTableTab; campaign: DemoCampaign; candidateState: CampaignPipelineCandidateController; onSelectCandidate: (candidateId: string) => void }) {
  const { candidates, moveCandidate, overrideBelowRequirements } = candidateState;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [qualification, setQualification] = useState("All candidates");
  const [minimumScore, setMinimumScore] = useState("0");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(campaignCandidateTableColumns);
  const stageId: CandidateStage = tab === "Longlist" ? "longlist" : tab === "Below requirements" ? "below-requirements" : "rejected";
  const stageCandidates = candidates.filter(candidate => candidate.stage === stageId);
  const filteredCandidates = stageCandidates.filter(candidate => {
    const mustHaves = getMustHaveSummary(candidate, campaign);
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || candidate.name.toLowerCase().includes(query) || candidate.email.toLowerCase().includes(query);
    const matchesQualification = qualification === "All candidates" ||
      (qualification === "Meets all must-haves" ? mustHaves.met === mustHaves.total : mustHaves.met < mustHaves.total);
    return matchesSearch && matchesQualification && candidate.requirementsScore >= Number(minimumScore);
  });
  const pageCount = Math.max(1, Math.ceil(filteredCandidates.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageCandidates = filteredCandidates.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const isFiltered = Boolean(search.trim()) || qualification !== "All candidates" || minimumScore !== "0";
  const average = (values: number[]) => values.length ? `${Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)}%` : "—";
  useEffect(() => setPage(1), [tab, search, qualification, minimumScore, pageSize]);
  useEffect(() => setPage(current => Math.min(current, pageCount)), [pageCount]);
  const getCellValue = (column: string, candidate: CampaignCandidate) => {
    const mustHaves = getMustHaveSummary(candidate, campaign);
    switch (column) {
      case "Name": return <button type="button" className="campaign-table-profile-trigger" onClick={() => onSelectCandidate(candidate.id)}><strong>{candidate.name}</strong><small>{candidate.email}</small></button>;
      case "Applied": return new Date(candidate.appliedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      case "Score": return `${candidate.requirementsScore}%`;
      case "Must-haves": return `${mustHaves.met} of ${mustHaves.total}`;
      case "AI fit": return `${candidate.aiFitScore}%`;
      case "Status": return <div className="campaign-table-stage-status"><span>{campaignPipelineStages.find(stage => stage.id === candidate.stage)?.title ?? candidate.stage}</span>{candidate.stage === "below-requirements" && !candidate.overriddenByRecruiter && <small className="campaign-override-badge screening-origin">Moved by screening</small>}{candidate.overriddenByRecruiter && <small className="campaign-override-badge">Overridden by recruiter</small>}</div>;
      default: return null;
    }
  };
  return <section className={`campaign-applications-card campaign-applications-${tab.toLowerCase().replace(/\s+/g, "-")}`}>
    <header className="campaign-applications-header">
      <div><h3>{tab === "Rejected" ? "Rejected candidates" : `${tab} candidates`}</h3><p>{tab === "Longlist" ? "Candidates currently in the longlist, including their requirements and AI fit scores." : tab === "Below requirements" ? "Candidates who do not meet one or more campaign must-have requirements." : "Candidates whose application was rejected."}</p><small>{filteredCandidates.length} shown · {stageCandidates.length} total in this stage</small></div>
      <div className="campaign-table-tools">
        <Button variant="secondary" icon="filter" onClick={() => { setFiltersOpen(value => !value); setColumnsOpen(false); }}>Filters</Button>
        <Button variant="secondary" icon="file" onClick={() => { setColumnsOpen(value => !value); setFiltersOpen(false); }}>Columns</Button>
      </div>
    </header>
    {filtersOpen && <div className="campaign-table-popover">
      <label>Search candidates<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Name or email"/></label>
      <label>Must-haves<select value={qualification} onChange={event => setQualification(event.target.value)}><option>All candidates</option><option>Meets all must-haves</option><option>Has unmet must-have</option></select></label>
      <label>Minimum score<select value={minimumScore} onChange={event => setMinimumScore(event.target.value)}><option value="0">Any score</option><option value="70">70% or higher</option><option value="85">85% or higher</option></select></label>
      <Button variant="ghost" onClick={() => { setSearch(""); setQualification("All candidates"); setMinimumScore("0"); }}>Clear filters</Button>
    </div>}
    {columnsOpen && <div className="campaign-table-popover campaign-column-options"><strong>Visible columns</strong>{campaignCandidateTableColumns.map(column => <label key={column}><input type="checkbox" checked={visibleColumns.includes(column)} onChange={() => setVisibleColumns(current => current.includes(column) ? current.filter(item => item !== column) : [...current, column])}/>{column}</label>)}</div>}
    <div className="campaign-candidate-totals">
      <span><strong>{stageCandidates.length}</strong> total candidates</span>
      <span><strong>{average(stageCandidates.map(candidate => candidate.requirementsScore))}</strong> average requirements score</span>
      <span><strong>{average(stageCandidates.map(candidate => candidate.aiFitScore))}</strong> average AI fit</span>
    </div>
    <div className="campaign-candidate-table-wrap"><table className="campaign-candidate-table">
      <thead><tr>{campaignCandidateTableColumns.filter(column => visibleColumns.includes(column)).map(column => <th key={column}>{column}</th>)}<th>Actions</th></tr></thead>
      <tbody>{pageCandidates.length ? pageCandidates.map(candidate => <tr key={candidate.id}>
        {campaignCandidateTableColumns.filter(column => visibleColumns.includes(column)).map(column => <td key={column}>{getCellValue(column, candidate)}</td>)}
        <td><div className="campaign-table-stage-actions">{candidate.stage === "below-requirements" && !candidate.overriddenByRecruiter && <Button variant="secondary" className="campaign-override-action" onClick={() => overrideBelowRequirements(candidate.id)}>Move to Longlist</Button>}<CandidateStageMoveMenu candidate={candidate} onMove={moveCandidate} onOverride={overrideBelowRequirements}/></div></td>
      </tr>) : <tr><td colSpan={Math.max(1, visibleColumns.length + 1)}><div className="campaign-candidate-empty"><strong>{isFiltered ? "No candidates match these filters" : `No candidates in ${tab.toLowerCase()}`}</strong><p>{isFiltered ? "Try changing or clearing the filters to see more candidates." : "Candidates moved into this stage will appear here. This empty state will update automatically when candidates are added."}</p></div></td></tr>}</tbody>
    </table></div>
    <footer className="campaign-table-pagination">
      <span>{filteredCandidates.length ? `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filteredCandidates.length)} of ${filteredCandidates.length}` : "Showing 0 candidates"}</span>
      <label>Rows per page<select value={pageSize} onChange={event => setPageSize(Number(event.target.value))}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select></label>
      <div><Button variant="secondary" disabled={currentPage <= 1} onClick={() => setPage(current => Math.max(1, current - 1))}>Previous</Button><span>Page {currentPage} of {pageCount}</span><Button variant="secondary" disabled={currentPage >= pageCount} onClick={() => setPage(current => Math.min(pageCount, current + 1))}>Next</Button></div>
    </footer>
  </section>;
}

function CampaignShortlistsScreen() {
  const [view, setView] = useState<"side-by-side" | "overlap">("side-by-side");
  const [showTop, setShowTop] = useState("5");
  const [proposalStatus, setProposalStatus] = useState("All statuses");
  return <section className="campaign-shortlists-screen">
    <div className="campaign-shortlist-toolbar">
      <div className="campaign-shortlist-view" role="group" aria-label="Shortlist comparison view">
        <button type="button" className={view === "side-by-side" ? "active" : ""} onClick={() => setView("side-by-side")}>Side by side</button>
        <button type="button" className={view === "overlap" ? "active" : ""} onClick={() => setView("overlap")}>Overlap</button>
      </div>
      <label>Show top<select value={showTop} onChange={event => setShowTop(event.target.value)}><option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label>
    </div>
    <div className={`campaign-shortlist-columns ${view === "overlap" ? "overlap" : ""}`}>
      <section className="campaign-shortlist-list"><header><h3>Requirements shortlist</h3><span>Your criteria</span></header><p>Weighted by the must haves you set. Preferred criteria break ties.</p><div className="campaign-shortlist-empty">No candidates match your campaign requirements yet.</div></section>
      <section className="campaign-shortlist-list"><header><h3>AI shortlist</h3><span>Fit score</span></header><p>Ranked by the same fit score shown on every application.</p><div className="campaign-shortlist-empty">No candidates are available to rank yet.</div></section>
    </div>
    {view === "overlap" && <p className="campaign-shortlist-overlap-note">Overlap shows candidates who appear in both the requirements and AI shortlists.</p>}
    <div className="campaign-propose-row"><p>Pick from either list. They become one proposed shortlist, which still goes to a line manager for a decision.</p><Button disabled>Propose 0 selected</Button></div>
    <div className="campaign-proposals-header"><h3>Proposals</h3><select aria-label="Proposal status" value={proposalStatus} onChange={event => setProposalStatus(event.target.value)}><option>All statuses</option><option>Pending</option><option>Approved</option><option>Returned</option><option>Withdrawn</option></select></div>
    <div className="campaign-proposals-empty">No information found</div>
  </section>;
}

type CampaignMessageTemplate = { stage: string; subject: string; body: string; autoSend: boolean };

function CampaignMessagesScreen() {
  const [templates, setTemplates] = useState<CampaignMessageTemplate[]>([
    { stage: "Application received", subject: "We received your application", body: "Thanks for applying. Our team will review your application and share an update soon.", autoSend: true },
    { stage: "Shortlisted", subject: "You have been shortlisted", body: "We are pleased to let you know that your application has progressed to the next stage.", autoSend: false },
    { stage: "Reference checks", subject: "Reference checks", body: "We would like to begin reference checks as the next step in your application.", autoSend: false },
    { stage: "Job offer", subject: "An offer from Northstar Labs", body: "We are pleased to share an offer for this role. Our team will follow up with the details.", autoSend: false },
    { stage: "Application outcome", subject: "An update on your application", body: "Thank you for taking the time to apply. We will share an update about your application here.", autoSend: false },
  ]);
  const [activeTemplate, setActiveTemplate] = useState<number | null>(null);
  const [showQueue, setShowQueue] = useState("All");
  const [messageStatus, setMessageStatus] = useState("");
  const template = activeTemplate === null ? null : templates[activeTemplate];
  const updateTemplate = (changes: Partial<CampaignMessageTemplate>) => {
    if (activeTemplate === null) return;
    setTemplates(current => current.map((item, index) => index === activeTemplate ? { ...item, ...changes } : item));
  };
  return <section className="campaign-messages-screen">
    <header className="campaign-screen-intro"><h3>Candidate messages</h3><p>Prepare messages for each recruitment stage, manage outgoing emails and review delivery history.</p></header>
    <div className="campaign-message-metrics">{[["Queued", "0"], ["Sent", "0"], ["Failed", "0"]].map(([label, count]) => <section key={label}><span>{label}</span><strong>{count}</strong></section>)}</div>
    <section className="campaign-message-card">
      <header><div><h3>Templates by stage</h3><p>Preview stage messages, compose personalized emails and choose when each stage sends automatically.</p></div></header>
      <div className="campaign-template-list">{templates.map((item, index) => <div className="campaign-template-row" key={item.stage}>
        <div><strong>{item.stage}</strong><small>0 awaiting review</small></div>
        <Button variant="secondary" onClick={() => { setActiveTemplate(index); setMessageStatus(""); }}>Preview &amp; compose</Button>
        <label><input type="checkbox" checked={item.autoSend} onChange={event => setTemplates(current => current.map((message, itemIndex) => itemIndex === index ? { ...message, autoSend: event.target.checked } : message))}/> Auto-send</label>
      </div>)}</div>
    </section>
    <section className="campaign-message-card campaign-message-queue">
      <header><div><h3>Message queue and history</h3><p>Review queued messages, send selected emails, retry failures and view messages that have already been sent.</p></div></header>
      <div className="campaign-queue-controls"><label>Show<select value={showQueue} onChange={event => setShowQueue(event.target.value)}><option>All</option><option>Queued</option><option>Sent</option><option>Failed</option></select></label><Button variant="secondary" disabled>Select all queued</Button><Button variant="secondary" disabled>Send selected (0)</Button></div>
      <div className="campaign-queue-empty"><strong>No messages yet</strong><p>Candidate messages will appear here as applications progress through the recruitment stages.</p></div>
    </section>
    {template && <div className="campaign-message-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setActiveTemplate(null); }}>
      <form className="campaign-message-dialog" role="dialog" aria-modal="true" aria-labelledby="campaign-message-dialog-title" onSubmit={event => { event.preventDefault(); setMessageStatus("Template saved in this mock. No email was sent."); }}>
        <header><div><span className="eyebrow">{template.stage}</span><h3 id="campaign-message-dialog-title">Preview &amp; compose</h3></div><button type="button" className="icon-btn" onClick={() => setActiveTemplate(null)} aria-label="Close message editor"><Icon name="close"/></button></header>
        <label>Subject<input value={template.subject} onChange={event => updateTemplate({ subject: event.target.value })}/></label>
        <label>Message<textarea rows={7} value={template.body} onChange={event => updateTemplate({ body: event.target.value })}/></label>
        <p>Mock preview only. No email will be sent.</p>
        {messageStatus && <span className="campaign-message-status" role="status">{messageStatus}</span>}
        <footer><Button variant="secondary" onClick={() => setActiveTemplate(null)}>Close</Button><Button type="submit">Save template</Button></footer>
      </form>
    </div>}
  </section>;
}

function CampaignExportScreen({ campaign, candidates, candidateError }: { campaign: DemoCampaign; candidates: CampaignCandidate[]; candidateError: string | null }) {
  const [downloadState, setDownloadState] = useState<"ready" | "downloading" | "downloaded" | "failed">("ready");
  const [downloadError, setDownloadError] = useState("");
  const stageTitle = (stage: CandidateStage) => campaignPipelineStages.find(item => item.id === stage)?.title ?? stage;
  const longlistCandidates = candidates
    .filter(candidate => candidate.stage === "longlist")
    .sort((left, right) => right.requirementsScore - left.requirementsScore || left.name.localeCompare(right.name));
  const shortlistCandidates = candidates
    .filter(candidate =>
      candidate.stage === "shortlist-proposed" ||
      candidate.stage === "shortlist-approved" ||
      candidate.stage === "reference-check" ||
      candidate.stage === "offer" ||
      candidate.stageHistory?.some(stage => stage === "shortlist-proposed" || stage === "shortlist-approved"),
    )
    .sort((left, right) => right.requirementsScore - left.requirementsScore || left.name.localeCompare(right.name));
  const getShortlistDecision = (candidate: CampaignCandidate) => candidate.shortlistDecision ??
    (candidate.stage === "shortlist-approved" || candidate.stage === "reference-check" || candidate.stage === "offer" || candidate.stageHistory?.includes("shortlist-approved")
      ? "Approved"
      : "Pending");

  const downloadWorkbook = async () => {
    setDownloadState("downloading");
    setDownloadError("");
    try {
      await new Promise<void>(resolve => window.setTimeout(resolve, 180));
      const escapeXml = (value: string | number) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
      const row = (cells: Array<string | number>) => `<Row>${cells.map(value => `<Cell><Data ss:Type="${typeof value === "number" ? "Number" : "String"}">${escapeXml(value)}</Data></Cell>`).join("")}</Row>`;
      const worksheet = (name: string, headers: string[], rows: Array<Array<string | number>>) => `<Worksheet ss:Name="${name}"><Table>${row(headers)}${rows.map(row).join("")}</Table></Worksheet>`;
      const longlistRows = longlistCandidates.map(candidate => [
        candidate.name,
        candidate.email,
        new Date(candidate.appliedAt).toLocaleDateString(),
        candidate.requirementsScore,
        `${candidate.mustHaveResults.filter(result => result.met).length} of ${candidate.mustHaveResults.length}`,
        candidate.aiFitScore,
      ]);
      const shortlistRows = shortlistCandidates.map(candidate => [
        candidate.name,
        candidate.email,
        new Date(candidate.appliedAt).toLocaleDateString(),
        stageTitle(candidate.stage),
        getShortlistDecision(candidate),
      ]);
      const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${worksheet("Longlist", ["Applicant", "Email", "Applied", "Requirements score (%)", "Must-haves met", "AI fit score (%)"], longlistRows)}${worksheet("Shortlist", ["Applicant", "Email", "Applied", "Current stage", "Approver decision"], shortlistRows)}</Workbook>`;
      const url = URL.createObjectURL(new Blob([workbook], { type: "application/vnd.ms-excel" }));
      const link = document.createElement("a");
      try {
        link.href = url;
        link.download = `${campaign.title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "campaign"}-export.xls`;
        document.body.appendChild(link);
        link.click();
      } finally {
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setDownloadState("downloaded");
    } catch (error) {
      console.error("Could not create or download the campaign spreadsheet.", error);
      setDownloadError("The spreadsheet could not be downloaded. Please try again.");
      setDownloadState("failed");
    }
  };
  return <section className="campaign-export-screen">
    <article className="campaign-export-card">
      <header><div><h3>Spreadsheet export</h3><p>Download one workbook with two sheets, based on the latest saved campaign data.</p></div><Button disabled={downloadState === "downloading" || Boolean(candidateError)} onClick={() => { void downloadWorkbook(); }}>{downloadState === "downloading" ? "Downloading…" : downloadState === "failed" ? "Retry download" : downloadState === "downloaded" ? "Download again" : "Download spreadsheet"}</Button></header>
      <div className="campaign-export-sheets"><section><h4>Longlist</h4><p>Everyone on the Longlist now, sorted by requirements score from highest to lowest.</p><small>{longlistCandidates.length} candidates</small></section><section><h4>Shortlist</h4><p>Everyone ever shortlisted, including candidates who moved on to references or an offer, with the approver’s decision.</p><small>{shortlistCandidates.length} candidates</small></section></div>
      <p>The Longlist sheet includes each candidate’s name, email, application date, requirements score, must-haves met and AI fit score. The Shortlist sheet includes each candidate’s name, email, application date, current stage and approver decision.</p>
      <small>Every download is recorded in the campaign history.</small>
      {candidateError && <p className="campaign-export-error" role="alert">{candidateError}</p>}
      {downloadState === "downloading" && <p className="campaign-export-status" role="status">Preparing your spreadsheet…</p>}
      {downloadState === "downloaded" && <p className="campaign-export-status" role="status">Spreadsheet downloaded.</p>}
      {downloadState === "failed" && <p className="campaign-export-error" role="alert">{downloadError}</p>}
    </article>
  </section>;
}

function CampaignBulkUploadPage({ campaignId }: { campaignId: string }) {
  const [campaign] = useState(() => getCampaignDetails(campaignId));
  const [files, setFiles] = useState<File[]>([]);
  const [consentSource, setConsentSource] = useState("");
  const [otherConsentSource, setOtherConsentSource] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isBatchStaged, setIsBatchStaged] = useState(false);
  const [fileError, setFileError] = useState("");
  const [workflowMessage, setWorkflowMessage] = useState("");
  const requirements = campaign ? getCampaignRequirements(campaign) : [];
  const maxFiles = 200;
  const maxFileSize = 10 * 1024 * 1024;
  const maxBatchSize = 500 * 1024 * 1024;
  const totalSize = files.reduce((total, file) => total + file.size, 0);
  const batchIsReady = Boolean(consentSource && hasConsent && (consentSource !== "other" || otherConsentSource.trim()));
  const mustHaveCount = requirements.filter(requirement => requirement.kind === "Must-have").length;
  const formatFileSize = (bytes: number) => bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  if (!campaign) {
    return <section className="surface campaign-missing"><h1>Campaign not found</h1><p>This campaign may have been removed or is no longer available.</p><Button onClick={() => go("/recruiter/campaigns")}>Back to campaigns</Button></section>;
  }

  const addFiles = (incomingFiles: File[]) => {
    const nextFiles = [...files];
    const rejected: string[] = [];
    for (const file of incomingFiles) {
      if (!/\.pdf$|\.docx$/i.test(file.name)) {
        rejected.push(`${file.name}: choose a PDF or DOCX file.`);
      } else if (file.size > maxFileSize) {
        rejected.push(`${file.name}: files must be 10 MB or smaller.`);
      } else if (nextFiles.some(existing => existing.name === file.name && existing.size === file.size)) {
        rejected.push(`${file.name}: this file is already selected.`);
      } else if (nextFiles.length >= maxFiles) {
        rejected.push(`A batch can contain up to ${maxFiles} files.`);
      } else if (nextFiles.reduce((total, existing) => total + existing.size, 0) + file.size > maxBatchSize) {
        rejected.push(`${file.name}: the batch cannot exceed 500 MB.`);
      } else {
        nextFiles.push(file);
      }
    }
    setFiles(nextFiles);
    setIsBatchStaged(false);
    setWorkflowMessage("");
    setFileError(rejected.join(" "));
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files || []));
    event.currentTarget.value = "";
  };
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  return <div className="bulk-cv-page">
    <button className="bulk-cv-back" onClick={() => go(`/recruiter/campaigns/${campaign.id}`)}>Back to campaign</button>
    <header className="bulk-cv-heading">
      <h1>Bulk CV upload: {campaign.title || "Untitled campaign"}</h1>
      <p>Upload CVs for this campaign. In the connected workflow, each CV becomes a candidate on the board and is screened against the campaign’s requirements. You make every decision: nobody is rejected or shortlisted automatically.</p>
      <p className="bulk-cv-demo-note">Mock mode: selected files stay in this browser. No CVs are uploaded, parsed, or added as candidates.</p>
    </header>

    <section className="surface bulk-cv-card bulk-cv-requirements">
      <div className="bulk-cv-card-title">
        <div><h2>1. Job requirements</h2><p>Every uploaded CV is screened against this campaign’s requirements, the same way as applications from the public form.</p></div>
        <Button variant="secondary" onClick={() => go(`/recruiter/campaigns/${campaign.id}/edit`)}>Edit requirements</Button>
      </div>
      {requirements.length > 0
        ? <>
          <p className="bulk-cv-requirement-summary">{requirements.length} requirement{requirements.length === 1 ? "" : "s"}, {mustHaveCount} must-have{mustHaveCount === 1 ? "" : "s"}. A missed must-have places the candidate under Below requirements; a recruiter can always move them back.</p>
          <ul className="bulk-cv-requirement-list">{requirements.map(requirement => <li key={requirement.id}><Badge tone="info">{requirement.kind}</Badge><span>{requirement.title}</span><small>weight {requirement.weight}</small></li>)}</ul>
        </>
        : <p className="bulk-cv-empty-requirements">No requirements are configured for this campaign yet.</p>}
    </section>

    <section className="surface bulk-cv-card bulk-cv-upload-card">
      <header className="bulk-cv-card-heading"><h2>2. Upload CVs</h2><p>Up to 200 PDF or DOCX files per batch, 10 MB each, 500 MB in total.</p></header>
      <fieldset className="bulk-cv-consent">
        <legend>Candidate consent</legend>
        <div className="bulk-cv-consent-source">
          <label htmlFor="bulk-cv-consent-source">Where did these candidates give consent?</label>
          <select id="bulk-cv-consent-source" value={consentSource} onChange={event => { setConsentSource(event.target.value); setIsBatchStaged(false); setWorkflowMessage(""); }}>
            <option value="">Choose a source</option>
            <option value="talent-registration">Refrane talent registration</option>
            <option value="careers-page">Employer careers page</option>
            <option value="recruitment-event">Recruitment event sign-up</option>
            <option value="partner-referral">Partner referral (with consent)</option>
            <option value="other">Other (describe)</option>
          </select>
        </div>
        {consentSource === "other" && <label className="bulk-cv-consent-other"><span>Describe the consent source</span><input value={otherConsentSource} onChange={event => { setOtherConsentSource(event.target.value); setIsBatchStaged(false); setWorkflowMessage(""); }} placeholder="Enter the source"/></label>}
        <label className="bulk-cv-consent-confirm"><input type="checkbox" checked={hasConsent} onChange={event => { setHasConsent(event.target.checked); setIsBatchStaged(false); setWorkflowMessage(""); }}/><span>Every candidate in this batch gave consent for their CV to be processed and assessed for this role.</span></label>
      </fieldset>

      <div className={`bulk-cv-dropzone${isDragging ? " dragging" : ""}`} onDragOver={event => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
        <Icon name="upload" size={22}/>
        <p>Drag CVs here, or</p>
        <label className="bulk-cv-choose-files" htmlFor="bulk-cv-files">Choose files</label>
        <input id="bulk-cv-files" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple onChange={handleFileInput}/>
      </div>
      {fileError && <p className="bulk-cv-feedback error" role="alert">{fileError}</p>}
      {files.length > 0 && <div className="bulk-cv-selected-files"><strong>{files.length} file{files.length === 1 ? "" : "s"} selected</strong><span>{formatFileSize(totalSize)} of 500 MB</span><ul>{files.map((file, index) => <li key={`${file.name}-${file.size}-${index}`}><Icon name="file" size={15}/><span>{file.name}</span><small>{formatFileSize(file.size)}</small></li>)}</ul></div>}
      {!batchIsReady && <p className="bulk-cv-consent-hint">Choose a consent source{consentSource === "other" ? " and describe it" : ""}, then confirm consent before staging this batch.</p>}
      {workflowMessage && <p className="bulk-cv-feedback" role="status">{workflowMessage}</p>}
      <div className="bulk-cv-actions">
        <Button disabled={!files.length || !batchIsReady} onClick={() => { setIsBatchStaged(true); setWorkflowMessage("Files staged in this local mock only. Nothing was uploaded or parsed."); }}>{`Upload ${files.length} file${files.length === 1 ? "" : "s"}`}</Button>
        <Button variant="secondary" disabled={!isBatchStaged || !files.length || !batchIsReady} onClick={() => setWorkflowMessage("Mock processing is not connected. No files were uploaded, parsed, or added as candidates.")}>{`Start processing ${files.length} CV${files.length === 1 ? "" : "s"}`}</Button>
      </div>
    </section>
  </div>;
}

function createDraftCampaign(): DemoCampaign {
  return {
    ...defaultDemoCampaign,
    id: `${Date.now()}`,
    title: "",
    department: "",
    location: "",
    workArrangement: "",
    summary: "",
    employmentType: "",
    experienceLevel: "",
  };
}

function CampaignEditor({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<DemoCampaign>(() => {
    const savedCampaign = campaignId === "new" ? createDraftCampaign() : getCampaignDetails(campaignId) ?? createDraftCampaign();
    return {
      ...savedCampaign,
      roleDescription: getCampaignRoleDescription(savedCampaign),
      summary: "",
      campaignTeam: savedCampaign.campaignTeam ?? [{ id: "owner-dave", name: "Dave Sench", email: "dave30@gmail.com", role: "Main recruiter" as const }],
      approver: savedCampaign.approver ?? null,
      requirements: savedCampaign.requirements ?? (savedCampaign.id === "1" ? [{ id: "requirement-license", title: "Valid driving licence", category: "Skill", kind: "Must-have" as const, weight: 5 }] : []),
      evaluationMode: savedCampaign.evaluationMode ?? "default" as const,
      evaluationInstructions: savedCampaign.evaluationInstructions ?? "",
    };
  });
  const [publishError, setPublishError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [additionalRecruiterEmail, setAdditionalRecruiterEmail] = useState("");
  const [approverName, setApproverName] = useState(() => campaign.approver?.name || "");
  const [approverEmail, setApproverEmail] = useState(() => campaign.approver?.email || "");
  const [approverMessage, setApproverMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const updateCampaign = (changes: Partial<DemoCampaign>) => {
    setCampaign(current => ({ ...current, ...changes }));
    setSaveMessage("");
  };
  const saveCampaign = (published: boolean, navigateToDetail = true, changes: Partial<DemoCampaign> = {}) => {
    const updatedCampaign = { ...campaign, ...changes };
    if (!updatedCampaign.title.trim()) {
      setPublishError("Add a campaign name before saving.");
      return false;
    }
    if (published && (!updatedCampaign.department.trim() || !updatedCampaign.workArrangement.trim())) {
      setPublishError("Choose a service category and work arrangement before publishing.");
      return false;
    }
    const storedCampaign = campaignId === "1" ? readDemoCampaign() : getCampaignDetails(campaignId);
    const next: DemoCampaign = {
      ...(storedCampaign || defaultDemoCampaign),
      ...updatedCampaign,
      published,
      publishedAt: published ? updatedCampaign.publishedAt || new Date().toISOString() : updatedCampaign.publishedAt,
      ...(published ? { archived: false, deleted: false, paused: false } : {}),
    };
    const saved = campaignId === "1" ? saveDemoCampaign(next) : saveCreatedCampaign(next);
    if (!saved) {
      setPublishError(published ? "The campaign could not be published in this browser. Please try again." : "The campaign could not be saved in this browser. Please try again.");
      return false;
    }
    setCampaign(next);
    setPublishError("");
    setSaveMessage(published ? "Campaign published." : "Draft saved.");
    if (navigateToDetail) go(campaignId === "new" ? "/recruiter/campaigns" : `/recruiter/campaigns/${campaignId}`);
    return true;
  };
  const changeRecruiterRole = (memberId: string, role: CampaignRecruiter["role"]) => {
    const team = campaign.campaignTeam || [];
    if (role === "Additional recruiter" && team.find(member => member.id === memberId)?.role === "Main recruiter" && team.every(member => member.id === memberId || member.role !== "Main recruiter")) {
      setPublishError("A campaign must always have a main recruiter.");
      return;
    }
    updateCampaign({ campaignTeam: team.map(member => member.id === memberId
      ? { ...member, role }
      : role === "Main recruiter" && member.role === "Main recruiter" ? { ...member, role: "Additional recruiter" } : member) });
  };
  const addRecruiter = () => {
    const email = additionalRecruiterEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setPublishError("Enter a valid work email address.");
      return;
    }
    if ((campaign.campaignTeam || []).some(member => member.email.toLowerCase() === email)) {
      setPublishError("This recruiter is already on the campaign team.");
      return;
    }
    const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, character => character.toUpperCase());
    updateCampaign({ campaignTeam: [...(campaign.campaignTeam || []), { id: `campaign-recruiter-${Date.now()}`, name, email, role: "Additional recruiter" }] });
    setAdditionalRecruiterEmail("");
  };
  const addRequirement = () => updateCampaign({ requirements: [...(campaign.requirements || []), { id: `requirement-${Date.now()}`, title: "", category: "Skill", kind: "Preferred", weight: 3 }] });
  const updateRequirement = (id: string, changes: Partial<CampaignRequirement>) => updateCampaign({ requirements: (campaign.requirements || []).map(requirement => requirement.id === id ? { ...requirement, ...changes } : requirement) });
  const removeRecruiter = (member: CampaignRecruiter) => {
    if (member.role === "Main recruiter" && (campaign.campaignTeam || []).filter(item => item.role === "Main recruiter").length === 1) {
      setPublishError("Assign another main recruiter before removing this one.");
      return;
    }
    updateCampaign({ campaignTeam: (campaign.campaignTeam || []).filter(item => item.id !== member.id) });
  };
  const archiveCampaign = () => {
    if (saveCampaign(false, false, { archived: true, paused: false, deleted: false })) go("/recruiter/campaigns");
  };
  const deleteCampaign = () => {
    if (saveCampaign(false, false, { archived: false, paused: false, deleted: true })) {
      setDeleteConfirmOpen(false);
      go("/recruiter/campaigns");
    }
  };
  const statusText = campaign.deleted ? "deleted" : campaign.archived ? "archived" : campaign.paused ? "paused" : campaign.published ? "published" : "draft";
  const requirements = campaign.requirements || [];
  return <div className="campaign-edit-page">
    <button className="campaign-edit-back" onClick={() => go("/recruiter/campaigns")}>← Campaigns</button>
    <header className="campaign-edit-header">
      <div><h1>{campaign.title || "Untitled campaign"}</h1><p>Status: <strong>{statusText}</strong></p></div>
      <div className="campaign-edit-actions">
        <Button variant="secondary" onClick={() => saveCampaign(campaign.published)}>{campaign.published ? "Save changes" : "Save draft"}</Button>
        <Button onClick={() => saveCampaign(true)}>Publish &amp; share</Button>
        {campaignId !== "new" && <><Button variant="secondary" onClick={archiveCampaign}>Archive</Button><Button variant="danger" onClick={() => setDeleteConfirmOpen(true)}>Delete</Button></>}
      </div>
    </header>
    {(publishError || saveMessage) && <p className={publishError ? "campaign-edit-error" : "campaign-edit-saved"} role={publishError ? "alert" : "status"}>{publishError || saveMessage}</p>}

    <section className="surface campaign-edit-section">
      <header className="campaign-edit-section-heading"><h2>Job board details</h2><p>The campaign name is the job title candidates see. Service category and work arrangement power candidate filters on the job board. Both are required before publishing.</p></header>
      <label className="campaign-edit-field campaign-edit-field-full"><span>Campaign name</span><input value={campaign.title} onChange={event => updateCampaign({ title: event.target.value })}/></label>
      <div className="campaign-edit-grid">
        <label className="campaign-edit-field"><span>Service category</span><select value={campaign.department} onChange={event => updateCampaign({ department: event.target.value })}><option value="">Select category</option>{["Accountant", "Customer success", "Design", "Engineering", "Finance", "Marketing", "Operations", "Other"].map(category => <option key={category}>{category}</option>)}</select></label>
        <label className="campaign-edit-field"><span>Work arrangement</span><select value={campaign.workArrangement} onChange={event => updateCampaign({ workArrangement: event.target.value })}><option value="">Select arrangement</option>{["On-site", "Hybrid", "Remote"].map(arrangement => <option key={arrangement}>{arrangement}</option>)}</select></label>
      </div>
      <RichTextEditor key={campaign.id} value={campaign.roleDescription} onChange={roleDescription => updateCampaign({ roleDescription, summary: "" })}/>
    </section>

    <section className="surface campaign-edit-section">
      <header className="campaign-edit-section-heading"><h2>Campaign team</h2><p>Recruiters from your organisation work on this campaign; only they and the organisation owner can see it. The approver signs off the shortlist and the offer. Only the main recruiter or the owner can change the team.</p></header>
      <p className="campaign-edit-info">A campaign always has one main recruiter. To change who it is, give another team member the main recruiter role; the current main recruiter becomes an additional recruiter.</p>
      <div className="campaign-team-list">{(campaign.campaignTeam || []).map(member => <div className="campaign-team-row" key={member.id}>
        <div><strong>{member.name}</strong><small>{member.email}</small></div>
        <select aria-label={`Role for ${member.name}`} value={member.role} onChange={event => changeRecruiterRole(member.id, event.target.value as CampaignRecruiter["role"])}><option>Main recruiter</option><option>Additional recruiter</option></select>
        <Button variant="danger" disabled={member.role === "Main recruiter" && (campaign.campaignTeam || []).filter(item => item.role === "Main recruiter").length === 1} onClick={() => removeRecruiter(member)}>Remove</Button>
      </div>)}</div>
      <div className="campaign-edit-add-row"><label className="campaign-edit-field"><span>Work email</span><input type="email" placeholder="name@yourcompany.com" value={additionalRecruiterEmail} onChange={event => setAdditionalRecruiterEmail(event.target.value)}/></label><Button onClick={addRecruiter}>Add as additional recruiter</Button></div>
      <div className="campaign-edit-subsection">
        <header className="campaign-edit-section-heading"><h3>Approver</h3><p>The line manager for this role. They approve the shortlist and the offer, and see nothing else. They are not part of your organisation: invite them by email and they get their own approver account.</p></header>
        {!campaign.approver && <p className="campaign-edit-warning">No approver yet. Shortlists and offers cannot be approved until one accepts an invitation.</p>}
        {campaign.approver && <p className="campaign-edit-success">Approver invite saved in this mock. No email was sent.</p>}
        <div className="campaign-edit-approver-row"><label className="campaign-edit-field"><span>Line manager’s name</span><input value={approverName} onChange={event => { setApproverName(event.target.value); setApproverMessage(""); }}/></label><label className="campaign-edit-field"><span>Their email</span><input type="email" placeholder="name@example.com" value={approverEmail} onChange={event => { setApproverEmail(event.target.value); setApproverMessage(""); }}/></label><Button onClick={() => {
          if (!approverName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(approverEmail.trim())) {
            setPublishError("Enter the line manager’s name and a valid email address.");
            return;
          }
          const approver = { name: approverName.trim(), email: approverEmail.trim().toLowerCase() };
          if (saveCampaign(campaign.published, false, { approver })) setApproverMessage("Approver invite saved in this mock. No email was sent.");
        }}>Invite approver</Button></div>
        {approverMessage && <p className="campaign-edit-saved" role="status">{approverMessage}</p>}
      </div>
    </section>

    <section className="surface campaign-edit-section">
      <header className="campaign-edit-section-heading"><h2>Requirements</h2><p>What a candidate needs. Must-have requirements decide whether someone goes to the longlist; preferred ones help rank them. Weight 1 is low and 5 is high.</p></header>
      {requirements.length === 0 && <p className="campaign-edit-empty">No requirements yet. Add the first one to start screening candidates.</p>}
      <div className="campaign-requirement-editor-list">{requirements.map(requirement => <div className="campaign-requirement-editor" key={requirement.id}>
        <label className="campaign-edit-field"><span>Requirement</span><input value={requirement.title} onChange={event => updateRequirement(requirement.id, { title: event.target.value })}/></label>
        <label className="campaign-edit-field"><span>Category</span><select value={requirement.category} onChange={event => updateRequirement(requirement.id, { category: event.target.value })}>{["Skill", "Experience", "Qualification", "Other"].map(category => <option key={category}>{category}</option>)}</select></label>
        <label className="campaign-edit-field"><span>Type</span><select value={requirement.kind} onChange={event => updateRequirement(requirement.id, { kind: event.target.value as CampaignRequirement["kind"] })}><option>Must-have</option><option>Preferred</option></select></label>
        <label className="campaign-edit-field"><span>Weight</span><select value={requirement.weight} onChange={event => updateRequirement(requirement.id, { weight: Number(event.target.value) })}>{[1, 2, 3, 4, 5].map(weight => <option key={weight} value={weight}>{weight}</option>)}</select></label>
        <Button variant="danger" onClick={() => updateCampaign({ requirements: requirements.filter(item => item.id !== requirement.id) })}>Remove</Button>
      </div>)}</div>
      <div className="campaign-edit-section-actions"><Button variant="secondary" onClick={addRequirement}>Add requirement</Button><Button disabled={!requirements.length || requirements.some(requirement => !requirement.title.trim())} onClick={() => saveCampaign(campaign.published, false)}>Save requirements</Button></div>
    </section>

    <section className="surface campaign-edit-section campaign-edit-form-section">
      <header className="campaign-edit-section-heading"><h2>Application form builder</h2><p>Drag blocks to reorder, add fields, and save a candidate-ready form for this campaign.</p></header>
      <ApplicationFormBuilder campaign={campaign} onChange={formBlocks => updateCampaign({ formBlocks })} onSaveDraft={() => saveCampaign(campaign.published, false)}/>
    </section>

    <section className="surface campaign-edit-section">
      <header className="campaign-edit-section-heading"><h2>Campaign Evaluation</h2><p>Control how AI evaluates applicants for this campaign specifically. By default every campaign uses your organisation’s evaluation settings — override them here if this role needs different screening criteria.</p></header>
      <div className="campaign-evaluation-options">
        <label className={campaign.evaluationMode === "default" ? "selected" : ""}><input type="radio" name="campaign-evaluation-mode" checked={campaign.evaluationMode === "default"} onChange={() => updateCampaign({ evaluationMode: "default" })}/><span><strong>Use organisation default</strong><small>Inherit the instructions set on the Evaluations page.</small></span></label>
        <label className={campaign.evaluationMode === "custom" ? "selected" : ""}><input type="radio" name="campaign-evaluation-mode" checked={campaign.evaluationMode === "custom"} onChange={() => updateCampaign({ evaluationMode: "custom" })}/><span><strong>Customize for this campaign</strong><small>Write instructions and enable/disable AI review just for this campaign.</small></span></label>
      </div>
      {campaign.evaluationMode === "default"
        ? <div className="campaign-evaluation-default"><span>ORGANISATION DEFAULT</span><p>Evaluate each candidate against the role requirements, relevant experience, demonstrated skills, and application quality. Identify strengths, potential gaps, and areas for human review.</p></div>
        : <label className="campaign-edit-field campaign-evaluation-custom"><span>Campaign-specific evaluation instructions</span><textarea value={campaign.evaluationInstructions} onChange={event => updateCampaign({ evaluationInstructions: event.target.value })} placeholder="Describe the screening focus for this role. Do not include sensitive or discriminatory criteria."/></label>}
      <Button onClick={() => saveCampaign(campaign.published, false)}>Save evaluation settings</Button>
    </section>
    {deleteConfirmOpen && <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setDeleteConfirmOpen(false); }}><section className="application-dialog campaign-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="campaign-delete-title"><h2 id="campaign-delete-title">Delete campaign?</h2><p>This campaign will be moved to Deleted in this mock. You can find it under the Deleted tab.</p><div className="dialog-footer"><Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button><Button variant="danger" onClick={deleteCampaign}>Delete campaign</Button></div></section></div>}
  </div>;
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = sanitizeRoleDescription(value);
  }, []);
  const applyFormat = (command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue);
    const editor = editorRef.current;
    if (editor) onChange(editor.innerHTML);
    editor?.focus();
  };
  return <label className="rich-text-field"><span className="field-label">Role description</span><div className="rich-text-editor">
    <div className="rich-text-toolbar" role="toolbar" aria-label="Text formatting">
      {[
        ["bold", "B", "Bold"],
        ["italic", "I", "Italic"],
        ["underline", "U", "Underline"],
        ["insertUnorderedList", "• List", "Bulleted list"],
        ["insertOrderedList", "1. List", "Numbered list"],
        ["justifyLeft", "Left", "Align left"],
        ["justifyCenter", "Center", "Align center"],
      ].map(([command, label, title]) => <button type="button" key={command} title={title} aria-label={title} className={`format-${command}`} onMouseDown={event => event.preventDefault()} onClick={() => applyFormat(command)}>{label}</button>)}
    </div>
    <div ref={editorRef} className="rich-text-content" contentEditable role="textbox" aria-label="Role description" aria-multiline="true" data-placeholder="Describe the role, responsibilities, and what success looks like…" onInput={event => onChange(event.currentTarget.innerHTML)}/>
  </div><span className="field-helper">Use the toolbar to format the role description candidates will see.</span></label>;
}

type FormBlockType = "heading" | "divider" | "richText" | "shortAnswer" | "paragraph" | "fileUpload" | "dropdown" | "multipleChoice" | "datePicker";
type FormBlock = { id: string; type: FormBlockType; label: string; placeholder: string; isRequired: boolean; options: string[]; metadata: { maxLength?: number; acceptedTypes?: string; helpText?: string } };
type PreviewViewport = "phone" | "tablet" | "desktop";

const blockPalette: Array<{ type: FormBlockType; label: string; icon: IconName }> = [
  { type: "heading", label: "Heading", icon: "target" },
  { type: "divider", label: "Divider", icon: "minus" as IconName },
  { type: "richText", label: "Rich Text", icon: "file" },
  { type: "shortAnswer", label: "Short Answer", icon: "user" },
  { type: "paragraph", label: "Paragraph", icon: "file" },
  { type: "fileUpload", label: "File Upload", icon: "upload" },
  { type: "dropdown", label: "Dropdown", icon: "chevron" },
  { type: "multipleChoice", label: "Multiple Choice", icon: "check" },
  { type: "datePicker", label: "Date Picker", icon: "calendar" },
];

function createFormBlock(type: FormBlockType, index: number): FormBlock {
  const copy: Record<FormBlockType, [string, string]> = {
    heading: ["A little about you", ""],
    divider: ["Section divider", ""],
    richText: ["Cover letter", "Tell us why you are a great fit…"],
    shortAnswer: ["Full name", "Enter your full name"],
    paragraph: ["About your experience", "Share a little more about your experience…"],
    fileUpload: ["CV or resume", "Upload a PDF or Word document"],
    dropdown: ["Experience level", "Choose an option"],
    multipleChoice: ["Work arrangement", "Select all that apply"],
    datePicker: ["Available start date", "Select a date"],
  };
  return { id: `${type}-${Date.now()}-${index}`, type, label: copy[type][0], placeholder: copy[type][1], isRequired: type !== "heading" && type !== "divider", options: ["Option one", "Option two", "Option three"], metadata: type === "fileUpload" ? { acceptedTypes: "PDF, DOC, DOCX" } : type === "shortAnswer" ? { maxLength: 120 } : {} };
}

function ApplicationFormBuilder({ campaign, onChange, onSaveDraft }: { campaign: DemoCampaign; onChange: (blocks: FormBlock[]) => void; onSaveDraft: () => void }) {
  const campaignId = campaign.id;
  const [blocks, setBlocks] = useState<FormBlock[]>(() => campaign.formBlocks || [createFormBlock("heading", 0), createFormBlock("shortAnswer", 1), createFormBlock("fileUpload", 2)]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [brandColor, setBrandColor] = useState("#0060f0");
  const [previewFont, setPreviewFont] = useState("DM Sans");
  const [bannerImage, setBannerImage] = useState("");
  const [darkTheme, setDarkTheme] = useState(false);
  const [copied, setCopied] = useState(false);
  const selectedBlock = blocks.find(block => block.id === selectedId);
  const formUrl = getPublicCampaignUrl(campaignId);
  const setFormBlocks = (next: FormBlock[]) => {
    setBlocks(next);
    onChange(next);
  };
  useEffect(() => {
    const savedCampaign = getCampaignDetails(campaignId);
    if (!savedCampaign) return;
    const next = { ...savedCampaign, ...campaign, formBlocks: blocks };
    if (campaignId === "1") saveDemoCampaign(next);
    else saveCreatedCampaign(next);
  }, [blocks, campaignId]);

  const addBlock = (type: FormBlockType) => {
    const next = createFormBlock(type, blocks.length);
    setFormBlocks([...blocks, next]);
    setSelectedId(next.id);
  };
  const updateBlock = (id: string, changes: Partial<FormBlock>) => setFormBlocks(blocks.map(block => block.id === id ? { ...block, ...changes } : block));
  const updateMetadata = (id: string, changes: FormBlock["metadata"]) => setFormBlocks(blocks.map(block => block.id === id ? { ...block, metadata: { ...block.metadata, ...changes } } : block));
  const moveBlock = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const next = [...blocks];
    const from = next.findIndex(block => block.id === fromId);
    const to = next.findIndex(block => block.id === toId);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setFormBlocks(next);
  };

  return <div className="form-builder" style={{ "--builder-brand": brandColor } as React.CSSProperties}>
    <div className="builder-header"><div className="builder-actions"><Button variant="secondary" onClick={() => setFormBlocks([])}>Reset</Button><Button variant="secondary" onClick={onSaveDraft}>Save draft</Button><button className="theme-toggle" onClick={() => setDarkTheme(!darkTheme)} aria-label="Toggle preview theme"><Icon name={darkTheme ? "sparkles" : "lock"} size={15}/>{darkTheme ? "Light" : "Theme"}</button></div></div>
    <div className="builder-workspace">
      <section className="builder-editor">
        <div className="builder-editor-top"><div><h3>Form blocks</h3><p>Drag blocks to reorder, or add a new field.</p></div><span className="builder-count">{blocks.length} blocks</span></div>
        <div className="block-palette" aria-label="Add a form block">{blockPalette.map(item => <button key={item.type} className="palette-pill" onClick={() => addBlock(item.type)}><Icon name={item.icon} size={14}/>{item.label}</button>)}</div>
        <div className={`block-canvas ${blocks.length === 0 ? "empty" : ""}`} onDragOver={event => event.preventDefault()}>
          {blocks.length === 0 ? <div className="builder-empty"><Icon name="plus" size={24}/><strong>Your form is empty</strong><p>Choose a block above to start building.</p><Button variant="secondary" onClick={() => addBlock("shortAnswer")}>Add first field</Button></div> : blocks.map(block => <div key={block.id} className={`builder-block ${selectedId === block.id ? "selected" : ""}`} draggable onDragStart={() => setDraggedId(block.id)} onDragOver={event => event.preventDefault()} onDrop={() => { if (draggedId) moveBlock(draggedId, block.id); setDraggedId(null); }} onClick={() => setSelectedId(block.id)}>
            <span className="drag-handle" aria-label={`Reorder ${block.label}`}><Icon name="dots" size={17}/></span>
            <div className="builder-block-content"><div className="builder-block-top"><span className="block-type">{blockPalette.find(item => item.type === block.type)?.label}</span>{block.isRequired && block.type !== "heading" && block.type !== "divider" && <Badge tone="info">Required</Badge>}</div>
              {block.type === "divider" ? <hr/> : block.type === "heading" ? <input className="inline-editor heading-editor" value={block.label} onChange={event => updateBlock(block.id, { label: event.target.value })} aria-label="Heading text"/> : <><input className="inline-editor" value={block.label} onChange={event => updateBlock(block.id, { label: event.target.value })} aria-label="Field label"/><input className="inline-editor placeholder-editor" value={block.placeholder} onChange={event => updateBlock(block.id, { placeholder: event.target.value })} aria-label="Field placeholder"/></>}
            </div>
            <button className="icon-btn delete-block" onClick={event => { event.stopPropagation(); setFormBlocks(blocks.filter(item => item.id !== block.id)); if (selectedId === block.id) setSelectedId(null); }} aria-label={`Delete ${block.label}`}><Icon name="close" size={16}/></button>
          </div>)}
        </div>
        {selectedBlock && <div className="block-settings"><div className="settings-heading"><div><span className="eyebrow">Field settings</span><h3>{selectedBlock.label || "Untitled field"}</h3></div><button className="icon-btn" onClick={() => setSelectedId(null)} aria-label="Close field settings"><Icon name="close"/></button></div>
          {selectedBlock.type !== "heading" && selectedBlock.type !== "divider" && <><label className="setting-toggle"><span><strong>Required field</strong><small>Candidate must complete this field.</small></span><button className={`toggle ${selectedBlock.isRequired ? "on" : ""}`} onClick={() => updateBlock(selectedBlock.id, { isRequired: !selectedBlock.isRequired })} aria-label="Toggle required field"><span/></button></label>
          {selectedBlock.type === "shortAnswer" && <label className="field"><span className="field-label">Maximum characters</span><input className="setting-input" type="number" value={selectedBlock.metadata.maxLength || ""} onChange={event => updateMetadata(selectedBlock.id, { maxLength: Number(event.target.value) })}/></label>}
          {selectedBlock.type === "fileUpload" && <label className="field"><span className="field-label">Accepted file types</span><input className="setting-input" value={selectedBlock.metadata.acceptedTypes || ""} onChange={event => updateMetadata(selectedBlock.id, { acceptedTypes: event.target.value })}/></label>}
          {(selectedBlock.type === "dropdown" || selectedBlock.type === "multipleChoice") && <label className="field"><span className="field-label">Options</span><textarea className="setting-textarea" value={selectedBlock.options.join("\n")} onChange={event => updateBlock(selectedBlock.id, { options: event.target.value.split("\n") })}/><span className="field-helper">Use one option per line.</span></label>}
          <label className="field"><span className="field-label">Help text</span><input className="setting-input" placeholder="Optional guidance for candidates" value={selectedBlock.metadata.helpText || ""} onChange={event => updateMetadata(selectedBlock.id, { helpText: event.target.value })}/></label></>}
        </div>}
      </section>
      <section className="builder-preview-panel"><div className="preview-toolbar"><div><h3>Live preview</h3><p>Candidate view updates as you edit.</p></div><div className="viewport-controls" role="group" aria-label="Preview size">{(["phone", "tablet", "desktop"] as PreviewViewport[]).map(size => <button key={size} className={viewport === size ? "active" : ""} onClick={() => setViewport(size)}>{size[0].toUpperCase() + size.slice(1)}</button>)}</div></div>
        <div className={`preview-stage ${viewport} ${darkTheme ? "preview-dark" : ""}`}><div className={`preview-device ${viewport}-device`} aria-label={viewport === "phone" ? "Samsung Galaxy S26 Ultra preview" : viewport === "tablet" ? "11-inch iPad A16 preview" : "Desktop preview"}>{viewport === "phone" && <><span className="phone-side-key phone-volume-key"/><span className="phone-side-key phone-power-key"/></>}{viewport === "tablet" && <span className="tablet-power-key"/>}<div className="candidate-preview" style={{ "--preview-brand": brandColor, "--preview-font": previewFont } as React.CSSProperties}><div className="preview-brand" style={bannerImage ? { backgroundImage: `linear-gradient(90deg, rgba(22, 25, 55, .72), rgba(22, 25, 55, .12)), url(${bannerImage})` } : undefined}><span className="preview-logo">N</span><span><strong>Northstar Labs</strong><small>{campaign.department || "Hiring"} · {campaign.title}</small></span></div><div className="preview-body"><Badge tone={campaign.published ? "success" : "warning"}>{campaign.published ? "Application open" : "Preview"}</Badge><h2>{campaign.title || "Untitled campaign"}</h2><CampaignRoleDescription campaign={campaign} className="preview-description" placeholder="Add a role description for candidates."/>{blocks.map(block => <PreviewBlock key={block.id} block={block}/>)}</div></div></div></div>
        <div className="branding-controls"><div><h4>Theme & branding</h4><p>Customize the candidate experience.</p></div><label className="color-control"><span>Primary color</span><input type="color" value={brandColor} onChange={event => setBrandColor(event.target.value)}/></label><label className="font-control"><span>Font</span><select value={previewFont} onChange={event => setPreviewFont(event.target.value)}><option>DM Sans</option><option>Manrope</option><option>Georgia</option></select></label><label className="banner-control"><span>Header banner</span><span className="banner-upload"><Icon name="upload" size={13}/><span>Change image</span><input type="file" accept="image/*" onChange={event => { const file = event.target.files?.[0]; if (file) setBannerImage(URL.createObjectURL(file)); }} /></span></label></div>
      </section>
    </div>
    <div className="builder-footer"><div className="form-url"><span><Icon name="external" size={14}/><strong>Candidate form URL</strong></span><input readOnly value={formUrl} aria-label="Candidate form URL"/><button onClick={() => { navigator.clipboard?.writeText(formUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }} aria-label="Copy candidate form URL">{copied ? "Copied" : "Copy"}</button></div></div>
  </div>;
}

function PreviewBlock({ block }: { block: FormBlock }) {
  if (block.type === "divider") return <hr className="preview-divider"/>;
  if (block.type === "heading") return <h3 className="preview-heading">{block.label}</h3>;
  if (block.type === "paragraph" || block.type === "richText") return <label className="preview-field"><span>{block.label}{block.isRequired && <b>*</b>}</span><textarea placeholder={block.placeholder}/></label>;
  if (block.type === "fileUpload") return <label className="preview-field"><span>{block.label}{block.isRequired && <b>*</b>}</span><span className="preview-file"><Icon name="upload" size={15}/>{block.placeholder}</span></label>;
  if (block.type === "dropdown") return <label className="preview-field"><span>{block.label}{block.isRequired && <b>*</b>}</span><select defaultValue=""><option value="" disabled>{block.placeholder}</option>{block.options.map(option => <option key={option}>{option}</option>)}</select></label>;
  if (block.type === "multipleChoice") return <fieldset className="preview-field"><legend>{block.label}{block.isRequired && <b>*</b>}</legend>{block.options.map(option => <label key={option}><input type="checkbox"/>{option}</label>)}</fieldset>;
  return <label className="preview-field"><span>{block.label}{block.isRequired && <b>*</b>}</span><input type={block.type === "datePicker" ? "date" : "text"} placeholder={block.placeholder}/></label>;
}

function EvaluationsPage() {
  const [view, setView] = useState<RoleView>(() => getRouteRoleView("owner"));
  const [enabled, setEnabled] = useState(true);
  const readOnly = view === "recruiter";
  const setRoleView = (next: RoleView) => {
    setView(next);
    updateRouteRoleView(next);
  };
  return <div className="narrow-page"><PageHeader eyebrow="Workspace settings" title="AI evaluations" description="Set consistent criteria to help your team review applications. AI supports — it never replaces — human judgement." action={<div className="settings-actions"><ViewAsSwitcher value={view} onChange={setRoleView}/>{!readOnly && <Button>Save changes</Button>}</div>}/>
    {readOnly && <div className="read-only-banner">Only the owner can change these settings.</div>}
    <div className="notice"><Icon name="sparkles"/><div><strong>Human decisions come first</strong><p>Evaluation scores are recommendations. Your team remains responsible for every recruitment decision.</p></div></div>
    <section className="settings-section"><div className="setting-row"><div><h2>Candidate evaluations</h2><p>Automatically evaluate new applications against your workspace criteria.</p></div><button className={`toggle ${enabled ? "on" : ""}`} onClick={() => setEnabled(!enabled)} aria-label="Toggle evaluations" disabled={readOnly} aria-checked={enabled} role="switch"><span/></button></div>
      <div className="form-divider"/><label className="field field-full"><span className="field-label">Base evaluation criteria</span><textarea className="tall" defaultValue={"Evaluate each candidate against the role requirements, relevant experience, demonstrated skills, and application quality. Identify strengths, potential gaps, and areas for human review."} readOnly={readOnly} disabled={readOnly}/><span className="field-helper">Applied to every active campaign unless campaign-specific instructions are added.</span></label>
      <label className="field field-full"><span className="field-label">Custom workspace instructions</span><textarea className="tall" placeholder="Add context unique to your organisation…" readOnly={readOnly} disabled={readOnly}/><span className="field-helper">Avoid including sensitive personal attributes or discriminatory criteria.</span></label>
    </section>
  </div>;
}

function SettingsPage({ business = false }: { business?: boolean }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [team, setTeam] = useState(readDemoTeam);
  const [copyStatus, setCopyStatus] = useState("");
  const [teamError, setTeamError] = useState("");
  useEffect(() => {
    const syncTeam = (event: StorageEvent) => {
      if (event.key === demoTeamStorageKey || event.key === null) setTeam(readDemoTeam());
    };
    window.addEventListener("storage", syncTeam);
    return () => window.removeEventListener("storage", syncTeam);
  }, []);
  const updateTeam = (next: DemoTeamData) => {
    if (!saveDemoTeam(next)) {
      setTeamError("Changes could not be saved in this browser. Check available storage and try again.");
      return false;
    }
    setTeam(next);
    setTeamError("");
    return true;
  };
  const addInvitation = (invite: { initials: string; name: string; email: string; role: string; link: string }) => {
    const createdAt = Date.now();
    const record: DemoTeamInvite = {
      ...invite,
      id: new URL(invite.link).pathname.split("/").filter(Boolean).pop() || `${createdAt}`,
      role: "Recruiter",
      createdAt,
      expiresAt: createdAt + 7 * 24 * 60 * 60 * 1000,
    };
    return updateTeam({ ...team, invites: [record, ...team.invites] });
  };
  const revokeInvite = (inviteId: string) => {
    updateTeam({ ...team, invites: team.invites.filter(invite => invite.id !== inviteId) });
  };
  const copyInviteLink = async (link: string) => {
    if (!navigator.clipboard) {
      setCopyStatus("Clipboard access is unavailable. Select the link to copy it.");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus("Invite link copied.");
    } catch (error) {
      console.error("Could not copy the recruiter invite link.", error);
      setCopyStatus("Could not copy the invite link. Select it to copy manually.");
    }
  };
  const [view, setView] = useState<RoleView>(() => getRouteRoleView("owner"));
  const readOnly = view === "recruiter";
  const activeInvites = team.invites.filter(invite => invite.expiresAt > Date.now());
  const latestInvite = activeInvites[0];
  const formatInviteDate = (timestamp: number) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
  return <div className="narrow-page"><PageHeader eyebrow="Settings" title={business ? "Business profile" : "Team management"} description={business ? "Keep your organisation information and employer brand up to date." : "Invite colleagues to your organisation. Invite links expire after seven days and can only be used once."} action={<div className="settings-actions"><ViewAsSwitcher value={view} onChange={value => { setView(value); updateRouteRoleView(value); }}/>{business ? !readOnly && <Button>Save changes</Button> : <Button icon="plus" onClick={() => setInviteOpen(true)} disabled={readOnly}>Invite member</Button>}</div>}/>
    {readOnly && !business && <div className="read-only-banner">Only the owner can change the team.</div>}
    {business && readOnly && <div className="read-only-banner">Only the owner can change these settings.</div>}
    {business ? <section className="settings-section">
      <div className="subheading"><h2>Organisation profile</h2><p>This information is visible on your public campaigns.</p></div>
      <div className="brand-upload"><div className="logo-preview">N</div><div><strong>Organisation logo</strong><p>PNG, JPG or SVG. Recommended 400 × 400.</p><Button variant="secondary" icon="upload" disabled={view === "recruiter"}>Change logo</Button></div></div>
      <div className="form-grid"><Field label="Organisation name" placeholder="Northstar Labs" value="Northstar Labs" readOnly={view === "recruiter"} disabled={view === "recruiter"}/><Field label="Industry" placeholder="Technology" value="Technology" readOnly={view === "recruiter"} disabled={view === "recruiter"}/><Field label="Company website" placeholder="https://northstarlabs.com" value="https://northstarlabs.com" readOnly={view === "recruiter"} disabled={view === "recruiter"}/><Field label="Company size" placeholder="51–200 employees" value="51–200 employees" readOnly={view === "recruiter"} disabled={view === "recruiter"}/></div>
      <label className="field field-full"><span className="field-label">Company description</span><textarea defaultValue="We build thoughtful digital products that help ambitious teams do their best work." readOnly={view === "recruiter"} disabled={view === "recruiter"}/></label>
      <div className="form-divider"/><div className="subheading"><h2>Business address</h2><p>Used for account and legal records.</p></div>
      <div className="form-grid"><Field label="Address line" placeholder="12 Loop Street" value="12 Loop Street" readOnly={view === "recruiter"} disabled={view === "recruiter"}/><Field label="City" placeholder="Cape Town" value="Cape Town" readOnly={view === "recruiter"} disabled={view === "recruiter"}/><Field label="Postal code" placeholder="8001" value="8001" readOnly={view === "recruiter"} disabled={view === "recruiter"}/><Field label="Country" placeholder="South Africa" value="South Africa" readOnly={view === "recruiter"} disabled={view === "recruiter"}/></div>
    </section> : <div className="team-page-sections">
      <section className="surface team-section-card">
        <div className="team-card-heading"><div><h2>Members</h2><p>Everyone with access to this hiring workspace.</p></div><span className="member-count">{team.members.length} members</span></div>
        <div className="team-member-list">
          {team.members.map((member, index) => <div className="team-member-row" key={member.id}><Avatar initials={member.initials} color={member.role === "Owner" ? "blue" : index % 2 ? "purple" : "green"}/><span className="team-member-details"><strong>{member.name}{member.role === "Owner" && <small className="you-label">(you)</small>}</strong><small>{member.email}</small></span><span className={`team-role-pill ${member.role === "Owner" ? "owner" : ""}`}>{member.role}</span></div>)}
        </div>
      </section>
      {!readOnly && <section className="surface team-section-card invite-link-section">
        <div className="team-card-heading"><div><h2>Invite link</h2><p>Generate a secure link for a new recruiter to join your organisation. Links expire after seven days and can only be used once.</p></div></div>
        <div className="invite-link-actions"><Button icon="plus" onClick={() => setInviteOpen(true)}>Generate invite link</Button>{latestInvite && <Button variant="secondary" onClick={() => copyInviteLink(latestInvite.link)}>Copy link</Button>}</div>
        {latestInvite ? <div className="visible-invite-link"><span>ONE-TIME INVITE URL</span><a href={latestInvite.link}>{latestInvite.link}</a></div> : <p className="team-empty">No active invite link. Generate one to invite a recruiter.</p>}
        <p className="copy-status" role="status" aria-live="polite">{copyStatus}</p>
      </section>}
      <section className="surface team-section-card pending-invites-section">
        <div className="team-card-heading"><div><h2>Pending invites</h2><p>Active links that have not been used yet.</p></div><span className="member-count">{activeInvites.length} active</span></div>
        {activeInvites.length === 0 ? <p className="team-empty">No pending invitations.</p> : <div className="pending-invite-list">{activeInvites.map(invite => <article className="pending-invite-card" key={invite.id}>
          <div className="pending-invite-summary"><div><strong>Expires {formatInviteDate(invite.expiresAt)}</strong><small>{invite.email} · Created {formatInviteDate(invite.createdAt)}</small></div><div className="pending-invite-actions"><Button variant="secondary" onClick={() => copyInviteLink(invite.link)} disabled={readOnly}>Copy link</Button>{!readOnly && <Button variant="ghost" onClick={() => revokeInvite(invite.id)}>Revoke</Button>}</div></div>
          <a className="pending-invite-url" href={invite.link}>{invite.link}</a>
        </article>)}</div>}
      </section>
    </div>}
    {teamError && <p className="demo-storage-error" role="alert">{teamError}</p>}
    {!business && inviteOpen && <InviteMemberDialog onClose={() => setInviteOpen(false)} onInvite={addInvitation} readOnly={readOnly}/>}
  </div>;
}

function InviteMemberDialog({ onClose, onInvite, readOnly = false }: { onClose: () => void; onInvite: (invite: { initials: string; name: string; email: string; role: string; link: string }) => boolean; readOnly?: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Recruiter");
  const [inviteLink, setInviteLink] = useState("");
  const [saveError, setSaveError] = useState("");
  const submit = (event: React.FormEvent) => {
   event.preventDefault();
   const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
   const link = `${window.location.origin}${basePath}invitation/${Math.random().toString(36).slice(2, 10)}`;
   if (!onInvite({ initials: name.trim().split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "NM", name: name.trim(), email: email.trim(), role, link })) {
     setSaveError("The invitation could not be saved in this browser. Please try again.");
     return;
   }
   setSaveError("");
   setInviteLink(link);
  };
  useEffect(() => {
   const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
   document.addEventListener("keydown", handleKeyDown);
   return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  return <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
   <section className="invite-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-member-title">
     <div className="dialog-header"><div><span className="eyebrow">Team management</span><h2 id="invite-member-title">Invite a team member</h2><p>Enter their details and we’ll create a secure invitation link.</p></div><button className="icon-btn" onClick={onClose} aria-label="Close invite dialog"><Icon name="close"/></button></div>
     {!inviteLink ? <form onSubmit={submit}><label className="field"><span className="field-label">Full name</span><input className="setting-input" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Morgan Lee" required disabled={readOnly}/></label><label className="field"><span className="field-label">Email address</span><input className="setting-input" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="morgan@example.com" required disabled={readOnly}/></label><label className="field"><span className="field-label">Role</span><select className="review-select" value={role} onChange={event => setRole(event.target.value)} disabled={readOnly}><option>Recruiter</option></select></label>{saveError && <p className="demo-storage-error" role="alert">{saveError}</p>}<div className="dialog-footer"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={readOnly}>Generate invite link</Button></div></form> : <div className="invite-created"><span className="download-icon"><Icon name="check" size={24}/></span><h3>Invitation ready</h3><p>{name} has been added to pending invitations.</p><div className="form-url invite-url"><input readOnly value={inviteLink} aria-label="Generated invite link"/><button onClick={() => navigator.clipboard?.writeText(inviteLink)}>Copy</button></div><div className="dialog-footer"><Button variant="secondary" onClick={onClose}>Done</Button></div></div>}
   </section>
  </div>;
}

const jobs = [
  { title: "Senior Product Designer", company: "Orbit Systems", image: asset("assets/workplaces/office-3.jpg"), location: "Cape Town", mode: "Hybrid", time: "2 days ago", match: 92, initials: "OS", tone: "blue" },
  { title: "Product Designer", company: "Luma Health", image: asset("assets/workplaces/office-2.jpg"), location: "Johannesburg", mode: "Remote", time: "3 days ago", match: 86, initials: "LH", tone: "green" },
  { title: "UX/UI Designer", company: "Kite Finance", image: asset("assets/workplaces/office-4.jpg"), location: "South Africa", mode: "Remote", time: "5 days ago", match: 81, initials: "KF", tone: "purple" },
  { title: "Design Systems Lead", company: "Meridian", image: asset("assets/workplaces/office-1.jpg"), location: "Cape Town", mode: "On-site", time: "1 week ago", match: 78, initials: "ME", tone: "amber" },
];

type DemoApplication = {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  match: number;
  initials: string;
  tone: string;
  submittedAt: string;
  status: "In review" | "Shortlisted" | "Interview" | "Closed";
  cvFileName: string;
  coverLetter: string;
};

function isDemoApplication(value: unknown): value is DemoApplication {
  if (typeof value !== "object" || value === null) return false;
  const application = value as Partial<DemoApplication>;
  return typeof application.id === "string" &&
    typeof application.jobTitle === "string" &&
    typeof application.company === "string" &&
    typeof application.location === "string" &&
    typeof application.match === "number" &&
    typeof application.initials === "string" &&
    typeof application.tone === "string" &&
    typeof application.submittedAt === "string" &&
    (application.status === "In review" || application.status === "Shortlisted" || application.status === "Interview" || application.status === "Closed") &&
    typeof application.cvFileName === "string" &&
    typeof application.coverLetter === "string";
}

const applicationsStorageKey = "recruitflow.demoApplications";
const applicationsUpdatedEvent = "recruitflow:demo-applications-updated";

function readDemoApplications(): { applications: DemoApplication[]; error: string | null } {
  try {
    const saved = window.localStorage.getItem(applicationsStorageKey);
    if (!saved) return { applications: [], error: null };
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isDemoApplication)) {
      throw new Error("Saved application data is not in the expected format.");
    }
    return { applications: parsed, error: null };
  } catch (error) {
    console.error("Could not load demo applications from browser storage.", error);
    return { applications: [], error: "Saved applications could not be loaded from this browser." };
  }
}

function useDemoApplications() {
  const [data, setData] = useState(readDemoApplications);
  useEffect(() => {
    const syncApplications = () => setData(readDemoApplications());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === applicationsStorageKey || event.key === null) syncApplications();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(applicationsUpdatedEvent, syncApplications);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(applicationsUpdatedEvent, syncApplications);
    };
  }, []);
  const saveApplication = (application: DemoApplication) => {
    const latest = readDemoApplications();
    const applications = [application, ...latest.applications];
    try {
      window.localStorage.setItem(applicationsStorageKey, JSON.stringify(applications));
      setData({ applications, error: null });
      window.dispatchEvent(new Event(applicationsUpdatedEvent));
      return true;
    } catch (error) {
      console.error("Could not save the demo application to browser storage.", error);
      setData(current => ({ ...current, error: "Your application could not be saved in this browser. Please try again." }));
      return false;
    }
  };
  const updateApplicationStatus = (id: string, status: DemoApplication["status"]) => {
    const latest = readDemoApplications();
    const applications = latest.applications.map(application => application.id === id ? { ...application, status } : application);
    if (applications.every((application, index) => application === latest.applications[index])) return false;
    try {
      window.localStorage.setItem(applicationsStorageKey, JSON.stringify(applications));
      setData({ applications, error: null });
      window.dispatchEvent(new Event(applicationsUpdatedEvent));
      return true;
    } catch (error) {
      console.error("Could not update the demo application in browser storage.", error);
      setData(current => ({ ...current, error: "The application status could not be saved in this browser." }));
      return false;
    }
  };
  return { ...data, saveApplication, updateApplicationStatus };
}

function getApplicationProgress(status: DemoApplication["status"]) {
  return {
    interviewReached: status !== "In review",
    decisionReached: status === "Closed",
  };
}

// Visual-only readiness adapter: the original prototype has a 75% demo value.
// A saved 100% value can be supplied by a profile persistence integration;
// this patch does not change the existing Save or profile-edit behavior.
function getDisplayedProfileReadiness(): number {
  try {
    const saved = window.localStorage.getItem("recruitflow.profileReadiness");
    if (saved !== null && saved.trim() !== "") {
      const percent = Number(saved);
      if (Number.isFinite(percent)) return Math.min(100, Math.max(0, percent));
    }
  } catch { /* Private browsing may disable localStorage. */ }
  return 75;
}

// Design reference: the blue photo banners in the provided candidate/recruiter screenshots.
function WorkspaceShowcase({ audience }: { audience: "candidate" | "recruiter" }) {
  const candidate = audience === "candidate";
  return <section className={`workspace-showcase workspace-showcase-${audience}`} aria-label={candidate ? "Your next chapter" : "Your hiring workspace"}>
    <div className="workspace-showcase-content">
      <span className="workspace-showcase-eyebrow">{candidate ? "YOUR NEXT CHAPTER" : "YOUR HIRING WORKSPACE"}</span>
      {candidate ? <h2>Make space for work<br/>that feels like you.</h2> : <h2>Great teams start<br/>with thoughtful hiring.</h2>}
      <p>{candidate ? "Discover thoughtful teams and roles that match your skills, interests, and ambition." : "Bring the right people into view and keep every next step clear."}</p>
      <Button variant="secondary" onClick={() => go(candidate ? "/candidate/jobs" : "/recruiter/campaigns")}>{candidate ? "Explore opportunities" : "Manage campaigns"} <Icon name="arrow" size={16}/></Button>
    </div>
    <div className="workspace-showcase-picture" aria-hidden="true"><img src={asset("assets/workplaces/office-1.jpg")} alt=""/></div>
  </section>;
}

function CandidateDashboard() {
  const profileReadiness = getDisplayedProfileReadiness();
  const { applications } = useDemoApplications();
  const inReviewCount = applications.filter(application => application.status === "In review").length;
  const interviewCount = applications.filter(application => application.status === "Interview").length;
  return <div><PageHeader eyebrow="Tuesday, 12 March" title="Welcome back, Alex" description="You’re making progress. Here’s what to focus on next." action={<Button icon="search" onClick={() => go("/candidate/jobs")}>Find jobs</Button>}/>
    {profileReadiness === 100 ? <WorkspaceShowcase audience="candidate"/> : <div className="candidate-hero"><div><span className="eyebrow">Your profile</span><h2>Stand out to the right employers</h2><p>Your profile is {profileReadiness}% ready. Add your recent work experience to unlock stronger job matches.</p><Button variant="secondary" onClick={() => go("/candidate/settings/profile-readiness")}>Complete your profile <Icon name="arrow" size={15}/></Button></div><div className="readiness-ring"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34"/><circle className="ring-value" cx="40" cy="40" r="34" style={{ "--ring-fill": `${Math.round((profileReadiness / 100) * 214)} 214` } as React.CSSProperties}/></svg><span><strong>{profileReadiness}%</strong><small>ready</small></span></div></div>}
    <div className="application-stats">{[["Applications", String(applications.length), "Your submitted applications"], ["In review", String(inReviewCount), "With hiring teams"], ["Interviews", String(interviewCount), "Ready for your next step"]].map((x, i) => <div key={x[0]}><span className={`metric-icon metric-${["blue", "amber", "green"][i]}`}><Icon name={["file", "clock", "calendar"][i] as IconName}/></span><span><small>{x[0]}</small><strong>{x[1]}</strong><p>{x[2]}</p></span></div>)}</div>
    <section className="recommended"><div className="section-header"><div><h2>Recommended for you</h2><p>Based on your skills and preferences</p></div><button className="text-btn" onClick={() => go("/candidate/jobs")}>Browse all jobs <Icon name="arrow" size={14}/></button></div><div className="job-grid">{jobs.slice(0, 3).map(j => <JobCard job={j} key={j.title}/>)}</div></section>
  </div>;
}

function JobCard({ job, selected = false, onClick, onApply, applied = false }: { job: typeof jobs[0]; selected?: boolean; onClick?: () => void; onApply?: () => void; applied?: boolean }) {
  const [saved, setSaved] = useState(false);
  return <article className={`job-card ${selected ? "selected" : ""}`} onClick={onClick}><div className="job-card-photo" aria-hidden="true"><img src={job.image} alt="" loading="lazy" /></div><div className="job-card-top"><span className={`company-logo logo-${job.tone}`}>{job.initials}</span><button className={`icon-btn ${saved ? "saved" : ""}`} onClick={e => { e.stopPropagation(); setSaved(!saved); }} aria-label="Save job"><Icon name="bookmark"/></button></div><h3>{job.title}</h3><p className="company">{job.company}</p><div className="job-meta"><span><Icon name="location" size={14}/>{job.location}</span><span><Icon name="briefcase" size={14}/>{job.mode}</span></div><div className="job-footer"><span className="match"><Icon name="sparkles" size={14}/>{job.match}% match</span><small>{job.time}</small></div>{onApply && <button className={`btn ${applied ? "btn-secondary" : "btn-primary"} job-card-apply`} disabled={applied} onClick={event => { event.stopPropagation(); onApply(); }}><span>{applied ? "Application sent" : "Apply now"}</span></button>}</article>;
}

function JobsPage() {
  const [selected, setSelected] = useState(0);
  const { applications, error } = useDemoApplications();
  const appliedJobTitles = new Set(applications.map(application => application.jobTitle));
  return <div><PageHeader eyebrow="Opportunities" title="Find your next role" description="Explore opportunities matched to your skills and preferences."/>
    <div className="job-search-bar"><label className="search"><Icon name="search"/><input placeholder="Job title, skill or company"/></label><label className="search location-search"><Icon name="location"/><input placeholder="Location"/></label><Button>Search jobs</Button></div>
    <div className="filter-row"><Button variant="secondary" icon="filter">All filters</Button>{["Remote", "Hybrid", "Design", "Full-time"].map(f => <button className="filter-pill" key={f}>{f}<Icon name="close" size={13}/></button>)}<span className="results-count">48 opportunities</span></div>
    {error && <p className="demo-storage-error" role="alert">{error}</p>}
    <div className="jobs-layout"><div className="results-list">{jobs.map((j, i) => <JobCard job={j} key={j.title} selected={selected === i} applied={appliedJobTitles.has(j.title)} onClick={() => setSelected(i)} onApply={() => go("/public/campaign/1")}/>)}</div><aside className="job-detail"><div className="job-detail-photo" key={jobs[selected].image}><img src={jobs[selected].image} alt="" /></div><div className="detail-header"><span className={`company-logo logo-${jobs[selected].tone}`}>{jobs[selected].initials}</span><button className="icon-btn"><Icon name="bookmark"/></button></div><h2>{jobs[selected].title}</h2><p className="company">{jobs[selected].company}</p><div className="job-meta"><span><Icon name="location" size={14}/>{jobs[selected].location}</span><span><Icon name="briefcase" size={14}/>{jobs[selected].mode}</span></div><div className="match-banner"><Icon name="sparkles"/><span><strong>{jobs[selected].match}% profile match</strong><small>Your skills align strongly with this role.</small></span></div><Button className="full" disabled={appliedJobTitles.has(jobs[selected].title)} variant={appliedJobTitles.has(jobs[selected].title) ? "secondary" : "primary"} onClick={() => go("/public/campaign/1")}>{appliedJobTitles.has(jobs[selected].title) ? "Application sent" : "Apply now"}</Button><div className="detail-copy"><h3>About the role</h3><p>Join a collaborative product team shaping thoughtful digital experiences. You’ll partner closely with product, engineering and research to solve meaningful customer problems.</p><h3>What you’ll bring</h3><ul><li>5+ years of product design experience</li><li>Strong portfolio of end-to-end product work</li><li>Experience with accessible design systems</li></ul></div></aside></div>
  </div>;
}

function ApplicationDialog({ job, onClose, onSubmit }: { job: typeof jobs[0]; onClose: () => void; onSubmit: (application: DemoApplication) => boolean }) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitError, setSubmitError] = useState("");
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="application-dialog" role="dialog" aria-modal="true" aria-labelledby="application-dialog-title">
      <div className="dialog-header"><div><span className="eyebrow">Apply to {job.company}</span><h2 id="application-dialog-title">{job.title}</h2><p>Share your CV and a short cover letter with the hiring team.</p></div><button className="icon-btn" onClick={onClose} aria-label="Close application dialog"><Icon name="close"/></button></div>
      <form onSubmit={event => {
        event.preventDefault();
        const letter = coverLetter.trim();
        if (!cvFile || !letter) {
          setSubmitError(!cvFile ? "Please attach your CV before submitting." : "Please add a short cover letter before submitting.");
          return;
        }
        if (!onSubmit({ id: `${Date.now()}`, jobTitle: job.title, company: job.company, location: job.location, match: job.match, initials: job.initials, tone: job.tone, submittedAt: new Date().toISOString(), status: "In review", cvFileName: cvFile.name, coverLetter: letter })) {
          setSubmitError("We couldn’t save your application in this browser. Please try again.");
        }
      }}>
        <label className="file-field"><span className="field-label">CV <span aria-hidden="true">*</span></span><span className="file-input"><Icon name="file" size={17}/><input type="file" accept=".pdf,.doc,.docx" aria-required="true" onChange={event => { setCvFile(event.target.files?.[0] || null); setSubmitError(""); }}/><span>{cvFile?.name || "Choose a PDF or Word document"}</span></span><span className="field-helper">Demo mode saves the filename only; your file is not uploaded.</span></label>
        <label className="field field-full"><span className="field-label">Cover letter <span aria-hidden="true">*</span></span><textarea required value={coverLetter} onChange={event => { setCoverLetter(event.target.value); setSubmitError(""); }} placeholder="Tell the hiring team why you’re a great fit for this role…"/><span className="field-helper">A thoughtful, role-specific note is usually most helpful.</span></label>
        {submitError && <p className="demo-storage-error" role="alert">{submitError}</p>}
        <div className="dialog-footer"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Submit application</Button></div>
      </form>
    </section>
  </div>;
}

function ApplicationsPage() {
  const { applications, error } = useDemoApplications();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | "In progress" | "Closed">("All");
  const filteredApplications = applications.filter(application => filter === "All" || (filter === "Closed" ? application.status === "Closed" : application.status !== "Closed"));
  const selectedApplication = filteredApplications.find(application => application.id === selectedId) || filteredApplications[0];
  return <div><PageHeader eyebrow="Your job search" title="My applications" description="Track your applications and see what happens next."/>
    {error && <p className="demo-storage-error" role="alert">{error}</p>}
    {!applications.length ? <section className="applications-empty"><span className="download-icon"><Icon name="file" size={25}/></span><h2>No applications yet</h2><p>When you apply to a role, you can track its progress here.</p><Button icon="search" onClick={() => go("/candidate/jobs")}>Explore open roles</Button></section> :
      <><div className="tabs">{(["All", "In progress", "Closed"] as const).map(tab => <button key={tab} className={filter === tab ? "active" : ""} onClick={() => { setFilter(tab); setSelectedId(null); }}>{tab} <span>{tab === "All" ? applications.length : tab === "Closed" ? applications.filter(application => application.status === "Closed").length : applications.filter(application => application.status !== "Closed").length}</span></button>)}</div>
        <div className="applications-layout">
          <section className="application-list">{filteredApplications.length ? filteredApplications.map(application => {
            const progress = getApplicationProgress(application.status);
            return <article className={`application-row ${selectedApplication?.id === application.id ? "selected" : ""}`} key={application.id} onClick={() => setSelectedId(application.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(application.id); } }} tabIndex={0} aria-label={`View application for ${application.jobTitle}`}><span className={`company-logo logo-${application.tone}`}>{application.initials}</span><div className="application-main"><h3>{application.jobTitle}</h3><p>{application.company} · {application.location}</p><small>Applied {new Date(application.submittedAt).toLocaleDateString()}</small></div><div className="status-timeline" aria-label={`Application progress: Applied${progress.interviewReached ? ", Interview" : ""}${progress.decisionReached ? ", Decision" : ""}`}><span className="complete"><i><Icon name="check" size={12}/></i>Applied</span><b/><span className={progress.interviewReached ? "complete" : "current"}><i>{progress.interviewReached ? <Icon name="check" size={12}/> : <Icon name="clock" size={12}/>}</i>Interview</span><b/><span className={progress.decisionReached ? "complete" : ""}><i>{progress.decisionReached && <Icon name="check" size={12}/>}</i>Decision</span></div><Badge tone={application.status === "Interview" || application.status === "Shortlisted" ? "success" : application.status === "Closed" ? "neutral" : "info"}>{application.status}</Badge><span className="icon-btn"><Icon name="chevron"/></span></article>;
          }) : <div className="applications-empty"><h2>No {filter.toLowerCase()} applications</h2><p>Try a different filter to see your applications.</p><Button variant="secondary" onClick={() => setFilter("All")}>View all applications</Button></div>}</section>
          {selectedApplication && <aside className="application-info">
            <div className="application-info-heading"><span className={`company-logo logo-${selectedApplication.tone}`}>{selectedApplication.initials}</span><div><span className="eyebrow">Application details</span><h2>{selectedApplication.jobTitle}</h2><p>{selectedApplication.company} · {selectedApplication.location}</p></div></div>
            <Badge tone={selectedApplication.status === "Interview" ? "success" : selectedApplication.status === "Closed" ? "neutral" : "info"}>{selectedApplication.status}</Badge>
            <div className="application-result"><span className="metric-icon metric-green"><Icon name="sparkles"/></span><div><strong>{selectedApplication.match}% match</strong><p>Your profile match result for this role.</p></div></div>
            <div className="application-info-section"><h3>Application timeline</h3><div className="info-timeline"><span className="complete"><i><Icon name="check" size={12}/></i><span><strong>Application submitted</strong><small>{new Date(selectedApplication.submittedAt).toLocaleString()}</small></span></span><span className={getApplicationProgress(selectedApplication.status).interviewReached ? "complete" : "current"}><i>{getApplicationProgress(selectedApplication.status).interviewReached ? <Icon name="check" size={12}/> : <Icon name="clock" size={12}/>}</i><span><strong>{selectedApplication.status === "In review" ? "In review" : selectedApplication.status === "Shortlisted" ? "Shortlisted" : "Interview"}</strong><small>{selectedApplication.status === "In review" ? "Your application is with the hiring team." : selectedApplication.status === "Shortlisted" ? "The hiring team has shortlisted your application." : "The hiring team has invited you to interview."}</small></span></span><span className={getApplicationProgress(selectedApplication.status).decisionReached ? "complete" : ""}><i>{getApplicationProgress(selectedApplication.status).decisionReached && <Icon name="check" size={12}/>}</i><span><strong>Decision</strong><small>{getApplicationProgress(selectedApplication.status).decisionReached ? "The hiring team has closed this application." : "We’ll notify you when there’s an update."}</small></span></span></div></div>
            <div className="application-info-section"><h3>Submitted with</h3><p className="application-file-name"><Icon name="file" size={15}/>{selectedApplication.cvFileName}</p></div>
            <Button variant="secondary" className="full" onClick={() => go("/candidate/jobs")}>Browse more roles</Button>
          </aside>}
        </div>
      </>}
  </div>;
}

function ApplicationConfirmationPage() {
  const { applications, error } = useDemoApplications();
  const application = applications[0];
  if (!application) return <div className="application-confirmation-page"><section className="application-confirmation-card"><span className="confirmation-icon"><Icon name="file" size={26}/></span><span className="eyebrow">Nothing to confirm</span><h1>No recent application.</h1><p className="confirmation-lede">Start by exploring open roles. Once you submit an application, you’ll find its confirmation and tracking details here.</p>{error && <p className="demo-storage-error" role="alert">{error}</p>}<div className="confirmation-actions"><Button icon="search" onClick={() => go("/candidate/jobs")}>Explore open roles</Button><Button variant="secondary" onClick={() => go("/candidate/applications")}>My applications</Button></div></section></div>;
  return <div className="application-confirmation-page">
    <section className="application-confirmation-card">
      <span className="confirmation-icon"><Icon name="check" size={28}/></span>
      <span className="eyebrow">Application submitted</span>
      <h1>You’re one step closer.</h1>
      <p className="confirmation-lede">Your application has been sent to the hiring team. We’ll keep everything organised here so you can focus on what’s next.</p>
      {application && <div className="confirmation-job"><span className={`company-logo logo-${application.tone}`}>{application.initials}</span><span><strong>{application.jobTitle}</strong><small>{application.company} · {application.location}</small></span><Badge tone="info">In review</Badge></div>}
      <div className="confirmation-next"><div><span>01</span><p><strong>We’ve got your application</strong><small>Your details and CV are saved in this demo.</small></p></div><div><span>02</span><p><strong>The team reviews your profile</strong><small>Track progress any time from My applications.</small></p></div></div>
      {error && <p className="demo-storage-error" role="alert">{error}</p>}
      <div className="confirmation-actions"><Button onClick={() => go("/candidate/applications")}>Track my application <Icon name="arrow" size={15}/></Button><Button variant="secondary" onClick={() => go("/candidate/jobs")}>Explore more roles</Button></div>
      <p className="demo-note"><Icon name="lock" size={13}/> Demo mode: your application details are saved in this browser only.</p>
    </section>
  </div>;
}

function ProfilePage() {
  const profileReadiness = getDisplayedProfileReadiness();
  const [section, setSection] = useState("Personal details");
  const sections = [["Personal details", true], ["CV & documents", true], ["Skills", true], ["Work experience", false], ["Education", false], ["Preferences", true]] as const;
  return <div><PageHeader eyebrow="My profile" title="Profile readiness" description="A complete profile helps employers understand your experience and improves job matches."/>
    <div className="profile-summary"><div className="readiness-ring small"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34"/><circle className="ring-value" cx="40" cy="40" r="34" style={{ "--ring-fill": `${Math.round((profileReadiness / 100) * 214)} 214` } as React.CSSProperties}/></svg><span><strong>{profileReadiness}%</strong></span></div><div><h2>{profileReadiness === 100 ? "Your profile is ready" : "Your profile is almost ready"}</h2><p>{profileReadiness === 100 ? "Your profile is complete and ready for matched opportunities." : "Complete 2 remaining sections to make your profile visible for all matched opportunities."}</p>{profileReadiness !== 100 && <div className="missing"><span><Icon name="clock" size={14}/> Add work experience</span><span><Icon name="clock" size={14}/> Add education</span></div>}</div></div>
    <div className="editor-layout profile-layout"><aside className="section-nav">{sections.map(([s, done]) => <button className={section === s ? "active" : ""} key={s} onClick={() => setSection(s)}>{done ? <span className="done"><Icon name="check" size={13}/></span> : <span/>}{s}<small>{done ? "Complete" : "Missing"}</small></button>)}</aside><section className="form-page"><div className="form-heading"><span className="step-icon"><Icon name="user"/></span><div><h2>{section}</h2><p>Keep your information accurate and up to date.</p></div></div><div className="avatar-upload"><Avatar initials="AM" color="purple" size="lg"/><div><strong>Profile photo</strong><p>JPG or PNG, up to 5 MB.</p><Button variant="secondary" icon="upload">Upload new photo</Button></div></div><div className="form-grid"><Field label="First name" placeholder="Alex"/><Field label="Last name" placeholder="Morgan"/><Field label="Email address" icon="mail" placeholder="alex@example.com"/><Field label="Phone number" placeholder="+27 72 000 0000"/><Field label="Location" icon="location" placeholder="Cape Town, South Africa"/><Field label="Professional headline" placeholder="Senior Product Designer"/></div><label className="field field-full"><span className="field-label">Professional summary</span><textarea defaultValue="Product designer focused on clear, accessible experiences for complex digital products."/></label></section></div>
    <div className="profile-actions"><Button>Save changes</Button></div>
  </div>;
}

function BillingPage() {
  return <div className="narrow-page"><PageHeader eyebrow="Account" title="Subscription & payment" description="Manage access and submit a supported payment method."/>
    <div className="subscription-status"><span className="summary-icon"><Icon name="card"/></span><div><span className="eyebrow">Current status</span><h2>Profile access — Payment pending</h2><p>Your payment is awaiting manual verification. We’ll update this page when the review is complete.</p></div><Badge tone="warning">Pending</Badge></div>
    <section className="settings-section"><div className="subheading"><h2>Available payment methods</h2><p>Choose one of the supported methods below. No charge is made in this prototype.</p></div>
      <div className="payment-option"><span className="payment-icon"><Icon name="building"/></span><div><strong>Bank transfer</strong><p>Use the verified banking details provided after you begin the payment process.</p></div><Button variant="secondary">View instructions</Button></div>
      <div className="payment-option"><span className="payment-icon"><Icon name="card"/></span><div><strong>Redeem cash code</strong><p>Enter a valid code issued by an authorised RecruitFlow payment partner.</p></div><Button variant="secondary">Redeem code</Button></div>
      <div className="secure-note"><Icon name="lock"/><p><strong>Your payment information is protected.</strong><span>Never share a payment code outside RecruitFlow.</span></p></div>
    </section>
  </div>;
}

function AuthPage({ kind = "login", approverLogin = false }: { kind?: "login" | "signup" | "forgot" | "reset" | "invite" | "apply" | "thanks" | "access" | "unavailable" | "404"; approverLogin?: boolean }) {
  const [persona, setPersona] = useState<"candidate" | "recruiter" | "approver">(approverLogin ? "approver" : "candidate");
  const [inviteError, setInviteError] = useState("");
  const invitationId = kind === "invite" ? getInvitationId() : "";
  const invitation = kind === "invite" ? readDemoTeam().invites.find(invite => invite.id === invitationId && invite.expiresAt > Date.now()) : undefined;
  if (kind === "404" || kind === "access" || kind === "unavailable" || kind === "thanks") {
    const data = kind === "404" ? ["404", "This page took a different path", "We couldn’t find the page you’re looking for.", "Go to overview"] : kind === "thanks" ? ["check", "Application received", "Your application has been submitted successfully. The employer will contact you if there is an update.", "Back to opportunities"] : kind === "access" ? ["clock", "Your access is under review", "Northstar Labs is reviewing your recruiter access. You can safely return later.", "Sign out"] : ["building", "No recruiter workspace available", "This account isn’t connected to an eligible organisation workspace yet.", "Return to sign in"];
    return <div className="public-page"><header className="public-header"><Logo/><Button variant="ghost" onClick={() => go("/login")}>Sign in</Button></header><main className="state-page"><div className={`state-icon state-${kind}`} >{data[0] === "404" ? <strong>404</strong> : <Icon name={data[0] as IconName} size={30}/>}</div><h1>{data[1]}</h1><p>{data[2]}</p><Button onClick={() => go(kind === "thanks" ? "/candidate/jobs" : kind === "404" ? "/candidate" : "/login")}>{data[3]}</Button>{kind === "unavailable" && <Button variant="ghost">Accept an organisation invitation</Button>}</main></div>;
  }
  if (kind === "apply") return <PublicApplication campaignId={getAppPath().split("/").pop() || "1"}/>;
  if (kind === "invite" && !invitation) return <div className="public-page"><header className="public-header"><Logo/><Button variant="ghost" onClick={() => go("/login")}>Sign in</Button></header><main className="state-page"><div className="state-icon state-unavailable"><Icon name="clock" size={30}/></div><h1>This invite link is no longer available</h1><p>It may have expired, already been used, or been revoked by the owner. Ask the owner for a new recruiter invite link.</p><Button onClick={() => go("/login")}>Return to sign in</Button></main></div>;
  const copy = kind === "signup" ? ["Create your account", "Join RecruitFlow to find your next opportunity or build your team.", "Create account"] : kind === "forgot" ? ["Reset your password", "Enter your email and we’ll send reset instructions if an account exists.", "Send reset link"] : kind === "reset" ? ["Choose a new password", "Create a strong password you don’t use elsewhere.", "Reset password"] : kind === "invite" ? ["Create your recruiter account", "Finish sign-up to join the Northstar Labs workspace.", "Create account"] : ["Welcome to RecruitFlow", "Sign in to continue to your workspace.", "Sign in"];
  const submitAuth = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (kind === "invite") {
      const formData = new FormData(event.currentTarget);
      const name = String(formData.get("invite-name") || "").trim();
      const email = String(formData.get("invite-email") || "").trim();
      if (!invitation || !acceptDemoTeamInvite(invitation.id, name, email)) {
        setInviteError("This invitation could not be accepted. Check that you use the invited email address and ask the owner for a new link if needed.");
        return;
      }
      go("/recruiter");
      return;
    }
    if (kind === "signup") {
      const passwords = event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="password"]');
      passwords[1].setCustomValidity("");
      if (passwords[0].value !== passwords[1].value) {
        passwords[1].setCustomValidity("Passwords must match.");
        passwords[1].reportValidity();
        return;
      }
    }
    const target = kind === "login" || kind === "signup" ? `/${persona}` : "/login";
    if (kind === "login" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      event.currentTarget.closest(".auth-layout")?.classList.add("auth-exiting");
      window.setTimeout(() => go(target), 350);
    } else {
      go(target);
    }
  };
  return <div className={`auth-layout ${kind === "login" ? "auth-login" : kind === "signup" ? "auth-signup" : ""}`}><aside className="auth-aside">{kind === "login" ? <>
    <div className="auth-brand-lockup"><Logo/><span>by Refrane</span></div>
    <div className="auth-feature">
      <span className="auth-feature-eyebrow">YOUR RECRUITFLOW WORKSPACE</span>
      <h2>People and progress,<br/>in one place.</h2>
      <p>A clear space for candidates to explore opportunities and teams to make thoughtful hiring decisions.</p>
      <div className="auth-feature-visual" aria-hidden="true">
        <div className="auth-feature-photo"><img src={asset("assets/workplaces/office-2.jpg")} alt=""/></div>
        <span className="auth-feature-pill auth-feature-pill-top"><Icon name="users" size={19}/>Built around people</span>
        <span className="auth-feature-pill auth-feature-pill-bottom"><Icon name="check" size={18}/>Smarter next steps</span>
      </div>
    </div>
    <p className="aside-foot">RecruitFlow by Refrane</p>
  </> : <><Logo/><div className="auth-message"><div className="auth-photo-stack" aria-hidden="true"><div className="auth-photo-main"><img src={asset("assets/workplaces/office-2.jpg")} alt="" /></div><div className="auth-photo-portrait"><img src={asset("assets/people/person-1.jpg")} alt="" /></div><div className="auth-photo-pill"><span className="auth-mini-avatars"><img src={asset("assets/people/person-2.jpg")} alt=""/><img src={asset("assets/people/person-3.jpg")} alt=""/><img src={asset("assets/people/person-4.jpg")} alt=""/></span><span>People, connected.</span></div></div><span className="quote-mark">“</span><blockquote>Hiring is about more than filling roles. RecruitFlow helps teams make every candidate interaction count.</blockquote><div className="quote-person"><Avatar initials="SO" color="green"/><span><strong>Sophie Okafor</strong><small>People Operations, Northstar Labs</small></span></div></div><p className="aside-foot">Trusted by growing teams to hire thoughtfully.</p></>}</aside><main className="auth-main"><div className="mobile-logo"><Logo/></div><div className="auth-form"><div className="auth-heading">{kind === "login" && <span className="auth-kicker">RecruitFlow</span>}<h1>{copy[0]}</h1><p>{copy[1]}</p></div>
    {kind === "login" && !approverLogin && <><span className="field-label persona-switch-label">Sign in as</span><div className="persona-switch" role="group" aria-label="Sign in as"><button type="button" className={persona === "candidate" ? "active" : ""} aria-pressed={persona === "candidate"} onClick={() => setPersona("candidate")}>Candidate</button><button type="button" className={persona === "recruiter" ? "active" : ""} aria-pressed={persona === "recruiter"} onClick={() => setPersona("recruiter")}>Recruiter</button></div></>}
    {(kind === "signup" || (kind === "login" && approverLogin)) && <><label className={`persona-picker${approverLogin ? " persona-picker-static" : ""}`}><span className="persona-picker-icon"><Icon name={persona === "candidate" ? "user" : persona === "recruiter" ? "building" : "sparkles"} size={19}/></span><span className="persona-picker-label"><small>{kind === "login" ? "Continue as" : "Create account as"}</small><strong>{persona === "candidate" ? "Candidate" : persona === "recruiter" ? "Recruiter" : "Approver"}</strong>{!approverLogin && <select value={persona} onChange={event => setPersona(event.target.value as typeof persona)} aria-label="Create account as"><option value="candidate">Candidate</option><option value="recruiter">Recruiter</option></select>}</span>{!approverLogin && <span className="persona-picker-chevron"><Icon name="chevron" size={16}/></span>}</label>{kind === "login" && <p className="persona-message" role="status" aria-live="polite">You’re signing in as an approver.</p>}</>}
    {kind === "invite" && <div className="invite-card"><span className="org-icon">N</span><span><strong>Northstar Labs</strong><small>Recruiter workspace · Invitation for {invitation?.email}</small></span></div>}
    <form onSubmit={submitAuth}>
      {(kind === "signup" || kind === "invite") && <Field label="Full name" icon="user" placeholder="Your name" required={kind === "invite"} name={kind === "invite" ? "invite-name" : undefined}/>}
      {kind === "invite" ? <label className="field"><span className="field-label">Invited email address</span><input className="setting-input" type="email" name="invite-email" value={invitation?.email || ""} readOnly required/><span className="field-helper">Use the email address this invitation was created for.</span></label> : kind !== "reset" && <Field label="Email address" icon="mail" placeholder="you@example.com" type="email" required={kind === "signup"}/>}
      {(kind === "login" || kind === "signup" || kind === "reset" || kind === "invite") && <Field label={kind === "reset" ? "New password" : "Password"} icon="lock" placeholder="Enter your password" type="password" helper={kind === "reset" || kind === "signup" || kind === "invite" ? "Use at least 8 characters." : undefined} required={kind === "signup" || kind === "invite"} minLength={kind === "signup" || kind === "invite" ? 8 : undefined}/>}
      {(kind === "reset" || kind === "signup") && <Field label={kind === "signup" ? "Confirm password" : "Confirm new password"} icon="lock" placeholder="Repeat your password" type="password" required={kind === "signup"} minLength={kind === "signup" ? 8 : undefined} onChange={kind === "signup" ? e => e.currentTarget.setCustomValidity("") : undefined}/>}
      {inviteError && <p className="demo-storage-error" role="alert">{inviteError}</p>}
      {kind === "login" && <div className="form-options"><label><input type="checkbox"/>Remember me</label><button type="button" onClick={() => go("/forgot-password")}>Forgot password?</button></div>}
      <Button type="submit" className="full">{copy[2]}</Button>
    </form>
    {kind === "login" && <><div className="or"><span/>or continue with<span/></div><Button variant="secondary" className="full"><b className="google-g">G</b>Continue with Google</Button>{approverLogin ? <p className="auth-bottom">Candidate or recruiter? <button onClick={() => go("/login")}>Sign in here</button></p> : <p className="auth-bottom auth-login-links"><span>New to RecruitFlow? <button onClick={() => go("/create-account")}>Create an account</button></span><span>Approver? <button onClick={() => go("/approver/login")}>Sign in here</button></span></p>}</>}
    {kind === "signup" && <p className="auth-bottom">Already have an account? <button onClick={() => go("/login")}>Sign in</button></p>}
    {kind !== "login" && <button className="back-link" onClick={() => go("/login")}>← Back to sign in</button>}
  </div></main></div>;
}

function ApproverPage() {
  const view = getRouteRoleView("owner");
  return <div className="approver-standalone">
    <header className="approver-header"><button className="logo" onClick={() => go("/approver")}><span className="brand-symbol"><img src={asset("assets/recruitflow-logo.png")} alt=""/></span><span>RecruitFlow</span></button><span className="approver-header-label"><Icon name="sparkles" size={16}/>Approver workspace</span><Button variant="ghost" onClick={() => go("/login")}>Sign out</Button></header>
    <main className="approver-content"><div className="narrow-page"><PageHeader eyebrow="Approver workspace" title="Approvals" description="Review candidates whose decisions are ready for final sign-off before moving them forward." action={<Button variant="secondary">Export summary</Button>}/>
    <div className="metrics-grid">{[
      ["Pending reviews", "12", "blue"],
      ["Shortlists proposed", "6", "amber"],
      ["Offers awaiting sign-off", "3", "green"],
    ].map(([label, value, tone]) => <div className="metric" key={label}><div className={`metric-icon metric-${tone}`}><Icon name={tone === "blue" ? "file" : tone === "amber" ? "clock" : "check" as IconName}/></div><div><span>{label}</span><strong>{value}</strong><small>{view === "owner" ? "Shared with your team" : "Review queue"}</small></div></div>)}</div>
    <section className="surface list-surface"><div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Role</th><th>Decision</th><th>Stage</th><th>Actions</th></tr></thead><tbody>{[
      { name: "Amina Toure", role: "Senior Product Designer", action: "Approve shortlist", stage: "Shortlist proposed" },
      { name: "Noah Kim", role: "Frontend Engineer", action: "Send back with a reason", stage: "Reference check" },
      { name: "Priya Shah", role: "Customer Success Lead", action: "Approve offer", stage: "Offer" },
    ].map(item => <tr key={item.name}><td><span className="person"><Avatar initials={item.name.split(" ").map(part => part[0]).join("").slice(0, 2)} color="purple"/><span><strong>{item.name}</strong><small>{item.role}</small></span></span></td><td>{item.role}</td><td><Badge tone="warning">Awaiting approval</Badge></td><td>{item.stage}</td><td><Button variant="secondary" onClick={() => go("/approver?view=recruiter")}>{item.action}</Button></td></tr>)}</tbody></table></div></section>
    </div></main>
  </div>;
}

function StyleGuidePage() {
  const swatches = [
    ["Primary", "#0060f0", "Buttons, links, active states"],
    ["Text", "#1a1d35", "Headings and body text"],
    ["Muted text", "#687386", "Secondary labels and hints"],
    ["Border", "#e8ebf4", "Dividers and inputs"],
    ["Background", "#f5f7fc", "Page canvas"],
    ["Success", "#166847", "Approved and positive states"],
    ["Warning", "#8a510b", "Draft and review states"],
    ["Danger", "#a52d4c", "Errors and rejected states"],
    ["Info", "#0060f0", "Neutral informational states"],
  ];
  const componentNames = ["Button", "Badge", "Input", "Select", "Textarea", "Checkbox", "Toggle", "Tabs", "Table", "Card", "Avatar", "Empty state", "Loading state", "Error message", "Dialog"];
  return <div className="narrow-page style-guide-page">
    <PageHeader eyebrow="Design system" title="Style guide" description="Shared design tokens, component variants, and interaction states for every RecruitFlow screen." action={<Button variant="secondary" onClick={() => go("/recruiter/settings/team?view=owner")}>Open team settings</Button>}/>
    <nav className="style-guide-index" aria-label="Style guide sections">{["Tokens", "Components", "Interaction states"].map(label => <a key={label} href={`#guide-${label.toLowerCase().replace(/ /g, "-")}`}>{label}</a>)}</nav>
    <section className="style-guide-section" id="guide-tokens"><h2>Design tokens</h2>
      <h3 className="guide-subtitle">Colour palette</h3><div className="swatch-grid">{swatches.map(([name, hex, use]) => <div className="swatch-card" key={name}><span className="swatch" style={{ background: hex }}/><div><strong>{name}</strong><small>{hex}</small><p>{use}</p></div></div>)}</div>
      <h3 className="guide-subtitle">Typography</h3><div className="token-table-wrap"><table className="token-table"><thead><tr><th>Role</th><th>Font</th><th>Size</th><th>Weight</th><th>Example</th></tr></thead><tbody>
        <tr><td>Page title</td><td>Manrope</td><td>25–34px / clamp(1.55rem, 2.3vw, 2.15rem)</td><td>800</td><td><strong className="guide-type-page">Page title</strong></td></tr>
        <tr><td>Section title</td><td>DM Sans / Manrope for selected headings</td><td>18px / 1.125rem</td><td>700</td><td><strong className="guide-type-section">Section title</strong></td></tr>
        <tr><td>Body</td><td>DM Sans</td><td>14px / .875rem</td><td>400</td><td>Body copy</td></tr>
        <tr><td>Small text</td><td>DM Sans</td><td>12px / .75rem</td><td>400</td><td><small>Supporting information</small></td></tr>
        <tr><td>Labels</td><td>DM Sans</td><td>12–13px / .75–.8125rem</td><td>700</td><td><strong>FIELD LABEL</strong></td></tr>
      </tbody></table></div>
      <h3 className="guide-subtitle">Spacing, corners, elevation</h3><div className="token-table-wrap"><table className="token-table"><thead><tr><th>Token</th><th>Values</th><th>Use</th></tr></thead><tbody>
        <tr><td>Spacing scale</td><td>4, 8, 10, 12, 16, 20, 24, 32, 48, 64px</td><td>4px base grid; use 10px/20px for compact control padding and gaps</td></tr>
        <tr><td>Corner radius</td><td>8px, 12px, 16px, 20px</td><td>Controls, compact cards, cards, large surfaces</td></tr>
        <tr><td>Shadow / surface</td><td>0 10px 36px rgba(35,43,94,.048), 0 2px 9px rgba(36,45,93,.022)</td><td>Default card and surface elevation</td></tr>
        <tr><td>Shadow / focus</td><td>0 20px 50px rgba(18,61,130,.115)</td><td>Emphasized hover elevation for interactive surfaces</td></tr>
        <tr><td>Focus ring</td><td>0 0 0 3px rgba(92,150,244,.24) · 3px outline</td><td>Visible keyboard focus around controls</td></tr>
      </tbody></table></div>
      <div className="contrast-note"><strong>Contrast and accessibility</strong><span>Body text #1a1d35 on white: 16.52:1 · muted text #687386 on white: 4.79:1 · white on primary #0060f0: 5.34:1. Status text on its pale badge background: success 6.12:1, warning 5.88:1, danger 6.18:1, info 4.83:1. All exceed WCAG AA’s 4.5:1 normal-text minimum.</span></div>
    </section>
    <section className="style-guide-section" id="guide-components"><h2>Shared components</h2><p className="guide-lede">Component states are shown explicitly below. Hover and focus samples are illustrative; all interactive examples remain keyboard accessible.</p>
      <div className="guide-component"><h3>Buttons</h3><div className="guide-state-row"><span className="guide-state-label">Normal · all variants</span><div className="component-row"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Danger</Button></div></div><div className="guide-state-row"><span className="guide-state-label">Hover</span><div className="component-row"><Button className="guide-hover-sample">Primary</Button><Button variant="secondary" className="guide-hover-sample">Secondary</Button><Button variant="ghost" className="guide-hover-sample">Ghost</Button><Button variant="danger" className="guide-hover-sample">Danger</Button></div></div><div className="guide-state-row"><span className="guide-state-label">Focus</span><div className="component-row"><Button className="guide-focus-sample">Focused button</Button></div></div><div className="guide-state-row"><span className="guide-state-label">Disabled</span><div className="component-row"><Button disabled>Primary</Button><Button variant="secondary" disabled>Secondary</Button><Button variant="ghost" disabled>Ghost</Button><Button variant="danger" disabled>Danger</Button></div></div></div>
      <div className="guide-component"><h3>Badges</h3><div className="guide-state-row"><span className="guide-state-label">Normal · semantic variants</span><div className="component-row"><Badge tone="success">Active</Badge><Badge tone="warning">Pending</Badge><Badge tone="danger">Rejected</Badge><Badge tone="info">In review</Badge><Badge>Draft</Badge></div></div><div className="guide-state-row"><span className="guide-state-label">Hover · focus · disabled examples</span><div className="component-row"><Badge tone="info"><span className="guide-badge-hover">Hover</span></Badge><span className="badge badge-info guide-badge-focus" tabIndex={0}>Focus</span><span className="badge badge-neutral guide-badge-disabled" aria-disabled="true">Disabled</span></div></div><div className="guide-state-row"><span className="guide-state-label">Screening result · icon and text</span><div className="component-row"><span className="result-badge result-met"><Icon name="check" size={14}/>Met</span><span className="result-badge result-verification"><Icon name="clock" size={14}/>Needs verification</span><span className="result-badge result-not-met"><Icon name="close" size={14}/>Not met</span></div></div><p className="guide-lede">Badges are status labels, not controls. Hover, focus, and disabled samples document optional presentation only; use them only when a badge is made interactive.</p></div>
      <div className="guide-component"><h3>Input, select, and textarea</h3><div className="guide-control-grid">
        <label className="guide-control"><span>Input · normal</span><input defaultValue="alex@example.com"/></label><label className="guide-control"><span>Select · normal</span><select defaultValue="Recruiter"><option>Recruiter</option><option>Owner</option></select></label><label className="guide-control"><span>Textarea · normal</span><textarea defaultValue="Add context here."/></label>
        <label className="guide-control"><span>Input · hover</span><input className="guide-hover-control" defaultValue="Hover input"/></label><label className="guide-control"><span>Select · hover</span><select className="guide-hover-control" defaultValue="Hover sample"><option>Hover sample</option></select></label><label className="guide-control"><span>Textarea · hover</span><textarea className="guide-hover-control" defaultValue="Hover textarea"/></label>
        <label className="guide-control"><span>Input · focus</span><input className="guide-focus-sample" defaultValue="Focused input"/></label><label className="guide-control"><span>Select · focus</span><select className="guide-focus-sample" defaultValue="Focus sample"><option>Focus sample</option></select></label><label className="guide-control"><span>Textarea · focus</span><textarea className="guide-focus-sample" defaultValue="Focused textarea"/></label>
        <label className="guide-control"><span>Input · disabled</span><input disabled defaultValue="Unavailable"/></label><label className="guide-control"><span>Select · disabled</span><select disabled defaultValue="Unavailable"><option>Unavailable</option></select></label><label className="guide-control"><span>Textarea · disabled</span><textarea disabled defaultValue="Unavailable"/></label>
      </div></div>
      <div className="guide-component"><h3>Checkbox and toggle</h3><div className="guide-control-grid guide-inline-controls"><label><input type="checkbox" defaultChecked/> Checked · normal</label><label><input type="checkbox"/> Unchecked · normal</label><label><input className="guide-control-focus" type="checkbox"/> Focus</label><label className="guide-disabled-control"><input type="checkbox" disabled/> Disabled checkbox</label><label className="guide-toggle-control"><span>Enabled toggle</span><button className="toggle on" type="button" role="switch" aria-checked="true" aria-label="Enabled toggle"><span/></button></label><label className="guide-toggle-control"><span>Disabled toggle</span><button className="toggle" type="button" role="switch" aria-checked="false" aria-label="Disabled toggle" disabled><span/></button></label></div></div>
      <div className="guide-component"><h3>Tabs</h3><div className="tabs guide-tabs"><button className="active">Active</button><button>Normal</button><button className="guide-hover-sample">Hover</button><button className="guide-focus-tab">Focus</button><button disabled>Disabled</button></div></div>
      <div className="guide-component"><h3>Table</h3><div className="token-table-wrap"><table className="guide-data-table"><thead><tr><th>Candidate</th><th>Status</th><th>Score</th></tr></thead><tbody><tr><td>Jamie Morris · normal</td><td><Badge tone="success">Shortlisted</Badge></td><td>92%</td></tr><tr className="guide-hover-row"><td>Noah Kim · hover</td><td><Badge tone="info">In review</Badge></td><td>88%</td></tr><tr className="guide-focus-row" tabIndex={0}><td>Priya Shah · focus</td><td><Badge tone="warning">New</Badge></td><td>84%</td></tr><tr className="guide-disabled-row"><td>Daniel Okoro · disabled</td><td><Badge>Unavailable</Badge></td><td>—</td></tr></tbody></table></div></div>
      <div className="guide-component"><h3>Card and avatar</h3><div className="guide-card-grid"><article className="guide-card-sample"><span className="guide-state-label">Card · normal</span><h4>Candidate evaluation</h4><p>Clear surface, border, radius, and elevation.</p><div className="guide-avatar-row"><Avatar initials="JM" color="blue"/><Avatar initials="NK" color="purple"/><Avatar initials="PS" color="green"/></div></article><article className="guide-card-sample guide-card-hover"><span className="guide-state-label">Card · hover sample</span><h4>Interactive campaign card</h4><p>Subtle border and shadow change on hover.</p></article><article className="guide-card-sample guide-card-focus" tabIndex={0}><span className="guide-state-label">Card · focus sample</span><h4>Keyboard focus</h4><p>Use a visible ring only when the card is interactive.</p></article><article className="guide-card-sample guide-card-disabled" aria-disabled="true"><span className="guide-state-label">Card · disabled sample</span><h4>Unavailable card</h4><p>Muted presentation; no interaction.</p></article></div><p className="guide-lede">Avatars are static identity marks and have no hover, focus, or disabled state. Colour always accompanies initials.</p></div>
      <div className="guide-component"><h3>Empty, loading, and error states</h3><div className="guide-card-grid"><article className="guide-feedback guide-empty-sample"><span className="empty-icon"><Icon name="file"/></span><strong>Empty state · normal</strong><p>No records yet. Add or invite a teammate to get started.</p></article><article className="guide-feedback guide-loading-sample"><span className="guide-spinner" aria-hidden="true"/><strong>Loading state</strong><p>Loading workspace data…</p></article><article className="guide-feedback guide-error-sample" role="alert"><Icon name="close"/><strong>Error message</strong><p>Changes could not be saved. Try again.</p><Button variant="danger">Retry</Button></article></div><p className="guide-lede">These feedback states are informational rather than controls; add keyboard focus or disabled styling only to any interactive action they contain.</p></div>
      <div className="guide-component"><h3>Dialog</h3><div className="style-guide-dialog-demo" role="group" aria-label="Dialog component example"><div className="style-guide-dialog-heading"><span className="eyebrow">Team management</span><strong>Invite a team member</strong><p>Dialog surface, title, supporting text, and actions.</p></div><label className="guide-control"><span>Email · normal</span><input defaultValue="colleague@example.com"/></label><div className="component-row"><Button variant="secondary">Cancel</Button><Button>Generate invite link</Button><Button disabled>Submitting…</Button></div><div className="guide-dialog-state-row"><span>Focus action <Button className="guide-focus-sample">Focused</Button></span><span>Hover action <Button className="guide-hover-sample">Hover</Button></span></div></div></div>
    </section>
    <section className="style-guide-section" id="guide-interaction-states"><h2>Interaction states</h2><div className="guide-state-key"><span><i className="state-dot state-normal"/>Normal</span><span><i className="state-dot state-hover"/>Hover</span><span><i className="state-dot state-focus"/>Focus · 3px ring</span><span><i className="state-dot state-disabled"/>Disabled · non-interactive</span></div><p className="guide-lede">Use visible focus indication for keyboard users. Never rely on color alone for status; combine color with an icon and label. Disabled controls remain legible and cannot be activated.</p></section>
    <p className="guide-component-inventory"><strong>Component inventory:</strong> {componentNames.join(" · ")}</p>
  </div>;
}

function CandidateFormBlock({ block, onCoverLetterChange, onFileChange }: { block: FormBlock; onCoverLetterChange: (value: string) => void; onFileChange: (file: File | null) => void }) {
  const label = <span className="field-label">{block.label}{block.isRequired && <span aria-hidden="true"> *</span>}</span>;
  if (block.type === "divider") return <div className="form-divider"/>;
  if (block.type === "heading") return <div className="subheading"><h3>{block.label}</h3></div>;
  if (block.type === "fileUpload") return <label className="file-field">{label}<span className="file-input"><Icon name="upload" size={17}/><input type="file" accept={block.metadata.acceptedTypes || ".pdf,.doc,.docx"} required={block.isRequired} onChange={event => onFileChange(event.target.files?.[0] || null)}/><span>{block.placeholder}</span></span>{block.metadata.helpText && <span className="field-helper">{block.metadata.helpText}</span>}</label>;
  if (block.type === "dropdown") return <label className="field">{label}<select className="review-select" required={block.isRequired} defaultValue=""><option value="" disabled>{block.placeholder}</option>{block.options.map(option => <option key={option}>{option}</option>)}</select>{block.metadata.helpText && <span className="field-helper">{block.metadata.helpText}</span>}</label>;
  if (block.type === "multipleChoice") return <fieldset className="field"><legend>{label}</legend>{block.options.map(option => <label key={option}><input type="checkbox"/>{option}</label>)}</fieldset>;
  if (block.type === "datePicker") return <label className="field">{label}<input className="setting-input" type="date" required={block.isRequired}/>{block.metadata.helpText && <span className="field-helper">{block.metadata.helpText}</span>}</label>;
  return <label className="field">{label}<textarea required={block.isRequired} maxLength={block.metadata.maxLength} placeholder={block.placeholder} onChange={block.type === "richText" ? event => onCoverLetterChange(event.target.value) : undefined}/>{block.metadata.helpText && <span className="field-helper">{block.metadata.helpText}</span>}</label>;
}

function PublicConfiguredApplication({ campaign, blocks }: { campaign: DemoCampaign; blocks: FormBlock[] }) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitError, setSubmitError] = useState("");
  const { saveApplication } = useDemoApplications();
  const fileBlock = blocks.find(block => block.type === "fileUpload");
  const coverBlock = blocks.find(block => block.type === "richText");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (fileBlock?.isRequired && !cvFile) { setSubmitError(`Please complete "${fileBlock.label}" before submitting.`); return; }
    if (coverBlock?.isRequired && !coverLetter.trim()) { setSubmitError(`Please complete "${coverBlock.label}" before submitting.`); return; }
    if (!saveApplication({ id: `${Date.now()}`, jobTitle: campaign.title, company: "Orbit Systems", location: campaign.location, match: 92, initials: "OS", tone: "blue", submittedAt: new Date().toISOString(), status: "In review", cvFileName: cvFile?.name || "Not provided", coverLetter: coverLetter.trim() || "Not provided" })) {
      setSubmitError("We couldn’t save your application in this browser. Please try again.");
      return;
    }
    go("/candidate/application-confirmation");
  };
  return <div className="application-public"><header className="application-header"><div className="employer-brand"><span className="company-logo logo-blue">OS</span><span><strong>Orbit Systems</strong><small>Powered by RecruitFlow</small></span></div><span className="secure"><Icon name="lock" size={14}/> Secure application</span></header><main className="application-form-page"><div className="application-cover" aria-hidden="true"><img src={asset("assets/workplaces/office-3.jpg")} alt="" /><div className="application-cover-overlay"><img src={asset("assets/recruitflow-logo.png")} alt="" /></div></div><div className="role-intro"><Badge tone="success">Applications open</Badge><h1>{campaign.title}</h1><div className="job-meta"><span><Icon name="location" size={15}/>{campaign.location}</span><span><Icon name="briefcase" size={15}/>{campaign.workArrangement} · {campaign.employmentType}</span></div><CampaignRoleDescription campaign={campaign} className="role-description-display"/></div><div className="application-columns"><aside><h2>Your application</h2><div className="current"><span>1</span>Application form</div><p>Complete the fields below and submit your application to Orbit Systems.</p></aside><section className="form-page"><form onSubmit={submit}><div className="form-heading"><div><h2>Application form</h2><p>Share your experience and details with the hiring team.</p></div></div>{blocks.map(block => <CandidateFormBlock key={block.id} block={block} onCoverLetterChange={setCoverLetter} onFileChange={setCvFile}/>)}{submitError && <p className="demo-storage-error" role="alert">{submitError}</p>}<div className="form-footer"><span>{blocks.filter(block => block.type !== "heading" && block.type !== "divider").length} fields</span><Button type="submit">Submit application</Button></div></form></section></div></main></div>;
}

function PublicApplication({ campaignId }: { campaignId: string }) {
  const [step, setStep] = useState(0);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitError, setSubmitError] = useState("");
  const campaign = getCampaignDetails(campaignId);
  const { saveApplication } = useDemoApplications();
  const steps = ["Personal details", "Experience", "Documents", "Additional questions"];
  const next = () => { setSubmitError(""); setStep(current => Math.min(current + 1, steps.length - 1)); };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!campaign) return;
    if (step < steps.length - 1) { next(); return; }
    if (!cvFile) { setSubmitError("Please attach your CV before submitting."); return; }
    if (!coverLetter.trim()) { setSubmitError("Please add a short cover letter before submitting."); return; }
    if (!saveApplication({ id: `${Date.now()}`, jobTitle: campaign.title, company: "Orbit Systems", location: campaign.location, match: 92, initials: "OS", tone: "blue", submittedAt: new Date().toISOString(), status: "In review", cvFileName: cvFile.name, coverLetter: coverLetter.trim() })) {
      setSubmitError("We couldn’t save your application in this browser. Please try again.");
      return;
    }
    go("/candidate/application-confirmation");
  };
  if (!campaign) return <div className="public-page"><header className="public-header"><Logo/><Button variant="ghost" onClick={() => go("/login")}>Sign in</Button></header><main className="state-page"><div className="state-icon state-unavailable"><Icon name="clock" size={30}/></div><h1>Campaign not found</h1><p>This campaign is no longer available.</p><Button onClick={() => go("/candidate/jobs")}>Back to opportunities</Button></main></div>;
  const closingDatePassed = Boolean(campaign.closingDate && campaign.closingDate < new Date().toISOString().slice(0, 10));
  if (!campaign.published || campaign.paused || campaign.archived || closingDatePassed) {
    const unavailableTitle = campaign.paused ? "Applications are paused" : campaign.archived || closingDatePassed ? "Applications are closed" : "Applications are not open yet";
    const unavailableDescription = campaign.paused
      ? "This campaign is paused and is not accepting applications right now."
      : campaign.archived || closingDatePassed
        ? "This campaign is no longer accepting applications."
        : "This campaign is still being prepared by the hiring team. Please check back after it has been published.";
    return <div className="public-page"><header className="public-header"><Logo/><Button variant="ghost" onClick={() => go("/login")}>Sign in</Button></header><main className="state-page"><div className="state-icon state-unavailable"><Icon name="clock" size={30}/></div><h1>{unavailableTitle}</h1><p>{unavailableDescription}</p><Button onClick={() => go("/candidate/jobs")}>Back to opportunities</Button></main></div>;
  }
  if (campaign.formBlocks?.length) return <PublicConfiguredApplication campaign={campaign} blocks={campaign.formBlocks}/>;
  return <div className="application-public"><header className="application-header"><div className="employer-brand"><span className="company-logo logo-blue">OS</span><span><strong>Orbit Systems</strong><small>Powered by RecruitFlow</small></span></div><span className="secure"><Icon name="lock" size={14}/> Secure application</span></header><main className="application-form-page"><div className="application-cover" aria-hidden="true"><img src={asset("assets/workplaces/office-3.jpg")} alt="" /><div className="application-cover-overlay"><img src={asset("assets/recruitflow-logo.png")} alt="" /></div></div><div className="role-intro"><Badge tone="success">Applications open</Badge><h1>{campaign.title}</h1><div className="job-meta"><span><Icon name="location" size={15}/>{campaign.location}</span><span><Icon name="briefcase" size={15}/>{campaign.workArrangement} · {campaign.employmentType}</span></div><CampaignRoleDescription campaign={campaign} className="role-description-display"/></div><div className="application-columns"><aside><h2>Your application</h2>{steps.map((x, i) => <div className={i === step ? "current" : i < step ? "complete" : ""} key={x}><span>{i < step ? <Icon name="check" size={13}/> : i + 1}</span>{x}</div>)}</aside><section className="form-page"><form onSubmit={submit}><div className="form-heading"><div><h2>{steps[step]}</h2><p>{step === 0 ? "Tell the hiring team how they can reach you." : step === 1 ? "Share the experience that makes you a strong fit." : step === 2 ? "Add the documents the hiring team will review." : "A final note helps us understand your motivation."}</p></div></div>{step === 0 && <><div className="form-grid"><Field label="First name" placeholder="Your first name" required/><Field label="Last name" placeholder="Your last name" required/><Field label="Email address" icon="mail" placeholder="you@example.com" type="email" required/><Field label="Phone number" placeholder="+27" required/></div><Field label="Current location" icon="location" placeholder="City, country" required/></>}{step === 1 && <><Field label="Portfolio URL" icon="external" placeholder="https://yourportfolio.com" required/><label className="field"><span className="field-label">Years of experience</span><select className="review-select" required><option value="">Select an option</option><option>1–2 years</option><option>3–5 years</option><option>5+ years</option></select></label><label className="field"><span className="field-label">What kind of work energises you?</span><textarea placeholder="Tell us about the products or problems you enjoy working on…" required/></label></>}{step === 2 && <label className="file-field"><span className="field-label">CV or resume <span aria-hidden="true">*</span></span><span className="file-input"><Icon name="upload" size={17}/><input type="file" accept=".pdf,.doc,.docx" required={!cvFile} onChange={event => { setCvFile(event.target.files?.[0] || null); setSubmitError(""); }}/><span>{cvFile?.name || "Choose a PDF or Word document"}</span></span><span className="field-helper">Demo mode saves the filename only; your file is not uploaded.</span></label>}{step === 3 && <><label className="field"><span className="field-label">Cover letter <span aria-hidden="true">*</span></span><textarea value={coverLetter} onChange={event => { setCoverLetter(event.target.value); setSubmitError(""); }} placeholder={`Tell Orbit Systems why you’re excited about this role…`} required/></label><label className="field"><span className="field-label">When could you start?</span><select className="review-select"><option>Immediately</option><option>Within one month</option><option>Within three months</option></select></label></>}{submitError && <p className="demo-storage-error" role="alert">{submitError}</p>}<div className="form-footer"><span>Step {step + 1} of {steps.length}</span><div>{step > 0 && <Button variant="secondary" onClick={() => { setSubmitError(""); setStep(current => current - 1); }}>Back</Button>}{step < steps.length - 1 ? <Button type="submit">Continue <Icon name="arrow" size={15}/></Button> : <Button type="submit">Submit application</Button>}</div></div></form></section></div></main></div>;
}

function App() {
  const [path, setPath] = useState(getAppPath);
  useEffect(() => { const handler = () => setPath(getAppPath()); window.addEventListener("popstate", handler); return () => window.removeEventListener("popstate", handler); }, []);
  const content = useMemo(() => {
    if (path === "/" || path === "/login") return <AuthPage/>;
    if (path === "/approver/login") return <AuthPage approverLogin/>;
    if (path === "/create-account") return <AuthPage kind="signup"/>;
    if (path === "/forgot-password") return <AuthPage kind="forgot"/>;
    if (path === "/reset-password") return <AuthPage kind="reset"/>;
    if (path.includes("invitation")) return <AuthPage kind="invite"/>;
    if (path.includes("public/campaign")) return <AuthPage kind="apply"/>;
    if (path.includes("application-confirmation") && !path.startsWith("/candidate/")) return <AuthPage kind="thanks"/>;
    if (path.includes("access-review")) return <AuthPage kind="access"/>;
    if (path.includes("workspace-unavailable")) return <AuthPage kind="unavailable"/>;
    if (path === "/style-guide") return <StyleGuidePage/>;
    if (path.startsWith("/approver")) return <ApproverPage/>;
    if (path.startsWith("/candidate")) {
      let page: React.ReactNode = <CandidateDashboard/>;
      if (path.includes("/jobs")) page = <JobsPage/>;
      else if (path.includes("/application-confirmation")) page = <ApplicationConfirmationPage/>;
      else if (path.includes("/applications")) page = <ApplicationsPage/>;
      else if (path.includes("/settings/profile")) page = <ProfilePage/>;
      else if (path.includes("/subscription")) page = <BillingPage/>;
      return <AppShell mode="candidate" path={path}>{page}</AppShell>;
    }
    if (path.startsWith("/recruiter")) {
      let page: React.ReactNode = <RecruiterDashboard/>;
      if (path === "/recruiter/campaigns") page = <CampaignsPage/>;
      else if (path === "/recruiter/campaigns/new") page = <CampaignEditor campaignId="new"/>;
      else if (/^\/recruiter\/campaigns\/[^/]+\/bulk-upload$/.test(path)) page = <CampaignBulkUploadPage campaignId={path.split("/").slice(-2)[0]}/>;
      else if (/^\/recruiter\/campaigns\/[^/]+\/edit$/.test(path)) page = <CampaignEditor campaignId={path.split("/").slice(-2)[0]}/>;
      else if (/^\/recruiter\/campaigns\/[^/]+$/.test(path)) page = <CampaignWorkspace campaignId={path.split("/").pop() || ""}/>;
      else if (path.includes("/candidates/campaign")) page = <CandidatesPage campaign/>;
      else if (path === "/recruiter/candidates") page = <CandidatesPage/>;
      else if (path.includes("/evaluations")) page = <EvaluationsPage/>;
      else if (path.includes("/settings/team")) page = <SettingsPage/>;
      else if (path.includes("/settings/business")) page = <SettingsPage business/>;
      return <AppShell mode="recruiter" path={path} hideTopbar={path.includes("/bulk-upload") || path.endsWith("/edit")}>{page}</AppShell>;
    }
    return <AuthPage kind="404"/>;
  }, [path]);
  return <div className="page-transition" key={path}>{content}</div>;
}

export default App;
