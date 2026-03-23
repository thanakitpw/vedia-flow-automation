# Vedia Flow - สไตล์ภาพ & วิดีโอ

อ้างอิงจาก PROMPT&PLAY AUTO GEN PRO 4.2

---

## มุมกล้อง (ใช้กับ Video prompt เท่านั้น)

| ตัวเลือก | ใส่ใน prompt |
|---------|-------------|
| เลือกให้เหมาะสมกับสินค้า | สุ่ม 1 จาก 10 มุมทุกครั้ง (แต่ละคลิปได้มุมต่างกัน) |
| ระยะใกล้ (Close-up) | `Camera angle: close-up face level.` |
| ระยะกลาง (Medium) | `Camera angle: medium shot waist-up.` |
| ระยะไกล (Wide) | `Camera angle: wide establishing shot.` |
| ระดับสายตา | `Camera angle: eye-level straight-on shot.` |
| มุมต่ำ (Low angle) | `Camera angle: slight low angle looking up.` |
| มุมสูง (High angle) | `Camera angle: high angle looking down.` |
| Dutch angle | `Camera angle: dutch angle tilted frame.` |
| Over-the-shoulder | `Camera angle: over-the-shoulder view.` |
| Extreme close-up | `Camera angle: extreme close-up detail shot.` |
| Bird eye | `Camera angle: bird eye view from above.` |

---

## สไตล์ภาพ (15 แบบ)

### 📸 มีคนถือสินค้า

| สไตล์ | คำอธิบาย | Prompt |
|-------|---------|--------|
| **แสดงสินค้า** | ถือสินค้า ยิ้ม สไตล์มืออาชีพ | `Please have the person in the image present the product. Professional product photography, 9:16, bright studio lighting, natural pose, friendly smile.` |
| **รีวิว UGC** | ถือสินค้าแบบธรรมชาติ สไตล์ TikTok | `Authentic UGC social media photography. The person is naturally holding and presenting [product]. TikTok lifestyle aesthetic, casual setting, soft natural lighting.` |
| **Influencer** | มองกล้องตรงๆ ยิ้ม สไตล์ social media | `Medium portrait shot naturally holding [product]. Looking directly at lens with friendly smile. TikTok aesthetic. (CRITICAL: NOT holding camera, BOTH hands visible with product).` |
| **E-commerce** | สะอาด professional พื้นหลังเรียบ | `E-commerce product photography. Clean background. 8k, photorealistic.` |
| **Lifestyle** | ใช้สินค้าในชีวิตจริง candid | `Using [product] in everyday natural setting. Warm atmosphere. Candid, authentic feel.` |
| **Fashion** | สไตล์แฟชั่น lookbook | `High-end fashion lookbook. Full body shot showcasing fit and design. Fashion magazine grade.` |
| **Beauty** | Close-up ทาสินค้า เห็น texture | `Close-up applying [product]. Showing texture and glow. Ring light.` |
| **Studio** | โฆษณาระดับ campaign | `Epic campaign advertising. Spectacular setting. Dramatic lighting, stylized effects, premium poster.` |
| **Review (Bokeh)** | เลนส์ 85mm เบลอหลังสวย | `85mm lens, beautiful bokeh. Welcoming smile. Sharp focus, 8k.` |
| **Live** | สไตล์ Live ขายของ | `Live commerce broadcast. Charismatic host. Energetic atmosphere.` |
| **Fancy** | ส่วนผสมลอยในอากาศ | `Ingredients elegantly floating in air. Glossy packaging, warm tone.` |
| **CGI ยักษ์** | สินค้าใหญ่เท่าตึก คนยืนตัวจิ๋ว | `Skyscraper-sized [product] as monument. Person stands tiny nearby, looking up in amazement.` |

### 📦 สินค้าอย่างเดียว (ไม่มีคน)

| สไตล์ | คำอธิบาย | Prompt |
|-------|---------|--------|
| **Macro Texture** | ซูมเห็นรายละเอียดสินค้า | `Extreme close-up of [product] texture. No face. 8k.` |
| **Unboxing POV** | มองจากมุมมองคนแกะกล่อง เห็นแค่มือ | `First-person POV unboxing [product]. Only hands visible.` |
| **Product Only** | สินค้าอย่างเดียว ไม่มีคน | `Product centered. NO humans. Advertising grade.` |

### ต่อท้ายทุกสไตล์:
```
+ (IMPORTANT: High fidelity to reference image. Keep exact face and identity.)
+ (anti-bot seed สุ่มทุกครั้ง)
+ Negative Prompt: "borders, frame, watermark, bad anatomy, deformed, blurry, ugly, sketch, specific pricing, price tag, numbers"
```

