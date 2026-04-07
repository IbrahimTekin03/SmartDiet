import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Food } from '../../modules/foods/entities/food.entity';

export default class FoodsSeeder0002 implements Seeder {
  public async run(dataSource: DataSource, _factoryManager: SeederFactoryManager): Promise<void> {
    const foodRepository = dataSource.getRepository(Food);

    const foods = [
      // Tahıllar ve Unlu Mamuller
      { name: 'Pirinç (Beyaz, Haşlanmış)', calories: 130, protein: 2.7, fat: 0.3, carbohydrates: 28, unit: '100g' },
      { name: 'Bulgur Pilavı', calories: 121, protein: 3.1, fat: 1.5, carbohydrates: 18.5, unit: '100g' },
      { name: 'Yulaf Ezmesi', calories: 389, protein: 16.9, fat: 6.9, carbohydrates: 66.3, unit: '100g' },
      { name: 'Tam Buğday Ekmeği', calories: 247, protein: 13, fat: 3.4, carbohydrates: 41, unit: '100g' },
      { name: 'Ekmek (Beyaz)', calories: 265, protein: 9, fat: 3, carbohydrates: 49, unit: '100g' },
      { name: 'Çavdar Ekmeği', calories: 259, protein: 8.5, fat: 3.3, carbohydrates: 48, unit: '100g' },
      { name: 'Simit', calories: 272, protein: 10, fat: 4, carbohydrates: 52, unit: '100g' },
      { name: 'Makarna (Tam Buğday, Haşlanmış)', calories: 124, protein: 5.3, fat: 0.5, carbohydrates: 26.5, unit: '100g' },
      { name: 'Patates (Haşlanmış)', calories: 87, protein: 1.9, fat: 0.1, carbohydrates: 20.1, unit: '100g' },
      { name: 'Patates Püresi', calories: 113, protein: 2, fat: 4.2, carbohydrates: 16.9, unit: '100g' },
      { name: 'Patates Kızartması', calories: 312, protein: 3.4, fat: 15, carbohydrates: 41, unit: '100g' },

      // Et ve Protein Kaynakları
      { name: 'Tavuk Göğsü (Izgara)', calories: 165, protein: 31, fat: 3.6, carbohydrates: 0, unit: '100g' },
      { name: 'Dana Bonfile (Izgara)', calories: 250, protein: 26, fat: 15, carbohydrates: 0, unit: '100g' },
      { name: 'Yumurta (Haşlanmış)', calories: 155, protein: 13, fat: 11, carbohydrates: 1.1, unit: '100g' },
      { name: 'Somon Balığı (Izgara)', calories: 208, protein: 22, fat: 13, carbohydrates: 0, unit: '100g' },
      { name: 'Hindi Göğsü (Haşlanmış)', calories: 135, protein: 30, fat: 1, carbohydrates: 0, unit: '100g' },
      { name: 'Ton Balığı (Konserve, Yağsız)', calories: 116, protein: 26, fat: 1, carbohydrates: 0, unit: '100g' },
      { name: 'Köfte (Izgara)', calories: 200, protein: 18, fat: 12, carbohydrates: 5, unit: '100g' },
      { name: 'Kuzu Eti (Yağsız)', calories: 204, protein: 25, fat: 11, carbohydrates: 0, unit: '100g' },
      { name: 'Dana Eti (Kıyma)', calories: 250, protein: 18, fat: 20, carbohydrates: 0, unit: '100g' },
      { name: 'Sucuk', calories: 330, protein: 14, fat: 30, carbohydrates: 1, unit: '100g' },
      { name: 'Hindi Göğsü', calories: 104, protein: 24, fat: 1, carbohydrates: 0, unit: '100g' },
      { name: 'Tavuk Nugget', calories: 296, protein: 15, fat: 20, carbohydrates: 14, unit: '100g' },
      
      // Süt ve Süt Ürünleri
      { name: 'Yoğurt (Tam Yağlı)', calories: 61, protein: 3.5, fat: 3.3, carbohydrates: 4.7, unit: '100g' },
      { name: 'Yoğurt (Süzme)', calories: 100, protein: 9, fat: 5, carbohydrates: 4, unit: '100g' },
      { name: 'Beyaz Peynir (Tam Yağlı)', calories: 310, protein: 16, fat: 25, carbohydrates: 2.5, unit: '100g' },
      { name: 'Süt (%3 Yağlı)', calories: 60, protein: 3.2, fat: 3.3, carbohydrates: 4.8, unit: '100g' },
      { name: 'Süt (Tam Yağlı)', calories: 61, protein: 3.2, fat: 3.3, carbohydrates: 4.8, unit: '100g' },
      { name: 'Lor Peyniri', calories: 100, protein: 15, fat: 3, carbohydrates: 3, unit: '100g' },
      { name: 'Kaşar Peyniri', calories: 350, protein: 25, fat: 27, carbohydrates: 2.1, unit: '100g' },
      { name: 'Labne', calories: 193, protein: 5, fat: 18, carbohydrates: 3, unit: '100g' },
      { name: 'Ayran', calories: 38, protein: 2, fat: 1.5, carbohydrates: 4, unit: '100g' },

      // Meyveler
      { name: 'Elma', calories: 52, protein: 0.3, fat: 0.2, carbohydrates: 14, unit: '100g' },
      { name: 'Muz', calories: 89, protein: 1.1, fat: 0.3, carbohydrates: 23, unit: '100g' },
      { name: 'Çilek', calories: 32, protein: 0.7, fat: 0.3, carbohydrates: 7.7, unit: '100g' },
      { name: 'Portakal', calories: 47, protein: 0.9, fat: 0.1, carbohydrates: 12, unit: '100g' },
      { name: 'Kavun', calories: 34, protein: 0.8, fat: 0.2, carbohydrates: 8, unit: '100g' },
      { name: 'Karpuz', calories: 30, protein: 0.6, fat: 0.2, carbohydrates: 8, unit: '100g' },
      { name: 'Üzüm', calories: 69, protein: 0.7, fat: 0.2, carbohydrates: 18, unit: '100g' },
      { name: 'Armut', calories: 57, protein: 0.4, fat: 0.1, carbohydrates: 15, unit: '100g' },
      { name: 'Kivi', calories: 61, protein: 1.1, fat: 0.5, carbohydrates: 15, unit: '100g' },
      { name: 'Kayısı', calories: 48, protein: 1.4, fat: 0.4, carbohydrates: 11, unit: '100g' },
      { name: 'Şeftali', calories: 39, protein: 0.9, fat: 0.3, carbohydrates: 10, unit: '100g' },
      { name: 'Avokado', calories: 160, protein: 2, fat: 15, carbohydrates: 9, unit: '100g' },

      // Sebzeler
      { name: 'Brokoli (Haşlanmış)', calories: 35, protein: 2.4, fat: 0.4, carbohydrates: 7.2, unit: '100g' },
      { name: 'Brokoli', calories: 34, protein: 2.8, fat: 0.4, carbohydrates: 7, unit: '100g' },
      { name: 'Ispanak', calories: 23, protein: 2.9, fat: 0.4, carbohydrates: 3.6, unit: '100g' },
      { name: 'Ispanak (Pişmiş)', calories: 23, protein: 3, fat: 0.5, carbohydrates: 4, unit: '100g' },
      { name: 'Salatalık', calories: 15, protein: 0.7, fat: 0.1, carbohydrates: 3.6, unit: '100g' },
      { name: 'Domates', calories: 18, protein: 0.9, fat: 0.2, carbohydrates: 3.9, unit: '100g' },
      { name: 'Havuç', calories: 41, protein: 0.9, fat: 0.2, carbohydrates: 10, unit: '100g' },
      { name: 'Bezelye', calories: 81, protein: 5, fat: 0.4, carbohydrates: 14, unit: '100g' },
      { name: 'Lahana', calories: 25, protein: 1.3, fat: 0.1, carbohydrates: 5.8, unit: '100g' },
      { name: 'Pırasa', calories: 61, protein: 1.5, fat: 0.3, carbohydrates: 14, unit: '100g' },
      { name: 'Kabak', calories: 17, protein: 1.2, fat: 0.3, carbohydrates: 3.1, unit: '100g' },
      { name: 'Karnabahar', calories: 25, protein: 1.9, fat: 0.3, carbohydrates: 5, unit: '100g' },
      { name: 'Patlıcan', calories: 25, protein: 1, fat: 0.2, carbohydrates: 6, unit: '100g' },
      { name: 'Bamya (Pişmiş)', calories: 33, protein: 1.9, fat: 0.2, carbohydrates: 7, unit: '100g' },
      { name: 'Enginar', calories: 47, protein: 3.3, fat: 0.1, carbohydrates: 10.5, unit: '100g' },

      // Karışık Yemekler
      { name: 'Tavuklu Pilav', calories: 160, protein: 10, fat: 5, carbohydrates: 18, unit: '100g' },
      { name: 'Pirinç Pilavı', calories: 130, protein: 2.7, fat: 0.3, carbohydrates: 28, unit: '100g' },
      { name: 'Mercimek Çorbası', calories: 50, protein: 3.2, fat: 1.2, carbohydrates: 8.5, unit: '100g' },
      { name: 'Kuru Fasulye', calories: 120, protein: 8.2, fat: 0.5, carbohydrates: 21.5, unit: '100g' },
      { name: 'Tavuk Sote', calories: 145, protein: 22, fat: 6, carbohydrates: 3, unit: '100g' },
      { name: 'Kıymalı Pide', calories: 230, protein: 10, fat: 10, carbohydrates: 25, unit: '100g' },
      { name: 'Lahmacun', calories: 220, protein: 9, fat: 8, carbohydrates: 28, unit: '100g' },
      { name: 'Mantı', calories: 180, protein: 7, fat: 5, carbohydrates: 27, unit: '100g' },
      { name: 'Patlıcan Musakka', calories: 145, protein: 5.5, fat: 10.2, carbohydrates: 8.1, unit: '100g' },
      { name: 'İçli Köfte', calories: 210, protein: 10, fat: 11, carbohydrates: 18, unit: '1 Adet' },
      { name: 'Adana Kebap', calories: 240, protein: 18, fat: 18, carbohydrates: 1, unit: '100g' },
      { name: 'İskender Döner', calories: 250, protein: 15, fat: 15, carbohydrates: 15, unit: '100g' },
      { name: 'Karnıyarık', calories: 137, protein: 4.8, fat: 10.1, carbohydrates: 7.2, unit: '100g' },
      { name: 'Menemen', calories: 85, protein: 4.7, fat: 6.2, carbohydrates: 3.1, unit: '100g' },
      { name: 'Sebze Mücver', calories: 130, protein: 5, fat: 7, carbohydrates: 12, unit: '100g' },
      { name: 'Yaprak Sarma (Zeytinyağlı)', calories: 150, protein: 2, fat: 8, carbohydrates: 18, unit: '100g' },

      // Fast Food
      { name: 'Hamburger', calories: 250, protein: 12, fat: 10, carbohydrates: 28, unit: '100g' },
      { name: 'Cheeseburger', calories: 263, protein: 14, fat: 12, carbohydrates: 25, unit: '100g' },
      { name: 'Hot Dog', calories: 290, protein: 10, fat: 26, carbohydrates: 4, unit: '100g' },
      { name: 'Pizza (Margherita)', calories: 250, protein: 10, fat: 10, carbohydrates: 30, unit: '100g' },
      { name: 'Pizza (Pepperoni)', calories: 298, protein: 12, fat: 16, carbohydrates: 26, unit: '100g' },

      // Tatlılar ve Atıştırmalıklar
      { name: 'Çikolata (Sütlü)', calories: 535, protein: 7, fat: 30, carbohydrates: 59, unit: '100g' },
      { name: 'Çikolata (Bitter)', calories: 546, protein: 5, fat: 31, carbohydrates: 61, unit: '100g' },
      { name: 'Sütlaç', calories: 110, protein: 3, fat: 2.5, carbohydrates: 19, unit: '100g' },
      { name: 'Baklava', calories: 430, protein: 4, fat: 23, carbohydrates: 52, unit: '100g' },
      { name: 'Kurabiye', calories: 450, protein: 5, fat: 22, carbohydrates: 58, unit: '100g' },
      { name: 'Pasta (Çikolatalı)', calories: 370, protein: 5, fat: 18, carbohydrates: 47, unit: '100g' },
      { name: 'Dondurma', calories: 201, protein: 3.5, fat: 11, carbohydrates: 24, unit: '100g' },
      { name: 'Patates Cipsi', calories: 536, protein: 7, fat: 35, carbohydrates: 53, unit: '100g' },

      // Kuruyemişler ve Yağlar
      { name: 'Ceviz', calories: 654, protein: 15.2, fat: 65.2, carbohydrates: 13.7, unit: '100g' },
      { name: 'Badem', calories: 579, protein: 21.2, fat: 49.9, carbohydrates: 21.6, unit: '100g' },
      { name: 'Fındık', calories: 628, protein: 15, fat: 61, carbohydrates: 17, unit: '100g' },
      { name: 'Yer Fıstığı', calories: 567, protein: 26, fat: 49, carbohydrates: 16, unit: '100g' },
      { name: 'Antep Fıstığı', calories: 562, protein: 20, fat: 45, carbohydrates: 28, unit: '100g' },
      { name: 'Tuzlu Fıstık', calories: 585, protein: 24, fat: 49, carbohydrates: 21, unit: '100g' },
      { name: 'Zeytinyağı', calories: 884, protein: 0, fat: 100, carbohydrates: 0, unit: '100g' },
      { name: 'Tereyağı', calories: 717, protein: 0.8, fat: 81, carbohydrates: 0.1, unit: '100g' },
      { name: 'Zeytin (Siyah)', calories: 115, protein: 0.8, fat: 11, carbohydrates: 6, unit: '100g' },
      { name: 'Fıstık Ezmesi (Sade)', calories: 588, protein: 25, fat: 50, carbohydrates: 20, unit: '100g' },

      // İçecekler
      { name: 'Kola', calories: 38, protein: 0, fat: 0, carbohydrates: 10, unit: '100ml' },
      { name: 'Sprite', calories: 39, protein: 0, fat: 0, carbohydrates: 9.6, unit: '100ml' },
      { name: 'Fanta', calories: 48, protein: 0, fat: 0, carbohydrates: 12, unit: '100ml' },
      { name: 'Meyve Suyu (Portakal)', calories: 45, protein: 0.7, fat: 0.2, carbohydrates: 10, unit: '100ml' },
      { name: 'Meyve Suyu (Vişne)', calories: 50, protein: 0.3, fat: 0, carbohydrates: 12, unit: '100ml' },
      { name: 'Soda', calories: 0, protein: 0, fat: 0, carbohydrates: 0, unit: '100ml' },
      { name: 'Çay (Şekersiz)', calories: 1, protein: 0, fat: 0, carbohydrates: 0, unit: 'Bardak' },
      { name: 'Kahve (Sade)', calories: 2, protein: 0.1, fat: 0, carbohydrates: 0, unit: 'Bardak' }
    ];

    for (const foodInfo of foods) {
      const existing = await foodRepository.findOne({ where: { name: foodInfo.name } });
      if (existing) {
        // ID setlendiği için save işlemi UPDATE yapar.
        await foodRepository.save({
          ...existing,
          ...foodInfo
        });
      } else {
        await foodRepository.save(foodRepository.create(foodInfo));
      }
    }
    
    console.log(`[Seeder] Seeded/Updated ${foods.length} food items.`);
  }
}
