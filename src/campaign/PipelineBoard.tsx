import { useState } from "react";
import CandidatePanel from "./CandidatePanel";
import type { CampaignActor } from "./permissions";
import { OverrideLabel } from "./CandidatePanel";
import { GuardedButton, Pill, ReasonDialog } from "./workspaceUi";
import {
  PIPELINE_STAGES,
  describeMove,
  screenApplication,
  stageName,
  workflowTabForMove,
  type CampaignWorkspaceStore,
  type StageId,
  type WorkspaceApplication,
  type WorkspaceRequirement,
} from "./workspaceStore";

export default function PipelineBoard({ store, requirements, actor, offerStatusFor, onOpenWorkflow }: {
  store: CampaignWorkspaceStore;
  requirements: readonly WorkspaceRequirement[];
  actor: CampaignActor;
  offerStatusFor: (applicationId: string) => string | null;
  onOpenWorkflow: (applicationId: string, tab: "references" | "offers") => void;
}) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [pending, setPending] = useState<{ application: WorkspaceApplication; to: StageId; kind: "reject" | "override" | "unreject" } | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  // On phones the board becomes a stage picker plus one list.
  const [mobileStage, setMobileStage] = useState<StageId>("longlist");
  const [announcement, setAnnouncement] = useState("");
  const profile = store.data.applications.find(item => item.id === profileId) ?? null;

  const requestMove = (application: WorkspaceApplication, to: StageId) => {
    setMenuFor(null);
    const workflowTab = workflowTabForMove(application.stage, to);
    if (workflowTab) {
      setAnnouncement(`Opening ${workflowTab === "references" ? "References" : "Offers"} for this candidate.`);
      onOpenWorkflow(application.id, workflowTab);
      return;
    }
    const move = describeMove(application.stage, to, actor.role);
    if (!move.allowed || !move.kind) {
      const reason = move.reason ?? "No move information is available.";
      setMoveError(reason);
      setAnnouncement(`Move refused: ${reason}`);
      return;
    }
    setMoveError(null);
    setPending({ application, to, kind: move.kind });
  };

  const confirmMove = (reason: string, share: boolean) => {
    if (!pending) return;
    const error = store.moveOnBoard(pending.application.id, pending.to, reason, share, actor);
    if (error) {
      setMoveError(error);
      setAnnouncement(`Move refused: ${error}`);
    } else {
      setAnnouncement(`${pending.application.name} moved to ${stageName(pending.to)}.`);
    }
    setPending(null);
  };

  return <div className="cw-board-wrap">
    <p className="cw-intro">Review candidates across the campaign stages.</p>
    {moveError && <p className="cw-alert danger" role="alert">Move refused: {moveError}</p>}
    <div className="cw-stage-picker" role="tablist" aria-label="Choose a stage">
      {PIPELINE_STAGES.map(stage => {
        const count = store.data.applications.filter(item => item.stage === stage.id).length;
        return <button type="button" role="tab" key={stage.id} aria-selected={mobileStage === stage.id} className={mobileStage === stage.id ? "on" : ""} onClick={() => setMobileStage(stage.id)}>{stage.name}<span>{count}</span></button>;
      })}
    </div>
    <div className="campaign-pipeline-scroll" aria-label="Pipeline board; horizontally scroll to view all stages">
      <div className="campaign-pipeline-grid">{PIPELINE_STAGES.map(stage => {
        const candidates = store.data.applications.filter(item => item.stage === stage.id);
        return <section className={`campaign-pipeline-stage${mobileStage === stage.id ? " is-picked" : ""}`} key={stage.id} aria-labelledby={`pipeline-column-${stage.id}`}>
          <header><div><h3 id={`pipeline-column-${stage.id}`}>{stage.name}</h3><p>{stage.helpText}</p></div><span className="campaign-stage-count" aria-label={`${candidates.length} candidates`}>{candidates.length}</span></header>
          {candidates.length === 0 ? <div className="campaign-pipeline-empty">No candidates in this stage.</div> : <div className="campaign-pipeline-candidates">{candidates.map(application => {
            const screening = screenApplication(application, requirements);
            const offerStatus = offerStatusFor(application.id);
            return <article className="campaign-pipeline-candidate cw-card" key={application.id}>
              <button type="button" className="cw-name-link" onClick={() => setProfileId(application.id)} aria-label={`Open ${application.name} profile`}>{application.name}</button>
              <p className="cw-headline">{application.headline}</p>
              <div className="cw-card-scores">
                <span className="cw-card-score"><strong>{screening.requirementsScore}%</strong><small>Requirements</small></span>
                <span className="cw-card-score"><strong>{screening.mustHave.met} of {screening.mustHave.total}</strong><small>Must-haves met</small></span>
                <span className="cw-card-score"><strong>{application.fitScore}%</strong><small>AI fit</small></span>
              </div>
              {screening.mustHave.failed.length > 0 && <p className="cw-card-failed"><strong>Failed must-have:</strong> {screening.mustHave.failed.join(", ")}</p>}
              <div className="cw-chips">
                <OverrideLabel application={application}/>
                {screening.screeningPending && <Pill tone="info">Screening…</Pill>}
                {screening.screeningFailed && <Pill tone="danger">Screening failed</Pill>}
                {screening.knockedOut && <Pill tone="danger">Knocked out</Pill>}
                {offerStatus && <Pill tone="purple">Offer: {offerStatus}</Pill>}
              </div>
              {application.stage === "below-requirements" && !application.overridden && <GuardedButton role={actor.role} action="manageLonglist" className="cw-card-action" onClick={() => requestMove(application, "longlist")}>Move to Longlist</GuardedButton>}
              <div className="cw-move">
                <button type="button" className="cw-move-toggle" aria-expanded={menuFor === application.id} aria-controls={`move-menu-${application.id}`} onClick={() => setMenuFor(current => current === application.id ? null : application.id)}>Move</button>
                {menuFor === application.id && <ul id={`move-menu-${application.id}`} className="cw-move-list" aria-label={`Move ${application.name}`}>
                  {PIPELINE_STAGES.map(target => {
                    const workflowTab = workflowTabForMove(application.stage, target.id);
                    const move = describeMove(application.stage, target.id, actor.role);
                    const enabled = move.allowed || Boolean(workflowTab);
                    return <li key={target.id} className={target.id === application.stage ? "current" : ""}>
                      <button type="button" disabled={!enabled} title={enabled ? undefined : move.reason ?? undefined} onClick={() => requestMove(application, target.id)}>{target.name}{workflowTab ? ` · open ${workflowTab === "references" ? "References" : "Offers"}` : ""}</button>
                      {!enabled && <small>{move.reason}</small>}
                      {workflowTab && <small>{move.reason}</small>}
                    </li>;
                  })}
                </ul>}
              </div>
            </article>;
          })}</div>}
        </section>;
      })}</div>
    </div>
    <p className="sr-only-live" aria-live="polite">{announcement}</p>
    <p className="cw-footnote">Stage changes apply to this view only.</p>
    {pending && <ReasonDialog kind={pending.kind} applications={[pending.application]} requirements={requirements} onCancel={() => setPending(null)} onConfirm={confirmMove}/>}
    {profile && <CandidatePanel application={profile} requirements={requirements} offerStatus={offerStatusFor(profile.id)} store={store} actor={actor} onClose={() => setProfileId(null)}/>}
  </div>;
}
