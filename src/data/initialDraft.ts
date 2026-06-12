import type { RfqDraft } from '../types/rfq';

export const initialDraft: RfqDraft = {
  company: {
    dealerName: '',
    dealerContact: '',
    finalCustomerName: '',
    finalCustomerPhone: '',
    provinceState: '',
    additionalInfo: '',
    contractId: 'none',
    contractWorkflowType: 'standard',
    referenceMode: 'new',
    pastQuoteOrOrderNumber: ''
  },
  specs: {
    chassis: 'ford',
    certification: 'ford-shuttle',
    wheelbase: 'ford-158-drw',
    busType: 'hotel',
    quantity: 1,
    seatingCapacity: 0,
    wheelchairCapacity: 0
  },
  seatPackage: {
    layoutId: '',
    material: 'Vinyl',
    color: 'Blue',
    estimatedPassengerSeats: 0,
    wheelchairPositions: 0
  },
  seatGroups: [],
  features: [],
  documents: [],
  confirmedAccuracy: true,
  consentToContact: true
};
