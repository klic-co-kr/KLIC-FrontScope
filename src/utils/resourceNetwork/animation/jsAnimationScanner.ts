/**
 * JS Animation Scanner
 *
 * JavaScript 기반 애니메이션 감지 기능 제공
 */

import { JSAnimation } from '../../../types/resourceNetwork';

/**
 * RAF (RequestAnimationFrame) 모니터링 상태
 */
interface RAFMonitor {
  isActive: boolean;
  frameCount: number;
  startTime: number;
  callbacks: Set<FrameRequestCallback>;
  originalRAF: typeof requestAnimationFrame;
}

const rafMonitor: RAFMonitor = {
  isActive: false,
  frameCount: 0,
  startTime: 0,
  callbacks: new Set(),
  originalRAF: window.requestAnimationFrame.bind(window),
};

/**
 * requestAnimationFrame 사용 감지
 */
export function detectRAFUsage(): JSAnimation[] {
  const animations: JSAnimation[] = [];

  if (rafMonitor.isActive) {
    return animations; // 이미 모니터링 중
  }

  // Monkey patch로 감지 시작
  rafMonitor.isActive = true;
  rafMonitor.frameCount = 0;
  rafMonitor.startTime = Date.now();

  window.requestAnimationFrame = function (callback: FrameRequestCallback) {
    rafMonitor.frameCount++;
    rafMonitor.callbacks.add(callback);
    return rafMonitor.originalRAF.call(window, callback);
  };

  // 1초 후 측정 완료
  setTimeout(() => {
    const elapsed = Date.now() - rafMonitor.startTime;
    const estimatedFPS = Math.round(
      (rafMonitor.frameCount / elapsed) * 1000
    );

    if (rafMonitor.frameCount > 0) {
      animations.push({
        id: `raf-${Date.now()}`,
        type: 'js',
        library: 'requestAnimationFrame',
        frameCount: rafMonitor.frameCount,
        estimatedFPS,
        affectsPerformance:
          estimatedFPS < 30 ? 'high' : estimatedFPS < 50 ? 'medium' : 'low',
      });
    }

    // 모니터링 종료
    rafMonitor.isActive = false;
  }, 1000);

  return animations;
}

/**
 * RAF 모니터링 중지
 */
export function stopRAFMonitoring(): void {
  if (rafMonitor.isActive) {
    window.requestAnimationFrame = rafMonitor.originalRAF;
    rafMonitor.isActive = false;
    rafMonitor.frameCount = 0;
    rafMonitor.callbacks.clear();
  }
}

/**
 * 현재 RAF 사용량 가져오기
 */
export function getCurrentRAFStats(): {
  frameCount: number;
  callbackCount: number;
  estimatedFPS: number;
} | null {
  if (!rafMonitor.isActive) return null;

  const elapsed = Date.now() - rafMonitor.startTime;
  const estimatedFPS = elapsed > 0 ? Math.round((rafMonitor.frameCount / elapsed) * 1000) : 0;

  return {
    frameCount: rafMonitor.frameCount,
    callbackCount: rafMonitor.callbacks.size,
    estimatedFPS,
  };
}

/**
 * Web Animation API 사용 감지
 */
