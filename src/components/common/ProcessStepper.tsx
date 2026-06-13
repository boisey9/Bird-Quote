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
  return (
    <div className={compact ? 'processStepper compactProcessStepper' : 'processStepper'}>
      {steps.map((item, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <div className={done ? 'processStep done' : active ? 'processStep active' : 'processStep'} key={item.id}>
            <div className="processStepMarker">{done ? '✓' : number}</div>
            <div className="processStepText">
              <strong>{item.label}</strong>
              {item.description && <small>{item.description}</small>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
