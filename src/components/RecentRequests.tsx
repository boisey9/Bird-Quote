import { ChevronRight, Clock } from 'lucide-react';

const recentRequests = [
  ['R-2024-0456', 'Submitted', 'May 9, 2024 • Hotel & Resort'],
  ['R-2024-0432', 'In Review', 'May 6, 2024 • Commercial Bus'],
  ['R-2024-0411', 'Quote Sent', 'Apr 30, 2024 • Special Needs'],
  ['R-2024-0387', 'Submitted', 'Apr 25, 2024 • Airport Shuttle'],
  ['R-2024-0355', 'In Review', 'Apr 20, 2024 • Church & Community']
];

export function RecentRequests() {
  return (
    <aside className="recent">
      <h3><Clock size={18} /> Recent Requests</h3>
      {recentRequests.map(([id, status, details]) => (
        <div className="recentItem" key={id}>
          <strong>{id}</strong>
          <span>{status}</span>
          <small>{details}</small>
        </div>
      ))}
      <button>View all requests <ChevronRight size={16} /></button>
    </aside>
  );
}
