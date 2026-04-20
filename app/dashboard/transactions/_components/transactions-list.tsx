"use client";

import { ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { TransactionRow } from "@/types/transaction";

type Props = {
  transactions: TransactionRow[];
};

export function TransactionsList({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Belum Ada Transaksi</h3>
        <p className="text-muted-foreground">
          Belum ada transaksi pada periode yang dipilih.
        </p>
      </Card>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={transactions}
      searchKey="invoiceNo"
      searchPlaceholder="Cari nomor invoice..."
    />
  );
}
