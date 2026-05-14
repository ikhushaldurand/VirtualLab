export function AtomLogo({ className = "h-9 w-9 md:h-10 md:w-10" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse
        cx="20"
        cy="20"
        rx="14"
        ry="6"
        stroke="#2563eb"
        strokeWidth="1.6"
      />
      <ellipse
        cx="20"
        cy="20"
        rx="6"
        ry="14"
        stroke="#2563eb"
        strokeWidth="1.6"
        transform="rotate(60 20 20)"
      />
      <ellipse
        cx="20"
        cy="20"
        rx="6"
        ry="14"
        stroke="#2563eb"
        strokeWidth="1.6"
        transform="rotate(-60 20 20)"
      />
      <circle cx="20" cy="20" r="3" fill="#dc2626" />
    </svg>
  );
}
