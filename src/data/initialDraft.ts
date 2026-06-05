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
  seatPackage: {
    layoutId: 'front-facing-2x2',
    material: 'Vinyl',
    color: 'Blue',
    estimatedPassengerSeats: 16,
    wheelchairPositions: 0
  },
  seatGroups: [
    {
      id: 'main-passenger-seats',
      name: 'Main Passenger Seats',
      quantity: 12,
      seatStyle: 'High Back Standard',
      restraintType: '3-Point',
      armrest: 'Aisle Side',
      grabType: 'Standard Grab',
      branding: 'Standard Micro Bird'
    },
    {
      id: 'foldaway-accessible-seats',
      name: 'Foldaway / Accessible Seats',
      quantity: 4,
      seatStyle: 'Foldaway Seat',
      restraintType: 'Integrated Child Seat',
      armrest: 'None',
      grabType: 'Wall Grab Rail',
      branding: 'No Branding'
    }
  ],
  features: featureCategories.flatMap((category) =>
    category.options.slice(0, category.id === 'seats' ? 4 : 2)
  ),
  confirmedAccuracy: true,
  consentToContact: true
};
