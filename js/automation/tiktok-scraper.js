// ===== Vedia Flow - TikTok Studio Product Scraper =====
// ดึงข้อมูลสินค้าจากหน้า TikTok Studio ด้วย DOM scraping (รองรับหลายหน้า)

const TikTokScraper = {
  // ตรวจสอบว่าอยู่หน้า TikTok Studio หรือไม่
  async checkTikTokStudio() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) return { ok: false, message: 'ไม่พบ tab ที่เปิดอยู่' };

      if (!tab.url.includes('tiktok.com')) {
        return { ok: false, message: 'กรุณาเปิด TikTok Studio ก่อน (tiktok.com/tiktokstudio)' };
      }
      return { ok: true, tab };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  },

  // ดึงสินค้าจากหน้าปัจจุบัน (1 หน้า)
  async scrapeCurrentPage(tabId) {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // ฟังก์ชันแปลง img element เป็น base64
        function imgToBase64(imgEl) {
          if (!imgEl || !imgEl.complete || imgEl.naturalWidth === 0) return null;
          try {
            const canvas = document.createElement('canvas');
            canvas.width = imgEl.naturalWidth;
            canvas.height = imgEl.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgEl, 0, 0);
            return canvas.toDataURL('image/jpeg', 0.85);
          } catch (e) {
            // CORS error → return URL แทน
            return imgEl.src || null;
          }
        }

        const products = [];

        // ===== กลยุทธ์ 1: อ่าน header ก่อนเพื่อหาว่า column ไหนคืออะไร =====
        const table = document.querySelector('table');
        if (table) {
          const headers = Array.from(table.querySelectorAll('th, thead td')).map(th => th.textContent.trim().toLowerCase());
          const rows = table.querySelectorAll('tbody tr');

          // หา index ของแต่ละ column
          const colIndex = {
            name: -1,
            productId: -1,
            price: -1,
            stock: -1,
            status: -1,
          };

          headers.forEach((h, i) => {
            if (h.includes('product id') || h.includes('productid') || h.includes('รหัส')) colIndex.productId = i;
            else if (h.includes('product') || h.includes('สินค้า') || h.includes('name') || h.includes('ชื่อ')) colIndex.name = i;
            else if (h.includes('price') || h.includes('ราคา')) colIndex.price = i;
            else if (h.includes('stock') || h.includes('inventory') || h.includes('สต็อก') || h.includes('คลัง')) colIndex.stock = i;
            else if (h.includes('status') || h.includes('สถานะ')) colIndex.status = i;
          });

          rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 2) return;

            // ดึงชื่อสินค้า
            let name = '';
            if (colIndex.name >= 0 && cells[colIndex.name]) {
              name = cells[colIndex.name].textContent.trim();
            }
            // Fallback: หาจาก cell ที่มี text ยาวที่สุด (มักเป็นชื่อสินค้า)
            if (!name) {
              let longestText = '';
              cells.forEach(cell => {
                const text = cell.textContent.trim();
                if (text.length > longestText.length && !/^\d+$/.test(text) && !text.includes('฿')) {
                  longestText = text;
                }
              });
              name = longestText;
            }
            if (!name) return;

            // ดึง Product ID
            let productId = '';
            if (colIndex.productId >= 0 && cells[colIndex.productId]) {
              productId = cells[colIndex.productId].textContent.trim();
            }
            // Fallback: หาตัวเลขยาวๆ (17+ หลัก = TikTok Product ID)
            if (!productId) {
              cells.forEach(cell => {
                const text = cell.textContent.trim();
                if (/^\d{10,}$/.test(text)) productId = text;
              });
            }
            if (!productId) {
              const linkEl = row.querySelector('a[href*="product"]');
              if (linkEl) {
                const match = linkEl.href.match(/product\/(\d+)/);
                if (match) productId = match[1];
              }
            }
            if (!productId) productId = `tiktok_${Date.now()}_${index}`;

            // ดึงราคา
            let price = 0;
            if (colIndex.price >= 0 && cells[colIndex.price]) {
              price = parseFloat(cells[colIndex.price].textContent.replace(/[^\d.]/g, '')) || 0;
            }
            // Fallback: หา cell ที่มี ฿
            if (!price) {
              cells.forEach(cell => {
                const text = cell.textContent;
                if (text.includes('฿') || text.includes('$')) {
                  price = parseFloat(text.replace(/[^\d.]/g, '')) || 0;
                }
              });
            }

            // ดึง Stock
            let stock = 0;
            if (colIndex.stock >= 0 && cells[colIndex.stock]) {
              stock = parseInt(cells[colIndex.stock].textContent.replace(/[^\d]/g, '')) || 0;
            }

            // ดึง Status
            let status = 'unknown';
            if (colIndex.status >= 0 && cells[colIndex.status]) {
              status = cells[colIndex.status].textContent.trim();
            }
            // Fallback: หา badge/tag ที่มีคำว่า Active, Live, etc.
            if (status === 'unknown') {
              const badge = row.querySelector('[class*="badge"], [class*="tag"], [class*="status"]');
              if (badge) status = badge.textContent.trim();
            }

            // ดึงรูปสินค้า (แปลงเป็น base64 เลย)
            const imgEl = row.querySelector('img.product-image, img');
            const image = imgToBase64(imgEl);

            products.push({
              id: productId,
              name,
              price,
              stock,
              status,
              productImages: image ? [image] : [],
            });
          });
        }

        // ===== กลยุทธ์ 2: ไม่มี table → หาจาก card/list layout =====
        if (products.length === 0) {
          const cards = document.querySelectorAll('[class*="product"], [class*="showcase"], [class*="goods"], [class*="item"]');
          cards.forEach((card, index) => {
            const name = card.querySelector('[class*="name"], [class*="title"], h3, h4, span')?.textContent?.trim();
            if (!name) return;

            const imgEl = card.querySelector('img');
            const img = imgToBase64(imgEl);
            const priceText = card.querySelector('[class*="price"]')?.textContent || '';
            const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;

            // หา Product ID จากตัวเลขยาว
            let productId = '';
            card.querySelectorAll('span, div, td').forEach(el => {
              const text = el.textContent.trim();
              if (/^\d{10,}$/.test(text)) productId = text;
            });
            if (!productId) productId = `tiktok_${Date.now()}_${index}`;

            const stockText = card.querySelector('[class*="stock"], [class*="inventory"]')?.textContent || '0';
            const stock = parseInt(stockText.replace(/[^\d]/g, '')) || 0;

            const status = card.querySelector('[class*="status"], [class*="badge"]')?.textContent?.trim() || 'unknown';

            products.push({
              id: productId,
              name,
              price,
              stock,
              status,
              productImages: img ? [img] : [],
            });
          });
        }

        return products.filter(p => p.name);
      },
    });

    return results?.[0]?.result || [];
  },

  // กดปุ่มหน้าถัดไป → return true ถ้ากดได้, false ถ้าเป็นหน้าสุดท้าย
  async goToNextPage(tabId) {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // หาปุ่ม Next (ลูกศร >) หลายแบบ
        const nextSelectors = [
          // ปุ่ม > ถัดไป
          'button[aria-label="Next"], button[aria-label="next"]',
          'li.next > button, li.next > a',
          '[class*="next"] button, [class*="Next"] button',
          'button[class*="next"], a[class*="next"]',
        ];

        for (const sel of nextSelectors) {
          const btns = document.querySelectorAll(sel);
          for (const btn of btns) {
            if (!btn.disabled && btn.getBoundingClientRect().width > 0) {
              btn.click();
              return { success: true };
            }
          }
        }

        // Fallback: หาปุ่มที่มี > หรือ › ในข้อความ
        const allBtns = document.querySelectorAll('button, a[role="button"]');
        for (const btn of allBtns) {
          const text = btn.textContent.trim();
          // ปุ่ม > arrow ที่อยู่ใน pagination
          if ((text === '>' || text === '›' || text === '→' || text === 'Next') && !btn.disabled) {
            const pagination = btn.closest('[class*="paginat"], [class*="Paginat"], nav, ul');
            if (pagination) {
              btn.click();
              return { success: true };
            }
          }
        }

        // Fallback 2: หา pagination buttons แล้วกดตัวถัดไป
        const pageButtons = document.querySelectorAll('[class*="paginat"] button, [class*="paginat"] a, nav button, nav a');
        let foundActive = false;
        for (const btn of pageButtons) {
          if (foundActive && !btn.disabled) {
            // ตรวจว่าเป็นตัวเลข (ไม่ใช่ปุ่ม < >)
            const text = btn.textContent.trim();
            if (/^\d+$/.test(text)) {
              btn.click();
              return { success: true };
            }
          }
          // หา active page
          if (btn.classList.contains('active') || btn.getAttribute('aria-current') === 'page'
              || btn.closest('.active') || btn.closest('[class*="active"]')) {
            foundActive = true;
          }
        }

        return { success: false };
      },
    });

    return results?.[0]?.result?.success || false;
  },

  // ดึงจำนวนหน้าทั้งหมด
  async getTotalPages(tabId) {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // หาปุ่ม pagination ที่เป็นตัวเลข
        const pageButtons = document.querySelectorAll('[class*="paginat"] button, [class*="paginat"] a, nav button, nav a');
        let maxPage = 1;

        for (const btn of pageButtons) {
          const text = btn.textContent.trim();
          const num = parseInt(text);
          if (!isNaN(num) && num > maxPage) {
            maxPage = num;
          }
        }

        return maxPage;
      },
    });

    return results?.[0]?.result || 1;
  },

  // ดึงสินค้าทุกหน้า (main function)
  async scrapeProducts() {
    const check = await this.checkTikTokStudio();
    if (!check.ok) {
      showToast(check.message, 'error');
      return [];
    }

    const tabId = check.tab.id;

    try {
      // ดึงจำนวนหน้า
      const totalPages = await this.getTotalPages(tabId);
      Logger.addLog(`พบ ${totalPages} หน้า กำลังดึงสินค้าทุกหน้า...`, 'info');

      let allProducts = [];

      // ดึงหน้าแรก
      const page1 = await this.scrapeCurrentPage(tabId);
      allProducts = [...allProducts, ...page1];
      Logger.addLog(`หน้า 1/${totalPages}: พบ ${page1.length} สินค้า`, 'info');

      // ดึงหน้าถัดไป
      for (let page = 2; page <= totalPages; page++) {
        // กดหน้าถัดไป
        const hasNext = await this.goToNextPage(tabId);
        if (!hasNext) {
          Logger.addLog(`ไม่สามารถไปหน้า ${page} ได้`, 'warning');
          break;
        }

        // รอหน้าโหลด
        await new Promise(resolve => setTimeout(resolve, 2000));

        // ดึงสินค้าหน้านี้
        const pageProducts = await this.scrapeCurrentPage(tabId);
        allProducts = [...allProducts, ...pageProducts];
        Logger.addLog(`หน้า ${page}/${totalPages}: พบ ${pageProducts.length} สินค้า`, 'info');
      }

      // ลบ duplicate (ตาม id)
      const seen = new Set();
      allProducts = allProducts.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      if (allProducts.length === 0) {
        showToast('ไม่พบสินค้า - กรุณาเปิดหน้า Product Management ใน TikTok Studio', 'warning');
      } else {
        Logger.addLog(`ดึงสินค้าเสร็จ: รวม ${allProducts.length} รายการ (${totalPages} หน้า)`, 'success');
      }

      return allProducts;

    } catch (err) {
      console.error('Scrape error:', err);
      showToast(`ดึงสินค้าไม่สำเร็จ: ${err.message}`, 'error');
      return [];
    }
  },
};
