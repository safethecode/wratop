<div align="center">
  <img src="./assets/wratop-icon.png" width="160" alt="Wratop 로고" />

  <h1>Wratop</h1>

  <p>
    쌓여 있는 Chrome 탭을 골라 보관하고, 필요할 때 다시 여는 macOS 앱
  </p>

  <p>
    여러 창에 흩어진 탭을 한눈에 확인하고,<br />
    필요한 탭만 로컬에 남긴 뒤 브라우저에서는 닫습니다.
  </p>

  <p>
    <img alt="macOS 13 이상" src="https://img.shields.io/badge/macOS-13%2B-000000?logo=apple&logoColor=white" />
    <img alt="Electron 44" src="https://img.shields.io/badge/Electron-44-47848F?logo=electron&logoColor=white" />
    <img alt="React 19" src="https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB" />
    <img alt="TypeScript 5.9" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
    <img alt="Biome 2.5" src="https://img.shields.io/badge/code_style-Biome_2.5-60A5FA?logo=biome&logoColor=white" />
  </p>

  <p>
    <a href="#주요-기능">주요 기능</a> ·
    <a href="#탭-보관-과정">탭 보관 과정</a> ·
    <a href="#시작하기">시작하기</a> ·
    <a href="#프로젝트-구조">프로젝트 구조</a>
  </p>
</div>

---

## Wratop은?

Wratop은 닫지 못해 쌓인 Chrome 탭을 정리하는 macOS 앱입니다. 열려 있는 탭을 창별로
불러오고, 필요한 탭만 골라 하나의 아카이브로 묶습니다. 기록만 남기거나 보관과 동시에
Chrome에서 닫습니다.

아카이브에는 탭의 제목과 주소, 순서, 활성 상태, 창 구성이 들어갑니다. 나중에 전체 탭을
한꺼번에 열거나 필요한 탭만 골라 새 Chrome 창으로 복원합니다. 시크릿 창은 처음부터 조회
대상에서 제외합니다.

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| 현재 탭 확인 | Chrome 창별로 탭 제목과 주소를 표시합니다. |
| 검색과 선택 | 제목이나 주소로 찾고, 보이는 탭만 한꺼번에 고릅니다. |
| 최근 탭 정렬 | Wratop이 새로 발견한 탭을 각 창의 맨 위에 표시합니다. |
| 탭 보관 | 이름을 붙여 저장하거나 기본 이름으로 바로 보관합니다. |
| 보관 후 닫기 | 선택한 탭을 먼저 저장한 뒤 Chrome에서 닫습니다. |
| 선택 복원 | 아카이브에서 필요한 탭만 골라 창 단위로 다시 엽니다. |
| 메뉴 막대 | 앱 창을 닫아도 현재 탭 수를 확인하고 직접 새로고침합니다. |

### 자동 갱신

- `Tabs` 화면을 보고 있을 때는 15초마다 목록을 확인합니다.
- 메뉴 막대의 탭 수는 60초마다 갱신됩니다.
- 앱 창과 메뉴 막대가 동시에 요청해도 Chrome 조회는 한 번만 실행합니다.
- Chrome이 15초 안에 응답하지 않으면 요청을 멈추고 재시도 버튼을 표시합니다.

### 안전하게 닫기

보관할 때 읽은 탭과 닫을 때의 탭이 같은지 ID와 주소를 함께 확인합니다. 그사이 탭이
이동했거나 주소가 바뀌었다면 해당 탭은 닫지 않습니다. 아카이브 저장이 끝난 뒤에만
Chrome 탭을 닫으므로, 자동화가 실패해도 보관한 기록은 남습니다.

## 탭 보관 과정

```text
Chrome 창과 탭 확인
        ↓
검색 후 필요한 탭 선택
        ↓
아카이브 이름 입력
        ↓
Archive 또는 Archive & Close
        ↓
로컬 JSON 파일에 저장
        ↓
필요할 때 탭을 골라 복원
```

