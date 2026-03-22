// ===== Vedia Flow - Google Flow DOM Automation =====
// อ้างอิง DOM patterns จาก PROMPT&PLAY AUTO GEN PRO 4.2
// ใช้ icon text (google-symbols) + fallback strategies

const FlowAutomation = {

  // ===== หา/เปิด Google Flow tab =====
  async checkFlowPage() {
    const allTabs = await chrome.tabs.query({});
    let flowTab = allTabs.find(t => t.url?.includes('labs.google/fx'));

    if (flowTab) {
      await chrome.tabs.update(flowTab.id, { active: true });
      if (!flowTab.url.includes('/project/')) {
        Logger.addLog('อยู่หน้า Flow homepage - กดสร้างโปรเจ็กต์ใหม่...', 'info');
        await this.createNewProject(flowTab.id);
        await DOMHelpers.sleep(5000);
        const updatedTab = await chrome.tabs.get(flowTab.id);
        return { ok: true, tab: updatedTab };
      }
      return { ok: true, tab: flowTab };
    }

    Logger.addLog('เปิด Google Flow อัตโนมัติ...', 'info');
    const newTab = await chrome.tabs.create({
      url: 'https://labs.google/fx/th/tools/flow',
      active: true,
    });
    await DOMHelpers.sleep(8000);

    Logger.addLog('กดสร้างโปรเจ็กต์ใหม่...', 'info');
    await this.createNewProject(newTab.id);
    await DOMHelpers.sleep(5000);

    const updatedTab = await chrome.tabs.get(newTab.id);
    return { ok: true, tab: updatedTab };
  },

  // ===== กดปุ่ม "โปรเจ็กต์ใหม่" =====
  async createNewProject(tabId) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const allElements = document.querySelectorAll('button, a, div[role="button"]');
        for (const el of allElements) {
          const text = el.textContent.trim();
          if (text.includes('โปรเจ็กต์ใหม่') || text.includes('New project')) {
            el.scrollIntoView({ behavior: 'instant', block: 'center' });
            el.click();
            return { success: true };
          }
        }
        for (const el of allElements) {
          if (el.textContent.trim().startsWith('+') && el.getBoundingClientRect().width > 0) {
            el.click();
            return { success: true };
          }
        }
        return { success: false };
      },
    });
  },

  // ===== Step 1: ตั้งค่า Settings (Image/Video + Aspect Ratio) =====
  // อ้างอิงจาก PROMPT&PLAY: setupInitial / setupVideoMode
  async setupSettings(tabId, options = {}) {
    const mode = options.mode || 'image'; // 'image' หรือ 'video'
    const ratio = options.aspectRatio || '9:16';

    return chrome.scripting.executeScript({
      target: { tabId },
      func: (mode, ratio) => {
        return new Promise(async (resolve) => {
          try {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));

            function heavyClick(el) {
              if (!el) return false;
              el.scrollIntoView({ behavior: 'instant', block: 'center' });
              el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
              el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
              el.click();
              el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
              el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
              return true;
            }

            function findTabByIcon(iconName) {
              const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
              return tabs.find(tab => {
                const icon = tab.querySelector('i.google-symbols');
                return icon && icon.textContent.trim() === iconName;
              });
            }

            // หาปุ่ม Settings = ปุ่มก่อนหน้า arrow_forward
            let settingsBtn = null;
            const allBtns = Array.from(document.querySelectorAll('button'));
            const submitBtn = [...allBtns].reverse().find(b =>
              (b.querySelector('i')?.textContent || '').trim() === 'arrow_forward'
            );

            if (submitBtn && submitBtn.previousElementSibling && submitBtn.previousElementSibling.tagName === 'BUTTON') {
              settingsBtn = submitBtn.previousElementSibling;
            }

            // Fallback: หาปุ่มที่มี aria-haspopup="menu"
            if (!settingsBtn) {
              settingsBtn = allBtns.find(b => {
                const isMenu = b.getAttribute('aria-haspopup') === 'menu';
                const txt = (b.textContent || '').toLowerCase();
                return isMenu && (txt.includes('x1') || txt.includes('x2') || txt.includes('nano') || txt.includes('veo'));
              });
            }

            if (!settingsBtn) return resolve({ success: false, msg: 'หาปุ่ม Settings ไม่เจอ' });

            // เปิด Settings panel
            heavyClick(settingsBtn);

            // หา tab Image หรือ Video
            const targetIcon = mode === 'video' ? 'videocam' : 'image';
            let modeTab = null;
            for (let i = 0; i < 20; i++) {
              await sleep(500);
              modeTab = findTabByIcon(targetIcon);
              if (modeTab) break;
            }

            if (!modeTab) {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
              return resolve({ success: false, msg: `หาแท็บ ${mode} ไม่เจอ` });
            }

            heavyClick(modeTab);
            await sleep(1000);

            // ถ้าเป็น Video mode → กดเลือก "เฟรม" (Frames) sub-tab
            if (mode === 'video') {
              let framesTab = null;
              for (let i = 0; i < 10; i++) {
                await sleep(300);
                // หาจาก icon 'crop_free' (เฟรม)
                framesTab = findTabByIcon('crop_free');
                if (framesTab) break;
              }

              // Fallback: หาจากข้อความ "เฟรม" / "Frames"
              if (!framesTab) {
                const allTabs = document.querySelectorAll('button[role="tab"]');
                for (const tab of allTabs) {
                  const txt = tab.textContent.trim();
                  if (txt.includes('เฟรม') || txt.includes('Frames') || txt.includes('Frame')) {
                    framesTab = tab;
                    break;
                  }
                }
              }

              if (framesTab) {
                heavyClick(framesTab);
                await sleep(1000);
              }
            }

            // เลือก Aspect Ratio
            const ratioIconMap = {
              '9:16': 'crop_9_16',
              '16:9': 'crop_16_9',
              '1:1': 'crop_square',
              '4:3': 'crop_4_3',
              '3:4': 'crop_3_4',
            };
            const ratioIcon = ratioIconMap[ratio] || 'crop_9_16';

            let ratioBtn = null;
            for (let i = 0; i < 20; i++) {
              await sleep(300);
              ratioBtn = findTabByIcon(ratioIcon);
              if (ratioBtn) break;
            }

            if (ratioBtn) {
              heavyClick(ratioBtn);
              await sleep(1000);
            }

            // ปิด Settings panel (กด Escape)
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
            await sleep(800);

            resolve({ success: true, msg: `ตั้งค่า ${mode} + ${ratio} สำเร็จ` });

          } catch (err) {
            resolve({ success: false, msg: 'Error: ' + err.message });
          }
        });
      },
      args: [mode, ratio],
    });
  },

  // ===== Step 2: Paste รูปเข้า editor (จาก PROMPT&PLAY) =====
  async uploadImages(tabId, images) {
    if (!images || images.length === 0) return [{ result: { success: false, error: 'ไม่มีรูป' } }];

    return chrome.scripting.executeScript({
      target: { tabId },
      func: (imageList) => {
        return new Promise(async (resolve) => {
          try {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));

            const editor = document.querySelector('[data-slate-editor="true"]')
              || document.querySelector('[role="textbox"]');
            if (!editor) return resolve({ success: false, error: 'ไม่พบช่อง editor' });

            const inputContainer = editor.closest('div[class*="hvKLod"]')
              || editor.parentElement.parentElement;
            const getThumbCount = () => inputContainer
              ? inputContainer.querySelectorAll('img').length : 0;
            const initialThumbs = getThumbCount();

            editor.scrollIntoView({ behavior: 'instant', block: 'center' });
            editor.focus();
            editor.click();
            await sleep(800);

            // สร้าง DataTransfer ใส่ทุกรูป
            const dataTransfer = new DataTransfer();
            for (const img of imageList) {
              if (!img.dataUrl || !img.dataUrl.startsWith('data:')) continue;
              const byteString = atob(img.dataUrl.split(',')[1]);
              const mimeType = img.dataUrl.match(/^data:(.*?);/)?.[1] || 'image/jpeg';
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
              const file = new File([new Blob([ab], { type: mimeType })], img.name || 'image.jpg', { type: mimeType });
              dataTransfer.items.add(file);
            }

            if (dataTransfer.files.length === 0) {
              return resolve({ success: false, error: 'ไม่มีรูป base64 ที่ใช้ได้' });
            }

            // Paste เข้า editor
            const pasteEvent = new ClipboardEvent('paste', {
              clipboardData: dataTransfer,
              bubbles: true,
              cancelable: true,
              composed: true,
            });
            editor.dispatchEvent(pasteEvent);

            // รอ thumbnail ขึ้น
            for (let i = 0; i < 30; i++) {
              await sleep(500);
              const newThumbs = getThumbCount() - initialThumbs;
              if (newThumbs >= dataTransfer.files.length) {
                return resolve({ success: true, uploaded: newThumbs, total: dataTransfer.files.length });
              }
            }

            const finalThumbs = getThumbCount() - initialThumbs;
            if (finalThumbs > 0) {
              return resolve({ success: true, uploaded: finalThumbs, total: dataTransfer.files.length, partial: true });
            }

            resolve({ success: false, error: 'Paste ไม่สำเร็จ (ไม่เห็น thumbnail)' });
          } catch (err) {
            resolve({ success: false, error: err.message });
          }
        });
      },
      args: [images],
    });
  },

  async uploadImage(tabId, imageDataUrl, fileName = 'image.jpg') {
    return this.uploadImages(tabId, [{ dataUrl: imageDataUrl, name: fileName }]);
  },

  // ===== Step 3: วาง Prompt (จาก PROMPT&PLAY) =====
  async fillPrompt(tabId, promptText) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: (text) => {
        return new Promise(async (resolve) => {
          try {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));

            const editor = document.querySelector('[data-slate-editor="true"]')
              || document.querySelector('[role="textbox"]');
            if (!editor) return resolve({ success: false, error: 'ไม่พบช่อง prompt' });

            // Focus + clear
            editor.blur();
            await sleep(100);
            editor.focus();
            editor.click();
            await sleep(300);

            // Select All + Delete
            editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }));
            document.execCommand('selectAll', false, null);
            await sleep(100);
            editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', keyCode: 8, bubbles: true }));
            document.execCommand('delete', false, null);
            await sleep(300);

            // วิธี 1: Paste text ผ่าน ClipboardEvent
            editor.dispatchEvent(new InputEvent('beforeinput', {
              inputType: 'insertText', data: text, bubbles: true, cancelable: true,
            }));

            const dt = new DataTransfer();
            dt.setData('text/plain', text);
            dt.setData('text/html', `<p>${text}</p>`);
            const pasteEvent = new ClipboardEvent('paste', {
              clipboardData: dt, bubbles: true, cancelable: true, composed: true,
            });
            editor.dispatchEvent(pasteEvent);

            await sleep(500);

            // ตรวจว่า text เข้าไปจริง
            if (!editor.textContent.includes(text.substring(0, 20))) {
              // วิธี 2: insertText
              editor.focus();
              document.execCommand('selectAll', false, null);
              document.execCommand('delete', false, null);
              const inserted = document.execCommand('insertText', false, text);
              await sleep(500);

              if (!inserted || !editor.textContent.includes(text.substring(0, 20))) {
                // วิธี 3: textContent ตรงๆ
                editor.textContent = text;
                editor.dispatchEvent(new InputEvent('input', {
                  inputType: 'insertText', data: text, bubbles: true,
                }));
              }
            }

            await sleep(500);
            const finalText = editor.textContent || '';
            resolve({
              success: finalText.includes(text.substring(0, 20)),
              length: finalText.length,
            });

          } catch (err) {
            resolve({ success: false, error: err.message });
          }
        });
      },
      args: [promptText],
    });
  },

  // ===== Step 4: กดปุ่ม Generate (จาก PROMPT&PLAY) =====
  async clickGenerate(tabId) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        return new Promise((resolve) => {
          function heavyClick(el) {
            if (!el) return;
            el.scrollIntoView({ behavior: 'instant', block: 'center' });
            el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            el.click();
            el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
          }

          // หาปุ่ม arrow_forward (reverse search จากท้ายสุด)
          const allButtons = Array.from(document.querySelectorAll('button')).reverse();
          const blacklist = ['scene', 'ฉาก', 'character', 'นางแบบ', 'reference'];
          let targetBtn = null;

          for (const btn of allButtons) {
            const iconText = (btn.querySelector('i')?.textContent || '').trim();
            const spanText = (btn.querySelector('span')?.textContent || '').trim();
            const fullText = (btn.textContent || '').toLowerCase().trim();

            if (blacklist.some(bad => fullText.includes(bad))) continue;

            if (iconText === 'arrow_forward' && !btn.disabled) {
              targetBtn = btn;
              break;
            }
          }

          // Fallback: หาจากข้อความ "สร้าง" / "Create"
          if (!targetBtn) {
            for (const btn of allButtons) {
              const txt = (btn.textContent || '').trim();
              if ((txt === 'สร้าง' || txt.includes('Create') || txt.includes('Generate')) && !btn.disabled && txt.length < 25) {
                targetBtn = btn;
                break;
              }
            }
          }

          if (targetBtn) {
            heavyClick(targetBtn);
            resolve({ success: true });
          } else {
            resolve({ success: false, error: 'ไม่พบปุ่ม Generate' });
          }
        });
      },
    });
  },

  // ===== Step 5: รอสร้างเสร็จ (ตรวจ video/img ใหม่ + progressbar) =====
  async waitForImageGeneration(tabId, timeoutMs, onProgress) {
    // จับ snapshot รูปก่อนสร้าง
    const oldImgs = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => Array.from(document.querySelectorAll('img')).map(img => img.src),
    });
    const oldSrcs = oldImgs[0]?.result || [];

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (DOMHelpers.shouldStop) throw new Error('STOPPED');

      await DOMHelpers.sleep(2000);

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.floor((timeoutMs - (Date.now() - startTime)) / 1000);
      if (onProgress) onProgress(`รอ ${remaining} วิ... (ผ่านไป ${elapsed} วิ)`);

      // ตรวจว่ามีรูปใหม่ + ไม่มี loading
      const checkState = await chrome.scripting.executeScript({
        target: { tabId },
        func: (oldSrcs) => {
          const currentImgs = Array.from(document.querySelectorAll('img'));
          const hasNewImg = currentImgs.some(img => {
            const rect = img.getBoundingClientRect();
            return !oldSrcs.includes(img.src) && rect.width > 150 && !img.closest('header, nav, [role="textbox"]');
          });
          const hasProgressBar = document.querySelector('[role="progressbar"]') !== null;
          const hasGeneratingBtn = Array.from(document.querySelectorAll('button')).some(b =>
            (b.textContent || '').includes('กำลังสร้าง') || (b.textContent || '').includes('Generating')
          );
          const isWorking = hasProgressBar || hasGeneratingBtn;
          return { hasNew: hasNewImg, working: isWorking };
        },
        args: [oldSrcs],
      });

      const state = checkState[0]?.result;
      if (state?.hasNew && !state?.working) {
        if (onProgress) onProgress('สร้างเสร็จแล้ว! รอระบบประมวลผล...');
        await DOMHelpers.sleep(6000);
        return { success: true };
      }

      if (!state?.working && elapsed > 30) {
        // ไม่มี loading + ไม่มีรูปใหม่ หลังผ่านไป 30 วิ → อาจสำเร็จแล้ว
        return { success: true, note: 'ไม่พบ loading indicator' };
      }
    }

    return { success: false, error: 'หมดเวลารอ' };
  },

  // รอวิดีโอสร้างเสร็จ
  async waitForVideoGeneration(tabId, timeoutMs, onProgress) {
    const oldVids = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => Array.from(document.querySelectorAll('video')).map(v => v.getAttribute('src') || v.currentSrc || v.src || '').filter(Boolean),
    });
    const oldSrcs = oldVids[0]?.result || [];

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (DOMHelpers.shouldStop) throw new Error('STOPPED');

      await DOMHelpers.sleep(2000);

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.floor((timeoutMs - (Date.now() - startTime)) / 1000);
      if (onProgress) onProgress(`รอวิดีโอ ${remaining} วิ... (ผ่านไป ${elapsed} วิ)`);

      const checkState = await chrome.scripting.executeScript({
        target: { tabId },
        func: (oldSrcs) => {
          const currentVids = Array.from(document.querySelectorAll('video'));
          let newCount = 0;
          for (const v of currentVids) {
            const src = v.getAttribute('src') || v.currentSrc || v.src || '';
            if (src && !oldSrcs.includes(src)) newCount++;
          }
          const hasProgressBar = document.querySelector('[role="progressbar"]') !== null;
          const hasLoading = Array.from(document.querySelectorAll('button, span, div')).some(el => {
            const txt = (el.textContent || '').trim();
            return txt.includes('กำลังสร้าง') || txt.includes('Generating') || /^\d+%$/.test(txt);
          });
          return { newVids: newCount, loading: hasProgressBar || hasLoading };
        },
        args: [oldSrcs],
      });

      const state = checkState[0]?.result;
      if (state?.newVids > 0 && !state?.loading) {
        if (onProgress) onProgress('วิดีโอสร้างเสร็จแล้ว!');
        await DOMHelpers.sleep(8000);
        return { success: true, newVideos: state.newVids };
      }
    }

    return { success: false, error: 'หมดเวลารอวิดีโอ' };
  },

  // ===== Step 6: Download วิดีโอ (จาก PROMPT&PLAY) =====
  async downloadVideos(tabId, maxDownloads = 1) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: async (maxDl) => {
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        window.scrollTo(0, 0);
        await sleep(1000);

        const allVideos = Array.from(document.querySelectorAll('video'));
        const validVideos = allVideos.filter(vid => {
          const rect = vid.getBoundingClientRect();
          return rect.width > 150;
        });

        if (validVideos.length === 0) return { success: false, msg: 'ไม่พบวิดีโอ' };

        const toDownload = Math.min(maxDl, validVideos.length);
        let downloadedCount = 0;

        for (let i = 0; i < toDownload; i++) {
          const targetVideo = validVideos[i];
          targetVideo.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await sleep(800);

          let vidSrc = targetVideo.getAttribute('src') || targetVideo.currentSrc || targetVideo.src;
          if (!vidSrc) {
            const sourceTag = targetVideo.querySelector('source');
            if (sourceTag) vidSrc = sourceTag.getAttribute('src') || sourceTag.src;
          }

          if (vidSrc) {
            try {
              const absoluteUrl = new URL(vidSrc, window.location.origin).href;
              const response = await fetch(absoluteUrl);
              if (!response.ok) throw new Error('fetch failed');
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `vedia_video_${Date.now()}_${i}.mp4`;
              a.click();
              URL.revokeObjectURL(url);
              downloadedCount++;
              await sleep(2000);
            } catch (e) {
              // Fallback: ใช้ hover + download button
              const parent = targetVideo.closest('div[class*="sc-"]') || targetVideo.parentElement;
              if (parent) {
                parent.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                parent.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                await sleep(500);
                const dlBtn = Array.from(document.querySelectorAll('button')).find(btn => {
                  const icon = btn.querySelector('i');
                  return icon && icon.textContent.trim() === 'download';
                });
                if (dlBtn) { dlBtn.click(); downloadedCount++; }
              }
            }
          }
        }

        return { success: downloadedCount > 0, downloaded: downloadedCount };
      },
      args: [maxDownloads],
    });
  },

  // ===== ดึงรูปที่สร้างแล้ว =====
  async getGeneratedImages(tabId) {
    return chrome.scripting.executeScript({
      target: { tabId },
      func: async () => {
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        window.scrollTo(0, 0);
        await sleep(1000);

        return Array.from(document.querySelectorAll('img'))
          .filter(img => {
            const rect = img.getBoundingClientRect();
            if (rect.width <= 150 || rect.height <= 150 || !img.complete) return false;
            const isInPrompt = img.closest('[role="textbox"], [data-slate-editor="true"], header, nav');
            if (isInPrompt) return false;
            // ข้ามรูปที่อัพโหลด
            let card = img;
            for (let i = 0; i < 10; i++) {
              if (!card || card === document.body) break;
              const text = (card.innerText || '').toLowerCase();
              if (text.includes('อัปโหลด') || text.includes('uploaded')) return false;
              card = card.parentElement;
            }
            return true;
          })
          .map(img => img.src);
      },
    });
  },
};
