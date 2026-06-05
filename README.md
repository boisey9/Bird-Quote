# Bird Quote — RFQ App V2

Clean restart implementation starter for the Micro Bird RFQ customer intake and internal workflow layer.

## Scope in this starter

This package starts the V2 customer-facing RFQ flow only:

1. Company / request details
2. Bus specifications
3. Features & options
4. Review & submit

It also includes V2-ready structure for:

- past quote / past order reference
- document upload UI
- dealer quote summary
- recent requests panel
- responsive desktop and mobile layout
- RFQ data model types
- mock matrix-driven selection data

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Recommended next integration steps

1. Push this package into `boisey9/Bird-Quote`.
2. Connect image assets from the RFQ asset pack.
3. Replace mock data in `src/data/rfqData.ts` with matrix-exported JSON.
4. Add Supabase tables for RFQs, documents, history, status, audit trail, and users.
5. Implement save draft and submit actions.
6. Add internal dashboard after customer intake is stable.
