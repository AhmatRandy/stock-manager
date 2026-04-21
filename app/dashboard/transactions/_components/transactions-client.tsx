"use client";

import { DateRangeFilter } from "@/components/ui/datepicker-with-range";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

import { TransactionsList } from "./transactions-list";
import { TransactionRow } from "@/types/transaction";

interface Props {
  transactions: TransactionRow[];
  defaultFrom?: string;
  defaultTo?: string;
  page?: number;
  take?: number;
  hasNext?: boolean;
}

export function TransactionsClient({
  transactions,
  defaultFrom,
  defaultTo,
  page = 1,
  take = 50,
  hasNext = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    params.set("take", String(take));
    router.push(`/dashboard/transactions?${params.toString()}`);
  };

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

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">Halaman {page}</div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Sebelumnya
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={!hasNext}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
