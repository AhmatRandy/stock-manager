import { Suspense } from "react";
import { getProducts } from "./actions";
import { ProductsClient } from "@/app/dashboard/products/_components/products-client";

export default async function ProductsPage() {
  // Fetch data di server
  const products = await getProducts();

  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-muted-foreground">
          Loading...
        </div>
      }
    >
      <ProductsClient initialProducts={products} />
    </Suspense>
  );
}
