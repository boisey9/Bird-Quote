import { useEffect, useMemo, useState } from 'react';
import { contractOptions, type ContractOption } from '../data/contractConfig';

export type ContractProgram = ContractOption & {
  status: string;
  active: boolean;
  sortOrder: number;
};

export type ContractRuleIndex = {
  id: string;
  contractId: string;
  ruleArea: string;
  summary: string;
  active: boolean;
};

type ContractCmsPayload = {
  ok?: boolean;
  source?: string;
  error?: string;
  contractPrograms?: ContractProgram[];
  contractRuleIndex?: ContractRuleIndex[];
  contractCount?: number;
  ruleCount?: number;
};

export type ContractCmsRuntimeData = {
  contracts: ContractProgram[];
  ruleIndex: ContractRuleIndex[];
  sourceLabel: string;
  loadState: 'loading' | 'neon' | 'fallback' | 'error';
  error?: string;
};

export function seedContractPrograms(): ContractProgram[] {
  return contractOptions.map((contract, index) => ({
    ...contract,
    status: 'active',
    active: true,
    sortOrder: index + 1
  }));
}

function fallbackContracts(error?: string): ContractCmsRuntimeData {
  return {
    contracts: seedContractPrograms(),
    ruleIndex: [],
    sourceLabel: error ? 'Static fallback - Contract CMS unavailable' : 'Static contract config',
    loadState: error ? 'error' : 'fallback',
    error
  };
}

async function parseContractCmsResponse(response: Response): Promise<ContractCmsPayload> {
  const text = await response.text();
  let payload: ContractCmsPayload;
  try {
    payload = text ? JSON.parse(text) as ContractCmsPayload : {};
  } catch {
    const preview = text.replace(/\s+/g, ' ').slice(0, 180);
    throw new Error(`Contract CMS returned non-JSON (${response.status}). ${preview || response.statusText}`);
  }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `Contract CMS request failed (${response.status}).`);
  return payload;
}

export function useContractPrograms(): ContractCmsRuntimeData {
  const [runtimeData, setRuntimeData] = useState<ContractCmsRuntimeData>(() => fallbackContracts());

  useEffect(() => {
    let isMounted = true;

    async function loadContracts() {
      try {
        const payload = await parseContractCmsResponse(await fetch('/api/cms-contracts'));
        const contracts = payload.contractPrograms?.length ? payload.contractPrograms : seedContractPrograms();
        if (!isMounted) return;
        setRuntimeData({
          contracts,
          ruleIndex: payload.contractRuleIndex ?? [],
          sourceLabel: payload.source === 'empty-neon' ? 'Seed contracts - click Save to initialize Contract CMS' : 'Neon Contract CMS',
          loadState: payload.source === 'empty-neon' ? 'fallback' : 'neon'
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load Contract CMS.';
        if (isMounted) setRuntimeData(fallbackContracts(message));
      }
    }

    loadContracts();

    return () => {
      isMounted = false;
    };
  }, []);

  return runtimeData;
}

export function useActiveContractPrograms() {
  const data = useContractPrograms();
  return useMemo(() => ({
    ...data,
    contracts: data.contracts.filter((contract) => contract.active && contract.status !== 'retired')
  }), [data]);
}

export async function saveContractPrograms(contractPrograms: ContractProgram[], contractRuleIndex: ContractRuleIndex[]) {
  return parseContractCmsResponse(await fetch('/api/cms-contracts', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractPrograms, contractRuleIndex })
  }));
}
