import type { Dispatch, SetStateAction } from 'react';
import { ChevronRight, ClipboardList, Upload, User } from 'lucide-react';
import { FileRow, Input } from '../FormControls';
import type { RfqDraft } from '../../types/rfq';

type CompanyStepProps = {
  draft: RfqDraft;
  setDraft: Dispatch<SetStateAction<RfqDraft>>;
};

export function CompanyStep({ draft, setDraft }: CompanyStepProps) {
  const update = (key: keyof RfqDraft['company'], value: string) => {
    setDraft((current) => ({ ...current, company: { ...current.company, [key]: value } }));
  };

  return (
    <div className="sectionStack">
      <section className="panel">
        <h2><User /> Company Information / Request Details</h2>
        <div className="grid two">
          <Input label="Dealer Name *" value={draft.company.dealerName} onChange={(value) => update('dealerName', value)} />
          <Input label="Final Customer Name / End User *" value={draft.company.finalCustomerName} onChange={(value) => update('finalCustomerName', value)} />
          <Input label="Dealer Contact *" value={draft.company.dealerContact} onChange={(value) => update('dealerContact', value)} />
          <Input label="Final Customer Phone *" value={draft.company.finalCustomerPhone} onChange={(value) => update('finalCustomerPhone', value)} />
          <Input label="Province / State *" value={draft.company.provinceState} onChange={(value) => update('provinceState', value)} />
          <Input label="Additional Information" value={draft.company.additionalInfo} onChange={(value) => update('additionalInfo', value)} textarea />
        </div>
      </section>

      <section className="panel">
        <h2><ClipboardList /> Reference Quote / Past Order</h2>
        <div className="radioRow">
          <label><input type="radio" checked={draft.company.referenceMode === 'new'} onChange={() => update('referenceMode', 'new')} /> Create new quote</label>
          <label><input type="radio" checked={draft.company.referenceMode === 'pastOrder'} onChange={() => update('referenceMode', 'pastOrder')} /> Base quote on past order</label>
        </div>
        <div className="referenceCard">
          <div>
            <small>Selected Reference</small>
            <strong>{draft.company.pastQuoteOrOrderNumber}</strong>
            <p>Ford • 158” WB DRW • 16 Passenger</p>
          </div>
          <button className="linkBtn">View details <ChevronRight size={16} /></button>
        </div>
      </section>

      <section className="panel">
        <h2><Upload /> Upload Documents</h2>
        <div className="uploadGrid">
          <div className="dropzone">
            <Upload />
            <strong>Upload Bid Document</strong>
            <span>Drag and drop your file here or tap to browse</span>
            <button>Choose File</button>
          </div>
          <div className="fileList">
            <FileRow name="RFP_Document.pdf" size="1.4 MB" />
            <FileRow name="Site_Floor_Plan.xlsx" size="420 KB" />
            <small>Accepted file types: PDF, DOCX, XLSX, DWG, JPG, PNG, ZIP. Max file size: 25 MB per file.</small>
          </div>
        </div>
      </section>
    </div>
  );
}
