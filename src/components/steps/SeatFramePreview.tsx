import { CheckCircle2 } from 'lucide-react';
import { getSeatLayoutById, getSeatLayoutRowsFromCms } from '../../hooks/useSeatCmsData';
import { seatShellImages, type SeatShellImageKey } from '../../assets/seatShells';
import type { CSSProperties } from 'react';
import type { RfqDraft, SeatCmsConfig, SeatLayoutRow, SeatLayoutTemplate } from '../../types/rfq';

type SeatFrameProps = {
  layoutType: string;
  layoutId?: string;
  shellId?: string;
  estimatedSeats: number;
  wheelchairPositions: number;
  rows?: SeatLayoutRow[];
  compact?: boolean;
};

type SeatPreviewCmsData = Pick<SeatCmsConfig, 'layouts' | 'rows'> & {
  sourceLabel?: string;
  loadState?: string;
  error?: string;
};

type MarketHint = 'school' | 'commercial' | 'accessible' | 'custom';
type LayoutFamilyHint = 'standard' | 'accessible' | 'perimeter' | 'lounge';

function cssSafe(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function getShellImageKey(shellId?: string): SeatShellImageKey {
  if (shellId === 'shell-rear-lift') return 'shellLift';
  if (shellId === 'shell-mid-door') return 'shellMidDoor';
  return 'shellStd';
}

function getLayoutShellId(layout?: SeatLayoutTemplate) {
  if (layout?.shellId) return layout.shellId;
  if (layout?.id === 'wheelchair-foldaway' || layout?.rearLiftCompatible) return 'shell-rear-lift';
  return 'shell-standard';
}

function formatShellLabel(shellId: string) {
  if (shellId === 'shell-rear-lift') return 'Rear lift ready';
  if (shellId === 'shell-mid-door') return 'Mid-door layout';
  return 'Standard body';
}

function formatMarketHint(marketHint?: MarketHint) {
  if (marketHint === 'school') return 'Type-A School';
  if (marketHint === 'accessible') return 'Accessible / Lift';
  if (marketHint === 'custom') return 'Custom Review';
  return 'Commercial';
}

function formatLayoutFamily(layoutFamily?: LayoutFamilyHint) {
  if (layoutFamily === 'accessible') return 'Wheelchair / Lift';
  if (layoutFamily === 'perimeter') return 'Perimeter';
  if (layoutFamily === 'lounge') return 'Lounge / Mixed';
  return 'Forward-Facing';
}

function fallbackRows(layoutType: string, estimatedSeats: number): SeatLayoutRow[] {
  const baseCount = Math.min(4, Math.max(2, Math.ceil(estimatedSeats / 4)));
  return Array.from({ length: baseCount }).map((_, index) => ({
    id: `fallback-${layoutType}-${index}`,
    layoutId: layoutType,
    rowNumber: index + 1,
    zone: index === 0 ? 'front' : index === baseCount - 1 ? 'rear' : 'mid',
    leftPositionType: layoutType === 'perimeter' ? 'perimeter-seat' : layoutType === 'lounge' ? 'lounge' : 'passenger-seat',
    rightPositionType: layoutType === 'accessible' && index === baseCount - 1 ? 'wheelchair-space' : layoutType === 'perimeter' ? 'perimeter-seat' : layoutType === 'lounge' ? 'lounge' : 'passenger-seat',
    seatCountLeft: layoutType === 'school' ? 3 : 2,
    seatCountRight: layoutType === 'school' ? 2 : 2,
    allowedSeatStyles: []
  }));
}

function markersForSide(row: SeatLayoutRow, side: 'left' | 'right', compact: boolean) {
  const positionType = side === 'left' ? row.leftPositionType : row.rightPositionType;
  const count = side === 'left' ? row.seatCountLeft : row.seatCountRight;

  if (positionType === 'empty' || positionType === 'aisle') return [];
  if (positionType === 'wheelchair-space') return [{ type: positionType, label: 'WC' }];

  const maxMarkers = compact ? 2 : Math.min(3, count);
  return Array.from({ length: Math.max(1, maxMarkers) }).map(() => ({ type: positionType, label: '' }));
}

function getRows(layoutId: string | undefined, layoutType: string, estimatedSeats: number, cmsRows: SeatLayoutRow[] = []) {
  const configuredRows = layoutId ? getSeatLayoutRowsFromCms(cmsRows, layoutId) : [];
  return configuredRows.length > 0 ? configuredRows : fallbackRows(layoutType, estimatedSeats);
}

function isAdminFloorPlanLayout(layoutId?: string) {
  return Boolean(layoutId?.startsWith('fp-'));
}

function formatCellLabel(row: SeatLayoutRow, side: 'left' | 'right') {
  const positionType = side === 'left' ? row.leftPositionType : row.rightPositionType;
  const count = side === 'left' ? row.seatCountLeft : row.seatCountRight;
  if (positionType === 'empty' || positionType === 'aisle') return 'Open';
  if (positionType === 'wheelchair-space') return 'W/C';
  if (positionType === 'foldaway') return count > 0 ? `${count} Fold` : 'Fold';
  if (positionType === 'lounge') return count > 0 ? `${count} Lounge` : 'Lounge';
  if (positionType === 'perimeter-seat') return count > 0 ? `${count} Perim.` : 'Perim.';
  return count > 0 ? `${count} Seats` : 'Seat';
}

function cellStyle(row: SeatLayoutRow, side: 'left' | 'right', compact: boolean): CSSProperties {
  const positionType = side === 'left' ? row.leftPositionType : row.rightPositionType;
  const base: CSSProperties = {
    border: '1px dashed #cbd5e1',
    background: '#fff',
    borderRadius: compact ? 5 : 10,
    display: 'grid',
    placeItems: 'center',
    textAlign: 'center',
    color: '#334155',
    fontSize: compact ? 0 : 10,
    fontWeight: 800,
    minHeight: compact ? 20 : 42,
    padding: compact ? 0 : '2px 4px',
    lineHeight: 1.1,
    whiteSpace: 'normal'
  };

  if (positionType === 'passenger-seat') return { ...base, background: '#dbeafe', borderColor: '#93c5fd', color: '#1e3a8a' };
  if (positionType === 'foldaway') return { ...base, background: '#dcfce7', borderColor: '#86efac', color: '#166534' };
  if (positionType === 'wheelchair-space') return { ...base, background: '#ede9fe', borderColor: '#c4b5fd', color: '#5b21b6' };
  if (positionType === 'lounge' || positionType === 'perimeter-seat') return { ...base, background: '#ccfbf1', borderColor: '#5eead4', color: '#115e59' };
  return { ...base, background: '#fff', borderColor: '#d7dee8', color: '#94a3b8' };
}

function AdminFloorPlanGridPreview({ rows, compact = false }: { rows: SeatLayoutRow[]; compact?: boolean }) {
  const frameStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: compact ? '44px 1fr' : '76px 1fr',
    gap: compact ? 5 : 8,
    width: '100%',
    minHeight: compact ? 74 : 170,
    border: compact ? '1px solid #101828' : '2px solid #101828',
    borderRadius: compact ? '18px 10px 10px 18px' : '32px 14px 14px 32px',
    background: '#f8fafc',
    padding: compact ? 6 : 12,
    overflowX: 'auto',
    overflowY: 'hidden',
    boxSizing: 'border-box'
  };

  const frontStyle: CSSProperties = {
    borderRadius: compact ? '14px 6px 6px 14px' : '22px 8px 8px 22px',
    background: '#e2e8f0',
    color: '#0f172a',
    display: 'grid',
    placeItems: 'center',
    fontSize: compact ? 8 : 11,
    fontWeight: 900,
    letterSpacing: '.04em',
    writingMode: 'vertical-rl',
    minHeight: compact ? 62 : 148
  };

  return (
    <div className={compact ? 'adminFloorPlanPreview compactAdminFloorPlanPreview' : 'adminFloorPlanPreview'} style={frameStyle}>
      <div className="adminFloorPlanFront" style={frontStyle}>FRONT</div>
      <div className="adminFloorPlanRows" style={{ display: 'flex', gap: compact ? 3 : 6, minWidth: 'max-content' }}>
        {rows.map((row) => (
          <div className="adminFloorPlanRow" key={row.id} style={{ display: 'grid', gridTemplateRows: compact ? '1fr 10px 1fr' : '1fr 18px 1fr', gap: compact ? 2 : 4, minWidth: compact ? 34 : 72 }}>
            <div className={`adminFloorPlanCell type-${cssSafe(row.leftPositionType)}`} style={cellStyle(row, 'left', compact)}>{formatCellLabel(row, 'left')}</div>
            <div className="adminFloorPlanAisle" style={{ borderRadius: 999, background: '#e2e8f0', color: '#64748b', display: 'grid', placeItems: 'center', fontSize: compact ? 7 : 9, fontWeight: 900 }}>R{row.rowNumber}</div>
            <div className={`adminFloorPlanCell type-${cssSafe(row.rightPositionType)}`} style={cellStyle(row, 'right', compact)}>{formatCellLabel(row, 'right')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BusFramePreview({ layoutType, layoutId, shellId, estimatedSeats, wheelchairPositions, rows = [], compact = false }: SeatFrameProps) {
  const hasRearLift = wheelchairPositions > 0 || shellId === 'shell-rear-lift';
  const previewRows = getRows(layoutId, layoutType, estimatedSeats, rows);
  const shellImage = seatShellImages[getShellImageKey(shellId)];

  if (isAdminFloorPlanLayout(layoutId) && previewRows.length > 0) {
    return <AdminFloorPlanGridPreview rows={previewRows} compact={compact} />;
  }

  return (
    <div className={compact ? 'realBusPreview compactFrame' : 'realBusPreview'}>
      <img src={shellImage} alt="Top-down Micro Bird bus shell reference" />
      <div className={`cmsSeatGrid layout-${cssSafe(layoutType)}`}>
        {previewRows.map((row) => (
          <div className={`cmsSeatRow zone-${row.zone}`} key={row.id}>
            <div className="seatSide leftSide">
              {markersForSide(row, 'left', compact).map((marker, index) => <span className={`seatMarker type-${cssSafe(marker.type)}`} key={`left-${index}`}>{marker.label}</span>)}
            </div>
            <div className="aisleMarker" />
            <div className="seatSide rightSide">
              {markersForSide(row, 'right', compact).map((marker, index) => <span className={`seatMarker type-${cssSafe(marker.type)}`} key={`right-${index}`}>{marker.label}</span>)}
            </div>
          </div>
        ))}
      </div>
      {hasRearLift && <div className="realRearLiftArea"><strong>Lift / WC</strong></div>}
      {shellId === 'shell-mid-door' && <div className="realMidDoorArea"><strong>Mid Door</strong></div>}
      <div className="realEntryMarker">Entry</div>
    </div>
  );
}

export function SeatLayoutCard({ layout, selected, onSelect, draft, cmsRows, marketHint, layoutFamily }: { layout: SeatLayoutTemplate; selected: boolean; onSelect: () => void; draft: RfqDraft; cmsRows: SeatLayoutRow[]; marketHint?: MarketHint; layoutFamily?: LayoutFamilyHint }) {
  const shellId = getLayoutShellId(layout);
  const wheelchairPreview = shellId === 'shell-rear-lift' || layout.layoutType === 'accessible' ? Math.max(1, draft.seatPackage.wheelchairPositions) : draft.seatPackage.wheelchairPositions;
  const capacity = layout.defaultCapacity ?? layout.maxSeats;

  return (
    <button type="button" className={selected ? 'seatLayoutCard frameCard selected' : 'seatLayoutCard frameCard'} onClick={onSelect}>
      {selected && <CheckCircle2 className="selectedBadge" size={20} />}
      <BusFramePreview layoutId={layout.id} shellId={shellId} layoutType={layout.layoutType} estimatedSeats={capacity} wheelchairPositions={wheelchairPreview} rows={cmsRows} compact />
      <div className="seatCardTitleLine">
        <strong>{layout.title}</strong>
        <em>{isAdminFloorPlanLayout(layout.id) ? 'Admin Grid' : formatLayoutFamily(layoutFamily)}</em>
      </div>
      <small>{layout.description}</small>
      <div className="seatCardBadges dealerSeatBadges">
        <span>{formatMarketHint(marketHint)}</span>
        <span>{formatShellLabel(shellId)}</span>
        <span>Up to {capacity} passengers</span>
        {layout.maxWheelchairPositions ? <span>Up to {layout.maxWheelchairPositions} wheelchair</span> : null}
      </div>
    </button>
  );
}

export function SeatReferencePreview({ draft, cmsData, marketHint }: { draft: RfqDraft; cmsData: SeatPreviewCmsData; marketHint?: MarketHint }) {
  const selectedLayout = getSeatLayoutById(cmsData.layouts, draft.seatPackage.layoutId);
  const shellId = getLayoutShellId(selectedLayout);
  const totalSeatGroupQty = draft.seatGroups.reduce((sum, group) => sum + group.quantity, 0);
  const selectedCapacity = selectedLayout?.defaultCapacity ?? selectedLayout?.maxSeats ?? draft.seatPackage.estimatedPassengerSeats;

  return (
    <aside className="seatPreviewCard framePreviewCard dealerPreviewCard">
      <div className="previewHeader">
        <h3>Reference Preview / Summary</h3>
        <span>{formatMarketHint(marketHint)}</span>
      </div>
      <div className="seatSummaryList">
        <p><strong>Selected Layout</strong><span>{selectedLayout?.title ?? 'Not selected'}</span></p>
        <p><strong>Body Reference</strong><span>{formatShellLabel(shellId)}</span></p>
        <p><strong>Seat Material</strong><span>{draft.seatPackage.material}</span></p>
        <p><strong>Seat Color</strong><span>{draft.seatPackage.color}</span></p>
        <p><strong>Estimated Capacity</strong><span>{selectedCapacity} passenger seats</span></p>
        <p><strong>Seat Type Total</strong><span>{totalSeatGroupQty} seats</span></p>
        <p><strong>Wheelchair / Lift</strong><span>{draft.seatPackage.wheelchairPositions > 0 || shellId === 'shell-rear-lift' ? 'Requested / available' : 'Not requested'}</span></p>
      </div>
      {cmsData.error && <p className="warningNote">Showing backup layout options. Micro Bird will review the final seating request.</p>}
      <div className="largeFrameWrap">
        <div className="directionLabel">FRONT / ENTRY REFERENCE</div>
        <BusFramePreview layoutId={selectedLayout?.id} shellId={shellId} layoutType={selectedLayout?.layoutType ?? 'front_facing'} estimatedSeats={selectedCapacity} wheelchairPositions={draft.seatPackage.wheelchairPositions} rows={cmsData.rows} />
      </div>
      <div className="seatLegend">
        <span><i className="seatBox" />Passenger Seats</span>
        <span><i className="openBox" />Wheelchair / Lift Area</span>
        <span><i className="doorBox" />Entry Door</span>
      </div>
      <p className="warningNote">Reference only - final seating layout will be reviewed and validated by Micro Bird.</p>
    </aside>
  );
}
