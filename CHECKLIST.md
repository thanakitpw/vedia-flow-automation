# Vedia Flow Automation - Checklist

> อัพเดทสถานะ: ✅ เสร็จแล้ว | 🔄 กำลังทำ | ⬜ ยังไม่ได้ทำ
> อ้างอิง plan ละเอียดที่: `PLAN.md`

---

## Phase 1: Foundation (โครงสร้างพื้นฐาน)

### 1.1 manifest.json
- ✅ สร้างไฟล์ manifest.json (Manifest V3)
- ✅ ตั้งค่า permissions: sidePanel, activeTab, storage, scripting, downloads, tabs, alarms
- ✅ ตั้งค่า host_permissions: Google Flow, TikTok, AI APIs, Google Apps Script
- ✅ ตั้งค่า side_panel + background service worker
- **เทส:** Load extension ใน chrome://extensions/ (Developer Mode) → ไม่มี error สีแดง

### 1.2 background.js
- ✅ เปิด Side Panel เมื่อคลิก icon
- ✅ setPanelBehavior: openPanelOnActionClick
- ✅ รับ messages จาก sidepanel (getTabInfo)
- ✅ Download interception: rename ไฟล์เป็น VEDIA_YYYYMMDD_HHMMSS.ext
- **เทส:** คลิก icon → Side Panel เปิดขึ้น, download รูป/วิดีโอ → ชื่อไฟล์ถูก rename

### 1.3 sidepanel.html
- ✅ โครงสร้าง HTML หลัก (shell)
- ✅ Auth overlay (license key input)
- ✅ Header: ชื่อ extension + version + expiry badge
- ✅ Tab navigation: 6 tabs (Settings, TikTok Products, Warehouse, Video Gen, Advanced, Channel Builder)
- ✅ Tab content container
- ✅ โหลดฟอนต์ Noto Sans Thai จาก Google Fonts
- ✅ โหลด CSS files
- ✅ โหลด JS files (ถูกลำดับ)
- **เทส:** เปิด Side Panel → เห็น auth overlay, header, 5 tabs, ฟอนต์ไทยแสดงถูกต้อง

### 1.4 css/theme.css
- ✅ CSS variables สำหรับ Dark theme
- ✅ CSS variables สำหรับ Light theme
- ✅ ฟอนต์ Noto Sans Thai เป็น default font-family
- **เทส:** ตรวจสอบ CSS variables ถูก apply, ฟอนต์ไทยแสดงถูกต้องทุกส่วน

### 1.5 sidepanel.css + css/components.css
- ✅ Global styles (body, scrollbar, layout)
- ✅ Auth overlay styles
- ✅ Header styles
- ✅ Tab navigation styles (active/inactive)
- ✅ Component styles: buttons (primary, danger, ghost)
- ✅ Component styles: inputs, textareas, selects
- ✅ Component styles: tables
- ✅ Component styles: cards
- ✅ Component styles: badges, toggles/switches
- ✅ Component styles: modals/dialogs
- ✅ Component styles: toast notifications
- ✅ Component styles: activity log
- **เทส:** ทุก component แสดงผลถูกต้องทั้ง Dark/Light theme

### 1.6 js/app.js
- ✅ Tab routing (คลิก tab → โหลด HTML + init JS)
- ✅ Theme toggle (Dark/Light) + บันทึกลง storage
- ✅ Bootstrap: โหลด settings, check auth, init default tab
- **เทส:** คลิกแต่ละ tab → เนื้อหาเปลี่ยน, สลับ theme → สีเปลี่ยน + reload ยังคง theme เดิม

### 1.7 js/config.js
- ✅ Delay configs (action, afterConfirm, automation steps)
- ✅ Google Flow selectors (fallback strategies)
- ✅ TikTok Studio selectors
- ✅ Camera angles array
- ✅ Model configs (Veo 3.1, Nano Banana Pro)
- ✅ getRandomDelay() function
- **เทส:** เรียก getRandomDelay() → ค่าอยู่ใน range ที่กำหนด

