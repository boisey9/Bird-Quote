import { getContractById } from './contractConfig';
import type { BusSpecs, FeatureOptionCategory, FeatureOptionItem, SeatCmsConfig } from '../types/rfq';

export const featureOptionCategories: FeatureOptionCategory[] = [
  { id: 1, title: 'Layout', description: 'Customer-facing layout intent and floorplan reference.', sortOrder: 1, active: true, comments: 'Market segments and layout intent. Seats module is managed separately.' },
  { id: 17, title: 'Seats', description: 'Seat layout, material, color, and seat type requirements.', sortOrder: 2, active: true, comments: 'Critical CMS-managed module by model/wheelbase.' },
  { id: 9, title: 'Interior Features', description: 'Interior materials, grab rails, wall/ceiling finish, lighting, and flooring.', sortOrder: 3, active: true, comments: '' },
  { id: 7, title: 'Doors and Accessibility', description: 'Entry door, wheelchair lift/ramp, securement, handrails, and accessibility aids.', sortOrder: 4, active: true, comments: '' },
  { id: 2, title: 'Climate and Comfort', description: 'A/C, heating, defrost, comfort package, and passenger climate requirements.', sortOrder: 5, active: true, comments: '' },
  { id: 10, title: 'Safety Systems', description: 'Safety equipment, camera, emergency equipment, and driver visibility aids.', sortOrder: 6, active: true, comments: '' },
  { id: 11, title: 'Powertrain', description: 'Powertrain intent, fuel type, and drivetrain-related commercial requirements.', sortOrder: 7, active: true, comments: '' },
  { id: 12, title: 'Exterior and Branding', description: 'Exterior paint, decals, destination signs, graphics, and customer branding.', sortOrder: 8, active: true, comments: '' },
  { id: 18, title: 'Quote Response', description: 'Expected quote urgency and special bid response timing.', sortOrder: 9, active: true, comments: '' }
];

export const featureOptions: FeatureOptionItem[] = [
  { id: 101, categoryId: 2, title: 'A/C - Light Duty', description: 'Compact A/C system for basic cooling needs.', sortOrder: 1, active: true, imageExt: 'aclightduty.png' },
  { id: 102, categoryId: 2, title: 'A/C - Standard', description: 'Mid-capacity A/C with front or rear evaporator and condenser.', sortOrder: 2, active: true, imageExt: 'acstandard.png' },
  { id: 103, categoryId: 2, title: 'A/C - High Capacity', description: 'High-output A/C system for larger passenger volumes.', sortOrder: 3, active: true, imageExt: 'achighcapacity.png' },
  { id: 104, categoryId: 2, title: 'Heater - Rear', description: 'Rear heating package for passenger comfort.', sortOrder: 4, active: true, imageExt: 'heaterrear.png' },
  { id: 201, categoryId: 9, title: 'Altro Non-Slip Flooring', description: 'Durable non-slip flooring for commercial and accessible applications.', sortOrder: 1, active: true, imageExt: 'altro.png' },
  { id: 202, categoryId: 9, title: 'Grab Rails', description: 'Passenger grab rails and stanchion support.', sortOrder: 2, active: true, imageExt: 'grabrails.png' },
  { id: 203, categoryId: 9, title: 'Wall / Ceiling Finish', description: 'Interior finish selection for customer-facing quote intent.', sortOrder: 3, active: true, imageExt: 'wallfinish.png' },
  { id: 204, categoryId: 9, title: 'Interior LED Lighting', description: 'LED passenger-area lighting package.', sortOrder: 4, active: true, imageExt: 'ledinterior.png' },
  { id: 301, categoryId: 7, title: 'Wheelchair Lift / Ramp', description: 'Lift or ramp requirement for accessible vehicles.', sortOrder: 1, active: true, imageExt: 'lift.png' },
  { id: 302, categoryId: 7, title: 'Wheelchair Restraint', description: 'Wheelchair restraint system requirement.', sortOrder: 2, active: true, imageExt: 'restraint.png' },
  { id: 303, categoryId: 7, title: 'Entry Door', description: 'Entry door type and customer access preference.', sortOrder: 3, active: true, imageExt: 'entrydoor.png' },
  { id: 304, categoryId: 7, title: 'Handrails', description: 'Handrail finish and placement intent.', sortOrder: 4, active: true, imageExt: 'handrails.png' },
  { id: 401, categoryId: 10, title: 'Backup Camera', description: 'Rear-view camera package.', sortOrder: 1, active: true, imageExt: 'backupcamera.png' },
  { id: 402, categoryId: 10, title: 'Fire Extinguisher', description: 'Fire extinguisher requirement.', sortOrder: 2, active: true, imageExt: 'extinguisher.png' },
  { id: 403, categoryId: 10, title: 'First Aid Kit', description: 'First aid kit requirement.', sortOrder: 3, active: true, imageExt: 'firstaid.png' },
  { id: 501, categoryId: 11, title: 'Gasoline Powertrain', description: 'Standard gasoline powertrain intent.', sortOrder: 1, active: true, imageExt: 'gas.png' },
  { id: 502, categoryId: 11, title: 'Propane Prep / LPG', description: 'Propane or LPG-related powertrain interest.', sortOrder: 2, active: true, imageExt: 'lpg.png' },
  { id: 601, categoryId: 12, title: 'Exterior Color', description: 'Standard white or requested exterior color.', sortOrder: 1, active: true, imageExt: 'exteriorcolor.png' },
  { id: 602, categoryId: 12, title: 'Graphics / Decals', description: 'Graphics, decals, logo, or branding request.', sortOrder: 2, active: true, imageExt: 'decals.png' },
  { id: 603, categoryId: 12, title: 'Destination Signage', description: 'Destination sign or customer signage requirement.', sortOrder: 3, active: true, imageExt: 'signage.png' },
  { id: 701, categoryId: 18, title: 'Standard Quote Timing', description: 'Normal quote response timing.', sortOrder: 1, active: true, imageExt: '' },
  { id: 702, categoryId: 18, title: 'Bid / Urgent Response', description: 'Bid contract or urgent deadline request.', sortOrder: 2, active: true, imageExt: '' }
];

