import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AiChatSession } from './entities/ai-chat-session.entity';
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
    private readonly dietPlansService: DietPlansService,
    private readonly foodsService: FoodsService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  private hasRole(user: any, roleName: string): boolean {
    return (user?.roles || []).some((r: Role | string) => {
      if (typeof r === 'string') return r === roleName;
      return r.name === roleName;
    });
  }

  async processChat(user: any, prompt: string, sessionId?: string) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new InternalServerErrorException('Anthropic API key is not configured.');
    }

    const isDietitian = this.hasRole(user, 'Diyetisyen');
    const isClient = this.hasRole(user, 'client') || this.hasRole(user, 'Danışan');

    if (!isDietitian && !isClient) {
      throw new InternalServerErrorException('Kullanıcı rolü tanımlanamadı.');
    }

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

ÇOK KRİTİK KURAL (SOHBET/ONAY BEKLEME DÖNGÜSÜ YASAKTIR):
Kullanıcı senden bir plan hazırlamanı istediğinde, 'Hazırlıyorum', 'Planı oluşturup kaydediyorum' gibi geçici/ara mesajları KESİNLİKLE yazıp durma! Hiçbir ön açıklama yapmadan, KULLANICIDAN ONAY İSTEMEDEN doğrudan find_client_by_name, database_query ve en son create_diet_plan araçlarını (tools) arka arkaya tek seferde çağır. Tüm araç çağrıları bittikten (plan veritabanına başarıyla kaydedildikten) sonra kullanıcıya SADECE TEK BİR NİHAİ BAŞARI MESAJI dön. Kullanıcının 'tamam yap' demesine gerek kalmadan tek istekte tüm planı kaydetmiş olmalısın.

FORMAT VE YAZIM KURALI (YILDIZ KULLANIMI YASAKTIR):
Yazdığın tüm metinlerde KESİNLİKLE kalın yazmak için kullanılan '**' (çift yıldız) veya '*' (tek yıldız) gibi markdown işaretlerini kullanma. Tüm çıktılarını sade, düz yazı olarak yaz.

ÖZET VE KISA ANLATIM:
Kullanıcıya danışanın kilo, yaş, yağ oranı gibi fiziksel özelliklerini veya uzun uzun makro hesaplamalarını KESİNLİKLE ayrıntılı yazma! Çok kısa ve net bir şekilde 'Hakan Mert için diyet planını başarıyla hazırladım ve kaydettim.' diyerek doğrudan sonuca geç.

EKSİK BİLGİ İSTEME KURALI (BOY, KİLO VE BESLENME TERCİHİ SORMAK KESİNLİKLE YASAKTIR):
Diyetisyen plan hazırlama isteğinde bulunduğunda planın başlangıç tarihini veya danışanın hedefini (kilo vermek, kilo almak, korumak vb.) belirtmemişse, diyetisyene SADECE eksik olan bu bilgileri sor.
1. SADECE şunları sorabilirsin (eğer belirtilmemişse):
   - Danışanın hedefi nedir? (Kilo vermek, kilo almak veya kilosunu korumak)
   - Diyet planının başlangıç tarihi ne olsun? (YYYY-MM-DD formatında)
2. Şunları sormak KESİNLİKLE YASAKTIR:
   - Danışanın boyu, kilosu veya beslenme alışkanlıkları/tercihleri/sevdikleri/sevmedikleri yiyecekleri KESİNLİKLE diyetisyene sorma! Boy ve kilo bilgilerini her zaman 'measurements' tablosundan sorgulayarak kendin almalısın. Beslenme alışkanlıklarını ise sorma, standart sağlıklı besinlerle planı oluştur.

BİLİMSEL MAKRO HESAPLAMA KURALLARI:
Kullanıcının durumuna göre makro ve kalori hesaplamalarını KESİNLİKLE şu kurallara göre yap:
1. Kilo Vermek (Yağ Yakmak) İsteyenler:
   - Protein: Kilo * 1.8 - 2.4 g
   - Yağ: Kilo * 0.6 - 0.8 g
   - Karbonhidrat: Kalan kalori ihtiyacına göre (genellikle Kilo * 1.5 - 2.5 g)
