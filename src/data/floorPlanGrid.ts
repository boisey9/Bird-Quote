export type FloorPlanSide = 'curb' | 'street' | 'center' | 'full';
export type FloorPlanZoneType = 'seat' | 'wheelchair' | 'foldaway' | 'entrance' | 'mid-door' | 'rear-lift' | 'luggage' | 'aisle' | 'empty' | 'driver' | 'clearance';
export type FloorPlanStatus = 'draft' | 'active' | 'retired';

export interface FloorPlanMaster {
  floorPlanId: string;
  floorPlanName: string;
  market: 'school' | 'commercial' | 'mfsab' | 'any';
  shellType: 'standard' | 'rear_lift' | 'mid_door';
  entranceType: 'front' | 'mid' | 'front_mid';
  liftType: 'none' | 'rear' | 'side';
  rowCount: number;
  status: FloorPlanStatus;
  dealerVisible: boolean;
  capacityHint: number;
  wheelchairCapacityHint: number;
  notes: string;
}

export interface FloorPlanZone {
  floorPlanId: string;
  zoneId: string;
  side: FloorPlanSide;
  rowStart: number;
  rowEnd: number;
  zoneType: FloorPlanZoneType;
  seatTypeId?: string;
  label: string;
  locked: boolean;
  notes?: string;
}

export interface FloorPlanSeatType {
  seatTypeId: string;
  seatTypeName: string;
  category: 'passenger' | 'school' | 'accessible' | 'lounge' | 'storage' | 'clearance';
  colorToken: string;
  defaultWidth: number;
  defaultRowSpan: number;
}

export interface FloorPlanCompatibilityRule {
  floorPlanId: string;
  contractId: string;
  chassis: string;
  wheelbase: string;
  certification: string;
  busType: string;
  allowed: boolean;
}

export const floorPlanMaster: FloorPlanMaster[] = [
  { floorPlanId: 'fp-commercial-2x2-standard', floorPlanName: 'Commercial 2x2 Standard Grid', market: 'commercial', shellType: 'standard', entranceType: 'front', liftType: 'none', rowCount: 8, status: 'active', dealerVisible: true, capacityHint: 24, wheelchairCapacityHint: 0, notes: 'Baseline front-facing commercial layout. Dealer-facing preview remains reference only.' },
  { floorPlanId: 'fp-accessible-rear-lift', floorPlanName: 'Accessible Rear Lift Grid', market: 'commercial', shellType: 'rear_lift', entranceType: 'front', liftType: 'rear', rowCount: 9, status: 'active', dealerVisible: true, capacityHint: 16, wheelchairCapacityHint: 2, notes: 'Uses row-span zones for lift clearance and wheelchair positions.' },
  { floorPlanId: 'fp-shuttle-mid-door', floorPlanName: 'Shuttle Mid-Door Grid', market: 'commercial', shellType: 'mid_door', entranceType: 'front_mid', liftType: 'none', rowCount: 8, status: 'draft', dealerVisible: false, capacityHint: 18, wheelchairCapacityHint: 0, notes: 'Prepared for shuttle/customer transport layouts with a mid-door clearance block.' },
  { floorPlanId: 'fp-school-3x2', floorPlanName: 'School 3x2 Grid', market: 'school', shellType: 'standard', entranceType: 'front', liftType: 'none', rowCount: 7, status: 'active', dealerVisible: true, capacityHint: 35, wheelchairCapacityHint: 0, notes: 'School-capacity intake template for reference selection only.' }
];

