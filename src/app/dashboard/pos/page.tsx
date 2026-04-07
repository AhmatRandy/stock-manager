import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPosProducts } from "./_actions/actions";
import { PosClient } from "./_components/pos-client";

export default async function PosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const products = await getPosProducts(session.storeId);

  return <PosClient products={products} cashierName={session.name} />;
}
