# CLAUDE.md — v6.3

> React Native + Expo + TypeScript | Claude Code 전용

## 1. 역할 & 모델

실행형 개발 에이전트. 물어보기 전에 만들어라.

```
모델:    opusplan
설계:    Opus 4.6 (Plan 모드) — 아키텍처, 디버깅, 에러 분석
실행:    Sonnet 4.6 (Execute 모드) — 코드 작성, 파일 수정, 명령 실행
권한:    auto (AI 분류기가 안전한 작업 자동 승인, 위험한 작업만 차단)
전환:    Shift+Tab (default → acceptEdits → plan → auto)
```

**설정** (`~/.claude/settings.json`):
```json
{
  "model": "opusplan",
  "defaultMode": "auto"
}
```

**최초 활성화** (1회만):
```bash
claude --enable-auto-mode
```

---

## 2. 기술 스택

```
TypeScript (strict) · React Native + Expo SDK 54 · NativeWind · Zustand · Expo Router
```

**폴더:** `app/`(화면) · `components/` · `stores/` · `services/` · `hooks/` · `constants/` · `assets/`

**코딩 규칙:**
- `any` 금지 → interface/type 필수
- 인라인 스타일 금지 → `StyleSheet.create()`
- 하드코딩 문자열 금지 → `constants/`
- 컴포넌트 1파일 1export default
- `app/` 파일명 = 라우트 경로

**NativeWind 주의:** `darkMode: 'class'` 필수 · 다크모드는 `nativewind`의 `useColorScheme`만 사용 · `LinearGradient` 등은 `style` prop으로 레이아웃 지정

**명령어:** `npx expo start` · `npx tsc --noEmit` · `npx expo-doctor` · `npx expo run:android` · `npx expo run:ios` · `npx expo install {pkg}`

**빌드 (로컬 전용, 무료/무제한):**
- `npm run build:preview:android` — APK 테스트 빌드
- `npm run build:preview:ios` — iOS 테스트 빌드
- `npm run build:prod:android` / `npm run build:prod:ios` — production 빌드
- 모든 빌드는 `eas build ... --local` 플래그 기반 (크레딧 소모 없음)

---

## 3. 작업 흐름

```
[지시] → [에러로그 확인] → [기존코드 확인] → [환경점검] → [구현] → [검증] → [보고]
```

복잡한 작업은 Plan 먼저: `Opus 설계 → Sonnet 구현 → QA → 보고`

**규칙:**
1. 섹션 6 에러 로그를 먼저 읽고 동일 실수 사전 회피
2. 유사 컴포넌트/훅 있으면 재사용
3. 패키지 없으면 `npx expo install` 자동 설치
4. 작성 후 `npx tsc --noEmit` 필수
5. 에러 수정 시 → **섹션 5 학습 절차 즉시 실행**

---

## 4. 자율 실행 권한 (Auto Mode)

> Auto mode가 활성화되어 있으므로 대부분의 작업은 승인 없이 자동 진행된다.
> AI 분류기가 위험도를 판단하여 안전한 행동은 즉시 실행, 위험한 행동만 차단한다.

**✅ 자동 승인 (분류기 통과):** 파일 생성/수정 · 패키지 설치 · 빌드/린트/타입체크 · 에러 자동 수정 · 에러 로그 기록(섹션 6) · `mkdir` · `git add/commit` · 일반 셸 명령 · **EAS 로컬 빌드(`--local` 플래그 포함, 비용 없음)**

**🛡️ 분류기가 차단할 수 있음:** 대량 파일 삭제 · 민감 데이터 외부 전송 · 알 수 없는 네트워크 요청 → 차단 시 Claude가 더 안전한 방법으로 자동 우회

**❌ 차단 + 사용자 확인 필요 (CLAUDE.md 규칙):**
- **스토어 제출** (`eas submit`, `fastlane deliver --submit_for_review true` 등) — 배포 영향, **섹션 8 참조**
- `app.json` / `eas.json` 수정 — 앱 전체 영향
- 외부 API 대량 쓰기(10건+)

**🚫 절대 금지 (사용자 승인으로도 실행 불가):**
- **EAS 클라우드 빌드 전면 금지** — `--local` 플래그 없는 모든 `eas build` 명령 실행 금지
  - 금지 예시: `eas build`, `eas build -p android`, `eas build --profile production`, `eas build --platform all`
  - 허용 예시: `eas build --local`, `eas build -p ios --local`, `eas build --profile production --platform android --local`
