export function Logo({ size = 28 }: { size?: number }) {
  const id = "halo-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <circle cx="14" cy="14" r="13" stroke={`url(#${id})`} strokeWidth="2" />
      <circle cx="14" cy="14" r="5" fill={`url(#${id})`} />
    </svg>
  );
}
