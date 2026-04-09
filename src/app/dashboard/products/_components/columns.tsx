"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Package, Tags, Plus, Minus, Edit, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import type { ProductWithVariants } from "@/types/product";

function formatQty(n: number): string {
  return parseFloat(n.toFixed(2)).toString();
}

type Callbacks = {
  onEdit: (product: ProductWithVariants) => void;
  onDelete: (product: ProductWithVariants) => void;
  onStockChange: (
    variantId: string,
    currentStock: number,
    delta: number,
  ) => void;
  isPending: boolean;
};

export function useProductColumns({
  onEdit,
  onDelete,
  onStockChange,
  isPending,
}: Callbacks): ColumnDef<ProductWithVariants>[] {
  return useMemo<ColumnDef<ProductWithVariants>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Produk" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
            {row.getValue<string>("name")}
          </div>
        ),
      },
      {
        id: "category",
        accessorFn: (row) => row.category?.name ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Kategori" />
        ),
        cell: ({ row }) =>
          row.original.category ? (
            <span className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              <Tags className="h-3 w-3" />
              {row.original.category.name}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: "variants",
        header: "Varian & Stok",
        enableSorting: false,
        cell: ({ row }) => {
          const { variants } = row.original;
          return (
            <div className="space-y-2">
              {variants.map((variant) => {
                const delta =
                  variant.quantityType === "continuous" ? variant.step : 1;
                return (
                  <div key={variant.id} className="flex items-center gap-3">
                    <div className="min-w-32.5">
                      <span className="text-sm text-muted-foreground">
                        {variant.name}
                      </span>
                      {variant.quantityType === "continuous" && (
                        <span className="ml-1.5 text-xs text-muted-foreground/60">
                          (step {variant.step})
                        </span>
                      )}
                    </div>
                    <div className="min-w-22.5 text-sm text-right font-medium">
                      {formatRupiah(variant.price)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onStockChange(variant.id, variant.stock, -delta)
                        }
                        disabled={isPending || variant.stock === 0}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span
                        className={`min-w-12 text-center text-sm font-medium ${
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
                        onClick={() =>
                          onStockChange(variant.id, variant.stock, delta)
                        }
                        disabled={isPending}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row.original)}
              disabled={isPending}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(row.original)}
              disabled={isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPending],
  );
}
