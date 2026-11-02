# 개발·배포 안내

기준: 2026-11-02, v1.0.14. 빌드 도구 없이 Manifest V3 폴더 자체를 로드합니다.

## 경로와 원본

기준 디렉터리:
`/Users/okpos/.codex/visualizations/2026/11/02/01a19ac8-d10a-7720-ade3-fc00112d7630`

| 상대 경로 | 역할 |
|---|---|
| `MrSohnWordCheck/` | 수정해야 할 개발 원본 |
| `gemini-proofreader/` | Chrome이 현재 등록한 실행 사본, 일반 폴더 |
| `MrSohnWordCheck.zip` | 공유용. 내부 루트도 MrSohnWordCheck |
| `gemini-proofreader.zip` | 이전 이름 호환본 |

두 폴더의 동기화와 ZIP 생성은 `tools/release.py --publish`로 함께 실행합니다. 파일 저장만으로 자동 배포되지는 않습니다. Chrome 프로필·확장 저장소 파일을 직접 편집하지 마세요.

## 파일 구조

| 파일 | 역할 |
|---|---|
| `manifest.json` | 권한, proofread command, 아이콘, 옵션 페이지 |
| `background.js` | 단축키 → 스크립트 주입, CORRECT 메시지, 요청 동시 실행 제한, 시작 시 복구 |
| `api.js` | Gemini generateContent 호출, JSON 결과 검증, HTTP 오류 및 키 마스킹 |
| `settings.js` | 고정 테스트 문장으로 검증 후 API 키 저장 |
| `options.html/css/js` | 설정, 수정 시각, 키 관리, 사이트 버튼 활성화, 실제 단축키 표시 |
| `site-access.js` | 선택적 maadm 권한, 동적 콘텐츠 스크립트 등록/복구, 열린 탭 주입 |
| `content.js` | 입력칸 감지, 좌우 모달, 안전한 적용, 검사 버튼 삽입 |
| `diff.js` | Intl.Segmenter 기반 grapheme diff, 큰 입력의 계산량 제한 |
| `shortcut.js` | 실제 등록 키 확인, 마지막 키 저장, 해제 안내 |
| `icons/` | WC SVG와 Chrome용 PNG 16/32/48/128 |
| `tests/` | Node 테스트 및 mock 브라우저 시나리오 |
| `test-page.html` | 일반 입력창 수동 테스트 |

## 동작과 권한

단축키는 activeTab 권한으로 현재 최상위 탭에 `diff.js`, `protection.js`, `content.js`를 순서대로 넣고 OPEN_PROOFREADER를 보냅니다. 콘텐츠 스크립트가 CORRECT로 텍스트를 요청하면 워커가 키를 읽어 API를 호출합니다. 교정문은 미리보기에서 승인 후 적용합니다.

API 호스트: `https://generativelanguage.googleapis.com/*`.
선택적 호스트: `https://maadm.okpos.co.kr/*`.
검수 스크립트 등록은 `/bizchatRegularCmpnReview/form/*`로 제한하고, 실행 시 HTTPS·포트 8090·숫자 ID 경로를 검사합니다.

행 선택은 `#variableForm .bizchat-regular-review-variable tr`의 th 문구로 합니다. input의 variableList 인덱스를 고정하지 않습니다. 대상 칸의 disabled/readonly 상태를 따릅니다.

## 수정 후 순서

1. 개발 원본에서 변경. 사용자 키 없이 테스트합니다.
2. 기능 수정이면 manifest 버전과 options.html의 한국 시간 고정 수정 시각을 함께 갱신합니다.
3. 관련 테스트 실행 및 QA.md 기록. 민감한 실제 메시지를 테스트 fixture로 복사하지 않습니다.
4. `python3 tools/release.py`로 충돌을 검사합니다. 실행 사본의 독립 변경은 덮어쓰지 않고 중단합니다.
5. `python3 tools/release.py --publish`로 실행 폴더와 ZIP 두 개를 갱신하고 해시를 검증합니다. 기존 실행 사본은 형제 `MrSohnWordCheck-backup-*`에 보관합니다. 로컬 기준 파일 `.release-state.json`, node_modules, .git, .env, .DS_Store, __pycache__는 제외됩니다. 소스에 사용자 키를 저장해서는 안 됩니다.
6. 기존 Chrome 등록에서 새로고침합니다. 제거 후 다른 폴더로 등록하지 않습니다.
7. 버전, API 키 존재 여부(값 노출 금지), 사이트 버튼, 단축키 유지 확인. 기존 페이지 스크립트가 오래됐으면 미저장 입력을 보존한 뒤 페이지 새로고침합니다.

문서만 수정하는 경우 2·6은 필요 없습니다. ZIP도 최신 문서가 포함되도록 갱신합니다.

## 테스트

개발 폴더에서:

```sh
npm test
node --check background.js
node --check content.js
node --check options.js
python3 -m http.server 8765
```

마지막 명령은 수동 테스트 서버이므로 필요할 때만 실행하고 종료합니다. `http://localhost:8765/test-page.html`을 실제 확장으로 열어 확인할 수 있습니다.

브라우저 자동 테스트는 별도 Playwright 설치가 필요합니다. 테스트 파일은 `require('playwright')`를 사용하고 Chrome 실행 경로는 macOS에 고정되어 있습니다. 과거 실행 환경은 `/tmp/gemini-proofreader-qa/node_modules`였으며 영구 의존성으로 가정하면 안 됩니다. 다른 환경에서는 설치 위치와 Chrome 경로를 맞추세요.

v1.0.14에서 Node 테스트 19개, 배포 Python 테스트 2개, 브라우저 시나리오 4개 파일이 통과했습니다. 브라우저 테스트는 runtime/API mock 기반이며 실제 Chrome command 등록/권한/실서버 검증을 대신하지 않습니다.

## 공식 문서

- [Commands API](https://developer.chrome.com/docs/extensions/reference/api/commands)
- [Gemini API 키](https://ai.google.dev/gemini-api/docs/api-key)
- [Gemini 요금](https://ai.google.dev/gemini-api/docs/pricing)

이 링크를 다음 작업에서 사용하려면 최신 내용을 다시 확인하세요.

## 추가 모듈 및 검증

- `protection.js`: 워커/콘텐츠 스크립트 공통 검증. 보호 토큰 배열의 순서와 횟수, 지정 단어의 등장 횟수를 비교. 구조화된 토큰 외 임의 고유명사를 추론하지 않습니다.
- `tools/release.py`: 기본값은 읽기 전용 확인. 배포 전 백업, 파일별 교체, ZIP 생성 및 해시 검증. 오류 발생 시 표시된 백업으로 복구하며 전체 디렉터리 교체가 원자적이지는 않습니다. 배포 중 Chrome을 새로고침하지 마세요.
- `python3 tests/release_test.py`: 임시 폴더에서 배포/제외/충돌/삭제 검증.
- `tests/safety-browser.cjs`: 수동 수정 보호, 상호명 보호, 되돌리기와 stale 값 보호, 부분 선택/일반 contenteditable, 반응형 좌우 UI.

## 로컬 Git

개발 원본 `MrSohnWordCheck/`에서 Git으로 소스·테스트·문서를 관리합니다. 실행 사본과 배포 ZIP은 Git 저장소 밖에 있으며, `.release-state.json`, 환경 파일, 캐시, 자동 생성 미리보기 이미지는 추적하지 않습니다. Git 메타데이터 `.git/`는 배포 스크립트에서 제외합니다. 원격 저장소는 별도 요청이 있을 때 설정합니다.
