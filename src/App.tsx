import { useMemo, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { busSpecMatrixData } from './data/busSpecMatrix';
import { initialDraft } from './data/initialDraft';
import { Header, type AppPage, type UserRole } from './components/Header';
import { RecentRequests } from './components/RecentRequests';
import { Hero, Stepper } from './components/RfqShell';
import { QuoteSummary } from './components/QuoteSummary';
import { MyRequestsPage } from './components/pages/MyRequestsPage';
import { QuoteStatusPage } from './components/pages/QuoteStatusPage';
import { InternalQueuePage } from './components/pages/InternalQueuePage';
import { AdminConfigPage } from './components/pages/AdminConfigPage';
import { ConfirmationPage } from './components/pages/ConfirmationPage';
import './components/pages/PageStyles.css';
import './components/pages/LayoutFixes.css';
import { CompanyStep } from './components/steps/CompanyStep';
import { SpecsStep } from './components/steps/SpecsStep';
import { FeaturesStep } from './components/steps/FeaturesStep';
import { ReviewStep } from './components/steps/ReviewStep';
import { buildRfqSubmissionPayload, getDraftValidationIssues } from './utils/rfqSubmission';
import type { RfqDraft, RfqStep } from './types/rfq';

const defaultPageByRole: Record<UserRole, AppPage> = {
  dealer: 'new-quote',
  internal: 'rfq-queue',
  admin: 'admin-config'
};

const permittedPages: Record<UserRole, AppPage[]> = {
  dealer: ['new-quote', 'my-requests', 'quote-status', 'confirmation'],
  internal: ['new-quote', 'my-requests', 'quote-status', 'rfq-queue', 'confirmation'],
  admin: ['new-quote', 'my-requests', 'quote-status', 'rfq-queue', 'admin-config', 'confirmation']
};

const nextButtonLabels: Record<RfqStep, string> = {
  1: 'Next: Bus Selection',
  2: 'Next: Seats & Options',
  3: 'Next: Review',
  4: 'Submit Quote Request'
};

function getInitialRole(): UserRole {
  if (typeof window === 'undefined') return 'dealer';
  const roleParam = new URLSearchParams(window.location.search).get('role');
  return roleParam === 'admin' || roleParam === 'internal' || roleParam === 'dealer' ? roleParam : 'dealer';
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="drawerBackdrop helpBackdrop" role="presentation">
      <aside className="helpModal" aria-label="RFQ help">
        <header className="drawerHeader">
          <div>
            <small>RFQ V2 Help</small>
            <h2>How the workflow works</h2>
            <p>Dealer intake and internal workflow layer — not the final configurator.</p>
          </div>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </header>
        <div className="drawerContent">
          <section>
            <h3>Dealer flow</h3>
            <p>Submit structured RFQs in four steps: request info, bus selection, seats/options, and review.</p>
          </section>
          <section>
            <h3>Seats and layouts</h3>
            <p>Seat previews are reference only. Micro Bird validates final seating, engineering feasibility, and quote details.</p>
          </section>
          <section>
            <h3>Documents</h3>
            <p>Document metadata can still be captured later, but it is no longer a dedicated dealer step.</p>
          </section>
        </div>
      </aside>
    </div>
  );
}