export function detectWebAnimations(): JSAnimation[] {
  const animations: JSAnimation[] = [];
  const detectedAnimations = new Map<string, Animation>();

  // Element.animate() 사용 감지
  const originalAnimate = Element.prototype.animate;

  Element.prototype.animate = function (
    keyframes: Keyframe[] | PropertyIndexedKeyframes,
    options?: number | KeyframeAnimationOptions
  ): Animation {
    const animation = originalAnimate.apply(this, [keyframes, options]);

    const id = `wa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    detectedAnimations.set(id, animation);

    // 애니메이션 목록에 추가
    animations.push({
      id,
      type: 'js',
      library: 'web-animation',
      frameCount: 0,
      estimatedFPS: 60, // 기본값
      affectsPerformance: 'low',
    });

    // 애니메이션이 종료되면 목록에서 제거
    animation.finished.then(() => {
      detectedAnimations.delete(id);
    });

    return animation;
  };

  return animations;
}

/**
 * 현재 실행 중인 Web Animation API 애니메이션 가져오기
 */
export function getActiveWebAnimations(): Animation[] {
  return document.getAnimations();
}

/**
 * 애니메이션 라이브러리 감지
 */
export function detectAnimationLibraries(): string[] {
  const detected: string[] = [];
  const win = window as { gsap?: { version?: string }; TweenMax?: unknown; TweenLite?: unknown; TimelineMax?: unknown; TimelineLite?: unknown; anime?: { version?: string }; Velocity?: unknown; velocity?: unknown; mo?: unknown; Mo?: unknown; lottie?: { version?: string }; THREE?: { REVISION?: string }; PIXI?: { VERSION?: string }; BABYLON?: unknown; Animejs?: unknown; animejs?: unknown; framerMotion?: unknown; motion?: unknown; ReactSpring?: unknown; popmotion?: unknown; pose?: unknown };

  // GSAP (GreenSock)
  if (
    win.gsap ||
    win.TweenMax ||
    win.TweenLite ||
    win.TimelineMax ||
    win.TimelineLite
  ) {
    detected.push('gsap');
  }

  // Anime.js
  if (win.anime) {
    detected.push('animejs');
  }

  // Velocity.js
  if (win.Velocity || win.velocity) {
    detected.push('velocity');
  }

  // Mo.js
  if (win.mo || win.Mo) {
    detected.push('mojs');
  }

  // Lottie
  if (win.lottie || (window as unknown as { bodymovin?: unknown }).bodymovin) {
    detected.push('lottie');
  }

  // Three.js (3D 애니메이션)
  if (win.THREE) {
    detected.push('three');
  }

  // Pixi.js
  if (win.PIXI) {
    detected.push('pixi');
  }

  // Babylon.js
  if (win.BABYLON) {
    detected.push('babylon');
  }

  // Anime.js (다른 네임스페이스)
  if (win.Animejs || win.animejs) {
    detected.push('animejs');
  }

  // Framer Motion (React)
  if (win.framerMotion || win.motion) {
    detected.push('framer-motion');
  }

  // React Spring
  if (win.ReactSpring) {
    detected.push('react-spring');
  }

  // Popmotion
  if (win.popmotion || win.pose) {
    detected.push('popmotion');
  }

  return detected;
}

/**
 * 라이브러리 버전 정보 가져오기
 */
export function getLibraryVersions(): Record<string, string> {
  const versions: Record<string, string> = {};
  const win = window as { gsap?: { version?: string }; anime?: { version?: string }; THREE?: { REVISION?: string }; PIXI?: { VERSION?: string }; lottie?: { version?: string } };

  if (win.gsap && win.gsap.version) {
    versions.gsap = win.gsap.version;
  }

  if (win.anime && win.anime.version) {
    versions.animejs = win.anime.version;
  }

  if (win.THREE && win.THREE.REVISION) {
    versions.three = win.THREE.REVISION;
  }

  if (win.PIXI && win.PIXI.VERSION) {
    versions.pixi = win.PIXI.VERSION;
  }

  if (win.lottie && win.lottie.version) {
    versions.lottie = win.lottie.version;
  }

  return versions;
}

/**
 * 페이지의 FPS 측정
 */
export function measureFPS(duration: number = 1000): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    const startTime = performance.now();

    function countFrame() {
      frames++;

      const elapsed = performance.now() - startTime;
      if (elapsed >= duration) {
        const fps = Math.round((frames / elapsed) * 1000);
        resolve(fps);
      } else {
        requestAnimationFrame(countFrame);
      }
    }

    requestAnimationFrame(countFrame);
  });
}

/**
 * FPS 모니터링 시작 (실시간)
 */
export function startFPSMonitoring(
  callback: (fps: number) => void,
  interval: number = 1000
): () => void {
  let frames = 0;
  let lastTime = performance.now();

  function countFrame() {
    frames++;

    const currentTime = performance.now();
    const elapsed = currentTime - lastTime;

    if (elapsed >= interval) {
      const fps = Math.round((frames / elapsed) * 1000);
      callback(fps);
      frames = 0;
      lastTime = currentTime;
    }

    rafId = requestAnimationFrame(countFrame);
  }

  let rafId = requestAnimationFrame(countFrame);

  // 정지 함수 반환
  return () => {
    cancelAnimationFrame(rafId);
  };
}

/**
 * Jank (프레임 드롭) 감지
 */
export interface JankEvent {
  timestamp: number;
  frameTime: number;
  severity: 'low' | 'medium' | 'high';
}

export function detectJanks(
  callback: (jank: JankEvent) => void,
  threshold: number = 50 // ms
): () => void {
  let lastFrameTime = performance.now();

  function checkJank() {
    const currentTime = performance.now();
    const frameTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    if (frameTime > threshold) {
      const severity =
        frameTime > 100 ? 'high' : frameTime > 75 ? 'medium' : 'low';

      callback({
        timestamp: currentTime,
        frameTime,
        severity,
      });
    }

    rafId = requestAnimationFrame(checkJank);
  }

  let rafId = requestAnimationFrame(checkJank);

  // 정지 함수 반환
  return () => {
    cancelAnimationFrame(rafId);
  };
}

/**
 * Long Task 감지 (메인 스레드 차단)
 */
export function detectLongTasks(
  callback: (duration: number) => void
): () => void {
  const threshold = 50; // 50ms

  function checkLongTask() {
    const start = performance.now();

    // 다음 프레임까지 대기
    requestAnimationFrame(() => {
      const end = performance.now();
      const duration = end - start;

      if (duration > threshold) {
        callback(duration);
      }

      rafId = requestAnimationFrame(checkLongTask);
    });
  }

  let rafId = requestAnimationFrame(checkLongTask);

  // 정지 함수 반환
  return () => {
    cancelAnimationFrame(rafId);
  };
}
