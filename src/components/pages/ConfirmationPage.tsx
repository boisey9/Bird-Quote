import { CheckCircle2, Clock, FileText, Mail, PlusCircle } from 'lucide-react';
import type { RfqDraft } from '../../types/rfq';

type ConfirmationPageProps = {
  rfqId: string;
  draft: RfqDraft;
  onStartNew: () => void;
  onViewRequests: () => void;
};

export function ConfirmationPage({ rfqId, draft, onStartNew, onViewRequests }: ConfirmationPageProps) {
  return (
    <main className="pageLayout confirmationLayout">
      <section className="contentCard confirmationCard">
        <div className="confirmationHero">
          <div className="confirmationIcon"><CheckCircle2 size={42} /></div>
          <small>RFQ Submitted</small>
          <h1>Your quote request has been submitted.</h1>
          <p>Micro Bird will review the request details, documents, seating intent, and selected options before preparing the quote.</p>
          <div className="confirmationId">{rfqId}</div>
        </div>

        <div className="confirmationGrid">
          <article>
            <FileText size={22} />
            <strong>Request Summary</strong>
            <span>{draft.company.finalCustomerName || 'Final customer pending'} • Qty {draft.specs.quantity}</span>
          </article>
          <article>
            <Clock size={22} />
            <strong>Next Step</strong>
            <span>Sales Ops will validate completeness and assign the request.</span>
          </article>
          <article>
            <Mail size={22} />
            <strong>Follow-up</strong>
            <span>Your Micro Bird contact may request missing information or clarification.</span>
          </article>
        </div>

        <section className="confirmationDetails panel">
          <h2>What happens next?</h2>
          <div className="confirmationTimeline">
            <p><strong>1. Intake validation</strong><span>Micro Bird reviews required fields, documents, and compatibility warnings.</span></p>
            <p><strong>2. Assignment</strong><span>The RFQ is assigned to the appropriate quote owner or estimating support.</span></p>
            <p><strong>3. Quote preparation</strong><span>The final configuration, seating layout, pricing, and feasibility are validated outside the RFQ app.</span></p>
            <p><strong>4. Quote response</strong><span>The dealer receives the quote response or a request for missing information.</span></p>
          </div>
        </section>

        <div className="confirmationActions">
          <button className="primary" type="button" onClick={onViewRequests}><FileText size={18} /> View My Requests</button>
          <button className="secondary" type="button" onClick={onStartNew}><PlusCircle size={18} /> Start Another RFQ</button>
        </div>
      </section>
    </main>
  );
}
