export type RfqStep = 1 | 2 | 3 | 4;

export type Priority = 'MUST' | 'SHOULD' | 'COULD';

export interface CompanyInfo {
  dealerName: string;
  dealerContact: string;
  finalCustomerName: string;
  finalCustomerPhone: string;
  provinceState: string;
  additionalInfo: string;
  referenceMode: 'new' | 'pastOrder';
  pastQuoteOrOrderNumber: string;
}

export interface BusSpecs {
  chassis: string;
  wheelbase: string;
  busType: string;
  quantity: number;
  seatingCapacity: number;
  wheelchairCapacity: number;
}

export interface FeatureSelection {
  category: string;
  label: string;
  value: string;
}

export interface RfqDraft {
  company: CompanyInfo;
  specs: BusSpecs;
  features: FeatureSelection[];
  confirmedAccuracy: boolean;
  consentToContact: boolean;
}

export interface ChassisOption {
  id: string;
  name: string;
  description: string;
  badge: string;
}

export interface WheelbaseOption {
  id: string;
  name: string;
  description: string;
  commercialOnly?: boolean;
}

export interface BusTypeOption {
  id: string;
  name: string;
  description: string;
}

export interface FeatureCategory {
  id: string;
  name: string;
  options: FeatureSelection[];
}