export const seatCmsConfig: SeatCmsConfig = {
  layouts: [
    { id: 'front-facing-2x2', title: '2x2 Front Facing', description: 'Standard paired seats with center aisle.', maxSeats: 24, layoutType: 'front_facing', market: 'commercial', rearLiftCompatible: true, maxWheelchairPositions: 2 },
    { id: 'front-facing-2x1', title: '2x1 Front Facing', description: 'Single seats with center aisle.', maxSeats: 18, layoutType: 'front_facing', market: 'commercial', rearLiftCompatible: true, maxWheelchairPositions: 2 },
    { id: 'perimeter', title: 'Perimeter Seating', description: 'Side-facing seating for shuttle use.', maxSeats: 18, layoutType: 'perimeter', market: 'commercial', rearLiftCompatible: false, maxWheelchairPositions: 0 },
    { id: 'rear-lounge', title: 'Rear Lounge', description: 'Lounge-style seating at the rear.', maxSeats: 16, layoutType: 'lounge', market: 'commercial', rearLiftCompatible: false, maxWheelchairPositions: 0 },
    { id: 'school-3x3', title: '3x3 School Seating', description: 'High-capacity school seating layout.', maxSeats: 36, layoutType: 'school', market: 'school', rearLiftCompatible: false, maxWheelchairPositions: 0 },
    { id: 'school-3x2', title: '3x2 School Seating', description: 'High-capacity school seating layout.', maxSeats: 30, layoutType: 'school', market: 'school', rearLiftCompatible: false, maxWheelchairPositions: 0 },
    { id: 'school-3x1', title: '3x1 School Seating', description: 'Traditional school seating layout.', maxSeats: 24, layoutType: 'school', market: 'school', rearLiftCompatible: false, maxWheelchairPositions: 0 },
    { id: 'school-2x2', title: '2x2 School Seating', description: 'School layout with paired seats.', maxSeats: 20, layoutType: 'school', market: 'school', rearLiftCompatible: false, maxWheelchairPositions: 0 },
    { id: 'wheelchair-foldaway', title: 'Wheelchair / Foldaway', description: 'Space for wheelchair or foldaway seats.', maxSeats: 16, layoutType: 'accessible', market: 'commercial', rearLiftCompatible: true, maxWheelchairPositions: 4 }
  ],
  rules: [
    { layoutId: 'front-facing-2x2', chassisIds: ['gm', 'ford', 'ford-transit'], busTypeIds: ['commercial', 'hotel', 'airport', 'church', 'commercial-special-needs', 'assisted-living'], wheelbaseIds: [] },
    { layoutId: 'front-facing-2x1', chassisIds: ['gm', 'ford', 'ford-transit'], busTypeIds: ['commercial', 'hotel', 'airport', 'church', 'commercial-special-needs', 'assisted-living'], wheelbaseIds: [] },
    { layoutId: 'perimeter', chassisIds: ['ford', 'ford-transit'], busTypeIds: ['commercial', 'hotel', 'airport'], wheelbaseIds: ['ford-158-drw', 'ford-176-drw', 'transit-156-drw'] },
    { layoutId: 'rear-lounge', chassisIds: ['ford'], busTypeIds: ['hotel', 'commercial'], wheelbaseIds: ['ford-158-drw', 'ford-176-drw'] },
    { layoutId: 'school-3x3', chassisIds: ['gm', 'ford', 'ford-transit'], busTypeIds: ['church', 'commercial'], wheelbaseIds: [] },
    { layoutId: 'school-3x2', chassisIds: ['gm', 'ford'], busTypeIds: ['church', 'commercial'], wheelbaseIds: [] },
    { layoutId: 'school-3x1', chassisIds: ['gm', 'ford'], busTypeIds: ['church', 'commercial'], wheelbaseIds: [] },
    { layoutId: 'school-2x2', chassisIds: ['gm', 'ford', 'ford-transit'], busTypeIds: ['church', 'commercial'], wheelbaseIds: [] },
    { layoutId: 'wheelchair-foldaway', chassisIds: ['gm', 'ford', 'ford-transit'], busTypeIds: ['commercial-special-needs', 'assisted-living', 'commercial', 'hotel'], wheelbaseIds: [] }
  ],
  rows: [
    { id: 'ff22-r1', layoutId: 'front-facing-2x2', rowNumber: 1, zone: 'front', leftPositionType: 'passenger-seat', rightPositionType: 'passenger-seat', seatCountLeft: 2, seatCountRight: 2, allowedSeatStyles: ['High Back Standard', 'High Back Premium'] },
    { id: 'ff22-r2', layoutId: 'front-facing-2x2', rowNumber: 2, zone: 'mid', leftPositionType: 'passenger-seat', rightPositionType: 'passenger-seat', seatCountLeft: 2, seatCountRight: 2, allowedSeatStyles: ['High Back Standard', 'High Back Premium'] },
    { id: 'ff22-r3', layoutId: 'front-facing-2x2', rowNumber: 3, zone: 'mid', leftPositionType: 'passenger-seat', rightPositionType: 'passenger-seat', seatCountLeft: 2, seatCountRight: 2, allowedSeatStyles: ['High Back Standard', 'High Back Premium'] },
    { id: 'ff22-r4', layoutId: 'front-facing-2x2', rowNumber: 4, zone: 'rear', leftPositionType: 'passenger-seat', rightPositionType: 'passenger-seat', seatCountLeft: 2, seatCountRight: 2, allowedSeatStyles: ['High Back Standard', 'Foldaway Seat'] },
    { id: 'ff21-r1', layoutId: 'front-facing-2x1', rowNumber: 1, zone: 'front', leftPositionType: 'passenger-seat', rightPositionType: 'empty', seatCountLeft: 2, seatCountRight: 0, allowedSeatStyles: ['High Back Standard'] },
    { id: 'ff21-r2', layoutId: 'front-facing-2x1', rowNumber: 2, zone: 'mid', leftPositionType: 'passenger-seat', rightPositionType: 'empty', seatCountLeft: 2, seatCountRight: 0, allowedSeatStyles: ['High Back Standard'] },
    { id: 'ff21-r3', layoutId: 'front-facing-2x1', rowNumber: 3, zone: 'rear', leftPositionType: 'passenger-seat', rightPositionType: 'wheelchair-space', seatCountLeft: 2, seatCountRight: 0, allowedSeatStyles: ['High Back Standard', 'Foldaway Seat'] },
    { id: 'per-r1', layoutId: 'perimeter', rowNumber: 1, zone: 'curbside', leftPositionType: 'perimeter-seat', rightPositionType: 'empty', seatCountLeft: 4, seatCountRight: 0, allowedSeatStyles: ['Perimeter / Lounge Seat'] },
    { id: 'per-r2', layoutId: 'perimeter', rowNumber: 2, zone: 'streetside', leftPositionType: 'empty', rightPositionType: 'perimeter-seat', seatCountLeft: 0, seatCountRight: 4, allowedSeatStyles: ['Perimeter / Lounge Seat'] },
    { id: 'lou-r1', layoutId: 'rear-lounge', rowNumber: 1, zone: 'rear', leftPositionType: 'lounge', rightPositionType: 'lounge', seatCountLeft: 3, seatCountRight: 3, allowedSeatStyles: ['Perimeter / Lounge Seat'] },
    { id: 'wc-r1', layoutId: 'wheelchair-foldaway', rowNumber: 1, zone: 'mid', leftPositionType: 'foldaway', rightPositionType: 'wheelchair-space', seatCountLeft: 2, seatCountRight: 0, allowedSeatStyles: ['Foldaway Seat'] },
    { id: 'wc-r2', layoutId: 'wheelchair-foldaway', rowNumber: 2, zone: 'rear', leftPositionType: 'foldaway', rightPositionType: 'wheelchair-space', seatCountLeft: 2, seatCountRight: 0, allowedSeatStyles: ['Foldaway Seat'] },
    { id: 'sch-r1', layoutId: 'school-3x2', rowNumber: 1, zone: 'front', leftPositionType: 'passenger-seat', rightPositionType: 'passenger-seat', seatCountLeft: 3, seatCountRight: 2, allowedSeatStyles: ['Low Back Standard', 'High Back Standard'] },
    { id: 'sch-r2', layoutId: 'school-3x2', rowNumber: 2, zone: 'mid', leftPositionType: 'passenger-seat', rightPositionType: 'passenger-seat', seatCountLeft: 3, seatCountRight: 2, allowedSeatStyles: ['Low Back Standard', 'High Back Standard'] },
    { id: 'sch-r3', layoutId: 'school-3x2', rowNumber: 3, zone: 'rear', leftPositionType: 'passenger-seat', rightPositionType: 'passenger-seat', seatCountLeft: 3, seatCountRight: 2, allowedSeatStyles: ['Low Back Standard', 'High Back Standard'] }
  ],
  seatTypes: ['High Back Standard', 'High Back Premium', 'Low Back Standard', 'Foldaway Seat', 'Perimeter / Lounge Seat'],
  materials: ['Vinyl', 'Cloth', 'Freedman Level 4 Vinyl'],
  colors: ['Black', 'Gray', 'Blue', 'Custom'],
  restraintTypes: ['None', 'Lap Belt', '3-Point', 'Integrated Child Seat'],
  armrests: ['None', 'Aisle Side', 'Wall Side', 'Both Sides'],
  grabTypes: ['None', 'Standard Grab', 'Wall Grab Rail', 'Seat Back Grab'],
  brandingOptions: ['No Branding', 'Standard Micro Bird', 'Customer Logo Patch', 'Custom Embroidery']
};

