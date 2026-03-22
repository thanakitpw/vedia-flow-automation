# Vedia Flow Automation - Implementation Plan

## Context
สร้าง Chrome Extension (Manifest V3, Side Panel) สำหรับ:
1. ดึงสินค้าจาก TikTok Shop อัตโนมัติ
2. สร้างภาพ/วิดีโอโฆษณาบน Google Flow ด้วย AI
3. โพสต์ขึ้น TikTok อัตโนมัติ พร้อมปักตะกร้า
4. สร้างคลิปปั้นช่อง TikTok (Channel Building Mode) - ไม่ขายของ
5. ใช้เอง + ขาย (มีระบบ License Key)

อ้างอิงจาก: PROMPT&PLAY AUTO GEN PRO 4.2 (ZIP), Auto-Flow, PD Auto Flow

---

## File Structure

```
vedia-flow-automation/
├── manifest.json                  # Manifest V3 config
├── background.js                  # Service worker (download rename, messages)
├── sidepanel.html                 # Main UI shell (6 tabs)
├── sidepanel.css                  # Global + component styles
│
├── js/
│   ├── app.js                     # Tab routing, theme toggle, bootstrap
│   ├── config.js                  # Delays, selectors, camera angles, models
│   ├── auth.js                    # License key system (Google Apps Script)
│   ├── storage.js                 # chrome.storage.local CRUD wrapper
│   ├── toast.js                   # Toast notifications
│   ├── logger.js                  # Activity log manager
│   │
│   ├── ai/
│   │   ├── ai-provider.js         # Abstract provider + factory
│   │   ├── claude-provider.js     # Anthropic Claude API
│   │   ├── openai-provider.js     # OpenAI API
│   │   ├── gemini-provider.js     # Gemini API
│   │   └── openrouter-provider.js # OpenRouter API (free models)
│   │
│   ├── automation/
│   │   ├── dom-helpers.js         # heavyClick, smartFind, sleep, antiBot
│   │   ├── flow-automation.js     # Google Flow DOM automation
│   │   ├── tiktok-scraper.js      # Scrape products from TikTok Studio
│   │   ├── tiktok-poster.js       # Auto post TikTok + ปักตะกร้า
│   │   ├── overlay.js             # Progress overlay on target pages
│   │   ├── flow-runner.js         # 4-step orchestrator (Run Full Flow)
│   │   └── scheduler.js           # ตั้งเวลาลงคลิป (interval posting)
│   │
│   ├── tabs/
│   │   ├── tab-settings.js        # Tab 1 logic
│   │   ├── tab-tiktok-products.js # Tab 2 logic
│   │   ├── tab-warehouse.js       # Tab 3 logic
│   │   ├── tab-video-gen.js       # Tab 4 logic
│   │   ├── tab-advanced-video.js  # Tab 5 logic
│   │   └── tab-channel-builder.js # Tab 6 logic (ปั้นช่อง)
│   │
│   └── utils/
│       ├── image-utils.js         # DataURL conversion, resize, DataTransfer
│       ├── prompt-builder.js      # Prompt templates, camera angles, anti-bot
│       └── export-import.js       # JSON export/import
│
├── html/
│   ├── tab-settings.html
│   ├── tab-tiktok-products.html
│   ├── tab-warehouse.html
│   ├── tab-video-gen.html
│   ├── tab-advanced-video.html
│   └── tab-channel-builder.html
│
├── css/
│   ├── theme.css                  # CSS variables (dark/light)
│   └── components.css             # Buttons, inputs, tables, cards, badges
│
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
│
└── generate-icons.html            # Dev tool
```

---

## manifest.json

```json
{
  "manifest_version": 3,
  "name": "Vedia Flow Automation",
  "version": "1.0.0",
  "description": "สร้างคลิปโฆษณาอัตโนมัติด้วย AI และโพสต์ TikTok พร้อมปักตะกร้า",
  "permissions": ["sidePanel", "activeTab", "storage", "scripting", "downloads", "tabs", "alarms"],
  "host_permissions": [
    "https://script.google.com/*",
    "https://*.googleusercontent.com/*",
    "https://labs.google/*",
    "https://*.tiktok.com/*",
    "https://api.anthropic.com/*",
    "https://api.openai.com/*",
    "https://generativelanguage.googleapis.com/*",
    "https://openrouter.ai/*"
  ],
  "action": { "default_title": "Open Vedia Flow" },
  "side_panel": { "default_path": "sidepanel.html" },
  "background": { "service_worker": "background.js" }
}
```

