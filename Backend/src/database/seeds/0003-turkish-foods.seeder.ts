import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Food } from '../../modules/foods/entities/food.entity';

export default class TurkishFoodsSeeder0003 implements Seeder {
  public async run(dataSource: DataSource, _factoryManager: SeederFactoryManager): Promise<void> {
    const foodRepository = dataSource.getRepository(Food);

    const foods = [
      // ======= KAHVALTILIK BESİNLER =======
      { name: 'Yumurta (Haşlanmış, Adet)', calories: 78, protein: 6.3, fat: 5.3, carbohydrates: 0.6, unit: 'adet' },
      { name: 'Yumurta (Sahanda)', calories: 90, protein: 6.3, fat: 7, carbohydrates: 0.4, unit: 'adet' },
      { name: 'Omlet (2 Yumurta)', calories: 180, protein: 12, fat: 14, carbohydrates: 1, unit: 'porsiyon' },
      { name: 'Menemen (Porsiyon)', calories: 180, protein: 10, fat: 12, carbohydrates: 8, unit: 'porsiyon' },
      { name: 'Beyaz Peynir', calories: 310, protein: 16, fat: 25, carbohydrates: 2.5, unit: '100g' },
      { name: 'Kaşar Peyniri', calories: 350, protein: 25, fat: 27, carbohydrates: 2.1, unit: '100g' },
      { name: 'Lor Peyniri', calories: 100, protein: 15, fat: 3, carbohydrates: 3, unit: '100g' },
      { name: 'Süzme Peynir', calories: 80, protein: 10, fat: 3, carbohydrates: 4, unit: '100g' },
      { name: 'Tulum Peyniri', calories: 320, protein: 20, fat: 26, carbohydrates: 2, unit: '100g' },
      { name: 'Çökelek', calories: 70, protein: 12, fat: 1.5, carbohydrates: 3, unit: '100g' },
      { name: 'Krem Peynir', calories: 240, protein: 6, fat: 22, carbohydrates: 3, unit: '100g' },
      { name: 'Zeytin (Yeşil)', calories: 100, protein: 0.7, fat: 10, carbohydrates: 3.8, unit: '100g' },
      { name: 'Zeytin (Siyah)', calories: 115, protein: 0.8, fat: 11, carbohydrates: 6, unit: '100g' },
      { name: 'Beyaz Ekmek (Dilim)', calories: 65, protein: 2, fat: 0.5, carbohydrates: 13, unit: 'dilim' },
      { name: 'Tam Buğday Ekmek (Dilim)', calories: 80, protein: 3.5, fat: 1, carbohydrates: 14, unit: 'dilim' },
      { name: 'Çavdar Ekmeği (Dilim)', calories: 70, protein: 2.5, fat: 0.8, carbohydrates: 13, unit: 'dilim' },
      { name: 'Simit (Adet)', calories: 270, protein: 9, fat: 3, carbohydrates: 52, unit: 'adet' },
      { name: 'Açma (Adet)', calories: 330, protein: 7, fat: 15, carbohydrates: 43, unit: 'adet' },
      { name: 'Poğaça (Peynirli)', calories: 280, protein: 8, fat: 14, carbohydrates: 32, unit: 'adet' },
      { name: 'Börek (Peynirli, Dilim)', calories: 310, protein: 10, fat: 18, carbohydrates: 28, unit: 'dilim' },
      { name: 'Börek (Ispanaklı, Dilim)', calories: 280, protein: 9, fat: 15, carbohydrates: 29, unit: 'dilim' },
      { name: 'Börek (Kıymalı, Dilim)', calories: 340, protein: 14, fat: 20, carbohydrates: 28, unit: 'dilim' },
      { name: 'Gözleme (Peynirli)', calories: 280, protein: 10, fat: 12, carbohydrates: 34, unit: 'porsiyon' },
      { name: 'Gözleme (Ispanaklı)', calories: 250, protein: 9, fat: 10, carbohydrates: 33, unit: 'porsiyon' },
      { name: 'Tost (Kaşarlı)', calories: 320, protein: 14, fat: 14, carbohydrates: 36, unit: 'adet' },
      { name: 'Sandviç (Ton Balıklı)', calories: 290, protein: 20, fat: 9, carbohydrates: 32, unit: 'adet' },
      { name: 'Sandviç (Tavuklu)', calories: 310, protein: 22, fat: 10, carbohydrates: 33, unit: 'adet' },
      { name: 'Bal', calories: 304, protein: 0.3, fat: 0, carbohydrates: 82, unit: '100g' },
      { name: 'Reçel', calories: 250, protein: 0.4, fat: 0.1, carbohydrates: 65, unit: '100g' },
      { name: 'Tereyağı', calories: 717, protein: 0.8, fat: 81, carbohydrates: 0.1, unit: '100g' },
      { name: 'Margarin', calories: 720, protein: 0.2, fat: 80, carbohydrates: 0.5, unit: '100g' },
      { name: 'Fıstık Ezmesi', calories: 588, protein: 25, fat: 50, carbohydrates: 20, unit: '100g' },
      { name: 'Tahin', calories: 595, protein: 17, fat: 54, carbohydrates: 21, unit: '100g' },
      { name: 'Tahin-Pekmez', calories: 350, protein: 8, fat: 20, carbohydrates: 40, unit: '100g' },
      { name: 'Domates (Adet)', calories: 22, protein: 1, fat: 0.2, carbohydrates: 5, unit: 'adet' },
      { name: 'Salatalık (Adet)', calories: 16, protein: 0.7, fat: 0.1, carbohydrates: 3.5, unit: 'adet' },
      { name: 'Yeşil Biber (Adet)', calories: 10, protein: 0.5, fat: 0.1, carbohydrates: 2.4, unit: 'adet' },

      // ======= ÇORBALAR =======
      { name: 'Mercimek Çorbası', calories: 90, protein: 5.5, fat: 2.5, carbohydrates: 13, unit: '100g' },
      { name: 'Domates Çorbası', calories: 45, protein: 1.5, fat: 1.5, carbohydrates: 7, unit: '100g' },
      { name: 'Tavuk Suyu Çorbası', calories: 40, protein: 3.5, fat: 1.2, carbohydrates: 4, unit: '100g' },
      { name: 'Yayla Çorbası', calories: 65, protein: 3.5, fat: 2.5, carbohydrates: 7, unit: '100g' },
      { name: 'Ezogelin Çorbası', calories: 80, protein: 4, fat: 2, carbohydrates: 12, unit: '100g' },
      { name: 'İşkembe Çorbası', calories: 65, protein: 5, fat: 2.5, carbohydrates: 6, unit: '100g' },
      { name: 'Şehriye Çorbası', calories: 55, protein: 2.5, fat: 1.5, carbohydrates: 9, unit: '100g' },
      { name: 'Tarhana Çorbası', calories: 70, protein: 3, fat: 2, carbohydrates: 11, unit: '100g' },
      { name: 'Sebze Çorbası', calories: 40, protein: 2, fat: 1, carbohydrates: 7, unit: '100g' },
      { name: 'Balık Çorbası', calories: 55, protein: 5, fat: 2, carbohydrates: 5, unit: '100g' },
      { name: 'Kremalı Mantar Çorbası', calories: 85, protein: 3, fat: 5, carbohydrates: 8, unit: '100g' },

      // ======= ET YEMEKLERİ =======
      { name: 'Tavuk Göğsü (Haşlanmış)', calories: 150, protein: 30, fat: 3, carbohydrates: 0, unit: '100g' },
      { name: 'Tavuk But (Fırında)', calories: 190, protein: 24, fat: 10, carbohydrates: 0, unit: '100g' },
      { name: 'Tavuk Kanat (Fırında)', calories: 203, protein: 20, fat: 13, carbohydrates: 0, unit: '100g' },
      { name: 'Tavuk Sote', calories: 145, protein: 22, fat: 6, carbohydrates: 3, unit: '100g' },
      { name: 'Tavuk Şiş', calories: 165, protein: 29, fat: 4.5, carbohydrates: 1, unit: '100g' },
      { name: 'Tavuk Tantuni', calories: 170, protein: 20, fat: 7, carbohydrates: 8, unit: '100g' },
      { name: 'Tavuk Güveç', calories: 140, protein: 18, fat: 6, carbohydrates: 5, unit: '100g' },
      { name: 'Köfte (Izgara)', calories: 200, protein: 18, fat: 12, carbohydrates: 5, unit: '100g' },
      { name: 'Köfte (Haşlanmış)', calories: 180, protein: 18, fat: 10, carbohydrates: 5, unit: '100g' },
      { name: 'Adana Kebap', calories: 240, protein: 18, fat: 18, carbohydrates: 1, unit: '100g' },
      { name: 'Urfa Kebap', calories: 230, protein: 17, fat: 17, carbohydrates: 1, unit: '100g' },
      { name: 'Şiş Kebap', calories: 220, protein: 22, fat: 14, carbohydrates: 0, unit: '100g' },
      { name: 'Döner (Tavuklu)', calories: 190, protein: 18, fat: 10, carbohydrates: 7, unit: '100g' },
      { name: 'Döner (Etli)', calories: 250, protein: 20, fat: 16, carbohydrates: 7, unit: '100g' },
      { name: 'Dana Bonfile', calories: 250, protein: 26, fat: 15, carbohydrates: 0, unit: '100g' },
      { name: 'Dana Antrikot', calories: 280, protein: 24, fat: 20, carbohydrates: 0, unit: '100g' },
      { name: 'Kuzu Pirzola', calories: 260, protein: 24, fat: 18, carbohydrates: 0, unit: '100g' },
      { name: 'Kuzu Incik (Haşlanmış)', calories: 230, protein: 23, fat: 15, carbohydrates: 0, unit: '100g' },
      { name: 'Kıymalı Yumurta', calories: 180, protein: 14, fat: 13, carbohydrates: 2, unit: '100g' },
      { name: 'Kıymalı Makarna', calories: 170, protein: 10, fat: 7, carbohydrates: 18, unit: '100g' },
      { name: 'Sucuk', calories: 330, protein: 14, fat: 30, carbohydrates: 1, unit: '100g' },
      { name: 'Sucuklu Yumurta', calories: 210, protein: 12, fat: 17, carbohydrates: 1, unit: '100g' },
      { name: 'Pastırma', calories: 220, protein: 22, fat: 14, carbohydrates: 0.5, unit: '100g' },
      { name: 'Soudjouk', calories: 310, protein: 15, fat: 27, carbohydrates: 1, unit: '100g' },

      // ======= BALIK VE DENİZ ÜRÜNLERİ =======
      { name: 'Somon (Fırında)', calories: 206, protein: 22, fat: 13, carbohydrates: 0, unit: '100g' },
      { name: 'Levrek (Izgara)', calories: 97, protein: 20, fat: 2, carbohydrates: 0, unit: '100g' },
      { name: 'Çipura (Izgara)', calories: 96, protein: 20, fat: 1.8, carbohydrates: 0, unit: '100g' },
      { name: 'Hamsi (Tava)', calories: 170, protein: 22, fat: 9, carbohydrates: 0, unit: '100g' },
      { name: 'Hamsi (Izgara)', calories: 130, protein: 23, fat: 4, carbohydrates: 0, unit: '100g' },
      { name: 'Palamut (Izgara)', calories: 165, protein: 22, fat: 8, carbohydrates: 0, unit: '100g' },
      { name: 'Ton Balığı (Konserve)', calories: 116, protein: 26, fat: 1, carbohydrates: 0, unit: '100g' },
      { name: 'Sardalya (Konserve)', calories: 208, protein: 25, fat: 11, carbohydrates: 0, unit: '100g' },
      { name: 'Uskumru (Fırında)', calories: 190, protein: 22, fat: 11, carbohydrates: 0, unit: '100g' },
      { name: 'Karides (Haşlanmış)', calories: 99, protein: 24, fat: 0.3, carbohydrates: 0, unit: '100g' },
      { name: 'Kalamar (Tava)', calories: 160, protein: 16, fat: 7, carbohydrates: 8, unit: '100g' },
      { name: 'Midye Dolma (Adet)', calories: 50, protein: 3, fat: 2, carbohydrates: 5, unit: 'adet' },
      { name: 'Balık Ekmek', calories: 280, protein: 18, fat: 10, carbohydrates: 30, unit: 'adet' },

      // ======= SEBZELİ YEMEKLER =======
      { name: 'Zeytinyağlı Fasulye', calories: 85, protein: 2.5, fat: 5, carbohydrates: 9, unit: '100g' },
      { name: 'Zeytinyağlı Enginar', calories: 75, protein: 2, fat: 4.5, carbohydrates: 8, unit: '100g' },
      { name: 'Zeytinyağlı Pırasa', calories: 70, protein: 1.5, fat: 4, carbohydrates: 8, unit: '100g' },
      { name: 'Zeytinyağlı Biber Dolma', calories: 130, protein: 3, fat: 7, carbohydrates: 15, unit: '100g' },
      { name: 'Karnıyarık', calories: 137, protein: 4.8, fat: 10, carbohydrates: 7, unit: '100g' },
      { name: 'İmam Bayıldı', calories: 100, protein: 2, fat: 7, carbohydrates: 8, unit: '100g' },
      { name: 'Patlıcan Musakka', calories: 145, protein: 5.5, fat: 10, carbohydrates: 8, unit: '100g' },
      { name: 'Türlü (Sebze)', calories: 65, protein: 2, fat: 3, carbohydrates: 9, unit: '100g' },
      { name: 'Bezelye Yemeği', calories: 90, protein: 4, fat: 3, carbohydrates: 13, unit: '100g' },
      { name: 'Bamya Yemeği', calories: 80, protein: 2.5, fat: 4, carbohydrates: 9, unit: '100g' },
      { name: 'Ispanak Yemeği', calories: 65, protein: 3, fat: 3.5, carbohydrates: 5, unit: '100g' },
      { name: 'Taze Fasulye Yemeği', calories: 75, protein: 2, fat: 3.5, carbohydrates: 9, unit: '100g' },
      { name: 'Kabak Mücver', calories: 130, protein: 5, fat: 7, carbohydrates: 12, unit: '100g' },
      { name: 'Kabak Yemeği', calories: 60, protein: 2, fat: 3, carbohydrates: 7, unit: '100g' },
      { name: 'Patates Yemeği (Etli)', calories: 120, protein: 6, fat: 5, carbohydrates: 14, unit: '100g' },
      { name: 'Biber Dolma (Etli)', calories: 150, protein: 8, fat: 8, carbohydrates: 12, unit: '100g' },
      { name: 'Yaprak Sarma (Etli)', calories: 160, protein: 6, fat: 8, carbohydrates: 16, unit: '100g' },
      { name: 'Yaprak Sarma (Zeytinyağlı)', calories: 130, protein: 2, fat: 7, carbohydrates: 16, unit: '100g' },
      { name: 'Semizotu Salatası', calories: 25, protein: 1.5, fat: 0.3, carbohydrates: 4, unit: '100g' },

      // ======= BAKLİYAT =======
      { name: 'Kuru Fasulye', calories: 120, protein: 8.2, fat: 0.5, carbohydrates: 21.5, unit: '100g' },
      { name: 'Nohut (Haşlanmış)', calories: 164, protein: 8.9, fat: 2.6, carbohydrates: 27, unit: '100g' },
      { name: 'Mercimek (Yeşil, Haşlanmış)', calories: 116, protein: 9, fat: 0.4, carbohydrates: 20, unit: '100g' },
      { name: 'Mercimek (Kırmızı, Haşlanmış)', calories: 100, protein: 7, fat: 0.4, carbohydrates: 17, unit: '100g' },
      { name: 'Barbunya (Haşlanmış)', calories: 127, protein: 8.7, fat: 0.5, carbohydrates: 22, unit: '100g' },
      { name: 'Börülce (Haşlanmış)', calories: 116, protein: 7.7, fat: 0.6, carbohydrates: 21, unit: '100g' },
      { name: 'Fava (Bakla)', calories: 110, protein: 7.6, fat: 0.4, carbohydrates: 19.6, unit: '100g' },
      { name: 'Nohut Kavurması', calories: 180, protein: 9, fat: 6, carbohydrates: 24, unit: '100g' },

      // ======= PİLAVLAR VE MAKARNALAR =======
      { name: 'Pirinç Pilavı', calories: 130, protein: 2.7, fat: 0.3, carbohydrates: 28, unit: '100g' },
      { name: 'Bulgur Pilavı', calories: 121, protein: 3.1, fat: 1.5, carbohydrates: 18.5, unit: '100g' },
      { name: 'Nohutlu Pilav', calories: 155, protein: 5, fat: 2, carbohydrates: 28, unit: '100g' },
      { name: 'Tavuklu Pilav', calories: 160, protein: 10, fat: 5, carbohydrates: 18, unit: '100g' },
      { name: 'Domatesli Pilav', calories: 135, protein: 2.8, fat: 2, carbohydrates: 26, unit: '100g' },
      { name: 'Makarna (Haşlanmış)', calories: 158, protein: 5.8, fat: 0.9, carbohydrates: 31, unit: '100g' },
      { name: 'Makarna (Tam Buğday)', calories: 124, protein: 5.3, fat: 0.5, carbohydrates: 26.5, unit: '100g' },
      { name: 'Makarna (Soslu)', calories: 190, protein: 7, fat: 5, carbohydrates: 30, unit: '100g' },
      { name: 'Fırın Makarna', calories: 220, protein: 9, fat: 8, carbohydrates: 29, unit: '100g' },
      { name: 'Şehriyeli Pirinç', calories: 140, protein: 3.5, fat: 2, carbohydrates: 27, unit: '100g' },

      // ======= TÜRK ÖZGÜN YEMEKLERİ =======
      { name: 'Lahmacun (Adet)', calories: 220, protein: 9, fat: 8, carbohydrates: 28, unit: 'adet' },
      { name: 'Pide (Kaşarlı)', calories: 250, protein: 12, fat: 10, carbohydrates: 30, unit: '100g' },
      { name: 'Pide (Kıymalı)', calories: 230, protein: 10, fat: 10, carbohydrates: 25, unit: '100g' },
      { name: 'Mantı', calories: 180, protein: 7, fat: 5, carbohydrates: 27, unit: '100g' },
      { name: 'İçli Köfte (Adet)', calories: 210, protein: 10, fat: 11, carbohydrates: 18, unit: 'adet' },
      { name: 'İskender Döner', calories: 250, protein: 15, fat: 15, carbohydrates: 15, unit: '100g' },
      { name: 'Hünkârbeğendi', calories: 180, protein: 10, fat: 11, carbohydrates: 10, unit: '100g' },
      { name: 'Çiğ Köfte (Adet)', calories: 35, protein: 1, fat: 0.5, carbohydrates: 7, unit: 'adet' },
      { name: 'Kısır', calories: 120, protein: 3, fat: 4, carbohydrates: 18, unit: '100g' },
      { name: 'Cacık', calories: 45, protein: 2.5, fat: 2, carbohydrates: 4, unit: '100g' },
      { name: 'Haydari', calories: 80, protein: 5, fat: 5, carbohydrates: 4, unit: '100g' },
      { name: 'Humus', calories: 166, protein: 8, fat: 10, carbohydrates: 14, unit: '100g' },
      { name: 'Patlıcan Ezmesi', calories: 60, protein: 1.5, fat: 3.5, carbohydrates: 7, unit: '100g' },
      { name: 'Közlenmiş Biber Ezmesi', calories: 45, protein: 1.5, fat: 2, carbohydrates: 6, unit: '100g' },

      // ======= SALATALAR =======
      { name: 'Çoban Salatası', calories: 40, protein: 1.2, fat: 2, carbohydrates: 5, unit: '100g' },
      { name: 'Mevsim Salatası', calories: 25, protein: 1, fat: 0.5, carbohydrates: 5, unit: '100g' },
      { name: 'Roka Salatası', calories: 25, protein: 2.6, fat: 0.7, carbohydrates: 3.7, unit: '100g' },
      { name: 'Beyaz Peynirli Salata', calories: 85, protein: 4, fat: 6, carbohydrates: 4, unit: '100g' },
      { name: 'Ton Balıklı Salata', calories: 95, protein: 10, fat: 4, carbohydrates: 5, unit: '100g' },
      { name: 'Tavuklu Salata', calories: 110, protein: 14, fat: 4, carbohydrates: 4, unit: '100g' },
      { name: 'Nohutlu Salata', calories: 130, protein: 6, fat: 5, carbohydrates: 16, unit: '100g' },
      { name: 'Yeşil Salata', calories: 15, protein: 1.2, fat: 0.2, carbohydrates: 2.5, unit: '100g' },
      { name: 'Tarator Salatası', calories: 80, protein: 3, fat: 6, carbohydrates: 5, unit: '100g' },
      { name: 'Semizotu Salatası (Zeytinyağlı)', calories: 50, protein: 1.5, fat: 3.5, carbohydrates: 4, unit: '100g' },

      // ======= SÜT VE SÜT ÜRÜNLERİ =======
      { name: 'Süt (Tam Yağlı)', calories: 61, protein: 3.2, fat: 3.3, carbohydrates: 4.8, unit: '100ml' },
      { name: 'Süt (Yarım Yağlı)', calories: 46, protein: 3.2, fat: 1.5, carbohydrates: 5, unit: '100ml' },
      { name: 'Yoğurt (Tam Yağlı)', calories: 61, protein: 3.5, fat: 3.3, carbohydrates: 4.7, unit: '100g' },
      { name: 'Yoğurt (Az Yağlı)', calories: 40, protein: 4, fat: 0.5, carbohydrates: 5.5, unit: '100g' },
      { name: 'Yoğurt (Süzme)', calories: 100, protein: 9, fat: 5, carbohydrates: 4, unit: '100g' },
      { name: 'Kefir', calories: 40, protein: 3.3, fat: 1, carbohydrates: 4.5, unit: '100ml' },
      { name: 'Ayran', calories: 38, protein: 2, fat: 1.5, carbohydrates: 4, unit: '100ml' },
      { name: 'Labne', calories: 193, protein: 5, fat: 18, carbohydrates: 3, unit: '100g' },
      { name: 'Çöp Şiş Yoğurtlu', calories: 220, protein: 20, fat: 12, carbohydrates: 8, unit: '100g' },

      // ======= MEYVELER =======
      { name: 'Elma (Adet)', calories: 80, protein: 0.4, fat: 0.3, carbohydrates: 21, unit: 'adet' },
      { name: 'Muz (Adet)', calories: 100, protein: 1.2, fat: 0.3, carbohydrates: 26, unit: 'adet' },
      { name: 'Portakal (Adet)', calories: 65, protein: 1.2, fat: 0.2, carbohydrates: 16, unit: 'adet' },
      { name: 'Mandalina (Adet)', calories: 40, protein: 0.6, fat: 0.1, carbohydrates: 10, unit: 'adet' },
      { name: 'Armut (Adet)', calories: 90, protein: 0.5, fat: 0.2, carbohydrates: 24, unit: 'adet' },
      { name: 'Üzüm', calories: 69, protein: 0.7, fat: 0.2, carbohydrates: 18, unit: '100g' },
      { name: 'Çilek', calories: 32, protein: 0.7, fat: 0.3, carbohydrates: 7.7, unit: '100g' },
      { name: 'Kivi (Adet)', calories: 42, protein: 0.8, fat: 0.4, carbohydrates: 10, unit: 'adet' },
      { name: 'Kavun (Dilim)', calories: 45, protein: 0.8, fat: 0.2, carbohydrates: 11, unit: 'dilim' },
      { name: 'Karpuz (Dilim)', calories: 40, protein: 0.6, fat: 0.2, carbohydrates: 10, unit: 'dilim' },
      { name: 'Şeftali (Adet)', calories: 60, protein: 1.4, fat: 0.4, carbohydrates: 15, unit: 'adet' },
      { name: 'Kayısı (Adet)', calories: 25, protein: 0.5, fat: 0.1, carbohydrates: 6, unit: 'adet' },
      { name: 'Kiraz', calories: 63, protein: 1.1, fat: 0.2, carbohydrates: 16, unit: '100g' },
      { name: 'Vişne', calories: 50, protein: 1, fat: 0.3, carbohydrates: 12, unit: '100g' },
      { name: 'Greyfurt (Adet)', calories: 90, protein: 2, fat: 0.3, carbohydrates: 22, unit: 'adet' },
      { name: 'Ananas', calories: 50, protein: 0.5, fat: 0.1, carbohydrates: 13, unit: '100g' },
      { name: 'Nar', calories: 83, protein: 1.7, fat: 1.2, carbohydrates: 19, unit: '100g' },
      { name: 'İncir (Taze)', calories: 74, protein: 0.8, fat: 0.3, carbohydrates: 19, unit: '100g' },
      { name: 'Avokado', calories: 160, protein: 2, fat: 15, carbohydrates: 9, unit: '100g' },

      // ======= KURUYEMIŞLER =======
      { name: 'Ceviz', calories: 654, protein: 15.2, fat: 65.2, carbohydrates: 13.7, unit: '100g' },
      { name: 'Badem', calories: 579, protein: 21.2, fat: 49.9, carbohydrates: 21.6, unit: '100g' },
      { name: 'Fındık', calories: 628, protein: 15, fat: 61, carbohydrates: 17, unit: '100g' },
      { name: 'Antep Fıstığı', calories: 562, protein: 20, fat: 45, carbohydrates: 28, unit: '100g' },
      { name: 'Yer Fıstığı', calories: 567, protein: 26, fat: 49, carbohydrates: 16, unit: '100g' },
      { name: 'Kabak Çekirdeği', calories: 559, protein: 30, fat: 49, carbohydrates: 11, unit: '100g' },
      { name: 'Ayçekirdeği', calories: 584, protein: 20.8, fat: 51.5, carbohydrates: 20, unit: '100g' },
      { name: 'Kaju', calories: 553, protein: 18, fat: 44, carbohydrates: 30, unit: '100g' },
      { name: 'Kestane', calories: 245, protein: 3.2, fat: 2.2, carbohydrates: 53, unit: '100g' },
      { name: 'Kuru Kayısı', calories: 241, protein: 3.4, fat: 0.5, carbohydrates: 63, unit: '100g' },
      { name: 'Kuru Üzüm', calories: 299, protein: 3.1, fat: 0.5, carbohydrates: 79, unit: '100g' },
      { name: 'Kuru İncir', calories: 249, protein: 3.3, fat: 0.9, carbohydrates: 64, unit: '100g' },
      { name: 'Hurma', calories: 277, protein: 2, fat: 0.1, carbohydrates: 75, unit: '100g' },

      // ======= TAHILLAR VE UNLU MAMULLER =======
      { name: 'Yulaf Ezmesi', calories: 389, protein: 16.9, fat: 6.9, carbohydrates: 66.3, unit: '100g' },
      { name: 'Granola', calories: 380, protein: 7, fat: 14, carbohydrates: 60, unit: '100g' },
      { name: 'Müsli', calories: 350, protein: 10, fat: 6, carbohydrates: 68, unit: '100g' },
      { name: 'Mısır Unu Ekmek', calories: 218, protein: 7, fat: 3, carbohydrates: 44, unit: '100g' },
      { name: 'Katmer', calories: 380, protein: 8, fat: 20, carbohydrates: 44, unit: '100g' },
      { name: 'Galeta Ekmeği', calories: 395, protein: 10, fat: 5, carbohydrates: 76, unit: '100g' },
      { name: 'Kraker (Kepekli)', calories: 390, protein: 9, fat: 11, carbohydrates: 65, unit: '100g' },

      // ======= TATLALAR =======
      { name: 'Baklava', calories: 430, protein: 4, fat: 23, carbohydrates: 52, unit: '100g' },
      { name: 'Sütlaç', calories: 110, protein: 3, fat: 2.5, carbohydrates: 19, unit: '100g' },
      { name: 'Aşure', calories: 120, protein: 3, fat: 1.5, carbohydrates: 25, unit: '100g' },
      { name: 'Kazandibi', calories: 180, protein: 3.5, fat: 4, carbohydrates: 32, unit: '100g' },
      { name: 'Tavuk Göğsü Tatlı', calories: 175, protein: 3, fat: 4, carbohydrates: 31, unit: '100g' },
      { name: 'Kemal Paşa Tatlısı', calories: 250, protein: 5, fat: 8, carbohydrates: 40, unit: '100g' },
      { name: 'Lokma', calories: 290, protein: 3, fat: 12, carbohydrates: 42, unit: '100g' },
      { name: 'Revani', calories: 280, protein: 4, fat: 8, carbohydrates: 48, unit: '100g' },
      { name: 'Kadayıf', calories: 350, protein: 5, fat: 15, carbohydrates: 50, unit: '100g' },
      { name: 'Dondurma', calories: 201, protein: 3.5, fat: 11, carbohydrates: 24, unit: '100g' },

      // ======= İÇECEKLER =======
      { name: 'Çay (Şekersiz)', calories: 1, protein: 0, fat: 0, carbohydrates: 0, unit: 'bardak' },
      { name: 'Çay (Şekerli)', calories: 30, protein: 0, fat: 0, carbohydrates: 8, unit: 'bardak' },
      { name: 'Türk Kahvesi', calories: 5, protein: 0.3, fat: 0, carbohydrates: 0, unit: 'fincan' },
      { name: 'Neskafe', calories: 10, protein: 0.2, fat: 0, carbohydrates: 1.5, unit: 'bardak' },
      { name: 'Cappuccino', calories: 74, protein: 4, fat: 3.5, carbohydrates: 7, unit: 'bardak' },
      { name: 'Latte', calories: 120, protein: 6, fat: 5, carbohydrates: 12, unit: 'bardak' },
      { name: 'Ayran', calories: 38, protein: 2, fat: 1.5, carbohydrates: 4, unit: '100ml' },
      { name: 'Şalgam Suyu', calories: 20, protein: 0.7, fat: 0, carbohydrates: 4, unit: '100ml' },
      { name: 'Boza', calories: 72, protein: 1, fat: 0.5, carbohydrates: 17, unit: '100ml' },
      { name: 'Salep', calories: 80, protein: 1.5, fat: 2, carbohydrates: 14, unit: 'bardak' },
      { name: 'Limonata', calories: 40, protein: 0, fat: 0, carbohydrates: 10, unit: '100ml' },
      { name: 'Portakal Suyu (Taze)', calories: 45, protein: 0.7, fat: 0.2, carbohydrates: 10, unit: '100ml' },
      { name: 'Meyve Suyu (Elma)', calories: 46, protein: 0.1, fat: 0.1, carbohydrates: 11, unit: '100ml' },

      // ======= KAHVALTI YİYECEKLERİ EK =======
      { name: 'Kakaolu Findık Kreması', calories: 539, protein: 6.3, fat: 30.9, carbohydrates: 57.5, unit: '100g' },
      { name: 'Marmelat', calories: 260, protein: 0.4, fat: 0, carbohydrates: 67, unit: '100g' },

      // ======= YAĞLAR VE SOSLAR =======
      { name: 'Zeytinyağı', calories: 884, protein: 0, fat: 100, carbohydrates: 0, unit: '100g' },
      { name: 'Ayçiçek Yağı', calories: 884, protein: 0, fat: 100, carbohydrates: 0, unit: '100g' },
      { name: 'Domates Sosu', calories: 35, protein: 1.5, fat: 0.5, carbohydrates: 7, unit: '100g' },
      { name: 'Sarımsaklı Yoğurt', calories: 65, protein: 4, fat: 3, carbohydrates: 6, unit: '100g' },
      { name: 'Nar Ekşisi', calories: 280, protein: 1, fat: 0, carbohydrates: 72, unit: '100g' },
      { name: 'Salça (Domates)', calories: 82, protein: 4, fat: 0.5, carbohydrates: 17, unit: '100g' },
      { name: 'Biber Salçası', calories: 90, protein: 3.5, fat: 0.5, carbohydrates: 18, unit: '100g' },
    ];

    let added = 0;
    let updated = 0;

    for (const foodInfo of foods) {
      const existing = await foodRepository.findOne({ where: { name: foodInfo.name } });
      if (existing) {
        await foodRepository.save({ ...existing, ...foodInfo });
        updated++;
      } else {
        await foodRepository.save(foodRepository.create(foodInfo));
        added++;
      }
    }

    console.log(`[Seeder 0003] Turkish Foods: ${added} added, ${updated} updated. Total processed: ${foods.length}.`);
  }
}
