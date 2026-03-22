// ===== Vedia Flow - OpenAI API Provider =====

class OpenAIProvider extends AIProvider {
  constructor(apiKey) {
    super(apiKey, 'gpt-4o-mini');
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
  }

  // เรียก OpenAI API (ใช้ร่วมกับ OpenRouter ได้)
  async callAPI(systemPrompt, userMessage, imageBase64 = null, overrideUrl = null, extraHeaders = {}) {
    const url = overrideUrl || this.baseUrl;

    const userContent = [];

    // ถ้ามีรูปภาพ (รองรับทั้ง data URL และ http URL)
    if (imageBase64) {
      let imageUrl = imageBase64;
      if (!imageBase64.startsWith('data:') && !imageBase64.startsWith('http')) {
        imageUrl = `data:image/jpeg;base64,${imageBase64}`;
      }
      userContent.push({
        type: 'image_url',
        image_url: { url: imageUrl },
      });
    }

    userContent.push({ type: 'text', text: userMessage });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: 1024,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
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
      return { success: true, message: `เชื่อมต่อ OpenAI สำเร็จ: "${result.substring(0, 50)}"` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}
