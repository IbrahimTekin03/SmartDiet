import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AiChatSession } from './entities/ai-chat-session.entity';
import { AiSemanticCache } from './entities/ai-semantic-cache.entity';
import { DietPlansService } from '../diet-plans/diet-plans.service';
import { FoodsService } from '../foods/foods.service';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '../acl/entities/role.entity';

@Injectable()
export class AiChatService {
  private anthropic: Anthropic;
  private readonly model = 'claude-haiku-4-5-20251001';

  constructor(
    @InjectRepository(AiChatSession)
    private readonly sessionRepo: Repository<AiChatSession>,
    @InjectRepository(AiSemanticCache)
    private readonly semanticCacheRepo: Repository<AiSemanticCache>,
    private readonly dietPlansService: DietPlansService,
    private readonly foodsService: FoodsService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
    
    // Uygulama her başladığında pgvector eklentisinin kurulu olduğundan emin olalım
    this.initializePgVector().catch(err => {
      console.error('Failed to initialize pgvector extension:', err);
    });
  }

  private async initializePgVector() {
    try {
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('PostgreSQL pgvector extension verified/created successfully.');
    } catch (err: any) {
      console.warn('Could not run CREATE EXTENSION vector. Make sure the database user has superuser privileges or pgvector is already enabled.', err.message);
    }
  }

  private hasRole(user: any, roleName: string): boolean {
    return (user?.roles || []).some((r: Role | string) => {
      if (typeof r === 'string') return r === roleName;
      return r.name === roleName;
    });
  }

