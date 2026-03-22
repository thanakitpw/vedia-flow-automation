// ===== Vedia Flow - AI Provider Interface + Factory =====

class AIProvider {
  constructor(apiKey, model = '') {
    this.apiKey = apiKey;
    this.model = model;
  }

  // สร้าง prompt สำหรับวิดีโอ
  async generateVideoPrompt(productName, productImageBase64, options = {}) {
    throw new Error('ต้อง implement generateVideoPrompt()');
  }

  // สร้าง prompt สำหรับภาพ
  async generateImagePrompt(productName, productImageBase64, options = {}) {
    throw new Error('ต้อง implement generateImagePrompt()');
  }

  // สร้าง caption สำหรับ TikTok
  async generateTikTokCaption(productName, highlights, options = {}) {
    throw new Error('ต้อง implement generateTikTokCaption()');
  }

  // สร้าง script สำหรับปั้นช่อง (Channel Builder)
  async generateChannelScript(niche, topic, options = {}) {
    throw new Error('ต้อง implement generateChannelScript()');
  }

  // ทดสอบการเชื่อมต่อ
  async testConnection() {
    throw new Error('ต้อง implement testConnection()');
  }

  // สร้าง system prompt สำหรับสร้างวิดีโอโฆษณา
  getVideoSystemPrompt(options = {}) {
    const cameraAngle = options.cameraAngle || 'medium shot';
    const noText = options.noText || false;

    return `คุณเป็นผู้เชี่ยวชาญการสร้าง video prompt สำหรับ AI video generation (Veo 3.1)
สร้าง prompt สำหรับวิดีโอโฆษณาสินค้า

กฎสำคัญ:
- ห้ามบรรยายหน้าตา/เพศ/อายุของคนในรูป ให้ใช้คำว่า "the person in the reference image" เสมอ
- อธิบายฉากเป็นภาษาอังกฤษ (1 ย่อหน้า)
- คำพูด/dialogue ต้องเป็น **ภาษาไทย** เสมอ (ใส่ในเครื่องหมายคำพูด)
- ตัวอย่าง: The person in the reference image holds up the product and says "สินค้าตัวนี้ดีมากเลย ใช้แล้วชอบมาก"
- อธิบายฉากวิดีโอ 8 วินาที
- มุมกล้อง: ${cameraAngle}
- ตัวละครต้องถือ/แสดงสินค้าที่อยู่ในรูป reference อย่างเป็นธรรมชาติ
- ต้องมี action ที่น่าสนใจ (ยิ้ม, หมุนสินค้า, ชี้จุดเด่น)
- คำพูดต้องเป็นภาษาไทยที่ฟังเป็นธรรมชาติ เหมือนรีวิวสินค้าจริง
${noText ? '- ห้ามมีตัวหนังสือใดๆ ในภาพ' : '- สามารถมีข้อความโปรโมทสั้นๆ ภาษาไทยได้'}
- ห้ามใส่คำว่า "prompt:" หรือ "video:" นำหน้า ตอบเป็น prompt ตรงๆ`;
  }

  // สร้าง system prompt สำหรับสร้างภาพ
  getImageSystemPrompt(options = {}) {
    const noText = options.noText || false;

    return `คุณเป็นผู้เชี่ยวชาญการสร้าง image prompt สำหรับ AI image generation (Nano Banana Pro)
สร้าง prompt สำหรับภาพโฆษณาสินค้า

กฎสำคัญ:
- ห้ามบรรยายหน้าตา/เพศ/อายุของคนในรูป ให้ใช้คำว่า "the person in the reference image" เสมอ
- อธิบายภาพเป็นภาษาอังกฤษ (1 ย่อหน้า)
- ถ้ามีข้อความในภาพ ต้องเป็น **ภาษาไทย** เช่น "ลดราคา 50%" หรือ "สินค้าขายดี"
- ให้คนในรูป reference ถือ/แสดงสินค้าที่อยู่ในรูป reference อย่างเป็นธรรมชาติ
- ภาพต้องสวย คมชัด สไตล์โฆษณา
- สัดส่วน 9:16 (แนวตั้ง)
${noText ? '- ห้ามมีตัวหนังสือใดๆ ในภาพ' : '- สามารถมีข้อความโปรโมทสั้นๆ ภาษาไทยได้'}
- ห้ามใส่คำว่า "prompt:" นำหน้า ตอบเป็น prompt ตรงๆ`;
  }

