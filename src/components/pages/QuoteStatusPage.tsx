import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../common/EmptyState';
import { ProcessStepper } from '../common/ProcessStepper';
import { StatusBadge } from '../common/StatusBadge';
import { mockRequests, statusSteps, type MockRequest } from '../../data/mockRequests';
import { fetchRfqRequests } from '../../services/rfqApi';
import type { PortalUser } from '../../session/sessionTypes';

type QuoteStatusPageProps = { user: PortalUser; onStartNew?: () => void };

const statusStepItems = statusSteps.map((status) => ({ id: status, label: status }));

export function QuoteStatusPage({ user, onStartNew }: QuoteStatusPageProps) {
  const [requests, setRequests] = useState<MockRequest[]>(user.role === 'dealer' ? [] : mockRequests);
  const [selectedId, setSelectedId] = useState(mockRequests[0]?.id ?? '');
  const [loadStatus, setLoadStatus] = useState('Loading live RFQs...');
  const isDealerView = user.role === 'dealer';

  useEffect(() => {
    let mounted = true;
    fetchRfqRequests(isDealerView ? { scope: 'dealer', user } : { scope: 'all', user })
      .then((items) => {
        if (!mounted) return;
        const nextRequests = items.length > 0 ? items : (isDealerView ? [] : mockRequests);
        setRequests(nextRequests);
        setSelectedId(nextRequests[0]?.id ?? '');
        setLoadStatus(items.length > 0 ? (isDealerView ? 'Live quote status loaded for your dealer account.' : 'Live RFQ status loaded from Neon.') : (isDealerView ? 'No active RFQs found for your dealer account.' : 'No live RFQs yet. Showing sample status.'));
      })
      .catch((error) => {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load RFQ status.';
        setLoadStatus(isDealerView ? message : `${message} Showing sample status.`);
        if (isDealerView) setRequests([]);
      });
    return () => { mounted = false; };
  }, [isDealerView, user]);

  const selectedRequest = useMemo(() => requests.find((request) => request.id === selectedId) ?? requests[0], [requests, selectedId]);
  const currentIndex = selectedRequest ? statusSteps.indexOf(selectedRequest.status) : 0;
  const currentStep = currentIndex >= 0 ? currentIndex + 1 : 1;

  return (
    <section className="contentCard pageCard">
      <div className="pageHero">
        <div>
          <h1>Quote Status</h1>
          <p>{isDealerView ? 'Follow quote status for RFQs submitted by your dealer account.' : 'Follow each RFQ across intake, review, quote creation, approval, and conversion.'}</p>
        </div>
        {selectedRequest && <select className="statusSearch" value={selectedRequest.id} onChange={(event) => setSelectedId(event.target.value)}>{requests.map((request) => <option key={request.id} value={request.id}>{request.id}</option>)}</select>}
      </div>

      {!selectedRequest ? (
        <section className="panel"><p className="muted">{loadStatus}</p><EmptyState title="No active RFQs yet" message="Start a new RFQ and its quote status will appear here once submitted." actionLabel="Start New RFQ" onAction={onStartNew} /></section>
      ) : (
        <>
          <section className="panel">
            <h2>{selectedRequest.id} - {selectedRequest.finalCustomer}</h2>
            <p className="muted">{selectedRequest.busType} • {selectedRequest.chassis} • {selectedRequest.wheelbase}</p>
            <p className="muted">{loadStatus}</p>
            <ProcessStepper steps={statusStepItems} current={currentStep} compact />
          </section>
          <section className="reviewGrid">
            <div className="panel">
              <h2>Current Status</h2>
              <div className="statusCard"><StatusBadge status={selectedRequest.status} detail={selectedRequest.lastUpdate} /><span>{selectedRequest.lastUpdate}</span></div>
            </div>
            <div className="panel">
              <h2>RFQ Details</h2>
              <p><strong>Owner:</strong> {selectedRequest.owner}</p>
              <p><strong>SLA Age:</strong> {selectedRequest.slaAge}</p>
              <p><strong>Submitted:</strong> {selectedRequest.submittedDate}</p>
              <p><strong>Dealer:</strong> {selectedRequest.dealer}</p>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
