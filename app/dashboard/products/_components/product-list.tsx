"use client";

import { Fragment, useState, useTransition } from "react";
import {
  Package,
  Edit,
  Trash2,
  Plus,
  Minus,
  Search,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { deleteProduct, updateVariantStock } from "../actions";
import type { ProductWithVariants } from "../actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  products: ProductWithVariants[];
  onEdit: (product: ProductWithVariants) => void;
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductList({ products, onEdit }: Props) {
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] =
    useState<ProductWithVariants | null>(null);

  // useTransition (React 19)
  // Cocok untuk: UI updates, filtering, search, state changes
  // Membuat UI tetap responsive saat update yang berat
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ── Filter products ──────────────────────────────────────────────────────

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Delete handler ───────────────────────────────────────────────────────

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

  // ── Stock update handler ─────────────────────────────────────────────────

  const handleStockChange = (
    variantId: string,
    currentStock: number,
    delta: number,
  ) => {
    const newStock = Math.max(0, currentStock + delta);
    startTransition(async () => {
      await updateVariantStock(variantId, newStock);
    });
  };

  // ── Empty state ──────────────────────────────────────────────────────────

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
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Varian</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead className="text-center">Stok</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Tidak ada produk ditemukan
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <Fragment key={product.id}>
                  {product.variants.map((variant, idx) => (
                    <TableRow key={variant.id}>
                      {/* Product Name (only show on first variant) */}
                      {idx === 0 && (
                        <TableCell
                          rowSpan={product.variants.length}
                          className="font-medium align-top"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            {product.name}
                          </div>
                        </TableCell>
                      )}

                      {/* Variant Name */}
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {variant.name}
                        </span>
                      </TableCell>

                      {/* Price */}
                      <TableCell className="text-right">
                        {formatRupiah(variant.price)}
                      </TableCell>

                      {/* Stock with quick update */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStockChange(variant.id, variant.stock, -1)
                            }
                            disabled={isPending || variant.stock === 0}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span
                            className={`min-w-12 text-center font-medium ${
                              variant.stock === 0
                                ? "text-destructive"
                                : variant.stock < 10
                                  ? "text-orange-500"
                                  : ""
                            }`}
                          >
                            {variant.stock}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStockChange(variant.id, variant.stock, 1)
                            }
                            disabled={isPending}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Actions (only show on first variant) */}
                      {idx === 0 && (
                        <TableCell
                          rowSpan={product.variants.length}
                          className="text-right align-top"
                        >
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(product)}
                              disabled={isPending}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(product)}
                              disabled={isPending}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-muted-foreground">
        Total: {filteredProducts.length} produk,{" "}
        {filteredProducts.reduce((sum, p) => sum + p.variants.length, 0)} varian
      </div>

      {/* Delete Confirmation Dialog */}
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
}
