import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserProfile, AccountType, DietitianVerificationStatus } from '../users/entities/user.profile.entity';
import { Role } from '../acl/entities/role.entity';
import { Food } from '../foods/entities/food.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { UserAssignedDietitian } from '../users/entities/user-assigned-dietitian.entity';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { DietPlan } from '../diet-plans/entities/diet-plan.entity';
import { DietPlanMeal } from '../diet-plans/entities/diet-plan-meal.entity';

@Injectable()
export class AutoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AutoSeedService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    try {
      await this.runAutoSeed();
    } catch (err: any) {
      this.logger.error('AutoSeed encountered an error:', err?.message || err);
    }
  }

  private async runAutoSeed() {
    const roleRepo = this.dataSource.getRepository(Role);
    const userRepo = this.dataSource.getRepository(User);
    const profileRepo = this.dataSource.getRepository(UserProfile);
    const foodRepo = this.dataSource.getRepository(Food);
    const clinicRepo = this.dataSource.getRepository(Clinic);
    const assignRepo = this.dataSource.getRepository(UserAssignedDietitian);
    const subRepo = this.dataSource.getRepository(Subscription);
    const roomRepo = this.dataSource.getRepository(ChatRoom);
    const planRepo = this.dataSource.getRepository(DietPlan);
    const mealRepo = this.dataSource.getRepository(DietPlanMeal);

    // 1. Roles
    const baseRoles = [
      { name: 'admin', description: 'Sistem Yöneticisi' },
      { name: 'dietitian', description: 'Diyetisyen' },
      { name: 'diyetisyen', description: 'Diyetisyen' },
      { name: 'client', description: 'Danışan' },
      { name: 'clinic_manager', description: 'Klinik Yöneticisi' },
    ];

    for (const r of baseRoles) {
      const existing = await roleRepo.findOne({ where: { name: r.name } });
      if (!existing) {
        await roleRepo.save(roleRepo.create(r));
      }
    }

    const adminRole = await roleRepo.findOne({ where: { name: 'admin' } });
    const dietitianRole = await roleRepo.findOne({ where: { name: 'dietitian' } });
    const diyetisyenRole = await roleRepo.findOne({ where: { name: 'diyetisyen' } });
    const clientRole = await roleRepo.findOne({ where: { name: 'client' } });

    const passwordHash = await bcrypt.hash('admin123', 10);

    // 2. Sample Clinic
    let clinic = await clinicRepo.findOne({ where: { name: 'SmartDiet Merkez Beslenme Kliniği' } });
    if (!clinic) {
      clinic = clinicRepo.create({
        name: 'SmartDiet Merkez Beslenme Kliniği',
        city: 'İstanbul',
        address: 'Levent Mah. Sağlık Cad. No:12 Beşiktaş / İstanbul',
      });
      clinic = await clinicRepo.save(clinic);
    }

    // 3. Demo Dietitian
    let dietitianUser = await userRepo.findOne({
      where: { email: 'demo.dietitian@smartdiet.com' },
      relations: ['roles'],
    });

    const dietitianRoles = [dietitianRole, diyetisyenRole].filter(Boolean) as Role[];

    if (!dietitianUser) {
      dietitianUser = userRepo.create({
        email: 'demo.dietitian@smartdiet.com',
        first_name: 'Demo',
        last_name: 'Diyetisyen',
        password_hash: passwordHash,
        is_active: true,
        is_verified: true,
        roles: dietitianRoles,
      });
      dietitianUser = await userRepo.save(dietitianUser);

      await profileRepo.save(
        profileRepo.create({
          user_id: dietitianUser.id,
          first_name: 'Demo',
          last_name: 'Diyetisyen',
          account_type: AccountType.Dietitian,
          clinic_id: clinic?.id || null,
          clinic_name: clinic?.name || null,
          client_verification_status: 'approved',
          dietitian_verification_status: DietitianVerificationStatus.Approved,
        }),
      );
      this.logger.log('Demo Dietitian created: demo.dietitian@smartdiet.com');
    } else {
      dietitianUser.first_name = 'Demo';
      dietitianUser.last_name = 'Diyetisyen';
      dietitianUser.password_hash = passwordHash;
      dietitianUser.is_active = true;
      dietitianUser.is_verified = true;
      dietitianUser.roles = dietitianRoles;
      await userRepo.save(dietitianUser);

      let dProfile = await profileRepo.findOne({ where: { user_id: dietitianUser.id } });
      if (!dProfile) {
        await profileRepo.save(
          profileRepo.create({
            user_id: dietitianUser.id,
            first_name: 'Demo',
            last_name: 'Diyetisyen',
            account_type: AccountType.Dietitian,
            clinic_id: clinic?.id || null,
            clinic_name: clinic?.name || null,
            client_verification_status: 'approved',
            dietitian_verification_status: DietitianVerificationStatus.Approved,
          }),
        );
      } else {
        dProfile.first_name = 'Demo';
        dProfile.last_name = 'Diyetisyen';
        dProfile.account_type = AccountType.Dietitian;
        dProfile.clinic_id = clinic?.id || null;
        dProfile.clinic_name = clinic?.name || null;
        dProfile.client_verification_status = 'approved';
        dProfile.dietitian_verification_status = DietitianVerificationStatus.Approved;
        await profileRepo.save(dProfile);
      }
    }

    // 4. Demo Client
    let clientUser = await userRepo.findOne({
      where: { email: 'demo.client@smartdiet.com' },
      relations: ['roles'],
    });

    const clientRoles = [clientRole].filter(Boolean) as Role[];

    if (!clientUser) {
      clientUser = userRepo.create({
        email: 'demo.client@smartdiet.com',
        first_name: 'Demo',
        last_name: 'Danışan',
        password_hash: passwordHash,
        is_active: true,
        is_verified: true,
        roles: clientRoles,
      });
      clientUser = await userRepo.save(clientUser);

      await profileRepo.save(
        profileRepo.create({
          user_id: clientUser.id,
          first_name: 'Demo',
          last_name: 'Danışan',
          account_type: AccountType.Client,
          client_verification_status: 'approved',
          dietitian_verification_status: DietitianVerificationStatus.Approved,
        }),
      );
      this.logger.log('Demo Client created: demo.client@smartdiet.com');
    } else {
      clientUser.first_name = 'Demo';
      clientUser.last_name = 'Danışan';
      clientUser.password_hash = passwordHash;
      clientUser.is_active = true;
      clientUser.is_verified = true;
      clientUser.roles = clientRoles;
      await userRepo.save(clientUser);

      let cProfile = await profileRepo.findOne({ where: { user_id: clientUser.id } });
      if (!cProfile) {
        await profileRepo.save(
          profileRepo.create({
            user_id: clientUser.id,
            first_name: 'Demo',
            last_name: 'Danışan',
            account_type: AccountType.Client,
            client_verification_status: 'approved',
            dietitian_verification_status: DietitianVerificationStatus.Approved,
          }),
        );
      } else {
        cProfile.first_name = 'Demo';
        cProfile.last_name = 'Danışan';
        cProfile.account_type = AccountType.Client;
        cProfile.client_verification_status = 'approved';
        cProfile.dietitian_verification_status = DietitianVerificationStatus.Approved;
        await profileRepo.save(cProfile);
      }
    }

    // 5. Admin User
    let adminUser = await userRepo.findOne({
      where: { email: 'admin@example.com' },
      relations: ['roles'],
    });

    if (!adminUser && adminRole) {
      adminUser = userRepo.create({
        email: 'admin@example.com',
        first_name: 'System',
        last_name: 'Admin',
        password_hash: passwordHash,
        is_active: true,
        is_verified: true,
        roles: [adminRole],
      });
      adminUser = await userRepo.save(adminUser);

      await profileRepo.save(
        profileRepo.create({
          user_id: adminUser.id,
          first_name: 'System',
          last_name: 'Admin',
          client_verification_status: 'approved',
          dietitian_verification_status: DietitianVerificationStatus.Approved,
        }),
      );
    }

    // 6. Connect Demo Client to Demo Dietitian (3 Levels: Assignment, Subscription, ChatRoom)
    if (clientUser && dietitianUser) {
      // 6.1 Assignment
      let assignment = await assignRepo.findOne({
        where: { clientId: clientUser.id },
      });
      if (!assignment) {
        assignment = assignRepo.create({
          clientId: clientUser.id,
          dietitianId: dietitianUser.id,
          clinicId: clinic?.id || null,
        });
        await assignRepo.save(assignment);
      } else if (assignment.dietitianId !== dietitianUser.id) {
        assignment.dietitianId = dietitianUser.id;
        assignment.clinicId = clinic?.id || null;
        await assignRepo.save(assignment);
      }

      // 6.2 Subscription (CRITICAL for Dashboard & Client List visibility)
      let subscription = await subRepo.findOne({
        where: { client_id: clientUser.id, dietitian_id: dietitianUser.id },
      });
      if (!subscription) {
        subscription = subRepo.create({
          client_id: clientUser.id,
          dietitian_id: dietitianUser.id,
          clinic_id: clinic?.id || null,
          status: SubscriptionStatus.Active,
          start_date: new Date(),
          notes: 'Demo ataması otomatik aktif edildi',
        });
        await subRepo.save(subscription);
      } else if (subscription.status !== SubscriptionStatus.Active) {
        subscription.status = SubscriptionStatus.Active;
        await subRepo.save(subscription);
      }

      // 6.3 Chat Room
      let room = await roomRepo.findOne({
        where: { client_id: clientUser.id, dietitian_id: dietitianUser.id },
      });
      if (!room) {
        room = roomRepo.create({
          client_id: clientUser.id,
          dietitian_id: dietitianUser.id,
          is_active: true,
        });
        await roomRepo.save(room);
      } else if (!room.is_active) {
        room.is_active = true;
        await roomRepo.save(room);
      }

      this.logger.log('Demo Client fully linked to Demo Dietitian (Assignment + Subscription + ChatRoom)');
    }

    // 7. Comprehensive Food Library
    const sampleFoods = [
      // Kahvaltılıklar
      { name: 'Yumurta (Haşlanmış)', calories: 155, protein: 12.6, fat: 10.6, carbohydrates: 1.1, unit: 'adet (50g)' },
      { name: 'Yumurta (Sahanda/Omlet)', calories: 180, protein: 11.5, fat: 14.0, carbohydrates: 1.2, unit: 'adet (60g)' },
      { name: 'Beyaz Peynir (Tam Yağlı)', calories: 260, protein: 16.0, fat: 21.0, carbohydrates: 1.5, unit: 'dilim (30g)' },
      { name: 'Lor Peyniri (Yağsız/Diyet)', calories: 98, protein: 17.0, fat: 1.5, carbohydrates: 3.5, unit: 'porsiyon (100g)' },
      { name: 'Kaşar Peyniri', calories: 350, protein: 27.0, fat: 26.0, carbohydrates: 2.0, unit: 'dilim (30g)' },
      { name: 'Zeytin (Siyah)', calories: 115, protein: 0.8, fat: 10.7, carbohydrates: 6.3, unit: 'adet (5g)' },
      { name: 'Zeytin (Yeşil)', calories: 145, protein: 1.0, fat: 15.0, carbohydrates: 3.8, unit: 'adet (5g)' },
      { name: 'Yulaf Ezmesi', calories: 389, protein: 16.9, fat: 6.9, carbohydrates: 66.3, unit: 'gram (100g)' },
      { name: 'Tam Buğday Ekmeği', calories: 247, protein: 13.0, fat: 3.4, carbohydrates: 41.0, unit: 'dilim (30g)' },
      { name: 'Çavdar Ekmeği', calories: 259, protein: 8.5, fat: 3.3, carbohydrates: 48.0, unit: 'dilim (30g)' },
      { name: 'Süzme Bal', calories: 304, protein: 0.3, fat: 0.0, carbohydrates: 82.4, unit: 'tatlı kaşığı (10g)' },

      // Et, Tavuk ve Balık
      { name: 'Tavuk Göğsü (Izgara/Haşlama)', calories: 165, protein: 31.0, fat: 3.6, carbohydrates: 0.0, unit: 'gram (100g)' },
      { name: 'Tavuk But (Fırında/Derisiz)', calories: 175, protein: 24.0, fat: 8.5, carbohydrates: 0.0, unit: 'gram (100g)' },
      { name: 'Dana Biftek / Yağsız Kırmızı Et', calories: 215, protein: 26.0, fat: 12.0, carbohydrates: 0.0, unit: 'gram (100g)' },
      { name: 'Izgara Köfte (Ev Yapımı)', calories: 230, protein: 19.0, fat: 15.0, carbohydrates: 4.5, unit: 'adet (40g)' },
      { name: 'Somon Balığı (Fırın)', calories: 208, protein: 20.4, fat: 13.4, carbohydrates: 0.0, unit: 'gram (100g)' },
      { name: 'Ton Balığı (Konserve/Suda)', calories: 116, protein: 26.0, fat: 1.0, carbohydrates: 0.0, unit: 'kutu (80g)' },
      { name: 'Levrek / Çipura (Izgara)', calories: 125, protein: 23.0, fat: 3.5, carbohydrates: 0.0, unit: 'gram (100g)' },

      // Baklagil & Tahıllar
      { name: 'Kırmızı Mercimek Çorbası', calories: 110, protein: 6.5, fat: 3.0, carbohydrates: 15.0, unit: 'kase (200ml)' },
      { name: 'Kuru Fasulye (Zeytinyağlı)', calories: 140, protein: 9.0, fat: 3.5, carbohydrates: 20.0, unit: 'porsiyon (150g)' },
      { name: 'Nohut Yemeği', calories: 160, protein: 8.8, fat: 4.0, carbohydrates: 23.0, unit: 'porsiyon (150g)' },
      { name: 'Bulgur Pilavı', calories: 150, protein: 4.5, fat: 2.0, carbohydrates: 30.0, unit: 'porsiyon (100g)' },
      { name: 'Kepekli / Tam Buğday Makarna', calories: 158, protein: 5.8, fat: 1.2, carbohydrates: 31.0, unit: 'porsiyon (100g)' },
      { name: 'Basmati Pirinç Pilavı', calories: 130, protein: 2.7, fat: 0.5, carbohydrates: 28.0, unit: 'porsiyon (100g)' },
      { name: 'Kinoa (Haşlanmış)', calories: 120, protein: 4.4, fat: 1.9, carbohydrates: 21.3, unit: 'porsiyon (100g)' },

      // Süt & Süt Ürünleri
      { name: 'Yoğurt (Az Yağlı)', calories: 63, protein: 5.3, fat: 1.5, carbohydrates: 7.0, unit: 'gram (100g)' },
      { name: 'Süzme Yoğurt', calories: 97, protein: 9.0, fat: 4.5, carbohydrates: 4.0, unit: 'gram (100g)' },
      { name: 'Kefir (Sade)', calories: 55, protein: 3.5, fat: 2.5, carbohydrates: 4.5, unit: 'bardak (200ml)' },
      { name: 'Yağsız Süt', calories: 35, protein: 3.4, fat: 0.1, carbohydrates: 5.0, unit: 'bardak (200ml)' },
      { name: 'Badem Sütü (Şekersiz)', calories: 13, protein: 0.4, fat: 1.1, carbohydrates: 0.3, unit: 'bardak (200ml)' },

      // Sebze & Salatalar
      { name: 'Mevsim Salatası (Zeytinyağlı)', calories: 65, protein: 1.5, fat: 4.0, carbohydrates: 6.0, unit: 'porsiyon' },
      { name: 'Brokoli (Buharda)', calories: 35, protein: 2.8, fat: 0.4, carbohydrates: 7.0, unit: 'porsiyon (100g)' },
      { name: 'Ispanak Yemeği', calories: 50, protein: 3.0, fat: 2.5, carbohydrates: 4.0, unit: 'porsiyon (150g)' },
      { name: 'Kabak Sote / Izgara', calories: 30, protein: 1.2, fat: 1.5, carbohydrates: 3.5, unit: 'porsiyon (100g)' },
      { name: 'Közlenmiş Kırmızı Biber', calories: 35, protein: 1.0, fat: 0.5, carbohydrates: 6.5, unit: 'adet (80g)' },
      { name: 'Salatalık & Domates Söğüş', calories: 20, protein: 0.8, fat: 0.2, carbohydrates: 3.8, unit: 'porsiyon (100g)' },

      // Meyveler
      { name: 'Muz (Orta Boy)', calories: 105, protein: 1.3, fat: 0.3, carbohydrates: 27.0, unit: 'adet (118g)' },
      { name: 'Yeşil Elma', calories: 52, protein: 0.3, fat: 0.2, carbohydrates: 14.0, unit: 'adet (100g)' },
      { name: 'Çilek', calories: 32, protein: 0.7, fat: 0.3, carbohydrates: 7.7, unit: 'kase (150g)' },
      { name: 'Yaban Mersini / Böğürtlen', calories: 57, protein: 0.7, fat: 0.3, carbohydrates: 14.0, unit: 'avuç (50g)' },
      { name: 'Portakal', calories: 62, protein: 1.2, fat: 0.2, carbohydrates: 15.4, unit: 'adet (130g)' },
      { name: 'Avokado', calories: 160, protein: 2.0, fat: 14.7, carbohydrates: 8.5, unit: 'yarım adet (80g)' },

      // Kuruyemiş & Sağlıklı Yağlar
      { name: 'Çiğ Badem', calories: 579, protein: 21.2, fat: 49.9, carbohydrates: 21.6, unit: 'adet (10g)' },
      { name: 'Ceviz İçi', calories: 654, protein: 15.2, fat: 65.2, carbohydrates: 13.7, unit: 'adet (15g)' },
      { name: 'Çiğ Fındık', calories: 628, protein: 15.0, fat: 61.0, carbohydrates: 17.0, unit: 'avuç (25g)' },
      { name: 'Fıstık Ezmesi (Şekersiz)', calories: 588, protein: 25.0, fat: 50.0, carbohydrates: 20.0, unit: 'tatlı kaşığı (15g)' },
      { name: 'Zeytinyağı (Soğuk Sıkım)', calories: 884, protein: 0.0, fat: 100.0, carbohydrates: 0.0, unit: 'yemek kaşığı (10g)' },
      { name: 'Chia Tohumu', calories: 486, protein: 16.5, fat: 30.7, carbohydrates: 42.1, unit: 'tatlı kaşığı (10g)' },
    ];

    for (const f of sampleFoods) {
      const exists = await foodRepo.findOne({ where: { name: f.name } });
      if (!exists) {
        await foodRepo.save(foodRepo.create(f));
      }
    }
    this.logger.log(`Verified ${sampleFoods.length} comprehensive foods in food library`);

    // 8. Sample Diet Plan for Demo Client
    if (clientUser && dietitianUser) {
      let plan = await planRepo.findOne({ where: { client_id: clientUser.id } });
      if (!plan) {
        plan = planRepo.create({
          client_id: clientUser.id,
          dietitian_id: dietitianUser.id,
          title: 'Akdeniz Tipi Sağlıklı Beslenme & Kilo Kontrol Programı',
          description: 'Haftalık dengeli protein ve lif içerikli, danışana özel klinik beslenme programı.',
          is_active: true,
          plan_type: 'weekly',
        });
        const savedPlan = await planRepo.save(plan);

        const meals = [
          mealRepo.create({
            plan_id: savedPlan.id,
            name: 'Sabah Kahvaltısı',
            time: '08:30',
            note: '2 adet haşlanmış yumurta, 5 adet az tuzlu siyah zeytin, 1 dilim beyaz peynir ve bol yeşillik (155 kcal).',
          }),
          mealRepo.create({
            plan_id: savedPlan.id,
            name: 'Öğle Yemeği',
            time: '13:00',
            note: '150g ızgara tavuk göğsü, zeytinyağlı mevsim salatası ve 1 kase az yağlı yoğurt (418 kcal).',
          }),
          mealRepo.create({
            plan_id: savedPlan.id,
            name: 'İkindi Ara Öğün',
            time: '16:30',
            note: '10 adet çiğ badem ve 1 fincan yeşil çay (70 kcal).',
          }),
          mealRepo.create({
            plan_id: savedPlan.id,
            name: 'Akşam Yemeği',
            time: '19:30',
            note: '180g fırında somon balığı, buharda brokoli ve limonlu yeşil salata (419 kcal).',
          }),
        ];

        await mealRepo.save(meals);
        this.logger.log('Sample Diet Plan & Meals created for Demo Client');
      }
    }

    this.logger.log('AutoSeed completed successfully!');
  }
}
