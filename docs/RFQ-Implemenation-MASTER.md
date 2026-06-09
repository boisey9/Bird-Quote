# RFQ App Restart — V2 Only Implementation Plan

## 1. Purpose

This document defines the implementation plan for **V2 only** of the restarted RFQ App.

The goal of V2 is to deliver a stable customer-facing RFQ intake platform and a reliable internal RFQ management workflow. V2 should not attempt to become a full configurator, CPQ system, CRM integration layer, public lead-generation portal, or advanced CMS.

V2 should allow dealers to submit structured RFQs, upload supporting documents, reuse previous quote/order context, track RFQ progress, and allow the internal Sales/Estimating team to manage RFQs through a controlled dashboard with ownership, status, SLA visibility, audit trail, and basic reporting.

## 2. V2 Guiding Principle

The RFQ App is the **dealer intake and internal workflow layer**, not the final engineering configurator.

The dealer should be able to say:

> This is the quote I need, this is the vehicle intent, these are the selected options, these are the seating/floorplan requirements, and these are the documents/specifications needed for quoting.

Micro Bird will validate the final configuration, pricing, engineering feasibility, floorplan, and quote before sending the final result back to the dealer.

## 3. V2 Scope Boundary

### Included in V2

V2 includes only the capabilities required to replace or improve the current RFQ intake and internal follow-up process.

Included capability groups:

1. Dealer Interaction
2. RFQ Intake Management
3. Workflow & Routing
4. Pipeline Visibility
5. Internal Sales Operations
6. Governance & Control
7. System Configuration
8. V2 portion of Data Validation

### Not Included in V2

The following items should **not** be built in V2:

- Public RFQ lead generation
- CRM integration
- CPQ integration
- Bus Builder launch / deep link
- Data warehouse feed
- Full CMS / product catalog management
- Advanced smart defaults
- Quote versioning engine
- Approval workflow
- Dealer e-signature
- Offline mobile app
- Type C / D expansion
- Advanced workload balancing
- Advanced escalation management
- Full quote-to-order automation

V2 should be kept simple, stable, and maintainable.

## 4. Current RFQ Structure to Preserve

The new V2 app should follow the current RFQ structure and improve it without changing the business logic too aggressively.

Recommended customer-facing flow:

1. Quote Context
2. Dealer / Customer Information
3. Vehicle Selection
4. Options & Packages
5. Seats & Floorplan Intent
6. Documents & Attachments
7. Review & Submit
8. Confirmation & RFQ Tracking

Recommended internal flow:

1. RFQ appears in internal queue
2. RFQ is validated for completeness
3. RFQ is assigned or reassigned
4. Owner reviews quote request
5. Missing information is requested if required
6. RFQ moves through status workflow
7. Quote is created outside the RFQ App
8. RFQ is marked as quote sent / converted / closed
9. Management monitors pipeline, SLA, conversion, and performance

## 5. V2 Capability Map