### 1.8 js/storage.js
- ✅ get(key) / set(key, value) / remove(key)
- ✅ getSettings() / saveSettings()
- ✅ getProducts() / saveProducts()
- ✅ getWarehouse() / saveWarehouse()
- ✅ getVideoGenTable() / saveVideoGenTable()
- ✅ getScheduler() / saveScheduler()
- **เทส:** บันทึกข้อมูล → reload → อ่านข้อมูลกลับมาได้ถูกต้อง

### 1.9 js/toast.js
- ✅ showToast(message, type) - success/error/info/warning
- ✅ Auto dismiss หลัง 3 วินาที
- ✅ แสดงหลาย toast ซ้อนกันได้
- **เทส:** เรียก showToast() แต่ละ type → แสดงถูกสี + หายไปเอง

### 1.10 js/logger.js
- ✅ addLog(message, type) - info/success/error/warning
- ✅ แสดง timestamp
- ✅ เก็บ log ใน memory (ไม่เกิน 200 entries)
- ✅ render log ลง DOM (activity log section)
- ✅ clear log
- **เทส:** เพิ่ม log หลายรายการ → แสดงในตารางถูกต้อง + timestamp ถูก

### 1.11 js/auth.js
- ✅ สร้าง Device ID (crypto.randomUUID) + เก็บใน storage
- ✅ แสดง Device ID ใน auth overlay
- ✅ กรอก License Key → ส่ง verify ไป Google Apps Script
- ✅ สำเร็จ: ซ่อน overlay + แสดง expiry badge
- ✅ ล้มเหลว: แสดง error + shake animation
- ✅ Auto-verify เมื่อเปิด extension (ถ้ามี saved key)
- ⬜ Re-verify ทุก 24 ชม.
- ⬜ ปุ่ม Logout
- **เทส:** กรอก key ผิด → error, กรอก key ถูก → ปลดล็อค, reload → ยังล็อกอินอยู่
- **หมายเหตุ:** ต้องสร้าง Google Apps Script backend ก่อน (หรือ mock ไว้ก่อนเทส)

---

## Phase 2: AI Providers

### 2.1 js/ai/ai-provider.js
- ⬜ Abstract class AIProvider
- ⬜ Methods: generateVideoPrompt(), generateImagePrompt(), generateTikTokCaption(), testConnection()
- ⬜ Factory function: createAIProvider(name, apiKey, model)
- **เทส:** เรียก factory → ได้ provider instance ถูก type

### 2.2 js/ai/gemini-provider.js
- ⬜ Implement generateVideoPrompt() - ส่งรูป + text ไป Gemini API
- ⬜ Implement generateImagePrompt()
- ⬜ Implement generateTikTokCaption()
- ⬜ Implement testConnection()
- **เทส:** ใส่ Gemini API key จริง → เรียก testConnection() สำเร็จ → generate prompt ได้

### 2.3 js/ai/claude-provider.js
- ⬜ Implement ทุก methods ผ่าน Anthropic API
- **เทส:** ใส่ Claude API key จริง → generate prompt ได้

### 2.4 js/ai/openai-provider.js
- ⬜ Implement ทุก methods ผ่าน OpenAI API
- **เทส:** ใส่ OpenAI API key จริง → generate prompt ได้

### 2.5 js/ai/openrouter-provider.js
- ⬜ Implement ทุก methods ผ่าน OpenRouter API (OpenAI-compatible)
- ⬜ รองรับ model selection (free models)
- **เทส:** ใส่ OpenRouter API key → เลือก free model → generate prompt ได้ฟรี

---

## Phase 3: Settings Tab

### 3.1 html/tab-settings.html + js/tabs/tab-settings.js
- ⬜ UI: เลือก AI Provider (4 ตัวเลือก)
- ⬜ UI: กรอก API Key แต่ละ provider
- ⬜ UI: เลือก OpenRouter Model (dropdown)
- ⬜ UI: ปุ่ม Save API Keys
- ⬜ UI: ปุ่ม Test Connection
- ⬜ Logic: Save/Load settings จาก chrome.storage
- ⬜ Logic: สลับแสดง input ตาม provider ที่เลือก
- ⬜ Logic: Test connection แสดง success/error toast
- **เทส:** เลือก provider → กรอก key → save → reload → ค่ายังอยู่, กด test → แสดงผลถูกต้อง

