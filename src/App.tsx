import { useEffect, useMemo, useState } from "react";

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

function Button({ children, variant = "primary", icon, onClick, className = "", type = "button" }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconName; onClick?: () => void; className?: string; type?: "button" | "submit";
}) {
  return <button type={type} className={`btn btn-${variant} ${className}`} onClick={onClick}>{icon && <Icon name={icon} size={16}/>}<span>{children}</span></button>;
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "success" | "warning" | "danger" | "info" | "neutral" }) {
  return <span className={`badge badge-${tone}`}><span className="badge-dot"/>{children}</span>;
}

function Avatar({ initials, color = "blue", size = "md" }: { initials: string; color?: string; size?: "sm" | "md" | "lg" }) {
  return <span className={`avatar avatar-${color} avatar-${size}`}>{initials}</span>;
}

function Field({ label, placeholder, icon, type = "text", helper, required = false, minLength, onChange }: { label: string; placeholder?: string; icon?: IconName; type?: string; helper?: string; required?: boolean; minLength?: number; onChange?: React.ChangeEventHandler<HTMLInputElement> }) {
  return <label className="field"><span className="field-label">{label}</span><span className="input-wrap">{icon && <Icon name={icon} size={17}/>}<input type={type} placeholder={placeholder} required={required} minLength={minLength} onChange={onChange}/>{type === "password" && <Icon name="eye" size={17}/>}</span>{helper && <span className="field-helper">{helper}</span>}</label>;
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
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Logo() {
  return <button className="logo" onClick={() => go("/recruiter")}><span className="brand-symbol"><img src={asset("assets/recruitflow-logo.png")} alt="" /></span><span>RecruitFlow</span></button>;
}

function AppShell({ children, mode, path }: { children: React.ReactNode; mode: "recruiter" | "candidate"; path: string }) {
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
      <div className="sidebar-footer"><div className="account-row"><Avatar initials={mode === "recruiter" ? "SO" : "AM"} color={mode === "recruiter" ? "green" : "purple"} size="sm"/><span className="account-details"><strong>{mode === "recruiter" ? "Sophie Okafor" : "Alex Morgan"}</strong><small>{mode === "recruiter" ? "Admin" : "alex@example.com"}</small></span><button className="account-signout" onClick={logOut} aria-label="Sign out" title="Sign out"><Icon name="logOut" size={17}/></button></div></div>
    </aside>
    {mobileOpen && <button className="scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation"/>}
    <main className="main">
      <header className="topbar">
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

const campaigns = [
  ["Senior Product Designer", "Design", "Active", "41", "12 Mar 2025", "blue"],
  ["Frontend Engineer", "Engineering", "Active", "86", "8 Mar 2025", "purple"],
  ["Customer Success Lead", "Operations", "Active", "29", "4 Mar 2025", "green"],
  ["Growth Marketing Manager", "Marketing", "Draft", "—", "Not published", "amber"],
  ["Finance Operations Analyst", "Finance", "Archived", "54", "10 Jan 2025", "gray"],
];

function Toolbar({ placeholder = "Search by name or email…" }: { placeholder?: string }) {
  return <div className="toolbar"><label className="search"><Icon name="search"/><input aria-label="Search" placeholder={placeholder}/><kbd>⌘ K</kbd></label><Button variant="secondary" icon="filter">Filters</Button><Button variant="secondary" icon="calendar">Date</Button></div>;
}

function CampaignsPage() {
  const [tab, setTab] = useState("All");
  const shown = campaigns.filter(c => tab === "All" || c[2] === tab.slice(0, -1));
  return <div><PageHeader eyebrow="Campaign management" title="Campaigns" description="Create, publish and manage your recruitment campaigns." action={<Button icon="plus" onClick={() => go("/recruiter/campaigns/new")}>Create campaign</Button>}/>
    <div className="tabs">{["All", "Actives", "Drafts", "Archived"].map(t => <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}<span>{t === "All" ? 5 : t === "Actives" ? 3 : 1}</span></button>)}</div>
    <Toolbar placeholder="Search campaigns…"/>
    <section className="surface list-surface"><div className="table-wrap"><table><thead><tr><th>Campaign</th><th>Status</th><th>Applications</th><th>Published</th><th/></tr></thead><tbody>{shown.map(c => <tr key={c[0]} className="clickable" onClick={() => go("/recruiter/campaigns/1")}><td><span className="campaign-title"><span className={`job-icon job-${c[5]}`}><Icon name="briefcase"/></span><span><strong>{c[0]}</strong><small>{c[1]} · Cape Town, Hybrid</small></span></span></td><td><Badge tone={c[2] === "Active" ? "success" : c[2] === "Draft" ? "warning" : "neutral"}>{c[2]}</Badge></td><td><strong>{c[3]}</strong></td><td className="muted">{c[4]}</td><td><button className="icon-btn"><Icon name="dots"/></button></td></tr>)}</tbody></table></div></section>
  </div>;
}

function CandidatesPage({ campaign = false }: { campaign?: boolean }) {
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
  const candidateRows = [...applicants, ...applicants.slice(0, 2), ...demoCandidates];
  return <div><PageHeader eyebrow={campaign ? "Campaign / Senior Product Designer" : "Candidate inbox"} title={campaign ? "Senior Product Designer" : "All candidates"} description={campaign ? "Review and move applicants through your hiring pipeline." : "Review candidates across all active recruitment campaigns."} action={<Button variant="secondary" icon="external">{campaign ? "View campaign" : "Export"}</Button>}/>
    {campaign && <div className="funnel-strip">{[["Applications", "41"], ["Qualified", "24"], ["Shortlisted", "9"], ["Interview", "4"]].map((x, i) => <div key={x[0]}><span className={`funnel-dot f-${i}`}/><span><small>{x[0]}</small><strong>{x[1]}</strong></span></div>)}</div>}
    <div className="tabs"><button className="active">All <span>284</span></button><button>New <span>12</span></button><button>In review <span>38</span></button><button>Shortlisted <span>24</span></button></div>
    <Toolbar/>
    {error && <p className="demo-storage-error" role="alert">{error}</p>}
    <section className="surface list-surface"><div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Campaign</th><th>AI evaluation</th><th>Status</th><th>Applied</th><th/></tr></thead><tbody>{candidateRows.map((a, i) => <tr className="candidate-row" key={a.id || `${a.name}-${i}`} onClick={() => setSelectedCandidate(a)}><td><span className="person"><Avatar initials={a.initials} color={a.color}/><span><strong>{a.name}</strong><small>{a.email}</small></span></span></td><td>{a.role}</td><td><span className="score"><i style={{ "--score": `${a.score}%` } as React.CSSProperties}/><strong>{a.score}%</strong><small>AI-assisted</small></span></td><td><Badge tone={a.tone}>{a.status}</Badge></td><td className="muted">{a.time}</td><td><Button variant="ghost" onClick={event => { event.stopPropagation(); setSelectedCandidate(a); }}>Review <Icon name="arrow" size={14}/></Button></td></tr>)}</tbody></table></div></section>
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

function CampaignEditor() {
  const [section, setSection] = useState("Campaign details");
  const [roleDescription, setRoleDescription] = useState("");
  const sections = ["Campaign details", "Role description", "Application form"];
  return <div><PageHeader eyebrow="Campaigns / New campaign" title="Create campaign" description="Set up the role, application form and publishing details." action={<><span className="save-status"><Icon name="check" size={15}/> All changes saved</span><Button variant="secondary">Preview</Button><Button>Publish campaign</Button></>}/>
    <nav className="campaign-stepper" aria-label="Campaign setup progress">{sections.map((s, i) => <button className={section === s ? "active" : ""} key={s} onClick={() => setSection(s)}><span>{i + 1}</span><strong>{s}</strong>{i < sections.length - 1 && <i aria-hidden="true"/>}</button>)}</nav>
    <div className={`editor-layout ${section === "Application form" ? "application-form-layout" : ""}`}>
      <section className={`form-page ${section === "Application form" ? "application-form-page-shell" : ""}`}><div className="form-heading"><span className="step-icon"><Icon name="briefcase"/></span><div><h2>{section}</h2><p>{section === "Campaign details" ? "Start with the essential information candidates need." : "Configure this section of your campaign."}</p></div></div>
        {section === "Campaign details" ? <>
          <div className="form-grid"><Field label="Campaign title" placeholder="e.g. Senior Product Designer"/><Field label="Department" placeholder="Select a department"/><Field label="Location" icon="location" placeholder="e.g. Cape Town"/><Field label="Work arrangement" placeholder="Select arrangement"/></div>
          <label className="field field-full"><span className="field-label">Short summary</span><textarea placeholder="Share a concise overview of this opportunity…"/><span className="field-helper">Help candidates quickly understand the role. 0 / 240</span></label>
          <div className="form-divider"/>
          <div className="subheading"><h3>Employment details</h3><p>Optional details help candidates understand the opportunity.</p></div>
          <div className="form-grid"><Field label="Employment type" placeholder="Full-time"/><Field label="Experience level" placeholder="Senior"/></div>
          <div className="form-footer"><Button variant="secondary">Save draft</Button><Button onClick={() => setSection("Role description")}>Continue to role description <Icon name="arrow" size={15}/></Button></div>
        </> : section === "Role description" ? <>
          <RichTextEditor value={roleDescription} onChange={setRoleDescription}/>
          <div className="form-footer"><Button variant="secondary" onClick={() => setSection("Campaign details")}>Back</Button><Button onClick={() => setSection("Application form")}>Continue to application form <Icon name="arrow" size={15}/></Button></div>
        </> : section === "Application form" ? <ApplicationFormBuilder onBack={() => setSection("Role description")}/> : <div className="empty-editor-step"><Icon name="check" size={24}/><h3>{section}</h3><p>This section is ready to configure next.</p></div>}
      </section></div>
  </div>;
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const applyFormat = (command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue);
    const editor = document.querySelector<HTMLElement>("[contenteditable='true']");
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
      ].map(([command, label, title]) => <button type="button" key={command} title={title} aria-label={title} className={`format-${command}`} onMouseDown={event => { event.preventDefault(); applyFormat(command); }}>{label}</button>)}
    </div>
    <div className="rich-text-content" contentEditable role="textbox" aria-multiline="true" data-placeholder="Describe the role, responsibilities, and what success looks like…" onInput={event => onChange(event.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: value }}/>
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

function ApplicationFormBuilder({ onBack }: { onBack: () => void }) {
  const [blocks, setBlocks] = useState<FormBlock[]>([createFormBlock("heading", 0), createFormBlock("shortAnswer", 1), createFormBlock("fileUpload", 2)]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [brandColor, setBrandColor] = useState("#615cf4");
  const [previewFont, setPreviewFont] = useState("DM Sans");
  const [bannerImage, setBannerImage] = useState("");
  const [darkTheme, setDarkTheme] = useState(false);
  const [copied, setCopied] = useState(false);
  const selectedBlock = blocks.find(block => block.id === selectedId);
  const formUrl = `${window.location.origin}/public/campaign/1`;

  const addBlock = (type: FormBlockType) => {
    const next = createFormBlock(type, blocks.length);
    setBlocks(current => [...current, next]);
    setSelectedId(next.id);
  };
  const updateBlock = (id: string, changes: Partial<FormBlock>) => setBlocks(current => current.map(block => block.id === id ? { ...block, ...changes } : block));
  const updateMetadata = (id: string, changes: FormBlock["metadata"]) => setBlocks(current => current.map(block => block.id === id ? { ...block, metadata: { ...block.metadata, ...changes } } : block));
  const moveBlock = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setBlocks(current => {
      const next = [...current];
      const from = next.findIndex(block => block.id === fromId);
      const to = next.findIndex(block => block.id === toId);
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  return <div className="form-builder" style={{ "--builder-brand": brandColor } as React.CSSProperties}>
    <div className="builder-header"><div><span className="eyebrow">Campaigns / New campaign / Application form</span><h2>Application Form Builder</h2><p>Build a clear, inclusive application form for candidates.</p></div><div className="builder-actions"><Button variant="secondary" onClick={() => setBlocks([])}>Reset</Button><Button variant="secondary">Save draft</Button><button className="theme-toggle" onClick={() => setDarkTheme(!darkTheme)} aria-label="Toggle preview theme"><Icon name={darkTheme ? "sparkles" : "lock"} size={15}/>{darkTheme ? "Light" : "Theme"}</button></div></div>
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
            <button className="icon-btn delete-block" onClick={event => { event.stopPropagation(); setBlocks(current => current.filter(item => item.id !== block.id)); if (selectedId === block.id) setSelectedId(null); }} aria-label={`Delete ${block.label}`}><Icon name="close" size={16}/></button>
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
        <div className={`preview-stage ${viewport} ${darkTheme ? "preview-dark" : ""}`}><div className={`preview-device ${viewport}-device`} aria-label={viewport === "phone" ? "Samsung Galaxy S26 Ultra preview" : viewport === "tablet" ? "11-inch iPad A16 preview" : "Desktop preview"}>{viewport === "phone" && <><span className="phone-side-key phone-volume-key"/><span className="phone-side-key phone-power-key"/></>}{viewport === "tablet" && <span className="tablet-power-key"/>}<div className="candidate-preview" style={{ "--preview-brand": brandColor, "--preview-font": previewFont } as React.CSSProperties}><div className="preview-brand" style={bannerImage ? { backgroundImage: `linear-gradient(90deg, rgba(22, 25, 55, .72), rgba(22, 25, 55, .12)), url(${bannerImage})` } : undefined}><span className="preview-logo">N</span><span><strong>Northstar Labs</strong><small>Technology · Senior Product Designer</small></span></div><div className="preview-body"><Badge tone="success">Application open</Badge><h2>Senior Product Designer</h2><p>Tell us a little about yourself and your experience.</p>{blocks.map(block => <PreviewBlock key={block.id} block={block}/>)}</div></div></div></div>
        <div className="branding-controls"><div><h4>Theme & branding</h4><p>Customize the candidate experience.</p></div><label className="color-control"><span>Primary color</span><input type="color" value={brandColor} onChange={event => setBrandColor(event.target.value)}/></label><label className="font-control"><span>Font</span><select value={previewFont} onChange={event => setPreviewFont(event.target.value)}><option>DM Sans</option><option>Manrope</option><option>Georgia</option></select></label><label className="banner-control"><span>Header banner</span><span className="banner-upload"><Icon name="upload" size={13}/><span>Change image</span><input type="file" accept="image/*" onChange={event => { const file = event.target.files?.[0]; if (file) setBannerImage(URL.createObjectURL(file)); }} /></span></label></div>
      </section>
    </div>
    <div className="builder-footer"><Button variant="secondary" onClick={onBack}>Back to role description</Button><div className="form-url"><span><Icon name="external" size={14}/><strong>Candidate form URL</strong></span><input readOnly value={formUrl} aria-label="Candidate form URL"/><button onClick={() => { navigator.clipboard?.writeText(formUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }} aria-label="Copy candidate form URL">{copied ? "Copied" : "Copy"}</button></div></div>
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
  const [enabled, setEnabled] = useState(true);
  return <div className="narrow-page"><PageHeader eyebrow="Workspace settings" title="AI evaluations" description="Set consistent criteria to help your team review applications. AI supports — it never replaces — human judgement." action={<Button>Save changes</Button>}/>
    <div className="notice"><Icon name="sparkles"/><div><strong>Human decisions come first</strong><p>Evaluation scores are recommendations. Your team remains responsible for every recruitment decision.</p></div></div>
    <section className="settings-section"><div className="setting-row"><div><h2>Candidate evaluations</h2><p>Automatically evaluate new applications against your workspace criteria.</p></div><button className={`toggle ${enabled ? "on" : ""}`} onClick={() => setEnabled(!enabled)} aria-label="Toggle evaluations"><span/></button></div>
      <div className="form-divider"/><label className="field field-full"><span className="field-label">Base evaluation criteria</span><textarea className="tall" defaultValue={"Evaluate each candidate against the role requirements, relevant experience, demonstrated skills, and application quality. Identify strengths, potential gaps, and areas for human review."}/><span className="field-helper">Applied to every active campaign unless campaign-specific instructions are added.</span></label>
      <label className="field field-full"><span className="field-label">Custom workspace instructions</span><textarea className="tall" placeholder="Add context unique to your organisation…"/><span className="field-helper">Avoid including sensitive personal attributes or discriminatory criteria.</span></label>
    </section>
  </div>;
}

function SettingsPage({ business = false }: { business?: boolean }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<Array<{ initials: string; name: string; email: string; role: string; link: string }>>([]);
  const addInvitation = (invite: { initials: string; name: string; email: string; role: string; link: string }) => setPendingInvites(current => [...current, invite]);
  return <div className="narrow-page"><PageHeader eyebrow="Settings" title={business ? "Business profile" : "Team management"} description={business ? "Keep your organisation information and employer brand up to date." : "Manage workspace access, roles and pending invitations."} action={<Button icon={business ? undefined : "plus"} onClick={() => !business && setInviteOpen(true)}>{business ? "Save changes" : "Invite member"}</Button>}/>
    {business ? <section className="settings-section">
      <div className="subheading"><h2>Organisation profile</h2><p>This information is visible on your public campaigns.</p></div>
      <div className="brand-upload"><div className="logo-preview">N</div><div><strong>Organisation logo</strong><p>PNG, JPG or SVG. Recommended 400 × 400.</p><Button variant="secondary" icon="upload">Change logo</Button></div></div>
      <div className="form-grid"><Field label="Organisation name" placeholder="Northstar Labs"/><Field label="Industry" placeholder="Technology"/><Field label="Company website" placeholder="https://northstarlabs.com"/><Field label="Company size" placeholder="51–200 employees"/></div>
      <label className="field field-full"><span className="field-label">Company description</span><textarea defaultValue="We build thoughtful digital products that help ambitious teams do their best work."/></label>
      <div className="form-divider"/><div className="subheading"><h2>Business address</h2><p>Used for account and legal records.</p></div>
      <div className="form-grid"><Field label="Address line" placeholder="12 Loop Street"/><Field label="City" placeholder="Cape Town"/><Field label="Postal code" placeholder="8001"/><Field label="Country" placeholder="South Africa"/></div>
    </section> : <section className="surface team-list">
      <div className="team-summary"><div><span className="summary-icon"><Icon name="users"/></span><span><strong>4 active members</strong><small>{2 + pendingInvites.length} pending invitations</small></span></div><label className="search compact"><Icon name="search"/><input placeholder="Search members…"/></label></div>
      {[
        ["SO", "Sophie Okafor", "sophie@northstarlabs.com", "Admin", "green", "Active"],
        ["LM", "Luca Meyer", "luca@northstarlabs.com", "Recruiter", "purple", "Active"],
        ["AT", "Amina Toure", "amina@northstarlabs.com", "Recruiter", "blue", "Active"],
        ["JR", "Jonas Reed", "jonas@northstarlabs.com", "Hiring manager", "amber", "Active"],
      ].map(m => <div className="team-row" key={m[1]}><span className="person"><Avatar initials={m[0]} color={m[4]}/><span><strong>{m[1]}</strong><small>{m[2]}</small></span></span><span className="role">{m[3]}</span><Badge tone="success">{m[5]}</Badge><button className="icon-btn"><Icon name="dots"/></button></div>)}
      <div className="pending-title">Pending invitations</div>
      <div className="team-row"><span className="person"><Avatar initials="KM" color="gray"/><span><strong>k.moyo@example.com</strong><small>Invited 2 days ago</small></span></span><span className="role">Recruiter</span><Badge tone="warning">Pending</Badge><Button variant="ghost">Copy link</Button></div>
      {pendingInvites.map(invite => <div className="team-row" key={invite.link}><span className="person"><Avatar initials={invite.initials} color="purple"/><span><strong>{invite.name}</strong><small>{invite.email}</small></span></span><span className="role">{invite.role}</span><Badge tone="warning">Pending</Badge><Button variant="ghost" onClick={() => navigator.clipboard?.writeText(invite.link)}>Copy link</Button></div>)}
    </section>}
    {!business && inviteOpen && <InviteMemberDialog onClose={() => setInviteOpen(false)} onInvite={addInvitation}/>}
  </div>;
}

function InviteMemberDialog({ onClose, onInvite }: { onClose: () => void; onInvite: (invite: { initials: string; name: string; email: string; role: string; link: string }) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Recruiter");
  const [inviteLink, setInviteLink] = useState("");
  const submit = (event: React.FormEvent) => {
   event.preventDefault();
   const link = `${window.location.origin}/invitation/${Math.random().toString(36).slice(2, 10)}`;
   setInviteLink(link);
   onInvite({ initials: name.trim().split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "NM", name: name.trim(), email: email.trim(), role, link });
  };
  useEffect(() => {
   const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
   document.addEventListener("keydown", handleKeyDown);
   return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  return <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
   <section className="invite-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-member-title">
     <div className="dialog-header"><div><span className="eyebrow">Team management</span><h2 id="invite-member-title">Invite a team member</h2><p>Enter their details and we’ll create a secure invitation link.</p></div><button className="icon-btn" onClick={onClose} aria-label="Close invite dialog"><Icon name="close"/></button></div>
     {!inviteLink ? <form onSubmit={submit}><label className="field"><span className="field-label">Full name</span><input className="setting-input" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Morgan Lee" required/></label><label className="field"><span className="field-label">Email address</span><input className="setting-input" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="morgan@example.com" required/></label><label className="field"><span className="field-label">Role</span><select className="review-select" value={role} onChange={event => setRole(event.target.value)}><option>Recruiter</option><option>Hiring manager</option><option>Admin</option></select></label><div className="dialog-footer"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Generate invite link</Button></div></form> : <div className="invite-created"><span className="download-icon"><Icon name="check" size={24}/></span><h3>Invitation ready</h3><p>{name} has been added to pending invitations.</p><div className="form-url invite-url"><input readOnly value={inviteLink} aria-label="Generated invite link"/><button onClick={() => navigator.clipboard?.writeText(inviteLink)}>Copy</button></div><div className="dialog-footer"><Button variant="secondary" onClick={onClose}>Done</Button></div></div>}
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
  const [applicationJob, setApplicationJob] = useState<typeof jobs[0] | null>(null);
  const { applications, error, saveApplication } = useDemoApplications();
  const appliedJobTitles = new Set(applications.map(application => application.jobTitle));
  return <div><PageHeader eyebrow="Opportunities" title="Find your next role" description="Explore opportunities matched to your skills and preferences."/>
    <div className="job-search-bar"><label className="search"><Icon name="search"/><input placeholder="Job title, skill or company"/></label><label className="search location-search"><Icon name="location"/><input placeholder="Location"/></label><Button>Search jobs</Button></div>
    <div className="filter-row"><Button variant="secondary" icon="filter">All filters</Button>{["Remote", "Hybrid", "Design", "Full-time"].map(f => <button className="filter-pill" key={f}>{f}<Icon name="close" size={13}/></button>)}<span className="results-count">48 opportunities</span></div>
    {error && <p className="demo-storage-error" role="alert">{error}</p>}
    <div className="jobs-layout"><div className="results-list">{jobs.map((j, i) => <JobCard job={j} key={j.title} selected={selected === i} applied={appliedJobTitles.has(j.title)} onClick={() => setSelected(i)} onApply={() => setApplicationJob(j)}/>)}</div><aside className="job-detail"><div className="job-detail-photo" key={jobs[selected].image}><img src={jobs[selected].image} alt="" /></div><div className="detail-header"><span className={`company-logo logo-${jobs[selected].tone}`}>{jobs[selected].initials}</span><button className="icon-btn"><Icon name="bookmark"/></button></div><h2>{jobs[selected].title}</h2><p className="company">{jobs[selected].company}</p><div className="job-meta"><span><Icon name="location" size={14}/>{jobs[selected].location}</span><span><Icon name="briefcase" size={14}/>{jobs[selected].mode}</span></div><div className="match-banner"><Icon name="sparkles"/><span><strong>{jobs[selected].match}% profile match</strong><small>Your skills align strongly with this role.</small></span></div><Button className="full" disabled={appliedJobTitles.has(jobs[selected].title)} variant={appliedJobTitles.has(jobs[selected].title) ? "secondary" : "primary"} onClick={() => setApplicationJob(jobs[selected])}>{appliedJobTitles.has(jobs[selected].title) ? "Application sent" : "Apply now"}</Button><div className="detail-copy"><h3>About the role</h3><p>Join a collaborative product team shaping thoughtful digital experiences. You’ll partner closely with product, engineering and research to solve meaningful customer problems.</p><h3>What you’ll bring</h3><ul><li>5+ years of product design experience</li><li>Strong portfolio of end-to-end product work</li><li>Experience with accessible design systems</li></ul></div></aside></div>
    {applicationJob && <ApplicationDialog job={applicationJob} onClose={() => setApplicationJob(null)} onSubmit={application => {
      if (!saveApplication(application)) return false;
      go("/candidate/application-confirmation");
      return true;
    }}/>}
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

function AuthPage({ kind = "login" }: { kind?: "login" | "signup" | "forgot" | "reset" | "invite" | "apply" | "thanks" | "access" | "unavailable" | "404" }) {
  const [persona, setPersona] = useState("candidate");
  if (kind === "404" || kind === "access" || kind === "unavailable" || kind === "thanks") {
    const data = kind === "404" ? ["404", "This page took a different path", "We couldn’t find the page you’re looking for.", "Go to overview"] : kind === "thanks" ? ["check", "Application received", "Your application has been submitted successfully. The employer will contact you if there is an update.", "Back to opportunities"] : kind === "access" ? ["clock", "Your access is under review", "Northstar Labs is reviewing your recruiter access. You can safely return later.", "Sign out"] : ["building", "No recruiter workspace available", "This account isn’t connected to an eligible organisation workspace yet.", "Return to sign in"];
    return <div className="public-page"><header className="public-header"><Logo/><Button variant="ghost" onClick={() => go("/login")}>Sign in</Button></header><main className="state-page"><div className={`state-icon state-${kind}`} >{data[0] === "404" ? <strong>404</strong> : <Icon name={data[0] as IconName} size={30}/>}</div><h1>{data[1]}</h1><p>{data[2]}</p><Button onClick={() => go(kind === "thanks" ? "/candidate/jobs" : kind === "404" ? "/candidate" : "/login")}>{data[3]}</Button>{kind === "unavailable" && <Button variant="ghost">Accept an organisation invitation</Button>}</main></div>;
  }
  if (kind === "apply") return <PublicApplication/>;
  const copy = kind === "signup" ? ["Create your account", "Join RecruitFlow to find your next opportunity or build your team.", "Create account"] : kind === "forgot" ? ["Reset your password", "Enter your email and we’ll send reset instructions if an account exists.", "Send reset link"] : kind === "reset" ? ["Choose a new password", "Create a strong password you don’t use elsewhere.", "Reset password"] : kind === "invite" ? ["Join Northstar Labs", "You’ve been invited to join the recruiter workspace as a Recruiter.", "Accept invitation"] : ["Welcome to RecruitFlow", "Sign in to continue to your workspace.", "Sign in"];
  return <div className={`auth-layout ${kind === "login" ? "auth-login" : ""}`}><aside className="auth-aside">{kind === "login" ? <>
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
    {(kind === "login" || kind === "signup") && <><div className="persona-switch"><button type="button" className={persona === "candidate" ? "active" : ""} onClick={() => setPersona("candidate")}><Icon name="user"/>Candidate</button><button type="button" className={persona === "recruiter" ? "active" : ""} onClick={() => setPersona("recruiter")}><Icon name="building"/>Recruiter</button></div>{kind === "login" && <p className="persona-message" role="status" aria-live="polite">You’re signing in as a {persona}.</p>}</>}
    {kind === "invite" && <div className="invite-card"><span className="org-icon">N</span><span><strong>Northstar Labs</strong><small>Recruiter workspace · Invited by Sophie</small></span></div>}
    <form onSubmit={e => { e.preventDefault(); if (kind === "signup") { const passwords = e.currentTarget.querySelectorAll<HTMLInputElement>('input[type="password"]'); passwords[1].setCustomValidity(""); if (passwords[0].value !== passwords[1].value) { passwords[1].setCustomValidity("Passwords must match."); passwords[1].reportValidity(); return; } } const target = kind === "login" || kind === "signup" ? `/${persona}` : kind === "invite" ? "/recruiter" : "/login"; if (kind === "login" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) { e.currentTarget.closest(".auth-layout")?.classList.add("auth-exiting"); window.setTimeout(() => go(target), 350); } else { go(target); } }}>
      {kind === "signup" && <Field label="Full name" icon="user" placeholder="Your name" required/>}
      {kind !== "reset" && <Field label="Email address" icon="mail" placeholder="you@example.com" type="email" required={kind === "signup"}/>}
      {(kind === "login" || kind === "signup" || kind === "reset" || kind === "invite") && <Field label={kind === "reset" ? "New password" : "Password"} icon="lock" placeholder="Enter your password" type="password" helper={kind === "reset" || kind === "signup" ? "Use at least 8 characters." : undefined} required={kind === "signup"} minLength={kind === "signup" ? 8 : undefined}/>}
      {(kind === "reset" || kind === "signup") && <Field label={kind === "signup" ? "Confirm password" : "Confirm new password"} icon="lock" placeholder="Repeat your password" type="password" required={kind === "signup"} minLength={kind === "signup" ? 8 : undefined} onChange={kind === "signup" ? e => e.currentTarget.setCustomValidity("") : undefined}/>}
      {kind === "login" && <div className="form-options"><label><input type="checkbox"/>Remember me</label><button type="button" onClick={() => go("/forgot-password")}>Forgot password?</button></div>}
      <Button type="submit" className="full">{copy[2]}</Button>
    </form>
    {kind === "login" && <><div className="or"><span/>or continue with<span/></div><Button variant="secondary" className="full"><b className="google-g">G</b>Continue with Google</Button><p className="auth-bottom">New to RecruitFlow? <button onClick={() => go("/create-account")}>Create an account</button></p></>}
    {kind === "signup" && <p className="auth-bottom">Already have an account? <button onClick={() => go("/login")}>Sign in</button></p>}
    {kind !== "login" && <button className="back-link" onClick={() => go("/login")}>← Back to sign in</button>}
  </div></main></div>;
}

function PublicApplication() {
  return <div className="application-public"><header className="application-header"><div className="employer-brand"><span className="company-logo logo-blue">OS</span><span><strong>Orbit Systems</strong><small>Powered by RecruitFlow</small></span></div><span className="secure"><Icon name="lock" size={14}/> Secure application</span></header><main className="application-form-page"><div className="application-cover" aria-hidden="true"><img src={asset("assets/workplaces/office-3.jpg")} alt="" /><div className="application-cover-overlay"><img src={asset("assets/recruitflow-logo.png")} alt="" /></div></div><div className="role-intro"><Badge tone="success">Applications open</Badge><h1>Senior Product Designer</h1><div className="job-meta"><span><Icon name="location" size={15}/>Cape Town</span><span><Icon name="briefcase" size={15}/>Hybrid · Full-time</span></div><p>Help us shape clear, useful experiences for thousands of growing teams.</p></div><div className="application-columns"><aside><h2>Your application</h2>{["Personal details", "Experience", "Documents", "Additional questions"].map((x, i) => <div className={i === 0 ? "current" : ""} key={x}><span>{i + 1}</span>{x}</div>)}</aside><section className="form-page"><div className="form-heading"><div><h2>Personal details</h2><p>Tell the hiring team how they can reach you.</p></div></div><div className="form-grid"><Field label="First name" placeholder="Your first name"/><Field label="Last name" placeholder="Your last name"/><Field label="Email address" icon="mail" placeholder="you@example.com"/><Field label="Phone number" placeholder="+27"/></div><Field label="Current location" icon="location" placeholder="City, country"/><div className="form-footer"><span>Step 1 of 4</span><Button>Continue <Icon name="arrow" size={15}/></Button></div></section></div></main></div>;
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => { const handler = () => setPath(window.location.pathname); window.addEventListener("popstate", handler); return () => window.removeEventListener("popstate", handler); }, []);
  const content = useMemo(() => {
    if (path === "/" || path === "/login") return <AuthPage/>;
    if (path === "/create-account") return <AuthPage kind="signup"/>;
    if (path === "/forgot-password") return <AuthPage kind="forgot"/>;
    if (path === "/reset-password") return <AuthPage kind="reset"/>;
    if (path.includes("invitation")) return <AuthPage kind="invite"/>;
    if (path.includes("public/campaign")) return <AuthPage kind="apply"/>;
    if (path.includes("application-confirmation") && !path.startsWith("/candidate/")) return <AuthPage kind="thanks"/>;
    if (path.includes("access-review")) return <AuthPage kind="access"/>;
    if (path.includes("workspace-unavailable")) return <AuthPage kind="unavailable"/>;
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
      else if (/\/recruiter\/campaigns\/.+/.test(path)) page = <CampaignEditor/>;
      else if (path.includes("/candidates/campaign")) page = <CandidatesPage campaign/>;
      else if (path === "/recruiter/candidates") page = <CandidatesPage/>;
      else if (path.includes("/evaluations")) page = <EvaluationsPage/>;
      else if (path.includes("/settings/team")) page = <SettingsPage/>;
      else if (path.includes("/settings/business")) page = <SettingsPage business/>;
      return <AppShell mode="recruiter" path={path}>{page}</AppShell>;
    }
    return <AuthPage kind="404"/>;
  }, [path]);
  return <div className="page-transition" key={path}>{content}</div>;
}

export default App;
