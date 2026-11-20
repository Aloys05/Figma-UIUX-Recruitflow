import { useEffect, useState } from "react";

/* Ported from Refrane: shared/ai/evaluationSettings.ts and evaluationPromptTemplates.ts */

export const DEFAULT_AI_EVALUATION_INSTRUCTIONS = `You are an expert recruitment analyst for RecruitFlow.
Evaluate each application against the campaign form, deterministic rule outcomes supplied in context, and the recruiter's custom instructions when present.
Be factual: only cite information present in the submission. Flag gaps clearly.
Prefer concise, scannable prose suitable for busy recruiters.`;

export const MAX_EVALUATION_INSTRUCTIONS = 8000;

export type BuiltinEvaluationPromptTemplate = { id: string; name: string; category: string; categoryLabel: string; description: string; instructions: string };
export type OrganisationEvaluationPromptTemplate = { id: string; name: string; description: string | null; instructions: string; sourceBuiltinId: string | null; updatedAt: string };

export const BUILTIN_EVALUATION_PROMPT_TEMPLATES: readonly BuiltinEvaluationPromptTemplate[] = [
  {
    id: "general_balanced", name: "Balanced professional screening", category: "general", categoryLabel: "General",
    description: "Default emphasis for most roles: clarity, relevance, and honest gaps.",
    instructions: `Prioritise whether the candidate clearly meets the role requirements described in the form and context.
Score fit based on direct evidence in answers and attachments—not assumptions.
Call out missing information as "needs review" rather than inventing strengths.
Keep evaluation steps concise; each step should cite specific submission evidence.`,
  },
  {
    id: "entry_level_potential", name: "Entry-level & graduate", category: "entry_level", categoryLabel: "Entry level",
    description: "For junior, intern, or first-job roles where potential matters more than tenure.",
    instructions: `Weight motivation, learning signals, and transferable skills over years of experience.
Treat short work history as normal; focus on education, projects, volunteering, and written clarity.
Be encouraging but factual—do not label someone qualifying if required form rules failed.
Recommend training or alternative junior roles when fit is partial.`,
  },
  {
    id: "senior_leadership", name: "Senior & leadership", category: "senior_leadership", categoryLabel: "Senior & leadership",
    description: "For manager, lead, or strategic roles requiring scope and impact.",
    instructions: `Look for evidence of ownership, decision-making, stakeholder management, and measurable outcomes.
Penalise vague leadership claims without examples; reward specific scope (team size, budget, timelines).
Assess communication quality in long-form answers—senior roles require clarity under ambiguity.
If experience looks strong but form answers are thin, mark "needs review" and explain what is missing.`,
  },
  {
    id: "technical_engineering", name: "Technical & engineering", category: "technical", categoryLabel: "Technical",
    description: "For engineering, IT, and other skills-heavy technical hiring.",
    instructions: `Extract concrete tools, stacks, methodologies, and problem-solving examples from answers and CV text.
Distinguish "used once" from sustained experience; flag buzzwords without supporting detail.
When attachments include project or code descriptions, reference them in role_fit and experience_signals.
Do not infer skills not stated; list gaps explicitly for recruiter follow-up.`,
  },
  {
    id: "customer_service_frontline", name: "Customer-facing & frontline", category: "customer_service", categoryLabel: "Customer-facing",
    description: "For reception, retail, hospitality, and client service roles.",
    instructions: `Prioritise reliability signals: availability, location fit, customer interaction examples, and professional tone.
Notice red flags: poor spelling in required fields, inconsistent contact details, or missing mandatory documents.
Value attitude and relevant service experience; be pragmatic about career changers with transferable soft skills.
Recommend "needs review" when personality seems fine but hard requirements are unverified.`,
  },
  {
    id: "compliance_regulated", name: "Compliance-sensitive", category: "compliance", categoryLabel: "Compliance-focused",
    description: "For roles needing licences, certifications, or strict eligibility checks.",
    instructions: `Treat eligibility, licences, certifications, and work-authorisation statements as first-class criteria.
If a required credential is missing or ambiguous, outcome should be "not_qualifying" or "needs review" with explicit reason.
Avoid subjective bias; stick to documented requirements and submitted proof.
Note any contradictions between CV, form answers, and attachment metadata.`,
  },
];

