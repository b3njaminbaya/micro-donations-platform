const TONES = {
  brand: "bg-brand-50 text-brand-600",
  gold: "bg-gold-50 text-gold-600",
  info: "bg-info-50 text-info-500",
};

const StatCard = ({ icon: Icon, label, value, tone = "brand" }) => (
  <div className="card p-6">
    <div className="flex items-center gap-4">
      {Icon && (
        <span
          className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${TONES[tone] || TONES.brand}`}
        >
          <Icon size={20} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-sm text-ink-500 truncate">{label}</p>
        <p className="text-2xl font-display font-semibold text-ink-900 tabular-nums">{value}</p>
      </div>
    </div>
  </div>
);

export default StatCard;
