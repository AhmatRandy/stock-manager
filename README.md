# 🏪 Stock Manager

Aplikasi Point of Sale (POS) dan manajemen stok modern dengan multi-tenant support, dibangun dengan Next.js 15, Prisma, dan PostgreSQL.

## ✨ Features

- 🏢 **Multi-Tenant**: Support untuk multiple stores
- 👤 **Role-Based Access**: Owner, Manager, Cashier
- 📦 **Product Management**: Kategori, variants, dan stock tracking
- 💰 **Point of Sale**: Interface kasir yang cepat dan intuitif
- 📊 **Transaction History**: Laporan transaksi lengkap
- 🔐 **Authentication**: JWT-based auth dengan bcrypt
- 📱 **Responsive Design**: Mobile-first dengan Tailwind CSS
- 🎨 **Modern UI**: Shadcn/ui components

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (via Prisma ORM)
- **Auth**: JWT + bcryptjs
- **UI**: Tailwind CSS + Shadcn/ui + Radix UI
- **Language**: TypeScript
- **Package Manager**: pnpm

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (atau npm/yarn)
- PostgreSQL database (Vercel Postgres, Neon, Supabase, atau local)

### Installation

1. **Clone repository**:

   ```bash
   git clone <repository-url>
   cd stock-manager
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Setup environment variables**:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` dan isi `DATABASE_URL` dan `JWT_SECRET`.

4. **Setup database**:

   ```bash
   # Generate Prisma Client
   pnpm run db:generate

   # Run migrations
   pnpm prisma migrate dev

   # (Optional) Seed database
   pnpm run db:seed
   ```

5. **Run development server**:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 📦 Database Setup

Proyek ini menggunakan **PostgreSQL** untuk production-ready deployment.

### Local Development (PostgreSQL)

```bash
# Install PostgreSQL di Mac
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb stock_manager

# Set DATABASE_URL di .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stock_manager"
```

### Production (Cloud)

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan lengkap setup:

- ✅ Vercel Postgres (Recommended)
- ✅ Neon (Serverless)
- ✅ Supabase
- ✅ Railway

## 🧪 Database Management

```bash
# Generate Prisma Client
pnpm run db:generate

# Push schema changes (dev only)
pnpm run db:push

# Create migration
pnpm prisma migrate dev --name <migration_name>

# Apply migrations (production)
pnpm prisma migrate deploy

# Seed database
pnpm run db:seed

# Open Prisma Studio (GUI)
pnpm run db:studio
```

## 📁 Project Structure

```
stock-manager/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # Auth routes (login, logout)
│   │   ├── dashboard/    # Dashboard routes
│   │   │   ├── products/
│   │   │   ├── category/
│   │   │   ├── pos/
│   │   │   ├── transactions/
│   │   │   └── users/
│   │   └── layout.tsx
│   ├── components/       # React components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # Shadcn/ui components
│   ├── actions/          # Server actions
│   ├── lib/              # Utilities
│   │   ├── prisma.ts     # Prisma client
│   │   ├── auth.ts       # Auth helpers
│   │   └── utils.ts
│   └── types/            # TypeScript types
├── prisma/
│   ├── client/
│   │   └── schema.prisma # Database schema
│   ├── migrations/       # Migration files
│   └── seed.ts           # Seed data
├── public/               # Static files
└── package.json
```

## 🔐 Authentication

JWT-based authentication dengan role-based access control:

- **OWNER**: Full access ke semua features
- **MANAGER**: Manage products, categories, view reports
- **CASHIER**: POS only

## 🌐 Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Setup PostgreSQL database (Vercel Postgres/Neon/Supabase)
4. Add environment variables
5. Deploy!

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan lengkap.

## 📝 Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
JWT_SECRET="your-secret-key-here"

# App
NODE_ENV="development"
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🙋 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.

---

**Built with ❤️ using Next.js & Prisma**

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
