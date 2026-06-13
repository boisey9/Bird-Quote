type StatusBadgeProps = {
  status: string;
  detail?: string;
  className?: string;
};

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

function toneForStatus(status: string): BadgeTone {
  const value = status.toLowerCase();
  if (value.includes('past') || value.includes('over') || value.includes('lost') || value.includes('cancel')) return 'danger';
  if (value.includes('risk') || value.includes('watch') || value.includes('missing') || value.includes('required')) return 'warning';
  if (value.includes('sent') || value.includes('converted') || value.includes('complete') || value.includes('track') || value.includes('ok')) return 'success';
  if (value.includes('review') || value.includes('progress') || value.includes('assigned') || value.includes('submitted')) return 'info';
  return 'neutral';
}

function iconForTone(tone: BadgeTone) {
  if (tone === 'success') return '✓';
  if (tone === 'warning') return '⚠';
  if (tone === 'danger') return '!';
  if (tone === 'info') return '●';
  return '•';
}

export function StatusBadge({ status, detail, className = '' }: StatusBadgeProps) {
  const tone = toneForStatus(status);
  return (
    <span className={`statusBadge statusBadge-${tone} ${className}`.trim()} aria-label={detail ? `${status}: ${detail}` : status}>
      <i aria-hidden="true">{iconForTone(tone)}</i>
      <span>{status}</span>
      {detail && <small>{detail}</small>}
    </span>
  );
}
