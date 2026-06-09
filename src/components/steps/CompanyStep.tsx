import { useState, type Dispatch, type SetStateAction } from 'react';
import { ChevronRight, ClipboardList, FileCheck2, Plus, Trash2, Upload, User } from 'lucide-react';
import { contractOptions, getContractById } from '../../data/contractConfig';
import { FileRow, Input } from '../FormControls';
import type { RfqDocument, RfqDraft } from '../../types/rfq';

type CompanyStepProps = {
  draft: RfqDraft;
  setDraft: Dispatch<SetStateAction<RfqDraft>>;
};

const documentTypes: RfqDocument['documentType'][] = ['bid', 'floorplan', 'spec-sheet', 'supporting', 'site-photos', 'other'];

function inferFileType(fileName: string) {
  const ext = fileName.split('.').pop()?.toUpperCase();
  return ext || 'FILE';
}

export function CompanyStep({ draft, setDraft }: CompanyStepProps) {
  const [showReferenceDetails, setShowReferenceDetails] = useState(false);
  const selectedContract = getContractById(draft.company.contractId);

  const update = (key: keyof RfqDraft['company'], value: string) => {
    setDraft((current) => ({ ...current, company: { ...current.company, [key]: value } }));
  };

  const updateContract = (contractId: string) => {
    const contract = getContractById(contractId);
    setDraft((current) => ({
      ...current,
      company: {
        ...current.company,
        contractId: contract.id,
        contractWorkflowType: contract.workflowType
      }
    }));
  };

  const addDocument = () => {
    setDraft((current) => ({
      ...current,
      documents: [
        ...current.documents,
        {
          id: `doc-${Date.now()}`,
          fileName: 'New_Document.pdf',
          fileType: 'PDF',
          fileSize: '0 KB',
          documentType: 'supporting'
        }
      ]
    }));
  };

  const updateDocument = (id: string, updates: Partial<RfqDocument>) => {
    setDraft((current) => ({
      ...current,
      documents: current.documents.map((document) => {
        if (document.id !== id) return document;
        const nextDocument = { ...document, ...updates };
        if (updates.fileName) nextDocument.fileType = inferFileType(updates.fileName);
        return nextDocument;
      })
    }));
  };

  const removeDocument = (id: string) => {
    setDraft((current) => ({ ...current, documents: current.documents.filter((document) => document.id !== id) }));
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

      <section className="panel contractPanel">
        <h2><FileCheck2 /> Contract / Procurement Program</h2>
        <div className="contractSelectorGrid">
          <label className="field">
            <span>Contract Selection</span>
            <select value={draft.company.contractId} onChange={(event) => updateContract(event.target.value)}>
              {contractOptions.map((contract) => <option key={contract.id} value={contract.id}>{contract.label}</option>)}
            </select>
          </label>
          <div className={selectedContract.workflowType === 'contract-controlled' ? 'contractStatus controlled' : 'contractStatus'}>
            <strong>{selectedContract.workflowType === 'contract-controlled' ? 'Contract-Controlled Workflow' : 'Standard Workflow'}</strong>
            <span>{selectedContract.description}</span>
          </div>
        </div>
        {selectedContract.workflowType === 'contract-controlled' && (
          <div className="contractRulesSummary">
            <p><strong>Vehicle Rules</strong><span>{selectedContract.allowedChassisIds.length} chassis • {selectedContract.allowedWheelbaseIds.length || 'Any'} wheelbases • {selectedContract.allowedBusTypeIds.length} bus types</span></p>
            <p><strong>Seat Layout Rules</strong><span>{selectedContract.allowedSeatLayoutIds.length} approved seat layout templates</span></p>
            <p><strong>Required Documents</strong><span>{selectedContract.requiredDocumentTypes.join(', ')}</span></p>
          </div>
        )}
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
            <strong>{draft.company.pastQuoteOrOrderNumber || 'No reference selected'}</strong>
            <p>Ford • 158” WB DRW • 16 Passenger</p>
          </div>
          <button className="linkBtn" type="button" onClick={() => setShowReferenceDetails((current) => !current)}>{showReferenceDetails ? 'Hide details' : 'View details'} <ChevronRight size={16} /></button>
        </div>
        {showReferenceDetails && (
          <div className="referenceDetailsPanel">
            <p><strong>Reference Type</strong><span>{draft.company.referenceMode === 'pastOrder' ? 'Past quote / past order' : 'New quote request'}</span></p>
            <p><strong>Reference Number</strong><span>{draft.company.pastQuoteOrOrderNumber || 'Not provided'}</span></p>
            <p><strong>Reuse Intent</strong><span>Use this as context only. Micro Bird will validate current model, pricing, and availability.</span></p>
          </div>
        )}
      </section>

      <section className="panel">
        <h2><Upload /> Upload Documents</h2>
        <div className="uploadGrid">
          <div className="dropzone">
            <Upload />
            <strong>Upload Bid Document</strong>
            <span>For V2, document metadata is captured. File storage can connect later.</span>
            <button type="button" onClick={addDocument}><Plus size={16} /> Add Document Metadata</button>
          </div>
          <div className="fileList documentMetaList">
            {draft.documents.map((document) => (
              <div className="documentMetaRow" key={document.id}>
                <select value={document.documentType} onChange={(event) => updateDocument(document.id, { documentType: event.target.value as RfqDocument['documentType'] })}>
                  {documentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <input value={document.fileName} onChange={(event) => updateDocument(document.id, { fileName: event.target.value })} />
                <input value={document.fileSize} onChange={(event) => updateDocument(document.id, { fileSize: event.target.value })} />
                <button type="button" onClick={() => removeDocument(document.id)}><Trash2 size={15} /></button>
              </div>
            ))}
            {draft.documents.length === 0 && <FileRow name="No documents added" size="Optional" />}
            <small>Accepted file types: PDF, DOCX, XLSX, DWG, JPG, PNG, ZIP. Max file size: 25 MB per file.</small>
          </div>
        </div>
      </section>
    </div>
  );
}
