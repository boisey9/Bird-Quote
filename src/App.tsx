import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { busSpecMatrixData } from './data/busSpecMatrix';
import { initialDraft } from './data/initialDraft';
import { Header, type AppPage } from './components/Header';
import { RecentRequests } from './components/RecentRequests';
import { Hero, Stepper } from './components/RfqShell';
import { QuoteSummary } from './components/QuoteSummary';
import { MyRequestsPage } from './components/pages/MyRequestsPage';
import { QuoteStatusPage } from './components/pages/QuoteStatusPage';
import { InternalQueuePage } from './components/pages/InternalQueuePage';
import './components/pages/PageStyles.css';
import './components/pages/LayoutFixes.css';
import { CompanyStep } from './components/steps/CompanyStep';
import { SpecsStep } from './components/steps/SpecsStep';
import { FeaturesStep } from './components/steps/FeaturesStep';
import { ReviewStep } from './components/steps/ReviewStep';
import { buildRfqSubmissionPayload, getDraftValidationIssues } from './utils/rfqSubmission';
import type { RfqDraft, RfqStep } from './types/rfq';

export function App() {
  const [page, setPage] = useState<AppPage>('new-quote');
  const [step, setStep] = useState<RfqStep>(1);
  const [draft, setDraft] = useState<RfqDraft>(initialDraft);
  const [submitStatus, setSubmitStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedChassis = busSpecMatrixData.chassis.find((item) => item.id === draft.specs.chassis);
  const selectedWheelbase = busSpecMatrixData.wheelbases.find((item) => item.id === draft.specs.wheelbase);
  const selectedBusType = busSpecMatrixData.busTypes.find((item) => item.id === draft.specs.busType);
  const summaryFeatures = useMemo(() => draft.features.slice(0, 6), [draft.features]);
  const progress = step * 25;

  const goNext = () => setStep((current) => Math.min(4, current + 1) as RfqStep);
  const goBack = () => setStep((current) => Math.max(1, current - 1) as RfqStep);
  const jumpToStep = (targetStep: RfqStep) => {
    setPage('new-quote');
    setStep(targetStep);
    setSubmitStatus('');
  };
  const startNewRfq = () => {
    setDraft(initialDraft);
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
      setSubmitStatus(`Submitted successfully: ${result.rfqId}`);
      setPage('my-requests');
    } catch (error) {
      setSubmitStatus(error instanceof Error ? error.message : 'Unable to submit RFQ.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="appShell">
      <Header page={page} onNavigate={setPage} />
      {page === 'new-quote' && (
        <main className="quoteFormLayout">
          <RecentRequests />
          <section className="contentCard quoteFormCard">
            <Hero step={step} />
            <Stepper step={step} />
            {step === 1 && <CompanyStep draft={draft} setDraft={setDraft} />}
            {step === 2 && <SpecsStep draft={draft} setDraft={setDraft} />}
            {step === 3 && <FeaturesStep draft={draft} setDraft={setDraft} />}
            {step === 4 && <ReviewStep draft={draft} selectedChassis={selectedChassisName} selectedWheelbase={selectedWheelbaseName} selectedBusType={selectedBusTypeName} onEdit={jumpToStep} />}
            {submitStatus && <div className="submitStatus">{submitStatus}</div>}
            <div className="actions">
              <button className="secondary" onClick={goBack}>{step === 1 ? 'Save & Exit' : 'Previous'}</button>
              <button className="primary" disabled={isSubmitting} onClick={step === 4 ? submitRfq : goNext}>
                {isSubmitting ? 'Submitting...' : step === 4 ? 'Submit Quote Request' : step === 1 ? 'Next: Bus Specifications' : step === 2 ? 'Next: Features & Options' : 'Next: Review & Submit'} <ArrowRight size={18} />
              </button>
            </div>
          </section>
          <QuoteSummary draft={draft} progress={progress} step={step} selectedChassis={selectedChassisName} selectedWheelbase={selectedWheelbaseName} selectedBusType={selectedBusTypeName} features={summaryFeatures} onEdit={jumpToStep} />
        </main>
      )}
      {page === 'my-requests' && <main className="pageLayout"><MyRequestsPage onStartNew={startNewRfq} /></main>}
      {page === 'quote-status' && <main className="pageLayout"><QuoteStatusPage /></main>}
      {page === 'rfq-queue' && <main className="pageLayout"><InternalQueuePage /></main>}
    </div>
  );
}
