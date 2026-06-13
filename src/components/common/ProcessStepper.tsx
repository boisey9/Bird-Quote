type StepItem = {
  id: string | number;
  label: string;
  description?: string;
};

type ProcessStepperProps = {
  steps: StepItem[];
  current: number;
  compact?: boolean;
};

export function ProcessStepper({ steps, current, compact = false }: ProcessStepperProps) {
  const safeCurrent = Math.min(Math.max(current, 1), steps.length);
  return (
    <div className={compact ? 'processStepper compactProcessStepper railStepper' : 'processStepper railStepper'} aria-label={`Step ${safeCurrent} of ${steps.length}`}>
      <div className="processStepperMeta">
        <span>Step {safeCurrent} of {steps.length}</span>
        <strong>{steps[safeCurrent - 1]?.label}</strong>
      </div>
      <div className="processStepperTrack" role="list">
        {steps.map((item, index) => {
          const number = index + 1;
          const done = number < safeCurrent;
          const active = number === safeCurrent;
          return (
            <div className={done ? 'processStep done' : active ? 'processStep active' : 'processStep'} key={item.id} role="listitem" aria-current={active ? 'step' : undefined}>
              <div className="processStepMarker">{done ? '✓' : number}</div>
              <div className="processStepText">
                <strong>{item.label}</strong>
                {item.description && <small>{item.description}</small>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