export function App() {
  const [role, setRole] = useState<UserRole>(() => getInitialRole());
  const [page, setPage] = useState<AppPage>(() => defaultPageByRole[getInitialRole()]);
  const [step, setStep] = useState<RfqStep>(1);
  const [draft, setDraft] = useState<RfqDraft>(initialDraft);
  const [submittedDraft, setSubmittedDraft] = useState<RfqDraft | null>(null);
  const [submittedRfqId, setSubmittedRfqId] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const selectedChassis = busSpecMatrixData.chassis.find((item) => item.id === draft.specs.chassis);
  const selectedWheelbase = busSpecMatrixData.wheelbases.find((item) => item.id === draft.specs.wheelbase);
  const selectedBusType = busSpecMatrixData.busTypes.find((item) => item.id === draft.specs.busType);
  const summaryFeatures = useMemo(() => draft.features.slice(0, 6), [draft.features]);
  const progress = Math.round((step / 4) * 100);

  const navigate = (targetPage: AppPage) => {
    if (!permittedPages[role].includes(targetPage)) {
      setPage(defaultPageByRole[role]);
      return;
    }
    setPage(targetPage);
  };

  const handleRoleChange = (nextRole: UserRole) => {
    setRole(nextRole);
    if (!permittedPages[nextRole].includes(page)) setPage(defaultPageByRole[nextRole]);
  };

  const goNext = () => setStep((current) => Math.min(4, current + 1) as RfqStep);
  const goBack = () => setStep((current) => Math.max(1, current - 1) as RfqStep);
  const saveAndExit = () => {
    localStorage.setItem('birdQuoteDraft', JSON.stringify(draft));
    setSubmitStatus('Draft saved locally. You can continue editing from this browser session.');
    setPage('my-requests');
  };
  const jumpToStep = (targetStep: RfqStep) => {
    setPage('new-quote');
    setStep(targetStep);
    setSubmitStatus('');
  };
  const startNewRfq = () => {
    setDraft(initialDraft);
    setSubmittedDraft(null);
    setSubmittedRfqId('');
    setStep(1);
    setSubmitStatus('');
    setPage('new-quote');
  };

  const selectedChassisName = selectedChassis?.name ?? '';
  const selectedWheelbaseName = selectedWheelbase?.name ?? '';
  const selectedBusTypeName = selectedBusType?.name ?? '';

  async function submitRfq() {
    const errors = getDraftValidationIssues(draft).filter((issue) => issue.severity === 'error');
    if (errors.length > 0) {
      setSubmitStatus(`Please fix ${errors.length} required item(s) before submitting.`);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('Submitting RFQ...');

    try {
      const response = await fetch('/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRfqSubmissionPayload(draft))
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error ?? 'Unable to submit RFQ.');
      setSubmittedRfqId(result.rfqId ?? 'RFQ-SUBMITTED');
      setSubmittedDraft(draft);
      setSubmitStatus('');
      setPage('confirmation');
    } catch (error) {
      setSubmitStatus(error instanceof Error ? error.message : 'Unable to submit RFQ.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="appShell">
      <Header page={page} role={role} onNavigate={navigate} onRoleChange={handleRoleChange} onHelp={() => setShowHelp(true)} />
      {page === 'new-quote' && (
        <main className="quoteFormLayout productionQuoteLayout">
          <RecentRequests />
          <section className="contentCard quoteFormCard">
            <Hero step={step} />
            <Stepper step={step} />
            {step === 1 && <CompanyStep draft={draft} setDraft={setDraft} />}
            {step === 2 && <SpecsStep draft={draft} setDraft={setDraft} />}
            {step === 3 && <FeaturesStep draft={draft} setDraft={setDraft} />}
            {step === 4 && <ReviewStep draft={draft} selectedChassis={selectedChassisName} selectedWheelbase={selectedWheelbaseName} selectedBusType={selectedBusTypeName} onEdit={jumpToStep} />}
            {submitStatus && <div className="submitStatus">{submitStatus}</div>}
            <div className="actions productionActions">
              <button className="secondary" type="button" onClick={step === 1 ? saveAndExit : goBack}>{step === 1 ? 'Save & Exit' : 'Previous'}</button>
              <button className="primary" disabled={isSubmitting} onClick={step === 4 ? submitRfq : goNext}>
                {isSubmitting ? 'Submitting...' : nextButtonLabels[step]} <ArrowRight size={18} />
              </button>
            </div>
          </section>
          <QuoteSummary draft={draft} progress={progress} step={step} selectedChassis={selectedChassisName} selectedWheelbase={selectedWheelbaseName} selectedBusType={selectedBusTypeName} features={summaryFeatures} onEdit={jumpToStep} />
        </main>
      )}
      {page === 'confirmation' && submittedDraft && <ConfirmationPage rfqId={submittedRfqId} draft={submittedDraft} onStartNew={startNewRfq} onViewRequests={() => setPage('my-requests')} />}
      {page === 'my-requests' && <main className="pageLayout"><MyRequestsPage onStartNew={startNewRfq} /></main>}
      {page === 'quote-status' && <main className="pageLayout"><QuoteStatusPage /></main>}
      {page === 'rfq-queue' && <main className="pageLayout"><InternalQueuePage /></main>}
      {page === 'admin-config' && <main className="pageLayout"><AdminConfigPage /></main>}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
