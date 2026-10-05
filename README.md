# spotix

경북여행(gb-voyage) 상품 페이지의 품절 뱃지가 사라지면 텔레그램으로 알려주는 체커입니다.
GitHub Actions가 10분마다 `check.mjs`를 실행합니다.

## 감시 대상 바꾸기
`config.json`의 `events`에 `name`, `url`, `option_text`(옵션 이름의 일부)를 넣습니다.

## 텔레그램 설정
1. 텔레그램에서 **@BotFather**에게 `/newbot` → 봇 토큰을 받습니다.
2. 만든 봇에게 아무 메시지나 보낸 뒤, 브라우저로
   `https://api.telegram.org/bot<토큰>/getUpdates` 를 열어 `chat.id` 값을 확인합니다.
3. 저장소 **Settings → Secrets and variables → Actions**에 추가합니다.
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
4. **Actions → ticket-watch → Run workflow**로 한 번 수동 실행해 로그를 확인합니다.

참고: GitHub의 예약 실행(schedule)은 기본 브랜치에 있는 워크플로만 동작합니다.
