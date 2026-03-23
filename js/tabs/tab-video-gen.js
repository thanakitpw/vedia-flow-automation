// ===== Vedia Flow - Video Generation and Post Tab =====

const TabVideoGen = {
  rows: [],
  mode: 'full',

  async init() {
    this.rows = await Storage.getVideoGenTable();
    this.setupEvents();
    this.renderTable();
    this.updateCounts();
    Logger.setContainer('vg-activity-log');

    // ตรวจสอบ schedule ค้าง
    const hasPending = await Scheduler.checkPending();
    if (hasPending) this.showScheduleStatus(true);
  },

  // ===== Events =====
  setupEvents() {
    // Run Full Flow
    document.getElementById('btn-run-full-flow')?.addEventListener('click', () => this.openRunDialog());
    document.getElementById('btn-confirm-run')?.addEventListener('click', () => this.startFullFlow());
    document.getElementById('btn-pause-flow')?.addEventListener('click', () => this.togglePause());
    document.getElementById('btn-stop-flow')?.addEventListener('click', () => this.stopFlow());

    // ปุ่มทดสอบ
    for (let i = 1; i <= 17; i++) {
      document.getElementById(`btn-t${i}`)?.addEventListener('click', () => this.runTestStep(i));
    }
    document.getElementById('btn-t5b')?.addEventListener('click', () => this.testDownloadImage());

    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => {
          b.classList.remove('active');
          b.classList.add('btn-ghost');
        });
        btn.classList.add('active');
        btn.classList.remove('btn-ghost');
        this.mode = btn.dataset.mode;
        document.getElementById('vg-mode').value = this.mode;
      });
    });

    // Table actions
    document.getElementById('btn-vg-add-row')?.addEventListener('click', () => this.addEmptyRow());
    document.getElementById('btn-vg-from-tiktok')?.addEventListener('click', () => this.addFromTikTokProducts());
    document.getElementById('btn-vg-from-warehouse')?.addEventListener('click', () => this.addFromWarehouse());
    document.getElementById('btn-vg-clear-table')?.addEventListener('click', () => this.clearTable());

    // Schedule
    document.getElementById('btn-start-schedule')?.addEventListener('click', () => this.startSchedule());
    document.getElementById('btn-stop-schedule')?.addEventListener('click', () => this.stopSchedule());

    // Modal close
    document.querySelectorAll('.btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      });
    });
  },

  // ===== Render Table =====
  renderTable() {
    const tbody = document.getElementById('vg-table-body');
    const countEl = document.getElementById('vg-table-count');
    if (!tbody) return;

    if (countEl) countEl.textContent = this.rows.length;

    if (this.rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">ยังไม่มีสินค้า - กด Add Row หรือ Select from Warehouse</td></tr>';
      return;
    }

    tbody.innerHTML = this.rows.map((row, i) => `
      <tr data-index="${i}">
        <td><input type="checkbox" class="vg-row-cb" data-index="${i}"></td>
        <td>
          <strong>#${i + 1}</strong><br>
          <span class="badge badge-${this.getStatusBadge(row.status)}" style="font-size:10px;">
            ${this.getStatusText(row.status)}
          </span>
        </td>
        <td>
          <input type="text" class="vg-input-name" data-index="${i}" value="${this.escapeAttr(row.productName)}"
                 placeholder="ชื่อสินค้า" style="font-size:11px; padding:4px 6px;">
        </td>
        <td>
          <input type="text" class="vg-input-highlights" data-index="${i}" value="${this.escapeAttr(row.highlights || '')}"
                 placeholder="จุดเด่น" style="font-size:11px; padding:4px 6px;">
        </td>
        <td style="font-size:10px; color:var(--text-muted); max-width:80px; overflow:hidden; text-overflow:ellipsis;">
          ${row.code || '-'}
        </td>
        <td>
          <span class="badge badge-${this.getStatusBadge(row.status)}" style="font-size:10px;">
            ${this.getStatusText(row.status)}
          </span>
        </td>
      </tr>
    `).join('');

    // Bind input changes
    document.querySelectorAll('.vg-input-name').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.rows[idx].productName = e.target.value;
        this.save();
      });
    });
    document.querySelectorAll('.vg-input-highlights').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.rows[idx].highlights = e.target.value;
        this.save();
      });
    });
  },

  // ===== Add Rows =====
  addEmptyRow() {
    this.rows.push({
      id: 'vg_' + Date.now(),
      productName: '',
      highlights: '',
      code: '',
      status: 'pending',
      generatedPrompt: '',
      tiktokCaption: '',
    });
    this.save();
    this.renderTable();
  },

  // ดึงจาก TikTok Products tab (มีทั้งรูปสินค้า + ตัวละคร)
  async addFromTikTokProducts() {
    const products = await Storage.getProducts();
    if (products.length === 0) {
      showToast('ยังไม่มีสินค้าใน tab สินค้า - ไปดึงจาก TikTok ก่อน', 'warning');
      return;
    }

    let addedCount = 0;
    products.forEach(p => {
      const exists = this.rows.find(r => r.code === p.id || r.productName === p.name);
      if (!exists) {
        this.rows.push({
          id: 'vg_' + Date.now() + '_' + addedCount,
          productId: p.id,
          productName: p.name,
          highlights: '',
          code: p.id,
          productImage: p.productImages?.[0] || null,
          characterId: p.characterId || null,
          characterImage: p.characterImage || null,
          status: 'pending',
          generatedPrompt: '',
          tiktokCaption: '',
        });
        addedCount++;
      }
    });

    this.save();
    this.renderTable();
    Logger.addLog(`เพิ่ม ${addedCount} สินค้าจาก tab สินค้า (พร้อมตัวละคร)`, 'success');
    showToast(`เพิ่ม ${addedCount} สินค้า (พร้อมตัวละคร)`, 'success');
  },

  async addFromWarehouse() {
    const warehouse = await Storage.getWarehouse();
    if (warehouse.products.length === 0) {
      showToast('ยังไม่มีสินค้าใน Warehouse - ไปเพิ่มที่ tab คลัง ก่อน', 'warning');
      return;
    }

    // ดึง character ตัวแรก (ถ้ามี)
    const defaultChar = warehouse.characters.length > 0 ? warehouse.characters[0] : null;

    let addedCount = 0;
    warehouse.products.forEach(wp => {
      const exists = this.rows.find(r => r.code === wp.code || r.productName === wp.name);
      if (!exists) {
        this.rows.push({
          id: 'vg_' + Date.now() + '_' + addedCount,
          productId: wp.id,
          productName: wp.name,
          highlights: wp.highlights || '',
          code: wp.code || '',
          productImage: wp.images?.[0] || null,
          characterId: defaultChar?.id || null,
          characterImage: defaultChar?.image || null,
          characterName: defaultChar?.name || '',
          status: 'pending',
          generatedPrompt: '',
          tiktokCaption: '',
        });
        addedCount++;
      }
    });

    if (defaultChar) {
      Logger.addLog(`ใช้ตัวละคร "${defaultChar.name}" สำหรับทุกสินค้า`, 'info');
    } else {
      Logger.addLog('⚠️ ไม่มีตัวละครใน Warehouse - เพิ่มที่ tab คลัง', 'warning');
    }

    this.save();
    this.renderTable();
    Logger.addLog(`เพิ่ม ${addedCount} สินค้าจาก Warehouse`, 'success');
    showToast(`เพิ่ม ${addedCount} สินค้าจาก Warehouse`, 'success');
  },

  async clearTable() {
    if (this.rows.length === 0) return;
    if (!confirm(`ล้างตาราง ${this.rows.length} รายการ?`)) return;
    this.rows = [];
    this.save();
    this.renderTable();
    showToast('ล้างตารางแล้ว', 'info');
  },

  async updateCounts() {
    const warehouse = await Storage.getWarehouse();
    const products = await Storage.getProducts();
    const whEl = document.getElementById('vg-warehouse-count');
    const tpEl = document.getElementById('vg-tiktok-count');
    if (whEl) whEl.textContent = warehouse.products.length;
    if (tpEl) tpEl.textContent = products.length;
  },

  // ===== Run Full Flow =====
  openRunDialog() {
    if (this.rows.length === 0) {
      showToast('กรุณาเพิ่มสินค้าก่อน', 'warning');
      return;
    }

    // Populate start row dropdown
    const select = document.getElementById('flow-start-row');
    if (select) {
      select.innerHTML = this.rows.map((r, i) => `
        <option value="${i}" ${r.status === 'done' ? 'disabled' : ''}>
          #${i + 1} - ${r.productName || '(ไม่มีชื่อ)'} ${r.status === 'done' ? '(เสร็จแล้ว)' : ''}
        </option>
      `).join('');
    }

    document.getElementById('modal-run-flow')?.classList.remove('hidden');
  },

  async startFullFlow() {
    document.getElementById('modal-run-flow')?.classList.add('hidden');

    const startRow = parseInt(document.getElementById('flow-start-row')?.value || '0');
    const delayMin = parseInt(document.getElementById('flow-delay-min')?.value || '30') * 1000;
    const delayMax = parseInt(document.getElementById('flow-delay-max')?.value || '60') * 1000;
    const videoWait = parseInt(document.getElementById('flow-video-wait')?.value || '240') * 1000;

    // อัพเดท config
    CONFIG.automation.betweenRows = { min: delayMin, max: delayMax };
    CONFIG.automation.videoGenWait = videoWait;

    // แสดง Pause/Stop
    this.showFlowControls(true);

    const settings = {
      startRow,
      mode: this.mode,
      noText: document.getElementById('vg-no-text')?.checked || false,
      randomCamera: document.getElementById('vg-camera-angle')?.value === 'auto',
      cameraAngle: document.getElementById('vg-camera-angle')?.value,
      aspectRatio: document.getElementById('vg-aspect-ratio')?.value || '9:16',
      imageStyle: document.getElementById('vg-image-style')?.value || 'product_showcase',
      videoStyle: document.getElementById('vg-video-style')?.value || 'talk_ugc',
      videoWaitTime: videoWait,
      skipAIFlag: document.getElementById('vg-skip-ai-flag')?.checked || false,
      isChannelMode: false,
    };

    await FlowRunner.runFullFlow(this.rows, settings, {
      onLog: (msg, type) => Logger.addLog(msg, type),
      onStatusUpdate: (index, status) => {
        this.rows[index].status = status;
        this.save();
        this.renderTable();
      },
      onComplete: () => {
        this.showFlowControls(false);
        showToast('Full Flow เสร็จสิ้น!', 'success');
      },
    });
  },

  togglePause() {
    const btn = document.getElementById('btn-pause-flow');
    if (DOMHelpers.isPaused) {
      DOMHelpers.resume();
      if (btn) btn.textContent = '⏸ Pause';
      Logger.addLog('เริ่มต่อ', 'info');
    } else {
      DOMHelpers.pause();
      if (btn) btn.textContent = '▶ Resume';
      Logger.addLog('หยุดชั่วคราว', 'warning');
    }
  },

  stopFlow() {
    FlowRunner.stop();
    this.showFlowControls(false);
    Logger.addLog('หยุดการทำงาน', 'warning');
  },

  showFlowControls(show) {
    const pause = document.getElementById('btn-pause-flow');
    const stop = document.getElementById('btn-stop-flow');
    const run = document.getElementById('btn-run-full-flow');
    if (show) {
      pause?.classList.remove('hidden');
      stop?.classList.remove('hidden');
      run?.classList.add('hidden');
    } else {
      pause?.classList.add('hidden');
      stop?.classList.add('hidden');
      run?.classList.remove('hidden');
    }
  },

  // ===== Schedule =====
  async startSchedule() {
    const interval = parseInt(document.getElementById('vg-schedule-interval')?.value || '0');
    if (interval === 0) {
      showToast('กรุณาเลือกช่วงเวลา', 'warning');
      return;
    }
    if (this.rows.length === 0) {
      showToast('กรุณาเพิ่มสินค้าก่อน', 'warning');
      return;
    }

    await Scheduler.start(interval, this.rows.length);
    this.showScheduleStatus(true);

    // รันตัวแรกทันที
    await Scheduler.onTrigger(this.rows, {
      mode: this.mode,
      noText: document.getElementById('vg-no-text')?.checked || false,
      randomCamera: document.getElementById('vg-camera-angle')?.value === 'auto',
    }, {
      onLog: (msg, type) => Logger.addLog(msg, type),
      onStatusUpdate: (index, status) => {
        this.rows[index].status = status;
        this.save();
        this.renderTable();
      },
    });
  },

  async stopSchedule() {
    await Scheduler.stop();
    this.showScheduleStatus(false);
  },

  showScheduleStatus(show) {
    const el = document.getElementById('scheduler-status');
    if (el) {
      if (show) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
  },

  // ===== Helpers =====
  async save() {
    await Storage.saveVideoGenTable(this.rows);
  },

  getStatusText(status) {
    const map = {
      pending: 'รอดำเนินการ', thinking: 'AI กำลังคิด...', gen_image: 'สร้างภาพ...',
      gen_video: 'สร้างวิดีโอ...', posting: 'โพสต์ TikTok...', done: 'เสร็จสิ้น', error: 'Error',
    };
    return map[status] || status;
  },

  getStatusBadge(status) {
    const map = {
      pending: 'neutral', thinking: 'info', gen_image: 'warning',
      gen_video: 'warning', posting: 'info', done: 'success', error: 'error',
    };
    return map[status] || 'neutral';
  },

  escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  },

  // ===== ปุ่มทดสอบทีละ step =====
  _testCaption: '',

  async runTestStep(step) {
    const row = this.rows.length > 0 ? this.rows[0] : null;
    if (!row && step !== 11) {
      showToast('เพิ่มสินค้าใน Product Table ก่อน', 'warning');
      return;
    }

    try {
      switch (step) {
        case 1: await this._t1_openFlow(); break;
        case 2: await this._t2_setupImage(); break;
        case 3: await this._t3_pasteImages(row); break;
        case 4: await this._t4_fillImagePrompt(row); break;
        case 5: await this._t5_generate(); break;
        case 6: await this._t6_setupVideo(); break;
        case 7: await this._t7_pasteReference(row); break;
        case 8: await this._t8_fillVideoPrompt(row); break;
        case 9: await this._t9_generateVideo(); break;
        case 10: await this._t10_fetchVideo(); break;
        case 11: await this._t11_aiCaption(row); break;
        case 12: await this._t12_openTikTok(); break;
        case 13: await this._t13_uploadVideo(); break;
        case 14: await this._t14_fillCaption(); break;
        case 15: await this._t15_addCart(row); break;
        case 16: await this._t16_aiFlag(); break;
        case 17: await this._t17_post(); break;
      }
    } catch (err) {
      Logger.addLog(`🧪 ❌ Step ${step} Error: ${err.message}`, 'error');
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // --- helpers ---
  async _getFlowTab() {
    const check = await FlowAutomation.checkFlowPage();
    if (!check.ok) throw new Error('เปิด Google Flow ก่อน (กดปุ่ม 1)');
    return check.tab.id;
  },

  async _getTikTokTab() {
    const tabs = await chrome.tabs.query({ url: '*://*.tiktok.com/*' });
    const t = tabs.find(t => t.url.includes('tiktokstudio'));
    if (!t) throw new Error('กดปุ่ม 11 เปิด TikTok Studio ก่อน');
    return t.id;
  },

  // 1. เปิด Flow
  async _t1_openFlow() {
    Logger.addLog('🧪 [1] เปิด Google Flow...', 'info');
    const check = await FlowAutomation.checkFlowPage();
    Logger.addLog(`🧪 ✅ เปิด Flow สำเร็จ!`, 'success');
    showToast('เปิด Flow สำเร็จ!', 'success');
  },

  // 2. ตั้งค่า Image + 9:16
  async _t2_setupImage() {
    Logger.addLog('🧪 [2] ตั้งค่า Image + 9:16...', 'info');
    const tabId = await this._getFlowTab();
    const r = await FlowAutomation.setupSettings(tabId, { mode: 'image', aspectRatio: '9:16' });
    const d = r?.[0]?.result;
    Logger.addLog(`🧪 ${d?.success ? '✅' : '❌'} ${d?.msg || ''}`, d?.success ? 'success' : 'error');
    showToast(d?.msg || '', d?.success ? 'success' : 'error');
  },

  // 3. Paste รูปสินค้า + ตัวละคร
  async _t3_pasteImages(row) {
    Logger.addLog('🧪 [3] Paste รูปสินค้า + ตัวละคร...', 'info');
    const tabId = await this._getFlowTab();
    const images = [];

    // รูปสินค้า
    if (row.productImage?.startsWith('data:')) {
      images.push({ dataUrl: row.productImage, name: 'product.jpg' });
      Logger.addLog('🧪 พบรูปสินค้า (base64)', 'info');
    } else if (row.productImage?.startsWith('http')) {
      Logger.addLog('🧪 แปลงรูปสินค้า URL → base64...', 'info');
      const converted = await ImageUtils.urlToDataUrl(tabId, row.productImage);
      if (converted) images.push({ dataUrl: converted, name: 'product.jpg' });
    }

    // รูปตัวละคร - จาก row ก่อน ถ้าไม่มีหาจาก Warehouse
    let charImage = row.characterImage;
    if (!charImage || !charImage.startsWith('data:')) {
      const warehouse = await Storage.getWarehouse();
      if (warehouse.characters.length > 0 && warehouse.characters[0].image?.startsWith('data:')) {
        charImage = warehouse.characters[0].image;
        Logger.addLog(`🧪 ใช้ตัวละครจาก Warehouse: ${warehouse.characters[0].name}`, 'info');
      }
    }
    if (charImage?.startsWith('data:')) {
      images.push({ dataUrl: charImage, name: 'character.jpg' });
      Logger.addLog('🧪 พบรูปตัวละคร', 'info');
    } else {
      Logger.addLog('🧪 ⚠️ ไม่มีรูปตัวละคร - เพิ่มตัวละครที่ tab คลัง', 'warning');
    }

    if (images.length === 0) {
      showToast('ไม่มีรูป - อัพโหลดรูปสินค้า/ตัวละครใน Warehouse ก่อน', 'warning');
      return;
    }

    Logger.addLog(`🧪 paste ${images.length} รูป...`, 'info');
    const r = await FlowAutomation.uploadImages(tabId, images);
    const d = r?.[0]?.result;
    Logger.addLog(`🧪 ${d?.success ? '✅' : '❌'} ${d?.success ? `Paste ${d.uploaded} รูป` : d?.error}`, d?.success ? 'success' : 'error');
    showToast(d?.success ? `Paste ${d.uploaded} รูปสำเร็จ!` : (d?.error || 'ไม่สำเร็จ'), d?.success ? 'success' : 'error');
  },

  // 4. วาง Image Prompt (template + style)
  async _t4_fillImagePrompt(row) {
    Logger.addLog('🧪 [4] วาง Image Prompt...', 'info');
    const tabId = await this._getFlowTab();
    const imageStyle = document.getElementById('vg-image-style')?.value || 'product_showcase';
    const prompt = PromptBuilder.buildImagePrompt(row.productName, {
      imageStyle,
      noText: document.getElementById('vg-no-text')?.checked,
    });
    Logger.addLog(`🧪 ใช้สไตล์: ${imageStyle}`, 'info');
    Logger.addLog(`🧪 Prompt: "${prompt.substring(0, 80)}..."`, 'info');
    await FlowAutomation.fillPrompt(tabId, prompt);
    Logger.addLog('🧪 ✅ วาง Prompt สำเร็จ!', 'success');
    showToast('วาง Prompt สำเร็จ!', 'success');
  },

  // 5. กด Generate Image
  async _t5_generate() {
    Logger.addLog('🧪 [5] กด Generate Image... ⚡', 'info');
    const tabId = await this._getFlowTab();
    await FlowAutomation.clickGenerate(tabId);
    Logger.addLog('🧪 ✅ กด Generate แล้ว! รอสร้างภาพ...', 'success');
    showToast('กด Generate แล้ว!', 'success');
  },

  // 5.1 ดาวน์โหลดรูปที่เจนจาก Google Flow
  async testDownloadImage() {
    Logger.addLog('🧪 [5.1] ดาวน์โหลดรูปจาก Flow...', 'info');
    try {
      const tabId = await this._getFlowTab();

      // ดึง URL รูปที่เจนจาก Feed
      const genImgs = await FlowAutomation.getGeneratedImages(tabId);
      const genSrcs = genImgs?.[0]?.result || [];

      if (genSrcs.length === 0) {
        showToast('ไม่พบรูปที่เจน - กดปุ่ม 5 ก่อน', 'warning');
        return;
      }

      // ดาวน์โหลดทุกรูปที่เจน
      for (let i = 0; i < genSrcs.length; i++) {
        const url = genSrcs[i];
        const filename = `vedia_image_${Date.now()}_${i + 1}.png`;

        // ใช้ chrome.downloads API
        await chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: false,
        });

        Logger.addLog(`🧪 ✅ ดาวน์โหลดรูป ${i + 1}/${genSrcs.length}: ${filename}`, 'success');
      }

      showToast(`ดาวน์โหลด ${genSrcs.length} รูปสำเร็จ!`, 'success');
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // 6. สลับ Video mode + เฟรม + 9:16
  async _t6_setupVideo() {
    Logger.addLog('🧪 [6] สลับ Video mode + เฟรม + 9:16...', 'info');
    const tabId = await this._getFlowTab();
    const r = await FlowAutomation.setupSettings(tabId, { mode: 'video', aspectRatio: '9:16' });
    const d = r?.[0]?.result;
    Logger.addLog(`🧪 ${d?.success ? '✅' : '❌'} ${d?.msg || ''}`, d?.success ? 'success' : 'error');
    showToast(d?.msg || '', d?.success ? 'success' : 'error');
  },

  // 7. Paste reference (ภาพที่เจน + สินค้า + ตัวละคร)
  // 7. หารูปที่เจนไว้ใน Feed → hover → ⋮ → "เพิ่มไปยังพรอมต์"
  // ไม่ paste รูปใหม่ แต่ใช้รูปที่เจนไว้แล้วบน Google Flow
  async _t7_pasteReference(row) {
    Logger.addLog('🧪 [7] หารูปที่เจนไว้ → ⋮ → เพิ่มไปยังพรอมต์...', 'info');
    const tabId = await this._getFlowTab();

    // ไม่ paste รูปใหม่ แต่ใช้รูปที่มีอยู่แล้วใน Feed (null = ไม่ paste)
    Logger.addLog('🧪 กำลังหารูปที่เจนไว้ใน Feed แล้วเพิ่มไปยังพรอมต์...', 'info');
    const r = await FlowAutomation.addImageToPromptFromFeed(tabId, null);
    const d = r?.[0]?.result;
    Logger.addLog(`🧪 ${d?.success ? '✅' : '❌'} ${d?.msg || ''}`, d?.success ? 'success' : 'error');
    showToast(d?.msg || '', d?.success ? 'success' : 'error');
  },

  // 8. วาง Video Prompt (template + style)
  async _t8_fillVideoPrompt(row) {
    Logger.addLog('🧪 [8] วาง Video Prompt...', 'info');
    const tabId = await this._getFlowTab();
    const cameraAngle = document.getElementById('vg-camera-angle')?.value;
    const videoStyle = document.getElementById('vg-video-style')?.value || 'talk_ugc';
    const prompt = PromptBuilder.buildVideoPrompt(row.productName, {
      videoStyle,
      cameraAngle: cameraAngle === 'auto' ? PromptBuilder.getRandomCameraAngle() : cameraAngle,
      noText: document.getElementById('vg-no-text')?.checked,
    });
    Logger.addLog(`🧪 ใช้สไตล์: ${videoStyle}`, 'info');
    Logger.addLog(`🧪 Prompt: "${prompt.substring(0, 80)}..."`, 'info');
    await FlowAutomation.fillPrompt(tabId, prompt);
    Logger.addLog('🧪 ✅ วาง Video Prompt สำเร็จ!', 'success');
    showToast('วาง Video Prompt สำเร็จ!', 'success');
  },

  // 9. กด Generate Video
  async _t9_generateVideo() {
    Logger.addLog('🧪 [9] กด Generate Video... ⚡', 'info');
    const tabId = await this._getFlowTab();
    await FlowAutomation.clickGenerate(tabId);
    Logger.addLog('🧪 ✅ กด Generate Video แล้ว! รอ ~4 นาที', 'success');
    showToast('กด Generate Video แล้ว!', 'success');
  },

  // 10. ดึงวิดีโอจาก Flow → เก็บ IndexedDB
  async _t10_fetchVideo() {
    Logger.addLog('🧪 [10] ดึงวิดีโอจาก Google Flow...', 'info');
    const tabId = await this._getFlowTab();

    const result = await FlowAutomation.fetchAndStoreVideo(tabId);
    if (result.success) {
      Logger.addLog(`🧪 ✅ บันทึกวิดีโอ ${(result.size / 1024 / 1024).toFixed(1)}MB สำเร็จ!`, 'success');
      showToast(`ดึงวิดีโอ ${(result.size / 1024 / 1024).toFixed(1)}MB สำเร็จ!`, 'success');
    } else {
      Logger.addLog(`🧪 ❌ ${result.error}`, 'error');
      showToast(result.error, 'error');
    }
  },

  // 11. AI สร้าง Caption
  async _t11_aiCaption(row) {
    Logger.addLog('🧪 [11] AI สร้าง Caption...', 'info');
    const settings = await Storage.getSettings();
    const apiKey = settings.apiKeys?.[settings.aiProvider];
    if (!apiKey) { showToast('ตั้ง API Key ก่อน (tab ตั้งค่า)', 'error'); return; }

    const ai = createAIProvider(settings.aiProvider, apiKey, settings.openrouterModel);
    this._testCaption = await ai.generateTikTokCaption(row.productName, row.highlights || '');
    Logger.addLog(`🧪 ✅ Caption: "${this._testCaption.substring(0, 80)}..."`, 'success');
    showToast('สร้าง Caption สำเร็จ!', 'success');
  },

  // 12. เปิด TikTok Studio
  async _t12_openTikTok() {
    Logger.addLog('🧪 [12] เปิด TikTok Studio...', 'info');
    const tab = await TikTokPoster.getTikTokTab();
    Logger.addLog(`🧪 ✅ เปิด TikTok Studio สำเร็จ!`, 'success');
    showToast('เปิด TikTok Studio สำเร็จ!', 'success');
  },

  // 13. อัพโหลดวิดีโอจาก IndexedDB → TikTok
  async _t13_uploadVideo() {
    Logger.addLog('🧪 [13] อัพโหลดวิดีโอไป TikTok...', 'info');
    const tabId = await this._getTikTokTab();

    const result = await TikTokPoster.uploadVideoFromStorage(tabId);
    const data = result?.[0]?.result;
    if (data?.success) {
      Logger.addLog(`🧪 ✅ อัพโหลดสำเร็จ! (${data.method})`, 'success');
      showToast(`อัพโหลดวิดีโอสำเร็จ! (${data.method})`, 'success');
    } else {
      Logger.addLog(`🧪 ❌ ${data?.error || 'อัพโหลดไม่สำเร็จ'}`, 'error');
      showToast(data?.error || 'อัพโหลดไม่สำเร็จ', 'error');
    }
  },

  // 14. ใส่ Caption
  async _t14_fillCaption() {
    Logger.addLog('🧪 [14] ใส่ Caption...', 'info');
    const tabId = await this._getTikTokTab();
    const caption = this._testCaption || '🔥 ใครยังไม่ได้ลองตัวนี้ พลาดมากค่ะ!\n✨ ใช้มาหลายตัว ตัวนี้ดีที่สุดเลย คุณภาพดี ราคาคุ้มมากๆ\n💯 รีวิวจากคนใช้จริง ไม่ได้มาพูดเล่นๆ นะ\n🛒 กดตะกร้าสีเหลืองเลยค่ะ ของมีจำนวนจำกัด!\n#tiktokshop #ของดีบอกต่อ #สินค้าขายดี #รีวิวจริง #ของมันต้องมี';
    await TikTokPoster.fillCaption(tabId, caption);
    Logger.addLog(`🧪 ✅ ใส่ Caption สำเร็จ!`, 'success');
    showToast('ใส่ Caption สำเร็จ!', 'success');
  },

  // 15. ปักตะกร้า
  async _t15_addCart(row) {
    Logger.addLog('🧪 [15] ปักตะกร้า...', 'info');
    const tabId = await this._getTikTokTab();
    const name = row?.productName || 'สินค้าทดสอบ';
    await TikTokPoster.addProductLink(tabId, name);
    Logger.addLog(`🧪 ✅ กดปุ่มปักตะกร้า: "${name}"`, 'success');
    showToast('กดปุ่มปักตะกร้าแล้ว!', 'success');
  },

  // 17. กด Post
  async _t17_post() {
    Logger.addLog('🧪 [17] กด Post...', 'info');
    const tabId = await this._getTikTokTab();
    const result = await TikTokPoster.clickPost(tabId);
    const data = result?.[0]?.result;
    if (data?.success) {
      Logger.addLog('🧪 ✅ กด Post สำเร็จ! 🚀', 'success');
      showToast('กด Post สำเร็จ!', 'success');
    } else {
      Logger.addLog(`🧪 ❌ ${data?.error || 'กด Post ไม่สำเร็จ'}`, 'error');
      showToast(data?.error || 'กด Post ไม่สำเร็จ', 'error');
    }
  },

  // 16. ติ๊ก AI-generated
  async _t16_aiFlag() {
    Logger.addLog('🧪 [16] ติ๊ก AI-generated...', 'info');
    const tabId = await this._getTikTokTab();
    await TikTokPoster.setAIGeneratedFlag(tabId, true);
    Logger.addLog('🧪 ✅ ติ๊ก AI-generated สำเร็จ!', 'success');
    showToast('ติ๊ก AI-generated สำเร็จ!', 'success');
  },

  // ===== Legacy test functions (ลบได้ทีหลัง) =====
  async testAIPrompt() {
    Logger.addLog('🧪 [Step 1] AI กำลังสร้าง Prompt...', 'info');

    if (this.rows.length === 0) {
      showToast('กรุณาเพิ่มสินค้าใน Product Table ก่อน (กด Add Row หรือ Select from Warehouse)', 'warning');
      return;
    }

    const row = this.rows[0];
    Logger.addLog(`🧪 ใช้สินค้า: ${row.productName}`, 'info');

    try {
      const settings = await Storage.getSettings();
      const apiKey = settings.apiKeys?.[settings.aiProvider];
      if (!apiKey) {
        showToast(`ยังไม่ได้ตั้ง API Key สำหรับ ${settings.aiProvider} - ไปตั้งที่ tab ตั้งค่า`, 'error');
        return;
      }

      const ai = createAIProvider(settings.aiProvider, apiKey, settings.openrouterModel);

      // ตรวจว่า model รองรับ vision ไหม
      let productImage = row.productImage || null;
      if (productImage && typeof ai.isVisionModel === 'function' && !ai.isVisionModel()) {
        Logger.addLog(`🧪 Model ไม่รองรับรูป - ใช้ text-only`, 'info');
        productImage = null;
      }
      if (productImage && !productImage.startsWith('data:')) {
        Logger.addLog(`🧪 รูปเป็น URL - ข้ามรูป (ใช้ text-only)`, 'info');
        productImage = null;
      }

      const aiOptions = PromptBuilder.buildAIOptions({
        randomCamera: document.getElementById('vg-camera-angle')?.value === 'auto',
        cameraAngle: document.getElementById('vg-camera-angle')?.value,
        noText: document.getElementById('vg-no-text')?.checked,
      });

      // สร้าง Image Prompt (ใช้ template ไม่เสีย credit)
      Logger.addLog(`🧪 สร้าง Image Prompt จาก template...`, 'info');
      this._testPrompt = PromptBuilder.buildImagePrompt(row.productName, {
        noText: document.getElementById('vg-no-text')?.checked,
      });
      Logger.addLog(`🧪 ✅ Image Prompt: "${this._testPrompt.substring(0, 100)}..."`, 'success');

      // สร้าง Caption ด้วย AI (เสีย credit เล็กน้อย)
      Logger.addLog(`🧪 AI กำลังสร้าง Caption... (provider: ${settings.aiProvider})`, 'info');
      this._testCaption = await ai.generateTikTokCaption(row.productName, row.highlights || '');
      Logger.addLog(`🧪 ✅ Caption: "${this._testCaption.substring(0, 80)}..."`, 'success');

      showToast('Prompt + Caption สำเร็จ! กดปุ่มถัดไปได้', 'success');

    } catch (err) {
      Logger.addLog(`🧪 ❌ AI Error: ${err.message}`, 'error');
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // ทดสอบ 2: เปิด Google Flow + สร้างโปรเจ็กต์ใหม่
  async testOpenFlow() {
    Logger.addLog('🧪 ทดสอบ: เปิด Google Flow...', 'info');
    try {
      const result = await FlowAutomation.checkFlowPage();
      if (result.ok) {
        Logger.addLog(`🧪 ✅ เปิด Flow สำเร็จ! Tab ID: ${result.tab.id}, URL: ${result.tab.url}`, 'success');
        showToast('เปิด Google Flow สำเร็จ!', 'success');
      } else {
        Logger.addLog(`🧪 ❌ ${result.message}`, 'error');
        showToast(result.message, 'error');
      }
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // ทดสอบ 2: Paste รูปสินค้า + ตัวละคร เข้า editor
  async testUploadImage() {
    Logger.addLog('🧪 ทดสอบ: Paste รูปสินค้า + ตัวละคร...', 'info');
    try {
      const flowCheck = await FlowAutomation.checkFlowPage();
      if (!flowCheck.ok) {
        showToast('กดปุ่ม 1 ก่อน (เปิด Flow)', 'warning');
        return;
      }

      // รวมรูปจาก product table (row แรก) หรือ warehouse
      const images = [];

      // หารูปจาก video gen table (row แรกที่มีรูป)
      if (this.rows.length > 0) {
        const row = this.rows[0];
        if (row.productImage?.startsWith('data:')) {
          images.push({ dataUrl: row.productImage, name: 'product.jpg' });
          Logger.addLog(`🧪 พบรูปสินค้า: ${row.productName}`, 'info');
        }
        if (row.characterImage?.startsWith('data:')) {
          images.push({ dataUrl: row.characterImage, name: 'character.jpg' });
          Logger.addLog(`🧪 พบรูปตัวละคร`, 'info');
        }
      }

      // ถ้าไม่มีจาก table → หาจาก warehouse
      if (images.length === 0) {
        const warehouse = await Storage.getWarehouse();
        if (warehouse.products.length > 0 && warehouse.products[0].images?.[0]?.startsWith('data:')) {
          images.push({ dataUrl: warehouse.products[0].images[0], name: 'product.jpg' });
          Logger.addLog(`🧪 ใช้รูปจาก Warehouse: ${warehouse.products[0].name}`, 'info');
        }
        if (warehouse.characters.length > 0 && warehouse.characters[0].image?.startsWith('data:')) {
          images.push({ dataUrl: warehouse.characters[0].image, name: 'character.jpg' });
          Logger.addLog(`🧪 ใช้ตัวละครจาก Warehouse: ${warehouse.characters[0].name}`, 'info');
        }
      }

      if (images.length === 0) {
        showToast('ไม่มีรูป base64 - ไปเพิ่มสินค้า/ตัวละครที่ tab คลัง (อัพโหลดรูปด้วย)', 'warning');
        return;
      }

      Logger.addLog(`🧪 กำลัง paste ${images.length} รูป...`, 'info');

      // Paste ทุกรูปพร้อมกัน
      const result = await FlowAutomation.uploadImages(flowCheck.tab.id, images);
      const data = result?.[0]?.result;

      if (data?.success) {
        Logger.addLog(`🧪 ✅ Paste สำเร็จ! (${data.uploaded}/${data.total} รูป)`, 'success');
        showToast(`Paste ${data.uploaded} รูปสำเร็จ!`, 'success');
      } else {
        Logger.addLog(`🧪 ❌ ${data?.error || 'ไม่สำเร็จ'}`, 'error');
        showToast(data?.error || 'Paste ไม่สำเร็จ', 'error');
      }
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // ทดสอบ 3: ตั้งค่า 9:16
  async testSettings() {
    Logger.addLog('🧪 ทดสอบ: ตั้งค่า aspect ratio 9:16...', 'info');
    try {
      const flowCheck = await FlowAutomation.checkFlowPage();
      if (!flowCheck.ok) {
        showToast('กดปุ่ม 1 ก่อน', 'warning');
        return;
      }

      const result = await FlowAutomation.setupSettings(flowCheck.tab.id, {
        mode: 'image',
        aspectRatio: '9:16',
      });
      const data = result?.[0]?.result;
      if (data?.success) {
        Logger.addLog(`🧪 ✅ ${data.msg}`, 'success');
        showToast(data.msg, 'success');
      } else {
        Logger.addLog(`🧪 ❌ ${data?.msg || 'ไม่สำเร็จ'}`, 'error');
        showToast(data?.msg || 'ไม่สำเร็จ', 'error');
      }
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
    }
  },

  // ทดสอบ 4: วาง Prompt ลง Google Flow (ใช้ข้อความทดสอบ)
  async testFillPrompt() {
    Logger.addLog('🧪 ทดสอบ: วาง Prompt ทดสอบ...', 'info');
    try {
      const flowCheck = await FlowAutomation.checkFlowPage();
      if (!flowCheck.ok) {
        Logger.addLog(`🧪 ❌ กดปุ่ม 1 ก่อน (เปิด Flow)`, 'error');
        showToast('กรุณาเปิด Google Flow ก่อน (กดปุ่ม 1)', 'warning');
        return;
      }

      const promptToUse = this._testPrompt
        || 'A beautiful young woman holding a product, smiling at camera, bright studio lighting, professional product photography, 9:16 portrait orientation';
      Logger.addLog(`🧪 ใช้ Prompt: "${promptToUse.substring(0, 80)}..."`, 'info');
      await FlowAutomation.fillPrompt(flowCheck.tab.id, promptToUse);
      Logger.addLog(`🧪 ✅ วาง Prompt สำเร็จ!`, 'success');
      showToast('วาง Prompt สำเร็จ! ตรวจสอบที่หน้า Flow', 'success');
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // ทดสอบ 6: กดปุ่ม Generate
  async testClickGenerate() {
    Logger.addLog('🧪 ทดสอบ: กดปุ่ม Generate...', 'info');
    try {
      const flowCheck = await FlowAutomation.checkFlowPage();
      if (!flowCheck.ok) {
        showToast('กรุณาเปิด Google Flow ก่อน (กดปุ่ม 1)', 'warning');
        return;
      }

      await FlowAutomation.clickGenerate(flowCheck.tab.id);
      Logger.addLog(`🧪 ✅ กดปุ่ม Generate สำเร็จ!`, 'success');
      showToast('กดปุ่ม Generate แล้ว!', 'success');
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // ===== ทดสอบสร้างวิดีโอ =====

  // ทดสอบ 7: สลับเป็น Video mode
  async testVideoMode() {
    Logger.addLog('🧪 [Step 7] สลับเป็น Video mode + 9:16...', 'info');
    try {
      const flowCheck = await FlowAutomation.checkFlowPage();
      if (!flowCheck.ok) {
        showToast('เปิด Google Flow ก่อน', 'warning');
        return;
      }

      const result = await FlowAutomation.setupSettings(flowCheck.tab.id, {
        mode: 'video',
        aspectRatio: '9:16',
      });
      const data = result?.[0]?.result;
      if (data?.success) {
        Logger.addLog(`🧪 ✅ ${data.msg}`, 'success');
        showToast(data.msg, 'success');
      } else {
        Logger.addLog(`🧪 ❌ ${data?.msg || 'ไม่สำเร็จ'}`, 'error');
        showToast(data?.msg || 'ไม่สำเร็จ', 'error');
      }
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
    }
  },

  // ทดสอบ 7.5: Paste รูป reference เข้า Video mode
  // paste: ภาพที่เจนไว้ (จาก Feed) + รูปสินค้า + รูปตัวละคร
  async testVideoPasteRef() {
    Logger.addLog('🧪 [Step 7.5] Paste รูป reference สำหรับวิดีโอ...', 'info');
    try {
      const flowCheck = await FlowAutomation.checkFlowPage();
      if (!flowCheck.ok) {
        showToast('เปิด Google Flow ก่อน', 'warning');
        return;
      }

      const tabId = flowCheck.tab.id;
      const images = [];

      // 1. ดึงภาพที่เจนไว้จาก Feed (ภาพล่าสุด)
      Logger.addLog('🧪 กำลังดึงภาพที่เจนจาก Feed...', 'info');
      const genImages = await FlowAutomation.getGeneratedImages(tabId);
      const genSrcs = genImages?.[0]?.result || [];

      if (genSrcs.length > 0) {
        // แปลง URL ของภาพที่เจนเป็น base64
        const dataUrl = await ImageUtils.urlToDataUrl(tabId, genSrcs[genSrcs.length - 1]);
        if (dataUrl) {
          images.push({ dataUrl, name: 'generated_image.jpg' });
          Logger.addLog('🧪 ✅ ได้ภาพที่เจนจาก Feed', 'success');
        }
      }

      // 2. รูปสินค้า + ตัวละคร จาก table row
      if (this.rows.length > 0) {
        const row = this.rows[0];
        if (row.productImage?.startsWith('data:')) {
          images.push({ dataUrl: row.productImage, name: 'product.jpg' });
          Logger.addLog('🧪 เพิ่มรูปสินค้า', 'info');
        }
        if (row.characterImage?.startsWith('data:')) {
          images.push({ dataUrl: row.characterImage, name: 'character.jpg' });
          Logger.addLog('🧪 เพิ่มรูปตัวละคร', 'info');
        }
      }

      if (images.length === 0) {
        showToast('ไม่มีรูปให้ paste - เจนภาพก่อน (ปุ่ม 1-6)', 'warning');
        return;
      }

      // Paste ทุกรูป
      Logger.addLog(`🧪 กำลัง paste ${images.length} รูป...`, 'info');
      const result = await FlowAutomation.uploadImages(tabId, images);
      const data = result?.[0]?.result;

      if (data?.success) {
        Logger.addLog(`🧪 ✅ Paste reference สำเร็จ! (${data.uploaded}/${data.total} รูป)`, 'success');
        showToast(`Paste ${data.uploaded} รูป reference สำเร็จ!`, 'success');
      } else {
        Logger.addLog(`🧪 ❌ ${data?.error || 'ไม่สำเร็จ'}`, 'error');
        showToast(data?.error || 'Paste ไม่สำเร็จ', 'error');
      }
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // ทดสอบ 7.6: วาง Video Prompt (ใช้ template ไม่เสีย credit)
  async testVideoPrompt() {
    Logger.addLog('🧪 [Step 7.6] สร้าง + วาง Video Prompt...', 'info');
    try {
      const flowCheck = await FlowAutomation.checkFlowPage();
      if (!flowCheck.ok) {
        showToast('เปิด Google Flow ก่อน', 'warning');
        return;
      }

      const productName = this.rows.length > 0 ? this.rows[0].productName : 'the product';
      const cameraAngle = document.getElementById('vg-camera-angle')?.value;

      const videoPrompt = PromptBuilder.buildVideoPrompt(productName, {
        videoStyle: 'talk_ugc',
        cameraAngle: cameraAngle === 'auto' ? PromptBuilder.getRandomCameraAngle() : cameraAngle,
        noText: document.getElementById('vg-no-text')?.checked,
      });

      Logger.addLog(`🧪 Video Prompt: "${videoPrompt.substring(0, 120)}..."`, 'info');

      await FlowAutomation.fillPrompt(flowCheck.tab.id, videoPrompt);
      Logger.addLog('🧪 ✅ วาง Video Prompt สำเร็จ!', 'success');
      showToast('วาง Video Prompt สำเร็จ!', 'success');
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // ทดสอบ 8: กด Generate Video (⚠️ เสีย credit)
  async testVideoGenerate() {
    Logger.addLog('🧪 [Step 8] กด Generate Video...', 'info');
    try {
      const flowCheck = await FlowAutomation.checkFlowPage();
      if (!flowCheck.ok) {
        showToast('เปิด Google Flow ก่อน', 'warning');
        return;
      }

      // วาง video prompt (ถ้ามีจาก AI)
      if (this._testPrompt) {
        Logger.addLog('🧪 วาง Video Prompt...', 'info');
        await FlowAutomation.fillPrompt(flowCheck.tab.id, this._testPrompt);
        await DOMHelpers.sleep(1500);
      }

      await FlowAutomation.clickGenerate(flowCheck.tab.id);
      Logger.addLog('🧪 ✅ กดปุ่ม Generate Video แล้ว! รอสร้าง...', 'success');
      showToast('กด Generate Video แล้ว! รอ ~4 นาที', 'success');
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
    }
  },

  // ===== ทดสอบ TikTok =====

  // ทดสอบ 9: เปิด TikTok Studio
  async testOpenTikTok() {
    Logger.addLog('🧪 [Step 9] เปิด TikTok Studio...', 'info');
    try {
      const tab = await TikTokPoster.getTikTokTab();
      Logger.addLog(`🧪 ✅ เปิด TikTok Studio สำเร็จ! Tab ID: ${tab.id}`, 'success');
      showToast('เปิด TikTok Studio สำเร็จ!', 'success');
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // ทดสอบ 10: ใส่ Caption
  async testFillCaption() {
    Logger.addLog('🧪 [Step 10] ใส่ Caption...', 'info');
    try {
      const tabs = await chrome.tabs.query({ url: '*://*.tiktok.com/*' });
      const tiktokTab = tabs.find(t => t.url.includes('tiktokstudio'));
      if (!tiktokTab) {
        showToast('กดปุ่ม 9 ก่อน (เปิด TikTok Studio)', 'warning');
        return;
      }

      const caption = this._testCaption || '🔥 สินค้าดี ต้องลอง! กดตะกร้าเลยค่ะ\n#สินค้าดี #tiktokshop #ของดี';
      await TikTokPoster.fillCaption(tiktokTab.id, caption);
      Logger.addLog(`🧪 ✅ ใส่ Caption สำเร็จ: "${caption.substring(0, 50)}..."`, 'success');
      showToast('ใส่ Caption สำเร็จ!', 'success');
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
    }
  },

  // ทดสอบ 11: ปักตะกร้า
  async testAddCart() {
    Logger.addLog('🧪 [Step 11] ปักตะกร้า...', 'info');
    try {
      const tabs = await chrome.tabs.query({ url: '*://*.tiktok.com/*' });
      const tiktokTab = tabs.find(t => t.url.includes('tiktokstudio'));
      if (!tiktokTab) {
        showToast('กดปุ่ม 9 ก่อน (เปิด TikTok Studio)', 'warning');
        return;
      }

      const productName = this.rows.length > 0 ? this.rows[0].productName : 'สินค้าทดสอบ';
      await TikTokPoster.addProductLink(tiktokTab.id, productName);
      Logger.addLog(`🧪 ✅ กดปุ่มปักตะกร้า: "${productName}"`, 'success');
      showToast('กดปุ่มปักตะกร้าแล้ว!', 'success');
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
    }
  },

  // ทดสอบ 12: ติ๊ก AI-generated content
  async testAIFlag() {
    Logger.addLog('🧪 [Step 12] ติ๊ก AI-generated content...', 'info');
    try {
      const tabs = await chrome.tabs.query({ url: '*://*.tiktok.com/*' });
      const tiktokTab = tabs.find(t => t.url.includes('tiktokstudio'));
      if (!tiktokTab) {
        showToast('กดปุ่ม 9 ก่อน (เปิด TikTok Studio)', 'warning');
        return;
      }

      await TikTokPoster.setAIGeneratedFlag(tiktokTab.id, true);
      Logger.addLog('🧪 ✅ ติ๊ก AI-generated content สำเร็จ!', 'success');
      showToast('ติ๊ก AI-generated สำเร็จ!', 'success');
    } catch (err) {
      Logger.addLog(`🧪 ❌ Error: ${err.message}`, 'error');
    }
  },
};
