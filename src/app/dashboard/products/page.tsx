import { Suspense } from "react";
import { getProducts } from "./_actions/actions";
import { getCategoryOptions } from "@/app/dashboard/category/_actions/actions";
import { ProductsClient } from "@/app/dashboard/products/_components/products-client";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategoryOptions(),
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
