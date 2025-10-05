# Node.js + Express SaaS Boilerplate (JWT + Stripe)

## 🧠 Amaç
Bu proje, SaaS girişimleri için **tam entegre bir backend boilerplate** sağlar.  
Kullanıcı; kimlik doğrulama, abonelik sistemi, kullanıcı yönetimi ve Stripe ödeme entegrasyonuyla **direk kullanıma hazır bir altyapı** elde eder.

---

## 🚀 Teknoloji Stack
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Prisma ORM)
- **Auth:** JWT (Access + Refresh)
- **Payments:** Stripe Subscriptions (Free + Pro plan)
- **Email:** Nodemailer (Password reset)
- **Docs:** Swagger UI
- **Deployment:** Render / Railway / Fly.io (tercihe göre)

---

## 📁 Klasör Yapısı
root/
│── src/
│ ├── config/
│ │ ├── db.ts
│ │ ├── stripe.ts
│ ├── controllers/
│ │ ├── auth.controller.ts
│ │ ├── user.controller.ts
│ │ ├── subscription.controller.ts
│ ├── middlewares/
│ │ ├── auth.middleware.ts
│ ├── models/
│ │ ├── user.model.ts
│ │ ├── subscription.model.ts
│ ├── routes/
│ │ ├── auth.routes.ts
│ │ ├── user.routes.ts
│ │ ├── subscription.routes.ts
│ ├── utils/
│ │ ├── jwt.ts
│ │ ├── email.ts
│ └── app.ts
│── prisma/
│ ├── schema.prisma
│── .env.example
│── package.json
│── README.md


---

## 🔐 Özellikler

### Authentication
- Email & Password register/login
- JWT access + refresh token
- “Forgot password” & “Reset password” flow
- Role-based access control (admin, user)
- Auth middleware (protected routes)

### Subscription
- Stripe entegrasyonu
- Free + Pro plan desteği
- Webhook desteği (`/stripe/webhook`)
- Kullanıcıya özel dashboard endpointleri

### User Management
- Kullanıcı CRUD (admin only)
- Profil bilgisi güncelleme
- Hesap silme

### Docs
- Swagger UI (`/api-docs`)
- Postman collection otomatik export

---

## 🧩 Entegrasyonlar
- Stripe test key ile çalışır.
- Nodemailer test SMTP (Ethereal)
- Prisma migration otomatik
- JWT secret `.env`’den alınır.

---

## ⚙️ Setup
```bash
git clone <repo-url>
cd node-saas-boilerplate
npm install
cp .env.example .env
# .env dosyasına kendi bilgilerini gir
npx prisma migrate dev
npm run dev

Deploy

Render, Railway veya Fly.io’da tek tıkla deploy

.env’de Stripe ve Database bilgilerini ayarla

Docs & Test

Swagger: /api-docs

Postman: docs/postman_collection.json

Hazırlanacak Çıktılar

Tam entegre çalışan backend

.env.example

Stripe test planları (free / pro)

Swagger docs

README.md (Setup + Deploy anlatımı)

Production-ready build (npm run build)