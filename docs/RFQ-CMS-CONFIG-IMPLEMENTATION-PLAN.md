# RFQ CMS Config Implementation Plan

## Objective

Finalize the RFQ App Admin Config area into a true CMS management layer where admins can create, edit, delete, activate, retire, and validate all customer-facing RFQ configuration.

The Config tab must become the source of truth for:

1. Contract Program Management
2. Vehicle / Chassis Matrix Management
3. Features & Options Management
4. Floorplan Management
5. Routing Rules & SLA Rules
6. Roles & Permissions

The implementation must preserve the current RFQ customer flow while replacing static config files with backend-managed records in safe phases.

---

## Current State

### Already started

- Admin Config is split into CMS-style pages.
- Floorplan Management has a working backend editor using `/api/cms-floor-plans`.
- Floorplan rules already support contract, chassis, wheelbase, certification, bus type, and allowed flag.
- Customer-facing Seats step can read active dealer-visible floorplan grids.
- Static data still exists for contracts, vehicle matrix, feature options, seat option lists, routing rules, SLA rules, and roles.

### Main gap

Most Config pages are currently display-only or placeholder sections. They need backend CRUD, validation, and runtime integration.

---

## Target Architecture

### Backend pattern

Use the same pattern as the existing floorplan CMS endpoint.

Each config domain should have:

- Neon tables
- Seed fallback from existing static files
- GET endpoint
- PUT endpoint or granular CRUD endpoints
- Admin editor component
- Runtime hook/helper that reads from backend and falls back safely
- Validation before save
- Active / inactive / retired status
- Sort order where customer-facing order matters
- Contract-rule linkage where needed

### Recommended API structure

```txt
/api/cms-contracts
/api/cms-vehicle-matrix
/api/cms-feature-options
/api/cms-floor-plans          existing
/api/cms-seat-option-lists
/api/cms-routing-rules
/api/cms-roles-permissions
```

For the first production pass, use GET + PUT full-payload endpoints like Floorplan Management. After stability, we can split into granular POST/PATCH/DELETE endpoints if needed.

---

## Shared Data Rules

All CMS records should include these common fields where applicable:

```ts
id: string
name/title/label: string
description?: string
active: boolean
status: 'draft' | 'active' | 'inactive' | 'retired'
sortOrder?: number
createdAt?: string
updatedAt?: string
updatedBy?: string
notes?: string
```

Important behavior:

- `draft` = admin-created but not customer visible.
- `active` = customer/runtime eligible.
- `inactive` = hidden but reusable.
- `retired` = hidden and protected from normal reactivation without warning.
- Delete should be soft delete where a record has dependent rules or submitted RFQs.

---

# Phase 1 — CMS Foundation Hardening

## Goal

Create reusable CMS patterns before building every tab.

## Tasks

### 1. Create shared CMS utilities

Create:

```txt
src/utils/cmsApi.ts
src/utils/cmsValidation.ts
src/types/cms.ts
```

Functions:

```ts
parseCmsResponse(response)
normalizeCmsStatus(record)
validateUniqueIds(records)
validateRequiredFields(records, fields)
softDeleteRecord(records, id)
reorderRecords(records)
```

### 2. Create shared admin components

Create:

```txt
src/components/admin/CmsToolbar.tsx
src/components/admin/CmsStatusBadge.tsx
src/components/admin/CmsEditableTable.tsx
src/components/admin/CmsRuleTable.tsx
src/components/admin/CmsDeleteConfirm.tsx
src/components/admin/CmsSaveStatus.tsx
```

Common UI behavior:

- New
- Duplicate
- Delete / Retire
- Save
- Reload
- Export JSON
- Active / inactive status badges
- Unsaved changes indicator
- Validation summary

### 3. Add backend table creation helpers

Each endpoint should auto-create its tables if missing, like the floorplan endpoint.

Use a consistent helper structure:

```ts
ensureCmsTables()
readCmsConfig()
writeCmsConfig(payload)
seedFromStaticConfig()
```

## Acceptance criteria

- Shared components compile.
- Floorplan editor can continue working unchanged or progressively migrated to shared components.
- All new endpoints follow the same response pattern:

