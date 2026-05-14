export function PhysicsIllustration() {
  return (
    <div
      className="mt-auto flex w-full max-w-xl shrink-0 justify-center px-4 pb-2 pt-2 sm:pb-4"
      aria-hidden
    >
      <svg
        viewBox="0 0 420 120"
        className="h-[clamp(4.5rem,18vh,7.5rem)] w-full max-w-[min(100%,28rem)]"
        aria-hidden
      >
        <line
          x1="24"
          y1="102"
          x2="396"
          y2="102"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <rect
          x="36"
          y="58"
          width="44"
          height="44"
          rx="4"
          fill="#dbeafe"
          stroke="#1d4ed8"
          strokeWidth="2"
        />

        <path
          d="M86 80 H96 L100 72 L104 88 L108 72 L112 88 L116 72 L120 88 L124 72 L128 88 L132 72 L136 88 L140 72 L144 88 L148 72 L152 88 L156 72 L160 88 L164 72 L168 88 L172 72 L176 88 L180 72 L184 88 L188 72 L192 88 L196 72 L200 80 H210"
          fill="none"
          stroke="#0f172a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="238" cy="78" r="18" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />

        <line
          x1="330"
          y1="38"
          x2="238"
          y2="78"
          stroke="#0f172a"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M286 102 L330 38 L374 102 Z"
          fill="#e2e8f0"
          stroke="#64748b"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
