// ===== Vedia Flow - Progress Overlay =====
// แสดง progress overlay บนหน้า Google Flow / TikTok

const ProgressOverlay = {
  // แสดง/อัพเดท overlay
  async show(tabId, { step, totalSteps, currentStep, productName, message }) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (data) => {
        const overlayId = 'vedia-progress-overlay';
        let overlay = document.getElementById(overlayId);

        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = overlayId;
          overlay.style.cssText = `
            position:fixed; top:0; left:0; width:100vw; height:100vh;
            background:rgba(0,0,0,0.6); backdrop-filter:blur(3px);
            z-index:2147483647; display:flex; align-items:center;
            justify-content:center; font-family:'Noto Sans Thai',sans-serif;
          `;
          // Block events
          ['click', 'mousedown', 'mouseup', 'keydown', 'wheel'].forEach(evt => {
            overlay.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); }, true);
          });
          document.body.appendChild(overlay);
        }

        const pct = Math.round((data.currentStep / data.totalSteps) * 100);
        overlay.innerHTML = `
          <div style="background:#18181b; padding:30px 40px; border-radius:16px; border:1px solid #6366f1; text-align:center; min-width:300px; max-width:400px;">
            <div style="font-size:12px; color:#888; margin-bottom:6px;">🤖 VEDIA FLOW AUTOMATION</div>
            <div style="font-size:16px; color:#fff; font-weight:700; margin-bottom:4px;">
              ขั้นตอนที่ ${data.currentStep}/${data.totalSteps}
            </div>
            <div style="font-size:13px; color:#a78bfa; margin-bottom:12px;">${data.step || ''}</div>
            <div style="background:#333; border-radius:8px; height:8px; margin:12px 0; overflow:hidden;">
              <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6); height:100%; width:${pct}%; transition:width 0.5s;"></div>
            </div>
            <div style="font-size:12px; color:#aaa; margin:6px 0;">${data.productName || ''}</div>
            <div style="font-size:11px; color:#4ade80; margin:4px 0;">${data.message || ''}</div>
            <div style="font-size:10px; color:#555; margin-top:10px;">⚠️ กรุณาอย่าคลิกหน้าเว็บ</div>
          </div>
        `;
      },
      args: [{ step, totalSteps, currentStep, productName, message }],
    });
  },

  // ซ่อน overlay
  async hide(tabId) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const overlay = document.getElementById('vedia-progress-overlay');
        if (overlay) {
          overlay.style.transition = 'opacity 0.3s';
          overlay.style.opacity = '0';
          setTimeout(() => overlay.remove(), 300);
        }
      },
    });
  },
};
