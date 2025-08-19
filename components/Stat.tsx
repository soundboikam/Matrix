export function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="panel">
      <div className="pad">
        <div className="text-[11px] uppercase tracking-wide muted">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </div>
    </div>
  );
}