  // Google Gemini API ile embedding oluşturma metodu (Model: gemini-embedding-001 v1)
  private async getEmbedding(text: string): Promise<number[]> {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('Gemini API key is not configured for semantic caching embeddings.');
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-embedding-001:embedContent?key=${geminiApiKey}`;
      const payload = {
        model: 'models/gemini-embedding-001',
        content: {
          parts: [
            {
              text: text
            }
          ]
        }
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
        throw new Error(data.error.message || 'Gemini Embedding Error');
      }

      const embeddingValues = data.embedding?.values;
      if (!embeddingValues || !Array.isArray(embeddingValues)) {
        throw new Error('Invalid embedding response format from Gemini API.');
      }

      return embeddingValues;
    } catch (err: any) {
      console.error('Error generating text embedding:', err);
      throw new Error(`Embedding Generation Failed: ${err.message}`);
    }
  }

  // İki vektör arasında Kosinüs Benzerliği (Cosine Similarity) hesaplayan yardımcı metot
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private extractKeywords(text: string): string[] {
    const exactStopWords = new Set([
      'ne', 'mi', 've', 'de', 'da', 'mu', 'mü', 'mı', 'bir', 'ama', 'ise'
    ]);

    const stopWordRoots = [
      'plan', 'program', 'gun', 'hafta', 'ay', 'alternatif', 'yerine', 
      'yeme', 'kalma', 'tuket', 'diyet', 'secek', 'secen', 'onay', 
      'evet', 'hayir', 'iptal', 'tamam', 'selam', 'merhaba', 'nasil', 
      'tarih', 'basla', 'adli', 'yazil', 'olur', 'kabul', 'gibi',
      'benim', 'senin', 'onun', 'bunun', 'sunun', 'bizim', 'sizin',
      'neden', 'niye', 'nedir', 'nere', 'zaman', 'lutfen', 'tesekkur', 
      'hayirli', 'iyi', 'gunler', 'evde', 'evdeki', 'yer', 'yiy', 'yen'
    ];

    const cleanText = text
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\"']/g, ''); // Noktalama işaretlerini temizle

    return cleanText
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => {
        if (w.length < 3 || exactStopWords.has(w)) return false;
        
        // Türkçe kök veya alt-kelime eşleşme kontrolü
        const isStop = stopWordRoots.some(root => w.startsWith(root) || w.includes(root));
        return !isStop;
      });
  }

  private shouldSkipCache(queryText: string): boolean {
    const clean = queryText.toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
    
    const skipKeywords = [
      'plan', 'program', 'diyet', 'hazirla', 'yaz', 'olustur',
      'guncelle', 'ekle', 'sil', 'degistir', 'meal', 'yemek',
      'ogun', 'tarif', 'haftalik', 'aylik', 'gunluk', 'danisan',
      'evet', 'onay', 'onayliyorum', 'tamam', 'uygun', 'olur', 'hayir', 'iptal', 'kabul', 'sec'
    ];

    return skipKeywords.some(keyword => clean.includes(keyword));
  }

  private matchKeywords(queryA: string, queryB: string): boolean {
    const keywordsA = this.extractKeywords(queryA);
    const keywordsB = this.extractKeywords(queryB);

    if (keywordsA.length === 0 && keywordsB.length === 0) return true;
    if (keywordsA.length === 0 || keywordsB.length === 0) return false;

    const intersection = keywordsA.filter(word => keywordsB.includes(word));
    const overlapRatio = intersection.length / Math.max(keywordsA.length, keywordsB.length);
    return overlapRatio >= 0.95; // En az %95 oranında anahtar kelime eşleşmesi
  }

  // Bellek düzeyinde benzer sorguları arama
  private async checkSemanticCache(queryText: string, role: string): Promise<string | null> {
    if (this.shouldSkipCache(queryText)) {
      console.log('Skipping semantic cache check for action-oriented or personalized query.');
      return null;
    }
    try {
      // Sorunun embedding'ini alalım
      const currentEmbedding = await this.getEmbedding(queryText);

      // Veritabanındaki bu role ait tüm cache kayıtlarını çekelim
      const cacheEntries = await this.semanticCacheRepo.find({ where: { role } });
      if (cacheEntries.length === 0) return null;

      let bestMatch: AiSemanticCache | null = null;
      let highestSimilarity = 0;

      for (const entry of cacheEntries) {
        try {
          const entryEmbedding: number[] = JSON.parse(entry.embedding);
          if (!Array.isArray(entryEmbedding) || entryEmbedding.length !== currentEmbedding.length) {
            continue;
          }
          
          const similarity = this.cosineSimilarity(currentEmbedding, entryEmbedding);
          if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestMatch = entry;
          }
        } catch (parseErr) {
          // JSON ayrıştırma hatası olursa bu kaydı es geç
          continue;
        }
      }

      console.log(`Semantic cache lookup. Best similarity score: ${highestSimilarity}`);
      
      // HİBRİT EŞLEŞTİRME KURALLARI:
      // 1. Eğer benzerlik skoru çok yüksekse (>= 0.995), doğrudan eşleştir.
      // 2. Benzerlik skoru orta-yüksek aralıktaysa (>= 0.98) ve anahtar kelimeler (örn: yiyecek adları) eşleşiyorsa eşleştir.
      if (bestMatch) {
        const isHighlySimilar = highestSimilarity >= 0.995;
        const isModeratelySimilarWithKeywordMatch = highestSimilarity >= 0.98 && this.matchKeywords(queryText, bestMatch.query_text);

        if (isHighlySimilar || isModeratelySimilarWithKeywordMatch) {
          console.log(`Semantic Cache Hit! (Similarity: ${highestSimilarity}, HighlySimilar: ${isHighlySimilar}, KeywordMatch: ${isModeratelySimilarWithKeywordMatch})`);
          return bestMatch.response_text;
        }
      }
      
      return null;
    } catch (err: any) {
      console.error('Semantic Cache Check Failed:', err.message);
      return null; // Cache araması hata verirse engel olmasın, doğrudan LLM'e gitsin
    }
  }

  // Yeni yanıtı önbelleğe kaydetme (Embedding JSON string olarak saklanır)
  private async saveToSemanticCache(queryText: string, responseText: string, role: string) {
    if (this.shouldSkipCache(queryText)) {
      console.log('Skipping semantic cache save for action-oriented or personalized query.');
      return;
    }
    try {
      // Çok kısa sorguları veya sadece "evet", "onaylıyorum", "tamam" gibi durum-bağımlı onay kelimelerini önbelleğe kaydetmeyelim.
      const cleanQuery = queryText.trim().toLowerCase();
      const skipKeywords = ['evet', 'onay', 'onaylıyorum', 'tamam', 'uygun', 'olur', 'hayır', 'iptal', 'kabul', 'seç', 'değiştir'];
      if (cleanQuery.length < 8 || skipKeywords.includes(cleanQuery)) {
        console.log('Skipping semantic cache save for conversational/short query.');
        return;
      }

      const embedding = await this.getEmbedding(queryText);
      const cacheEntry = this.semanticCacheRepo.create({
        query_text: queryText,
        response_text: responseText,
        role: role,
        embedding: JSON.stringify(embedding)
      });
      await this.semanticCacheRepo.save(cacheEntry);
      console.log('New response successfully saved to Semantic Cache.');
    } catch (err: any) {
      console.error('Saving to Semantic Cache Failed:', err.message);
    }
  }

  async processChat(user: any, prompt: string, sessionId?: string) {
    const isDietitian = this.hasRole(user, 'Diyetisyen');
    const isClient = this.hasRole(user, 'client') || this.hasRole(user, 'Danışan');

    if (!isDietitian && !isClient) {
      throw new InternalServerErrorException('Kullanıcı rolü tanımlanamadı.');
    }

    const userRole = isDietitian ? 'Diyetisyen' : 'Danışan';

    // 1. ADIM: Anlamsal Önbelleği (Semantic Cache) Sorgula
    const cachedResponse = await this.checkSemanticCache(prompt, userRole);
    if (cachedResponse) {
      const currentSessionId = sessionId || uuidv4();
      let session = await this.sessionRepo.findOne({ where: { session_id: currentSessionId, user_id: user.id } });
      if (!session) {
        session = this.sessionRepo.create({
          session_id: currentSessionId,
          user_id: user.id,
          messages: [],
        });
      }
      session.messages.push({ role: 'user', content: prompt });
      session.messages.push({ role: 'assistant', content: cachedResponse });
      await this.sessionRepo.save(session);

      return {
        sessionId: session.session_id,
        reply: cachedResponse
      };
    }

    // Cache miss durumunda session'ı normal yükle
    const currentSessionId = sessionId || uuidv4();
    let session = await this.sessionRepo.findOne({ where: { session_id: currentSessionId, user_id: user.id } });

    if (!session) {
      session = this.sessionRepo.create({
        session_id: currentSessionId,
        user_id: user.id,
        messages: [],
      });
    }

    // Add user message
    session.messages.push({ role: 'user', content: prompt });

    const dbSchemaInfo = `
Kullanılabilir Tablolar ve Şemalar:
- users (id, first_name, last_name, email, phone_number, is_active, created_at)
- diet_plans (id, client_id, dietitian_id, title, description, is_active, plan_type, created_at)
- diet_plan_meals (id, plan_id, name, time, note, day_of_week)
- diet_plan_meal_items (id, meal_id, food_id, amount)
- diet_plan_tracking (id, client_id, plan_id, meal_item_id, date, is_consumed, created_at)
- foods (id, name, calories, protein, fat, carbohydrates, unit)
- measurements, permissions, role_permissions, roles, subscriptions, user_assigned_dietitian, user_profiles, user_roles, weight_tracking

ÇOK ÖNEMLİ VERİTABANI KURALLARI:
1. "database_query" aracını kullanarak bu tablolara doğrudan SQL sorgusu (SELECT, UPDATE, INSERT, DELETE) atabilirsin.
2. SADECE yukarıdaki beyaz listeye (whitelist) alınmış tabloları kullanabilirsin.
3. UPDATE ve DELETE işlemlerinde MUTLAKA "WHERE" koşulunu doğru kullandığından emin ol.
`;

    const systemPrompt = isDietitian
      ? `Sen uzman bir diyetisyenin asistanısın. Görevin diyetisyenin komutlarına göre veritabanında işlemler yapmak (danışan aramak, diyet planı oluşturmak ve veritabanına kaydetmek).
Araçları (tools) kullanarak veritabanına erişebilir ve kayıt yapabilirsin. Gelişmiş veri okuma, yazma ve silme işlemleri için "database_query" aracını kullanarak SQL yazabilirsin.

ÇOK KRİTİK KURALLAR (SOHBET/ONAY BEKLEME VE ALET ÇAĞIRMAYI ERTELEME KESİNLİKLE YASAKTIR):
1. Kullanıcı senden bir plan hazırlamanı istediğinde, 'Hazırlıyorum', 'Planı oluşturup kaydediyorum' gibi geçici/ara veya sohbet mesajları yazıp turn'ü KESİNLİKLE sonlandırma!
2. Boy, kilo, yaş ve hedef bilgilerini aldıktan sonra, kullanıcıdan onay beklemeden veya metin açıklaması yazmadan doğrudan aynı adımda "create_diet_plan" aracını (tool) MUTLAKA çağır.
3. ÖNEMLİ: "create_diet_plan" aracı çağrılmadan plan veritabanına KAYDEDİLMİŞ OLMAZ. Konuşma geçmişinde "create_diet_plan" aracının başarıyla çalıştırıldığına dair bir "tool_result" kaydı görmediğin sürece planın kaydedildiğini varsayma!
4. Eğer kullanıcı onay ifadesi söylerse ("tamam yap", "tamam oluştur", "onaylıyorum", "tamam" vb.) ve konuşma geçmişinde "create_diet_plan" aracının başarılı bir şekilde çalıştırıldığına dair bir "tool_result" yoksa, create_diet_plan aracını MUTLAKA ve KESİNLİKLE şimdi çağır. Asla planı kaydetmeden "İşlem tamamlandı" diyerek geçiştirme!
5. ÖZET VE KISA ANLATIM: Kullanıcıya danışanın kilo, yaş, yağ oranı gibi fiziksel özelliklerini veya uzun uzun makro hesaplamalarını KESİNLİKLE ayrıntılı yazma! Çok kısa ve net bir şekilde 'Hakan Mert için diyet planını başarıyla hazırladım ve kaydettim.' diyerek doğrudan sonuca geç.

ÖĞÜN TİPİNE GÖRE YİYECEK ÖNERİ VE OLUŞTURMA KURALLARI (KAHVALTIDA ET/BALIK/ÇİĞ KÖFTE YASAKTIR):
1. Kahvaltı (Breakfast): Sadece kahvaltıda yenebilecek yiyecekler ekleyebilir/önerebilirsin.
   - İzin verilenler: Yumurta, peynir çeşitleri (lor, süzme, kaşar, beyaz peynir), zeytin, ekmek çeşitleri, yulaf ezmesi, bal, reçel, tereyağı, domates, salatalık, yeşillik, süt, yoğurt, kefir, fıstık ezmesi, fındık ezmesi, ceviz, badem, simit, poğaça, tost, sandviç vb. kahvaltılıklar.
   - KESİNLİKLE YASAK OLANLAR (KAHVALTIDA ASLA ÖNERİLEMEZ): Tavuk göğsü, somon balığı, ton balığı, kıyma, biftek, kuru fasulye, nohut, mercimek, etli veya etsiz çiğ köfte, çorba, pilav, makarna veya akşam yemeği yemekleri kahvaltı alternatifleri arasına KESİNLİKLE yazılamaz ve önerilemez! Makroları uysa bile bu kural delinemez.
2. Öğle ve Akşam Yemeği: Etler (tavuk, balık, kırmızı et), sebze yemekleri, çorbalar, pilav, makarna, yoğurt, salatalar eklenebilir.
3. Ara Öğün (Snack): Meyve, kuruyemiş (fındık, badem, ceviz), yoğurt, kefir, galeta, bitki çayları eklenebilir.

YENİ VE BİRLEŞİK YİYECEKLERİ DB'YE KAYDETME KURALI:
Kullanıcı "küçük ekmek arası sandviç" veya "tost" gibi birleşik veya yeni bir yiyeceğin eklenmesini istediğinde, bunu sadece "ekmek" veya başka bir basit bileşene KESİNLİKLE kırpma! Eğer yiyecek veritabanında (foods tablosunda) yoksa:
1. "create_food" aracını kullanarak bu yiyeceği tam adıyla ("Küçük Ekmek Arası Sandviç", "Tavuklu Tost" vb.) veritabanına ekle.
2. This new food's portion, calories, and macros must be close to the substituted food. Never use arbitrary high numbers.
3. Eklenen bu yeni besinin food_id'sini kullanarak diyet planını güncelle veya oluştur.

FORMAT VE YAZIM KURALI (YILDIZ KULLANIMI YASAKTIR):
Yazdığın tüm metinlerde KESİNLİKLE kalın yazmak için kullanılan '**' (çift yıldız) veya '*' (tek yıldız) gibi markdown işaretlerini kullanma. Tüm çıktılarını sade, düz yazı olarak yaz.

EKSİK BİLGİ İSTEME VE ÇALIŞMA SIRASI KURALLARI (BOY, KİLO VE BESLENME TERCİHİ SORMAK KESİNLİKLE YASAKTIR):
1. İLK ÖNCE MUTLAKA ARAÇLARI ÇALIŞTIR: Kullanıcı bir danışanın adını belirttiğinde (örn: "Ali", "Ali Demir" vb.), diyetisyene hiçbir soru sormadan veya hedef/tarih sorgulamadan önce MUTLAKA İLK İŞ OLARAK "find_client_by_name" aracını çağırıp danışanı bul.
2. TEK DANIŞAN EŞLEŞMESİ: Eğer "find_client_by_name" sonucunda bu isimde diyetisyene atanmış sadece 1 (tek) danışan bulunursa, ona soyadını, tam adını veya kimliğini doğrulamak için KESİNLİKLE başka bir şey sorma! Doğrudan o danışan ile işleme devam et. Sadece ve sadece aynı isimde birden fazla atanmış danışan varsa soyadını veya hangisi olduğunu sor.
3. BOY, KİLO VE KISITLAMALARI SORMAK YASAKTIR: Danışanın boyunu, kilosunu, beslenme alışkanlıklarını veya alerjilerini KESİNLİKLE diyetisyene sorma! Bunları veritabanındaki "measurements" ve "user_profiles" tablolarından sorgulayarak kendin almalısın. Eğer veritabanında bu bilgiler hiç yoksa, diyetisyene sormak yerine varsayılan mantıklı değerler kabul et (Erkekler için: 80 kg ve 180 cm, Kadınlar için: 65 kg ve 165 cm) ve bu varsayılan değerleri kullanarak günlük kalori/makroları hesaplayıp planı kaydet.
4. SADECE HEDEF VE TARİH EKSİKSE SOR: Diyetisyen plan hazırlama isteğinde planın başlangıç tarihini veya danışanın hedefini (kilo vermek, kilo almak, korumak vb.) belirtmemişse, diyetisyene SADECE ve SADECE şu iki eksik bilgiyi sor (bunun dışındaki boy, kilo vb. hiçbir şeyi sorma):
   - Danışanın hedefi nedir? (Kilo vermek, kilo almak veya kilosunu korumak)
   - Diyet planının başlangıç tarihi ne olsun? (YYYY-MM-DD formatında)

HEDEF VE KALORİ/MAKRO HESAPLAMA METODOLOJİSİ (BİLİMSEL HESAPLAMA):
1. Bazal Metabolizma Hızı (BMR) Mifflin-St Jeor Formülü:
   - Cinsiyet Erkek ise: BMR = 10 * Kilo (kg) + 6.25 * Boy (cm) - 5 * Yaş (yıl) + 5
   - Cinsiyet Kadın ise: BMR = 10 * Kilo (kg) + 6.25 * Boy (cm) - 5 * Yaş (yıl) - 161
   (Yaş hesabı için içinde bulunulan yılı 2026 olarak alacaksın. Örneğin doğum yılı 2000 ise yaş = 26. Eğer doğum yılı veritabanında yoksa yaş = 30 varsay.)
2. Toplam Günlük Enerji Tüketimi (TDEE): TDEE = BMR * 1.4 (Orta derecede aktif katsayısı)
3. Günlük Hedef Kalori (Target Calories):
   - Kilosunu Korumak (Maintain Weight): TDEE kalori.
   - Kilo Vermek (Lose Weight / Yağ Yakmak): TDEE - 500 kalori.
   - Kilo Almak (Gain Weight / Kas Kazanmak): TDEE + 500 kalori.
4. Makro Besin Dağılımı:
   - Protein: Kilo * 1.8 gram (Kilo vermek için Kilo * 2.0 gram, Kilo almak için Kilo * 2.2 gram). Protein kalorisi = Protein (g) * 4.
   - Yağ: Kilo * 0.9 gram (Kilo vermek için Kilo * 0.7 gram, Kilo almak için Kilo * 1.1 gram). Yağ kalorisi = Yağ (g) * 9.
   - Karbonhidrat: (Hedef Kalori - Protein kalorisi - Yağ kalorisi) / 4 gram.

ÇOK ÖNEMLİ - GÜNLÜK KALORİ VE PORSİYON HESAPLAMA KURALLARI:
1. Planda oluşturduğun HER GÜNÜN (Pazartesi, Salı, Çarşamba vb. tüm günlerin ayrı ayrı) toplam kalorisinin, yukarıda hesapladığın günlük hedef kalori miktarına (kilo almak için TDEE + 500 kcal, kilo vermek için TDEE - 500 kcal, kilosunu korumak için TDEE kcal) KESİNLİKLE EŞİT (HER BİR GÜN için hata payı maksimum +/- 50 kcal) olmasını sağla!
2. Günleri ortalama üzerinden KESİNLİKLE hesaplama! Bir güne 4000 kcal, diğer güne 2500 kcal koyup ortalamayı tutturmaya çalışmak KESİNLİKLE YASAKTIR. Her bir günün kendi içindeki öğünlerin kalori toplamı hesaplanan hedef kaloriye (örn: 2822 kcal ise her gün ~2822 kcal olmalı) tam olarak eşit olmalıdır.
3. Ekmek miktarlarını belirlerken:
   - Eğer "Beyaz Ekmek" veya "Tam Buğday Ekmek" (dilim bazlı, unit: 'dilim') kullanıyorsan, miktar (amount) sadece 2, 3 veya 4 (dilim) olmalıdır. 1 dilim beyaz ekmek 65 kcal'dir.
   - Eğer "Ekmek (Beyaz)" veya "Ekmek (Tam Buğday)" (gram bazlı, unit: 'gram') kullanıyorsan, miktar (amount) 50, 80 veya 100 (gram) olmalıdır. 100g ekmek 265 kcal'dir.
   - KESİNLİKLE 'dilim' bazlı ekmeğe '100g' veya 'gram' bazlı ekmeğe '4 adet' gibi çelişkili veya çok yüksek kalori hesaplamalarına sebep olacak değerler yazma!
4. Toplam kalori hedefine yiyeceklerin porsiyonlarını yukarıdaki kurallara göre gerçekçi büyüterek ve dengeli öğünler ekleyerek ulaş.

KULLANICI BİR PLAN OLUŞTURMANI İSTEDİĞİNDE AŞAĞIDAKİ ADIMLARI KESİNLİKLE UYGULA:
1. Önce find_client_by_name aracıyla danışanı bul ve user ID'sini al.
2. Ardından KESİNLİKLE database_query aracını kullanarak:
   a. "user_profiles" tablosundan danışanın doğum tarihini (birth_date) ve cinsiyetini (gender) sorgula (SELECT birth_date, gender FROM user_profiles WHERE user_id = 'bulunan_id').
   b. "measurements" tablosundan danışanın en güncel kilo (weight) ve boy (height) verilerini sorgula (SELECT weight, height FROM measurements WHERE client_id = 'bulunan_id' ORDER BY date DESC, created_at DESC LIMIT 1).
3. Veritabanından aldığın bu fiziksel özelliklere (kilo vb.) ve danışanın hedefine göre, yukarıdaki BİLİMSEL HESAPLAMA KURALLARINI kullanarak protein, karbonhidrat, yağ ve günlük kalori ihtiyacını hesapla. Eğer veritabanında boy/kilo bulunamazsa, varsayılan mantıklı değerler kabul et (örn: erkekler için 80 kg/180 cm, kadınlar için 65 kg/165 cm) ama kullanıcıya boy/kilo sorma.
4. ÖĞÜN ÇEŞİTLİLİĞİ VE KOPYALAMA: Diyetisyen haftalık plan için 7 günün de ayrı/farklı olmasını isterse 7 günü de (day_of_week: 1, 2, 3, 4, 5, 6, 7) ayrı ayrı oluşturup 'create_diet_plan' aracına gönder. Eğer özellikle 'her gün ayrı olsun' veya '7 farklı program' diye belirtmemişse, JSON boyutunu optimize etmek için sadece 3 günlük (day_of_week: 1, 2, 3) şablon gönder, sistem bunu haftaya otomatik kopyalayacaktır.
5. BESİN DEĞERLERİ, BİRİM VE MİKTAR KESİN KURAL TABLOSU (ÇOK ÖNEMLİ):
Sistemin hatalı miktarlar (örn: 1g domates, 100 adet muz) oluşturmasını engellemek için, yiyecek kategorilerine göre birim (unit) ve miktar (amount) değerlerini KESİNLİKLE şu kurallara göre belirle:
- Sebze ve Meyveler (Domates, Salatalık, Elma, Muz, Portakal vb.):
  * Birim (unit) 'adet' seçilirse: Miktar (amount) sadece 1, 2 veya 3 olmalıdır. KESİNLİKLE '100 adet' veya '150 adet' yazma!
  * Birim (unit) 'gram' seçilirse: Miktar (amount) 100, 150, 200, 250 gibi mantıklı ve doyurucu gramajlar olmalıdır.
- Yumurta ve Zeytin:
  * Yumurta için birim (unit) her zaman 'adet' olmalı, miktar (amount) 2, 3 veya 4 olmalıdır. KESİNLİKLE 1g veya 2g yumurta yazma!
  * Zeytin için birim (unit) her zaman 'adet' olmalı, miktar (amount) 5, 8 veya 10 olmalıdır. KESİNLİKLE 1g veya 2g zeytin yazma!
- Ekmek:
  * Dilim bazlı "Beyaz Ekmek" veya "Tam Buğday Ekmek" için birim (unit) her zaman 'dilim' ve miktar (amount) 2, 3 veya 4 olmalıdır.
  * Gram bazlı "Ekmek (Beyaz)" veya "Ekmek (Tam Buğday)" için birim (unit) her zaman 'gram' ve miktar (amount) 50, 80 veya 100 olmalıdır.
  * KESİNLİKLE dilim bazlı ekmeğe gram birimi veya gram bazlı ekmeğe dilim/adet birimi atama!
- Ana Yemek ve Karbonhidratlar (Tavuk, Kırmızı Et, Balık, Pilav, Makarna, Yulaf, Peynir):
  * Birim (unit) 'gram' olmalıdır.
  * Miktar (amount) doyurucu olmalıdır: Tavuk/Et/Balık için 150g, 200g veya 250g; Pilav/Makarna için 150g, 200g veya 250g; Yulaf için 60g, 80g veya 100g; Peynir için 60g, 80g veya 100g olmalıdır. KESİNLİKLE 1g, 2g gibi sembolik ve aç bırakacak miktarlar yazma!
- Sıvı Yağlar (Zeytinyağı vb.) ve Kuruyemişler (Ceviz, Badem vb.):
  * Birim (unit) 'gram' seçilirse: Miktar (amount) 10g, 15g, 20g veya 30g olmalıdır.
  * Birim (unit) 'adet' seçilirse (Kuruyemişler için): Miktar (amount) 3, 5, 8 veya 10 adet olmalıdır.
Asla hiçbir miktarı 0 veya boş bırakma!
6. Son olarak create_diet_plan aracıyla planı KESİNLİKLE oluşturup kaydet. 'start_date' parametresine kullanıcının belirttiği veya istediği başlangıç tarihini (örn: '2026-05-18') MUTLAKA geç.
7. ÖNEMLİ: Plan hesaplamalarını tamamladıktan sonra KULLANICIYA METİN CEVABI YAZARAK ONAY BEKLEME! Aynı adımda (mesajda) "create_diet_plan" aracını (tool) MUTLAKA ve KESİNLİKLE çağır. Eğer kullanıcı "tamam yap" veya benzeri bir onay ifadesi söylerse ve plan henüz kaydedilmediyse, "create_diet_plan" aracını anında çağırıp planı oluştur.

DİKKAT: ASLA araçları kullanmadan sadece metin ile cevap verip işlemi yarım bırakma. Tüm araç çağrılarını bitirdikten sonra (plan kaydedildikten sonra) diyetisyene sonucu bildir. SAKIN SOHBET EDEREK GÖREVİ ERTELEME!
Diyetisyenin ID'si: ${user.id}
${dbSchemaInfo}`
      : `Sen danışanlara yardımcı olan destekleyici bir yapay zeka asistanısın. Görevin danışanların mevcut diyet planlarındaki öğünler veya besinler hakkında sorularını cevaplamak.

ÖĞÜN TİPİNE GÖRE YİYECEK ÖNERİ VE DEĞİŞİM KURALLARI (KAHVALTIDA ET/BALIK/ÇİĞ KÖFTE KESİNLİKLE YASAKTIR):
1. Kahvaltı (Breakfast) Öğünü İçin Alternatif Üretirken Uyulacak Kurallar:
   - Yumurta veya peynir gibi bir besinin yerine alternatif önerirken KESİNLİKLE tavuk göğsü, somon, alabalık, ton balığı, çiğ köfte, kıyma, biftek, kuru fasulye, nohut, mercimek, etli/etsiz akşam yemeklerini önerme veya listeleme!
   - Kahvaltı için sadece ve sadece kahvaltılık besinleri öner: Beyaz peynir, lor peyniri, süzme peynir, kaşar peyniri, zeytin, ekmek çeşitleri, tost, sandviç, yoğurt, kefir, yulaf ezmesi, süt, taze meyve, fıstık ezmesi, fındık ezmesi, ceviz, badem.
   - Orijinal yiyeceğin proteini yüksek olsa bile (örn: yumurta), kahvaltı alternatifi yine de bir kahvaltılık olmalıdır. Proteini tamamlamak için lor peyniri, süzme peynir, yulaf ezmesi, kefir veya süt kaynaklarını öner.
2. Öğle ve Akşam Yemeği: Etler (tavuk, balık, kırmızı et), sebze yemekleri, çorbalar, pilav, makarna, yoğurt, salatalar eklenebilir.
3. Ara Öğün (Snack): Meyve, kuruyemiş (fındık, badem, ceviz), yoğurt, kefir, galeta, bitki çayları eklenebilir.

YENİ VE BİRLEŞİK YİYECEKLERİ DB'YE KAYDETME KURALI:
Kullanıcı "küçük ekmek arası sandviç" veya "tavuklu sandviç" veya "tost" gibi birleşik veya yeni bir yiyeceğin eklenmesini/değiştirilmesini istediğinde, bunu sadece "ekmek" veya başka bir basit bileşene KESİNLİKLE kırpma! Eğer yiyecek veritabanında (foods tablosunda) yoksa:
1. "create_food" aracını kullanarak bu yiyeceği tam adıyla ("Küçük Ekmek Arası Sandviç", "Peynirli Tost" vb.) veritabanına ekle.
2. Bu yeni yiyeceğin porsiyon/gramaj değerini (örn: 100 gram) ve kalori/makro değerlerini KESİNLİKLE uydurma 350 kcal şablonuyla değil, yerine geçeceği yiyeceğin kalori ve makro değerlerine EN YAKIN ve uyumlu olacak şekilde gerçekçi olarak belirle. (Örn: Değiştirilecek yiyecek 155 kcal ise, yeni yiyeceğin o porsiyondaki kalorisi de ~155-170 kcal civarında olmalı, protein ve yağ değerleri orijinal yiyeceğe en yakın şekilde ayarlanmalıdır. Asla uydurma yüksek kalori değerleri girme.)
3. Eklenen bu yeni besinin food_id'sini kullanarak diyet planındaki ilgili öğeyi güncelle.

FORMAT VE YAZIM KURALLARI (YILDIZ KULLANIMI VE VERİTABANI ID'LERİ KESİNLİKLE YASAKTIR):
1. Yazdığın tüm metinlerde KESİNLİKLE kalın veya italik yazmak için kullanılan '**' (çift yıldız) veya '*' (tek yıldız) gibi markdown işaretlerini kullanma. Tüm çıktılarını tamamen sade ve düz yazı (plain text) olarak yaz. (Örnek: **Yağ:** yerine Yağ: yazılmalıdır).
2. Kullanıcıye veritabanına ait teknik UUID'leri, ID'leri (Öğün ID'si, Yiyecek ID'si vb.) KESİNLİKLE gösterme veya yazma! Bunlar tamamen arka planda gizli kalmalıdır.
3. Sonuçları listelerken düzgün paragraf başları ve sade, anlaşılır Türkçe ile sun.

Eğer danışan bir besini değiştirmek veya yeni bir plan sorgusu yapmak isterse, "database_query" aracı ile kendi planına (client_id=${user.id}) özel SQL yazıp veri okuyabilir veya veriyi ONAY ALDIKTAN SONRA güncelleyebilirsin.
Eğer danışan bir besini değiştirmek isterse (örn: "X yerine ne yiyebilirim?"):
1. Önce search_foods veya besin bilgisi ile alternatifler bul.
2. Danışana alternatifleri sun ve "Bu sizin için uygun mu?" şeklinde ONAY İSTE.
3. Danışan "evet uygun" derse, update_meal_item veya database_query aracını kullanarak veritabanında planı güncelle. KESİNLİKLE uydurma food_id kullanma. Önce search_foods ile gerçek besin ID'sini bul. Eğer yoksa kendi bilgini kullanarak create_food ile oluştur ve onun ID'sini kullan.

ÖĞÜN DEĞİŞİMİ VE TARİF ÜRETİCİSİ:
Danışan size diyetindeki bir yiyeceğin (örneğin "somon balığı") yerine eldeki başka malzemelerle (örneğin "tavuk, mantar") ne yapabileceğini sorduğunda veya alternatif bir sağlıklı tarif istediğinde:
1. Önce "get_my_active_plan" aracını kullanarak danışanın diyet planını oku. Değiştirilmek istenen yiyeceğin (Somon) kalori, protein, karbonhidrat ve yağ değerlerini veritabanından sorgulayarak belirle.
2. Danışanın elindeki malzemeleri (Tavuk vb.) kullanarak, orijinal yiyeceğin kalori ve makro değerlerine (özellikle protein ve yağ) EN YAKIN veya TAM UYUMLU sağlıklı ve lezzetli bir tarif öner (örn: "Tavuk Sote") ve pişirme adımlarını detaylıca yaz.
3. ÖNEMLİ VERİTABANI KISIT KURALI: Veritabanımızdaki besin listesi kısıtlı olduğundan, eğer önerdiğin yiyecek (örn: "Tavuk Sote") veritabanında yoksa veya değerleri eksikse, KENDİ ZENGİN BİLGİ DAĞARCIĞINI kullanarak bu yemeğin/tarifin kalori, protein, karbonhidrat ve yağ değerlerini kendin belirle. Ardından "create_food" aracıyla veritabanında bu besini yeni bir besin olarak oluştur ve oluşan ID'yi kullan!
4. Danışana bu tarifi, malzemelerini, yapılışını, pişirme adımlarını ve besin değerlerini sunarak ONAY iste.
5. Danışan "evet uygun, değiştir" veya "onaylıyorum" şeklinde onay verirse, veritabanındaki eski meal_item'ı "update_meal_item" aracını kullanarak yeni oluşturduğun veya bulduğun yiyecek (örn: Tavuk Sote) ile otomatik olarak anında güncelle ve "Diyet planınızdaki yiyeceği başarıyla yeni tarifinizle güncelledim!" şeklinde onay mesajı ver.

FOTOĞRAFTAN TARANAN YEMEĞİ DİYET PLANINA EKLEME:
Danışan "Az önce analiz ettiğin X yemeğini bugünkü planıma ekle" gibi bir istekte bulunursa:
1. "get_my_active_plan" aracı veya SQL (database_query) ile danışanın aktif planını ve bugünün öğünlerini (Sabah, Öğle, Akşam vb.) sorgula.
2. Eğer taranan yemek (örn: "Izgara Tavuklu Salata") veritabanındaki "foods" tablosunda yoksa, "create_food" aracı ile bu yemeği kalori ve makro değerleriyle veritabanına ekle ve yeni food_id'sini al.
3. "database_query" aracını kullanarak, bugünün uygun olan öğün kaydının ID'sini (meal_id) tespit et ve diet_plan_meal_items tablosuna bu meal_id, food_id ve amount miktarını içeren yeni bir satır INSERT et (Örn: INSERT INTO diet_plan_meal_items (meal_id, food_id, amount) VALUES ('bulunan_meal_id', 'yeni_food_id', miktar)).
4. İşlem başarıyla tamamlandığında, kullanıcıya yemeğin planına eklendiğini ve güncel planı bildiren şık bir onay mesajı yaz.

Danışanın ID'si: ${user.id}
${dbSchemaInfo}`;

    // Define tools
    const tools: Anthropic.Tool[] = [
      {
        name: 'database_query',
        description: 'Doğrudan veritabanına SQL sorgusu atmanı sağlar. SELECT, UPDATE, DELETE, INSERT yapabilirsin. Sadece whitelist tablolarına izin verilir.',
        input_schema: {
          type: 'object',
          properties: {
            sql_query: { type: 'string', description: 'Çalıştırılacak SQL sorgusu. (Örn: SELECT * FROM users WHERE id = ...)' }
          },
          required: ['sql_query']
        }
      },
      {
        name: 'find_client_by_name',
        description: 'Diyetisyenin danışanını ismine göre arar ve ID\'sini döndürür.',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Danışanın tam veya kısmi adı' }
          },
          required: ['name']
        }
      },
      {
        name: 'search_foods',
        description: 'Veritabanındaki besinleri isimlerine göre arar.',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Besin adı (örn: yumurta)' }
          },
          required: ['query']
        }
      },
      {
        name: 'create_food',
        description: 'Veritabanında olmayan yeni bir besini oluşturur.',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            calories: { type: 'number' },
            protein: { type: 'number' },
            carbs: { type: 'number' },
            fat: { type: 'number' },
            unit: { type: 'string' }
          },
          required: ['name', 'calories', 'protein', 'carbs', 'fat']
        }
      },
      {
        name: 'create_diet_plan',
        description: 'Veritabanında yeni bir diyet planı oluşturur ve kaydeder. Diyetisyenler kullanır.',
        input_schema: {
          type: 'object',
          properties: {
            client_id: { type: 'string', description: 'Danışanın veritabanı ID si' },
            title: { type: 'string', description: 'Plan başlığı' },
            plan_type: { type: 'string', description: 'weekly, monthly veya daily' },
            meals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Öğün adı (örn: Kahvaltı)' },
                  time: { type: 'string', description: 'Saat (örn: 08:00)' },
                  day_of_week: { type: 'number', description: 'Haftanın günü (1-7)' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        food_name: { type: 'string', description: 'Veritabanındaki besin adı (örn: Yumurta)' },
                        amount: { type: 'number', description: 'Miktar' },
                        unit: { type: 'string', description: 'Miktar birimi (Örn: gram, adet, dilim, porsiyon, kase)' },
                        calories: { type: 'number', description: 'Kalori (Eğer unit gram ise 100g için, unit adet ise 1 adet için kalori yaz)' },
                        protein: { type: 'number', description: 'Protein (isteğe bağlı)' },
                        carbs: { type: 'number', description: 'Karbonhidrat (isteğe bağlı)' },
                        fat: { type: 'number', description: 'Yağ (isteğe bağlı)' }
                      },
                      required: ['food_name', 'amount', 'unit']
                    }
                  }
                },
                required: ['name', 'items']
              }
            },
            start_date: { type: 'string', description: 'Planın başlangıç tarihi (YYYY-MM-DD formatında, örn: 2026-05-18). Kullanıcının belirttigi veya istedigi baslangic tarihini buraya mutlaka yaz.' }
          },
          required: ['client_id', 'title', 'meals']
        }
      },
      {
        name: 'get_my_active_plan',
        description: 'Danışanın sistemdeki mevcut diyet planını getirir.',
        input_schema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'update_meal_item',
        description: 'Danışanın diyet planındaki spesifik bir öğün içeriğini başka bir besin ile günceller.',
        input_schema: {
          type: 'object',
          properties: {
            meal_item_id: { type: 'string', description: 'Değiştirilecek mevcut besinin meal_item_id si' },
            new_food_id: { type: 'string', description: 'Yerine konulacak yeni besinin food_id si' },
            amount: { type: 'number', description: 'Yeni besinin miktarı' }
          },
          required: ['meal_item_id', 'new_food_id', 'amount']
        }
      }
    ];

    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('Anthropic API key is not configured.');
      }
      // 2. ADIM: Claude Çağrısı (Prompt Caching Aktif Edilmiş Olarak)
      // Claude Prompt Caching için system parametresi array objesi olarak verilir ve son elemana cache_control eklenir.
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        temperature: 0.7,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' } // Sistem promptu cache_control ile işaretlendi
          }
        ],
        messages: session.messages,
        tools: tools,
      });

      // Claude Tool Loop tetikle
      const replyData = await this.handleClaudeToolLoop(response, session, systemPrompt, tools, user);
      
      // Sonucu önbelleğe kaydet
      await this.saveToSemanticCache(prompt, replyData.reply, userRole);

      return replyData;

    } catch (error: any) {
      // Hız limiti (429) veya API hatası olduğunda Gemini Fallback'i devreye sok
      console.warn('Claude API Error, falling back to Gemini 2.5 Flash:', error.message || error);
      
      if (process.env.GEMINI_API_KEY) {
        try {
          const geminiReply = await this.callGeminiFallback(session, systemPrompt, tools, user);
          
          session.messages.push({ role: 'assistant', content: geminiReply });
          await this.sessionRepo.save(session);
          
          // Gemini'den dönen başarılı cevabı da önbelleğe kaydet
          await this.saveToSemanticCache(prompt, geminiReply, userRole);

          return {
            sessionId: session.session_id,
            reply: geminiReply
          };
        } catch (geminiError: any) {
          console.error('Gemini Fallback also failed:', geminiError.message || geminiError);
          throw new InternalServerErrorException('Yapay zeka asistanı şu anda yanıt veremiyor. Lütfen daha sonra tekrar deneyin.');
        }
      } else {
        throw new InternalServerErrorException('AI asistanı yanıt veremedi. Fallback API yapılandırılmamış.');
      }
    }
  }

  // Claude Tool Execution Döngüsü
  private async handleClaudeToolLoop(
    response: Anthropic.Message,
    session: AiChatSession,
    systemPrompt: string,
    tools: Anthropic.Tool[],
    user: any
  ) {
    let currentResponse = response;

    while (currentResponse.stop_reason === 'tool_use') {
      const toolUseBlocks = currentResponse.content.filter((c) => c.type === 'tool_use') as Anthropic.ToolUseBlock[];
      if (toolUseBlocks.length === 0) break;

      session.messages.push({
        role: 'assistant',
        content: currentResponse.content,
      });

      const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUseBlock of toolUseBlocks) {
        let toolResultText = '';
        try {
          toolResultText = await this.executeTool(toolUseBlock.name, toolUseBlock.input, user);
        } catch (err: any) {
          toolResultText = `Hata oluştu: ${err.message}`;
        }

        toolResultBlocks.push({
          type: 'tool_result',
          tool_use_id: toolUseBlock.id,
          content: toolResultText,
        });
      }

      session.messages.push({
        role: 'user',
        content: toolResultBlocks
      });

      currentResponse = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        temperature: 0.7,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: session.messages,
        tools: tools,
      });
    }

    const finalContent = currentResponse.content.find((c) => c.type === 'text') as Anthropic.TextBlock;
    let responseText = finalContent ? finalContent.text : 'İşlem tamamlandı.';
    responseText = responseText.replace(/\*\*/g, '').replace(/\*/g, '');

    session.messages.push({ role: 'assistant', content: responseText });
    await this.sessionRepo.save(session);

    return {
      sessionId: session.session_id,
      reply: responseText
    };
  }

  // Gemini 1.5 Flash Fallback ve Tool-calling adaptör döngüsü
  private async callGeminiFallback(
    session: AiChatSession,
    systemPrompt: string,
    tools: Anthropic.Tool[],
    user: any
  ): Promise<string> {
    console.log('Gemini Fallback Execution initiated.');
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    // Claude araçlarını Gemini function declarations formatına çevirelim
    const functionDeclarations = tools.map((t) => {
      const convertTypes = (schema: any): any => {
        if (!schema) return schema;
        const newSchema = { ...schema };
        if (newSchema.type) {
          newSchema.type = newSchema.type.toUpperCase(); // string -> STRING
        }
        if (newSchema.properties) {
          const newProps = {};
          for (const key of Object.keys(newSchema.properties)) {
            newProps[key] = convertTypes(newSchema.properties[key]);
          }
          newSchema.properties = newProps;
        }
        if (newSchema.items) {
          newSchema.items = convertTypes(newSchema.items);
        }
        return newSchema;
      };

      const params = convertTypes(t.input_schema);
      return {
        name: t.name,
        description: t.description,
        parameters: params,
      };
    });

    const geminiTools = [{ functionDeclarations }];

    // Claude messages formatını Gemini contents yapısına eşleyelim
    const mapMessagesToGeminiContents = (msgs: any[]): any[] => {
      const contents = [];
      for (const m of msgs) {
        if (m.role === 'user') {
          if (typeof m.content === 'string') {
            contents.push({
              role: 'user',
              parts: [{ text: m.content }]
            });
          } else if (Array.isArray(m.content)) {
            // tool_result yapısı
            const parts = m.content.map((block: any) => {
              if (block.type === 'tool_result') {
                // Find corresponding tool_use name from session messages
                let toolName = 'unknown_tool';
                for (let i = msgs.indexOf(m) - 1; i >= 0; i--) {
                  const prevMsg = msgs[i];
                  if (prevMsg.role === 'assistant' && Array.isArray(prevMsg.content)) {
                    const match = prevMsg.content.find(
                      (b: any) => b.type === 'tool_use' && b.id === block.tool_use_id
                    );
                    if (match) {
                      toolName = match.name;
                      break;
                    }
                  }
                }
                return {
                  functionResponse: {
                    name: toolName,
                    response: { output: block.content }
                  }
                };
              }
              if (block.type === 'text') {
                return { text: block.text };
              }
              return { text: typeof block === 'string' ? block : JSON.stringify(block) };
            });
            contents.push({ role: 'user', parts });
          }
        } else if (m.role === 'assistant') {
          if (typeof m.content === 'string') {
            contents.push({
              role: 'model',
              parts: [{ text: m.content }]
            });
          } else if (Array.isArray(m.content)) {
            // tool_use yapısı
            const parts = m.content.map((block: any) => {
              if (block.type === 'tool_use') {
                return {
                  functionCall: {
                    name: block.name,
                    args: block.input
                  }
                };
              }
              return { text: block.text || '' };
            });
            contents.push({ role: 'model', parts });
          }
        }
      }
      return contents;
    };

    const makeGeminiRequest = async (contentsList: any[]) => {
      const payload = {
        contents: contentsList,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        tools: geminiTools,
        generationConfig: {
          temperature: 0.7,
        }
      };

      let retries = 3;
      let delay = 2000;

      while (retries > 0) {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.error) {
          // If rate limited or quota exceeded that is retryable
          if (res.status === 429 || (data.error.message && data.error.message.includes('Quota exceeded'))) {
            console.warn(`Gemini API rate limited/quota exceeded, retrying in ${delay}ms... (Retries left: ${retries - 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retries--;
            delay *= 2;
            continue;
          }
          throw new Error(data.error.message || 'Gemini API call failed during fallback.');
        }
        return data;
      }
      throw new Error('Gemini API call rate limit retry count exceeded.');
    };

