/**
 * Donmaggi 카탈로그 서버 (Cloudflare Workers)
 * ------------------------------------------------------------
 * 네이버 쇼핑 검색 API에서 실시간 최저가를 가져와
 * 앱이 읽는 products.json 형식으로 변환해 돌려줍니다.
 *
 * 왜 서버가 필요한가:
 *  1) API 키를 앱(브라우저) 안에 넣으면 누구나 볼 수 있습니다.
 *  2) 브라우저에서 openapi.naver.com을 직접 부르면 CORS로 차단됩니다.
 *
 * 배포:
 *   npm i -g wrangler
 *   wrangler init donmaggi-catalog
 *   (이 파일을 src/index.js 에 붙여넣기)
 *   wrangler secret put NAVER_ID
 *   wrangler secret put NAVER_SECRET
 *   wrangler deploy
 * 그리고 앱 설정(⚙️) → Catalog URL 에 배포된 주소를 넣으면 끝.
 *
 * 키 발급: https://developers.naver.com → 애플리케이션 등록 → '검색' API
 * 무료 한도: 하루 25,000회 (아래처럼 캐시하면 사실상 넘을 일이 없습니다)
 */

const CACHE_SECONDS = 60 * 60 * 6; // 6시간마다 갱신

// 카피·이모지·통계는 고정하고, price 만 실시간으로 채웁니다.
// query = 네이버 쇼핑에서 검색할 키워드, fallback = API 실패 시 쓸 가격
const TEMPLATE = {
  food: {
    group: { emoji: '🌙', title: '홧김에 시키는 야식세트', desc: '족발 · 엽떡 · 치킨 중 오늘의 위기', pickTitle: '오늘의 야식, 뭘로 참아볼까요?',
      items: [
        { name: '족발세트',        query: '족발 세트',       fallback: 30000, emoji: '🍖', statLabel: '오늘 절약한 칼로리', statValue: '850kcal' },
        { name: '엽떡 매운맛 세트', query: '엽기떡볶이',      fallback: 28000, emoji: '🌶️', statLabel: '오늘 절약한 칼로리', statValue: '620kcal' },
        { name: '치킨+맥주 세트',   query: '치킨 세트',       fallback: 32000, emoji: '🍗', statLabel: '오늘 절약한 칼로리', statValue: '980kcal' }
      ] },
    smalls: [
      { label: '출근길 스트레스',  name: '바닐라 라떼', query: '스타벅스 기프티콘 라떼', fallback: 5000,  emoji: '☕', statLabel: '오늘 참은 당 섭취량',   statValue: '42g' },
      { label: '홧김에 지르는',    name: '살말 틴트',   query: '립틴트',                fallback: 10000, emoji: '💄', statLabel: '오늘의 홧김 소비 욕구', statValue: '-1' }
    ]
  },
  fashion: {
    group: { emoji: '🛍️', title: '홧김에 담는 무신사 장바구니', desc: '크롭후드 · 와이드팬츠 · 스니커즈 중 오늘의 위기', pickTitle: '오늘의 지름 욕구, 뭘로 참아볼까요?',
      items: [
        { name: '오버핏 크롭후드',  query: '오버핏 크롭 후드티', fallback: 59000, emoji: '🧥', statLabel: '옷장 속 안 입는 옷', statValue: '+1 방지' },
        { name: '와이드 팬츠',      query: '와이드 팬츠',        fallback: 49000, emoji: '👖', statLabel: '옷장 속 안 입는 옷', statValue: '+1 방지' },
        { name: '클래식 스니커즈',  query: '클래식 스니커즈',    fallback: 89000, emoji: '👟', statLabel: '옷장 속 안 입는 옷', statValue: '+1 방지' }
      ] },
    smalls: [
      { label: '스크롤하다 홧김에', name: '인스타 광고 니트', query: '여성 니트',  fallback: 39000, emoji: '🧶', statLabel: '오늘 참은 광고 시간', statValue: '3초' },
      { label: '80% 세일 문자 보고', name: '세일 셔츠',       query: '옥스포드 셔츠', fallback: 32000, emoji: '👔', statLabel: '무시한 세일 알림',   statValue: '5건' }
    ]
  },
  beauty: {
    group: { emoji: '✨', title: '홧김에 담는 올리브영 장바구니', desc: '립틴트 · 쿠션팩트 · 마스카라 중 오늘의 위기', pickTitle: '오늘의 홧김템, 뭘로 참아볼까요?',
      items: [
        { name: '글로시 립틴트',    query: '글로시 립틴트', fallback: 12000, emoji: '💋', statLabel: '화장대 위 물건', statValue: '+1 방지' },
        { name: '쿠션 팩트',        query: '쿠션 팩트',     fallback: 32000, emoji: '🎨', statLabel: '화장대 위 물건', statValue: '+1 방지' },
        { name: '롱래시 마스카라',  query: '마스카라',      fallback: 18000, emoji: '👁️', statLabel: '화장대 위 물건', statValue: '+1 방지' }
      ] },
    smalls: [
      { label: '유튜브 보다가',   name: '추천템 세럼', query: '앰플 세럼', fallback: 45000, emoji: '🧴', statLabel: '저항한 광고 영상',   statValue: '1건' },
      { label: '특가 알림 뜬',    name: '향수',        query: '여성 향수', fallback: 68000, emoji: '🌸', statLabel: '무시한 앱 알림',     statValue: '1건' }
    ]
  }
};

