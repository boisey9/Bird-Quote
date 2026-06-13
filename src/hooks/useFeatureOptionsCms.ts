import { useEffect, useState } from 'react';
import { featureOptionCategories, featureOptions } from '../data/featureOptionMatrix';
import type { FeatureOptionCategory, FeatureOptionItem } from '../types/rfq';

export type FeatureCategoryCmsRecord = FeatureOptionCategory & {
  customerVisible?: boolean;
  status?: string;
};

export type FeatureOptionCmsRecord = FeatureOptionItem & {
  imageUrl?: string;
  requiresDocument?: boolean;
  status?: string;
  notes?: string;
};

export type FeatureContractRule = {
  id: string;
  contractId: string;
  categoryId: number | null;
  optionId: number | null;
  chassisId: string;
  certificationId: string;
  wheelbaseId: string;
  busTypeId: string;
  ruleType: 'available' | 'hidden' | 'required' | 'recommended';
  autoSelect: boolean;
  requiresDocument: boolean;
  active: boolean;
  notes: string;
};

export type FeatureOptionsCmsData = {
  categories: FeatureCategoryCmsRecord[];
  options: FeatureOptionCmsRecord[];
  contractRules: FeatureContractRule[];
};

type FeatureOptionsCmsPayload = Partial<FeatureOptionsCmsData> & {
  ok?: boolean;
  source?: string;
  error?: string;
  counts?: Record<string, number>;
};

export type FeatureOptionsRuntimeData = {
  data: FeatureOptionsCmsData;
  sourceLabel: string;
  loadState: 'loading' | 'neon' | 'fallback' | 'error';
  error?: string;
};

function normalizeRule(rule: Partial<FeatureContractRule> & Pick<FeatureContractRule, 'id' | 'contractId' | 'ruleType' | 'autoSelect' | 'requiresDocument' | 'active' | 'notes'>): FeatureContractRule {
  return {
    id: rule.id,
    contractId: rule.contractId,
    categoryId: rule.categoryId ?? null,
    optionId: rule.optionId ?? null,
    chassisId: rule.chassisId ?? 'any',
    certificationId: rule.certificationId ?? 'any',
    wheelbaseId: rule.wheelbaseId ?? 'any',
    busTypeId: rule.busTypeId ?? 'any',
    ruleType: rule.ruleType,
    autoSelect: rule.autoSelect,
    requiresDocument: rule.requiresDocument,
    active: rule.active,
    notes: rule.notes
  };
}

export function seedFeatureOptionsCms(): FeatureOptionsCmsData {
  return {
    categories: featureOptionCategories.map((category) => ({
      ...category,
      customerVisible: category.active,
      status: category.active ? 'active' : 'inactive'
    })),
    options: featureOptions.map((option) => ({
      ...option,
      imageUrl: '',
      requiresDocument: false,
      status: option.active ? 'active' : 'inactive',
      notes: ''
    })),
    contractRules: []
  };
}

function fallbackFeatureOptions(error?: string): FeatureOptionsRuntimeData {
  return {
    data: seedFeatureOptionsCms(),
    sourceLabel: error ? 'Static fallback - Feature Options CMS unavailable' : 'Static feature options',
    loadState: error ? 'error' : 'fallback',
    error
  };
}

async function parseFeatureOptionsResponse(response: Response): Promise<FeatureOptionsCmsPayload> {
  const text = await response.text();
  let payload: FeatureOptionsCmsPayload;
  try {
    payload = text ? JSON.parse(text) as FeatureOptionsCmsPayload : {};
  } catch {
    const preview = text.replace(/\s+/g, ' ').slice(0, 180);
    throw new Error(`Feature Options CMS returned non-JSON (${response.status}). ${preview || response.statusText}`);
  }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `Feature Options CMS request failed (${response.status}).`);
  return payload;
}

export function toFeatureOptionsCmsData(payload: FeatureOptionsCmsPayload): FeatureOptionsCmsData {
  const seed = seedFeatureOptionsCms();
  return {
    categories: payload.categories?.length ? payload.categories : seed.categories,
    options: payload.options?.length ? payload.options : seed.options,
    contractRules: payload.contractRules?.map((rule) => normalizeRule(rule)) ?? []
  };
}

export function useFeatureOptionsCms(): FeatureOptionsRuntimeData {
  const [runtimeData, setRuntimeData] = useState<FeatureOptionsRuntimeData>(() => fallbackFeatureOptions());

  useEffect(() => {
    let isMounted = true;

    async function loadFeatureOptions() {
      try {
        const payload = await parseFeatureOptionsResponse(await fetch('/api/cms-feature-options'));
        if (!isMounted) return;
        setRuntimeData({
          data: toFeatureOptionsCmsData(payload),
          sourceLabel: payload.source === 'empty-neon' ? 'Seed feature options - click Save to initialize backend' : 'Neon Feature Options CMS',
          loadState: payload.source === 'empty-neon' ? 'fallback' : 'neon'
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load Feature Options CMS.';
        if (isMounted) setRuntimeData(fallbackFeatureOptions(message));
      }
    }

    loadFeatureOptions();
    return () => { isMounted = false; };
  }, []);

  return runtimeData;
}

export async function saveFeatureOptionsCms(data: FeatureOptionsCmsData) {
  return parseFeatureOptionsResponse(await fetch('/api/cms-feature-options', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, contractRules: data.contractRules.map((rule) => normalizeRule(rule)) })
  }));
}