---

## Phase 4: Warehouse Tab

### 4.1 html/tab-warehouse.html + js/tabs/tab-warehouse.js
- ⬜ UI: 3 sub-tabs (Products, Characters, Backgrounds)
- ⬜ UI: Products list + Add Product button
- ⬜ UI: Characters list + Add Character button (ชื่อ + upload รูป)
- ⬜ UI: Backgrounds list + Add Background button (ชื่อ + upload รูป)
- ⬜ UI: Export/Import buttons
- ⬜ UI: Activity Log section
- ⬜ Logic: CRUD Products (add, edit, delete)
- ⬜ Logic: CRUD Characters (add, edit, delete + image upload)
- ⬜ Logic: CRUD Backgrounds (add, edit, delete + image upload)
- ⬜ Logic: Export warehouse เป็น JSON file
- ⬜ Logic: Import warehouse จาก JSON file
- ⬜ Logic: Activity Log บันทึกทุก action
- ⬜ Logic: Save/Load จาก chrome.storage
- **เทส:** เพิ่ม product/character/background → แสดงในลิสต์, ลบ → หายไป, export → ได้ JSON, import → ข้อมูลกลับมา, reload → ข้อมูลยังอยู่

---

## Phase 5: TikTok Products Tab

### 5.1 js/automation/tiktok-scraper.js
- ⬜ Function: scrapeTikTokProducts() - inject เข้า TikTok Studio
- ⬜ ดึงข้อมูล: ชื่อสินค้า, ราคา, stock, status, Product ID, รูปสินค้า
- ⬜ Return array of products
- **เทส:** เปิด TikTok Studio → กด import → สินค้าแสดงครบถ้วน (เทียบกับหน้าเว็บ)