```ts
{
  ok: true,
  source: 'neon' | 'empty-neon' | 'seed-fallback',
  counts: {...},
  data: {...}
}
```

---

# Phase 2 — Contract Program Management

## Goal

Make Contract Programs fully manageable from the Config tab.

## Tables

```sql
cms_contract_programs
cms_contract_required_documents
cms_contract_rule_index
```

### cms_contract_programs

Fields:

```txt
contract_id primary key
label
agency
description
workflow_type
active
status
sort_order
notes
created_at
updated_at
```

### cms_contract_required_documents

Fields:

```txt
id primary key
contract_id
document_type
required boolean
recommended boolean
sort_order
active
```

### cms_contract_rule_index

Purpose: show which rule groups exist for each contract.

Fields:

```txt
id primary key
contract_id
rule_area vehicle | feature | floorplan | document | routing | approval
summary
active
```

## Admin UI

Contract Program Management should support:

- Create contract
- Edit contract
- Duplicate contract
- Delete/retire contract
- Manage required documents
- See linked rule coverage
- Show warnings when deleting a contract used by vehicle, feature, or floorplan rules

## Runtime integration

Replace static `contractOptions` usage with CMS hook:

```txt
src/hooks/useContractPrograms.ts
```

Fallback to static `contractConfig.ts` if backend unavailable.

## Contract key validation

Contract keys must be:

- lowercase preferred
- no spaces
- stable once used by RFQ submissions
- unique across active and retired records

## Acceptance criteria

- Admin can create a contract key.
- Contract appears in the customer Request Info contract dropdown.
- Contract key appears in Floorplan compatibility rules dropdown.
- Contract can control future vehicle and feature rules.
- Deleting/retiring a contract does not break existing saved RFQs.

---

# Phase 3 — Vehicle / Chassis Matrix Management

## Goal

Make the bus selection matrix fully managed through Admin Config.

## Tables

```sql
cms_vehicle_chassis
cms_vehicle_certifications
cms_vehicle_wheelbases
cms_vehicle_bus_types
cms_vehicle_contract_rules
```

### cms_vehicle_chassis

Fields:

```txt
chassis_id primary key
name
description
active
status
sort_order
```

### cms_vehicle_certifications

Fields:

```txt
certification_id primary key
chassis_id nullable
name
description
active
status
sort_order
```

### cms_vehicle_wheelbases

Fields:

```txt
wheelbase_id primary key
chassis_id
name
description
active
status
sort_order
```

### cms_vehicle_bus_types

Fields:

```txt
bus_type_id primary key
name
description
market commercial | school | mfsab | any
active
status
sort_order
```

### cms_vehicle_contract_rules

Fields:

```txt
id primary key
contract_id
chassis_id any | specific
certification_id any | specific
wheelbase_id any | specific
bus_type_id any | specific
allowed boolean
required boolean default false
notes
active
```

## Admin UI

Vehicle / Chassis Matrix Management should support:

- Chassis tab/table
- Certifications tab/table
- Wheelbases tab/table
- Bus Types tab/table
- Contract Rules table

Contract Rules editor dropdowns:

- Contract
- Chassis
- Certification filtered by chassis
- Wheelbase filtered by chassis
- Bus Type
- Allowed yes/no
- Active yes/no

## Runtime integration

Replace direct `busSpecMatrixData` usage with:

```txt
src/hooks/useVehicleMatrix.ts
```

Update customer Bus Selection step to use CMS data.

## Acceptance criteria

- Admin can create a new chassis.
- Admin can create wheelbases tied to a chassis.
- Customer Bus Selection dropdowns reflect active CMS records.
- Contract selection can restrict eligible vehicle matrix choices.
- Incompatible saved selections are cleared or flagged when contract/chassis changes.

---

# Phase 4 — Features & Options Management

## Goal

Make Options & Packages fully configurable with contract rules.

## Tables

```sql
cms_feature_categories
cms_feature_options
cms_feature_contract_rules
```

### cms_feature_categories

Fields:

```txt
category_id primary key
name/title
description
active
status
sort_order
customer_visible boolean
```

### cms_feature_options

