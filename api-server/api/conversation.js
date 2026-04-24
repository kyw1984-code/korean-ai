const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Token budget per device per day
const DEVICE_DAILY_TOKEN_LIMIT = 50000;

function getTodayUTC() {
  return new Date().toISOString().split('T')[0];
}

async function checkAndIncrementRateLimit(deviceId) {
  const today = getTodayUTC();

  // Read current usage
  const { data } = await supabase
    .from('device_usage')
    .select('token_count')
    .eq('device_id', deviceId)
    .eq('date', today)
    .single();

  const currentCount = data?.token_count ?? 0;
  if (currentCount >= DEVICE_DAILY_TOKEN_LIMIT) return false;

  // Upsert incremented count
  await supabase
    .from('device_usage')
    .upsert(
      { device_id: deviceId, date: today, token_count: currentCount + 1 },
      { onConflict: 'device_id,date' }
    );

  return true;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { messages, scenarioId, userLevel, isPremium, deviceId } = req.body ?? {};

  if (!messages || !scenarioId || !deviceId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const allowed = await checkAndIncrementRateLimit(deviceId);
  if (!allowed) {
    return res.status(429).json({ message: 'Daily limit reached. Come back tomorrow!' });
  }

  try {
    const systemContent = buildSystemPrompt(scenarioId, userLevel ?? 'beginner');

    // Free → Haiku (cheap), Pro → Sonnet (better corrections)
    const model = isPremium ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';

    const response = await client.messages.create({
      model,
      max_tokens: 300,
      system: [
        {
          type: 'text',
          text: systemContent,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: messages.length === 0
        ? [{ role: 'user', content: '안녕하세요! Please start our conversation based on the scenario.' }]
        : messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';

    return res.status(200).json({
      content,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });
  } catch (error) {
    console.error('Claude API error:', error?.message);
    return res.status(500).json({ message: 'AI service error. Please try again.' });
  }
};

function buildSystemPrompt(scenarioId, userLevel) {
  const scenarios = {
    // Beginner
    cafe_order:        { title: '카페에서 주문하기',        desc: 'Practice ordering coffee and snacks in Korean' },
    self_intro:        { title: '자기소개',               desc: 'Practice introducing yourself in Korean' },
    ask_directions:    { title: '길 묻기',                desc: 'Practice asking for and giving directions' },
    ask_price:         { title: '물건 사기 & 가격 묻기',    desc: 'Practice shopping and asking about prices' },
    make_appointment:  { title: '약속 잡기',              desc: 'Practice scheduling meetings with friends' },
    restaurant_order:  { title: '식당에서 주문',           desc: 'Practice ordering food at a Korean restaurant' },
    taxi_ride:         { title: '택시 타기',              desc: 'Practice directing a taxi driver in Korean' },
    convenience_store: { title: '편의점에서',              desc: 'Practice buying items at a Korean convenience store' },
    phone_call:        { title: '전화 통화',              desc: 'Practice making phone calls in Korean' },
    weather_chat:      { title: '날씨 이야기',            desc: 'Practice talking about the weather' },
    subway_bus:        { title: '지하철·버스 타기',         desc: 'Practice navigating Korean public transport' },
    pharmacy:          { title: '약국 방문',              desc: 'Practice describing symptoms and buying medicine' },
    hotel_checkin:     { title: '호텔 체크인',            desc: 'Practice checking into a Korean hotel' },
    lost_item:         { title: '분실물 찾기',            desc: 'Practice reporting a lost item and asking for help' },
    grocery_store:     { title: '마트 장보기',            desc: 'Practice buying groceries and asking where things are' },
    haircut:           { title: '미용실 방문',            desc: 'Practice describing the hairstyle you want' },
    post_office:       { title: '우체국 이용',            desc: 'Practice sending a package or buying stamps' },
    movie_ticket:      { title: '영화 예매',              desc: 'Practice booking cinema tickets' },
    gym_registration:  { title: '헬스장 등록',            desc: 'Practice signing up for a gym membership' },
    korean_food:       { title: '한국 음식 이야기',        desc: 'Practice discussing favourite Korean dishes' },
    // Intermediate
    friend_meetup:          { title: '친구와 약속',             desc: 'Practice planning activities with a friend' },
    restaurant_recommend:   { title: '맛집 추천 받기',          desc: 'Practice discussing restaurant recommendations' },
    korean_culture:         { title: '한국 문화 이야기',         desc: 'Discuss K-pop, K-dramas, and Korean traditions' },
    health_doctor:          { title: '병원에서',               desc: 'Practice describing symptoms at a doctor' },
    bank_visit:             { title: '은행 방문',              desc: 'Practice basic banking transactions in Korean' },
    travel_planning:        { title: '여행 계획 짜기',          desc: 'Discuss a trip itinerary inside Korea' },
    cooking_class:          { title: '한국 요리 배우기',         desc: 'Follow a recipe and ask cooking questions in Korean' },
    customer_complaint:     { title: '불만 접수하기',           desc: 'Handle a complaint about a product or service' },
    house_hunting:          { title: '집 구하기',              desc: 'Ask about an apartment and negotiate terms' },
    language_partner:       { title: '언어 교환 파트너',         desc: 'Chat with a Korean language exchange partner' },
    workplace_chat:         { title: '직장 동료와 대화',         desc: 'Small talk and discussions in a Korean office' },
    emergency_help:         { title: '긴급 상황 대처',          desc: 'Ask for urgent help in Korean' },
    study_abroad:           { title: '한국 유학 정보',          desc: 'Ask about university admission and campus life' },
    hobby_share:            { title: '취미 이야기',            desc: 'Talk about your hobbies and ask about theirs' },
    online_shopping:        { title: '온라인 쇼핑 문제',         desc: 'Resolve a delivery or return problem in Korean' },
    // Advanced
    job_interview:          { title: '취업 면접',              desc: 'Practice for a Korean company job interview' },
    news_debate:            { title: '한국 뉴스 토론',          desc: 'Debate current events and social issues in Korean' },
    kdrama_reenact:         { title: 'K-드라마 장면 연습',       desc: 'Practise dramatic and emotional Korean expressions' },
    business_meeting:       { title: '비즈니스 미팅',           desc: 'Conduct a professional business discussion in Korean' },
    university_lecture:     { title: '대학 토론',              desc: 'Participate in an academic discussion in Korean' },
    legal_consultation:     { title: '법률 상담',              desc: 'Discuss a legal matter with a Korean advisor' },
    investment_advice:      { title: '투자 상담',              desc: 'Discuss Korean stocks, real estate, or funds' },
    medical_consultation:   { title: '의료 상담',              desc: 'Get a detailed medical second opinion in Korean' },
    social_issue_debate:    { title: '사회 이슈 토론',          desc: 'Argue opinions on contemporary Korean society' },
    startup_pitch:          { title: '스타트업 피치',           desc: 'Pitch a business idea to a Korean investor' },
  };

  const scenario = scenarios[scenarioId] ?? { title: '자유 대화', desc: 'Free conversation practice' };

  return `You are a friendly Korean language tutor named 선생님.
Scenario: "${scenario.title}" — ${scenario.desc}
User level: ${userLevel}

RULES:
1. Respond in Korean; add English only when necessary for beginners
2. Keep responses to 2-3 sentences max
3. After your Korean response, always add:
   💡 피드백:
   - 문법: [correction or "완벽해요!"]
   - 자연스러움: [X]/10
   - 더 자연스럽게: [alternative] (only if score < 8)
4. Be warm and encouraging
5. Total response under 150 words

Start by greeting and setting the scene in Korean.`;
}
