// ===== Vedia Flow - License Authentication =====

const Auth = {
  // Google Apps Script endpoint (เปลี่ยนเป็น URL จริงเมื่อ deploy)
  SCRIPT_URL: '',

  // เริ่มต้นระบบ auth
  async init() {
    const overlay = document.getElementById('auth-overlay');
    const btnLogin = document.getElementById('btn-login');
    const keyInput = document.getElementById('license-key-input');
    const deviceDisplay = document.getElementById('display-device-id');

    // สร้าง/ดึง Device ID
    const settings = await Storage.getSettings();
    let deviceId = settings.deviceId;
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      settings.deviceId = deviceId;
      await Storage.saveSettings(settings);
    }

    // แสดง Device ID (ย่อ)
    if (deviceDisplay) {
      deviceDisplay.textContent = deviceId.substring(0, 8) + '...';
    }

    // ถ้ายังไม่ได้ตั้ง SCRIPT_URL → ข้าม auth (dev mode)
    if (!this.SCRIPT_URL) {
      console.log('⚠️ Dev Mode: ข้าม license verification');
      if (overlay) overlay.classList.add('hidden');
      return;
    }

    // ตรวจสอบ license key ที่บันทึกไว้
    const savedKey = settings.licenseKey;
    if (savedKey) {
      this.verifyKey(savedKey, deviceId, true);
    }

    // ปุ่ม login
    if (btnLogin) {
      btnLogin.addEventListener('click', () => {
        const key = keyInput.value.trim();
        if (!key) {
          showToast('กรุณากรอก License Key', 'error');
          return;
        }
        btnLogin.textContent = 'กำลังตรวจสอบ...';
        btnLogin.disabled = true;
        this.verifyKey(key, deviceId, false);
      });
    }

    // กด Enter เพื่อ login
    if (keyInput) {
      keyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnLogin?.click();
      });
    }
  },

  // ตรวจสอบ license key กับ server
  async verifyKey(key, deviceId, isAutoVerify) {
    const overlay = document.getElementById('auth-overlay');
    const btnLogin = document.getElementById('btn-login');
    const msgDiv = document.getElementById('login-msg');

    try {
      const url = `${this.SCRIPT_URL}?key=${encodeURIComponent(key)}&deviceId=${encodeURIComponent(deviceId)}`;
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        credentials: 'omit',
      });
      const data = await response.json();

      if (data.success) {
        // บันทึก key
        const settings = await Storage.getSettings();
        settings.licenseKey = key;
        await Storage.saveSettings(settings);

        // ซ่อน overlay
        if (overlay) overlay.classList.add('hidden');

        // อัพเดท expiry badge
        this.updateExpireUI(data.expire);

        const expireText = data.expire || 'ระบบกำลังตรวจสอบ';
        showToast(`ยินดีต้อนรับ! หมดอายุ: ${expireText}`, 'success');
      } else {
        this.handleAuthFail(data.message, isAutoVerify, overlay, msgDiv, btnLogin);
      }
    } catch (err) {
      console.error('Auth Error:', err);
      this.handleAuthFail('เชื่อมต่อ Server ไม่ได้', isAutoVerify, overlay, msgDiv, btnLogin);
    }
  },

  // จัดการ auth ล้มเหลว
  handleAuthFail(message, isAutoVerify, overlay, msgDiv, btnLogin) {
    if (isAutoVerify) {
      // Auto verify ล้มเหลว → แสดง overlay
      if (overlay) overlay.classList.remove('hidden');
      this.forceLogout();
    } else {
      if (msgDiv) msgDiv.textContent = message;
      if (btnLogin) {
        btnLogin.textContent = 'เข้าสู่ระบบ';
        btnLogin.disabled = false;
        btnLogin.classList.add('shake');
        setTimeout(() => btnLogin.classList.remove('shake'), 500);
      }
      showToast(message, 'error');
    }
  },

  // Force logout
  async forceLogout() {
    const settings = await Storage.getSettings();
    settings.licenseKey = '';
    await Storage.saveSettings(settings);

    const overlay = document.getElementById('auth-overlay');
    const btnLogin = document.getElementById('btn-login');
    if (overlay) overlay.classList.remove('hidden');
    if (btnLogin) {
      btnLogin.textContent = 'เข้าสู่ระบบ';
      btnLogin.disabled = false;
    }
  },

  // อัพเดท expiry badge ใน header
  updateExpireUI(expireStr) {
    const badge = document.getElementById('expire-badge');
    const textSpan = document.getElementById('expire-text');
    if (!badge || !textSpan) return;

    badge.style.display = 'flex';

    if (expireStr === 'Lifetime') {
      badge.className = 'expire-badge lifetime';
      textSpan.textContent = 'VIP ถาวร';
      return;
    }

    // คำนวณวันที่เหลือ
    let expDate;
    if (expireStr && expireStr.includes('/')) {
      const parts = expireStr.split('/');
      expDate = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
      expDate = new Date(expireStr);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      badge.className = 'expire-badge danger';
      textSpan.textContent = 'หมดอายุแล้ว';
    } else if (diffDays <= 7) {
      badge.className = 'expire-badge warning';
      textSpan.textContent = `เหลือ ${diffDays} วัน`;
    } else {
      badge.className = 'expire-badge safe';
      textSpan.textContent = `เหลือ ${diffDays} วัน`;
    }
  },
};