- `alarms` permission: สำหรับ scheduler ตั้งเวลาลงคลิป

---

## Data Models (chrome.storage.local)

### Settings
```js
vedia_settings: {
  aiProvider: 'openrouter',  // claude | openai | gemini | openrouter
  apiKeys: { claude: '', openai: '', gemini: '', openrouter: '' },
  openrouterModel: 'google/gemini-2.0-flash-exp:free',
  theme: 'dark',
  licenseKey: '',
  deviceId: ''
}
```

### TikTok Products (Tab 2)
```js
vedia_tiktok_products: [{
  id: 'tiktok_prod_12345',
  name: 'เซรั่มหน้าใส',
  price: 299,
  stock: 150,
  status: 'active',
  workflowStatus: 'waiting',  // waiting | uploading | generating | done
  productImages: ['dataurl...'],
  characterId: null,
  characterImage: null,
  importedAt: '2026-03-22T10:00:00Z'
}]
```

### Warehouse (Tab 3)
```js
vedia_warehouse: {
  products: [{ id, name, highlights, code, images, createdAt }],
  characters: [{ id, name, image, createdAt }],
  backgrounds: [{ id, name, image, createdAt }],
  activityLog: [{ timestamp, action, type }]
}
```

### Video Gen Table (Tab 4)
```js
vedia_video_gen_table: [{
  id: 'vg_001',
  productId: 'wp_001',
  productName: 'เซรั่มหน้าใส',
  highlights: '...',
  code: 'SRM-001',
  flowProjectUrl: '',
  videoStyle: 'default',
  characterId: 'wc_001',
  backgroundId: 'wb_001',
  status: 'pending',  // pending|thinking|gen_image|gen_video|posting|done|error
  generatedPrompt: '',
  generatedImageUrl: '',
  generatedVideoUrl: '',
  tiktokCaption: '',
  tiktokPostUrl: '',
  errorMessage: ''
}]
```

### Scheduler
```js
vedia_scheduler: {
  enabled: false,
  intervalMinutes: 60,    // ทุกกี่นาที (default 60 = 1 ชม.)
  nextRunAt: '2026-03-22T15:00:00Z',
  currentRowIndex: 0,
  totalRows: 10,
  mode: 'full'            // full | image_only | clip_only
}
```

---

## 6 Tabs - รายละเอียด

### Tab 1: Settings
- เลือก AI Provider (Claude/OpenAI/Gemini/OpenRouter)
- กรอก API Key แต่ละตัว
- เลือก OpenRouter Model (dropdown + free badge)
- Dark/Light theme toggle
- Save/Load จาก chrome.storage

### Tab 2: TikTok Products
- ปุ่ม "ดึงจาก TikTok" → inject script เข้า TikTok Studio → DOM scrape สินค้า
- ตาราง: #/Status, รูปตัวละคร, รูปสินค้า, รายละเอียด, ชื่อ
- จับคู่ Character จาก Warehouse
- ปุ่ม: Delete, Same Character, Export, Import, Download JSON, Add to Warehouse

### Tab 3: Warehouse
- 3 sub-tabs: Products, Characters, Backgrounds
- CRUD สำหรับแต่ละประเภท
- Export/Import JSON
- Activity Log

### Tab 4: Video Generation and Post (8 วินาที) - โหมดขายของ
- ตั้งค่าพื้นฐาน: สัดส่วน, จำนวนคลิป, จำนวนภาพ, นางแบบ, มุมกล้อง, สุ่มมุม, โมเดล
- 3 โหมด: เต็มระบบ / ภาพอย่าง / คลิปอย่าง
- No Text Mode, Skip AI-generated toggles
- Product Table (0/500) - Add Row / Select from Warehouse
- **Scheduling**: ตั้งเวลาลงคลิป (ทุก 30 นาที / 1 ชม. / 2 ชม. / กำหนดเอง)
- Run Full Flow → 4 steps + interval ระหว่างสินค้า
- Pause/Stop controls
- Activity Log

