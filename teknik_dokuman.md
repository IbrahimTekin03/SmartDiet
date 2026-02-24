# NestJS Base Backend Teknik Dökümanı

## 1. Genel Bakış
Bu proje, **NestJS** kullanarak ölçeklenebilir ve modüler bir backend uygulaması geliştirmek için oluşturulmuştur. Aşağıdaki temel özellikleri içerir:
- **JWT Authentication**: Güvenli kimlik doğrulama sistemi
- **i18n (Uluslararasılaştırma)**: Çoklu dil desteği
- **Logging**: Loglama mekanizması
- **Docker**: Konteynerize edilebilir yapı
- **Redis**: Önbellekleme ve hızlı veri erişimi
- **Multi-database Desteği** (Standart: **MariaDB**, diğer veritabanlarına genişletilebilir)
- **WebSocket**: Gerçek zamanlı iletişim için WebSocket desteği
- **Rate Limiting**: API isteklerini sınırlamak için bir mekanizma
- **Swagger**: API dokümantasyonu için OpenAPI/Swagger entegrasyonu
- **Çoklu Cihaz Desteği**: Kullanıcılar birden fazla cihazda oturum açabilir, her cihaz için ayrı bir oturum yönetimi sağlanır.
- **Mail Entegrasyonu**: SMTP veya üçüncü taraf servislerle e-posta gönderme desteği
- **Migration & Seed Desteği**: Standart MariaDB için zorunlu, diğer veritabanları için opsiyonel.
- **Dinamik ACL (Role-Based Access Control) Sistemi**: Kullanıcı yetkilendirmelerini yönetmek için esnek rol ve izin yapısı.

## 2. Teknoloji ve Kütüphaneler
- **NestJS** (Framework)
- **TypeORM** (Veritabanı ORM’i)
- **JWT & Passport** (Kimlik doğrulama için)
- **i18n** (Uluslararasılaştırma için)
- **Winston** (Loglama için)
- **Redis** (Önbellekleme için)
- **WebSocket Gateway** (Gerçek zamanlı iletişim için)
- **Swagger** (API dokümantasyonu için)
- **Docker & Docker Compose** (Konteynerizasyon için)
- **Nodemailer** (E-posta gönderimi için)

---
## 3. Kurulum
### 3.1. Gerekli Bağımlılıkların Yüklenmesi
### 3.2. Çevresel Değişkenler (.env)
### 3.3. Docker ile Çalıştırma

---
## 4. Modüler
### 4.1. **Kimlik Doğrulama (Auth) Modülü**
- **JWT tabanlı kullanıcı doğrulama**
- **Refresh token desteği**
- **Kullanıcı kayıt ve giriş işlemleri**
- **Çoklu cihaz desteği**: Kullanıcılar farklı cihazlardan giriş yapabilir, her oturum için ayrı token yönetimi yapılır.

### 4.2. **Uluslararasılaştırma (i18n) Modülü**
- `nestjs-i18n` paketi kullanılarak çoklu dil desteği
- Dil dosyaları `src/i18n` klasöründe JSON formatında saklanır

### 4.3. **Logging Modülü**
- `winston` tabanlı loglama
- Hata logları ve istek logları tutulur

### 4.4. **Veritabanı Modülü**
- **TypeORM** kullanarak veri yönetimi
- **MariaDB** varsayılan olmak üzere **PostgreSQL, MySQL** gibi alternatifler desteklenir
- **Multi-database desteği** sağlanır
- **Migration & Seed Desteği**: Varsayılan olarak MariaDB için zorunludur, diğer veritabanları için opsiyonel olacak şekilde yapılandırılmıştır.

### 4.5. **Redis Modülü**
- `cache-manager-redis-store` kullanılarak hızlı veri önbellekleme
- Kullanıcı session bilgilerini Redis üzerinde tutma

### 4.6. **WebSocket Modülü**
- `@nestjs/websockets` kullanılarak gerçek zamanlı veri akışı sağlanır
- Kullanıcı bağlantıları yönetilir

### 4.7. **Rate Limiting**
- `nestjs-throttler` paketi ile API istekleri sınırlandırılır

### 4.8. **Mail Entegrasyonu**
- `nodemailer` paketi ile SMTP veya üçüncü taraf servisler üzerinden e-posta gönderimi sağlanır.
- Kullanıcı kayıt, parola sıfırlama gibi işlemler için mail desteği sunulur.

### 4.9. **ACL (Role-Based Access Control) Sistemi**
- Kullanıcı rolleri ve yetkilendirme sistemi
- Dinamik rol tabanlı erişim yönetimi
- Kullanıcıların belirli işlemleri yapmasını sınırlayan yetkilendirme mekanizması

### 4.10. **Swagger API Dokümantasyonu**
- `@nestjs/swagger` kullanılarak API dökümantasyonu sağlanır

---
## 5. Sonuç
Bu döküman, NestJS kullanarak ölçeklenebilir bir backend uygulamasını başlatmak için gereken tüm temel bileşenleri içermektedir. Bu yapıyı genişleterek projeye ek özellikler eklenebilir.

