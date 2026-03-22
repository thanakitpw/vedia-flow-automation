// ===== Vedia Flow - Activity Logger =====

const Logger = {
  entries: [],
  maxEntries: 200,
  container: null,

  // เพิ่ม log entry
  addLog(message, type = 'info') {
    const now = new Date();
    const time = now.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const entry = { message, type, time, timestamp: now.getTime() };

    // เพิ่มที่หัว array (ใหม่สุดอยู่บน)
    this.entries.unshift(entry);

    // จำกัดจำนวน
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }

    // อัพเดท UI ถ้ามี container
    this.render();

    return entry;
  },

  // ล้าง log ทั้งหมด
  clear() {
    this.entries = [];
    this.render();
  },

  // ตั้ง container สำหรับ render
  setContainer(elementId) {
    this.container = document.getElementById(elementId);
    this.render();
  },

  // Render log ลง DOM
  render() {
    if (!this.container) return;

    // อัพเดท count
    const countEl = this.container.querySelector('.activity-log-count');
    if (countEl) {
      countEl.textContent = `${this.entries.length} entries`;
    }

    // อัพเดท list
    const listEl = this.container.querySelector('.activity-log-list');
    if (!listEl) return;

    if (this.entries.length === 0) {
      listEl.innerHTML = '<div class="empty-state">ยังไม่มี activity</div>';
      return;
    }

    listEl.innerHTML = this.entries.map(entry => `
      <div class="log-entry">
        <span class="log-type ${entry.type}">${this.getTypeLabel(entry.type)}</span>
        <span class="log-time">${entry.time}</span>
        <span class="log-message">${this.escapeHtml(entry.message)}</span>
      </div>
    `).join('');
  },

  // แปลง type เป็น label
  getTypeLabel(type) {
    const labels = {
      info: 'Info',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
    };
    return labels[type] || 'Info';
  },

  // ป้องกัน XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // สร้าง HTML template สำหรับ Activity Log component
  createLogHTML(id = 'activity-log') {
    return `
      <div id="${id}" class="activity-log">
        <div class="activity-log-header">
          <span class="activity-log-title">Activity Log</span>
          <span class="activity-log-count">0 entries</span>
        </div>
        <div class="activity-log-list">
          <div class="empty-state">ยังไม่มี activity</div>
        </div>
      </div>
    `;
  },
};