### Tab 5: Advanced Video Generation (16 วินาที) - โหมดขายของ
- เหมือน Tab 4 แต่สร้างคลิปยาว 16 วินาที
- สร้าง 2 scenes (8+8 วินาที) + Scene Continuation

### Tab 6: Channel Builder (ปั้นช่อง) - โหมดสร้างคลิปเฉยๆ
**เป้าหมาย:** สร้างคลิปปั้นช่อง TikTok โดยไม่ขายของ เน้น views/followers
**หลักการ:** 1 ช่อง = 1 หมวดหมู่ (niche) ปั้นหลายช่องพร้อมกัน
**รายได้:** Creator Rewards Program ($0.40-$1.00 ต่อ 1,000 views สำหรับคลิป 60+ วินาที)

- **Channel Profiles**: สร้าง/จัดการหลายช่อง แต่ละช่องมี niche + style เฉพาะ
- **Niche Templates**: เลือกหมวดหมู่สำเร็จรูป
  - 3D Satisfying (ผลไม้ 3D, ASMR, satisfying cuts)
  - Storytelling (เล่าเรื่อง + text overlay)
  - Educational (การเงิน, สุขภาพ, crypto)
  - Animation (การ์ตูน, สัตว์น่ารัก)
  - Custom (กำหนดเอง)
- **Content Table**: ตารางรายการคลิปที่จะสร้าง (ไม่ใช่สินค้า)
  - Columns: #, หัวข้อ/Idea, Style, Prompt, Status
- **AI Script Generator**: สร้าง script/prompt ตาม niche ที่เลือก
  - Hook generator (3 วินาทีแรกสำคัญมาก)
  - Caption + Hashtags แบบ engagement (ไม่ใช่ขายของ)
  - CTA: "Follow for more" แทน "Buy now"
- **ตั้งค่า Video**:
  - ความยาว: 8 วิ / 16 วิ / 60+ วิ (แนะนำ 60+ สำหรับ Creator Fund)
  - สัดส่วน: 9:16
  - Model: Veo 3.1
- **Auto Post** (ต่างจาก Tab 4):
  - ไม่มีปักตะกร้า ❌
  - Caption แบบ engagement (ไม่ใช่ขายของ)
  - ติ๊ก AI-generated content ✅
  - Hashtags ตาม niche
- **Scheduling**: ตั้งเวลาลงคลิปแต่ละช่อง
  - แนะนำ 1-3 คลิป/วัน/ช่อง
  - ลงเวลาต่างกันแต่ละช่อง (กัน bot detection)
- **Bulk Content Generation**: สร้างคลิปล่วงหน้าหลายตัวพร้อมกัน

---

## Run Full Flow - 4 ขั้นตอน (flow-runner.js)

```
FOR แต่ละสินค้าใน Product Table:

  Step 1: Think Prompt (AI)
  ├── ส่งข้อมูลสินค้า + รูป → AI Provider
  ├── AI สร้าง Video Prompt + TikTok Caption + Hashtags
  ├── เพิ่ม anti-bot seed (คำสุ่ม)
  └── เพิ่มมุมกล้อง (สุ่มหรือเลือก)

  Step 2: GEN Image (Google Flow)
  ├── อัพโหลดรูปสินค้า + Character (DataTransfer API)
  ├── วาง Prompt (Slate editor injection)
  ├── เลือก Model: Nano Banana Pro, Aspect: 9:16
  ├── กด Generate (heavyClick)
  └── รอ ~20-40 วินาที

  Step 3: GEN Video (Google Flow)
  ├── สลับเป็น Video mode (Veo 3.1)
  ├── ใช้ภาพที่สร้างเป็น reference
  ├── วาง Video Prompt
  ├── กด Generate
  └── รอ ~240 วินาที (4 นาที)

  Step 4: Post TikTok
  ├── เปิด TikTok Studio Upload
  ├── อัพโหลดวิดีโอ
  ├── ใส่ Caption + Hashtags
  ├── ปักตะกร้า (Add product link) ← จำเป็นทุกคลิป
  ├── ติ๊ก AI-generated content ✅
  ├── ตั้ง Everyone, High-quality, Allow comment
  └── กด Post

  → รอตามเวลาที่ตั้ง (เช่น 1 ชม.) ก่อนทำสินค้าถัดไป
  → แถวที่เสร็จแล้วข้ามอัตโนมัติ
```

