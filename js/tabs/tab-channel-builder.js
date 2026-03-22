// ===== Vedia Flow - Channel Builder Tab =====

const TabChannelBuilder = {
  channels: [],
  currentChannelId: null,
  contentRows: [],

  async init() {
    this.channels = await Storage.getChannels();
    this.setupEvents();
    this.renderChannelDropdown();
    Logger.setContainer('ch-activity-log');
  },

  setupEvents() {
    // สร้างช่อง
    document.getElementById('btn-ch-new')?.addEventListener('click', () => {
      document.getElementById('modal-new-channel')?.classList.remove('hidden');
    });
    document.getElementById('btn-ch-save-channel')?.addEventListener('click', () => this.saveNewChannel());

    // เลือกช่อง
    document.getElementById('ch-select-channel')?.addEventListener('change', (e) => {
      this.selectChannel(e.target.value);
    });

    // Niche toggle custom
    document.getElementById('ch-niche')?.addEventListener('change', (e) => {
      const custom = document.getElementById('ch-custom-niche');
      if (custom) custom.classList.toggle('hidden', e.target.value !== 'custom');
    });

    // เพิ่มหัวข้อ
    document.getElementById('btn-ch-add-idea')?.addEventListener('click', () => this.addIdea());

    // AI สร้างหัวข้อ
    document.getElementById('btn-ch-ai-generate')?.addEventListener('click', () => this.aiGenerateIdeas());

    // ล้าง
    document.getElementById('btn-ch-clear')?.addEventListener('click', () => this.clearContent());

    // รันสร้างคลิป
    document.getElementById('btn-ch-run')?.addEventListener('click', () => this.runChannelFlow());
    document.getElementById('btn-ch-stop')?.addEventListener('click', () => FlowRunner.stop());

    // ปิด modal
    document.querySelectorAll('.btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      });
    });
  },

  // ===== Channel Management =====
  renderChannelDropdown() {
    const select = document.getElementById('ch-select-channel');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">-- เลือกหรือสร้างใหม่ --</option>';
    this.channels.forEach(ch => {
      select.innerHTML += `<option value="${ch.id}">${ch.name} (${ch.niche})</option>`;
    });
    if (currentVal) select.value = currentVal;
  },

  async saveNewChannel() {
    const name = document.getElementById('ch-new-name')?.value.trim();
    const niche = document.getElementById('ch-new-niche')?.value;
    if (!name) { showToast('กรุณากรอกชื่อช่อง', 'error'); return; }

    const channel = {
      id: 'ch_' + Date.now(),
      name,
      niche,
      createdAt: new Date().toISOString(),
    };

    this.channels.push(channel);
    await Storage.saveChannels(this.channels);

    this.renderChannelDropdown();
    document.getElementById('ch-select-channel').value = channel.id;
    this.selectChannel(channel.id);

    document.getElementById('modal-new-channel')?.classList.add('hidden');
    document.getElementById('ch-new-name').value = '';
    Logger.addLog(`สร้างช่อง "${name}" (${niche})`, 'success');
    showToast(`สร้างช่อง "${name}" สำเร็จ`, 'success');
  },

  async selectChannel(channelId) {
    this.currentChannelId = channelId;
    const infoDiv = document.getElementById('ch-channel-info');

    if (!channelId) {
      if (infoDiv) infoDiv.classList.add('hidden');
      this.contentRows = [];
      this.renderContent();
      return;
    }

    const channel = this.channels.find(c => c.id === channelId);
    if (!channel) return;

    if (infoDiv) {
      infoDiv.classList.remove('hidden');
      document.getElementById('ch-channel-name').textContent = channel.name;
      document.getElementById('ch-channel-niche').textContent = channel.niche;
    }

    // โหลด content ของช่อง
    this.contentRows = await Storage.getChannelContent(channelId);
    this.renderContent();
  },

  // ===== Content Table =====
  renderContent() {
    const tbody = document.getElementById('ch-content-body');
    const countEl = document.getElementById('ch-content-count');
    if (!tbody) return;
    if (countEl) countEl.textContent = this.contentRows.length;

    if (this.contentRows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state">ยังไม่มีหัวข้อ - กด AI สร้างหัวข้อ หรือเพิ่มเอง</td></tr>';
      return;
    }

    tbody.innerHTML = this.contentRows.map((row, i) => `
      <tr>
        <td><strong>#${i + 1}</strong></td>
        <td><input type="text" value="${(row.topic || '').replace(/"/g, '&quot;')}"
             class="ch-topic" data-i="${i}" style="font-size:11px;padding:4px 6px;" placeholder="หัวข้อคลิป"></td>
        <td><span class="badge badge-${row.status === 'done' ? 'success' : 'neutral'}" style="font-size:10px;">
          ${row.status === 'done' ? 'เสร็จ' : 'รอ'}
        </span></td>
      </tr>
    `).join('');

    document.querySelectorAll('.ch-topic').forEach(el => {
      el.addEventListener('change', (e) => {
        this.contentRows[e.target.dataset.i].topic = e.target.value;
        this.saveContent();
      });
    });
  },

  addIdea() {
    if (!this.currentChannelId) { showToast('กรุณาเลือกช่องก่อน', 'warning'); return; }
    this.contentRows.push({ id: 'ci_' + Date.now(), topic: '', status: 'pending' });
    this.saveContent();
    this.renderContent();
  },

  // AI สร้างหัวข้อ 10 รายการ
  async aiGenerateIdeas() {
    if (!this.currentChannelId) { showToast('กรุณาเลือกช่องก่อน', 'warning'); return; }

    const channel = this.channels.find(c => c.id === this.currentChannelId);
    const niche = document.getElementById('ch-niche')?.value || channel?.niche || 'general';
    const customNiche = document.getElementById('ch-custom-niche-input')?.value || '';
    const nicheName = niche === 'custom' ? customNiche : niche;

    Logger.addLog(`AI กำลังสร้างหัวข้อ 10 รายการ สำหรับ niche "${nicheName}"...`, 'info');
    showToast('AI กำลังคิดหัวข้อ...', 'info');

    try {
      const settings = await Storage.getSettings();
      const ai = createAIProvider(settings.aiProvider, settings.apiKeys[settings.aiProvider], settings.openrouterModel);

      const result = await ai.callAPI(
        `คุณเป็นผู้เชี่ยวชาญ TikTok content ใน niche "${nicheName}"
สร้างหัวข้อคลิป TikTok 10 รายการ สำหรับช่อง niche นี้

กฎ:
- ตอบเป็นรายการ 10 ข้อ (ข้อละ 1 บรรทัด)
- แต่ละข้อเป็นหัวข้อสั้นๆ ภาษาไทย
- เน้นหัวข้อที่ viral ได้ น่าสนใจ ดึงดูดคนดู
- ห้ามใส่ตัวเลขหรือลำดับนำหน้า
- ตอบเป็นหัวข้อตรงๆ ไม่ต้องมีคำอธิบาย`,
        'สร้างหัวข้อคลิป 10 รายการ'
      );

      // Parse ผลลัพธ์เป็น array
      const topics = result
        .split('\n')
        .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 2 && line.length < 200);

      topics.forEach(topic => {
        this.contentRows.push({
          id: 'ci_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          topic,
          status: 'pending',
        });
      });

      this.saveContent();
      this.renderContent();
      Logger.addLog(`AI สร้างหัวข้อ ${topics.length} รายการสำเร็จ`, 'success');
      showToast(`สร้างหัวข้อ ${topics.length} รายการ!`, 'success');

    } catch (err) {
      Logger.addLog(`AI Error: ${err.message}`, 'error');
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  async clearContent() {
    if (!this.contentRows.length || !confirm('ล้างหัวข้อทั้งหมด?')) return;
    this.contentRows = [];
    this.saveContent();
    this.renderContent();
  },

  // ===== Run Channel Flow =====
  async runChannelFlow() {
    if (this.contentRows.length === 0) { showToast('กรุณาเพิ่มหัวข้อก่อน', 'warning'); return; }

    const channel = this.channels.find(c => c.id === this.currentChannelId);
    const niche = channel?.niche || 'general';

    // แปลง content rows เป็น format ที่ FlowRunner ใช้ได้
    const flowRows = this.contentRows.map(row => ({
      ...row,
      productName: row.topic,
      highlights: niche,
    }));

    document.getElementById('btn-ch-run')?.classList.add('hidden');
    document.getElementById('btn-ch-stop')?.classList.remove('hidden');

    const settings = {
      mode: 'full',
      noText: false,
      randomCamera: true,
      isChannelMode: true, // ← ไม่ปักตะกร้า, caption แบบ engagement
    };

    await FlowRunner.runFullFlow(flowRows, settings, {
      onLog: (msg, type) => Logger.addLog(msg, type),
      onStatusUpdate: (index, status) => {
        this.contentRows[index].status = status;
        this.saveContent();
        this.renderContent();
      },
      onComplete: () => {
        document.getElementById('btn-ch-run')?.classList.remove('hidden');
        document.getElementById('btn-ch-stop')?.classList.add('hidden');
        showToast('Channel Flow เสร็จสิ้น!', 'success');
      },
    });
  },

  async saveContent() {
    if (this.currentChannelId) {
      await Storage.saveChannelContent(this.currentChannelId, this.contentRows);
    }
  },
};
