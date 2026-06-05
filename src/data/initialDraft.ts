import { featureCategories } from './rfqData';
import type { RfqDraft } from '../types/rfq';

export const initialDraft: RfqDraft = {
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
    certification: 'ford-shuttle',
    wheelbase: 'ford-158-drw',
    busType: 'hotel',
    quantity: 1,
    seatingCapacity: 16,
    wheelchairCapacity: 1
  },
  features: featureCategories.flatMap((category) =>
    category.options.slice(0, category.id === 'seats' ? 4 : 2)
  ),
  confirmedAccuracy: true,
  consentToContact: true
};
