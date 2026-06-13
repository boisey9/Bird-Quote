import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { ChevronDown, ChevronUp, Eye, Info, Plus, CheckCircle2, AlertCircle, Star } from 'lucide-react';
import { useFeatureOptionsCms, type FeatureCategoryCmsRecord, type FeatureContractRule, type FeatureOptionCmsRecord } from '../../hooks/useFeatureOptionsCms';
import type { RfqDraft } from '../../types/rfq';
import { SeatsStep } from './SeatsStep';
import './SeatsModule.css';
import './RfqCleanup.css';

type FeaturesStepProps = { draft: RfqDraft; setDraft: Dispatch<SetStateAction<RfqDraft>> };
type OptionRuleState = { hidden: boolean; required: boolean; recommended: boolean; autoSelect: boolean; requiresDocument: boolean };

function sortByOrder<T extends { sortOrder: number }>(items: T[]) { return [...items].sort((a, b) => a.sortOrder - b.sortOrder); }
function scopeMatches(ruleValue: string, selectedValue: string) { return ruleValue === 'any' || !ruleValue || ruleValue === selectedValue; }
function ruleMatchesDraft(rule: FeatureContractRule, draft: RfqDraft) {
  return rule.active
    && scopeMatches(rule.contractId, draft.company.contractId)
    && scopeMatches(rule.chassisId, draft.specs.chassis)
    && scopeMatches(rule.certificationId, draft.specs.certification)
    && scopeMatches(rule.wheelbaseId, draft.specs.wheelbase)
    && scopeMatches(rule.busTypeId, draft.specs.busType);
}
function getOptionRuleState(option: FeatureOptionCmsRecord, categoryId: number, rules: FeatureContractRule[]): OptionRuleState {
  const matchingRules = rules.filter((rule) => (rule.categoryId === null || rule.categoryId === categoryId) && (rule.optionId === null || rule.optionId === option.id));
  return { hidden: matchingRules.some((rule) => rule.ruleType === 'hidden'), required: matchingRules.some((rule) => rule.ruleType === 'required'), recommended: matchingRules.some((rule) => rule.ruleType === 'recommended'), autoSelect: matchingRules.some((rule) => rule.autoSelect), requiresDocument: Boolean(option.requiresDocument) || matchingRules.some((rule) => rule.requiresDocument) };
}
function getOptionImageUrl(option: FeatureOptionCmsRecord) { if (option.imageUrl) return option.imageUrl; if (option.imageExt) return `/images/options/${option.imageExt}`; return ''; }

function FeatureOptionCard({ option, selected, state, onClick }: { option: FeatureOptionCmsRecord; selected: boolean; state: OptionRuleState; onClick: () => void }) {
  const imageUrl = getOptionImageUrl(option);
  return <button type="button" className={selected ? 'featureOptionCard selected' : 'featureOptionCard'} onClick={onClick}><span className="optionIcon">{selected ? <CheckCircle2 size={16} /> : <Plus size={16} />}</span>{imageUrl && <span className="featureOptionImage"><img src={imageUrl} alt="" /></span>}<strong>{option.title}</strong><small>{option.description}</small><span className="featureOptionBadges">{state.required && <em className="required"><AlertCircle size={13} /> Required</em>}{state.recommended && <em className="recommended"><Star size={13} /> Recommended</em>}{state.requiresDocument && <em>Document</em>}</span></button>;
}