2. Kilo Almak (Kas Kütlesi Kazanmak) İsteyenler:
   - Protein: Kilo * 1.6 - 2.0 g
   - Yağ: Kilo * 0.8 - 1.2 g
   - Karbonhidrat: Kilo * 3.5 - 5.0+ g
3. Kilosunu Korumak & Fit Kalmak İsteyenler:
   - Protein: Kilo * 1.6 - 2.0 g
   - Yağ: Kilo * 0.8 - 1.0 g
   - Karbonhidrat: Kilo * 2.5 - 3.5 g

ÇOK ÖNEMLİ - PORSİYON VE TOPLAM KALORİ UYUMLULUĞU:
Oluşturduğun plandaki tüm öğünlerin (kahvaltı, öğle, akşam, ara öğün vb.) toplam kalori değerinin, yukarıda hesapladığın günlük hedef kalori miktarına (örn: 2200 - 2600 kcal) KESİNLİKLE EŞİT olmasını sağla! 1000 kalori gibi aşırı düşük, yetersiz ve danışanı aç bırakacak planlar KESİNLİKLE hazırlama. Bu uyumluluğu sağlamak için öğünlerdeki yiyeceklerin porsiyon miktarlarını (amount) gerçekçi ve doyurucu şekilde artır (Örn: 1 dilim ekmek yerine 3-4 dilim ekmek, 50g yulaf yerine 100g yulaf, 100g tavuk yerine 200-250g tavuk, pirinç/makarna miktarını 150-200g yap). Toplam kalori hedefine porsiyonları büyüterek ve yeterli yemek ekleyerek ulaş.

KULLANICI BİR PLAN OLUŞTURMANI İSTEDİĞİNDE AŞAĞIDAKİ ADIMLARI KESİNLİKLE UYGULA:
1. Önce find_client_by_name aracıyla danışanı bul ve user ID'sini al.
2. Ardından KESİNLİKLE database_query aracını kullanarak:
   a. "user_profiles" tablosundan danışanın doğum tarihini (birth_date) ve cinsiyetini (gender) sorgula (SELECT birth_date, gender FROM user_profiles WHERE user_id = 'bulunan_id').
   b. "measurements" tablosundan danışanın en güncel kilo (weight) ve boy (height) verilerini sorgula (SELECT weight, height FROM measurements WHERE client_id = 'bulunan_id' ORDER BY date DESC, created_at DESC LIMIT 1).
3. Veritabanından aldığın bu fiziksel özelliklere (kilo vb.) ve danışanın hedefine göre, yukarıdaki BİLİMSEL HESAPLAMA KURALLARINI kullanarak protein, karbonhidrat, yağ ve günlük kalori ihtiyacını hesapla. Eğer veritabanında boy/kilo bulunamazsa, varsayılan mantıklı değerler kabul et (örn: erkekler için 80 kg/180 cm, kadınlar için 65 kg/165 cm) ama kullanıcıya boy/kilo sorma.
4. ÖĞÜN ÇEŞİTLİLİĞİ VE KOPYALAMA: Sistem, 'create_diet_plan' çağrısında gönderdiğin günleri otomatik olarak haftalık (7 güne) veya aylık (30 güne) kopyalamaktadır. JSON boyut sınırına takılmamak ve çökmeleri engellemek için, 'create_diet_plan' aracını çağırırken SADECE 3 günlük (day_of_week: 1, 2, 3) öğünler yazmalısın. KESİNLİKLE 7 veya 30 günün tamamını araca gönderme! ANCAK KULLANICIYA ASLA 'Sadece 3 günlük yazıyorum' VEYA 'Sistem bunu 7 güne tamamlayacak' GİBİ SÖZLER SÖYLEME. Tüm bu teknik kopyalama kısıtlamasını ve 3 günlük şablon mantığını arka planda gizli tut.
5. BESİN DEĞERLERİ, BİRİM VE MİKTAR KESİN KURAL TABLOSU (ÇOK ÖNEMLİ):
Sistemin hatalı miktarlar (örn: 1g domates, 100 adet muz) oluşturmasını engellemek için, yiyecek kategorilerine göre birim (unit) ve miktar (amount) değerlerini KESİNLİKLE şu kurallara göre belirle:
- Sebze ve Meyveler (Domates, Salatalık, Elma, Muz, Portakal vb.):
  * Birim (unit) 'adet' seçilirse: Miktar (amount) sadece 1, 2 veya 3 olmalıdır. KESİNLİKLE '100 adet' veya '150 adet' yazma!
  * Birim (unit) 'gram' seçilirse: Miktar (amount) 100, 150, 200, 250 gibi mantıklı ve doyurucu gramajlar olmalıdır. KESİNLİKLE 1g veya 2g domates/salatalık/meyve yazma!