export function getVisibleFeatureCategories(specs: BusSpecs): FeatureOptionCategory[] {
  return featureOptionCategories
    .filter((category) => category.active)
    .filter((category) => {
      if (category.title === 'Powertrain' && specs.chassis === 'ford-transit') return false;
      if (category.title === 'Doors and Accessibility' && specs.wheelchairCapacity === 0 && specs.busType !== 'assisted-living' && specs.busType !== 'commercial-special-needs') return false;
      return true;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getAvailableFeatureOptions(categoryId: number, specs: BusSpecs): FeatureOptionItem[] {
  return featureOptions
    .filter((option) => option.active && option.categoryId === categoryId)
    .filter((option) => {
      if (option.title.includes('Lift') && specs.wheelchairCapacity === 0) return false;
      if (option.title.includes('Propane') && specs.chassis === 'ford-transit') return false;
      if (option.title.includes('High Capacity') && specs.seatingCapacity < 16) return false;
      return true;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getAvailableSeatLayouts(specs: BusSpecs, contractId = 'none') {
  const contract = getContractById(contractId);
  return seatCmsConfig.layouts.filter((layout) => {
    const rule = seatCmsConfig.rules.find((item) => item.layoutId === layout.id);
    if (!rule) return false;
    const chassisOk = rule.chassisIds.length === 0 || rule.chassisIds.includes(specs.chassis);
    const busTypeOk = rule.busTypeIds.length === 0 || rule.busTypeIds.includes(specs.busType);
    const wheelbaseOk = rule.wheelbaseIds.length === 0 || rule.wheelbaseIds.includes(specs.wheelbase);
    const certificationOk = !rule.certificationIds || rule.certificationIds.length === 0 || rule.certificationIds.includes(specs.certification);
    const contractOk = contract.workflowType === 'standard' || contract.allowedSeatLayoutIds.includes(layout.id);
    return chassisOk && busTypeOk && wheelbaseOk && certificationOk && contractOk;
  });
}

export function getSeatLayoutRows(layoutId: string) {
  return seatCmsConfig.rows.filter((row) => row.layoutId === layoutId).sort((a, b) => a.rowNumber - b.rowNumber);
}
