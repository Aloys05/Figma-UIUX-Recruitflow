import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui";
import {
  DEFAULT_AI_EVALUATION_INSTRUCTIONS,
  MAX_EVALUATION_INSTRUCTIONS,
  createOrganisationTemplate,
  deleteOrganisationTemplate,
  listBuiltinTemplatesByCategory,
  updateOrganisationTemplate,
  useOrganisationEvaluation,
  type BuiltinEvaluationPromptTemplate,
  type OrganisationEvaluationPromptTemplate,
} from "./evaluation";

type Mode = "inherit" | "custom";
export type CampaignEvaluationValue = { mode: "default" | "custom"; instructions: string; enabled: boolean };

/** Campaign Evaluation, ported from Refrane's CampaignEvaluationSection. */
export default function CampaignEvaluationSection({ campaignId, value, canEdit, editReason, onSave }: {
  campaignId: string;
  value: CampaignEvaluationValue;
  canEdit: boolean;
  editReason: string | null;
  /** Saves the settings; resolves to an error message, or null when saved. */
  onSave: (value: CampaignEvaluationValue) => Promise<string | null>;
}) {
  const { settings: orgDefault } = useOrganisationEvaluation();
  const [mode, setMode] = useState<Mode>(value.mode === "custom" ? "custom" : "inherit");
  const [customInstructions, setCustomInstructions] = useState(value.mode === "custom" ? value.instructions : orgDefault.customInstructions ?? "");
  const [enabled, setEnabled] = useState(value.mode === "custom" ? value.enabled : orgDefault.enabled);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setSavedMessage(null);
    setSaveError(null);
    setSaving(true);
    const error = await onSave(mode === "inherit"
      ? { mode: "default", instructions: "", enabled: true }
      : { mode: "custom", instructions: customInstructions.trim(), enabled });
    setSaving(false);
    if (error) setSaveError(error);
    else setSavedMessage("Saved.");
  };

  const disabled = !canEdit;
  return <div className="cw-eval">
    <div className="campaign-evaluation-options">
      <label className={mode === "inherit" ? "selected" : ""}><input type="radio" name={`campaign-evaluation-mode-${campaignId}`} disabled={disabled} checked={mode === "inherit"} onChange={() => { setMode("inherit"); setSavedMessage(null); }}/><span><strong>Use organisation default</strong><small>Inherit the instructions set on the Evaluations page.</small></span></label>
      <label className={mode === "custom" ? "selected" : ""}><input type="radio" name={`campaign-evaluation-mode-${campaignId}`} disabled={disabled} checked={mode === "custom"} onChange={() => { setMode("custom"); setSavedMessage(null); }}/><span><strong>Customize for this campaign</strong><small>Write instructions and enable/disable AI review just for this campaign.</small></span></label>
    </div>

    {mode === "inherit" ? <div className="campaign-evaluation-default">
      <span>ORGANISATION DEFAULT {orgDefault.enabled ? "" : "(DISABLED)"}</span>
      <pre className="cw-eval-pre">{orgDefault.customInstructions?.trim() ? orgDefault.customInstructions : "No custom instructions set — only the base analyst prompt applies."}</pre>
    </div> : <>
      <label className="cw-check cw-eval-enable"><input type="checkbox" checked={enabled} disabled={disabled} onChange={event => setEnabled(event.target.checked)}/>Enable AI evaluations for this campaign</label>
      <div>
        <span className="cw-section-label">Base prompt (read-only)</span>
        <pre className="cw-eval-pre muted">{DEFAULT_AI_EVALUATION_INSTRUCTIONS}</pre>
      </div>
      <PromptTemplateLibrary customInstructions={customInstructions} onApplyInstructions={setCustomInstructions} disabled={disabled || !enabled}/>
      <div className="cw-eval-instructions">
        <label htmlFor={`campaign-custom-instructions-${campaignId}`}>Instructions for this campaign</label>
        <p>Describe role fit, red flags, scoring emphasis, or compliance checks specific to this role (max 8,000 characters).</p>
        <textarea id={`campaign-custom-instructions-${campaignId}`} value={customInstructions} maxLength={MAX_EVALUATION_INSTRUCTIONS} rows={10} disabled={disabled || !enabled} onChange={event => { setCustomInstructions(event.target.value); setSavedMessage(null); }} placeholder="Describe the screening focus for this role. Do not include sensitive or discriminatory criteria."/>
        <small>{customInstructions.length} / {MAX_EVALUATION_INSTRUCTIONS}</small>
      </div>
    </>}

    <div className="cw-eval-actions">
      {canEdit ? <Button disabled={saving} onClick={() => { void handleSave(); }}>{saving ? "Saving…" : "Save evaluation settings"}</Button>
        : <span className="rf-permission-guard" title={editReason ?? undefined} tabIndex={0}><Button disabled>Save evaluation settings</Button></span>}
      {savedMessage && <span className="cw-eval-saved" role="status">{savedMessage}</span>}
      {saveError && <span className="cw-danger-text" role="alert">Failed to save. {saveError}</span>}
    </div>
  </div>;
}

