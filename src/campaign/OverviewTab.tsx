import { describeActivity, formatEventTime, screenApplication, type WorkspaceData, type WorkspaceRequirement } from "./workspaceStore";

export default function OverviewTab({ data, requirements, onOpenShortlists, onEditRequirements }: {
  data: WorkspaceData;
  requirements: readonly WorkspaceRequirement[];
  onOpenShortlists: () => void;
  onEditRequirements: () => void;
}) {
  const screened = data.applications.map(application => screenApplication(application, requirements));
  const submitted = data.applications.length;
  const qualifying = screened.filter(item => item.requirementsSummary === "Meets requirements").length;
  const notQualifying = screened.filter(item => item.requirementsSummary === "Requirement not met").length;
  const needsReview = submitted - qualifying - notQualifying;
  const decided = qualifying + notQualifying;
  const percent = submitted ? Math.round((decided / submitted) * 100) : 0;
  const pending = data.proposals.filter(item => item.status === "Pending approval").length;
  const events = data.activity.slice(0, 20);

  return <div className="campaign-overview-grid cw-overview">
    <section className="campaign-overview-card" aria-label="Screening progress">
      <span className="eyebrow">Screening progress</span>
      {submitted === 0 ? <p>No applications yet. Results will show here as candidates apply.</p> : <>
        <p><strong>{decided}</strong> of {submitted} applications have a clear result.</p>
        <div className="cw-progress" role="progressbar" aria-label="Applications with a clear screening result" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{ width: `${percent}%` }}/></div>
        <div className="cw-counts">
          <div className="success"><strong>{qualifying}</strong><span>Meets</span></div>
          <div className="warning"><strong>{needsReview}</strong><span>Needs verification</span></div>
          <div className="danger"><strong>{notQualifying}</strong><span>Not met</span></div>
        </div>
      </>}
    </section>
    <section className="campaign-overview-card" aria-label="Pending approvals">
      <span className="eyebrow">Pending approvals</span>
      {pending === 0 ? <p>Nothing is waiting for approval.</p> : <p><strong className="cw-big">{pending}</strong> {pending === 1 ? "shortlist is" : "shortlists are"} waiting for a decision.</p>}
      <button type="button" className="campaign-inline-link" onClick={onOpenShortlists}>Go to approvals</button>
    </section>
    <section className="campaign-overview-card" aria-label="Requirements">
      <span className="eyebrow">Requirements</span>
      {requirements.length === 0 ? <p>No requirements set yet. Candidates will not be screened until you add some.</p> : <ul className="cw-requirement-list">
        {requirements.map(requirement => <li key={requirement.id}><span>{requirement.title}<small> · {requirement.category}</small></span><span className={`cw-pill ${requirement.kind === "Must-have" ? "info" : "neutral"}`}>{requirement.kind} · {requirement.weight}</span></li>)}
      </ul>}
      <button type="button" className="campaign-inline-link" onClick={onEditRequirements}>Edit requirements</button>
    </section>
    <section className="campaign-overview-card" aria-label="Recent activity">
      <span className="eyebrow">Recent activity</span>
      {events.length === 0 ? <p>Nothing has happened on this campaign yet.</p> : <ol className="campaign-activity-list">
        {events.map(event => <li key={event.id}><span>{describeActivity(event)}</span><small><time dateTime={event.createdAt}>{formatEventTime(event.createdAt)}</time></small></li>)}
      </ol>}
    </section>
  </div>;
}
