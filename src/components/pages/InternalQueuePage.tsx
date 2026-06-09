import { useEffect, useState } from 'react';
import { mockRequests, type MockRequest, type RequestStatus } from '../../data/mockRequests';
import { fetchRfqRequests, fetchRfqRows, updateRfqRequest, type RfqApiRow } from '../../services/rfqApi';
import { canMoveToStatus, getSlaPriority, getSlaStatus } from '../../utils/rfqSla';
import { RfqDetailDrawer } from './RfqDetailDrawer';

const owners = ['Unassigned', 'Sales Ops', 'Jason Watson', 'Melissa Nadeau', 'Estimating Team'];
const statuses: RequestStatus[] = ['Submitted', 'In Review', 'Assigned', 'Quote In Progress', 'Quote Sent', 'Converted to Order'];

function toClassName(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-');
}

export function InternalQueuePage() {
  const [requests, setRequests] = useState<MockRequest[]>(mockRequests);
  const [rawRows, setRawRows] = useState<RfqApiRow[]>([]);
  const [selectedId, setSelectedId] = useState(mockRequests[0]?.id ?? '');
  const [drawerRow, setDrawerRow] = useState<RfqApiRow | null>(null);
  const [loadStatus, setLoadStatus] = useState('Loading RFQ queue...');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchRfqRequests(), fetchRfqRows()])
      .then(([items, rows]) => {
        if (!mounted) return;
        const nextRequests = items.length > 0 ? items : mockRequests;
        setRequests(nextRequests);
        setRawRows(rows);
        setSelectedId(nextRequests[0]?.id ?? '');
        setLoadStatus(items.length > 0 ? 'Live queue loaded from Neon.' : 'No live RFQs yet. Showing sample queue.');
      })
      .catch((error) => {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load RFQ queue.';
        setLoadStatus(`${message} Showing sample queue.`);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedRequest = requests.find((request) => request.id === selectedId) ?? requests[0];
  const unassignedCount = requests.filter((request) => request.owner === 'Unassigned').length;
  const activeCount = requests.filter((request) => ['Submitted', 'In Review', 'Assigned', 'Quote In Progress'].includes(request.status)).length;
  const slaWatchCount = requests.filter((request) => ['At Risk', 'Past Due'].includes(getSlaStatus(request))).length;

  async function persistQueueChange(rfqId: string, updates: { status?: RequestStatus; assignedOwner?: string }) {
    setSaveStatus('Saving queue update...');
    try {
      const result = await updateRfqRequest({ rfqId, ...updates });
      setRawRows((current) => current.map((row) => row.id === rfqId ? { ...row, status: result.status, assigned_owner: result.assignedOwner } : row));
      setSaveStatus('Queue update saved to Neon and audit history.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save queue update.';
      setSaveStatus(message);
    }
  }

  const updateOwner = (rfqId: string, owner: string) => {
    const nextStatus = owner === 'Unassigned' ? requests.find((request) => request.id === rfqId)?.status : 'Assigned';
    setRequests((current) => current.map((request) => request.id === rfqId ? { ...request, owner, status: nextStatus ?? request.status, lastUpdate: `Owner updated to ${owner}` } : request));
    persistQueueChange(rfqId, { assignedOwner: owner, status: nextStatus });
  };

  const updateStatus = (rfqId: string, status: RequestStatus) => {
    const currentRequest = requests.find((request) => request.id === rfqId);
    if (!currentRequest) return;
    const guardMessage = canMoveToStatus(currentRequest, status);
    if (guardMessage) {
      setSaveStatus(guardMessage);
      return;
    }
    setRequests((current) => current.map((request) => request.id === rfqId ? { ...request, status, lastUpdate: `Status updated to ${status}` } : request));
    persistQueueChange(rfqId, { status });
  };

  const openDetails = (rfqId: string) => {
    const row = rawRows.find((item) => item.id === rfqId);
    if (row) setDrawerRow(row);
    else setSaveStatus('Live RFQ detail is only available after the queue loads from Neon.');
  };

  return (
    <section className="contentCard pageCard">
      <div className="pageHero opsHero">
        <div>
          <h1>Internal RFQ Queue</h1>
          <p>Review incoming RFQs, assign ownership, monitor SLA, and prepare quote creation.</p>
        </div>
        <div className="statusSearch">Sales Ops View</div>
      </div>

      <div className="kpiGrid">
        <div><strong>{requests.length}</strong><span>Total RFQs</span></div>
        <div><strong>{activeCount}</strong><span>Active Queue</span></div>
        <div><strong>{unassignedCount}</strong><span>Unassigned</span></div>
        <div><strong>{slaWatchCount}</strong><span>SLA Watch</span></div>
      </div>

      <section className="panel tablePanel">
        <h2>Review Incoming RFQs</h2>
        <p className="muted">{loadStatus}</p>
        {saveStatus && <div className="submitStatus queueSaveStatus">{saveStatus}</div>}
        <div className="requestTable opsTable">
          <div className="requestHead opsHead">
            <span>RFQ</span><span>Customer</span><span>Status</span><span>Owner</span><span>Priority</span><span>SLA</span><span>Action</span>
          </div>
          {requests.map((request) => {
            const slaStatus = getSlaStatus(request);
            const priority = getSlaPriority(request);
            return (
              <div className={selectedId === request.id ? 'requestRow opsRow selectedQueueRow' : 'requestRow opsRow'} key={request.id} onClick={() => setSelectedId(request.id)}>
                <strong>{request.id}<small>{request.submittedDate}</small></strong>
                <span>{request.finalCustomer}<small>{request.busType}</small></span>
                <select value={request.status} onClick={(event) => event.stopPropagation()} onChange={(event) => updateStatus(request.id, event.target.value as RequestStatus)}>
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <select value={request.owner} onClick={(event) => event.stopPropagation()} onChange={(event) => updateOwner(request.id, event.target.value)}>
                  {owners.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
                </select>
                <em className={`priority-${toClassName(priority)}`}>{priority}</em>
                <span className={`slaBadge sla-${toClassName(slaStatus)}`}>{slaStatus}<small>{request.slaAge}</small></span>
                <button className="btn btn-ghost btn-sm" type="button" onClick={(event) => { event.stopPropagation(); openDetails(request.id); }}>Open</button>
              </div>
            );
          })}
        </div>
      </section>

      {selectedRequest && (
        <section className="reviewGrid">
          <div className="panel">
            <h2>RFQ Review Details</h2>
            <p><strong>{selectedRequest.id}</strong> - {selectedRequest.finalCustomer}</p>
            <p>{selectedRequest.busType} • {selectedRequest.chassis} • {selectedRequest.wheelbase}</p>
            <p><strong>Dealer:</strong> {selectedRequest.dealer}</p>
            <p><strong>Last update:</strong> {selectedRequest.lastUpdate}</p>
          </div>
          <div className="panel">
            <h2>Queue Controls</h2>
            <p><strong>Current Owner:</strong> {selectedRequest.owner}</p>
            <p><strong>Current Status:</strong> {selectedRequest.status}</p>
            <p><strong>SLA:</strong> {getSlaStatus(selectedRequest)} • {selectedRequest.slaAge}</p>
            <div className="infoBox">Owner and status changes now persist to Neon with status history audit rows.</div>
          </div>
        </section>
      )}
      <RfqDetailDrawer row={drawerRow} onClose={() => setDrawerRow(null)} />
    </section>
  );
}