export const floorPlanZones: FloorPlanZone[] = [
  { floorPlanId: 'fp-commercial-2x2-standard', zoneId: 'std-entry', side: 'curb', rowStart: 1, rowEnd: 1, zoneType: 'entrance', label: 'Entrance', locked: true },
  { floorPlanId: 'fp-commercial-2x2-standard', zoneId: 'std-driver', side: 'street', rowStart: 1, rowEnd: 1, zoneType: 'driver', label: 'Driver', locked: true },
  { floorPlanId: 'fp-commercial-2x2-standard', zoneId: 'std-c2', side: 'curb', rowStart: 2, rowEnd: 7, zoneType: 'seat', seatTypeId: 'commercial-high-back', label: '2 seats', locked: false },
  { floorPlanId: 'fp-commercial-2x2-standard', zoneId: 'std-s2', side: 'street', rowStart: 2, rowEnd: 7, zoneType: 'seat', seatTypeId: 'commercial-high-back', label: '2 seats', locked: false },
  { floorPlanId: 'fp-commercial-2x2-standard', zoneId: 'std-rear', side: 'full', rowStart: 8, rowEnd: 8, zoneType: 'clearance', label: 'Rear', locked: true },

  { floorPlanId: 'fp-accessible-rear-lift', zoneId: 'arl-entry', side: 'curb', rowStart: 1, rowEnd: 1, zoneType: 'entrance', label: 'Entrance', locked: true },
  { floorPlanId: 'fp-accessible-rear-lift', zoneId: 'arl-driver', side: 'street', rowStart: 1, rowEnd: 1, zoneType: 'driver', label: 'Driver', locked: true },
  { floorPlanId: 'fp-accessible-rear-lift', zoneId: 'arl-c2', side: 'curb', rowStart: 2, rowEnd: 5, zoneType: 'seat', seatTypeId: 'commercial-high-back', label: '2 seats', locked: false },
  { floorPlanId: 'fp-accessible-rear-lift', zoneId: 'arl-s2', side: 'street', rowStart: 2, rowEnd: 4, zoneType: 'seat', seatTypeId: 'commercial-high-back', label: '2 seats', locked: false },
  { floorPlanId: 'fp-accessible-rear-lift', zoneId: 'arl-fold', side: 'curb', rowStart: 6, rowEnd: 6, zoneType: 'foldaway', seatTypeId: 'foldaway', label: 'Foldaway', locked: false },
  { floorPlanId: 'fp-accessible-rear-lift', zoneId: 'arl-wc1', side: 'street', rowStart: 6, rowEnd: 7, zoneType: 'wheelchair', seatTypeId: 'wheelchair-space', label: 'W/C 1', locked: true, notes: 'Two-row span wheelchair position.' },
  { floorPlanId: 'fp-accessible-rear-lift', zoneId: 'arl-lift', side: 'curb', rowStart: 8, rowEnd: 9, zoneType: 'rear-lift', label: 'Lift', locked: true, notes: 'Rear lift clearance, row-span locked.' },
  { floorPlanId: 'fp-accessible-rear-lift', zoneId: 'arl-wc2', side: 'street', rowStart: 8, rowEnd: 9, zoneType: 'wheelchair', seatTypeId: 'wheelchair-space', label: 'W/C 2', locked: true },

  { floorPlanId: 'fp-shuttle-mid-door', zoneId: 'mid-entry', side: 'curb', rowStart: 1, rowEnd: 1, zoneType: 'entrance', label: 'Entrance', locked: true },
  { floorPlanId: 'fp-shuttle-mid-door', zoneId: 'mid-driver', side: 'street', rowStart: 1, rowEnd: 1, zoneType: 'driver', label: 'Driver', locked: true },
  { floorPlanId: 'fp-shuttle-mid-door', zoneId: 'mid-luggage', side: 'street', rowStart: 2, rowEnd: 4, zoneType: 'luggage', seatTypeId: 'luggage-rack', label: 'Luggage', locked: false },
  { floorPlanId: 'fp-shuttle-mid-door', zoneId: 'mid-door', side: 'curb', rowStart: 5, rowEnd: 6, zoneType: 'mid-door', label: 'Mid Door', locked: true },
  { floorPlanId: 'fp-shuttle-mid-door', zoneId: 'mid-street-seat', side: 'street', rowStart: 5, rowEnd: 7, zoneType: 'seat', seatTypeId: 'commercial-high-back', label: '2 seats', locked: false },

  { floorPlanId: 'fp-school-3x2', zoneId: 'sch-entry', side: 'curb', rowStart: 1, rowEnd: 1, zoneType: 'entrance', label: 'Entrance', locked: true },
  { floorPlanId: 'fp-school-3x2', zoneId: 'sch-driver', side: 'street', rowStart: 1, rowEnd: 1, zoneType: 'driver', label: 'Driver', locked: true },
  { floorPlanId: 'fp-school-3x2', zoneId: 'sch-c3', side: 'curb', rowStart: 2, rowEnd: 7, zoneType: 'seat', seatTypeId: 'school-bench-3', label: '3 school', locked: false },
  { floorPlanId: 'fp-school-3x2', zoneId: 'sch-s2', side: 'street', rowStart: 2, rowEnd: 7, zoneType: 'seat', seatTypeId: 'school-bench-2', label: '2 school', locked: false }
];

