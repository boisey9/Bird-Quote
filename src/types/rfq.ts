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
}

export interface CertificationOption {
  id: string;
  chassisId: string;
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

export interface WheelbaseOption {
  id: string;
  chassisId: string;
  name: string;
  description: string;
  certificationScope: 'school_commercial' | 'commercial_only' | 'school_only';
  sortOrder: number;
  active: boolean;
}

export interface BusTypeOption {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
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

export interface SeatLayoutTemplate {
  id: string;
  title: string;
  description: string;
  maxSeats: number;
  layoutType: string;
  contractIds?: string[];
  market?: 'school' | 'commercial' | 'mfsab' | 'any';
  modelTypes?: string[];
  rearLiftCompatible?: boolean;
  maxWheelchairPositions?: number;
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
  zone: 'front' | 'mid' | 'rear' | 'curbside' | 'streetside';
  leftPositionType: SeatPositionType;
  rightPositionType: SeatPositionType;
  seatCountLeft: number;
  seatCountRight: number;
  allowedSeatStyles: string[];
  notes?: string;
}

export interface SeatCmsConfig {
  layouts: SeatLayoutTemplate[];
  rules: SeatLayoutRule[];
  rows: SeatLayoutRow[];
  seatTypes: string[];
  materials: string[];
  colors: string[];
  restraintTypes: string[];
  armrests: string[];
  grabTypes: string[];
  brandingOptions: string[];
}