export function listBuiltinTemplatesByCategory() {
  const order = ["general", "entry_level", "senior_leadership", "technical", "customer_service", "compliance"];
  return order.map(category => {
    const templates = BUILTIN_EVALUATION_PROMPT_TEMPLATES.filter(template => template.category === category);
    return { category, categoryLabel: templates[0]?.categoryLabel ?? "General", templates };
  });
}

export function normaliseInstructions(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}

/* ------------------------------------------------------------------ */
/* Organisation default (set on the AI evaluations page)               */
/* ------------------------------------------------------------------ */

export type OrganisationEvaluationSettings = { enabled: boolean; customInstructions: string | null };

const orgSettingsKey = "recruitflow.orgEvaluationSettings";
const orgTemplatesKey = "recruitflow.evaluationPromptTemplates";
const changeEvent = "recruitflow:evaluation-settings";

export const DEFAULT_ORGANISATION_EVALUATION: OrganisationEvaluationSettings = {
  enabled: true,
  customInstructions: "Evaluate each candidate against the role requirements, relevant experience, demonstrated skills, and application quality. Identify strengths, potential gaps, and areas for human review.",
};

export function readOrganisationEvaluation(): OrganisationEvaluationSettings {
  try {
    const raw = window.localStorage.getItem(orgSettingsKey);
    if (!raw) return DEFAULT_ORGANISATION_EVALUATION;
    const parsed = JSON.parse(raw) as Partial<OrganisationEvaluationSettings>;
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : true,
      customInstructions: typeof parsed.customInstructions === "string" ? parsed.customInstructions : null,
    };
  } catch {
    return DEFAULT_ORGANISATION_EVALUATION;
  }
}

export function saveOrganisationEvaluation(settings: OrganisationEvaluationSettings): boolean {
  try {
    window.localStorage.setItem(orgSettingsKey, JSON.stringify({ enabled: settings.enabled, customInstructions: normaliseInstructions(settings.customInstructions)?.slice(0, MAX_EVALUATION_INSTRUCTIONS) ?? null }));
    window.dispatchEvent(new Event(changeEvent));
    return true;
  } catch (error) {
    console.error("Could not save organisation evaluation settings.", error);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Organisation prompt templates (shared with everyone in the org)     */
/* ------------------------------------------------------------------ */

export function readOrganisationTemplates(): OrganisationEvaluationPromptTemplate[] {
  try {
    const raw = window.localStorage.getItem(orgTemplatesKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is OrganisationEvaluationPromptTemplate => typeof item?.id === "string" && typeof item?.name === "string" && typeof item?.instructions === "string") : [];
  } catch {
    return [];
  }
}

function writeOrganisationTemplates(templates: OrganisationEvaluationPromptTemplate[]): boolean {
  try {
    window.localStorage.setItem(orgTemplatesKey, JSON.stringify(templates));
    window.dispatchEvent(new Event(changeEvent));
    return true;
  } catch (error) {
    console.error("Could not save evaluation prompt templates.", error);
    return false;
  }
}

export function createOrganisationTemplate(input: { name: string; description: string | null; instructions: string; sourceBuiltinId: string | null }): OrganisationEvaluationPromptTemplate | null {
  const template: OrganisationEvaluationPromptTemplate = { id: `org-template-${Date.now().toString(36)}`, ...input, updatedAt: new Date().toISOString() };
  return writeOrganisationTemplates([...readOrganisationTemplates(), template]) ? template : null;
}

export function updateOrganisationTemplate(id: string, changes: Pick<OrganisationEvaluationPromptTemplate, "name" | "description" | "instructions">): OrganisationEvaluationPromptTemplate | null {
  const templates = readOrganisationTemplates();
  const current = templates.find(item => item.id === id);
  if (!current) return null;
  const next = { ...current, ...changes, updatedAt: new Date().toISOString() };
  return writeOrganisationTemplates(templates.map(item => item.id === id ? next : item)) ? next : null;
}

export function deleteOrganisationTemplate(id: string): boolean {
  return writeOrganisationTemplates(readOrganisationTemplates().filter(item => item.id !== id));
}

/** Re-reads organisation settings and templates whenever they change in this tab. */
export function useOrganisationEvaluation() {
  const [state, setState] = useState(() => ({ settings: readOrganisationEvaluation(), templates: readOrganisationTemplates() }));
  useEffect(() => {
    const update = () => setState({ settings: readOrganisationEvaluation(), templates: readOrganisationTemplates() });
    window.addEventListener(changeEvent, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(changeEvent, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return state;
}