| L1 Capability | V2 Sub-Capability | V2 Objective |
|---|---|---|
| Dealer Interaction | RFQ Submission | Dealer can submit structured quote requests through the portal. |
| Dealer Interaction | RFQ Tracking | Dealer can see the status of submitted RFQs. |
| Dealer Interaction | Document Upload | Dealer can upload bid packages, floorplans, specs, and supporting files. |
| Dealer Interaction | Quote History Access | Dealer can reference or reuse previous quotes. |
| Dealer Interaction | Quote from BID Contract | Dealer can identify bid/tender context. |
| Dealer Interaction | Edit Quote Feature | Dealer can update allowed RFQ fields before the RFQ reaches a locked status. |
| Dealer Interaction | Pre-filled Dealer Information | Dealer information is prefilled based on login/profile. |
| Dealer Interaction | Duplicate Quote | Dealer can start from a previous RFQ/quote/order context. |
| RFQ Intake Management | Structured Data Capture | RFQ data is captured in normalized fields, not only free text. |
| RFQ Intake Management | RFQ ID Generation | Every submitted RFQ receives a unique tracking identifier. |
| RFQ Intake Management | Data Validation | Required fields and basic matrix compatibility are validated before submission. |
| Workflow & Routing | RFQ Assignment Engine | RFQs can be assigned based on territory/rules/manual ownership. |
| Workflow & Routing | Queue Management | Internal users can manage incoming workload from a queue. |
| Workflow & Routing | SLA Tracking | Turnaround time and aging are visible. |
| Workflow & Routing | Alerts & Notifications | Key action triggers notify the right users. |
| Pipeline Visibility | RFQ Pipeline View | Internal team can see all RFQs by status/stage. |
| Pipeline Visibility | Conversion Tracking | RFQ can be linked to quote/order outcome fields. |
| Pipeline Visibility | Performance Dashboards | Basic KPIs are visible for management. |
| Internal Sales Operations | Internal Dashboard | Sales Ops can manage the RFQ backend. |
| Internal Sales Operations | RFQ Status Management | RFQ progress can be updated in a controlled workflow. |
| Internal Sales Operations | Internal Ownership Management | RFQs can be assigned/reassigned to internal owners. |
| Governance & Control | Role & Access Management | Permissions are separated by dealer/internal/admin roles. |
| Governance & Control | Audit Trail | Important actions are logged. |
| Governance & Control | Process Governance | Required workflow discipline is enforced. |
| System Configuration | User & Account Management | Internal/admin users can create/manage dealer and internal users. |
| System Configuration | User Permission Configuration | Admins can control user permissions. |
| System Configuration | Rules Engine Including Management | Basic V2 rules are centralized enough to avoid hard-coded chaos. |
| System Configuration | Dealer Network Deployment Model | Structure supports Micro Bird and broader dealer network access model. |

## 6. Recommended V2 Architecture

### 6.1 Front End

Recommended stack:

- React
- TypeScript
- TailwindCSS
- Vite or Next.js
- Component-first structure
- Responsive desktop/mobile design

Recommended folder structure:

```text
/src
  /components
    /rfq
      /steps
      /summary
      /tracking
    /dashboard
      /queue
      /detail
      /metrics
    /layout
    /forms
  /data
    rfq-v2-config.ts
    matrix-seed-data.ts
  /lib
    rfq-validation.ts
    rfq-status.ts
    rfq-routing.ts
    rfq-id.ts
    permissions.ts
  /types
    rfq.ts
    dealer.ts
    user.ts
    option.ts
    dashboard.ts
  /routes
    dealer-rfq
    dealer-tracking
    internal-dashboard
    admin
```

### 6.2 Backend / Database

Recommended backend options:

- Supabase / PostgreSQL
- PostgreSQL with API layer
- Storage bucket for uploaded RFQ documents
- Authentication/role model from day one
- Audit log from day one

### 6.3 V2 Technical Rule

Do not build a full CMS yet. V2 can use seed tables or structured JSON for configuration, but the data model should be designed so V3 can later move rules into real admin-managed configuration screens.

## 7. V2 Data Model

### 7.1 Main RFQ Tables

#### rfqs

Stores the RFQ header.

Fields:

- id
- rfq_number
- rfq_type
- source
- dealer_id
- dealer_contact_id
- end_customer_name
- customer_city
- customer_state_province
- customer_country
- market
- status
- priority
- assigned_to
- created_by
- created_at
- submitted_at
- updated_at
- completed_at
- quote_number
- order_number
- converted_to_quote
- converted_to_order
- sla_due_at
- last_activity_at
- locked_at
- locked_reason

#### rfq_context

Stores quote context and reference information.

Fields:

- id
- rfq_id
- request_type
- dealer_reference
- customer_reference
- past_rfq_number
- past_quote_number
- past_order_number
- bid_contract_reference
- requested_delivery_timing
- special_context_notes

#### rfq_dealer_customer

Stores dealer and customer details as a snapshot at submission.

Fields:

- id
- rfq_id
- dealer_name
- dealer_number
- dealer_location
- dealer_contact_name
- dealer_contact_email
- dealer_contact_phone
- sales_rep
- territory
- end_customer_name
- end_customer_city
- end_customer_state_province
- end_customer_country
- market

#### rfq_vehicle_configuration

Stores vehicle intent.

Fields:

