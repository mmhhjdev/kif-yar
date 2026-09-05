/**
 * DevTools & Source Protection for Kefyar
 * - Detects open DevTools (size check + debugger timing)
 * - Blocks right-click, F12, Ctrl+Shift+I/J/C, Ctrl+U
 * - On detection: redirects to about:blank (user can close tab via history back)
 */

let devtoolsOpen = false;
const threshold = 170;
let checkerId: number | undefined;

function onDetect() {
  if (devtoolsOpen) return;
  devtoolsOpen = true;
  try {
    // Clear app data so sources/storage can't be inspected
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(c => {
      document.cookie = c.split('=')[0].trim() + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
    });
  } catch {}
  window.location.href = 'about:blank';
}

function sizeCheck() {
  const wDiff = window.outerWidth - window.innerWidth > threshold;
  const hDiff = window.outerHeight - window.innerHeight > threshold;
  if ((wDiff || hDiff) && !import.meta.env.DEV) onDetect();
}

export function initDevtoolsProtection(): void {
  if (import.meta.env.DEV) return; // never run in development

  // 1) Size-based detection (polled)
  checkerId = window.setInterval(sizeCheck, 1500);

  // 2) Timing-based detection (debugger statement pauses execution)
  const timingCheck = () => {
    const start = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    if (performance.now() - start > 100) onDetect();
  };
  window.setInterval(timingCheck, 5000);

  // 3) Block context menu and shortcuts
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('keydown', e => {
    if (e.key === 'F12') { e.preventDefault(); onDetect(); return; }
    if (e.ctrlKey && e.shiftKey && ['I','J','C','K','i','j','c','k'].includes(e.key)) { e.preventDefault(); onDetect(); return; }
    if (e.ctrlKey && ['u','U','s','S'].includes(e.key)) e.preventDefault();
  });

  // 4) Detect via console object being opened (toString trick)
  const el = new Image();
  Object.defineProperty(el, 'id', { get() { onDetect(); return 'x'; } });
  window.setInterval(() => { devtoolsOpen = false; console.log(el); console.clear(); }, 3000);
  void checkerId;
}
