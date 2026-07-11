const TONES = {
  brand: "bg-brand-50 text-brand-700",
  gold: "bg-gold-50 text-gold-600",
  danger: "bg-danger-50 text-danger-500",
  info: "bg-info-50 text-info-500",
  neutral: "bg-ink-900/5 text-ink-700",
};

const Badge = ({ tone = "neutral", className = "", children }) => (
  <span className={`badge ${TONES[tone] || TONES.neutral} ${className}`}>{children}</span>
);

export default Badge;
