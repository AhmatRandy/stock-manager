import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@/prisma/client/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const store = await prisma.store.upsert({
    where: { id: "demo-store" },
    update: {},
    create: {
      id: "demo-store",
      name: "Demo Store",
      address: "Demo address",
      phone: "08123456789",
      currency: "IDR",
    },
  });

  const ownerPassword = await bcrypt.hash("password", 10);
  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: {
      name: "Owner",
      email: "owner@example.com",
      password: ownerPassword,
      role: "OWNER",
      storeId: store.id,
    },
  });

  const category = await prisma.category.upsert({
    where: { storeId_name: { storeId: store.id, name: "General" } },
    update: {},
    create: { name: "General", storeId: store.id },
  });

  const product = await prisma.product.upsert({
    where: { id: "sample-product-1" },
    update: {},
    create: {
      id: "sample-product-1",
      name: "Sample Product",
      storeId: store.id,
      categoryId: category.id,
    },
  });

  await prisma.productVariant.upsert({
    where: { id: "variant-1" },
    update: {},
    create: {
      id: "variant-1",
      productId: product.id,
      name: "Default",
      unit: "pcs",
      price: 10000,
      stock: 100,
    },
  });

  console.log("Seed finished: ", { store: store.name, owner: owner.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
