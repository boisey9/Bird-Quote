import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { ChevronDown, ChevronUp, Eye, Info, Plus, Trash2, Copy, CheckCircle2 } from 'lucide-react';
import { getAvailableFeatureOptions, getVisibleFeatureCategories, seatCmsConfig } from '../../data/featureOptionMatrix';
import { SeatLayoutCard, SeatReferencePreview, useAvailableSeatLayouts } from './SeatFramePreview';
import type { FeatureOptionItem, RfqDraft, SeatGroup } from '../../types/rfq';
import './SeatsModule.css';
import './SeatFramePreview.css';

type FeaturesStepProps = {
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

function FeatureOptionCard({ option, selected, onClick }: { option: FeatureOptionItem; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={selected ? 'featureOptionCard selected' : 'featureOptionCard'} onClick={onClick}>
      <span className="optionIcon">{selected ? <CheckCircle2 size={16} /> : <Plus size={16} />}</span>
      <strong>{option.title}</strong>
      <small>{option.description}</small>
    </button>
  );
}

export function FeaturesStep({ draft, setDraft }: FeaturesStepProps) {
  const categories = getVisibleFeatureCategories(draft.specs);
  const seatLayouts = useAvailableSeatLayouts(draft);
  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>(() => Object.fromEntries(categories.map((category) => [category.id, category.title === 'Seats' || category.sortOrder <= 4])));
  const [showQuickSummary, setShowQuickSummary] = useState(false);

  const totalSeatGroupQty = useMemo(() => draft.seatGroups.reduce((sum, group) => sum + group.quantity, 0), [draft.seatGroups]);
  const selectedFeatureKeys = useMemo(() => new Set(draft.features.map((feature) => `${feature.category}-${feature.label}`)), [draft.features]);

  const updateSeatPackage = (updates: Partial<RfqDraft['seatPackage']>) => {
    setDraft((current) => ({ ...current, seatPackage: { ...current.seatPackage, ...updates } }));
  };

  const updateSeatGroup = (id: string, updates: Partial<SeatGroup>) => {
    setDraft((current) => ({
      ...current,
      seatGroups: current.seatGroups.map((group) => group.id === id ? { ...group, ...updates } : group)
    }));
  };

  const toggleCategory = (categoryId: number) => {
    setOpenCategories((current) => ({ ...current, [categoryId]: !current[categoryId] }));
  };

  const toggleFeature = (categoryTitle: string, option: FeatureOptionItem) => {
    const key = `${categoryTitle}-${option.title}`;
    setDraft((current) => {
      const alreadySelected = current.features.some((feature) => `${feature.category}-${feature.label}` === key);
      return {
        ...current,
        features: alreadySelected
          ? current.features.filter((feature) => `${feature.category}-${feature.label}` !== key)
          : [...current.features, { category: categoryTitle, label: option.title, value: option.description }]
      };
    });
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

  return (
    <div className="sectionStack featuresPage">
      {categories.map((category) => {
        if (category.title === 'Seats') {
          const totalWarning = totalSeatGroupQty !== draft.seatPackage.estimatedPassengerSeats;
          return (
            <section className="panel compact seatsModule refinedSeatsModule" key={category.id}>
              <div className="featureSectionHeader">
                <div>
                  <h2>{category.title}</h2>
                  <p>Configure customer seating intent. Final floorplan validation remains with Micro Bird.</p>
                </div>
                <span className="pill">CMS-managed per model</span>
              </div>

              <div className="seatsLayout refinedSeatsLayout productionSeatsLayout">
                <div className="seatLeftColumn">
                  <div className="seatBlockTitle"><span>1</span><strong>Seat Package</strong></div>
                  <div className="seatSubHeader">
                    <h3>Seating Layout</h3>
                    <small>Filtered by selected chassis, wheelbase, and bus type.</small>
                  </div>
                  <div className="seatLayoutGrid refinedLayoutGrid productionLayoutGrid">
                    {seatLayouts.map((layout) => (
                      <SeatLayoutCard
                        key={layout.id}
                        layout={layout}
                        selected={draft.seatPackage.layoutId === layout.id}
                        draft={draft}
                        onSelect={() => updateSeatPackage({ layoutId: layout.id, estimatedPassengerSeats: Math.min(draft.seatPackage.estimatedPassengerSeats, layout.maxSeats) })}
                      />
                    ))}
                  </div>

                  <div className="seatPackageControls refinedSeatControls">
                    <SelectField label="Seat Material" value={draft.seatPackage.material} options={seatCmsConfig.materials} onChange={(value) => updateSeatPackage({ material: value })} />
                    <SelectField label="Seat Color" value={draft.seatPackage.color} options={seatCmsConfig.colors} onChange={(value) => updateSeatPackage({ color: value })} />
                    <div className="controlField"><span>Estimated Passenger Seats</span><NumberStepper value={draft.seatPackage.estimatedPassengerSeats} min={1} max={48} onChange={(value) => updateSeatPackage({ estimatedPassengerSeats: value })} /></div>
                    <div className="controlField"><span>Wheelchair / Rear Lift Positions</span><NumberStepper value={draft.seatPackage.wheelchairPositions} min={0} max={8} onChange={(value) => updateSeatPackage({ wheelchairPositions: value })} /></div>
                  </div>

                  <div className="seatTypeHeader refinedSeatTypeHeader">
                    <div className="seatBlockTitle"><span>2</span><strong>Seat Type Details</strong><small>Use rows to explain seat groups without engineering the final layout.</small></div>
                    <button type="button" onClick={addSeatGroup}><Plus size={16} /> Add Seat Type</button>
                  </div>

                  <div className="seatTypeTable refinedSeatTypeTable">
                    <div className="seatTypeHead">
                      <span>Group</span><span>Qty</span><span>Style</span><span>Restraint</span><span>Armrest</span><span>Grab</span><span>Branding</span><span>Actions</span>
                    </div>
                    {draft.seatGroups.map((group, index) => (
                      <div className="seatTypeRow" key={group.id}>
                        <strong className="rowNumber">{index + 1}</strong>
                        <input value={group.name} onChange={(event) => updateSeatGroup(group.id, { name: event.target.value })} />
                        <NumberStepper value={group.quantity} min={0} max={48} onChange={(value) => updateSeatGroup(group.id, { quantity: value })} />
                        <SelectField value={group.seatStyle} options={seatCmsConfig.seatTypes} onChange={(value) => updateSeatGroup(group.id, { seatStyle: value })} />
                        <SelectField value={group.restraintType} options={seatCmsConfig.restraintTypes} onChange={(value) => updateSeatGroup(group.id, { restraintType: value })} />
                        <SelectField value={group.armrest} options={seatCmsConfig.armrests} onChange={(value) => updateSeatGroup(group.id, { armrest: value })} />
                        <SelectField value={group.grabType} options={seatCmsConfig.grabTypes} onChange={(value) => updateSeatGroup(group.id, { grabType: value })} />
                        <SelectField value={group.branding} options={seatCmsConfig.brandingOptions} onChange={(value) => updateSeatGroup(group.id, { branding: value })} />
                        <div className="seatRowActions">
                          <button type="button" onClick={() => duplicateSeatGroup(group)}><Copy size={14} /> Copy</button>
                          <button type="button" onClick={() => removeSeatGroup(group.id)}><Trash2 size={14} /> Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalWarning && <p className="warningNote">Seat type quantity total is {totalSeatGroupQty}. Estimated passenger seats is {draft.seatPackage.estimatedPassengerSeats}. Micro Bird will validate the final layout.</p>}
                </div>
                <SeatReferencePreview draft={draft} />
              </div>
            </section>
          );
        }

        const options = getAvailableFeatureOptions(category.id, draft.specs);
        const isOpen = openCategories[category.id] ?? false;
        const selectedCount = options.filter((option) => selectedFeatureKeys.has(`${category.title}-${option.title}`)).length;

        return (
          <section className={isOpen ? 'panel compact optionAccordion open' : 'panel compact optionAccordion'} key={category.id}>
            <button type="button" className="accordionHeader" onClick={() => toggleCategory(category.id)}>
              <div>
                <strong>{category.title}</strong>
                <small>{category.description}</small>
              </div>
              <span className="pill">{selectedCount} selected / {options.length} available</span>
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isOpen && (
              <div className="featureOptionGrid">
                {options.map((option) => (
                  <FeatureOptionCard key={option.id} option={option} selected={selectedFeatureKeys.has(`${category.title}-${option.title}`)} onClick={() => toggleFeature(category.title, option)} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <section className="panel quickSummaryPanel">
        <div className="quickSummaryHeader">
          <div><CheckCircle2 size={24} /><strong>Your Selected Options</strong><span>Quick summary of current selections</span></div>
          <button type="button" onClick={() => setShowQuickSummary((current) => !current)}><Eye size={16} /> {showQuickSummary ? 'Hide Summary' : 'View Summary'}</button>
        </div>
        <div className="summaryChips">
          <span>{draft.specs.chassis}</span><span>{draft.specs.wheelbase}</span><span>{draft.specs.busType}</span><span>{draft.seatPackage.estimatedPassengerSeats} seats</span><span>{draft.seatPackage.wheelchairPositions} wheelchair / lift</span><span>{draft.features.length} options</span>
        </div>
        {showQuickSummary && (
          <div className="expandedOptionSummary">
            {draft.features.length === 0 ? <p>No extra options selected yet.</p> : draft.features.map((feature) => <p key={`${feature.category}-${feature.label}`}><strong>{feature.category}</strong><span>{feature.label}</span></p>)}
          </div>
        )}
      </section>

      <section className="panel additionalRequirementsPanel">
        <label className="field">
          <span><Info size={16} /> Additional Features or Special Requirements</span>
          <textarea placeholder="Describe any extra features, bid notes, deadlines, or special instructions for our team..." />
        </label>
      </section>
    </div>
  );
}
