// ===== Vedia Flow - Storage Manager =====
// จัดการข้อมูลทั้งหมดผ่าน chrome.storage.local

const Storage = {
  // ===== Generic CRUD =====
  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] ?? null);
      });
    });
  },

  async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  },

  async remove(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], resolve);
    });
  },

  // ===== Settings =====
  async getSettings() {
    const settings = await this.get('vedia_settings');
    return settings || {
      aiProvider: 'openrouter',
      apiKeys: { claude: '', openai: '', gemini: '', openrouter: '' },
      openrouterModel: 'nvidia/nemotron-3-super-120b-a12b:free',
      theme: 'dark',
      licenseKey: '',
      deviceId: '',
    };
  },

  async saveSettings(settings) {
    await this.set('vedia_settings', settings);
  },

  // ===== TikTok Products (Tab 2) =====
  async getProducts() {
    return (await this.get('vedia_tiktok_products')) || [];
  },

  async saveProducts(products) {
    await this.set('vedia_tiktok_products', products);
  },

  // ===== Warehouse (Tab 3) =====
  async getWarehouse() {
    const warehouse = await this.get('vedia_warehouse');
    return warehouse || {
      products: [],
      characters: [],
      backgrounds: [],
      activityLog: [],
    };
  },

  async saveWarehouse(warehouse) {
    await this.set('vedia_warehouse', warehouse);
  },

  // ===== Video Gen Table (Tab 4) =====
  async getVideoGenTable() {
    return (await this.get('vedia_video_gen_table')) || [];
  },

  async saveVideoGenTable(table) {
    await this.set('vedia_video_gen_table', table);
  },

  // ===== Advanced Video Table (Tab 5) =====
  async getAdvancedVideoTable() {
    return (await this.get('vedia_advanced_video_table')) || [];
  },

  async saveAdvancedVideoTable(table) {
    await this.set('vedia_advanced_video_table', table);
  },

  // ===== Channel Builder (Tab 6) =====
  async getChannels() {
    return (await this.get('vedia_channels')) || [];
  },

  async saveChannels(channels) {
    await this.set('vedia_channels', channels);
  },

  async getChannelContent(channelId) {
    return (await this.get(`vedia_channel_content_${channelId}`)) || [];
  },

  async saveChannelContent(channelId, content) {
    await this.set(`vedia_channel_content_${channelId}`, content);
  },

  // ===== Scheduler =====
  async getScheduler() {
    const scheduler = await this.get('vedia_scheduler');
    return scheduler || {
      enabled: false,
      intervalMinutes: 60,
      nextRunAt: null,
      currentRowIndex: 0,
      totalRows: 0,
      mode: 'full',
    };
  },

  async saveScheduler(scheduler) {
    await this.set('vedia_scheduler', scheduler);
  },
};