export function FeaturesStep({ draft, setDraft }: FeaturesStepProps) {
  const featureCms = useFeatureOptionsCms();
  const cmsData = featureCms.data;
  const activeRules = useMemo(() => cmsData.contractRules.filter((rule) => ruleMatchesDraft(rule, draft)), [cmsData.contractRules, draft]);
  const hiddenCategoryIds = useMemo(() => new Set(activeRules.filter((rule) => rule.ruleType === 'hidden' && rule.categoryId !== null && rule.optionId === null).map((rule) => rule.categoryId as number)), [activeRules]);
  const categories = useMemo(() => sortByOrder(cmsData.categories.filter((category) => category.active && category.customerVisible !== false && category.status !== 'retired' && category.title !== 'Seats' && category.title !== 'Layout' && !hiddenCategoryIds.has(category.id))), [cmsData.categories, hiddenCategoryIds]);
  const optionFeatures = useMemo(() => draft.features.filter((feature) => feature.category !== 'Seats' && feature.category !== 'Layout'), [draft.features]);
  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>({});
  const [showQuickSummary, setShowQuickSummary] = useState(false);

  useEffect(() => { setOpenCategories((current) => { const next = { ...current }; categories.forEach((category) => { if (next[category.id] === undefined) next[category.id] = category.sortOrder <= 4; }); return next; }); }, [categories]);
  const selectedFeatureKeys = useMemo(() => new Set(optionFeatures.map((feature) => `${feature.category}-${feature.label}`)), [optionFeatures]);

  const optionsByCategory = useMemo(() => {
    const result = new Map<number, FeatureOptionCmsRecord[]>();
    categories.forEach((category: FeatureCategoryCmsRecord) => {
      const options = sortByOrder(cmsData.options.filter((option) => { if (!option.active || option.status === 'retired' || option.categoryId !== category.id) return false; const state = getOptionRuleState(option, category.id, activeRules); return !state.hidden; }));
      result.set(category.id, options);
    });
    return result;
  }, [activeRules, categories, cmsData.options]);

  useEffect(() => {
    const autoSelectedOptions: { category: string; label: string; value: string }[] = [];
    categories.forEach((category) => { const options = optionsByCategory.get(category.id) ?? []; options.forEach((option) => { const state = getOptionRuleState(option, category.id, activeRules); if (state.autoSelect && !selectedFeatureKeys.has(`${category.title}-${option.title}`)) autoSelectedOptions.push({ category: category.title, label: option.title, value: option.description }); }); });
    if (autoSelectedOptions.length === 0) return;
    setDraft((current) => ({ ...current, features: [...current.features, ...autoSelectedOptions] }));
  }, [activeRules, categories, optionsByCategory, selectedFeatureKeys, setDraft]);

  const toggleCategory = (categoryId: number) => setOpenCategories((current) => ({ ...current, [categoryId]: !current[categoryId] }));
  const toggleFeature = (categoryTitle: string, option: FeatureOptionCmsRecord) => { const key = `${categoryTitle}-${option.title}`; setDraft((current) => { const alreadySelected = current.features.some((feature) => `${feature.category}-${feature.label}` === key); return { ...current, features: alreadySelected ? current.features.filter((feature) => `${feature.category}-${feature.label}` !== key) : [...current.features, { category: categoryTitle, label: option.title, value: option.description }] }; }); };

  return (
    <div className="sectionStack featuresPage seatsAndOptionsPage">
      <section className="panel compact seatsOptionsIntroPanel"><div className="featureSectionHeader dealerSectionHeader"><div><h2>Seats & Options</h2><p>Start with the seating intent, then add options and packages. This is RFQ intake only — Micro Bird validates the final layout and quote details.</p></div><span className="pill">Reference intake</span></div></section>
      <SeatsStep draft={draft} setDraft={setDraft} />
      <section className="panel compact optionsIntroPanel mergedOptionsIntro"><div className="featureSectionHeader dealerSectionHeader"><div><h2>Options & Packages</h2><p>Select the customer-facing options that should be reviewed for this quote. Special or unusual requirements can be added in the notes below.</p>{featureCms.loadState === 'error' && <small className="cmsFallbackNote">Feature Options CMS unavailable. Showing static fallback options.</small>}<small className="cmsFallbackNote">Rules currently match: {draft.company.contractId || 'any'} • {draft.specs.chassis || 'any'} • {draft.specs.wheelbase || 'any'} • {draft.specs.busType || 'any'}</small></div><span className="pill">{optionFeatures.length} selected</span></div></section>
      {categories.map((category) => { const options = optionsByCategory.get(category.id) ?? []; const isOpen = openCategories[category.id] ?? false; const selectedCount = options.filter((option) => selectedFeatureKeys.has(`${category.title}-${option.title}`)).length; const requiredCount = options.filter((option) => getOptionRuleState(option, category.id, activeRules).required).length; return <section className={isOpen ? 'panel compact optionAccordion open' : 'panel compact optionAccordion'} key={category.id}><button type="button" className="accordionHeader" onClick={() => toggleCategory(category.id)}><div><strong>{category.title}</strong><small>{category.description}</small></div><span className="pill">{selectedCount} selected / {options.length} available{requiredCount ? ` • ${requiredCount} required` : ''}</span>{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>{isOpen && <div className="featureOptionGrid compactOptionGrid">{options.map((option) => { const state = getOptionRuleState(option, category.id, activeRules); return <FeatureOptionCard key={option.id} option={option} state={state} selected={selectedFeatureKeys.has(`${category.title}-${option.title}`)} onClick={() => toggleFeature(category.title, option)} />; })}</div>}</section>; })}
      <section className="panel quickSummaryPanel"><div className="quickSummaryHeader"><div><CheckCircle2 size={24} /><strong>Your Selected Options</strong><span>Quick summary of current option selections</span></div><button type="button" onClick={() => setShowQuickSummary((current) => !current)}><Eye size={16} /> {showQuickSummary ? 'Hide Summary' : 'View Summary'}</button></div><div className="summaryChips"><span>{draft.specs.chassis}</span><span>{draft.specs.wheelbase}</span><span>{draft.specs.busType}</span><span>{optionFeatures.length} options</span></div>{showQuickSummary && <div className="expandedOptionSummary">{optionFeatures.length === 0 ? <p>No extra options selected yet.</p> : optionFeatures.map((feature) => <p key={`${feature.category}-${feature.label}`}><strong>{feature.category}</strong><span>{feature.label}</span></p>)}</div>}</section>
      <section className="panel additionalRequirementsPanel"><label className="field"><span><Info size={16} /> Additional Option / Seating Requirements</span><textarea placeholder="Describe any extra seating needs, bid notes, deadlines, document references, or special option instructions for our team..." /></label></section>
    </div>
  );
}
