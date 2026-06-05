import type { BusSpecMatrixData } from '../types/rfq';

export const busSpecMatrixData: BusSpecMatrixData = {
  chassis: [
    { id: 'gm', name: 'GM', description: 'General Motors chassis platform', badge: 'GM', sortOrder: 10, active: true },
    { id: 'ford', name: 'Ford', description: 'Ford chassis platform', badge: 'Ford', sortOrder: 20, active: true },
    { id: 'ford-transit', name: 'Ford Transit', description: 'Ford Transit chassis platform', badge: 'Ford', sortOrder: 30, active: true }
  ],
  certifications: [
    { id: 'gm-school', chassisId: 'gm', name: 'School Bus Package', description: 'Package to build a School Bus, MFSAB & MPV.', sortOrder: 10, active: true },
    { id: 'gm-shuttle', chassisId: 'gm', name: 'Shuttle Bus Package', description: 'Package to build a commercial vehicle.', sortOrder: 20, active: true },
    { id: 'ford-school', chassisId: 'ford', name: 'School Bus Package', description: 'Package to build a School Bus.', sortOrder: 10, active: true },
    { id: 'ford-mfsab', chassisId: 'ford', name: 'MFSAB Package', description: 'Package to build a Multi-Function School Activity Bus.', sortOrder: 20, active: true },
    { id: 'ford-shuttle', chassisId: 'ford', name: 'Shuttle Bus Package', description: 'Package to build a commercial vehicle.', sortOrder: 30, active: true },
    { id: 'transit-school', chassisId: 'ford-transit', name: 'School Bus Package', description: 'Package to build a School Bus.', sortOrder: 10, active: true },
    { id: 'transit-mfsab', chassisId: 'ford-transit', name: 'MFSAB Package', description: 'Package to build a Multi-Function School Activity Bus.', sortOrder: 20, active: true },
    { id: 'transit-shuttle', chassisId: 'ford-transit', name: 'Shuttle Bus Package', description: 'Package to build a commercial vehicle.', sortOrder: 30, active: true }
  ],
  wheelbases: [
    { id: 'gm-139-drw', chassisId: 'gm', name: '139 in WB DRW', description: '139 in Wheelbase DRW - School and Commercial', certificationScope: 'school_commercial', sortOrder: 10, active: true },
    { id: 'gm-159-drw', chassisId: 'gm', name: '159 in WB DRW', description: '159 in Wheelbase DRW - School and Commercial', certificationScope: 'school_commercial', sortOrder: 20, active: true },
    { id: 'ford-138-srw', chassisId: 'ford', name: '138 in WB SRW', description: '138 in Wheelbase SRW - School and Commercial', certificationScope: 'school_commercial', sortOrder: 10, active: true },
    { id: 'ford-138-drw', chassisId: 'ford', name: '138 in WB DRW', description: '138 in Wheelbase DRW - School and Commercial', certificationScope: 'school_commercial', sortOrder: 20, active: true },
    { id: 'ford-158-drw', chassisId: 'ford', name: '158 in WB DRW', description: '158 in Wheelbase DRW - School and Commercial', certificationScope: 'school_commercial', sortOrder: 30, active: true },
    { id: 'ford-176-drw', chassisId: 'ford', name: '176 in WB DRW', description: '176 in Wheelbase DRW - Commercial only', certificationScope: 'commercial_only', sortOrder: 40, active: true },
    { id: 'ford-190-drw', chassisId: 'ford', name: '190 in WB DRW', description: '190 in Wheelbase DRW - Extended commercial configuration', certificationScope: 'commercial_only', sortOrder: 50, active: true },
    { id: 'ford-216-drw', chassisId: 'ford', name: '216 in WB DRW', description: '216 in Wheelbase DRW - Extended commercial configuration', certificationScope: 'commercial_only', sortOrder: 60, active: true },
    { id: 'transit-138-srw', chassisId: 'ford-transit', name: '138 in WB SRW', description: '138 in Wheelbase SRW - School and MFSAB', certificationScope: 'school_commercial', sortOrder: 10, active: true },
    { id: 'transit-156-srw', chassisId: 'ford-transit', name: '156 in WB SRW', description: '156 in Wheelbase SRW', certificationScope: 'school_commercial', sortOrder: 20, active: true },
    { id: 'transit-156-drw', chassisId: 'ford-transit', name: '156 in WB DRW', description: '156 in Wheelbase DRW', certificationScope: 'school_commercial', sortOrder: 30, active: true }
  ],
  busTypes: [
    { id: 'commercial-special-needs', name: 'Commercial Special Needs', description: 'Commercial bus equipped for special needs passenger transport.', sortOrder: 10, active: true },
    { id: 'commercial', name: 'Commercial Bus', description: 'Standard passenger transport for commercial use.', sortOrder: 20, active: true },
    { id: 'assisted-living', name: 'Assisted Living Special Needs', description: 'Accessible vehicles with low steps and safer boarding features.', sortOrder: 30, active: true },
    { id: 'airport', name: 'Airport and Off-Airport', description: 'Shuttle vehicles for passenger and luggage transfer.', sortOrder: 40, active: true },
    { id: 'hotel', name: 'Hotel, Casino and Resort', description: 'Comfortable shuttle vehicles for resorts and guest transfers.', sortOrder: 50, active: true },
    { id: 'church', name: 'Church and Community', description: 'Reliable vehicles for group transport and community activities.', sortOrder: 60, active: true }
  ],
  compatibility: [
    { chassisId: 'gm', wheelbaseId: 'gm-139-drw', busTypeId: 'commercial' },
    { chassisId: 'gm', wheelbaseId: 'gm-139-drw', busTypeId: 'commercial-special-needs' },
    { chassisId: 'gm', wheelbaseId: 'gm-159-drw', busTypeId: 'commercial' },
    { chassisId: 'gm', wheelbaseId: 'gm-159-drw', busTypeId: 'commercial-special-needs' },
    { chassisId: 'gm', wheelbaseId: 'gm-159-drw', busTypeId: 'assisted-living' },
    { chassisId: 'ford', wheelbaseId: 'ford-138-srw', busTypeId: 'commercial' },
    { chassisId: 'ford', wheelbaseId: 'ford-138-drw', busTypeId: 'commercial' },
    { chassisId: 'ford', wheelbaseId: 'ford-158-drw', busTypeId: 'commercial-special-needs' },
    { chassisId: 'ford', wheelbaseId: 'ford-158-drw', busTypeId: 'commercial' },
    { chassisId: 'ford', wheelbaseId: 'ford-158-drw', busTypeId: 'assisted-living' },
    { chassisId: 'ford', wheelbaseId: 'ford-158-drw', busTypeId: 'airport' },
    { chassisId: 'ford', wheelbaseId: 'ford-158-drw', busTypeId: 'hotel' },
    { chassisId: 'ford', wheelbaseId: 'ford-158-drw', busTypeId: 'church' },
    { chassisId: 'ford', wheelbaseId: 'ford-176-drw', busTypeId: 'commercial' },
    { chassisId: 'ford', wheelbaseId: 'ford-176-drw', busTypeId: 'airport' },
    { chassisId: 'ford', wheelbaseId: 'ford-190-drw', busTypeId: 'commercial' },
    { chassisId: 'ford', wheelbaseId: 'ford-216-drw', busTypeId: 'commercial' },
    { chassisId: 'ford-transit', wheelbaseId: 'transit-138-srw', busTypeId: 'commercial' },
    { chassisId: 'ford-transit', wheelbaseId: 'transit-156-srw', busTypeId: 'commercial' },
    { chassisId: 'ford-transit', wheelbaseId: 'transit-156-drw', busTypeId: 'commercial' },
    { chassisId: 'ford-transit', wheelbaseId: 'transit-156-drw', busTypeId: 'airport' }
  ]
};
