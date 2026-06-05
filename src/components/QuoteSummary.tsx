import { Pencil } from 'lucide-react';
import type { FeatureSelection, RfqDraft, RfqStep } from '../types/rfq';

type QuoteSummaryProps = {
  draft: RfqDraft;
  progress: number;
  step: RfqStep;
  selectedChassis: string;
  selectedWheelbase: string;
  selectedBusType: string;
  features: FeatureSelection[];
};

export function QuoteSummary({ draft, progress, step, selectedChassis, selectedWheelbase, selectedBusType, features }: QuoteSummaryProps) {
  return (
    <aside className="summary">
      <h3>Quote Summary <button>Edit <Pencil size={14} /></button></h3>
      <hr />
      <small>COMPANY</small>
      <strong>{draft.company.dealerName}</strong>
      <span>Contact</span>
      <strong>{draft.company.dealerContact}</strong>
      <span>Province / State</span>
      <strong>{draft.company.provinceState}</strong>
      <hr />
      <small>BUS SPECIFICATIONS</small>
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
          <small>SELECTED FEATURES</small>
          {features.map((feature) => (
            <p className="featureSummary" key={feature.label}>{feature.label}<strong>{feature.value}</strong></p>
          ))}
        </>
      )}
      <hr />
      <small>PROGRESS</small>
      <div className="progress">
        <div>{progress}%</div>
        <span>Step {step} of 4<br /><strong>{['Company Information', 'Bus Specifications', 'Features & Options', 'Review & Submit'][step - 1]}</strong></span>
      </div>
    </aside>
  );
}
