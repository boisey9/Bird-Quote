import { CheckCircle2 } from 'lucide-react';
import { getSeatLayoutById, getSeatLayoutRowsFromCms } from '../../hooks/useSeatCmsData';
import { seatShellImages, type SeatShellImageKey } from '../../assets/seatShells';
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

export function BusFramePreview({ layoutType, layoutId, shellId, estimatedSeats, wheelchairPositions, rows = [], compact = false }: SeatFrameProps) {
  const hasRearLift = wheelchairPositions > 0 || shellId === 'shell-rear-lift';
  const previewRows = getRows(layoutId, layoutType, estimatedSeats, rows);
  const shellImage = seatShellImages[getShellImageKey(shellId)];

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

export function SeatLayoutCard({ layout, selected, onSelect, draft, cmsRows }: { layout: SeatLayoutTemplate; selected: boolean; onSelect: () => void; draft: RfqDraft; cmsRows: SeatLayoutRow[] }) {
  const shellId = getLayoutShellId(layout);
  const wheelchairPreview = shellId === 'shell-rear-lift' || layout.layoutType === 'accessible' ? Math.max(1, draft.seatPackage.wheelchairPositions) : draft.seatPackage.wheelchairPositions;
  const capacity = layout.defaultCapacity ?? layout.maxSeats;

  return (
    <button type="button" className={selected ? 'seatLayoutCard frameCard selected' : 'seatLayoutCard frameCard'} onClick={onSelect}>
      {selected && <CheckCircle2 className="selectedBadge" size={20} />}
      <BusFramePreview layoutId={layout.id} shellId={shellId} layoutType={layout.layoutType} estimatedSeats={Math.min(draft.seatPackage.estimatedPassengerSeats, layout.maxSeats)} wheelchairPositions={wheelchairPreview} rows={cmsRows} compact />
      <strong>{layout.title}</strong>
      <small>{layout.description}</small>
      <div className="seatCardBadges dealerSeatBadges">
        <span>{formatShellLabel(shellId)}</span>
        <span>Up to {capacity} passengers</span>
        {layout.maxWheelchairPositions ? <span>Up to {layout.maxWheelchairPositions} wheelchair</span> : null}
      </div>
    </button>
  );
}

export function SeatReferencePreview({ draft, cmsData }: { draft: RfqDraft; cmsData: SeatPreviewCmsData }) {
  const selectedLayout = getSeatLayoutById(cmsData.layouts, draft.seatPackage.layoutId);
  const shellId = getLayoutShellId(selectedLayout);
  const totalSeatGroupQty = draft.seatGroups.reduce((sum, group) => sum + group.quantity, 0);

  return (
    <aside className="seatPreviewCard framePreviewCard dealerPreviewCard">
      <div className="previewHeader">
        <h3>Reference Preview / Summary</h3>
      </div>
      <div className="seatSummaryList">
        <p><strong>Selected Layout</strong><span>{selectedLayout?.title ?? 'Not selected'}</span></p>
        <p><strong>Body Reference</strong><span>{formatShellLabel(shellId)}</span></p>
        <p><strong>Seat Material</strong><span>{draft.seatPackage.material}</span></p>
        <p><strong>Seat Color</strong><span>{draft.seatPackage.color}</span></p>
        <p><strong>Estimated Capacity</strong><span>{draft.seatPackage.estimatedPassengerSeats} passenger seats</span></p>
        <p><strong>Seat Type Total</strong><span>{totalSeatGroupQty} seats</span></p>
        <p><strong>Wheelchair / Lift</strong><span>{draft.seatPackage.wheelchairPositions > 0 || shellId === 'shell-rear-lift' ? 'Requested / available' : 'Not requested'}</span></p>
      </div>
      {cmsData.error && <p className="warningNote">Showing backup layout options. Micro Bird will review the final seating request.</p>}
      <div className="largeFrameWrap">
        <div className="directionLabel">FRONT / ENTRY REFERENCE</div>
        <BusFramePreview layoutId={selectedLayout?.id} shellId={shellId} layoutType={selectedLayout?.layoutType ?? 'front_facing'} estimatedSeats={draft.seatPackage.estimatedPassengerSeats} wheelchairPositions={draft.seatPackage.wheelchairPositions} rows={cmsData.rows} />
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
