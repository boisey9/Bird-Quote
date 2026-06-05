import type { Dispatch, SetStateAction } from 'react';
import { busSpecMatrixData } from '../../data/busSpecMatrix';
import { Counter, Range } from '../FormControls';
import type { RfqDraft } from '../../types/rfq';

type SpecsStepProps = {
  draft: RfqDraft;
  setDraft: Dispatch<SetStateAction<RfqDraft>>;
};

function sortByOrder<T extends { sortOrder: number }>(items: T[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function SpecsStep({ draft, setDraft }: SpecsStepProps) {
  const selectedChassisId = draft.specs.chassis;
  const selectedCertificationId = draft.specs.certification;
  const selectedWheelbaseId = draft.specs.wheelbase;

  const availableCertifications = sortByOrder(
    busSpecMatrixData.certifications.filter((item) => item.active && item.chassisId === selectedChassisId)
  );

  const availableWheelbases = sortByOrder(
    busSpecMatrixData.wheelbases.filter((item) => item.active && item.chassisId === selectedChassisId)
  );

  const compatibleBusTypeIds = new Set(
    busSpecMatrixData.compatibility
      .filter((item) => item.chassisId === selectedChassisId && item.wheelbaseId === selectedWheelbaseId)
      .map((item) => item.busTypeId)
  );

  const availableBusTypes = sortByOrder(
    busSpecMatrixData.busTypes.filter((item) => item.active && compatibleBusTypeIds.has(item.id))
  );

  const updateSpecs = (updates: Partial<RfqDraft['specs']>) => {
    setDraft((current) => ({ ...current, specs: { ...current.specs, ...updates } }));
  };

  const selectChassis = (chassisId: string) => {
    const nextCertification = sortByOrder(busSpecMatrixData.certifications.filter((item) => item.active && item.chassisId === chassisId))[0];
    const nextWheelbase = sortByOrder(busSpecMatrixData.wheelbases.filter((item) => item.active && item.chassisId === chassisId))[0];
    const nextBusTypeId = busSpecMatrixData.compatibility.find((item) => item.chassisId === chassisId && item.wheelbaseId === nextWheelbase?.id)?.busTypeId;

    updateSpecs({
      chassis: chassisId,
      certification: nextCertification?.id ?? '',
      wheelbase: nextWheelbase?.id ?? '',
      busType: nextBusTypeId ?? ''
    });
  };

  const selectWheelbase = (wheelbaseId: string) => {
    const nextBusTypeId = busSpecMatrixData.compatibility.find((item) => item.chassisId === selectedChassisId && item.wheelbaseId === wheelbaseId)?.busTypeId;
    updateSpecs({ wheelbase: wheelbaseId, busType: nextBusTypeId ?? '' });
  };

  return (
    <section className="panel">
      <h2>Chassis Selection</h2>
      <p className="muted">Choose your chassis platform</p>
      <div className="cardGrid three">
        {sortByOrder(busSpecMatrixData.chassis.filter((option) => option.active)).map((option) => (
          <button key={option.id} className={draft.specs.chassis === option.id ? 'optionCard selected' : 'optionCard'} onClick={() => selectChassis(option.id)}>
            <div className="vehicleImage">{option.badge}</div>
            <strong>{option.name}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>

      <h3>Certification / Package</h3>
      <div className="cardGrid three">
        {availableCertifications.map((option) => (
          <button key={option.id} className={selectedCertificationId === option.id ? 'miniCard selected' : 'miniCard'} onClick={() => updateSpecs({ certification: option.id })}>
            <strong>{option.name}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>

      <h3>Wheelbase Configuration</h3>
      <div className="cardGrid four">
        {availableWheelbases.map((option) => (
          <button key={option.id} className={draft.specs.wheelbase === option.id ? 'miniCard selected' : 'miniCard'} onClick={() => selectWheelbase(option.id)}>
            <strong>{option.name}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>

      <h3>Bus Type</h3>
      <div className="cardGrid three">
        {availableBusTypes.map((type) => (
          <button key={type.id} className={draft.specs.busType === type.id ? 'busCard selected' : 'busCard'} onClick={() => updateSpecs({ busType: type.id })}>
            <div className="busThumb" />
            <div>
              <strong>{type.name}</strong>
              <span>{type.description}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="controls">
        <Counter label="Quantity of Buses" value={draft.specs.quantity} onChange={(value) => updateSpecs({ quantity: value })} />
        <Range label="Seating Capacity" value={draft.specs.seatingCapacity} onChange={(value) => updateSpecs({ seatingCapacity: value })} max={30} />
        <Range label="Wheelchair Capacity" value={draft.specs.wheelchairCapacity} onChange={(value) => updateSpecs({ wheelchairCapacity: value })} max={6} />
      </div>
    </section>
  );
}
