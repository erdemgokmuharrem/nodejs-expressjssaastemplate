
---

## ⚙️ `rules.md`

```markdown
# 🧩 Node.js + Express SaaS Boilerplate Kuralları

## Genel Prensipler
1. Kod **temiz, modüler ve açıklamalı** olmalı.
2. Her modül kendi dosyasında: controller, route, model ayrı olacak.
3. JWT auth ve Stripe entegrasyonu **tam çalışır** şekilde sunulmalı.
4. Auth middleware tüm korunan endpointlerde zorunlu.
5. `.env.example` tüm gerekli environment değişkenlerini içermeli.
6. Agent hiçbir görevi yarım bırakmadan tamamlamalı.
7. Kullanıcı setup sırasında tek bir komutla projeyi çalıştırabilmeli (`npm run dev`).

---

## Teknik Kurallar
- Kod dili: **TypeScript**
- Framework: **Express.js**
- ORM: **Prisma**
- DB: **PostgreSQL**
- Auth: **JWT (access + refresh token)**
- Payments: **Stripe (Subscriptions)**
- Test: `Jest`
- Linter: `ESLint + Prettier`
- Docs: `Swagger`

---

## Auth Akışı
- `/auth/register`
- `/auth/login`
- `/auth/refresh`
- `/auth/forgot-password`
- `/auth/reset-password/:token`

---

## Subscription Akışı
- `/subscriptions/create`
- `/subscriptions/webhook`
- `/subscriptions/status`

---

## Deployment Kuralları
- `npm run build` → dist klasörü oluşturmalı
- `.env` değişkenleri eksiksiz test edilmeli
- Stripe webhook URL: `/stripe/webhook`
- Prisma migration sonrası otomatik seeding yapılmalı

---

## Teslim Kontrol Listesi
- [ ] Auth flow test edildi
- [ ] Stripe flow test edildi
- [ ] CRUD çalışıyor
- [ ] Swagger aktif
- [ ] README hazır
- [ ] Deploy test edildi
