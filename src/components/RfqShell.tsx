import { Check, User } from 'lucide-react';
import type { RfqStep } from '../types/rfq';

export function Hero({ step }: { step: RfqStep }) {
  const title = step === 3 ? 'Customize your Micro Bird bus' : step === 4 ? 'Review and submit your quote request' : 'Request a Micro Bird quote';
  const subtitle = step === 3 ? 'Select the features and options that best fit your operational needs.' : step === 4 ? 'Please confirm your selections before sending your request to our team.' : 'Complete the information below to get started. We’ll guide you through each step.';

  return (
    <div className="hero">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="help">
        <User size={22} />
        <span><strong>Need help?</strong><br />rfqsupport@microbird.com<br />1-819-477-2012</span>
      </div>
    </div>
  );
}

export function Stepper({ step }: { step: RfqStep }) {
  const labels = ['Company', 'Bus Specifications', 'Features & Options', 'Review & Submit'];

  return (
    <div className="stepper">
      {labels.map((label, index) => {
        const number = index + 1;
        const done = number < step;
        const active = number === step;
        return (
          <div className="step" key={label}>
            <div className={done || active ? 'bubble active' : 'bubble'}>{done ? <Check size={18} /> : number}</div>
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
