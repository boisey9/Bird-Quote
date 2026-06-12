import { useEffect, useState } from 'react';

export type RoutingRule = {
  id: string;
  name: string;
  triggerType: 'market' | 'accessibility' | 'contract' | 'urgency' | 'document' | 'manual';
  condition: string;
  assignedQueue: string;
  ownerRole: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  active: boolean;
  sortOrder: number;
  notes: string;
};

export type SlaRule = {
  id: string;
  name: string;
  appliesTo: 'standard' | 'urgent' | 'contract' | 'accessibility' | 'all';
  targetHours: number;
  businessHoursOnly: boolean;
  escalationHours: number;
  ownerRole: string;
  active: boolean;
  sortOrder: number;
  notes: string;
};

export type RoutingSlaCmsData = { routingRules: RoutingRule[]; slaRules: SlaRule[] };
type RoutingSlaPayload = Partial<RoutingSlaCmsData> & { ok?: boolean; source?: string; error?: string; counts?: Record<string, number> };

export function seedRoutingSlaCms(): RoutingSlaCmsData {
  return {
    routingRules: [
      { id: 'route-commercial-standard', name: 'Commercial RFQs', triggerType: 'market', condition: 'Commercial bus type or commercial seating intent', assignedQueue: 'Sales Ops Queue', ownerRole: 'Sales Ops', priority: 'Normal', active: true, sortOrder: 10, notes: 'Default commercial routing.' },
      { id: 'route-accessibility-review', name: 'Accessibility RFQs', triggerType: 'accessibility', condition: 'Wheelchair capacity, lift/ramp, or accessibility option requested', assignedQueue: 'Estimating Queue', ownerRole: 'Estimating Team', priority: 'High', active: true, sortOrder: 20, notes: 'Accessibility review before quoting.' },
      { id: 'route-contract-review', name: 'Contract RFQs', triggerType: 'contract', condition: 'Contract-controlled workflow selected', assignedQueue: 'Contract Review Queue', ownerRole: 'Sales Ops + Manager', priority: 'High', active: true, sortOrder: 30, notes: 'Future approval workflow hook.' },
      { id: 'route-urgent-bid', name: 'Bid / urgent response', triggerType: 'urgency', condition: 'Bid / Urgent Response option selected', assignedQueue: 'Priority Quote Queue', ownerRole: 'Sales Ops', priority: 'Urgent', active: true, sortOrder: 40, notes: 'Expedite urgent bid requests.' }
    ],
    slaRules: [
      { id: 'sla-assignment-standard', name: 'Standard RFQ assignment', appliesTo: 'standard', targetHours: 8, businessHoursOnly: true, escalationHours: 12, ownerRole: 'Sales Ops', active: true, sortOrder: 10, notes: 'Initial owner assignment target.' },
      { id: 'sla-quote-standard', name: 'Standard quote turnaround', appliesTo: 'standard', targetHours: 24, businessHoursOnly: true, escalationHours: 32, ownerRole: 'Sales Ops', active: true, sortOrder: 20, notes: '3 business days based on 8-hour day.' },
      { id: 'sla-contract-approval', name: 'Contract quote approval', appliesTo: 'contract', targetHours: 16, businessHoursOnly: true, escalationHours: 24, ownerRole: 'Manager', active: true, sortOrder: 30, notes: 'Approval required before quote release.' },
      { id: 'sla-urgent-bid', name: 'Urgent bid response', appliesTo: 'urgent', targetHours: 8, businessHoursOnly: true, escalationHours: 10, ownerRole: 'Sales Ops', active: true, sortOrder: 40, notes: 'One business day target.' }
    ]
  };
}

async function parseRoutingSlaResponse(response: Response): Promise<RoutingSlaPayload> {
  const text = await response.text();
  let payload: RoutingSlaPayload;
  try { payload = text ? JSON.parse(text) as RoutingSlaPayload : {}; }
  catch { throw new Error(`Routing/SLA CMS returned non-JSON (${response.status}). ${text.replace(/\s+/g, ' ').slice(0, 180) || response.statusText}`); }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `Routing/SLA CMS request failed (${response.status}).`);
  return payload;
}

export function toRoutingSlaCmsData(payload: RoutingSlaPayload): RoutingSlaCmsData {
  const seed = seedRoutingSlaCms();
  return { routingRules: payload.routingRules?.length ? payload.routingRules : seed.routingRules, slaRules: payload.slaRules?.length ? payload.slaRules : seed.slaRules };
}

export function useRoutingSlaCms() {
  const [data, setData] = useState<RoutingSlaCmsData>(() => seedRoutingSlaCms());
  const [loadState, setLoadState] = useState<'loading' | 'neon' | 'fallback' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const payload = await parseRoutingSlaResponse(await fetch('/api/cms-routing-sla'));
        if (!mounted) return;
        setData(toRoutingSlaCmsData(payload));
        setLoadState(payload.source === 'empty-neon' ? 'fallback' : 'neon');
        setError('');
      } catch (err) {
        if (!mounted) return;
        setData(seedRoutingSlaCms());
        setLoadState('error');
        setError(err instanceof Error ? err.message : 'Unable to load Routing/SLA CMS.');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { data, loadState, error };
}

export async function saveRoutingSlaCms(data: RoutingSlaCmsData) {
  return parseRoutingSlaResponse(await fetch('/api/cms-routing-sla', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));
}
