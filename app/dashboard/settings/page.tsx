import { redirect } from "next/navigation";
import { ACCESS, requirePageSession } from "@/lib/auth";
import { getStore } from "@/server/queries/store";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const session = await requirePageSession(ACCESS.settings);

  const store = await getStore(session.storeId);
  if (!store) redirect("/dashboard");

  return <SettingsForm store={store} />;
}
