import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { getTransactions } from "./_actions/actions";
import { TransactionsClient } from "./_components/transactions-client";

interface Props {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { from, to } = await searchParams;
  const transactions = await getTransactions({ from, to });

  return (
    <TransactionsClient
      transactions={transactions}
      defaultFrom={from}
      defaultTo={to}
    />
  );
}
