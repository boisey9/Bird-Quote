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
import './components/pages/PageStyles.css';
import { CompanyStep } from './components/steps/CompanyStep';
import { SpecsStep } from './components/steps/SpecsStep';
import { FeaturesStep } from './components/steps/FeaturesStep';
import { ReviewStep } from './components/steps/ReviewStep';
import type { RfqDraft, RfqStep } from './types/rfq';

export function App() {
  const [page, setPage] = useState<AppPage>('new-quote');
  const [step, setStep] = useState<RfqStep>(1);
  const [draft, setDraft] = useState<RfqDraft>(initialDraft);

  const selectedChassis = busSpecMatrixData.chassis.find((item) => item.id === draft.specs.chassis);
  const selectedWheelbase = busSpecMatrixData.wheelbases.find((item) => item.id === draft.specs.wheelbase);
  const selectedBusType = busSpecMatrixData.busTypes.find((item) => item.id === draft.specs.busType);
  const summaryFeatures = useMemo(() => draft.features.slice(0, 6), [draft.features]);
  const progress = step * 25;

  const goNext = () => setStep((current) => Math.min(4, current + 1) as RfqStep);
  const goBack = () => setStep((current) => Math.max(1, current - 1) as RfqStep);

  const selectedChassisName = selectedChassis?.name ?? '';
  const selectedWheelbaseName = selectedWheelbase?.name ?? '';
  const selectedBusTypeName = selectedBusType?.name ?? '';

  return (
    <div className="appShell">
      <Header page={page} onNavigate={setPage} />
      {page === 'new-quote' && (
        <main className="layout">
          <RecentRequests />
          <section className="contentCard">
            <Hero step={step} />
            <Stepper step={step} />
            {step === 1 && <CompanyStep draft={draft} setDraft={setDraft} />}
            {step === 2 && <SpecsStep draft={draft} setDraft={setDraft} />}
            {step === 3 && <FeaturesStep draft={draft} setDraft={setDraft} />}
            {step === 4 && (
              <ReviewStep
                draft={draft}
                selectedChassis={selectedChassisName}
                selectedWheelbase={selectedWheelbaseName}
                selectedBusType={selectedBusTypeName}
              />
            )}
            <div className="actions">
              <button className="secondary" onClick={goBack}>{step === 1 ? 'Save & Exit' : 'Previous'}</button>
              <button className="primary" onClick={step === 4 ? undefined : goNext}>
                {step === 4 ? 'Submit Quote Request' : step === 1 ? 'Next: Bus Specifications' : step === 2 ? 'Next: Features & Options' : 'Next: Review & Submit'} <ArrowRight size={18} />
              </button>
            </div>
          </section>
          <QuoteSummary
            draft={draft}
            progress={progress}
            step={step}
            selectedChassis={selectedChassisName}
            selectedWheelbase={selectedWheelbaseName}
            selectedBusType={selectedBusTypeName}
            features={summaryFeatures}
          />
        </main>
      )}
      {page === 'my-requests' && (
        <main className="layout singlePageLayout">
          <MyRequestsPage />
        </main>
      )}
      {page === 'quote-status' && (
        <main className="layout singlePageLayout">
          <QuoteStatusPage />
        </main>
      )}
    </div>
  );
}
