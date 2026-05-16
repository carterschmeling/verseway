/** Shared Verseway logo — open book + path dot (matches public/favicon.svg). */
export function BrandMark({ className = "h-16 w-16", title = "Verseway" }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label={title}>
      <defs>
        <linearGradient id="vw-bg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#vw-bg)" />
      <path fill="#fff" fillOpacity="0.95" d="M32 14c-9 0-16 5-16 11v16c0 3 3 5 7 6 2 1 4 1 9 1s7 0 9-1c4-1 7-3 7-6V25c0-6-7-11-16-11Z" />
      <path fill="#10b981" fillOpacity="0.35" d="M32 14v39c-5 0-9-1-9-1V25c0-6 7-11 9-11Z" />
      <path
        fill="none"
        stroke="#e0e7ff"
        strokeWidth="2"
        strokeLinecap="round"
        d="M22 28h8M22 33h10M22 38h7M42 28h-8M42 33h-10M42 38h-7"
      />
      <path
        fill="none"
        stroke="#c7d2fe"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M36 42c4-3 6-7 6-11s-2-8-6-11"
      />
      <circle cx="42" cy="31" r="2.5" fill="#fef9c3" />
    </svg>
  );
}
