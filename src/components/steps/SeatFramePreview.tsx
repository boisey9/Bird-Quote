import { CheckCircle2 } from 'lucide-react';
import { getAvailableSeatLayouts, seatCmsConfig } from '../../data/featureOptionMatrix';
import { seatShellImage } from '../../assets/seatShellImage';
import type { RfqDraft, SeatLayoutTemplate } from '../../types/rfq';

type SeatFrameProps = {
  layoutType: string;
  estimatedSeats: number;
  wheelchairPositions: number;
  compact?: boolean;
};

function seatCountForPreview(layoutType: string, estimatedSeats: number, compact?: boolean) {
  const limit = compact ? 10 : 24;
  if (layoutType === 'school') return Math.min(limit, Math.max(8, estimatedSeats));
  if (layoutType === 'perimeter') return Math.min(limit, Math.max(8, estimatedSeats));
  if (layoutType === 'accessible') return Math.min(limit, Math.max(6, estimatedSeats));
  if (layoutType === 'lounge') return Math.min(limit, Math.max(6, estimatedSeats));
  return Math.min(limit, Math.max(6, estimatedSeats));
}

export function BusFramePreview({ layoutType, estimatedSeats, wheelchairPositions, compact = false }: SeatFrameProps) {
  const seatCells = Array.from({ length: seatCountForPreview(layoutType, estimatedSeats, compact) });
  const hasRearLift = wheelchairPositions > 0;

  return (
    <div className={compact ? 'realBusPreview compactFrame' : 'realBusPreview'}>
      <img src={seatShellImage} alt="Top-down Micro Bird bus shell reference" />
      <div className={`realSeatOverlay layout-${layoutType}`}>
        {seatCells.map((_, index) => <span key={index} />)}
      </div>
      {hasRearLift && <div className="realRearLiftArea"><strong>Lift / WC</strong></div>}
      <div className="realEntryMarker">Entry</div>
    </div>
  );
}

export function SeatLayoutCard({ layout, selected, onSelect, draft }: { layout: SeatLayoutTemplate; selected: boolean; onSelect: () => void; draft: RfqDraft }) {
  return (
    <button type="button" className={selected ? 'seatLayoutCard frameCard selected' : 'seatLayoutCard frameCard'} onClick={onSelect}>
      {selected && <CheckCircle2 className="selectedBadge" size={20} />}
      <BusFramePreview layoutType={layout.layoutType} estimatedSeats={Math.min(draft.seatPackage.estimatedPassengerSeats, layout.maxSeats)} wheelchairPositions={layout.layoutType === 'accessible' ? Math.max(1, draft.seatPackage.wheelchairPositions) : draft.seatPackage.wheelchairPositions} compact />
      <strong>{layout.title}</strong>
      <small>{layout.description}</small>
      <em>Capacity hint: up to {layout.maxSeats}</em>
    </button>
  );
}

export function SeatReferencePreview({ draft }: { draft: RfqDraft }) {
  const selectedLayout = seatCmsConfig.layouts.find((layout) => layout.id === draft.seatPackage.layoutId);
  const totalSeatGroupQty = draft.seatGroups.reduce((sum, group) => sum + group.quantity, 0);

  return (
    <aside className="seatPreviewCard framePreviewCard">
      <div className="previewHeader">
        <h3>Reference Preview / Summary</h3>
      </div>
      <div className="seatSummaryList">
        <p><strong>Selected Layout</strong><span>{selectedLayout?.title ?? 'Not selected'}</span></p>
        <p><strong>Seat Material</strong><span>{draft.seatPackage.material}</span></p>
        <p><strong>Seat Color</strong><span>{draft.seatPackage.color}</span></p>
        <p><strong>Estimated Capacity</strong><span>{draft.seatPackage.estimatedPassengerSeats} passenger seats</span></p>
        <p><strong>Seat Type Total</strong><span>{totalSeatGroupQty} seats</span></p>
        <p><strong>Rear Lift / Wheelchair</strong><span>{draft.seatPackage.wheelchairPositions > 0 ? 'Required' : 'Not required'}</span></p>
      </div>
      <div className="largeFrameWrap">
        <div className="directionLabel">FRONT / ENTRY REFERENCE</div>
        <BusFramePreview layoutType={selectedLayout?.layoutType ?? 'front_facing'} estimatedSeats={draft.seatPackage.estimatedPassengerSeats} wheelchairPositions={draft.seatPackage.wheelchairPositions} />
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
  return getAvailableSeatLayouts(draft.specs);
}