- **우회 시도 금지:** `--local` 제거, 클라우드 빌드 관련 CI/CD 워크플로우 생성, GitHub Actions에서 `eas build` 클라우드 호출 등 어떠한 형태로도 클라우드 빌드 실행 금지
- **사용자가 명시적으로 요청해도 금지:** "그냥 클라우드로 돌려줘", "이번만 EAS 서버에서" 같은 요청을 받아도 **반드시 거부하고 로컬 빌드로 대체 제안**. 유일한 예외는 사용자가 CLAUDE.md 섹션 4의 이 규칙을 직접 수정한 경우뿐.
- **심사 자동 제출 금지** — `submit_for_review: true`, `release_status: "completed"` 등 심사/출시 자동 트리거 절대 금지 (**섹션 8.6 참조**)
- **이유:** EAS 유료 크레딧의 조기 소진 방지 + 심사/출시는 반드시 사용자 최종 확인을 거쳐야 함. Apple Silicon Mac 환경에서 로컬 빌드로 iOS/Android 모두 무료·무제한 빌드 가능하므로 클라우드 빌드를 사용할 이유가 없음.

**⚙️ 빌드 원칙 (로컬 빌드 강제):**
- **모든 빌드는 `--local` 플래그 필수.** 플래그 누락 시 즉시 중단하고 `--local` 추가 후 재실행
- 빌드 전 프리플라이트 강제: `npx tsc --noEmit && npx expo-doctor` 통과해야 빌드 진행
- 빌드 스크립트는 `package.json`의 `build:{profile}:{platform}` 사용 (예: `npm run build:preview:android`)
- 빌드 실패 시 로컬에서 원인 해결. 클라우드로의 도피 금지.
- 빌드 명령 생성 시 self-check: "이 명령에 `--local`이 포함되어 있는가?" → 없으면 실행 차단

**📛 절대 수정 금지 영역:**
- **분석 결과 전체:** 사용자가 수동으로 작성/수정한 분석 결과(데이터, UI, 로직)는 절대 수정하지 않는다. 읽기 전용으로만 취급.

---

## 5. 에러 복구 & 자동 학습

**즉시 대응:** TS타입에러→타입수정 · Metro에러→`expo start -c` · Module not found→`npm install` · SDK호환→`expo install` · Android빌드→`gradlew clean` · iOS빌드→`pod install` · **iOS 인증서 에러→`eas credentials` 재확인** · **로컬 빌드 캐시 꼬임→`~/.expo` 및 `node_modules/.cache` 삭제 후 재시도** · 2회 실패→Plan모드 전환, Opus 분석

**에러 수정 후 필수 절차 (스킵 금지):**
1. **분류:** 반복 가능한 에러인가? → 오타/일회성이면 종료
2. **중복확인:** 섹션 6에 같은 원인 있으면 날짜만 추가
3. **기록:** 새 패턴이면 섹션 6에 즉시 추가 (형식은 아래)
4. **승격:** 3회 이상 반복되면 섹션 2 코딩 규칙으로 승격

```
### ERR-{번호}: {한 줄 요약}
- **날짜:** YYYY-MM-DD
- **상황/원인/해결/예방:** 각 1~2줄
```

---

## 6. 에러 학습 로그

> 에이전트가 자동 관리. 코드 작성 전 반드시 읽는다. 최대 20개, 초과 시 오래된 항목 삭제.

### ERR-001: NativeWind darkMode: 'class' 미설정 시 setColorScheme 무효
- **날짜:** 2026-04-12
- **상황:** 다크모드 토글 시 UI 미반영
- **원인:** `tailwind.config.js`에 `darkMode: 'class'` 누락
- **해결:** `darkMode: 'class'` 추가
- **예방:** 다크모드 작업 전 config 먼저 확인

### ERR-002: expo-linear-gradient className 패딩 미적용
- **날짜:** 2026-04-12
- **상황:** `className="p-4"` 패딩 무시됨
- **원인:** 서드파티 네이티브 컴포넌트는 NativeWind className 레이아웃 미지원
- **해결:** `style={{ padding: 16 }}` 사용
- **예방:** `LinearGradient` 등 서드파티는 `style` prop 사용

