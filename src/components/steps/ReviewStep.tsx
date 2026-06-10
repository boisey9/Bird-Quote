import { Pencil } from 'lucide-react';
import { getDraftValidationIssues } from '../../utils/rfqSubmission';
import { seatCmsConfig } from '../../data/featureOptionMatrix';
import type { RfqDraft, RfqStep } from '../../types/rfq';

type ReviewStepProps = {
  draft: RfqDraft;
  selectedChassis: string;
  selectedWheelbase: string;
  selectedBusType: string;
  onEdit: (step: RfqStep) => void;
};

export function ReviewStep({ draft, selectedChassis, selectedWheelbase, selectedBusType, onEdit }: ReviewStepProps) {
  const validationIssues = getDraftValidationIssues(draft);
  const warningCount = validationIssues.filter((issue) => issue.severity === 'warning').length;
  const errorCount = validationIssues.filter((issue) => issue.severity === 'error').length;
  const selectedSeatLayout = seatCmsConfig.layouts.find((layout) => layout.id === draft.seatPackage.layoutId)?.title ?? draft.seatPackage.layoutId;

  return (
    <div className="sectionStack reviewStepPage">
      <section className="reviewGrid">
        <div className="panel">
          <h2>Dealer / Customer <button className="edit" type="button" onClick={() => onEdit(1)}><Pencil size={15} /> Edit</button></h2>
          <p><strong>{draft.company.dealerName}</strong> • {draft.company.dealerContact} • {draft.company.provinceState}</p>
          <p>{draft.company.finalCustomerName}</p>
          <p>{draft.company.additionalInfo}</p>
        </div>
        <div className="panel">
          <h2>Vehicle Intent <button className="edit" type="button" onClick={() => onEdit(2)}><Pencil size={15} /> Edit</button></h2>
          <p><strong>{selectedBusType}</strong> • {selectedChassis} • {selectedWheelbase}</p>
          <p>Qty {draft.specs.quantity} • Seating {draft.specs.seatingCapacity} • Wheelchair {draft.specs.wheelchairCapacity}</p>
        </div>
      </section>

      <section className="panel">
        <h2>Selected Options <button className="edit" type="button" onClick={() => onEdit(3)}><Pencil size={15} /> Edit</button></h2>
        <div className="reviewFeatureGrid">
          {draft.features.length === 0 ? <p>No additional options selected.</p> : draft.features.slice(0, 12).map((feature) => (
            <div key={`${feature.category}-${feature.label}`}>
              <strong>{feature.category}</strong>
              <ul>
                <li>{feature.label}</li>
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Seats & Floorplan Intent <button className="edit" type="button" onClick={() => onEdit(4)}><Pencil size={15} /> Edit</button></h2>
        <div className="reviewFeatureGrid">
          <div>
            <strong>Seat Package</strong>
            <ul>
              <li>Layout: {selectedSeatLayout}</li>
              <li>Material: {draft.seatPackage.material}</li>
              <li>Color: {draft.seatPackage.color}</li>
              <li>Estimated Seats: {draft.seatPackage.estimatedPassengerSeats}</li>
              <li>Wheelchair Positions: {draft.seatPackage.wheelchairPositions}</li>
            </ul>
          </div>
          {draft.seatGroups.map((group) => (
            <div key={group.id}>
              <strong>{group.name}</strong>
              <ul>
                <li>Qty: {group.quantity}</li>
                <li>Style: {group.seatStyle}</li>
                <li>Restraint: {group.restraintType}</li>
                <li>Armrest: {group.armrest}</li>
                <li>Grab: {group.grabType}</li>
                <li>Branding: {group.branding}</li>
              </ul>
            </div>
          ))}
        </div>
        <div className="infoBox">Reference only - final seating layout will be reviewed and validated by Micro Bird.</div>
      </section>

      <section className="panel">
        <h2>Validation Review</h2>
        {validationIssues.length === 0 ? (
          <div className="infoBox">No validation issues found. Your request is ready to submit.</div>
        ) : (
          <div className="infoBox">
            <strong>{errorCount} errors • {warningCount} warnings</strong>
            <ul>
              {validationIssues.map((issue) => <li key={`${issue.section}-${issue.message}`}>{issue.section}: {issue.message}</li>)}
            </ul>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Submission Review</h2>
        <label className="check"><input type="checkbox" checked readOnly /> I confirm that the information provided is accurate and complete to the best of my knowledge.</label>
        <label className="check"><input type="checkbox" checked readOnly /> I understand seating shown is reference only and will be reviewed by Micro Bird.</label>
        <label className="check"><input type="checkbox" checked readOnly /> I consent to be contacted by a Micro Bird dealer or representative regarding this quote request.</label>
        <div className="infoBox">Your request will be reviewed by our quote team. You will receive an email confirmation shortly.</div>
      </section>
    </div>
  );
}
