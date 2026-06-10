import { CheckCircle2 } from 'lucide-react';
import { getAvailableSeatLayouts, getSeatLayoutRows, seatCmsConfig } from '../../data/featureOptionMatrix';
import { seatShellImages, type SeatShellImageKey } from '../../assets/seatShells';
import type { RfqDraft, SeatLayoutRow, SeatLayoutTemplate } from '../../types/rfq';

type SeatFrameProps = {
  layoutType: string;
  layoutId?: string;
  shellId?: string;
  estimatedSeats: number;
  wheelchairPositions: number;
  compact?: boolean;
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

function getRows(layoutId: string | undefined, layoutType: string, estimatedSeats: number) {
  const configuredRows = layoutId ? getSeatLayoutRows(layoutId) : [];
  return configuredRows.length > 0 ? configuredRows : fallbackRows(layoutType, estimatedSeats);
}

export function BusFramePreview({ layoutType, layoutId, shellId, estimatedSeats, wheelchairPositions, compact = false }: SeatFrameProps) {
  const hasRearLift = wheelchairPositions > 0 || shellId === 'shell-rear-lift';
  const rows = getRows(layoutId, layoutType, estimatedSeats);
  const shellImage = seatShellImages[getShellImageKey(shellId)];

  return (
    <div className={compact ? 'realBusPreview compactFrame' : 'realBusPreview'}>
      <img src={shellImage} alt="Top-down Micro Bird bus shell reference" />
      <div className={`cmsSeatGrid layout-${cssSafe(layoutType)}`}>
        {rows.map((row) => (
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

export function SeatLayoutCard({ layout, selected, onSelect, draft }: { layout: SeatLayoutTemplate; selected: boolean; onSelect: () => void; draft: RfqDraft }) {
  const rows = getSeatLayoutRows(layout.id);
  const shellId = getLayoutShellId(layout);
  const wheelchairPreview = shellId === 'shell-rear-lift' || layout.layoutType === 'accessible' ? Math.max(1, draft.seatPackage.wheelchairPositions) : draft.seatPackage.wheelchairPositions;

  return (
    <button type="button" className={selected ? 'seatLayoutCard frameCard selected' : 'seatLayoutCard frameCard'} onClick={onSelect}>
      {selected && <CheckCircle2 className="selectedBadge" size={20} />}
      <BusFramePreview layoutId={layout.id} shellId={shellId} layoutType={layout.layoutType} estimatedSeats={Math.min(draft.seatPackage.estimatedPassengerSeats, layout.maxSeats)} wheelchairPositions={wheelchairPreview} compact />
      <strong>{layout.title}</strong>
      <small>{layout.description}</small>
      <em>{shellId.replace('shell-', '').replace('-', ' ')} shell • up to {layout.maxSeats} • {rows.length} CMS rows</em>
    </button>
  );
}

export function SeatReferencePreview({ draft }: { draft: RfqDraft }) {
  const selectedLayout = seatCmsConfig.layouts.find((layout) => layout.id === draft.seatPackage.layoutId);
  const shellId = getLayoutShellId(selectedLayout);
  const totalSeatGroupQty = draft.seatGroups.reduce((sum, group) => sum + group.quantity, 0);
  const rows = selectedLayout ? getSeatLayoutRows(selectedLayout.id) : [];

  return (
    <aside className="seatPreviewCard framePreviewCard">
      <div className="previewHeader">
        <h3>Reference Preview / Summary</h3>
      </div>
      <div className="seatSummaryList">
        <p><strong>Selected Layout</strong><span>{selectedLayout?.title ?? 'Not selected'}</span></p>
        <p><strong>Shell Type</strong><span>{shellId.replace('shell-', '').replace('-', ' ')}</span></p>
        <p><strong>CMS Rows</strong><span>{rows.length} configured rows/zones</span></p>
        <p><strong>Seat Material</strong><span>{draft.seatPackage.material}</span></p>
        <p><strong>Seat Color</strong><span>{draft.seatPackage.color}</span></p>
        <p><strong>Estimated Capacity</strong><span>{draft.seatPackage.estimatedPassengerSeats} passenger seats</span></p>
        <p><strong>Seat Type Total</strong><span>{totalSeatGroupQty} seats</span></p>
        <p><strong>Rear Lift / Wheelchair</strong><span>{draft.seatPackage.wheelchairPositions > 0 || shellId === 'shell-rear-lift' ? 'Required / Available' : 'Not required'}</span></p>
      </div>
      <div className="largeFrameWrap">
        <div className="directionLabel">FRONT / ENTRY REFERENCE</div>
        <BusFramePreview layoutId={selectedLayout?.id} shellId={shellId} layoutType={selectedLayout?.layoutType ?? 'front_facing'} estimatedSeats={draft.seatPackage.estimatedPassengerSeats} wheelchairPositions={draft.seatPackage.wheelchairPositions} />
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

export function useAvailableSeatLayouts(draft: RfqDraft) {
  return getAvailableSeatLayouts(draft.specs, draft.company.contractId);
}