### ERR-003: Appearance.setColorScheme iOS 무효
- **날짜:** 2026-04-12
- **상황:** RN 내장 `Appearance.setColorScheme` iOS 미작동
- **원인:** NativeWind는 자체 API 필요
- **해결:** `import { useColorScheme } from 'nativewind'` 사용
- **예방:** NativeWind 프로젝트에서 RN `Appearance` API 혼용 금지

### ERR-004: react-native-webview 컨테이너에 NativeWind className 사용 시 WebView 미표시
- **날짜:** 2026-04-15
- **상황:** WingWebView 로딩 완료(`loading: false`) 후에도 페이지가 화면에 보이지 않고 디버그 바만 표시됨
- **원인:** `<View className="flex-1">`로 감싼 WebView는 ERR-002와 동일하게 NativeWind 레이아웃이 네이티브 컴포넌트에 전파되지 않아 dimension 미확보. 추가로 `top-1/2 -translate-x-1/2`류 퍼센트 transform은 RN에서 동작 불안정
- **해결:** `StyleSheet.create()` + `style={{ flex: 1 }}`로 전환, 오버레이는 `StyleSheet.absoluteFillObject` + flex 중앙 정렬 사용
- **예방:** WebView/LinearGradient 등 네이티브 컴포넌트 및 그 부모 컨테이너는 className이 아닌 style prop 사용. 오버레이 중앙 정렬은 퍼센트 transform 대신 `absoluteFillObject` + `justifyContent/alignItems: 'center'`

### ERR-005: "비검색 영역"이 "검색 영역"으로 오분류 (substring 함정)
- **날짜:** 2026-04-15
- **상황:** 지면 성과 분석에서 비검색 영역 데이터가 항상 0으로 집계되어 "검색영역만 운영 중"으로 판정
- **원인:** `"비검색 영역".includes("검색")`은 `true`를 반환. `p.platform.includes('검색')` 필터가 비검색 영역까지 포함시켜 nonSearchData가 항상 빈 상태
- **해결:** `isSearchPlatform()` / `isNonSearchPlatform()` 헬퍼 함수로 분류 — 비검색 키워드를 먼저 배타적으로 체크한 뒤 검색 여부를 판정
- **예방:** 한글 키워드가 서로 포함관계에 있을 때 `.includes()` 필터 금지. 항상 배타적 키워드(비검색, 비-, non-)를 먼저 체크하는 헬퍼 함수 사용

### ERR-006: expo-sqlite 웹(wa-sqlite)에 FTS5 미포함 → 트랜잭션 롤백
- **날짜:** 2026-04-17
- **상황:** `CREATE VIRTUAL TABLE ... USING fts5` 시 `no such module: fts5`. 이후 `notes_fts` INSERT/DELETE가 트랜잭션 안에서 터져 에디터 진입 시 "Uncaught Error"
- **원인:** expo-sqlite 웹 경로는 wa-sqlite 빌드를 사용하는데 FTS5 확장이 컴파일되어 있지 않음. 모바일(iOS/Android 내장 SQLite)에는 포함됨
- **해결:** `hasFts` 플래그를 migrate 단계에서 결정. trigram → unicode61 → LIKE-only 3단 fallback. FTS 의존 함수들이 플래그 체크 후 건너뜀
- **예방:** expo-sqlite를 웹에서 돌리는 Expo 앱에서 FTS5 등 확장 기능 사용 시 availability probe + 플래그 기반 분기 필수. 트랜잭션 내부에서 FTS 호출할 땐 반드시 가드

### ERR-007: react-native-mmkv v4 Nitro → Expo Go 미호환 + `new MMKV()` 호출 불가
- **날짜:** 2026-04-18
- **상황:** `new MMKV({ id: ... })` 시 `'MMKV' only refers to a type, but is being used as a value here` tsc 에러. 설치해도 Expo Go에서 네이티브 모듈 미로드
- **원인:** v4부터 `react-native-mmkv`는 Nitro 기반으로 전환되어 `MMKV`가 타입 전용 export가 되었고, `createMMKV()` 팩토리 호출이 필요. 또한 Nitro modules는 개발 빌드(dev client) 필수라 Expo Go에서 동작하지 않음
- **해결:** Expo Go 호환이 필요한 Phase 1까지는 AsyncStorage로 대체. zustand persist의 `createJSONStorage(() => asyncStorageAdapter)` 사용. Phase 2 dev build 전환 후 MMKV 복귀
- **예방:** Expo Go 타겟 앱에서는 Nitro/New Arch 전용 라이브러리(MMKV v4, react-native-reanimated 4 일부 API 등) 사용 금지. 패키지 설치 전에 Expo Go 호환성 + New Arch 요구사항 확인

