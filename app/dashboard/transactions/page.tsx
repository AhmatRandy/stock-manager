import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

import { getTransactions } from "./_actions/actions";
import { TransactionsClient } from "./_components/transactions-client";

interface Props {
  searchParams: Promise<{
    from?: string;
    to?: string;
    page?: string;
    take?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { from, to, page, take } = await searchParams;
  const pageNum = page ? Math.max(1, Number(page) || 1) : 1;
  const takeNum = take ? Math.max(1, Number(take) || 50) : 50;

  // request one extra to detect hasNext
  const rows = await getTransactions({ from, to, page: pageNum, take: takeNum + 1 });
  const hasNext = rows.length > takeNum;
  const transactions = hasNext ? rows.slice(0, takeNum) : rows;

  return (
    <TransactionsClient
      transactions={transactions}
      defaultFrom={from}
      defaultTo={to}
      page={pageNum}
      take={takeNum}
      hasNext={hasNext}
    />
  );
}