- id
- rfq_id
- quantity
- market
- chassis_make
- chassis_model
- chassis_year
- wheelbase
- certification
- bus_model
- body_length
- fuel_type
- propulsion
- passenger_capacity_estimate
- special_requirements
- validation_status

#### rfq_options

Stores selected options.

Fields:

- id
- rfq_id
- option_category
- option_code
- option_name
- option_value
- quantity
- notes
- source

#### rfq_seats

Stores high-level seat package intent.

Fields:

- id
- rfq_id
- seating_layout
- seat_material
- seat_color
- estimated_passengers
- wheelchair_positions
- floorplan_reference_type
- reference_only_acknowledged
- notes

#### rfq_seat_types

Stores dynamic seat-type rows.

Fields:

- id
- rfq_id
- quantity
- seat_style
- seat_belt
- armrest_grab
- grab_type
- seat_branding
- notes

#### rfq_documents

Stores uploaded documents.

Fields:

- id
- rfq_id
- file_name
- file_type
- file_size
- storage_path
- document_category
- uploaded_by
- uploaded_at
- is_required
- upload_status

#### rfq_status_history

Tracks status movement.

Fields:

- id
- rfq_id
- old_status
- new_status
- changed_by
- changed_at
- reason

#### rfq_comments

Stores internal/dealer notes.

Fields:

- id
- rfq_id
- comment_type
- visibility
- body
- created_by
- created_at

#### audit_log

Tracks system actions.

Fields:

- id
- entity_type
- entity_id
- action
- actor_id
- actor_type
- before_json
- after_json
- created_at

### 7.2 V2 Configuration Tables / Seed Data

These can be seed tables or JSON in V2.

#### config_users

- id
- name
- email
- role
- dealer_id
- active

#### config_roles

- id
- role_name
- description
- permissions

#### config_dealers

- id
- dealer_name
- dealer_number
- territory
- default_sales_rep
- active

#### config_chassis_matrix

- id
- chassis_make
- chassis_model
- wheelbase
- certification
- compatible_bus_models
- active

#### config_option_categories

- id
- category_name
- display_order
- required_for_market
- active

#### config_options

- id
- category_id
- option_code
- option_name
- description
- active

#### config_seat_layouts

- id
- layout_name
- market
- allowed_models
- reference_preview_type
- active

#### config_contracts

- id
- contract_code
- contract_name
- agency
- workflow_type
- active
- required_document_categories
- default_priority
- default_sla_rule_id
- notes

#### config_contract_vehicle_rules

- id
- contract_id
- allowed_chassis
- allowed_wheelbase
- allowed_certification
- allowed_bus_model
- allowed_market
- active

#### config_contract_seat_layout_rules

- id
- contract_id
- seat_layout_template_id
- model_type
- wheelbase
- certification
- max_passenger_seats
- max_wheelchair_positions
- rear_lift_required
- active

#### config_routing_rules

- id
- market
- dealer_id
- territory
- assigned_user
- priority
- active

#### config_sla_rules

- id
- rfq_type
- market
- priority
- target_hours
- active

## 8. V2 Customer-Facing Flow

## Step 1 — Quote Context

Purpose: identify how the RFQ should start.

Fields:

- New RFQ
- Start from past RFQ
- Start from past quote
- Start from past order
- Bid / tender request
- Dealer reference
- Customer reference
- Requested delivery timing
- Notes

V2 features:

- RFQ Submission
- Duplicate Quote
- Quote History Access
- Quote from BID Contract
- Document Upload for bid package

Validation:

- Request type is required.
- Bid/tender requests should require a bid document or bid reference.
- Duplicate requests should require past RFQ, quote, or order reference.

Acceptance criteria:

- Dealer can start a new quote request.
- Dealer can identify bid/tender context.
- Dealer can reference previous quote/order/RFQ.
- Dealer can attach bid package documents.

### Step 1A — Contract / Procurement Program Selection

Purpose: identify whether the RFQ follows a standard workflow or a contract-controlled workflow.

This section appears between **Dealer / Customer Information** and **Reference Quote / Past Order** in the dealer intake UI.

Contract options for V2 seed configuration:

- No Contract / Standard RFQ
- MnDOT
- CDOT
- MoDOT

