export type RfqStep = 1 | 2 | 3 | 4;

export type Priority = 'MUST' | 'SHOULD' | 'COULD';

export interface CompanyInfo {
  dealerName: string;
  dealerContact: string;
  finalCustomerName: string;
  finalCustomerPhone: string;
  provinceState: string;
  additionalInfo: string;
  contractId: string;
  contractWorkflowType: 'standard' | 'contract-controlled';
  referenceMode: 'new' | 'pastOrder';
  pastQuoteOrOrderNumber: string;
}

export interface BusSpecs {
  chassis: string;
  certification: string;
  wheelbase: string;
  busType: string;
  quantity: number;
  seatingCapacity: number;
  wheelchairCapacity: number;
}

export interface SeatPackage {
  layoutId: string;
  material: string;
  color: string;
  estimatedPassengerSeats: number;
  wheelchairPositions: number;
}

export interface SeatGroup {
  id: string;
  name: string;
  quantity: number;
  seatStyle: string;
  restraintType: string;
  armrest: string;
  grabType: string;
  branding: string;
}

export interface FeatureSelection {
  category: string;
  label: string;
  value: string;
}

export interface RfqDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  documentType: 'bid' | 'floorplan' | 'spec-sheet' | 'supporting' | 'site-photos' | 'other';
}

export interface RfqDraft {
  company: CompanyInfo;
  specs: BusSpecs;
  seatPackage: SeatPackage;
  seatGroups: SeatGroup[];
  features: FeatureSelection[];
  documents: RfqDocument[];
  confirmedAccuracy: boolean;
  consentToContact: boolean;
}

export interface ChassisOption {
  id: string;
  name: string;
  description: string;
  badge: string;
  sortOrder: number;
  active: boolean;
  imageUrl?: string;
}

export interface CertificationOption {
  id: string;
  chassisId: string;
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
  imageUrl?: string;
}

export interface WheelbaseOption {
  id: string;
  chassisId: string;
  name: string;
  description: string;
  certificationScope: 'school_commercial' | 'commercial_only' | 'school_only';
  sortOrder: number;
  active: boolean;
  imageUrl?: string;
}

export interface BusTypeOption {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
  imageUrl?: string;
}

export interface BusTypeCompatibility {
  chassisId: string;
  wheelbaseId: string;
  busTypeId: string;
}

export interface BusSpecMatrixData {
  chassis: ChassisOption[];
  certifications: CertificationOption[];
  wheelbases: WheelbaseOption[];
  busTypes: BusTypeOption[];
  compatibility: BusTypeCompatibility[];
}

export interface FeatureCategory {
  id: string;
  name: string;
  options: FeatureSelection[];
}

export interface FeatureOptionCategory {
  id: number;
  title: string;
  description: string;
  sortOrder: number;
  active: boolean;
  comments: string;
}

export interface FeatureOptionItem {
  id: number;
  categoryId: number;
  title: string;
  description: string;
  sortOrder: number;
  active: boolean;
  imageExt: string;
}

export type SeatShellType = 'standard' | 'rear_lift' | 'mid_door';

export type SeatLayoutZoneType = 'wheelchair' | 'lift-clearance' | 'door-clearance' | 'mid-door-clearance' | 'blocked' | 'storage' | 'driver-area' | 'aisle' | 'entry';

export interface SeatLayoutZone {
  id: string;
  layoutId: string;
  zoneType: SeatLayoutZoneType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isRequiredClearance: boolean;
  notes?: string;
}

export interface SeatShell {
  id: string;
  name: string;
  shellType: SeatShellType;
  imageKey: string;
  description: string;
  hasRearLift: boolean;
  hasMidDoor: boolean;
  doorPosition: 'front' | 'mid' | 'rear';
  defaultBlockedZones: SeatLayoutZone[];
  defaultReferenceZones: SeatLayoutZone[];
  isActive: boolean;
}

export interface SeatLayoutTemplate {
  id: string;
  title: string;
  description: string;
  shellId?: string;
  maxSeats: number;
  layoutType: string;
  layoutFamily?: string;
  contractIds?: string[];
  allowedContractIds?: string[];
  allowedChassisIds?: string[];
  allowedWheelbaseIds?: string[];
  allowedBusTypeIds?: string[];
  market?: 'school' | 'commercial' | 'mfsab' | 'any';
  modelTypes?: string[];
  rearLiftCompatible?: boolean;
  maxWheelchairPositions?: number;
  defaultCapacity?: number;
  defaultWheelchairPositions?: number;
}

export interface SeatLayoutRule {
  layoutId: string;
  chassisIds: string[];
  busTypeIds: string[];
  wheelbaseIds: string[];
  certificationIds?: string[];
  contractIds?: string[];
  modelTypes?: string[];
}

export type SeatPositionType = 'passenger-seat' | 'foldaway' | 'wheelchair-space' | 'empty' | 'aisle' | 'lounge' | 'perimeter-seat';

export interface SeatLayoutRow {
  id: string;
  layoutId: string;
  rowNumber: number;
  rowLabel?: string;
  zone: 'front' | 'mid' | 'rear' | 'curbside' | 'streetside';
  leftPositionType: SeatPositionType;
  rightPositionType: SeatPositionType;
  seatCountLeft: number;
  seatCountRight: number;
  allowedSeatStyles: string[];
}