- Yumurta ve Zeytin:
  * Yumurta için birim (unit) her zaman 'adet' olmalı, miktar (amount) 2, 3 veya 4 olmalıdır. KESİNLİKLE 1g veya 2g yumurta yazma!
  * Zeytin için birim (unit) her zaman 'adet' olmalı, miktar (amount) 5, 8 veya 10 olmalıdır. KESİNLİKLE 1g veya 2g zeytin yazma!
- Ekmek:
  * Birim (unit) her zaman 'dilim' olmalı, miktar (amount) 2, 3 veya 4 olmalıdır. KESİNLİKLE 1g veya 2g ekmek yazma!
- Ana Yemek ve Karbonhidratlar (Tavuk, Kırmızı Et, Balık, Pilav, Makarna, Yulaf, Peynir):
  * Birim (unit) her zaman 'gram' olmalıdır.
  * Miktar (amount) doyurucu olmalıdır: Tavuk/Et/Balık için 150g, 200g veya 250g; Pilav/Makarna için 150g, 200g veya 250g; Yulaf için 60g, 80g veya 100g; Peynir için 60g, 80g veya 100g olmalıdır. KESİNLİKLE 1g, 2g gibi sembolik ve aç bırakacak miktarlar yazma!
- Sıvı Yağlar (Zeytinyağı vb.) ve Kuruyemişler (Ceviz, Badem vb.):
  * Birim (unit) 'gram' seçilirse: Miktar (amount) 10g, 15g, 20g veya 30g olmalıdır.
  * Birim (unit) 'adet' seçilirse (Kuruyemişler için): Miktar (amount) 3, 5, 8 veya 10 adet olmalıdır.
Asla hiçbir miktarı 0 veya boş bırakma!
6. Son olarak create_diet_plan aracıyla planı KESİNLİKLE oluşturup kaydet. 'start_date' parametresine kullanıcının belirttiği veya istediği başlangıç tarihini (örn: '2026-05-18') MUTLAKA geç.

DİKKAT: ASLA araçları kullanmadan sadece metin ile cevap verip işlemi yarım bırakma. Tüm araç çağrılarını bitirdikten sonra (plan kaydedildikten sonra) diyetisyene sonucu bildir. SAKIN SOHBET EDEREK GÖREVİ ERTELEME!
Diyetisyenin ID'si: ${user.id}
${dbSchemaInfo}`
      : `Sen danışanlara yardımcı olan destekleyici bir yapay zeka asistanısın. Görevin danışanların mevcut diyet planlarındaki öğünler veya besinler hakkında sorularını cevaplamak.
