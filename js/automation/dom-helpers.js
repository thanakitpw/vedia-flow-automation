// ===== Vedia Flow - DOM Automation Helpers =====
// ฟังก์ชันพื้นฐานสำหรับ DOM automation (อ้างอิงจาก PROMPT&PLAY)

const DOMHelpers = {
  // สถานะ stop/pause
  shouldStop: false,
  isPaused: false,

  // จำลองการคลิกเหมือนคนจริง (heavyClick)
  heavyClick(el) {
    if (!el) return false;
    el.scrollIntoView({ behavior: 'instant', block: 'center' });
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.click();
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    return true;
  },

  // หาปุ่มจาก Google Symbols icon text
  findButtonByIcon(iconName) {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const icon = btn.querySelector('i.google-symbols, i');
      if (icon && icon.textContent.trim() === iconName) {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return btn;
      }
    }
    return null;
  },

  // หาปุ่มจากข้อความ
  findButtonByText(text) {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.includes(text)) {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return btn;
      }
    }
    return null;
  },

  // หา element ด้วย fallback strategies
  smartFind(selectors) {
    for (const selector of selectors) {
      try {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) return el;
        }
      } catch {}
    }
    return null;
  },

  // Sleep ที่ cancel ได้ (เช็ค shouldStop ทุก 100ms)
  sleep(ms) {
    return new Promise((resolve, reject) => {
      if (this.shouldStop) return reject(new Error('STOPPED'));

      let elapsed = 0;
      const checkInterval = 100;
      const intervalId = setInterval(() => {
        if (this.shouldStop) {
          clearInterval(intervalId);
          reject(new Error('STOPPED'));
          return;
        }
        if (this.isPaused) return; // รอจนกว่าจะ unpause
        elapsed += checkInterval;
        if (elapsed >= ms) {
          clearInterval(intervalId);
          resolve();
        }
      }, checkInterval);
    });
  },

  // สุ่มคำต่อท้าย prompt (กัน bot detection)
  getAntiBotSeed() {
    const adjs = ['vivid', 'clear', 'sharp', 'detailed', 'crisp', 'vibrant', 'stunning', 'polished', 'refined', 'elegant'];
    const nouns = ['portrait', 'scene', 'frame', 'composition', 'shot', 'view', 'capture', 'image', 'visual', 'render'];
    const adj = adjs[Math.floor(Math.random() * adjs.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `(${adj} ${noun})`;
  },

  // ล็อค/ปลดล็อคหน้าเว็บ (ป้องกัน user กดระหว่าง automation)
  async toggleWebPageLock(tabId, lock) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (shouldLock) => {
        if (shouldLock) {
          document.body.style.pointerEvents = 'none';
          document.documentElement.style.opacity = '0.7';
        } else {
          document.body.style.pointerEvents = 'auto';
          document.documentElement.style.opacity = '1';
        }
      },
      args: [lock],
    });
  },

  // Reset สถานะ
  reset() {
    this.shouldStop = false;
    this.isPaused = false;
  },

  stop() {
    this.shouldStop = true;
  },

  pause() {
    this.isPaused = true;
  },

  resume() {
    this.isPaused = false;
  },
};
