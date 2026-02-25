import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "./client";
import * as bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// ─── Helper: tanggal relatif terhadap hari ini ────────────────────────────────
// daysAgo=0 → hari ini, daysAgo=6 → 6 hari lalu
function d(daysAgo: number, hour = 10): Date {
  const date = new Date("2026-02-24T00:00:00");
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date;
}

// ─── IDs ─────────────────────────────────────────────────────────────────────
// STORE 1 — Toko Serba Ada (ml, gram, pcs)
const STORE1_ID = "store-0001-0000-0000-000000000001";
const OWNER1_ID = "user-0001-0000-0000-000000000001";
const CASHIER1_ID = "user-0002-0000-0000-000000000002";

const PROD_PARFUM_ID = "prod-001-0000-0000-000000000001";
const PROD_KOPI_ID = "prod-002-0000-0000-000000000002";
const PROD_NASI_ID = "prod-003-0000-0000-000000000003";

const VAR_PARFUM_10ML = "var-001a-000-0000-000000000001";
const VAR_PARFUM_50ML = "var-001b-000-0000-000000000002";
const VAR_PARFUM_100ML = "var-001c-000-0000-000000000003";
const VAR_KOPI_100G = "var-002a-000-0000-000000000004";
const VAR_KOPI_250G = "var-002b-000-0000-000000000005";
const VAR_NASI_1PCS = "var-003a-000-0000-000000000006";
const VAR_NASI_5PCS = "var-003b-000-0000-000000000007";

// STORE 2 — Butik Moda Jakarta (size: S / M / L / XL)
const STORE2_ID = "store-0002-0000-0000-000000000002";
const OWNER2_ID = "user-0003-0000-0000-000000000003";
const CASHIER2_ID = "user-0004-0000-0000-000000000004";

const PROD_KAOS_ID = "prod-s1-000-0000-000000000001";
const PROD_CELANA_ID = "prod-s2-000-0000-000000000002";
const PROD_JAKET_ID = "prod-s3-000-0000-000000000003";

const VAR_KAOS_S = "var-s1a-000-0000-000000000001";
const VAR_KAOS_M = "var-s1b-000-0000-000000000002";
const VAR_KAOS_L = "var-s1c-000-0000-000000000003";
const VAR_KAOS_XL = "var-s1d-000-0000-000000000004";
const VAR_CELANA_M = "var-s2a-000-0000-000000000005";
const VAR_CELANA_L = "var-s2b-000-0000-000000000006";
const VAR_CELANA_XL = "var-s2c-000-0000-000000000007";
const VAR_JAKET_M = "var-s3a-000-0000-000000000008";
const VAR_JAKET_L = "var-s3b-000-0000-000000000009";
const VAR_JAKET_XL = "var-s3c-000-0000-000000000010";

// STORE 3 — Minimarket Segar (pcs)
const STORE3_ID = "store-0003-0000-0000-000000000003";
const OWNER3_ID = "user-0005-0000-0000-000000000005";
const CASHIER3_ID = "user-0006-0000-0000-000000000006";

const PROD_AIR_ID = "prod-m1-000-0000-000000000001";
const PROD_SNACK_ID = "prod-m2-000-0000-000000000002";
const PROD_INSTAN_ID = "prod-m3-000-0000-000000000003";

const VAR_AIR_1PCS = "var-m1a-000-0000-000000000001";
const VAR_AIR_6PCS = "var-m1b-000-0000-000000000002";
const VAR_AIR_12PCS = "var-m1c-000-0000-000000000003";
const VAR_SNACK_1PCS = "var-m2a-000-0000-000000000004";
const VAR_SNACK_5PCS = "var-m2b-000-0000-000000000005";
const VAR_INSTAN_1PCS = "var-m3a-000-0000-000000000006";
const VAR_INSTAN_5PCS = "var-m3b-000-0000-000000000007";

