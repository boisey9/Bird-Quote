import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { ChevronDown, ChevronUp, Eye, Info, Plus, CheckCircle2 } from 'lucide-react';
import { getAvailableFeatureOptions, getVisibleFeatureCategories } from '../../data/featureOptionMatrix';
import type { FeatureOptionItem, RfqDraft } from '../../types/rfq';
import { SeatsStep } from './SeatsStep';
import './SeatsModule.css';
import './RfqCleanup.css';

type FeaturesStepProps = {
  draft: RfqDraft;
  setDraft: Dispatch<SetStateAction<RfqDraft>>;
};

function FeatureOptionCard({ option, selected, onClick }: { option: FeatureOptionItem; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={selected ? 'featureOptionCard selected' : 'featureOptionCard'} onClick={onClick}>
      <span className="optionIcon">{selected ? <CheckCircle2 size={16} /> : <Plus size={16} />}</span>
      <strong>{option.title}</strong>
      <small>{option.description}</small>
    </button>
  );
}

export function FeaturesStep({ draft, setDraft }: FeaturesStepProps) {
  const categories = getVisibleFeatureCategories(draft.specs).filter((category) => category.title !== 'Seats' && category.title !== 'Layout');
  const optionFeatures = useMemo(() => draft.features.filter((feature) => feature.category !== 'Seats' && feature.category !== 'Layout'), [draft.features]);
  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>(() => Object.fromEntries(categories.map((category) => [category.id, category.sortOrder <= 4])));
  const [showQuickSummary, setShowQuickSummary] = useState(false);

  const selectedFeatureKeys = useMemo(() => new Set(optionFeatures.map((feature) => `${feature.category}-${feature.label}`)), [optionFeatures]);

  const toggleCategory = (categoryId: number) => {
    setOpenCategories((current) => ({ ...current, [categoryId]: !current[categoryId] }));
  };

  const toggleFeature = (categoryTitle: string, option: FeatureOptionItem) => {
    const key = `${categoryTitle}-${option.title}`;
    setDraft((current) => {
      const alreadySelected = current.features.some((feature) => `${feature.category}-${feature.label}` === key);
      return {
        ...current,
        features: alreadySelected
          ? current.features.filter((feature) => `${feature.category}-${feature.label}` !== key)
          : [...current.features, { category: categoryTitle, label: option.title, value: option.description }]
      };
    });
  };

  return (
    <div className="sectionStack featuresPage seatsAndOptionsPage">
      <section className="panel compact seatsOptionsIntroPanel">
        <div className="featureSectionHeader dealerSectionHeader">
          <div>
            <h2>Seats & Options</h2>
            <p>Start with the seating intent, then add options and packages. This is RFQ intake only — Micro Bird validates the final layout and quote details.</p>
          </div>
          <span className="pill">Reference intake</span>
        </div>
      </section>

      <SeatsStep draft={draft} setDraft={setDraft} />

      <section className="panel compact optionsIntroPanel mergedOptionsIntro">
        <div className="featureSectionHeader dealerSectionHeader">
          <div>
            <h2>Options & Packages</h2>
            <p>Select the customer-facing options that should be reviewed for this quote. Special or unusual requirements can be added in the notes below.</p>
          </div>
          <span className="pill">{optionFeatures.length} selected</span>
        </div>
      </section>

      {categories.map((category) => {
        const options = getAvailableFeatureOptions(category.id);
        const isOpen = openCategories[category.id] ?? false;
        const selectedCount = options.filter((option) => selectedFeatureKeys.has(`${category.title}-${option.title}`)).length;

        return (
          <section className={isOpen ? 'panel compact optionAccordion open' : 'panel compact optionAccordion'} key={category.id}>
            <button type="button" className="accordionHeader" onClick={() => toggleCategory(category.id)}>
              <div>
                <strong>{category.title}</strong>
                <small>{category.description}</small>
              </div>
              <span className="pill">{selectedCount} selected / {options.length} available</span>
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isOpen && (
              <div className="featureOptionGrid compactOptionGrid">
                {options.map((option) => (
                  <FeatureOptionCard key={option.id} option={option} selected={selectedFeatureKeys.has(`${category.title}-${option.title}`)} onClick={() => toggleFeature(category.title, option)} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <section className="panel quickSummaryPanel">
        <div className="quickSummaryHeader">
          <div><CheckCircle2 size={24} /><strong>Your Selected Options</strong><span>Quick summary of current option selections</span></div>
          <button type="button" onClick={() => setShowQuickSummary((current) => !current)}><Eye size={16} /> {showQuickSummary ? 'Hide Summary' : 'View Summary'}</button>
        </div>
        <div className="summaryChips">
          <span>{draft.specs.chassis}</span><span>{draft.specs.wheelbase}</span><span>{draft.specs.busType}</span><span>{optionFeatures.length} options</span>
        </div>
        {showQuickSummary && (
          <div className="expandedOptionSummary">
            {optionFeatures.length === 0 ? <p>No extra options selected yet.</p> : optionFeatures.map((feature) => <p key={`${feature.category}-${feature.label}`}><strong>{feature.category}</strong><span>{feature.label}</span></p>)}
          </div>
        )}
      </section>

      <section className="panel additionalRequirementsPanel">
        <label className="field">
          <span><Info size={16} /> Additional Option / Seating Requirements</span>
          <textarea placeholder="Describe any extra seating needs, bid notes, deadlines, document references, or special option instructions for our team..." />
        </label>
      </section>
    </div>
  );
}
