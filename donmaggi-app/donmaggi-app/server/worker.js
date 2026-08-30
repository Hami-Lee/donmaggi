/**
 * Donmaggi 카탈로그 서버 (Cloudflare Workers)
 * ------------------------------------------------------------
 * 네이버 쇼핑 검색 API로 패션·뷰티 항목을 채우고, 야식은 고정 목록을 써서
 * 앱이 읽는 products.json 형식으로 돌려줍니다.
 *
 * 이걸 꼭 써야 하는 건 아닙니다. generate-products.js를 가끔 로컬에서 돌려
 * products.json을 GitHub에 올리는 쪽이 더 간단합니다.
 * 이 서버는 "손 안 대고 계속 자동 갱신"이 필요할 때만 쓰세요.
 *
 * 배포:
 *   npm i -g wrangler
 *   wrangler init donmaggi-catalog
 *   src/ 안에 이 파일과 seeds.js 를 함께 넣기 (seeds.js 를 import 합니다)
 *   wrangler secret put NAVER_ID
 *   wrangler secret put NAVER_SECRET
 *   wrangler deploy
 * 그리고 앱 설정(⚙️) → 상품 목록 주소에 배포된 주소를 넣으면 끝.
 *
 * 키 발급: https://developers.naver.com → 애플리케이션 등록 → '검색' API
 * 한도: 하루 25,000회. 6시간 캐시라 하루 80회쯤 씁니다.
 *
 * 주의: 무료 플랜은 요청 하나당 외부 호출 50회 제한이 있습니다.
 *       지금 씨앗이 20개라 여유가 있지만, 더 늘리실 땐 50개를 넘기지 마세요.
 */

import {
  FASHION_SEEDS, BEAUTY_SEEDS, SHELL,
  itemsFromSearch, fallbackItem, buildCategory, buildFoodItems
} from './seeds.js';

const CACHE_SECONDS = 60 * 60 * 6; // 6시간

async function search(query, env) {
  const url = 'https://openapi.naver.com/v1/search/shop.json?display=30&sort=sim&query=' + encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': env.NAVER_ID,
      'X-Naver-Client-Secret': env.NAVER_SECRET
    }
  });
  if (!res.ok) throw new Error('naver ' + res.status);
  const data = await res.json();
  return data.items || [];
}

async function buildFromSeeds(key, seeds, env) {
  const shell = SHELL[key];
  const results = await Promise.all(seeds.map(async seed => {
    try {
      const found = itemsFromSearch(seed, await search(seed.query, env), shell);
      return found.length ? found : [fallbackItem(seed, shell)];
    } catch (e) {
      return [fallbackItem(seed, shell)];
    }
  }));
  return results.flat();
}

async function buildCatalog(env) {
  const [fashion, beauty] = await Promise.all([
    buildFromSeeds('fashion', FASHION_SEEDS, env),
    buildFromSeeds('beauty', BEAUTY_SEEDS, env)
  ]);

  const ko = {
    food: buildCategory('food', buildFoodItems()),
    fashion: buildCategory('fashion', fashion),
    beauty: buildCategory('beauty', beauty)
  };

  // 상품명이 한국어로 오기 때문에 다른 언어도 같은 데이터를 공유합니다.
  return { ko, en: ko, ja: ko, zh: ko, updatedAt: new Date().toISOString() };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cache = caches.default;
    const cacheKey = new Request(url.origin + '/catalog', request);

    // ?fresh=1 을 붙이면 캐시를 무시합니다. 테스트할 때 쓰세요.
    if (!url.searchParams.has('fresh')) {
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
    }

    let catalog;
    try {
      catalog = await buildCatalog(env);
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 500,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
      });
    }

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
