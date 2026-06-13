import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { initialDraft } from './data/initialDraft';
import { useVehicleMatrixCms } from './hooks/useVehicleMatrixCms';
import { Header, type AppPage } from './components/Header';
import { Hero, Stepper } from './components/RfqShell';
import { QuoteSummary } from './components/QuoteSummary';
import { MyRequestsPage } from './components/pages/MyRequestsPage';
import { QuoteStatusPage } from './components/pages/QuoteStatusPage';
import { InternalQueuePage } from './components/pages/InternalQueuePage';
import { AdminConfigPage } from './components/pages/AdminConfigPage';
import { ConfirmationPage } from './components/pages/ConfirmationPage';
import { LoginPage } from './components/pages/LoginPage';
import { canAccessPage, getDefaultPage } from './session/permissionRules';
import { usePortalSession } from './session/usePortalSession';
import './components/pages/PageStyles.css';
import './components/pages/LayoutFixes.css';
import './components/steps/RfqCleanup.css';
import { CompanyStep } from './components/steps/CompanyStep';
import { SpecsStep } from './components/steps/SpecsStep';
import { FeaturesStep } from './components/steps/FeaturesStep';
import { ReviewStep } from './components/steps/ReviewStep';
import { buildRfqSubmissionPayload, getDraftValidationIssues } from './utils/rfqSubmission';
import type { RfqDraft, RfqStep } from './types/rfq';

const nextButtonLabels: Record<RfqStep, string> = {
  1: 'Next: Bus Selection',
  2: 'Next: Seats & Options',
  3: 'Next: Review',
  4: 'Submit Quote Request'
};

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
  const portalSession = usePortalSession();
  const user = portalSession.user;
  const [page, setPage] = useState<AppPage>('new-quote');
  const [step, setStep] = useState<RfqStep>(1);
  const [draft, setDraft] = useState<RfqDraft>(initialDraft);
  const [submittedDraft, setSubmittedDraft] = useState<RfqDraft | null>(null);
  const [submittedRfqId, setSubmittedRfqId] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const vehicleCms = useVehicleMatrixCms();
  const vehicleMatrix = vehicleCms.matrix;

  useEffect(() => {
    if (!user) return;
    if (!canAccessPage(user, page)) setPage(getDefaultPage(user));
  }, [page, user]);

  const selectedChassis = vehicleMatrix.chassis.find((item) => item.id === draft.specs.chassis);
  const selectedWheelbase = vehicleMatrix.wheelbases.find((item) => item.id === draft.specs.wheelbase);
  const selectedBusType = vehicleMatrix.busTypes.find((item) => item.id === draft.specs.busType);
  const summaryFeatures = useMemo(() => draft.features.filter((feature) => feature.category !== 'Seats' && feature.category !== 'Layout').slice(0, 6), [draft.features]);
  const progress = Math.round((step / 4) * 100);

  if (!user) return <LoginPage status={portalSession.status} onSignIn={portalSession.signInWithDemoUser} />;
  const activeUser = user;

  const navigate = (targetPage: AppPage) => {
    if (!canAccessPage(activeUser, targetPage)) {
      setPage(getDefaultPage(activeUser));
      return;
    }
    setPage(targetPage);
  };

  const goNext = () => setStep((current) => Math.min(4, current + 1) as RfqStep);
  const goBack = () => setStep((current) => Math.max(1, current - 1) as RfqStep);
  const saveAndExit = () => {
    localStorage.setItem(`birdQuoteDraft:${activeUser.id}`, JSON.stringify({ userId: activeUser.id, dealerId: activeUser.dealerId, draft }));
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
      const payload = buildRfqSubmissionPayload(draft);
      const response = await fetch('/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, userId: activeUser.id, dealerId: activeUser.dealerId, submittedBy: activeUser.email })
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
      <Header page={page} user={activeUser} onNavigate={navigate} onSignOut={portalSession.signOut} onHelp={() => setShowHelp(true)} />
      {page === 'new-quote' && (
        <main className="quoteFormLayout productionQuoteLayout rfqNoRecentLayout">
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
              <button className="primary" disabled={isSubmitting} onClick={step === 4 ? submitRfq : goNext}>{isSubmitting ? 'Submitting...' : nextButtonLabels[step]} <ArrowRight size={18} /></button>
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
