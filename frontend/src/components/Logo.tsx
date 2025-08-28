export default function Logo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" stroke="url(#g)" strokeWidth="2.5" />
      <path d="M7 12c2.2-3.5 7.8-3.5 10 0" stroke="url(#g)" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="2.5" fill="#2563eb" />
    </svg>
  )
}