Fields:

- Contract selection
- Contract agency / program name
- Contract workflow type: Standard or Contract-Controlled
- Contract notes / procurement instructions

V2 behavior:

- If **No Contract / Standard RFQ** is selected, normal RFQ matrix rules apply.
- If a contract such as **MnDOT, CDOT, or MoDOT** is selected, the admin configuration controls:
  - available vehicle model types
  - available chassis / wheelbase / certification combinations
  - available seat layout templates
  - required document categories
  - workflow/routing rules
  - SLA/quote response expectations

Validation:

- Contract selection is required.
- Contract-controlled RFQs must use the model and seat layout templates approved in Admin Configuration.
- Contract-controlled RFQs may require bid package, floorplan, or specification documents depending on the configured contract rule.

Acceptance criteria:

- Dealer can identify the procurement program before referencing a past quote/order.
- Contract-controlled selections visibly change the workflow context.
- Admin configuration is the source of truth for which vehicle models and seat layouts are available for each contract.
- Internal users can see that the RFQ is contract-controlled when reviewing the queue/detail page.

## Step 2 — Dealer / Customer Information

Purpose: confirm who is requesting the quote and who the end customer is.

Fields:

- Dealer name
- Dealer location
- Dealer contact
- Dealer email
- Dealer phone
- End customer name
- Customer city
- Customer state/province
- Customer country
- Market: School / Commercial
- Sales rep / territory

V2 features:

- Pre-filled dealer information
- Structured Data Capture
- Role & Access Management

Validation:

- Dealer is required.
- Dealer contact is required.
- End customer name is required unless explicitly marked unknown.
- Market is required.
- Territory/sales rep must be populated internally.

Acceptance criteria:

- Dealer data is prefilled from user profile when available.
- Dealer can confirm or edit allowed fields.
- Internal team receives clean dealer/customer metadata.

## Step 3 — Vehicle Selection

Purpose: capture base vehicle intent.

Fields:

- Quantity
- Market
- Chassis make/model
- Chassis year
- Wheelbase
- Certification
- Bus model
- Fuel / propulsion
- Special requirements

V2 features:

- Structured Data Capture
- Data Validation
- Rules Engine Including Management

Validation:

- Quantity must be greater than zero.
- Market is required.
- Chassis, wheelbase, certification, and bus model are required.
- Matrix compatibility should block impossible base combinations.
- If compatibility is uncertain, show warning but allow internal review depending on rule setting.

Acceptance criteria:

- Dealer cannot submit incomplete vehicle selection.
- Dealer cannot easily select impossible base combinations.
- Internal team receives normalized chassis/model/wheelbase/certification data.

## Step 4 — Options & Packages

Purpose: collect desired options in a structured but customer-friendly way.

Recommended V2 option sections:

- Body / exterior
- Doors / entrance
- Windows / glass
- HVAC
- Electrical
- Safety
- Lighting
- Driver area
- Passenger area
- Accessibility
- Storage
- Special requests

V2 features:

- Structured Data Capture
- Data Validation
- Rules Engine Including Management

Validation:

- Required option categories must be completed where applicable.
- Selected options must be stored as structured rows.
- Special requests can remain free text but should be linked to category.

Acceptance criteria:

- Dealer can select options by category.
- Dealer can add notes for unusual requirements.
- Internal user can clearly see selected options without reading a long email.

## Step 5 — Seats & Floorplan Intent

Purpose: capture seat/floorplan intent without implying final engineering validation.

Sections:

1. Seat Package
2. Seat Type Details
3. Reference Preview / Summary

Seat Package fields:

- Seating layout
- Seat material
- Seat color
- Estimated passenger count
- Wheelchair positions
- Notes

Seat Type Details fields:

- Quantity
- Seat style
- Seat belt
- Armrest / grab
- Grab type
- Seat branding
- Notes

Reference preview note:

> Reference only — final seating layout will be reviewed and validated by Micro Bird.

V2 features:

- Structured Data Capture
- Data Validation
- Document Upload for floorplans/specs

Validation:

- Seating layout is required.
- Estimated passenger count is required.
- Wheelchair positions should be numeric.
- At least one seat type row should be present when seating is required.
- Reference-only acknowledgement should be required.

