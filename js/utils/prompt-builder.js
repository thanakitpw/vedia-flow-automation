// ===== Vedia Flow - Prompt Builder =====
// อ้างอิง template จาก PROMPT&PLAY AUTO GEN PRO 4.2

const PromptBuilder = {

  // ===== Safety Rules (จาก PROMPT&PLAY) =====
  textProtection: `[CRITICAL TEXT RULE: Any Thai text, typography, or product labels in the image MUST remain 100% FROZEN, STATIC, and UNCHANGED throughout the entire video. DO NOT morph, distort, translate, animate, or hallucinate new text.]`,

  strictFidelity: `[Maintain 100% exact fidelity to the source image. DO NOT alter the product's shape or background elements. Only animate the character.]`,

  tiktokSafetyRules: `(Rules: NO floating text, NO subtitles. Focus on natural mouth movements and minimal, realistic head gestures).`,

  // CTA ปักตะกร้า
  cartCTA: `At the end, the character subtly points or gestures downward and says in Thai "สามารถเลือกซื้อในตะกร้าได้เลย" with a warm, inviting smile.`,

  // Negative prompt สำหรับ Video
  videoNegative: `Negative Prompt: "foreign language, english language, english audio, other languages, text morphing, changing text, distorted letters, gibberish, moving text, floating letters, bad text, slow talking, slow speaking, long pauses, awkward silence, short speech, whispering"`,

  // Negative prompt สำหรับ Image
  imageNegative: `Negative Prompt: "borders, frame, watermark, bad anatomy, deformed, blurry, ugly, sketch, specific pricing, price tag, numbers"`,

  // ===== Video Prompt Templates (29 สไตล์ จาก PROMPT&PLAY) =====
  videoTemplates: {
    // === พูดรีวิว ===
    'talk_ugc': `Cinematic smartphone selfie-style video. An authentic, unscripted UGC review of [product]. The character looks directly into the lens like a real everyday customer sharing a genuine 'after-use' experience. The character is speaking in Thai with a highly natural, word-of-mouth tone.`,
    'talk_excited': `Bright aesthetic lighting. The character is enthusiastically presenting [product] to the viewer. High energy, friendly influencer vibe, sharing a great deal. The character is speaking in Thai with a lively, natural tone.`,
    'talk_cheerful': `The character is lighthearted and smiling naturally while talking about [product]. A relaxed, feel-good vibe (no fake loud laughing). The character is speaking in Thai with a joyful, friendly banter tone.`,
    'talk_sassy': `The character speaks with a self-assured, slightly playful charm about [product]. Confident but approachable. The character is speaking in Thai with a sassy, confident, but highly natural tone.`,
    'talk_sincere': `The character recommends [product] with a warm, heart-to-heart expression. Like advising a close family member. The character is speaking in Thai with a soft, sincere, but normal conversational speed tone. No dramatic pauses.`,
    'talk_confident': `The character speaks with a self-assured, confident tone about [product]. Professional studio-quality lighting. The character is speaking in Thai with a poised, authoritative tone.`,
    'talk_soft': `Soft, warm lighting. The character gently introduces [product] with a calm, soothing voice. ASMR-inspired close-up style. The character is speaking in Thai with a soft, intimate whisper tone.`,

    // === ผู้เชี่ยวชาญ ===
    'rant_expert': `Professional portrait framing. The character acts as a friendly expert explaining the benefits of [product]. Calm and trustworthy body language. The character is speaking in Thai with an authoritative yet highly helpful tone.`,
    'hook_secret': `The character leans in slightly with an intimate, conversational vibe, holding [product]. They have a 'real talk' expression, sharing a valuable secret. The character is speaking in Thai with a quick, engaging, and mysterious tone. Speak continuously.`,
    'hook_comparison': `The character is analyzing [product] logically, making a conversational comparison. Slight head tilt. The character is speaking in Thai with an analytical, 'let me explain' tone.`,

    // === ดุด่า/ห่วงใย ===
    'rant': `The character is delivering a passionate 'tough love' rant. Acting like a caring best friend scolding the viewer for neglecting their own well-being, before forcefully recommending [product] as the ultimate solution. The character is speaking in Thai with a fast, urgent, scolding, yet deeply caring tone.`,
    'hook_mistake': `The character gives a caring but strict warning, slightly shaking their head in disbelief at a common mistake the viewer is making. It feels like a mother scolding out of love before offering [product] to help. The character is speaking in Thai with a concerned, slightly strict, but highly helpful warning tone.`,
    'rant_skeptical': `The character gives a serious, concerned wake-up call. They show slight frustration about a bad habit the viewer is doing, then their expression turns highly supportive as they introduce [product] to fix it. The character is speaking in Thai with an honest, tough-love realization tone.`,
    'rant_partner': `The character acts like a caring but frustrated partner, playfully scolding the viewer for not taking care of themselves, then handing them [product] as the perfect solution. The character is speaking in Thai with a passionate, slightly annoyed but deeply loving tone.`,

    // === ปิดการขาย ===
    'closing_urgency': `The character expresses a natural sense of urgency about [product]. Fast-paced, dynamic energy, subtly gesturing downwards. The character is speaking in Thai with a fast-paced, FOMO-driven tone.`,
    'closing_sincere': `The character gives a warm, reassuring sign-off with [product] in hand. A gentle smile indicating 'trust me on this one'. The character is speaking in Thai with a comforting, caring, but fluent and continuous tone.`,
    'closing_challenge': `The character holds [product] confidently, giving a friendly, playful nod. They project a bold vibe, daring the viewer to try it. The character is speaking in Thai with a bold, confident, and challenging tone.`,
    'closing_cta': `The character delivers a direct but friendly Call-To-Action about [product], subtly pointing or looking down to indicate the shopping basket. The character is speaking in Thai with a clear, inviting CTA tone.`,

    // === B-Roll (ไม่มีคนพูด) ===
    'broll_hero': `Professional commercial Hero Shot. The [product] stands perfectly still. Very subtle light reflection movement on the surface to show realism. NO rotation. Keep original image 100%.`,
    'broll_pan': `Slow and smooth cinematic camera pan over [product]. Keep the product and background exactly as the original image.`,
    'broll_zoom': `Camera slowly zooms in on [product] texture. Highlighting micro-details without changing them.`,
    'broll_cinematic': `Cinematic lighting setup showcasing [product]. Elegant, slow-motion feel with a premium aesthetic. Keep original image completely unmodified.`,
    'miniature_vdo': `Cinematic miniature world animation. The giant [product] remains static. Tiny characters are moving in a stepped stop-motion style. Tilt-shift macro zoom.`,

    // === Voiceover ===
    'voice_promo': `Fast cuts commercial style. Energetic camera movement showing [product]. Keep original image details. Voice Tone: High-energy, fast-paced commercial narrator. The narrator is speaking in Thai.`,
    'voice_soft': `Gentle camera movement showing [product]. Soft vibe. Keep original colors. Voice Tone: Soothing and calm narrator, speaking at a normal, continuous commercial pace. The narrator is speaking in Thai.`,
    'voice_docu': `Cinematic product documentary style. Elegant pans detailing the premium quality of [product]. Voice Tone: Professional and sophisticated product narrator. The narrator is speaking in Thai.`,
    'voice_news': `Professional news broadcast style. Camera framing [product] as the subject of a breaking news story. Clean, objective presentation. Voice Tone: Authoritative news anchor narrator. The narrator is speaking in Thai.`,
    'voice_movie': `Epic Hollywood movie trailer style. Dramatic lighting showcasing [product]. Voice Tone: Deep, resonant movie trailer narrator speaking powerfully. The narrator is speaking in Thai.`,
    'cartoon': `Magical and highly expressive commercial style. Playful camera angles showing [product]. Voice Tone: Classic Disney-style cartoon narrator, theatrical, magical, and bouncy. The narrator is speaking in Thai.`,
  },

  // ===== Image Prompt Templates (15 สไตล์ จาก PROMPT&PLAY) =====
  imageTemplates: {
    'product_showcase': `Please have the person in the image present the product in the image. Professional product photography, 9:16 portrait orientation, bright studio lighting, natural pose, friendly smile.`,
    'ugc_review': `Authentic UGC social media photography. The person in the image is naturally holding and presenting [product] to the viewer. TikTok lifestyle aesthetic, casual setting, soft natural lighting. Engaging and relatable vibe.`,
    'influencer': `Authentic social media content. Medium portrait shot of the person in the image naturally holding [product]. Looking directly at the lens with a friendly smile. TikTok aesthetic. (CRITICAL: NOT holding camera, BOTH hands visible with product).`,
    'ecommerce': `E-commerce product photography. The person in the image is holding [product] with a clean, professional look. Soft studio lighting, clean background. High quality, 8k, photorealistic.`,
    'lifestyle': `Lifestyle product photography. The person in the image is using [product] in an everyday natural setting. Warm, inviting atmosphere. Candid, authentic feel.`,
    'fashion': `High-end fashion lookbook photography. The person in the image is stylishly modeling [product]. Full body or medium shot showcasing fit and design. Professional lighting, fashion magazine grade.`,
    'beauty': `Beauty influencer photography. Close-up of the person in the image applying [product]. Showing texture and glow. Soft ring light. High quality, 8k.`,
    'studio': `Epic campaign advertising photography. The person in the image standing confidently presenting [product] in a spectacular setting. Dramatic lighting, stylized effects, premium poster quality.`,
    'review': `Professional review photography. The person in the image holding [product] nicely. Shot with 85mm lens, beautiful bokeh. Welcoming smile. Sharp focus, 8k.`,
    'live': `Live commerce broadcast style. The person in the image acting as a charismatic host holding [product]. Energetic atmosphere. 8k.`,
    'texture': `Extreme close-up macro shot of [product]. Focus on texture, material details. Background blurred. (Product only, no face). 8k.`,
    'unboxing': `First-person POV shot. Hands unboxing [product] on aesthetic desk. Natural indoor lighting. (POV, only hands visible). 8k.`,
    'showcase': `Professional commercial product photography of [product]. Product centered. (NO humans, just product). 8k, advertising grade.`,
    'fancy': `High-end advertising. The person in the image holding [product]. Elements of product ingredients elegantly floating in the air. Glossy packaging, warm tone, 8k.`,
    'cgi': `Surreal CGI advertising. A massive, skyscraper-sized [product] placed as a monument. The person stands tiny nearby, looking up in amazement. Cinematic lighting, 3D render, epic scale.`,
  },

  // ===== สร้าง Video Prompt =====
  buildVideoPrompt(productName, options = {}) {
    const style = options.videoStyle || 'talk_ugc';
    const cameraAngle = options.cameraAngle || '';
    const noText = options.noText || false;

    // B-Roll modes (ไม่มีคนพูด)
    const brollModes = ['broll_hero', 'broll_pan', 'broll_zoom', 'broll_cinematic', 'miniature_vdo'];
    const isBroll = brollModes.includes(style);

    let template = this.videoTemplates[style] || this.videoTemplates['talk_ugc'];

    // แทนที่ [product]
    template = template.replace(/\[product\]/g, productName || 'the product');

    // เพิ่มมุมกล้อง (ไม่ใช่ B-Roll)
    if (cameraAngle && cameraAngle !== 'auto' && !isBroll) {
      template += ` Camera angle: ${cameraAngle}.`;
    }

    // เพิ่ม CTA ตะกร้า (เฉพาะ mode ที่มีคนพูด)
    if (!isBroll) {
      template += ' ' + this.cartCTA;
    }

    // เพิ่ม safety rules
    template += ' ' + this.tiktokSafetyRules;
    template += ' ' + this.strictFidelity;
    template += ' ' + this.textProtection;

    // No text mode
    if (noText) {
      template += ' No text overlay, no watermark, no captions in the video.';
    }

    // เพิ่ม anti-bot seed + negative prompt
    template += ' ' + this.getAntiBotSeed();
    template += ' ' + this.videoNegative;

    return template;
  },

  // ===== สร้าง Image Prompt =====
  buildImagePrompt(productName, options = {}) {
    const style = options.imageStyle || 'product_showcase';
    const noText = options.noText || false;

    let template = this.imageTemplates[style] || this.imageTemplates['product_showcase'];

    // แทนที่ [product]
    template = template.replace(/\[product\]/g, productName || 'the product');

    // Text overlay
    if (noText) {
      template += ' Clean image, NO text overlay, NO typography.';
    }

    // เพิ่ม fidelity + anti-bot + negative
    template += ' (IMPORTANT: High fidelity to reference image. Keep exact face and identity.)';
    template += ' ' + this.getAntiBotSeed();
    template += ' ' + this.imageNegative;

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
    const hash = Math.random().toString(36).substring(2, 6);
    const adj = adjs[Math.floor(Math.random() * adjs.length)];
    return `(${adj}-${hash})`;
  },

  // ===== สร้าง options สำหรับ AI provider =====
  buildAIOptions(settings = {}) {
    return {
      cameraAngle: settings.randomCamera ? this.getRandomCameraAngle() : (settings.cameraAngle || 'medium shot'),
      noText: settings.noText || false,
      isChannelMode: settings.isChannelMode || false,
    };
  },
};
