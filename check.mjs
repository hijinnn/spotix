// gb-voyage 상품 페이지는 자바스크립트로 그려지므로 실제 브라우저(Playwright)로 연다.
// 옵션(예: "1인 입장권") 근처의 <div class="badge">품절</div>이 사라지면 알림을 보낸다.
// 알림: 텔레그램 (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 환경변수).
import { chromium } from "playwright";
import fs from "node:fs";

const STATE = "state.json";
const cfg = JSON.parse(fs.readFileSync("config.json", "utf8"));
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : {};

async function notify(msg) {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat } = process.env;
  if (!token || !chat) return console.log("[텔레그램 미설정]", msg);
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: msg }),
  });
  if (!res.ok) console.error("텔레그램 전송 실패", res.status, await res.text());
}

// 옵션 이름이 있는 "행"(같은 모양의 형제가 여럿인 조상) 안에 품절 뱃지가 있는지 본다.
async function optionStatus(page, optionText) {
  return page.evaluate((text) => {
    const hits = [...document.querySelectorAll("body *")].filter(
      (el) => el.children.length === 0 && el.textContent.includes(text));
    if (!hits.length) return "not_found";
    // 옵션 "행"을 찾는다: 부모 아래에 같은 모양(태그+클래스)의 형제가 여럿 있는 첫 조상.
    const rowOf = (el) => {
      for (; el.parentElement && el.parentElement !== document.body; el = el.parentElement) {
        const same = [...el.parentElement.children].filter(
          (s) => s.tagName === el.tagName && s.className === el.className);
        if (el.children.length > 0 && same.length > 1 && el.parentElement.textContent.trim() !== el.textContent.trim()) return el;
      }
      return el;
    };
    for (const leaf of hits) {
      const row = rowOf(leaf);
      if ([...row.querySelectorAll(".badge")].some((b) => b.textContent.trim() === "품절")) return "sold_out";
    }
    return "available";
  }, optionText);
}

const browser = await chromium.launch();
const page = await browser.newPage({ locale: "ko-KR" });
for (const ev of cfg.events) {
  try {
    await page.goto(ev.url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    const status = await optionStatus(page, ev.option_text);
    const prev = state[ev.url]?.status ?? "sold_out";
    console.log(`${ev.name}: ${status}`);
    if (status === "available" && prev !== "available") {
      await notify(`🎫 품절 해제! ${ev.name}\n${ev.url}`);
    }
    if (status === "not_found") {
      console.warn("옵션을 찾지 못했어요. 페이지 구조가 바뀌었을 수 있어요.");
      await page.screenshot({ path: "debug.png", fullPage: true });
    } else {
      state[ev.url] = { status, checked: new Date().toISOString() };
    }
  } catch (e) {
    console.error(`${ev.name}: 조회 실패`, e.message);
  }
}
await browser.close();
fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
