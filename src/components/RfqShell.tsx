import { Check, User } from 'lucide-react';
import type { RfqStep } from '../types/rfq';

const stepContent: Record<RfqStep, { title: string; subtitle: string }> = {
  1: {
    title: 'Start your Micro Bird quote request',
    subtitle: 'Confirm the dealer, customer, contract, reference quote, and supporting context for this RFQ.'
  },
  2: {
    title: 'Choose the bus selection',
    subtitle: 'Select the chassis, certification, wheelbase, bus type, quantity, and capacity requirements.'
  },
  3: {
    title: 'Define seats and options',
    subtitle: 'Capture seating intent first, then select customer-facing options and packages for review.'
  },
  4: {
    title: 'Review and submit your quote request',
    subtitle: 'Confirm the RFQ details before sending the request to the Micro Bird team.'
  }
};

export function Hero({ step }: { step: RfqStep }) {
  const content = stepContent[step];

  return (
    <div className="hero">
      <div>
        <h1>{content.title}</h1>
        <p>{content.subtitle}</p>
      </div>
      <div className="help">
        <User size={22} />
        <span><strong>Need help?</strong><br />rfqsupport@microbird.com<br />1-819-477-2012</span>
      </div>
    </div>
  );
}

export function Stepper({ step }: { step: RfqStep }) {
  const labels = ['Request Info', 'Bus Selection', 'Seats & Options', 'Review & Submit'];

  return (
    <div className="stepper productionStepper fourStepStepper">
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
