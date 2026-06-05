import { mockRequests, statusSteps } from '../../data/mockRequests';

export function QuoteStatusPage() {
  const selectedRequest = mockRequests[0];
  const currentIndex = statusSteps.indexOf(selectedRequest.status) >= 0 ? statusSteps.indexOf(selectedRequest.status) : 0;

  return (
    <section className="contentCard pageCard">
      <div className="pageHero">
        <div>
          <h1>Quote Status</h1>
          <p>Follow each RFQ across dealer intake, sales review, quote creation, approval, and conversion.</p>
        </div>
        <div className="statusSearch">{selectedRequest.id}</div>
      </div>

      <section className="panel">
        <h2>{selectedRequest.id} — {selectedRequest.finalCustomer}</h2>
        <p className="muted">{selectedRequest.busType} • {selectedRequest.chassis} • {selectedRequest.wheelbase}</p>
        <div className="timeline">
          {statusSteps.map((status, index) => (
            <div className={index <= currentIndex ? 'timelineStep active' : 'timelineStep'} key={status}>
              <strong>{index + 1}</strong>
              <span>{status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="reviewGrid">
        <div className="panel">
          <h2>Current Status</h2>
          <div className="statusCard">
            <strong>{selectedRequest.status}</strong>
            <span>{selectedRequest.lastUpdate}</span>
          </div>
        </div>
        <div className="panel">
          <h2>RFQ Details</h2>
          <p><strong>Owner:</strong> {selectedRequest.owner}</p>
          <p><strong>SLA Age:</strong> {selectedRequest.slaAge}</p>
          <p><strong>Submitted:</strong> {selectedRequest.submittedDate}</p>
        </div>
      </section>
    </section>
  );
}
