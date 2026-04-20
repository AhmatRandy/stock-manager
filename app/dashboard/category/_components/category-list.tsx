"use client";

import { useState, useTransition } from "react";
import { Edit, Trash2, AlertCircle, Tags } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { deleteCategory } from "../_actions/actions";
import type { CategoryWithCount } from "@/types/category";
import { CategoryFormDialog } from "./category-form";

type Props = {
  categories: CategoryWithCount[];
  isOwner: boolean;
};

export function CategoryList({ categories, isOwner }: Props) {
  const [editTarget, setEditTarget] = useState<CategoryWithCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteCategory(deleteTarget.id);
      if (result.success) {
        setDeleteTarget(null);
      } else {
        setDeleteError(result.message ?? "Gagal menghapus kategori");
      }
    });
  };

  if (categories.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Tags className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Belum Ada Kategori</h3>
        <p className="text-muted-foreground">
          Kategori membantu Anda mengelompokkan produk di POS dan laporan.
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kategori</TableHead>
              <TableHead className="text-center">Jumlah Produk</TableHead>
              <TableHead>Dibuat</TableHead>
              {isOwner && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Tags className="h-4 w-4 text-muted-foreground" />
                    {cat.name}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {cat._count.products} produk
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(cat.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                {isOwner && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditTarget(cat)}
                        disabled={isPending}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(cat);
                        }}
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
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Total: {categories.length} kategori,{" "}
        {categories.reduce((sum, c) => sum + c._count.products, 0)} produk
        terkategori
      </div>

      {/* Edit Dialog */}
      {editTarget && (
        <CategoryFormDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          category={editTarget}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus kategori{" "}
              <strong>{deleteTarget?.name}</strong>?{" "}
              {(deleteTarget?._count.products ?? 0) > 0 && (
                <>
                  <br />
                  <span className="text-amber-600 font-medium">
                    ⚠ {deleteTarget?._count.products} produk akan dipindahkan ke
                    "Tanpa Kategori".
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {deleteError}
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
