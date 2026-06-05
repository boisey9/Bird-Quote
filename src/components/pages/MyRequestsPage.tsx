import { useEffect, useState } from 'react';
import { mockRequests, type MockRequest } from '../../data/mockRequests';
import { fetchRfqRequests } from '../../services/rfqApi';

type MyRequestsPageProps = {
  onStartNew?: () => void;
};

export function MyRequestsPage({ onStartNew }: MyRequestsPageProps) {
  const [requests, setRequests] = useState<MockRequest[]>(mockRequests);
  const [loadStatus, setLoadStatus] = useState('Loading live RFQs...');

  useEffect(() => {
    let mounted = true;
    fetchRfqRequests()
      .then((items) => {
        if (!mounted) return;
        setRequests(items.length > 0 ? items : mockRequests);
        setLoadStatus(items.length > 0 ? 'Live RFQ data loaded from Neon.' : 'No live RFQs yet. Showing sample requests.');
      })
      .catch((error) => {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load RFQ requests.';
        setLoadStatus(`${message} Showing sample requests.`);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const activeReviews = requests.filter((request) => ['Submitted', 'In Review', 'Assigned', 'Quote In Progress'].includes(request.status)).length;
  const quoteSent = requests.filter((request) => request.status === 'Quote Sent').length;

  return (
    <section className="contentCard pageCard">
      <div className="pageHero">
        <div>
          <h1>My Requests</h1>
          <p>Track submitted RFQs from intake through quote creation and conversion.</p>
        </div>
        <button className="primary smallPrimary" onClick={onStartNew}>Start New RFQ</button>
      </div>

      <div className="kpiGrid">
        <div><strong>{requests.length}</strong><span>Total Requests</span></div>
        <div><strong>{activeReviews}</strong><span>Active Reviews</span></div>
        <div><strong>{quoteSent}</strong><span>Quote Sent</span></div>
        <div><strong>3.0 days</strong><span>Target Cycle Time</span></div>
      </div>

      <section className="panel tablePanel">
        <h2>Request Queue</h2>
        <p className="muted">{loadStatus}</p>
        <div className="requestTable">
          <div className="requestHead">
            <span>RFQ</span><span>Customer</span><span>Configuration</span><span>Status</span><span>Owner</span><span>SLA</span><span>Last Update</span>
          </div>
          {requests.map((request) => (
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
