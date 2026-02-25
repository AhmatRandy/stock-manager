"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductList } from "./product-list";
import { ProductFormDialog } from "./product-form";
import type { ProductWithVariants } from "../actions";

interface ProductsClientProps {
  initialProducts: ProductWithVariants[];
}

export function ProductsClient({ initialProducts }: ProductsClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductWithVariants | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

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

      {/* Product List — data fresh dari server via revalidatePath */}
      <ProductList products={initialProducts} onEdit={handleEdit} />

      {/* Form Dialog */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) handleFormClose();
        }}
        product={editingProduct ?? undefined}
        onSuccess={handleFormClose}
      />
    </div>
  );
}
