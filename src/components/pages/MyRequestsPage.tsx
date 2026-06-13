import { useEffect, useState } from 'react';
import { mockRequests, type MockRequest } from '../../data/mockRequests';
import { fetchRfqRequests, fetchRfqRows, type RfqApiRow } from '../../services/rfqApi';
import type { PortalUser } from '../../session/sessionTypes';
import { canDealerEditRfq } from '../../utils/rfqDraftHydration';

type MyRequestsPageProps = {
  user: PortalUser;
  onStartNew?: () => void;
  onEditRequest?: (row: RfqApiRow) => void;
  onDuplicateRequest?: (row: RfqApiRow) => void;
};

export function MyRequestsPage({ user, onStartNew, onEditRequest, onDuplicateRequest }: MyRequestsPageProps) {
  const [requests, setRequests] = useState<MockRequest[]>(mockRequests);
  const [rows, setRows] = useState<RfqApiRow[]>([]);
  const [loadStatus, setLoadStatus] = useState('Loading live RFQs...');
  const isDealerView = user.role === 'dealer';

  useEffect(() => {
    let mounted = true;
    const scope = isDealerView ? { scope: 'dealer' as const, user } : { scope: 'all' as const, user };
    Promise.all([fetchRfqRequests(scope), fetchRfqRows(scope)])
      .then(([items, rawRows]) => {
        if (!mounted) return;
        setRequests(items.length > 0 ? items : mockRequests);
        setRows(rawRows);
        setLoadStatus(items.length > 0 ? (isDealerView ? 'Live RFQs loaded for this account.' : 'Live RFQ data loaded from Neon.') : 'No live RFQs yet. Showing sample requests.');
      })
      .catch((error) => {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load RFQ requests.';
        setLoadStatus(`${message} Showing sample requests.`);
      });
    return () => { mounted = false; };
  }, [isDealerView, user]);

  const activeReviews = requests.filter((request) => ['Submitted', 'In Review', 'Assigned', 'Quote In Progress'].includes(request.status)).length;
  const quoteSent = requests.filter((request) => request.status === 'Quote Sent').length;
  const getRow = (requestId: string) => rows.find((item) => item.id === requestId);

  return (
    <section className="contentCard pageCard">
      <div className="pageHero">
        <div>
          <h1>My Requests</h1>
          <p>{isDealerView ? 'Track submitted RFQs. Unprocessed requests can be edited; any request can be duplicated.' : 'Track submitted RFQs from intake through quote creation and conversion.'}</p>
        </div>
        {onStartNew && <button className="primary smallPrimary" onClick={onStartNew}>Start New RFQ</button>}
      </div>

      <div className="kpiGrid">
        <div><strong>{requests.length}</strong><span>Total Requests</span></div>
        <div><strong>{activeReviews}</strong><span>Active Reviews</span></div>
        <div><strong>{quoteSent}</strong><span>Quote Sent</span></div>
        <div><strong>3.0 days</strong><span>Target Cycle Time</span></div>
      </div>

      <section className="panel tablePanel">
        <h2>{isDealerView ? 'Dealer RFQs' : 'Request Queue'}</h2>
        <p className="muted">{loadStatus}</p>
        <div className="requestTable">
          <div className="requestHead requestHeadWithActions">
            <span>RFQ</span><span>Customer</span><span>Configuration</span><span>Status</span><span>Owner</span><span>SLA</span><span>Last Update</span><span>Actions</span>
          </div>
          {requests.map((request) => {
            const row = getRow(request.id);
            const canEdit = Boolean(isDealerView && row && canDealerEditRfq(row));
            return (
              <div className="requestRow requestRowWithActions" key={request.id}>
                <strong>{request.id}<small>{request.submittedDate}</small></strong>
                <span>{request.finalCustomer}<small>{request.dealer}</small></span>
                <span>{request.busType}<small>{request.chassis} • {request.wheelbase}</small></span>
                <em>{request.status}</em>
                <span>{request.owner}</span>
                <span>{request.slaAge}</span>
                <span>{request.lastUpdate}</span>
                <span className="rowActionButtons">
                  {isDealerView && row && <button type="button" className="btn btn-ghost btn-sm" disabled={!canEdit} onClick={() => onEditRequest?.(row)}>Edit</button>}
                  {isDealerView && row && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDuplicateRequest?.(row)}>Duplicate</button>}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
