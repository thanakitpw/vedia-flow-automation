// ===== Vedia Flow - Flow Runner (4-Step Orchestrator) =====
// Step 1: Think Prompt → Step 2: GEN Image → Step 3: GEN Video → Step 4: Post TikTok

const FlowRunner = {
  isRunning: false,
  totalSteps: 4,

  // รัน Full Flow สำหรับ rows ทั้งหมด
  async runFullFlow(rows, settings, callbacks = {}) {
    if (this.isRunning) {
      showToast('กำลังรันอยู่แล้ว', 'warning');
      return;
    }

    this.isRunning = true;
    DOMHelpers.reset();

    const { onLog, onStatusUpdate, onComplete } = callbacks;
    const startRow = settings.startRow || 0;
    const mode = settings.mode || 'full';

    const log = (msg, type) => {
      Logger.addLog(msg, type);
    };

    log(`เริ่ม Full Flow: ${rows.length} สินค้า (โหมด: ${mode})`, 'info');

    for (let i = startRow; i < rows.length; i++) {
      if (DOMHelpers.shouldStop) {
        log('หยุดการทำงานแล้ว', 'warning');
        break;
      }

      const row = rows[i];

      if (row.status === 'done') {
        log(`ข้าม #${i + 1} "${row.productName}" (เสร็จแล้ว)`, 'info');
        continue;
      }

      log(`===== สินค้า #${i + 1}: ${row.productName} =====`, 'info');

      // ===== Step 1: Think Prompt =====
      try {
        if (onStatusUpdate) onStatusUpdate(i, 'thinking');
        log(`[Step 1/4] AI กำลังคิด Prompt...`, 'info');

        const aiSettings = await Storage.getSettings();
        const apiKey = aiSettings.apiKeys?.[aiSettings.aiProvider];

        if (!apiKey) {
          throw new Error(`ยังไม่ได้ตั้ง API Key สำหรับ ${aiSettings.aiProvider} - ไปตั้งค่าที่ tab ตั้งค่า`);
        }

        log(`[Step 1/4] ใช้ provider: ${aiSettings.aiProvider}`, 'info');

        const ai = createAIProvider(
          aiSettings.aiProvider,
          apiKey,
          aiSettings.openrouterModel
        );

        const aiOptions = PromptBuilder.buildAIOptions({
          randomCamera: settings.randomCamera,
          cameraAngle: settings.cameraAngle,
          noText: settings.noText,
          characterName: row.characterName,
          backgroundName: row.backgroundName,
          isChannelMode: settings.isChannelMode,
        });

        // ตรวจว่า model รองรับ vision ไหม
        let productImage = row.productImage || null;
        if (productImage && typeof ai.isVisionModel === 'function' && !ai.isVisionModel()) {
          log(`[Step 1/4] Model ไม่รองรับรูปภาพ - ใช้ text-only mode`, 'info');
          productImage = null;
        }

        // สร้าง image prompt
        log(`[Step 1/4] กำลังสร้าง Image Prompt...`, 'info');
        const imagePrompt = await ai.generateImagePrompt(
          row.productName,
          productImage,
          aiOptions
        );
        row.generatedPrompt = PromptBuilder.buildVideoPrompt(imagePrompt, aiOptions);
        log(`[Step 1/4] Image Prompt สำเร็จ: "${imagePrompt.substring(0, 80)}..."`, 'success');

        // สร้าง caption
        log(`[Step 1/4] กำลังสร้าง TikTok Caption...`, 'info');
        row.tiktokCaption = await ai.generateTikTokCaption(
          row.productName,
          row.highlights || '',
          { isChannelMode: settings.isChannelMode }
        );
        log(`[Step 1/4] Caption สำเร็จ: "${row.tiktokCaption.substring(0, 60)}..."`, 'success');

        log(`[Step 1/4] ✅ Prompt + Caption สำเร็จ!`, 'success');

      } catch (err) {
        log(`[Step 1/4] ❌ AI Error: ${err.message}`, 'error');
        row.status = 'error';
        row.errorMessage = `Step 1 Error: ${err.message}`;
        if (onStatusUpdate) onStatusUpdate(i, 'error');
        continue; // ข้ามไปสินค้าถัดไป
      }

      await DOMHelpers.sleep(getAutomationDelay('afterGeneratePrompt'));

      // ===== Step 2: GEN Image =====
      if (mode === 'full' || mode === 'image_only') {
        try {
          if (onStatusUpdate) onStatusUpdate(i, 'gen_image');
          log(`[Step 2/4] กำลังสร้างภาพบน Google Flow...`, 'info');

          const flowCheck = await FlowAutomation.checkFlowPage();
          if (!flowCheck.ok) {
            throw new Error(flowCheck.message);
          }

          const tabId = flowCheck.tab.id;

          await ProgressOverlay.show(tabId, {
            step: 'สร้างภาพ (GEN Image)',
            totalSteps: this.totalSteps,
            currentStep: 2,
            productName: row.productName,
            message: 'ตั้งค่า Image mode + 9:16...',
          });

          // ตั้งค่า Image mode + aspect ratio
          log(`[Step 2/4] ตั้งค่า Image mode + aspect ratio...`, 'info');
          const setupResult = await FlowAutomation.setupSettings(tabId, {
            mode: 'image',
            aspectRatio: settings.aspectRatio || '9:16',
          });
          const setupData = setupResult?.[0]?.result;
          if (setupData?.success) {
            log(`[Step 2/4] ${setupData.msg}`, 'success');
          } else {
            log(`[Step 2/4] ⚠️ ตั้งค่าไม่สำเร็จ: ${setupData?.msg} - ลองต่อ...`, 'warning');
          }
          await DOMHelpers.sleep(1000);

          // Paste รูปสินค้า + ตัวละคร
          const imagesToUpload = [];
          if (row.productImage) {
            const prepared = await ImageUtils.prepareImage(row.productImage, tabId);
            if (prepared) imagesToUpload.push({ dataUrl: prepared, name: 'product.jpg' });
          }
          if (row.characterImage && row.characterImage !== row.productImage) {
            const prepared = await ImageUtils.prepareImage(row.characterImage, tabId);
            if (prepared) imagesToUpload.push({ dataUrl: prepared, name: 'character.jpg' });
          }

          if (imagesToUpload.length > 0) {
            log(`[Step 2/4] Paste ${imagesToUpload.length} รูปเข้า Flow...`, 'info');
            await FlowAutomation.uploadImages(tabId, imagesToUpload);
            await DOMHelpers.sleep(getAutomationDelay('afterUploadImage'));
          }

          // วาง Prompt
          log(`[Step 2/4] วาง Prompt...`, 'info');
          await FlowAutomation.fillPrompt(tabId, row.generatedPrompt);
          await DOMHelpers.sleep(getAutomationDelay('afterFillPrompt'));

          // กด Generate
          await FlowAutomation.clickGenerate(tabId);
          log(`[Step 2/4] กดปุ่ม Generate แล้ว! รอสร้างภาพ...`, 'success');

          // รอสร้างเสร็จ (ตรวจรูปใหม่ + progressbar)
          const imageWait = settings.imageWaitTime || getAutomationDelay('afterClickCreate', true);
          await FlowAutomation.waitForImageGeneration(tabId, imageWait, (msg) => {
            ProgressOverlay.show(tabId, {
              step: 'สร้างภาพ (GEN Image)',
              totalSteps: this.totalSteps,
              currentStep: 2,
              productName: row.productName,
              message: msg,
            });
          });

          await ProgressOverlay.hide(tabId);
          log(`[Step 2/4] ✅ สร้างภาพเสร็จ!`, 'success');

        } catch (err) {
          log(`[Step 2/4] ❌ Error: ${err.message}`, 'error');
          row.status = 'error';
          row.errorMessage = `Step 2 Error: ${err.message}`;
          if (onStatusUpdate) onStatusUpdate(i, 'error');
          continue;
        }
      }

      if (mode === 'image_only') {
        row.status = 'done';
        if (onStatusUpdate) onStatusUpdate(i, 'done');
        log(`#${i + 1} เสร็จ (โหมดภาพอย่าง)`, 'success');
        continue;
      }

      // ===== Step 3: GEN Video =====
      if (mode === 'full' || mode === 'clip_only') {
        try {
          if (onStatusUpdate) onStatusUpdate(i, 'gen_video');
          log(`[Step 3/4] กำลังสร้างวิดีโอบน Google Flow...`, 'info');

          const flowCheck = await FlowAutomation.checkFlowPage();
          if (!flowCheck.ok) {
            throw new Error(flowCheck.message);
          }

          const tabId = flowCheck.tab.id;

          // ตั้งค่า Video mode + aspect ratio
          log(`[Step 3/4] ตั้งค่า Video mode...`, 'info');
          await FlowAutomation.setupSettings(tabId, {
            mode: 'video',
            aspectRatio: settings.aspectRatio || '9:16',
          });
          await DOMHelpers.sleep(1000);

          await ProgressOverlay.show(tabId, {
            step: 'สร้างวิดีโอ (GEN Video)',
            totalSteps: this.totalSteps,
            currentStep: 3,
            productName: row.productName,
            message: 'กำลังสร้างวิดีโอ...',
          });

          // สร้าง video prompt ใหม่
          const aiSettings2 = await Storage.getSettings();
          const ai2 = createAIProvider(
            aiSettings2.aiProvider,
            aiSettings2.apiKeys[aiSettings2.aiProvider],
            aiSettings2.openrouterModel
          );

          const aiOptions2 = PromptBuilder.buildAIOptions({
            randomCamera: settings.randomCamera,
            cameraAngle: settings.cameraAngle,
            noText: settings.noText,
          });

          let videoImage = row.productImage || null;
          if (videoImage && typeof ai2.isVisionModel === 'function' && !ai2.isVisionModel()) {
            videoImage = null;
          }

          const videoPrompt = await ai2.generateVideoPrompt(
            row.productName,
            videoImage,
            aiOptions2
          );

          await FlowAutomation.fillPrompt(tabId, videoPrompt);
          await DOMHelpers.sleep(getAutomationDelay('afterFillPrompt'));
          await FlowAutomation.clickGenerate(tabId);

          const waitSec = Math.floor(CONFIG.automation.videoGenWait / 1000);
          log(`[Step 3/4] กดปุ่ม Generate Video แล้ว! รอ ${waitSec} วินาที...`, 'success');

          // รอวิดีโอสร้างเสร็จ (ตรวจ video ใหม่)
          const videoWait = settings.videoWaitTime || CONFIG.automation.videoGenWait;
          await FlowAutomation.waitForVideoGeneration(tabId, videoWait, (msg) => {
            ProgressOverlay.show(tabId, {
              step: 'สร้างวิดีโอ (GEN Video)',
              totalSteps: this.totalSteps,
              currentStep: 3,
              productName: row.productName,
              message: msg,
            });
          });

          await ProgressOverlay.hide(tabId);
          log(`[Step 3/4] ✅ สร้างวิดีโอเสร็จ!`, 'success');

          // ดึง video blob จาก Flow แล้วเก็บใน IndexedDB
          log(`[Step 3/4] กำลังดึงไฟล์วิดีโอ...`, 'info');
          const fetchResult = await FlowAutomation.fetchAndStoreVideo(tabId);
          if (fetchResult.success) {
            log(`[Step 3/4] ✅ บันทึกวิดีโอ ${(fetchResult.size / 1024 / 1024).toFixed(1)}MB สำเร็จ`, 'success');
          } else {
            log(`[Step 3/4] ⚠️ ดึงวิดีโอไม่สำเร็จ: ${fetchResult.error}`, 'warning');
          }

        } catch (err) {
          log(`[Step 3/4] ❌ Error: ${err.message}`, 'error');
          row.status = 'error';
          row.errorMessage = `Step 3 Error: ${err.message}`;
          if (onStatusUpdate) onStatusUpdate(i, 'error');
          continue;
        }
      }

      // ===== Step 4: Post TikTok =====
      if (mode === 'full') {
        try {
          if (onStatusUpdate) onStatusUpdate(i, 'posting');
          log(`[Step 4/4] กำลังโพสต์ TikTok...`, 'info');

          const tiktokTab = await TikTokPoster.getTikTokTab();
          const ttTabId = tiktokTab.id;

          await ProgressOverlay.show(ttTabId, {
            step: 'โพสต์ TikTok',
            totalSteps: this.totalSteps,
            currentStep: 4,
            productName: row.productName,
            message: 'กำลังอัพโหลดวิดีโอ...',
          });

          // อัพโหลดวิดีโอจาก IndexedDB เข้า TikTok
          log(`[Step 4/4] อัพโหลดวิดีโอไป TikTok...`, 'info');
          const uploadResult = await TikTokPoster.uploadVideoFromStorage(ttTabId);
          const uploadData = uploadResult?.[0]?.result;
          if (uploadData?.success) {
            log(`[Step 4/4] ✅ อัพโหลดวิดีโอสำเร็จ (${uploadData.method})`, 'success');
          } else {
            log(`[Step 4/4] ⚠️ อัพโหลดวิดีโอไม่สำเร็จ: ${uploadData?.error}`, 'warning');
          }
          await DOMHelpers.sleep(5000); // รอ TikTok ประมวลผล

          // ใส่ Caption
          await DOMHelpers.sleep(getActionDelay());
          await TikTokPoster.fillCaption(ttTabId, row.tiktokCaption);
          log(`[Step 4/4] ใส่ Caption แล้ว`, 'info');

          // ปักตะกร้า (ถ้าไม่ใช่ channel mode)
          if (!settings.isChannelMode) {
            await DOMHelpers.sleep(getActionDelay());
            await TikTokPoster.addProductLink(ttTabId, row.productName);
            log(`[Step 4/4] ปักตะกร้าแล้ว: ${row.productName}`, 'info');
          }

          // ติ๊ก AI-generated content
          await DOMHelpers.sleep(getActionDelay());
          await TikTokPoster.setAIGeneratedFlag(ttTabId, true);

          // ตั้งค่าการโพสต์
          await TikTokPoster.setPostSettings(ttTabId);

          // กด Post
          await DOMHelpers.sleep(getActionDelay());
          await TikTokPoster.clickPost(ttTabId);

          await ProgressOverlay.hide(ttTabId);
          log(`[Step 4/4] ✅ โพสต์ TikTok สำเร็จ!`, 'success');

        } catch (err) {
          log(`[Step 4/4] ❌ Error: ${err.message}`, 'error');
          row.status = 'error';
          row.errorMessage = `Step 4 Error: ${err.message}`;
          if (onStatusUpdate) onStatusUpdate(i, 'error');
          continue;
        }
      }

      // สำเร็จทุก step
      row.status = 'done';
      if (onStatusUpdate) onStatusUpdate(i, 'done');
      log(`✅ #${i + 1} "${row.productName}" เสร็จสมบูรณ์!`, 'success');

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
