'use client';

import { useEffect } from 'react';

/**
 * Hardware-accelerated before/after divider.
 * Position is written only as `translate3d` inside rAF. All pointer/touch/mouse
 * listeners use `{ passive: true }` — `touch-action: none` on the frame prevents
 * scroll so we never need preventDefault.
 */
export function useBeforeAfterSlider() {
  useEffect(() => {
    const wrapper = document.getElementById('sliderWrapper');
    const knob = document.getElementById('sliderKnob');
    const divider = document.getElementById('dividerLine');
    const afterPane = document.getElementById('afterPane');
    const beforeAction = document.getElementById('beforeAction') as HTMLVideoElement | null;
    const afterAction = document.getElementById('afterAction') as HTMLVideoElement | null;
    if (!wrapper || !knob || !divider || !afterPane) return;

    const cleanups: Array<() => void> = [];
    const on = (target: EventTarget | null, type: string, listener: EventListener, options?: AddEventListenerOptions) => {
      if (!target) return;
      target.addEventListener(type, listener, options);
      cleanups.push(() => target.removeEventListener(type, listener, options));
    };

    let isDragging = false;
    let currentPercentage = 50;
    let pendingPct = 50;
    let rAFId: number | null = null;
    let snapTimer: ReturnType<typeof setTimeout> | null = null;
    let activePointerId: number | null = null;
    let wrapperRect: DOMRect | null = null;
    let lastActionBand: -1 | 0 | 1 = 0;

    const applySlider = (pct: number, withTransition: boolean) => {
      const value = Math.max(0, Math.min(100, pct));
      currentPercentage = value;
      const width = (wrapperRect ?? wrapper.getBoundingClientRect()).width;
      const x = (value / 100) * width;
      const transition = withTransition ? 'transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none';
      knob.style.transition = transition;
      divider.style.transition = transition;
      afterPane.style.transition = withTransition
        ? 'clip-path 0.18s cubic-bezier(0.2, 0.9, 0.3, 1), -webkit-clip-path 0.18s cubic-bezier(0.2, 0.9, 0.3, 1)'
        : 'none';
      knob.style.left = '0px';
      divider.style.left = '0px';
      knob.style.transform = `translate3d(${x}px, -50%, 0)`;
      divider.style.transform = `translate3d(${x}px, 0, 0)`;
      const clip = `polygon(${value}% 0, 100% 0, 100% 100%, ${value}% 100%)`;
      afterPane.style.clipPath = clip;
      afterPane.style.setProperty('-webkit-clip-path', clip);

      const band: -1 | 0 | 1 = value < 45 ? -1 : value > 55 ? 1 : 0;
      if (band === lastActionBand) return;
      lastActionBand = band;
      if (band === -1) {
        afterAction?.classList.add('active');
        void afterAction?.play()?.catch(() => undefined);
        beforeAction?.classList.remove('active');
        beforeAction?.pause();
      } else if (band === 1) {
        beforeAction?.classList.add('active');
        void beforeAction?.play()?.catch(() => undefined);
        afterAction?.classList.remove('active');
        afterAction?.pause();
      } else {
        beforeAction?.classList.remove('active');
        beforeAction?.pause();
        afterAction?.classList.remove('active');
        afterAction?.pause();
      }
    };

    const scheduleSlider = (pct: number) => {
      pendingPct = pct;
      if (rAFId == null) {
        rAFId = requestAnimationFrame(() => {
          rAFId = null;
          applySlider(pendingPct, false);
        });
      }
    };

    const clientXFromEvent = (event: Event): number | null => {
      if ('clientX' in event && typeof (event as MouseEvent).clientX === 'number' && !('touches' in event)) {
        return (event as MouseEvent).clientX;
      }
      const touchEvent = event as TouchEvent;
      const touch = touchEvent.touches?.[0] ?? touchEvent.changedTouches?.[0];
      return touch ? touch.clientX : null;
    };

    const pctFromClientX = (clientX: number) => {
      const rect = wrapperRect ?? wrapper.getBoundingClientRect();
      if (!rect.width) return currentPercentage;
      return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    };

    const beginDrag = (event: Event) => {
      const clientX = clientXFromEvent(event);
      if (clientX == null) return;
      isDragging = true;
      wrapperRect = wrapper.getBoundingClientRect();
      wrapper.classList.add('is-dragging');
      if ('pointerId' in event) {
        activePointerId = (event as PointerEvent).pointerId;
        try { knob.setPointerCapture(activePointerId); } catch { /* older Safari */ }
      }
      if (snapTimer) { clearTimeout(snapTimer); snapTimer = null; }
      scheduleSlider(pctFromClientX(clientX));
    };

    const moveDrag = (event: Event) => {
      if (!isDragging) return;
      if ('pointerId' in event && activePointerId != null && (event as PointerEvent).pointerId !== activePointerId) return;
      const clientX = clientXFromEvent(event);
      if (clientX == null) return;
      scheduleSlider(pctFromClientX(clientX));
    };

    const endDrag = (event?: Event) => {
      if (!isDragging) return;
      isDragging = false;
      wrapper.classList.remove('is-dragging');
      if (event && 'pointerId' in event) {
        try { knob.releasePointerCapture((event as PointerEvent).pointerId); } catch { /* already released */ }
      }
      activePointerId = null;
      wrapperRect = null;
      if (rAFId != null) { cancelAnimationFrame(rAFId); rAFId = null; }
      pendingPct = 50;
      applySlider(50, true);
      snapTimer = setTimeout(() => {
        lastActionBand = 0;
        [beforeAction, afterAction].forEach((video) => {
          if (!video) return;
          video.classList.remove('active');
          video.pause();
          try { video.currentTime = 0; } catch { /* ignore */ }
        });
        knob.style.transition = '';
        divider.style.transition = '';
        afterPane.style.transition = '';
      }, 190);
    };

    const passive: AddEventListenerOptions = { passive: true };
    on(knob, 'pointerdown', beginDrag, passive);
    on(wrapper, 'pointermove', moveDrag, passive);
    on(window, 'pointerup', endDrag, passive);
    on(window, 'pointercancel', endDrag, passive);
    on(knob, 'touchstart', beginDrag, passive);
    on(wrapper, 'touchmove', moveDrag, passive);
    on(window, 'touchend', endDrag, passive);
    on(window, 'touchcancel', endDrag, passive);
    on(knob, 'mousedown', beginDrag, passive);
    on(window, 'mousemove', moveDrag, passive);
    on(window, 'mouseup', endDrag, passive);
    applySlider(50, false);
    on(window, 'resize', () => applySlider(currentPercentage, false), passive);

    return () => {
      if (rAFId != null) cancelAnimationFrame(rAFId);
      if (snapTimer) clearTimeout(snapTimer);
      cleanups.forEach((fn) => fn());
    };
  }, []);
}
