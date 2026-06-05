import { Pencil } from 'lucide-react';
import { featureCategories } from '../../data/rfqData';
import type { RfqDraft } from '../../types/rfq';

type ReviewStepProps = {
  draft: RfqDraft;
  selectedChassis: string;
  selectedWheelbase: string;
  selectedBusType: string;
};

export function ReviewStep({ draft, selectedChassis, selectedWheelbase, selectedBusType }: ReviewStepProps) {
  return (
    <div className="sectionStack">
      <section className="reviewGrid">
        <div className="panel">
          <h2>Company Information <button className="edit"><Pencil size={15} /> Edit</button></h2>
          <p><strong>{draft.company.dealerName}</strong> • {draft.company.dealerContact} • {draft.company.provinceState}</p>
          <p>{draft.company.finalCustomerName}</p>
        </div>
        <div className="panel">
          <h2>Bus Specifications <button className="edit"><Pencil size={15} /> Edit</button></h2>
          <p><strong>{selectedBusType}</strong> • {selectedChassis} • {selectedWheelbase}</p>
          <p>Qty {draft.specs.quantity} • Seating {draft.specs.seatingCapacity} • Wheelchair {draft.specs.wheelchairCapacity}</p>
        </div>
      </section>
      <section className="panel">
        <h2>Selected Features <button className="edit"><Pencil size={15} /> Edit</button></h2>
        <div className="reviewFeatureGrid">
          {featureCategories.slice(0, 6).map((category) => (
            <div key={category.id}>
              <strong>{category.name}</strong>
              <ul>
                {category.options.slice(0, 3).map((option) => <li key={option.label}>{option.label}: {option.value}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>Submission Review</h2>
        <label className="check"><input type="checkbox" checked readOnly /> I confirm that the information provided is accurate and complete to the best of my knowledge.</label>
        <label className="check"><input type="checkbox" checked readOnly /> I consent to be contacted by a Micro Bird dealer or representative regarding this quote request.</label>
        <div className="infoBox">Your request will be reviewed by our quote team. You will receive an email confirmation shortly.</div>
      </section>
    </div>
  );
}
