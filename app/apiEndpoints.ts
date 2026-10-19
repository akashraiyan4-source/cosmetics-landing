/**
 * Public contract with the Universal Backend.
 *
 * Every landing page (dental, cosmetics, solar, roofing, medspa, …) calls the same endpoints; the only
 * thing that changes per page is the `niche` field in the request body.
 *
 * Configure the backend with NEXT_PUBLIC_BACKEND_URL (see .env.example). `next.config.js` injects the
 * production default, so the fallback below only applies when this file is used outside Next.js.
 */
const DEFAULT_BACKEND_URL = 'https://smileway-backend.vercel.app';

function resolveBackendUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_BACKEND_URL || '').trim();
  const candidate = configured || DEFAULT_BACKEND_URL;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('unsupported protocol');
    return url.origin + url.pathname.replace(/\/+$/, '');
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[apiEndpoints] Invalid NEXT_PUBLIC_BACKEND_URL "${candidate}" – falling back to ${DEFAULT_BACKEND_URL}`);
    }
    return DEFAULT_BACKEND_URL;
  }
}

export const BACKEND_URL = resolveBackendUrl();
export const NICHE = 'cosmetic-surgery' as const;

const endpoint = (path: string) => `${BACKEND_URL}/api/${path}`;

export const API_ENDPOINTS = {
  // AI Chat & Concierge
  aiChat: endpoint('ai-chat'),

  // Analytics & quoting
  analytics: endpoint('analytics'),
  quoteCalculator: endpoint('quote-calculator'),

  // Booking engine
  booking: endpoint('booking'),
  appointmentCancel: endpoint('appointment-cancel'),
  appointmentCheck: endpoint('appointment-check'),
  appointmentConfirm: endpoint('appointment-confirm'),
  appointmentCreate: endpoint('appointment-create'),
  slotLock: endpoint('slot-lock'),
  appointmentReschedule: endpoint('appointment-reschedule'),

  // Marketing & engagement automation
  broadcast: endpoint('broadcast'),
  consultation: endpoint('consultation'),
  costEstimator: endpoint('cost-estimator'),
  flyInConcierge: endpoint('fly-in-concierge'),
  followUp: endpoint('follow-up'),

  // Integrations
  googleCalendarSync: endpoint('google-calendar-sync'),
  googleMapsGeocoding: endpoint('google-maps-geocoding'),
  insurance: endpoint('insurance'),
  intakeDb: endpoint('intake-db'),
  leadNotificationWebhook: endpoint('lead-notification-webhook'),
  leadScoring: endpoint('lead-scoring'),
  longTermNurture: endpoint('long-term-nurture'),
  loyalty: endpoint('loyalty'),
  missedCallWebhook: endpoint('missed-call-webhook'),
  multilanguage: endpoint('multilanguage'),
  ndaProtocol: endpoint('nda-protocol'),
  noShowRecovery: endpoint('no-show-recovery'),
  onboarding: endpoint('onboarding'),
  invoice: endpoint('invoice'),
  recovery: endpoint('recovery'),
  prepReminder: endpoint('prep-reminder'),
  recall: endpoint('recall'),
  referral: endpoint('referral'),
  googleReviews: endpoint('google-reviews'),
  sentimentAnalyzer: endpoint('sentiment-analyzer'),
  faqBot: endpoint('faq-bot'),
  staffAlert: endpoint('staff-alert'),
  vectorRag: endpoint('vector-rag'),
  visualSimulation: endpoint('visual-simulation'),

  // Voice AI bridge
  voiceAgentIncoming: endpoint('voice-agent-bridge/incoming-call'),
  voiceSession: endpoint('voice-session'),
  missedCallCallback: endpoint('missed-call-callback'),
  voiceProcessSpeech: endpoint('voice-agent-bridge/process-speech'),
  voiceTransferFallback: endpoint('voice-agent-bridge/transfer-fallback'),
  voiceChat: endpoint('voice-chat'),
  voiceChatAdvanced: endpoint('voice-chat-advanced'),

  // Extra aliases from the Universal Backend rewrite table
  smsConcierge: endpoint('sms-concierge'),
  whatsapp: endpoint('whatsapp'),
  propertyValuation: endpoint('property-valuation'),
  mortgageCalculator: endpoint('mortgage-calculator'),
  stormHistory: endpoint('storm-history'),
  solarProposal: endpoint('solar-proposal'),
  solarProposalAdvanced: endpoint('solar-proposal-advanced'),
  health: endpoint('health'),
} as const;

export type ApiEndpointKey = keyof typeof API_ENDPOINTS;

/** Shared payload identity for every cosmetics request. */
export const cosmeticsIdentity = {
  niche: NICHE,
  brandName: 'Aura Beverly Hills',
  expertName: 'Dr. Sarah Alvi',
} as const;