  // สร้าง system prompt สำหรับ TikTok caption
  getCaptionSystemPrompt(options = {}) {
    const isChannelMode = options.isChannelMode || false;

    if (isChannelMode) {
      return `คุณเป็นผู้เชี่ยวชาญ TikTok content creator
สร้าง caption ภาษาไทยสำหรับคลิป TikTok แบบปั้นช่อง (ไม่ใช่ขายของ)

กฎ:
- เขียน caption ภาษาไทย 2-3 บรรทัด
- บรรทัดแรก: Hook ที่ดึงดูดใน 3 วินาที
- บรรทัดสุดท้าย: CTA เช่น "กดติดตามเพื่อดูคลิปแบบนี้ทุกวัน" หรือ "แชร์ให้เพื่อนดูด้วยนะ"
- ใส่ hashtags 3-5 ตัวที่เกี่ยวข้อง
- ห้ามพูดถึงการขายของ ห้ามใส่ลิงก์สินค้า
- ตอบเป็น caption ตรงๆ ไม่ต้องมีคำอธิบาย`;
    }

    return `คุณเป็นผู้เชี่ยวชาญ TikTok marketing ที่เขียน caption ได้ viral มาก
สร้าง caption ภาษาไทยสำหรับคลิปโฆษณาสินค้า TikTok Shop

กฎ:
- เขียน caption ภาษาไทย 4-6 บรรทัด (ยาวพอสมควร)
- บรรทัดแรก: Hook ที่ดึงดูดใน 3 วินาที ใช้ emoji นำ เช่น 🔥 หรือ ✨
- บรรทัดที่ 2-3: อธิบายจุดเด่นสินค้า ทำไมต้องซื้อ ใช้แล้วดียังไง
- บรรทัดที่ 4: สร้าง FOMO เช่น "มีจำนวนจำกัด" "ราคานี้หมดเมื่อไหร่ไม่รู้"
- บรรทัดสุดท้าย: CTA ชัดเจน เช่น "กดตะกร้าสีเหลืองเลยค่ะ 🛒" หรือ "สั่งเลยก่อนหมด!"
- ใส่ hashtags 5-8 ตัว ที่เกี่ยวข้อง + trending เช่น #tiktokshop #ของดีบอกต่อ #สินค้าขายดี
- เขียนให้เป็นธรรมชาติ เหมือนคนรีวิวจริงๆ ไม่ใช่โฆษณาแข็งๆ
- ตอบเป็น caption ตรงๆ ไม่ต้องมีคำอธิบาย`;
  }

  // สร้าง system prompt สำหรับ Channel Builder
  getChannelScriptSystemPrompt(niche) {
    return `คุณเป็นผู้เชี่ยวชาญสร้าง TikTok content ใน niche "${niche}"
สร้าง video prompt ภาษาอังกฤษสำหรับ AI video generation

กฎ:
- ตอบเป็น prompt ภาษาอังกฤษเท่านั้น (1 ย่อหน้า)
- เนื้อหาต้องน่าสนใจ ดึงดูดคนดู
- สไตล์: cinematic, satisfying, สวยงาม
- สัดส่วน 9:16 (แนวตั้ง)
- ห้ามใส่คำว่า "prompt:" นำหน้า ตอบเป็น prompt ตรงๆ`;
  }
}

// Factory function สร้าง provider ตามชื่อ
function createAIProvider(providerName, apiKey, model) {
  switch (providerName) {
    case 'claude':
      return new ClaudeProvider(apiKey);
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'gemini':
      return new GeminiProvider(apiKey);
    case 'openrouter':
      return new OpenRouterProvider(apiKey, model);
    default:
      throw new Error(`ไม่รู้จัก provider: ${providerName}`);
  }
}
