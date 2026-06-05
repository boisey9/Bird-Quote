import { featureCategories } from '../../data/rfqData';

export function FeaturesStep() {
  return (
    <div className="sectionStack">
      {featureCategories.map((category) => (
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
        </section>
      ))}
    </div>
  );
}
