import { useEffect, useMemo, useState } from 'react';
import { seatCmsConfig } from '../data/featureOptionMatrix';

export type SeatOptionListId = 'seatTypes' | 'materials' | 'colors' | 'restraintTypes' | 'armrests' | 'grabTypes' | 'brandingOptions';

export type SeatOptionValue = {
  id: string;
  listId: SeatOptionListId;
  label: string;
  value: string;
  active: boolean;
  status: string;
  sortOrder: number;
  notes: string;
};

export type SeatOptionListsCmsData = {
  listLabels: Record<SeatOptionListId, string>;
  values: SeatOptionValue[];
};

type SeatOptionsPayload = Partial<SeatOptionListsCmsData> & {
  ok?: boolean;
  source?: string;
  error?: string;
  counts?: Record<string, number>;
};

const listLabels: Record<SeatOptionListId, string> = {
  seatTypes: 'Seat Types',
  materials: 'Materials',
  colors: 'Colors',
  restraintTypes: 'Restraint Types',
  armrests: 'Armrest / Grab Options',
  grabTypes: 'Grab Types',
  brandingOptions: 'Branding Options'
};

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function seedSeatOptionListsCms(): SeatOptionListsCmsData {
  const entries: [SeatOptionListId, string[]][] = [
    ['seatTypes', seatCmsConfig.seatTypes],
    ['materials', seatCmsConfig.materials],
    ['colors', seatCmsConfig.colors],
    ['restraintTypes', seatCmsConfig.restraintTypes],
    ['armrests', seatCmsConfig.armrests],
    ['grabTypes', seatCmsConfig.grabTypes],
    ['brandingOptions', seatCmsConfig.brandingOptions]
  ];
  return {
    listLabels,
    values: entries.flatMap(([listId, values]) => values.map((value, index) => ({
      id: `${listId}-${slug(value)}`,
      listId,
      label: value,
      value,
      active: true,
      status: 'active',
      sortOrder: (index + 1) * 10,
      notes: ''
    })))
  };
}

async function parseSeatOptionsResponse(response: Response): Promise<SeatOptionsPayload> {
  const text = await response.text();
  let payload: SeatOptionsPayload;
  try {
    payload = text ? JSON.parse(text) as SeatOptionsPayload : {};
  } catch {
    const preview = text.replace(/\s+/g, ' ').slice(0, 180);
    throw new Error(`Seat Options CMS returned non-JSON (${response.status}). ${preview || response.statusText}`);
  }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `Seat Options CMS request failed (${response.status}).`);
  return payload;
}

export function toSeatOptionListsCmsData(payload: SeatOptionsPayload): SeatOptionListsCmsData {
  const seed = seedSeatOptionListsCms();
  return {
    listLabels: payload.listLabels ?? seed.listLabels,
    values: payload.values?.length ? payload.values : seed.values
  };
}

export function useSeatOptionListsCms() {
  const [data, setData] = useState<SeatOptionListsCmsData>(() => seedSeatOptionListsCms());
  const [loadState, setLoadState] = useState<'loading' | 'neon' | 'fallback' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const payload = await parseSeatOptionsResponse(await fetch('/api/cms-seat-options'));
        if (!mounted) return;
        setData(toSeatOptionListsCmsData(payload));
        setLoadState(payload.source === 'empty-neon' ? 'fallback' : 'neon');
        setError('');
      } catch (err) {
        if (!mounted) return;
        setData(seedSeatOptionListsCms());
        setLoadState('error');
        setError(err instanceof Error ? err.message : 'Unable to load seat option lists.');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const lists = useMemo(() => {
    const activeValues = data.values.filter((item) => item.active && item.status !== 'retired').sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
    const get = (listId: SeatOptionListId) => activeValues.filter((item) => item.listId === listId).map((item) => item.value);
    return {
      seatTypes: get('seatTypes'),
      materials: get('materials'),
      colors: get('colors'),
      restraintTypes: get('restraintTypes'),
      armrests: get('armrests'),
      grabTypes: get('grabTypes'),
      brandingOptions: get('brandingOptions')
    };
  }, [data.values]);

  return { data, lists, loadState, error };
}

export async function saveSeatOptionListsCms(data: SeatOptionListsCmsData) {
  return parseSeatOptionsResponse(await fetch('/api/cms-seat-options', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: data.values })
  }));
}
