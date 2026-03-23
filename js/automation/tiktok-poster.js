// ===== Vedia Flow - TikTok Auto Poster =====
// โพสต์วิดีโอขึ้น TikTok Studio อัตโนมัติ พร้อมปักตะกร้า

const TikTokPoster = {
  uploadUrl: 'https://www.tiktok.com/tiktokstudio/upload?from=creator_center',

  // เปิดหน้า upload ของ TikTok Studio (ไปที่ URL upload ทุกครั้ง)
  async getTikTokTab() {
    const tabs = await chrome.tabs.query({ url: '*://*.tiktok.com/*' });
    const studioTab = tabs.find(t => t.url.includes('tiktokstudio'));

    if (studioTab) {
      // มี tab อยู่แล้ว → navigate ไปหน้า upload + focus
      await chrome.tabs.update(studioTab.id, { url: this.uploadUrl, active: true });
      await DOMHelpers.sleep(5000);
      return studioTab;
    }

    // เปิด tab ใหม่
    const newTab = await chrome.tabs.create({ url: this.uploadUrl });
    await DOMHelpers.sleep(5000);
    return newTab;
  },

  // อัพโหลดวิดีโอจาก IndexedDB → TikTok Studio file input
  async uploadVideoFromStorage(tabId) {
    // อ่าน blob จาก IndexedDB
    const record = await BlobStorage.get('current_video');
    if (!record || !record.blob) {
      return [{ result: { success: false, error: 'ไม่พบวิดีโอใน storage - ต้องสร้างวิดีโอก่อน' } }];
    }

    // แปลง blob เป็น ArrayBuffer เพื่อส่งไป content script
    const arrayBuffer = await record.blob.arrayBuffer();
    const uint8Array = Array.from(new Uint8Array(arrayBuffer));
    const mimeType = record.type || 'video/mp4';

    Logger.addLog(`กำลังอัพโหลดวิดีโอ ${(record.size / 1024 / 1024).toFixed(1)}MB ไป TikTok...`, 'info');

    return chrome.scripting.executeScript({
      target: { tabId },
      func: (videoBytes, mimeType) => {
        return new Promise(async (resolve) => {
          try {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));

            // สร้าง File จาก bytes
            const uint8 = new Uint8Array(videoBytes);
            const blob = new Blob([uint8], { type: mimeType });
            const file = new File([blob], 'vedia_video.mp4', { type: mimeType });

            // หา file input
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

            if (!targetInput) {
              // Fallback: หา upload zone แล้ว simulate drop
              const dropZone = document.querySelector('[class*="upload"], [class*="Upload"], [class*="drop"]');
              if (dropZone) {
                const dt = new DataTransfer();
                dt.items.add(file);
                const dropEvent = new DragEvent('drop', {
                  bubbles: true,
                  cancelable: true,
                  dataTransfer: dt,
                });
                dropZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true }));
                dropZone.dispatchEvent(new DragEvent('dragover', { bubbles: true }));
                dropZone.dispatchEvent(dropEvent);
                await sleep(2000);
                return resolve({ success: true, method: 'drop' });
              }
              return resolve({ success: false, error: 'ไม่พบ file input หรือ upload zone' });
            }

            // Set file via DataTransfer
            const dt = new DataTransfer();
            dt.items.add(file);
            targetInput.files = dt.files;

            // Dispatch events เหมือน user จริง
            targetInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            targetInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

            await sleep(2000);
            resolve({ success: true, method: 'fileInput', size: blob.size });
          } catch (err) {
            resolve({ success: false, error: err.message });
          }
        });
      },
      args: [uint8Array, mimeType],
    });
  },

  // Legacy: อัพโหลดวิดีโอจาก dataUrl (ใช้สำหรับไฟล์เล็ก)
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

  // ใส่ Caption (TikTok ใช้ Draft.js - ใช้ clipboard paste เหมือนคนจริง)
  async fillCaption(tabId, caption) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: (text) => {
        return new Promise(async (resolve) => {
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));

          // หา Draft.js editor
          let editor = document.querySelector('.public-DraftEditor-content');
          if (!editor) editor = document.querySelector('[class*="DraftEditor-content"]');
          if (!editor) editor = document.querySelector('[class*="caption-editor"] [contenteditable="true"]');
          if (!editor) {
            const editables = document.querySelectorAll('[contenteditable="true"]');
            for (const el of editables) {
              if (el.getBoundingClientRect().width > 200) { editor = el; break; }
            }
          }

          if (!editor) return resolve({ success: false, error: 'ไม่พบช่อง caption' });

          // คลิกที่ editor เพื่อ focus
          editor.click();
          await sleep(500);
          editor.focus();
          await sleep(300);

          // ลบ caption เดิม: selectAll แล้ว paste ทับ (วิธีที่ทำงานกับ Draft.js)
          document.execCommand('selectAll', false, null);
          await sleep(300);

          // paste ข้อความใหม่ทับข้อความที่เลือก
          try {
            await navigator.clipboard.writeText(text);
            await sleep(200);
            document.execCommand('paste');
            await sleep(500);

            if (editor.textContent.includes(text.substring(0, 10))) {
              return resolve({ success: true, method: 'selectAll+paste' });
            }
          } catch (e) {}

          // Fallback: ลองอีกรอบด้วย ClipboardEvent
          try {
            document.execCommand('selectAll', false, null);
            await sleep(200);
            const dt = new DataTransfer();
            dt.setData('text/plain', text);
            editor.dispatchEvent(new ClipboardEvent('paste', {
              clipboardData: dt, bubbles: true, cancelable: true,
            }));
            await sleep(500);

            if (editor.textContent.includes(text.substring(0, 10))) {
              return resolve({ success: true, method: 'selectAll+pasteEvent' });
            }
          } catch (e) {}

          resolve({ success: false, error: 'ไม่สามารถใส่ caption ได้' });
        });
      },
      args: [caption],
    });
  },

  // ปักตะกร้า (Add Product Link) - 4 ขั้นตอน
  // 1. กด "+ Add" → 2. กด "Next" (Products) → 3. ค้นหา+เลือกสินค้า+กด Next → 4. กด "Add"
  async addProductLink(tabId, productName) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: (name) => {
        return new Promise(async (resolve) => {
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));

          function findButton(texts) {
            // หาจากท้ายสุด (ปุ่ม action มักอยู่ด้านล่าง)
            const buttons = Array.from(document.querySelectorAll('button')).reverse();
            for (const btn of buttons) {
              const txt = btn.textContent.trim();
              if (texts.some(t => txt === t || txt.includes(t)) && btn.offsetParent !== null && !btn.disabled) {
                return btn;
              }
            }
            return null;
          }

          try {
            // ===== Step 1: กดปุ่ม "+ Add" (ใต้ Add link) =====
            const addLinkBtn = findButton(['+ Add', 'Add', 'เพิ่ม']);
            if (!addLinkBtn) return resolve({ success: false, error: 'ไม่พบปุ่ม + Add', step: 1 });

            addLinkBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
            addLinkBtn.click();
            await sleep(2000);

            // ===== Step 2: กด "Next" (Link type: Products) =====
            const nextBtn1 = findButton(['Next', 'ถัดไป']);
            if (!nextBtn1) return resolve({ success: false, error: 'ไม่พบปุ่ม Next (step 2)', step: 2 });

            nextBtn1.click();
            await sleep(3000);

            // ===== Step 3: ค้นหาสินค้า + เลือก + กด Next =====
            // หาช่อง search (TikTok ใช้ TUXTextInputCore-input)
            let searchInput = document.querySelector('.TUXTextInputCore-input');
            if (!searchInput) searchInput = document.querySelector('input[placeholder*="Search products"]');
            if (!searchInput) searchInput = document.querySelector('input[placeholder*="Search"]');
            if (!searchInput) searchInput = document.querySelector('[class*="product-search"] input');
            if (!searchInput) searchInput = document.querySelector('input[type="text"][class*="search"]');

            if (searchInput) {
              searchInput.focus();
              searchInput.click();
              await sleep(300);

              // ใช้ native input value setter (React/TUX ต้องทำแบบนี้)
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              nativeInputValueSetter.call(searchInput, name);
              searchInput.dispatchEvent(new Event('input', { bubbles: true }));
              searchInput.dispatchEvent(new Event('change', { bubbles: true }));

              await sleep(500);

              // กดปุ่ม search (แว่นขยาย)
              const searchIcon = document.querySelector('[class*="product-search-icon"], [class*="search-icon"]');
              if (searchIcon) {
                searchIcon.click();
              } else {
                // Fallback: กด Enter
                searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
                searchInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', keyCode: 13, bubbles: true }));
                searchInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true }));
              }

              await sleep(3000); // รอผลค้นหา
            }

            // กดเลือก radio ของสินค้าตัวแรก (TUXRadioStandalone-input)
            let clicked = false;

            // วิธี 1: หา TUXRadioStandalone-input (TikTok specific)
            const tuxRadios = document.querySelectorAll('.TUXRadioStandalone-input, input[class*="TUXRadio"]');
            for (const radio of tuxRadios) {
              if (radio.offsetParent !== null || radio.closest('tr')) {
                radio.click();
                clicked = true;
                break;
              }
            }

            // วิธี 2: หา radio input ทั่วไป
            if (!clicked) {
              for (const radio of document.querySelectorAll('input[type="radio"]')) {
                if (radio.getBoundingClientRect().width > 0) {
                  radio.click();
                  clicked = true;
                  break;
                }
              }
            }

            // วิธี 3: กด td แรกของ row แรก
            if (!clicked) {
              const rows = document.querySelectorAll('table tbody tr');
              if (rows.length > 0) {
                const firstCell = rows[0].querySelector('td:first-child');
                if (firstCell) { firstCell.click(); clicked = true; }
              }
            }

            if (!clicked) return resolve({ success: false, error: 'เลือกสินค้าไม่สำเร็จ', step: 3 });

            await sleep(2000);

            // กด Next (ปุ่มสีชมพู)
            const nextBtn2 = findButton(['Next', 'ถัดไป']);
            if (!nextBtn2) return resolve({ success: false, error: 'ไม่พบปุ่ม Next (step 3)', step: 3 });
            nextBtn2.click();
            await sleep(3000);

            // ===== Step 4: กด "Add" สุดท้าย (ปุ่มสีชมพู) =====
            const addFinalBtn = findButton(['Add', 'เพิ่ม']);
            if (!addFinalBtn) return resolve({ success: false, error: 'ไม่พบปุ่ม Add (step 4)', step: 4 });
            addFinalBtn.click();
            await sleep(1000);

            resolve({ success: true, productName: name });

          } catch (err) {
            resolve({ success: false, error: err.message });
          }
        });
      },
      args: [productName],
    });
  },

  // ติ๊ก AI-generated content (ต้องกด Show more ก่อน)
  async setAIGeneratedFlag(tabId, enabled) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: (shouldEnable) => {
        return new Promise(async (resolve) => {
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));

          // Step 1: กดปุ่ม "Show more" ก่อน
          const allElements = document.querySelectorAll('button, div[role="button"], span');
          for (const el of allElements) {
            const txt = el.textContent.trim();
            if ((txt.includes('Show more') || txt.includes('แสดงเพิ่มเติม')) && el.offsetParent !== null) {
              el.scrollIntoView({ behavior: 'instant', block: 'center' });
              el.click();
              break;
            }
          }

          await sleep(1500);

          // Step 2: หาข้อความ "AI-generated content" แล้วหา Switch ที่อยู่ใกล้
          let found = false;

          // หา element ที่มีข้อความ AI-generated
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let textNode;
          while (textNode = walker.nextNode()) {
            if (textNode.textContent.includes('AI-generated content')) {
              // เจอข้อความ → หา Switch__root ที่อยู่ใกล้ๆ (ใน parent chain)
              let parent = textNode.parentElement;
              for (let i = 0; i < 8; i++) {
                if (!parent) break;
                // หา input[role="switch"] ก่อน ถ้าไม่เจอค่อยหา Switch__root
                const switchInput = parent.querySelector('input[role="switch"]');
                if (switchInput) {
                  switchInput.click();
                  found = true;
                  break;
                }
                const switchRoot = parent.querySelector('[class*="Switch__root"]');
                if (switchRoot) {
                  switchRoot.querySelector('input[role="switch"]')?.click() || switchRoot.click();
                  found = true;
                  break;
                }
                parent = parent.parentElement;
              }
              if (found) break;
            }
          }

          if (found) return resolve({ success: true });

          // Fallback: หา unchecked switch input ตัวสุดท้าย
          const uncheckedInputs = document.querySelectorAll('input[role="switch"][class*="checked-false"], input[role="switch"]:not(:checked)');
          if (uncheckedInputs.length > 0) {
            const lastInput = uncheckedInputs[uncheckedInputs.length - 1];
            lastInput.click();
            return resolve({ success: true, method: 'lastUncheckedInput' });
          }

          resolve({ success: false, error: 'ไม่พบ AI-generated Switch' });
        });
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

  // กดปุ่ม Post (เลื่อนลงล่างสุดก่อน)
  async clickPost(tabId) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        return new Promise(async (resolve) => {
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));

          // เลื่อนลงล่างสุด
          window.scrollTo(0, document.body.scrollHeight);
          await sleep(1000);

          // หาปุ่ม Post (TikTok ใช้ class post_video_button)
          let postBtn = document.querySelector('[class*="post_video_button"] button');
          if (!postBtn) postBtn = document.querySelector('.post_video_button');

          // Fallback: หาจากข้อความ
          if (!postBtn) {
            const buttons = Array.from(document.querySelectorAll('button'));
            postBtn = buttons.find(btn => {
              const text = btn.textContent.trim();
              return text === 'Post' && btn.offsetParent !== null && !btn.disabled;
            });
          }

          if (!postBtn) return resolve({ success: false, error: 'ไม่พบปุ่ม Post' });

          postBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
          await sleep(500);
          postBtn.click();

          resolve({ success: true });
        });
      },
    });
  },
};