---

## สไตล์วิดีโอ (29 แบบ)

### 🗣️ คนพูดรีวิว (7 แบบ)

| สไตล์ | อารมณ์ | Prompt |
|-------|--------|--------|
| **รีวิวบ้านๆ (UGC)** | ธรรมชาติ เหมือนถ่าย selfie | `Cinematic smartphone selfie-style video. An authentic, unscripted UGC review of [product]. The character looks directly into the lens like a real everyday customer. Speaking in Thai with natural, word-of-mouth tone.` |
| **ตื่นเต้น Excited** | พลังสูง สไตล์ influencer | `Bright aesthetic lighting. Enthusiastically presenting [product]. High energy, friendly influencer vibe. Speaking in Thai with lively, natural tone.` |
| **ร่าเริง Cheerful** | ยิ้มสบายๆ feel good | `Lighthearted and smiling naturally while talking about [product]. Relaxed, feel-good vibe. Speaking in Thai with joyful, friendly banter tone.` |
| **มั่นใจ Sassy** | มั่นใจ playful | `Self-assured, slightly playful charm about [product]. Confident but approachable. Speaking in Thai with sassy, confident tone.` |
| **จริงใจ Sincere** | อบอุ่น เหมือนแนะนำคนในบ้าน | `Recommends [product] with warm, heart-to-heart expression. Like advising a close family member. Speaking in Thai with soft, sincere tone.` |
| **มืออาชีพ Confident** | สไตล์ studio มั่นใจ | `Self-assured, confident tone about [product]. Professional studio-quality lighting. Speaking in Thai with poised, authoritative tone.` |
| **นุ่มนวล ASMR** | เสียงเบา ใกล้ชิด | `Soft, warm lighting. Gently introduces [product] with calm, soothing voice. ASMR-inspired close-up. Speaking in Thai with soft, intimate whisper tone.` |

### 🧠 ผู้เชี่ยวชาญ (3 แบบ)

| สไตล์ | อารมณ์ | Prompt |
|-------|--------|--------|
| **Expert** | สงบ น่าเชื่อถือ | `Professional portrait framing. Friendly expert explaining benefits of [product]. Calm body language. Speaking in Thai with authoritative yet helpful tone.` |
| **ความลับ Secret** | เอนตัวเข้ามา กระซิบ | `Leans in slightly with intimate vibe, holding [product]. 'Real talk' expression, sharing a secret. Speaking in Thai with quick, engaging, mysterious tone.` |
| **เปรียบเทียบ Compare** | วิเคราะห์ เอียงหัว | `Analyzing [product] logically, making conversational comparison. Slight head tilt. Speaking in Thai with analytical, 'let me explain' tone.` |

### 😤 ดุด่า/ห่วงใย (4 แบบ)

| สไตล์ | อารมณ์ | Prompt |
|-------|--------|--------|
| **ดุด่า Rant** | เพื่อนดุ แล้วแนะนำ | `Passionate 'tough love' rant. Caring best friend scolding viewer before recommending [product]. Speaking in Thai with fast, urgent, scolding yet caring tone.` |
| **เตือนข้อผิดพลาด** | ส่ายหัว เตือน | `Caring but strict warning, shaking head at common mistake. Like mother scolding out of love before offering [product]. Speaking in Thai with concerned, strict but helpful tone.` |
| **Tough Love** | จริงจัง wake-up call | `Serious, concerned wake-up call. Slight frustration about bad habit, then supportive as introducing [product]. Speaking in Thai with honest, tough-love tone.` |
| **แฟนดุ Partner** | แฟนบ่น แล้วยื่นสินค้า | `Caring but frustrated partner, playfully scolding viewer, then handing [product]. Speaking in Thai with passionate, slightly annoyed but deeply loving tone.` |

### 🛒 ปิดการขาย (4 แบบ)

| สไตล์ | อารมณ์ | Prompt |
|-------|--------|--------|
| **เร่งด่วน Urgency** | FOMO ชี้มือลง | `Natural sense of urgency about [product]. Fast-paced, dynamic energy, gesturing downwards. Speaking in Thai with fast-paced, FOMO-driven tone.` |
| **จริงใจ Sincere** | "เชื่อฉันเถอะ" | `Warm, reassuring sign-off with [product] in hand. Gentle smile 'trust me on this one'. Speaking in Thai with comforting, caring tone.` |
| **ท้าลอง Challenge** | ท้าคนดูลอง | `Holds [product] confidently, playful nod. Bold vibe, daring viewer to try. Speaking in Thai with bold, confident, challenging tone.` |
| **CTA ชี้ตะกร้า** | ชี้ลงล่าง กดตะกร้า | `Direct but friendly Call-To-Action about [product], pointing down to indicate shopping basket. Speaking in Thai with clear, inviting CTA tone.` |

