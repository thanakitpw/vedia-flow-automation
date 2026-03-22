// ===== Vedia Flow - Flow Runner (Orchestrator) =====
// ตรงกับปุ่มทดสอบ 1-17 ที่เทสผ่านแล้ว
//
// 📸 สร้างภาพ: 1.เปิดFlow → 2.ตั้งค่าImage → 3.Pasteรูป → 4.วางPrompt → 5.Generate
// 🎬 สร้างวิดีโอ: 6.VideoMode → 7.เพิ่มReference → 8.วางVideoPrompt → 9.Generate → 10.ดึงVideo
// 📤 โพสต์TikTok: 11.AICaption → 12.เปิดTikTok → 13.อัพโหลด → 14.Caption → 15.ตะกร้า → 16.AIgen → 17.Post

const FlowRunner = {
  isRunning: false,

  async runFullFlow(rows, settings, callbacks = {}) {
    if (this.isRunning) {
      showToast('กำลังรันอยู่แล้ว', 'warning');
      return;
    }

    this.isRunning = true;
    DOMHelpers.reset();

    const { onStatusUpdate, onComplete } = callbacks;
    const startRow = settings.startRow || 0;
    const mode = settings.mode || 'full';

    const log = (msg, type) => Logger.addLog(msg, type);

    log(`เริ่ม Full Flow: ${rows.length} สินค้า (โหมด: ${mode})`, 'info');

    for (let i = startRow; i < rows.length; i++) {
      if (DOMHelpers.shouldStop) { log('หยุดการทำงานแล้ว', 'warning'); break; }

      const row = rows[i];
      if (row.status === 'done') { log(`ข้าม #${i + 1} (เสร็จแล้ว)`, 'info'); continue; }

      log(`===== สินค้า #${i + 1}: ${row.productName} =====`, 'info');

      // ========== STEP 1: AI สร้าง Caption ==========
      try {
        if (onStatusUpdate) onStatusUpdate(i, 'thinking');
        log(`[1] AI สร้าง Caption...`, 'info');

        const aiSettings = await Storage.getSettings();
        const apiKey = aiSettings.apiKeys?.[aiSettings.aiProvider];
        if (!apiKey) throw new Error(`ยังไม่ได้ตั้ง API Key - ไปตั้งค่าที่ tab ตั้งค่า`);

        const ai = createAIProvider(aiSettings.aiProvider, apiKey, aiSettings.openrouterModel);

        // สร้าง image prompt จาก template (ไม่เสีย AI credit)
        row.generatedPrompt = PromptBuilder.buildImagePrompt(row.productName, {
          imageStyle: settings.imageStyle || 'product_showcase',
          noText: settings.noText,
        });

        // สร้าง video prompt จาก template (ไม่เสีย AI credit)
        const cameraAngle = settings.randomCamera
          ? PromptBuilder.getRandomCameraAngle()
          : (settings.cameraAngle || 'medium shot');
        row.videoPrompt = PromptBuilder.buildVideoPrompt(row.productName, {
          videoStyle: settings.videoStyle || 'talk_ugc',
          cameraAngle,
          noText: settings.noText,
        });

        // สร้าง caption ด้วย AI (เสีย credit เล็กน้อย)
        row.tiktokCaption = await ai.generateTikTokCaption(
          row.productName,
          row.highlights || '',
          { isChannelMode: settings.isChannelMode }
        );

        log(`[1] ✅ Prompt + Caption สำเร็จ`, 'success');
      } catch (err) {
        log(`[1] ❌ ${err.message}`, 'error');
        row.status = 'error'; row.errorMessage = err.message;
        if (onStatusUpdate) onStatusUpdate(i, 'error');
        continue;
      }

      await DOMHelpers.sleep(1000);

      // ========== STEP 2-5: สร้างภาพ ==========
      if (mode === 'full' || mode === 'image_only') {
        try {
          if (onStatusUpdate) onStatusUpdate(i, 'gen_image');

          // 2. เปิด Flow + ตั้งค่า Image 9:16
          log(`[2] เปิด Flow + ตั้งค่า Image...`, 'info');
          const flowCheck = await FlowAutomation.checkFlowPage();
          if (!flowCheck.ok) throw new Error('เปิด Google Flow ไม่สำเร็จ');
          const tabId = flowCheck.tab.id;

          await ProgressOverlay.show(tabId, { step: 'สร้างภาพ', totalSteps: 4, currentStep: 1, productName: row.productName, message: 'ตั้งค่า Image mode...' });

          await FlowAutomation.setupSettings(tabId, { mode: 'image', aspectRatio: settings.aspectRatio || '9:16' });
          await DOMHelpers.sleep(1500);

          // 3. Paste รูปสินค้า + ตัวละคร
          log(`[3] Paste รูป...`, 'info');
          const images = [];
          if (row.productImage?.startsWith('data:')) images.push({ dataUrl: row.productImage, name: 'product.jpg' });
          else if (row.productImage?.startsWith('http')) {
            const converted = await ImageUtils.urlToDataUrl(tabId, row.productImage);
            if (converted) images.push({ dataUrl: converted, name: 'product.jpg' });
          }
          if (row.characterImage?.startsWith('data:')) images.push({ dataUrl: row.characterImage, name: 'character.jpg' });
          else {
            const warehouse = await Storage.getWarehouse();
            if (warehouse.characters.length > 0 && warehouse.characters[0].image?.startsWith('data:')) {
              images.push({ dataUrl: warehouse.characters[0].image, name: 'character.jpg' });
            }
          }

          if (images.length > 0) {
            await FlowAutomation.uploadImages(tabId, images);
            await DOMHelpers.sleep(getAutomationDelay('afterUploadImage'));
          }

          // 4. วาง Prompt
          log(`[4] วาง Image Prompt...`, 'info');
          await FlowAutomation.fillPrompt(tabId, row.generatedPrompt);
          await DOMHelpers.sleep(getAutomationDelay('afterFillPrompt'));

          // 5. กด Generate
          log(`[5] กด Generate Image...`, 'info');
          await FlowAutomation.clickGenerate(tabId);
          log(`[5] ✅ กด Generate แล้ว! รอสร้างภาพ...`, 'success');

          const imageWait = getAutomationDelay('afterClickCreate', true);
          await FlowAutomation.waitForImageGeneration(tabId, imageWait, (msg) => {
            ProgressOverlay.show(tabId, { step: 'สร้างภาพ', totalSteps: 4, currentStep: 1, productName: row.productName, message: msg });
          });

          await ProgressOverlay.hide(tabId);
          log(`[5] ✅ สร้างภาพเสร็จ!`, 'success');

        } catch (err) {
          log(`[2-5] ❌ ${err.message}`, 'error');
          row.status = 'error'; row.errorMessage = err.message;
          if (onStatusUpdate) onStatusUpdate(i, 'error');
          continue;
        }
      }

      if (mode === 'image_only') {
        row.status = 'done';
        if (onStatusUpdate) onStatusUpdate(i, 'done');
        log(`✅ #${i + 1} เสร็จ (โหมดภาพ)`, 'success');
        continue;
      }

      // ========== STEP 6-10: สร้างวิดีโอ ==========
      if (mode === 'full' || mode === 'clip_only') {
        try {
          if (onStatusUpdate) onStatusUpdate(i, 'gen_video');

          const flowCheck = await FlowAutomation.checkFlowPage();
          if (!flowCheck.ok) throw new Error('เปิด Google Flow ไม่สำเร็จ');
          const tabId = flowCheck.tab.id;

          // 6. สลับ Video mode + ส่วนผสม + 9:16
          log(`[6] สลับ Video mode...`, 'info');
          await FlowAutomation.setupSettings(tabId, { mode: 'video', aspectRatio: settings.aspectRatio || '9:16' });
          await DOMHelpers.sleep(1500);

          await ProgressOverlay.show(tabId, { step: 'สร้างวิดีโอ', totalSteps: 4, currentStep: 2, productName: row.productName, message: 'เพิ่ม reference...' });

          // 7. เพิ่มรูปที่เจนเข้า prompt (hover → ⋮ → เพิ่มไปยังพรอมต์)
          log(`[7] เพิ่ม reference image → prompt...`, 'info');
          const refResult = await FlowAutomation.addImageToPromptFromFeed(tabId, null);
          const refData = refResult?.[0]?.result;
          if (refData?.success) {
            log(`[7] ✅ ${refData.msg}`, 'success');
          } else {
            log(`[7] ⚠️ ${refData?.msg || 'เพิ่ม reference ไม่สำเร็จ'} - ลองต่อ...`, 'warning');
          }
          await DOMHelpers.sleep(2000);

          // 8. วาง Video Prompt (template)
          log(`[8] วาง Video Prompt...`, 'info');
          await FlowAutomation.fillPrompt(tabId, row.videoPrompt);
          await DOMHelpers.sleep(getAutomationDelay('afterFillPrompt'));

          // 9. กด Generate Video
          log(`[9] กด Generate Video...`, 'info');
          await FlowAutomation.clickGenerate(tabId);
          log(`[9] ✅ กด Generate แล้ว! รอสร้างวิดีโอ...`, 'success');

          const videoWait = settings.videoWaitTime || CONFIG.automation.videoGenWait;
          await FlowAutomation.waitForVideoGeneration(tabId, videoWait, (msg) => {
            ProgressOverlay.show(tabId, { step: 'สร้างวิดีโอ', totalSteps: 4, currentStep: 2, productName: row.productName, message: msg });
          });

          await ProgressOverlay.hide(tabId);
          log(`[9] ✅ สร้างวิดีโอเสร็จ!`, 'success');

          // 10. ดึง video blob → เก็บ IndexedDB
          log(`[10] ดึงไฟล์วิดีโอ...`, 'info');
          const fetchResult = await FlowAutomation.fetchAndStoreVideo(tabId);
          if (fetchResult.success) {
            log(`[10] ✅ บันทึกวิดีโอ ${(fetchResult.size / 1024 / 1024).toFixed(1)}MB`, 'success');
          } else {
            log(`[10] ⚠️ ${fetchResult.error}`, 'warning');
          }

        } catch (err) {
          log(`[6-10] ❌ ${err.message}`, 'error');
          row.status = 'error'; row.errorMessage = err.message;
          if (onStatusUpdate) onStatusUpdate(i, 'error');
          continue;
        }
      }

      if (mode === 'clip_only') {
        row.status = 'done';
        if (onStatusUpdate) onStatusUpdate(i, 'done');
        log(`✅ #${i + 1} เสร็จ (โหมดคลิป)`, 'success');
        continue;
      }

      // ========== STEP 11-17: โพสต์ TikTok ==========
      if (mode === 'full') {
        try {
          if (onStatusUpdate) onStatusUpdate(i, 'posting');

          // 12. เปิด TikTok Studio
          log(`[12] เปิด TikTok Studio...`, 'info');
          const tiktokTab = await TikTokPoster.getTikTokTab();
          const ttTabId = tiktokTab.id;
          await DOMHelpers.sleep(3000);

          // 13. อัพโหลดวิดีโอจาก IndexedDB
          log(`[13] อัพโหลดวิดีโอ...`, 'info');
          const uploadResult = await TikTokPoster.uploadVideoFromStorage(ttTabId);
          const uploadData = uploadResult?.[0]?.result;
          if (uploadData?.success) {
            log(`[13] ✅ อัพโหลดสำเร็จ`, 'success');
          } else {
            log(`[13] ⚠️ ${uploadData?.error || 'อัพโหลดไม่สำเร็จ'}`, 'warning');
          }
          await DOMHelpers.sleep(5000);

          // 14. ใส่ Caption
          log(`[14] ใส่ Caption...`, 'info');
          await TikTokPoster.fillCaption(ttTabId, row.tiktokCaption);
          await DOMHelpers.sleep(getActionDelay());

          // 15. ปักตะกร้า (ถ้าไม่ใช่ channel mode)
          if (!settings.isChannelMode) {
            log(`[15] ปักตะกร้า: ${row.productName}...`, 'info');
            const cartResult = await TikTokPoster.addProductLink(ttTabId, row.productName);
            const cartData = cartResult?.[0]?.result;
            log(`[15] ${cartData?.success ? '✅ ปักตะกร้าสำเร็จ' : '⚠️ ' + (cartData?.error || '')}`, cartData?.success ? 'success' : 'warning');
            await DOMHelpers.sleep(2000);
          }

          // 16. ติ๊ก AI-generated
          log(`[16] ติ๊ก AI-generated...`, 'info');
          await TikTokPoster.setAIGeneratedFlag(ttTabId, true);
          await DOMHelpers.sleep(1000);

          // 17. กด Post
          log(`[17] กด Post...`, 'info');
          await TikTokPoster.clickPost(ttTabId);
          log(`[17] ✅ กด Post สำเร็จ! 🚀`, 'success');

          // รอ 3 วิ แล้ว redirect กลับหน้า upload ใหม่ (สำหรับสินค้าถัดไป)
          await DOMHelpers.sleep(3000);
          await chrome.tabs.update(ttTabId, { url: 'https://www.tiktok.com/tiktokstudio/upload?from=creator_center' });
          log(`[17] กลับหน้า upload สำหรับสินค้าถัดไป`, 'info');

        } catch (err) {
          log(`[11-17] ❌ ${err.message}`, 'error');
          row.status = 'error'; row.errorMessage = err.message;
          if (onStatusUpdate) onStatusUpdate(i, 'error');
          continue;
        }
      }

      // สำเร็จทุก step
      row.status = 'done';
      if (onStatusUpdate) onStatusUpdate(i, 'done');
      log(`✅ #${i + 1} "${row.productName}" เสร็จสมบูรณ์! 🎉`, 'success');

      // ลบ video blob จาก IndexedDB (ประหยัดพื้นที่)
      await BlobStorage.remove('current_video');

      // หน่วงเวลาระหว่างสินค้า
      if (i < rows.length - 1 && !DOMHelpers.shouldStop) {
        const delay = getAutomationDelay('betweenRows');
        log(`รอ ${Math.floor(delay / 1000)} วินาทีก่อนสินค้าถัดไป...`, 'info');
        await DOMHelpers.sleep(delay);
      }
    }

    this.isRunning = false;
    if (onComplete) onComplete();
    log('===== จบการทำงาน =====', 'info');
  },

  stop() {
    DOMHelpers.stop();
    this.isRunning = false;
  },

  pause() {
    DOMHelpers.pause();
  },

  resume() {
    DOMHelpers.resume();
  },
};
