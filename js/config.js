// ===== Vedia Flow - Configuration =====

const CONFIG = {
  // Delay สุ่มระหว่าง actions (มิลลิวินาที)
  delays: {
    actionMin: 1500,
    actionMax: 3000,
    afterConfirmMin: 4000,
    afterConfirmMax: 7000,
  },

  // Delay สำหรับ automation แต่ละขั้นตอน
  automation: {
    afterGeneratePrompt: { min: 1000, max: 2000 },
    afterFillPrompt: { min: 1500, max: 2500 },
    afterUploadImage: { min: 3000, max: 5000 },
    afterClickCreate: { min: 120000, max: 150000 },  // รอสร้างภาพ 2-2.5 นาที
    videoGenWait: 240000,  // รอสร้างวิดีโอ 4 นาที
    betweenDownloads: { min: 2000, max: 4000 },
    betweenRows: { min: 30000, max: 60000 },  // หน่วงระหว่างสินค้า
  },

  // Delay สำหรับ Banana mode (สร้างภาพเร็วกว่า)
  bananaAutomation: {
    afterClickCreate: { min: 20000, max: 40000 },  // 20-40 วินาที
    betweenDownloads: { min: 1500, max: 3000 },
  },

  // Google Flow selectors (fallback strategies)
  selectors: {
    flow: {
      slateEditor: '[data-slate-editor="true"]',
      textbox: '[role="textbox"][contenteditable="true"]',
      pinholeTextArea: '#PINHOLE_TEXT_AREA_ELEMENT_ID',
      fileInput: 'input[type="file"]',
      menuItem: '[role="menuitem"]',
      tab: '[role="tab"]',
    },
    // TikTok Studio selectors
    tiktok: {
      captionEditor: '[contenteditable="true"]',
      fileInput: 'input[type="file"]',
    }
  },

  // มุมกล้องสำหรับสุ่ม
  cameraAngles: [
    'eye-level straight-on shot',
    'slight low angle looking up',
    'high angle looking down',
    'close-up face level',
    'medium shot waist-up',
    'wide establishing shot',
    'over-the-shoulder view',
    'dutch angle tilted frame',
    'extreme close-up detail shot',
    'bird eye view from above',
  ],

  // โมเดลที่รองรับ
  models: {
    image: ['Nano Banana Pro'],
    video: ['Veo 3.1 - Fast', 'Veo 3.1'],
  },

  // Niche templates สำหรับ Channel Builder
  niches: [
    { id: '3d-satisfying', name: '3D Satisfying', description: 'ผลไม้ 3D, ASMR, satisfying cuts' },
    { id: 'storytelling', name: 'Storytelling', description: 'เล่าเรื่อง + text overlay' },
    { id: 'educational', name: 'Educational', description: 'การเงิน, สุขภาพ, crypto' },
    { id: 'animation', name: 'Animation', description: 'การ์ตูน, สัตว์น่ารัก' },
    { id: 'custom', name: 'Custom', description: 'กำหนดเอง' },
  ],

  // Scheduler defaults
  scheduler: {
    intervals: [
      { value: 30, label: 'ทุก 30 นาที' },
      { value: 60, label: 'ทุก 1 ชั่วโมง' },
      { value: 120, label: 'ทุก 2 ชั่วโมง' },
      { value: 180, label: 'ทุก 3 ชั่วโมง' },
    ],
  },
};

// สุ่ม delay ระหว่าง min-max
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// สุ่ม delay สำหรับ action ทั่วไป
function getActionDelay() {
  return getRandomDelay(CONFIG.delays.actionMin, CONFIG.delays.actionMax);
}

// สุ่ม delay สำหรับ automation step
function getAutomationDelay(step, isBanana = false) {
  const source = isBanana ? CONFIG.bananaAutomation : CONFIG.automation;
  const stepConfig = source[step] || CONFIG.automation[step];
  if (stepConfig && stepConfig.min !== undefined) {
    return getRandomDelay(stepConfig.min, stepConfig.max);
  }
  return 2000;
}