Fields:

```txt
option_id primary key
category_id
title
description
image_ext nullable
active
status
sort_order
requires_document boolean
notes
```

### cms_feature_contract_rules

Fields:

```txt
id primary key
contract_id
category_id nullable
option_id nullable
rule_type available | hidden | required | recommended
auto_select boolean
requires_document boolean
active
notes
```

## Admin UI

Features & Options Management should support:

- Category create/edit/delete
- Option create/edit/delete
- Option assignment to category
- Active/inactive visibility
- Contract Rules editor
- Sort order controls

Contract rule examples:

- MnDOT requires Wheelchair Restraint.
- Contract X hides Exterior Branding.
- Contract Y recommends Backup Camera.
- Contract Z requires a bid document when urgent response is selected.

## Runtime integration

Create:

```txt
src/hooks/useFeatureOptionsCms.ts
```

Update `FeaturesStep.tsx` to use CMS data instead of static featureOptionMatrix directly.

## Customer-facing behavior

- Only active categories show.
- Layout and Seats categories remain hidden because those are handled in Seats & Floorplan Intent.
- Contract rules determine visible/required/recommended options.
- Required options should show a required badge and block submission if missing.

## Acceptance criteria

- Admin can create a new option and it appears in Options & Packages.
- Admin can hide an option and it disappears from customer flow.
- Contract-specific required option appears and validates on submission.
- Option counts are correct and exclude hidden categories.

---

# Phase 5 — Floorplan Management Completion

## Goal

Finish the already-started Floorplan CMS into a complete admin-managed module.

## Current status

Already exists:

```txt
/api/cms-floor-plans
FloorPlanAdminEditor
cms_floor_plan_master
cms_floor_plan_zones
cms_floor_plan_seat_types
cms_floor_plan_compatibility_rules
```

## Remaining tasks

### 1. Add Status editor

Expose status dropdown:

```txt
Draft
Active
Inactive
Retired
```

Customer runtime should show only:

```txt
status = active
and dealerVisible = true
```

Temporary dealer-visible testing bypass should be removed once status is editable.

### 2. Add seat option list management

Move these lists out of static `seatCmsConfig`:

```txt
Seat Types
Materials
Colors
Restraint Types
Armrest / Grab Options
Grab Types
Branding Options if still needed internally
```

Tables:

```sql
cms_seat_option_lists
cms_seat_option_values
```

Fields:

```txt
list_id
label
value
active
status
sort_order
```

### 3. Improve floorplan rule validation

Rules should validate:

- Contract exists
- Chassis exists
- Wheelbase belongs to selected chassis unless any
- Certification belongs to selected chassis unless any
- No duplicate exact rule rows
- At least one allowed rule for customer-visible active floorplans

### 4. Improve preview accuracy

Customer preview should show:

- Whole bus layout without scroll
- Admin labels when useful
- Capacity hint
- Wheelchair hint
- Reference-only disclaimer

## Acceptance criteria

- Admin can create a floorplan, set active, dealer visible, save, and see it in Seats step.
- Admin can add/delete zones and compatibility rules.
- Admin can edit seat option lists without code changes.
- Customer Seats step never shows retired floorplans.

---

# Phase 6 — Routing Rules & SLA Rules

## Goal

Move routing and SLA rules from static display to admin-managed workflow rules.

## Tables

```sql
cms_routing_rules
cms_sla_rules
cms_assignment_queues
```

### cms_routing_rules

Fields:

```txt
id primary key
name
trigger_area commercial | accessible | contract | urgent | custom
condition_json
assigned_queue
owner_role
priority normal | high | urgent
active
status
sort_order
```

### cms_sla_rules

Fields:

```txt
id primary key
name
applies_to assignment | quote_turnaround | approval | urgent_bid
business_hours_target
business_days_target
priority
active
status
sort_order
```

### cms_assignment_queues

Fields:

```txt
queue_id primary key
name
owner_role
backup_role
active
```

## Admin UI

Routing Rules & SLA Rules should support:

- Create routing rule
- Edit routing rule
- Delete/retire routing rule
- Create SLA rule
- Edit SLA rule
- Delete/retire SLA rule
- Manage assignment queues

