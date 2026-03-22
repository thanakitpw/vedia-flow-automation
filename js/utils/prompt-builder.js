// ===== Vedia Flow - Prompt Builder =====
// อ้างอิง template จาก PROMPT&PLAY AUTO GEN PRO 4.2

const PromptBuilder = {

  // ===== Video Prompt Templates =====
  // ใช้ "The character" เพื่อให้ Google Flow ใช้คนจากรูป reference
  videoTemplates: {
    'talk_ugc': `Cinematic smartphone selfie-style video. An authentic, unscripted UGC review of [product]. The character looks directly into the lens like a real everyday customer sharing a genuine 'after-use' experience. The character is speaking in Thai with a highly natural, word-of-mouth tone.`,
    'talk_excited': `Bright aesthetic lighting. The character is enthusiastically presenting [product] to the viewer. High energy, friendly influencer vibe, sharing a great deal. The character is speaking in Thai with a lively, natural tone.`,
    'talk_cheerful': `The character is lighthearted and smiling naturally while talking about [product]. A relaxed, feel-good vibe. The character is speaking in Thai with a joyful, friendly banter tone.`,
    'talk_confident': `The character speaks with a self-assured, confident tone about [product]. Professional studio-quality lighting. The character is speaking in Thai with a poised, authoritative tone.`,
    'talk_soft': `Soft, warm lighting. The character gently introduces [product] with a calm, soothing voice. ASMR-inspired close-up style. The character is speaking in Thai with a soft, intimate whisper tone.`,
  },

  // ===== Image Prompt Templates =====
  imageTemplates: {
    'product_showcase': `Please have the person in the image present the product in the image. Professional product photography, 9:16 portrait orientation, bright studio lighting, natural pose, friendly smile.`,
    'ugc_review': `Authentic UGC social media photography. The person in the image is naturally holding and presenting [product] to the viewer. TikTok lifestyle aesthetic, casual setting, soft natural lighting. Engaging and relatable vibe.`,
    'ecommerce': `E-commerce product photography. The person in the image is holding [product] with a clean, professional look. Soft studio lighting, clean background. High quality, photorealistic.`,
    'influencer': `Authentic social media content. The person in the image is naturally presenting [product]. Looking directly at the lens with a friendly, approachable smile. TikTok aesthetic, engaging vibe.`,
    'lifestyle': `Lifestyle product photography. The person in the image is using [product] in an everyday natural setting. Warm, inviting atmosphere. Candid, authentic feel.`,
  },

  // ===== Safety Rules (จาก PROMPT&PLAY) =====
  safetyRules: `[CRITICAL SAFETY RULES: Maintain character consistency with reference image. Do not change the character's face, body, or appearance. The character must have natural, realistic lip movements. Keep product label and text FROZEN and unchanged throughout the video.]`,

  // ===== สร้าง Video Prompt =====
  buildVideoPrompt(productName, options = {}) {
    const style = options.videoStyle || 'talk_ugc';
    const cameraAngle = options.cameraAngle || '';
    const noText = options.noText || false;

    let template = this.videoTemplates[style] || this.videoTemplates['talk_ugc'];

    // แทนที่ [product]
    template = template.replace(/\[product\]/g, productName || 'the product');

    // เพิ่มมุมกล้อง
    if (cameraAngle && cameraAngle !== 'auto') {
      template += ` Camera angle: ${cameraAngle}.`;
    }

    // เพิ่ม safety rules
    template += ' ' + this.safetyRules;

    // No text mode
    if (noText) {
      template += ' No text overlay, no watermark, no captions in the video.';
    }

    // เพิ่ม anti-bot seed
    template += ' ' + this.getAntiBotSeed();

    return template;
  },

  // ===== สร้าง Image Prompt =====
  buildImagePrompt(productName, options = {}) {
    const style = options.imageStyle || 'product_showcase';
    const noText = options.noText || false;

    let template = this.imageTemplates[style] || this.imageTemplates['product_showcase'];

    // แทนที่ [product]
    template = template.replace(/\[product\]/g, productName || 'the product');

    // No text mode
    if (noText) {
      template += ' No text overlay, no watermark.';
    }

    // เพิ่ม anti-bot seed
    template += ' ' + this.getAntiBotSeed();

    return template;
  },

  // ===== สุ่มมุมกล้อง =====
  getRandomCameraAngle() {
    const angles = CONFIG.cameraAngles;
    return angles[Math.floor(Math.random() * angles.length)];
  },

  // ===== Anti-bot seed (จาก PROMPT&PLAY) =====
  getAntiBotSeed() {
    const adjs = ['vivid', 'clear', 'sharp', 'detailed', 'crisp', 'vibrant', 'stunning', 'polished', 'refined', 'elegant'];
    const nouns = ['portrait', 'scene', 'frame', 'composition', 'shot', 'view', 'capture', 'visual', 'render', 'angle'];
    const adj = adjs[Math.floor(Math.random() * adjs.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `(${adj} ${noun})`;
  },

  // ===== สร้าง options สำหรับ AI provider (ใช้กรณีที่ต้องการให้ AI สร้าง prompt เอง) =====
  buildAIOptions(settings = {}) {
    return {
      cameraAngle: settings.randomCamera ? this.getRandomCameraAngle() : (settings.cameraAngle || 'medium shot'),
      noText: settings.noText || false,
      isChannelMode: settings.isChannelMode || false,
    };
  },
};
