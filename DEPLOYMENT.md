# 🚀 SmartDiet Canlıya Alma (Production Deployment) Rehberi

Bu rehber, SmartDiet projesini iş verenlerin, İK ekiplerinin ve kullanıcıların erişebileceği şekilde **5-10 dakika içinde tamamen ücretsiz veya düşük maliyetli** olarak canlıya almanızı sağlar.

---

## 🏗️ Mimari ve Gereksinimler

SmartDiet 3 ana bileşenden oluşur:
1. **Frontend (SPA)**: React 18 + Vite + Tailwind CSS + Lucide Icons.
2. **Backend (API & WebSockets)**: NestJS + TypeORM + Socket.IO + JWT + Nodemailer.
3. **Veritabanı**: PostgreSQL 14+ (JSONB ve ilişkisel tablolar).

---

## 🌟 Adım 1: Ücretsiz PostgreSQL Veritabanı Oluşturma

En hızlı ve kararlı ücretsiz PostgreSQL sağlayıcıları:
* **Seçenek A: [Neon.tech](https://neon.tech/)** *(Tavsiye Edilen - Ücretsiz Serverless PostgreSQL)*
* **Seçenek B: [Supabase](https://supabase.com/)** *(Ücretsiz 500MB PostgreSQL)*
* **Seçenek C: [Render PostgreSQL](https://render.com/)** *(Ücretsiz 1GB PostgreSQL)*

### Neon.tech ile 1 Dakikada Kurulum:
1. [Neon.tech](https://neon.tech/) sitesine GitHub ile giriş yapın.
2. **'Create Project'** butonuna tıklayın, Proje adı olarak `smartdiet-db` yazın.
3. Size verilen Connection String'i kopyalayın.

---

## ⚙️ Adım 2: Backend API Canlıya Alma (Render.com veya Railway.app)

### Render.com ile Ücretsiz Web Service Kurulumu:
1. [Render.com](https://render.com/) sitesine GitHub ile kaydolun/giriş yapın.
2. **New +** -> **Web Service** seçin.
3. `IbrahimTekin03/SmartDiet` GitHub deponuzu seçip bağlayın.
4. Ayarları şu şekilde doldurun:
   * **Name**: `smartdiet-backend`
   * **Region**: `Frankfurt (EU Central)`
   * **Root Directory**: `Backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `node dist/src/main.js`
   * **Instance Type**: `Free`

5. **Environment Variables (Ortam Değişkenleri)** alanına şunları ekleyin:
   * `NODE_ENV`: `production`
   * `PORT`: `3000`
   * `DB_HOST`: *Neon'dan aldığınız host*
   * `DB_PORT`: `5432`
   * `DB_USERNAME`: *Neon DB kullanıcı adı*
   * `DB_PASSWORD`: *Neon DB şifresi*
   * `DB_DATABASE`: `neondb`
   * `DB_SSL`: `true`
   * `JWT_SECRET`: `smartdiet_ultra_secure_jwt_secret_key_2026`
   * `JWT_EXPIRES_IN`: `7d`
   * `FRONTEND_URL`: `https://smartdiet.vercel.app` *(Frontend deploy sonrası güncelleyin)*

6. **'Create Web Service'** butonuna tıklayın. Render size bir URL verecektir (Örn: `https://smartdiet-backend.onrender.com`).

---

## 🎨 Adım 3: Frontend Canlıya Alma (Vercel veya Netlify)

### Vercel ile 2 Dakikada Kurulum:
1. [Vercel.com](https://vercel.com/) sitesine GitHub ile giriş yapın.
2. **'Add New Project'** butonuna tıklayın ve `IbrahimTekin03/SmartDiet` reposunu seçin.
3. Proje Ayarları:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `Frontend` *(Edit butonuna basıp Frontend seçin)*
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. **Environment Variables**:
   * Key: `VITE_API_URL`
   * Value: `https://smartdiet-backend.onrender.com` *(Render Backend URL'niz)*
5. **'Deploy'** butonuna tıklayın!
6. Vercel saniyeler içinde yayına alacak ve size bir domain verecektir (Örn: `https://smartdiet.vercel.app`).

---

## ⚡ Adım 4: Demo Hesaplar & Veri Başlatma

Demo kullanıcılar:
* Diyetisyen Demo: `ibrahim_tkn033@hotmail.com` / `admin123` (**Demo Diyetisyen**)
* Danışan Demo: `ibrahim_tkn03@hotmail.com` / `admin123` (**Demo Danışan**)
* Yönetici Demo: `admin@example.com` / `admin123` (**Sistem Yöneticisi**)

---

## 🎯 İş Verenler ve İK İçin Canlı İnceleme Noktaları

Canlıya aldıktan sonra CV veya LinkedIn profilinize şu bağlantıları ekleyebilirsiniz:
1. **Canlı Platform**: `https://smartdiet.vercel.app/`
2. **Özellikler & Ürün Kataloğu**: `https://smartdiet.vercel.app/features`
3. **Tek Tıkla Diyetisyen Paneli İnceleme**: Ana sayfadaki veya Özellikler sayfasındaki *'Diyetisyen Demosu'* butonu
4. **Tek Tıkla Danışan Paneli İnceleme**: Ana sayfadaki veya Özellikler sayfasındaki *'Danışan Demosu'* butonu