### 🎬 B-Roll (5 แบบ - ไม่มีคนพูด)

| สไตล์ | แสดงอะไร | Prompt |
|-------|---------|--------|
| **Hero Shot** | สินค้านิ่ง แสงสะท้อน | `Professional commercial Hero Shot. [product] stands perfectly still. Subtle light reflection. NO rotation. Keep original image 100%.` |
| **Camera Pan** | กล้องแพนช้าๆ | `Slow and smooth cinematic camera pan over [product]. Keep product and background exactly as original.` |
| **Zoom Detail** | ซูมเข้ารายละเอียด | `Camera slowly zooms in on [product] texture. Highlighting micro-details without changing them.` |
| **Cinematic** | แสงแบบหนัง | `Cinematic lighting setup showcasing [product]. Elegant, slow-motion feel, premium aesthetic. Keep original completely unmodified.` |
| **Miniature** | โลกจิ๋ว คนเล็กเดินรอบ | `Cinematic miniature world animation. Giant [product] remains static. Tiny characters moving in stop-motion style. Tilt-shift macro zoom.` |

### 🎙️ Voiceover (6 แบบ - เสียงบรรยายทับ)

| สไตล์ | สไตล์เสียง | Prompt |
|-------|-----------|--------|
| **โปรโมท Promo** | เร็ว พลังสูง | `Fast cuts commercial style. Energetic camera movement showing [product]. Voice Tone: High-energy, fast-paced commercial narrator. Speaking in Thai.` |
| **นุ่มนวล Soft** | สงบ ผ่อนคลาย | `Gentle camera movement. Soft vibe. Voice Tone: Soothing and calm narrator, normal pace. Speaking in Thai.` |
| **สารคดี Documentary** | มืออาชีพ สง่างาม | `Cinematic product documentary. Elegant pans. Voice Tone: Professional, sophisticated narrator. Speaking in Thai.` |
| **ข่าว News** | ผู้ประกาศข่าว | `Professional news broadcast style. Voice Tone: Authoritative news anchor narrator. Speaking in Thai.` |
| **หนัง Movie Trailer** | ดราม่า เข้มข้น | `Epic Hollywood movie trailer style. Dramatic lighting. Voice Tone: Deep, resonant movie trailer narrator. Speaking in Thai.` |
| **การ์ตูน Cartoon** | สนุกสนาน Disney | `Magical, expressive commercial style. Playful angles. Voice Tone: Classic Disney-style cartoon narrator. Speaking in Thai.` |

---

## Safety Rules (ต่อท้ายทุก Video prompt)

```
CTA ตะกร้า (ยกเว้น B-Roll):
"At the end, the character subtly points downward and says
in Thai 'สามารถเลือกซื้อในตะกร้าได้เลย' with a warm smile."

TikTok Safety:
"(Rules: NO floating text, NO subtitles. Focus on natural
mouth movements and minimal, realistic head gestures)."

Strict Fidelity:
"[Maintain 100% exact fidelity to the source image.
DO NOT alter the product's shape or background elements.
Only animate the character.]"

Text Protection:
"[CRITICAL TEXT RULE: Any Thai text, typography, or product
labels in the image MUST remain 100% FROZEN, STATIC, and
UNCHANGED throughout the entire video.]"

Anti-bot seed (สุ่มทุกครั้ง):
"(vivid-a3f2)" หรือ "(sharp-k8m1)" ฯลฯ

Negative Prompt:
"foreign language, english language, english audio, text morphing,
changing text, distorted letters, moving text, floating letters,
slow talking, long pauses, awkward silence, short speech, whispering"
```

---

## โหมดการทำงาน

| โหมด | ทำอะไรบ้าง |
|------|-----------|
| **เต็มระบบ** | สร้างภาพ → สร้างวิดีโอ → โพสต์ TikTok + ปักตะกร้า |
| **ภาพอย่าง** | สร้างภาพอย่างเดียว (ไม่สร้างวิดีโอ ไม่โพสต์) |
| **คลิปอย่าง** | สร้างวิดีโออย่างเดียว (ไม่โพสต์ TikTok) |
