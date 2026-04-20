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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct, updateProduct } from "../_actions/actions";
import type { ActionResult } from "../_actions/actions";
import { ProductWithVariants } from "@/types/product";
import { useVariants } from "../../../../hooks/useVariants";
import VariantItem from "./variant-item";
import { CategoryOption } from "@/types/category";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductWithVariants;
  categories: CategoryOption[];
  onSuccess?: () => void;
}

export const ProductFormDialog = ({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
}: ProductFormDialogProps) => {
  const isEdit = !!product;

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const initialState: ActionResult | null = null;

  const {
    variants,
    addVariant,
    removeVariant,
    updateVariant,
    initFrom,
    reset,
  } = useVariants();

  const [state, formAction, isPending] = useActionState(
    isEdit
      ? (prevState: ActionResult | null, formData: FormData) =>
          updateProduct(prevState, product!.id, formData)
      : createProduct,
    initialState,
  );

  useEffect(() => {
    if (open) {
      initFrom(product?.variants ?? null);
      setSelectedCategory(product?.categoryId ?? "__none__");
    }
  }, [open, product, initFrom]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isPending) {
      reset();
    }
    onOpenChange(newOpen);
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

          <div className="space-y-2">
            <Label htmlFor="categoryId">Kategori</Label>
            <Input
              type="hidden"
              name="categoryId"
              value={selectedCategory === "__none__" ? "" : selectedCategory}
            />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={isPending}
            >
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="— Tanpa Kategori —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Tanpa Kategori —</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Opsional. Bantu kelompokkan produk di POS dan laporan.
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
                Tambah Variant
              </Button>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <VariantItem
                  key={variant.tempId}
                  variant={variant}
                  index={index}
                  disabled={isPending}
                  onChange={(i, patch) => updateVariant(i, patch)}
                  onRemove={(i) => removeVariant(i)}
                />
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Varian adalah ukuran atau jenis yang berbeda dari produk yang
              sama. Misal: Parfum (30ml, 50ml, 100ml) atau Baju (S, M, L, XL).
              Isi <strong>Satuan</strong> sesuai produk Anda: ml, gram, kg, pcs,
              dll.
            </p>
          </div>

          {state && !state.success && state.message && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {state.message}
            </div>
          )}

          {state?.success && state.message && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md">
              {state.message}
            </div>
          )}

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
};
