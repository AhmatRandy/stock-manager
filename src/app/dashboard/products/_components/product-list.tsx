"use client";

import { useState, useTransition } from "react";
import { Package } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { deleteProduct, updateVariantStock } from "../_actions/actions";
import { useProductColumns } from "./columns";
import type { ProductWithVariants } from "@/types/product";
import { CategoryOption } from "@/types/category";

type Props = {
  products: ProductWithVariants[];
  categories: CategoryOption[];
  onEdit: (product: ProductWithVariants) => void;
};

export const ProductList = ({ products, categories, onEdit }: Props) => {
  const [filterCategory, setFilterCategory] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] =
    useState<ProductWithVariants | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (!productToDelete) return;
    startTransition(async () => {
      const result = await deleteProduct(productToDelete.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      } else {
        setError(result.message ?? "Gagal menghapus produk");
      }
    });
  };

  const confirmDelete = (product: ProductWithVariants) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
    setError(null);
  };

  const handleStockChange = (
    variantId: string,
    currentStock: number,
    delta: number,
  ) => {
    const newStock = Math.max(
      0,
      Math.round((currentStock + delta) * 100) / 100,
    );
    startTransition(async () => {
      await updateVariantStock(variantId, newStock);
    });
  };

  const columns = useProductColumns({
    onEdit,
    onDelete: confirmDelete,
    onStockChange: handleStockChange,
    isPending,
  });

  const filteredProducts = products.filter((p) => {
    if (filterCategory === "all") return true;
    if (filterCategory === "none") return !p.categoryId;
    return p.categoryId === filterCategory;
  });

  if (products.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Belum Ada Produk</h3>
        <p className="text-muted-foreground mb-4">
          Mulai tambah produk pertama Anda untuk dijual di POS
        </p>
      </Card>
    );
  }

  return (
    <>
      {categories.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Kategori:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex h-8 items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="all">Semua</option>
            <option value="none">Tanpa Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredProducts}
        searchKey="name"
        searchPlaceholder="Cari produk..."
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus produk{" "}
              <strong>{productToDelete?.name}</strong>? Semua varian produk ini
              akan ikut terhapus. Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
