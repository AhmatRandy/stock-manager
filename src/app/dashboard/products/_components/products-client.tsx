"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductList } from "./product-list";
import { ProductFormDialog } from "./product-form";
import { ProductWithVariants } from "@/types/product";
import { CategoryOption } from "@/types/category";

interface ProductsClientProps {
  initialProducts: ProductWithVariants[];
  categories: CategoryOption[];
}

export const ProductsClient = ({
  initialProducts,
  categories,
}: ProductsClientProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductWithVariants | null>(null);

  const handleAdd = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: ProductWithVariants) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produk</h1>
          <p className="text-sm text-muted-foreground">
            Kelola produk dan varian stok toko Anda
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah Produk
        </Button>
      </div>

      <ProductList
        products={initialProducts}
        categories={categories}
        onEdit={handleEdit}
      />
      <ProductFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) handleFormClose();
        }}
        product={editingProduct ?? undefined}
        categories={categories}
        onSuccess={handleFormClose}
      />
    </div>
  );
};
