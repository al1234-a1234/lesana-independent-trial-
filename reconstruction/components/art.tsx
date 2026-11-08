export function Art({ theme }: { theme: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 190"
      className={`story-art art-${theme}`}
    >
      <circle cx="326" cy="47" r="25" fill="var(--sun)" />
      <path d="M0 150Q100 95 200 145T400 135V190H0Z" fill="var(--hill)" />
      {theme === "train" ? (
        <>
          <path d="M0 171H400" stroke="#294a57" strokeWidth="4" />
          <rect x="58" y="66" width="240" height="93" rx="25" fill="#f8f4df" />
          <path d="M280 66h16q25 8 28 40v53h-44Z" fill="#d87955" />
          {[80, 132, 184, 236].map((x) => (
            <rect
              key={x}
              x={x}
              y="84"
              width="34"
              height="32"
              rx="7"
              fill="#79a4ac"
            />
          ))}
          <path d="M59 134H280" stroke="#d87955" strokeWidth="8" />
          <circle cx="108" cy="162" r="14" fill="#294a57" />
          <circle cx="270" cy="162" r="14" fill="#294a57" />
        </>
      ) : theme === "garden" ? (
        <>
          <path d="M58 156h277v34H58z" fill="#d9ad7b" />
          {[88, 170, 250].map((x, i) => (
            <g key={x}>
              <path
                d={`M${x} 124h52l-7 40h-38Z`}
                fill={i === 1 ? "#c8795e" : "#eee1bd"}
              />
              <path d={`M${x + 26} 126V63`} stroke="#315e47" strokeWidth="5" />
              <ellipse
                cx={x + 10}
                cy="78"
                rx="22"
                ry="10"
                fill="#597e50"
                transform={`rotate(35 ${x + 10} 78)`}
              />
              <ellipse
                cx={x + 41}
                cy="94"
                rx="22"
                ry="11"
                fill="#7d9d60"
                transform={`rotate(-35 ${x + 41} 94)`}
              />
            </g>
          ))}
        </>
      ) : (
        <>
          <rect x="65" y="36" width="114" height="115" rx="6" fill="#f5e1bd" />
          <rect x="75" y="46" width="94" height="95" fill="#7a95a0" />
          <circle cx="122" cy="78" r="18" fill="#e9af74" />
          <path d="m75 141 39-38 30 22 25-13v29Z" fill="#375d69" />
          <path
            d="m226 168 28-126 32 126M237 119h44"
            stroke="#5e4e4c"
            strokeWidth="8"
            fill="none"
          />
          <rect x="219" y="54" width="84" height="79" rx="5" fill="#f1d8b7" />
          <path
            d="m232 119 12-39 22 30 23-13"
            stroke="#c97b68"
            strokeWidth="12"
            fill="none"
          />
        </>
      )}
    </svg>
  );
}
