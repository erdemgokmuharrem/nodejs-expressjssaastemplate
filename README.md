# 🚀 Node.js + Express SaaS Boilerplate

**JWT + Stripe** ile tam entegre SaaS backend boilerplate'i.

## ✨ Özellikler

### 🔐 Authentication
- Email & Password kayıt/giriş
- JWT Access + Refresh Token
- Şifre sıfırlama (email ile)
- Role-based access control (Admin, User)
- Auth middleware (korunan route'lar)

### 💳 Subscription Management
- Stripe entegrasyonu
- Free + Pro plan desteği
- Webhook desteği (`/stripe/webhook`)
- Abonelik durumu takibi

### 👥 User Management
- Kullanıcı CRUD (admin only)
- Profil güncelleme
- Şifre değiştirme
- Hesap silme

### 📊 CRUD Demo
- Proje yönetimi
- Kullanıcı bazlı projeler
- Admin paneli

### 📚 Documentation
- Swagger UI (`/api-docs`)
- Postman collection
- API endpoint'leri

## 🛠️ Teknoloji Stack

- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT (Access + Refresh Token)
- **Payments:** Stripe Subscriptions
- **Email:** Nodemailer
- **Docs:** Swagger UI
- **Deployment:** Render / Railway / Fly.io

## 🚀 Hızlı Başlangıç

### 1. Projeyi Klonlayın
```bash
git clone <repo-url>
cd node-saas-boilerplate
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Environment Variables
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/saas_boilerplate?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."

# Email
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
```

### 4. Veritabanını Kurun
```bash
# Prisma client'ı generate edin
npm run db:generate

# Migration'ları çalıştırın
npm run db:migrate
```

### 5. Uygulamayı Başlatın
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 📖 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/refresh` - Token yenileme
- `POST /api/auth/forgot-password` - Şifre sıfırlama talebi
- `POST /api/auth/reset-password/:token` - Şifre sıfırlama
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/me` - Mevcut kullanıcı bilgileri

### Users
- `GET /api/users` - Tüm kullanıcılar (Admin)
- `GET /api/users/:id` - Kullanıcı detayı
- `PUT /api/users/profile` - Profil güncelleme
- `PUT /api/users/change-password` - Şifre değiştirme
- `PUT /api/users/:id` - Kullanıcı güncelleme (Admin)
- `DELETE /api/users/:id` - Kullanıcı silme (Admin)
- `DELETE /api/users/account` - Hesap silme

### Projects
- `GET /api/projects` - Kullanıcının projeleri
- `POST /api/projects` - Proje oluşturma
- `GET /api/projects/:id` - Proje detayı
- `PUT /api/projects/:id` - Proje güncelleme
- `DELETE /api/projects/:id` - Proje silme
- `GET /api/projects/admin/all` - Tüm projeler (Admin)

### Subscriptions
- `POST /api/subscriptions/create` - Stripe checkout session
- `GET /api/subscriptions/status` - Abonelik durumu
- `POST /api/subscriptions/cancel` - Abonelik iptal
- `POST /stripe/webhook` - Stripe webhook

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Development server
npm run build        # TypeScript build
npm start            # Production server
npm run lint         # ESLint check
npm run lint:fix     # ESLint fix
npm run format       # Prettier format
npm run db:generate  # Prisma generate
npm run db:migrate   # Database migration
npm run db:deploy    # Production migration
```

### Database Commands
```bash
# Migration oluştur
npx prisma migrate dev --name init

# Database reset
npx prisma migrate reset

# Prisma Studio (Database GUI)
npx prisma studio
```

## 🚀 Deployment

### Render
1. GitHub repository'yi bağlayın
2. Environment variables'ları ekleyin
3. Build command: `npm run build`
4. Start command: `npm start`

### Railway
1. Railway'a bağlayın
2. PostgreSQL database ekleyin
3. Environment variables'ları ayarlayın
4. Otomatik deploy

### Fly.io
```bash
# Fly.io CLI kurun
npm install -g @fly/flyctl

# Login
fly auth login

# Deploy
fly deploy
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | JWT access token secret | ✅ |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ✅ |
| `SMTP_HOST` | Email SMTP host | ✅ |
| `SMTP_USER` | Email SMTP user | ✅ |
| `SMTP_PASS` | Email SMTP password | ✅ |

## 📚 API Documentation

Swagger UI: `http://localhost:3000/api-docs`

Postman Collection: `docs/postman_collection.json`

## 🧪 Testing

```bash
# Test çalıştır
npm test

# Coverage raporu
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

- 📧 Email: support@example.com
- 📖 Documentation: `/api-docs`
- 🐛 Issues: GitHub Issues

---

**Made with ❤️ for SaaS startups**
