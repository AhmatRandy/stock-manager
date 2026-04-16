"use client";

import { useEffect, useActionState } from "react";
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
import { createCategory, updateCategory } from "../_actions/actions";
import { ActionResult, CategoryWithCount } from "@/types/category";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryWithCount;
};

export function CategoryFormDialog({ open, onOpenChange, category }: Props) {
  const isEdit = !!category;

  const [state, formAction, isPending] = useActionState(
    isEdit
      ? (_prevState: ActionResult | null, formData: FormData) =>
          updateCategory(_prevState, category!.id, formData)
      : createCategory,
    null,
  );

  // tutup dialog otomatis setelah sukses
  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Kategori" : "Tambah Kategori Baru"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Kategori</Label>
            <Input
              id="name"
              name="name"
              defaultValue={category?.name ?? ""}
              placeholder="contoh: Minuman, Makanan, Pakaian..."
              disabled={isPending}
              required
              autoFocus
            />
          </div>

          {state && !state.success && state.message && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {state.message}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
