import type { Dispatch, SetStateAction } from 'react';
import { getAvailableFeatureOptions, getAvailableSeatLayouts, getVisibleFeatureCategories, seatCmsConfig } from '../../data/featureOptionMatrix';
import type { RfqDraft, SeatGroup } from '../../types/rfq';
import './SeatsModule.css';

type FeaturesStepProps = {
  draft: RfqDraft;
  setDraft: Dispatch<SetStateAction<RfqDraft>>;
};

function SelectField({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function NumberStepper({ value, onChange, min = 0 }: { value: number; onChange: (value: number) => void; min?: number }) {
  return (
    <div className="miniCounter">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}>-</button>
      <strong>{value}</strong>
      <button type="button" onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

function SeatPreview({ draft }: { draft: RfqDraft }) {
  const selectedLayout = seatCmsConfig.layouts.find((layout) => layout.id === draft.seatPackage.layoutId);
  const seatCells = Array.from({ length: Math.min(18, Math.max(6, draft.seatPackage.estimatedPassengerSeats)) });

  return (
    <aside className="seatPreviewCard">
      <h3>Reference Preview / Summary</h3>
      <div className="seatSummaryList">
        <p><strong>Selected Layout</strong><span>{selectedLayout?.title ?? 'Not selected'}</span></p>
        <p><strong>Seat Material</strong><span>{draft.seatPackage.material}</span></p>
        <p><strong>Seat Color</strong><span>{draft.seatPackage.color}</span></p>
        <p><strong>Estimated Capacity</strong><span>{draft.seatPackage.estimatedPassengerSeats} passenger seats</span></p>
        <p><strong>Wheelchair Positions</strong><span>{draft.seatPackage.wheelchairPositions}</span></p>
        <p><strong>Seat Types</strong><span>{draft.seatGroups.length}</span></p>
      </div>
      <div className="busPreviewShell">
        <div className="busLabel top">FRONT</div>
        <div className="busCab" />
        <div className="busSeatMap">
          {seatCells.map((_, index) => <span key={index} />)}
          {draft.seatPackage.wheelchairPositions > 0 && <em />}
        </div>
        <div className="busLabel bottom">ENTRY DOOR</div>
      </div>
      <div className="seatLegend">
        <span><i className="seatBox" />Passenger Seats</span>
        <span><i className="openBox" />Wheelchair / Foldaway Area</span>
      </div>
      <p className="warningNote">Reference only - final seating layout will be reviewed and validated by Micro Bird.</p>
    </aside>
  );
}

export function FeaturesStep({ draft, setDraft }: FeaturesStepProps) {
  const categories = getVisibleFeatureCategories(draft.specs);
  const seatLayouts = getAvailableSeatLayouts(draft.specs);

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
    setDraft((current) => ({ ...current, seatGroups: current.seatGroups.filter((group) => group.id !== id) }));
  };

  return (
    <div className="sectionStack">
      {categories.map((category) => {
        if (category.title === 'Seats') {
          const totalSeatGroupQty = draft.seatGroups.reduce((sum, group) => sum + group.quantity, 0);
          const totalWarning = totalSeatGroupQty !== draft.seatPackage.estimatedPassengerSeats;

          return (
            <section className="panel compact seatsModule" key={category.id}>
              <h2>{category.title}<span className="pill">CMS-managed per model</span></h2>
              <p className="muted">Configure seat layout, material, color, and seat type details. Final configuration will be validated internally.</p>

              <div className="seatsLayout">
                <div>
                  <div className="seatBlockTitle"><span>1</span><strong>Seat Package</strong></div>
                  <h3>Seating Layout</h3>
                  <div className="seatLayoutGrid">
                    {seatLayouts.map((layout) => (
                      <button key={layout.id} type="button" className={draft.seatPackage.layoutId === layout.id ? 'seatLayoutCard selected' : 'seatLayoutCard'} onClick={() => updateSeatPackage({ layoutId: layout.id, estimatedPassengerSeats: Math.min(draft.seatPackage.estimatedPassengerSeats, layout.maxSeats) })}>
                        <div className="layoutThumb"><span /><span /><span /><span /><span /><span /></div>
                        <strong>{layout.title}</strong>
                        <small>{layout.description}</small>
                        <em>Capacity hint: up to {layout.maxSeats}</em>
                      </button>
                    ))}
                  </div>

                  <div className="seatPackageControls">
                    <label className="field"><span>Seat Material</span><SelectField value={draft.seatPackage.material} options={seatCmsConfig.materials} onChange={(value) => updateSeatPackage({ material: value })} /></label>
                    <label className="field"><span>Seat Color</span><SelectField value={draft.seatPackage.color} options={seatCmsConfig.colors} onChange={(value) => updateSeatPackage({ color: value })} /></label>
                    <div className="field"><span>Estimated Passenger Seats</span><NumberStepper value={draft.seatPackage.estimatedPassengerSeats} min={1} onChange={(value) => updateSeatPackage({ estimatedPassengerSeats: value })} /></div>
                    <div className="field"><span>Wheelchair Positions</span><NumberStepper value={draft.seatPackage.wheelchairPositions} onChange={(value) => updateSeatPackage({ wheelchairPositions: value })} /></div>
                  </div>

                  <div className="seatTypeHeader">
                    <div className="seatBlockTitle"><span>2</span><strong>Seat Type Details</strong><small>Define the different types of seats used in this bus.</small></div>
                    <button type="button" onClick={addSeatGroup}>+ Add Seat Type</button>
                  </div>

                  <div className="seatTypeTable">
                    <div className="seatTypeHead">
                      <span>Seat Group Name</span><span>Quantity</span><span>Seat Style</span><span>Restraint</span><span>Armrest / Grab</span><span>Grab Type</span><span>Seat Branding</span><span />
                    </div>
                    {draft.seatGroups.map((group, index) => (
                      <div className="seatTypeRow" key={group.id}>
                        <strong className="rowNumber">{index + 1}</strong>
                        <input value={group.name} onChange={(event) => updateSeatGroup(group.id, { name: event.target.value })} />
                        <NumberStepper value={group.quantity} min={0} onChange={(value) => updateSeatGroup(group.id, { quantity: value })} />
                        <SelectField value={group.seatStyle} options={seatCmsConfig.seatTypes} onChange={(value) => updateSeatGroup(group.id, { seatStyle: value })} />
                        <SelectField value={group.restraintType} options={seatCmsConfig.restraintTypes} onChange={(value) => updateSeatGroup(group.id, { restraintType: value })} />
                        <SelectField value={group.armrest} options={seatCmsConfig.armrests} onChange={(value) => updateSeatGroup(group.id, { armrest: value })} />
                        <SelectField value={group.grabType} options={seatCmsConfig.grabTypes} onChange={(value) => updateSeatGroup(group.id, { grabType: value })} />
                        <SelectField value={group.branding} options={seatCmsConfig.brandingOptions} onChange={(value) => updateSeatGroup(group.id, { branding: value })} />
                        <div className="seatRowActions"><button type="button" onClick={() => duplicateSeatGroup(group)}>Copy</button><button type="button" onClick={() => removeSeatGroup(group.id)}>Remove</button></div>
                      </div>
                    ))}
                  </div>
                  {totalWarning && <p className="warningNote">Ensure the total seat quantity matches the estimated passenger seats. Current seat type total: {totalSeatGroupQty}.</p>}
                </div>
                <SeatPreview draft={draft} />
              </div>
            </section>
          );
        }

        const options = getAvailableFeatureOptions(category.id, draft.specs);
        return (
          <section className="panel compact" key={category.id}>
            <h2>{category.title}<span className="pill">{options.length} available options</span></h2>
            {category.description && <p className="muted">{category.description}</p>}
            <div className="featureGrid">
              {options.map((option) => (
                <div className="featureChip" key={option.id}>
                  <strong>{option.title}</strong>
                  <span>{option.description}</span>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <section className="panel">
        <label className="field">
          <span>Additional Features or Special Requirements</span>
          <textarea placeholder="Describe any extra features, notes, or special instructions for our team..." />
        </label>
      </section>
    </div>
  );
}
