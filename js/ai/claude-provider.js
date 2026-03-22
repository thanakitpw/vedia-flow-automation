// ===== Vedia Flow - Claude API Provider =====

class ClaudeProvider extends AIProvider {
  constructor(apiKey) {
    super(apiKey, 'claude-sonnet-4-20250514');
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
  }

  // เรียก Claude API
  async callAPI(systemPrompt, userMessage, imageBase64 = null) {
    const content = [];

    // ถ้ามีรูปภาพ - ต้องเป็น data URL (base64) เท่านั้น
    if (imageBase64 && imageBase64.startsWith('data:image/')) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const mediaType = imageBase64.match(/^data:(image\/\w+);/)?.[1] || 'image/jpeg';
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: cleanBase64,
        },
      });
    } else if (imageBase64 && imageBase64.startsWith('http')) {
      // ถ้าเป็น URL → ใช้ type url แทน
      content.push({
        type: 'image',
        source: {
          type: 'url',
          url: imageBase64,
        },
      });
    }

    content.push({ type: 'text', text: userMessage });

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Claude API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
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
      const result = await this.callAPI('ตอบสั้นๆ 1 คำเท่านั้น', 'สวัสดี');
      return { success: true, message: `เชื่อมต่อ Claude สำเร็จ: "${result.substring(0, 50)}"` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}
