// ===== Vedia Flow - TikTok Auto Poster =====
// โพสต์วิดีโอขึ้น TikTok Studio อัตโนมัติ พร้อมปักตะกร้า

const TikTokPoster = {
  // หา TikTok Studio tab หรือเปิดใหม่
  async getTikTokTab() {
    const tabs = await chrome.tabs.query({ url: '*://*.tiktok.com/*' });
    const studioTab = tabs.find(t => t.url.includes('tiktokstudio'));
    if (studioTab) return studioTab;

    // เปิด tab ใหม่
    const newTab = await chrome.tabs.create({ url: 'https://www.tiktok.com/tiktokstudio/upload' });
    // รอโหลด
    await DOMHelpers.sleep(5000);
    return newTab;
  },

  // อัพโหลดวิดีโอ
  async uploadVideo(tabId, videoDataUrl) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: (dataUrl) => {
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeType = dataUrl.match(/^data:(.*?);/)?.[1] || 'video/mp4';
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
        const file = new File([blob], 'vedia_video.mp4', { type: mimeType });

        const fileInputs = document.querySelectorAll('input[type="file"]');
        let targetInput = null;
        for (const input of fileInputs) {
          if (!input.accept || input.accept.includes('video') || input.accept.includes('*')) {
            targetInput = input;
            break;
          }
        }
        if (!targetInput && fileInputs.length > 0) {
          targetInput = fileInputs[0];
        }

        if (!targetInput) return { success: false, error: 'ไม่พบ file input สำหรับวิดีโอ' };

        const dt = new DataTransfer();
        dt.items.add(file);
        targetInput.files = dt.files;
        targetInput.dispatchEvent(new Event('change', { bubbles: true }));

        return { success: true };
      },
      args: [videoDataUrl],
    });
  },

  // ใส่ Caption
  async fillCaption(tabId, caption) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: (text) => {
        const editors = document.querySelectorAll('[contenteditable="true"]');
        let captionEditor = null;

        for (const editor of editors) {
          const rect = editor.getBoundingClientRect();
          if (rect.width > 100 && rect.height > 30) {
            captionEditor = editor;
            break;
          }
        }

        if (!captionEditor) {
          // Fallback: textarea
          const textarea = document.querySelector('textarea[placeholder*="caption"], textarea[placeholder*="คำอธิบาย"]');
          if (textarea) {
            textarea.value = text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            return { success: true };
          }
          return { success: false, error: 'ไม่พบช่อง caption' };
        }

        captionEditor.focus();
        document.execCommand('selectAll');
        document.execCommand('delete');
        document.execCommand('insertText', false, text);

        return { success: true };
      },
      args: [caption],
    });
  },

  // ปักตะกร้า (Add Product Link) ← สำคัญมาก
  async addProductLink(tabId, productName) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: (name) => {
        // หาปุ่ม "เพิ่มสินค้า" / "Add product links"
        const buttons = document.querySelectorAll('button, [role="button"], a');
        let addBtn = null;

        const keywords = ['เพิ่มสินค้า', 'Add product', 'product link', 'สินค้า', 'Showcase'];
        for (const btn of buttons) {
          const text = btn.textContent;
          if (keywords.some(k => text.includes(k))) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              addBtn = btn;
              break;
            }
          }
        }

        if (!addBtn) return { success: false, error: 'ไม่พบปุ่มเพิ่มสินค้า' };

        // คลิกปุ่ม
        addBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
        addBtn.click();

        // รอ dialog เปิด แล้วพิมพ์ชื่อสินค้า
        setTimeout(() => {
          const searchInput = document.querySelector('input[placeholder*="ค้นหา"], input[placeholder*="search"], input[placeholder*="สินค้า"]');
          if (searchInput) {
            searchInput.value = name;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, 1000);

        return { success: true, note: 'กดปุ่มเพิ่มสินค้าแล้ว รอเลือกสินค้า' };
      },
      args: [productName],
    });
  },

  // ติ๊ก AI-generated content
  async setAIGeneratedFlag(tabId, enabled) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: (shouldEnable) => {
        // หา AI-generated checkbox/toggle
        const labels = document.querySelectorAll('label, span, div');
        for (const label of labels) {
          const text = label.textContent;
          if (text.includes('AI-generated') || text.includes('AI') && text.includes('content')) {
            // หา toggle/checkbox ใกล้ๆ
            const parent = label.closest('div[class]') || label.parentElement;
            const toggle = parent?.querySelector('input[type="checkbox"], [role="switch"], button');
            if (toggle) {
              const isChecked = toggle.checked || toggle.getAttribute('aria-checked') === 'true';
              if (shouldEnable && !isChecked) toggle.click();
              if (!shouldEnable && isChecked) toggle.click();
              return { success: true };
            }
          }
        }
        return { success: false, error: 'ไม่พบ AI-generated toggle' };
      },
      args: [enabled],
    });
  },

  // ตั้งค่าการโพสต์ (visibility, comments, quality)
  async setPostSettings(tabId, settings = {}) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: (opts) => {
        // เปิด High-quality uploads
        const qualityLabels = document.querySelectorAll('label, span');
        for (const label of qualityLabels) {
          if (label.textContent.includes('High-quality') || label.textContent.includes('คุณภาพสูง')) {
            const toggle = label.closest('div')?.querySelector('input[type="checkbox"], [role="switch"]');
            if (toggle && !toggle.checked) toggle.click();
            break;
          }
        }

        return { success: true };
      },
      args: [settings],
    });
  },

  // กดปุ่ม Post
  async clickPost(tabId) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const buttons = document.querySelectorAll('button');
        const keywords = ['โพสต์', 'Post', 'Publish'];

        for (const btn of buttons) {
          const text = btn.textContent.trim();
          if (keywords.some(k => text === k || text.includes(k))) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 50 && rect.height > 20) {
              btn.scrollIntoView({ behavior: 'instant', block: 'center' });
              btn.click();
              return { success: true };
            }
          }
        }

        return { success: false, error: 'ไม่พบปุ่ม Post' };
      },
    });
  },
};
