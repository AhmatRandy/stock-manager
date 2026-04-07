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
import type { CategoryOption } from "@/app/dashboard/category/_actions/actions";
import { ProductWithVariants, Variant } from "@/types";

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

  const [variants, setVariants] = useState<Variant[]>([
    {
      name: "Default",
      unit: "pcs",
      price: 0,
      stock: 0,
      quantityType: "discrete",
      step: 1,
      minOrder: 1,
    },
  ]);

  const [state, formAction, isPending] = useActionState(
    isEdit
      ? (prevState: ActionResult | null, formData: FormData) =>
          updateProduct(prevState, product!.id, formData)
      : createProduct,
    initialState,
  );

  useEffect(() => {
    if (open) {
      setVariants(
        product?.variants.length
          ? product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              unit: v.unit,
              price: v.price,
              stock: v.stock,
              quantityType: (v as any).quantityType ?? "discrete",
              step: (v as any).step ?? 1,
              minOrder: (v as any).minOrder ?? 1,
            }))
          : [
              {
                name: "Default",
                unit: "pcs",
                price: 0,
                stock: 0,
                quantityType: "discrete",
                step: 1,
                minOrder: 1,
              },
            ],
      );
      setSelectedCategory(product?.categoryId ?? "__none__");
    }
  }, [open, product]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isPending) {
      setVariants([
        {
          name: "",
          unit: "pcs",
          price: 0,
          stock: 0,
          quantityType: "discrete",
          step: 1,
          minOrder: 1,
        },
      ]);
    }
    onOpenChange(newOpen);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        name: "",
        unit: "pcs",
        price: 0,
        stock: 0,
        quantityType: "discrete",
        step: 1,
        minOrder: 1,
      },
    ]);
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

          {/* Kategori */}
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

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nama Variant</Label>
                      <Input
                        name={`variants[${index}].name`}
                        defaultValue={variant.name}
                        placeholder="contoh: Small, 500ml"
                        disabled={isPending}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Satuan</Label>
                      <Input
                        name={`variants[${index}].unit`}
                        defaultValue={variant.unit ?? "pcs"}
                        placeholder="pcs / ml / gram / kg"
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
                        step={
                          variant.quantityType === "continuous"
                            ? variant.step
                            : 1
                        }
                      />
                    </div>
                  </div>

                  {/* Quantity type row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Tipe kuantitas */}
                    <div className="space-y-1">
                      <Label className="text-xs">Tipe Kuantitas</Label>
                      <input
                        type="hidden"
                        name={`variants[${index}].quantityType`}
                        value={variant.quantityType}
                      />
                      <Select
                        value={variant.quantityType}
                        onValueChange={(val) =>
                          setVariants((prev) =>
                            prev.map((v, i) =>
                              i === index
                                ? {
                                    ...v,
                                    quantityType: val as
                                      | "discrete"
                                      | "continuous",
                                    step: 1,
                                  }
                                : v,
                            ),
                          )
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discrete">
                            Diskrit (bilangan bulat)
                          </SelectItem>
                          <SelectItem value="continuous">
                            Kontinu (desimal)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {variant.quantityType === "discrete"
                          ? "Hanya bilangan bulat, contoh: pcs, box"
                          : "Mendukung desimal, contoh: kg, liter, ml"}
                      </p>
                    </div>

                    {variant.quantityType === "continuous" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Step Pembelian</Label>
                        <Input
                          type="number"
                          name={`variants[${index}].step`}
                          value={variant.step}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val > 0)
                              setVariants((prev) =>
                                prev.map((v, i) =>
                                  i === index ? { ...v, step: val } : v,
                                ),
                              );
                          }}
                          placeholder="0.5"
                          disabled={isPending}
                          required
                          min="0.01"
                          step="0.01"
                        />
                        <p className="text-xs text-muted-foreground">
                          Kelipatan pembelian, contoh: 0.5 → 0.5 / 1.0 / 1.5
                        </p>
                      </div>
                    )}

                    {variant.quantityType === "discrete" && (
                      <input
                        type="hidden"
                        name={`variants[${index}].step`}
                        value={1}
                      />
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs">Minimum Order</Label>
                      <Input
                        type="number"
                        name={`variants[${index}].minOrder`}
                        value={variant.minOrder}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0)
                            setVariants((prev) =>
                              prev.map((v, i) =>
                                i === index ? { ...v, minOrder: val } : v,
                              ),
                            );
                        }}
                        placeholder="1"
                        disabled={isPending}
                        required
                        min={
                          variant.quantityType === "continuous"
                            ? variant.step
                            : 1
                        }
                        step={
                          variant.quantityType === "continuous"
                            ? variant.step
                            : 1
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Jumlah terkecil yang bisa dibeli
                      </p>
                    </div>
                  </div>
                </div>
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
