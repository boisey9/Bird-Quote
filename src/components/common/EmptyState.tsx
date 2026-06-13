type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="emptyStateCard" role="status">
      <div className="emptyStateIcon" aria-hidden="true">∅</div>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
        {actionLabel && onAction && <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>{actionLabel}</button>}
      </div>
    </div>
  );
}
