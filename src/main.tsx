import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, Check, ChevronRight, ClipboardList, Clock, FileText, HelpCircle, Menu, Pencil, Plus, Search, Upload, User, X } from 'lucide-react';
import { busTypes, chassisOptions, featureCategories, wheelbaseOptions } from './data/rfqData';
import type { RfqDraft, RfqStep } from './types/rfq';
import './styles.css';

const initialDraft: RfqDraft = {
  company: {
    dealerName: 'A. GIRARDIN INC.',
    dealerContact: 'ERIK BOISVERT',
    finalCustomerName: 'Westview Resort & Casino',
    finalCustomerPhone: '(819) 555-1234',
    provinceState: 'CANADA',
    additionalInfo: 'Delivery to main resort entrance.',
    referenceMode: 'pastOrder',
    pastQuoteOrOrderNumber: 'MB-2024-08215'
  },
  specs: {
    chassis: 'ford',
    wheelbase: '158-drw',
    busType: 'hotel',
    quantity: 1,
    seatingCapacity: 16,
    wheelchairCapacity: 1
  },
  features: featureCategories.flatMap((category) => category.options.slice(0, category.id === 'seats' ? 4 : 2)),
  confirmedAccuracy: true,
  consentToContact: true
};

function App() {
  const [step, setStep] = useState<RfqStep>(1);
  const [draft, setDraft] = useState<RfqDraft>(initialDraft);

  const selectedChassis = chassisOptions.find((item) => item.id === draft.specs.chassis);
  const selectedWheelbase = wheelbaseOptions.find((item) => item.id === draft.specs.wheelbase);
  const selectedBusType = busTypes.find((item) => item.id === draft.specs.busType);

  const progress = step * 25;

  const summaryFeatures = useMemo(() => draft.features.slice(0, 6), [draft.features]);

  const goNext = () => setStep((current) => Math.min(4, current + 1) as RfqStep);
  const goBack = () => setStep((current) => Math.max(1, current - 1) as RfqStep);

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="brand"><div className="logoMark">➤</div><span>MICRO BIRD</span></div>
        <nav className="tabs">
          <button className="active"><Plus size={18}/> New Quote</button>
          <button><FileText size={18}/> My Requests</button>
          <button><Clock size={18}/> Quote Status</button>
        </nav>
        <div className="profile"><HelpCircle size={22}/><div className="avatar">EB</div><div><strong>Erik Boisvert</strong><small>A. Girardin Inc.</small></div><Menu className="mobileMenu"/></div>
      </header>

      <main className="layout">
        <RecentRequests />
        <section className="contentCard">
          <Hero step={step}/>
          <Stepper step={step}/>
          {step === 1 && <CompanyStep draft={draft} setDraft={setDraft} />}
          {step === 2 && <SpecsStep draft={draft} setDraft={setDraft} />}
          {step === 3 && <FeaturesStep />}
          {step === 4 && <ReviewStep draft={draft} selectedChassis={selectedChassis?.name ?? ''} selectedWheelbase={selectedWheelbase?.name ?? ''} selectedBusType={selectedBusType?.name ?? ''} />}
          <div className="actions">
            <button className="secondary" onClick={goBack}>{step === 1 ? 'Save & Exit' : 'Previous'}</button>
            <button className="primary" onClick={step === 4 ? undefined : goNext}>{step === 4 ? 'Submit Quote Request' : step === 1 ? 'Next: Bus Specifications' : step === 2 ? 'Next: Features & Options' : 'Next: Review & Submit'} <ArrowRight size={18}/></button>
          </div>
        </section>
        <QuoteSummary draft={draft} progress={progress} step={step} selectedChassis={selectedChassis?.name ?? ''} selectedWheelbase={selectedWheelbase?.name ?? ''} selectedBusType={selectedBusType?.name ?? ''} features={summaryFeatures}/>
      </main>
    </div>
  );
}

function Hero({ step }: { step: RfqStep }) {
  const title = step === 3 ? 'Customize your Micro Bird bus' : step === 4 ? 'Review and submit your quote request' : 'Request a Micro Bird quote';
  const subtitle = step === 3 ? 'Select the features and options that best fit your operational needs.' : step === 4 ? 'Please confirm your selections before sending your request to our team.' : 'Complete the information below to get started. We’ll guide you through each step.';
  return <div className="hero"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="help"><User size={22}/><span><strong>Need help?</strong><br/>rfqsupport@microbird.com<br/>1-819-477-2012</span></div></div>;
}

function Stepper({ step }: { step: RfqStep }) {
  const labels = ['Company', 'Bus Specifications', 'Features & Options', 'Review & Submit'];
  return <div className="stepper">{labels.map((label, index) => { const n = index + 1; const done = n < step; const active = n === step; return <div className="step" key={label}><div className={done || active ? 'bubble active' : 'bubble'}>{done ? <Check size={18}/> : n}</div><span>{label}</span></div>; })}</div>;
}

