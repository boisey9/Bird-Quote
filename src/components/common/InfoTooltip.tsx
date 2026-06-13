type InfoTooltipProps = {
  label: string;
  text: string;
};

export function InfoTooltip({ label, text }: InfoTooltipProps) {
  return (
    <span className="infoTooltip" tabIndex={0} aria-label={`${label}: ${text}`}>
      <span aria-hidden="true">?</span>
      <em>{text}</em>
    </span>
  );
}
