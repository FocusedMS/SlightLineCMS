export default function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-slate-800 ${className}`} />
}
