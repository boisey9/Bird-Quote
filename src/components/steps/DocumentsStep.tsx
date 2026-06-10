import { type Dispatch, type SetStateAction } from 'react';
import { AlertCircle, FileText, Plus, Trash2, Upload } from 'lucide-react';
import type { RfqDocument, RfqDraft } from '../../types/rfq';

type DocumentsStepProps = {
  draft: RfqDraft;
  setDraft: Dispatch<SetStateAction<RfqDraft>>;
};

const documentTypes: Array<{ value: RfqDocument['documentType']; label: string; description: string; required?: boolean }> = [
  { value: 'bid', label: 'Bid Package', description: 'Tender documents, bid forms, or procurement instructions.', required: true },
  { value: 'floorplan', label: 'Floorplan / Seating Reference', description: 'Any customer floorplan, sketch, or seating reference.', required: true },
  { value: 'spec-sheet', label: 'Customer Specification', description: 'Written specifications, compliance notes, or option lists.' },
  { value: 'supporting', label: 'Supporting Document', description: 'Dealer notes, emails, forms, or supplemental files.' },
  { value: 'site-photos', label: 'Images / References', description: 'Photos, reference images, or visual examples.' },
  { value: 'other', label: 'Other', description: 'Any other file relevant to the quote request.' }
];

function inferFileType(fileName: string) {
  const ext = fileName.split('.').pop()?.toUpperCase();
  return ext || 'FILE';
}

function createDocument(documentType: RfqDocument['documentType']): RfqDocument {
  const meta = documentTypes.find((type) => type.value === documentType);
  return {
    id: `doc-${Date.now()}-${documentType}`,
    fileName: `${meta?.label.replace(/\s|\//g, '_') ?? 'Document'}.pdf`,
    fileType: 'PDF',
    fileSize: '0 KB',
    documentType
  };
}

function formatDocumentType(type: RfqDocument['documentType']) {
  return documentTypes.find((item) => item.value === type)?.label ?? type;
}

export function DocumentsStep({ draft, setDraft }: DocumentsStepProps) {
  const addDocument = (documentType: RfqDocument['documentType'] = 'supporting') => {
    setDraft((current) => ({ ...current, documents: [...current.documents, createDocument(documentType)] }));
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

  const hasBidDocument = draft.documents.some((document) => document.documentType === 'bid');
  const hasFloorplanDocument = draft.documents.some((document) => document.documentType === 'floorplan');
  const shouldFlagBid = draft.company.contractWorkflowType === 'contract-controlled' && !hasBidDocument;
  const shouldFlagFloorplan = draft.seatPackage.layoutId && !hasFloorplanDocument;

  return (
    <div className="sectionStack documentsStepPage">
      <section className="panel compact documentsIntroPanel">
        <div className="featureSectionHeader dealerSectionHeader">
          <div>
            <h2>Documents & Attachments</h2>
            <p>Add the bid package, floorplan, customer specs, and any reference files needed for Micro Bird to quote accurately.</p>
          </div>
          <span className="pill">{draft.documents.length} document{draft.documents.length === 1 ? '' : 's'}</span>
        </div>
        <div className="infoBox documentStorageNote">
          For this V2 pass, the app captures document metadata. File storage can connect later without changing the RFQ flow.
        </div>
      </section>

      {(shouldFlagBid || shouldFlagFloorplan) && (
        <section className="panel documentWarningsPanel">
          <h2><AlertCircle /> Recommended before submit</h2>
          {shouldFlagBid && <p>Contract-controlled RFQs should include a bid package or procurement reference document.</p>}
          {shouldFlagFloorplan && <p>Seating requests should include a floorplan, sketch, or customer reference when available.</p>}
        </section>
      )}

      <section className="panel compact documentCategoryPanel">
        <h2><Upload /> Add Document Metadata</h2>
        <div className="documentTypeGrid">
          {documentTypes.map((type) => (
            <button type="button" className="documentTypeCard" key={type.value} onClick={() => addDocument(type.value)}>
              <FileText size={20} />
              <strong>{type.label}</strong>
              <small>{type.description}</small>
              {type.required && <span>Recommended</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="panel compact documentListPanel">
        <div className="documentListHeader">
          <div>
            <h2>Attached Document List</h2>
            <p>Review the document category, file name, and approximate file size before submitting.</p>
          </div>
          <button type="button" onClick={() => addDocument()}><Plus size={16} /> Add Other Document</button>
        </div>

        <div className="documentRows">
          {draft.documents.map((document) => (
            <article className="documentRowCard" key={document.id}>
              <div className="documentIcon"><FileText size={18} /></div>
              <label>
                <span>Document Type</span>
                <select value={document.documentType} onChange={(event) => updateDocument(document.id, { documentType: event.target.value as RfqDocument['documentType'] })}>
                  {documentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>
              <label>
                <span>File Name</span>
                <input value={document.fileName} onChange={(event) => updateDocument(document.id, { fileName: event.target.value })} />
              </label>
              <label>
                <span>Size</span>
                <input value={document.fileSize} onChange={(event) => updateDocument(document.id, { fileSize: event.target.value })} />
              </label>
              <button type="button" className="documentRemoveButton" onClick={() => removeDocument(document.id)}><Trash2 size={16} /></button>
            </article>
          ))}
        </div>

        {draft.documents.length === 0 && (
          <div className="emptyDocumentState">
            <Upload size={28} />
            <strong>No documents added yet</strong>
            <span>Use the cards above to add bid, floorplan, spec, or supporting document metadata.</span>
          </div>
        )}

        {draft.documents.length > 0 && (
          <div className="documentSummaryChips">
            {documentTypes.map((type) => {
              const count = draft.documents.filter((document) => document.documentType === type.value).length;
              if (!count) return null;
              return <span key={type.value}>{formatDocumentType(type.value)}: {count}</span>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