---

## Scheduler System (scheduler.js)

### Flow การทำงาน:
```
ผู้ใช้เลือกสินค้า 10 ตัว + ตั้งเวลาทุก 1 ชม.
        ↓
กด Start Schedule
        ↓
14:00 → สร้าง + โพสต์สินค้า #1 (4 steps ~5-7 นาที)
        ↓ รอ 1 ชม.
15:00 → สร้าง + โพสต์สินค้า #2
        ↓ รอ 1 ชม.
16:00 → สร้าง + โพสต์สินค้า #3
        ...ไปเรื่อยๆจนครบ 10 ตัว
```

### Implementation:
- ใช้ `chrome.alarms` API ตั้ง recurring alarm
- background.js รับ alarm event → ส่ง message ไปยัง sidepanel
- sidepanel รัน flow-runner สำหรับสินค้าถัดไป
- บันทึก state (currentRowIndex, nextRunAt) ลง chrome.storage
- Resume ได้ถ้าปิดเปิด browser (อ่าน state จาก storage)

### ตัวเลือก Interval:
- ทุก 30 นาที
- ทุก 1 ชั่วโมง
- ทุก 2 ชั่วโมง
- กำหนดเอง (นาที)

---

## DOM Automation Techniques (จาก PROMPT&PLAY)

### heavyClick - จำลองการคลิกเหมือนคนจริง
```js
function heavyClick(el) {
  el.scrollIntoView({behavior: 'instant', block: 'center'});
  el.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}));
  el.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
  el.click();
  el.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));
  el.dispatchEvent(new PointerEvent('pointerup', {bubbles: true}));
}
```

### Image Upload - ผ่าน DataTransfer API
```js
const dataTransfer = new DataTransfer();
const file = new File([blob], name, { type: mimeType });
dataTransfer.items.add(file);
fileInput.files = dataTransfer.files;
fileInput.dispatchEvent(new Event('change', {bubbles: true}));
```

### Text Injection - Slate Editor
```js
const editor = document.querySelector('[data-slate-editor="true"]');
editor.dispatchEvent(new InputEvent('input', {
  inputType: 'insertText', data: promptText, bubbles: true
}));
```

### Anti-Bot Detection
- Randomized delays: 1.5-3s ระหว่าง actions
- Anti-bot seed: คำสุ่มต่อท้าย prompt
- Scroll before click
- heavyClick (multiple event types)
- Random delay ระหว่างสินค้า (30-60s หรือตาม scheduler)

### Google Flow Selectors (Fallback Strategy)
1. Semantic attributes: `[data-slate-editor="true"]`, `[role="textbox"]`
2. Icon text: `<i class="google-symbols">arrow_forward</i>`
3. Text content: `button:contains("Crop and Save")`
4. Role attribute: `[role="menuitem"]`, `[role="tab"]`
5. Position-based: `getBoundingClientRect()` check visibility

---

## TikTok Auto-Posting (tiktok-poster.js)

### Step-by-step:
1. เปิด/หา TikTok Studio tab
2. อัพโหลดวิดีโอ (DataTransfer API → file input)
3. รอ upload เสร็จ
4. ใส่ Caption (contenteditable div injection)
5. **ปักตะกร้า**: คลิก "เพิ่มสินค้า" → search ชื่อสินค้า → เลือก → confirm
6. ติ๊ก "AI-generated content" checkbox
7. ตั้ง Who can watch: Everyone
8. เปิด High-quality uploads
9. เปิด Allow comment + Reuse
10. กด Post

---

## License System (auth.js)

