import { useEffect, useMemo, useState } from 'react';
import { mockRequests, statusSteps, type MockRequest } from '../../data/mockRequests';
import { fetchRfqRequests } from '../../services/rfqApi';
import type { PortalUser } from '../../session/sessionTypes';

type QuoteStatusPageProps = {
  user: PortalUser;
};

export function QuoteStatusPage({ user }: QuoteStatusPageProps) {
  const [requests, setRequests] = useState<MockRequest[]>(mockRequests);
  const [selectedId, setSelectedId] = useState(mockRequests[0]?.id ?? '');
  const [loadStatus, setLoadStatus] = useState('Loading live RFQs...');
  const isDealerView = user.role === 'dealer';

  useEffect(() => {
    let mounted = true;
    fetchRfqRequests(isDealerView ? { scope: 'dealer', user } : { scope: 'all', user })
      .then((items) => {
        if (!mounted) return;
        const nextRequests = items.length > 0 ? items : mockRequests;
        setRequests(nextRequests);
        setSelectedId(nextRequests[0]?.id ?? '');
        setLoadStatus(items.length > 0 ? (isDealerView ? 'Live quote status loaded for your dealer account.' : 'Live RFQ status loaded from Neon.') : 'No live RFQs yet. Showing sample status.');
      })
      .catch((error) => {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load RFQ status.';
        setLoadStatus(`${message} Showing sample status.`);
      });
    return () => { mounted = false; };
  }, [isDealerView, user]);

  const selectedRequest = useMemo(() => requests.find((request) => request.id === selectedId) ?? requests[0] ?? mockRequests[0], [requests, selectedId]);
  const currentIndex = statusSteps.indexOf(selectedRequest.status) >= 0 ? statusSteps.indexOf(selectedRequest.status) : 0;

  return (
    <section className="contentCard pageCard">
      <div className="pageHero">
        <div>
          <h1>Quote Status</h1>
          <p>{isDealerView ? 'Follow quote status for RFQs submitted by your dealer account.' : 'Follow each RFQ across dealer intake, sales review, quote creation, approval, and conversion.'}</p>
        </div>
        <select className="statusSearch" value={selectedRequest.id} onChange={(event) => setSelectedId(event.target.value)}>
          {requests.map((request) => <option key={request.id} value={request.id}>{request.id}</option>)}
        </select>
      </div>

      <section className="panel">
        <h2>{selectedRequest.id} - {selectedRequest.finalCustomer}</h2>
        <p className="muted">{selectedRequest.busType} • {selectedRequest.chassis} • {selectedRequest.wheelbase}</p>
        <p className="muted">{loadStatus}</p>
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
          <p><strong>Dealer:</strong> {selectedRequest.dealer}</p>
        </div>
      </section>
    </section>
  );
}
