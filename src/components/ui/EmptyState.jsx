export function EmptyState({ icon: Icon, heading, subtext, actions }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && <Icon className="w-16 h-16 text-gray-300 mb-4" />}
      {heading && <h3 className="text-base font-semibold text-gray-700 mb-1">{heading}</h3>}
      {subtext && <p className="text-sm text-gray-500 mb-6 max-w-xs">{subtext}</p>}
      {actions && <div className="flex gap-3 flex-wrap justify-center">{actions}</div>}
    </div>
  );
}
