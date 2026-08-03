export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo" aria-label="Signalbrief">
      <span className="logo-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {!compact && <span>signalbrief</span>}
    </div>
  );
}
