import { mockRequests } from '../../data/mockRequests';

export function MyRequestsPage() {
  return (
    <section className="contentCard pageCard">
      <div className="pageHero">
        <div>
          <h1>My Requests</h1>
          <p>Track submitted RFQs from intake through quote creation and conversion.</p>
        </div>
        <button className="primary smallPrimary">Start New RFQ</button>
      </div>

      <div className="kpiGrid">
        <div><strong>{mockRequests.length}</strong><span>Total Requests</span></div>
        <div><strong>2</strong><span>Active Reviews</span></div>
        <div><strong>1</strong><span>Quote Sent</span></div>
        <div><strong>3.0 days</strong><span>Target Cycle Time</span></div>
      </div>

      <section className="panel tablePanel">
        <h2>Request Queue</h2>
        <div className="requestTable">
          <div className="requestHead">
            <span>RFQ</span><span>Customer</span><span>Configuration</span><span>Status</span><span>Owner</span><span>SLA</span><span>Last Update</span>
          </div>
          {mockRequests.map((request) => (
            <div className="requestRow" key={request.id}>
              <strong>{request.id}<small>{request.submittedDate}</small></strong>
              <span>{request.finalCustomer}<small>{request.dealer}</small></span>
              <span>{request.busType}<small>{request.chassis} • {request.wheelbase}</small></span>
              <em>{request.status}</em>
              <span>{request.owner}</span>
              <span>{request.slaAge}</span>
              <span>{request.lastUpdate}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