async function main() {
  console.log("🌱 Seeding database...");

  // ═══════════════════════════════════════════════════════════════════════════
  // STORE 1 — Toko Serba Ada (ml / gram / pcs)
  // ═══════════════════════════════════════════════════════════════════════════
  const store1 = await prisma.store.upsert({
    where: { id: STORE1_ID },
    update: {},
    create: {
      id: STORE1_ID,
      name: "Toko Serba Ada",
      address: "Jl. Merdeka No. 1, Jakarta",
      phone: "021-1234567",
    },
  });
  console.log(`✅ Store 1: ${store1.name}`);

  const [owner1, cashier1] = await Promise.all([
    prisma.user.upsert({
      where: { email: "owner@toko.com" },
      update: {},
      create: {
        id: OWNER1_ID,
        email: "owner@toko.com",
        password: await bcrypt.hash("owner123", 10),
        name: "Budi Santoso",
        role: "OWNER",
        storeId: STORE1_ID,
      },
    }),
    prisma.user.upsert({
      where: { email: "cashier@toko.com" },
      update: {},
      create: {
        id: CASHIER1_ID,
        email: "cashier@toko.com",
        password: await bcrypt.hash("cashier123", 10),
        name: "Siti Rahayu",
        role: "CASHIER",
        storeId: STORE1_ID,
      },
    }),
  ]);
  console.log(`✅ Users Store 1: ${owner1.email}, ${cashier1.email}`);

  // Produk Store 1
  await prisma.product.upsert({
    where: { id: PROD_PARFUM_ID },
    update: {},
    create: {
      id: PROD_PARFUM_ID,
      name: "Parfum Rose",
      storeId: STORE1_ID,
      variants: {
        create: [
          { id: VAR_PARFUM_10ML, name: "10 ml", price: 25000, stock: 50 },
          { id: VAR_PARFUM_50ML, name: "50 ml", price: 95000, stock: 30 },
          { id: VAR_PARFUM_100ML, name: "100 ml", price: 175000, stock: 3 },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { id: PROD_KOPI_ID },
    update: {},
    create: {
      id: PROD_KOPI_ID,
      name: "Kopi Bubuk",
      storeId: STORE1_ID,
      variants: {
        create: [
          { id: VAR_KOPI_100G, name: "100 gram", price: 15000, stock: 100 },
          { id: VAR_KOPI_250G, name: "250 gram", price: 35000, stock: 60 },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { id: PROD_NASI_ID },
    update: {},
    create: {
      id: PROD_NASI_ID,
      name: "Nasi Kotak",
      storeId: STORE1_ID,
      variants: {
        create: [
          { id: VAR_NASI_1PCS, name: "1 pcs", price: 15000, stock: 80 },
          { id: VAR_NASI_5PCS, name: "5 pcs", price: 70000, stock: 4 },
        ],
      },
    },
  });
  console.log("✅ Products Store 1: Parfum Rose, Kopi Bubuk, Nasi Kotak");

  // Transaksi Store 1 — 7 hari terakhir (~2 trx/hari)
  const s1Transactions = [
    // Hari 6 lalu (Feb 18)
    {
      invoiceNo: "INV-S1-2026-001",
      createdAt: d(6, 9),
      total: 110000,
      discount: 0,
      grandTotal: 110000,
      payment: 120000,
      change: 10000,
      items: [
        {
          variantId: VAR_NASI_5PCS,
          productName: "Nasi Kotak",
          variantName: "5 pcs",
          price: 70000,
          qty: 1,
          sub: 70000,
        },
        {
          variantId: VAR_KOPI_100G,
          productName: "Kopi Bubuk",
          variantName: "100 gram",
          price: 15000,
          qty: 2,
          sub: 30000,
        },
        {
          variantId: VAR_PARFUM_10ML,
          productName: "Parfum Rose",
          variantName: "10 ml",
          price: 25000,
          qty: 1,
          sub: 25000,
        },
      ],
    },
    {
      invoiceNo: "INV-S1-2026-002",
      createdAt: d(6, 14),
      total: 95000,
      discount: 0,
      grandTotal: 95000,
      payment: 100000,
      change: 5000,
      items: [
        {
          variantId: VAR_PARFUM_50ML,
          productName: "Parfum Rose",
          variantName: "50 ml",
          price: 95000,
          qty: 1,
          sub: 95000,
        },
      ],
    },
    // Hari 5 lalu (Feb 19)
    {
      invoiceNo: "INV-S1-2026-003",
      createdAt: d(5, 10),
      total: 200000,
      discount: 10000,
      grandTotal: 190000,
      payment: 200000,
      change: 10000,
      items: [
        {
          variantId: VAR_PARFUM_100ML,
          productName: "Parfum Rose",
          variantName: "100 ml",
          price: 175000,
          qty: 1,
          sub: 175000,
        },
        {
          variantId: VAR_KOPI_250G,
          productName: "Kopi Bubuk",
          variantName: "250 gram",
          price: 35000,
          qty: 1,
          sub: 35000,
        },
      ],
    },
    {
      invoiceNo: "INV-S1-2026-004",
      createdAt: d(5, 16),
      total: 45000,
      discount: 0,
      grandTotal: 45000,
      payment: 50000,
      change: 5000,
      items: [
        {
          variantId: VAR_NASI_1PCS,
          productName: "Nasi Kotak",
          variantName: "1 pcs",
          price: 15000,
          qty: 3,
          sub: 45000,
        },
      ],
    },
    // Hari 4 lalu (Feb 20)
    {
      invoiceNo: "INV-S1-2026-005",
      createdAt: d(4, 8),
      total: 155000,
      discount: 5000,
      grandTotal: 150000,
      payment: 150000,
      change: 0,
      items: [
        {
          variantId: VAR_PARFUM_50ML,
          productName: "Parfum Rose",
          variantName: "50 ml",
          price: 95000,
          qty: 1,
          sub: 95000,
        },
        {
          variantId: VAR_KOPI_100G,
          productName: "Kopi Bubuk",
          variantName: "100 gram",
          price: 15000,
          qty: 4,
          sub: 60000,
        },
      ],
    },
    {
      invoiceNo: "INV-S1-2026-006",
      createdAt: d(4, 17),
      total: 70000,
      discount: 0,
      grandTotal: 70000,
      payment: 70000,
      change: 0,
      items: [
        {
          variantId: VAR_NASI_5PCS,
          productName: "Nasi Kotak",
          variantName: "5 pcs",
          price: 70000,
          qty: 1,
          sub: 70000,
        },
      ],
    },
    // Hari 3 lalu (Feb 21)
    {
      invoiceNo: "INV-S1-2026-007",
      createdAt: d(3, 11),
      total: 300000,
      discount: 25000,
      grandTotal: 275000,
      payment: 300000,
      change: 25000,
      items: [
        {
          variantId: VAR_PARFUM_100ML,
          productName: "Parfum Rose",
          variantName: "100 ml",
          price: 175000,
          qty: 1,
          sub: 175000,
        },
        {
          variantId: VAR_PARFUM_10ML,
          productName: "Parfum Rose",
          variantName: "10 ml",
          price: 25000,
          qty: 2,
          sub: 50000,
        },
        {
          variantId: VAR_KOPI_250G,
          productName: "Kopi Bubuk",
          variantName: "250 gram",
          price: 35000,
          qty: 2,
          sub: 70000,
        },
      ],
    },
    {
      invoiceNo: "INV-S1-2026-008",
      createdAt: d(3, 15),
      total: 145000,
      discount: 0,
      grandTotal: 145000,
      payment: 150000,
      change: 5000,
      items: [
        {
          variantId: VAR_NASI_1PCS,
          productName: "Nasi Kotak",
          variantName: "1 pcs",
          price: 15000,
          qty: 5,
          sub: 75000,
        },
        {
          variantId: VAR_KOPI_100G,
          productName: "Kopi Bubuk",
          variantName: "100 gram",
          price: 15000,
          qty: 3,
          sub: 45000,
        },
        {
          variantId: VAR_PARFUM_10ML,
          productName: "Parfum Rose",
          variantName: "10 ml",
          price: 25000,
          qty: 1,
          sub: 25000,
        },
      ],
    },
    // Hari 2 lalu (Feb 22)
    {
      invoiceNo: "INV-S1-2026-009",
      createdAt: d(2, 9),
      total: 245000,
      discount: 20000,
      grandTotal: 225000,
      payment: 250000,
      change: 25000,
      items: [
        {
          variantId: VAR_PARFUM_50ML,
          productName: "Parfum Rose",
          variantName: "50 ml",
          price: 95000,
          qty: 2,
          sub: 190000,
        },
        {
          variantId: VAR_NASI_1PCS,
          productName: "Nasi Kotak",
          variantName: "1 pcs",
          price: 15000,
          qty: 2,
          sub: 30000,
        },
        {
          variantId: VAR_KOPI_100G,
          productName: "Kopi Bubuk",
          variantName: "100 gram",
          price: 15000,
          qty: 1,
          sub: 15000,
        },
      ],
    },
    {
      invoiceNo: "INV-S1-2026-010",
      createdAt: d(2, 18),
      total: 70000,
      discount: 0,
      grandTotal: 70000,
      payment: 70000,
      change: 0,
      items: [
        {
          variantId: VAR_KOPI_250G,
          productName: "Kopi Bubuk",
          variantName: "250 gram",
          price: 35000,
          qty: 2,
          sub: 70000,
        },
      ],
    },
    // Hari 1 lalu (Feb 23)
    {
      invoiceNo: "INV-S1-2026-011",
      createdAt: d(1, 10),
      total: 335000,
      discount: 35000,
      grandTotal: 300000,
      payment: 300000,
      change: 0,
      items: [
        {
          variantId: VAR_PARFUM_100ML,
          productName: "Parfum Rose",
          variantName: "100 ml",
          price: 175000,
          qty: 1,
          sub: 175000,
        },
        {
          variantId: VAR_PARFUM_50ML,
          productName: "Parfum Rose",
          variantName: "50 ml",
          price: 95000,
          qty: 1,
          sub: 95000,
        },
        {
          variantId: VAR_KOPI_100G,
          productName: "Kopi Bubuk",
          variantName: "100 gram",
          price: 15000,
          qty: 2,
          sub: 30000,
        },
        {
          variantId: VAR_NASI_1PCS,
          productName: "Nasi Kotak",
          variantName: "1 pcs",
          price: 15000,
          qty: 2,
          sub: 30000,
        },
      ],
    },
    {
      invoiceNo: "INV-S1-2026-012",
      createdAt: d(1, 16),
      total: 105000,
      discount: 0,
      grandTotal: 105000,
      payment: 110000,
      change: 5000,
      items: [
        {
          variantId: VAR_NASI_5PCS,
          productName: "Nasi Kotak",
          variantName: "5 pcs",
          price: 70000,
          qty: 1,
          sub: 70000,
        },
        {
          variantId: VAR_PARFUM_10ML,
          productName: "Parfum Rose",
          variantName: "10 ml",
          price: 25000,
          qty: 1,
          sub: 25000,
        },
        {
          variantId: VAR_KOPI_100G,
          productName: "Kopi Bubuk",
          variantName: "100 gram",
          price: 15000,
          qty: 1,
          sub: 15000,
        },
      ],
    },
    // Hari ini (Feb 24)
    {
      invoiceNo: "INV-S1-2026-013",
      createdAt: d(0, 9),
      total: 190000,
      discount: 0,
      grandTotal: 190000,
      payment: 200000,
      change: 10000,
      items: [
        {
          variantId: VAR_PARFUM_50ML,
          productName: "Parfum Rose",
          variantName: "50 ml",
          price: 95000,
          qty: 1,
          sub: 95000,
        },
        {
          variantId: VAR_KOPI_250G,
          productName: "Kopi Bubuk",
          variantName: "250 gram",
          price: 35000,
          qty: 2,
          sub: 70000,
        },
        {
          variantId: VAR_NASI_1PCS,
          productName: "Nasi Kotak",
          variantName: "1 pcs",
          price: 15000,
          qty: 1,
          sub: 15000,
        },
      ],
    },
    {
      invoiceNo: "INV-S1-2026-014",
      createdAt: d(0, 13),
      total: 250000,
      discount: 0,
      grandTotal: 250000,
      payment: 250000,
      change: 0,
      items: [
        {
          variantId: VAR_PARFUM_100ML,
          productName: "Parfum Rose",
          variantName: "100 ml",
          price: 175000,
          qty: 1,
          sub: 175000,
        },
        {
          variantId: VAR_PARFUM_10ML,
          productName: "Parfum Rose",
          variantName: "10 ml",
          price: 25000,
          qty: 3,
          sub: 75000,
        },
      ],
    },
  ];

  for (const t of s1Transactions) {
    const existing = await prisma.transaction.findUnique({
      where: { invoiceNo: t.invoiceNo },
    });
    if (!existing) {
      await prisma.transaction.create({
        data: {
          invoiceNo: t.invoiceNo,
          total: t.total,
          discount: t.discount,
          grandTotal: t.grandTotal,
          payment: t.payment,
          change: t.change,
          storeId: STORE1_ID,
          userId: CASHIER1_ID,
          createdAt: t.createdAt,
          items: {
            create: t.items.map((i) => ({
              variantId: i.variantId,
              productName: i.productName,
              variantName: i.variantName,
              price: i.price,
              quantity: i.qty,
              subtotal: i.sub,
            })),
          },
        },
      });
    }
  }
  console.log(
    `✅ Transactions Store 1: ${s1Transactions.length} transaksi (7 hari)`,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STORE 2 — Butik Moda Jakarta (size: S / M / L / XL)
  // ═══════════════════════════════════════════════════════════════════════════
  const store2 = await prisma.store.upsert({
    where: { id: STORE2_ID },
    update: {},
    create: {
      id: STORE2_ID,
      name: "Butik Moda Jakarta",
      address: "Jl. Sudirman No. 88, Jakarta Pusat",
      phone: "021-9876543",
    },
  });
  console.log(`✅ Store 2: ${store2.name}`);

  const [owner2, cashier2] = await Promise.all([
    prisma.user.upsert({
      where: { email: "owner@butik.com" },
      update: {},
      create: {
        id: OWNER2_ID,
        email: "owner@butik.com",
        password: await bcrypt.hash("owner123", 10),
        name: "Dewi Sartika",
        role: "OWNER",
        storeId: STORE2_ID,
      },
    }),
    prisma.user.upsert({
      where: { email: "cashier@butik.com" },
      update: {},
      create: {
        id: CASHIER2_ID,
        email: "cashier@butik.com",
        password: await bcrypt.hash("cashier123", 10),
        name: "Rina Wahyuni",
        role: "CASHIER",
        storeId: STORE2_ID,
      },
    }),
  ]);
  console.log(`✅ Users Store 2: ${owner2.email}, ${cashier2.email}`);

  await prisma.product.upsert({
    where: { id: PROD_KAOS_ID },
    update: {},
    create: {
      id: PROD_KAOS_ID,
      name: "Kaos Polos",
      storeId: STORE2_ID,
      variants: {
        create: [
          { id: VAR_KAOS_S, name: "Size S", price: 75000, stock: 40 },
          { id: VAR_KAOS_M, name: "Size M", price: 75000, stock: 60 },
          { id: VAR_KAOS_L, name: "Size L", price: 80000, stock: 45 },
          { id: VAR_KAOS_XL, name: "Size XL", price: 85000, stock: 3 },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { id: PROD_CELANA_ID },
    update: {},
    create: {
      id: PROD_CELANA_ID,
      name: "Celana Chino",
      storeId: STORE2_ID,
      variants: {
        create: [
          { id: VAR_CELANA_M, name: "Size M", price: 150000, stock: 30 },
          { id: VAR_CELANA_L, name: "Size L", price: 155000, stock: 25 },
          { id: VAR_CELANA_XL, name: "Size XL", price: 160000, stock: 4 },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { id: PROD_JAKET_ID },
    update: {},
    create: {
      id: PROD_JAKET_ID,
      name: "Jaket Hoodie",
      storeId: STORE2_ID,
      variants: {
        create: [
          { id: VAR_JAKET_M, name: "Size M", price: 250000, stock: 20 },
          { id: VAR_JAKET_L, name: "Size L", price: 255000, stock: 15 },
          { id: VAR_JAKET_XL, name: "Size XL", price: 265000, stock: 2 },
        ],
      },
    },
  });
  console.log("✅ Products Store 2: Kaos Polos, Celana Chino, Jaket Hoodie");

  const s2Transactions = [
    {
      invoiceNo: "INV-S2-2026-001",
      createdAt: d(6, 10),
      total: 225000,
      discount: 0,
      grandTotal: 225000,
      payment: 250000,
      change: 25000,
      items: [
        {
          variantId: VAR_KAOS_M,
          productName: "Kaos Polos",
          variantName: "Size M",
          price: 75000,
          qty: 2,
          sub: 150000,
        },
        {
          variantId: VAR_CELANA_M,
          productName: "Celana Chino",
          variantName: "Size M",
          price: 150000,
          qty: 1,
          sub: 150000,
        },
      ],
    },
    {
      invoiceNo: "INV-S2-2026-002",
      createdAt: d(6, 15),
      total: 265000,
      discount: 15000,
      grandTotal: 250000,
      payment: 250000,
      change: 0,
      items: [
        {
          variantId: VAR_JAKET_XL,
          productName: "Jaket Hoodie",
          variantName: "Size XL",
          price: 265000,
          qty: 1,
          sub: 265000,
        },
      ],
    },
    {
      invoiceNo: "INV-S2-2026-003",
      createdAt: d(5, 9),
      total: 330000,
      discount: 30000,
      grandTotal: 300000,
      payment: 300000,
      change: 0,
      items: [
        {
          variantId: VAR_JAKET_M,
          productName: "Jaket Hoodie",
          variantName: "Size M",
          price: 250000,
          qty: 1,
          sub: 250000,
        },
        {
          variantId: VAR_KAOS_S,
          productName: "Kaos Polos",
          variantName: "Size S",
          price: 75000,
          qty: 1,
          sub: 75000,
        },
      ],
    },
    {
      invoiceNo: "INV-S2-2026-004",
      createdAt: d(5, 14),
      total: 160000,
      discount: 0,
      grandTotal: 160000,
      payment: 200000,
      change: 40000,
      items: [
        {
          variantId: VAR_CELANA_L,
          productName: "Celana Chino",
          variantName: "Size L",
          price: 155000,
          qty: 1,
          sub: 155000,
        },
      ],
    },
    {
      invoiceNo: "INV-S2-2026-005",
      createdAt: d(4, 10),
      total: 500000,
      discount: 50000,
      grandTotal: 450000,
      payment: 500000,
      change: 50000,
      items: [
        {
          variantId: VAR_JAKET_L,
          productName: "Jaket Hoodie",
          variantName: "Size L",
          price: 255000,
          qty: 1,
          sub: 255000,
        },
        {
          variantId: VAR_CELANA_M,
          productName: "Celana Chino",
          variantName: "Size M",
          price: 150000,
          qty: 1,
          sub: 150000,
        },
        {
          variantId: VAR_KAOS_L,
          productName: "Kaos Polos",
          variantName: "Size L",
          price: 80000,
          qty: 1,
          sub: 80000,
        },
      ],
    },
    {
      invoiceNo: "INV-S2-2026-006",
      createdAt: d(4, 17),
      total: 155000,
      discount: 5000,
      grandTotal: 150000,
      payment: 150000,
      change: 0,
      items: [
        {
          variantId: VAR_KAOS_XL,
          productName: "Kaos Polos",
          variantName: "Size XL",
          price: 85000,
          qty: 1,
          sub: 85000,
        },
        {
          variantId: VAR_KAOS_S,
          productName: "Kaos Polos",
          variantName: "Size S",
          price: 75000,
          qty: 1,
          sub: 75000,
        },
      ],
    },
    {
      invoiceNo: "INV-S2-2026-007",
      createdAt: d(3, 11),
      total: 405000,
      discount: 5000,
      grandTotal: 400000,
      payment: 400000,
      change: 0,
      items: [
        {
          variantId: VAR_JAKET_M,
          productName: "Jaket Hoodie",
          variantName: "Size M",
          price: 250000,
          qty: 1,
          sub: 250000,
        },
        {
          variantId: VAR_CELANA_XL,
          productName: "Celana Chino",
          variantName: "Size XL",
          price: 160000,
          qty: 1,
          sub: 160000,
        },
      ],
    },
    {
      invoiceNo: "INV-S2-2026-008",
      createdAt: d(3, 16),
      total: 150000,
      discount: 0,
      grandTotal: 150000,
      payment: 150000,
      change: 0,
      items: [
        {
          variantId: VAR_KAOS_M,
          productName: "Kaos Polos",
          variantName: "Size M",
          price: 75000,
          qty: 2,
          sub: 150000,
        },
      ],
    },
    {
      invoiceNo: "INV-S2-2026-009",
      createdAt: d(2, 9),
      total: 310000,
      discount: 10000,
      grandTotal: 300000,
      payment: 300000,
      change: 0,
      items: [
        {
          variantId: VAR_JAKET_L,
          productName: "Jaket Hoodie",
          variantName: "Size L",
          price: 255000,
          qty: 1,
          sub: 255000,
        },
        {
          variantId: VAR_KAOS_L,
          productName: "Kaos Polos",
          variantName: "Size L",
          price: 80000,
          qty: 1,
          sub: 80000,
        },
      ],
    },
    {
      invoiceNo: "INV-S2-2026-010",
      createdAt: d(2, 15),
      total: 225000,
      discount: 25000,
      grandTotal: 200000,
      payment: 200000,
      change: 0,
      items: [
        {
          variantId: VAR_CELANA_M,
          productName: "Celana Chino",
          variantName: "Size M",
          price: 150000,
          qty: 1,
          sub: 150000,
        },
        {
          variantId: VAR_KAOS_S,
          productName: "Kaos Polos",
          variantName: "Size S",
          price: 75000,
          qty: 1,
          sub: 75000,
        },
      ],
    },
    {
      invoiceNo: "INV-S2-2026-011",
      createdAt: d(1, 10),
      total: 520000,
      discount: 20000,
      grandTotal: 500000,
      payment: 500000,
      change: 0,
      items: [
        {
          variantId: VAR_JAKET_M,
          productName: "Jaket Hoodie",
          variantName: "Size M",
          price: 250000,
          qty: 1,
          sub: 250000,
        },
        {
          variantId: VAR_CELANA_L,
          productName: "Celana Chino",
          variantName: "Size L",
          price: 155000,
          qty: 1,
          sub: 155000,
        },
        {
          variantId: VAR_KAOS_M,
          productName: "Kaos Polos",
          variantName: "Size M",
          price: 75000,
          qty: 1,
          sub: 75000,
        },
      ],
    },
    {
      invoiceNo: "INV-S2-2026-012",
      createdAt: d(1, 16),
      total: 265000,
      discount: 15000,
      grandTotal: 250000,
      payment: 250000,
      change: 0,
      items: [
        {
          variantId: VAR_JAKET_XL,
          productName: "Jaket Hoodie",
          variantName: "Size XL",
          price: 265000,
          qty: 1,
          sub: 265000,
        },
      ],
    },
    {
      invoiceNo: "INV-S2-2026-013",
      createdAt: d(0, 10),
      total: 415000,
      discount: 15000,
      grandTotal: 400000,
      payment: 400000,
      change: 0,
      items: [
        {
          variantId: VAR_JAKET_L,
          productName: "Jaket Hoodie",
          variantName: "Size L",
          price: 255000,
          qty: 1,
          sub: 255000,
        },
        {
          variantId: VAR_CELANA_XL,
          productName: "Celana Chino",
          variantName: "Size XL",
          price: 160000,
          qty: 1,
          sub: 160000,
        },
      ],
    },
    {
      invoiceNo: "INV-S2-2026-014",
      createdAt: d(0, 14),
      total: 230000,
      discount: 5000,
      grandTotal: 225000,
      payment: 250000,
      change: 25000,
      items: [
        {
          variantId: VAR_KAOS_L,
          productName: "Kaos Polos",
          variantName: "Size L",
          price: 80000,
          qty: 1,
          sub: 80000,
        },
        {
          variantId: VAR_CELANA_M,
          productName: "Celana Chino",
          variantName: "Size M",
          price: 150000,
          qty: 1,
          sub: 150000,
        },
      ],
    },
  ];

  for (const t of s2Transactions) {
    const existing = await prisma.transaction.findUnique({
      where: { invoiceNo: t.invoiceNo },
    });
    if (!existing) {
      await prisma.transaction.create({
        data: {
          invoiceNo: t.invoiceNo,
          total: t.total,
          discount: t.discount,
          grandTotal: t.grandTotal,
          payment: t.payment,
          change: t.change,
          storeId: STORE2_ID,
          userId: CASHIER2_ID,
          createdAt: t.createdAt,
          items: {
            create: t.items.map((i) => ({
              variantId: i.variantId,
              productName: i.productName,
              variantName: i.variantName,
              price: i.price,
              quantity: i.qty,
              subtotal: i.sub,
            })),
          },
        },
      });
    }
  }
  console.log(
    `✅ Transactions Store 2: ${s2Transactions.length} transaksi (7 hari)`,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STORE 3 — Minimarket Segar (pcs)
  // ═══════════════════════════════════════════════════════════════════════════
  const store3 = await prisma.store.upsert({
    where: { id: STORE3_ID },
    update: {},
    create: {
      id: STORE3_ID,
      name: "Minimarket Segar",
      address: "Jl. Kebon Jeruk No. 12, Jakarta Barat",
      phone: "021-5556789",
    },
  });
  console.log(`✅ Store 3: ${store3.name}`);

  const [owner3, cashier3] = await Promise.all([
    prisma.user.upsert({
      where: { email: "owner@minimarket.com" },
      update: {},
      create: {
        id: OWNER3_ID,
        email: "owner@minimarket.com",
        password: await bcrypt.hash("owner123", 10),
        name: "Hendra Gunawan",
        role: "OWNER",
        storeId: STORE3_ID,
      },
    }),
    prisma.user.upsert({
      where: { email: "cashier@minimarket.com" },
      update: {},
      create: {
        id: CASHIER3_ID,
        email: "cashier@minimarket.com",
        password: await bcrypt.hash("cashier123", 10),
        name: "Mega Lestari",
        role: "CASHIER",
        storeId: STORE3_ID,
      },
    }),
  ]);
  console.log(`✅ Users Store 3: ${owner3.email}, ${cashier3.email}`);

  await prisma.product.upsert({
    where: { id: PROD_AIR_ID },
    update: {},
    create: {
      id: PROD_AIR_ID,
      name: "Air Mineral",
      storeId: STORE3_ID,
      variants: {
        create: [
          { id: VAR_AIR_1PCS, name: "1 pcs", price: 3000, stock: 200 },
          { id: VAR_AIR_6PCS, name: "6 pcs", price: 16000, stock: 80 },
          { id: VAR_AIR_12PCS, name: "12 pcs", price: 30000, stock: 4 },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { id: PROD_SNACK_ID },
    update: {},
    create: {
      id: PROD_SNACK_ID,
      name: "Snack Keripik",
      storeId: STORE3_ID,
      variants: {
        create: [
          { id: VAR_SNACK_1PCS, name: "1 pcs", price: 5000, stock: 150 },
          { id: VAR_SNACK_5PCS, name: "5 pcs", price: 22000, stock: 3 },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { id: PROD_INSTAN_ID },
    update: {},
    create: {
      id: PROD_INSTAN_ID,
      name: "Mie Instan",
      storeId: STORE3_ID,
      variants: {
        create: [
          { id: VAR_INSTAN_1PCS, name: "1 pcs", price: 4000, stock: 300 },
          { id: VAR_INSTAN_5PCS, name: "5 pcs", price: 18000, stock: 70 },
        ],
      },
    },
  });
  console.log("✅ Products Store 3: Air Mineral, Snack Keripik, Mie Instan");

  const s3Transactions = [
    {
      invoiceNo: "INV-S3-2026-001",
      createdAt: d(6, 8),
      total: 43000,
      discount: 0,
      grandTotal: 43000,
      payment: 50000,
      change: 7000,
      items: [
        {
          variantId: VAR_AIR_6PCS,
          productName: "Air Mineral",
          variantName: "6 pcs",
          price: 16000,
          qty: 1,
          sub: 16000,
        },
        {
          variantId: VAR_SNACK_1PCS,
          productName: "Snack Keripik",
          variantName: "1 pcs",
          price: 5000,
          qty: 3,
          sub: 15000,
        },
        {
          variantId: VAR_INSTAN_5PCS,
          productName: "Mie Instan",
          variantName: "5 pcs",
          price: 18000,
          qty: 1,
          sub: 18000,
        },
      ],
    },
    {
      invoiceNo: "INV-S3-2026-002",
      createdAt: d(6, 17),
      total: 52000,
      discount: 2000,
      grandTotal: 50000,
      payment: 50000,
      change: 0,
      items: [
        {
          variantId: VAR_INSTAN_5PCS,
          productName: "Mie Instan",
          variantName: "5 pcs",
          price: 18000,
          qty: 2,
          sub: 36000,
        },
        {
          variantId: VAR_AIR_1PCS,
          productName: "Air Mineral",
          variantName: "1 pcs",
          price: 3000,
          qty: 4,
          sub: 12000,
        },
      ],
    },
    {
      invoiceNo: "INV-S3-2026-003",
      createdAt: d(5, 9),
      total: 63000,
      discount: 3000,
      grandTotal: 60000,
      payment: 60000,
      change: 0,
      items: [
        {
          variantId: VAR_AIR_12PCS,
          productName: "Air Mineral",
          variantName: "12 pcs",
          price: 30000,
          qty: 1,
          sub: 30000,
        },
        {
          variantId: VAR_SNACK_5PCS,
          productName: "Snack Keripik",
          variantName: "5 pcs",
          price: 22000,
          qty: 1,
          sub: 22000,
        },
        {
          variantId: VAR_INSTAN_1PCS,
          productName: "Mie Instan",
          variantName: "1 pcs",
          price: 4000,
          qty: 3,
          sub: 12000,
        },
      ],
    },
    {
      invoiceNo: "INV-S3-2026-004",
      createdAt: d(5, 14),
      total: 36000,
      discount: 0,
      grandTotal: 36000,
      payment: 40000,
      change: 4000,
      items: [
        {
          variantId: VAR_INSTAN_5PCS,
          productName: "Mie Instan",
          variantName: "5 pcs",
          price: 18000,
          qty: 2,
          sub: 36000,
        },
      ],
    },
    {
      invoiceNo: "INV-S3-2026-005",
      createdAt: d(4, 8),
      total: 74000,
      discount: 4000,
      grandTotal: 70000,
      payment: 70000,
      change: 0,
      items: [
        {
          variantId: VAR_AIR_6PCS,
          productName: "Air Mineral",
          variantName: "6 pcs",
          price: 16000,
          qty: 2,
          sub: 32000,
        },
        {
          variantId: VAR_SNACK_1PCS,
          productName: "Snack Keripik",
          variantName: "1 pcs",
          price: 5000,
          qty: 4,
          sub: 20000,
        },
        {
          variantId: VAR_INSTAN_1PCS,
          productName: "Mie Instan",
          variantName: "1 pcs",
          price: 4000,
          qty: 5,
          sub: 20000,
        },
      ],
    },
    {
      invoiceNo: "INV-S3-2026-006",
      createdAt: d(4, 16),
      total: 27000,
      discount: 0,
      grandTotal: 27000,
      payment: 30000,
      change: 3000,
      items: [
        {
          variantId: VAR_AIR_1PCS,
          productName: "Air Mineral",
          variantName: "1 pcs",
          price: 3000,
          qty: 3,
          sub: 9000,
        },
        {
          variantId: VAR_SNACK_1PCS,
          productName: "Snack Keripik",
          variantName: "1 pcs",
          price: 5000,
          qty: 2,
          sub: 10000,
        },
        {
          variantId: VAR_INSTAN_1PCS,
          productName: "Mie Instan",
          variantName: "1 pcs",
          price: 4000,
          qty: 2,
          sub: 8000,
        },
      ],
    },
    {
      invoiceNo: "INV-S3-2026-007",
      createdAt: d(3, 9),
      total: 88000,
      discount: 8000,
      grandTotal: 80000,
      payment: 80000,
      change: 0,
      items: [
        {
          variantId: VAR_AIR_12PCS,
          productName: "Air Mineral",
          variantName: "12 pcs",
          price: 30000,
          qty: 2,
          sub: 60000,
        },
        {
          variantId: VAR_SNACK_5PCS,
          productName: "Snack Keripik",
          variantName: "5 pcs",
          price: 22000,
          qty: 1,
          sub: 22000,
        },
      ],
    },
    {
      invoiceNo: "INV-S3-2026-008",
      createdAt: d(3, 18),
      total: 46000,
      discount: 6000,
      grandTotal: 40000,
      payment: 40000,
      change: 0,
      items: [
        {
          variantId: VAR_INSTAN_5PCS,
          productName: "Mie Instan",
          variantName: "5 pcs",
          price: 18000,
          qty: 2,
          sub: 36000,
        },
        {
          variantId: VAR_AIR_1PCS,
          productName: "Air Mineral",
          variantName: "1 pcs",
          price: 3000,
          qty: 3,
          sub: 9000,
        },
      ],
    },
    {
      invoiceNo: "INV-S3-2026-009",
      createdAt: d(2, 8),
      total: 58000,
      discount: 8000,
      grandTotal: 50000,
      payment: 50000,
      change: 0,
      items: [
        {
          variantId: VAR_AIR_6PCS,
          productName: "Air Mineral",
          variantName: "6 pcs",
          price: 16000,
          qty: 2,
          sub: 32000,
        },
        {
          variantId: VAR_SNACK_1PCS,
          productName: "Snack Keripik",
          variantName: "1 pcs",
          price: 5000,
          qty: 4,
          sub: 20000,
        },
      ],
    },
    {
      invoiceNo: "INV-S3-2026-010",
      createdAt: d(2, 12),
      total: 40000,
      discount: 0,
      grandTotal: 40000,
      payment: 40000,
      change: 0,
      items: [
        {
          variantId: VAR_INSTAN_5PCS,
          productName: "Mie Instan",
          variantName: "5 pcs",
          price: 18000,
          qty: 2,
          sub: 36000,
        },
        {
          variantId: VAR_SNACK_1PCS,
          productName: "Snack Keripik",
          variantName: "1 pcs",
          price: 5000,
          qty: 1,
          sub: 5000,
        },
      ],
    },
    {
      invoiceNo: "INV-S3-2026-011",
      createdAt: d(1, 7),
      total: 91000,
      discount: 1000,
      grandTotal: 90000,
      payment: 90000,
      change: 0,
      items: [
        {
          variantId: VAR_AIR_12PCS,
          productName: "Air Mineral",
          variantName: "12 pcs",
          price: 30000,
          qty: 2,
          sub: 60000,
        },
        {
          variantId: VAR_INSTAN_5PCS,
          productName: "Mie Instan",
          variantName: "5 pcs",
          price: 18000,
          qty: 1,
          sub: 18000,
        },
        {
          variantId: VAR_SNACK_1PCS,
          productName: "Snack Keripik",
          variantName: "1 pcs",
          price: 5000,
          qty: 3,
          sub: 15000,
        },
      ],
    },
    {
      invoiceNo: "INV-S3-2026-012",
      createdAt: d(1, 15),
      total: 52000,
      discount: 2000,
      grandTotal: 50000,
      payment: 50000,
      change: 0,
      items: [
        {
          variantId: VAR_SNACK_5PCS,
          productName: "Snack Keripik",
          variantName: "5 pcs",
          price: 22000,
          qty: 1,
          sub: 22000,
        },
        {
          variantId: VAR_INSTAN_5PCS,
          productName: "Mie Instan",
          variantName: "5 pcs",
          price: 18000,
          qty: 1,
          sub: 18000,
        },
        {
          variantId: VAR_AIR_6PCS,
          productName: "Air Mineral",
          variantName: "6 pcs",
          price: 16000,
          qty: 1,
          sub: 16000,
        },
      ],
    },
    {
      invoiceNo: "INV-S3-2026-013",
      createdAt: d(0, 8),
      total: 65000,
      discount: 5000,
      grandTotal: 60000,
      payment: 60000,
      change: 0,
      items: [
        {
          variantId: VAR_AIR_6PCS,
          productName: "Air Mineral",
          variantName: "6 pcs",
          price: 16000,
          qty: 2,
          sub: 32000,
        },
        {
          variantId: VAR_INSTAN_5PCS,
          productName: "Mie Instan",
          variantName: "5 pcs",
          price: 18000,
          qty: 1,
          sub: 18000,
        },
        {
          variantId: VAR_SNACK_1PCS,
          productName: "Snack Keripik",
          variantName: "1 pcs",
          price: 5000,
          qty: 3,
          sub: 15000,
        },
      ],
    },
    {
      invoiceNo: "INV-S3-2026-014",
      createdAt: d(0, 11),
      total: 42000,
      discount: 2000,
      grandTotal: 40000,
      payment: 50000,
      change: 10000,
      items: [
        {
          variantId: VAR_INSTAN_5PCS,
          productName: "Mie Instan",
          variantName: "5 pcs",
          price: 18000,
          qty: 2,
          sub: 36000,
        },
        {
          variantId: VAR_SNACK_1PCS,
          productName: "Snack Keripik",
          variantName: "1 pcs",
          price: 5000,
          qty: 1,
          sub: 5000,
        },
      ],
    },
  ];

  for (const t of s3Transactions) {
    const existing = await prisma.transaction.findUnique({
      where: { invoiceNo: t.invoiceNo },
    });
    if (!existing) {
      await prisma.transaction.create({
        data: {
          invoiceNo: t.invoiceNo,
          total: t.total,
          discount: t.discount,
          grandTotal: t.grandTotal,
          payment: t.payment,
          change: t.change,
          storeId: STORE3_ID,
          userId: CASHIER3_ID,
          createdAt: t.createdAt,
          items: {
            create: t.items.map((i) => ({
              variantId: i.variantId,
              productName: i.productName,
              variantName: i.variantName,
              price: i.price,
              quantity: i.qty,
              subtotal: i.sub,
            })),
          },
        },
      });
    }
  }
  console.log(
    `✅ Transactions Store 3: ${s3Transactions.length} transaksi (7 hari)`,
  );

  // ─── VERIFIKASI ──────────────────────────────────────────────────────────
  console.log("\n📊 Verifikasi Data:");
  console.log(`- Stores:            ${await prisma.store.count()}`);
  console.log(`- Users:             ${await prisma.user.count()}`);
  console.log(`- Products:          ${await prisma.product.count()}`);
  console.log(`- Variants:          ${await prisma.productVariant.count()}`);
  console.log(`- Transactions:      ${await prisma.transaction.count()}`);
  console.log(`- Transaction Items: ${await prisma.transactionItem.count()}`);
  console.log("\n🎉 Seeding selesai!");
  console.log("\n📋 Akun Login:");
  console.log("  [Store 1 - Toko Serba Ada]   owner@toko.com   / owner123");
  console.log("  [Store 1 - Toko Serba Ada]   cashier@toko.com / cashier123");
  console.log("  [Store 2 - Butik Moda]        owner@butik.com  / owner123");
  console.log("  [Store 2 - Butik Moda]        cashier@butik.com/ cashier123");
  console.log(
    "  [Store 3 - Minimarket Segar]  owner@minimarket.com  / owner123",
  );
  console.log(
    "  [Store 3 - Minimarket Segar]  cashier@minimarket.com/ cashier123",
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