export const floorPlanSeatTypes: FloorPlanSeatType[] = [
  { seatTypeId: 'commercial-high-back', seatTypeName: 'Commercial High Back', category: 'passenger', colorToken: 'blue', defaultWidth: 2, defaultRowSpan: 1 },
  { seatTypeId: 'school-bench-3', seatTypeName: 'School Bench - 3 Passenger', category: 'school', colorToken: 'yellow', defaultWidth: 3, defaultRowSpan: 1 },
  { seatTypeId: 'school-bench-2', seatTypeName: 'School Bench - 2 Passenger', category: 'school', colorToken: 'yellow', defaultWidth: 2, defaultRowSpan: 1 },
  { seatTypeId: 'foldaway', seatTypeName: 'Foldaway Seat', category: 'accessible', colorToken: 'green', defaultWidth: 2, defaultRowSpan: 1 },
  { seatTypeId: 'wheelchair-space', seatTypeName: 'Wheelchair Space', category: 'accessible', colorToken: 'purple', defaultWidth: 1, defaultRowSpan: 2 },
  { seatTypeId: 'luggage-rack', seatTypeName: 'Luggage Rack', category: 'storage', colorToken: 'gray', defaultWidth: 1, defaultRowSpan: 3 }
];

export const floorPlanCompatibilityRules: FloorPlanCompatibilityRule[] = [
  { floorPlanId: 'fp-commercial-2x2-standard', contractId: 'none', chassis: 'ford', wheelbase: 'ford-158-drw', certification: 'commercial', busType: 'commercial', allowed: true },
  { floorPlanId: 'fp-commercial-2x2-standard', contractId: 'none', chassis: 'gm', wheelbase: 'gm-159', certification: 'commercial', busType: 'commercial', allowed: true },
  { floorPlanId: 'fp-accessible-rear-lift', contractId: 'none', chassis: 'ford', wheelbase: 'ford-176-drw', certification: 'commercial', busType: 'commercial-special-needs', allowed: true },
  { floorPlanId: 'fp-accessible-rear-lift', contractId: 'none', chassis: 'gm', wheelbase: 'gm-159', certification: 'commercial', busType: 'assisted-living', allowed: true },
  { floorPlanId: 'fp-shuttle-mid-door', contractId: 'none', chassis: 'ford-transit', wheelbase: 'transit-156-drw', certification: 'commercial', busType: 'airport', allowed: true },
  { floorPlanId: 'fp-school-3x2', contractId: 'none', chassis: 'ford', wheelbase: 'ford-158-drw', certification: 'school', busType: 'commercial', allowed: true }
];

export function getFloorPlanZones(floorPlanId: string) {
  return floorPlanZones.filter((zone) => zone.floorPlanId === floorPlanId).sort((a, b) => a.rowStart - b.rowStart || a.side.localeCompare(b.side));
}

export function getFloorPlanSeatTypeName(seatTypeId?: string) {
  if (!seatTypeId) return 'N/A';
  return floorPlanSeatTypes.find((seatType) => seatType.seatTypeId === seatTypeId)?.seatTypeName ?? seatTypeId;
}
