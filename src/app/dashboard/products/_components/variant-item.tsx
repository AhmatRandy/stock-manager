"use client";

import React from "react";
import { X } from "lucide-react";
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
import type { LocalVariant } from "../../../../hooks/useVariants";

interface VariantItemProps {
  variant: LocalVariant;
  index: number;
  disabled?: boolean;
  onChange: (index: number, patch: Partial<LocalVariant>) => void;
  onRemove: (index: number) => void;
}

export const VariantItem = ({
  variant,
  index,
  onChange,
  onRemove,
  disabled,
}: VariantItemProps) => {
  return (
    <div
      key={variant.tempId}
      className="border rounded-lg p-4 space-y-3 relative"
    >
      {variant && (
        <>
          {variant.id && (
            <Input
              type="hidden"
              name={`variants[${index}].id`}
              value={String(variant.id)}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nama Variant</Label>
              <Input
                name={`variants[${index}].name`}
                defaultValue={variant.name}
                placeholder="contoh: Small, 500ml"
                disabled={disabled}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Satuan</Label>
              <Input
                name={`variants[${index}].unit`}
                defaultValue={variant.unit ?? "pcs"}
                placeholder="pcs / ml / gram / kg"
                disabled={disabled}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Harga (Rp)</Label>
              <Input
                type="number"
                name={`variants[${index}].price`}
                defaultValue={String(variant.price)}
                placeholder="0"
                disabled={disabled}
                required
                min="0"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Stok</Label>
              <Input
                type="number"
                name={`variants[${index}].stock`}
                defaultValue={String(variant.stock)}
                className="text-center"
                disabled={disabled}
                required
                min="0"
                step={variant.quantityType === "continuous" ? variant.step : 1}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipe Kuantitas</Label>
              <Input
                type="hidden"
                name={`variants[${index}].quantityType`}
                value={variant.quantityType}
              />
              <Select
                value={variant.quantityType}
                onValueChange={(val) =>
                  onChange(index, { quantityType: val as "discrete" | "continuous", step: 1 })
                }
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discrete">
                    Diskrit (bilangan bulat)
                  </SelectItem>
                  <SelectItem value="continuous">Kontinu (desimal)</SelectItem>
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
                  value={String(variant.step)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) onChange(index, { step: val });
                  }}
                  placeholder="0.5"
                  disabled={disabled}
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
              <Input
                type="hidden"
                name={`variants[${index}].step`}
                value={String(1)}
              />
            )}

            <div className="space-y-1">
              <Label className="text-xs">Minimum Order</Label>
              <Input
                type="number"
                name={`variants[${index}].minOrder`}
                value={String(variant.minOrder)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0)
                    onChange(index, { minOrder: val });
                }}
                placeholder="1"
                disabled={disabled}
                required
                min={variant.quantityType === "continuous" ? variant.step : 1}
                step={variant.quantityType === "continuous" ? variant.step : 1}
              />
              <p className="text-xs text-muted-foreground">
                Jumlah terkecil yang bisa dibeli
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onRemove(index)}
            disabled={disabled}
            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
            aria-label="Hapus variant"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export default VariantItem;
