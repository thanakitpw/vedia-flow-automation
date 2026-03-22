// ===== Vedia Flow - Settings Tab =====

const TabSettings = {
  currentProvider: 'openrouter',

  async init() {
    // โหลด settings ที่บันทึกไว้
    const settings = await Storage.getSettings();
    this.currentProvider = settings.aiProvider || 'openrouter';

    // ใส่ค่า API keys
    this.setInputValue('api-key-openrouter', settings.apiKeys?.openrouter);
    this.setInputValue('api-key-gemini', settings.apiKeys?.gemini);
    this.setInputValue('api-key-claude', settings.apiKeys?.claude);
    this.setInputValue('api-key-openai', settings.apiKeys?.openai);

    // Populate OpenRouter models
    this.populateOpenRouterModels(settings.openrouterModel);

    // ตั้ง active provider
    this.switchProvider(this.currentProvider);

    // Event listeners
    this.setupEvents();
  },

  // ===== Events =====
  setupEvents() {
    // ปุ่มเลือก provider
    document.querySelectorAll('.provider-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchProvider(btn.dataset.provider);
      });
    });

    // ปุ่ม Save
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      this.saveSettings();
    });

    // ปุ่ม Test Connection
    document.getElementById('btn-test-connection')?.addEventListener('click', () => {
      this.testConnection();
    });
  },

  // ===== สลับ Provider =====
  switchProvider(provider) {
    this.currentProvider = provider;

    // อัพเดท active button
    document.querySelectorAll('.provider-btn').forEach(btn => {
      if (btn.dataset.provider === provider) {
        btn.classList.remove('btn-ghost');
        btn.classList.add('btn-primary');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-ghost');
      }
    });

    // แสดง/ซ่อน sections
    document.querySelectorAll('.provider-section').forEach(section => {
      section.classList.add('hidden');
    });
    const activeSection = document.getElementById(`section-${provider}`);
    if (activeSection) activeSection.classList.remove('hidden');
  },

  // ===== Populate OpenRouter Models =====
  populateOpenRouterModels(selectedModel) {
    const select = document.getElementById('openrouter-model');
    if (!select) return;

    select.innerHTML = '';

    // Free models
    const freeGroup = document.createElement('optgroup');
    freeGroup.label = '🆓 Free Models';

    OPENROUTER_FREE_MODELS.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = `${model.name}${model.vision ? ' 👁️' : ''}`;
      if (model.id === selectedModel) option.selected = true;
      freeGroup.appendChild(option);
    });

    select.appendChild(freeGroup);
  },

  // ===== Save Settings =====
  async saveSettings() {
    const settings = await Storage.getSettings();

    settings.aiProvider = this.currentProvider;
    settings.apiKeys = {
      openrouter: this.getInputValue('api-key-openrouter'),
      gemini: this.getInputValue('api-key-gemini'),
      claude: this.getInputValue('api-key-claude'),
      openai: this.getInputValue('api-key-openai'),
    };
    settings.openrouterModel = document.getElementById('openrouter-model')?.value || '';

    await Storage.saveSettings(settings);
    showToast('บันทึก API Keys สำเร็จ', 'success');
  },

  // ===== Test Connection =====
  async testConnection() {
    const settings = await Storage.getSettings();
    const provider = this.currentProvider;
    const apiKey = this.getInputValue(`api-key-${provider}`);

    if (!apiKey) {
      showToast('กรุณากรอก API Key ก่อน', 'error');
      return;
    }

    const resultDiv = document.getElementById('test-result');
    if (resultDiv) {
      resultDiv.classList.remove('hidden');
      resultDiv.style.background = 'var(--info-bg)';
      resultDiv.style.color = 'var(--info)';
      resultDiv.textContent = '⏳ กำลังทดสอบการเชื่อมต่อ...';
    }

    try {
      const model = provider === 'openrouter'
        ? (document.getElementById('openrouter-model')?.value || '')
        : '';

      const ai = createAIProvider(provider, apiKey, model);
      const result = await ai.testConnection();

      if (resultDiv) {
        if (result.success) {
          resultDiv.style.background = 'var(--success-bg)';
          resultDiv.style.color = 'var(--success)';
          resultDiv.textContent = `✅ ${result.message}`;
        } else {
          resultDiv.style.background = 'var(--error-bg)';
          resultDiv.style.color = 'var(--error)';
          resultDiv.textContent = `❌ ${result.message}`;
        }
      }

      showToast(result.success ? 'เชื่อมต่อสำเร็จ!' : 'เชื่อมต่อไม่สำเร็จ', result.success ? 'success' : 'error');
    } catch (err) {
      if (resultDiv) {
        resultDiv.style.background = 'var(--error-bg)';
        resultDiv.style.color = 'var(--error)';
        resultDiv.textContent = `❌ Error: ${err.message}`;
      }
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  },

  // ===== Helpers =====
  getInputValue(id) {
    return document.getElementById(id)?.value?.trim() || '';
  },

  setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.value = value;
  },
};
