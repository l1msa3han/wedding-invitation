# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

임새한 ♥ 이예은의 모바일 웹 청첩장. 순수 HTML/CSS/JS로 구성된 단일 페이지이며, 방명록 기능에만 Firebase Firestore를 사용한다.

- 결혼일: 2026년 8월 29일 토요일 오후 4시 30분
- 장소: 웨딩스퀘어 강변 (서울 광진구 광나루로56길 85, 테크노마트 3·4층)

## 파일 구조

빌드 도구 없음. 브라우저에서 `index.html`을 직접 열거나 로컬 서버로 확인한다.

```
청첩장/
├── index.html      # 마크업 (7개 섹션)
├── style.css       # 스타일 (CSS 변수 기반)
├── script.js       # 인터랙션 + Firebase 방명록
└── photos/
    └── hero.png    # 히어로 사진
```

## 아키텍처

### 디자인 시스템
모든 색상·폰트는 `style.css` `:root`의 CSS 변수로 관리한다. 레이아웃은 `max-width: 480px` 모바일 고정.

### 섹션 순서
Hero → 인사말(`#invite`) → 갤러리(`#gallery`) → 달력(`#calendar`) → 오시는 길(`#location`) → 마음 전하기(`#account`) → 방명록(`#guestbook`) → Footer

### Firebase (방명록)
- `script.js` 상단 `firebaseConfig`에 실제 값 입력 필요 (현재 플레이스홀더)
- Firestore 컬렉션: `guestbook` / 필드: `name`, `password`(평문), `message`, `createdAt`
- 비밀번호 검증은 클라이언트에서 처리 — 보안상 취약하므로 실 서비스 전 개선 권장
- Firebase 미설정 시 방명록 섹션은 비활성화 메시지만 표시

### 미완성 항목 (TODO)
- `index.html` 53·58번째 줄: 부모님 성함 (`○○○ · ○○○`)
- `index.html` 224·235번째 줄: 실제 계좌번호
- `index.html` 갤러리: 플레이스홀더 div → `<img>` 태그로 교체
- `script.js` 22번째 줄~: Firebase 설정값
