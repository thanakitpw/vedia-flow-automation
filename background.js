// Background Service Worker สำหรับ Vedia Flow Automation

// เปิด Side Panel เมื่อคลิก icon
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// ตั้งค่าให้เปิด Side Panel เมื่อคลิก icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('setPanelBehavior error:', error));

// เมื่อติดตั้ง/อัพเดท extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Vedia Flow Automation ติดตั้งสำเร็จ!');
  } else if (details.reason === 'update') {
    console.log('Vedia Flow อัพเดทเป็นเวอร์ชัน', chrome.runtime.getManifest().version);
  }
});

// รับ messages จาก sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getTabInfo') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ tab: tabs[0] });
    });
    return true; // ต้อง return true สำหรับ async sendResponse
  }

  if (message.action === 'openTab') {
    chrome.tabs.create({ url: message.url }, (tab) => {
      sendResponse({ tab });
    });
    return true;
  }

  if (message.action === 'getActiveTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ tab: tabs[0] || null });
    });
    return true;
  }
});

// Rename ไฟล์ที่ download เป็น VEDIA_YYYYMMDD_HHMMSS.ext
chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  const url = downloadItem.url || '';
  const filename = downloadItem.filename || url.split('/').pop() || '';
  const isMedia = /\.(mp4|webm|mov|avi|mkv|jpg|jpeg|png|gif|webp)$/i.test(filename);

  if (isMedia) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // ดึงนามสกุลไฟล์
    let extension = 'mp4';
    const extMatch = filename.match(/\.([^.]+)$/i) || url.match(/\.([^.]+)(?:\?|$)/i);
    if (extMatch) {
      extension = extMatch[1].toLowerCase();
    }

    const newFilename = `VEDIA_${year}${month}${day}_${hours}${minutes}${seconds}.${extension}`;
    suggest({ filename: newFilename });
  } else {
    // ไฟล์ประเภทอื่นใช้ชื่อเดิม
    let safeFilename = downloadItem.filename;
    if (!safeFilename || safeFilename.trim() === '') {
      safeFilename = 'vedia_download_' + Date.now();
    }
    suggest({ filename: safeFilename });
  }
});

// รับ alarm events สำหรับ scheduler (ตั้งเวลาลงคลิป)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'vedia-scheduler') {
    // ส่ง message ไปยัง sidepanel ให้รันคลิปถัดไป
    chrome.runtime.sendMessage({ action: 'schedulerTrigger' }).catch(() => {
      // sidepanel อาจยังไม่เปิด - ไม่ต้องทำอะไร
    });
  }
});
