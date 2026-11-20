import { useState } from "react";
import {
  LINK_VALID_DAYS,
  MAX_ANSWER_LENGTH,
  employerName,
  findRefereeByToken,
  formatDate,
  isRefereeLinkExpired,
  referenceQuestions,
  updateRefereeByToken,
} from "./campaignReferencesOffersData";
import { Button, Icon } from "./ui";

type PageState = "form" | "submitted" | "declined";

export default function RefereeFormPage({ token }: { token: string }) {
  const [found, setFound] = useState(() => findRefereeByToken(token));
  const [answers, setAnswers] = useState<string[]>(() => referenceQuestions.map(() => ""));
  const [errors, setErrors] = useState<string[]>(() => referenceQuestions.map(() => ""));
  const [state, setState] = useState<PageState>("form");
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [saveError, setSaveError] = useState("");
  const referee = found?.referee;

  const header = <header className="rf-public-header">
    <div className="rf-public-brand"><span className="rf-public-logo" aria-hidden="true">N</span><strong>{employerName}</strong></div>
    {referee && <><h1>Reference for {referee.candidateName} – {referee.roleTitle}</h1><p className="rf-public-greeting">Hi {referee.name},</p></>}
  </header>;

  const wrap = (content: React.ReactNode) => <main className="rf-public-page"><div className="rf-public-card">{header}{content}</div><p className="rf-public-footer">Powered by RecruitFlow · Your answers are shared only with the {employerName} hiring team.</p></main>;

  if (!referee) return wrap(<StatusPanel icon="close" tone="danger" title="This link is not valid" text="We could not find this reference request. Check that you copied the whole link from the email, or contact the hiring team."/>);
  if (state === "submitted") return wrap(<StatusPanel icon="check" tone="success" title="Thank you for your reference" text={`Your answers have been sent to the ${employerName} hiring team. You can close this page.`}/>);
  if (state === "declined") return wrap(<StatusPanel icon="check" tone="neutral" title="You have declined to give a reference" text={`Thanks for letting us know. We have told the ${employerName} hiring team. You can close this page.`}/>);
  if (referee.status === "responded" || referee.status === "declined") return wrap(<StatusPanel icon="check" tone="neutral" title="This reference is already completed" text={`This link works once and has already been used${referee.respondedAt ? ` on ${formatDate(referee.respondedAt)}` : ""}. If you need to change your answers, contact the hiring team.`}/>);
  if (referee.status === "not-sent") return wrap(<StatusPanel icon="lock" tone="neutral" title="This request is not active yet" text="The hiring team has not sent this reference request yet."/>);
  if (isRefereeLinkExpired(referee)) return wrap(<StatusPanel icon="clock" tone="warning" title="This link has expired" text={`Reference links last ${LINK_VALID_DAYS} days. Ask the ${employerName} hiring team to send you a new reminder if you would still like to give a reference.`}/>);

  const refresh = () => {
    const latest = findRefereeByToken(token);
    setFound(latest);
    return latest?.referee;
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = answers.map(answer => !answer.trim() ? "Answer this question." : answer.length > MAX_ANSWER_LENGTH ? "Keep your answer to 2,000 characters or fewer." : "");
    setErrors(nextErrors);
    const firstError = nextErrors.findIndex(Boolean);
    if (firstError >= 0) {
      document.getElementById(`reference-answer-${firstError}`)?.focus();
      return;
    }
    const latest = refresh();
    if (!latest || latest.status !== "sent") return;
    const saved = updateRefereeByToken(token, current => ({ ...current, status: "responded", answers: answers.map(answer => answer.trim()), respondedAt: new Date().toISOString() }));
    if (!saved) {
      setSaveError("Your answers could not be sent. Please try again.");
      return;
    }
    setState("submitted");
  };

  const decline = () => {
    const latest = refresh();
    if (!latest || latest.status !== "sent") return;
    const saved = updateRefereeByToken(token, current => ({ ...current, status: "declined", respondedAt: new Date().toISOString() }));
    if (!saved) {
      setSaveError("We could not record your answer. Please try again.");
      return;
    }
    setState("declined");
  };

  return wrap(<form className="rf-public-form" onSubmit={submit} noValidate>
    <p className="rf-public-intro">{referee.candidateName} named you as a referee. Please answer these five short questions about working with them. It takes about five minutes. All questions are required.</p>
    {referenceQuestions.map((question, index) => {
      const id = `reference-answer-${index}`;
      return <label className={`rf-field${errors[index] ? " has-error" : ""}`} htmlFor={id} key={question}>
        <span>{index + 1}. {question}<b aria-hidden="true">*</b><em>{answers[index].length}/{MAX_ANSWER_LENGTH}</em></span>
        <textarea id={id} rows={4} maxLength={MAX_ANSWER_LENGTH} value={answers[index]} aria-required="true" aria-invalid={Boolean(errors[index])} aria-describedby={errors[index] ? `${id}-error` : undefined} onChange={event => {
          const value = event.target.value;
          setAnswers(current => current.map((item, itemIndex) => itemIndex === index ? value : item));
          setErrors(current => current.map((item, itemIndex) => itemIndex === index ? "" : item));
        }}/>
        {errors[index] && <small id={`${id}-error`} role="alert">{errors[index]}</small>}
      </label>;
    })}
    {saveError && <p className="campaign-status-error" role="alert">{saveError}</p>}
    {confirmDecline ? <div className="rf-public-decline" role="alertdialog" aria-labelledby="rf-decline-title">
      <strong id="rf-decline-title">Decline to give a reference?</strong>
      <p>The hiring team will be told you chose not to give a reference. This link will then stop working.</p>
      <div><Button variant="secondary" onClick={() => setConfirmDecline(false)}>Go back</Button><Button variant="danger" onClick={decline}>Yes, decline</Button></div>
    </div> : <div className="rf-public-actions">
      <Button variant="ghost" onClick={() => setConfirmDecline(true)}>Decline to give a reference</Button>
      <Button type="submit" icon="check">Submit reference</Button>
    </div>}
    <p className="rf-public-note"><Icon name="lock" size={13}/>This link works once and expires {LINK_VALID_DAYS} days after the request was sent.</p>
  </form>);
}

function StatusPanel({ icon, tone, title, text }: { icon: "check" | "close" | "clock" | "lock"; tone: "success" | "warning" | "danger" | "neutral"; title: string; text: string }) {
  return <section className={`rf-public-status ${tone}`} role="status">
    <span><Icon name={icon} size={22}/></span>
    <h2>{title}</h2>
    <p>{text}</p>
  </section>;
}
