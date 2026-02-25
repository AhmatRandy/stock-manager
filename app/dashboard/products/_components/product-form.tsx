"use client";

import { useEffect, useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct, updateProduct } from "../actions";
import type { ProductWithVariants, ActionResult } from "../actions";

type Variant = {
  id?: string;
  name: string;
  price: number;
  stock: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductWithVariants;
  onSuccess?: () => void;
};

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: Props) {
  const isEdit = !!product;

  const [variants, setVariants] = useState<Variant[]>([
    { name: "Default", price: 0, stock: 0 },
  ]);

  const initialState: ActionResult | null = null;
  const [state, formAction, isPending] = useActionState(
    isEdit
      ? (prevState: ActionResult | null, formData: FormData) =>
          updateProduct(prevState, product!.id, formData)
      : createProduct,
    initialState,
  );

  // ── Effects ──────────────────────────────────────────────────────────────

  // Reset form ketika dialog dibuka
  useEffect(() => {
    if (open) {
      setVariants(
        product?.variants.length
          ? product.variants
          : [{ name: "Default", price: 0, stock: 0 }],
      );
    }
  }, [open, product]);

  // Tambahkan ini di bagian Effects
  // useEffect(() => {
  //   if (state?.success) {
  //     // 1. Panggil callback sukses (biasanya untuk refresh data di parent atau munculin toast)
  //     if (onSuccess) {
  //       onSuccess();
  //     }

  //     // 2. Beri sedikit delay agar user bisa baca pesan sukses, lalu tutup dialog
  //     const timer = setTimeout(() => {
  //       handleOpenChange(false);
  //     }, 1500); // 1.5 detik

  //     return () => clearTimeout(timer);
  //   }
  // }, [state?.success]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isPending) {
      setVariants([{ name: "Default", price: 0, stock: 0 }]);
    }
    onOpenChange(newOpen);
  };

  const addVariant = () => {
    setVariants([...variants, { name: "", price: 0, stock: 0 }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Produk" : "Tambah Produk Baru"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk</Label>
            <Input
              id="name"
              name="name"
              defaultValue={product?.name ?? ""}
              placeholder="contoh: Kopi, Nasi Goreng, Baju Kaos"
              disabled={isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              Nama produk utama (bisa punya banyak varian)
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Varian Produk</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
                disabled={isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah Varian
              </Button>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      disabled={isPending}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {variant.id && (
                    <input
                      type="hidden"
                      name={`variants[${index}].id`}
                      value={variant.id}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nama Varian</Label>
                      <Input
                        name={`variants[${index}].name`}
                        defaultValue={variant.name}
                        placeholder="contoh: Small, 500ml"
                        disabled={isPending}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Harga (Rp)</Label>
                      <Input
                        type="number"
                        name={`variants[${index}].price`}
                        defaultValue={variant.price}
                        placeholder="0"
                        disabled={isPending}
                        required
                        min="0"
                      />
                    </div>

                    {/* Stock */}
                    <div className="space-y-1">
                      <Label className="text-xs">Stok</Label>
                      <Input
                        type="number"
                        name={`variants[${index}].stock`}
                        defaultValue={variant.stock}
                        className="text-center"
                        disabled={isPending}
                        required
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Varian adalah ukuran atau jenis yang berbeda dari produk yang
              sama. Misal: Kopi (Small, Medium, Large) atau Baju (S, M, L, XL)
            </p>
          </div>

          {/* Error from server action */}
          {state && !state.success && state.message && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {state.message}
            </div>
          )}

          {/* Success message */}
          {state?.success && state.message && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md">
              {state.message}
            </div>
          )}

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : isEdit ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
