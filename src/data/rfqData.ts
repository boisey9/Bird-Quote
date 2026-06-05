import type { FeatureCategory } from '../types/rfq';

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
