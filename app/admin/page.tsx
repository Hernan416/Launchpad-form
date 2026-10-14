import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAppConfig } from "@/lib/google/config-store";
import { AdminPanel } from "@/app/admin/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const config = await getAppConfig();

  return <AdminPanel initialConfig={config} />;
}
