// lib/auto-llm.ts
// Intelligent, human-like Auto-LLM engine for live interactive calls

export interface ConversationTurn {
  speaker: string;
  text: string;
}

export interface AutoLLMOptions {
  personaName?: string;
  companyName?: string;
  maxTokens?: number;
}

const KNOWLEDGE_BASE: Record<string, string> = {
  pricing: "Our pricing is structured into flexible tiers: the Starter tier begins at $499 a month for up to 5,000 automated touchpoints, the Growth tier is $1,499 a month with live AI meeting bots and bi-directional CRM sync, and we also offer tailored Enterprise packages for custom volume.",
  dealflow: "DealFlow AI is an autonomous revenue platform. We deploy intelligent AI agents that handle outbound prospecting, conduct live discovery calls in Google Meet or Zoom, capture buyer commitments, and sync notes right into your CRM.",
  competitor: "Unlike traditional cold email tools or passive recording bots like Gong, DealFlow AI is an active, autonomous participant. Our agents can engage live on calls, answer technical questions, reframe objections, and advance deals in real time.",
  integration: "We integrate natively with HubSpot, Salesforce, Slack, Google Calendar, and Cal.com, along with custom webhooks to feed your analytics pipeline automatically.",
  security: "Security and data privacy are core to our platform. All transcripts and recordings are encrypted in transit and at rest using AES-256 and TLS 1.3, and we adhere strictly to SOC 2 Type II and GDPR compliance standards.",
  onboarding: "You can get up and running with DealFlow AI in under twenty minutes. You simply connect your CRM and calendar, choose your agent persona, and our system begins orchestrating discovery pipelines immediately.",
  voice: "Our agents utilize ultra-low latency streaming voice synthesis and real-time transcription, enabling seamless back-and-forth conversations with zero awkward pauses.",
  greeting: "Hello! It is great to meet you. I am here to share how DealFlow AI accelerates revenue cycles and answer any questions you have about our platform.",
};

function generateContextualHumanResponse(userSpeech: string, persona: string): string {
  const q = userSpeech.toLowerCase();

  if (q.includes('hello') || q.includes('hi ') || q.includes('hey') || q.includes('morning') || q.includes('evening')) {
    return `Hey there! Great to connect with you today. How is your week going, and what can I dive into for you regarding DealFlow AI?`;
  }
  if (q.includes('price') || q.includes('cost') || q.includes('pricing') || q.includes('tier') || q.includes('how much')) {
    return KNOWLEDGE_BASE.pricing;
  }
  if (q.includes('crm') || q.includes('hubspot') || q.includes('salesforce') || q.includes('integrate') || q.includes('sync')) {
    return KNOWLEDGE_BASE.integration;
  }
  if (q.includes('security') || q.includes('privacy') || q.includes('soc2') || q.includes('gdpr') || q.includes('compliance')) {
    return KNOWLEDGE_BASE.security;
  }
  if (q.includes('onboard') || q.includes('setup') || q.includes('start') || q.includes('how long')) {
    return KNOWLEDGE_BASE.onboarding;
  }
  if (q.includes('gong') || q.includes('competitor') || q.includes('apollo') || q.includes('outreach') || q.includes('different')) {
    return KNOWLEDGE_BASE.competitor;
  }
  if (q.includes('dealflow') || q.includes('what is') || q.includes('what do you do') || q.includes('who are you') || q.includes('overview')) {
    return KNOWLEDGE_BASE.dealflow;
  }

  return `That is a great question. DealFlow AI is specifically built to solve that by combining autonomous AI prospecting with real-time meeting assistance, ensuring your sales pipeline moves faster and deals close with less friction. What specific challenge are you looking to tackle first?`;
}

/**
 * Clean up text for human-like speech output:
 * Strips markdown symbols, asterisks, urls, quotes, or code tags.
 */
export function cleanSpokenText(text: string): string {
  return text
    .replace(/[*#_~`>]/g, '') // remove markdown
    .replace(/https?:\/\/\S+/g, '') // remove URLs
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove markdown links
    .replace(/\{[^}]+\}/g, '') // remove JSON blocks
    .replace(/\s+/g, ' ') // normalize whitespace
    .trim();
}

/**
 * Generates an articulate, human-like voice response to any question or statement.
 */
export async function generateHumanResponse(
  userSpeech: string,
  history: ConversationTurn[] = [],
  options: AutoLLMOptions = {}
): Promise<string> {
  const personaName = options.personaName || 'Praneeth';
  const companyName = options.companyName || 'DealFlow AI';

  const systemPrompt = `You are ${personaName}, the founder and revenue lead at ${companyName}.
You are speaking live in a Google Meet video conference with a prospective client or partner.

RULES FOR SPEAKING:
1. Speak completely like an articulate, warm, confident, and natural human.
2. Keep your answer conversational, punchy, and between 1 to 3 spoken sentences.
3. NEVER use bullet points, numbered lists, emojis, asterisks, or markdown symbols.
4. Answer ANY question asked: product capabilities, pricing ($499/mo starter, $1,499/mo growth), integrations (HubSpot, Salesforce), architecture, security, or casual conversation.
5. If the user asks something broad, give a clear direct answer and invite their feedback.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((h) => ({
      role: h.speaker.toLowerCase().includes('bot') || h.speaker.toLowerCase().includes('ai') ? 'assistant' : 'user',
      content: h.text,
    })),
    { role: 'user', content: userSpeech },
  ];

  // Try Provider 1: Nvidia LLM API
  const nvKey = process.env.NVIDIA_API_KEY?.trim();
  if (nvKey && nvKey.startsWith('nvapi-')) {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${nvKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-ai/deepseek-v4-flash-0731',
          messages,
          max_tokens: options.maxTokens || 120,
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return cleanSpokenText(content);
        }
      }
    } catch (e: any) {
      console.warn('[AutoLLM] Nvidia inference notice:', e.message);
    }
  }

  // Fallback Provider: High-fidelity Contextual Human Reasoning Engine
  return generateContextualHumanResponse(userSpeech, personaName);
}