## Runtime integration

When RFQ is submitted:

- Determine queue
- Determine priority
- Attach SLA due date metadata
- Add contract approval requirement when applicable

## Acceptance criteria

- Admin can create a routing rule.
- Submitted RFQ payload includes computed route/queue/priority/SLA metadata.
- Rules can be disabled without deleting history.

---

# Phase 7 — Roles & Permissions

## Goal

Replace hard-coded role behavior with admin-managed permission definitions.

## Tables

```sql
cms_roles
cms_permissions
cms_role_permissions
```

### cms_roles

Fields:

```txt
role_id primary key
label
description
active
status
sort_order
```

### cms_permissions

Fields:

```txt
permission_id primary key
label
description
area new_quote | my_requests | quote_status | rfq_queue | admin_config | cms
active
```

### cms_role_permissions

Fields:

```txt
id primary key
role_id
permission_id
allowed boolean
```

## Admin UI

Roles & Permissions should support:

- Create role
- Edit role
- Delete/retire role
- Permission checklist by role
- Page access matrix

## Runtime integration

Current role selector can remain for demo/testing, but permitted pages should come from CMS permissions.

## Acceptance criteria

- Admin can edit which pages Dealer/Internal/Admin can access.
- Header navigation reflects permissions.
- Restricted page attempts redirect safely.

---

# Phase 8 — Review, Validation, and Migration

## Migration strategy

For each config domain:

1. Keep static source as seed fallback.
2. Add backend tables and endpoint.
3. Seed backend from static config if empty.
4. Build admin CRUD UI.
5. Switch runtime hook to backend-first.
6. Validate customer flow.
7. Remove or freeze static dependency.

## Validation checklist

### Build validation

```txt
npm install
npm run build
```

### Customer flow validation

Test these scenarios:

1. Standard commercial quote, no contract
2. MnDOT contract quote
3. Contract with restricted chassis
4. Contract with restricted floorplan
5. Contract with required option
6. No compatible floorplan available
7. Admin-created floorplan active/dealer visible
8. Admin-created option active/inactive
9. Retired contract still does not break older RFQs

### Admin validation

For every Config page:

- Create record
- Edit record
- Duplicate record if supported
- Delete/retire record
- Save
- Reload
- Confirm persistence
- Confirm customer runtime reflects active records
- Confirm inactive/retired records are hidden

---

# Recommended Build Order

## Sprint 1 — Foundation + Contracts

1. Shared CMS utilities/components
2. `/api/cms-contracts`
3. Contract Program Management editor
4. Runtime `useContractPrograms`
5. Contract dropdown uses CMS

## Sprint 2 — Vehicle Matrix

1. `/api/cms-vehicle-matrix`
2. Vehicle/chassis editor
3. Contract vehicle rules editor
4. Runtime `useVehicleMatrix`
5. Bus Selection uses CMS

## Sprint 3 — Features & Options

1. `/api/cms-feature-options`
2. Category/option editor
3. Contract feature rules editor
4. Runtime `useFeatureOptionsCms`
5. Features step uses CMS

## Sprint 4 — Floorplan completion

1. Add floorplan status dropdown
2. Remove dealer-visible testing bypass
3. Add seat option list backend
4. Seat option lists editor
5. Validation rules

## Sprint 5 — Workflow + Roles

1. `/api/cms-routing-rules`
2. Routing/SLA editor
3. RFQ submission routing metadata
4. `/api/cms-roles-permissions`
5. Permission-driven navigation

## Sprint 6 — Hardening

1. Full Vercel build validation
2. Admin regression testing
3. Customer RFQ regression testing
4. Data export/import option
5. Final cleanup of static config dependencies

---

# Definition of Done

The CMS Config project is complete when:

- Every Config tab supports create/edit/delete or retire.
- All active records persist in Neon.
- Customer RFQ flow reads backend config first.
- Static data is fallback only, not the main runtime source.
- Contract rules can control vehicle matrix, feature options, floorplans, and routing.
- Floorplans and seat option lists can be managed without code changes.
- Vercel build passes.
- Admin can test the full flow without editing seed files.