`Archive`는 탭을 보관하고 Chrome에는 그대로 둡니다. `Archive & Close`는 저장을 마친 뒤
선택한 탭을 닫습니다.

## 데이터 저장

아카이브는 별도 서버나 데이터베이스를 쓰지 않고 Mac 안에 JSON 파일로 저장합니다.

```text
~/Library/Application Support/wratop/
├── archives/          # 보관한 탭
└── tab-recency.json   # 탭을 처음 발견한 시각
```

아카이브마다 UUID를 이름으로 쓴 JSON 파일이 하나씩 생깁니다. 앱에서 아카이브를 삭제하면
해당 파일도 함께 지워집니다. 최근 탭 순서는 Wratop이 탭을 처음 발견한 시각부터 기록하며,
기록하기 전에 열려 있던 탭끼리는 Chrome 순서를 유지합니다.

## 권한

Wratop은 Apple Events로 Google Chrome의 탭을 읽고, 열고, 닫습니다. 처음 실행할 때 macOS가
자동화 권한을 물으면 허용해야 합니다. 권한은 다음 위치에서 바꿉니다.

```text
시스템 설정 → 개인정보 보호 및 보안 → 자동화
```

시크릿 창과 그 안의 탭은 읽거나 저장하지 않습니다.

## 기술 구성

| 영역 | 사용 기술 |
| --- | --- |
| Desktop | Electron, Electron Forge |
| UI | React |
| Language | TypeScript |
| Styling | StyleX, Tailwind CSS 색상 token |
| Browser automation | JavaScript for Automation, Apple Events |
| Local storage | JSON 파일 |
| Build | Webpack |
| Code quality | Biome, TypeScript, Vitest, Testing Library |

Renderer는 Chrome에 직접 접근하지 않습니다. 제한된 preload API가 요청을 main process로
전달하고, main process가 권한 확인과 파일 저장을 맡습니다. `contextIsolation`, sandbox,
trusted sender 검사를 켜 두고 외부 페이지 이동과 새 창 열기도 막습니다.

## 시작하기

### 요구 사항

- macOS 13 이상
- Google Chrome
- Node.js 22.12 이상
- npm 10.9.4

### 설치

```bash
git clone https://github.com/safethecode/wratop.git
cd wratop
npm ci
```

### 개발 실행

```bash
npm start
```

첫 탭 조회 때 macOS 자동화 권한을 허용해야 합니다.

### 앱 만들기

실행 가능한 `.app`을 만들려면 다음 명령어를 사용합니다.

```bash
npm run package
```

DMG와 ZIP까지 만들려면 다음 명령어를 사용합니다.

```bash
npm run make
```

생성한 파일은 `out/`에 저장됩니다.

## 프로젝트 구조

```text
assets/                      # 앱 아이콘과 메뉴 막대 아이콘

src/
├── main/
│   ├── archive/             # 아카이브 저장, 조회, 삭제, 복원
│   ├── browser/             # Chrome JXA script와 Apple Events 연결
│   ├── ipc.ts               # main과 renderer 사이 IPC handler
│   ├── status-bar.ts        # 메뉴 막대 탭 수와 명령
│   └── window.ts            # macOS 창 생성과 활성화
├── preload/                 # renderer에 공개하는 제한된 desktop API
├── renderer/
│   ├── app/                 # 화면 shell과 navigation
│   ├── features/
│   │   ├── archive-library/ # 보관 목록과 상세 화면
│   │   ├── current-tabs/    # 현재 탭 조회, 검색, 선택, 보관
│   │   └── runtime/         # runtime 정보
│   └── theme/               # StyleX token
└── shared/                  # process가 함께 쓰는 type과 IPC 정의
```

---

<div align="center">
  <sub>쌓인 탭은 보관하고, 브라우저는 가볍게.</sub>
</div>
