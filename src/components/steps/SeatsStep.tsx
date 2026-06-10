import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';
import { seatCmsConfig } from '../../data/featureOptionMatrix';
import { useAvailableSeatLayouts } from '../../hooks/useSeatCmsData';
import { SeatLayoutCard, SeatReferencePreview } from './SeatFramePreview';
import type { RfqDraft, SeatGroup } from '../../types/rfq';
import './SeatsModule.css';
import './SeatFramePreview.css';

type SeatsStepProps = {
  draft: RfqDraft;
  setDraft: Dispatch<SetStateAction<RfqDraft>>;
};

type SelectFieldProps = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label?: string;
};

function SelectField({ value, options, onChange, label }: SelectFieldProps) {
  return (
    <label className="controlField">
      {label && <span>{label}</span>}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function NumberStepper({ value, onChange, min = 0, max }: { value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  const next = (candidate: number) => {
    const withMin = Math.max(min, candidate);
    onChange(typeof max === 'number' ? Math.min(max, withMin) : withMin);
  };

  return (
    <div className="miniCounter">
      <button type="button" onClick={() => next(value - 1)}>-</button>
      <strong>{value}</strong>
      <button type="button" onClick={() => next(value + 1)}>+</button>
    </div>
  );
}

export function SeatsStep({ draft, setDraft }: SeatsStepProps) {
  const seatCmsData = useAvailableSeatLayouts(draft);
  const seatLayouts = seatCmsData.availableLayouts;
  const totalSeatGroupQty = useMemo(() => draft.seatGroups.reduce((sum, group) => sum + group.quantity, 0), [draft.seatGroups]);

  const updateSeatPackage = (updates: Partial<RfqDraft['seatPackage']>) => {
    setDraft((current) => ({ ...current, seatPackage: { ...current.seatPackage, ...updates } }));
  };

  const updateSeatGroup = (id: string, updates: Partial<SeatGroup>) => {
    setDraft((current) => ({
      ...current,
      seatGroups: current.seatGroups.map((group) => group.id === id ? { ...group, ...updates } : group)
    }));
  };

  const addSeatGroup = () => {
    setDraft((current) => ({
      ...current,
      seatGroups: [
        ...current.seatGroups,
        {
          id: `seat-group-${Date.now()}`,
          name: 'Additional Seat Type',
          quantity: 1,
          seatStyle: seatCmsConfig.seatTypes[0],
          restraintType: seatCmsConfig.restraintTypes[0],
          armrest: seatCmsConfig.armrests[0],
          grabType: seatCmsConfig.grabTypes[0],
          branding: seatCmsConfig.brandingOptions[0]
        }
      ]
    }));
  };

  const duplicateSeatGroup = (group: SeatGroup) => {
    setDraft((current) => ({
      ...current,
      seatGroups: [...current.seatGroups, { ...group, id: `seat-group-${Date.now()}`, name: `${group.name} Copy` }]
    }));
  };

  const removeSeatGroup = (id: string) => {
    setDraft((current) => ({ ...current, seatGroups: current.seatGroups.length <= 1 ? current.seatGroups : current.seatGroups.filter((group) => group.id !== id) }));
  };

  const totalWarning = totalSeatGroupQty !== draft.seatPackage.estimatedPassengerSeats;

  return (
    <div className="sectionStack featuresPage dealerSeatsPage">
      <section className="panel compact seatsModule refinedSeatsModule">
        <div className="featureSectionHeader dealerSectionHeader">
          <div>
            <h2>Seats & Floorplan Intent</h2>
            <p>Select the general seating intent. Micro Bird will review and validate the final layout before quoting.</p>
          </div>
          <span className="pill">Reference only</span>
        </div>

        {seatCmsData.loadState === 'loading' && <div className="infoBox">Loading available seating layouts...</div>}
        {seatCmsData.error && <div className="warningNote">Seat layout service is temporarily unavailable. Showing backup layout options.</div>}

        <div className="seatsLayout refinedSeatsLayout productionSeatsLayout">
          <div className="seatLeftColumn">
            <div className="seatBlockTitle"><span>1</span><strong>Choose a Seating Layout</strong></div>
            <div className="seatSubHeader">
              <h3>General layout intent</h3>
              <small>Only layouts compatible with your vehicle selection are shown.</small>
            </div>

            <div className="seatLayoutGrid refinedLayoutGrid productionLayoutGrid">
              {seatLayouts.map((layout) => (
                <SeatLayoutCard
                  key={layout.id}
                  layout={layout}
                  selected={draft.seatPackage.layoutId === layout.id}
                  draft={draft}
                  cmsRows={seatCmsData.rows}
                  onSelect={() => updateSeatPackage({
                    layoutId: layout.id,
                    estimatedPassengerSeats: Math.min(draft.seatPackage.estimatedPassengerSeats, layout.defaultCapacity ?? layout.maxSeats),
                    wheelchairPositions: Math.min(draft.seatPackage.wheelchairPositions, layout.maxWheelchairPositions ?? draft.seatPackage.wheelchairPositions)
                  })}
                />
              ))}
              {seatLayouts.length === 0 && <div className="infoBox fullWidthNotice">No seating layouts match the selected vehicle. Micro Bird can still review a custom seating request in the notes.</div>}
            </div>

            <div className="seatBlockTitle"><span>2</span><strong>Seat Package</strong></div>
            <div className="seatPackageControls refinedSeatControls">
              <SelectField label="Seat Material" value={draft.seatPackage.material} options={seatCmsConfig.materials} onChange={(value) => updateSeatPackage({ material: value })} />
              <SelectField label="Seat Color" value={draft.seatPackage.color} options={seatCmsConfig.colors} onChange={(value) => updateSeatPackage({ color: value })} />
              <div className="controlField"><span>Estimated Passenger Seats</span><NumberStepper value={draft.seatPackage.estimatedPassengerSeats} min={1} max={48} onChange={(value) => updateSeatPackage({ estimatedPassengerSeats: value })} /></div>
              <div className="controlField"><span>Wheelchair / Lift Positions</span><NumberStepper value={draft.seatPackage.wheelchairPositions} min={0} max={8} onChange={(value) => updateSeatPackage({ wheelchairPositions: value })} /></div>
            </div>

            <div className="seatTypeHeader refinedSeatTypeHeader">
              <div className="seatBlockTitle"><span>3</span><strong>Seat Type Details</strong><small>Describe the seat types needed for quoting.</small></div>
              <button type="button" onClick={addSeatGroup}><Plus size={16} /> Add Seat Type</button>
            </div>

            <div className="seatTypeCards refinedSeatTypeCards">
              {draft.seatGroups.map((group, index) => (
                <article className="seatTypeCard" key={group.id}>
                  <header>
                    <div>
                      <strong>Seat Type {index + 1}</strong>
                      <input aria-label="Seat group name" value={group.name} onChange={(event) => updateSeatGroup(group.id, { name: event.target.value })} />
                    </div>
                    <NumberStepper value={group.quantity} min={0} max={48} onChange={(value) => updateSeatGroup(group.id, { quantity: value })} />
                  </header>
                  <div className="seatTypeCardGrid">
                    <SelectField label="Seat Style" value={group.seatStyle} options={seatCmsConfig.seatTypes} onChange={(value) => updateSeatGroup(group.id, { seatStyle: value })} />
                    <SelectField label="Seat Belt / Restraint" value={group.restraintType} options={seatCmsConfig.restraintTypes} onChange={(value) => updateSeatGroup(group.id, { restraintType: value })} />
                    <SelectField label="Armrest" value={group.armrest} options={seatCmsConfig.armrests} onChange={(value) => updateSeatGroup(group.id, { armrest: value })} />
                    <SelectField label="Grab Type" value={group.grabType} options={seatCmsConfig.grabTypes} onChange={(value) => updateSeatGroup(group.id, { grabType: value })} />
                    <SelectField label="Branding" value={group.branding} options={seatCmsConfig.brandingOptions} onChange={(value) => updateSeatGroup(group.id, { branding: value })} />
                  </div>
                  <div className="seatRowActions">
                    <button type="button" onClick={() => duplicateSeatGroup(group)}><Copy size={14} /> Copy</button>
                    <button type="button" onClick={() => removeSeatGroup(group.id)}><Trash2 size={14} /> Remove</button>
                  </div>
                </article>
              ))}
            </div>

            {totalWarning && <p className="warningNote">Seat type quantity total is {totalSeatGroupQty}. Estimated passenger seats is {draft.seatPackage.estimatedPassengerSeats}. Micro Bird will validate the final seating plan.</p>}
          </div>

          <SeatReferencePreview draft={draft} cmsData={seatCmsData} />
        </div>
      </section>
    </div>
  );
}
