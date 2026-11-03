import { useEffect, useState } from 'react';

const isDark = (): boolean =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

/** Whether the app is in dark mode: the `dark` class on <html>, kept up to date. */
export function useDarkMode(): boolean {
  const [dark, setDark] = useState(isDark);
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(isDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setDark(isDark());
    return () => observer.disconnect();
  }, []);
  return dark;
}
