import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getStore } from "./_actions/actions";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const session = await requireOwner();
  if (!session) redirect("/dashboard");

  const store = await getStore(session.storeId);
  if (!store) redirect("/dashboard");

  return <SettingsForm store={store} />;
}