Acceptance criteria:

- Dealer can express seat intent clearly.
- Dealer understands the preview is not final approval.
- Internal team receives enough seating data to quote and validate later.

## Step 6 — Documents & Attachments

Purpose: collect all required RFQ files.

Document categories:

- Bid package
- Floorplan
- Customer specification
- Dealer notes
- Previous quote
- Previous order
- Images / references
- Other

V2 features:

- Document Upload
- Audit Trail
- Process Governance

Validation:

- File type must be allowed.
- File size must be within limit.
- Required documents by context must be present.
- Upload must be linked to RFQ record.

Acceptance criteria:

- Dealer can upload and review documents.
- Internal users can access documents from the RFQ detail page.
- Upload actions are logged.

## Step 7 — Review & Submit

Purpose: give the dealer one final review before submission.

Review sections:

- Quote context
- Dealer/customer information
- Vehicle selection
- Options
- Seats/floorplan intent
- Documents
- Notes
- Completeness warnings

V2 features:

- RFQ Submission
- RFQ ID Generation
- Data Validation
- Audit Trail

Validation:

- Required fields must be complete.
- Required documents must be uploaded.
- Matrix validation must pass or be flagged for internal review.
- Reference-only seat acknowledgement must be accepted.

Acceptance criteria:

- Dealer can review all data before submit.
- System blocks incomplete RFQs.
- RFQ ID is generated after submission.
- Dealer sees confirmation page.

## Step 8 — Dealer RFQ Tracking

Purpose: allow dealer to track submitted RFQ status.

Fields shown:

- RFQ ID
- Dealer reference
- Customer name
- Submitted date
- Status
- Assigned contact if allowed
- Last updated date
- Missing information request, if any

V2 features:

- RFQ Tracking
- RFQ Status Management
- Alerts & Notifications

Acceptance criteria:

- Dealer can see submitted RFQs.
- Dealer can see current status.
- Dealer can respond to missing information requests if enabled in V2.

## 9. V2 Internal Dashboard

## 9.1 RFQ Queue

Purpose: give Sales Ops one clean place to manage incoming work.

Columns:

- RFQ ID
- Dealer
- Customer
- Market
- Model
- Quantity
- Status
- Priority
- Assigned to
- Age
- SLA status
- Last activity
- Created date

Filters:

- Status
- Assigned user
- Dealer
- Market
- Priority
- Age
- SLA risk
- Missing information

Actions:

- Open RFQ
- Assign / reassign
- Change status
- Add internal note
- Request missing information
- View documents

V2 capabilities:

- Internal Dashboard
- Queue Management
- Internal Ownership Management
- RFQ Status Management
- SLA Tracking

Acceptance criteria:

- Internal users can see all RFQs they are allowed to access.
- Sales Ops can assign/reassign RFQs.
- Status and owner updates are saved and logged.

## 9.2 RFQ Detail Page

Sections:

- Header summary
- Status and owner
- Dealer/customer information
- Vehicle selection summary
- Options summary
- Seats/floorplan summary
- Documents
- Comments / notes
- Status history
- Audit trail
- Quote/order tracking fields

Actions:

- Assign/reassign owner
- Change status
- Add internal comment
- Add dealer-visible comment if enabled
- Request missing information
- Update quote number
- Update order number
- Mark converted / closed

V2 capabilities:

- Internal Dashboard
- RFQ Status Management
- Conversion Tracking
- Audit Trail
- Process Governance

Acceptance criteria:

- Internal user can manage one RFQ from a single detail page.
- Status history is visible.
- Documents are accessible.
- Quote/order conversion fields are captured.

## 9.3 Basic Performance Dashboard

Purpose: provide V2 management visibility without overbuilding BI.

Metrics:

- Open RFQs
- New RFQs this week/month
- RFQs by status
- RFQs by market
- RFQs by dealer
- Average assignment time
- Average completion time
- RFQs past SLA
- RFQ-to-quote conversion count
- RFQ-to-order conversion count

V2 capabilities:

- RFQ Pipeline View
- Conversion Tracking
- Performance Dashboards
- SLA Tracking

