/**
 * 돈막이 카탈로그 씨앗 데이터 + 공용 헬퍼
 * generate-products.js(로컬 스크립트)와 worker.js(서버) 둘 다 이 파일을 씁니다.
 *
 * 구조: 씨앗(seed) 하나가 네이버 쇼핑 검색 한 번에 대응하고,
 *       그 결과에서 take개를 뽑아 항목으로 만듭니다.
 *       씨앗 10개 × take 2~3 = 카테고리당 20~25개 항목.
 */

// ---------------------------------------------------------------------------
// 패션 — 네이버 쇼핑 검색으로 채웁니다
// ---------------------------------------------------------------------------
export const FASHION_SEEDS = [
  { query: '오버핏 후드티',      emoji: '🧥', take: 3, min: 15000, max: 120000 },
  { query: '와이드 팬츠 여성',   emoji: '👖', take: 3, min: 15000, max: 100000 },
  { query: '니트 가디건',        emoji: '🧶', take: 3, min: 15000, max: 150000 },
  { query: '스니커즈',           emoji: '👟', take: 3, min: 25000, max: 200000 },
  { query: '크로스백 여성',      emoji: '👜', take: 2, min: 20000, max: 300000 },
  { query: '옥스포드 셔츠',      emoji: '👔', take: 2, min: 15000, max: 90000 },
  { query: '롱 원피스',          emoji: '👗', take: 2, min: 20000, max: 150000 },
  { query: '숏패딩',             emoji: '🧊', take: 2, min: 40000, max: 300000 },
  { query: '데일리 백팩',        emoji: '🎒', take: 2, min: 20000, max: 150000 },
  { query: '볼캡 모자',          emoji: '🧢', take: 2, min: 10000, max: 80000 }
];

// ---------------------------------------------------------------------------
// 뷰티 — 네이버 쇼핑 검색으로 채웁니다
// ---------------------------------------------------------------------------
export const BEAUTY_SEEDS = [
  { query: '립틴트',          emoji: '💄', take: 3, min: 5000,  max: 50000 },
  { query: '쿠션 팩트',       emoji: '🎨', take: 3, min: 10000, max: 80000 },
  { query: '앰플 세럼',       emoji: '🧴', take: 3, min: 10000, max: 120000 },
  { query: '마스카라',        emoji: '👁️', take: 2, min: 8000,  max: 50000 },
  { query: '여성 향수',       emoji: '🌸', take: 3, min: 20000, max: 250000 },
  { query: '아이섀도우 팔레트', emoji: '🎭', take: 2, min: 10000, max: 90000 },
  { query: '수분 크림',       emoji: '💧', take: 2, min: 10000, max: 100000 },
  { query: '클렌징 오일',     emoji: '🫧', take: 2, min: 8000,  max: 60000 },
  { query: '헤어 에센스',     emoji: '💇', take: 2, min: 8000,  max: 60000 },
  { query: '네일 컬러',       emoji: '💅', take: 2, min: 5000,  max: 40000 }
];

// ---------------------------------------------------------------------------
// 야식/배달 — 직접 채웁니다
//
// 네이버 쇼핑에서 '족발'을 검색하면 배달 족발이 아니라 냉동 밀키트가 나옵니다.
// 가격대가 완전히 달라서(밀키트 12,000원 vs 배달 30,000원) API로 채우면
// 오히려 틀린 숫자가 됩니다. 이 카테고리는 손으로 관리하는 편이 정확합니다.
// 가격은 2026년 기준 서울 배달 앱 대략값이니, 실제로 보시는 값으로 고치세요.
// ---------------------------------------------------------------------------
export const FOOD_ITEMS = [
  { name: '족발 중자',        price: 32000, emoji: '🍖' },
  { name: '보쌈 정식',        price: 30000, emoji: '🥬' },
  { name: '엽기떡볶이 세트',  price: 26000, emoji: '🌶️' },
  { name: '후라이드 치킨',    price: 22000, emoji: '🍗' },
  { name: '양념치킨 + 콜라',  price: 25000, emoji: '🍺' },
  { name: '불닭발 세트',      price: 24000, emoji: '🔥' },
  { name: '곱창전골',         price: 35000, emoji: '🍲' },
  { name: '마라탕 (중)',      price: 18000, emoji: '🥘' },
  { name: '탕수육 + 짜장면',  price: 24000, emoji: '🥟' },
  { name: '피자 라지',        price: 29000, emoji: '🍕' },
  { name: '초밥 20피스',      price: 28000, emoji: '🍣' },
  { name: '햄버거 세트 2인',  price: 18000, emoji: '🍔' },
  { name: '떡볶이 + 튀김',    price: 16000, emoji: '🍢' },
  { name: '치즈돈까스',       price: 15000, emoji: '🐷' },
  { name: '월남쌈 밀키트',    price: 21000, emoji: '🌯' },
  { name: '연어덮밥',         price: 17000, emoji: '🐟' },
  { name: '닭강정 (대)',      price: 20000, emoji: '🍯' },
  { name: '야식 라면 + 김밥', price: 12000, emoji: '🍜' }
];

