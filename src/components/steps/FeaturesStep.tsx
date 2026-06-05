import { getAvailableFeatureOptions, getAvailableSeatLayouts, getVisibleFeatureCategories, seatCmsConfig } from '../../data/featureOptionMatrix';
import type { RfqDraft } from '../../types/rfq';

type FeaturesStepProps = {
  draft: RfqDraft;
};

export function FeaturesStep({ draft }: FeaturesStepProps) {
  const categories = getVisibleFeatureCategories(draft.specs);
  const seatLayouts = getAvailableSeatLayouts(draft.specs);

  return (
    <div className="sectionStack">
      {categories.map((category) => {
        if (category.title === 'Seats') {
          return (
            <section className="panel compact" key={category.id}>
              <h2>{category.title}<span className="pill">CMS-managed per model</span></h2>
              <div className="grid two">
                <div>
                  <h3>Seat Layout</h3>
                  <p className="muted">Choose a general seating intent. This is not a final engineering floorplan.</p>
                  <div className="cardGrid three">
                    {seatLayouts.map((layout, index) => (
                      <button key={layout.id} className={index === 0 ? 'miniCard selected' : 'miniCard'}>
                        <strong>{layout.title}</strong>
                        <span>{layout.description}</span>
                        <small>Up to {layout.maxSeats} seats</small>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>Seat Package Details</h3>
                  <div className="featureGrid">
                    <div className="featureChip"><strong>Seat Type</strong><span>{seatCmsConfig.seatTypes[0]}</span></div>
                    <div className="featureChip"><strong>Material</strong><span>{seatCmsConfig.materials[0]}</span></div>
                    <div className="featureChip"><strong>Color</strong><span>{seatCmsConfig.colors[0]}</span></div>
                    <div className="featureChip"><strong>Seat Belts</strong><span>Included</span></div>
                  </div>
                  <p className="note">Reference only - final seating layout will be reviewed and validated by Micro Bird.</p>
                </div>
              </div>
            </section>
          );
        }

        const options = getAvailableFeatureOptions(category.id, draft.specs);
        return (
          <section className="panel compact" key={category.id}>
            <h2>{category.title}<span className="pill">{options.length} available options</span></h2>
            {category.description && <p className="muted">{category.description}</p>}
            <div className="featureGrid">
              {options.map((option) => (
                <div className="featureChip" key={option.id}>
                  <strong>{option.title}</strong>
                  <span>{option.description}</span>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <section className="panel">
        <label className="field">
          <span>Additional Features or Special Requirements</span>
          <textarea placeholder="Describe any extra features, notes, or special instructions for our team..." />
        </label>
      </section>
    </div>
  );
}
