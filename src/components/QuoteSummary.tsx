import { Pencil } from 'lucide-react';
import { seatCmsConfig } from '../data/featureOptionMatrix';
import { useRfqWeightEstimate } from '../hooks/useWeightBalanceCms';
import type { FeatureSelection, RfqDraft, RfqStep } from '../types/rfq';

type QuoteSummaryProps = {
  draft: RfqDraft;
  progress: number;
  step: RfqStep;
  selectedChassis: string;
  selectedWheelbase: string;
  selectedBusType: string;
  features: FeatureSelection[];
  onEdit: (step: RfqStep) => void;
};

const stepNames: Record<RfqStep, string> = { 1: 'Request Info', 2: 'Bus Selection', 3: 'Seats & Options', 4: 'Review & Submit' };
const weightLabels = { ok: 'Weight OK', warning: 'Weight Watch', overweight: 'Potential Overweight', 'review-required': 'Review Required', unknown: 'Weight Unknown' };
function display(value: string | number | undefined | null) { if (value === undefined || value === null || value === '') return 'Not selected'; return value; }
function getSelectedSeatLayoutLabel(layoutId: string) { const staticLayout = seatCmsConfig.layouts.find((layout) => layout.id === layoutId)?.title; if (staticLayout) return staticLayout; if (layoutId.startsWith('fp-')) return 'Admin floor plan'; return layoutId || 'Not selected'; }
function formatLbs(value: number) { return `${Math.round(value).toLocaleString()} lb`; }
function SummaryRow({ label, value }: { label: string; value: string | number | undefined | null }) { return <p className="summaryRow"><span>{label}</span><strong>{display(value)}</strong></p>; }

export function QuoteSummary(props: QuoteSummaryProps) {
  const { draft, progress, step, selectedChassis, selectedWheelbase, selectedBusType, features, onEdit } = props;
  const selectedSeatLayout = getSelectedSeatLayoutLabel(draft.seatPackage.layoutId);
  const displayFeatures = features.filter((feature) => feature.category !== 'Seats' && feature.category !== 'Layout');
  const weight = useRfqWeightEstimate(draft);
  const estimate = weight.estimate;

  return (
    <aside className="summary productionSummary rfqSnapshot">
      <h3><span>RFQ Snapshot</span><button type="button" onClick={() => onEdit(step)}><Pencil size={14} /> Edit</button></h3>
      <section className="summarySection"><small>REQUEST INFO</small><SummaryRow label="Dealer" value={draft.company.dealerName} /><SummaryRow label="Contact" value={draft.company.dealerContact} /><SummaryRow label="Province / State" value={draft.company.provinceState} /></section>
      <section className="summarySection"><small>BUS SELECTION</small><div className="summaryBus"><span>Micro Bird</span></div><SummaryRow label="Bus Type" value={selectedBusType} /><SummaryRow label="Chassis" value={selectedChassis} /><SummaryRow label="Wheelbase" value={selectedWheelbase} /><SummaryRow label="Quantity" value={draft.specs.quantity || 'Not selected'} /><SummaryRow label="Passengers" value={draft.specs.seatingCapacity || 'Not selected'} /><SummaryRow label="Wheelchair" value={draft.specs.wheelchairCapacity || 0} /></section>
      {step >= 3 && <section className="summarySection"><small>SEATS & OPTIONS</small><SummaryRow label="Layout" value={selectedSeatLayout} /><SummaryRow label="Seat Types" value={draft.seatGroups.length ? draft.seatGroups.length : 'Not selected'} /><SummaryRow label="Options" value={`${displayFeatures.length} selected`} />{displayFeatures.length > 0 ? <div className="summaryChips">{displayFeatures.slice(0, 4).map((feature) => <span key={feature.category + '-' + feature.label}>{feature.label}</span>)}</div> : <p className="summaryEmpty">No options selected yet.</p>}<div className={`weightEstimateCard ${estimate.status}`}><small>RFQ WEIGHT ESTIMATE</small><strong>{weightLabels[estimate.status]}</strong><span>Estimated remaining</span><b>{estimate.profile ? formatLbs(estimate.estimatedRemainingWeightLbs) : 'Profile needed'}</b><p>{estimate.status === 'ok' ? 'Within sales-estimate threshold.' : 'Micro Bird review required before final configuration.'}</p><em>Seats {formatLbs(estimate.selectedSeatsWeightLbs)} • Options {formatLbs(estimate.selectedOptionsWeightLbs)}</em></div></section>}
      <section className="summarySection"><small>PROGRESS</small><div className="progress"><div>{progress}%</div><span>Step {step} of 4<br /><strong>{stepNames[step]}</strong></span></div></section>
    </aside>
  );
}
