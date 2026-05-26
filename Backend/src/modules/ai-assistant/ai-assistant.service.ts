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
}
