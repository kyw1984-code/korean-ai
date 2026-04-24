const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Daily token limit per device (abuse prevention)
const DEVICE_DAILY_LIMIT = 50000;
const deviceUsage = new Map(); // In production use Supabase

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function checkRateLimit(deviceId) {
  const key = `${deviceId}:${getTodayKey()}`;
  const used = deviceUsage.get(key) ?? 0;
  if (used >= DEVICE_DAILY_LIMIT) return false;
  deviceUsage.set(key, used + 1);
  return true;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { messages, scenarioId, userLevel, isPremium, deviceId } = req.body ?? {};

  if (!messages || !scenarioId || !deviceId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!checkRateLimit(deviceId)) {
    return res.status(429).json({ message: 'Daily limit reached. Come back tomorrow!' });
  }

  try {
    // Build system prompt with caching for cost optimization
    const systemContent = buildSystemPrompt(scenarioId, userLevel ?? 'beginner');

    // Route to cheaper model for basic conversation, premium for advanced correction
    const model = isPremium
      ? 'claude-haiku-4-5'
      : 'claude-haiku-4-5';

    const response = await client.messages.create({
      model,
      max_tokens: 300,
      system: [
        {
          type: 'text',
          text: systemContent,
          cache_control: { type: 'ephemeral' }, // Cache system prompt
        },
      ],
      messages: messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = response.content[0]?.type === 'text'
      ? response.content[0].text
      : '';

    return res.status(200).json({
      content,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });
  } catch (error) {
    console.error('Claude API error:', error);
    return res.status(500).json({ message: 'AI service error. Please try again.' });
  }
};

function buildSystemPrompt(scenarioId, userLevel) {
  const scenarios = {
    cafe_order: { title: '카페에서 주문하기', desc: 'Help user practice ordering coffee and snacks in Korean' },
    self_intro: { title: '자기소개', desc: 'Help user practice introducing themselves in Korean' },
    ask_directions: { title: '길 묻기', desc: 'Help user practice asking for and giving directions in Korean' },
    ask_price: { title: '물건 사기 & 가격 묻기', desc: 'Help user practice shopping and asking about prices' },
    make_appointment: { title: '약속 잡기', desc: 'Help user practice scheduling meetings with friends' },
    restaurant_order: { title: '식당에서 주문', desc: 'Help user practice ordering food at a Korean restaurant' },
    taxi_ride: { title: '택시 타기', desc: 'Help user practice directing a taxi driver in Korean' },
    convenience_store: { title: '편의점에서', desc: 'Help user practice buying items at a Korean convenience store' },
    phone_call: { title: '전화 통화', desc: 'Help user practice making phone calls in Korean' },
    weather_chat: { title: '날씨 이야기', desc: 'Help user practice talking about the weather' },
    friend_meetup: { title: '친구와 약속', desc: 'Help user practice planning activities with a friend' },
    restaurant_recommend: { title: '맛집 추천 받기', desc: 'Help user practice discussing restaurant recommendations' },
    korean_culture: { title: '한국 문화 이야기', desc: 'Help user discuss K-pop, K-dramas, and Korean traditions' },
    health_doctor: { title: '병원에서', desc: 'Help user practice describing symptoms at a doctor' },
    bank_visit: { title: '은행 방문', desc: 'Help user practice basic banking transactions in Korean' },
    job_interview: { title: '취업 면접', desc: 'Help user prepare for a Korean company job interview' },
    news_debate: { title: '한국 뉴스 토론', desc: 'Help user debate current events and social issues in Korean' },
    kdrama_reenact: { title: 'K-드라마 장면 재연', desc: 'Help user reenact scenes from popular K-dramas' },
    business_meeting: { title: '비즈니스 미팅', desc: 'Help user conduct a professional business discussion' },
    university_lecture: { title: '대학 토론', desc: 'Help user participate in an academic discussion' },
  };

  const scenario = scenarios[scenarioId] ?? { title: '자유 대화', desc: 'Free conversation practice' };

  return `You are a friendly Korean language tutor named 선생님.
Scenario: "${scenario.title}" — ${scenario.desc}
User level: ${userLevel}

RULES:
1. Respond in Korean, add English only when truly necessary for beginners
2. Keep responses to 2-3 sentences max
3. After your Korean response, add:
   💡 피드백:
   - 문법: [correction or "완벽해요!"]
   - 자연스러움: [X]/10
   - 더 자연스럽게: [alternative] (only if score < 8)
4. Be warm and encouraging
5. Total response under 150 words

Start by greeting and setting the scene in Korean.`;
}
