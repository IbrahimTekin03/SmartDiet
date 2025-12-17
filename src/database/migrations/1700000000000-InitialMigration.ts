import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==========================================
    // 1. EXTENSIONS & ENUMS & FUNCTIONS
    // ==========================================
    
    // UUID eklentisi (uuid_generate_v4 kullanımı için şart)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Enumlar
    await queryRunner.query(`CREATE TYPE "gender_enum" AS ENUM ('male', 'female', 'other')`);
    await queryRunner.query(`CREATE TYPE "unit_enum" AS ENUM ('gram', 'piece', 'portion', 'liter', 'milliliter')`);
    await queryRunner.query(`CREATE TYPE "sub_status_enum" AS ENUM ('active', 'paused', 'cancelled', 'pending')`);
    await queryRunner.query(`CREATE TYPE "diet_status_enum" AS ENUM ('active', 'completed', 'archived')`);
    await queryRunner.query(`CREATE TYPE "msg_type_enum" AS ENUM ('text', 'image', 'file', 'system')`);

    // Otomatik updated_at güncelleme fonksiyonu
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // ==========================================
    // 2. TABLES (Sıralama Bağımlılıklara Göre Önemlidir)
    // ==========================================

    // Roles
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(50) UNIQUE NOT NULL,
        "permissions" JSONB DEFAULT '{}',
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "role_id" UUID REFERENCES "roles"("id") ON DELETE RESTRICT,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "phone_number" VARCHAR(20),
        "is_verified" BOOLEAN DEFAULT FALSE,
        "verification_code" VARCHAR(6),
        "is_active" BOOLEAN DEFAULT TRUE,
        "last_login" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      )
    `);

    // User Profiles
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "user_id" UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "avatar_url" TEXT,
        "birth_date" DATE,
        "gender" gender_enum,
        "bio" TEXT,
        "address" TEXT,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Clinics
    await queryRunner.query(`
      CREATE TABLE "clinics" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "owner_id" UUID REFERENCES "users"("id"),
        "name" VARCHAR(255) NOT NULL,
        "address" TEXT,
        "tax_number" VARCHAR(50),
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      )
    `);

    // Subscriptions
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "dietitian_id" UUID REFERENCES "users"("id") NOT NULL,
        "client_id" UUID REFERENCES "users"("id") NOT NULL,
        "clinic_id" UUID REFERENCES "clinics"("id"),
        "start_date" TIMESTAMPTZ DEFAULT NOW(),
        "end_date" TIMESTAMPTZ,
        "status" sub_status_enum DEFAULT 'pending',
        "notes" TEXT,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      )
    `);

    // Foods
    await queryRunner.query(`
      CREATE TABLE "foods" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) NOT NULL,
        "image_url" TEXT,
        "calories" DECIMAL(10, 2) NOT NULL,
        "protein" DECIMAL(10, 2) DEFAULT 0,
        "carbohydrate" DECIMAL(10, 2) DEFAULT 0,
        "fat" DECIMAL(10, 2) DEFAULT 0,
        "standard_unit" unit_enum DEFAULT 'gram',
        "standard_amount" DECIMAL(10, 2) DEFAULT 100,
        "is_public" BOOLEAN DEFAULT FALSE,
        "created_by" UUID REFERENCES "users"("id"),
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      )
    `);

    // Diet Plans
    await queryRunner.query(`
      CREATE TABLE "diet_plans" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "dietitian_id" UUID REFERENCES "users"("id") NOT NULL,
        "client_id" UUID REFERENCES "users"("id") NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "start_date" DATE NOT NULL,
        "end_date" DATE NOT NULL,
        "status" diet_status_enum DEFAULT 'active',
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      )
    `);

    // Daily Plans
    await queryRunner.query(`
      CREATE TABLE "daily_plans" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "diet_plan_id" UUID REFERENCES "diet_plans"("id") ON DELETE CASCADE,
        "day_date" DATE NOT NULL,
        "day_notes" TEXT,
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Meals
    await queryRunner.query(`
      CREATE TABLE "meals" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "daily_plan_id" UUID REFERENCES "daily_plans"("id") ON DELETE CASCADE,
        "name" VARCHAR(100) NOT NULL,
        "time_slot" TIME,
        "order_index" INT DEFAULT 1,
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Meal Items
    await queryRunner.query(`
      CREATE TABLE "meal_items" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "meal_id" UUID REFERENCES "meals"("id") ON DELETE CASCADE,
        "food_id" UUID REFERENCES "foods"("id"),
        "quantity" DECIMAL(10, 2) NOT NULL,
        "unit" unit_enum NOT NULL,
        "description" TEXT,
        "is_alternative" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Consumption Logs
    await queryRunner.query(`
      CREATE TABLE "consumption_logs" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "client_id" UUID REFERENCES "users"("id") NOT NULL,
        "meal_item_id" UUID REFERENCES "meal_items"("id"),
        "consumed_at" TIMESTAMPTZ DEFAULT NOW(),
        "is_consumed" BOOLEAN DEFAULT TRUE,
        "image_url" TEXT,
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Water Logs
    await queryRunner.query(`
      CREATE TABLE "water_logs" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "client_id" UUID REFERENCES "users"("id") NOT NULL,
        "log_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "amount_ml" INT NOT NULL,
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Measurements
    await queryRunner.query(`
      CREATE TABLE "measurements" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "client_id" UUID REFERENCES "users"("id") NOT NULL,
        "date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "weight" DECIMAL(5, 2),
        "height" DECIMAL(5, 2),
        "waist" DECIMAL(5, 2),
        "hip" DECIMAL(5, 2),
        "notes" TEXT,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Chat Rooms
    await queryRunner.query(`
      CREATE TABLE "chat_rooms" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "dietitian_id" UUID REFERENCES "users"("id"),
        "client_id" UUID REFERENCES "users"("id"),
        "is_active" BOOLEAN DEFAULT TRUE,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE("dietitian_id", "client_id")
      )
    `);

    // Messages
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "room_id" UUID REFERENCES "chat_rooms"("id") ON DELETE CASCADE,
        "sender_id" UUID REFERENCES "users"("id"),
        "content" TEXT,
        "message_type" msg_type_enum DEFAULT 'text',
        "file_url" TEXT,
        "is_read" BOOLEAN DEFAULT FALSE,
        "read_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ==========================================
    // 3. TRIGGERS
    // ==========================================

    await queryRunner.query(`CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()`);
    await queryRunner.query(`CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON "user_profiles" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()`);
    await queryRunner.query(`CREATE TRIGGER set_timestamp_foods BEFORE UPDATE ON "foods" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()`);
    await queryRunner.query(`CREATE TRIGGER set_timestamp_measurements BEFORE UPDATE ON "measurements" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()`);
    await queryRunner.query(`CREATE TRIGGER set_timestamp_diet_plans BEFORE UPDATE ON "diet_plans" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Tabloları "CASCADE" ile silmek en temizidir, bağımlılık hatalarını engeller.
    // Ters sırayla silmek iyi bir pratiktir ancak CASCADE kullandığımız için zorunlu değildir, yine de düzenli duralım.

    await queryRunner.query(`DROP TABLE IF EXISTS "messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_rooms" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "measurements" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "water_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "consumption_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "meal_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "meals" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "daily_plans" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "diet_plans" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "foods" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clinics" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`);

    // Fonksiyonu sil
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column CASCADE`);

    // Enumları sil
    await queryRunner.query(`DROP TYPE IF EXISTS "msg_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "diet_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sub_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "unit_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "gender_enum"`);
    
    // Extension'ı genelde silmeyiz ama tam temizlik için:
    // await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}