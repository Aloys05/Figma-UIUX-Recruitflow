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
