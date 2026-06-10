import { Check, User } from 'lucide-react';
import type { RfqStep } from '../types/rfq';

const stepContent: Record<RfqStep, { title: string; subtitle: string }> = {
  1: {
    title: 'Start your Micro Bird quote request',
    subtitle: 'Confirm the dealer, customer, contract, and reference quote context for this RFQ.'
  },
  2: {
    title: 'Choose the vehicle intent',
    subtitle: 'Select the chassis, certification, wheelbase, bus type, quantity, and capacity requirements.'
  },
  3: {
    title: 'Select options and packages',
    subtitle: 'Choose the features that describe the customer need. Micro Bird will validate the final quote details.'
  },
  4: {
    title: 'Describe seats and floorplan intent',
    subtitle: 'Pick the general seating layout and seat details. The preview is a reference only, not final engineering approval.'
  },
  5: {
    title: 'Add documents and references',
    subtitle: 'Attach bid, floorplan, spec, and support document metadata so the quote team has the right context.'
  },
  6: {
    title: 'Review and submit your quote request',
    subtitle: 'Confirm your RFQ details before sending the request to the Micro Bird team.'
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
  const labels = ['Dealer / Customer', 'Vehicle', 'Options', 'Seats', 'Documents', 'Review'];

  return (
    <div className="stepper productionStepper">
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