    let geminiContents = mapMessagesToGeminiContents(session.messages);
    let responseData = await makeGeminiRequest(geminiContents);
    let candidate = responseData.candidates?.[0];

    // Gemini tool loop'u taklit ediyoruz
    while (candidate?.content?.parts?.some((p: any) => p.functionCall)) {
      const functionCalls = candidate.content.parts.filter((p: any) => p.functionCall);
      
      // Save tool_use blocks to session messages in Claude format
      const toolUseBlocks = functionCalls.map((call: any, idx: number) => {
        const fc = call.functionCall;
        const toolUseId = `gemini_tool_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`;
        return {
          type: 'tool_use',
          id: toolUseId,
          name: fc.name,
          input: fc.args
        };
      });

      session.messages.push({
        role: 'assistant',
        content: toolUseBlocks
      });

      const toolResultBlocks = [];

      for (let i = 0; i < functionCalls.length; i++) {
        const call = functionCalls[i];
        const fc = call.functionCall;
        const toolUseId = toolUseBlocks[i].id;
        console.log(`Gemini Fallback triggers tool execution: ${fc.name}`);
        
        let toolResultText = '';
        try {
          toolResultText = await this.executeTool(fc.name, fc.args, user);
        } catch (err: any) {
          toolResultText = `Hata oluştu: ${err.message}`;
        }

        toolResultBlocks.push({
          type: 'tool_result',
          tool_use_id: toolUseId,
          content: toolResultText
        });
      }

      // Save tool_result blocks to session messages in Claude format
      session.messages.push({
        role: 'user',
        content: toolResultBlocks
      });

      // Rebuild gemini contents from updated session messages
      geminiContents = mapMessagesToGeminiContents(session.messages);

      // Call Gemini again
      responseData = await makeGeminiRequest(geminiContents);
      candidate = responseData.candidates?.[0];
    }

