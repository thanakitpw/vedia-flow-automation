// ===== Vedia Flow - Scheduler =====
// ตั้งเวลาลงคลิปอัตโนมัติ (เช่น ทุก 1 ชม.)

const Scheduler = {
  countdownInterval: null,

  // เริ่ม schedule
  async start(intervalMinutes, totalRows) {
    const scheduler = {
      enabled: true,
      intervalMinutes,
      nextRunAt: new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString(),
      currentRowIndex: 0,
      totalRows,
      mode: 'full',
    };

    await Storage.saveScheduler(scheduler);

    // ตั้ง chrome alarm
    await chrome.alarms.create('vedia-scheduler', {
      delayInMinutes: intervalMinutes,
      periodInMinutes: intervalMinutes,
    });

    Logger.addLog(`เริ่ม Schedule: ลงทุก ${intervalMinutes} นาที (${totalRows} สินค้า)`, 'success');
    showToast(`ตั้งเวลาลงทุก ${intervalMinutes} นาที`, 'success');

    this.startCountdown();
  },

  // หยุด schedule
  async stop() {
    const scheduler = await Storage.getScheduler();
    scheduler.enabled = false;
    await Storage.saveScheduler(scheduler);

    await chrome.alarms.clear('vedia-scheduler');

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    Logger.addLog('หยุด Schedule แล้ว', 'warning');
    showToast('หยุดตั้งเวลาแล้ว', 'info');
  },

  // รับ trigger จาก alarm (เรียกจาก background.js)
  async onTrigger(rows, settings, callbacks) {
    const scheduler = await Storage.getScheduler();
    if (!scheduler.enabled) return;

    const currentIndex = scheduler.currentRowIndex;

    if (currentIndex >= rows.length) {
      Logger.addLog('Schedule เสร็จสิ้น! ครบทุกสินค้าแล้ว', 'success');
      await this.stop();
      return;
    }

    Logger.addLog(`Schedule: รันสินค้า #${currentIndex + 1}`, 'info');

    // รันแค่ 1 สินค้า
    const singleRow = [rows[currentIndex]];
    await FlowRunner.runFullFlow(singleRow, { ...settings, startRow: 0 }, callbacks);

    // อัพเดท index
    scheduler.currentRowIndex = currentIndex + 1;
    scheduler.nextRunAt = new Date(Date.now() + scheduler.intervalMinutes * 60 * 1000).toISOString();
    await Storage.saveScheduler(scheduler);

    this.startCountdown();
  },

  // แสดง countdown
  startCountdown() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    const countdownEl = document.getElementById('scheduler-countdown');
    if (!countdownEl) return;

    this.countdownInterval = setInterval(async () => {
      const scheduler = await Storage.getScheduler();
      if (!scheduler.enabled || !scheduler.nextRunAt) {
        countdownEl.textContent = '';
        clearInterval(this.countdownInterval);
        return;
      }

      const nextRun = new Date(scheduler.nextRunAt);
      const now = new Date();
      const diffMs = nextRun - now;

      if (diffMs <= 0) {
        countdownEl.textContent = 'กำลังรัน...';
        return;
      }

      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      countdownEl.textContent = `คลิปถัดไปใน ${minutes}:${String(seconds).padStart(2, '0')} (สินค้า #${scheduler.currentRowIndex + 1}/${scheduler.totalRows})`;
    }, 1000);
  },

  // ตรวจสอบว่ามี schedule ค้างอยู่ไหม (resume หลังปิดเปิด)
  async checkPending() {
    const scheduler = await Storage.getScheduler();
    if (scheduler.enabled) {
      this.startCountdown();
      return true;
    }
    return false;
  },
};

// รับ message จาก background.js เมื่อ alarm trigger
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'schedulerTrigger') {
    // Tab Video Gen จะ handle เอง
    Logger.addLog('Scheduler trigger received', 'info');
  }
});
