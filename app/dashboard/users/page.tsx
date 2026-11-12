import { ACCESS, requirePageSession } from "@/lib/auth";
import { getUsers } from "@/server/queries/user";
import { UsersClient } from "./_components/users-client";

export default async function UsersPage() {
  const session = await requirePageSession(ACCESS.users);

  const users = await getUsers(session.storeId);

  return <UsersClient users={users} currentUserId={session.id} />;
}
