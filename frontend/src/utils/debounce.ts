// Strongly-typed debounce with cancel()
type Debounced<T extends (...args: any[]) => void> = ((
  ...args: Parameters<T>
) => void) & { cancel: () => void };

export default function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait = 300
): Debounced<T> {
  let t: number | undefined;

  const wrapped = ((...args: Parameters<T>) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  }) as Debounced<T>;

  wrapped.cancel = () => {
    if (t) window.clearTimeout(t);
  };

  return wrapped;
}