type SelectedTemplate = { kind: "builtin"; template: BuiltinEvaluationPromptTemplate } | { kind: "organisation"; template: OrganisationEvaluationPromptTemplate };

function PromptTemplateLibrary({ customInstructions, onApplyInstructions, disabled }: { customInstructions: string; onApplyInstructions: (instructions: string) => void; disabled: boolean }) {
  const { templates: orgTemplates } = useOrganisationEvaluation();
  const grouped = useMemo(() => listBuiltinTemplatesByCategory(), []);
  const [selected, setSelected] = useState<SelectedTemplate | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  // Keep the selected organisation template in step with saved changes.
  useEffect(() => {
    if (selected?.kind !== "organisation") return;
    const latest = orgTemplates.find(item => item.id === selected.template.id);
    if (!latest) setSelected(null);
    else if (latest.updatedAt !== selected.template.updatedAt) setSelected({ kind: "organisation", template: latest });
  }, [orgTemplates, selected]);

  const previewInstructions = selected?.template.instructions ?? "";
  const useTemplate = () => {
    if (!previewInstructions.trim()) return;
    onApplyInstructions(previewInstructions);
    setMessage("Template applied to your custom instructions. Review, edit if needed, then Save settings.");
  };
  const saveAsTemplate = () => {
    const instructions = customInstructions.trim();
    if (!instructions) { setMessage("Add instructions before saving a template."); return; }
    const name = saveName.trim();
    if (!name) { setMessage("Enter a name for this template."); return; }
    const created = createOrganisationTemplate({ name, description: saveDescription.trim() || null, instructions, sourceBuiltinId: selected?.kind === "builtin" ? selected.template.id : null });
    if (!created) { setMessage("The template could not be saved. Try again."); return; }
    setShowSaveForm(false);
    setSaveName("");
    setSaveDescription("");
    setSelected({ kind: "organisation", template: created });
    setMessage("Template saved for your organisation.");
  };

  return <div className="cw-template-library">
    <header>
      <div><h3>Prompt template library</h3><p>Choose a starter template by role type or seniority, customise the text, then save settings. Saved templates are shared with everyone in your organisation.</p></div>
      <Button variant="secondary" disabled={disabled} onClick={() => { setShowSaveForm(open => !open); setMessage(null); }}>Save current as template</Button>
    </header>
    {showSaveForm && <div className="cw-template-save">
      <label className="rf-field"><span>Template name</span><input value={saveName} maxLength={120} placeholder="e.g. Engineering — senior hire" onChange={event => setSaveName(event.target.value)}/></label>
      <label className="rf-field"><span>Short description (optional)</span><input value={saveDescription} maxLength={500} onChange={event => setSaveDescription(event.target.value)}/></label>
      <Button disabled={disabled} onClick={saveAsTemplate}>Save organisation template</Button>
    </div>}
    <div className="cw-template-grid">
      <nav className="cw-template-list" aria-label="Prompt templates">
        {grouped.map(group => <div key={group.category}>
          <p className="cw-template-group">{group.categoryLabel}</p>
          {group.templates.map(template => <button type="button" key={template.id} aria-pressed={selected?.kind === "builtin" && selected.template.id === template.id} className={selected?.kind === "builtin" && selected.template.id === template.id ? "on" : ""} onClick={() => setSelected({ kind: "builtin", template })}>{template.name}</button>)}
        </div>)}
        <div className="cw-template-org">
          <p className="cw-template-group">Your organisation</p>
          {orgTemplates.length === 0 ? <p className="cw-muted">No saved templates yet.</p> : orgTemplates.map(template => <button type="button" key={template.id} aria-pressed={selected?.kind === "organisation" && selected.template.id === template.id} className={selected?.kind === "organisation" && selected.template.id === template.id ? "on" : ""} onClick={() => setSelected({ kind: "organisation", template })}>{template.name}</button>)}
        </div>
      </nav>
      <div className="cw-template-preview">
        {selected ? <>
          <strong>{selected.template.name}</strong>
          {selected.template.description && <p>{selected.template.description}</p>}
          <pre className="cw-eval-pre">{previewInstructions}</pre>
          <div className="cw-row-actions">
            <Button disabled={disabled || !previewInstructions.trim()} onClick={useTemplate}>Use template</Button>
            {selected.kind === "organisation" && <>
              <Button variant="secondary" disabled={disabled} onClick={() => {
                const instructions = customInstructions.trim();
                if (!instructions) { setMessage("Add instructions before updating the template."); return; }
                const updated = updateOrganisationTemplate(selected.template.id, { name: selected.template.name, description: selected.template.description, instructions });
                if (updated) { setSelected({ kind: "organisation", template: updated }); setMessage("Template updated."); }
              }}>Update from editor</Button>
              <Button variant="danger" onClick={() => { if (deleteOrganisationTemplate(selected.template.id)) { setSelected(null); setMessage("Template deleted."); } }}>Delete</Button>
            </>}
          </div>
        </> : <p className="cw-muted">Select a starter or organisation template to preview it, then use it to fill your custom instructions.</p>}
      </div>
    </div>
    {message && <p className="cw-eval-saved" role="status">{message}</p>}
  </div>;
}
