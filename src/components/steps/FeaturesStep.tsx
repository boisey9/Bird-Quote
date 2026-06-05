import { featureCategories } from '../../data/rfqData';

export function FeaturesStep() {
  return (
    <div className="sectionStack">
      {featureCategories.map((category, index) => (
        <section className="panel compact" key={category.id}>
          <h2>{category.name}<span className="pill">{category.options.length} options selected</span></h2>
          <div className="featureGrid">
            {category.options.map((option) => (
              <div className="featureChip" key={option.label + option.value}>
                <strong>{option.label}</strong>
                <span>{option.value}</span>
              </div>
            ))}
          </div>
          {index === 0 && <p className="note">Reference only - final seating layout will be reviewed and validated by Micro Bird.</p>}
        </section>
      ))}
      <section className="panel">
        <label className="field">
          <span>Additional Features or Special Requirements</span>
          <textarea placeholder="Describe any extra features, notes, or special instructions for our team..." />
        </label>
      </section>
    </div>
  );
}
