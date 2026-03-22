// ===== Vedia Flow - Image Utilities =====

const ImageUtils = {
  // แปลง File เป็น DataURL
  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // แปลง DataURL เป็น Blob
  dataUrlToBlob(dataUrl) {
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeType = dataUrl.match(/^data:(.*?);/)?.[1] || 'image/jpeg';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
  },

  // แปลง URL เป็น base64 DataURL (ใช้ inject เข้า tab ของ Google Flow)
  async urlToDataUrl(tabId, imageUrl) {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: (url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = this.width;
            canvas.height = this.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(this, 0, 0);
            try {
              resolve(canvas.toDataURL('image/jpeg', 0.9));
            } catch (e) {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = url;
        });
      },
      args: [imageUrl],
    });
    return result?.[0]?.result || null;
  },

  // ตรวจว่าเป็น base64 data URL หรือไม่
  isDataUrl(str) {
    return str && str.startsWith('data:image/');
  },

  // ตรวจว่าเป็น http URL หรือไม่
  isHttpUrl(str) {
    return str && (str.startsWith('http://') || str.startsWith('https://'));
  },

  // เตรียมรูปให้พร้อม paste (แปลง URL เป็น base64 ถ้าจำเป็น)
  async prepareImage(imageSource, tabId) {
    if (!imageSource) return null;

    // ถ้าเป็น base64 อยู่แล้ว → ใช้ได้เลย
    if (this.isDataUrl(imageSource)) return imageSource;

    // ถ้าเป็น URL → แปลงเป็น base64 ผ่าน tab
    if (this.isHttpUrl(imageSource) && tabId) {
      Logger.addLog('แปลง URL เป็น base64...', 'info');
      const dataUrl = await this.urlToDataUrl(tabId, imageSource);
      if (dataUrl) return dataUrl;
      Logger.addLog('แปลง URL ไม่สำเร็จ (CORS)', 'warning');
    }

    return null;
  },

  // ย่อขนาดรูป (เพื่อประหยัดพื้นที่ storage)
  resizeImage(dataUrl, maxWidth = 400) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width <= maxWidth) {
          resolve(dataUrl);
          return;
        }

        const ratio = maxWidth / img.width;
        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    });
  },
};
