import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Armchair, Bus, Copy, Grid2X2, Plus, ShieldCheck, Trash2, Users, Accessibility } from 'lucide-react';
import { seatCmsConfig } from '../../data/featureOptionMatrix';
import { useAvailableSeatLayouts } from '../../hooks/useSeatCmsData';
import { SeatLayoutCard, SeatReferencePreview } from './SeatFramePreview';
import type { RfqDraft, SeatGroup, SeatLayoutTemplate } from '../../types/rfq';
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

type SeatingPurpose = 'school' | 'commercial' | 'accessible' | 'custom';
type LayoutFamily = 'all' | 'standard' | 'accessible' | 'perimeter' | 'lounge';

const layoutFamilyLabels: Record<LayoutFamily, string> = {
  all: 'All Layouts',
  standard: 'Forward-Facing',
  accessible: 'Wheelchair / Lift',
  perimeter: 'Perimeter',
  lounge: 'Lounge / Mixed'
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

function getPurposeFromDraft(draft: RfqDraft): SeatingPurpose {
  const certification = draft.specs.certification.toLowerCase();
  const busType = draft.specs.busType.toLowerCase();
  const layoutId = draft.seatPackage.layoutId.toLowerCase();
  if (draft.seatPackage.wheelchairPositions > 0 || layoutId.includes('wheelchair') || layoutId.includes('ada')) return 'accessible';
  if (certification.includes('school') || busType.includes('school')) return 'school';
  if (layoutId.includes('perimeter') || layoutId.includes('lounge')) return 'commercial';
  return 'commercial';
}

function getLayoutFamily(layout: SeatLayoutTemplate): Exclude<LayoutFamily, 'all'> {
  const haystack = `${layout.id} ${layout.title} ${layout.description} ${layout.layoutType} ${layout.layoutFamily ?? ''}`.toLowerCase();
  if (haystack.includes('wheelchair') || haystack.includes('ada') || haystack.includes('accessible') || layout.maxWheelchairPositions) return 'accessible';
  if (haystack.includes('perimeter')) return 'perimeter';
  if (haystack.includes('lounge') || haystack.includes('mixed')) return 'lounge';
  return 'standard';
}

function purposeCopy(purpose: SeatingPurpose) {
  if (purpose === 'school') {
    return {
      title: 'Type-A School Bus Seating',
      description: 'Focus on student capacity, forward-facing rows, restraints, and compliance review.',
      badge: 'School intent'
    };
  }
  if (purpose === 'accessible') {
    return {
      title: 'Accessible / Lift Seating',
      description: 'Capture wheelchair positions, lift clearance, foldaway seating, and passenger capacity trade-offs.',
      badge: 'Accessibility intent'
    };
  }
  if (purpose === 'custom') {
    return {
      title: 'Custom Seating Request',
      description: 'Use this when the customer has a special layout, unusual passenger mix, or reference floorplan.',
      badge: 'Custom review'
    };
  }
  return {
    title: 'Commercial Bus Seating',
    description: 'Focus on passenger comfort, materials, capacity, wheelchair intent, and optional perimeter or lounge layouts.',
    badge: 'Commercial intent'
  };
}

function getRecommendedFamilies(purpose: SeatingPurpose): LayoutFamily[] {
  if (purpose === 'school') return ['standard', 'accessible'];
  if (purpose === 'accessible') return ['accessible', 'standard'];
  if (purpose === 'custom') return ['all', 'standard', 'accessible', 'perimeter', 'lounge'];
  return ['standard', 'accessible', 'perimeter', 'lounge'];
}

export function SeatsStep({ draft, setDraft }: SeatsStepProps) {
  const seatCmsData = useAvailableSeatLayouts(draft);
  const [selectedPurpose, setSelectedPurpose] = useState<SeatingPurpose>(() => getPurposeFromDraft(draft));
  const [selectedFamily, setSelectedFamily] = useState<LayoutFamily>('all');
  const totalSeatGroupQty = useMemo(() => draft.seatGroups.reduce((sum, group) => sum + group.quantity, 0), [draft.seatGroups]);
  const purpose = purposeCopy(selectedPurpose);
  const recommendedFamilies = getRecommendedFamilies(selectedPurpose);

  const seatLayouts = useMemo(() => {
    const baseLayouts = seatCmsData.availableLayouts;
    if (selectedFamily === 'all') return baseLayouts;
    return baseLayouts.filter((layout) => getLayoutFamily(layout) === selectedFamily);
  }, [seatCmsData.availableLayouts, selectedFamily]);

  const schoolLike = selectedPurpose === 'school';
  const commercialLike = selectedPurpose === 'commercial' || selectedPurpose === 'custom';
  const accessibleLike = selectedPurpose === 'accessible' || draft.seatPackage.wheelchairPositions > 0;

  const updateSeatPackage = (updates: Partial<RfqDraft['seatPackage']>) => {
    setDraft((current) => ({ ...current, seatPackage: { ...current.seatPackage, ...updates } }));
  };

  const updateSeatGroup = (id: string, updates: Partial<SeatGroup>) => {
    setDraft((current) => ({
      ...current,
      seatGroups: current.seatGroups.map((group) => group.id === id ? { ...group, ...updates } : group)
    }));
  };

  const selectPurpose = (purposeValue: SeatingPurpose) => {
    setSelectedPurpose(purposeValue);
    setSelectedFamily(purposeValue === 'accessible' ? 'accessible' : purposeValue === 'custom' ? 'all' : 'standard');
    if (purposeValue === 'accessible') updateSeatPackage({ wheelchairPositions: Math.max(1, draft.seatPackage.wheelchairPositions) });
    if (purposeValue === 'school') {
      setDraft((current) => ({
        ...current,
        seatGroups: current.seatGroups.map((group, index) => index === 0 ? { ...group, name: 'Student Passenger Seats' } : group)
      }));
    }
    if (purposeValue === 'commercial') {
      setDraft((current) => ({
        ...current,
        seatGroups: current.seatGroups.map((group, index) => index === 0 ? { ...group, name: 'Passenger Seats' } : group)
      }));
    }
  };

  const addSeatGroup = () => {
    setDraft((current) => ({
      ...current,
      seatGroups: [
        ...current.seatGroups,
        {
          id: `seat-group-${Date.now()}`,
          name: selectedPurpose === 'school' ? 'Additional Student Seat Type' : selectedPurpose === 'accessible' ? 'Foldaway / Companion Seats' : 'Additional Seat Type',
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
    <div className="sectionStack featuresPage dealerSeatsPage seatUxV2">
      <section className="panel compact seatsModule refinedSeatsModule">
        <div className="featureSectionHeader dealerSectionHeader">
          <div>
            <h2>Seats & Floorplan Intent</h2>
            <p>Select the general seating intent. Micro Bird will review and validate the final layout before quoting.</p>
          </div>
          <span className="pill">{purpose.badge}</span>
        </div>

        <div className="seatPurposeGrid">
          <button type="button" className={selectedPurpose === 'school' ? 'seatPurposeCard selected' : 'seatPurposeCard'} onClick={() => selectPurpose('school')}>
            <Bus size={22} />
            <strong>Type-A School</strong>
            <small>Student capacity, forward-facing rows, restraints, compliance review.</small>
          </button>
          <button type="button" className={selectedPurpose === 'commercial' ? 'seatPurposeCard selected' : 'seatPurposeCard'} onClick={() => selectPurpose('commercial')}>
            <Users size={22} />
            <strong>Commercial</strong>
            <small>Passenger comfort, material/color, airport, shuttle, activity, or private use.</small>
          </button>
          <button type="button" className={selectedPurpose === 'accessible' ? 'seatPurposeCard selected' : 'seatPurposeCard'} onClick={() => selectPurpose('accessible')}>
            <Accessibility size={22} />
            <strong>Accessible / Lift</strong>
            <small>Wheelchair positions, foldaway seats, rear lift or ADA-style intent.</small>
          </button>
          <button type="button" className={selectedPurpose === 'custom' ? 'seatPurposeCard selected' : 'seatPurposeCard'} onClick={() => selectPurpose('custom')}>
            <Grid2X2 size={22} />
            <strong>Custom / Reference</strong>
            <small>Customer has a sketch, reference layout, or unusual seating request.</small>
          </button>
        </div>

        <div className="seatGuidanceBanner">
          <ShieldCheck size={20} />
          <div>
            <strong>{purpose.title}</strong>
            <span>{purpose.description}</span>
          </div>
        </div>

        {seatCmsData.loadState === 'loading' && <div className="infoBox">Loading available seating layouts...</div>}
        {seatCmsData.error && <div className="warningNote">Seat layout service is temporarily unavailable. Showing backup layout options.</div>}

        <div className="seatsLayout refinedSeatsLayout productionSeatsLayout">
          <div className="seatLeftColumn">
            <div className="seatBlockTitle"><span>1</span><strong>Choose Layout Family</strong></div>
            <div className="layoutFamilyTabs">
              {(['all', 'standard', 'accessible', 'perimeter', 'lounge'] as LayoutFamily[]).map((family) => {
                const recommended = recommendedFamilies.includes(family);
                return (
                  <button type="button" key={family} className={selectedFamily === family ? 'selected' : ''} onClick={() => setSelectedFamily(family)}>
                    {layoutFamilyLabels[family]}
                    {recommended && <small>Recommended</small>}
                  </button>
                );
              })}
            </div>

            <div className="seatBlockTitle"><span>2</span><strong>Choose a Compatible Layout</strong></div>
            <div className="seatSubHeader">
              <h3>General layout intent</h3>
              <small>{seatLayouts.length} layout{seatLayouts.length === 1 ? '' : 's'} shown for this vehicle and filter.</small>
            </div>

            <div className="seatLayoutGrid refinedLayoutGrid productionLayoutGrid">
              {seatLayouts.map((layout) => (
                <SeatLayoutCard
                  key={layout.id}
                  layout={layout}
                  selected={draft.seatPackage.layoutId === layout.id}
                  draft={draft}
                  cmsRows={seatCmsData.rows}
                  marketHint={selectedPurpose}
                  layoutFamily={getLayoutFamily(layout)}
                  onSelect={() => updateSeatPackage({
                    layoutId: layout.id,
                    estimatedPassengerSeats: Math.min(draft.seatPackage.estimatedPassengerSeats, layout.defaultCapacity ?? layout.maxSeats),
                    wheelchairPositions: Math.min(draft.seatPackage.wheelchairPositions, layout.maxWheelchairPositions ?? draft.seatPackage.wheelchairPositions)
                  })}
                />
              ))}
              {seatLayouts.length === 0 && <div className="infoBox fullWidthNotice">No seating layouts match the selected filter. Choose All Layouts or describe a custom seating request in the notes.</div>}
            </div>

            <div className="seatBlockTitle"><span>3</span><strong>Seat Package</strong></div>
            <div className="seatPackageControls refinedSeatControls">
              <SelectField label="Seat Material" value={draft.seatPackage.material} options={seatCmsConfig.materials} onChange={(value) => updateSeatPackage({ material: value })} />
              <SelectField label="Seat Color" value={draft.seatPackage.color} options={seatCmsConfig.colors} onChange={(value) => updateSeatPackage({ color: value })} />
              <div className="controlField"><span>{schoolLike ? 'Estimated Student Seats' : 'Estimated Passenger Seats'}</span><NumberStepper value={draft.seatPackage.estimatedPassengerSeats} onChange={(value) => updateSeatPackage({ estimatedPassengerSeats: value })} min={0} /></div>
              <div className="controlField"><span>Wheelchair Positions</span><NumberStepper value={draft.seatPackage.wheelchairPositions} onChange={(value) => updateSeatPackage({ wheelchairPositions: value })} min={0} max={4} /></div>
            </div>

            <div className="seatIntentChips">
              {schoolLike && <span>School seating intent</span>}
              {commercialLike && <span>Commercial passenger comfort</span>}
              {accessibleLike && <span>Accessibility review required</span>}
              <span>Reference only preview</span>
            </div>
          </div>

          <aside className="seatPreviewPanel refinedSeatPreviewPanel">
            <SeatReferencePreview draft={draft} cmsData={seatCmsData} marketHint={selectedPurpose} />
            <div className="seatPreviewSummary">
              <strong>Reference only</strong>
              <span>Final seating layout, floorplan, and engineering feasibility will be reviewed and validated by Micro Bird.</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="panel compact seatDetailsPanel">
        <div className="featureSectionHeader dealerSectionHeader">
          <div>
            <h2>Seat Type Details</h2>
            <p>Add the seat groups required for quoting. These are quantity and feature details, not final placement.</p>
          </div>
          <button className="btn btn-secondary btn-sm" type="button" onClick={addSeatGroup}><Plus size={16} /> Add Seat Type</button>
        </div>

        {totalWarning && <div className="warningNote">Seat type quantities total {totalSeatGroupQty}, while estimated passenger seats is {draft.seatPackage.estimatedPassengerSeats}. This can still be submitted as intent, but should be reviewed.</div>}

        <div className="seatTypeCardList">
          {draft.seatGroups.map((group, index) => (
            <article className="seatTypeCard" key={group.id}>
              <header>
                <span><Armchair size={18} /> Seat Type {index + 1}</span>
                <div>
                  <button type="button" className="iconMiniButton" onClick={() => duplicateSeatGroup(group)} aria-label="Duplicate seat type"><Copy size={15} /></button>
                  <button type="button" className="iconMiniButton danger" onClick={() => removeSeatGroup(group.id)} aria-label="Remove seat type"><Trash2 size={15} /></button>
                </div>
              </header>
              <div className="seatTypeCardGrid">
                <label><span>Group Name</span><input value={group.name} onChange={(event) => updateSeatGroup(group.id, { name: event.target.value })} /></label>
                <label><span>Qty</span><input type="number" min="0" value={group.quantity} onChange={(event) => updateSeatGroup(group.id, { quantity: Number(event.target.value) })} /></label>
                <label><span>Seat Style</span><select value={group.seatStyle} onChange={(event) => updateSeatGroup(group.id, { seatStyle: event.target.value })}>{seatCmsConfig.seatTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span>Restraint</span><select value={group.restraintType} onChange={(event) => updateSeatGroup(group.id, { restraintType: event.target.value })}>{seatCmsConfig.restraintTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span>Armrest / Grab</span><select value={group.armrest} onChange={(event) => updateSeatGroup(group.id, { armrest: event.target.value })}>{seatCmsConfig.armrests.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span>Grab Type</span><select value={group.grabType} onChange={(event) => updateSeatGroup(group.id, { grabType: event.target.value })}>{seatCmsConfig.grabTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span>Branding</span><select value={group.branding} onChange={(event) => updateSeatGroup(group.id, { branding: event.target.value })}>{seatCmsConfig.brandingOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
