#!/usr/bin/env node
/**
 * products.json 만들기 — 로컬에서 한 번 돌리면 끝나는 방식
 * ---------------------------------------------------------------
 * 네이버 쇼핑 검색 API로 패션·뷰티 항목을 채우고, 야식은 seeds.js의
 * 고정 목록을 써서 products.json을 새로 씁니다.
 *
 * 서버를 띄울 필요가 없습니다. 가끔 실행해서 GitHub에 올리기만 하면 됩니다.
 *
 * 쓰는 법 (Node 18 이상):
 *   cd server
 *   NAVER_ID=발급받은아이디 NAVER_SECRET=발급받은시크릿 node generate-products.js
 *
 * 윈도우 PowerShell:
 *   $env:NAVER_ID="..."; $env:NAVER_SECRET="..."; node generate-products.js
 *
 * 키 없이 그냥 돌리면(node generate-products.js) 검색을 건너뛰고
 * 씨앗 목록만으로 파일을 만듭니다. 구조를 먼저 보고 싶을 때 쓰세요.
 *
 * 결과물은 ../products.json 에 덮어씌워집니다.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FASHION_SEEDS, BEAUTY_SEEDS, SHELL,
  itemsFromSearch, fallbackItem, buildCategory, buildFoodItems
} from './seeds.js';

const ID = process.env.NAVER_ID;
const SECRET = process.env.NAVER_SECRET;
const HAS_KEYS = Boolean(ID && SECRET);

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'products.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function search(query) {
  const url = 'https://openapi.naver.com/v1/search/shop.json?display=30&sort=sim&query=' + encodeURIComponent(query);
  const res = await fetch(url, {
    headers: { 'X-Naver-Client-Id': ID, 'X-Naver-Client-Secret': SECRET }
  });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + (await res.text()).slice(0, 120));
  const data = await res.json();
  return data.items || [];
}

async function buildFromSeeds(key, seeds) {
  const shell = SHELL[key];
  const items = [];
  for (const seed of seeds) {
    if (!HAS_KEYS) {
      items.push(fallbackItem(seed, shell));
      continue;
    }
    try {
      const found = itemsFromSearch(seed, await search(seed.query), shell);
      if (found.length) {
        items.push(...found);
        console.log(`  ✓ ${seed.query} → ${found.length}개 (${found.map(f => f.price.toLocaleString()).join(', ')})`);
      } else {
        items.push(fallbackItem(seed, shell));
        console.log(`  · ${seed.query} → 조건에 맞는 결과 없음, 기본값 사용`);
      }
    } catch (e) {
      items.push(fallbackItem(seed, shell));
      console.log(`  ! ${seed.query} → 실패 (${e.message}), 기본값 사용`);
    }
    await sleep(120); // 네이버 쪽 부담을 줄이기 위한 간격
  }
  return items;
}

async function main() {
  if (!HAS_KEYS) {
    console.log('※ NAVER_ID / NAVER_SECRET 이 없어 검색을 건너뜁니다. 씨앗 목록만으로 만듭니다.\n');
  }

  console.log('야식 (고정 목록)');
  const food = buildFoodItems();
  console.log(`  ✓ ${food.length}개\n`);

  console.log('패션 (네이버 쇼핑)');
  const fashion = await buildFromSeeds('fashion', FASHION_SEEDS);
  console.log('');

  console.log('뷰티 (네이버 쇼핑)');
  const beauty = await buildFromSeeds('beauty', BEAUTY_SEEDS);
  console.log('');

  const ko = {
    food: buildCategory('food', food),
    fashion: buildCategory('fashion', fashion),
    beauty: buildCategory('beauty', beauty)
  };

  // 상품명이 한국어라 다른 언어도 같은 데이터를 공유합니다.
  // 언어별로 다른 목록을 쓰고 싶으면 여기서 나누면 됩니다.
  const catalog = { ko, en: ko, ja: ko, zh: ko, updatedAt: new Date().toISOString() };

  await fs.writeFile(OUT, JSON.stringify(catalog, null, 2), 'utf8');

  const total = food.length + fashion.length + beauty.length;
  console.log(`완료 — 야식 ${food.length} · 패션 ${fashion.length} · 뷰티 ${beauty.length} = 총 ${total}개`);
  console.log(`저장 위치: ${OUT}`);
  console.log('\n이 파일을 GitHub 저장소에 덮어쓰면 앱에 바로 반영됩니다.');
}

main().catch(e => {
  console.error('실패:', e.message);
  process.exit(1);
});