### Client:
- Device ID: `crypto.randomUUID()` → chrome.storage.local
- License Key: กรอก → ส่ง verify กับ Google Apps Script
- สำเร็จ: ซ่อน auth overlay, แสดง expiry badge
- Re-verify ทุก 24 ชม.

### Backend (Google Apps Script + Google Sheets):
- Columns: Key, DeviceId, Plan, ActivatedAt, ExpiresAt
- Key format: `VEDIA-XXXX-XXXX-XXXX`
- Plans: Trial (7 วัน), Monthly, Lifetime

---

## Progress Overlay (overlay.js)

Inject เข้าหน้า Google Flow/TikTok แสดง:
- ชื่อ extension + step ที่กำลังทำ
- Progress bar (step X/Y)
- ชื่อสินค้าที่กำลัง process
- ข้อความสถานะ
- Block user interaction (pointer-events: none)

---

## Theme System (css/theme.css)

```css
[data-theme="dark"] {
  --bg-primary: #0f0f12;
  --bg-secondary: #18181b;
  --text-primary: #ffffff;
  --accent: #6366f1;
  --success: #4ade80;
  --error: #f43f5e;
}
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f4f4f5;
  --text-primary: #18181b;
  --accent: #4f46e5;
}
```

---

## Implementation Phases

### Phase 1: Foundation
- manifest.json, background.js, sidepanel.html
- css/theme.css, sidepanel.css, css/components.css
- js/app.js (tab routing + theme)
- js/config.js, js/storage.js, js/toast.js, js/logger.js
- js/auth.js (license system)

### Phase 2: AI Providers
- js/ai/ai-provider.js (factory)
- js/ai/gemini-provider.js
- js/ai/claude-provider.js
- js/ai/openai-provider.js
- js/ai/openrouter-provider.js

### Phase 3: Settings Tab
- html/tab-settings.html + js/tabs/tab-settings.js

### Phase 4: Warehouse Tab
- html/tab-warehouse.html + js/tabs/tab-warehouse.js

### Phase 5: TikTok Products Tab
- js/automation/tiktok-scraper.js
- html/tab-tiktok-products.html + js/tabs/tab-tiktok-products.js

### Phase 6: Core Automation Engine
- js/automation/dom-helpers.js
- js/automation/flow-automation.js
- js/automation/tiktok-poster.js
- js/automation/overlay.js
- js/utils/prompt-builder.js, image-utils.js
- js/automation/flow-runner.js
- js/automation/scheduler.js

### Phase 7: Video Gen Tab
- html/tab-video-gen.html + js/tabs/tab-video-gen.js

### Phase 8: Advanced Video Tab
- html/tab-advanced-video.html + js/tabs/tab-advanced-video.js

### Phase 9: Channel Builder Tab
- html/tab-channel-builder.html + js/tabs/tab-channel-builder.js
- Channel profile management (หลายช่อง)
- Niche templates
- Content generation flow (ไม่มีปักตะกร้า)
- Scheduling per channel

### Phase 10: Polish
- Export/Import utilities
- Error handling, edge cases
- End-to-end testing

---

## Verification

### ทดสอบ:
1. Load extension ใน Chrome Developer Mode
2. Tab 1: บันทึก API Key → reload → ค่ายังอยู่
3. Tab 2: เปิด TikTok Studio → กด Import → สินค้าแสดงในตาราง
4. Tab 3: เพิ่ม Product/Character/Background → Export/Import JSON ได้
5. Tab 4: เลือกสินค้าจาก Warehouse → Run Full Flow → ภาพ/วิดีโอสร้างบน Google Flow → โพสต์ TikTok สำเร็จ + ปักตะกร้า
6. Tab 4 Scheduler: ตั้งเวลาทุก 1 ชม. → ระบบลงคลิปตามเวลา
7. Tab 5: สร้างวิดีโอ 16 วินาที (2 scenes)
8. Theme: สลับ Dark/Light ได้
9. License: กรอก key ผิด → แสดง error / กรอกถูก → ปลดล็อค
10. Pause/Stop: หยุดระหว่างรันได้โดยไม่พัง
