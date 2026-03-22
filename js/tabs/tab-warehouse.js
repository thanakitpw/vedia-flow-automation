// ===== Vedia Flow - Warehouse Tab =====

const TabWarehouse = {
  warehouse: null,
  tempImage: null, // เก็บรูปชั่วคราวก่อนบันทึก

  async init() {
    this.warehouse = await Storage.getWarehouse();
    this.setupSubTabs();
    this.setupEvents();
    this.renderAll();
    Logger.setContainer('warehouse-log');

    // โหลด log จาก warehouse
    if (this.warehouse.activityLog?.length) {
      this.warehouse.activityLog.forEach(entry => {
        Logger.entries.push(entry);
      });
      Logger.render();
    }
  },

  // ===== Sub-tabs =====
  setupSubTabs() {
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.subtab-content').forEach(c => c.classList.add('hidden'));
        const target = document.getElementById(`subtab-${btn.dataset.subtab}`);
        if (target) target.classList.remove('hidden');
      });
    });
  },

  // ===== Events =====
  setupEvents() {
    // เพิ่มสินค้า
    document.getElementById('btn-add-product')?.addEventListener('click', () => {
      this.openModal('modal-add-product');
    });
    document.getElementById('btn-save-product')?.addEventListener('click', () => this.saveProduct());
    document.getElementById('input-product-image')?.addEventListener('change', (e) => {
      this.handleImagePreview(e, 'preview-product-image');
    });

    // เพิ่มตัวละคร
    document.getElementById('btn-add-character')?.addEventListener('click', () => {
      this.openModal('modal-add-character');
    });
    document.getElementById('btn-save-character')?.addEventListener('click', () => this.saveCharacter());
    document.getElementById('input-character-image')?.addEventListener('change', (e) => {
      this.handleImagePreview(e, 'preview-character-image');
    });

    // เพิ่มฉากหลัง
    document.getElementById('btn-add-background')?.addEventListener('click', () => {
      this.openModal('modal-add-background');
    });
    document.getElementById('btn-save-background')?.addEventListener('click', () => this.saveBackground());
    document.getElementById('input-background-image')?.addEventListener('change', (e) => {
      this.handleImagePreview(e, 'preview-background-image');
    });

    // ปิด modal
    document.querySelectorAll('.btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Export/Import
    document.getElementById('btn-export-warehouse')?.addEventListener('click', () => this.exportWarehouse());
    document.getElementById('btn-import-warehouse')?.addEventListener('click', () => {
      document.getElementById('import-warehouse-file')?.click();
    });
    document.getElementById('import-warehouse-file')?.addEventListener('change', (e) => this.importWarehouse(e));
  },

  // ===== Render All =====
  renderAll() {
    this.renderProducts();
    this.renderCharacters();
    this.renderBackgrounds();
  },

  // ===== Products =====
  renderProducts() {
    const list = document.getElementById('products-list');
    const count = document.getElementById('products-count');
    if (!list) return;

    const products = this.warehouse.products || [];
    if (count) count.textContent = products.length;

    if (products.length === 0) {
      list.innerHTML = '<div class="empty-state">ยังไม่มีสินค้า</div>';
      return;
    }

    list.innerHTML = products.map(p => `
      <div class="warehouse-item" data-id="${p.id}">
        <div class="warehouse-item-image">
          ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}">` : '<div class="no-image">📦</div>'}
        </div>
        <div class="warehouse-item-info">
          <div class="warehouse-item-name">${this.escapeHtml(p.name)}</div>
          <div class="warehouse-item-desc">${this.escapeHtml(p.highlights || '')}</div>
          ${p.code ? `<div class="warehouse-item-code">${this.escapeHtml(p.code)}</div>` : ''}
        </div>
        <button class="btn-icon btn-delete-item" data-type="products" data-id="${p.id}" title="ลบ">🗑️</button>
      </div>
    `).join('');

    this.bindDeleteButtons();
  },

  async saveProduct() {
    const name = document.getElementById('input-product-name')?.value.trim();
    if (!name) { showToast('กรุณากรอกชื่อสินค้า', 'error'); return; }

    const product = {
      id: 'wp_' + Date.now(),
      name,
      highlights: document.getElementById('input-product-highlights')?.value.trim() || '',
      code: document.getElementById('input-product-code')?.value.trim() || '',
      images: this.tempImage ? [this.tempImage] : [],
      createdAt: new Date().toISOString(),
    };

    this.warehouse.products.push(product);
    this.addLog(`เพิ่มสินค้า: ${name}`, 'success');
    await this.save();
    this.renderProducts();
    this.closeAllModals();
    showToast(`เพิ่มสินค้า "${name}" สำเร็จ`, 'success');
  },

  // ===== Characters =====
  renderCharacters() {
    const list = document.getElementById('characters-list');
    const count = document.getElementById('characters-count');
    if (!list) return;

    const characters = this.warehouse.characters || [];
    if (count) count.textContent = characters.length;

    if (characters.length === 0) {
      list.innerHTML = '<div class="empty-state">ยังไม่มีตัวละคร</div>';
      return;
    }

    list.innerHTML = characters.map(c => `
      <div class="warehouse-item" data-id="${c.id}">
        <div class="warehouse-item-image">
          ${c.image ? `<img src="${c.image}" alt="${c.name}">` : '<div class="no-image">👤</div>'}
        </div>
        <div class="warehouse-item-info">
          <div class="warehouse-item-name">${this.escapeHtml(c.name)}</div>
        </div>
        <button class="btn-icon btn-delete-item" data-type="characters" data-id="${c.id}" title="ลบ">🗑️</button>
      </div>
    `).join('');

    this.bindDeleteButtons();
  },

  async saveCharacter() {
    const name = document.getElementById('input-character-name')?.value.trim();
    if (!name) { showToast('กรุณากรอกชื่อตัวละคร', 'error'); return; }

    const character = {
      id: 'wc_' + Date.now(),
      name,
      image: this.tempImage || null,
      createdAt: new Date().toISOString(),
    };

    this.warehouse.characters.push(character);
    this.addLog(`เพิ่มตัวละคร: ${name}`, 'success');
    await this.save();
    this.renderCharacters();
    this.closeAllModals();
    showToast(`เพิ่มตัวละคร "${name}" สำเร็จ`, 'success');
  },

  // ===== Backgrounds =====
  renderBackgrounds() {
    const list = document.getElementById('backgrounds-list');
    const count = document.getElementById('backgrounds-count');
    if (!list) return;

    const backgrounds = this.warehouse.backgrounds || [];
    if (count) count.textContent = backgrounds.length;

    if (backgrounds.length === 0) {
      list.innerHTML = '<div class="empty-state">ยังไม่มีฉากหลัง</div>';
      return;
    }

    list.innerHTML = backgrounds.map(b => `
      <div class="warehouse-item" data-id="${b.id}">
        <div class="warehouse-item-image">
          ${b.image ? `<img src="${b.image}" alt="${b.name}">` : '<div class="no-image">🖼️</div>'}
        </div>
        <div class="warehouse-item-info">
          <div class="warehouse-item-name">${this.escapeHtml(b.name)}</div>
        </div>
        <button class="btn-icon btn-delete-item" data-type="backgrounds" data-id="${b.id}" title="ลบ">🗑️</button>
      </div>
    `).join('');

    this.bindDeleteButtons();
  },

  async saveBackground() {
    const name = document.getElementById('input-background-name')?.value.trim();
    if (!name) { showToast('กรุณากรอกชื่อฉากหลัง', 'error'); return; }

    const background = {
      id: 'wb_' + Date.now(),
      name,
      image: this.tempImage || null,
      createdAt: new Date().toISOString(),
    };

    this.warehouse.backgrounds.push(background);
    this.addLog(`เพิ่มฉากหลัง: ${name}`, 'success');
    await this.save();
    this.renderBackgrounds();
    this.closeAllModals();
    showToast(`เพิ่มฉากหลัง "${name}" สำเร็จ`, 'success');
  },

  // ===== Delete =====
  bindDeleteButtons() {
    document.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', async () => {
        const type = btn.dataset.type;
        const id = btn.dataset.id;
        const item = this.warehouse[type].find(i => i.id === id);
        if (!item) return;

        if (!confirm(`ลบ "${item.name}" ?`)) return;

        this.warehouse[type] = this.warehouse[type].filter(i => i.id !== id);
        this.addLog(`ลบ ${type === 'products' ? 'สินค้า' : type === 'characters' ? 'ตัวละคร' : 'ฉากหลัง'}: ${item.name}`, 'warning');
        await this.save();
        this.renderAll();
        showToast(`ลบ "${item.name}" แล้ว`, 'info');
      });
    });
  },

  // ===== Export/Import =====
  exportWarehouse() {
    const data = {
      products: this.warehouse.products,
      characters: this.warehouse.characters,
      backgrounds: this.warehouse.backgrounds,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vedia_warehouse_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.addLog('Export warehouse สำเร็จ', 'success');
    showToast('Export สำเร็จ', 'success');
  },

  async importWarehouse(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.products) this.warehouse.products = [...this.warehouse.products, ...data.products];
      if (data.characters) this.warehouse.characters = [...this.warehouse.characters, ...data.characters];
      if (data.backgrounds) this.warehouse.backgrounds = [...this.warehouse.backgrounds, ...data.backgrounds];

      this.addLog(`Import warehouse สำเร็จ (${data.products?.length || 0} สินค้า, ${data.characters?.length || 0} ตัวละคร, ${data.backgrounds?.length || 0} ฉากหลัง)`, 'success');
      await this.save();
      this.renderAll();
      showToast('Import สำเร็จ', 'success');
    } catch (err) {
      showToast('ไฟล์ JSON ไม่ถูกต้อง', 'error');
    }

    e.target.value = '';
  },

  // ===== Helpers =====
  async save() {
    await Storage.saveWarehouse(this.warehouse);
  },

  addLog(message, type) {
    const entry = Logger.addLog(message, type);
    if (!this.warehouse.activityLog) this.warehouse.activityLog = [];
    this.warehouse.activityLog.unshift(entry);
    if (this.warehouse.activityLog.length > 50) {
      this.warehouse.activityLog = this.warehouse.activityLog.slice(0, 50);
    }
  },

  handleImagePreview(e, previewId) {
    const file = e.target.files?.[0];
    const preview = document.getElementById(previewId);
    if (!file || !preview) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      this.tempImage = ev.target.result;
      preview.innerHTML = `<img src="${ev.target.result}" style="max-width:100%;max-height:120px;border-radius:8px;margin-top:8px;">`;
    };
    reader.readAsDataURL(file);
  },

  openModal(modalId) {
    this.tempImage = null;
    // เคลียร์ inputs
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.querySelectorAll('input[type="text"], textarea').forEach(i => i.value = '');
      modal.querySelectorAll('input[type="file"]').forEach(i => i.value = '');
      modal.querySelectorAll('.image-preview').forEach(i => i.innerHTML = '');
      modal.classList.remove('hidden');
    }
  },

  closeAllModals() {
    this.tempImage = null;
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};