// ---------------------------------------------------------------------------
// 카테고리 껍데기 (제목·설명 등 고정 문구)
// ---------------------------------------------------------------------------
export const SHELL = {
  food: {
    emoji: '🌙',
    title: '홧김에 시키는 야식',
    desc: '오늘 밤의 위기 목록',
    pickTitle: '오늘의 야식, 뭘로 참아볼까요?',
    statLabel: '오늘 절약한 칼로리',
    statValue: '850kcal',
    smalls: [
      { label: '출근길 스트레스', name: '바닐라 라떼', price: 5000, emoji: '☕', statLabel: '오늘 참은 당 섭취량', statValue: '42g' },
      { label: '야근하다 홧김에', name: '편의점 털이',  price: 12000, emoji: '🏪', statLabel: '오늘의 홧김 소비 욕구', statValue: '-1' }
    ]
  },
  fashion: {
    emoji: '🛍️',
    title: '홧김에 담는 장바구니',
    desc: '무신사 · 지그재그 위시리스트',
    pickTitle: '오늘의 지름 욕구, 뭘로 참아볼까요?',
    statLabel: '옷장 속 안 입는 옷',
    statValue: '+1 방지',
    smalls: [
      { label: '스크롤하다 홧김에', name: '인스타 광고템', price: 39000, emoji: '📱', statLabel: '오늘 참은 광고 시간', statValue: '3초' },
      { label: '80% 세일 문자 보고', name: '세일 알림템',  price: 32000, emoji: '🏷️', statLabel: '무시한 세일 알림',   statValue: '5건' }
    ]
  },
  beauty: {
    emoji: '✨',
    title: '홧김에 담는 올리브영',
    desc: '결제 직전에서 멈춘 것들',
    pickTitle: '오늘의 홧김템, 뭘로 참아볼까요?',
    statLabel: '화장대 위 물건',
    statValue: '+1 방지',
    smalls: [
      { label: '유튜브 보다가', name: '추천템 세럼', price: 45000, emoji: '📺', statLabel: '저항한 광고 영상', statValue: '1건' },
      { label: '특가 알림 뜬',  name: '한정판 향수', price: 68000, emoji: '🔔', statLabel: '무시한 앱 알림',   statValue: '1건' }
    ]
  }
};

// ---------------------------------------------------------------------------
// 헬퍼
// ---------------------------------------------------------------------------

/** 네이버가 돌려주는 상품명은 광고 문구와 태그 범벅이라 정리가 필요합니다. */
export function cleanTitle(raw) {
  let t = String(raw)
    .replace(/<[^>]*>/g, '')            // <b> 같은 태그 제거
    .replace(/&[a-z]+;/gi, ' ')         // &amp; 등
    .replace(/\[[^\]]*\]/g, ' ')        // [무료배송] 같은 대괄호 묶음
    .replace(/\([^)]*\)/g, ' ')         // (1+1) 같은 괄호 묶음
    .replace(/[,/|·]+.*$/, '')          // 첫 구분자 뒤는 대개 옵션 나열
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length > 18) t = t.slice(0, 18).trim() + '…';
  return t;
}

/** 씨앗 하나의 검색 결과에서 항목 여러 개를 뽑아냅니다. */
export function itemsFromSearch(seed, apiItems, shell) {
  const out = [];
  const seen = new Set();
  for (const raw of apiItems || []) {
    const price = parseInt(raw.lprice, 10);
    if (!Number.isFinite(price)) continue;
    if (price < seed.min || price > seed.max) continue;   // 미끼상품·부속품 걸러내기
    const name = cleanTitle(raw.title);
    if (!name || name.length < 2) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name,
      price: Math.round(price / 100) * 100,
      emoji: seed.emoji,
      statLabel: shell.statLabel,
      statValue: shell.statValue
    });
    if (out.length >= seed.take) break;
  }
  return out;
}

/** 검색이 실패했을 때 쓸 자리채움 항목. */
export function fallbackItem(seed, shell) {
  return {
    name: seed.query,
    price: Math.round(((seed.min + seed.max) / 2) / 1000) * 1000,
    emoji: seed.emoji,
    statLabel: shell.statLabel,
    statValue: shell.statValue
  };
}

/** 카테고리 하나를 앱이 읽는 형태로 조립합니다. */
export function buildCategory(key, items) {
  const shell = SHELL[key];
  return {
    group: {
      emoji: shell.emoji,
      title: shell.title,
      desc: shell.desc,
      pickTitle: shell.pickTitle,
      maxPrice: items.length ? Math.max(...items.map(i => i.price)) : 0,
      items
    },
    smalls: shell.smalls
  };
}

/** 야식 항목은 검색을 안 쓰므로 여기서 바로 만듭니다. */
export function buildFoodItems() {
  const shell = SHELL.food;
  return FOOD_ITEMS.map(f => ({
    name: f.name,
    price: f.price,
    emoji: f.emoji,
    statLabel: shell.statLabel,
    statValue: shell.statValue
  }));
}
