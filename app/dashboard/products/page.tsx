import { Suspense } from "react";
import { ACCESS, requirePageSession } from "@/lib/auth";
import { getProducts } from "@/server/queries/product";
import { getCategoryOptions } from "@/server/queries/category";
import { ProductsClient } from "@/app/dashboard/products/_components/products-client";

export default async function ProductsPage() {
  const session = await requirePageSession(ACCESS.products);

  const [products, categories] = await Promise.all([
    getProducts(session.storeId),
    getCategoryOptions(session.storeId),
  ]);

  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-muted-foreground">
          Loading...
        </div>
      }
    >
      <ProductsClient initialProducts={products} categories={categories} />
    </Suspense>
  );
}