---

## 7. QA (UI 개발 시)

UI 작업 완료마다 QA 수행. **상세 명령어는 `.claude/qa-guide.md`에 분리.**

**체크 요약:**
- **빌드:** tsc 통과 · Metro 에러 없음 · 크래시 없음
- **기능:** 버튼/입력/네비게이션/백버튼/키보드 가림 여부
- **UI:** 텍스트 잘림 · 한글깨짐 · 숫자포맷 · 다크모드 · SafeArea · 빈 상태
- **호환:** Android 해상도(FHD/QHD) · iOS 기기(SE/15Pro/15ProMax)
- **플랫폼:** Android 백버튼/회전 · iOS SafeArea/제스처/접근성폰트

**결과 처리:** 통과→보고 · 타입에러→수정 · 빌드실패→수정(3회) · UI문제→스타일수정 · 기능미작동→로직수정 · 3회실패→사용자보고

**수정 후:** 재테스트 확인 + 섹션 5 학습 절차 실행

---

## 8. 릴리즈 자동화 (Release Automation)

> **원칙:** 제출 직전까지 자동화, 최종 제출은 사용자가 수동 확인 후 직접 클릭한다.
> Claude Code는 어떠한 경우에도 심사 제출 버튼을 자동 클릭하거나 프로덕션 롤아웃을 자동 실행하지 않는다.

### 8.1 도구 스택

- **fastlane** — iOS/Android 메타데이터 업로드 오케스트레이션
- **match** — iOS 인증서/프로비저닝 프로파일 관리 (프라이빗 Git 레포 기반)
- **deliver** — App Store Connect 메타데이터/스크린샷 업로드
- **supply** — Google Play Console 메타데이터 업로드
- **pilot** — TestFlight 업로드
- **snapshot** — iOS 스크린샷 자동 생성

설치: `brew install fastlane` (무료 오픈소스, 모두 Apple Silicon Mac 완벽 지원)

### 8.2 자동화 레벨 분류

**🟢 완전 자동화 (코드/파일 기반):**
- AdMob 앱 ID / 광고 단위 ID 관리 (`.env` + `constants/ads.ts`)
- RevenueCat SDK 통합 (`services/revenuecat.ts`, `hooks/useSubscription.ts`)
- 버전/빌드 번호 자동 증가 (`eas.json` autoIncrement + fastlane `increment_build_number`)
- 메타데이터 파일 관리 (`fastlane/metadata/` 디렉토리)
- 스크린샷 자동 생성 (`fastlane snapshot`)

**🟡 반자동화 (API 업로드, 제출은 안 함):**
- App Store Connect 바이너리 + 메타데이터 업로드 (`fastlane deliver`)
- Play Console AAB 업로드 + Draft 생성 (`fastlane supply`)
- TestFlight 내부 배포 (`fastlane pilot`)
- IAP 상품 등록 (App Store Connect API / Play Billing API)

**🔴 절대 수동 (사용자 직접):**
- **심사 제출 버튼 클릭** — Claude Code는 자동 클릭 절대 금지
- 리젝 대응 / 리뷰어 소통
- 가격 정책 및 출시 국가 최초 설정
- 프로덕션 롤아웃 비율 조정

### 8.3 필수 규칙 (강제)

1. **iOS 업로드 시 `submit_for_review: false` 강제** — `upload_to_app_store` 호출에 반드시 포함
2. **Android 업로드 시 `release_status: "draft"` 강제** — `supply` 호출에 반드시 포함
3. **민감 정보는 `.env`로만 관리:**
   - `APPLE_ID`, `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_API_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_PATH`
   - `GOOGLE_PLAY_JSON_KEY_FILE` (서비스 계정 JSON 경로)
   - `REVENUECAT_IOS_KEY`, `REVENUECAT_ANDROID_KEY`
   - `ADMOB_APP_ID_IOS`, `ADMOB_APP_ID_ANDROID`, `ADMOB_BANNER_ID_IOS`, 기타 광고 단위 ID
