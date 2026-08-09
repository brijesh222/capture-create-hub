import { createContext, useContext } from "react";
import { makeAccess, type MyAccess } from "@/lib/admin-perms";

const AdminAccessContext = createContext<MyAccess>(makeAccess(null, []));

export const AdminAccessProvider = AdminAccessContext.Provider;

/** The signed-in admin's role + capabilities, provided by AdminLayout. */
export function useMyAccess(): MyAccess {
  return useContext(AdminAccessContext);
}
