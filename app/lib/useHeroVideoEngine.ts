'use client';

import { useEffect } from 'react';

const LOOP_IDS = ['beforeLoop', 'afterLoop'] as const;
const ALL_IDS = ['beforeLoop', 'beforeAction', 'afterLoop', 'afterAction'] as const;

function asVideo(id: string): HTMLVideoElement | null {
  return document.getElementById(id) as HTMLVideoElement | null;
}

function armVideo(video: HTMLVideoElement) {
  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('muted', '');
}

function markReady(video: HTMLVideoElement) {
  video.classList.add('is-ready');
  video.parentElement?.classList.add('is-ready');
}

async function safePlay(video: HTMLVideoElement) {
  try {
    if (video.paused) await video.play();
  } catch {
    /* Autoplay policies can reject until a gesture; callers retry on pointer/touch. */
  }
}

/**
 * Hero loop engine: posters stay visible (CSS background) until the first decoded frame,
 * then the video fades in. Playback is retried on mount, gesture, and tab-visible.
 */
export function useHeroVideoEngine() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const on = (target: EventTarget | null, type: string, listener: EventListener, options?: AddEventListenerOptions) => {
      if (!target) return;
      target.addEventListener(type, listener, options);
      cleanups.push(() => target.removeEventListener(type, listener, options));
    };

    const loops = LOOP_IDS.map(asVideo).filter((v): v is HTMLVideoElement => Boolean(v));
    const all = ALL_IDS.map(asVideo).filter((v): v is HTMLVideoElement => Boolean(v));

    loops.forEach((video) => {
      armVideo(video);
      if (video.readyState >= 2) markReady(video);
      const ready = () => markReady(video);
      on(video, 'loadeddata', ready);
      on(video, 'canplay', ready);
      on(video, 'playing', ready);
      on(video, 'error', () => {
        video.classList.remove('is-ready');
      });
    });

    const playLoops = () => {
      loops.forEach((video) => {
        void safePlay(video);
      });
    };

    playLoops();
    const kick = window.setTimeout(playLoops, 80);
    on(document.body, 'touchstart', playLoops, { once: true, passive: true });
    on(document.body, 'pointerdown', playLoops, { once: true, passive: true });
    on(document, 'visibilitychange', () => {
      if (document.visibilityState === 'visible') playLoops();
    });

    return () => {
      window.clearTimeout(kick);
      all.forEach((video) => {
        try { video.pause(); } catch { /* ignore */ }
      });
      cleanups.forEach((fn) => fn());
    };
  }, []);
}
