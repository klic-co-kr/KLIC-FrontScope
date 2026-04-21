// src/content/recording/countdown.ts
// 3-second countdown overlay before recording starts

export function showCountdown(seconds = 3): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '2147483647',
      pointerEvents: 'none',
    });

    const numberEl = document.createElement('div');
    Object.assign(numberEl.style, {
      fontSize: '120px',
      fontWeight: '700',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textShadow: '0 4px 20px rgba(0,0,0,0.4)',
      transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
    });

    overlay.appendChild(numberEl);
    document.body.appendChild(overlay);

    let count = seconds;

    const tick = () => {
      if (count <= 0) {
        // Synchronously remove before resolving (M5 — prevent first-frame ghosting)
        overlay.remove();
        resolve();
        return;
      }

      numberEl.textContent = String(count);
      numberEl.style.transform = 'scale(1.2)';
      numberEl.style.opacity = '1';

      requestAnimationFrame(() => {
        numberEl.style.transform = 'scale(1)';
      });

      // Fade out near end of each second
      setTimeout(() => {
        numberEl.style.opacity = '0.3';
      }, 700);

      count--;
      setTimeout(tick, 1000);
    };

    tick();
  });
}
