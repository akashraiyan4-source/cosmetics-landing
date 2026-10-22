'use client';

import React, { useEffect } from 'react';
import { API_ENDPOINTS, cosmeticsIdentity } from '../../apiEndpoints';
import { apiRequest, readReply } from '../../lib/apiClient';
import { callCosmeticsApi, prefetchBackendCatalog } from '../../lib/cosmeticsApis';
import { useHeroVideoEngine } from '../../lib/useHeroVideoEngine';
import { useBeforeAfterSlider } from '../../lib/useBeforeAfterSlider';

const OFFLINE_CHAT_REPLY = 'Inquiry logged under VIP protocol. Our concierge desk will follow up discreetly.';

/**
 * Ultimate Anti-FOUC & Anti-Jump Guard:
 * পেজ লোড হওয়ার প্রথম ফ্রেম থেকেই ব্যাকগ্রাউন্ড এবং ডানদিকের ডক বারকে ফিক্সড পজিশনে আটকে রাখবে,
 * ফলে রিফ্রেশ করলে আর কোনোভাবেই এআই বার লাফাবে না বা পেজ গ্লিচ করবে না।
 */
const CRITICAL_ANTI_JUMP_CSS = `
  html, body, #cosmetics-root {
    background-color: #FAF8F5 !important;
    color: #1A1917;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
  #sideDock {
    position: fixed !important;
    right: 0 !important;
    bottom: 28px !important;
    z-index: 9990 !important;
    transform: translateZ(0);
    backface-visibility: hidden;
  }
  #adaModal:not(.show), #aiModal:not(.show) {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    transform: translate3d(0, 16px, 0);
  }
  .hero-video-wrapper .slider-frame {
    background-color: #EAE5DF;
    transform: translateZ(0);
  }
  .brand-card-wrapper {
    background: #FFFFFF;
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 16px;
    padding: 16px 24px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.04);
    max-width: 1200px;
    margin: 20px auto 10px auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export default function CosmeticPage() {
  useHeroVideoEngine();
  useBeforeAfterSlider();

  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const on = (target: EventTarget | null, type: string, listener: EventListener, options?: AddEventListenerOptions) => {
      if (!target) return;
      target.addEventListener(type, listener, options);
      cleanups.push(() => target.removeEventListener(type, listener, options));
    };

    prefetchBackendCatalog();
    void callCosmeticsApi('analytics', { event: 'page_view', path: '/niches/cosmetics' }, { method: 'POST', timeoutMs: 4000, retries: 0 });

    const beforeLoop = document.getElementById('beforeLoop') as HTMLVideoElement | null;
    const beforeAction = document.getElementById('beforeAction') as HTMLVideoElement | null;
    const afterLoop = document.getElementById('afterLoop') as HTMLVideoElement | null;
    const afterAction = document.getElementById('afterAction') as HTMLVideoElement | null;
    const allVideos = [beforeLoop, beforeAction, afterLoop, afterAction].filter((v): v is HTMLVideoElement => Boolean(v));

    const soundBtn = document.getElementById('soundBtn');
    const soundIcon = document.getElementById('soundIcon');
    const soundText = document.getElementById('soundText');

    let isMuted = true;
    on(soundBtn, 'pointerdown', (e) => e.stopPropagation(), { passive: true });
    on(soundBtn, 'click', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      allVideos.forEach((video) => { video.muted = isMuted; });
      if (!isMuted) {
        allVideos.forEach((video) => { void video.play()?.catch(() => undefined); });
      }
      if (soundIcon && soundText) {
        soundIcon.textContent = isMuted ? '🔇' : '🔊';
        soundText.textContent = isMuted ? 'Sound Off' : 'Sound On';
      }
    });

    function initInertialMarquee(boxId: string, innerId: string, baseSpeed = 0.55) {
      const box = document.getElementById(boxId);
      const inner = document.getElementById(innerId);
      if (!box || !inner) return;

      let scrollX = 0;
      let velocity = baseSpeed;
      let isDraggingTrack = false;
      let lastX = 0;
      let lastTime = Date.now();
      let animId = 0;

      if (!inner.dataset.duplicated) {
        inner.innerHTML += inner.innerHTML;
        inner.dataset.duplicated = 'true';
      }
      const totalWidth = inner.scrollWidth / 2;

      const step = () => {
        if (!isDraggingTrack && totalWidth > 0) {
          velocity = velocity * 0.96 + baseSpeed * 0.04;
          scrollX += velocity;
          if (scrollX >= totalWidth) scrollX -= totalWidth;
          else if (scrollX < 0) scrollX += totalWidth;
          inner.style.transform = `translate3d(${-scrollX}px, 0, 0)`;
        }
        animId = requestAnimationFrame(step);
      };

      on(box, 'pointerdown', (e) => {
        const ev = e as PointerEvent;
        isDraggingTrack = true;
        lastX = ev.clientX;
        lastTime = Date.now();
        box.style.cursor = 'grabbing';
        try { box.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
      }, { passive: true });

      on(box, 'pointermove', (e) => {
        if (!isDraggingTrack || totalWidth <= 0) return;
        const ev = e as PointerEvent;
        const now = Date.now();
        const dt = now - lastTime;
        const dx = ev.clientX - lastX;
        if (dt > 0) velocity = -dx * (16 / dt) * 0.75;
        scrollX -= dx;
        if (scrollX >= totalWidth) scrollX -= totalWidth;
        else if (scrollX < 0) scrollX += totalWidth;
        inner.style.transform = `translate3d(${-scrollX}px, 0, 0)`;
        lastX = ev.clientX;
        lastTime = now;
      }, { passive: true });

      const endTrackDrag = (e: Event) => {
        if (!isDraggingTrack) return;
        isDraggingTrack = false;
        box.style.cursor = 'grab';
        try { box.releasePointerCapture((e as PointerEvent).pointerId); } catch { /* ignore */ }
      };
      on(box, 'pointerup', endTrackDrag, { passive: true });
      on(box, 'pointercancel', endTrackDrag, { passive: true });
      animId = requestAnimationFrame(step);
      cleanups.push(() => cancelAnimationFrame(animId));
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

    const openAiModal = () => {
      adaModal?.classList.remove('show');
      aiModal?.classList.add('show');
      sideDock?.classList.remove('expanded');
      document.body.classList.remove('ada-active');
      document.body.classList.add('ai-active');
    };

    on(peekingHandle, 'click', (e) => {
      e.stopPropagation();
      if (adaModal?.classList.contains('show') || aiModal?.classList.contains('show')) closeAllSideModals();
      else sideDock?.classList.toggle('expanded');
    });
    on(dockAdaBtn, 'click', (e) => {
      e.stopPropagation();
      aiModal?.classList.remove('show');
      adaModal?.classList.add('show');
      sideDock?.classList.remove('expanded');
      document.body.classList.remove('ai-active');
      document.body.classList.add('ada-active');
    });
    on(dockAiBtn, 'click', (e) => {
      e.stopPropagation();
      openAiModal();
      window.setTimeout(() => (document.getElementById('aiChatInput') as HTMLInputElement | null)?.focus(), 150);
    });
    on(document, 'click', (e) => {
      if (!sideDock || !adaModal || !aiModal) return;
      const target = e.target as Node;
      if (!sideDock.contains(target) && !adaModal.contains(target) && !aiModal.contains(target)) closeAllSideModals();
    });

    const aiChatBox = document.getElementById('aiChatBox');
    const aiChatInput = document.getElementById('aiChatInput') as HTMLInputElement | null;
    const aiChatSend = document.getElementById('aiChatSend');
    let chatBusy = false;
    let activeTopic: string | null = null;
    let topicInFlight: string | null = null;

    const historyFromDom = () => {
      if (!aiChatBox) return [];
      return [...aiChatBox.querySelectorAll('.chat-msg')].map((node) => ({
        role: node.classList.contains('user') ? 'user' : 'assistant',
        content: (node.textContent || '').trim(),
      })).filter((turn) => turn.content && turn.content !== '…' && turn.content !== 'Analyzing inquiry with VIP AI...');
    };

    const appendBot = (text: string) => {
      if (!aiChatBox) return null;
      const el = document.createElement('div');
      el.className = 'chat-msg bot';
      el.textContent = text;
      aiChatBox.appendChild(el);
      aiChatBox.scrollTop = aiChatBox.scrollHeight;
      return el;
    };

    const openTopicConversation = async (topic: string) => {
      if (topicInFlight === topic) return;
      if (activeTopic === topic && (aiChatBox?.querySelectorAll('.chat-msg').length ?? 0) > 1) return;
      topicInFlight = topic;
      activeTopic = topic;
      const typing = appendBot('…');
      const result = await apiRequest<{ reply?: string }>(API_ENDPOINTS.aiChat, {
        body: {
          ...cosmeticsIdentity,
          niche: 'cosmetics',
          message: topic,
          selectedTopic: topic,
          history: [],
        },
        timeoutMs: 20000,
        retries: 1,
      });
      const reply = result.ok ? (readReply(result.data) ?? OFFLINE_CHAT_REPLY) : OFFLINE_CHAT_REPLY;
      if (typing) typing.textContent = reply;
      else appendBot(reply);
      if (aiChatBox) aiChatBox.scrollTop = aiChatBox.scrollHeight;
      topicInFlight = null;
    };

    document.querySelectorAll('.service-trigger-btn').forEach((btn) => {
      on(btn, 'click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const topic = (e.currentTarget as HTMLElement).getAttribute('data-topic') || 'consultation';
        openAiModal();
        void openTopicConversation(topic);
      }, { capture: true });
    });

    on(aiCandidacyTriggerBtn, 'click', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      openAiModal();
      window.setTimeout(() => aiChatInput?.focus(), 150);
      void callCosmeticsApi('leadScoring', { source: 'candidacy_check' }, { timeoutMs: 4000, retries: 0 });
    }, { capture: true });

    on(adaCloseBtn, 'click', closeAllSideModals);
    on(aiCloseBtn, 'click', closeAllSideModals);

    const adaTileCursor = document.getElementById('adaTileCursor');
    const adaTileContrast = document.getElementById('adaTileContrast');
    const adaTileText = document.getElementById('adaTileText');
    const adaTileDesaturate = document.getElementById('adaTileDesaturate');
    const adaTileLinks = document.getElementById('adaTileLinks');
    const adaTileAudio = document.getElementById('adaTileAudio');
    const adaReset = document.getElementById('adaReset');

    on(adaTileCursor, 'click', () => { document.body.classList.toggle('large-cursor'); adaTileCursor?.classList.toggle('active'); });
    on(adaTileContrast, 'click', () => { document.body.classList.toggle('high-contrast'); adaTileContrast?.classList.toggle('active'); });
    on(adaTileText, 'click', () => { document.body.classList.toggle('large-text'); adaTileText?.classList.toggle('active'); });
    on(adaTileDesaturate, 'click', () => { document.body.classList.toggle('desaturate'); adaTileDesaturate?.classList.toggle('active'); });
    on(adaTileLinks, 'click', () => { document.body.classList.toggle('highlight-links'); adaTileLinks?.classList.toggle('active'); });
    on(adaTileAudio, 'click', () => {
      if (!('speechSynthesis' in window)) { alert('Audio narration not supported.'); return; }
      window.speechSynthesis.cancel();
      const titleEl = document.querySelector('.hero-title');
      const descEl = document.querySelector('.hero-desc');
      const utterance = new SpeechSynthesisUtterance(`${titleEl?.textContent ?? ''}. ${descEl?.textContent ?? ''}`);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
      adaTileAudio?.classList.toggle('active');
    });
    on(adaReset, 'click', () => {
      document.body.classList.remove('large-cursor', 'high-contrast', 'large-text', 'desaturate', 'highlight-links');
      [adaTileCursor, adaTileContrast, adaTileText, adaTileDesaturate, adaTileLinks, adaTileAudio].forEach((el) => el?.classList.remove('active'));
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    });

    const sendAiChat = async () => {
      if (!aiChatInput || !aiChatBox || chatBusy) return;
      const txt = aiChatInput.value.trim();
      if (!txt) return;
      chatBusy = true;
      const userDiv = document.createElement('div');
      userDiv.className = 'chat-msg user';
      userDiv.textContent = txt;
      aiChatBox.appendChild(userDiv);
      aiChatInput.value = '';
      const botDiv = appendBot('Analyzing inquiry with VIP AI...') as HTMLDivElement;
      const result = await apiRequest<{ reply?: string }>(API_ENDPOINTS.aiChat, {
        body: {
          ...cosmeticsIdentity,
          niche: 'cosmetics',
          message: txt,
          ...(activeTopic ? { selectedTopic: activeTopic } : {}),
          history: historyFromDom(),
        },
        timeoutMs: 20000,
        retries: 1,
      });
      botDiv.textContent = result.ok ? (readReply(result.data) ?? OFFLINE_CHAT_REPLY) : OFFLINE_CHAT_REPLY;
      aiChatBox.scrollTop = aiChatBox.scrollHeight;
      chatBusy = false;
    };

    on(aiChatSend, 'click', () => { void sendAiChat(); });
    on(aiChatInput, 'keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') void sendAiChat(); });

    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      document.body.classList.remove('ai-active', 'ada-active', 'large-cursor', 'high-contrast', 'large-text', 'desaturate', 'highlight-links');
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <main id="cosmetics-root" style={{ backgroundColor: '#FAF8F5', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: CRITICAL_ANTI_JUMP_CSS }} />

      {/* 0. Top Navigation & Centered Brand Logo inside a Premium Card Container */}
      <div className="brand-card-wrapper">
        <header className="site-nav" style={{ width: '100%', margin: 0, padding: 0, background: 'transparent', border: 'none' }}>
          <a href="#" className="brand-logo" style={{ margin: '0 auto' }}>
            <div className="brand-monogram">A</div>
            <div className="brand-title">AURA • BEVERLY HILLS</div>
          </a>
        </header>
      </div>

      {/* 1. HERO FLAGSHIP SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-pre-tag">BEVERLY HILLS PRIVATE PRACTICE</div>
          
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
          <div className="slider-frame" id="sliderWrapper" style={{ touchAction: 'none' }}>
            
            <div className="sound-toggle" id="soundBtn">
              <span id="soundIcon">🔇</span>
              <span id="soundText">Sound Off</span>
            </div>

            <div className="pane-video pane-left">
              <video
                id="beforeLoop"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster="/niches/cosmetics/before-poster.jpg"
                disablePictureInPicture
                aria-hidden
              >
                <source src="/niches/cosmetics/cosmetic-befor-loop.mp4" type="video/mp4" />
              </video>
              <video
                id="beforeAction"
                className="pane-video action-layer"
                muted
                loop
                playsInline
                preload="auto"
                poster="/niches/cosmetics/before-poster.jpg"
                disablePictureInPicture
                aria-hidden
              >
                <source src="/niches/cosmetics/cosmetic-before-swap.mp4" type="video/mp4" />
              </video>
            </div>

            <div className="pane-video pane-right" id="afterPane">
              <video
                id="afterLoop"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster="/niches/cosmetics/after-poster.jpg"
                disablePictureInPicture
                aria-hidden
              >
                <source src="/niches/cosmetics/cosmetic after loop.mp4" type="video/mp4" />
              </video>
              <video
                id="afterAction"
                className="pane-video action-layer"
                muted
                loop
                playsInline
                preload="auto"
                poster="/niches/cosmetics/after-poster.jpg"
                disablePictureInPicture
                aria-hidden
              >
                <source src="/niches/cosmetics/cosmetic-after-swap.mp4" type="video/mp4" />
              </video>
            </div>

            <div className="slider-divider-bar" id="dividerLine" style={{ willChange: 'transform' }}></div>
            <div className="slider-knob" id="sliderKnob" style={{ willChange: 'transform' }}>
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
      <div
        className="side-dock-container"
        id="sideDock"
        style={{ position: 'fixed', right: 0, bottom: '28px', zIndex: 9990 }}
      >
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
    </main>
  );
}