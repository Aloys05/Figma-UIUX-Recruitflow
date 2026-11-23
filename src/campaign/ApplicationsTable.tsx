import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CandidatePanel from "./CandidatePanel";
import { Button, Icon } from "../ui";
import { OverrideLabel } from "./CandidatePanel";
import type { CampaignActor } from "./permissions";
import {
  type ApproverOption,
  Avatar,
  CompareDialog,
  GuardedButton,
  MandatoryCriteriaBadge,
  NotAvailableButton,
  Pill,
  ProposeDialog,
  ReasonDialog,
  TagDialog,
} from "./workspaceUi";
import { applicationStatusLabel, screenApplication, type CampaignWorkspaceStore, type WorkspaceApplication, type WorkspaceRequirement } from "./workspaceStore";

export type TableSection = "longlist" | "below-requirements" | "rejected";

const SKILLS = ["ATS", "AWS", "After Effects", "Agile", "Analytics", "AutoCAD", "B2B Sales", "Branding", "Budgeting", "CI/CD", "CSS", "Cash Flow", "Community", "Comp & Ben", "Compliance", "Copywriting", "Dart", "Design Systems", "Dispensing", "Django", "Docker", "ER", "Excel", "FX", "Figma", "Filing", "Firebase", "Flutter", "Forecasting", "Governance", "GraphQL", "HubSpot", "ICU", "IFRS", "Illustrator", "Interviews", "Jira", "Kubernetes", "LLMs", "Lending", "MS Office", "Maintenance", "Minutes", "Modelling", "MongoDB", "Negotiation", "Node.js", "PRINCE2", "Paid Ads", "Patient Care", "Payroll", "Policy", "PostgreSQL", "Power BI", "PyTorch", "Python", "React", "Reception", "Reporting", "Revit", "Risk", "Roadmapping", "SEO", "Sage", "Salesforce", "Scheduling", "Scrum", "Site Mgmt", "Sourcing", "Stakeholders", "Stock Control", "Structural", "Talent", "Tax", "Terraform", "Travel", "Triage", "TypeScript", "UX Research", "Usability"];
const LANGUAGES = ["Afrikaans", "English", "Oshiwambo", "Otjiherero", "Portuguese"];
const TAGS = ["Priority", "Referred", "Interviewed before", "Do not contact", "Rehire"];
const PROFESSIONS = ["Software Developers", "Project Managers", "Accountants", "Engineers", "Sales & Marketing", "Designers", "HR Professionals", "Finance", "Healthcare", "Administration", "Other / Unclassified"];
const LOCATIONS = ["Remote", "Windhoek", "Swakopmund", "Walvis Bay", "Ongwediva", "Oshakati", "Rundu", "Katima Mulilo", "Rosh Pinah"];
const EXPERIENCE = ["0 to 2 yrs", "3 to 5 yrs", "6 to 9 yrs", "10+ yrs"];
const AVAILABILITY = ["Available now", "Notice period", "Not available"];
const QUALIFICATIONS = ["BA Communications", "BA Human Resources", "BA Marketing", "BA Visual Communication", "BCom Accounting", "BCom Business Management", "BCom Finance", "BCom Marketing", "BEng Civil", "BEng Mechanical", "BNurs Nursing Science", "BSc Computer Science", "BSc Engineering", "BSc Information Systems", "BSc Psychology", "Certificate Business Admin", "Certificate Marketing", "Diploma Graphic Design", "Diploma Office Administration", "Diploma Pharmacy", "Diploma Software Development", "MSc Computer Science"];
const SOURCES = ["Public form", "CSV import", "Bulk CV upload", "Manual"];
const REQUIREMENTS = ["Meets requirements", "Needs verification", "Requirement not met"];
const SCREENING_STATES = ["Completed", "Pending", "Failed"];
const APPLICATION_STATUSES = ["Longlisted", "Proposed", "Approved", "Rejected", "Under review"];
const REVIEW_STATUSES = ["Not submitted", "Returned for revision", "Under review", "Reviewed"];
const REVIEWERS = ["Even Hashikutuva", "James Kevin", "Lina Amadhila", "Thandi Nekwaya"];

