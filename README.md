<div align="center">

# 🥗 SmartDiet

**Akıllı Klinik Beslenme Yönetim Platformu**

Diyetisyenler ve danışanlar arasında profesyonel beslenme takibi, diyet planlama ve sağlık yönetimi sağlayan full-stack web uygulaması.

![NestJS](https://img.shields.io/badge/NestJS-10.x-ea2845?style=flat-square&logo=nestjs)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-Alpine-dc382d?style=flat-square&logo=redis)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socketdotio)

</div>

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Mimari](#-mimari)
- [Kurulum](#-kurulum)
- [Environment Değişkenleri](#-environment-değişkenleri)
- [Docker ile Çalıştırma](#-docker-ile-çalıştırma)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Proje Yapısı](#-proje-yapısı)

---

## ✨ Özellikler

### 👨⚕️ Diyetisyen Paneli
- **Diyet Planı Oluşturma**: Haftalık ve aylık profesyonel beslenme planları
- **Danışan Yönetimi**: Atanmış danışanların sağlık metriklerini takip
- **Öğün Planlayıcı**: Besin veritabanından arama, otomatik makro hesaplama
- **Randevu Sistemi**: Danışan randevularını onaylama, reddetme, yeniden planlama
- **İlerleme Grafikleri**: Kilo, vücut yağı ve su tüketimi trend analizi

### 🧑 Danışan Paneli
- **Günlük Dashboard**: KPI kartları, su takibi, diyet planı kısayolları
- **Diyet Takibi**: İnteraktif öğün checkbox'ları, günlük uyum oranı
- **Su Tüketim Takibi**: Anlık +/- 250ml ayarlama, ilerleme çubuğu
- **Ölçüm Geçmişi**: Kilo, vücut yağı trendleri (7/30/90/365 gün)
- **Excel Dışa Aktarım**: Diyet planlarını .xlsx formatında indirme

### 🤖 AI Beslenme Asistanı
- **Çift AI Motoru**: Anthropic Claude 3.5 & Google Gemini 2.5 Flash
- **Yemek Fotoğraf Analizi**: Kamera ile çekim, otomatik besin ve makro tespiti
- **Akıllı Sohbet**: Bağlamsal beslenme danışmanlığı, tool calling
- **Besin Değiştirme**: Makro eşdeğer alternatif önerileri
- **Semantic Cache**: pgvector ile tekrarlayan sorgu optimizasyonu

### 💬 Gerçek Zamanlı Mesajlaşma
- **Anlık İletişim**: Socket.IO ile diyetisyen-danışan sohbeti
- **Durum Göstergeleri**: Online/offline, yazıyor, iletildi, okundu
- **Diyet Planı Paylaşımı**: Sohbet içi plan kartı gönderme

### 🏥 Yönetim
- **Admin Paneli**: Kullanıcı yönetimi, başvuru onayları, klinik CRUD, danışan-diyetisyen eşleştirme
- **Klinik Yöneticisi**: Diyetisyen kadrosu yönetimi, aktivasyon kontrolü
- **Çoklu Dil**: Türkçe / İngilizce arayüz desteği
- **Çift Tema**: Cream (açık) ve Green (koyu) tema seçenekleri

---

## 🛠 Teknoloji Yığını

| Katman | Teknoloji |
|:---|:---|
| **Frontend** | React 19, Vite 7, TypeScript, Tailwind CSS, Recharts, Socket.IO Client |
| **Backend** | NestJS 10, TypeScript, TypeORM, Passport.js (JWT), Socket.IO |
| **Veritabanı** | PostgreSQL 16 (uuid-ossp, pgvector) |
| **Cache** | Redis |
| **AI** | Anthropic Claude, Google Gemini |
| **E-posta** | Resend SMTP |
| **Konteyner** | Docker, Docker Compose |
| **Dokümantasyon** | Swagger / OpenAPI |

---

## 🏗 Mimari

```
SmartDiet/
├── Backend/                 # NestJS API Sunucusu
│   ├── src/
│   │   ├── modules/         # 16 iş modülü
│   │   │   ├── auth/        # Kimlik doğrulama & yönetim
│   │   │   ├── diet-plans/  # Diyet planı motoru
│   │   │   ├── foods/       # Besin veritabanı
│   │   │   ├── messages/    # Gerçek zamanlı mesajlaşma
│   │   │   ├── ai-assistant/# AI beslenme asistanı
│   │   │   ├── measurements/# Antropometrik ölçümler
│   │   │   ├── appointments/# Randevu sistemi
│   │   │   ├── water-tracking/ # Su takibi
│   │   │   ├── notifications/  # Bildirimler
│   │   │   ├── websocket/   # WebSocket gateway
│   │   │   ├── clinics/     # Klinik yönetimi
│   │   │   ├── users/       # Kullanıcı profilleri
│   │   │   ├── acl/         # Rol & yetki sistemi
│   │   │   ├── redis/       # Cache servisi
│   │   │   ├── mail/        # E-posta servisi
│   │   │   └── logger/      # Loglama
│   │   ├── database/        # Migration & seed dosyaları
│   │   ├── common/          # DTO'lar, yardımcılar
│   │   └── i18n/            # Çeviri dosyaları (TR/EN)
│   ├── docker-compose.yml
│   └── Dockerfile
│
└── Frontend/                # React SPA
    ├── src/
    │   ├── pages/           # 16 sayfa bileşeni
    │   ├── components/      # Ortak UI bileşenleri
    │   ├── context/         # React context sağlayıcıları
    │   ├── lib/             # Yardımcı fonksiyonlar
    │   ├── styles/          # Tema & CSS değişkenleri
    │   └── data/            # Statik veri dosyaları
    └── public/
```

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 16+
- Redis
- npm veya yarn

### Backend

```bash
cd Backend

# Bağımlılıkları yükle
npm install

# Environment dosyasını hazırla
cp .env.example .env
# .env dosyasını kendi değerlerinle düzenle

# Veritabanını oluştur (PostgreSQL)
createdb smartDiet

# Seed verileri yükle (roller, izinler, besin veritabanı)
npm run seed:run

# Development sunucusunu başlat
npm run start:dev
```

### Frontend

```bash
cd Frontend

# Bağımlılıkları yükle
npm install

# Environment dosyasını hazırla
cp .env.example .env
# Gerekirse VITE_API_URL değerini düzenle

# Development sunucusunu başlat
npm run dev
```

---

## 🔐 Environment Değişkenleri

Backend `.env` dosyası için gerekli yapılandırma:

| Değişken | Açıklama | Varsayılan |
|:---|:---|:---|
| `NODE_ENV` | Çalışma ortamı | `development` |
| `PORT` | Sunucu portu | `3000` |
| `API_PREFIX` | API yol ön eki | `api` |
| `FRONTEND_URL` | Frontend adresi (CORS) | `http://localhost:5173` |
| `JWT_SECRET` | JWT imza anahtarı | — |
| `JWT_REFRESH_SECRET` | Refresh token anahtarı | — |
| `DB_HOST` | PostgreSQL sunucu adresi | `localhost` |
| `DB_PORT` | PostgreSQL portu | `5432` |
| `DB_USERNAME` | Veritabanı kullanıcısı | `postgres` |
| `DB_PASSWORD` | Veritabanı şifresi | — |
| `DB_DATABASE` | Veritabanı adı | `smartDiet` |
| `REDIS_HOST` | Redis sunucu adresi | `localhost` |
| `MAIL_HOST` | SMTP sunucusu | `smtp.resend.com` |
| `MAIL_PASSWORD` | SMTP şifresi / API key | — |
| `ANTHROPIC_API_KEY` | Claude API anahtarı | — |
| `GEMINI_API_KEY` | Gemini API anahtarı | — |

---

## 🐳 Docker ile Çalıştırma

```bash
cd Backend

# Tüm servisleri başlat (API + PostgreSQL + Redis + Adminer)
docker-compose up -d

# Logları takip et
docker-compose logs -f app

# Servisleri durdur
docker-compose down
```

| Servis | Port | Açıklama |
|:---|:---|:---|
| API | `3000` | NestJS backend |
| PostgreSQL | `5432` | Veritabanı |
| Redis | `6379` | Cache & session |
| Adminer | `8080` | DB yönetim arayüzü |

---

## 📖 API Dokümantasyonu

Development ortamında Swagger UI otomatik olarak aktiftir:

```
http://localhost:3000/api/docs
```

> **Not**: Production ortamında Swagger otomatik olarak devre dışı bırakılır.

---

## 👥 Kullanıcı Rolleri

| Rol | Açıklama |
|:---|:---|
| `admin` | Tam sistem yönetimi |
| `clinic_manager` | Klinik operasyonları |
| `diyetisyen` | Danışan ve plan yönetimi |
| `client` | Kişisel sağlık takibi |

---

## 📄 Lisans

Bu proje özel lisans altındadır. Tüm hakları saklıdır.
