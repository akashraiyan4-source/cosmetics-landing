'use client';

import React, { useEffect } from 'react';

export default function CosmeticPage() {
  useEffect(() => {
    const wrapper = document.getElementById('sliderWrapper');
    const knob = document.getElementById('sliderKnob');
    const divider = document.getElementById('dividerLine');
    const afterPane = document.getElementById('afterPane');

    const beforeLoop = document.getElementById('beforeLoop') as HTMLVideoElement;
    const beforeAction = document.getElementById('beforeAction') as HTMLVideoElement;
    const afterLoop = document.getElementById('afterLoop') as HTMLVideoElement;
    const afterAction = document.getElementById('afterAction') as HTMLVideoElement;

    const soundBtn = document.getElementById('soundBtn');
    const soundIcon = document.getElementById('soundIcon');
    const soundText = document.getElementById('soundText');

    let isDragging = false;
    let isMuted = true;
    let currentPercentage = 50;
    let rAFId: number | null = null;

    function forcePlayVideos() {
      const vids = [beforeLoop, afterLoop];
      vids.forEach(v => {
        if (!v) return;
        v.muted = true;
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      });
    }

    forcePlayVideos();
    document.body.addEventListener('touchstart', forcePlayVideos, { once: true });
    document.body.addEventListener('click', forcePlayVideos, { once: true });

    function renderSlider() {
      if (!knob || !divider || !afterPane) return;
      knob.style.left = currentPercentage + '%';
      divider.style.left = currentPercentage + '%';
      afterPane.style.clipPath = `polygon(${currentPercentage}% 0, 100% 0, 100% 100%, ${currentPercentage}% 100%)`;
      (afterPane.style as any).webkitClipPath = `polygon(${currentPercentage}% 0, 100% 0, 100% 100%, ${currentPercentage}% 100%)`;

      if (currentPercentage < 45) {
        if (afterAction && !afterAction.classList.contains('active')) {
          afterAction.classList.add('active');
          afterAction.play().catch(() => {});
        }
        if (beforeAction) {
          beforeAction.classList.remove('active');
          beforeAction.pause();
        }
      } else if (currentPercentage > 55) {
        if (beforeAction && !beforeAction.classList.contains('active')) {
          beforeAction.classList.add('active');
          beforeAction.play().catch(() => {});
        }
        if (afterAction) {
          afterAction.classList.remove('active');
          afterAction.pause();
        }
      } else {
        if (beforeAction) {
          beforeAction.classList.remove('active');
          beforeAction.pause();
        }
        if (afterAction) {
          afterAction.classList.remove('active');
          afterAction.pause();
        }
      }
      rAFId = null;
    }

    function updateSliderPosition(clientX: number) {
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      if (pct < 0) pct = 0;
      if (pct > 100) pct = 100;
      currentPercentage = pct;

      if (!rAFId) {
        rAFId = requestAnimationFrame(renderSlider);
      }
    }

    if (knob) {
      knob.addEventListener('pointerdown', (e: PointerEvent) => {
        e.stopPropagation();
        isDragging = true;
        knob.style.transition = 'none';
        if (divider) divider.style.transition = 'none';
        if (afterPane) afterPane.style.transition = 'none';

        try {
          knob.setPointerCapture(e.pointerId);
        } catch (err) {}
      }, { passive: false });

      knob.addEventListener('pointermove', (e: PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        updateSliderPosition(e.clientX);
      }, { passive: false });

      const finishKnobDrag = (e: PointerEvent) => {
        if (!isDragging) return;
        isDragging = false;

        try {
          knob.releasePointerCapture(e.pointerId);
        } catch (err) {}

        currentPercentage = 50;
        if (rAFId) {
          cancelAnimationFrame(rAFId);
          rAFId = null;
        }

        const snapTransition = 'left 0.18s cubic-bezier(0.2, 0.9, 0.3, 1)';
        const clipTransition = 'clip-path 0.18s cubic-bezier(0.2, 0.9, 0.3, 1), -webkit-clip-path 0.18s cubic-bezier(0.2, 0.9, 0.3, 1)';

        knob.style.transition = snapTransition;
        if (divider) divider.style.transition = snapTransition;
        if (afterPane) afterPane.style.transition = clipTransition;

        knob.style.left = '50%';
        if (divider) divider.style.left = '50%';
        if (afterPane) {
          afterPane.style.clipPath = 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';
          (afterPane.style as any).webkitClipPath = 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';
        }

        setTimeout(() => {
          if (beforeAction) {
            beforeAction.classList.remove('active');
            beforeAction.pause();
            beforeAction.currentTime = 0;
          }
          if (afterAction) {
            afterAction.classList.remove('active');
            afterAction.pause();
            afterAction.currentTime = 0;
          }
          knob.style.transition = '';
          if (divider) divider.style.transition = '';
          if (afterPane) afterPane.style.transition = '';
        }, 190);
      };

      knob.addEventListener('pointerup', finishKnobDrag);
      knob.addEventListener('pointercancel', finishKnobDrag);
    }

    if (soundBtn) {
      soundBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isMuted = !isMuted;

        [beforeLoop, beforeAction, afterLoop, afterAction].forEach(v => {
          if (v) v.muted = isMuted;
        });

        if (soundIcon && soundText) {
          if (!isMuted) {
            soundIcon.textContent = "🔊";
            soundText.textContent = "Sound On";
          } else {
            soundIcon.textContent = "🔇";
            soundText.textContent = "Sound Off";
          }
        }
      });
    }

    function initInertialMarquee(boxId: string, innerId: string, baseSpeed = 0.55) {
      const box = document.getElementById(boxId);
      const inner = document.getElementById(innerId);
      if (!box || !inner) return;

      let scrollX = 0;
      let velocity = baseSpeed;
      let isDraggingTrack = false;
      let lastX = 0;
      let lastTime = Date.now();
      let animId: number;

      if (!inner.dataset.duplicated) {
        inner.innerHTML += inner.innerHTML;
        inner.dataset.duplicated = "true";
      }
      const totalWidth = inner.scrollWidth / 2;

      function step() {
        if (!isDraggingTrack) {
          velocity = velocity * 0.96 + baseSpeed * 0.04;
          scrollX += velocity;

          if (scrollX >= totalWidth) scrollX -= totalWidth;
          else if (scrollX < 0) scrollX += totalWidth;

          inner!.style.transform = `translate3d(${-scrollX}px, 0, 0)`;
        }
        animId = requestAnimationFrame(step);
      }

      box.addEventListener('pointerdown', (e: PointerEvent) => {
        isDraggingTrack = true;
        lastX = e.clientX;
        lastTime = Date.now();
        box.style.cursor = 'grabbing';
        try { box.setPointerCapture(e.pointerId); } catch(err){}
      });

      box.addEventListener('pointermove', (e: PointerEvent) => {
        if (!isDraggingTrack) return;
        const now = Date.now();
        const dt = now - lastTime;
        const dx = e.clientX - lastX;

        if (dt > 0) {
          velocity = -dx * (16 / dt) * 0.75;
        }

        scrollX -= dx;
        if (scrollX >= totalWidth) scrollX -= totalWidth;
        else if (scrollX < 0) scrollX += totalWidth;

        inner!.style.transform = `translate3d(${-scrollX}px, 0, 0)`;
        lastX = e.clientX;
        lastTime = now;
      });

      const endTrackDrag = (e: PointerEvent) => {
        if (!isDraggingTrack) return;
        isDraggingTrack = false;
        box.style.cursor = 'grab';
        try { box.releasePointerCapture(e.pointerId); } catch(err){}
      };

      box.addEventListener('pointerup', endTrackDrag);
      box.addEventListener('pointercancel', endTrackDrag);

      animId = requestAnimationFrame(step);
    }

    initInertialMarquee('casesScrollBox', 'casesScrollInner', 0.55);
    initInertialMarquee('reviewsScrollBox', 'reviewsScrollInner', 0.5);

    const sideDock = document.getElementById('sideDock');
    const peekingHandle = document.getElementById('peekingHandle');
    const dockAdaBtn = document.getElementById('dockAdaBtn');
    const dockAiBtn = document.getElementById('dockAiBtn');

    const adaModal = document.getElementById('adaModal');
    const adaCloseBtn = document.getElementById('adaCloseBtn');
    const aiModal = document.getElementById('aiModal');
    const aiCloseBtn = document.getElementById('aiCloseBtn');
    const aiCandidacyTriggerBtn = document.getElementById('aiCandidacyTriggerBtn');

    function closeAllSideModals() {
      if (adaModal) adaModal.classList.remove('show');
      if (aiModal) aiModal.classList.remove('show');
      if (sideDock) sideDock.classList.remove('expanded');
      document.body.classList.remove('ai-active', 'ada-active');
    }

    if (peekingHandle) {
      peekingHandle.addEventListener('click', (e) => {
        e.stopPropagation();
        if ((adaModal && adaModal.classList.contains('show')) || (aiModal && aiModal.classList.contains('show'))) {
          closeAllSideModals();
        } else if (sideDock) {
          sideDock.classList.toggle('expanded');
        }
      });
    }

    if (dockAdaBtn) {
      dockAdaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (aiModal) aiModal.classList.remove('show');
        if (adaModal) adaModal.classList.add('show');
        if (sideDock) sideDock.classList.remove('expanded');
        document.body.classList.remove('ai-active');
        document.body.classList.add('ada-active');
      });
    }

    if (dockAiBtn) {
      dockAiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (adaModal) adaModal.classList.remove('show');
        if (aiModal) aiModal.classList.add('show');
        if (sideDock) sideDock.classList.remove('expanded');
        document.body.classList.remove('ada-active');
        document.body.classList.add('ai-active');
        setTimeout(() => {
          const input = document.getElementById('aiChatInput') as HTMLInputElement;
          if (input) input.focus();
        }, 150);
      });
    }

    document.addEventListener('click', (e) => {
      if (sideDock && adaModal && aiModal) {
        if (!sideDock.contains(e.target as Node) && !adaModal.contains(e.target as Node) && !aiModal.contains(e.target as Node)) {
          closeAllSideModals();
        }
      }
    });

    const triggerButtons = document.querySelectorAll('.service-trigger-btn');
    triggerButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const topic = (e.currentTarget as HTMLElement).getAttribute('data-topic') || 'consultation';

        if (adaModal) adaModal.classList.remove('show');
        if (aiModal) aiModal.classList.add('show');
        if (sideDock) sideDock.classList.remove('expanded');
        document.body.classList.remove('ada-active');
        document.body.classList.add('ai-active');

        const aiChatBox = document.getElementById('aiChatBox');
        if (aiChatBox) {
          const proactiveDiv = document.createElement('div');
          proactiveDiv.className = 'chat-msg bot';
          proactiveDiv.textContent = `Welcome to Aura Beverly Hills. I noticed you're exploring our ${topic}. Would you like me to guide you through the details or secure a confidential consultation?`;
          aiChatBox.appendChild(proactiveDiv);
          aiChatBox.scrollTop = aiChatBox.scrollHeight;
        }
      }, { capture: true });
    });

    if (aiCandidacyTriggerBtn) {
      aiCandidacyTriggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (adaModal) adaModal.classList.remove('show');
        if (aiModal) aiModal.classList.add('show');
        if (sideDock) sideDock.classList.remove('expanded');
        document.body.classList.remove('ada-active');
        document.body.classList.add('ai-active');
        setTimeout(() => {
          const input = document.getElementById('aiChatInput') as HTMLInputElement;
          if (input) input.focus();
        }, 150);
      }, { capture: true });
    }

    if (adaCloseBtn) adaCloseBtn.addEventListener('click', closeAllSideModals);
    if (aiCloseBtn) aiCloseBtn.addEventListener('click', closeAllSideModals);

    const adaTileCursor = document.getElementById('adaTileCursor');
    const adaTileContrast = document.getElementById('adaTileContrast');
    const adaTileText = document.getElementById('adaTileText');
    const adaTileDesaturate = document.getElementById('adaTileDesaturate');
    const adaTileLinks = document.getElementById('adaTileLinks');
    const adaTileAudio = document.getElementById('adaTileAudio');
    const adaReset = document.getElementById('adaReset');

    if (adaTileCursor) adaTileCursor.addEventListener('click', () => { document.body.classList.toggle('large-cursor'); adaTileCursor.classList.toggle('active'); });
    if (adaTileContrast) adaTileContrast.addEventListener('click', () => { document.body.classList.toggle('high-contrast'); adaTileContrast.classList.toggle('active'); });
    if (adaTileText) adaTileText.addEventListener('click', () => { document.body.classList.toggle('large-text'); adaTileText.classList.toggle('active'); });
    if (adaTileDesaturate) adaTileDesaturate.addEventListener('click', () => { document.body.classList.toggle('desaturate'); adaTileDesaturate.classList.toggle('active'); });
    if (adaTileLinks) adaTileLinks.addEventListener('click', () => { document.body.classList.toggle('highlight-links'); adaTileLinks.classList.toggle('active'); });

    if (adaTileAudio) {
      adaTileAudio.addEventListener('click', () => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const titleEl = document.querySelector('.hero-title');
          const descEl = document.querySelector('.hero-desc');
          const mainText = (titleEl ? titleEl.textContent : '') + ". " + (descEl ? descEl.textContent : '');
          const utterance = new SpeechSynthesisUtterance(mainText);
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
          adaTileAudio.classList.toggle('active');
        } else {
          alert("Audio narration not supported.");
        }
      });
    }

    if (adaReset) {
      adaReset.addEventListener('click', () => {
        document.body.classList.remove('large-cursor', 'high-contrast', 'large-text', 'desaturate', 'highlight-links');
        [adaTileCursor, adaTileContrast, adaTileText, adaTileDesaturate, adaTileLinks, adaTileAudio].forEach(el => el?.classList.remove('active'));
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      });
    }

    const aiChatInput = document.getElementById('aiChatInput') as HTMLInputElement;
    const aiChatSend = document.getElementById('aiChatSend');
    const aiChatBox = document.getElementById('aiChatBox');

    async function sendAiChat() {
      if (!aiChatInput || !aiChatBox) return;
      const txt = aiChatInput.value.trim();
      if (!txt) return;

      const userDiv = document.createElement('div');
      userDiv.className = 'chat-msg user';
      userDiv.textContent = txt;
      aiChatBox.appendChild(userDiv);
      aiChatInput.value = '';
      aiChatBox.scrollTop = aiChatBox.scrollHeight;

      const botDiv = document.createElement('div');
      botDiv.className = 'chat-msg bot';
      botDiv.textContent = "Analyzing inquiry with VIP AI...";
      aiChatBox.appendChild(botDiv);
      aiChatBox.scrollTop = aiChatBox.scrollHeight;

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: txt, 
            userPhone: 'WebVisitor', 
            niche: 'cosmetics',
            brandName: 'Aura Beverly Hills',
            expertName: 'Dr. Sarah Alvi'
          })
        });
        const data = await res.json();
        botDiv.textContent = data.reply || data.response || data.message || "Consultation priority noted.";
      } catch (err) {
        botDiv.textContent = "Inquiry logged under VIP protocol. Our staff is notified.";
      }
      aiChatBox.scrollTop = aiChatBox.scrollHeight;
    }

    if (aiChatSend) aiChatSend.addEventListener('click', sendAiChat);
    if (aiChatInput) {
      aiChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendAiChat();
      });
    }
  }, []);

  return (
    <>
      <style jsx global>{`
        :root {
          --bg-cream: #FAF8F5;
          --bg-card: #FFFFFF;
          --text-main: #141316;
          --text-muted: #5C5854;
          --text-light: #8E8A85;
          --rose-accent: #E33F6C;
          --card-border: rgba(227, 63, 108, 0.18);
          --rose-btn: linear-gradient(90deg, #E0BDC2 0%, #E33F6C 100%);
          --rose-glow: 0 12px 28px -4px rgba(227, 63, 108, 0.42);
          --spring-snap: cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        body {
          background-color: var(--bg-cream);
          color: var(--text-main);
          font-family: 'Montserrat', sans-serif;
          overflow-x: hidden;
          line-height: 1.6;
          transition: filter 0.3s ease, font-size 0.2s ease;
        }

        body.high-contrast {
          filter: contrast(140%) !important;
          background-color: #f0ede6 !important;
        }
        body.desaturate {
          filter: grayscale(100%) !important;
        }
        body.large-text {
          font-size: 115% !important;
        }
        body.highlight-links a {
          outline: 2px dashed var(--rose-accent) !important;
          text-decoration: underline !important;
        }
        body.large-cursor {
          cursor: crosshair !important;
        }

        h1, h2, h3, h4 {
          font-family: 'Cormorant Garamond', serif;
          color: var(--text-main);
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .site-nav {
          max-width: 1320px;
          margin: 0 auto;
          padding: 22px 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-bottom: 1px solid rgba(20, 19, 22, 0.05);
        }

        .brand-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          text-decoration: none;
          color: var(--text-main);
          margin: 0 auto;
        }

        .brand-monogram {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: #FFFFFF;
          border: 1.5px solid var(--rose-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--rose-accent);
          box-shadow: 0 4px 12px rgba(227, 63, 108, 0.15);
        }

        .brand-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.18em;
        }

        .gold-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--rose-btn) !important;
          color: #FFFFFF !important;
          padding: 14px 28px;
          border-radius: 8px !important;
          border: none;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          box-shadow: var(--rose-glow) !important;
          transition: transform 0.4s var(--spring-snap), box-shadow 0.4s ease;
          text-align: center;
        }

        .gold-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 16px 32px -4px rgba(227, 63, 108, 0.55) !important;
        }

        .section-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 60px 24px;
        }

        .section-header {
          text-align: center;
          max-width: 780px;
          margin: 0 auto 36px auto;
        }

        .sub-tag {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--rose-accent);
          margin-bottom: 10px;
        }

        .section-title {
          font-size: 2.8rem;
          line-height: 1.15;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .section-desc {
          font-size: 0.95rem;
          color: var(--text-muted);
          font-weight: 400;
        }

        .hero-section {
          max-width: 1320px;
          margin: 0 auto;
          padding: 40px 24px 45px 24px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .hero-pre-tag {
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-weight: 600;
          color: var(--rose-accent);
        }

        .hero-title {
          font-size: 3.8rem;
          line-height: 1.08;
          text-transform: uppercase;
          font-weight: 600;
        }

        .hero-desc {
          font-size: 0.96rem;
          color: var(--text-muted);
          line-height: 1.7;
          max-width: 520px;
        }

        .hero-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 6px 0;
        }

        .pill-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #FFFFFF;
          border: 1px solid var(--card-border);
          border-radius: 8px !important;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-main);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }

        .pill-item span { color: var(--rose-accent); }

        .slider-frame {
          position: relative;
          width: 100%;
          max-width: 390px;
          margin: 0 auto;
          aspect-ratio: 9 / 16;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 25px 60px -15px rgba(20, 19, 22, 0.22);
          border: 1px solid var(--card-border);
          user-select: none;
          -webkit-user-select: none;
          touch-action: pan-y !important;
          background: var(--bg-cream) !important;
          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);
        }

        .pane-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          background: var(--bg-cream);
        }

        .pane-video video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          background: var(--bg-cream);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }

        .pane-left { z-index: 1; }
        
        .pane-right {
          z-index: 2;
          clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%);
          -webkit-clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%);
          will-change: clip-path;
          transform: translate3d(0, 0, 0);
        }

        .action-layer {
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 2;
        }

        .action-layer.active { opacity: 1; }

        .sound-toggle {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 6px 14px;
          border-radius: 8px !important;
          background: rgba(20, 19, 22, 0.65);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          z-index: 30;
          touch-action: auto;
        }

        .slider-divider-bar {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 2px;
          background: #FFFFFF;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
          z-index: 10;
          pointer-events: none;
          transform: translateX(-50%);
          will-change: left;
        }

        .slider-knob {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          z-index: 20;
          transform: translate(-50%, -50%);
          cursor: grab;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: none !important;
          will-change: left;
          pointer-events: auto;
        }

        .slider-knob:active {
          cursor: grabbing;
        }

        .knob-arrows {
          display: flex;
          gap: 4px;
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 800;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.75);
          pointer-events: none;
        }

        .bottom-tags {
          position: absolute;
          bottom: 16px;
          left: 0;
          right: 0;
          padding: 0 16px;
          display: flex;
          justify-content: space-between;
          z-index: 15;
          pointer-events: none;
        }

        .b-tag {
          padding: 5px 12px;
          background: rgba(20, 19, 22, 0.75);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border-radius: 6px !important;
          font-weight: 600;
        }

        .drag-hint {
          text-align: center;
          font-size: 0.7rem;
          color: var(--text-light);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-top: 14px;
        }

        .authority-trust-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 10px 24px 34px 24px;
        }

        .authority-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .authority-card {
          background: var(--bg-card);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 18px 16px;
          text-align: center;
          box-shadow: 0 6px 18px rgba(20, 19, 22, 0.02);
        }

        .authority-card-icon {
          font-size: 1.3rem;
          margin-bottom: 6px;
          color: var(--rose-accent);
        }

        .authority-card-title {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-main);
          margin-bottom: 2px;
        }

        .authority-card-desc {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .press-bar {
          border-top: 1px solid var(--card-border);
          border-bottom: 1px solid var(--card-border);
          background: #FFFFFF;
          padding: 24px 0;
          overflow: hidden;
          white-space: nowrap;
          position: relative;
        }

        .press-text {
          text-align: center;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          font-weight: 600;
          color: var(--rose-accent);
          margin-bottom: 16px;
          padding: 0 16px;
        }

        .press-track {
          display: flex;
          width: max-content;
          animation: pressScroll 22s linear infinite;
        }

        .press-group {
          display: flex;
          align-items: center;
          gap: 50px;
          padding-right: 50px;
        }

        .p-brand {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.45rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #7D7873;
          text-transform: uppercase;
        }

        @keyframes pressScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .inertial-scroll-box {
          width: 100%;
          overflow: hidden;
          position: relative;
          padding: 10px 0 30px 0;
          cursor: grab;
          touch-action: pan-x;
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }

        .inertial-scroll-inner {
          display: flex;
          gap: 20px;
          width: max-content;
          will-change: transform;
        }

        .case-card {
          width: 250px;
          flex-shrink: 0;
          background: #FFFFFF;
          border: 1px solid var(--card-border);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 6px 18px rgba(0,0,0,0.03);
        }

        .case-img-box {
          width: 100%;
          height: 230px;
          position: relative;
          background: #141316;
        }

        .case-img-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .case-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(20, 19, 22, 0.7);
          backdrop-filter: blur(4px);
          padding: 4px 10px;
          border-radius: 6px !important;
          color: #FFF;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          z-index: 2;
        }

        .case-info {
          padding: 16px;
          text-align: left;
        }

        .case-title {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .case-meta {
          font-size: 0.74rem;
          color: var(--text-light);
        }

        .grid-3-col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }

        .grid-2-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .white-card {
          background: var(--bg-card);
          border: 1px solid var(--card-border);
          border-radius: 14px;
          padding: 38px 28px;
          box-shadow: 0 8px 24px rgba(20, 19, 22, 0.02);
          transition: transform 0.4s var(--spring-snap), box-shadow 0.4s ease;
          text-align: left;
        }

        .white-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(227, 63, 108, 0.28) !important;
        }

        .card-icon {
          font-size: 1.8rem;
          margin-bottom: 18px;
          display: inline-block;
        }

        .white-card-title {
          font-size: 1.35rem;
          text-transform: uppercase;
          margin-bottom: 10px;
          line-height: 1.25;
        }

        .white-card-text {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.7;
        }

        .path-pill {
          display: inline-block;
          padding: 4px 14px;
          border: 1px solid var(--rose-accent);
          border-radius: 6px !important;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--rose-accent);
          margin-bottom: 16px;
        }

        .checklist {
          list-style: none;
          margin: 20px 0 26px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checklist li {
          font-size: 0.88rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .checklist li::before {
          content: "✓";
          color: var(--rose-accent);
          font-weight: bold;
        }

        .review-card {
          width: 320px;
          flex-shrink: 0;
          background: #FFFFFF;
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 24px;
          text-align: left;
          box-shadow: 0 4px 14px rgba(0,0,0,0.02);
        }

        .stars {
          color: #D4AF37;
          font-size: 1.1rem;
          margin-bottom: 10px;
          letter-spacing: 2px;
        }

        .review-quote {
          font-size: 0.86rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 14px;
          font-style: italic;
        }

        .reviewer-name {
          font-size: 0.74rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .reviewer-loc {
          font-size: 0.68rem;
          color: var(--text-light);
          text-transform: uppercase;
        }

        .self-card {
          max-width: 720px;
          margin: 0 auto;
          background: #FFFFFF;
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 44px 32px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          text-align: center;
        }

        .self-list {
          list-style: none;
          text-align: left;
          margin: 26px auto;
          max-width: 580px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .self-list li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 0.92rem;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .self-list li span {
          color: var(--rose-accent);
          font-weight: bold;
        }

        .gps-clean-container {
          max-width: 920px;
          margin: 30px auto 60px auto;
          padding: 0 20px;
        }

        .gps-interactive-card {
          position: relative;
          display: block;
          width: 100%;
          height: 380px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--card-border);
          box-shadow: 0 15px 35px rgba(20, 19, 22, 0.08);
          cursor: pointer;
          text-decoration: none;
          transition: transform 0.35s var(--spring-snap), box-shadow 0.35s ease;
          background: #e5e3df;
        }

        .gps-interactive-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 45px rgba(227, 63, 108, 0.22);
        }

        .gps-interactive-card iframe {
          width: 100%;
          height: 100%;
          border: none;
          pointer-events: none;
        }

        .gps-click-shield {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 5;
        }

        .side-dock-container {
          position: fixed !important;
          bottom: 24px !important;
          right: 24px !important;
          top: auto !important;
          transform: none !important;
          z-index: 999999 !important;
          display: flex !important;
          align-items: center !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
          pointer-events: auto !important;
        }

        .peeking-tab-handle {
          width: 48px !important;
          height: 48px !important;
          border-radius: 50% !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          font-size: 2.1rem !important;
          user-select: none !important;
          transition: transform 0.25s var(--spring-snap) !important;
        }

        .peeking-tab-handle:hover {
          transform: scale(1.15) !important;
        }

        .side-dock-container.expanded .peeking-tab-handle {
          transform: rotate(180deg) scale(1.1) !important;
        }

        .dock-popout-options {
          position: absolute !important;
          bottom: 58px !important;
          right: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
          opacity: 0 !important;
          pointer-events: none !important;
          transform: translateY(15px) scale(0.9) !important;
          transition: all 0.3s var(--spring-snap) !important;
        }

        .side-dock-container.expanded .dock-popout-options {
          opacity: 1 !important;
          pointer-events: auto !important;
          transform: translateY(0) scale(1) !important;
        }

        .dock-opt-btn {
          width: 46px !important;
          height: 46px !important;
          border-radius: 50% !important;
          background: #FFFFFF !important;
          border: 1.5px solid var(--rose-accent) !important;
          color: #141316 !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          font-size: 1.2rem !important;
          transition: transform 0.2s var(--spring-snap), background 0.2s ease !important;
          position: relative !important;
        }

        .dock-opt-btn:hover {
          transform: scale(1.1) !important;
          background: #FFF5F7 !important;
        }

        .dock-opt-badge {
          position: absolute !important;
          right: 54px !important;
          background: #141316 !important;
          color: #FFFFFF !important;
          padding: 2px 8px !important;
          border-radius: 5px !important;
          font-size: 0.6rem !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.08em !important;
          white-space: nowrap !important;
          pointer-events: none !important;
        }

        body.ai-active .side-dock-container,
        body.ada-active .side-dock-container {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        .ada-popup-modal, .ai-popup-modal {
          position: fixed !important;
          bottom: 20px !important;
          right: 20px !important;
          width: 380px !important;
          max-width: calc(100vw - 32px) !important;
          background: #FFFFFF;
          border: 1px solid var(--card-border);
          border-radius: 20px !important;
          box-shadow: 0 16px 44px -8px rgba(0, 0, 0, 0.24);
          z-index: 999998;
          display: none;
          flex-direction: column;
          overflow: hidden;
          animation: modalFade 0.25s var(--spring-snap);
        }

        .ai-popup-modal {
          height: 520px !important;
          max-height: calc(100vh - 40px) !important;
        }

        .ada-popup-modal.show, .ai-popup-modal.show { display: flex; }

        @keyframes modalFade {
          from { opacity: 0; transform: translateY(14px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .panel-head {
          background: var(--rose-btn) !important;
          color: #FFFFFF !important;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.25) !important;
          box-shadow: 0 4px 14px rgba(227, 63, 108, 0.18);
        }

        .panel-head span {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.18rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #FFFFFF !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
        }

        .panel-close {
          background: rgba(255, 255, 255, 0.22) !important;
          border: 1px solid rgba(255, 255, 255, 0.4) !important;
          color: #FFFFFF !important;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 1.25rem;
          cursor: pointer;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .panel-close:hover {
          background: rgba(255, 255, 255, 0.4) !important;
          transform: scale(1.08);
        }

        .panel-content {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
          overflow-y: auto;
          background: var(--bg-cream);
        }

        .ada-tiles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 6px;
        }

        .ada-card-tile {
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 10px;
          padding: 12px 6px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .ada-card-tile:hover {
          border-color: var(--rose-accent);
          background: #FFF5F7;
        }

        .ada-card-tile.active {
          background: var(--rose-accent);
          color: #FFFFFF;
          border-color: var(--rose-accent);
        }

        .ada-card-icon { font-size: 1.25rem; }
        .ada-card-title { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; }

        .ada-reset-action {
          background: none;
          border: none;
          color: var(--rose-accent);
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          align-self: flex-end;
        }

        .chat-box {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 10px;
          background: #FAF8F5;
          border-radius: 12px;
          font-size: 0.85rem;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .chat-msg {
          padding: 10px 14px;
          border-radius: 14px;
          max-width: 85%;
          line-height: 1.45;
        }

        .chat-msg.bot {
          background: #FFFFFF;
          color: #141316;
          border: 1px solid rgba(0,0,0,0.08);
          align-self: flex-start;
        }

        .chat-msg.user {
          background: var(--rose-accent);
          color: #FFFFFF;
          align-self: flex-end;
        }

        .chat-input-row {
          display: flex;
          gap: 8px;
          padding-top: 4px;
        }

        .chat-input-row input {
          flex: 1;
          padding: 11px 14px;
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 999px;
          font-size: 0.84rem;
          font-family: inherit;
          outline: none;
          background: #FFFFFF;
        }

        .chat-input-row button {
          background: var(--rose-accent);
          color: #FFF;
          border: none;
          border-radius: 999px;
          padding: 0 18px;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(227, 63, 108, 0.3);
        }

        .compliance-footer-strip {
          font-size: 0.65rem;
          color: #8E8A85;
          text-align: center;
          line-height: 1.35;
          padding-top: 6px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        @media (max-width: 768px) {
          .site-nav {
            padding: 16px 20px;
            justify-content: center !important;
          }
          .brand-logo {
            margin: 0 auto !important;
            justify-content: center !important;
          }
          .brand-title {
            font-size: 1.05rem;
          }

          .hero-section {
            grid-template-columns: 1fr;
            padding: 0 0 32px 0 !important;
            gap: 22px;
            text-align: center;
          }

          .hero-video-wrapper {
            order: -1;
            width: 100vw;
            margin-left: calc(-50vw + 50%);
          }

          .slider-frame {
            max-width: 100% !important;
            width: 100% !important;
            height: 75vh !important;
            aspect-ratio: auto !important;
            border-radius: 0 0 20px 20px !important;
            border-left: none !important;
            border-right: none !important;
            border-top: none !important;
            touch-action: pan-y !important;
          }

          .hero-content {
            padding: 0 20px !important;
            gap: 14px;
            align-items: center;
            text-align: center;
          }

          .hero-pre-tag {
            margin: 0 auto;
            text-align: center;
          }

          .hero-title {
            font-size: 2.1rem !important;
            line-height: 1.15 !important;
            text-align: center !important;
            margin: 0 auto;
            letter-spacing: -0.02em;
          }

          .hero-desc {
            font-size: 0.9rem;
            text-align: center !important;
            margin: 0 auto;
          }

          .hero-pills {
            justify-content: center !important;
            margin: 8px auto !important;
          }

          .pill-item {
            font-size: 0.7rem;
            padding: 6px 14px;
            border-radius: 8px !important;
          }

          .hero-content > div:last-child {
            width: 100%;
            display: flex;
            justify-content: center;
          }

          .gold-btn {
            width: 100% !important;
            max-width: 380px;
            padding: 15px 24px !important;
            font-size: 0.76rem !important;
            margin: 0 auto;
            border-radius: 8px !important;
          }

          .authority-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .authority-card {
            padding: 14px 10px;
          }

          .case-card {
            width: 220px !important;
          }
          .case-img-box {
            height: 200px !important;
          }
          .review-card {
            width: 280px !important;
            padding: 20px !important;
          }

          .section-container {
            padding: 36px 18px !important;
          }

          .section-header {
            margin-bottom: 24px !important;
          }

          .section-title {
            font-size: 1.9rem !important;
            line-height: 1.18 !important;
            margin-bottom: 8px !important;
          }

          .grid-3-col, .grid-2-col {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }

          .white-card {
            padding: 26px 20px !important;
            border-radius: 12px !important;
          }

          .card-icon {
            font-size: 1.5rem !important;
            margin-bottom: 12px !important;
          }

          .white-card-title {
            font-size: 1.2rem !important;
          }

          .self-card {
            padding: 28px 18px !important;
            border-radius: 14px !important;
          }

          .self-list {
            margin: 18px auto 22px auto !important;
            gap: 14px !important;
          }

          .self-list li {
            font-size: 0.86rem !important;
            line-height: 1.5 !important;
          }

          .gps-clean-container {
            padding: 0 16px;
            margin: 20px auto 40px auto;
          }
          .gps-interactive-card {
            height: 300px;
          }

          .ada-popup-modal, 
          .ai-popup-modal {
            bottom: 16px !important;
            right: 12px !important;
            left: 12px !important;
            inset: auto 12px 16px 12px !important;
            width: calc(100vw - 24px) !important;
            max-width: calc(100vw - 24px) !important;
            height: min(520px, 75vh) !important;
            max-height: 75vh !important;
          }
        }
      `}</style>

      {/* 0. Top Navigation & Centered Brand Logo */}
      <header className="site-nav">
        <a href="#" className="brand-logo">
          <div className="brand-monogram">A</div>
          <div className="brand-title">AURA • BEVERLY HILLS</div>
        </a>
      </header>

      {/* 1. HERO FLAGSHIP SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-pre-tag">• BEVERLY HILLS PRIVATE PRACTICE</div>
          
          <h1 className="hero-title">
            Discreet Deep-Plane<br />Facial Architecture
          </h1>
          
          <p className="hero-desc">
            Permanent structural SMAS repositioning designed for natural youthful harmony. Zero distortion, zero "windswept" tension, and 100% anonymous private suites for discerning individuals.
          </p>

          <div className="hero-pills">
            <div className="pill-item"><span>🔑</span> Anonymous Valet Entry</div>
            <div className="pill-item"><span>🛡️</span> Quad-A Surgical Theater</div>
            <div className="pill-item"><span>🩺</span> MD Anesthesiologist Only</div>
          </div>

          <div style={{ marginTop: '10px', width: '100%' }}>
            <a href="#candidate-section" className="gold-btn service-trigger-btn" data-topic="VIP Consultation">Reserve VIP Consultation →</a>
          </div>
        </div>

        {/* Hero Video Slider Frame */}
        <div className="hero-video-wrapper">
          <div className="slider-frame" id="sliderWrapper">
            
            <div className="sound-toggle" id="soundBtn">
              <span id="soundIcon">🔇</span>
              <span id="soundText">Sound Off</span>
            </div>

            <div className="pane-video pane-left">
              <video id="beforeLoop" autoPlay muted loop playsInline preload="auto" poster="/niches/cosmetics/before-poster.jpg">
                <source src="/niches/cosmetics/cosmetic-befor-loop.mp4" type="video/mp4" />
              </video>
              <video id="beforeAction" className="pane-video action-layer" muted loop playsInline preload="auto" poster="/niches/cosmetics/before-poster.jpg">
                <source src="/niches/cosmetics/cosmetic-before-swap.mp4" type="video/mp4" />
              </video>
            </div>

            <div className="pane-video pane-right" id="afterPane">
              <video id="afterLoop" autoPlay muted loop playsInline preload="auto" poster="/niches/cosmetics/after-poster.jpg">
                <source src="/niches/cosmetics/cosmetic after loop.mp4" type="video/mp4" />
              </video>
              <video id="afterAction" className="pane-video action-layer" muted loop playsInline preload="auto" poster="/niches/cosmetics/after-poster.jpg">
                <source src="/niches/cosmetics/cosmetic-after-swap.mp4" type="video/mp4" />
              </video>
            </div>

            <div className="slider-divider-bar" id="dividerLine"></div>
            <div className="slider-knob" id="sliderKnob">
              <div className="knob-arrows">
                <span>&lsaquo;&rsaquo;</span>
              </div>
            </div>

            <div className="bottom-tags">
              <div className="b-tag">Pre-Treatment</div>
              <div className="b-tag">Post-Restoration</div>
            </div>

          </div>
          <div className="drag-hint">⟵ Drag Knob Left for Glow • Drag Right for Regret ⟶</div>
        </div>
      </section>

      {/* Surgical Authority Trust Cluster */}
      <section className="authority-trust-section">
        <div className="authority-grid">
          <div className="authority-card">
            <div className="authority-card-icon">🏛️</div>
            <div className="authority-card-title">ABPS Certified</div>
            <div className="authority-card-desc">Board Certified Plastic Surgeons Only</div>
          </div>
          <div className="authority-card">
            <div className="authority-card-icon">🛡️</div>
            <div className="authority-card-title">Quad-A Accredited</div>
            <div className="authority-card-desc">Hospital-Grade Sterility Standards</div>
          </div>
          <div className="authority-card">
            <div className="authority-card-icon">🔒</div>
            <div className="authority-card-title">100% HIPAA Private</div>
            <div className="authority-card-desc">Discreet Valet & Legal NDA Protocol</div>
          </div>
          <div className="authority-card">
            <div className="authority-card-icon">🩺</div>
            <div className="authority-card-title">MD Anesthesiology</div>
            <div className="authority-card-desc">Dedicated Board-Certified MD Care</div>
          </div>
        </div>
      </section>

      {/* 2. Press Bar */}
      <div className="press-bar">
        <div className="press-text">Discreet Luxury Aesthetics • Trusted By Industry Leaders & Celebrities</div>
        <div className="press-track">
          <div className="press-group">
            <span className="p-brand">Vogue</span>
            <span className="p-brand">Haute Living</span>
            <span className="p-brand">Elle</span>
            <span className="p-brand">Los Angeles Times</span>
            <span className="p-brand">Harper's Bazaar</span>
            <span className="p-brand">Netflix</span>
          </div>
          <div className="press-group">
            <span className="p-brand">Vogue</span>
            <span className="p-brand">Haute Living</span>
            <span className="p-brand">Elle</span>
            <span className="p-brand">Los Angeles Times</span>
            <span className="p-brand">Harper's Bazaar</span>
            <span className="p-brand">Netflix</span>
          </div>
        </div>
      </div>

      {/* 3. Case Studies Infinite Marquee */}
      <section style={{ padding: '44px 0 16px 0', textAlign: 'center' }}>
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <span className="sub-tag">Clinical Case Studies</span>
          <h2 className="section-title">Architectural Facial Transformations</h2>
          <p className="section-desc">Swipe with touch momentum or hold to examine surgical outcomes.</p>
        </div>

        <div className="inertial-scroll-box" id="casesScrollBox">
          <div className="inertial-scroll-inner" id="casesScrollInner">
            
            <div className="case-card">
              <div className="case-img-box">
                <span className="case-badge">Submentoplasty</span>
                <img src="/niches/cosmetics/sc30.jpg" alt="Jawline Case" />
              </div>
              <div className="case-info">
                <div className="case-title">Jawline & Cervical Definition</div>
                <div className="case-meta">Age 38 • Sculpted deep-cervical angle</div>
              </div>
            </div>

            <div className="case-card">
              <div className="case-img-box">
                <span className="case-badge">Natural Harmony</span>
                <img src="/niches/cosmetics/images.jfif" alt="Facial Balancing Case" />
              </div>
              <div className="case-info">
                <div className="case-title">Complete Facial Balancing</div>
                <div className="case-meta">Age 44 • Restored resting symmetry</div>
              </div>
            </div>

            <div className="case-card">
              <div className="case-img-box">
                <span className="case-badge">Full Face Renewal</span>
                <img src="/niches/cosmetics/istockphoto-2159264716-612x612.jpg" alt="SMAS Neck Lift Case" />
              </div>
              <div className="case-info">
                <div className="case-title">Structural SMAS & Neck Lift</div>
                <div className="case-meta">Age 51 • Deep-cellular restoration</div>
              </div>
            </div>

            <div className="case-card">
              <div className="case-img-box">
                <span className="case-badge">Lateral Elevation</span>
                <img src="/niches/cosmetics/istockphoto-1210828134-612x612.jpg" alt="Lateral Profile Case" />
              </div>
              <div className="case-info">
                <div className="case-title">Lateral Profile & Brow Angle</div>
                <div className="case-meta">Age 49 • Eliminating heavy hooding</div>
              </div>
            </div>

            <div className="case-card">
              <div className="case-img-box">
                <span className="case-badge">Perioral Detail</span>
                <img src="/niches/cosmetics/images (1).jfif" alt="Micro Texture Case" />
              </div>
              <div className="case-info">
                <div className="case-title">Micro Texture Smoothing</div>
                <div className="case-meta">Age 55 • Precision erbium structural fix</div>
              </div>
            </div>

            <div className="case-card">
              <div className="case-img-box">
                <span className="case-badge">Deep-Plane Lift</span>
                <img src="/niches/cosmetics/denise-richard-feature-2026-lead-sidebyside.webp" alt="Midface Case" />
              </div>
              <div className="case-info">
                <div className="case-title">Midface & Jaw Restoration</div>
                <div className="case-meta">Age 52 • Structural SMAS release</div>
              </div>
            </div>

            <div className="case-card">
              <div className="case-img-box">
                <span className="case-badge">Dual-Pathway</span>
                <img src="/niches/cosmetics/Makeup.webp" alt="Volume Radiance Case" />
              </div>
              <div className="case-info">
                <div className="case-title">Volume & Radiance Harmony</div>
                <div className="case-meta">Age 46 • Natural biostimulatory glow</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. 100% Discreet VIP Sanctuary */}
      <section className="section-container">
        <div className="section-header">
          <span className="sub-tag">Uncompromising Privacy</span>
          <h2 className="section-title">100% Discreet VIP Sanctuary</h2>
        </div>

        <div className="grid-3-col">
          <div className="white-card">
            <div className="card-icon">🔑</div>
            <h3 className="white-card-title">Anonymous Valet Entry</h3>
            <p className="white-card-text">Private, discreet rear entrance directly accessible from VIP valet bays. Step in and out without public exposure or street visibility.</p>
          </div>

          <div className="white-card">
            <div className="card-icon">🏛️</div>
            <h3 className="white-card-title">Zero Public Waiting</h3>
            <p className="white-card-text">You are guided directly into dedicated private executive suites for consultation. You will never encounter another patient.</p>
          </div>

          <div className="white-card">
            <div className="card-icon">📜</div>
            <h3 className="white-card-title">Strict Legal NDA Protocol</h3>
            <p className="white-card-text">Comprehensive mutual non-disclosure agreements maintained across all surgical staff, coordinators, and medical personnel.</p>
          </div>
        </div>
      </section>

      {/* 5. Non-Surgical Dual-Pathway */}
      <section className="section-container">
        <div className="section-header">
          <span className="sub-tag">Zero Scalpel • Zero Downtime</span>
          <h2 className="section-title">The Non-Surgical Dual-Pathway</h2>
          <p className="section-desc">Instant structural elevation and collagen induction for busy executives requiring immediate social recovery.</p>
        </div>

        <div className="grid-2-col">
          <div className="white-card">
            <span className="path-pill">Pathway A</span>
            <h3 className="white-card-title" style={{ fontSize: '1.45rem' }}>Liquid Biostimulatory Lift</h3>
            <p className="white-card-text">High-density structural volumization using bio-stimulators that stimulate your body's native type-1 collagen synthesis over 90 days.</p>
            
            <ul className="checklist">
              <li>Restores midface, temple, and jawline architectural volume</li>
              <li>60-minute in-clinic "Lunchtime Rejuvenation" session</li>
              <li>Zero bruising protocol with blunt-tip micro-cannulas</li>
            </ul>

            <a href="#candidate-section" className="gold-btn service-trigger-btn" data-topic="Liquid Biostimulatory Lift" style={{ width: '100%' }}>Explore Liquid Pathway →</a>
          </div>

          <div className="white-card">
            <span className="path-pill">Pathway B</span>
            <h3 className="white-card-title" style={{ fontSize: '1.45rem' }}>Precision Micro-Laser Architecture</h3>
            <p className="white-card-text">Multi-layered fractional laser & RF thermal remodeling targeting dermal laxity, deep creping, and neck band slackening.</p>
            
            <ul className="checklist">
              <li>Deep SMAS heating triggers permanent elastin contraction</li>
              <li>Day 1 instant tightness vs Day 30 sustained neocollagenesis</li>
              <li>Computerized depth control ensures uniform dermal protection</li>
            </ul>

            <a href="#candidate-section" className="gold-btn service-trigger-btn" data-topic="Precision Micro-Laser Architecture" style={{ width: '100%' }}>Explore Laser Pathway →</a>
          </div>
        </div>
      </section>

      {/* 6. Surgical Safety & QUAD-A */}
      <section className="section-container">
        <div className="section-header">
          <span className="sub-tag">Clinical Excellence</span>
          <h2 className="section-title">Surgical Safety & Quad-A Standards</h2>
        </div>

        <div className="grid-3-col">
          <div className="white-card">
            <div className="card-icon">🛡️</div>
            <h3 className="white-card-title">Quad-A Accredited Center</h3>
            <p className="white-card-text">Hospital-grade sterile private surgical suites operating under stringent protocols without hospital infection risks.</p>
          </div>

          <div className="white-card">
            <div className="card-icon">🩺</div>
            <h3 className="white-card-title">Board-Certified MD Anesthesiologists</h3>
            <p className="white-card-text">Zero nurse anesthetists for major procedures. Dedicated medical doctors continually manage and protect your vitals.</p>
          </div>

          <div className="white-card">
            <div className="card-icon">✨</div>
            <h3 className="white-card-title">Deep-Plane Harmony</h3>
            <p className="white-card-text">Structural SMAS and deep-plane restoration designed for anatomical harmony. Zero artificial, tight, or "pulled" look.</p>
          </div>
        </div>
      </section>

      {/* 7. Body Architecture & Mommy Makeover */}
      <section className="section-container">
        <div className="section-header">
          <span className="sub-tag">Full-Body Harmony</span>
          <h2 className="section-title">Body Architecture & Mommy Makeover</h2>
          <p className="section-desc">Single safe anesthesia session combining abdominal restoration, breast contouring, and high-definition waist sculpting.</p>
        </div>

        <div className="grid-3-col">
          <div className="white-card">
            <div className="card-icon">💎</div>
            <h3 className="white-card-title">Combined Multi-Stage Harmony</h3>
            <p className="white-card-text">Simultaneous diastasis recti repair, excess skin excision, and breast lift executed under one coordinated MD surgical session.</p>
          </div>

          <div className="white-card">
            <div className="card-icon">💆</div>
            <h3 className="white-card-title">Private Lymphatic Concierge</h3>
            <p className="white-card-text">Customized postoperative lymphatic drainage massages provided directly at your bedside by certified recovery therapists.</p>
          </div>

          <div className="white-card">
            <div className="card-icon">🏡</div>
            <h3 className="white-card-title">24/7 Home Registered Nursing</h3>
            <p className="white-card-text">Discreet, dedicated recovery nursing delivered to your private residence or recovery villa for the first 72 critical hours.</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <a href="#candidate-section" className="gold-btn service-trigger-btn" data-topic="Body Architecture Suite">Inquire for Body Architecture Suite →</a>
        </div>
      </section>

      {/* 8. The Fly-In Sanctuary */}
      <section className="section-container">
        <div className="section-header">
          <span className="sub-tag">Global Destination</span>
          <h2 className="section-title">The "Fly-In" Executive Sanctuary</h2>
          <p className="section-desc">White-glove surgical travel logistics for national and international clients flying into Los Angeles.</p>
        </div>

        <div className="grid-3-col">
          <div className="white-card">
            <div className="card-icon">✈️</div>
            <h3 className="white-card-title">Private Tarmac & Chauffeur</h3>
            <p className="white-card-text">Black Escalade chauffeur transfer directly from LAX private terminals or private hangars (Van Nuys/Burbank) to your clinic suite.</p>
          </div>

          <div className="white-card">
            <div className="card-icon">🏨</div>
            <h3 className="white-card-title">5-Star Partner Recovery Suites</h3>
            <p className="white-card-text">Coordinated healing stay at luxury Beverly Hills partner hotels, fully equipped with private post-op medical amenities.</p>
          </div>

          <div className="white-card">
            <div className="card-icon">💻</div>
            <h3 className="white-card-title">Virtual 3D Pre-Flight Scan</h3>
            <p className="white-card-text">Comprehensive high-resolution remote anatomical review and surgical recovery trajectory mapped before booking flights.</p>
          </div>
        </div>
      </section>

      {/* 9. Google 5-Star Reviews (Infinite Marquee) */}
      <section style={{ padding: '34px 0 20px 0', textAlign: 'center' }}>
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <span className="sub-tag">Verified Feedback</span>
          <h2 className="section-title">Google 5-Star Elite Testimonials</h2>
          <p className="section-desc">Touch and hold to pause reading; swipe with momentum.</p>
        </div>

        <div className="inertial-scroll-box" id="reviewsScrollBox">
          <div className="inertial-scroll-inner" id="reviewsScrollInner">
            
            <div className="review-card">
              <div className="stars">★★★★★</div>
              <div className="review-quote">"The anonymous valet entry changed everything. Zero public waiting, and the deep-plane restoration looks breathtakingly natural."</div>
              <div className="reviewer-name">Lady E. Sterling</div>
              <div className="reviewer-loc">London, UK • Verified Patient</div>
            </div>

            <div className="review-card">
              <div className="stars">★★★★★</div>
              <div className="review-quote">"Flown in via private jet charter coordinated directly by their concierge. The recovery suite and private nurses were pure 5-star luxury."</div>
              <div className="reviewer-name">Marcus V.</div>
              <div className="reviewer-loc">Zurich, Switzerland • Verified Patient</div>
            </div>

            <div className="review-card">
              <div className="stars">★★★★★</div>
              <div className="review-quote">"No pulled 'windswept' look whatsoever. The architectural facial harmony achieved here is genuine medical art."</div>
              <div className="reviewer-name">Dr. Alistair M.</div>
              <div className="reviewer-loc">Beverly Hills, CA • Verified Patient</div>
            </div>

            <div className="review-card">
              <div className="stars">★★★★★</div>
              <div className="review-quote">"Absolute discretion from start to finish. Strict legal NDAs gave me complete peace of mind during recovery."</div>
              <div className="reviewer-name">Anonymous Executive</div>
              <div className="reviewer-loc">New York, NY • Verified Patient</div>
            </div>

          </div>
        </div>
      </section>

      {/* 10. Self-Assessment */}
      <section className="section-container" id="candidate-section" style={{ paddingTop: '10px', paddingBottom: '30px' }}>
        <div className="self-card">
          <span className="sub-tag">Self-Assessment</span>
          <h2 className="section-title" style={{ fontSize: '2.1rem' }}>Am I A Candidate For Architectural Rejuvenation?</h2>

          <ul className="self-list">
            <li>
              <span>✓</span>
              <div>Seeking structural facial tightening and jawline restoration without overfill or unnatural pillow-face effects?</div>
            </li>
            <li>
              <span>✓</span>
              <div>Desire permanent anatomical rejuvenation with rapid 10–14 day private recovery under board-certified MD oversight?</div>
            </li>
            <li>
              <span>✓</span>
              <div>Require 100% discreet private suites, rear valet arrivals, and legally binding mutual non-disclosure agreements?</div>
            </li>
          </ul>

          <button type="button" className="gold-btn" id="aiCandidacyTriggerBtn" style={{ padding: '16px 36px' }}>
            Check Candidacy with AI Concierge →
          </button>
        </div>
      </section>

      {/* 11. ULTRA-CLEAN FULL-CARD CLICKABLE GPS MAP */}
      <section className="gps-clean-container">
        <a href="https://maps.google.com/?q=9400+Wilshire+Blvd,+Beverly+Hills,+CA+90212" target="_blank" rel="noopener noreferrer" className="gps-interactive-card" title="Click anywhere to open in Google Maps">
          <div className="gps-click-shield"></div>
          <iframe 
            title="Beverly Hills Practice GPS Map"
            src="https://maps.google.com/maps?q=9400%20Wilshire%20Blvd,%20Beverly%20Hills,%20CA%2090212&t=&z=15&ie=UTF8&iwloc=&output=embed"
            loading="lazy">
          </iframe>
        </a>
      </section>

      {/* 12. BOTTOM-RIGHT PURE TRANSPARENT ROBOT HEAD TRIGGER */}
      <div className="side-dock-container" id="sideDock">
        <div className="dock-popout-options">
          <button type="button" className="dock-opt-btn" id="dockAdaBtn" title="ADA Accessibility">
            <span>♿</span>
            <span className="dock-opt-badge">ADA</span>
          </button>

          <button type="button" className="dock-opt-btn" id="dockAiBtn" title="VIP AI Concierge">
            <span>✨</span>
            <span className="dock-opt-badge">AI</span>
          </button>
        </div>

        <div className="peeking-tab-handle" id="peekingHandle" title="VIP Concierge & ADA">
          🤖
        </div>
      </div>

      {/* 13. STANDALONE ADA ACCESSIBILITY MODAL */}
      <div className="ada-popup-modal" id="adaModal">
        <div className="panel-head">
          <span>ADA Accessibility</span>
          <button type="button" className="panel-close" id="adaCloseBtn">&times;</button>
        </div>
        <div className="panel-content">
          <button type="button" className="ada-reset-action" id="adaReset">Reset All</button>
          <div className="ada-tiles-grid">
            <div className="ada-card-tile" id="adaTileCursor">
              <span className="ada-card-icon">⮹</span>
              <span className="ada-card-title">Cursor</span>
            </div>
            <div className="ada-card-tile" id="adaTileContrast">
              <span className="ada-card-icon">◑</span>
              <span className="ada-card-title">Contrast +</span>
            </div>
            <div className="ada-card-tile" id="adaTileText">
              <span className="ada-card-icon">🔍</span>
              <span className="ada-card-title">Bigger Text</span>
            </div>
            <div className="ada-card-tile" id="adaTileDesaturate">
              <span className="ada-card-icon">◐</span>
              <span className="ada-card-title">Desaturate</span>
            </div>
            <div className="ada-card-tile" id="adaTileLinks">
              <span className="ada-card-icon">🔗</span>
              <span className="ada-card-title">Highlight Links</span>
            </div>
            <div className="ada-card-tile" id="adaTileAudio">
              <span className="ada-card-icon">🔊</span>
              <span className="ada-card-title">Read Page</span>
            </div>
          </div>
          <div className="compliance-footer-strip">
            ADA Title III Compliant • Strict USA Accessibility Standards
          </div>
        </div>
      </div>

      {/* 14. STANDALONE VIP AI CONCIERGE CHAT MODAL */}
      <div className="ai-popup-modal" id="aiModal">
        <div className="panel-head">
          <span>VIP AI Concierge</span>
          <button type="button" className="panel-close" id="aiCloseBtn">&times;</button>
        </div>
        <div className="panel-content">
          <div className="chat-box" id="aiChatBox">
            <div className="chat-msg bot">
              Welcome to Aura Beverly Hills. How may I discreetly guide your consultation candidacy today?
            </div>
          </div>
          <div className="chat-input-row">
            <input type="text" id="aiChatInput" placeholder="Ask about procedure, downtime, NDA..." />
            <button type="button" id="aiChatSend">Send</button>
          </div>
          <div className="compliance-footer-strip">
            HIPAA Discreet Protocol • *Informational only. Not medical advice. In emergency call 911.
          </div>
        </div>
      </div>
    </>
  );
}