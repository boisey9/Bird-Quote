export type ContractWorkflowType = 'standard' | 'contract-controlled';

export type ContractOption = {
  id: string;
  label: string;
  agency: string;
  description: string;
  workflowType: ContractWorkflowType;
  allowedChassisIds: string[];
  allowedWheelbaseIds: string[];
  allowedBusTypeIds: string[];
  allowedSeatLayoutIds: string[];
  requiredDocumentTypes: string[];
  adminNotes: string;
};

export const contractOptions: ContractOption[] = [
  {
    id: 'none',
    label: 'No Contract / Standard RFQ',
    agency: 'Standard',
    description: 'Standard dealer RFQ workflow. Vehicle model and seat layout choices follow normal matrix rules.',
    workflowType: 'standard',
    allowedChassisIds: [],
    allowedWheelbaseIds: [],
    allowedBusTypeIds: [],
    allowedSeatLayoutIds: [],
    requiredDocumentTypes: [],
    adminNotes: 'Default V2 workflow.'
  },
  {
    id: 'mndot',
    label: 'MnDOT',
    agency: 'Minnesota DOT',
    description: 'Contract-controlled RFQ. Admin rules control eligible models, wheelbases, seat layouts, and required documents.',
    workflowType: 'contract-controlled',
    allowedChassisIds: ['ford', 'gm'],
    allowedWheelbaseIds: ['ford-158-drw', 'ford-176-drw'],
    allowedBusTypeIds: ['commercial', 'commercial-special-needs', 'assisted-living'],
    allowedSeatLayoutIds: ['front-facing-2x2', 'front-facing-2x1', 'wheelchair-foldaway'],
    requiredDocumentTypes: ['bid', 'floorplan'],
    adminNotes: 'Use contract seating templates and accessibility rules when selected.'
  },
  {
    id: 'cdot',
    label: 'CDOT',
    agency: 'Colorado DOT',
    description: 'Contract-controlled RFQ for CDOT purchasing and quote response rules.',
    workflowType: 'contract-controlled',
    allowedChassisIds: ['ford', 'ford-transit'],
    allowedWheelbaseIds: ['ford-158-drw', 'ford-176-drw', 'transit-156-drw'],
    allowedBusTypeIds: ['commercial', 'hotel', 'airport'],
    allowedSeatLayoutIds: ['front-facing-2x2', 'front-facing-2x1', 'perimeter', 'rear-lounge'],
    requiredDocumentTypes: ['bid'],
    adminNotes: 'CDOT may use commercial shuttle templates and quote timing controls.'
  },
  {
    id: 'modot',
    label: 'MoDOT',
    agency: 'Missouri DOT',
    description: 'Contract-controlled RFQ for MoDOT purchasing requirements.',
    workflowType: 'contract-controlled',
    allowedChassisIds: ['ford', 'gm'],
    allowedWheelbaseIds: [],
    allowedBusTypeIds: ['commercial', 'church', 'commercial-special-needs'],
    allowedSeatLayoutIds: ['front-facing-2x2', 'school-2x2', 'school-3x2', 'wheelchair-foldaway'],
    requiredDocumentTypes: ['bid', 'spec-sheet'],
    adminNotes: 'MoDOT rules should control available model and seat layout templates.'
  }
];

export function getContractById(contractId: string) {
  return contractOptions.find((contract) => contract.id === contractId) ?? contractOptions[0];
}

export function getContractControlledLayoutIds(contractId: string) {
  const contract = getContractById(contractId);
  return contract.workflowType === 'contract-controlled' ? contract.allowedSeatLayoutIds : [];
}
