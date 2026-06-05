import { FileText, X } from 'lucide-react';

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
};

export function Input({ label, value, onChange, textarea }: InputProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

export function FileRow({ name, size }: { name: string; size: string }) {
  return (
    <div className="fileRow">
      <FileText size={18} />
      <span>{name}</span>
      <small>{size}</small>
      <X size={16} />
    </div>
  );
}

export function Counter({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="control">
      <span>{label} *</span>
      <div className="counter">
        <button onClick={() => onChange(Math.max(1, value - 1))}>−</button>
        <strong>{value}</strong>
        <button onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

export function Range({ label, value, onChange, max }: { label: string; value: number; onChange: (value: number) => void; max: number }) {
  return (
    <div className="control">
      <span>{label} *</span>
      <div className="range">
        <input type="range" min="0" max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <strong>{value}</strong>
      </div>
    </div>
  );
}
