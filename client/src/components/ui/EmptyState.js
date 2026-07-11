const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    {Icon && (
      <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-ink-900/5 text-ink-300 mb-4">
        <Icon size={26} />
      </span>
    )}
    <h3 className="text-lg font-display font-semibold text-ink-900 mb-1">{title}</h3>
    {description && <p className="text-ink-500 max-w-sm mb-5">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
