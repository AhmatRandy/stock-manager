import { ACCESS, hasRole, requirePageSession } from "@/lib/auth";
import { getCategories } from "@/server/queries/category";
import { CategoryClient } from "./_components/category-client";

export default async function CategoryPage() {
  const session = await requirePageSession();

  const categories = await getCategories(session.storeId);
  const isOwner = hasRole(session, ACCESS.categoryWrite);

  return <CategoryClient categories={categories} isOwner={isOwner} />;
}