function CompanyStep({ draft, setDraft }: { draft: RfqDraft; setDraft: React.Dispatch<React.SetStateAction<RfqDraft>> }) {
  const update = (key: keyof RfqDraft['company'], value: string) => setDraft((current) => ({ ...current, company: { ...current.company, [key]: value }}));
  return <div className="sectionStack">
    <section className="panel"><h2><User/> Company Information / Request Details</h2><div className="grid two">
      <Input label="Dealer Name *" value={draft.company.dealerName} onChange={(v) => update('dealerName', v)}/>
      <Input label="Final Customer Name / End User *" value={draft.company.finalCustomerName} onChange={(v) => update('finalCustomerName', v)}/>
      <Input label="Dealer Contact *" value={draft.company.dealerContact} onChange={(v) => update('dealerContact', v)}/>
      <Input label="Final Customer Phone *" value={draft.company.finalCustomerPhone} onChange={(v) => update('finalCustomerPhone', v)}/>
      <Input label="Province / State *" value={draft.company.provinceState} onChange={(v) => update('provinceState', v)}/>
      <Input label="Additional Information" value={draft.company.additionalInfo} onChange={(v) => update('additionalInfo', v)} textarea/>
    </div></section>
    <section className="panel"><h2><ClipboardList/> Reference Quote / Past Order</h2><div className="radioRow"><label><input type="radio" checked={draft.company.referenceMode === 'new'} onChange={() => update('referenceMode', 'new')}/> Create new quote</label><label><input type="radio" checked={draft.company.referenceMode === 'pastOrder'} onChange={() => update('referenceMode', 'pastOrder')}/> Base quote on past order</label></div><div className="referenceCard"><div><small>Selected Reference</small><strong>{draft.company.pastQuoteOrOrderNumber}</strong><p>Ford • 158” WB DRW • 16 Passenger</p></div><button className="linkBtn">View details <ChevronRight size={16}/></button></div></section>
    <section className="panel"><h2><Upload/> Upload Documents</h2><div className="uploadGrid"><div className="dropzone"><Upload/><strong>Upload Bid Document</strong><span>Drag and drop your file here or tap to browse</span><button>Choose File</button></div><div className="fileList"><FileRow name="RFP_Document.pdf" size="1.4 MB"/><FileRow name="Site_Floor_Plan.xlsx" size="420 KB"/><small>Accepted file types: PDF, DOCX, XLSX, DWG, JPG, PNG, ZIP. Max file size: 25 MB per file.</small></div></div></section>
  </div>;
}

function SpecsStep({ draft, setDraft }: { draft: RfqDraft; setDraft: React.Dispatch<React.SetStateAction<RfqDraft>> }) {
  const setSpec = <K extends keyof RfqDraft['specs']>(key: K, value: RfqDraft['specs'][K]) => setDraft((current) => ({ ...current, specs: { ...current.specs, [key]: value }}));
  return <section className="panel"><h2>Chassis Selection</h2><p className="muted">Choose your chassis platform</p><div className="cardGrid three">{chassisOptions.map((option) => <button key={option.id} className={draft.specs.chassis === option.id ? 'optionCard selected' : 'optionCard'} onClick={() => setSpec('chassis', option.id)}><div className="vehicleImage">{option.badge}</div><strong>{option.name}</strong><span>{option.description}</span></button>)}</div><h3>Wheelbase Configuration</h3><div className="cardGrid four">{wheelbaseOptions.map((option) => <button key={option.id} className={draft.specs.wheelbase === option.id ? 'miniCard selected' : 'miniCard'} onClick={() => setSpec('wheelbase', option.id)}><strong>{option.name}</strong><span>{option.description}</span></button>)}</div><h3>Bus Type</h3><div className="cardGrid three">{busTypes.map((type) => <button key={type.id} className={draft.specs.busType === type.id ? 'busCard selected' : 'busCard'} onClick={() => setSpec('busType', type.id)}><div className="busThumb"/><div><strong>{type.name}</strong><span>{type.description}</span></div></button>)}</div><div className="controls"><Counter label="Quantity of Buses" value={draft.specs.quantity} onChange={(v) => setSpec('quantity', v)}/><Range label="Seating Capacity" value={draft.specs.seatingCapacity} onChange={(v) => setSpec('seatingCapacity', v)} max={30}/><Range label="Wheelchair Capacity" value={draft.specs.wheelchairCapacity} onChange={(v) => setSpec('wheelchairCapacity', v)} max={6}/></div></section>;
}

function FeaturesStep() {
  return <div className="sectionStack">{featureCategories.map((category, index) => <section className="panel compact" key={category.id}><h2>{category.name}<span className="pill">{category.options.length} options selected</span></h2><div className="featureGrid">{category.options.map((option) => <div className="featureChip" key={`${option.label}-${option.value}`}><strong>{option.label}</strong><span>{option.value}</span></div>)}</div>{index === 0 && <p className="note">Reference only — final seating layout will be reviewed and validated by Micro Bird.</p>}</section>)}<section className="panel"><label className="field"><span>Additional Features or Special Requirements</span><textarea placeholder="Describe any additional features, custom requirements, or notes for our team..."/></label></section></div>;
}