Acceptance criteria:

- Management can see pipeline volume.
- Aging/SLA problems are visible.
- Conversion fields are captured for future Power BI.

## 10. V2 Status Model

Recommended statuses:

1. Draft
2. Submitted
3. Intake Validation
4. Missing Information
5. Assigned
6. In Review
7. Quote In Progress
8. Quote Sent
9. Converted to Order
10. Closed Lost
11. Cancelled

### V2 Status Rules

| Status | Editable by Dealer | Internal Action Required | Notes |
|---|---|---|---|
| Draft | Yes | No | Not visible in main internal queue unless needed. |
| Submitted | Limited | Yes | RFQ is created and awaiting validation/assignment. |
| Intake Validation | No or limited | Yes | Internal team checks completeness. |
| Missing Information | Limited | Yes | Dealer may need to provide missing data/docs. |
| Assigned | No or limited | Yes | Owner is responsible. |
| In Review | No or limited | Yes | Sales/Estimating is reviewing. |
| Quote In Progress | No | Yes | Quote being built outside RFQ App. |
| Quote Sent | No | Optional | Dealer has received quote. |
| Converted to Order | No | No | Order number should be captured. |
| Closed Lost | No | No | Reason should be captured. |
| Cancelled | No | No | Reason should be captured. |

## 11. V2 Permission Model

### Dealer User

Can:

- Create RFQ
- View own dealer RFQs
- Upload documents
- Edit allowed draft/submitted fields
- Duplicate previous RFQ where allowed
- Track RFQ status

Cannot:

- View other dealer RFQs
- Assign RFQs
- Change internal status
- View internal notes
- Change routing/SLA rules

### Internal Sales User

Can:

- View assigned RFQs
- Update status
- Add internal notes
- Request missing information
- Update quote/order tracking fields

Cannot unless allowed:

- Change global configuration
- Manage users
- View all dealer records outside their permission scope

### Sales Ops / Manager

Can:

- View all RFQs
- Assign/reassign RFQs
- Change priority
- Manage queue
- View dashboards
- Override status where allowed

### Admin

Can:

- Manage users
- Manage roles/permissions
- Maintain V2 seed/configuration tables
- View audit trail
- Manage routing/SLA rules

## 12. V2 Validation Rules

### Required Field Validation

Required before submit:

- RFQ type/request context
- Dealer
- Dealer contact
- Market
- Customer/end-user name or unknown customer flag
- Quantity
- Chassis/make/model or equivalent base selection
- Wheelbase
- Certification
- Bus model
- Required documents by RFQ type
- Seat/floorplan acknowledgement

### Matrix Validation

Validate:

- Chassis + wheelbase + certification compatibility
- Bus model compatibility
- Market-specific required fields
- Required option categories
- Seat layout basic availability by market/model, if known

### Document Validation

Validate:

- File type
- File size
- Required category
- Upload completion

### Workflow Validation

Validate:

- Owner is required before moving to In Review
- Reason is required for Closed Lost / Cancelled
- Quote number is required before Quote Sent if available
- Order number is required before Converted to Order

## 13. V2 Alerts & Notifications

Keep alerts simple in V2.

Recommended alerts:

- New RFQ submitted
- RFQ assigned
- RFQ reassigned
- Missing information requested
- Missing information submitted
- RFQ approaching SLA due date
- RFQ past SLA
- Quote sent
- RFQ converted to order

Do not build advanced escalation chains in V2. Use basic email/app notifications first.

## 14. V2 SLA Tracking

Recommended V2 SLA fields:

- submitted_at
- assigned_at
- first_review_at
- quote_sent_at
- completed_at
- sla_due_at
- assignment_age_hours
- completion_age_hours
- sla_status

Recommended SLA statuses:

- On Track
- At Risk
- Past Due
- Completed

V2 should track SLA visibility. It does not need complex escalation automation yet.

## 15. V2 Audit Trail

Audit these actions from day one:

- RFQ created
- RFQ submitted
- RFQ edited
- Document uploaded
- Document deleted
- Status changed
- Owner assigned
- Owner reassigned
- Comment added
- Missing information requested
- Quote number updated
- Order number updated
- RFQ closed/cancelled
- User permission changed
- Routing/SLA rule changed

