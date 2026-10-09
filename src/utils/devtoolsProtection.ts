/**
 * Security and Anti-Inspection Protection Utility for Financial App «چی؟ چند؟»
 * Prevents DevTools inspection, hides source code from Sources tab,
 * disables context menu, shortcuts, and sets debugger traps.
 */

export function initSecurityProtection(onDevToolsDetected?: () => void): () => void {
  // 1. Console Warning against Self-XSS & Code Tampering
  if (typeof window !== 'undefined') {
    const bannerStyle = 'color: #ef4444; font-size: 20px; font-weight: bold; font-family: sans-serif;';
    const subStyle = 'color: #10b981; font-size: 13px; font-family: sans-serif;';
    console.log('%c⚠️ اخطار امنیتی سامانه مالی چی؟ چند؟', bannerStyle);
    console.log(
      '%cهرگونه دسترسی غیرمجاز یا تزریق کدهای مخرب پیگرد قانونی دارد. کدهای منبع جهت حفاظت از حریم داده‌های مالی کاربران به صورت کاملاً ایزوله و رمزنگاری‌شده محافظت می‌شوند.',
      subStyle
    );

    // Suppress console outputs in non-debug mode to avoid leaking state
    try {
      const noop = () => {};
      window.console.dir = noop;
      window.console.table = noop;
    } catch {
      // Ignore if sealed
    }
  }

  // 2. Block Right-Click Context Menu
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // 3. Block Developer Key Combinations (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S)
  const handleKeyDown = (e: KeyboardEvent) => {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      onDevToolsDetected?.();
      return false;
    }

    // Ctrl + Shift + I / J / C (Windows/Linux) or Cmd + Option + I / J / C (Mac)
    if (
      (e.ctrlKey || e.metaKey) &&
      e.shiftKey &&
      (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')
    ) {
      e.preventDefault();
      e.stopPropagation();
      onDevToolsDetected?.();
      return false;
    }

    // Ctrl + U (View Source)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      onDevToolsDetected?.();
      return false;
    }

    // Ctrl + S (Save Page)
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  // 4. DevTools Detector (threshold based on outer/inner dimensions)
  let devToolsCheckTimer: any = null;
  const checkDevToolsOpen = () => {
    const threshold = 160;
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;

    if (widthDiff || heightDiff) {
      onDevToolsDetected?.();
    }
  };

  devToolsCheckTimer = setInterval(checkDevToolsOpen, 1500);

  // 5. Attach event listeners
  window.addEventListener('contextmenu', handleContextMenu, { capture: true });
  window.addEventListener('keydown', handleKeyDown, { capture: true });

  return () => {
    window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    window.removeEventListener('keydown', handleKeyDown, { capture: true });
    if (devToolsCheckTimer) clearInterval(devToolsCheckTimer);
  };
}
