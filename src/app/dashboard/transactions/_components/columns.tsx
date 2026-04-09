"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import { formatRupiah } from "@/lib/format";
import type { TransactionRow } from "../_actions/actions";

export const columns: ColumnDef<TransactionRow>[] = [
  {
    accessorKey: "invoiceNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="No. Invoice" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/dashboard/transactions/${row.original.id}`}
        className="font-mono font-medium text-sm hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.getValue("invoiceNo")}
      </Link>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Waktu" />
    ),
    cell: ({ row }) =>
      new Date(row.getValue("createdAt")).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
  },
  {
    id: "kasir",
    accessorFn: (row) => row.user.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kasir" />
    ),
    cell: ({ getValue }) => getValue<string>(),
  },
  {
    id: "jumlahItem",
    accessorFn: (row) => row._count.items,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Item" />
    ),
    cell: ({ getValue }) => (
      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
        {getValue<number>()} item
      </span>
    ),
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Subtotal"
        className="justify-end"
      />
    ),
    cell: ({ row }) => (
      <div className="text-right text-sm">
        {formatRupiah(row.getValue("total"))}
      </div>
    ),
  },
  {
    accessorKey: "discount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Diskon"
        className="justify-end"
      />
    ),
    cell: ({ row }) => {
      const discount = row.getValue<number>("discount");
      return (
        <div className="text-right text-sm text-muted-foreground">
          {discount > 0 ? `-${formatRupiah(discount)}` : "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "grandTotal",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Grand Total"
        className="justify-end"
      />
    ),
    cell: ({ row }) => (
      <div className="text-right font-semibold">
        {formatRupiah(row.getValue("grandTotal"))}
      </div>
    ),
  },
];
