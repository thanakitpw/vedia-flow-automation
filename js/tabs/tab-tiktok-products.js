// ===== Vedia Flow - TikTok Products Tab =====

const TabTikTokProducts = {
  products: [],
  selectedRows: new Set(),
  currentPickerRowId: null,

  async init() {
    this.products = await Storage.getProducts();
    this.setupEvents();
    this.renderTable();
    Logger.setContainer('tp-activity-log');
  },

  // ===== Events =====
  setupEvents() {
    // ดึงจาก TikTok
    document.getElementById('btn-import-tiktok')?.addEventListener('click', () => this.importFromTikTok());

    // Delete selected
    document.getElementById('btn-delete-selected')?.addEventListener('click', () => this.deleteSelected());

    // Same Character
    document.getElementById('btn-same-character')?.addEventListener('click', () => this.sameCharacter());

    // Select all
    document.getElementById('select-all-products')?.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.products.forEach(p => this.selectedRows.add(p.id));
      } else {
        this.selectedRows.clear();
      }
      this.renderTable();
      this.updateSelectedCount();
    });

    // Export
    document.getElementById('btn-tp-export')?.addEventListener('click', () => this.exportProducts());

    // Import
    document.getElementById('btn-tp-import')?.addEventListener('click', () => {
      document.getElementById('tp-import-file')?.click();
    });
    document.getElementById('tp-import-file')?.addEventListener('change', (e) => this.importProducts(e));

    // Download JSON
    document.getElementById('btn-tp-download-json')?.addEventListener('click', () => this.downloadJSON());

    // Add to Warehouse
    document.getElementById('btn-tp-add-to-warehouse')?.addEventListener('click', () => this.addToWarehouse());

    // ปิด modal
    document.querySelectorAll('.btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      });
    });
  },

  // ===== Import from TikTok Studio =====
  async importFromTikTok() {
    Logger.addLog('เริ่มดึงสินค้าจาก TikTok Studio...', 'info');
    showToast('กำลังดึงสินค้า... กรุณาเปิด TikTok Studio', 'info');

    const scraped = await TikTokScraper.scrapeProducts();

    if (scraped.length === 0) {
      Logger.addLog('ไม่พบสินค้าบน TikTok Studio', 'warning');
      return;
    }

    // เพิ่มเข้า list (ไม่ซ้ำ)
    let addedCount = 0;
    scraped.forEach(item => {
      const exists = this.products.find(p => p.id === item.id);
      if (!exists) {
        this.products.push({
          ...item,
          workflowStatus: 'waiting',
          characterId: null,
          characterImage: null,
          importedAt: new Date().toISOString(),
        });
        addedCount++;
      }
    });

    await this.save();
    this.renderTable();

    Logger.addLog(`ดึงสินค้าสำเร็จ: ${addedCount} รายการใหม่ (พบทั้งหมด ${scraped.length})`, 'success');
    showToast(`เพิ่ม ${addedCount} สินค้าใหม่`, 'success');
  },

  // ===== Render Table =====
  renderTable() {
    const tbody = document.getElementById('tiktok-products-tbody');
    if (!tbody) return;

    if (this.products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">ยังไม่มีสินค้า - กดปุ่ม "ดึงจาก TikTok" หรือ "Import"</td></tr>';
      return;
    }

    tbody.innerHTML = this.products.map((p, i) => `
      <tr data-id="${p.id}">
        <td><input type="checkbox" class="row-checkbox" data-id="${p.id}" ${this.selectedRows.has(p.id) ? 'checked' : ''}></td>
        <td>
          <div style="font-weight:600;">#${i + 1}</div>
          <span class="badge badge-${this.getStatusBadge(p.workflowStatus)}" style="font-size:10px;">
            ${this.getStatusText(p.workflowStatus)}
          </span>
        </td>
        <td>
          <div class="tp-character-cell" data-id="${p.id}" title="คลิกเพื่อเลือกตัวละคร" style="cursor:pointer;">
            ${p.characterImage
              ? `<img src="${p.characterImage}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">`
              : '<div style="width:40px;height:40px;border-radius:6px;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;font-size:16px;">⬆️</div>'
            }
          </div>
        </td>
        <td>
          ${p.productImages?.[0]
            ? `<img src="${p.productImages[0]}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">`
            : '<div style="width:40px;height:40px;border-radius:6px;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;">📦</div>'
          }
        </td>
        <td>
          <div style="font-size:11px;max-width:150px;overflow:hidden;text-overflow:ellipsis;">
            <strong>${this.escapeHtml(p.name)}</strong><br>
            ${p.price ? `฿${p.price.toLocaleString()}` : ''}
            ${p.stock ? ` | stock: ${p.stock}` : ''}
          </div>
        </td>
        <td style="font-size:11px;max-width:80px;overflow:hidden;text-overflow:ellipsis;">
          ${this.escapeHtml(p.name)}
        </td>
      </tr>
    `).join('');

    // Bind events
    this.bindTableEvents();
    this.updateSelectedCount();
  },

  bindTableEvents() {
    // Checkbox
    document.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectedRows.add(e.target.dataset.id);
        } else {
          this.selectedRows.delete(e.target.dataset.id);
        }
        this.updateSelectedCount();
      });
    });

    // Character picker
    document.querySelectorAll('.tp-character-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        this.currentPickerRowId = cell.dataset.id;
        this.openCharacterPicker();
      });
    });
  },

  updateSelectedCount() {
    const el = document.getElementById('selected-count');
    if (el) el.textContent = this.selectedRows.size;
  },

  // ===== Character Picker =====
  async openCharacterPicker() {
    const warehouse = await Storage.getWarehouse();
    const list = document.getElementById('character-picker-list');
    const modal = document.getElementById('modal-select-character');

    if (!list || !modal) return;

    if (warehouse.characters.length === 0) {
      list.innerHTML = '<div class="empty-state">ยังไม่มีตัวละครใน Warehouse<br>ไปเพิ่มที่ tab คลัง ก่อน</div>';
    } else {
      list.innerHTML = warehouse.characters.map(c => `
        <div class="warehouse-item character-pick-item" data-id="${c.id}" style="cursor:pointer;">
          <div class="warehouse-item-image">
            ${c.image ? `<img src="${c.image}" alt="${c.name}">` : '<div class="no-image">👤</div>'}
          </div>
          <div class="warehouse-item-info">
            <div class="warehouse-item-name">${this.escapeHtml(c.name)}</div>
          </div>
        </div>
      `).join('');

      // Bind click
      list.querySelectorAll('.character-pick-item').forEach(item => {
        item.addEventListener('click', async () => {
          const charId = item.dataset.id;
          const char = warehouse.characters.find(c => c.id === charId);
          if (!char) return;

          const product = this.products.find(p => p.id === this.currentPickerRowId);
          if (product) {
            product.characterId = char.id;
            product.characterImage = char.image;
            await this.save();
            this.renderTable();
            Logger.addLog(`เลือกตัวละคร "${char.name}" ให้ "${product.name}"`, 'info');
          }
          modal.classList.add('hidden');
        });
      });
    }

    // อัพโหลดรูปใหม่
    const fileInput = document.getElementById('input-new-character-image');
    if (fileInput) {
      const newInput = fileInput.cloneNode(true);
      fileInput.parentNode.replaceChild(newInput, fileInput);
      newInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const product = this.products.find(p => p.id === this.currentPickerRowId);
          if (product) {
            product.characterImage = ev.target.result;
            product.characterId = null;
            await this.save();
            this.renderTable();
            Logger.addLog(`อัพโหลดรูปตัวละครใหม่ให้ "${product.name}"`, 'info');
          }
          modal.classList.add('hidden');
        };
        reader.readAsDataURL(file);
      });
    }

    modal.classList.remove('hidden');
  },

  // ===== Same Character =====
  async sameCharacter() {
    if (this.products.length === 0) {
      showToast('ยังไม่มีสินค้า', 'error');
      return;
    }

    // ใช้ character ของตัวแรกที่มี
    const firstWithChar = this.products.find(p => p.characterImage);
    if (!firstWithChar) {
      showToast('ยังไม่มีสินค้าไหนที่เลือกตัวละคร - กดที่รูปตัวละครเพื่อเลือกก่อน', 'warning');
      return;
    }

    this.products.forEach(p => {
      p.characterId = firstWithChar.characterId;
      p.characterImage = firstWithChar.characterImage;
    });

    await this.save();
    this.renderTable();
    Logger.addLog('ใช้ตัวละครเดียวกันทุกสินค้า', 'success');
    showToast('ใช้ตัวละครเดียวกันทุกสินค้าแล้ว', 'success');
  },

  // ===== Delete =====
  async deleteSelected() {
    if (this.selectedRows.size === 0) {
      showToast('กรุณาเลือกสินค้าที่ต้องการลบ', 'warning');
      return;
    }
    if (!confirm(`ลบ ${this.selectedRows.size} รายการ?`)) return;

    this.products = this.products.filter(p => !this.selectedRows.has(p.id));
    Logger.addLog(`ลบ ${this.selectedRows.size} สินค้า`, 'warning');
    this.selectedRows.clear();
    await this.save();
    this.renderTable();
    showToast('ลบสำเร็จ', 'info');
  },

  // ===== Export / Import / Download =====
  exportProducts() {
    const blob = new Blob([JSON.stringify(this.products, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vedia_tiktok_products_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export สำเร็จ', 'success');
  },

  async importProducts(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        this.products = [...this.products, ...data];
      } else if (data.products) {
        this.products = [...this.products, ...data.products];
      }
      await this.save();
      this.renderTable();
      Logger.addLog(`Import สินค้าสำเร็จ`, 'success');
      showToast('Import สำเร็จ', 'success');
    } catch {
      showToast('ไฟล์ JSON ไม่ถูกต้อง', 'error');
    }
    e.target.value = '';
  },

  downloadJSON() {
    if (this.products.length === 0) {
      showToast('ไม่มีสินค้าให้ download', 'warning');
      return;
    }

    const data = this.products.map(p => ({
      name: p.name,
      highlights: p.highlights || '',
      code: p.id,
      price: p.price,
      status: p.status,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vedia_products_data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    Logger.addLog('Download JSON สำเร็จ', 'success');
    showToast('Download JSON สำเร็จ', 'success');
  },

  // ===== Add to Warehouse =====
  async addToWarehouse() {
    if (this.products.length === 0) {
      showToast('ไม่มีสินค้า', 'warning');
      return;
    }

    const warehouse = await Storage.getWarehouse();
    let addedCount = 0;

    this.products.forEach(p => {
      const exists = warehouse.products.find(wp => wp.code === p.id || wp.name === p.name);
      if (!exists) {
        warehouse.products.push({
          id: 'wp_' + Date.now() + '_' + addedCount,
          name: p.name,
          highlights: '',
          code: p.id,
          images: p.productImages || [],
          createdAt: new Date().toISOString(),
        });
        addedCount++;
      }
    });

    await Storage.saveWarehouse(warehouse);
    Logger.addLog(`เพิ่ม ${addedCount} สินค้าเข้า Warehouse`, 'success');
    showToast(`เพิ่ม ${addedCount} สินค้าเข้า Warehouse สำเร็จ`, 'success');
  },

  // ===== Helpers =====
  async save() {
    await Storage.saveProducts(this.products);
  },

  getStatusText(status) {
    const map = { waiting: 'รอดำเนินการ', uploading: 'กำลังอัพโหลด', generating: 'กำลังสร้าง', done: 'เสร็จสิ้น' };
    return map[status] || status;
  },

  getStatusBadge(status) {
    const map = { waiting: 'neutral', uploading: 'info', generating: 'warning', done: 'success' };
    return map[status] || 'neutral';
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  },
};
