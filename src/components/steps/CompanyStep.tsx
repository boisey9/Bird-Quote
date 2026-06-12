import { useState, type Dispatch, type SetStateAction } from 'react';
import { ChevronRight, ClipboardList, FileCheck2, User } from 'lucide-react';
import { getContractById } from '../../data/contractConfig';
import { useActiveContractPrograms } from '../../hooks/useContractPrograms';
import { Input } from '../FormControls';
import type { RfqDraft } from '../../types/rfq';

type CompanyStepProps = {
  draft: RfqDraft;
  setDraft: Dispatch<SetStateAction<RfqDraft>>;
};

export function CompanyStep({ draft, setDraft }: CompanyStepProps) {
  const [showReferenceDetails, setShowReferenceDetails] = useState(false);
  const contractCms = useActiveContractPrograms();
  const contractOptions = contractCms.contracts;
  const selectedContract = contractOptions.find((contract) => contract.id === draft.company.contractId) ?? getContractById(draft.company.contractId);

  const update = (key: keyof RfqDraft['company'], value: string) => {
    setDraft((current) => ({ ...current, company: { ...current.company, [key]: value } }));
  };

  const updateContract = (contractId: string) => {
    const contract = contractOptions.find((item) => item.id === contractId) ?? getContractById(contractId);
    setDraft((current) => ({
      ...current,
      company: {
        ...current.company,
        contractId: contract.id,
        contractWorkflowType: contract.workflowType
      }
    }));
  };

  return (
    <div className="sectionStack">
      <section className="panel">
        <h2><User /> Dealer / Customer Information</h2>
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
            <p>Ford • 158 WB DRW • 16 Passenger</p>
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
    </div>
  );
}
