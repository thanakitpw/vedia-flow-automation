// ===== Vedia Flow - Gemini API Provider =====

class GeminiProvider extends AIProvider {
  constructor(apiKey) {
    super(apiKey, 'gemini-2.0-flash-lite');
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  // เรียก Gemini API
  async callAPI(systemPrompt, userMessage, imageBase64 = null) {
    const model = this.model;
    const url = `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`;

    const parts = [{ text: `${systemPrompt}\n\n${userMessage}` }];

    // ถ้ามีรูปภาพ - ต้องเป็น data URL (base64) เท่านั้น, ข้าม http URL
    if (imageBase64 && imageBase64.startsWith('data:image/')) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }
    // ถ้าเป็น http URL → ข้ามรูป (Gemini ไม่รองรับ URL ตรงๆ)

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async generateVideoPrompt(productName, productImageBase64, options = {}) {
    const systemPrompt = this.getVideoSystemPrompt(options);
    const userMessage = `สร้าง video prompt สำหรับสินค้า: ${productName}`;
    return this.callAPI(systemPrompt, userMessage, productImageBase64);
  }

  async generateImagePrompt(productName, productImageBase64, options = {}) {
    const systemPrompt = this.getImageSystemPrompt(options);
    const userMessage = `สร้าง image prompt สำหรับสินค้า: ${productName}`;
    return this.callAPI(systemPrompt, userMessage, productImageBase64);
  }

  async generateTikTokCaption(productName, highlights, options = {}) {
    const systemPrompt = this.getCaptionSystemPrompt(options);
    const userMessage = `สร้าง TikTok caption สำหรับ: ${productName}\nจุดเด่น: ${highlights || 'ไม่ระบุ'}`;
    return this.callAPI(systemPrompt, userMessage);
  }

  async generateChannelScript(niche, topic, options = {}) {
    const systemPrompt = this.getChannelScriptSystemPrompt(niche);
    const userMessage = `สร้าง video prompt สำหรับหัวข้อ: ${topic}`;
    return this.callAPI(systemPrompt, userMessage);
  }

  async testConnection() {
    try {
      const result = await this.callAPI('ตอบสั้นๆ 1 คำ', 'สวัสดี');
      return { success: true, message: `เชื่อมต่อ Gemini สำเร็จ: "${result.substring(0, 50)}"` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}
