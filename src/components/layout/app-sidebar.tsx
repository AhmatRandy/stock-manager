import * as React from "react";
import { getSession } from "@/lib/auth";
import AppSidebarClient from "./app-sidebar.client";

export const AppSidebar = async () => {
  const session = await getSession();
  const role = session?.role ?? null;
  return <AppSidebarClient role={role} />;
};

export default AppSidebar;
