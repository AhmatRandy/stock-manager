import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getUsers } from "./_actions/actions";
import { UsersClient } from "./_components/users-client";

export default async function UsersPage() {
  const session = await requireOwner();
  if (!session) redirect("/dashboard");

  const users = await getUsers();

  return <UsersClient users={users} currentUserId={session.id} />;
}