Eğer danışan bir besini değiştirmek veya yeni bir plan sorgusu yapmak isterse, "database_query" aracı ile kendi planına (client_id=${user.id}) özel SQL yazıp veri okuyabilir veya veriyi ONAY ALDIKTAN SONRA güncelleyebilirsin.
Eğer danışan bir besini değiştirmek isterse (örn: "X yerine ne yiyebilirim?"):
1. Önce search_foods veya besin bilgisi ile alternatifler bul.
2. Danışana alternatifleri sun ve "Bu sizin için uygun mu?" şeklinde ONAY İSTE.
3. Danışan "evet uygun" derse, update_meal_item veya database_query aracını kullanarak veritabanında planı güncelle. KESİNLİKLE uydurma food_id kullanma. Önce search_foods ile gerçek besin ID'sini bul. Eğer yoksa kendi bilgini kullanarak create_food ile oluştur ve onun ID'sini kullan.
Daha öncesinde get_my_active_plan aracını kullanarak kullanıcının planını ve değiştirmek istediği öğünü inceleyebilirsin.
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
      let response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt,
        messages: session.messages,
        tools: tools,
      });

      // Handle tool calls loop
      while (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter((c) => c.type === 'tool_use') as Anthropic.ToolUseBlock[];
        if (toolUseBlocks.length === 0) break;

        // Append the assistant's message to the session so context is preserved
        session.messages.push({
          role: 'assistant',
          content: response.content,
        });

        const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUseBlock of toolUseBlocks) {
          let toolResultText = '';
          try {
            toolResultText = await this.executeTool(toolUseBlock, user);
          } catch (err: any) {
            toolResultText = `Hata oluştu: ${err.message}`;
          }

          toolResultBlocks.push({
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: toolResultText,
          });
        }

        // Add tool results to messages
        session.messages.push({
          role: 'user',
          content: toolResultBlocks
        });

        // Call Claude again
        response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 4096,
          temperature: 0.7,
          system: systemPrompt,
          messages: session.messages,
          tools: tools,
        });
      }

      // Final response text
      const finalContent = response.content.find((c) => c.type === 'text') as Anthropic.TextBlock;
      const responseText = finalContent ? finalContent.text : 'İşlem tamamlandı.';

      session.messages.push({ role: 'assistant', content: responseText });
      await this.sessionRepo.save(session);

      return {
        sessionId: session.session_id,
        reply: responseText
      };

    } catch (error) {
      console.error('Claude Chat Error:', error);
      throw new InternalServerErrorException('AI asistanı yanıt veremedi.');
    }
  }

  private async executeTool(toolUse: Anthropic.ToolUseBlock, user: any): Promise<string> {
    const input = toolUse.input as any;
    
    switch (toolUse.name) {
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
        // Simplified search using users service if it has search, or mock if not
        try {
           const clients = await this.usersService.findAllClients();
           const filtered = clients.filter(c => {
             const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
             return fullName.includes(input.name.toLowerCase());
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
        const newFood = await this.foodsService.create({
          name: input.name,
          calories: input.calories,
          protein: input.protein,
          carbohydrates: input.carbs,
          fat: input.fat,
          unit: input.unit || 'g'
        });
        return JSON.stringify({ success: true, food_id: newFood.id, name: newFood.name });

      case 'create_diet_plan':
        // Resolve food names to UUIDs automatically
        const resolvedMeals = [];

        for (const meal of input.meals) {
          const resolvedItems = [];
          for (const item of meal.items) {
            let foodId = null;
            // Try to find existing food
            const searchResults = await this.foodsService.findAll(item.food_name);
            const exactMatch = searchResults.find(f => f.name.toLowerCase() === item.food_name.toLowerCase());
            
            if (exactMatch) {
              foodId = exactMatch.id;
              // Auto-fix old bugged foods (0 kcal or '100g' unit)
              const needsFix = Number(exactMatch.calories) === 0 || exactMatch.unit === '100g' || exactMatch.unit === '100 g';
              if (needsFix) {
                 const newCal = (item.calories && item.calories > 0) ? item.calories : exactMatch.calories;
                 const newUnit = item.unit || (exactMatch.unit?.includes('100') ? 'gram' : exactMatch.unit);
                 await this.dataSource.query(
                    `UPDATE foods SET calories = $1, unit = $2 WHERE id = $3`,
                    [newCal, newUnit, exactMatch.id]
                 );
              }
            } else if (searchResults.length > 0) {
              foodId = searchResults[0].id;
            } else {
              // Create it
              const newFood = await this.foodsService.create({
                name: item.food_name,
                calories: item.calories || 0,
                protein: item.protein || 0,
                carbohydrates: item.carbs || 0,
                fat: item.fat || 0,
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

        // Auto-duplicate logic based on plan type
        const finalMeals = [];
        
        // Find how many days the AI actually provided
        const daysProvided = [...new Set(resolvedMeals.map(m => m.day_of_week))].filter(d => typeof d === 'number');
        const maxDayProvided = daysProvided.length > 0 ? Math.max(...daysProvided) : 1;

        // Determine target days based on plan type
        let targetDays = 7; // default weekly
        if (input.plan_type === 'monthly') targetDays = 30;
        else if (input.plan_type === 'daily') targetDays = 1;

        // Loop to fill up target days
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
        // Return the first one, mapping important fields for AI to see
        const activePlan = plans[0];
        const simplifiedPlan = {
          id: activePlan.id,
          title: activePlan.title,
          meals: activePlan.meals.map(m => ({
            meal_id: m.id,
            name: m.name,
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
        return JSON.stringify({ error: 'Bilinmeyen araç (tool)' });
    }
  }
}
