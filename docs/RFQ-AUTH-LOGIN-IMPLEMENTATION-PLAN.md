# RFQ Auth / User Login Implementation Plan

## Current Implementation

The RFQ portal now has an application-level session foundation.

Current mode is demo-session based so the app can be tested immediately without production auth credentials.

Implemented pieces:

- Login page
- Demo user selection by email
- Stored browser session
- Signed-in header profile
- Sign out
- Role-aware navigation
- Protected page access
- Dealer/internal/manager/admin role model
- Submitted RFQ payload enriched with userId, dealerId, and submittedBy metadata

## Demo Users

| Role | Email | Purpose |
|---|---|---|
| Dealer | dealer@agirardin.com | Dealer quote intake and own RFQs |
| Internal | salesops@microbird.com | Internal queue and RFQ workflow |
| Manager | manager@microbird.com | Review/approval/reporting role |
| Admin | admin@microbird.com | Full CMS and configuration access |

## Production Auth Target

Recommended provider: Supabase Auth.

Reason:

- Fits the current Neon/Postgres-style CMS direction
- Supports dealer-owned records cleanly
- Can map authenticated users to role/dealer/company profile rows
- Can support row-level security later

## Proposed Supabase User Profile Table

```sql
create table portal_user_profiles (
  id uuid primary key,
  email text not null unique,
  full_name text not null,
  initials text not null,
  role_id text not null,
  company_name text not null,
  dealer_id text,
  dealer_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

The `id` should match Supabase Auth user id.

## Permission Flow

1. User signs in.
2. App loads user profile.
3. App loads role/permission model from Roles & Permissions CMS.
4. App builds an effective permission set.
5. Navigation and protected pages use the effective permissions.

## Page Access Rules

| Page | Dealer | Internal | Manager | Admin |
|---|---:|---:|---:|---:|
| New Quote | Yes | Yes | No | Yes |
| My Requests | Own only | Yes | Yes | Yes |
| Quote Status | Own only | Yes | Yes | Yes |
| RFQ Queue | No | Yes | Yes | Yes |
| Config | No | No | No | Yes |

## RFQ Ownership Model

Every RFQ submission should persist:

- userId
- submittedBy email
- dealerId
- dealerName/companyName
- role at submission time

This enables:

- Dealer-only My Requests
- Internal full queue
- Audit trail
- Status visibility by ownership

## Next Implementation Steps

1. Install Supabase client.
2. Add environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
3. Replace demo login with Supabase email/password or magic link.
4. Add `portal_user_profiles` API or direct Supabase query.
5. Merge profile permissions with Roles & Permissions CMS.
6. Update `/api/rfqs` to persist ownership metadata.
7. Filter My Requests and RFQ Queue by authenticated user permissions.
8. Remove demo users before production release.
