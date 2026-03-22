# CLAUDE.md

## ภาษา
- ตอบเป็น **ภาษาไทย** เสมอ
- Comment ในโค้ดเป็นภาษาไทย
- UI text เป็นภาษาไทย (ยกเว้น technical terms)

## โปรเจค
- Chrome Extension (Manifest V3, Side Panel) สำหรับ automate สร้างคลิปโฆษณาบน Google Flow + โพสต์ TikTok อัตโนมัติ + ปั้นช่อง TikTok
- อ่าน plan ละเอียดที่: `PLAN.md`
- ติดตามความคืบหน้าที่: `CHECKLIST.md`

## เทคโนโลยี
- Vanilla HTML/CSS/JS (ไม่ใช้ framework, ไม่ต้อง build)
- Chrome Extension Manifest V3 + Side Panel API
- ฟอนต์: **Noto Sans Thai** (Google Fonts)
- DOM Automation ผ่าน `chrome.scripting.executeScript`
- Data storage: `chrome.storage.local`

## อ้างอิง
- PROMPT&PLAY AUTO GEN PRO 4.2 (ZIP ในโปรเจค) - ใช้เป็น reference สำหรับ DOM automation patterns
- อ่าน ZIP ด้วย Python zipfile module

## แนวทางการทำงาน
- ทำทีละ Phase ตาม CHECKLIST.md
- เทสทีละขั้นตอนก่อนไปต่อ
- อัพเดท CHECKLIST.md ทุกครั้งที่ทำเสร็จแต่ละข้อ
- ห้ามข้ามขั้นตอน ต้องเทสผ่านก่อนไปต่อ

## Skills ที่ต้องใช้ทุกครั้ง

ใช้ skills เหล่านี้ทุกครั้งที่ทำงานในโปรเจค โดยเรียกผ่าน `/skill-name`:

### สำหรับสร้าง Extension
- `/browser-extension-builder` — ใช้ทุกครั้งที่สร้าง/แก้ไข Chrome Extension (manifest, content scripts, service worker, side panel, permissions, cross-context messaging)

### สำหรับเชื่อมต่อ AI API
- `/claude-api` — ใช้เมื่อเขียนโค้ดเชื่อมต่อ Claude API (Anthropic SDK, messages API)
- `/gemini-api-integration` — ใช้เมื่อเขียนโค้ดเชื่อมต่อ Gemini API

### สำหรับ UI/UX
- `/ui-ux-pro-max` — ใช้เมื่อออกแบบ UI ทุกหน้า (สี, ฟอนต์, layout, components)
- `/frontend-ui-dark-ts` — ใช้เมื่อทำ Dark/Light theme system

### สำหรับ Automation
- `/browser-automation` — ใช้เมื่อเขียน DOM automation (heavyClick, scraping, form filling)

### สำหรับ Security
- `/security-auditor` — ใช้ตรวจสอบโค้ดก่อน deploy ทุกครั้ง
- `/api-security-best-practices` — ใช้เมื่อจัดการ API keys และ license system

### สำหรับคุณภาพโค้ด
- `/clean-code` — ใช้ทุกครั้งที่เขียนโค้ดเพื่อให้สะอาด อ่านง่าย
- `/javascript-mastery` — ใช้เมื่อเขียน JavaScript เพื่อ best practices (ES6+, async/await, error handling)

### วิธีใช้
เมื่อเริ่มทำงานแต่ละ Phase ให้เรียก skill ที่เกี่ยวข้อง เช่น:
- สร้าง manifest.json → ใช้ `/browser-extension-builder`
- เขียน AI provider → ใช้ `/claude-api` + `/gemini-api-integration`
- ออกแบบ UI → ใช้ `/ui-ux-pro-max` + `/frontend-ui-dark-ts`
- เขียน DOM automation → ใช้ `/browser-automation`
- ตรวจสอบก่อน deploy → ใช้ `/security-auditor`
