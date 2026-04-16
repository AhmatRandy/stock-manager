"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryList } from "./category-list";
import { CategoryFormDialog } from "./category-form";
import { CategoryWithCount } from "@/types/category";

type Props = {
  categories: CategoryWithCount[];
  isOwner: boolean;
};

export function CategoryClient({ categories, isOwner }: Props) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kategori</h1>
          <p className="text-sm text-muted-foreground">
            Kelompokkan produk Anda agar mudah dicari di POS dan laporan
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah Kategori
          </Button>
        )}
      </div>

      {!isOwner && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          Hanya OWNER yang dapat menambah, mengubah, atau menghapus kategori.
        </div>
      )}

      <CategoryList categories={categories} isOwner={isOwner} />

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
