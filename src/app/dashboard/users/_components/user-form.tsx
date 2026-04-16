"use client";

import { useEffect, useActionState, useState } from "react";
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
import { createUser, updateUser } from "../_actions/actions";
import type { ActionResult, UserRow } from "@/types/user";

const ROLES = [
  { value: "CASHIER", label: "Kasir (CASHIER)" },
  { value: "MANAGER", label: "Manajer (MANAGER)" },
  { value: "OWNER", label: "Pemilik (OWNER)" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserRow;
}

export function UserFormDialog({ open, onOpenChange, user }: Props) {
  const isEdit = !!user;
  const [role, setRole] = useState<string>(user?.role ?? "CASHIER");

  useEffect(() => {
    if (open) setRole(user?.role ?? "CASHIER");
  }, [open, user]);

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(
    isEdit
      ? (_prevState: ActionResult | null, formData: FormData) =>
          updateUser(_prevState, user!.id, formData)
      : createUser,
    null,
  );

  useEffect(() => {
    if (state?.success) onOpenChange(false);
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Tambah User Baru"}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              name="name"
              defaultValue={user?.name ?? ""}
              placeholder="contoh: Budi Santoso"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user?.email ?? ""}
              placeholder="budi@email.com"
              disabled={isPending || isEdit}
              readOnly={isEdit}
              required={!isEdit}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Email tidak dapat diubah setelah akun dibuat.
              </p>
            )}
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimal 6 karakter"
                disabled={isPending}
                required
                minLength={6}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input type="hidden" name="role" value={role} />
            <Select value={role} onValueChange={setRole} disabled={isPending}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              OWNER: akses penuh · MANAGER: kelola produk & stok · CASHIER: POS
              saja
            </p>
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
              {isPending ? "Menyimpan..." : isEdit ? "Update" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