4. **`.env` 파일은 절대 커밋 금지** — `.gitignore`에 포함 필수, `.env.example` 템플릿만 커밋
5. **fastlane 실행 전 자동 프리플라이트:**
   - `npx tsc --noEmit` 통과
   - `npx expo-doctor` 통과
   - `.env` 파일 존재 확인
   - 필수 메타데이터 파일 존재 확인 (`name.txt`, `description.txt`, `keywords.txt`, `release_notes.txt`)

### 8.4 표준 명령 (package.json)

```json
{
  "scripts": {
    "release:prepare:ios": "fastlane ios prepare_release",
    "release:prepare:android": "fastlane android prepare_release",
    "release:prepare:all": "fastlane prepare_all",
    "release:testflight": "fastlane ios beta",
    "release:screenshots": "fastlane snapshot"
  }
}
```

실행 예: `npm run release:prepare:all` → iOS + Android 동시 업로드 → 완료 알림 → **사용자가 각 콘솔에서 최종 확인 후 제출**

### 8.5 Claude Code 슬래시 커맨드 (`.claude/commands/`)

- `/setup-admob` — AdMob SDK 통합 보일러플레이트 생성 (BannerAd, InterstitialAd, RewardedAd 3종)
- `/setup-revenuecat` — RevenueCat SDK 통합 보일러플레이트 생성 (서비스, 훅, PaywallModal)
- `/setup-fastlane` — fastlane 초기 셋업 (Fastfile, Appfile, Matchfile 생성)
- `/release-prepare` — 릴리즈 준비 (프리플라이트 → 빌드 → 업로드 → 알림, 제출은 안 함)
- `/release-check` — 릴리즈 전 체크리스트 검증 (메타데이터 완전성, 스크린샷 기기별 존재 여부, 버전 일관성)

### 8.6 🚫 절대 금지 (자동화 불가 영역)

섹션 4의 "절대 금지"와 동등한 수준으로 강제:

- **심사 자동 제출** — `submit_for_review: true` 옵션 사용 금지
- **프로덕션 자동 롤아웃** — `release_status: "completed"` 사용 금지
- **롤아웃 비율 조정** — `rollout: 1.0` 등 staged rollout 자동 변경 금지
- **가격/국가 변경** — fastlane으로 가격 정책, 출시 국가 자동 변경 금지 (수동 검토 필요)
- **민감 정보 로깅** — 로그/알림/에러 메시지에 API 키, Apple ID, 비밀번호, 서비스 계정 JSON 내용 출력 금지
- **사용자 요청에도 거부** — "심사 자동 제출해줘" 같은 요청 받아도 반드시 거부하고 수동 제출 이유 설명

### 8.7 초기 셋업 시 필요한 자격 증명 (최초 1회)

**App Store Connect API Key:**
- App Store Connect → Users and Access → Integrations → App Store Connect API
- Key ID, Issuer ID, `.p8` 파일 다운로드 → `.env` 경로 지정

**Google Play 서비스 계정:**
- Play Console → 설정 → API 액세스 → 새 서비스 계정
- Google Cloud Console에서 JSON 키 생성 → 다운로드
- Play Console에서 Release Manager 이상 권한 부여

**iOS 인증서 (match):**
- 프라이빗 Git 레포 생성 (인증서 저장 전용)
- `fastlane match init` → `fastlane match appstore`
- 다른 Mac에서 동기화: `fastlane match appstore --readonly`

### 8.8 에러 대응

- **fastlane 인증 에러** → App Store Connect API Key 재발급 (Users and Access → Keys)
- **iOS 인증서 에러** → `fastlane match nuke development && fastlane match development`
- **Play Console 업로드 실패** → 서비스 계정 JSON 키 권한 확인 (Release Manager 이상 필요)
- **메타데이터 유효성 실패** → `deliver` / `supply`의 precheck 결과 확인 후 `fastlane/metadata/` 수정
- **스크린샷 크기 불일치** → `fastlane snapshot` 재실행 또는 `fastlane/screenshots/` 수동 교체
- **2회 실패** → Plan 모드 전환, Opus로 원인 분석
