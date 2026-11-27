import { useEffect, useId } from "react";
import { Button, Icon, type IconName } from "./ui";
import type { CampaignViewer } from "./campaignReferencesOffersData";

/** A button that is disabled with an explanatory tooltip when the viewer lacks permission. */
export function PermissionButton({ allowed, reason, children, variant = "secondary", icon, onClick, type = "button", disabled = false }: {
  allowed: boolean;
  reason: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconName;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  if (allowed) return <Button variant={variant} icon={icon} onClick={onClick} type={type} disabled={disabled}>{children}</Button>;
  return <span className="rf-permission-guard" title={reason} tabIndex={0} aria-label={`${typeof children === "string" ? children : "Action"} unavailable. ${reason}`}>
    <Button variant={variant} icon={icon} disabled>{children}</Button>
  </span>;
}

export function ViewerSwitcher({ viewers, viewer, onChange }: { viewers: CampaignViewer[]; viewer: CampaignViewer; onChange: (id: string) => void }) {
  const id = useId();
  return <div className="rf-viewer-switcher">
    <label htmlFor={id}><Icon name="user" size={15}/>Viewing as</label>
    <select id={id} value={viewer.id} onChange={event => onChange(event.target.value)}>
      {viewers.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select>
    <small>Mock role switcher to preview permissions.</small>
  </div>;
}

export function WorkflowDialog({ title, eyebrow, onClose, children, footer, wide = false, labelledBy }: {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  labelledBy?: string;
}) {
  const fallbackId = useId();
  const titleId = labelledBy ?? fallbackId;
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);
  return <div className="campaign-message-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`campaign-message-dialog rf-dialog${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h3 id={titleId}>{title}</h3></div><button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close"/></button></header>
      <div className="rf-dialog-body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </section>
  </div>;
}

export type PickerItem = {
  id: string;
  name: string;
  /** Short line under the name, e.g. the pipeline stage. */
  meta: string;
  /** Status on the right, e.g. "2 of 3 answered" or "Sent back". */
  status?: { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" };
};

const pickerInitials = (name: string) => name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();

/** Candidate list for the References and Offers tabs. The chosen candidate is clearly highlighted. */
export function CandidatePicker({ label, items, selectedId, onSelect }: {
  label: string;
  items: readonly PickerItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const onKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(event.key)) return;
    event.preventDefault();
    const index = items.findIndex(item => item.id === selectedId);
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    const next = items[(index + step + items.length) % items.length];
    if (!next) return;
    onSelect(next.id);
    document.getElementById(`rf-pick-${next.id}`)?.focus();
  };
  return <nav className="rf-picker" aria-label={label}>
    <p className="rf-picker-label">{label}<span>{items.length}</span></p>
    <ul role="listbox" aria-label={label} onKeyDown={onKeyDown}>{items.map(item => {
      const selected = item.id === selectedId;
      return <li key={item.id} role="presentation">
        <button type="button" id={`rf-pick-${item.id}`} role="option" aria-selected={selected} tabIndex={selected ? 0 : -1} className={`rf-pick${selected ? " selected" : ""}`} onClick={() => onSelect(item.id)}>
          <span className="rf-avatar">{pickerInitials(item.name)}</span>
          <span className="rf-pick-text"><strong>{item.name}</strong><small>{item.meta}</small></span>
          {item.status && <span className={`rf-pick-status ${item.status.tone}`}>{item.status.label}</span>}
          {selected && <span className="rf-pick-check" aria-hidden="true"><Icon name="check" size={12}/></span>}
        </button>
      </li>;
    })}</ul>
  </nav>;
}

export function EmailPreviewDialog({ eyebrow, email, actionLabel, linkLabel, note, error, onSend, onClose }: {
  eyebrow: string;
  email: { to: string; subject: string; body: string };
  actionLabel?: string;
  /** Text inside the body that should render as a button, e.g. "Give a reference". */
  linkLabel?: string;
  note?: string;
  error?: string;
  onSend: () => void;
  onClose: () => void;
}) {
  const renderBody = () => email.body.split("\n").map((line, index) => {
    if (linkLabel && line === `[ ${linkLabel} ]`) return <span className="rf-email-button" key={index}>{linkLabel}</span>;
    return line ? <p key={index}>{line}</p> : <br key={index}/>;
  });
  return <WorkflowDialog eyebrow={eyebrow} title="Email preview" onClose={onClose} wide footer={<>
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button icon="mail" onClick={onSend} disabled={Boolean(error)}>{actionLabel ?? "Send"}</Button>
  </>}>
    <dl className="rf-email-meta">
      <div><dt>To</dt><dd>{email.to}</dd></div>
      <div><dt>Subject</dt><dd>{email.subject}</dd></div>
    </dl>
    <div className="rf-email-body">{renderBody()}</div>
    {note && <p className="rf-dialog-note">{note}</p>}
    {error && <p className="campaign-status-error" role="alert">{error}</p>}
  </WorkflowDialog>;
}
