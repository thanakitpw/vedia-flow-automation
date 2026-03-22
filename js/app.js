// ===== Vedia Flow - App Bootstrap =====

const App = {
  currentTab: 'settings',

  // เริ่มต้นแอป
  async init() {
    // โหลด theme
    await this.loadTheme();

    // เริ่มระบบ auth
    await Auth.init();

    // ตั้ง event listeners
    this.setupTabNavigation();
    this.setupThemeToggle();
    this.setupHeaderSettings();

    // โหลด tab แรก
    await this.loadTab('settings');

    console.log('✅ Vedia Flow Automation พร้อมใช้งาน');
  },

  // ===== Tab Navigation =====
  setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        if (tabName === this.currentTab) return;

        // อัพเดท active state
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // โหลด tab
        this.loadTab(tabName);
      });
    });
  },

  // โหลด tab content
  async loadTab(tabName) {
    const container = document.getElementById('tab-content');
    if (!container) return;

    this.currentTab = tabName;

    // แสดง loading
    container.innerHTML = '<div class="loading"><div class="spinner"></div>กำลังโหลด...</div>';

    try {
      // โหลด HTML ของ tab
      const response = await fetch(`html/tab-${tabName}.html`);
      if (!response.ok) {
        container.innerHTML = `<div class="empty-state">ยังไม่มีเนื้อหาสำหรับ tab นี้</div>`;
        return;
      }
      const html = await response.text();
      container.innerHTML = html;

      // Init tab-specific JS
      await this.initTab(tabName);

    } catch (err) {
      console.error(`โหลด tab ${tabName} ไม่สำเร็จ:`, err);
      container.innerHTML = `<div class="empty-state">เกิดข้อผิดพลาดในการโหลด</div>`;
    }
  },

  // Init logic สำหรับแต่ละ tab
  async initTab(tabName) {
    switch (tabName) {
      case 'settings':
        if (typeof TabSettings !== 'undefined') await TabSettings.init();
        break;
      case 'tiktok-products':
        if (typeof TabTikTokProducts !== 'undefined') await TabTikTokProducts.init();
        break;
      case 'warehouse':
        if (typeof TabWarehouse !== 'undefined') await TabWarehouse.init();
        break;
      case 'video-gen':
        if (typeof TabVideoGen !== 'undefined') await TabVideoGen.init();
        break;
      case 'advanced-video':
        if (typeof TabAdvancedVideo !== 'undefined') await TabAdvancedVideo.init();
        break;
      case 'channel-builder':
        if (typeof TabChannelBuilder !== 'undefined') await TabChannelBuilder.init();
        break;
    }
  },

  // ===== Theme =====
  async loadTheme() {
    const settings = await Storage.getSettings();
    const theme = settings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    this.updateThemeIcon(theme);
  },

  setupThemeToggle() {
    const btnTheme = document.getElementById('btn-theme');
    if (!btnTheme) return;

    btnTheme.addEventListener('click', async () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', next);
      this.updateThemeIcon(next);

      // บันทึก
      const settings = await Storage.getSettings();
      settings.theme = next;
      await Storage.saveSettings(settings);

      showToast(`สลับเป็น ${next === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
    });
  },

  updateThemeIcon(theme) {
    const btnTheme = document.getElementById('btn-theme');
    if (btnTheme) {
      btnTheme.textContent = theme === 'dark' ? '🌙' : '☀️';
      btnTheme.title = theme === 'dark' ? 'สลับเป็น Light Mode' : 'สลับเป็น Dark Mode';
    }
  },

  // ===== Header Settings =====
  setupHeaderSettings() {
    const btnSettings = document.getElementById('btn-settings-header');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => {
        // สลับไปที่ Settings tab
        const settingsBtn = document.querySelector('.tab-btn[data-tab="settings"]');
        if (settingsBtn) settingsBtn.click();
      });
    }
  },
};

// เริ่มต้นเมื่อ DOM พร้อม
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