### 5.2 html/tab-tiktok-products.html + js/tabs/tab-tiktok-products.js
- ⬜ UI: ปุ่ม "ดึงจาก TikTok"
- ⬜ UI: ตาราง (#/Status, รูปตัวละคร, รูปสินค้า, รายละเอียด, ชื่อ)
- ⬜ UI: ปุ่ม Delete, Same Character
- ⬜ UI: ปุ่ม Export, Import, Download JSON
- ⬜ UI: ปุ่ม Add to Warehouse
- ⬜ Logic: กด "ดึงจาก TikTok" → เรียก tiktok-scraper → แสดงในตาราง
- ⬜ Logic: จับคู่ Character กับสินค้า (เลือกจาก Warehouse)
- ⬜ Logic: Same Character → ใช้ character เดียวกันทุกแถว
- ⬜ Logic: สถานะแต่ละแถว (รอดำเนินการ → กำลังอัพโหลด → เสร็จสิ้น)
- ⬜ Logic: Export/Import/Download JSON
- ⬜ Logic: Add to Warehouse → ส่งสินค้าไปเก็บใน Warehouse
- **เทส:** เปิด TikTok Studio → กด import → สินค้าแสดง, เลือก character, export/import JSON ได้, add to warehouse สำเร็จ

---

## Phase 6: Core Automation Engine

### 6.1 js/automation/dom-helpers.js
- ⬜ heavyClick(el) - จำลองคลิกเหมือนคนจริง
- ⬜ smartFind(selectors) - หา element ด้วย fallback strategies
- ⬜ findButtonByIcon(iconName) - หาปุ่มจาก Google Symbols icon
- ⬜ findButtonByText(text) - หาปุ่มจากข้อความ
- ⬜ sleep(ms) - delay ที่ cancel ได้ (shouldStop flag)
- ⬜ getAntiBotSeed() - สุ่มคำต่อท้าย prompt
- ⬜ toggleWebPageLock(tabId, lock) - ล็อค/ปลดล็อคหน้าเว็บ
- **เทส:** inject heavyClick เข้าหน้าเว็บ → กดปุ่มได้, sleep → รอถูกเวลา + cancel ได้

### 6.2 js/automation/flow-automation.js
- ⬜ uploadImageToFlow(tabId, imageDataUrl) - อัพโหลดรูปเข้า Google Flow
- ⬜ fillPromptInFlow(tabId, promptText) - วาง prompt ลง Slate editor
- ⬜ setFlowSettings(tabId, {model, aspectRatio, outputs}) - ตั้งค่า
- ⬜ clickGenerateButton(tabId) - กดปุ่ม Generate + retry logic
- ⬜ waitForGeneration(tabId, timeoutMs) - รอจนเสร็จ + progress callback
- ⬜ getGeneratedImages(tabId) - ดึงรูปที่สร้างแล้ว
- ⬜ getGeneratedVideos(tabId) - ดึงวิดีโอที่สร้างแล้ว
- ⬜ downloadFromFlow(tabId, quality) - download ผลลัพธ์
- **เทส:** เปิด Google Flow → เรียกแต่ละ function ทีละตัว → ทำงานถูกต้อง

### 6.3 js/automation/tiktok-poster.js
- ⬜ uploadVideoToTikTok(tabId, videoBlob) - อัพโหลดวิดีโอ
- ⬜ fillCaption(tabId, caption) - ใส่ caption
- ⬜ addProductLink(tabId, productName) - ปักตะกร้า ← สำคัญมาก
- ⬜ setAIGeneratedFlag(tabId, enabled) - ติ๊ก AI-generated content
- ⬜ setPostSettings(tabId, {visibility, comments, highQuality})
- ⬜ clickPostButton(tabId) - กด Post
- ⬜ waitForPostComplete(tabId) - รอโพสต์เสร็จ
- **เทส:** เปิด TikTok Studio → เรียกแต่ละ function → กรอกข้อมูลถูก, ปักตะกร้าได้

### 6.4 js/automation/overlay.js
- ⬜ showProgressOverlay(tabId, {step, totalSteps, productName, message})
- ⬜ updateProgressOverlay(tabId, data)
- ⬜ hideProgressOverlay(tabId)
- ⬜ แสดง progress bar + step counter + product name
- ⬜ Block user interaction บนหน้าเว็บ
- **เทส:** inject overlay เข้าหน้าเว็บ → แสดงถูกต้อง, อัพเดท step → UI เปลี่ยน, hide → หายไป

### 6.5 js/utils/prompt-builder.js
- ⬜ buildVideoPrompt(product, character, background, settings) - สร้าง prompt สำหรับวิดีโอ
- ⬜ buildImagePrompt(product, character, background, settings) - สร้าง prompt สำหรับภาพ
- ⬜ getRandomCameraAngle() - สุ่มมุมกล้อง
- ⬜ getAntiBotSeed() - สุ่มคำกัน bot detection
- ⬜ System prompt templates (Thai)
- **เทส:** เรียก buildVideoPrompt() → ได้ prompt ที่สมบูรณ์, สุ่มมุมกล้อง → ได้ค่าต่างกัน

### 6.6 js/utils/image-utils.js
- ⬜ fileToDataUrl(file) - แปลง File เป็น DataURL
- ⬜ dataUrlToBlob(dataUrl) - แปลง DataURL เป็น Blob
- ⬜ resizeImage(dataUrl, maxWidth) - ย่อขนาดรูป
- ⬜ createDataTransfer(files) - สร้าง DataTransfer สำหรับ upload
- **เทส:** อัพโหลดรูป → แปลงเป็น DataURL → แปลงกลับเป็น Blob → ขนาดถูก

### 6.7 js/automation/flow-runner.js
- ⬜ runFullFlow(rows, settings) - orchestrator หลัก
- ⬜ Step 1: Think Prompt (เรียก AI provider)
- ⬜ Step 2: GEN Image (เรียก flow-automation)
- ⬜ Step 3: GEN Video (เรียก flow-automation)
- ⬜ Step 4: Post TikTok (เรียก tiktok-poster + ปักตะกร้า)
- ⬜ Pause/Stop mechanism (shouldStop, isPaused flags)
- ⬜ Skip completed rows
- ⬜ Error recovery (log error + continue next row)
- ⬜ Random delay ระหว่างแถว
- ⬜ Update status แต่ละแถว
- ⬜ Update overlay progress
- **เทส:** เลือก 1 สินค้า → Run Full Flow → ผ่านครบ 4 steps → โพสต์ TikTok สำเร็จ + ปักตะกร้า

### 6.8 js/automation/scheduler.js
- ⬜ startSchedule(intervalMinutes) - เริ่มตั้งเวลา
- ⬜ stopSchedule() - หยุดตั้งเวลา
- ⬜ ใช้ chrome.alarms API สำหรับ recurring
- ⬜ บันทึก state (currentRow, nextRunAt) ลง storage
- ⬜ Resume ได้หลังปิดเปิด browser
- ⬜ แสดง countdown เวลาถัดไป
- ⬜ ตัวเลือก interval: 30 นาที / 1 ชม. / 2 ชม. / กำหนดเอง
- **เทส:** ตั้งเวลาทุก 1 นาที (สำหรับเทส) → ระบบรันคลิปถัดไปอัตโนมัติ, หยุด → หยุดจริง, ปิดเปิด browser → resume ได้

---

## Phase 7: Video Generation and Post Tab

### 7.1 html/tab-video-gen.html + js/tabs/tab-video-gen.js
- ⬜ UI: ปุ่ม "Run Full Flow"
- ⬜ UI: ปุ่ม Pause / Stop
- ⬜ UI: ตั้งค่าพื้นฐาน (สัดส่วน, จำนวนคลิป, จำนวนภาพ, นางแบบ, มุมกล้อง, สุ่มมุม, โมเดล)
- ⬜ UI: 3 โหมด (เต็มระบบ / ภาพอย่าง / คลิปอย่าง)
- ⬜ UI: No Text Mode toggle
- ⬜ UI: Skip AI-generated toggle
- ⬜ UI: Scheduling section (เลือก interval + Start/Stop Schedule)
- ⬜ UI: Countdown timer แสดงเวลาคลิปถัดไป
- ⬜ UI: Product Table (0/500) + Add Row + Select from Warehouse
- ⬜ UI: Run Full Flow dialog (เริ่มจากแถว, หน่วงเวลา, เวลา GEN VDO)
- ⬜ UI: Activity Log section
- ⬜ Logic: โหลดสินค้าจาก Warehouse
- ⬜ Logic: เชื่อม flow-runner.js + scheduler.js
- ⬜ Logic: อัพเดท status แต่ละแถว real-time
- ⬜ Logic: Pause/Stop controls
- ⬜ Logic: บันทึก table state ลง storage
- **เทส:** เลือกสินค้า → ตั้งค่า → Run Full Flow → ทำงานครบ 4 steps → โพสต์สำเร็จ, ตั้ง schedule → ลงทุกชั่วโมง, Pause/Stop ทำงานถูกต้อง

---

## Phase 8: Advanced Video Generation Tab

### 8.1 html/tab-advanced-video.html + js/tabs/tab-advanced-video.js
- ⬜ UI: เหมือน Tab 4 แต่สำหรับวิดีโอ 16 วินาที
- ⬜ UI: Scene Continuation settings
- ⬜ Logic: สร้าง 2 scenes (8+8 วินาที)
- ⬜ Logic: Scene 2 prompt อ้างอิง Scene 1
- ⬜ Logic: เชื่อมกับ flow-runner + scheduler
- **เทส:** เลือกสินค้า → สร้างวิดีโอ 16 วิ (2 scenes) → โพสต์สำเร็จ

---

## Phase 9: Channel Builder Tab (ปั้นช่อง)

### 9.1 html/tab-channel-builder.html + js/tabs/tab-channel-builder.js
- ⬜ UI: Channel Profiles section (สร้าง/จัดการหลายช่อง)
  - ⬜ เพิ่มช่อง (ชื่อช่อง + niche + avatar)
  - ⬜ แก้ไข/ลบช่อง
  - ⬜ สลับช่อง (dropdown)
- ⬜ UI: Niche Templates (เลือกหมวดหมู่)
  - ⬜ 3D Satisfying (ผลไม้ 3D, ASMR)
  - ⬜ Storytelling (เล่าเรื่อง + text overlay)
  - ⬜ Educational (การเงิน, สุขภาพ, crypto)
  - ⬜ Animation (การ์ตูน, สัตว์น่ารัก)
  - ⬜ Custom (กำหนดเอง)
- ⬜ UI: Content Table (ตารางรายการคลิป)
  - ⬜ Columns: #, หัวข้อ/Idea, Style, Prompt, Status
  - ⬜ Add Row / Bulk Generate Ideas (AI สร้างหัวข้อให้)
- ⬜ UI: ตั้งค่า Video (ความยาว 8/16/60+ วิ, สัดส่วน, Model)
- ⬜ UI: Scheduling per channel (interval + start/stop)
- ⬜ UI: Activity Log
- ⬜ Logic: AI Script Generator (hook + script + caption ตาม niche)
- ⬜ Logic: Caption + Hashtags แบบ engagement (ไม่ใช่ขายของ)
- ⬜ Logic: CTA = "Follow for more" (ไม่ใช่ "Buy now")
- ⬜ Logic: Auto Post ไม่มีปักตะกร้า ❌
- ⬜ Logic: ติ๊ก AI-generated content ✅
- ⬜ Logic: บันทึก channel profiles + content ลง storage
- ⬜ Logic: เชื่อม flow-runner + scheduler (ลงเวลาต่างกันแต่ละช่อง)
- **เทส:** สร้างช่อง niche "ผลไม้ 3D" → AI สร้างหัวข้อ 10 คลิป → สร้างคลิป → โพสต์ TikTok (ไม่มีตะกร้า) → ตั้งเวลาลงทุก 1 ชม.

---

## Phase 10: Polish & Testing

### 10.1 Export/Import
- ⬜ js/utils/export-import.js - JSON export/import สำหรับทุก tab
- **เทส:** Export จาก tab 2/3/4 → ได้ JSON, Import กลับ → ข้อมูลครบ

### 10.2 Error Handling
- ⬜ ทุก automation step มี try/catch + log error
- ⬜ Retry logic สำหรับ network errors
- ⬜ Timeout handling สำหรับ generation ที่นานเกินไป
- ⬜ แสดง error message ที่เข้าใจง่าย
- **เทส:** จำลอง error (เช่น ปิด Google Flow กลางทาง) → extension ไม่พัง + แสดง error

### 10.3 Anti-Bot Tuning
- ⬜ ทดสอบ randomized delays ว่ากัน detection ได้
- ⬜ ทดสอบ heavyClick ว่าผ่าน bot check
- ⬜ ทดสอบ prompt randomization
- **เทส:** รัน Full Flow 5 สินค้าติดต่อกัน → ไม่โดนบล็อค

### 10.4 End-to-End Testing
- ⬜ Flow สมบูรณ์: Import สินค้า → Warehouse → Video Gen → Auto Post + ปักตะกร้า
- ⬜ Scheduler: ตั้งเวลา → ลงอัตโนมัติตาม interval
- ⬜ License: ซื้อ key → เปิดใช้งาน → หมดอายุ → ล็อค
- ⬜ Theme: Dark/Light สลับได้ + ทุกหน้าแสดงถูก
- ⬜ ฟอนต์ Noto Sans Thai แสดงถูกต้องทุกส่วน
- **เทส:** ทำตาม flow จริงทั้งหมดตั้งแต่ต้นจนจบ

---

## สรุปความคืบหน้า

| Phase | รายการ | เสร็จ | รวม |
|-------|--------|------|-----|
| 1. Foundation | โครงสร้างพื้นฐาน | 9 | 11 |
| 2. AI Providers | เชื่อมต่อ AI | 5 | 5 |
| 3. Settings | ตั้งค่า | 1 | 1 |
| 4. Warehouse | คลังข้อมูล | 1 | 1 |
| 5. TikTok Products | ดึงสินค้า | 2 | 2 |
| 6. Core Engine | Automation | 8 | 8 |
| 7. Video Gen | สร้าง+โพสต์ | 1 | 1 |
| 8. Advanced | 16 วินาที | 1 | 1 |
| 9. Channel Builder | ปั้นช่อง | 1 | 1 |
| 10. Polish | ทดสอบ | 0 | 4 |
| **รวม** | | **29** | **35** |
