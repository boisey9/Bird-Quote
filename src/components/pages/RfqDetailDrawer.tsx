import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { fetchRfqHistory, type RfqApiRow, type RfqDocumentRow, type RfqHistoryRow } from '../../services/rfqApi';

type RfqPayload = {
  company?: Record<string, string>;
  busSpecs?: Record<string, unknown> & { labels?: Record<string, string> };
  seats?: {
    package?: Record<string, unknown>;
    groups?: Array<Record<string, unknown>>;
    validationMessage?: string;
  };
  features?: Array<{ category: string; label: string; value: string }>;
  review?: { validationIssues?: Array<{ section: string; message: string; severity: string }> };
};

type RfqDetailDrawerProps = {
  row: RfqApiRow | null;
  onClose: () => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function DetailLine({ label, value }: { label: string; value: unknown }) {
  return <p><strong>{label}</strong><span>{String(value ?? '-')}</span></p>;
}

export function RfqDetailDrawer({ row, onClose }: RfqDetailDrawerProps) {
  const [history, setHistory] = useState<RfqHistoryRow[]>([]);
  const [documents, setDocuments] = useState<RfqDocumentRow[]>([]);
  const [loadStatus, setLoadStatus] = useState('');

  useEffect(() => {
    if (!row) return;
    let mounted = true;
    setLoadStatus('Loading history...');
    fetchRfqHistory(row.id)
      .then((result) => {
        if (!mounted) return;
        setHistory(result.history);
        setDocuments(result.documents);
        setLoadStatus('');
      })
      .catch((error) => {
        if (!mounted) return;
        setLoadStatus(error instanceof Error ? error.message : 'Unable to load history.');
      });
    return () => {
      mounted = false;
    };
  }, [row]);

  if (!row) return null;

  const payload = row.payload as RfqPayload | null;
  const labels = payload?.busSpecs?.labels ?? {};
  const seatPackage = payload?.seats?.package ?? {};
  const seatGroups = payload?.seats?.groups ?? [];
  const validationIssues = payload?.review?.validationIssues ?? [];

  return (
    <div className="drawerBackdrop" role="presentation">
      <aside className="rfqDrawer" aria-label="RFQ detail drawer">
        <header className="drawerHeader">
          <div>
            <small>Internal RFQ Review</small>
            <h2>{row.id}</h2>
            <p>{row.final_customer_name}</p>
          </div>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="drawerContent">
          <section>
            <h3>Request Summary</h3>
            <div className="detailGrid">
              <DetailLine label="Dealer" value={row.dealer_name} />
              <DetailLine label="Contact" value={row.dealer_contact} />
              <DetailLine label="Province / State" value={row.province_state} />
              <DetailLine label="Submitted" value={formatDate(row.submitted_at)} />
              <DetailLine label="Status" value={row.status} />
              <DetailLine label="Owner" value={row.assigned_owner} />
            </div>
          </section>

          <section>
            <h3>Bus Specifications</h3>
            <div className="detailGrid">
              <DetailLine label="Bus Type" value={labels.busType ?? payload?.busSpecs?.busType} />
              <DetailLine label="Chassis" value={labels.chassis ?? payload?.busSpecs?.chassis} />
              <DetailLine label="Wheelbase" value={labels.wheelbase ?? payload?.busSpecs?.wheelbase} />
              <DetailLine label="Quantity" value={payload?.busSpecs?.quantity} />
              <DetailLine label="Seating" value={payload?.busSpecs?.seatingCapacity} />
              <DetailLine label="Wheelchair" value={payload?.busSpecs?.wheelchairCapacity} />
            </div>
          </section>

          <section>
            <h3>Seats</h3>
            <div className="detailGrid">
              <DetailLine label="Layout" value={seatPackage.layoutLabel ?? seatPackage.layoutId} />
              <DetailLine label="Material" value={seatPackage.material} />
              <DetailLine label="Color" value={seatPackage.color} />
              <DetailLine label="Estimated Seats" value={seatPackage.estimatedPassengerSeats} />
              <DetailLine label="Wheelchair Positions" value={seatPackage.wheelchairPositions} />
            </div>
            <div className="drawerList">
              {seatGroups.map((group, index) => <p key={index}><strong>{String(group.name ?? `Seat Group ${index + 1}`)}</strong><span>Qty {String(group.quantity ?? '-')} • {String(group.seatStyle ?? '-')} • {String(group.restraintType ?? '-')}</span></p>)}
            </div>
          </section>

          <section>
            <h3>Selected Options</h3>
            <div className="drawerList twoColList">
              {(payload?.features ?? []).length === 0 ? <p><strong>No options</strong><span>No selected options found.</span></p> : payload?.features?.map((feature) => <p key={`${feature.category}-${feature.label}`}><strong>{feature.category}</strong><span>{feature.label}</span></p>)}
            </div>
          </section>

          <section>
            <h3>Validation Warnings</h3>
            <div className="drawerList">
              {validationIssues.length === 0 ? <p><strong>Clear</strong><span>No warnings found.</span></p> : validationIssues.map((issue) => <p key={`${issue.section}-${issue.message}`}><strong>{issue.severity.toUpperCase()} • {issue.section}</strong><span>{issue.message}</span></p>)}
            </div>
          </section>

          <section>
            <h3>Documents</h3>
            <div className="drawerList">
              {documents.length === 0 ? <p><strong>No documents</strong><span>Document metadata will appear here when upload is enabled.</span></p> : documents.map((document) => <p key={document.id}><strong>{document.document_type}</strong><span>{document.file_name} • {document.file_size}</span></p>)}
            </div>
          </section>

          <section>
            <h3>Status History</h3>
            {loadStatus && <p className="muted">{loadStatus}</p>}
            <div className="historyList">
              {history.length === 0 ? <p>No history yet.</p> : history.map((item) => <p key={item.id}><strong>{item.status}</strong><span>{item.note}</span><small>{item.actor} • {formatDate(item.created_at)}</small></p>)}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
