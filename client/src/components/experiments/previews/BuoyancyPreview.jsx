export function BuoyancyPreview({ className = "" }) {
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
        d="M40 118 Q80 108 120 112 T200 110 T280 115 L280 175 L40 175 Z"
        fill="rgba(30,144,255,0.35)"
        stroke="rgba(30,144,255,0.55)"
        strokeWidth="1.5"
      />
      <rect
        x="124"
        y="72"
        width="72"
        height="56"
        rx="3"
        fill="#94a3b8"
        stroke="#475569"
        strokeWidth="2"
      />
      <line
        x1="160"
        y1="72"
        x2="160"
        y2="38"
        stroke="#22c55e"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <polygon points="160,32 154,42 166,42" fill="#22c55e" />
      <text
        x="172"
        y="48"
        fill="#15803d"
        fontSize="11"
        fontWeight="600"
        fontFamily="system-ui"
      >
        F
        <tspan baselineShift="sub" fontSize="9">
          buoyancy
        </tspan>
      </text>
      <line
        x1="160"
        y1="128"
        x2="160"
        y2="158"
        stroke="#FF3B30"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <polygon points="160,164 154,154 166,154" fill="#FF3B30" />
      <text
        x="168"
        y="152"
        fill="#b91c1c"
        fontSize="11"
        fontWeight="600"
        fontFamily="system-ui"
      >
        W (Weight)
      </text>
    </svg>
  );
}
