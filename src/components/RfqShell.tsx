import { User } from 'lucide-react';
import { ProcessStepper } from './common/ProcessStepper';
import type { RfqStep } from '../types/rfq';

const stepContent: Record<RfqStep, { title: string; subtitle: string }> = {
  1: { title: 'Start your Micro Bird RFQ', subtitle: 'Confirm the dealer, customer, contract, reference quote, and supporting context.' },
  2: { title: 'Choose the bus selection', subtitle: 'Select chassis, certification, wheelbase, bus type, quantity, and capacity needs.' },
  3: { title: 'Define seats and options', subtitle: 'Capture seating intent and customer-facing options for review.' },
  4: { title: 'Review and submit your RFQ', subtitle: 'Confirm the RFQ details before sending the request to Micro Bird.' }
};

const intakeSteps = [
  { id: 1, label: 'Request Info' },
  { id: 2, label: 'Bus Selection' },
  { id: 3, label: 'Seats & Options' },
  { id: 4, label: 'Review & Submit' }
];

export function Hero({ step }: { step: RfqStep }) {
  const content = stepContent[step];
  return (
    <div className="hero">
      <div><h1>{content.title}</h1><p>{content.subtitle}</p></div>
      <div className="help"><User size={22} /><span><strong>Need help?</strong><br />RFQ support</span></div>
    </div>
  );
}

export function Stepper({ step }: { step: RfqStep }) {
  return <ProcessStepper steps={intakeSteps} current={step} />;
}
