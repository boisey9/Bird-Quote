import type { ReactNode } from 'react';

type TablePanelProps = {
  title: string;
  description?: string;
  helper?: ReactNode;
  children: ReactNode;
};

export function TablePanel({ title, description, helper, children }: TablePanelProps) {
  return (
    <section className="panel tablePanelRoot">
      <div className="tablePanelHeader">
        <div>
          <h2>{title}</h2>
          {description && <p className="muted">{description}</p>}
        </div>
        {helper}
      </div>
      <div className="tablePanelScroll">{children}</div>
    </section>
  );
}
