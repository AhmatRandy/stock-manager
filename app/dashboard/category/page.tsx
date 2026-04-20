import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { getCategories } from "./_actions/actions";
import { CategoryClient } from "./_components/category-client";

export default async function CategoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const categories = await getCategories();
  const isOwner = session.role === "OWNER";

  return <CategoryClient categories={categories} isOwner={isOwner} />;
}