function ReviewStep({ draft, selectedChassis, selectedWheelbase, selectedBusType }: { draft: RfqDraft; selectedChassis: string; selectedWheelbase: string; selectedBusType: string }) {
  return <div className="sectionStack"><section className="reviewGrid"><div className="panel"><h2>Company Information <button className="edit"><Pencil size={15}/> Edit</button></h2><p><strong>{draft.company.dealerName}</strong> • {draft.company.dealerContact} • {draft.company.provinceState}</p><p>{draft.company.finalCustomerName}</p></div><div className="panel"><h2>Bus Specifications <button className="edit"><Pencil size={15}/> Edit</button></h2><p><strong>{selectedBusType}</strong> • {selectedChassis} • {selectedWheelbase}</p><p>Qty {draft.specs.quantity} • Seating {draft.specs.seatingCapacity} • Wheelchair {draft.specs.wheelchairCapacity}</p></div></section><section className="panel"><h2>Selected Features <button className="edit"><Pencil size={15}/> Edit</button></h2><div className="reviewFeatureGrid">{featureCategories.slice(0, 6).map((category) => <div key={category.id}><strong>{category.name}</strong><ul>{category.options.slice(0, 3).map((option) => <li key={option.label}>{option.label}: {option.value}</li>)}</ul></div>)}</div></section><section className="panel"><h2>Submission Review</h2><label className="check"><input type="checkbox" checked readOnly/> I confirm that the information provided is accurate and complete to the best of my knowledge.</label><label className="check"><input type="checkbox" checked readOnly/> I consent to be contacted by a Micro Bird dealer or representative regarding this quote request.</label><div className="infoBox">Your request will be reviewed by our quote team. You will receive an email confirmation shortly.</div></section></div>;
}

function QuoteSummary({ draft, progress, step, selectedChassis, selectedWheelbase, selectedBusType, features }: { draft: RfqDraft; progress: number; step: RfqStep; selectedChassis: string; selectedWheelbase: string; selectedBusType: string; features: { label: string; value: string }[] }) {
  return <aside className="summary"><h3>Quote Summary <button>Edit <Pencil size={14}/></button></h3><hr/><small>COMPANY</small><strong>{draft.company.dealerName}</strong><span>Contact</span><strong>{draft.company.dealerContact}</strong><span>Province / State</span><strong>{draft.company.provinceState}</strong><hr/><small>BUS SPECIFICATIONS</small><div className="summaryBus"/><span>Bus Type</span><strong>{selectedBusType}</strong><span>Chassis</span><strong>{selectedChassis}</strong><span>Wheelbase</span><strong>{selectedWheelbase}</strong><span>Quantity</span><strong>{draft.specs.quantity}</strong><span>Seating Capacity</span><strong>{draft.specs.seatingCapacity}</strong><span>Wheelchair Capacity</span><strong>{draft.specs.wheelchairCapacity}</strong>{step >= 3 && <><hr/><small>SELECTED FEATURES</small>{features.map((f) => <p className="featureSummary" key={f.label}>{f.label}<strong>{f.value}</strong></p>)}</>}<hr/><small>PROGRESS</small><div className="progress"><div>{progress}%</div><span>Step {step} of 4<br/><strong>{['Company Information','Bus Specifications','Features & Options','Review & Submit'][step - 1]}</strong></span></div></aside>;
}

function RecentRequests() { return <aside className="recent"><h3><Clock size={18}/> Recent Requests</h3>{['R-2024-0456','R-2024-0432','R-2024-0411','R-2024-0387','R-2024-0355'].map((id, i) => <div className="recentItem" key={id}><strong>{id}</strong><span>{['Submitted','In Review','Quote Sent','Submitted','In Review'][i]}</span><small>{['May 9, 2024 • Hotel & Resort','May 6, 2024 • Commercial Bus','Apr 30, 2024 • Special Needs','Apr 25, 2024 • Airport Shuttle','Apr 20, 2024 • Church & Community'][i]}</small></div>)}<button>View all requests <ChevronRight size={16}/></button></aside>; }
function Input({ label, value, onChange, textarea }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean }) { return <label className="field"><span>{label}</span>{textarea ? <textarea value={value} onChange={(e) => onChange(e.target.value)}/> : <input value={value} onChange={(e) => onChange(e.target.value)}/>}</label>; }
function FileRow({ name, size }: { name: string; size: string }) { return <div className="fileRow"><FileText size={18}/><span>{name}</span><small>{size}</small><X size={16}/></div>; }
function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) { return <div className="control"><span>{label} *</span><div className="counter"><button onClick={() => onChange(Math.max(1, value - 1))}>−</button><strong>{value}</strong><button onClick={() => onChange(value + 1)}>+</button></div></div>; }
function Range({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) { return <div className="control"><span>{label} *</span><div className="range"><input type="range" min="0" max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}/><strong>{value}</strong></div></div>; }

createRoot(document.getElementById('root')!).render(<App />);
