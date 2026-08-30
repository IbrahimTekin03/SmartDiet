import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserProfile, DietitianVerificationStatus } from '../users/entities/user.profile.entity';
import { Role } from '../acl/entities/role.entity';
import { Food } from '../foods/entities/food.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { UserAssignedDietitian } from '../users/entities/user-assigned-dietitian.entity';
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

    // 2. Demo Dietitian
    let dietitianUser = await userRepo.findOne({
      where: { email: 'demo.dietitian@smartdiet.com' },
      relations: ['roles'],
    });

    if (!dietitianUser) {
      const rolesToAssign = [dietitianRole, diyetisyenRole].filter(Boolean) as Role[];
      dietitianUser = userRepo.create({
        email: 'demo.dietitian@smartdiet.com',
        first_name: 'Demo',
        last_name: 'Diyetisyen',
        password_hash: passwordHash,
        is_active: true,
        is_verified: true,
        roles: rolesToAssign,
      });
      dietitianUser = await userRepo.save(dietitianUser);

      await profileRepo.save(
        profileRepo.create({
          user_id: dietitianUser.id,
          first_name: 'Demo',
          last_name: 'Diyetisyen',
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
      await userRepo.save(dietitianUser);

      let dProfile = await profileRepo.findOne({ where: { user_id: dietitianUser.id } });
      if (!dProfile) {
        await profileRepo.save(
          profileRepo.create({
            user_id: dietitianUser.id,
            first_name: 'Demo',
            last_name: 'Diyetisyen',
            client_verification_status: 'approved',
            dietitian_verification_status: DietitianVerificationStatus.Approved,
          }),
        );
      } else {
        dProfile.client_verification_status = 'approved';
        dProfile.dietitian_verification_status = DietitianVerificationStatus.Approved;
        await profileRepo.save(dProfile);
      }
    }

    // 3. Demo Client
    let clientUser = await userRepo.findOne({
      where: { email: 'demo.client@smartdiet.com' },
      relations: ['roles'],
    });

    if (!clientUser) {
      const rolesToAssign = [clientRole].filter(Boolean) as Role[];
      clientUser = userRepo.create({
        email: 'demo.client@smartdiet.com',
        first_name: 'Demo',
        last_name: 'Danışan',
        password_hash: passwordHash,
        is_active: true,
        is_verified: true,
        roles: rolesToAssign,
      });
      clientUser = await userRepo.save(clientUser);

      await profileRepo.save(
        profileRepo.create({
          user_id: clientUser.id,
          first_name: 'Demo',
          last_name: 'Danışan',
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
      await userRepo.save(clientUser);

      let cProfile = await profileRepo.findOne({ where: { user_id: clientUser.id } });
      if (!cProfile) {
        await profileRepo.save(
          profileRepo.create({
            user_id: clientUser.id,
            first_name: 'Demo',
            last_name: 'Danışan',
            client_verification_status: 'approved',
            dietitian_verification_status: DietitianVerificationStatus.Approved,
          }),
        );
      } else {
        cProfile.client_verification_status = 'approved';
        cProfile.dietitian_verification_status = DietitianVerificationStatus.Approved;
        await profileRepo.save(cProfile);
      }
    }

    // 4. Admin User
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

    // 5. Connect Demo Client to Demo Dietitian
    if (clientUser && dietitianUser) {
      const existingAssign = await assignRepo.findOne({
        where: {
          clientId: clientUser.id,
          dietitianId: dietitianUser.id,
        },
      });

      if (!existingAssign) {
        const assignment = assignRepo.create({
          clientId: clientUser.id,
          dietitianId: dietitianUser.id,
        });
        await assignRepo.save(assignment);
        this.logger.log('Demo Client assigned to Demo Dietitian');
      }
    }

    // 6. Sample Foods
    const foodCount = await foodRepo.count();
    if (foodCount === 0) {
      const sampleFoods = [
        { name: 'Zeytin (Siyah)', calories: 115, protein: 0.8, fat: 10.7, carbohydrates: 6.3, unit: 'adet (5g)' },
        { name: 'Yumurta (Haşlanmış)', calories: 155, protein: 12.6, fat: 10.6, carbohydrates: 1.1, unit: 'adet (50g)' },
        { name: 'Yulaf Ezmesi', calories: 389, protein: 16.9, fat: 6.9, carbohydrates: 66.3, unit: 'gram (100g)' },
        { name: 'Tavuk Göğsü (Izgara)', calories: 165, protein: 31.0, fat: 3.6, carbohydrates: 0.0, unit: 'gram (100g)' },
        { name: 'Yoğurt (Az Yağlı)', calories: 63, protein: 5.3, fat: 1.5, carbohydrates: 7.0, unit: 'gram (100g)' },
        { name: 'Beyaz Peynir', calories: 250, protein: 15.0, fat: 20.0, carbohydrates: 2.0, unit: 'dilim (30g)' },
        { name: 'Badem (Çiğ)', calories: 579, protein: 21.2, fat: 49.9, carbohydrates: 21.6, unit: 'adet (10g)' },
        { name: 'Ceviz', calories: 654, protein: 15.2, fat: 65.2, carbohydrates: 13.7, unit: 'adet (15g)' },
        { name: 'Somon Balığı', calories: 208, protein: 20.4, fat: 13.4, carbohydrates: 0.0, unit: 'gram (100g)' },
        { name: 'Mevsim Salatası', calories: 45, protein: 1.5, fat: 2.0, carbohydrates: 5.5, unit: 'porsiyon' },
      ];
      await foodRepo.save(sampleFoods);
      this.logger.log(`Inserted ${sampleFoods.length} sample Turkish foods`);
    }

    // 7. Sample Clinic
    const clinicCount = await clinicRepo.count();
    if (clinicCount === 0) {
      const clinic = clinicRepo.create({
        name: 'SmartDiet Merkez Beslenme Kliniği',
        city: 'İstanbul',
        address: 'Levent Mah. Sağlık Cad. No:12 Beşiktaş / İstanbul',
      });
      await clinicRepo.save(clinic);
      this.logger.log('Sample clinic created');
    }

    // 8. Sample Diet Plan for Demo Client
    if (clientUser && dietitianUser) {
      const planCount = await planRepo.count({ where: { client_id: clientUser.id } });
      if (planCount === 0) {
        const plan = planRepo.create({
          client_id: clientUser.id,
          dietitian_id: dietitianUser.id,
          title: 'Akdeniz Tipi Sağlıklı Beslenme & Kilo Kontrol Programı',
          description: 'Haftalık dengeli protein ve lif içerikli, danışana özel olarak hazırlanmış klinik beslenme programı.',
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