## 16. V2 Build Phases

## Phase 0 — V2 Project Restart Foundation

Objective: create a clean technical base.

Deliverables:

- New repository or clean branch
- React/TypeScript/Tailwind project setup
- Database schema draft
- RFQ data model finalized
- V2 capability scope locked
- Seed config structure created
- Basic layout and navigation
- Authentication/role approach selected

Definition of done:

- App runs locally.
- Database schema is documented.
- V2-only scope is approved.
- No V3/V4/V5/V6 work is included.

## Phase 1 — Dealer Intake UI

Objective: build the complete customer-facing V2 RFQ flow.

Deliverables:

- Quote Context step
- Dealer / Customer step
- Vehicle Selection step
- Options & Packages step
- Seats & Floorplan Intent step
- Documents step
- Review & Submit step
- Confirmation page
- Dealer tracking page shell

Definition of done:

- Dealer can move through the full RFQ form.
- Required fields are visible.
- User experience follows current RFQ structure.
- Seats section is reference-only and customer-facing.

## Phase 2 — Database Persistence & RFQ Submission

Objective: save RFQs and generate tracking IDs.

Deliverables:

- RFQ submit API/action
- RFQ ID generator
- Database persistence for all steps
- Document storage/linking
- Status history creation
- Audit log creation
- Draft support if approved for V2

Definition of done:

- Dealer can submit a real RFQ.
- RFQ is stored in normalized tables.
- RFQ number is generated.
- Documents are attached.
- Audit trail is created.

## Phase 3 — V2 Validation & Matrix Rules

Objective: prevent incomplete or invalid RFQs.

Deliverables:

- Required field validation
- Basic matrix compatibility validation
- Required document validation
- Seat/floorplan validation
- Review-page completeness warnings
- Backend validation mirror

Definition of done:

- Incomplete RFQs are blocked or clearly flagged.
- Matrix rules prevent bad base combinations.
- Dealer sees clear messages about missing information.

## Phase 4 — Internal RFQ Dashboard

Objective: give Sales Ops a controlled RFQ backend.

Deliverables:

- RFQ queue
- RFQ detail page
- Status update workflow
- Owner assignment/reassignment
- Internal notes/comments
- Document viewer/download links
- Quote/order tracking fields

Definition of done:

- Internal team can manage RFQs without spreadsheets/email-only tracking.
- RFQ ownership is clear.
- Status history is reliable.

## Phase 5 — V2 Governance, Access, SLA & Alerts

Objective: make the V2 workflow controlled and measurable.

Deliverables:

- Role/permission enforcement
- User/account management baseline
- SLA due date calculation
- SLA status display
- Basic alerts/notifications
- Audit trail UI
- Routing rule baseline

Definition of done:

- Dealer/internal/admin access is separated.
- SLA risk is visible.
- Key actions trigger simple notifications.
- Admin can manage users and baseline rules.

## Phase 6 — V2 Pipeline & Performance Dashboard

Objective: provide management visibility.

Deliverables:

- RFQ pipeline view
- Basic performance dashboard
- Conversion fields/reporting
- Aging metrics
- Export-ready structure for Power BI later

Definition of done:

- Management can see RFQ volume, aging, status, and conversion.
- V2 data is clean enough for future BI/data warehouse work.

## 17. Recommended GitHub Milestones for V2 Only

### Milestone 1 — V2 Foundation

Issues:

- Create clean RFQ App project
- Add TypeScript/Tailwind setup
- Add V2 folder structure
- Add RFQ types
- Add database schema documentation
- Add V2 seed config files

### Milestone 2 — Dealer RFQ Intake

Issues:

- Build Quote Context step
- Build Dealer / Customer step
- Build Vehicle Selection step
- Build Options step
- Build Seats & Floorplan step
- Build Documents step
- Build Review & Submit step
- Build Confirmation page

### Milestone 3 — Submission & Storage

Issues:

- Create RFQ tables
- Create RFQ submit action/API
- Create RFQ ID generator
- Create document upload/storage
- Create status history records
- Create audit log records

