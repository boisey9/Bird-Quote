import { busSpecMatrixData } from '../data/busSpecMatrix';
import { seatCmsConfig } from '../data/featureOptionMatrix';
import type { RfqDraft } from '../types/rfq';

export type ValidationIssue = {
  section: string;
  message: string;
  severity: 'warning' | 'error';
};

export function getSelectedBusSpecLabels(draft: RfqDraft) {
  return {
    chassis: busSpecMatrixData.chassis.find((item) => item.id === draft.specs.chassis)?.name ?? draft.specs.chassis,
    certification: busSpecMatrixData.certifications.find((item) => item.id === draft.specs.certification)?.name ?? draft.specs.certification,
    wheelbase: busSpecMatrixData.wheelbases.find((item) => item.id === draft.specs.wheelbase)?.name ?? draft.specs.wheelbase,
    busType: busSpecMatrixData.busTypes.find((item) => item.id === draft.specs.busType)?.name ?? draft.specs.busType,
    seatLayout: seatCmsConfig.layouts.find((item) => item.id === draft.seatPackage.layoutId)?.title ?? draft.seatPackage.layoutId
  };
}

export function getDraftValidationIssues(draft: RfqDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const totalSeatGroupQty = draft.seatGroups.reduce((sum, group) => sum + group.quantity, 0);
  const selectedSeatLayout = seatCmsConfig.layouts.find((layout) => layout.id === draft.seatPackage.layoutId);

  if (!draft.company.dealerName.trim()) issues.push({ section: 'Company', message: 'Dealer name is required.', severity: 'error' });
  if (!draft.company.dealerContact.trim()) issues.push({ section: 'Company', message: 'Dealer contact is required.', severity: 'error' });
  if (!draft.company.finalCustomerName.trim()) issues.push({ section: 'Company', message: 'Final customer name is required.', severity: 'error' });
  if (!draft.company.provinceState.trim()) issues.push({ section: 'Company', message: 'Province or state is required.', severity: 'error' });
  if (!draft.specs.chassis) issues.push({ section: 'Bus Specifications', message: 'Chassis selection is required.', severity: 'error' });
  if (!draft.specs.wheelbase) issues.push({ section: 'Bus Specifications', message: 'Wheelbase selection is required.', severity: 'error' });
  if (!draft.specs.busType) issues.push({ section: 'Bus Specifications', message: 'Bus type selection is required.', severity: 'error' });
  if (draft.specs.quantity < 1) issues.push({ section: 'Bus Specifications', message: 'Quantity must be at least 1.', severity: 'error' });
  if (!draft.seatPackage.layoutId) issues.push({ section: 'Seats', message: 'Seat layout is required.', severity: 'error' });
  if (selectedSeatLayout && draft.seatPackage.estimatedPassengerSeats > selectedSeatLayout.maxSeats) {
    issues.push({ section: 'Seats', message: `Estimated passenger seats exceed the selected layout capacity hint of ${selectedSeatLayout.maxSeats}.`, severity: 'warning' });
  }
  if (totalSeatGroupQty !== draft.seatPackage.estimatedPassengerSeats) {
    issues.push({ section: 'Seats', message: `Seat type quantity total is ${totalSeatGroupQty}, but estimated passenger seats is ${draft.seatPackage.estimatedPassengerSeats}.`, severity: 'warning' });
  }
  if (draft.seatPackage.wheelchairPositions > draft.specs.wheelchairCapacity) {
    issues.push({ section: 'Seats', message: 'Wheelchair positions exceed the wheelchair capacity entered in bus specifications.', severity: 'warning' });
  }

  return issues;
}

export function buildRfqSubmissionPayload(draft: RfqDraft) {
  const labels = getSelectedBusSpecLabels(draft);

  return {
    rfqVersion: 'v2',
    source: 'bird-quote-web',
    generatedAt: new Date().toISOString(),
    company: draft.company,
    busSpecs: {
      ...draft.specs,
      labels
    },
    seats: {
      package: {
        ...draft.seatPackage,
        layoutLabel: labels.seatLayout
      },
      groups: draft.seatGroups,
      referenceOnly: true,
      validationMessage: 'Reference only - final seating layout will be reviewed and validated by Micro Bird.'
    },
    features: draft.features,
    review: {
      confirmedAccuracy: draft.confirmedAccuracy,
      consentToContact: draft.consentToContact,
      validationIssues: getDraftValidationIssues(draft)
    }
  };
}
