const ProgressBar = ({ value, className = "" }) => {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className={`w-full bg-ink-900/10 rounded-full h-2.5 overflow-hidden ${className}`}>
      <div
        className="bg-brand-500 h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

export default ProgressBar;
