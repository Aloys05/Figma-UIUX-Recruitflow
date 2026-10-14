import { useEffect, useMemo, useState } from "react";

type IconName =
  | "home" | "briefcase" | "users" | "sparkles" | "settings" | "search"
  | "bell" | "plus" | "arrow" | "dots" | "check" | "clock" | "chevron"
  | "filter" | "file" | "target" | "user" | "logOut" | "menu" | "close"
  | "building" | "card" | "lock" | "mail" | "eye" | "upload" | "location"
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

function Field({ label, placeholder, icon, type = "text", helper }: { label: string; placeholder?: string; icon?: IconName; type?: string; helper?: string }) {
  return <label className="field"><span className="field-label">{label}</span><span className="input-wrap">{icon && <Icon name={icon} size={17}/>}<input type={type} placeholder={placeholder}/>{type === "password" && <Icon name="eye" size={17}/>}</span>{helper && <span className="field-helper">{helper}</span>}</label>;
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
  return <button className="logo" onClick={() => go("/recruiter")}><span className="logo-mark"><span/><span/><span/></span><span>RecruitFlow</span></button>;
}

function AppShell({ children, mode, path }: { children: React.ReactNode; mode: "recruiter" | "candidate"; path: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = mode === "recruiter" ? recruiterNav : candidateNav;
  const current = (p: string) => p === `/${mode}` ? path === p : path.startsWith(p);
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-top"><Logo/><button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><Icon name="close"/></button></div>
      {mode === "recruiter" ? <div className="org-switch"><span className="org-icon">N</span><span><strong>Northstar Labs</strong><small>Recruiter workspace</small></span><Icon name="chevron" size={15}/></div> : <div className="profile-mini"><Avatar initials="AM" color="purple"/><span><strong>Alex Morgan</strong><small>Candidate account</small></span></div>}
      <nav className="main-nav" aria-label="Primary">
        <span className="nav-label">Workspace</span>
        {nav.map(item => <button key={item.path} className={`nav-item ${current(item.path) ? "active" : ""}`} onClick={() => { go(item.path); setMobileOpen(false); }}><Icon name={item.icon}/><span>{item.label}</span>{item.label === "My profile" && <span className="nav-progress">75%</span>}</button>)}
        {mode === "recruiter" && <div className="nav-settings">
          <button className={`nav-item ${path.includes("/settings/") ? "active" : ""}`} onClick={() => go("/recruiter/settings/team")}><Icon name="settings"/><span>Settings</span><Icon name="chevron" size={14}/></button>
          {(path.includes("/settings/") || true) && <div className="subnav">
            <button className={path.endsWith("/team") ? "active" : ""} onClick={() => go("/recruiter/settings/team")}>Team</button>
            <button className={path.endsWith("/business") ? "active" : ""} onClick={() => go("/recruiter/settings/business")}>Business</button>
          </div>}
        </div>}
      </nav>
      {mode === "candidate" && <div className="readiness-card">
        <div className="readiness-head"><span>Profile readiness</span><strong>75%</strong></div>
        <div className="progress"><span style={{ width: "75%" }}/></div>
        <p>Add work experience to improve your matches.</p>
        <button onClick={() => go("/candidate/settings/profile-readiness")}>Complete profile <Icon name="arrow" size={14}/></button>
      </div>}
      <div className="sidebar-footer"><button className="account-row"><Avatar initials={mode === "recruiter" ? "SO" : "AM"} color={mode === "recruiter" ? "green" : "purple"} size="sm"/><span><strong>{mode === "recruiter" ? "Sophie Okafor" : "Alex Morgan"}</strong><small>{mode === "recruiter" ? "Admin" : "alex@example.com"}</small></span><Icon name="dots"/></button></div>
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
      <div className="content">{children}</div>
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

const applicants = [
  { initials: "JM", name: "Jamie Morris", role: "Senior Product Designer", time: "12 min ago", score: "92", status: "Shortlisted", tone: "success", color: "blue" },
  { initials: "NK", name: "Noah Kim", role: "Frontend Engineer", time: "48 min ago", score: "88", status: "In review", tone: "info", color: "purple" },
  { initials: "PS", name: "Priya Shah", role: "Senior Product Designer", time: "2 hr ago", score: "84", status: "New", tone: "warning", color: "amber" },
  { initials: "DO", name: "Daniel Okoro", role: "Customer Success Lead", time: "Yesterday", score: "79", status: "Interview", tone: "neutral", color: "green" },
] as const;

function RecruiterDashboard() {
  return <div>
    <PageHeader eyebrow="Tuesday, 12 March" title="Good morning, Sophie" description="Here’s what’s happening across your recruitment workspace." action={<Button icon="plus" onClick={() => go("/recruiter/campaigns/new")}>Create campaign</Button>}/>
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
  return <div><PageHeader eyebrow={campaign ? "Campaign / Senior Product Designer" : "Candidate inbox"} title={campaign ? "Senior Product Designer" : "All candidates"} description={campaign ? "Review and move applicants through your hiring pipeline." : "Review candidates across all active recruitment campaigns."} action={<Button variant="secondary" icon="external">{campaign ? "View campaign" : "Export"}</Button>}/>
    {campaign && <div className="funnel-strip">{[["Applications", "41"], ["Qualified", "24"], ["Shortlisted", "9"], ["Interview", "4"]].map((x, i) => <div key={x[0]}><span className={`funnel-dot f-${i}`}/><span><small>{x[0]}</small><strong>{x[1]}</strong></span></div>)}</div>}
    <div className="tabs"><button className="active">All <span>284</span></button><button>New <span>12</span></button><button>In review <span>38</span></button><button>Shortlisted <span>24</span></button></div>
    <Toolbar/>
    <section className="surface list-surface"><div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Campaign</th><th>AI evaluation</th><th>Status</th><th>Applied</th><th/></tr></thead><tbody>{[...applicants, ...applicants.slice(0, 2)].map((a, i) => <tr key={`${a.name}-${i}`}><td><span className="person"><Avatar initials={a.initials} color={a.color}/><span><strong>{a.name}</strong><small>{a.name.toLowerCase().replace(" ", ".")}@email.com</small></span></span></td><td>{a.role}</td><td><span className="score"><i style={{ "--score": `${a.score}%` } as React.CSSProperties}/><strong>{a.score}%</strong><small>AI-assisted</small></span></td><td><Badge tone={a.tone}>{a.status}</Badge></td><td className="muted">{a.time}</td><td><Button variant="ghost">Review <Icon name="arrow" size={14}/></Button></td></tr>)}</tbody></table></div></section>
  </div>;
}

function CampaignEditor() {
  const [section, setSection] = useState("Campaign details");
  const sections = ["Campaign details", "Role description", "Application form", "Publication", "URL & sharing"];
  return <div><PageHeader eyebrow="Campaigns / New campaign" title="Create campaign" description="Set up the role, application form and publishing details." action={<><span className="save-status"><Icon name="check" size={15}/> All changes saved</span><Button variant="secondary">Preview</Button><Button>Publish campaign</Button></>}/>
    <div className="editor-layout"><aside className="section-nav">{sections.map((s, i) => <button className={section === s ? "active" : ""} key={s} onClick={() => setSection(s)}><span>{i + 1}</span>{s}{i === 0 && <Icon name="check" size={14}/>}</button>)}</aside>
      <section className="form-page"><div className="form-heading"><span className="step-icon"><Icon name="briefcase"/></span><div><h2>{section}</h2><p>{section === "Campaign details" ? "Start with the essential information candidates need." : "Configure this section of your campaign."}</p></div></div>
        <div className="form-grid"><Field label="Campaign title" placeholder="e.g. Senior Product Designer"/><Field label="Department" placeholder="Select a department"/><Field label="Location" icon="location" placeholder="e.g. Cape Town"/><Field label="Work arrangement" placeholder="Select arrangement"/></div>
        <label className="field field-full"><span className="field-label">Short summary</span><textarea placeholder="Share a concise overview of this opportunity…"/><span className="field-helper">Help candidates quickly understand the role. 0 / 240</span></label>
        <div className="form-divider"/>
        <div className="subheading"><h3>Employment details</h3><p>Optional details help candidates understand the opportunity.</p></div>
        <div className="form-grid"><Field label="Employment type" placeholder="Full-time"/><Field label="Experience level" placeholder="Senior"/></div>
        <div className="form-footer"><Button variant="secondary">Save draft</Button><Button onClick={() => setSection("Role description")}>Continue to role description <Icon name="arrow" size={15}/></Button></div>
      </section></div>
  </div>;
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
  return <div className="narrow-page"><PageHeader eyebrow="Settings" title={business ? "Business profile" : "Team management"} description={business ? "Keep your organisation information and employer brand up to date." : "Manage workspace access, roles and pending invitations."} action={<Button icon={business ? undefined : "plus"}>{business ? "Save changes" : "Invite member"}</Button>}/>
    {business ? <section className="settings-section">
      <div className="subheading"><h2>Organisation profile</h2><p>This information is visible on your public campaigns.</p></div>
      <div className="brand-upload"><div className="logo-preview">N</div><div><strong>Organisation logo</strong><p>PNG, JPG or SVG. Recommended 400 × 400.</p><Button variant="secondary" icon="upload">Change logo</Button></div></div>
      <div className="form-grid"><Field label="Organisation name" placeholder="Northstar Labs"/><Field label="Industry" placeholder="Technology"/><Field label="Company website" placeholder="https://northstarlabs.com"/><Field label="Company size" placeholder="51–200 employees"/></div>
      <label className="field field-full"><span className="field-label">Company description</span><textarea defaultValue="We build thoughtful digital products that help ambitious teams do their best work."/></label>
      <div className="form-divider"/><div className="subheading"><h2>Business address</h2><p>Used for account and legal records.</p></div>
      <div className="form-grid"><Field label="Address line" placeholder="12 Loop Street"/><Field label="City" placeholder="Cape Town"/><Field label="Postal code" placeholder="8001"/><Field label="Country" placeholder="South Africa"/></div>
    </section> : <section className="surface team-list">
      <div className="team-summary"><div><span className="summary-icon"><Icon name="users"/></span><span><strong>4 active members</strong><small>2 pending invitations</small></span></div><label className="search compact"><Icon name="search"/><input placeholder="Search members…"/></label></div>
      {[
        ["SO", "Sophie Okafor", "sophie@northstarlabs.com", "Admin", "green", "Active"],
        ["LM", "Luca Meyer", "luca@northstarlabs.com", "Recruiter", "purple", "Active"],
        ["AT", "Amina Toure", "amina@northstarlabs.com", "Recruiter", "blue", "Active"],
        ["JR", "Jonas Reed", "jonas@northstarlabs.com", "Hiring manager", "amber", "Active"],
      ].map(m => <div className="team-row" key={m[1]}><span className="person"><Avatar initials={m[0]} color={m[4]}/><span><strong>{m[1]}</strong><small>{m[2]}</small></span></span><span className="role">{m[3]}</span><Badge tone="success">{m[5]}</Badge><button className="icon-btn"><Icon name="dots"/></button></div>)}
      <div className="pending-title">Pending invitations</div>
      <div className="team-row"><span className="person"><Avatar initials="KM" color="gray"/><span><strong>k.moyo@example.com</strong><small>Invited 2 days ago</small></span></span><span className="role">Recruiter</span><Badge tone="warning">Pending</Badge><Button variant="ghost">Copy link</Button></div>
    </section>}
  </div>;
}

const jobs = [
  { title: "Senior Product Designer", company: "Orbit Systems", location: "Cape Town", mode: "Hybrid", time: "2 days ago", match: 92, initials: "OS", tone: "blue" },
  { title: "Product Designer", company: "Luma Health", location: "Johannesburg", mode: "Remote", time: "3 days ago", match: 86, initials: "LH", tone: "green" },
  { title: "UX/UI Designer", company: "Kite Finance", location: "South Africa", mode: "Remote", time: "5 days ago", match: 81, initials: "KF", tone: "purple" },
  { title: "Design Systems Lead", company: "Meridian", location: "Cape Town", mode: "On-site", time: "1 week ago", match: 78, initials: "ME", tone: "amber" },
];

function CandidateDashboard() {
  return <div><PageHeader eyebrow="Tuesday, 12 March" title="Welcome back, Alex" description="You’re making progress. Here’s what to focus on next." action={<Button icon="search" onClick={() => go("/candidate/jobs")}>Find jobs</Button>}/>
    <div className="candidate-hero"><div><span className="eyebrow">Your profile</span><h2>Stand out to the right employers</h2><p>Your profile is 75% ready. Add your recent work experience to unlock stronger job matches.</p><Button variant="secondary" onClick={() => go("/candidate/settings/profile-readiness")}>Complete your profile <Icon name="arrow" size={15}/></Button></div><div className="readiness-ring"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34"/><circle className="ring-value" cx="40" cy="40" r="34"/></svg><span><strong>75%</strong><small>ready</small></span></div></div>
    <div className="application-stats">{[["Applications", "7", "2 updated this week"], ["In review", "3", "Recruiters are reviewing"], ["Interviews", "1", "Next: Friday at 10:00"]].map((x, i) => <div key={x[0]}><span className={`metric-icon metric-${["blue", "amber", "green"][i]}`}><Icon name={["file", "clock", "calendar"][i] as IconName}/></span><span><small>{x[0]}</small><strong>{x[1]}</strong><p>{x[2]}</p></span></div>)}</div>
    <section className="recommended"><div className="section-header"><div><h2>Recommended for you</h2><p>Based on your skills and preferences</p></div><button className="text-btn" onClick={() => go("/candidate/jobs")}>Browse all jobs <Icon name="arrow" size={14}/></button></div><div className="job-grid">{jobs.slice(0, 3).map(j => <JobCard job={j} key={j.title}/>)}</div></section>
  </div>;
}

function JobCard({ job, selected = false, onClick }: { job: typeof jobs[0]; selected?: boolean; onClick?: () => void }) {
  const [saved, setSaved] = useState(false);
  return <article className={`job-card ${selected ? "selected" : ""}`} onClick={onClick}><div className="job-card-top"><span className={`company-logo logo-${job.tone}`}>{job.initials}</span><button className={`icon-btn ${saved ? "saved" : ""}`} onClick={e => { e.stopPropagation(); setSaved(!saved); }} aria-label="Save job"><Icon name="bookmark"/></button></div><h3>{job.title}</h3><p className="company">{job.company}</p><div className="job-meta"><span><Icon name="location" size={14}/>{job.location}</span><span><Icon name="briefcase" size={14}/>{job.mode}</span></div><div className="job-footer"><span className="match"><Icon name="sparkles" size={14}/>{job.match}% match</span><small>{job.time}</small></div></article>;
}

function JobsPage() {
  const [selected, setSelected] = useState(0);
  return <div><PageHeader eyebrow="Opportunities" title="Find your next role" description="Explore opportunities matched to your skills and preferences."/>
    <div className="job-search-bar"><label className="search"><Icon name="search"/><input placeholder="Job title, skill or company"/></label><label className="search location-search"><Icon name="location"/><input placeholder="Location"/></label><Button>Search jobs</Button></div>
    <div className="filter-row"><Button variant="secondary" icon="filter">All filters</Button>{["Remote", "Hybrid", "Design", "Full-time"].map(f => <button className="filter-pill" key={f}>{f}<Icon name="close" size={13}/></button>)}<span className="results-count">48 opportunities</span></div>
    <div className="jobs-layout"><div className="results-list">{jobs.map((j, i) => <JobCard job={j} key={j.title} selected={selected === i} onClick={() => setSelected(i)}/>)}</div><aside className="job-detail"><div className="detail-header"><span className={`company-logo logo-${jobs[selected].tone}`}>{jobs[selected].initials}</span><button className="icon-btn"><Icon name="bookmark"/></button></div><h2>{jobs[selected].title}</h2><p className="company">{jobs[selected].company}</p><div className="job-meta"><span><Icon name="location" size={14}/>{jobs[selected].location}</span><span><Icon name="briefcase" size={14}/>{jobs[selected].mode}</span></div><div className="match-banner"><Icon name="sparkles"/><span><strong>{jobs[selected].match}% profile match</strong><small>Your skills align strongly with this role.</small></span></div><Button className="full">Apply now</Button><div className="detail-copy"><h3>About the role</h3><p>Join a collaborative product team shaping thoughtful digital experiences. You’ll partner closely with product, engineering and research to solve meaningful customer problems.</p><h3>What you’ll bring</h3><ul><li>5+ years of product design experience</li><li>Strong portfolio of end-to-end product work</li><li>Experience with accessible design systems</li></ul></div></aside></div>
  </div>;
}

function ApplicationsPage() {
  return <div><PageHeader eyebrow="Your job search" title="My applications" description="Track your applications and see what happens next."/>
    <div className="tabs"><button className="active">All <span>7</span></button><button>In progress <span>4</span></button><button>Closed <span>3</span></button></div>
    <section className="application-list">{jobs.map((j, i) => <article className="application-row" key={j.title}><span className={`company-logo logo-${j.tone}`}>{j.initials}</span><div className="application-main"><h3>{j.title}</h3><p>{j.company} · {j.location}</p><small>Applied {i + 2} days ago</small></div><div className="status-timeline"><span className="complete"><i><Icon name="check" size={12}/></i>Applied</span><b/><span className={i < 3 ? "current" : ""}><i>{i < 3 ? <Icon name="clock" size={12}/> : null}</i>In review</span><b/><span><i/>Decision</span></div><Badge tone={i === 3 ? "neutral" : i === 2 ? "success" : "info"}>{i === 3 ? "Closed" : i === 2 ? "Interview" : "In review"}</Badge><button className="icon-btn"><Icon name="chevron"/></button></article>)}</section>
  </div>;
}

function ProfilePage() {
  const [section, setSection] = useState("Personal details");
  const sections = [["Personal details", true], ["CV & documents", true], ["Skills", true], ["Work experience", false], ["Education", false], ["Preferences", true]] as const;
  return <div><PageHeader eyebrow="My profile" title="Profile readiness" description="A complete profile helps employers understand your experience and improves job matches." action={<Button>Save changes</Button>}/>
    <div className="profile-summary"><div className="readiness-ring small"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34"/><circle className="ring-value" cx="40" cy="40" r="34"/></svg><span><strong>75%</strong></span></div><div><h2>Your profile is almost ready</h2><p>Complete 2 remaining sections to make your profile visible for all matched opportunities.</p><div className="missing"><span><Icon name="clock" size={14}/> Add work experience</span><span><Icon name="clock" size={14}/> Add education</span></div></div></div>
    <div className="editor-layout profile-layout"><aside className="section-nav">{sections.map(([s, done]) => <button className={section === s ? "active" : ""} key={s} onClick={() => setSection(s)}>{done ? <span className="done"><Icon name="check" size={13}/></span> : <span/>}{s}<small>{done ? "Complete" : "Missing"}</small></button>)}</aside><section className="form-page"><div className="form-heading"><span className="step-icon"><Icon name="user"/></span><div><h2>{section}</h2><p>Keep your information accurate and up to date.</p></div></div><div className="avatar-upload"><Avatar initials="AM" color="purple" size="lg"/><div><strong>Profile photo</strong><p>JPG or PNG, up to 5 MB.</p><Button variant="secondary" icon="upload">Upload new photo</Button></div></div><div className="form-grid"><Field label="First name" placeholder="Alex"/><Field label="Last name" placeholder="Morgan"/><Field label="Email address" icon="mail" placeholder="alex@example.com"/><Field label="Phone number" placeholder="+27 72 000 0000"/><Field label="Location" icon="location" placeholder="Cape Town, South Africa"/><Field label="Professional headline" placeholder="Senior Product Designer"/></div><label className="field field-full"><span className="field-label">Professional summary</span><textarea defaultValue="Product designer focused on clear, accessible experiences for complex digital products."/></label></section></div>
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

function AuthPage({ kind = "login" }: { kind?: "login" | "forgot" | "reset" | "invite" | "apply" | "thanks" | "access" | "unavailable" | "404" }) {
  const [persona, setPersona] = useState("candidate");
  if (kind === "404" || kind === "access" || kind === "unavailable" || kind === "thanks") {
    const data = kind === "404" ? ["404", "This page took a different path", "We couldn’t find the page you’re looking for.", "Go to overview"] : kind === "thanks" ? ["check", "Application received", "Your application has been submitted successfully. The employer will contact you if there is an update.", "Back to opportunities"] : kind === "access" ? ["clock", "Your access is under review", "Northstar Labs is reviewing your recruiter access. You can safely return later.", "Sign out"] : ["building", "No recruiter workspace available", "This account isn’t connected to an eligible organisation workspace yet.", "Return to sign in"];
    return <div className="public-page"><header className="public-header"><Logo/><Button variant="ghost" onClick={() => go("/login")}>Sign in</Button></header><main className="state-page"><div className={`state-icon state-${kind}`} >{data[0] === "404" ? <strong>404</strong> : <Icon name={data[0] as IconName} size={30}/>}</div><h1>{data[1]}</h1><p>{data[2]}</p><Button onClick={() => go(kind === "thanks" ? "/candidate/jobs" : kind === "404" ? "/candidate" : "/login")}>{data[3]}</Button>{kind === "unavailable" && <Button variant="ghost">Accept an organisation invitation</Button>}</main></div>;
  }
  if (kind === "apply") return <PublicApplication/>;
  const copy = kind === "forgot" ? ["Reset your password", "Enter your email and we’ll send reset instructions if an account exists.", "Send reset link"] : kind === "reset" ? ["Choose a new password", "Create a strong password you don’t use elsewhere.", "Reset password"] : kind === "invite" ? ["Join Northstar Labs", "You’ve been invited to join the recruiter workspace as a Recruiter.", "Accept invitation"] : ["Welcome to RecruitFlow", "Sign in to continue to your workspace.", "Sign in"];
  return <div className="auth-layout"><aside className="auth-aside"><Logo/><div className="auth-message"><span className="quote-mark">“</span><blockquote>Hiring is about more than filling roles. RecruitFlow helps teams make every candidate interaction count.</blockquote><div className="quote-person"><Avatar initials="SO" color="green"/><span><strong>Sophie Okafor</strong><small>People Operations, Northstar Labs</small></span></div></div><p className="aside-foot">Trusted by growing teams to hire thoughtfully.</p></aside><main className="auth-main"><div className="mobile-logo"><Logo/></div><div className="auth-form"><div className="auth-heading">{kind === "login" && <span className="auth-kicker">RecruitFlow</span>}<h1>{copy[0]}</h1><p>{copy[1]}</p></div>
    {kind === "login" && <div className="persona-switch"><button className={persona === "candidate" ? "active" : ""} onClick={() => setPersona("candidate")}><Icon name="user"/>Candidate</button><button className={persona === "recruiter" ? "active" : ""} onClick={() => setPersona("recruiter")}><Icon name="building"/>Recruiter</button></div>}
    {kind === "invite" && <div className="invite-card"><span className="org-icon">N</span><span><strong>Northstar Labs</strong><small>Recruiter workspace · Invited by Sophie</small></span></div>}
    <form onSubmit={e => { e.preventDefault(); go(kind === "login" ? `/${persona}` : kind === "invite" ? "/recruiter" : "/login"); }}>
      {kind !== "reset" && <Field label="Email address" icon="mail" placeholder="you@example.com" type="email"/>}
      {(kind === "login" || kind === "reset" || kind === "invite") && <Field label={kind === "reset" ? "New password" : "Password"} icon="lock" placeholder="Enter your password" type="password" helper={kind === "reset" ? "At least 8 characters with a number and symbol." : undefined}/>}
      {kind === "reset" && <Field label="Confirm new password" icon="lock" placeholder="Repeat your password" type="password"/>}
      {kind === "login" && <div className="form-options"><label><input type="checkbox"/>Remember me</label><button type="button" onClick={() => go("/forgot-password")}>Forgot password?</button></div>}
      <Button type="submit" className="full">{copy[2]}</Button>
    </form>
    {kind === "login" && <><div className="or"><span/>or continue with<span/></div><Button variant="secondary" className="full"><b className="google-g">G</b>Continue with Google</Button><p className="auth-bottom">New to RecruitFlow? <button>Create an account</button></p></>}
    {kind !== "login" && <button className="back-link" onClick={() => go("/login")}>← Back to sign in</button>}
  </div></main></div>;
}

function PublicApplication() {
  return <div className="application-public"><header className="application-header"><div className="employer-brand"><span className="company-logo logo-blue">OS</span><span><strong>Orbit Systems</strong><small>Powered by RecruitFlow</small></span></div><span className="secure"><Icon name="lock" size={14}/> Secure application</span></header><main className="application-form-page"><div className="role-intro"><Badge tone="success">Applications open</Badge><h1>Senior Product Designer</h1><div className="job-meta"><span><Icon name="location" size={15}/>Cape Town</span><span><Icon name="briefcase" size={15}/>Hybrid · Full-time</span></div><p>Help us shape clear, useful experiences for thousands of growing teams.</p></div><div className="application-columns"><aside><h2>Your application</h2>{["Personal details", "Experience", "Documents", "Additional questions"].map((x, i) => <div className={i === 0 ? "current" : ""} key={x}><span>{i + 1}</span>{x}</div>)}</aside><section className="form-page"><div className="form-heading"><div><h2>Personal details</h2><p>Tell the hiring team how they can reach you.</p></div></div><div className="form-grid"><Field label="First name" placeholder="Your first name"/><Field label="Last name" placeholder="Your last name"/><Field label="Email address" icon="mail" placeholder="you@example.com"/><Field label="Phone number" placeholder="+27"/></div><Field label="Current location" icon="location" placeholder="City, country"/><div className="form-footer"><span>Step 1 of 4</span><Button>Continue <Icon name="arrow" size={15}/></Button></div></section></div></main></div>;
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => { const handler = () => setPath(window.location.pathname); window.addEventListener("popstate", handler); return () => window.removeEventListener("popstate", handler); }, []);
  const content = useMemo(() => {
    if (path === "/" || path === "/login") return <AuthPage/>;
    if (path === "/forgot-password") return <AuthPage kind="forgot"/>;
    if (path === "/reset-password") return <AuthPage kind="reset"/>;
    if (path.includes("invitation")) return <AuthPage kind="invite"/>;
    if (path.includes("public/campaign")) return <AuthPage kind="apply"/>;
    if (path.includes("application-confirmation")) return <AuthPage kind="thanks"/>;
    if (path.includes("access-review")) return <AuthPage kind="access"/>;
    if (path.includes("workspace-unavailable")) return <AuthPage kind="unavailable"/>;
    if (path.startsWith("/candidate")) {
      let page: React.ReactNode = <CandidateDashboard/>;
      if (path.includes("/jobs")) page = <JobsPage/>;
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
  return content;
}

export default App;
