export function LabButton({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-lab-blue focus-visible:ring-offset-1 disabled:opacity-50";
  const variants = {
    primary:
      "bg-lab-blue px-3 py-1.5 text-white shadow-sm hover:bg-lab-blue-dark",
    outline:
      "border border-lab-blue bg-white px-3 py-1.5 text-lab-blue shadow-sm hover:bg-slate-50",
    danger:
      "border border-lab-red bg-lab-red px-3 py-1.5 text-white shadow-sm hover:bg-lab-red-dark",
    ghost: "rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      type={type}
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
