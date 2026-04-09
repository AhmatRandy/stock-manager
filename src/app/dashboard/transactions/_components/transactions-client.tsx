"use client";

import { DateRangeFilter } from "@/components/ui/datepicker-with-range";
import type { TransactionRow } from "../_actions/actions";
import { TransactionsList } from "./transactions-list";

interface Props {
  transactions: TransactionRow[];
  defaultFrom?: string;
  defaultTo?: string;
}

export function TransactionsClient({
  transactions,
  defaultFrom,
  defaultTo,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
        <p className="text-sm text-muted-foreground">
          Daftar transaksi penjualan toko Anda
        </p>
      </div>

      <DateRangeFilter
        defaultFrom={defaultFrom}
        defaultTo={defaultTo}
        basePath="/dashboard/transactions"
      />

      <TransactionsList transactions={transactions} />
    </div>
  );
}
