import type { Dispatch, SetStateAction } from 'react';
import { busTypes, chassisOptions, wheelbaseOptions } from '../../data/rfqData';
import { Counter, Range } from '../FormControls';
import type { RfqDraft } from '../../types/rfq';

type SpecsStepProps = {
  draft: RfqDraft;
  setDraft: Dispatch<SetStateAction<RfqDraft>>;
};

export function SpecsStep({ draft, setDraft }: SpecsStepProps) {
  const setSpec = <K extends keyof RfqDraft['specs']>(key: K, value: RfqDraft['specs'][K]) => {
    setDraft((current) => ({ ...current, specs: { ...current.specs, [key]: value } }));
  };

  return (
    <section className="panel">
      <h2>Chassis Selection</h2>
      <p className="muted">Choose your chassis platform</p>
      <div className="cardGrid three">
        {chassisOptions.map((option) => (
          <button key={option.id} className={draft.specs.chassis === option.id ? 'optionCard selected' : 'optionCard'} onClick={() => setSpec('chassis', option.id)}>
            <div className="vehicleImage">{option.badge}</div>
            <strong>{option.name}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>

      <h3>Wheelbase Configuration</h3>
      <div className="cardGrid four">
        {wheelbaseOptions.map((option) => (
          <button key={option.id} className={draft.specs.wheelbase === option.id ? 'miniCard selected' : 'miniCard'} onClick={() => setSpec('wheelbase', option.id)}>
            <strong>{option.name}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>

      <h3>Bus Type</h3>
      <div className="cardGrid three">
        {busTypes.map((type) => (
          <button key={type.id} className={draft.specs.busType === type.id ? 'busCard selected' : 'busCard'} onClick={() => setSpec('busType', type.id)}>
            <div className="busThumb" />
            <div>
              <strong>{type.name}</strong>
              <span>{type.description}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="controls">
        <Counter label="Quantity of Buses" value={draft.specs.quantity} onChange={(value) => setSpec('quantity', value)} />
        <Range label="Seating Capacity" value={draft.specs.seatingCapacity} onChange={(value) => setSpec('seatingCapacity', value)} max={30} />
        <Range label="Wheelchair Capacity" value={draft.specs.wheelchairCapacity} onChange={(value) => setSpec('wheelchairCapacity', value)} max={6} />
      </div>
    </section>
  );
}