    const finalReplyText = candidate?.content?.parts?.find((p: any) => p.text)?.text || 'İşlem tamamlandı.';
    return finalReplyText.replace(/\*\*/g, '').replace(/\*/g, '');
  }

  // Ortak araç çalıştırma (executeTool) katmanı
  private async executeTool(toolName: string, input: any, user: any): Promise<string> {
    switch (toolName) {
      case 'database_query':
        const sql = input.sql_query as string;
        if (!sql) return JSON.stringify({ error: 'sql_query parametresi eksik' });
        
        const lowerSql = sql.toLowerCase();
        const forbidden = ['drop', 'truncate', 'alter', 'grant', 'revoke', 'information_schema', 'pg_'];
        for (const word of forbidden) {
          if (lowerSql.includes(word)) {
            return JSON.stringify({ error: `Güvenlik İhlali: '${word}' kullanımı yasaktır.` });
          }
        }

        const allowedTables = [
          'diet_plan_meal_items', 'diet_plan_meals', 'diet_plan_tracking', 'diet_plans', 
          'dietitian_client_relations', 'foods', 'measurements', 'permissions', 
          'role_permissions', 'roles', 'subscriptions', 'user_assigned_dietitian', 
          'user_profiles', 'user_roles', 'users', 'weight_tracking'
        ];

        const hasAllowedTable = allowedTables.some(t => lowerSql.includes(t));
        if (!hasAllowedTable) {
          return JSON.stringify({ error: 'Sorgu beyaz listedeki hiçbir tabloyu içermiyor. Sadece izin verilen tabloları kullanın.' });
        }

        try {
          const rawResult = await this.dataSource.query(sql);
          return JSON.stringify({ success: true, data: rawResult });
        } catch (err: any) {
           return JSON.stringify({ error: 'SQL Hatası: ' + err.message });
        }
      case 'find_client_by_name':
        try {
           const query = `
             SELECT u.id, u.first_name, u.last_name, u.email
             FROM users u
             INNER JOIN user_assigned_dietitian uad ON uad."clientId"::text = u.id::text
             WHERE uad."dietitianId"::text = $1::text
           `;
           const assignedClients = await this.dataSource.query(query, [user.id]);
           const filtered = assignedClients.filter(c => {
             const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
             const searchName = input.name.toLowerCase();
             return fullName.includes(searchName) || c.first_name.toLowerCase().includes(searchName) || c.last_name.toLowerCase().includes(searchName);
           });
           if (filtered.length === 0) return JSON.stringify({ error: 'Danışan bulunamadı' });
           return JSON.stringify(filtered.map(c => ({ id: c.id, name: c.first_name + ' ' + c.last_name })));
        } catch (err) {
           return JSON.stringify({ error: 'Kullanıcı araması başarısız' });
        }

      case 'search_foods':
        const foods = await this.foodsService.findAll(input.query);
        return JSON.stringify(foods.map(f => ({ id: f.id, name: f.name, calories: f.calories, protein: f.protein, carbs: f.carbohydrates, fat: f.fat })));

      case 'create_food':
        const foodCalories = (input.calories && input.calories > 0) ? input.calories : 350;
        const foodProtein = (input.protein && input.protein > 0) ? input.protein : 10;
        const foodCarbs = (input.carbs && input.carbs > 0) ? input.carbs : 45;
        const foodFat = (input.fat && input.fat > 0) ? input.fat : 12;
        const foodUnit = input.unit || 'gram';

        const newFood = await this.foodsService.create({
          name: input.name,
          calories: foodCalories,
          protein: foodProtein,
          carbohydrates: foodCarbs,
          fat: foodFat,
          unit: foodUnit
        });
        return JSON.stringify({ success: true, food_id: newFood.id, name: newFood.name });

      case 'create_diet_plan':
        const resolvedMeals = [];

        for (const meal of input.meals) {
          const resolvedItems = [];
          for (const item of meal.items) {
            let foodId = null;
            const searchResults = await this.foodsService.findAll(item.food_name);
            const exactMatch = searchResults.find(f => f.name.toLowerCase() === item.food_name.toLowerCase());
            
            // Check if there is a very close match (e.g. name contains all words, or is a prefix/suffix)
            const closeMatch = exactMatch || searchResults.find(f => {
              const nameA = f.name.toLowerCase();
              const nameB = item.food_name.toLowerCase();
              return nameA.includes(nameB) || nameB.includes(nameA);
            });

            if (exactMatch) {
              foodId = exactMatch.id;
              const needsFix = Number(exactMatch.calories) === 0 || exactMatch.unit === '100g' || exactMatch.unit === '100 g';
              if (needsFix) {
                 const newCal = (item.calories && item.calories > 0) ? item.calories : exactMatch.calories;
                 const newUnit = exactMatch.unit?.includes('100') ? 'gram' : exactMatch.unit;
                 await this.dataSource.query(
                    `UPDATE foods SET calories = $1, unit = $2 WHERE id = $3`,
                    [newCal, newUnit, exactMatch.id]
                 );
              }
            } else if (closeMatch) {
              const nameA = closeMatch.name.toLowerCase();
              const nameB = item.food_name.toLowerCase();
              const wordsA = nameA.split(' ');
              const wordsB = nameB.split(' ');
              const overlap = wordsA.filter(w => wordsB.includes(w)).length;
              const isVeryClose = nameA === nameB || 
                                  (overlap > 0 && (wordsA.length === 1 || wordsB.length === 1) && (nameA.endsWith(nameB) || nameB.endsWith(nameA))) ||
                                  (overlap >= Math.max(wordsA.length, wordsB.length) * 0.5);

              if (isVeryClose) {
                foodId = closeMatch.id;
              } else {
                const itemCalories = (item.calories && item.calories > 0) ? item.calories : 350;
                const itemProtein = (item.protein && item.protein > 0) ? item.protein : 10;
                const itemCarbs = (item.carbs && item.carbs > 0) ? item.carbs : 45;
                const itemFat = (item.fat && item.fat > 0) ? item.fat : 12;

                const newFood = await this.foodsService.create({
                  name: item.food_name,
                  calories: itemCalories,
                  protein: itemProtein,
                  carbohydrates: itemCarbs,
                  fat: itemFat,
                  unit: item.unit || 'gram'
                });
                foodId = newFood.id;
              }
            } else {
              const itemCalories = (item.calories && item.calories > 0) ? item.calories : 350;
              const itemProtein = (item.protein && item.protein > 0) ? item.protein : 10;
              const itemCarbs = (item.carbs && item.carbs > 0) ? item.carbs : 45;
              const itemFat = (item.fat && item.fat > 0) ? item.fat : 12;

              const newFood = await this.foodsService.create({
                name: item.food_name,
                calories: itemCalories,
                protein: itemProtein,
                carbohydrates: itemCarbs,
                fat: itemFat,
                unit: item.unit || 'gram'
              });
              foodId = newFood.id;
            }
            
            resolvedItems.push({
              food_id: foodId,
              amount: item.amount
            });
          }
          resolvedMeals.push({
            name: meal.name,
            time: meal.time,
            day_of_week: meal.day_of_week || 1,
            items: resolvedItems
          });
        }

        const finalMeals = [];
        const daysProvided = [...new Set(resolvedMeals.map(m => m.day_of_week))].filter(d => typeof d === 'number');
        const maxDayProvided = daysProvided.length > 0 ? Math.max(...daysProvided) : 1;

        let targetDays = 7;
        if (input.plan_type === 'monthly') targetDays = 30;
        else if (input.plan_type === 'daily') targetDays = 1;

        for (let day = 1; day <= targetDays; day++) {
           const originalDay = ((day - 1) % maxDayProvided) + 1;
           const mealsForDay = resolvedMeals.filter(m => m.day_of_week === originalDay);
           const sourceMeals = mealsForDay.length > 0 ? mealsForDay : resolvedMeals.filter(m => m.day_of_week === 1);
           
           for (const m of sourceMeals) {
              finalMeals.push({
                 ...m,
                 day_of_week: day
              });
           }
        }

        let finalStartDate = input.start_date;
        if (!finalStartDate) {
          const d = new Date();
          const offset = d.getTimezoneOffset();
          const localTime = new Date(d.getTime() - (offset * 60 * 1000));
          localTime.setDate(localTime.getDate() + 1);
          finalStartDate = localTime.toISOString().split('T')[0];
        }

        const plan = await this.dietPlansService.create(user.id, {
          client_id: input.client_id,
          title: input.title,
          description: `Başlangıç Tarihi: ${finalStartDate}`,
          plan_type: input.plan_type || 'weekly',
          meals: finalMeals
        });
        return JSON.stringify({ success: true, plan_id: plan.id });

      case 'get_my_active_plan':
        const plans = await this.dietPlansService.findAllByClient(user.id);
        if (plans.length === 0) return JSON.stringify({ error: 'Aktif plan bulunamadı' });
        const activePlan = plans[0];
        const simplifiedPlan = {
          id: activePlan.id,
          title: activePlan.title,
          meals: [...activePlan.meals]
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
            .map(m => ({
              meal_id: m.id,
              name: m.name,
              time: m.time,
              day_of_week: m.day_of_week,
              items: m.items.map(i => ({
                meal_item_id: i.id,
                food_id: i.food_id,
                food_name: i.food?.name,
                amount: i.amount
              }))
            }))
        };
        return JSON.stringify(simplifiedPlan);

      case 'update_meal_item':
        const updated = await this.dietPlansService.updateMealItemFood(
          input.meal_item_id,
          input.new_food_id,
          input.amount
        );
        return JSON.stringify({ success: true, message: 'Öğün içeriği başarıyla güncellendi' });

      default:
        throw new Error(`Bilinmeyen araç (tool): ${toolName}`);
    }
  }
}
