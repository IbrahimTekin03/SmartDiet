import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { GenerateDietPlanDto, AskSubstitutionDto } from './dto/ai-requests.dto';

@Injectable()
export class AiAssistantService {
  private anthropic: Anthropic;
  // User explicitly requested this model name
  private readonly model = 'claude-haiku-4-5-20251001'; 

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  async generateDietPlan(dto: GenerateDietPlanDto) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new InternalServerErrorException('Anthropic API key is not configured.');
    }

    const systemPrompt = `Sen profesyonel bir diyetisyen asistanısın. Görevin, verilen bilgilere göre sağlıklı, dengeli ve uygulanabilir bir diyet listesi oluşturmak.
Yanıtını sadece JSON formatında döndür. Markdown formatı kullanma, sadece saf JSON metni döndür. JSON şeması şöyle olmalı:
{
  "plan_type": "daily|weekly|monthly",
  "total_daily_calories": number,
  "meals": [
    {
      "name": "Öğün adı (örn: Sabah Kahvaltısı)",
      "time": "Önerilen saat (örn: 08:30)",
      "note": "Öğün ile ilgili kısa not",
      "items": [
        { "name": "Yiyecek adı", "amount": "Miktar (örn: 2 adet veya 100g)", "calories": number }
      ]
    }
  ]
}`;

    const userPrompt = `Lütfen şu özelliklere sahip bir danışan için ${dto.planType} bir diyet planı oluştur:
- Hedeflenen Günlük Kalori: ${dto.dailyCalories} kcal
- Hedefler: ${(dto.goals || []).join(', ') || 'Belirtilmedi'}
- Alerjiler: ${(dto.allergies || []).join(', ') || 'Yok'}
- Tercihler: ${(dto.preferences || []).join(', ') || 'Belirtilmedi'}
${dto.additionalNotes ? '- Ek Notlar: ' + dto.additionalNotes : ''}

Lütfen dengeli makro dağılımı sağla (yaklaşık %30 protein, %40 karbonhidrat, %30 yağ). Sadece geçerli JSON döndür.`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      });

      const responseText = (response.content[0] as any).text;
      
      // Try to parse JSON from the response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse Claude JSON response:', responseText);
        throw new InternalServerErrorException('AI response could not be parsed as JSON.');
      }
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new InternalServerErrorException('Failed to generate diet plan using AI.');
    }
  }

  async suggestSubstitution(dto: AskSubstitutionDto) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new InternalServerErrorException('Anthropic API key is not configured.');
    }

    const systemPrompt = `Sen danışanlara yardımcı olan bir beslenme uzmanısın. Danışan elinde olmayan bir yiyeceği değiştirmek istiyor.
Görevin, orijinal yiyeceğe kalori ve makro değerleri açısından (özellikle protein ve karbonhidrat) en benzer 3 alternatif sunmak.
Yanıtını sadece JSON formatında döndür. Markdown formatı kullanma. JSON şeması şöyle olmalı:
{
  "original_food": "Değiştirilmek istenen yiyecek",
  "substitutions": [
    {
      "name": "Alternatif yiyecek adı",
      "amount": "Tüketilmesi gereken miktar (örn: 150g)",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "why": "Neden bu alternatif uygun (kısa açıklama)"
    }
  ]
}`;

    const userPrompt = `Şu yiyecek için alternatifler öner: "${dto.foodName}"
Orijinal yiyeceğin makro değerleri (1 porsiyon/belirtilen miktar için):
Kalori: ${dto.currentMacros.calories || 'Bilinmiyor'} kcal
Protein: ${dto.currentMacros.protein || 'Bilinmiyor'} g
Karbonhidrat: ${dto.currentMacros.carbohydrates || 'Bilinmiyor'} g
Yağ: ${dto.currentMacros.fat || 'Bilinmiyor'} g

Dikkate alınması gerekenler:
- Alerjiler: ${(dto.allergies || []).join(', ') || 'Yok'}
- Tercihler: ${(dto.preferences || []).join(', ') || 'Yok'}

Sadece geçerli JSON döndür.`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1000,
        temperature: 0.5,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      });

      const responseText = (response.content[0] as any).text;
      
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse Claude JSON response:', responseText);
        throw new InternalServerErrorException('AI response could not be parsed as JSON.');
      }
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new InternalServerErrorException('Failed to generate substitution suggestions.');
    }
  }

  async scanMealImage(base64Image: string, mimeType: string) {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    let detectedMime = mimeType;
    if (base64Image.startsWith('/9j/')) {
      detectedMime = 'image/jpeg';
    } else if (base64Image.startsWith('iVBORw0KGgo')) {
      detectedMime = 'image/png';
    } else if (base64Image.startsWith('R0lGODlh')) {
      detectedMime = 'image/gif';
    } else if (base64Image.startsWith('UklGR')) {
      detectedMime = 'image/webp';
    }

    const systemPrompt = `Sen bir beslenme uzmanı ve yapay zeka asistanısın. Sana gönderilen yemek fotoğrafını analiz etmen gerekiyor.
Fotoğraftaki yiyecekleri tespit et. Bu yiyeceklerin yaklaşık miktarını (gram veya adet cinsinden), toplam kalori, protein, yağ ve karbonhidrat değerlerini hesapla.

LÜTFEN ŞU KURALLARA KESİNLİKLE UY:
1. BILEŞEN İSİMLERİ: "items" dizisindeki hiçbir yiyecek bileşeninin adı, tüm tabağın/öğünün adı (örn: "Kıymalı Kebap Tabağı") olmamalıdır. Sadece o bileşenin kendi adı olmalıdır (örn: "Kıyma Kebabı" veya "Izgara Köfte" veya "Kebap Eti").
2. MÜKERRER KALORİ VE MAKRO ÖNLEME: "items" dizisindeki her bir bileşenin kalori ve makro değerleri sadece o bileşenin kendi ağırlığına ve türüne ait olmalıdır. Örneğin, tabağın toplam kalorisi (örn: 780 kcal) asla ilk yiyecek bileşenine (örn: Kıyma Kebabı) atanmamalıdır; Kıyma Kebabı sadece kendi kalorisine (örn: 150g için ~350 kcal) sahip olmalıdır. Aksi takdirde diğer bileşenler (pilav vb.) de eklendiğinde mükerrer (2 katı) hesaplama oluşmaktadır.
3. TOPLAM TUTARLILIĞI: Ana JSON objesindeki "calories", "protein", "carbohydrates" ve "fat" değerleri, "items" dizisindeki tüm elemanların kendi değerlerinin TAM TOPLAMINA (matematiksel olarak) eşit olmalıdır.

Yanıtını SADECE şu JSON formatında döndür:
{
  "food_name": "Yemek adı (örn: Kıymalı Kebap Tabağı)",
  "amount": 350,
  "unit": "gram",
  "calories": 520,
  "protein": 32,
  "carbohydrates": 38,
  "fat": 24,
  "description": "Fotoğraftaki yemeğin kısa açıklaması ve tespit edilen malzemeler.",
  "items": [
    {
      "name": "Yiyecek bileşeni/malzeme adı (örn: Kıyma Kebabı)",
      "amount": 150,
      "unit": "gram",
      "calories": 350,
      "protein": 24,
      "carbohydrates": 2,
      "fat": 20
    },
    {
      "name": "Yiyecek bileşeni/malzeme adı (örn: Pirinç Pilavı)",
      "amount": 100,
      "unit": "gram",
      "calories": 150,
      "protein": 3,
      "carbohydrates": 32,
      "fat": 3
    },
    {
      "name": "Yiyecek bileşeni/malzeme adı (örn: Mevsim Salatası)",
      "amount": 100,
      "unit": "gram",
      "calories": 20,
      "protein": 5,
      "carbohydrates": 4,
      "fat": 1
    }
  ]
}
Markdown veya başka hiçbir metin biçimlendirmesi kullanma, sadece saf JSON metni döndür.`;

    if (geminiApiKey) {
      console.log('Using Google Gemini 1.5 Flash (v1 endpoint) for image analysis...');
      try {
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
        const payload = {
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nLütfen bu fotoğraftaki yemeği analiz et ve JSON olarak döndür.`
                },
                {
                  inlineData: {
                    mimeType: detectedMime,
                    data: base64Image
                  }
                }
              ]
            }
          ]
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Gemini API Error');
        }

        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
        return JSON.parse(jsonStr);

      } catch (geminiError: any) {
        console.error('Gemini v1 Vision Error, trying v1beta:', geminiError);
        
        // Try v1beta as fallback for Gemini
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
          const payload = {
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\nLütfen bu fotoğraftaki yemeği analiz et ve JSON olarak döndür.`
                  },
                  {
                    inlineData: {
                      mimeType: detectedMime,
                      data: base64Image
                    }
                  }
                ]
              }
            ]
          };

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (data.error) throw new Error(data.error.message);

          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
          return JSON.parse(jsonStr);
        } catch (v1betaError: any) {
          console.error('Gemini v1beta Vision Error, falling back to Claude:', v1betaError);
        }
      }
    }

    // Claude Fallback
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new InternalServerErrorException('Yemek analiz anahtarı (Gemini veya Anthropic) yapılandırılmamış.');
    }

    console.log('Using Claude for image analysis...');
    // Fall back to claude-haiku-4-5-20251001 (their verified chat model!)
    const claudeModel = 'claude-haiku-4-5-20251001';

    try {
      const response = await this.anthropic.messages.create({
        model: claudeModel,
        max_tokens: 1000,
        temperature: 0.2,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: detectedMime as any,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: 'Lütfen bu fotoğraftaki yemeği analiz et ve JSON olarak döndür.',
              },
            ],
          },
        ],
      });

      const responseText = (response.content[0] as any).text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      return JSON.parse(jsonStr);
    } catch (error: any) {
      console.error('Claude Vision API Error:', error);
      throw new InternalServerErrorException('Yemek fotoğrafı analiz edilirken bir hata oluştu: ' + error.message);
    }
  }
}
