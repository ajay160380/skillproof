export type Status = 'pending' | 'processing' | 'completed' | 'failed' | 'not-started';

export function StatusPill({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    'not-started': 'border-structure text-data',
    'pending': 'border-structure text-data',
    'processing': 'border-verification text-verification',
    'completed': 'bg-verification text-vellum border-verification',
    'failed': 'border-seal text-seal',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 border text-[10px] font-mono uppercase tracking-wider ${styles[status]}`}>
      {status.replace('-', ' ')}
    </span>
  );
}