type Filters = {
  combineMode: "all" | "any"; search: string; profession: string; location: string; experience: string; availability: string;
  skills: string[]; languages: string[]; qualification: string; tags: string[]; candidateSource: string; requirements: string;
  requiredCriteriaMet: boolean; requiredCriteriaNotMet: boolean; missingEvidence: boolean; knockedOut: boolean; screeningState: string;
  applicationStatus: string; reviewStatus: string; assignedReviewer: string; minMatchScore: number;
};
const defaultFilters: Filters = {
  combineMode: "all", search: "", profession: "", location: "", experience: "", availability: "", skills: [], languages: [], qualification: "", tags: [], candidateSource: "",
  requirements: "", requiredCriteriaMet: false, requiredCriteriaNotMet: false, missingEvidence: false, knockedOut: false, screeningState: "", applicationStatus: "", reviewStatus: "", assignedReviewer: "", minMatchScore: 0,
};

const COLUMNS = [
  ["requirementsScore", "Requirements score"], ["mustHaves", "Must-haves"], ["aiFit", "AI fit"],
  ["location", "Location"], ["skillsMatch", "Skills match"], ["aiScreening", "AI screening"], ["mandatoryCriteria", "Mandatory criteria"], ["experience", "Experience"],
  ["tags", "Tags"], ["applicationStatus", "Application status"], ["reviewStatus", "Review status"], ["assignedReviewer", "Assigned reviewer"], ["appliedOn", "Applied on"],
] as const;
type ColumnKey = (typeof COLUMNS)[number][0];
type SortField = "requirementsScore" | "fitScore" | "skills" | "appliedDate";
const SORTABLE: Partial<Record<ColumnKey, SortField>> = { requirementsScore: "requirementsScore", aiFit: "fitScore", skillsMatch: "skills", appliedOn: "appliedDate" };

const experienceBucket = (years: number) => years <= 2 ? "0 to 2 yrs" : years <= 5 ? "3 to 5 yrs" : years <= 9 ? "6 to 9 yrs" : "10+ yrs";
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function inSection(application: WorkspaceApplication, section: TableSection, knockedOut: boolean) {
  if (section === "rejected") return application.stage === "rejected";
  if (section === "below-requirements") return application.stage === "below-requirements" && !application.overridden;
  return application.stage === "longlist" && !knockedOut;
}

const reviewTone = (status: string) => status === "Returned for revision" ? "info" : status === "Under review" || status === "Reviewed" ? "success" : "neutral";