// 네이버 쇼핑에서 대표 가격(중간값) 하나 뽑기
async function lookupPrice(query, env) {
  const url = 'https://openapi.naver.com/v1/search/shop.json?display=20&sort=sim&query=' + encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': env.NAVER_ID,
      'X-Naver-Client-Secret': env.NAVER_SECRET
    }
  });
  if (!res.ok) throw new Error('naver ' + res.status);
  const data = await res.json();
  const prices = (data.items || [])
    .map(it => parseInt(it.lprice, 10))
    .filter(n => Number.isFinite(n) && n >= 1000 && n <= 1000000)
    .sort((a, b) => a - b);
  if (!prices.length) throw new Error('no price');
  // 최저가는 미끼상품·부속품인 경우가 많아 중간값을 씁니다.
  const mid = prices[Math.floor(prices.length / 2)];
  return Math.round(mid / 100) * 100;
}

async function priceOf(entry, env) {
  try {
    return await lookupPrice(entry.query, env);
  } catch (e) {
    return entry.fallback;
  }
}

async function buildCatalog(env) {
  const ko = {};
  for (const key of Object.keys(TEMPLATE)) {
    const t = TEMPLATE[key];
    const items = [];
    for (const it of t.group.items) {
      items.push({ name: it.name, price: await priceOf(it, env), emoji: it.emoji, statLabel: it.statLabel, statValue: it.statValue });
    }
    const smalls = [];
    for (const s of t.smalls) {
      smalls.push({ label: s.label, name: s.name, price: await priceOf(s, env), emoji: s.emoji, statLabel: s.statLabel, statValue: s.statValue });
    }
    ko[key] = {
      group: {
        emoji: t.group.emoji, title: t.group.title, desc: t.group.desc, pickTitle: t.group.pickTitle,
        maxPrice: Math.max(...items.map(i => i.price)),
        items
      },
      smalls
    };
  }
  // 앱은 4개 언어를 기대합니다. 지금은 한국어 데이터를 공유하고,
  // 필요해지면 언어별 TEMPLATE을 따로 두면 됩니다.
  return { ko, en: ko, ja: ko, zh: ko, updatedAt: new Date().toISOString() };
}

export default {
  async fetch(request, env, ctx) {
    const cache = caches.default;
    const cacheKey = new Request(new URL(request.url).origin + '/catalog', request);

    let hit = await cache.match(cacheKey);
    if (hit) return hit;

    const catalog = await buildCatalog(env);
    const res = new Response(JSON.stringify(catalog), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=' + CACHE_SECONDS
      }
    });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  }
};
