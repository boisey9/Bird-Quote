import type { BusTypeOption, ChassisOption, FeatureCategory, WheelbaseOption } from '../types/rfq';

export const chassisOptions: ChassisOption[] = [
  { id: 'gm', name: 'GM', description: 'General Motors chassis platform', badge: 'GM' },
  { id: 'ford', name: 'Ford', description: 'Ford chassis platform', badge: 'Ford' },
  { id: 'ford-transit', name: 'Ford Transit', description: 'Ford Transit chassis platform', badge: 'Ford' }
];

export const wheelbaseOptions: WheelbaseOption[] = [
  { id: '138-srw', name: '138” WB SRW', description: '138” Wheelbase — School & Commercial' },
  { id: '138-drw', name: '138” WB DRW', description: '138” Wheelbase DRW — School & Commercial' },
  { id: '158-drw', name: '158” WB DRW', description: '158” Wheelbase DRW — School & Commercial' },
  { id: '176-drw', name: '176” WB DRW', description: '176” Wheelbase DRW — Commercial only', commercialOnly: true }
];

export const busTypes: BusTypeOption[] = [
  { id: 'commercial-special-needs', name: 'Commercial Special Needs', description: 'Commercial bus equipped for special needs passenger transport.' },
  { id: 'commercial', name: 'Commercial Bus', description: 'Standard passenger transport for commercial use.' },
  { id: 'assisted-living', name: 'Assisted Living Special Needs', description: 'Accessible vehicles with low steps and safer boarding features.' },
  { id: 'airport', name: 'Airport & Off-Airport', description: 'Shuttle vehicles for passenger and luggage transfer.' },
  { id: 'hotel', name: 'Hotel, Casino & Resort', description: 'Comfortable shuttle vehicles for resorts and guest transfers.' },
  { id: 'church', name: 'Church & Community', description: 'Reliable vehicles for group transport and community activities.' }
];

export const featureCategories: FeatureCategory[] = [
  {
    id: 'seats',
    name: 'Seats',
    options: [
      { category: 'Seats', label: 'Seat Layout', value: 'Forward Facing' },
      { category: 'Seats', label: 'Seat Style', value: 'High Back Standard' },
      { category: 'Seats', label: 'Seat Material', value: 'Black Vinyl' },
      { category: 'Seats', label: 'Seat Belts', value: 'Included' }
    ]
  },
  {
    id: 'interior',
    name: 'Interior Features',
    options: [
      { category: 'Interior', label: 'Flooring', value: 'Altro Non-Slip' },
      { category: 'Interior', label: 'Grab Rails', value: 'Stainless Steel Polished' },
      { category: 'Interior', label: 'Wall / Ceiling', value: 'Light Gray FRP' },
      { category: 'Interior', label: 'Interior Lighting', value: 'LED White' }
    ]
  },
  {
    id: 'accessibility',
    name: 'Doors & Accessibility',
    options: [
      { category: 'Accessibility', label: 'Wheelchair Lift / Ramp', value: 'Braun VL' },
      { category: 'Accessibility', label: 'Entry Door', value: 'Outward Opening' },
      { category: 'Accessibility', label: 'Handrails', value: 'Yellow Powder Coated' },
      { category: 'Accessibility', label: 'Wheelchair Restraint', value: 'Q’Straint MAX 4-Point' }
    ]
  },
  {
    id: 'climate',
    name: 'Climate & Comfort',
    options: [
      { category: 'HVAC', label: 'Climate Package', value: 'Front A/C & Rear Heat' },
      { category: 'HVAC', label: 'Driver A/C', value: 'Included' },
      { category: 'HVAC', label: 'Heater', value: 'Rear' }
    ]
  },
  {
    id: 'safety',
    name: 'Safety Systems',
    options: [
      { category: 'Safety', label: 'Fire Extinguisher', value: 'Included' },
      { category: 'Safety', label: 'First Aid Kit', value: 'Included' },
      { category: 'Safety', label: 'Seat Belts', value: 'Included' }
    ]
  },
  {
    id: 'exterior',
    name: 'Exterior & Branding',
    options: [
      { category: 'Exterior', label: 'Exterior Color', value: 'White' },
      { category: 'Exterior', label: 'Graphics / Decals', value: 'None' },
      { category: 'Exterior', label: 'Branding', value: 'Micro Bird Standard' }
    ]
  }
];