export default function ApplicationsTable({ section, store, requirements, actor, approvers, offerStatusFor, blockedReason = null }: {
  section: TableSection;
  store: CampaignWorkspaceStore;
  requirements: readonly WorkspaceRequirement[];
  actor: CampaignActor;
  approvers: readonly ApproverOption[];
  offerStatusFor: (applicationId: string) => string | null;
  /** Why proposing is blocked right now, for example no approver. */
  blockedReason?: string | null;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<"reject" | "override" | "compare" | "tag" | "propose" | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("requirementsScore");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [visible, setVisible] = useState<Record<ColumnKey, boolean>>({ requirementsScore: true, mustHaves: true, aiFit: true, location: false, skillsMatch: false, aiScreening: false, mandatoryCriteria: true, experience: false, tags: false, applicationStatus: true, reviewStatus: true, assignedReviewer: false, appliedOn: true });

  const screenings = useMemo(() => new Map(store.data.applications.map(application => [application.id, screenApplication(application, requirements)])), [store.data.applications, requirements]);
  const sectionRows = useMemo(() => store.data.applications.filter(application => inSection(application, section, screenings.get(application.id)?.knockedOut ?? false)), [store.data.applications, section, screenings]);

  const filtered = useMemo(() => {
    const checks = (application: WorkspaceApplication): boolean[] => {
      const screening = screenings.get(application.id)!;
      const results: boolean[] = [];
      const query = filters.search.trim().toLowerCase();
      if (query) results.push([application.name, application.email, application.headline, application.employer, application.notes, ...application.skills, ...application.languages].join(" ").toLowerCase().includes(query));
      if (filters.profession) results.push(application.profession === filters.profession);
      if (filters.location) results.push(application.location === filters.location);
      if (filters.experience) results.push(experienceBucket(application.experienceYears) === filters.experience);
      if (filters.availability) results.push(application.availability === filters.availability);
      if (filters.skills.length) results.push(filters.skills.some(skill => application.skills.includes(skill)));
      if (filters.languages.length) results.push(filters.languages.some(language => application.languages.includes(language)));
      if (filters.qualification) results.push(application.qualification === filters.qualification);
      if (filters.tags.length) results.push(filters.tags.some(tag => application.tags.includes(tag)));
      if (filters.candidateSource) results.push(application.source === filters.candidateSource);
      if (filters.requirements) results.push(screening.requirementsSummary === filters.requirements);
      if (filters.requiredCriteriaMet) results.push(screening.mustHave.met === screening.mustHave.total);
      if (filters.requiredCriteriaNotMet) results.push(screening.mustHave.failed.length > 0);
      if (filters.missingEvidence) results.push(screening.unverified > 0);
      if (filters.knockedOut) results.push(screening.knockedOut);
      if (filters.screeningState) results.push(application.screeningState === filters.screeningState);
      if (filters.applicationStatus) results.push(filters.applicationStatus === "Under review" ? application.reviewStatus === "Under review" : { Longlisted: "longlist", Proposed: "shortlist-proposed", Approved: "shortlist-approved", Rejected: "rejected" }[filters.applicationStatus] === application.stage);
      if (filters.reviewStatus) results.push(application.reviewStatus === filters.reviewStatus);
      if (filters.assignedReviewer) results.push(application.assignedReviewer === filters.assignedReviewer);
      if (filters.minMatchScore > 0) results.push(application.fitScore >= filters.minMatchScore);
      return results;
    };
    return sectionRows
      .filter(application => {
        const results = checks(application);
        if (!results.length) return true;
        return filters.combineMode === "all" ? results.every(Boolean) : results.some(Boolean);
      })
      .sort((a, b) => {
        const value = (item: WorkspaceApplication) => sortField === "requirementsScore" ? screenings.get(item.id)!.requirementsScore : sortField === "fitScore" ? item.fitScore : sortField === "skills" ? item.skillsMatch.percentage : Date.parse(item.appliedDate);
        const comparison = value(a) - value(b);
        return sortDirection === "desc" ? -comparison : comparison;
      });
  }, [sectionRows, filters, sortField, sortDirection, screenings]);

  useEffect(() => { setSelected(new Set()); setFilters(defaultFilters); setPage(1); }, [section]);
  useEffect(() => setPage(1), [filters, pageSize, sortField, sortDirection]);
  useEffect(() => {
    const ids = new Set(sectionRows.map(item => item.id));
    setSelected(previous => {
      const next = new Set([...previous].filter(id => ids.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [sectionRows]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const average = (values: number[]) => values.length ? `${Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)}%` : "—";
  const selectedRows = filtered.filter(item => selected.has(item.id));
  const allSelected = filtered.length > 0 && filtered.every(item => selected.has(item.id));
  const toggleAll = () => setSelected(previous => {
    const next = new Set(previous);
    filtered.forEach(item => allSelected ? next.delete(item.id) : next.add(item.id));
    return next;
  });
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(direction => direction === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDirection("desc"); }
  };
  const arrow = (field: SortField) => sortField === field ? (sortDirection === "desc" ? " ↓" : " ↑") : "";
  const close = (clear = true) => { setDialog(null); if (clear) setSelected(new Set()); };

  const exportSelected = () => {
    const content = selectedRows.map(item => ({ id: item.id, name: item.name, stage: item.stage, fitScore: item.fitScore }));
    const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `campaign-applications-${section}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    store.showToast(`Export selected completed for ${selectedRows.length} application${selectedRows.length === 1 ? "" : "s"}.`);
  };

  const subtitle = section === "longlist" ? "Everyone still under consideration, including applications still awaiting review." : section === "below-requirements" ? "Candidates who are below the campaign requirements." : "Candidates whose application was rejected.";
  const profile = store.data.applications.find(item => item.id === profileId) ?? null;
  const shownColumns = COLUMNS.filter(([key]) => visible[key]);
  const none = selectedRows.length === 0;

  return <section className="campaign-applications-card cw-table-screen">
    <header className="campaign-applications-header">
      <div><h3>{filtered.length} candidate{filtered.length === 1 ? "" : "s"}</h3><p>{subtitle}</p></div>
      <div className="campaign-table-tools">
        <Button variant="secondary" icon="filter" onClick={() => setFiltersOpen(true)}>Filters</Button>
        <span className="cw-not-available"><NotAvailableButton>Views</NotAvailableButton></span>
        <div className="cw-columns">
          <Button variant="secondary" icon="file" onClick={() => setColumnsOpen(open => !open)}>Columns</Button>
          {columnsOpen && <>
            <div className="cw-click-away" onClick={() => setColumnsOpen(false)}/>
            <div className="cw-columns-menu" role="group" aria-label="Visible columns">
              <p className="cw-section-label">Visible columns</p>
              <label className="fixed"><input type="checkbox" checked disabled/>Candidate<small>fixed</small></label>
              {COLUMNS.map(([key, label]) => <label key={key}><input type="checkbox" checked={visible[key]} onChange={event => setVisible(current => ({ ...current, [key]: event.target.checked }))}/>{label}</label>)}
              <label className="fixed"><input type="checkbox" checked disabled/>Actions<small>fixed</small></label>
            </div>
          </>}
        </div>
      </div>
    </header>
    <div className="campaign-candidate-totals cw-totals">
      <span><strong>{filtered.length}</strong> {filtered.length === 1 ? "candidate" : "candidates"}{filtered.length !== sectionRows.length ? ` of ${sectionRows.length}` : ""}</span>
      <span><strong>{average(filtered.map(item => screenings.get(item.id)!.requirementsScore))}</strong> average requirements score</span>
      <span><strong>{average(filtered.map(item => item.fitScore))}</strong> average AI fit</span>
      <span><strong>{filtered.filter(item => screenings.get(item.id)!.mustHave.failed.length === 0 && screenings.get(item.id)!.mustHave.met === screenings.get(item.id)!.mustHave.total).length}</strong> meet every must-have</span>
    </div>
    <div className="campaign-table-bulkbar cw-bulkbar">
      <label><input type="checkbox" checked={allSelected} ref={element => { if (element) element.indeterminate = selectedRows.length > 0 && selectedRows.length < filtered.length; }} onChange={toggleAll}/>Select all {filtered.length} matching</label>
      <span>{selected.size} selected</span>
      {section === "longlist" && <GuardedButton role={actor.role} action="propose" extraBlock={blockedReason} variant="primary" disabled={none} onClick={() => setDialog("propose")}>Propose shortlist</GuardedButton>}
      {section !== "rejected" && <GuardedButton role={actor.role} action="reject" variant="danger" disabled={none} onClick={() => setDialog("reject")}>Reject selected</GuardedButton>}
      {section === "below-requirements" && <GuardedButton role={actor.role} action="manageLonglist" disabled={none} onClick={() => setDialog("override")}>Override to Longlist</GuardedButton>}
      {section === "rejected" && <GuardedButton role={actor.role} action="reject" disabled={none} onClick={() => { store.returnRejectedToLonglist([...selected], actor); setSelected(new Set()); }}>Return to Longlist</GuardedButton>}
      <Button variant="secondary" disabled={selectedRows.length < 2} onClick={() => setDialog("compare")}>Compare</Button>
      <GuardedButton role={actor.role} action="manageLonglist" disabled={none} onClick={() => setDialog("tag")}>Add tag</GuardedButton>
      <GuardedButton role={actor.role} action="exportData" disabled={none} onClick={exportSelected}>Export selected</GuardedButton>
    </div>
    {filtered.length === 0 ? <div className="campaign-candidate-empty cw-empty"><strong>{sectionRows.length ? "No candidates match these conditions." : section === "longlist" ? "No candidates on the Longlist yet" : section === "below-requirements" ? "No candidates below requirements" : "No rejected candidates"}</strong><p>{sectionRows.length ? "Try changing or clearing the filters to see more candidates." : section === "longlist" ? "Candidates who meet every must-have appear here as screening finishes." : section === "below-requirements" ? "Candidates who miss a must-have appear here. You can move anyone back to the Longlist." : "Candidates you reject appear here with the reason recorded."}</p></div> : <div className="campaign-candidate-table-wrap"><table className="campaign-candidate-table cw-table">
      <thead><tr>
        <th className="cw-check-col"><span className="cw-sr">Select</span></th>
        <th>Candidate</th>
        {shownColumns.map(([key, label]) => {
          const field = SORTABLE[key];
          return field
            ? <th key={key} aria-sort={sortField === field ? (sortDirection === "desc" ? "descending" : "ascending") : "none"}><button type="button" className="cw-sort" onClick={() => toggleSort(field)}>{label}{arrow(field)}</button></th>
            : <th key={key}>{label}</th>;
        })}
        {section === "rejected" && <th>Rejection</th>}
        <th className="cw-actions-col">Actions</th>
      </tr></thead>
      <tbody>{pageRows.map(application => {
        const screening = screenings.get(application.id)!;
        return <tr key={application.id}>
          <td data-label="Select" className="cw-check-col"><input type="checkbox" checked={selected.has(application.id)} aria-label={`Select ${application.name}`} onChange={() => setSelected(previous => { const next = new Set(previous); if (next.has(application.id)) next.delete(application.id); else next.add(application.id); return next; })}/></td>
          <td data-label="Candidate"><span className="cw-person"><Avatar name={application.name}/><span><button type="button" className="cw-name-link" onClick={() => setProfileId(application.id)}>{application.name}</button><small>{application.email}</small></span></span></td>
          {shownColumns.map(([key, label]) => <td key={key} data-label={label}>{
            key === "requirementsScore" ? <strong className="cw-score-cell">{screening.requirementsScore}%</strong>
            : key === "mustHaves" ? <span className="cw-stack"><span>{screening.mustHave.met} of {screening.mustHave.total}</span>{screening.mustHave.failed.length > 0 && <small className="cw-danger-text">Failed: {screening.mustHave.failed[0]}{screening.mustHave.failed.length > 1 ? ` +${screening.mustHave.failed.length - 1}` : ""}</small>}</span>
            : key === "aiFit" ? `${application.fitScore}%`
            : key === "location" ? application.location || "—"
            : key === "skillsMatch" ? <span className="cw-skills"><span className="cw-ring">{application.skillsMatch.percentage}%</span><small>{application.skillsMatch.matched} of {application.skillsMatch.total} skills</small></span>
            : key === "aiScreening" ? <span className="cw-ai">{application.aiScreeningSummary}</span>
            : key === "mandatoryCriteria" ? <MandatoryCriteriaBadge met={screening.mustHave.met} total={screening.mustHave.total} failed={screening.mustHave.failed}/>
            : key === "experience" ? application.experienceYears ? `${application.experienceYears} yrs` : "—"
            : key === "tags" ? application.tags.length ? <span className="cw-chips">{application.tags.map(tag => <Pill key={tag}>{tag}</Pill>)}</span> : "—"
            : key === "applicationStatus" ? <span className="cw-stack"><Pill>{applicationStatusLabel(application.stage)}</Pill><OverrideLabel application={application}/>{screening.screeningPending && <small>Screening…</small>}{screening.screeningFailed && <small className="cw-danger-text">Screening failed</small>}</span>
            : key === "reviewStatus" ? <Pill tone={reviewTone(application.reviewStatus)}>{application.reviewStatus}</Pill>
            : key === "assignedReviewer" ? application.assignedReviewer || "—"
            : formatDate(application.appliedDate)
          }</td>)}
          {section === "rejected" && <td data-label="Rejection">{application.rejection ? <span className="cw-stack"><span>{application.rejection.reason}</span><small>by {application.rejection.decidedBy} · {new Date(application.rejection.decidedAt).toLocaleDateString()}</small><Pill tone={application.rejection.sharedWithCandidate ? "info" : "neutral"}>{application.rejection.sharedWithCandidate ? "Shared" : "Internal"}</Pill></span> : "—"}</td>}
          <td data-label="Actions" className="cw-actions-col"><span className="cw-row-actions"><NotAvailableButton>Report</NotAvailableButton><NotAvailableButton>CV</NotAvailableButton><button type="button" className="cw-mini-btn" onClick={() => setProfileId(application.id)}>Profile</button></span></td>
        </tr>;
      })}</tbody>
    </table></div>}
    {filtered.length > 0 && <footer className="campaign-table-pagination cw-pagination">
      <span>Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}</span>
      <label>Rows per page<select value={pageSize} onChange={event => setPageSize(Number(event.target.value))}>{[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
      <div><Button variant="secondary" disabled={currentPage <= 1} onClick={() => setPage(current => Math.max(1, current - 1))}>Previous</Button><span>Page {currentPage} of {pageCount}</span><Button variant="secondary" disabled={currentPage >= pageCount} onClick={() => setPage(current => Math.min(pageCount, current + 1))}>Next</Button></div>
    </footer>}

    {(dialog === "reject" || dialog === "override") && <ReasonDialog kind={dialog} applications={selectedRows} requirements={requirements} onCancel={() => close()} onConfirm={(reason, share) => {
      if (dialog === "reject") store.rejectApplications(selectedRows.map(item => item.id), reason, share, actor);
      else store.overrideApplications(selectedRows.map(item => item.id), reason, actor);
      close();
    }}/>}
    {dialog === "compare" && <CompareDialog applications={selectedRows} requirements={requirements} onClose={() => close(false)}/>}
    {dialog === "tag" && <TagDialog count={selectedRows.length} onCancel={() => close(false)} onConfirm={tag => { store.tagApplications(selectedRows.map(item => item.id), tag); close(false); }}/>}
    {dialog === "propose" && <ProposeDialog applications={selectedRows} requirements={requirements} approvers={approvers} onCancel={() => close(false)} onConfirm={input => { store.proposeShortlist({ ...input, applicationIds: selectedRows.map(item => item.id) }, actor); close(); }}/>}
    {profile && <CandidatePanel application={profile} requirements={requirements} offerStatus={offerStatusFor(profile.id)} store={store} actor={actor} onClose={() => setProfileId(null)}/>}
    {filtersOpen && <FiltersPanel filters={filters} onChange={setFilters} onClose={() => setFiltersOpen(false)} matchCount={filtered.length}/>}
  </section>;
}

function FiltersPanel({ filters, onChange, onClose, matchCount }: { filters: Filters; onChange: (filters: Filters) => void; onClose: () => void; matchCount: number }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const toggle = (key: "skills" | "languages" | "tags", value: string) => onChange({ ...filters, [key]: filters[key].includes(value) ? filters[key].filter(item => item !== value) : [...filters[key], value] });
  const select = (label: string, key: keyof Filters, options: readonly string[]) => <label className="rf-field"><span>{label}</span><select value={String(filters[key])} onChange={event => onChange({ ...filters, [key]: event.target.value })}><option value="">Any</option>{options.map(option => <option key={option}>{option}</option>)}</select></label>;
  const chips = (key: "skills" | "languages" | "tags", options: readonly string[]) => <div className="cw-chip-toggles">{options.map(option => <button type="button" key={option} aria-pressed={filters[key].includes(option)} className={filters[key].includes(option) ? "on" : ""} onClick={() => toggle(key, option)}>{option}</button>)}</div>;
  const check = (label: string, key: "requiredCriteriaMet" | "requiredCriteriaNotMet" | "missingEvidence" | "knockedOut") => <label className="cw-check"><input type="checkbox" checked={filters[key]} onChange={event => onChange({ ...filters, [key]: event.target.checked })}/>{label}</label>;
  return createPortal(<div className="campaign-candidate-panel-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="campaign-candidate-panel cw-filters" role="dialog" aria-modal="true" aria-labelledby="cw-filters-title">
      <header className="campaign-candidate-panel-header"><h2 id="cw-filters-title">Filters</h2><button type="button" className="icon-btn" onClick={onClose} aria-label="Close filters"><Icon name="close"/></button></header>
      <div className="campaign-candidate-panel-body cw-filters-body">
        <div className="cw-combine">
          <div><span>Combine filters with</span><div className="cw-segment">{(["all", "any"] as const).map(mode => <button type="button" key={mode} className={filters.combineMode === mode ? "on" : ""} aria-pressed={filters.combineMode === mode} onClick={() => onChange({ ...filters, combineMode: mode })}>{mode === "all" ? "All" : "Any"}</button>)}</div></div>
          <small>{filters.combineMode === "all" ? "A candidate must satisfy every filter." : "A candidate needs to satisfy at least one filter."} Values inside one filter still count as or. Filters run against every candidate, not just the rows on screen.</small>
        </div>
        <label className="rf-field"><span>Search the whole profile</span><input value={filters.search} onChange={event => onChange({ ...filters, search: event.target.value })} placeholder="Name, skills, employer, notes, languages"/></label>
        <p className="cw-section-label">Candidate</p>
        {select("Profession", "profession", PROFESSIONS)}
        {select("Location", "location", LOCATIONS)}
        {select("Experience", "experience", EXPERIENCE)}
        {select("Availability", "availability", AVAILABILITY)}
        <p className="cw-section-label">Skills</p>{chips("skills", SKILLS)}
        <p className="cw-section-label">Languages</p>{chips("languages", LANGUAGES)}
        {select("Qualification", "qualification", QUALIFICATIONS)}
        <p className="cw-section-label">Tags</p>{chips("tags", TAGS)}
        {select("Candidate source", "candidateSource", SOURCES)}
        <p className="cw-section-label">AI Screening</p>
        {select("Requirements", "requirements", REQUIREMENTS)}
        <div className="cw-checks">{check("Required criteria met", "requiredCriteriaMet")}{check("Required criteria not met", "requiredCriteriaNotMet")}{check("Missing evidence to verify", "missingEvidence")}{check("Knocked out by a must have", "knockedOut")}</div>
        {select("Screening state", "screeningState", SCREENING_STATES)}
        <p className="cw-section-label">Workflow</p>
        {select("Application status", "applicationStatus", APPLICATION_STATUSES)}
        {select("Review status", "reviewStatus", REVIEW_STATUSES)}
        {select("Assigned reviewer", "assignedReviewer", REVIEWERS)}
        <label className="rf-field"><span>Minimum match score: {filters.minMatchScore}%</span><input type="range" min="0" max="100" step="5" value={filters.minMatchScore} onChange={event => onChange({ ...filters, minMatchScore: Number(event.target.value) })}/></label>
      </div>
      <footer className="campaign-candidate-panel-footer cw-filters-footer"><Button variant="secondary" onClick={() => onChange(defaultFilters)}>Clear all</Button><span>{matchCount} match{matchCount === 1 ? "" : "es"}</span><Button onClick={onClose}>Show results</Button></footer>
    </aside>
  </div>, document.body);
}
