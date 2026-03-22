// ===== Vedia Flow - OpenRouter API Provider =====
// ใช้ OpenAI-compatible API ผ่าน OpenRouter (รองรับ free models)

class OpenRouterProvider extends AIProvider {
  constructor(apiKey, model) {
    super(apiKey, model || 'nvidia/nemotron-3-super-120b-a12b:free');
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  // ตรวจว่า model รองรับ vision หรือไม่
  isVisionModel() {
    const visionModels = OPENROUTER_FREE_MODELS.filter(m => m.vision).map(m => m.id);
    return visionModels.includes(this.model);
  }

  // เรียก OpenRouter API (OpenAI-compatible)
  async callAPI(systemPrompt, userMessage, imageBase64 = null) {
    const userContent = [];

    // ส่งรูปเฉพาะเมื่อ model รองรับ vision (รองรับทั้ง data URL และ http URL)
    if (imageBase64 && this.isVisionModel()) {
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

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://vedia-flow.app',
        'X-Title': 'Vedia Flow Automation',
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
      const errorMsg = error.error?.message || `OpenRouter API Error: ${response.status}`;
      const metadata = error.error?.metadata;
      if (metadata?.raw) {
        throw new Error(`${errorMsg} - ${metadata.raw}`);
      }
      throw new Error(errorMsg);
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
      return { success: true, message: `เชื่อมต่อ OpenRouter (${this.model}) สำเร็จ: "${result.substring(0, 50)}"` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}

// รายชื่อ free models บน OpenRouter (ดึงจาก API จริง 22 มี.ค. 2026)
// หมายเหตุ: free models อาจ rate-limit ชั่วคราว ลองเปลี่ยนตัวอื่นถ้าใช้ไม่ได้
const OPENROUTER_FREE_MODELS = [
  // ⭐ แนะนำ - ทดสอบแล้วใช้ได้
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: '⭐ NVIDIA Nemotron 120B (แนะนำ)', vision: false },
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'NVIDIA Nemotron Nano 30B', vision: false },

  // Vision-capable (รองรับรูปภาพ) - อาจ rate-limit ช่วงคนใช้เยอะ
  { id: 'google/gemma-3-27b-it:free', name: 'Google Gemma 3 27B 👁️', vision: true },
  { id: 'google/gemma-3-12b-it:free', name: 'Google Gemma 3 12B 👁️', vision: true },
  { id: 'google/gemma-3-4b-it:free', name: 'Google Gemma 3 4B 👁️', vision: true },
  { id: 'nvidia/nemotron-nano-12b-v2-vl:free', name: 'NVIDIA Nemotron 12B VL 👁️', vision: true },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1 24B 👁️', vision: true },

  // Text-only อื่นๆ
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 405B', vision: false },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', vision: false },
  { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder 480B', vision: false },
  { id: 'stepfun/step-3.5-flash:free', name: 'Step 3.5 Flash 196B', vision: false },
  { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B', vision: false },
  { id: 'minimax/minimax-m2.5:free', name: 'MiniMax M2.5', vision: false },
];
