export function LabInput({ label, className = "", id, ...rest }) {
  return (
    <label className={`block text-xs font-medium text-slate-600 ${className}`}>
      {label ? <span className="mb-1 block">{label}</span> : null}
      <input
        id={id}
        className="mt-0.5 w-full rounded-lg border border-slate-200/90 bg-white px-2.5 py-2 text-xs text-slate-900 shadow-sm focus:border-lab-blue focus:outline-none focus:ring-2 focus:ring-lab-blue/30"
        {...rest}
      />
    </label>
  );
}
