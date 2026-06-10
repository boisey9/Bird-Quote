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
  1: 'Dealer / Customer',
  2: 'Vehicle',
  3: 'Options',
  4: 'Seats',
  5: 'Review'
};

export function QuoteSummary({ draft, progress, step, selectedChassis, selectedWheelbase, selectedBusType, features, onEdit }: QuoteSummaryProps) {
  const selectedSeatLayout = seatCmsConfig.layouts.find((layout) => layout.id === draft.seatPackage.layoutId)?.title ?? draft.seatPackage.layoutId;

  return (
    <aside className="summary productionSummary">
      <h3>Quote Summary <button type="button" onClick={() => onEdit(step)}><Pencil size={14} /> Edit</button></h3>
      <hr />
      <small>DEALER / CUSTOMER</small>
      <strong>{draft.company.dealerName}</strong>
      <span>Contact</span>
      <strong>{draft.company.dealerContact}</strong>
      <span>Province / State</span>
      <strong>{draft.company.provinceState}</strong>
      <hr />
      <small>VEHICLE INTENT</small>
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
          <small>OPTIONS</small>
          <strong>{draft.features.length} selected options</strong>
          {features.map((feature) => (
            <p className="featureSummary" key={`${feature.category}-${feature.label}`}>{feature.label}<strong>{feature.category}</strong></p>
          ))}
        </>
      )}
      {step >= 4 && (
        <>
          <hr />
          <small>SEATS</small>
          <span>Selected Layout</span>
          <strong>{selectedSeatLayout}</strong>
          <span>Material / Color</span>
          <strong>{draft.seatPackage.material} / {draft.seatPackage.color}</strong>
          <span>Seat Types</span>
          <strong>{draft.seatGroups.length}</strong>
          <span>Wheelchair Positions</span>
          <strong>{draft.seatPackage.wheelchairPositions}</strong>
        </>
      )}
      <hr />
      <small>PROGRESS</small>
      <div className="progress">
        <div>{progress}%</div>
        <span>Step {step} of 5<br /><strong>{stepNames[step]}</strong></span>
      </div>
    </aside>
  );
}
