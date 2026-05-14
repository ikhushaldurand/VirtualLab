export function ElectricFieldPreview({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="320" height="180" fill="#f4f4f5" />
      <path
        d="M90 90 C120 50 200 50 230 90 C200 130 120 130 90 90"
        stroke="#FF3B30"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrR)"
      />
      <path
        d="M90 90 C120 70 200 70 230 90"
        stroke="#FF3B30"
        strokeWidth="1.5"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M90 90 C120 110 200 110 230 90"
        stroke="#FF3B30"
        strokeWidth="1.5"
        fill="none"
        opacity="0.85"
      />
      <defs>
        <marker
          id="arrR"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#FF3B30" />
        </marker>
      </defs>
      <circle cx="90" cy="90" r="22" fill="#FF3B30" stroke="#b91c1c" strokeWidth="2" />
      <text
        x="90"
        y="96"
        textAnchor="middle"
        fill="white"
        fontSize="18"
        fontWeight="700"
        fontFamily="system-ui"
      >
        +
      </text>
      <circle cx="230" cy="90" r="22" fill="#1E90FF" stroke="#187bcd" strokeWidth="2" />
      <text
        x="230"
        y="96"
        textAnchor="middle"
        fill="white"
        fontSize="22"
        fontWeight="700"
        fontFamily="system-ui"
      >
        −
      </text>
    </svg>
  );
}
