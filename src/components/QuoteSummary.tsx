import { Pencil } from 'lucide-react';
import { seatCmsConfig } from '../data/featureOptionMatrix';
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

const stepNames: Record<RfqStep, string> = {
  1: 'Request Info',
  2: 'Bus Selection',
  3: 'Seats & Options',
  4: 'Review & Submit'
};

function getSelectedSeatLayoutLabel(layoutId: string) {
  const staticLayout = seatCmsConfig.layouts.find((layout) => layout.id === layoutId)?.title;
  if (staticLayout) return staticLayout;
  if (layoutId.startsWith('fp-')) return 'Admin floor plan';
  return layoutId || 'Not selected';
}

export function QuoteSummary(props: QuoteSummaryProps) {
  const { draft, progress, step, selectedChassis, selectedWheelbase, selectedBusType, features, onEdit } = props;
  const selectedSeatLayout = getSelectedSeatLayoutLabel(draft.seatPackage.layoutId);
  const displayFeatures = features.filter((feature) => feature.category !== 'Seats' && feature.category !== 'Layout');

  return (
    <aside className="summary productionSummary">
      <h3>Quote Summary <button type="button" onClick={() => onEdit(step)}><Pencil size={14} /> Edit</button></h3>
      <hr />
      <small>REQUEST INFO</small>
      <strong>{draft.company.dealerName}</strong>
      <span>Contact</span>
      <strong>{draft.company.dealerContact}</strong>
      <span>Province / State</span>
      <strong>{draft.company.provinceState}</strong>
      <hr />
      <small>BUS SELECTION</small>
      <div className="summaryBus" />
      <span>Bus Type</span>
      <strong>{selectedBusType}</strong>
      <span>Chassis</span>
      <strong>{selectedChassis}</strong>
      <span>Wheelbase</span>
      <strong>{selectedWheelbase}</strong>
      <span>Quantity</span>
      <strong>{draft.specs.quantity}</strong>
      <span>Seating Capacity</span>
      <strong>{draft.specs.seatingCapacity}</strong>
      <span>Wheelchair Capacity</span>
      <strong>{draft.specs.wheelchairCapacity}</strong>
      {step >= 3 && (
        <>
          <hr />
          <small>SEATS & OPTIONS</small>
          <span>Selected Layout</span>
          <strong>{selectedSeatLayout}</strong>
          <span>Seat Types</span>
          <strong>{draft.seatGroups.length}</strong>
          <span>Options</span>
          <strong>{displayFeatures.length} selected</strong>
          {displayFeatures.slice(0, 4).map((feature) => (
            <p className="featureSummary" key={feature.category + '-' + feature.label}>{feature.label}</p>
          ))}
        </>
      )}
      <hr />
      <small>PROGRESS</small>
      <div className="progress">
        <div>{progress}%</div>
        <span>Step {step} of 4<br /><strong>{stepNames[step]}</strong></span>
      </div>
    </aside>
  );
}
