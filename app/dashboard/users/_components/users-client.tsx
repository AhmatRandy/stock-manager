"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { UserFormDialog } from "./user-form";
import { deleteUser } from "../_actions/actions";
import type { UserRow } from "@/types/user";

const ROLE_LABEL: Record<string, { label: string; className: string }> = {
  OWNER: {
    label: "Pemilik",
    className: "bg-blue-100 text-blue-700",
  },
  MANAGER: {
    label: "Manajer",
    className: "bg-purple-100 text-purple-700",
  },
  CASHIER: {
    label: "Kasir",
    className: "bg-green-100 text-green-700",
  },
};

interface Props {
  users: UserRow[];
  currentUserId: string;
}

export function UsersClient({ users, currentUserId }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<UserRow | undefined>();
  const [isPending, startTransition] = useTransition();

  const handleEdit = (user: UserRow) => {
    setEditUser(user);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setEditUser(undefined);
    setFormOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(undefined);
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manajemen User</h1>
          <p className="text-sm text-muted-foreground">
            Atur akses karyawan atau kasir toko Anda
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah User
        </Button>
      </div>

      {/* Role info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        {Object.entries(ROLE_LABEL).map(([key, val]) => (
          <div key={key} className="border rounded-lg p-3 space-y-0.5">
            <span
              className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${val.className}`}
            >
              {val.label}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              {key === "OWNER" &&
                "Akses penuh: pengaturan, user, produk, laporan"}
              {key === "MANAGER" && "Kelola produk & stok, lihat laporan"}
              {key === "CASHIER" && "Hanya POS & transaksi"}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  Belum ada user
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const roleInfo = ROLE_LABEL[user.role];
                const isSelf = user.id === currentUserId;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Anda)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${roleInfo?.className}`}
                      >
                        {roleInfo?.label ?? user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!isSelf && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(user)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editUser}
      />

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(val) => !val && setDeleteTarget(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User?</AlertDialogTitle>
            <AlertDialogDescription>
              User <strong>{deleteTarget?.name}</strong> akan dihapus secara
              permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
