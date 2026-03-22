// ===== Vedia Flow - Advanced Video Tab (16 วินาที) =====

const TabAdvancedVideo = {
  rows: [],

  async init() {
    this.rows = await Storage.getAdvancedVideoTable();
    this.setupEvents();
    this.renderTable();
    Logger.setContainer('adv-activity-log');
  },

  setupEvents() {
    document.getElementById('btn-adv-run')?.addEventListener('click', () => this.runAdvancedFlow());
    document.getElementById('btn-adv-pause')?.addEventListener('click', () => {
      if (DOMHelpers.isPaused) { DOMHelpers.resume(); } else { DOMHelpers.pause(); }
    });
    document.getElementById('btn-adv-stop')?.addEventListener('click', () => FlowRunner.stop());

    document.getElementById('btn-adv-add-row')?.addEventListener('click', () => this.addRow());
    document.getElementById('btn-adv-from-warehouse')?.addEventListener('click', () => this.addFromWarehouse());
    document.getElementById('btn-adv-clear')?.addEventListener('click', () => this.clearTable());
  },

  renderTable() {
    const tbody = document.getElementById('adv-table-body');
    const countEl = document.getElementById('adv-table-count');
    if (!tbody) return;
    if (countEl) countEl.textContent = this.rows.length;

    if (this.rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">ยังไม่มีสินค้า</td></tr>';
      return;
    }

    tbody.innerHTML = this.rows.map((row, i) => `
      <tr>
        <td><strong>#${i + 1}</strong></td>
        <td><input type="text" value="${(row.productName || '').replace(/"/g, '&quot;')}"
             class="adv-name" data-i="${i}" style="font-size:11px;padding:4px 6px;" placeholder="ชื่อสินค้า"></td>
        <td><input type="text" value="${(row.highlights || '').replace(/"/g, '&quot;')}"
             class="adv-highlights" data-i="${i}" style="font-size:11px;padding:4px 6px;" placeholder="จุดเด่น"></td>
        <td><span class="badge badge-${row.status === 'done' ? 'success' : 'neutral'}" style="font-size:10px;">
          ${row.status === 'done' ? 'เสร็จ' : 'รอ'}
        </span></td>
      </tr>
    `).join('');

    // Bind input changes
    document.querySelectorAll('.adv-name').forEach(el => {
      el.addEventListener('change', (e) => { this.rows[e.target.dataset.i].productName = e.target.value; this.save(); });
    });
    document.querySelectorAll('.adv-highlights').forEach(el => {
      el.addEventListener('change', (e) => { this.rows[e.target.dataset.i].highlights = e.target.value; this.save(); });
    });
  },

  addRow() {
    this.rows.push({ id: 'adv_' + Date.now(), productName: '', highlights: '', status: 'pending' });
    this.save();
    this.renderTable();
  },

  async addFromWarehouse() {
    const warehouse = await Storage.getWarehouse();
    if (warehouse.products.length === 0) { showToast('ยังไม่มีสินค้าใน Warehouse', 'warning'); return; }

    let count = 0;
    warehouse.products.forEach(wp => {
      if (!this.rows.find(r => r.productName === wp.name)) {
        this.rows.push({
          id: 'adv_' + Date.now() + '_' + count,
          productName: wp.name, highlights: wp.highlights || '',
          code: wp.code || '', productImage: wp.images?.[0] || null, status: 'pending',
        });
        count++;
      }
    });
    this.save(); this.renderTable();
    showToast(`เพิ่ม ${count} สินค้า`, 'success');
  },

  async clearTable() {
    if (!this.rows.length || !confirm('ล้างตาราง?')) return;
    this.rows = []; this.save(); this.renderTable();
  },

  // รัน Advanced Flow (สร้าง 2 scenes)
  async runAdvancedFlow() {
    if (this.rows.length === 0) { showToast('กรุณาเพิ่มสินค้า', 'warning'); return; }

    // ใช้ FlowRunner เดิมแต่จะรัน 2 รอบสำหรับ 2 scenes
    Logger.addLog('เริ่ม Advanced Flow (16 วินาที - 2 scenes)', 'info');

    const settings = {
      mode: 'full',
      noText: document.getElementById('adv-no-text')?.checked || false,
      randomCamera: document.getElementById('adv-camera-angle')?.value === 'auto',
      cameraAngle: document.getElementById('adv-camera-angle')?.value,
    };

    // แสดง controls
    document.getElementById('btn-adv-run')?.classList.add('hidden');
    document.getElementById('btn-adv-pause')?.classList.remove('hidden');
    document.getElementById('btn-adv-stop')?.classList.remove('hidden');

    await FlowRunner.runFullFlow(this.rows, settings, {
      onLog: (msg, type) => Logger.addLog(msg, type),
      onStatusUpdate: (index, status) => {
        this.rows[index].status = status;
        this.save();
        this.renderTable();
      },
      onComplete: () => {
        document.getElementById('btn-adv-run')?.classList.remove('hidden');
        document.getElementById('btn-adv-pause')?.classList.add('hidden');
        document.getElementById('btn-adv-stop')?.classList.add('hidden');
        showToast('Advanced Flow เสร็จสิ้น!', 'success');
      },
    });
  },

  async save() { await Storage.saveAdvancedVideoTable(this.rows); },
};
