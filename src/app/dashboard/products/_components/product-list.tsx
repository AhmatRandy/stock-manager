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
  Tags,
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
import { deleteProduct, updateVariantStock } from "../_actions/actions";
import type { ProductWithVariants } from "../_actions/actions";
import type { CategoryOption } from "@/app/dashboard/category/_actions/actions";

type Props = {
  products: ProductWithVariants[];
  categories: CategoryOption[];
  onEdit: (product: ProductWithVariants) => void;
};

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatQty(n: number): string {
  return parseFloat(n.toFixed(2)).toString();
}

export function ProductList({ products, categories, onEdit }: Props) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] =
    useState<ProductWithVariants | null>(null);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      filterCategory === "all"
        ? true
        : filterCategory === "none"
          ? !p.categoryId
          : p.categoryId === filterCategory;
    return matchSearch && matchCategory;
  });

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
      {/* Search + Filter */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="pl-9"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex h-9 items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 min-w-40"
          >
            <option value="all">Semua Kategori</option>
            <option value="none">Tanpa Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead className="text-center">Stok</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
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

                      {idx === 0 && (
                        <TableCell
                          rowSpan={product.variants.length}
                          className="align-top"
                        >
                          {product.category ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                              <Tags className="h-3 w-3" />
                              {product.category.name}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                      )}

                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {variant.name}
                        </span>
                        <span className="ml-1.5 text-xs text-muted-foreground/60">
                          {(variant as any).quantityType === "continuous"
                            ? `(kontinu, step ${(variant as any).step})`
                            : "(diskrit)"}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        {formatRupiah(variant.price)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const delta =
                                (variant as any).quantityType === "continuous"
                                  ? ((variant as any).step ?? 1)
                                  : 1;
                              handleStockChange(
                                variant.id,
                                variant.stock,
                                -delta,
                              );
                            }}
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
                            {formatQty(variant.stock)}
                            <span className="text-xs text-muted-foreground ml-0.5">
                              {variant.unit}
                            </span>
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const delta =
                                (variant as any).quantityType === "continuous"
                                  ? ((variant as any).step ?? 1)
                                  : 1;
                              handleStockChange(
                                variant.id,
                                variant.stock,
                                delta,
                              );
                            }}
                            disabled={isPending}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>

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

      <div className="mt-4 text-sm text-muted-foreground">
        Total: {filteredProducts.length} produk,{" "}
        {filteredProducts.reduce((sum, p) => sum + p.variants.length, 0)} varian
      </div>

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
