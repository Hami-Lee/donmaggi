# 돈막이 (Donmaggi) — 설치형 앱 버전

기존 프로토타입 HTML을 **PWA(설치 가능한 웹앱)** 로 바꾼 버전입니다.
홈 화면에 추가하면 주소창 없이 네이티브 앱처럼 실행되고, 오프라인에서도 열립니다.

## 파일 구성

```
index.html      앱 본체 (기존 프로토타입 + 수정사항)
manifest.json   앱 이름 / 아이콘 / 실행 방식 정의
sw.js           서비스 워커 (오프라인 캐시)
icons/          앱 아이콘 (192, 512, 512-maskable, 180)
products.json   상품·가격 목록 (앱이 실행 시 여기서 불러옴)
server/         가격을 실시간으로 가져오는 서버 예시 (Cloudflare Worker)
```

## 기존 프로토타입에서 바뀐 점

1. **데이터가 저장됨** — 목표, 모은 금액, 언어 설정이 localStorage에 저장되어 앱을 껐다 켜도 유지됩니다. (기존에는 새로고침하면 초기화)
2. **전체화면** — 목업용 폰 프레임이 모바일·설치 모드에서 사라지고 화면을 꽉 채웁니다. 노치/홈바 영역(safe-area)도 처리했습니다.
3. **설치 가능** — manifest + 서비스 워커 + 아이콘 추가.
4. **초기화 버튼** — 설정(⚙️) 시트 맨 아래 `↺ Reset`.
5. **계좌 직접 입력** — '내 저축 계좌로 직접 이체'를 고르면 카카오페이 설정으로 넘어가지 않고, 그 자리에서 은행·계좌번호를 입력합니다. 한 번 넣으면 저장되고, 이후에는 번호와 금액이 바로 뜹니다.

## 배포 방법 (GitHub Pages 기준, 5분)

서비스 워커는 **HTTPS에서만** 동작합니다. 파일을 더블클릭해서 여는 방식(`file://`)으로는 설치가 안 됩니다.

1. GitHub에 새 저장소를 만들고 이 폴더의 파일 전체를 업로드
2. Settings → Pages → Source를 `main` 브랜치 / `root`로 지정
3. 몇 분 뒤 `https://<아이디>.github.io/<저장소이름>/` 접속
4. 설치
   - **Android/Chrome**: 메뉴 → "앱 설치" 또는 "홈 화면에 추가"
   - **iPhone/Safari**: 공유 버튼 → "홈 화면에 추가"

Netlify나 Vercel에 폴더를 드래그해도 동일하게 됩니다.

코드를 수정한 뒤에는 `sw.js`의 `CACHE = 'donmaggi-v1'`에서 버전 번호를 올려야 사용자 기기에서 갱신됩니다.

## 앱스토어에 올리려면 (다음 단계)

이 폴더를 그대로 감싸서 네이티브 앱으로 빌드할 수 있습니다 (Capacitor).

```bash
npm init -y
npm i @capacitor/core @capacitor/cli
npx cap init 돈막이 com.example.donmaggi --web-dir=.
npm i @capacitor/android @capacitor/ios
npx cap add android
npx cap open android    # Android Studio에서 빌드 → APK/AAB
```

- **Google Play**: 개발자 등록 $25(1회). 심사 며칠.
- **App Store**: Apple Developer $99/년, 빌드에 Mac + Xcode 필요.
- 실제 결제/이체 기능이 들어가면 심사 기준이 크게 올라갑니다. 지금처럼 "링크로 넘기고 사용자가 직접 확인" 구조가 심사에는 훨씬 유리합니다.


## 상품 목록을 실시간으로 바꾸기

상품·가격이 더 이상 `index.html` 안에 갇혀 있지 않습니다. 앱은 켤 때마다 **Catalog URL**에서 목록을 내려받고, 실패하면 마지막으로 성공한 목록(또는 내장 기본값)을 씁니다.

- 설정(⚙️) → **상품 목록 주소**에서 URL을 바꿀 수 있습니다. 기본값은 같은 폴더의 `products.json`.
- `products.json`만 고쳐서 다시 올리면 앱 재배포 없이 반영됩니다.
- 형식은 `products.json`을 그대로 따르면 됩니다: `{ ko: { food: { group, smalls }, fashion, beauty }, en, ja, zh }`

### 쇼핑몰 가격을 자동으로 끌어오려면

`server/worker.js`가 그 예시입니다. 네이버 쇼핑 검색 API에서 가격을 가져와 위 형식으로 바꿔 주는 Cloudflare Worker입니다.

```bash
npm i -g wrangler
wrangler init donmaggi-catalog     # src/index.js 에 server/worker.js 내용 붙여넣기
wrangler secret put NAVER_ID
wrangler secret put NAVER_SECRET
wrangler deploy
```

배포된 주소를 앱 설정의 Catalog URL에 넣으면 끝입니다.

- 키 발급: developers.naver.com → 애플리케이션 등록 → '검색' API
- 무료 한도 하루 25,000회. Worker가 6시간 캐시하므로 하루 4회만 씁니다.
- 카피·이모지는 고정이고 **가격만** 실시간입니다. 검색 최저가는 미끼상품인 경우가 많아 중간값을 씁니다.

### 안 되는 것

- **브라우저에서 쇼핑몰 페이지를 직접 fetch하는 방식은 불가능합니다.** CORS로 차단되고, API 키를 앱에 넣으면 그대로 노출됩니다. 반드시 서버(Worker/Edge Function)를 거쳐야 합니다.
- **배달의민족·쿠팡이츠·올리브영은 공개 API가 없습니다.** 크롤링은 각 사이트 이용약관 위반 소지가 있고 구조가 바뀌면 바로 깨집니다. 이 카테고리는 대표 가격을 직접 정해두는 편이 낫습니다.
- 쿠팡은 파트너스 승인을 받으면 상품 API를 쓸 수 있고 제휴 수수료도 생깁니다. 대신 심사가 있습니다.

## 남아 있는 한계

- 데이터가 기기 안에만 저장됩니다. 폰을 바꾸거나 브라우저 데이터를 지우면 사라집니다. 기기 간 동기화가 필요하면 백엔드(Supabase, Firebase 등)와 로그인이 필요합니다.
- 결제/지문인증은 시뮬레이션입니다.