### Milestone 4 — Validation

Issues:

- Add required field validation
- Add matrix compatibility validation
- Add document validation
- Add seats validation
- Add review-page completeness warnings
- Add backend validation

### Milestone 5 — Internal Dashboard

Issues:

- Build RFQ queue
- Build RFQ detail page
- Add owner assignment
- Add status updates
- Add comments/notes
- Add document access
- Add quote/order tracking fields

### Milestone 6 — Governance, SLA & Alerts

Issues:

- Add roles/permissions
- Add user/account management baseline
- Add SLA rules
- Add SLA indicators
- Add basic notifications
- Add audit trail UI
- Add routing baseline

### Milestone 7 — V2 Reporting

Issues:

- Add pipeline dashboard
- Add status dashboard
- Add aging dashboard
- Add conversion dashboard
- Add export-ready reporting view

## 18. V2 Development Order

Build in this order:

1. Project foundation
2. RFQ data model
3. V2 seed configuration
4. Dealer RFQ intake UI
5. Review/submit flow
6. Database persistence
7. RFQ ID generation
8. Document upload
9. Required validation
10. Matrix validation
11. Internal queue
12. RFQ detail page
13. Status management
14. Ownership assignment
15. Audit log
16. Role/access management
17. SLA indicators
18. Basic alerts
19. Pipeline dashboard
20. Conversion tracking
21. Final QA and UAT

## 19. V2 Testing Plan

### Dealer Flow Tests

- Dealer can submit a new RFQ.
- Dealer can submit a bid/tender RFQ.
- Dealer can reference a past quote/order.
- Dealer can upload documents.
- Dealer cannot submit incomplete required fields.
- Dealer sees confirmation with RFQ ID.
- Dealer can track RFQ status.

### Internal Flow Tests

- Sales Ops can see new RFQ in queue.
- Sales Ops can assign RFQ.
- Owner can update status.
- Internal user can view documents.
- Internal user can request missing information.
- Quote/order fields can be updated.
- Status history is logged.
- Audit log is created.

### Validation Tests

- Invalid chassis/wheelbase/certification combination is blocked or flagged.
- Missing required documents are blocked or flagged.
- Missing seat acknowledgement blocks submission.
- Closed Lost / Cancelled requires reason.
- Converted to Order requires order number.

### Permission Tests

- Dealer cannot view another dealer's RFQs.
- Dealer cannot see internal notes.
- Dealer cannot assign RFQs.
- Internal user cannot manage admin settings unless permitted.
- Admin can manage users and baseline rules.

## 20. V2 Acceptance Criteria

V2 is complete when:

- Dealer can submit a structured RFQ through the portal.
- Dealer can upload documents.
- Dealer information is prefilled.
- Dealer can reference previous quotes/orders/RFQs.
- Dealer can track RFQ status.
- RFQ ID is generated automatically.
- RFQ data is stored in normalized tables.
- Required validation works.
- Matrix validation works at intake level.
- Internal dashboard shows all RFQs.
- Internal users can assign/reassign RFQs.
- Internal users can update RFQ status.
- SLA/aging is visible.
- Alerts/notifications exist for key actions.
- Pipeline/performance dashboard exists.
- Role/access separation exists.
- Audit trail exists.
- Process governance prevents uncontrolled status changes.

## 21. V2 Success Metrics

Recommended launch metrics:

- RFQ submission completion rate
- Average RFQ assignment time
- Average RFQ completion time
- RFQs past SLA
- RFQs missing required information
- RFQs by dealer
- RFQs by market
- RFQs by status
- RFQ-to-quote conversion
- RFQ-to-order conversion
- Number of RFQs requiring rework
- Document upload completion rate

## 22. Immediate Next Step

Create the following files in the new project repository:

```text
docs/rfq-v2-current-flow.md
docs/rfq-v2-data-model.md
docs/rfq-v2-implementation-plan.md
docs/rfq-v2-status-model.md
docs/rfq-v2-validation-rules.md
```

Then start development with **Milestone 1 — V2 Foundation** only.

Do not begin V3/V4/V5/V6 capabilities until V2 is submitted, tested, and accepted by internal stakeholders.
